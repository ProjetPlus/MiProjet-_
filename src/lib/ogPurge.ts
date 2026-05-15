import { supabase } from "@/integrations/supabase/client";

const SITE_URL = "https://ivoireprojet.com";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export type OgPrefix = "actualites" | "opportunites" | "articles";

/**
 * Fire-and-forget purge of OG cache for a given resource.
 * Returns the result but never throws — call sites can ignore the promise.
 */
export async function purgeOgCache(prefix: OgPrefix, slug: string) {
  if (!slug) return { ok: false, error: "missing slug" };
  try {
    const { data, error } = await supabase.functions.invoke("purge-og-cache", {
      body: { prefix, slug },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Build the public URL of a published resource (used for previews). */
export function buildPublicUrl(prefix: OgPrefix, slug: string) {
  return `${SITE_URL}/${prefix}/${slug}`;
}

/**
 * Open the OG debug page for a slug. Falls back gracefully when the slug
 * is missing (e.g. not yet published / no short_slug).
 */
export function openOgDebug(prefix: OgPrefix, slug: string | null | undefined) {
  if (!slug) {
    alert("Slug indisponible : publiez d'abord la ressource.");
    return;
  }
  const url = `${SUPABASE_URL}/functions/v1/og-debug?prefix=${prefix}&slug=${encodeURIComponent(slug)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}