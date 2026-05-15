// Vercel serverless function — handles short links /n /o /p /d
// Detects social crawlers via User-Agent and serves prerendered OG HTML.
// Real users get the SPA (index.html) via 302 to the same path with ?spa=1 sentinel,
// or directly the SPA fallback served by Vercel.

const SUPABASE_URL = "https://nrrgqnruoylwztddkntm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycmdxbnJ1b3lsd3p0ZGRrbnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTYxOTYsImV4cCI6MjA4NjczMjE5Nn0.p2bFufIgC7dcHIWTBBGdhkEbS9XXxiEdIY2kymE0dZ0";
const SITE_URL = "https://ivoireprojet.com";
const DEFAULT_IMAGE = `${SITE_URL}/miprojet-og-cover.png`;

const BOT_REGEX = /facebookexternalhit|Facebot|Instagram|WhatsApp|LinkedInBot|Twitterbot|Slackbot|TelegramBot|Discordbot|SkypeUriPreview|Googlebot|GoogleImageProxy|Google-HTTP-Java-Client|Google-Apps-Script|Feedfetcher-Google|Gmail|bingbot|Pinterest|redditbot|Embedly|vkShare|W3C_Validator/i;
const WHATSAPP_REGEX = /WhatsApp/i;

const PREFIX_TABLE = {
  n: { table: "news", type: "news", select: "id,title,excerpt,content,image_url,short_slug" },
  o: { table: "opportunities", type: "opportunity", select: "id,title,description,content,image_url,short_slug" },
  p: { table: "projects", type: "project", select: "id,title,description,image_url,short_slug" },
  d: { table: "platform_documents", type: "document", select: "id,title,description,cover_url,short_slug" },
};

function escapeHtml(s) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function stripHtml(s) {
  return (s || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}
function absUrl(u) {
  if (!u) return DEFAULT_IMAGE;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}
function resolveImage(row) {
  const raw = row?.image_url || row?.cover_url || DEFAULT_IMAGE;
  const image = absUrl(raw);
  if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(image)) return DEFAULT_IMAGE;
  return image;
}

function buildCoverProxy({ prefix, flatSlug, id, image }) {
  if (!image || image === DEFAULT_IMAGE) return DEFAULT_IMAGE;
  const params = new URLSearchParams();
  if (prefix && flatSlug) {
    params.set("prefix", prefix);
    params.set("slug", flatSlug);
  } else if (id) {
    params.set("id", id);
  }
  return `${SITE_URL}/api/og-cover?${params.toString()}`;
}

function ctaFor(type) {
  if (type === "news") return "Lire l'article complet sur MIPROJET";
  if (type === "opportunity") return "Découvrir l'opportunité sur MIPROJET";
  if (type === "project") return "Découvrir le projet sur MIPROJET";
  return "Découvrir sur MIPROJET";
}

function buildSocialDescription(summary, type, pageUrl) {
  const cleanSummary = stripHtml(summary).replace(/\s+/g, " ").slice(0, 190);
  const cta = ctaFor(type);
  return `${cleanSummary || "Plateforme Panafricaine de Structuration de Projets"} — 👉 ${cta} : ${pageUrl}`.slice(0, 320);
}

// WhatsApp renders the FIRST line in bold when wrapped with *…* — we use this
// to highlight the article title in the link preview.
function buildWhatsappDescription(title, summary, type, pageUrl) {
  const safeTitle = stripHtml(title).replace(/\*/g, "").trim();
  const cleanSummary = stripHtml(summary).replace(/\s+/g, " ").slice(0, 160);
  const cta = ctaFor(type);
  const body = cleanSummary || "Plateforme Panafricaine de Structuration de Projets";
  return `*${safeTitle}*\n${body}\n👉 ${cta} : ${pageUrl}`.slice(0, 320);
}

async function fetchRow(table, slug, select) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?short_slug=eq.${encodeURIComponent(slug)}&select=${select}&limit=1`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  const data = await r.json();
  return Array.isArray(data) ? data[0] : null;
}

function buildHtml({ title, description, image, pageUrl }) {
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8" />
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
<meta name="twitter:site" content="@miprojet" />
<meta name="twitter:url" content="${escapeHtml(pageUrl)}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta name="twitter:image:alt" content="${escapeHtml(title)}" />
<link rel="canonical" href="${escapeHtml(pageUrl)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
</head><body><p>Redirection vers <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>…</p></body></html>`;
}

export default async function handler(req, res) {
  const ua = req.headers["user-agent"] || "";
  const { prefix, slug } = req.query;

  // Build canonical short URL (/n/art015/04/026 style)
  const slugSegments = Array.isArray(slug) ? slug : (slug ? [slug] : []);
  const flatSlug = slugSegments.join("-").replace(/\//g, "-");
  const pageUrl = `${SITE_URL}/${prefix}/${slugSegments.join("/")}`;

  // Real user → serve SPA index.html
  if (!BOT_REGEX.test(ua)) {
    res.setHeader("Cache-Control", "no-store");
    // Let Vercel serve the SPA: rewrite to /index.html.
    // Since this function already handled the route, we issue a 200 with the SPA shell.
    try {
      const spaResp = await fetch(`${SITE_URL}/index.html`);
      const html = await spaResp.text();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    } catch {
      return res.redirect(302, `/?path=${encodeURIComponent(pageUrl)}`);
    }
  }

  // Bot → fetch metadata and serve OG HTML
  const cfg = PREFIX_TABLE[prefix];
  let title = "MIPROJET";
  let description = "Plateforme Panafricaine de Structuration de Projets";
  let image = DEFAULT_IMAGE;

  let summary = "";
  let resolvedTitle = title;
  let resolvedType = cfg?.type;
  try {
    if (cfg && flatSlug) {
      const row = await fetchRow(cfg.table, flatSlug, cfg.select);
      if (row) {
        resolvedTitle = row.title || title;
        title = resolvedTitle;
        const rawImage = resolveImage(row);
        image = buildCoverProxy({ prefix, flatSlug, id: row.id, image: rawImage });
        summary = row.excerpt || row.description || row.content || "";
        description = WHATSAPP_REGEX.test(ua)
          ? buildWhatsappDescription(resolvedTitle, summary, cfg.type, pageUrl)
          : buildSocialDescription(summary, cfg.type, pageUrl);
      }
    }
  } catch (e) {
    console.error("social og fetch failed", e);
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate");
  return res.status(200).send(buildHtml({ title, description, image, pageUrl }));
}