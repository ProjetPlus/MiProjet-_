import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, languageNames } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languageNames: Record<Language, string>;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect browser language and map to supported languages
const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'fr';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  const languageMap: Record<string, Language> = {
    'fr': 'fr',
    'en': 'en',
    'ar': 'ar',
    'zh': 'zh',
    'es': 'es',
    'de': 'de',
  };
  
  return languageMap[langCode] || 'fr';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('miprojet-language');
    if (saved && ['fr', 'en', 'ar', 'zh', 'es', 'de'].includes(saved)) {
      return saved as Language;
    }
    // Auto-detect browser language if no saved preference
    return detectBrowserLanguage();
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('miprojet-language', language);
    document.documentElement.lang = language;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    
    // Update meta tags for SEO
    updateMetaTags(language);
  }, [language, isRTL]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languageNames, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Update meta tags based on language
const updateMetaTags = (lang: Language) => {
  const metaDescriptions: Record<Language, string> = {
    fr: "Plateforme panafricaine de structuration professionnelle de projets. MIPROJET accompagne les porteurs de projets dans la structuration selon la norme ISO 21500 et les oriente vers des partenaires adaptés.",
    en: "Pan-African platform for professional project structuring. MIPROJET supports project owners in ISO 21500 compliant structuring and guides them to suitable partners.",
    ar: "منصة أفريقية للهيكلة المهنية للمشاريع. MIPROJET يدعم أصحاب المشاريع في الهيكلة وفقًا لمعيار ISO 21500 ويوجههم إلى الشركاء المناسبين.",
    zh: "泛非专业项目结构化平台。MIPROJET支持项目负责人按照ISO 21500标准进行结构化，并引导他们找到合适的合作伙伴。",
    es: "Plataforma panafricana de estructuración profesional de proyectos. MIPROJET apoya a los emprendedores en la estructuración según la norma ISO 21500 y los orienta hacia socios adecuados.",
    de: "Panafrikanische Plattform für professionelle Projektstrukturierung. MIPROJET unterstützt Projektinhaber bei der ISO 21500-konformen Strukturierung und leitet sie zu geeigneten Partnern.",
  };

  const metaTitles: Record<Language, string> = {
    fr: "MIPROJET - Structuration Professionnelle de Projets | Plateforme Panafricaine",
    en: "MIPROJET - Professional Project Structuring | Pan-African Platform",
    ar: "MIPROJET - هيكلة مهنية للمشاريع | منصة أفريقية",
    zh: "MIPROJET - 专业项目结构化 | 泛非平台",
    es: "MIPROJET - Estructuración Profesional de Proyectos | Plataforma Panafricana",
    de: "MIPROJET - Professionelle Projektstrukturierung | Panafrikanische Plattform",
  };

  // Update document title
  const currentPath = window.location.pathname;
  if (currentPath === '/' || currentPath === '') {
    document.title = metaTitles[lang];
  }

  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  if (currentPath === '/' || currentPath === '') {
    metaDesc.content = metaDescriptions[lang];
  }

  // Update OG tags
  let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
  if (ogTitle) {
    ogTitle.content = metaTitles[lang];
  }

  let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
  if (ogDesc) {
    ogDesc.content = metaDescriptions[lang];
  }

  // Add hreflang tags for SEO
  const existingHreflangs = document.querySelectorAll('link[rel="alternate"][hreflang]');
  existingHreflangs.forEach(el => el.remove());

  const languages: Language[] = ['fr', 'en', 'ar', 'zh', 'es', 'de'];
  languages.forEach(l => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hreflang = l;
    link.href = `${window.location.origin}${currentPath}?lang=${l}`;
    document.head.appendChild(link);
  });

  // Add x-default
  const defaultLink = document.createElement('link');
  defaultLink.rel = 'alternate';
  defaultLink.hreflang = 'x-default';
  defaultLink.href = `${window.location.origin}${currentPath}`;
  document.head.appendChild(defaultLink);
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
