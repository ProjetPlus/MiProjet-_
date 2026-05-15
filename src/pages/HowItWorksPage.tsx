import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { HowItWorks } from "@/components/HowItWorks";

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
}

const HowItWorksPage = () => {
  useEffect(() => setMeta("Comment ça marche | MIPROJET", "Comprenez le processus de structuration et de financement MIPROJET."), []);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <h1 className="text-3xl font-bold mb-8">Comment ça marche</h1>
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};
export default HowItWorksPage;
