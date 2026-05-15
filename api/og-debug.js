// Diagnostic endpoint — returns the metadata MIPROJET will serve to social bots
// for a given short slug. Public read-only; no secrets exposed.

const SUPABASE_URL = "https://nrrgqnruoylwztddkntm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ycmdxbnJ1b3lsd3p0ZGRrbnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTYxOTYsImV4cCI6MjA4NjczMjE5Nn0.p2bFufIgC7dcHIWTBBGdhkEbS9XXxiEdIY2kymE0dZ0";
const SITE_URL = "https://ivoireprojet.com";
const DEFAULT_IMAGE = `${SITE_URL}/miprojet-og-cover.png`;

const PREFIX_TABLE = {
  n: { table: "news", type: "news", select: "id,title,excerpt,content,image_url,short_slug" },
  o: { table: "opportunities", type: "opportunity", select: "id,title,description,content,image_url,short_slug" },
  p: { table: "projects", type: "project", select: "id,title,description,image_url,short_slug" },
  d: { table: "platform_documents", type: "document", select: "id,title,description,cover_url,short_slug" },
};

function stripHtml(s) {
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function ctaFor(type) {
  if (type === "news") return "Lire l'article complet sur MIPROJET";
  if (type === "opportunity") return "Découvrir l'opportunité sur MIPROJET";
  if (type === "project") return "Découvrir le projet sur MIPROJET";
  return "Découvrir sur MIPROJET";
}

export default async function handler(req, res) {
  const { prefix, slug } = req.query;
  res.setHeader("Cache-Control", "no-store");
  if (!prefix || !slug || !PREFIX_TABLE[prefix]) {
    return res.status(400).json({ error: "Usage: /api/og-debug?prefix=n|o|p|d&slug=<short_slug>" });
  }
  const cfg = PREFIX_TABLE[prefix];
  const flatSlug = String(slug).replace(/\//g, "-");
  const pageUrl = `${SITE_URL}/${prefix}/${slug}`;
  const ogCover = `${SITE_URL}/api/og-cover?prefix=${prefix}&slug=${encodeURIComponent(flatSlug)}`;

  try {
    const url = `${SUPABASE_URL}/rest/v1/${cfg.table}?short_slug=eq.${encodeURIComponent(flatSlug)}&select=${cfg.select}&limit=1`;
    const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
    const data = await r.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) {
      return res.status(404).json({ error: "Row not found", pageUrl, ogCover });
    }
    const summary = stripHtml(row.excerpt || row.description || row.content || "");
    const cta = ctaFor(cfg.type);
    const standardDescription = `${summary.slice(0, 190) || "Plateforme Panafricaine de Structuration de Projets"} — 👉 ${cta} : ${pageUrl}`.slice(0, 320);
    const whatsappDescription = `*${(row.title || "").trim()}*\n${summary.slice(0, 160)}\n👉 ${cta} : ${pageUrl}`.slice(0, 320);

    return res.status(200).json({
      pageUrl,
      type: cfg.type,
      title: row.title,
      og: {
        "og:title": row.title,
        "og:description": standardDescription,
        "og:image": ogCover,
        "og:image:type": "image/jpeg",
        "og:image:width": 1200,
        "og:image:height": 630,
        "og:url": pageUrl,
      },
      twitter: {
        "twitter:card": "summary_large_image",
        "twitter:title": row.title,
        "twitter:description": standardDescription,
        "twitter:image": ogCover,
        "twitter:url": pageUrl,
      },
      whatsapp: { description: whatsappDescription, image: ogCover },
      sourceRow: row,
    });
  } catch (e) {
    return res.status(500).json({ error: "debug failed", message: String(e?.message || e) });
  }
}
