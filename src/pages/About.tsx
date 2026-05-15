import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/i18n/LanguageContext";
import { 
  Target, Eye, Heart, Globe, Users, Award, 
  CheckCircle, TrendingUp, Shield, Lightbulb,
  Building2, Handshake, MapPin
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import founderPhoto from "@/assets/dr-marcel-konan.png";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { 
    meta = document.createElement("meta"); 
    meta.name = "description"; 
    document.head.appendChild(meta); 
  }
  meta.content = description;
}

const values = [
  {
    icon: Shield,
    title: "Intégrité",
    description: "Transparence totale dans toutes nos opérations et relations avec nos partenaires"
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Standards internationaux ISO 21500 pour la structuration de tous les projets"
  },
  {
    icon: Handshake,
    title: "Engagement",
    description: "Accompagnement personnalisé de bout en bout, de l'idée jusqu'au financement"
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "Solutions créatives et adaptées aux réalités africaines"
  },
  {
    icon: Users,
    title: "Collaboration",
    description: "Écosystème de partenaires stratégiques pour maximiser l'impact"
  },
  {
    icon: Globe,
    title: "Panafricanisme",
    description: "Vision continentale pour un développement inclusif et durable"
  }
];

const stats = [
  { value: "150+", label: "Projets structurés" },
  { value: "850M+", label: "FCFA mobilisés" },
  { value: "15+", label: "Pays couverts" },
  { value: "92%", label: "Taux de succès" },
];

const team = [
  {
    name: "Dr Konan Marcel KOUASSI",
    role: "Fondateur & CEO",
    description: "Fondateur et CEO de MIPROJET. Expert en structuration de projets avec une vision panafricaine.",
    photo: founderPhoto,
  },
  {
    name: "Aminata DIALLO",
    role: "Directrice des Opérations",
    description: "Spécialiste en gestion de projets et accompagnement stratégique"
  },
  {
    name: "Kofi MENSAH",
    role: "Directeur Financier",
    description: "Expert-comptable avec expertise en financement de projets"
  },
  {
    name: "Fatou NDIAYE",
    role: "Responsable Partenariats",
    description: "Développeuse de réseaux avec les institutions financières africaines"
  }
];

const About = () => {
  const { language } = useLanguage();

  useEffect(() => {
    setMeta(
      "À propos | MIPROJET - Plateforme Panafricaine de Financement", 
      "Découvrez MIPROJET, la plateforme panafricaine spécialisée dans la structuration professionnelle et l'accompagnement de projets à fort impact en Afrique."
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-28 md:pt-32 pb-16 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <span className="inline-block px-4 py-2 bg-accent/20 rounded-full text-accent font-semibold text-sm mb-6">
                Notre Histoire
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                À propos de <span className="text-accent">MIPROJET</span>
              </h1>
              <p className="text-xl md:text-2xl text-primary-foreground/90 leading-relaxed">
                Plateforme spécialisée dans la structuration professionnelle et l'accompagnement 
                de projets à fort impact en Afrique. Votre partenaire de confiance pour 
                transformer vos idées en succès.
              </p>
              <p className="text-lg text-accent mt-4 font-semibold">
                De l'idée au financement, ensemble construisons l'avenir.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-card border-b border-border">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm md:text-base text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
              {/* Mission */}
              <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Notre Mission</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Accompagner les entrepreneurs et porteurs de projets africains dans la 
                    structuration professionnelle de leurs initiatives selon les normes 
                    internationales ISO 21500.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Nous transformons les idées prometteuses en dossiers bancables, prêts à 
                    convaincre les investisseurs, bailleurs de fonds et institutions financières.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      "Structuration selon normes ISO 21500",
                      "Accompagnement personnalisé end-to-end",
                      "Orientation vers partenaires adaptés",
                      "Suivi et évaluation des projets"
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Vision */}
              <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors">
                <CardContent className="p-8">
                  <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-6">
                    <Eye className="h-7 w-7 text-secondary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">Notre Vision</h2>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Devenir la plateforme de référence en Afrique pour la structuration 
                    et le financement de projets à fort impact économique et social.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Nous aspirons à créer un écosystème dynamique où chaque idée 
                    innovante trouve les ressources nécessaires à sa réalisation, 
                    contribuant ainsi au développement durable du continent africain.
                  </p>
                  <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">Objectif 2030</p>
                        <p className="text-sm text-muted-foreground">
                          Accompagner 1000+ projets dans 30+ pays africains avec un impact 
                          sur plus de 500 000 emplois directs et indirects.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-primary/10 rounded-full text-primary font-semibold text-sm mb-4">
                Ce qui nous guide
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nos Valeurs</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Les principes fondamentaux qui orientent toutes nos actions et décisions
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="group hover:shadow-elegant transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <value.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 bg-secondary/10 rounded-full text-secondary font-semibold text-sm mb-4">
                L'équipe
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Notre Équipe</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Des experts passionnés au service de votre réussite
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member: any, index: number) => (
                <Card key={index} className="text-center hover:shadow-elegant transition-shadow">
                  <CardContent className="p-6">
                    {member.photo ? (
                      <img src={member.photo} alt={member.name} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-2 border-primary/30" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium text-sm mb-2">{member.role}</p>
                    <p className="text-muted-foreground text-sm">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pan-African Presence */}
        <section className="py-16 md:py-24 bg-gradient-hero text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Présence Panafricaine
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8">
                Basés en Côte d'Ivoire, nous accompagnons des projets dans plus de 
                15 pays africains, avec une vision continentale et une approche locale.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-6 mt-8">
                <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-6">
                  <Building2 className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Siège Social</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Abidjan, Côte d'Ivoire
                  </p>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-6">
                  <MapPin className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Zones d'Intervention</h3>
                  <p className="text-sm text-primary-foreground/80">
                    Afrique de l'Ouest, Centrale & de l'Est
                  </p>
                </div>
                <div className="bg-primary-foreground/10 backdrop-blur rounded-xl p-6">
                  <Users className="h-8 w-8 text-accent mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Partenaires</h3>
                  <p className="text-sm text-primary-foreground/80">
                    50+ institutions partenaires
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <Card className="max-w-4xl mx-auto border-2 border-primary/20">
              <CardContent className="p-8 md:p-12 text-center">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Prêt à concrétiser votre projet ?
                </h2>
                <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Rejoignez les centaines d'entrepreneurs qui ont fait confiance à MIPROJET 
                  pour structurer et financer leurs projets.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/submit-project">
                    <Button size="lg" variant="default" className="w-full sm:w-auto">
                      Soumettre mon projet
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Nous contacter
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
