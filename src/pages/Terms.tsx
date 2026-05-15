import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
}

const Terms = () => {
  useEffect(() => setMeta("Conditions d'utilisation | MIPROJET", "Termes et conditions d'utilisation de MIPROJET."), []);
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <h1 className="text-3xl font-bold mb-4">Conditions d'utilisation</h1>
        <p className="text-muted-foreground">Les conditions détaillées seront publiées prochainement.</p>
      </main>
      <Footer />
    </div>
  );
};
export default Terms;
