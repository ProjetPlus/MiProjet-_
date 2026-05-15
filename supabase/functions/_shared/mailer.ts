// Multi-provider mailer: Brevo (300/day) -> Resend (100/day) automatic failover.
// Picks the provider via the DB function pick_email_provider(), then increments
// the daily counter on success. Logs every attempt to email_logs.
//
// Required secrets:
//   BREVO_API_KEY  (optional — if absent, only Resend is used)
//   RESEND_API_KEY
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (for counter + logs)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { brandedEmailShell, DEFAULT_FROM, DEFAULT_REPLY_TO, SITE_URL, unsubscribeUrlFor } from "./resend.ts";

export { brandedEmailShell, DEFAULT_FROM, DEFAULT_REPLY_TO, SITE_URL, unsubscribeUrlFor };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export interface SendInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  reply_to?: string;
  kind?: string;          // 'newsletter' | 'campaign' | 'transactional' | ...
  campaignId?: string;
  recipientUserId?: string;
  /** Skip the unsubscribe check for true transactional emails (password reset, invoice). */
  bypassUnsubscribeCheck?: boolean;
  /** Per-recipient unsubscribe URL injected as List-Unsubscribe header. */
  unsubscribeUrl?: string;
}

export interface SendResult {
  ok: boolean;
  provider?: "brevo" | "resend";
  id?: string;
  error?: string;
  status?: number;
}

async function pickProvider(): Promise<"brevo" | "resend" | null> {
  const { data, error } = await supabaseAdmin.rpc("pick_email_provider");
  if (error) {
    console.error("[mailer] pick_email_provider failed:", error.message);
    return Deno.env.get("BREVO_API_KEY") ? "brevo" : "resend";
  }
  return (data as "brevo" | "resend" | null) ?? null;
}

async function incrementCounter(provider: "brevo" | "resend") {
  const { error } = await supabaseAdmin.rpc("increment_email_provider_usage", { _provider: provider });
  if (error) console.error("[mailer] increment_email_provider_usage failed:", error.message);
}

async function logEmail(input: SendInput, result: SendResult) {
  await supabaseAdmin.from("email_logs").insert({
    recipient_email: input.to,
    recipient_user_id: input.recipientUserId ?? null,
    subject: input.subject,
    kind: input.kind ?? "transactional",
    campaign_id: input.campaignId ?? null,
    status: result.ok ? "sent" : "failed",
    provider: result.provider ?? null,
    provider_id: result.id ?? null,
    error: result.error ?? null,
  });
}

async function sendViaResend(input: SendInput): Promise<SendResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, provider: "resend", error: "RESEND_API_KEY missing" };
  try {
    const headers: Record<string, string> = {};
    if (input.unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${input.unsubscribeUrl}>, <mailto:${DEFAULT_REPLY_TO}?subject=unsubscribe>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: input.from ?? DEFAULT_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
        reply_to: input.reply_to ?? DEFAULT_REPLY_TO,
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    });
    const text = await res.text();
    let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /**/ }
    if (!res.ok) return { ok: false, provider: "resend", status: res.status, error: json?.message || text };
    return { ok: true, provider: "resend", status: res.status, id: json?.id };
  } catch (e) {
    return { ok: false, provider: "resend", error: (e as Error).message };
  }
}

async function sendViaBrevo(input: SendInput): Promise<SendResult> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) return { ok: false, provider: "brevo", error: "BREVO_API_KEY missing" };
  // Parse "Name <email>" format
  const fromRaw = input.from ?? DEFAULT_FROM;
  const m = fromRaw.match(/^(.*?)\s*<(.+?)>\s*$/);
  const sender = m
    ? { name: m[1].trim() || "MIPROJET", email: m[2].trim() }
    : { name: "MIPROJET", email: fromRaw };
  try {
    const headers: Record<string, string> = {};
    if (input.unsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${input.unsubscribeUrl}>, <mailto:${DEFAULT_REPLY_TO}?subject=unsubscribe>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey, accept: "application/json" },
      body: JSON.stringify({
        sender,
        to: [{ email: input.to }],
        subject: input.subject,
        htmlContent: input.html,
        textContent: input.text,
        replyTo: { email: input.reply_to ?? DEFAULT_REPLY_TO },
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    });
    const text = await res.text();
    let json: any = null; try { json = text ? JSON.parse(text) : null; } catch { /**/ }
    if (!res.ok) return { ok: false, provider: "brevo", status: res.status, error: json?.message || text };
    return { ok: true, provider: "brevo", status: res.status, id: json?.messageId };
  } catch (e) {
    return { ok: false, provider: "brevo", error: (e as Error).message };
  }
}

/** Smart send with auto-failover & logging. */
export async function sendMail(input: SendInput): Promise<SendResult> {
  // Honor the global unsubscribe list (unless this is truly transactional).
  if (!input.bypassUnsubscribeCheck) {
    try {
      const { data: blocked } = await supabaseAdmin
        .from("email_unsubscribes")
        .select("email").ilike("email", input.to).maybeSingle();
      if (blocked) {
        const result: SendResult = { ok: false, error: "Recipient is unsubscribed" };
        await logEmail(input, result);
        return result;
      }
    } catch (_) { /* fail open */ }
  }

  const preferred = await pickProvider();
  const order: ("brevo" | "resend")[] = preferred === "resend"
    ? ["resend", "brevo"]
    : preferred === "brevo"
      ? ["brevo", "resend"]
      : ["brevo", "resend"]; // both saturated → still try

  let lastResult: SendResult = { ok: false, error: "no provider attempted" };
  for (const p of order) {
    const has = p === "brevo" ? Deno.env.get("BREVO_API_KEY") : Deno.env.get("RESEND_API_KEY");
    if (!has) continue;
    const result = p === "brevo" ? await sendViaBrevo(input) : await sendViaResend(input);
    lastResult = result;
    if (result.ok) {
      await incrementCounter(p);
      await logEmail(input, result);
      return result;
    }
    console.warn(`[mailer] ${p} failed (${result.status}): ${result.error} — trying next`);
  }
  await logEmail(input, lastResult);
  return lastResult;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
