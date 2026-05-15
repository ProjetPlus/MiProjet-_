import { Shield, TrendingUp, Users, Award, BarChart3, HeadphonesIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";

export const Features = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Award,
      titleKey: 'features.quality.title',
      descriptionKey: 'features.quality.description',
    },
    {
      icon: TrendingUp,
      titleKey: 'features.structuring.title',
      descriptionKey: 'features.structuring.description',
    },
    {
      icon: Shield,
      titleKey: 'features.security.title',
      descriptionKey: 'features.security.description',
    },
    {
      icon: Users,
      titleKey: 'features.network.title',
      descriptionKey: 'features.network.description',
    },
    {
      icon: BarChart3,
      titleKey: 'features.tracking.title',
      descriptionKey: 'features.tracking.description',
    },
    {
      icon: HeadphonesIcon,
      titleKey: 'features.support.title',
      descriptionKey: 'features.support.description',
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('features.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/30"
            >
              <CardContent className="p-6 space-y-4 text-left">
                <div className="p-4 bg-gradient-primary rounded-xl w-fit">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t(feature.descriptionKey)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
