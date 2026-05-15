import { FileText, CheckCircle, TrendingUp, Handshake, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";

const steps = [
  {
    number: 1,
    icon: FileText,
    title: "Soumettre son projet",
    description: "Décrivez votre projet via notre formulaire structuré ISO 21500.",
    color: "text-primary",
  },
  {
    number: 2,
    icon: Sparkles,
    title: "Évaluation MIPROJET+",
    description: "Score automatique sur 100 et niveau de maturité (1-4).",
    color: "text-info",
  },
  {
    number: 3,
    icon: CheckCircle,
    title: "Analyse & recommandations",
    description: "Forces, faiblesses et plan d'action personnalisé.",
    color: "text-success",
  },
  {
    number: 4,
    icon: TrendingUp,
    title: "Structuration",
    description: "Business plan, étude de faisabilité, dossier bancable.",
    color: "text-warning",
  },
  {
    number: 5,
    icon: Handshake,
    title: "Mise en relation investisseurs",
    description: "Orientation vers bailleurs, banques et partenaires adaptés.",
    color: "text-secondary",
  },
];

export const HowItWorks = () => {
  const { t } = useLanguage();

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-left md:text-center mb-16 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {steps.map((step, index) => (
            <Card
              key={step.number}
              className="relative group hover:shadow-glow transition-all duration-300 hover:-translate-y-2"
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-primary ${step.color}`}>
                    <step.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-4xl font-bold text-muted/20">
                    {step.number}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-primary" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 p-8 bg-primary/5 border border-primary/20 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-primary rounded-lg flex-shrink-0">
              <CheckCircle className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">
                {t('howItWorks.label.title')}
              </h3>
              <p className="text-muted-foreground">
                {t('howItWorks.label.description')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
