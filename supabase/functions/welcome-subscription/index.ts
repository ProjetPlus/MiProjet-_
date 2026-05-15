import { sendMail, brandedEmailShell, corsHeaders } from "../_shared/mailer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sends a Premium/Elite welcome email after a successful subscription payment.
 * Body: { userId: string, planName?: string }
 * Auth: caller must be the user OR an admin OR service-role (webhook).
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { userId, planName } = await req.json();
    if (!userId) return jsonErr("userId required", 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: profile } = await supabase
      .from("profiles").select("email, first_name").eq("id", userId).maybeSingle();
    if (!profile?.email) return jsonErr("Profile email not found", 404);

    let plan = planName ?? "Premium";
    if (!planName) {
      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("subscription_plans(name)")
        .eq("user_id", userId).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      plan = (sub as any)?.subscription_plans?.name ?? "Premium";
    }

    const inner = `
      <p style="color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin:0 0 8px 0;">Abonnement activé · ${plan}</p>
      <h1 style="color:#15803d;font-size:26px;margin:0 0 16px 0;">Bienvenue dans MIPROJET ${plan} 👑</h1>
      <p>Bonjour ${profile.first_name ?? ""},</p>
      <p>Votre abonnement <strong>${plan}</strong> est maintenant <strong>actif</strong>. Vous accédez dès aujourd'hui à :</p>
      <ul style="padding-left:20px;line-height:1.9;">
        <li>🚀 Toutes les <strong>opportunités exclusives</strong> de financement et d'incubation</li>
        <li>📊 Les <strong>analyses stratégiques</strong> et fiches projets détaillées</li>
        <li>🤝 La <strong>mise en relation prioritaire</strong> avec investisseurs et partenaires</li>
        <li>📥 Les <strong>guides et e-books premium</strong> MIPROJET</li>
        <li>🔔 Les <strong>alertes en temps réel</strong> sur les nouvelles opportunités</li>
      </ul>
      <p style="margin-top:20px;">Merci de faire confiance à MIPROJET pour structurer et financer votre projet.</p>
    `;
    const html = brandedEmailShell({
      innerHtml: inner,
      preheader: `Votre abonnement ${plan} MIPROJET est activé.`,
      ctaUrl: "https://ivoireprojet.com/dashboard",
      ctaLabel: "Accéder à mon espace",
    });

    const result = await sendMail({
      to: profile.email,
      subject: `🎉 Bienvenue dans MIPROJET ${plan}`,
      html,
      kind: "subscription_welcome",
      recipientUserId: userId,
    });

    return new Response(JSON.stringify({ ok: result.ok, id: result.id, error: result.error }), {
      status: result.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return jsonErr((e as Error).message, 500);
  }
});

function jsonErr(msg: string, status: number) {
  return new Response(JSON.stringify({ ok: false, error: msg }), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}