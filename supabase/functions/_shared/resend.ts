// Shared Resend helper.
// Sends transactional/marketing emails via the Resend HTTP API.
// RESEND_API_KEY must be set as a Supabase Edge Function secret.

const RESEND_URL = "https://api.resend.com/emails";

export const DEFAULT_FROM = Deno.env.get("RESEND_FROM") ?? "MIPROJET <noreply@ivoireprojet.com>";
export const DEFAULT_REPLY_TO = Deno.env.get("RESEND_REPLY_TO") ?? "contact@ivoireprojet.com";

// Public site URL (used for logo + unsubscribe links inside emails).
export const SITE_URL = Deno.env.get("SITE_URL") ?? "https://ivoireprojet.com";
export const LOGO_URL = `${SITE_URL}/logo-miprojet.png`;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  reply_to?: string;
  text?: string;
  tags?: { name: string; value: string }[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  status: number;
  error?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, status: 500, error: "RESEND_API_KEY not configured" };
  }
  const body = {
    from: input.from ?? DEFAULT_FROM,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
    reply_to: input.reply_to ?? DEFAULT_REPLY_TO,
    tags: input.tags,
  };
  try {
    const res = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { /* keep null */ }
    if (!res.ok) {
      return { ok: false, status: res.status, error: json?.message || text || `HTTP ${res.status}` };
    }
    return { ok: true, status: res.status, id: json?.id };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message };
  }
}

/**
 * Wraps inner HTML in the MIPROJET branded responsive shell.
 * Used for ALL outgoing emails so design is consistent across providers.
 * Compatible with Gmail / Outlook / Apple Mail (table-based, inline styles).
 */
export function brandedEmailShell(opts: {
  innerHtml: string;
  preheader?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  recipientName?: string;     // Used to greet the user (e.g. "KOFFI Inocent")
  unsubscribeUrl?: string;    // Mandatory for marketing — falls back to generic page
  showGreeting?: boolean;     // Default true. Pass false for previews / templates that already include a greeting.
  title?: string;             // Optional H1 rendered ABOVE the greeting (subject → title → salutation → body)
}): string {
  const {
    innerHtml,
    preheader = "",
    ctaUrl,
    ctaLabel,
    recipientName,
    unsubscribeUrl = `${SITE_URL}/unsubscribe`,
    showGreeting = true,
    title,
  } = opts;

  // Title (H1) — rendered before salutation per editorial order.
  const titleBlock = title && title.trim()
    ? `<h1 class="mp-h1" style="margin:0 0 18px 0;font-size:26px;line-height:1.25;color:#0c2340;font-weight:800;letter-spacing:-0.3px;">${escapeHtml(title)}</h1>`
    : "";

  // Greeting — uses recipient first name if available, otherwise generic.
  const greetingName = recipientName?.trim();
  const greeting = showGreeting
    ? `<p style="margin:0 0 18px 0;font-size:16px;color:#0f172a;font-weight:600;">Bonjour${greetingName ? " " + escapeHtml(greetingName) : ""},</p>`
    : "";

  const cta = ctaUrl && ctaLabel
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto;">
         <tr><td style="background:#15803d;border-radius:12px;box-shadow:0 6px 16px rgba(21,128,61,0.28);">
           <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-weight:700;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;letter-spacing:0.3px;">${escapeHtml(ctaLabel)}</a>
         </td></tr>
       </table>`
    : "";

  return `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<title>MIPROJET</title>
<style>
  @media (prefers-color-scheme: dark) {
    body, table, td { background:#0f172a !important; color:#e2e8f0 !important; }
    .mp-card { background:#1e293b !important; }
    .mp-body { color:#e2e8f0 !important; }
    .mp-muted { color:#94a3b8 !important; }
  }
  @media only screen and (max-width:620px) {
    .mp-card { width:100% !important; border-radius:0 !important; }
    .mp-pad { padding:24px 18px !important; }
    .mp-h1 { font-size:22px !important; }
  }
  a { color:#15803d; }
</style>
</head>
<body style="margin:0;padding:0;background:#eef2f6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif;color:#0f172a;">
<span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;visibility:hidden;mso-hide:all;">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2f6;padding:32px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" class="mp-card" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,0.08);">

      <!-- HEADER with logo -->
      <tr><td align="center" style="background:linear-gradient(135deg,#0c2340 0%,#1e3a5f 60%,#15803d 100%);padding:36px 24px 28px 24px;">
        <img src="${LOGO_URL}" alt="MIPROJET" width="160" style="display:block;max-width:160px;height:auto;background:#ffffff;border-radius:14px;padding:10px 14px;box-shadow:0 4px 12px rgba(0,0,0,0.15);"/>
        <p style="margin:14px 0 0 0;color:#a7d2ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Entrepreneuriat jeune · Panafricain</p>
      </td></tr>

      <!-- BODY -->
      <tr><td class="mp-pad mp-body" style="padding:36px 36px 12px 36px;font-size:15px;line-height:1.7;color:#1e293b;">
        ${titleBlock}
        ${greeting}
        ${innerHtml}
        ${cta}
      </td></tr>

      <!-- DIVIDER -->
      <tr><td style="padding:0 36px;"><hr style="border:0;border-top:1px solid #e2e8f0;margin:0;"/></td></tr>

      <!-- FOOTER -->
      <tr><td class="mp-pad mp-muted" style="padding:24px 36px 32px 36px;color:#64748b;font-size:12px;line-height:1.7;text-align:center;">
        <p style="margin:0 0 10px 0;">
          <a href="${SITE_URL}" style="color:#15803d;text-decoration:none;font-weight:600;">ivoireprojet.com</a> ·
          <a href="${SITE_URL}/opportunities" style="color:#15803d;text-decoration:none;">Opportunités</a> ·
          <a href="${SITE_URL}/subscription" style="color:#15803d;text-decoration:none;">Abonnements</a> ·
          <a href="${SITE_URL}/contact" style="color:#15803d;text-decoration:none;">Contact</a>
        </p>
        <p style="margin:0 0 8px 0;">© ${new Date().getFullYear()} MIPROJET · Bingerville – Adjin Palmeraie, Abidjan, Côte d'Ivoire</p>
        <p style="margin:0;font-size:11px;color:#94a3b8;">
          Vous recevez cet email parce que vous êtes inscrit sur MIPROJET.<br/>
          <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Se désabonner</a> ·
          <a href="${SITE_URL}/privacy" style="color:#94a3b8;text-decoration:underline;">Confidentialité</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Build a per-recipient unsubscribe URL using their token. */
export function unsubscribeUrlFor(token?: string | null): string {
  return token ? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}` : `${SITE_URL}/unsubscribe`;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};