import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Award, Handshake, ArrowRight } from "lucide-react";

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
}

const steps = [
  {
    icon: FileText,
    title: "Créez votre compte",
    description: "Inscrivez-vous et complétez votre profil avec vos informations professionnelles.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: CheckCircle,
    title: "Soumettez votre projet",
    description: "Remplissez le formulaire détaillé de votre projet et payez les frais d'adhésion.",
    color: "bg-info/10 text-info"
  },
  {
    icon: Award,
    title: "Structuration professionnelle",
    description: "Notre équipe analyse votre projet, rédige le business plan et réalise l'étude de faisabilité selon la norme ISO 21500.",
    color: "bg-success/10 text-success"
  },
  {
    icon: Handshake,
    title: "Validation et orientation",
    description: "Après validation par le comité technique, votre projet reçoit le label MIPROJET et est orienté vers les partenaires adaptés.",
    color: "bg-warning/10 text-warning"
  },
];

const Guide = () => {
  useEffect(() => setMeta("Guide du porteur | MIPROJET", "Guide complet pour soumettre et structurer votre projet avec MIPROJET."), []);
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Guide du Porteur de Projet</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez comment MIPROJET vous accompagne dans la structuration et l'orientation de votre projet vers les partenaires adaptés.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card key={index} className="relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className={`p-3 rounded-xl ${step.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-3xl font-bold text-muted-foreground/30">{index + 1}</span>
                      <CardTitle className="text-xl">{step.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pl-20">
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="mt-12 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-2">Important à savoir</h3>
              <p className="text-muted-foreground">
                MIPROJET n'est pas un organisme de financement. Nous accompagnons les porteurs de projets dans la structuration professionnelle de leurs idées et les orientons vers des partenaires adaptés à leur profil.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Guide;
