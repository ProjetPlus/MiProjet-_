import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("PUBLIC_SITE_URL") || "https://ivoireprojet.com";
const DEFAULT_IMAGE = `${SITE_URL}/miprojet-og-cover.png`;

const ctaByType: Record<string, string> = {
  news: "Lire l'article complet sur MIPROJET",
  opportunity: "Découvrir l'opportunité sur MIPROJET",
  project: "Découvrir le projet sur MIPROJET",
  document: "Télécharger le document sur MIPROJET",
  ebook: "Télécharger le guide sur MIPROJET",
};

// Map a short slug prefix to (type, table, public path)
const slugPrefixMap: Record<string, { type: string; table: string; path: string; selectFields: string }> = {
  art: { type: "news", table: "news", path: "news", selectFields: "id, title, excerpt, content, image_url, short_slug" },
  opp: { type: "opportunity", table: "opportunities", path: "opportunities", selectFields: "id, title, description, content, image_url, short_slug" },
  prj: { type: "project", table: "projects", path: "projects", selectFields: "id, title, description, image_url, short_slug" },
  doc: { type: "document", table: "platform_documents", path: "documents", selectFields: "id, title, description, cover_url, short_slug" },
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const toAbsoluteUrl = (value: string, fallbackBase: string) => {
  if (!value) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${fallbackBase}${value.startsWith("/") ? "" : "/"}${value}`;
};

const buildCoverProxy = (type: string, id: string | null | undefined, image: string) => {
  if (!id || !image || image === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  const params = new URLSearchParams({ type, id });
  return `${SITE_URL}/api/og-cover?${params.toString()}`;
};

const stripHtml = (value: string | null | undefined) =>
  (value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();

const buildShortPublicUrl = (type: string, shortSlug?: string | null, fallbackId?: string | null) => {
  const shortMap: Record<string, string> = { news: "n", opportunity: "o", project: "p", document: "d", ebook: "d" };
  if (shortSlug && shortMap[type]) {
    return `${SITE_URL}/${shortMap[type]}/${shortSlug.replace(/-/g, "/")}`;
  }
  if (!fallbackId) return SITE_URL;
  if (type === "news") return `${SITE_URL}/news/${fallbackId}`;
  if (type === "opportunity") return `${SITE_URL}/opportunities/${fallbackId}`;
  if (type === "project") return `${SITE_URL}/projects/${fallbackId}`;
  if (type === "document" || type === "ebook") return `${SITE_URL}/documents/${fallbackId}`;
  return SITE_URL;
};

const buildSocialDescription = (summary: string, type: string, pageUrl: string) => {
  const cleanSummary = stripHtml(summary).replace(/\s+/g, " ").slice(0, 190);
  const cta = ctaByType[type] || "Découvrir sur MIPROJET";
  return `${cleanSummary || "Plateforme Panafricaine de Structuration de Projets"} — 👉 ${cta} : ${pageUrl}`.slice(0, 320);
};

const buildHtml = ({
  title,
  description,
  image,
  pageUrl,
}: {
  title: string;
  description: string;
  image: string;
  pageUrl: string;
}) => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | MIPROJET</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="MIPROJET" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(image)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${escapeHtml(title)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head>
<body>
  <p>Redirection vers <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>…</p>
</body>
</html>`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let type = url.searchParams.get("type");
    let id = url.searchParams.get("id");
    const format = url.searchParams.get("format");
    let slugParam = url.searchParams.get("s") || url.searchParams.get("slug");

    // Also support clean path: /functions/v1/og-image/s/art003-04-026
    if (!slugParam) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const sIdx = pathParts.indexOf("s");
      if (sIdx >= 0 && pathParts[sIdx + 1]) {
        slugParam = pathParts.slice(sIdx + 1).join("-").replace(/\//g, "-");
      }
    }

    // Support short path style: /n/art003/04/026 → art003-04-026
    if (!slugParam) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      const shortMap: Record<string, string> = { n: "art", o: "opp", p: "prj", d: "doc" };
      // Find the first segment that matches a short prefix (n/o/p/d).
      // The function may be mounted at /functions/v1/og-image/n/<slug>... or at /og-image/n/<slug>...
      const shortIdx = pathParts.findIndex((p) => shortMap[p]);
      if (shortIdx >= 0 && pathParts.length > shortIdx + 1) {
        slugParam = pathParts.slice(shortIdx + 1).join("-");
      }
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve a short slug -> type + id
    if (slugParam) {
      const normalized = slugParam.toLowerCase();
      const prefix = normalized.slice(0, 3);
      const cfg = slugPrefixMap[prefix];
      if (cfg) {
        const { data: row } = await supabase
          .from(cfg.table)
          .select(cfg.selectFields)
          .eq("short_slug", normalized)
          .maybeSingle();
        if (row) {
          type = cfg.type;
          id = (row as any).id;
        }
      }
    }

    if (!type || !id) {
      const badRequestHeaders = new Headers(corsHeaders);
      badRequestHeaders.set("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify({ error: "Missing type or id" }), {
        status: 400,
        headers: badRequestHeaders,
      });
    }

    let title = "MIPROJET";
    let description = "Plateforme Panafricaine de Structuration de Projets";
    let image = DEFAULT_IMAGE;
    let pageUrl = SITE_URL;

    if (type === "news") {
      const { data } = await supabase.from("news").select("title, excerpt, content, image_url, short_slug").eq("id", id).eq("status", "published").maybeSingle();
      if (data) {
        title = data.title;
        pageUrl = buildShortPublicUrl(type, data.short_slug, id);
        description = buildSocialDescription(data.excerpt || data.content || "", type, pageUrl);
        image = buildCoverProxy(type, id, toAbsoluteUrl(data.image_url || DEFAULT_IMAGE, SITE_URL) || DEFAULT_IMAGE);
      } else {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    } else if (type === "opportunity") {
      const { data } = await supabase.from("opportunities").select("title, description, content, image_url, short_slug, is_active").eq("id", id).eq("status", "published").maybeSingle();
      if (data && data.is_active === false) {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
      if (data) {
        title = data.title;
        pageUrl = buildShortPublicUrl(type, data.short_slug, id);
        description = buildSocialDescription(data.description || data.content || "", type, pageUrl);
        image = buildCoverProxy(type, id, toAbsoluteUrl(data.image_url || DEFAULT_IMAGE, SITE_URL) || DEFAULT_IMAGE);
      } else {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    } else if (type === "project") {
      const { data } = await supabase.from("projects").select("title, description, image_url, short_slug").eq("id", id).eq("status", "published").maybeSingle();
      if (data) {
        title = data.title;
        pageUrl = buildShortPublicUrl(type, data.short_slug, id);
        description = buildSocialDescription(data.description || "", type, pageUrl);
        image = buildCoverProxy(type, id, toAbsoluteUrl(data.image_url || DEFAULT_IMAGE, SITE_URL) || DEFAULT_IMAGE);
      } else {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    } else if (type === "document" || type === "ebook") {
      const { data } = await supabase.from("platform_documents").select("title, description, cover_url, short_slug").eq("id", id).eq("is_active", true).maybeSingle();
      if (data) {
        title = data.title;
        pageUrl = buildShortPublicUrl(type, data.short_slug, id);
        description = buildSocialDescription(data.description || "", type, pageUrl);
        image = buildCoverProxy(type, id, toAbsoluteUrl(data.cover_url || DEFAULT_IMAGE, SITE_URL) || DEFAULT_IMAGE);
      } else {
        return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
      }
    }

    const absoluteImage = toAbsoluteUrl(image || DEFAULT_IMAGE, SITE_URL) || DEFAULT_IMAGE;

    if (format === "json") {
      const jsonHeaders = new Headers(corsHeaders);
      jsonHeaders.set("content-type", "application/json; charset=utf-8");
      return new Response(JSON.stringify({ title, description, image: absoluteImage, url: pageUrl }), {
        headers: jsonHeaders,
      });
    }

    // Allow direct image proxy: /og-image?...&format=image returns a 302 to the cover URL.
    if (format === "image") {
      const imgHeaders = new Headers(corsHeaders);
      imgHeaders.set("location", absoluteImage);
      imgHeaders.set("cache-control", "public, max-age=3600");
      return new Response(null, { status: 302, headers: imgHeaders });
    }

    const htmlHeaders = new Headers(corsHeaders);
    htmlHeaders.set("content-type", "text/html; charset=utf-8");
    htmlHeaders.set("cache-control", "public, max-age=300");
    return new Response(buildHtml({ title, description, image: absoluteImage, pageUrl }), {
      headers: htmlHeaders,
    });
  } catch (error) {
    console.error("OG metadata error:", error);
    const errorHeaders = new Headers(corsHeaders);
    errorHeaders.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: errorHeaders,
    });
  }
});
