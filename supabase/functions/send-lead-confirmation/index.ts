import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// In-memory IP rate limit (per cold start instance)
const ipHits = new Map<string, { count: number; ts: number }>();
const RATE_LIMIT = 5;        // max 5 calls
const RATE_WINDOW = 5 * 60_000; // per 5 minutes

function escapeHtml(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function rateLimitOk(ip: string) {
  const now = Date.now();
  const cur = ipHits.get(ip);
  if (!cur || now - cur.ts > RATE_WINDOW) {
    ipHits.set(ip, { count: 1, ts: now });
    return true;
  }
  cur.count += 1;
  return cur.count <= RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimitOk(ip)) {
      return new Response(JSON.stringify({ success: false, error: 'Too many requests' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload = await req.json().catch(() => ({}));
    const email = String(payload.email || "").trim().toLowerCase();
    const firstName = String(payload.firstName || "").trim().slice(0, 100);
    const documentId = payload.documentId ? String(payload.documentId) : null;

    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (!documentId) {
      return new Response(JSON.stringify({ success: false, error: 'documentId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up the document by id (server-side; never trust client URL)
    const { data: doc, error: docErr } = await supabase
      .from('platform_documents')
      .select('id, title, file_url, is_active, access_level, requires_login')
      .eq('id', documentId)
      .eq('is_active', true)
      .maybeSingle();

    if (docErr || !doc?.file_url) {
      return new Response(JSON.stringify({ success: false, error: 'Document not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Refuse to issue signed URLs for premium or login-restricted documents through this public endpoint
    if ((doc as any).access_level === 'premium' || (doc as any).requires_login === true) {
      return new Response(JSON.stringify({ success: false, error: 'Document not available via this channel' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate signed URL valid 24h if file is in our private bucket; else use raw URL
    let downloadUrl = doc.file_url as string;
    try {
      const url = new URL(downloadUrl);
      const m = url.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/) ||
                url.pathname.match(/\/storage\/v1\/object\/documents\/(.+)$/);
      if (m) {
        const path = decodeURIComponent(m[1]);
        const { data: signed } = await supabase.storage.from('documents').createSignedUrl(path, 60 * 60 * 24);
        if (signed?.signedUrl) downloadUrl = signed.signedUrl;
      }
    } catch (e) {
      console.warn('Could not sign URL, sending raw:', e);
    }

    const documentTitle = doc.title || 'Document MIPROJET';
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #f9fafb;">
        <div style="background: linear-gradient(135deg, #166534, #22863a); padding: 30px 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">MIPROJET</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 13px;">Plateforme Panafricaine de Structuration de Projets</p>
        </div>
        <div style="padding: 30px 24px; background: white;">
          <h2 style="color: #166534; margin: 0 0 16px;">Bonjour ${escapeHtml(firstName) || ''} 👋</h2>
          <p style="color: #374151; line-height: 1.6; margin: 0 0 20px;">
            Merci pour votre intérêt ! Votre document <strong>"${escapeHtml(documentTitle)}"</strong> est prêt à être téléchargé.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${escapeHtml(downloadUrl)}" style="background: #166534; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 15px;">
              📥 Télécharger le document
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin: 20px 0 0;">
            Ce lien est valable 24 heures.
          </p>
        </div>
        <div style="padding: 20px 24px; background: #f3f4f6; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">
            © ${new Date().getFullYear()} MIPROJET — Structuration • Financement • Incubation
          </p>
          <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">
            <a href="https://www.ivoireprojet.com" style="color: #166534;">www.ivoireprojet.com</a>
          </p>
        </div>
      </div>
    `;

    let emailSent = false;
    if (lovableApiKey) {
      try {
        const res = await fetch('https://ai.gateway.lovable.dev/v1/email/send', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${lovableApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            subject: `📥 Votre document : ${documentTitle}`,
            html: htmlContent,
            from: 'MIPROJET <noreply@miprojet.ci>',
          }),
        });
        emailSent = res.ok;
        if (!res.ok) console.warn('Email gateway returned', res.status);
      } catch (e) {
        console.warn('Email gateway error:', e);
      }
    }

    // Do NOT return downloadUrl to the caller — it is only delivered via email
    return new Response(JSON.stringify({ success: true, emailSent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('send-lead-confirmation error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
