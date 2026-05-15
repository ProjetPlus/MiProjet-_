import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UserJourney } from "@/components/dashboard/UserJourney";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Compass } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const setMeta = (title: string, description: string) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
};

const JOURNEY_DEFS: Record<string, { title: string; steps: string[] }> = {
  existing: {
    title: "Activités existantes",
    steps: ["Diagnostic", "Organisation", "Structuration financière", "Stabilisation", "Crédibilité", "Accès au financement"],
  },
  startup: {
    title: "Startup / Nouveau projet",
    steps: ["Définition de l'idée", "Problème & solution", "Modèle économique", "Étude de marché", "Structuration", "Préparation financement"],
  },
};

const Journey = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMeta("Mon parcours | MIPROJET", "Suivez vos parcours utilisateur et exportez votre progression au format PDF.");
  }, []);

  useEffect(() => {
    if (!loading && !user) navigate("/auth?redirect=/journey");
  }, [loading, user, navigate]);

  const exportPDF = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("user_journeys")
        .select("*")
        .eq("user_id", user.id);
      const map: Record<string, any> = {};
      (data || []).forEach((j: any) => { map[j.journey_type] = j; });

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;

      doc.setFontSize(18);
      doc.setTextColor(33, 96, 70);
      doc.text("MIPROJET — Mon parcours", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }), pageWidth / 2, y, { align: "center" });
      y += 4;
      doc.text(user.email || "", pageWidth / 2, y, { align: "center" });
      y += 12;

      Object.entries(JOURNEY_DEFS).forEach(([key, def]) => {
        const j = map[key];
        const completed = new Set<number>(j?.steps_completed || []);
        const progress = j ? Math.round((completed.size / def.steps.length) * 100) : 0;

        doc.setFontSize(14);
        doc.setTextColor(33, 96, 70);
        doc.text(def.title, 20, y);
        y += 6;
        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(j ? `Progression : ${progress}% (${completed.size}/${def.steps.length})` : "Non démarré", 20, y);
        y += 6;

        def.steps.forEach((stepTitle, idx) => {
          const isDone = completed.has(idx);
          doc.setTextColor(isDone ? 22 : 100, isDone ? 130 : 100, isDone ? 60 : 100);
          doc.text(`${isDone ? "[X]" : "[ ]"} ${idx + 1}. ${stepTitle}`, 25, y);
          y += 6;
          if (y > 270) { doc.addPage(); y = 20; }
        });
        y += 6;
      });

      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text("MIPROJET — ivoireprojet.com", pageWidth / 2, 285, { align: "center" });
      doc.text("info@ivoireprojet.com  |  +225 07 07 16 79 21", pageWidth / 2, 290, { align: "center" });

      doc.save(`parcours-miprojet-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF exporté", description: "Votre récap de parcours est prêt." });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <DashboardLayout userType="individual">
      <div className="space-y-6" ref={containerRef}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Compass className="h-7 w-7 text-primary" /> Mon parcours
            </h1>
            <p className="text-muted-foreground text-sm">Comparez et avancez sur les deux parcours structurés.</p>
          </div>
          <Button onClick={exportPDF} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" /> Exporter en PDF
          </Button>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Les deux parcours sont indépendants : choisissez celui qui correspond à votre situation
            (activité existante ou nouveau projet) et cochez les étapes au fur et à mesure de votre avancement.
          </CardContent>
        </Card>

        <UserJourney />
      </div>
    </DashboardLayout>
  );
};

export default Journey;