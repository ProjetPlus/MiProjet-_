import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { EnterpriseForm } from "@/components/services/EnterpriseForm";
import { useLanguage } from "@/i18n/LanguageContext";

const EnterpriseService = () => {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "Accompagnement Entreprise | MIPROJET";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Accompagnement Entreprise
          </h1>
          <p className="text-muted-foreground text-lg">
            Service dédié aux entreprises existantes cherchant un accompagnement stratégique, 
            opérationnel ou un financement pour leur croissance.
          </p>
        </div>
        <EnterpriseForm />
      </main>
      <Footer />
    </div>
  );
};

export default EnterpriseService;
