import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import patternBg from "@/assets/pattern-bg.jpg";

export const CallToAction = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${patternBg})` }}
      />
      <div className="absolute inset-0 bg-primary/90" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8 text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-accent font-semibold text-sm sm:text-base">{t('cta.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight px-2">
            {t('cta.titleLine1')}{" "}
            <span className="text-accent">{t('cta.titleLine2')}</span>
          </h2>

          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed px-4">
            {t('cta.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-8 px-4">
            <Link to="/submit-project" className="w-full sm:w-auto">
              <Button size="lg" variant="premium" className="w-full">
                {t('cta.submitProject')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/projects" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {t('cta.exploreProjects')}
              </Button>
            </Link>
          </div>

          <div className="pt-8 sm:pt-12 grid grid-cols-3 gap-4 sm:gap-8 border-t border-primary-foreground/20 px-2">
            <div className="space-y-1 sm:space-y-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold">48h</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-primary-foreground/80">{t('cta.stat1')}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold">95%</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-primary-foreground/80">{t('cta.stat2')}</p>
            </div>
            <div className="space-y-1 sm:space-y-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold">12h/7</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-primary-foreground/80">{t('cta.stat3')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
