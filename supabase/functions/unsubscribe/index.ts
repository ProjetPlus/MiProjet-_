// Public unsubscribe endpoint.
// GET  /unsubscribe?token=...&email=...   -> renders confirmation HTML
// POST /unsubscribe { email|token, reason? } -> JSON response
// Also handles List-Unsubscribe-Post (one-click) per RFC 8058.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function resolveEmail(token?: string | null, emailParam?: string | null): Promise<string | null> {
  if (emailParam && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam)) return emailParam.toLowerCase().trim();
  if (!token) return null;
  const { data: ns } = await supabase
    .from("newsletter_subscribers").select("email").eq("unsubscribe_token", token).maybeSingle();
  if (ns?.email) return ns.email.toLowerCase();
  const { data: p } = await supabase
    .from("profiles").select("email").eq("unsubscribe_token", token).maybeSingle();
  if (p?.email) return p.email.toLowerCase();
  return null;
}

async function performUnsubscribe(email: string, reason?: string) {
  await supabase
    .from("email_unsubscribes")
    .upsert({ email, reason: reason ?? null, source: "user" }, { onConflict: "email" });
  await supabase
    .from("newsletter_subscribers")
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq("email", email);
}

function htmlPage(title: string, body: string, ok = true): string {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title} · MIPROJET</title>
<style>
  body{margin:0;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;background:#eef2f6;color:#0f172a;display:grid;place-items:center;min-height:100vh;padding:24px;}
  .card{max-width:480px;background:#fff;padding:40px 32px;border-radius:18px;box-shadow:0 8px 32px rgba(15,23,42,.08);text-align:center;}
  .badge{display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;margin-bottom:18px;background:${ok ? '#dcfce7' : '#fee2e2'};color:${ok ? '#15803d' : '#b91c1c'};}
  h1{margin:0 0 12px;font-size:24px;color:#0c2340;}
  p{color:#475569;line-height:1.7;margin:0 0 12px;}
  a.btn{display:inline-block;margin-top:20px;background:#15803d;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;}
</style></head><body><div class="card"><span class="badge">${ok ? 'Désabonnement confirmé' : 'Erreur'}</span><h1>${title}</h1>${body}<a class="btn" href="https://ivoireprojet.com">Retour au site</a></div></body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token");
    let email = url.searchParams.get("email");
    let reason: string | undefined;

    if (req.method === "POST") {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        token = token || body.token;
        email = email || body.email;
        reason = body.reason;
      } else {
        const form = await req.formData().catch(() => null);
        if (form) {
          token = token || (form.get("token") as string | null);
          email = email || (form.get("email") as string | null);
          reason = (form.get("reason") as string | null) ?? undefined;
        }
      }
    }

    const resolved = await resolveEmail(token, email);
    if (!resolved) {
      if (req.method === "GET") {
        return new Response(
          htmlPage("Lien invalide", "<p>Le lien de désabonnement est invalide ou expiré. Contactez-nous pour être retiré manuellement de nos listes.</p>", false),
          { status: 400, headers: { "content-type": "text/html; charset=utf-8" } },
        );
      }
      return new Response(JSON.stringify({ ok: false, error: "Invalid token or email" }), {
        status: 400, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    await performUnsubscribe(resolved, reason);

    if (req.method === "GET") {
      return new Response(
        htmlPage("Vous êtes désabonné", `<p><strong>${resolved}</strong> ne recevra plus aucun email marketing de MIPROJET.</p><p>Si c'est une erreur, vous pouvez vous réinscrire à tout moment depuis notre site.</p>`),
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }

    return new Response(JSON.stringify({ ok: true, email: resolved }), {
      status: 200, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});