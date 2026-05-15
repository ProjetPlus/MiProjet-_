import { requireAdmin } from "../_shared/requireAdmin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://ivoireprojet.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { prefix, slug } = await req.json();
    if (!prefix || !slug) {
      return new Response(JSON.stringify({ error: "prefix and slug required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const flatSlug = String(slug).replace(/\//g, "-");
    const pageUrl = `${SITE_URL}/${prefix}/${slug}`;
    const coverUrl = `${SITE_URL}/api/og-cover?prefix=${prefix}&slug=${encodeURIComponent(flatSlug)}&v=${Date.now()}`;

    const results: Record<string, unknown> = {};

    // 1) Re-prime our own cover proxy
    try {
      const r = await fetch(coverUrl, { method: "GET" });
      results.coverProxy = { status: r.status, ok: r.ok };
    } catch (e) {
      results.coverProxy = { error: String(e) };
    }

    // 2) Ask Facebook to re-scrape
    try {
      const r = await fetch(`https://graph.facebook.com/?id=${encodeURIComponent(pageUrl)}&scrape=true`, {
        method: "POST",
      });
      results.facebook = { status: r.status, ok: r.ok };
    } catch (e) {
      results.facebook = { error: String(e) };
    }

    // 3) LinkedIn post-inspector ping (best effort, no key required)
    try {
      const r = await fetch(`https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(pageUrl)}`);
      results.linkedin = { status: r.status };
    } catch (e) {
      results.linkedin = { error: String(e) };
    }

    return new Response(JSON.stringify({ ok: true, pageUrl, coverUrl, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: "purge failed", message: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
