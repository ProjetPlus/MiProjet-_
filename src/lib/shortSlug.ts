/**
 * Centralized short-slug helpers.
 *
 * The project uses two compact representations of the same slug:
 *  - "long" form, stored in DB:        art003-04-026
 *  - "path" form, used in public URLs: art003/04/026
 *
 * This module is the SINGLE source of truth. It is imported by:
 *  - src/components/SocialSharePopup.tsx
 *  - src/pages/ShortLink.tsx
 *  - supabase/functions/og-image/index.ts (mirrored logic, kept identical)
 */

export type ShareKind = "news" | "opportunity" | "project" | "document" | "ebook";

export const PUBLIC_SHORT_BASE = "https://ivoireprojet.com";
export const SUPABASE_FUNCTIONS_BASE =
  "https://nrrgqnruoylwztddkntm.supabase.co/functions/v1";

/** ShareKind -> short URL segment used on the public site (e.g. /n/...) */
export const TYPE_TO_SHORT: Record<ShareKind, string> = {
  news: "n",
  opportunity: "o",
  project: "p",
  document: "d",
  ebook: "d",
};

/** Short URL segment -> table info for resolving the slug back to a row */
export const SHORT_TO_CONFIG: Record<
  string,
  { table: "news" | "opportunities" | "projects" | "platform_documents"; redirectBase: string }
> = {
  n: { table: "news", redirectBase: "/news" },
  o: { table: "opportunities", redirectBase: "/opportunities" },
  p: { table: "projects", redirectBase: "/projects" },
  d: { table: "platform_documents", redirectBase: "/documents" },
};

/** "art003-04-026" -> "art003/04/026" */
export function slugToPath(slug: string): string {
  return slug.split("-").join("/");
}

/** "art003/04/026" or path segments -> "art003-04-026" */
export function pathToSlug(path: string | string[]): string {
  const raw = Array.isArray(path) ? path.join("/") : path;
  return raw
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .join("-")
    .toLowerCase();
}

/** Build the canonical public short URL for a content row. */
export function buildShortPublicUrl(kind: ShareKind, shortSlug?: string | null): string {
  if (!shortSlug) return PUBLIC_SHORT_BASE;
  return `${PUBLIC_SHORT_BASE}/${TYPE_TO_SHORT[kind]}/${slugToPath(shortSlug)}`;
}

/** Build the og-image edge function URL (used for debug + as a share fallback). */
export function buildOgEndpoint(opts: {
  shortSlug?: string | null;
  kind?: ShareKind;
  id?: string | null;
  format?: "html" | "json";
}): string {
  const params = new URLSearchParams();
  if (opts.shortSlug) params.set("s", opts.shortSlug);
  else if (opts.kind && opts.id) {
    params.set("type", opts.kind);
    params.set("id", opts.id);
  }
  if (opts.format) params.set("format", opts.format);
  return `${SUPABASE_FUNCTIONS_BASE}/og-image?${params.toString()}`;
}