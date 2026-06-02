import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Building2, TrendingUp, Banknote, ArrowRight, Sparkles } from "lucide-react";

export const MembershipBanner = () => {
  const profiles = [
    { icon: Users, label: "Porteurs de projet", desc: "Structurer, financer, lancer votre idée à un coût accessible." },
    { icon: Building2, label: "Entreprises & Start-ups", desc: "Passer à l'échelle avec des partenaires et financements ciblés." },
    { icon: TrendingUp, label: "Investisseurs", desc: "Accéder en priorité aux projets certifiés MiProjet+." },
    { icon: Banknote, label: "Bailleurs & Institutions", desc: "Soutenir des projets sérieux, audités, à fort impact." },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-accent text-accent-foreground px-3 py-1">
          <Crown className="h-3 w-3 mr-1" />
          ESPACE MEMBRES MIPROJET
        </Badge>
        <Badge variant="outline" className="border-primary text-primary">
          <Sparkles className="h-3 w-3 mr-1" />
          Un univers par profil
        </Badge>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
        Un seul écosystème.{" "}
        <span className="gradient-text">Des opportunités sur mesure pour chaque profil.</span>
      </h2>

      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Porteurs de projet, entreprises, partenaires techniques, investisseurs, bailleurs,
        institutions et experts : connectez-vous pour découvrir les <strong>plans, tarifs
        et opportunités</strong> spécifiquement conçus pour votre profil — accessibles,
        sérieux, et à fort potentiel.
      </p>

      <div className="space-y-3">
        {profiles.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="p-2 rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/auth?redirect=/subscription">
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <Crown className="h-4 w-4" />
            Me connecter pour voir mes plans
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/auth?mode=signup">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Créer un compte gratuit
          </Button>
        </Link>
      </div>
    </div>
  );
};
