/**
 * Helpers d'affichage des ID de projet — Module 1 du MENU_ADMIN.
 * Format : 00012MIP (numéro séquentiel + suffixe MIP).
 */

export const formatProjectDisplayId = (
  displayId?: string | null,
  fallbackUuid?: string | null,
  suffix: "MIP" | "MP" = "MIP"
): string => {
  if (displayId) return displayId;
  if (fallbackUuid) {
    // Affichage de secours pour anciens projets sans display_id
    return fallbackUuid.substring(0, 8).toUpperCase() + suffix;
  }
  return `?????${suffix}`;
};
