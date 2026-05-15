import { requireAdmin } from "../_shared/requireAdmin.ts";
import { sendMail, corsHeaders } from "../_shared/mailer.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Sends an email_campaigns row to its target segment.
 * Body: { campaignId: string }  OR  { subject, html, segment, preheader }
 * Segments: 'newsletter' | 'all_users' | 'premium' | 'elite' | 'premium_elite' | 'admins'
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const body = await req.json();
    let campaign: any = null;

    if (body.campaignId) {
      const { data, error } = await supabase.from("email_campaigns").select("*").eq("id", body.campaignId).single();
      if (error || !data) return jsonErr("Campaign not found", 404);
      campaign = data;
    } else {
      const { subject, html, segment, preheader } = body;
      if (!subject || !html || !segment) return jsonErr("subject, html, segment required", 400);
      const { data, error } = await supabase.from("email_campaigns").insert({
        subject, html, segment, preheader, status: "sending", created_by: auth.userId,
      }).select().single();
      if (error) return jsonErr(error.message, 500);
      campaign = data;
    }

    // Resolve recipients
    const recipients = await resolveRecipients(supabase, campaign.segment, campaign.segment_filter);
    if (recipients.length === 0) {
      await supabase.from("email_campaigns").update({
        status: "sent", sent_at: new Date().toISOString(), recipients_count: 0,
      }).eq("id", campaign.id);
      return new Response(JSON.stringify({ ok: true, sent: 0, failed: 0, message: "No recipients" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("email_campaigns").update({
      status: "sending", recipients_count: recipients.length,
    }).eq("id", campaign.id);

    let sent = 0, failed = 0;
    // Sequential with small throttle to respect provider rate limits.
    // sendMail() handles per-message logging, counter increment, and Brevo→Resend failover.
    for (const r of recipients) {
      const result = await sendMail({
        to: r.email,
        subject: campaign.subject,
        html: campaign.html,
        kind: "campaign",
        campaignId: campaign.id,
        recipientUserId: r.user_id,
      });
      if (result.ok) sent++; else failed++;
      await new Promise((res) => setTimeout(res, 120));
    }

    await supabase.from("email_campaigns").update({
      status: "sent",
      sent_at: new Date().toISOString(),
      sent_count: sent,
      failed_count: failed,
    }).eq("id", campaign.id);

    return new Response(JSON.stringify({ ok: true, campaignId: campaign.id, sent, failed, total: recipients.length }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

async function resolveRecipients(
  supabase: any,
  segment: string,
  _filter: any,
): Promise<{ email: string; user_id?: string }[]> {
  const map = new Map<string, { email: string; user_id?: string }>();

  const add = (email?: string | null, user_id?: string | null) => {
    if (!email) return;
    const e = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return;
    if (!map.has(e)) map.set(e, { email: e, user_id: user_id ?? undefined });
  };

  if (segment === "newsletter" || segment === "all_users") {
    const { data: subs } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_active", true);
    (subs ?? []).forEach((s: any) => add(s.email));
  }

  if (segment === "all_users" || segment === "premium" || segment === "elite" || segment === "premium_elite") {
    let q = supabase
      .from("user_subscriptions")
      .select("user_id, status, subscription_plans!inner(name), profiles:profiles!inner(id,email)")
      .eq("status", "active");
    const { data: subs } = await q;
    for (const row of subs ?? []) {
      const planName = row.subscription_plans?.name;
      const email = row.profiles?.email;
      if (segment === "all_users") add(email, row.user_id);
      else if (segment === "premium" && planName === "Premium") add(email, row.user_id);
      else if (segment === "elite" && planName === "Elite") add(email, row.user_id);
      else if (segment === "premium_elite" && (planName === "Premium" || planName === "Elite")) add(email, row.user_id);
    }
  }

  if (segment === "all_users") {
    const { data: profs } = await supabase.from("profiles").select("id,email");
    (profs ?? []).forEach((p: any) => add(p.email, p.id));
  }

  if (segment === "admins") {
    const { data: roles } = await supabase
      .from("user_roles").select("user_id, profiles:profiles!inner(email)").eq("role", "admin");
    (roles ?? []).forEach((r: any) => add(r.profiles?.email, r.user_id));
  }

  return Array.from(map.values());
}