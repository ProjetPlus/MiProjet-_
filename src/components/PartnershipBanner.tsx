import { ExternalLink, Handshake, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PartnershipBanner = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-elegant">
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      
      <div className="relative p-6 md:p-8 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
          <Handshake className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-accent">PROTOCOLE D'ACCORD</span>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          MIPROJET <span className="text-primary">&</span>{" "}
          <span className="text-secondary">FasterCapital</span>
        </h2>
        
        <p className="text-sm text-muted-foreground">
          MIPROJET rejoint le programme de levée de fonds de FasterCapital. 
          Ce partenariat permet de trouver des partenaires financiers stratégiques, 
          de renforcer notre modèle économique et d'élargir notre réseau international.
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-success" />
            <span className="font-bold text-sm text-foreground">1+ Milliard FCFA</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-info" />
            <span className="text-sm text-muted-foreground">05 Oct 2025</span>
          </div>
        </div>

        {/* FasterCapital Stats */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground text-center">FasterCapital en chiffres</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-primary">$2.6B</p>
              <p className="text-xs text-muted-foreground">Levés</p>
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">1253</p>
              <p className="text-xs text-muted-foreground">Startups</p>
            </div>
            <div>
              <p className="text-lg font-bold text-success">92%</p>
              <p className="text-xs text-muted-foreground">Taux de succès</p>
            </div>
            <div>
              <p className="text-lg font-bold text-info">175K</p>
              <p className="text-xs text-muted-foreground">Business Angels</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => window.open("https://fastercapital.com", "_blank")}
          >
            Découvrir FasterCapital
            <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
