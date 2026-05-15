import { 
  FileSearch, 
  MessageSquare, 
  Handshake,
  ClipboardCheck, 
  GraduationCap,
  Building,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export const ServicesSection = () => {
  const { t } = useLanguage();

  // Services ordered according to PDF (Marketing Digital removed)
  const services = [
    {
      icon: FileSearch,
      title: t('services.analysis.title'),
      description: t('services.analysis.description'),
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: MessageSquare,
      title: t('services.consulting.title'),
      description: t('services.consulting.description'),
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Handshake,
      title: t('services.networking.title'),
      description: t('services.networking.description'),
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      icon: ClipboardCheck,
      title: t('services.monitoring.title'),
      description: t('services.monitoring.description'),
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: GraduationCap,
      title: t('services.training.title'),
      description: t('services.training.description'),
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Building,
      title: t('services.company.title'),
      description: t('services.company.description'),
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-left md:text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4">
            {t('services.badge')}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {t('services.title')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <Card 
              key={service.title}
              className="group hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 border-border/50"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl ${service.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`h-6 w-6 ${service.color}`} />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/services">
            <Button variant="hero" size="lg">
              {t('services.viewAll')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
