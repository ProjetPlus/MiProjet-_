import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target, Users, TrendingUp, Shield, BookOpen,
  CheckCircle2, ArrowRight, Globe, Heart, Briefcase,
  Lightbulb, Phone, Mail, GraduationCap, Rocket, Award
} from "lucide-react";
import { Link } from "react-router-dom";
import { useSEO } from "@/components/SEOHead";

const IncubationProgram = () => {
  useSEO({
    title: "Programme d'Incubation de Projets Entrepreneuriaux",
    description: "Rejoignez notre programme d'incubation pour bénéficier de formation, accompagnement et financement. Dédié aux jeunes entrepreneurs, femmes et associations en Afrique.",
    image: window.location.origin + "/favicon.png",
    url: window.location.href,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative pt-28 md:pt-32 pb-16 bg-gradient-to-br from-primary/10 via-background to-accent/10 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 text-sm px-4 py-1" variant="secondary">🚀 Entrepreneuriat & Innovation</Badge>
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-foreground">
            Programme d'Incubation<br />
            <span className="text-primary">de Projets Entrepreneuriaux</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Formation • Structuration • Financement • Accompagnement
          </p>
          <p className="text-base text-muted-foreground max-w-xl mx-auto">
            Un programme complet pour transformer vos idées en projets viables et finançables.
          </p>
        </div>
      </section>

      {/* Pourquoi ce programme */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Pourquoi ce programme ?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Target className="h-5 w-5 text-destructive" />Le constat</h3>
                <p className="text-muted-foreground text-sm">Des milliers de porteurs de projets prometteurs n'accèdent pas aux financements disponibles par manque de structuration et de compétences en montage de dossiers.</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" />Notre mission</h3>
                <p className="text-muted-foreground text-sm">Créer un pont entre les financements disponibles et les porteurs de projets en leur offrant formation, structuration et accompagnement professionnel.</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-success">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><Shield className="h-5 w-5 text-success" />Notre approche</h3>
                <p className="text-muted-foreground text-sm">Un modèle transparent et éthique qui maximise l'impact des financements tout en garantissant un accompagnement professionnel de qualité.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Comment ça marche ?</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { step: "1", text: "Appel à candidatures et sélection des meilleurs projets", icon: Users },
              { step: "2", text: "Formation intensive de 10 semaines en gestion de projets", icon: GraduationCap },
              { step: "3", text: "Structuration complète du projet (business plan, plan financier)", icon: BookOpen },
              { step: "4", text: "Mise en relation avec les bailleurs et partenaires financiers", icon: TrendingUp },
              { step: "5", text: "Accompagnement et mentorat sur 12 à 24 mois", icon: Award },
            ].map(({ step, text, icon: Icon }) => (
              <div key={step} className="flex items-start gap-4 bg-card rounded-lg p-4 border">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">{step}</div>
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <p className="text-foreground">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Nos programmes</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Jeunes Entrepreneurs", subtitle: "Climat • Agriculture • Digital", target: "Jeunes porteurs de projets innovants", icon: Rocket, color: "text-success" },
              { title: "Femmes & Autonomisation", subtitle: "Entrepreneuriat féminin", target: "Groupements de femmes entrepreneures", icon: Heart, color: "text-destructive" },
              { title: "Associations & OSC", subtitle: "Impact social & communautaire", target: "Associations et organisations", icon: Briefcase, color: "text-primary" },
            ].map(p => (
              <Card key={p.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6 space-y-3">
                  <p.icon className={`h-10 w-10 mx-auto ${p.color}`} />
                  <h3 className="font-bold text-lg">{p.title}</h3>
                  <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                  <Badge variant="outline">{p.target}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ce que vous obtenez */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Ce que vous obtenez</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Formation", items: ["Gestion de projets", "Business plan", "Plan financier", "Pitch investisseurs"] },
              { title: "Accompagnement", items: ["Mentorat personnalisé", "Coaching hebdomadaire", "Réseau d'experts", "Suivi sur 12-24 mois"] },
              { title: "Financement", items: ["Accès aux bailleurs", "Structuration de dossiers", "Mise en relation directe", "Négociation partenariats"] },
              { title: "Réseau", items: ["Communauté d'entrepreneurs", "Événements networking", "Partenaires stratégiques", "Visibilité médiatique"] },
            ].map(b => (
              <Card key={b.title} className="bg-primary/5 border-primary/10">
                <CardContent className="pt-6">
                  <h3 className="font-bold text-primary mb-3">✓ {b.title}</h3>
                  <ul className="space-y-1.5">
                    {b.items.map(i => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />{i}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Notre impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { value: "105+", label: "Projets accompagnés" },
              { value: "65+", label: "Entrepreneurs formés" },
              { value: "5", label: "Pays couverts" },
              { value: "78%", label: "Taux de réussite" },
            ].map(s => (
              <Card key={s.label} className="text-center">
                <CardContent className="pt-6">
                  <p className="text-3xl font-bold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardContent className="pt-8 pb-8 space-y-4">
              <h2 className="text-2xl font-bold">Rejoignez le programme</h2>
              <p className="text-muted-foreground">Transformez votre idée en un projet structuré et finançable grâce à notre accompagnement expert.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/submit-project"><ArrowRight className="h-4 w-4 mr-2" />Soumettre un projet</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="https://wa.me/2250707167921" target="_blank" rel="noopener noreferrer">
                    <Phone className="h-4 w-4 mr-2" />Nous contacter
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Mail className="h-3 w-3" />info@ivoireprojet.com
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IncubationProgram;
