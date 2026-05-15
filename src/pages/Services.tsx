import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  Megaphone, Users, FileSearch, MessageSquare, Building, 
  ClipboardCheck, GraduationCap, ArrowRight, CheckCircle,
  Target, Lightbulb, Award
} from "lucide-react";

const setMeta = (title: string, description: string) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
};

const services = [
  {
    icon: FileSearch,
    title: "Analyse & Conception de Projet",
    description: "Structuration professionnelle selon la norme ISO 21500",
    features: ["Étude de faisabilité complète", "Rédaction du business plan", "Analyse des risques", "Définition des besoins de financement", "Score de crédibilité (A, B, C)"],
    popular: true,
  },
  {
    icon: Users,
    title: "Orientation Stratégique",
    description: "Orientation vers l'écosystème adapté",
    features: ["Orientation vers investisseurs qualifiés", "Orientation vers partenaires techniques", "Orientation vers bailleurs de fonds", "Accompagnement événementiel", "Base de données partenaires"],
    popular: false,
  },
  {
    icon: Megaphone,
    title: "Marketing Digital",
    description: "Visibilité maximale pour votre projet",
    features: ["Stratégie de communication digitale", "Gestion des réseaux sociaux", "Campagnes publicitaires ciblées", "Création de contenu", "Référencement SEO"],
    popular: false,
  },
  {
    icon: MessageSquare,
    title: "Consultance",
    description: "Expertise personnalisée pour votre réussite",
    features: ["Coaching entrepreneurial", "Conseil stratégique", "Optimisation du modèle économique", "Préparation au pitch", "Accompagnement personnalisé"],
    popular: false,
  },
  {
    icon: Building,
    title: "Création d'Entreprise",
    description: "Formalisation juridique complète",
    features: ["Choix du statut juridique", "Rédaction des statuts", "Immatriculation au RCCM", "Obtention du NCC", "Accompagnement administratif"],
    popular: false,
  },
  {
    icon: ClipboardCheck,
    title: "Contrôle & Suivi de Projet",
    description: "Monitoring et reporting transparent",
    features: ["Tableau de bord en temps réel", "Rapports d'avancement", "Indicateurs de performance", "Alertes et recommandations", "Reporting investisseurs"],
    popular: false,
  },
  {
    icon: GraduationCap,
    title: "Formation",
    description: "Développez vos compétences",
    features: ["Gestion de projet (ISO 21500)", "Entrepreneuriat et business model", "Levée de fonds et pitch", "Marketing et ventes", "Comptabilité et finance"],
    popular: false,
  },
];

const Services = () => {
  useEffect(() => {
    setMeta(
      "Nos Services | MIPROJET - Structuration et Orientation de Projets",
      "Découvrez tous les services MIPROJET: analyse de projet, orientation stratégique, marketing digital, consultance, création d'entreprise, formation."
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-28 md:pt-32">
        {/* Hero */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-2 bg-accent/20 rounded-full text-accent font-semibold text-sm mb-4">
              Nos Services
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Un Accompagnement <span className="text-accent">Complet</span>
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-3xl mx-auto">
              De l'idée au financement, MIPROJET vous accompagne à chaque étape de votre parcours entrepreneurial
            </p>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Norme ISO 21500</h3>
                <p className="text-muted-foreground">Structuration professionnelle selon les standards internationaux</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Lightbulb className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Accompagnement Expert</h3>
                <p className="text-muted-foreground">Une équipe d'experts dédiée à votre réussite</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 mx-auto bg-success/10 rounded-2xl flex items-center justify-center mb-4">
                  <Award className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Label Qualité</h3>
                <p className="text-muted-foreground">Un gage de crédibilité auprès des investisseurs</p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {services.map((service) => (
                <Card 
                  key={service.title}
                  className={`relative hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 ${
                    service.popular ? "border-primary border-2" : "border-border/50"
                  }`}
                >
                  {service.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Le plus demandé
                    </div>
                  )}
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="pt-4 border-t border-border space-y-2">
                      <Link to="/contact" className="block">
                        <Button className="w-full" variant={service.popular ? "hero" : "outline"}>
                          Demander un devis
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link to="/contact" className="block">
                        <Button className="w-full" variant="ghost">
                          Être contacté
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Prêt à structurer votre projet ?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Contactez-nous pour discuter de vos besoins et découvrir comment MIPROJET peut vous accompagner
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit-project">
                <Button variant="premium" size="lg">
                  Soumettre mon projet
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
