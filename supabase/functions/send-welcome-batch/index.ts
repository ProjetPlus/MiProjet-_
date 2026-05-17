import { requireAdmin } from "../_shared/requireAdmin.ts";
import { sendMail, brandedEmailShell, corsHeaders, unsubscribeUrlFor } from "../_shared/mailer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sends the branded newsletter welcome email to all newsletter_subscribers
 * who never received one (welcomed_at IS NULL).
 * Body: { limit?: number, onlyActive?: boolean }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  try {
    const { limit = 500, onlyActive = true } = await req.json().catch(() => ({}));
    let q = supabase.from("newsletter_subscribers")
      .select("id,email,full_name,unsubscribe_token,is_active")
      .is("welcomed_at", null)
      .limit(Math.min(Number(limit) || 500, 1000));
    if (onlyActive) q = q.eq("is_active", true);
    const { data: subs, error } = await q;
    if (error) throw error;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0, total: 0 }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0, failed = 0;
    for (const s of subs) {
      const unsubUrl = unsubscribeUrlFor(s.unsubscribe_token);
      const inner = `
        <p>Merci d'avoir rejoint la communauté <strong>MIPROJET</strong> — la plateforme panafricaine de structuration et de financement de projets.</p>
        <p>Vous recevrez en priorité :</p>
        <ul style="padding-left:20px;line-height:1.9;">
          <li>📈 Les <strong>opportunités de financement</strong> en Côte d'Ivoire et en Afrique</li>
          <li>🏗️ Les <strong>actualités</strong> de la structuration de projets</li>
          <li>🎓 Les <strong>guides et e-books</strong> exclusifs MIPROJET</li>
          <li>🤝 Les <strong>appels à projets</strong> et programmes d'incubation</li>
        </ul>
        <p style="margin-top:18px;">Pour aller plus loin, découvrez nos abonnements <strong>Premium</strong> et <strong>Elite</strong>.</p>
      `;
      const html = brandedEmailShell({
        title: "Bienvenue dans la communauté MIPROJET 🌍",
        innerHtml: inner,
        preheader: "Vos opportunités africaines, directement dans votre boîte mail.",
        ctaUrl: "https://ivoireprojet.com/subscription",
        ctaLabel: "Découvrir nos abonnements",
        recipientName: s.full_name || undefined,
        unsubscribeUrl: unsubUrl,
      });
      const result = await sendMail({
        to: s.email,
        subject: "Bienvenue dans MIPROJET 🌍",
        html,
        kind: "newsletter_welcome",
        unsubscribeUrl: unsubUrl,
      });
      if (result.ok) {
        sent++;
        await supabase.from("newsletter_subscribers")
          .update({ welcomed_at: new Date().toISOString() })
          .eq("id", s.id);
      } else {
        failed++;
      }
      await new Promise((r) => setTimeout(r, 150));
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: subs.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
