import { SolutionPage } from "./SolutionPage";
import logo from "@/assets/miprojet-go-logo.asset.json";

export default function MiProjetGoPage() {
  return (
    <SolutionPage
      cfg={{
        logo: logo.url,
        name: "MiPROJET Go",
        slogan: "Tracez. Gérez. Grandissez.",
        mission: "Digitalisez la gestion quotidienne de votre activité.",
        accent: "#1B6FB5",
        seoDescription:
          "MiPROJET Go permet aux commerçants, artisans et microentrepreneurs de suivre leurs recettes, dépenses, stocks et bénéfices simplement, et de se préparer progressivement à l'accès au financement.",
        audience: [
          "Commerçants & boutiquiers",
          "Vendeuses de marché",
          "Restaurateurs & maquis",
          "Artisans & couturiers",
          "Coiffeurs & esthéticiennes",
          "Maçons, menuisiers, électriciens",
          "Plombiers & réparateurs",
          "Chauffeurs & transporteurs",
          "Livreurs indépendants",
          "Agriculteurs & éleveurs",
          "Pêcheurs",
          "Microentrepreneurs",
        ],
        features: [
          { title: "Suivi des recettes", desc: "Enregistrez vos ventes en quelques secondes." },
          { title: "Suivi des dépenses", desc: "Sachez exactement où va votre argent chaque jour." },
          { title: "Bénéfices en temps réel", desc: "Votre rentabilité, calculée automatiquement." },
          { title: "Gestion des stocks", desc: "Ne soyez plus jamais en rupture." },
          { title: "Gestion des équipes", desc: "Coordonnez vos employés et prestataires." },
          { title: "Rapports automatiques", desc: "Bilans hebdo / mensuels prêts à consulter." },
          { title: "Historique financier", desc: "Une mémoire complète de votre activité." },
          { title: "Préparation au financement", desc: "Construisez un historique bancable." },
        ],
        ctaLabel: "Lancer MiPROJET Go",
        ctaHref: "/auth",
      }}
    />
  );
}
