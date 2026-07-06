// Resend webhook receiver — verifies Svix signature and updates email_logs + email_events.
// Configure in Resend dashboard: https://<project-ref>.supabase.co/functions/v1/resend-webhook
// Secret: RESEND_WEBHOOK_SECRET (whsec_…)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET is not configured");
    return new Response(JSON.stringify({ ok: false, error: "Webhook secret not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const body = await req.text();

  let event: any;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    });
  } catch (e) {
    console.error("[resend-webhook] signature verification failed:", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const type: string = event.type ?? "unknown";              // e.g. email.delivered, email.bounced, email.opened
    const data = event.data ?? {};
    const messageId: string | undefined = data.email_id ?? data.id;
    const recipient: string | undefined = Array.isArray(data.to) ? data.to[0] : data.to;

    // 1. Raw event log
    await supabase.from("email_events").insert({
      provider: "resend",
      provider_message_id: messageId ?? null,
      event_type: type,
      recipient_email: recipient ?? null,
      payload: event,
    });

    // 2. Update email_logs row when we can match by provider_id
    if (messageId) {
      const patch: Record<string, any> = { last_event: type };
      const now = new Date().toISOString();
      if (type === "email.delivered") patch.delivered_at = now;
      else if (type === "email.opened") patch.opened_at = now;
      else if (type === "email.clicked") patch.clicked_at = now;
      else if (type === "email.bounced" || type === "email.bounce") { patch.bounced_at = now; patch.status = "bounced"; }
      else if (type === "email.complained") { patch.complained_at = now; patch.status = "complained"; }
      else if (type === "email.delivery_delayed") patch.status = "delayed";

      await supabase
        .from("email_logs")
        .update(patch)
        .eq("provider", "resend")
        .eq("provider_id", messageId);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[resend-webhook] handler error:", (e as Error).message);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});