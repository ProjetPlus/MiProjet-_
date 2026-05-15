import { useLanguage } from "@/i18n/LanguageContext";
import { Language } from "@/i18n/translations";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const flags: Record<Language, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇸🇦',
  zh: '🇨🇳',
  es: '🇪🇸',
  de: '🇩🇪',
};

export const LanguageSelector = () => {
  const { language, setLanguage, languageNames } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{flags[language]} {languageNames[language]}</span>
          <span className="sm:hidden">{flags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {(Object.keys(languageNames) as Language[]).map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer ${language === lang ? 'bg-primary/10 text-primary' : ''}`}
          >
            <span className="mr-2">{flags[lang]}</span>
            {languageNames[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
