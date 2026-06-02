import { ExternalLink, Handshake, Target, Calendar, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import dgMarketLogo from "@/assets/dgmarket-logo.asset.json";

export const PartnershipBanner = () => {
  return (
    <div className="space-y-6">
      {/* ===== DGMarket — Représentant exclusif Côte d'Ivoire ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-elegant">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
        <div className="relative p-6 md:p-8 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-full">
            <Handshake className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              REPRÉSENTANT EXCLUSIF — CÔTE D'IVOIRE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <img
              src={dgMarketLogo.url}
              alt="dgMarket — Globally Local Tenders"
              className="h-12 md:h-14 w-auto object-contain"
              loading="lazy"
            />
            <div className="hidden sm:block w-px h-10 bg-border" />
            <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              MIPROJET <span className="text-primary">×</span>{" "}
              <span className="text-emerald-600">dgMarket International</span>
            </h2>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            MIPROJET devient le <strong>représentant exclusif de dgMarket en Côte d'Ivoire</strong> via
            la signature d'un Mémorandum d'Entente (MoU) avec dgMarket International Inc.,
            géant américain de l'intelligence des marchés publics basé à Washington D.C.
            Un accès direct aux <strong>marchés publics mondiaux</strong> depuis Abidjan,
            pour entreprises, consultants et investisseurs.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-sm text-foreground">180+ pays couverts</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Appels d'offres internationaux</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FasterCapital — Protocole d'accord ===== */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-elegant">
        <div className="absolute inset-0 bg-gradient-primary opacity-5" />
        <div className="relative p-6 md:p-8 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full">
            <Handshake className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">PROTOCOLE D'ACCORD</span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            MIPROJET <span className="text-primary">&</span>{" "}
            <span className="text-secondary">FasterCapital</span>
          </h2>

          <p className="text-sm text-muted-foreground">
            MIPROJET rejoint le programme de levée de fonds de FasterCapital. Ce partenariat
            permet de trouver des partenaires financiers stratégiques, de renforcer notre
            modèle économique et d'élargir notre réseau international.
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

          <div className="bg-muted/50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-sm text-foreground text-center">FasterCapital en chiffres</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div><p className="text-lg font-bold text-primary">$2.6B</p><p className="text-xs text-muted-foreground">Levés</p></div>
              <div><p className="text-lg font-bold text-secondary">1253</p><p className="text-xs text-muted-foreground">Startups</p></div>
              <div><p className="text-lg font-bold text-success">92%</p><p className="text-xs text-muted-foreground">Taux de succès</p></div>
              <div><p className="text-lg font-bold text-info">175K</p><p className="text-xs text-muted-foreground">Business Angels</p></div>
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
    </div>
  );
};
