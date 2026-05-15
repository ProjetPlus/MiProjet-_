import { Heart, Building2, Landmark, PieChart, Handshake, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n/LanguageContext";

export const FundingTypes = () => {
  const { t } = useLanguage();

  const fundingTypes = [
    {
      icon: Heart,
      title: t('funding.donors.title'),
      badge: t('funding.donors.badge'),
      description: t('funding.donors.description'),
      features: [
        t('funding.donors.feature1'),
        t('funding.donors.feature2'),
        t('funding.donors.feature3'),
      ],
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      icon: Building2,
      title: t('funding.grants.title'),
      badge: t('funding.grants.badge'),
      description: t('funding.grants.description'),
      features: [
        t('funding.grants.feature1'),
        t('funding.grants.feature2'),
        t('funding.grants.feature3'),
      ],
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Landmark,
      title: t('funding.loan.title'),
      badge: t('funding.loan.badge'),
      description: t('funding.loan.description'),
      features: [
        t('funding.loan.feature1'),
        t('funding.loan.feature2'),
        t('funding.loan.feature3'),
      ],
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      icon: PieChart,
      title: t('funding.equity.title'),
      badge: t('funding.equity.badge'),
      description: t('funding.equity.description'),
      features: [
        t('funding.equity.feature1'),
        t('funding.equity.feature2'),
        t('funding.equity.feature3'),
      ],
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Handshake,
      title: t('funding.partnership.title'),
      badge: t('funding.partnership.badge'),
      description: t('funding.partnership.description'),
      features: [
        t('funding.partnership.feature1'),
        t('funding.partnership.feature2'),
        t('funding.partnership.feature3'),
      ],
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-left md:text-center mb-16 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('funding.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('funding.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
          {fundingTypes.map((type) => (
            <Card
              key={type.title}
              className="group hover:shadow-glow transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/30"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${type.bgColor}`}>
                    <type.icon className={`h-6 w-6 ${type.color}`} />
                  </div>
                  <Badge className={type.bgColor + " " + type.color}>{type.badge}</Badge>
                </div>
                <CardTitle className="text-lg">{type.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {type.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-xs text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Important Notice */}
        <div className="mt-16 bg-muted/50 p-6 md:p-8 rounded-2xl border border-border">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-info/10 rounded-xl flex-shrink-0">
              <Info className="h-6 w-6 text-info" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">{t('funding.notice.title')}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('funding.notice.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
