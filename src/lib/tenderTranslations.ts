import { supabase } from "@/integrations/supabase/client";
import type { Language } from "@/i18n/translations";

export type TenderTranslationRow = {
  id: string;
  notice_title: string;
  summary?: string | null;
  title_fr?: string | null;
  title_en?: string | null;
  summary_fr?: string | null;
  summary_en?: string | null;
  country_name?: string | null;
  sector?: string | null;
};

export type TenderTranslation = { title: string; summary?: string | null };

const languageLabels: Record<Language, string> = {
  fr: "français",
  en: "anglais",
  ar: "arabe",
  zh: "chinois",
  es: "espagnol",
  de: "allemand",
};

const cacheKey = (lang: Language, id: string) => `miprojet-tender-translation:${lang}:${id}`;

export const getTenderTitle = (
  tender: TenderTranslationRow,
  language: Language,
  translated?: TenderTranslation
) => {
  if (translated?.title) return translated.title;
  if (language === "en") return tender.title_en || tender.notice_title;
  if (language === "fr") return tender.title_fr || tender.notice_title;
  return tender.title_fr || tender.title_en || tender.notice_title;
};

export const getTenderSummary = (
  tender: TenderTranslationRow,
  language: Language,
  translated?: TenderTranslation
) => {
  if (translated?.summary) return translated.summary;
  if (language === "en") return tender.summary_en || tender.summary;
  if (language === "fr") return tender.summary_fr || tender.summary;
  return tender.summary_fr || tender.summary_en || tender.summary;
};

export const localTenderSummary = (title: string, country: string, sector: string) =>
  `Appel d'offres au ${country || "pays concerné"} dans le secteur ${sector || "Autres"}. Objet : ${title.slice(0, 180)}.`;

export const translateTenderBatch = async (tenders: TenderTranslationRow[], language: Language) => {
  const result: Record<string, TenderTranslation> = {};
  if (!tenders.length || language === "en") return result;

  const missing: TenderTranslationRow[] = [];
  for (const tender of tenders) {
    const nativeTitle = language === "fr" ? tender.title_fr : null;
    const nativeSummary = language === "fr" ? tender.summary_fr : null;
    if (nativeTitle && (nativeSummary || !tender.summary)) continue;

    try {
      const cached = localStorage.getItem(cacheKey(language, tender.id));
      if (cached) {
        result[tender.id] = JSON.parse(cached);
        continue;
      }
    } catch {}
    missing.push(tender);
  }

  if (!missing.length) return result;

  const { data, error } = await supabase.functions.invoke("translate-tender", {
    body: {
      targetLanguage: language,
      targetLanguageLabel: languageLabels[language],
      tenders: missing.slice(0, 30).map((t) => ({
        id: t.id,
        title: t.notice_title,
        summary: t.summary,
        country: t.country_name,
        sector: t.sector,
      })),
    },
  });

  if (error || !Array.isArray(data?.translations)) return result;

  for (const row of data.translations) {
    if (!row?.id || !row?.title) continue;
    const value = { title: String(row.title), summary: row.summary ? String(row.summary) : null };
    result[row.id] = value;
    try { localStorage.setItem(cacheKey(language, row.id), JSON.stringify(value)); } catch {}
  }
  return result;
};