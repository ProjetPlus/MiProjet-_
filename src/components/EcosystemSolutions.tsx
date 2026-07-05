import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import goLogo from "@/assets/miprojet-go-logo.asset.json";
import plusLogo from "@/assets/miprojet-plus-logo.asset.json";
import investLogo from "@/assets/miprojet-invest-logo.asset.json";

const solutions = [
  {
    logo: goLogo.url,
    name: "MiPROJET Go",
    slogan: "Tracez. Gérez. Grandissez.",
    mission: "Digitalisez la gestion quotidienne de votre activité économique.",
    audience: "Commerçants, artisans, restaurateurs, transporteurs, agriculteurs, microentrepreneurs.",
    benefits: ["Suivi recettes & dépenses", "Gestion des stocks", "Rapports automatiques", "Accès progressif au financement"],
    href: "/solutions/miprojet-go",
    accent: "#1B6FB5",
  },
  {
    logo: plusLogo.url,
    name: "MiPROJET+",
    slogan: "Structurez. Certifiez. Financez.",
    mission: "Transformez votre activité en organisation structurée et finançable.",
    audience: "Startups, PME, TPE, coopératives, associations, ONG.",
    benefits: ["Structuration & gouvernance", "Diagnostic & accompagnement", "Certification", "Préparation aux investisseurs"],
    href: "/solutions/miprojet-plus",
    accent: "#F97316",
  },
  {
    logo: investLogo.url,
    name: "MiPROJET Invest",
    slogan: "Investir dans l'Afrique productive.",
    mission: "Mettez en relation projets qualifiés et investisseurs.",
    audience: "Investisseurs privés, business angels, fonds, banques, microfinances.",
    benefits: ["Projets sélectionnés", "Découverte d'opportunités", "Mise en relation", "Dossiers d'investissement"],
    href: "/solutions/miprojet-invest",
    accent: "#C9A84C",
  },
];

export const EcosystemSolutions = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container-luxe">
      <div className="text-center mb-12 md:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
          Écosystème MiPROJET
        </span>
        <h2 className="text-display text-3xl md:text-5xl mb-4">Trois solutions. Une vision.</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
          Une plateforme mère au service de l'entrepreneuriat africain, et trois applications spécialisées pour vous accompagner à chaque étape.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {solutions.map((s) => (
          <Link
            key={s.name}
            to={s.href}
            className="group relative flex flex-col rounded-2xl border-2 border-border bg-card p-6 lg:p-8 hover:shadow-xl transition-all hover:-translate-y-1"
            style={{ borderTopColor: s.accent, borderTopWidth: 4 }}
          >
            <div className="h-16 mb-4 flex items-center">
              <img src={s.logo} alt={s.name} className="h-14 w-auto object-contain" />
            </div>
            <p className="text-sm font-bold uppercase tracking-wider mb-2" style={{ color: s.accent }}>
              {s.slogan}
            </p>
            <p className="text-foreground font-semibold mb-3">{s.mission}</p>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
              <span className="font-semibold text-foreground">Pour : </span>{s.audience}
            </p>
            <ul className="space-y-1.5 mb-6 flex-1">
              {s.benefits.map((b) => (
                <li key={b} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: s.accent }} />
                  {b}
                </li>
              ))}
            </ul>
            <span
              className="inline-flex items-center gap-2 font-bold text-sm group-hover:gap-3 transition-all"
              style={{ color: s.accent }}
            >
              Découvrir <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  </section>
);
