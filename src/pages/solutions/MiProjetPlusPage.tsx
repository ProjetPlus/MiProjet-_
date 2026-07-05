import { SolutionPage } from "./SolutionPage";
import logo from "@/assets/miprojet-plus-logo.asset.json";

export default function MiProjetPlusPage() {
  return (
    <SolutionPage
      cfg={{
        logo: logo.url,
        name: "MiPROJET+",
        slogan: "Structurez. Certifiez. Financez.",
        mission: "Transformez votre activité en organisation structurée et finançable.",
        accent: "#F97316",
        seoDescription:
          "MiPROJET+ accompagne startups, PME, coopératives, associations et ONG dans leur structuration organisationnelle, leur diagnostic, leur certification et leur préparation aux financements et investisseurs.",
        audience: [
          "Startups",
          "PME",
          "TPE structurées",
          "Coopératives",
          "Associations",
          "ONG",
          "Entreprises en croissance",
        ],
        features: [
          { title: "Structuration organisationnelle", desc: "Bâtissez une organisation solide et lisible." },
          { title: "Gouvernance", desc: "Cadres, statuts, procédures alignés aux standards." },
          { title: "Diagnostic complet", desc: "Un audit 360° de votre organisation." },
          { title: "Accompagnement dédié", desc: "Un expert MiPROJET+ à vos côtés." },
          { title: "Certification MiPROJET+", desc: "Un gage de crédibilité pour les financeurs." },
          { title: "Préparation bancaire", desc: "Dossier prêt à défendre en banque." },
          { title: "Préparation aux investisseurs", desc: "Pitch deck, plan financier, data room." },
          { title: "Préparation aux appels d'offres", desc: "Réponses gagnantes aux marchés publics." },
          { title: "Préparation aux levées de fonds", desc: "De la valorisation au closing." },
        ],
        ctaLabel: "Accéder à MiPROJET+",
        ctaHref: "/miprojet-plus",
      }}
    />
  );
}
