import { sendMail, brandedEmailShell, corsHeaders, unsubscribeUrlFor } from "../_shared/mailer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Public endpoint — no auth required.
 * Subscribes the email to newsletter_subscribers (auto-confirmed) AND
 * sends the branded welcome email via the multi-provider mailer (Brevo → Resend).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { email, source, full_name } = await req.json();
    const e = (email ?? "").toString().toLowerCase().trim();
    const fullName = (full_name ?? "").toString().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Auto-confirm subscribe (idempotent) and capture name.
    const { data: upserted } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        { email: e, source: source ?? "footer", is_active: true, unsubscribed_at: null, full_name: fullName || null },
        { onConflict: "email" },
      )
      .select("unsubscribe_token, full_name").maybeSingle();

    const unsubUrl = unsubscribeUrlFor((upserted as any)?.unsubscribe_token);
    const greetingName = (upserted as any)?.full_name || fullName;

    const inner = `
      <h1 style="color:#15803d;font-size:24px;margin:0 0 16px 0;">Bienvenue dans la communauté MIPROJET 🌍</h1>
      <p>Merci d'avoir rejoint notre newsletter. Vous recevrez en priorité :</p>
      <ul style="padding-left:20px;line-height:1.9;">
        <li>📈 Les <strong>opportunités de financement</strong> en Côte d'Ivoire et en Afrique</li>
        <li>🏗️ Les <strong>actualités</strong> de la structuration de projets</li>
        <li>🎓 Les <strong>guides et e-books</strong> exclusifs MIPROJET</li>
        <li>🤝 Les <strong>appels à projets</strong> et programmes d'incubation</li>
      </ul>
      <p style="margin-top:24px;">Pour aller plus loin, découvrez nos abonnements <strong>Premium</strong> et <strong>Elite</strong> qui débloquent les opportunités exclusives.</p>
    `;
    const html = brandedEmailShell({
      innerHtml: inner,
      preheader: "Vos opportunités africaines, directement dans votre boîte mail.",
      ctaUrl: "https://ivoireprojet.com/subscription",
      ctaLabel: "Découvrir nos abonnements",
      recipientName: greetingName,
      unsubscribeUrl: unsubUrl,
    });

    const result = await sendMail({
      to: e,
      subject: "Bienvenue dans MIPROJET 🌍",
      html,
      kind: "newsletter_welcome",
      unsubscribeUrl: unsubUrl,
    });

    if (result.ok) {
      await supabase.from("newsletter_subscribers")
        .update({ welcomed_at: new Date().toISOString() })
        .eq("email", e);
    }

    return new Response(
      JSON.stringify({ ok: result.ok, id: result.id, provider: result.provider, error: result.error }),
      { status: result.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
