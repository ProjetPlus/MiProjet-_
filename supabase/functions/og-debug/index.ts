import { requireAdmin } from "../_shared/requireAdmin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SITE_URL = "https://ivoireprojet.com";
const ALLOWED_PREFIXES = new Set(["actualites", "opportunites", "articles"]);

function pickMeta(html: string, property: string): string | null {
  // Match either property="og:..." or name="twitter:..."
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  // also match content first, property second
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
    "i",
  );
  const m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

function pickTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}

function htmlReport(payload: Record<string, unknown>) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>OG Debug</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0b1220;color:#e2e8f0;margin:0;padding:24px;line-height:1.5}
  h1{margin:0 0 16px;font-size:20px}
  .card{background:#111a2e;border:1px solid #1e293b;border-radius:12px;padding:16px;margin-bottom:16px}
  .row{display:flex;gap:12px;flex-wrap:wrap}
  .k{color:#94a3b8;min-width:160px}
  .v{word-break:break-all}
  .ok{color:#22c55e}.bad{color:#ef4444}
  img{max-width:100%;border-radius:8px;border:1px solid #1e293b}
  pre{background:#0a0f1c;padding:12px;border-radius:8px;overflow:auto;font-size:12px}
  a{color:#60a5fa}
</style></head><body>
<h1>OG Debug — ${payload.prefix}/${payload.slug}</h1>
<div class="card">
  <div class="row"><div class="k">URL testée</div><div class="v"><a href="${payload.pageUrl}" target="_blank">${payload.pageUrl}</a></div></div>
  <div class="row"><div class="k">HTTP</div><div class="v ${(payload as any).pageStatus === 200 ? "ok" : "bad"}">${(payload as any).pageStatus}</div></div>
</div>
<div class="card">
  <div class="row"><div class="k">og:title</div><div class="v">${(payload as any).ogTitle || "<span class='bad'>absent</span>"}</div></div>
  <div class="row"><div class="k">og:description</div><div class="v">${(payload as any).ogDescription || "<span class='bad'>absent</span>"}</div></div>
  <div class="row"><div class="k">og:image</div><div class="v"><a href="${(payload as any).ogImage || "#"}" target="_blank">${(payload as any).ogImage || "<span class='bad'>absent</span>"}</a></div></div>
  <div class="row"><div class="k">twitter:card</div><div class="v">${(payload as any).twitterCard || "-"}</div></div>
  <div class="row"><div class="k">&lt;title&gt;</div><div class="v">${(payload as any).pageTitle || "-"}</div></div>
</div>
${(payload as any).ogImage ? `<div class="card"><div class="k">Aperçu image</div><img src="${(payload as any).ogImage}" alt=""/></div>` : ""}
<div class="card">
  <h3>Liens validateurs</h3>
  <ul>
    <li><a target="_blank" href="https://developers.facebook.com/tools/debug/?q=${encodeURIComponent(payload.pageUrl as string)}">Facebook Sharing Debugger</a></li>
    <li><a target="_blank" href="https://www.linkedin.com/post-inspector/inspect/${encodeURIComponent(payload.pageUrl as string)}">LinkedIn Post Inspector</a></li>
    <li><a target="_blank" href="https://cards-dev.twitter.com/validator">Twitter Card Validator</a></li>
    <li><a target="_blank" href="https://search.google.com/test/rich-results?url=${encodeURIComponent(payload.pageUrl as string)}">Google Rich Results</a></li>
  </ul>
</div>
<details class="card"><summary>JSON brut</summary><pre>${JSON.stringify(payload, null, 2)}</pre></details>
</body></html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const prefix = (url.searchParams.get("prefix") || "").toLowerCase();
    const slug = url.searchParams.get("slug") || "";
    const format = (url.searchParams.get("format") || "html").toLowerCase();

    if (!ALLOWED_PREFIXES.has(prefix) || !slug || !/^[a-zA-Z0-9_\-\/]+$/.test(slug)) {
      return new Response(
        JSON.stringify({ error: "invalid prefix or slug", allowedPrefixes: [...ALLOWED_PREFIXES] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const pageUrl = `${SITE_URL}/${prefix}/${slug}`;
    let html = "";
    let pageStatus = 0;
    try {
      const r = await fetch(pageUrl, {
        headers: { "User-Agent": "facebookexternalhit/1.1 (Lovable OG Debug)" },
        redirect: "follow",
      });
      pageStatus = r.status;
      html = await r.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "fetch failed", message: String(e), pageUrl }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const payload = {
      prefix,
      slug,
      pageUrl,
      pageStatus,
      pageTitle: pickTitle(html),
      ogTitle: pickMeta(html, "og:title"),
      ogDescription: pickMeta(html, "og:description"),
      ogImage: pickMeta(html, "og:image"),
      ogUrl: pickMeta(html, "og:url"),
      ogType: pickMeta(html, "og:type"),
      twitterCard: pickMeta(html, "twitter:card"),
      twitterImage: pickMeta(html, "twitter:image"),
    };

    if (format === "json") {
      return new Response(JSON.stringify(payload, null, 2), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(htmlReport(payload), {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: "og-debug failed", message: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});