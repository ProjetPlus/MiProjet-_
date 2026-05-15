/**
 * Centralized cover-image fallback logic.
 * Used by article/opportunity layouts AND by social share previews so that
 * a missing or broken image NEVER produces an empty OG card.
 */

export const DEFAULT_COVER =
  "https://ivoireprojet.com/miprojet-og-cover.png";

export const GENERIC_FALLBACK =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1600&h=900&fit=crop";

export function resolveCover(image?: string | null): string {
  if (!image) return DEFAULT_COVER;
  const trimmed = image.trim();
  if (!trimmed) return DEFAULT_COVER;
  // Reject obviously broken values
  if (trimmed.startsWith("data:") && trimmed.length < 32) return DEFAULT_COVER;
  return trimmed;
}

/** Standard onError handler for <img>. Falls back to a working URL. */
export function onCoverError(
  e: React.SyntheticEvent<HTMLImageElement>,
  fallback: string = GENERIC_FALLBACK,
) {
  const el = e.currentTarget;
  if (el.src !== fallback) el.src = fallback;
}