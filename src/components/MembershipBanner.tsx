import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Briefcase, GraduationCap, Handshake, ArrowRight, Lock } from "lucide-react";

export const MembershipBanner = () => {
  const benefits = [
    { icon: Briefcase, label: "Financements", desc: "Appels à projets & subventions" },
    { icon: GraduationCap, label: "Formations", desc: "Webinaires & ateliers exclusifs" },
    { icon: Handshake, label: "Accompagnement", desc: "Coaching & partenariats VIP" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge className="bg-accent text-accent-foreground px-3 py-1">
          <Crown className="h-3 w-3 mr-1" />
          CLUB MIPROJET
        </Badge>
        <Badge variant="outline" className="border-primary text-primary">
          <Lock className="h-3 w-3 mr-1" />
          Réservé aux abonnés
        </Badge>
      </div>
      
      <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
        Accédez aux{" "}
        <span className="gradient-text">Opportunités Exclusives</span>
      </h2>
      
      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
        Rejoignez notre communauté de porteurs de projets et bénéficiez 
        d'un accès privilégié aux meilleures opportunités de financement, 
        de formation et d'accompagnement en Afrique.
      </p>

      <div className="space-y-3">
        {benefits.map((item, i) => {
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
        <Link to="/subscription">
          <Button size="lg" className="w-full sm:w-auto gap-2">
            <Crown className="h-4 w-4" />
            S'abonner
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/opportunities">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Voir les opportunités
          </Button>
        </Link>
      </div>
    </div>
  );
};
