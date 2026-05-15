import sharp from "sharp";

const SUPABASE_URL = "https://nrrgqnruoylwztddkntm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Im5ycmdxbnJ1b3lsd3p0ZGRrbnRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNTYxOTYsImV4cCI6MjA4NjczMjE5Nn0.p2bFufIgC7dcHIWTBBGdhkEbS9XXxiEdIY2kymE0dZ0";
const SITE_URL = "https://ivoireprojet.com";
const DEFAULT_IMAGE = `${SITE_URL}/miprojet-og-cover.png`;

const PREFIX_TABLE = {
  n: { table: "news", select: "id,image_url,short_slug" },
  o: { table: "opportunities", select: "id,image_url,short_slug" },
  p: { table: "projects", select: "id,image_url,short_slug" },
  d: { table: "platform_documents", select: "id,cover_url,short_slug" },
};

const TYPE_PREFIX = { news: "n", opportunity: "o", project: "p", document: "d", ebook: "d" };

function absUrl(u) {
  if (!u) return DEFAULT_IMAGE;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  return `${SITE_URL}${u.startsWith("/") ? "" : "/"}${u}`;
}

async function fetchRow(req) {
  const { prefix, slug, type, id } = req.query;
  const resolvedPrefix = prefix || TYPE_PREFIX[type];
  const cfg = PREFIX_TABLE[resolvedPrefix];
  if (!cfg) return null;

  const params = new URLSearchParams({ select: cfg.select, limit: "1" });
  if (slug && /^[a-z0-9-]+$/i.test(slug)) params.set("short_slug", `eq.${slug.toLowerCase()}`);
  else if (id && /^[0-9a-f-]{36}$/i.test(id)) params.set("id", `eq.${id}`);
  else return null;

  const url = `${SUPABASE_URL}/rest/v1/${cfg.table}?${params.toString()}`;
  const r = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } });
  const data = await r.json();
  return Array.isArray(data) ? data[0] : null;
}

async function proxyJpeg(imageUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(imageUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "MIPROJET-OG-Cover/1.0" },
    });
    if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);
    const input = Buffer.from(await response.arrayBuffer());
    return sharp(input)
      .rotate()
      .resize(1200, 630, { fit: "cover", position: "centre" })
      .jpeg({ quality: 78, progressive: false, mozjpeg: true })
      .toBuffer();
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler(req, res) {
  try {
    const row = await fetchRow(req);
    const rawImage = row?.image_url || row?.cover_url || DEFAULT_IMAGE;
    const imageUrl = absUrl(rawImage);

    if (/\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(imageUrl)) {
      return res.redirect(302, DEFAULT_IMAGE);
    }

    const jpeg = await proxyJpeg(imageUrl);
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.setHeader("Content-Length", String(jpeg.length));
    return res.status(200).send(jpeg);
  } catch (error) {
    console.error("og-cover proxy failed", error);
    return res.redirect(302, DEFAULT_IMAGE);
  }
}