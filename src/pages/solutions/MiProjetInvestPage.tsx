import { SolutionPage } from "./SolutionPage";
import logo from "@/assets/miprojet-invest-logo.asset.json";

export default function MiProjetInvestPage() {
  return (
    <SolutionPage
      cfg={{
        logo: logo.url,
        name: "MiPROJET Invest",
        slogan: "Investir dans l'Afrique productive.",
        mission: "Connectez les projets qualifiés aux investisseurs sérieux.",
        accent: "#C9A84C",
        seoDescription:
          "MiPROJET Invest met en relation investisseurs privés, business angels, fonds, banques et microfinances avec des projets africains rigoureusement sélectionnés et prêts à être financés.",
        audience: [
          "Investisseurs privés",
          "Business angels",
          "Fonds d'investissement",
          "Banques",
          "Microfinances",
          "Institutions financières",
          "Entreprises investisseuses",
        ],
        features: [
          { title: "Projets sélectionnés", desc: "Uniquement des dossiers structurés et vérifiés." },
          { title: "Découverte d'opportunités", desc: "Un flux constant de nouvelles opportunités." },
          { title: "Mise en relation directe", desc: "Contactez les porteurs qualifiés en un clic." },
          { title: "Suivi des opportunités", desc: "Pilotez votre pipeline d'investissement." },
          { title: "Dossiers d'investissement", desc: "Accès aux data rooms selon vos droits." },
          { title: "Filtres sectoriels & pays", desc: "Trouvez ce qui correspond à votre thèse." },
        ],
        ctaLabel: "Découvrir les projets",
        ctaHref: "/investors",
      }}
    />
  );
}
