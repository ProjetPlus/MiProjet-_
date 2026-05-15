import { sendMail, brandedEmailShell, corsHeaders } from "../_shared/mailer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Triggered automatically (via DB trigger or admin button) when an opportunity
 * is published. Sends a notification email to all active Premium and Elite
 * subscribers. Body: { opportunityId: string }
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const { opportunityId } = await req.json();
    if (!opportunityId) {
      return new Response(JSON.stringify({ ok: false, error: "opportunityId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: opp, error: oppErr } = await supabase
      .from("opportunities").select("*").eq("id", opportunityId).single();
    if (oppErr || !opp) {
      return new Response(JSON.stringify({ ok: false, error: "Opportunity not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Premium + Elite active subscribers
    const { data: subs } = await supabase
      .from("user_subscriptions")
      .select("user_id, profiles:profiles!inner(email), subscription_plans!inner(name)")
      .eq("status", "active");

    const recipients = (subs ?? [])
      .filter((s: any) => ["Premium", "Elite"].includes(s.subscription_plans?.name))
      .map((s: any) => ({ email: s.profiles?.email, user_id: s.user_id }))
      .filter((r: any) => r.email);

    const baseUrl = "https://ivoireprojet.com";
    const url = opp.short_slug
      ? `${baseUrl}/o/${opp.short_slug}`
      : `${baseUrl}/opportunities/${opp.id}`;

    const moneyLine = opp.amount_min || opp.amount_max
      ? `<p><strong>💰 Financement :</strong> ${opp.amount_min ? Number(opp.amount_min).toLocaleString("fr-FR") : "—"} – ${opp.amount_max ? Number(opp.amount_max).toLocaleString("fr-FR") : "—"} ${opp.currency ?? "XOF"}</p>`
      : "";
    const deadline = opp.deadline
      ? `<p><strong>⏳ Date limite :</strong> ${new Date(opp.deadline).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>`
      : "";

    const inner = `
      <p style="color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px;font-size:12px;margin:0 0 8px 0;">Nouvelle opportunité exclusive · ${opp.opportunity_type ?? "funding"}</p>
      <h1 style="color:#15803d;font-size:24px;margin:0 0 16px 0;">${escapeHtml(opp.title)}</h1>
      ${opp.description ? `<p>${escapeHtml(opp.description)}</p>` : ""}
      ${moneyLine}
      ${deadline}
      ${opp.location ? `<p><strong>📍 Localisation :</strong> ${escapeHtml(opp.location)}</p>` : ""}
      <p style="margin-top:20px;color:#64748b;font-size:13px;">Vous recevez cet email parce que vous êtes abonné <strong>Premium</strong> ou <strong>Elite</strong> MIPROJET.</p>
    `;
    const html = brandedEmailShell({
      innerHtml: inner,
      preheader: opp.description?.slice(0, 100) ?? "Nouvelle opportunité MIPROJET",
      ctaUrl: url,
      ctaLabel: "Voir l'opportunité",
    });

    let sent = 0, failed = 0;
    for (const r of recipients) {
      const result = await sendMail({
        to: r.email!,
        subject: `🚀 Nouvelle opportunité : ${opp.title}`,
        html,
        kind: "new_opportunity",
        recipientUserId: r.user_id,
      });
      if (result.ok) sent++; else failed++;
      await new Promise((res) => setTimeout(res, 120));
    }

    return new Response(JSON.stringify({ ok: true, sent, failed, total: recipients.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}