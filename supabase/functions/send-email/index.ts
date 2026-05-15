import { requireAdmin } from "../_shared/requireAdmin.ts";
import { sendMail, brandedEmailShell, corsHeaders } from "../_shared/mailer.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { to, subject, html, preheader, ctaUrl, ctaLabel, raw } = await req.json();
    if (!to || !subject || !html) {
      return new Response(JSON.stringify({ ok: false, error: "to, subject, html are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const finalHtml = raw ? html : brandedEmailShell({ innerHtml: html, preheader, ctaUrl, ctaLabel });
    const recipients: string[] = Array.isArray(to) ? to : [to];

    const results = [];
    for (const r of recipients) {
      const result = await sendMail({ to: r, subject, html: finalHtml, kind: "single" });
      results.push({ to: r, ok: result.ok, provider: result.provider, id: result.id, error: result.error });
    }
    return new Response(JSON.stringify({ ok: true, results }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});