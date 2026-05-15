import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { StructuringForm } from "@/components/services/StructuringForm";
import { useLanguage } from "@/i18n/LanguageContext";

const StructuringService = () => {
  const { t } = useLanguage();

  useEffect(() => {
    document.title = "Structuration de Projet | MIPROJET";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="max-w-3xl mx-auto mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Structuration Professionnelle de Projet
          </h1>
          <p className="text-muted-foreground text-lg">
            Transformez votre idée en un dossier bancable selon les normes ISO 21500. 
            Nos experts vous accompagnent dans l'élaboration d'un business plan solide.
          </p>
        </div>
        <StructuringForm />
      </main>
      <Footer />
    </div>
  );
};

export default StructuringService;
