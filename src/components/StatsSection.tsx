import { useEffect, useState, useRef } from "react";
import { TrendingUp, Users, Globe, Award, Building, Briefcase } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const useCountUp = (end: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!start) return;
    
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);
  
  return count;
};

interface StatItem {
  icon: typeof TrendingUp;
  value: number;
  suffix: string;
  labelKey: string;
  color: string;
}

const StatCard = ({ stat, index, isVisible, t }: { stat: StatItem; index: number; isVisible: boolean; t: (key: string) => string }) => {
  const count = useCountUp(stat.value, 2000, isVisible);
  
  return (
    <div 
      className="text-center p-4 sm:p-6 rounded-2xl bg-card border border-border/50 hover:shadow-elegant transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-muted mb-4`}>
        <stat.icon className={`h-7 w-7 ${stat.color}`} />
      </div>
      <div className="space-y-1">
        <p className={`text-2xl sm:text-4xl font-bold ${stat.color}`}>
          {count}{stat.suffix}
        </p>
        <p className="text-muted-foreground font-medium">{t(stat.labelKey)}</p>
      </div>
    </div>
  );
};

export const StatsSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  // Updated stats with realistic values
  const stats: StatItem[] = [
    { icon: TrendingUp, value: 105, suffix: "+", labelKey: 'stats.projectsStructured', color: "text-primary" },
    { icon: Users, value: 65, suffix: "+", labelKey: 'stats.activeMembers', color: "text-secondary" },
    { icon: Globe, value: 5, suffix: "", labelKey: 'stats.countriesCovered', color: "text-accent" },
    { icon: Building, value: 15, suffix: "+", labelKey: 'stats.partners', color: "text-info" },
    { icon: Briefcase, value: 1.2, suffix: " Mds FCFA", labelKey: 'stats.estimatedFunding', color: "text-warning" },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            {t('stats.title')}
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            {t('stats.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard key={stat.labelKey} stat={stat} index={index} isVisible={isVisible} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};
