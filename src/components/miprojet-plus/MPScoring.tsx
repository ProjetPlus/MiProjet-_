import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, CheckCircle, BarChart3, Loader2, Download } from "lucide-react";
import { ScoringResultPopup } from "./ScoringResultPopup";
import { exportScoringPDF } from "./ScoringPDFExport";

interface Question {
  id: string;
  axis: string;
  question: string;
  options: { label: string; value: number }[];
  maxPoints: number;
}

const AXES = [
  { key: "juridique", label: "Juridique & Gouvernance", max: 15, color: "bg-blue-500" },
  { key: "financier", label: "Financier", max: 25, color: "bg-emerald-500" },
  { key: "technique", label: "Technique & Opérationnel", max: 20, color: "bg-amber-500" },
  { key: "marche", label: "Marché & Modèle économique", max: 20, color: "bg-purple-500" },
  { key: "impact", label: "Impact, Risques & Durabilité", max: 20, color: "bg-rose-500" },
];

// ===== SCORING STARTUP (Cahier des charges 5.1) =====
const QUESTIONS_STARTUP: Question[] = [
  // AXE 1 : JURIDIQUE & GOUVERNANCE (15 pts)
  { id: "sj1", axis: "juridique", question: "Avez-vous une équipe définie ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "sj2", axis: "juridique", question: "Les rôles sont-ils clairs ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "sj3", axis: "juridique", question: "Le projet est-il enregistré ou en cours ?", options: [{ label: "Non", value: 0 }, { label: "En cours", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "sj4", axis: "juridique", question: "Avez-vous une vision claire du projet ?", options: [{ label: "Non", value: 0 }, { label: "Moyenne", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "sj5", axis: "juridique", question: "Engagement du porteur (temps, implication) ?", options: [{ label: "Faible", value: 0 }, { label: "Moyen", value: 1 }, { label: "Fort", value: 3 }], maxPoints: 3 },
  // AXE 2 : FINANCIER (25 pts)
  { id: "sf1", axis: "financier", question: "Avez-vous estimé vos coûts ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "sf2", axis: "financier", question: "Avez-vous estimé vos revenus futurs ?", options: [{ label: "Non", value: 0 }, { label: "Approximatif", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "sf3", axis: "financier", question: "Avez-vous un besoin de financement clair ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "sf4", axis: "financier", question: "Savez-vous comment générer de l'argent ?", options: [{ label: "Non", value: 0 }, { label: "Peu clair", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "sf5", axis: "financier", question: "Avez-vous une projection financière simple ?", options: [{ label: "Non", value: 0 }, { label: "Partielle", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  // AXE 3 : TECHNIQUE & OPÉRATIONNEL (20 pts)
  { id: "st1", axis: "technique", question: "Avez-vous les compétences nécessaires ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "st2", axis: "technique", question: "Avez-vous identifié les ressources nécessaires ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "st3", axis: "technique", question: "Avez-vous un plan d'action ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "st4", axis: "technique", question: "Avez-vous commencé des actions concrètes ?", options: [{ label: "Non", value: 0 }, { label: "Peu", value: 2 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "st5", axis: "technique", question: "Le projet est-il réalisable ?", options: [{ label: "Non", value: 0 }, { label: "Incertain", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  // AXE 4 : MARCHÉ & MODÈLE ÉCONOMIQUE (20 pts)
  { id: "sm1", axis: "marche", question: "Le problème est-il clairement identifié ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "sm2", axis: "marche", question: "La solution est-elle claire ?", options: [{ label: "Non", value: 0 }, { label: "Moyenne", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "sm3", axis: "marche", question: "Connaissez-vous vos clients ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "sm4", axis: "marche", question: "Existe-t-il une demande ?", options: [{ label: "Non", value: 0 }, { label: "Incertaine", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "sm5", axis: "marche", question: "Avez-vous un modèle économique ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  // AXE 5 : IMPACT, RISQUES & DURABILITÉ (20 pts)
  { id: "si1", axis: "impact", question: "Le projet a-t-il un impact positif ?", options: [{ label: "Non", value: 0 }, { label: "Faible", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "si2", axis: "impact", question: "Avez-vous identifié les risques ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "si3", axis: "impact", question: "Avez-vous prévu des solutions aux risques ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "si4", axis: "impact", question: "Le projet peut-il évoluer (scalabilité) ?", options: [{ label: "Non", value: 0 }, { label: "Incertain", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "si5", axis: "impact", question: "Le projet peut-il attirer des investisseurs ?", options: [{ label: "Non", value: 0 }, { label: "Peut-être", value: 2 }, { label: "Oui", value: 3 }], maxPoints: 3 },
];

// ===== SCORING ACTIVITÉ EXISTANTE (Cahier des charges 5.2) =====
const QUESTIONS_ACTIVITE: Question[] = [
  // AXE 1 : JURIDIQUE & GOUVERNANCE (15 pts)
  { id: "aj1", axis: "juridique", question: "Activité enregistrée officiellement ?", options: [{ label: "Non", value: 0 }, { label: "En cours", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "aj2", axis: "juridique", question: "Documents administratifs disponibles ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "aj3", axis: "juridique", question: "Rôles et responsabilités définis ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "aj4", axis: "juridique", question: "Adresse / localisation claire ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "aj5", axis: "juridique", question: "Conformité réglementaire ?", options: [{ label: "Non", value: 0 }, { label: "Partiellement", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  // AXE 2 : FINANCIER (25 pts)
  { id: "af1", axis: "financier", question: "Suivi des revenus / dépenses ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "af2", axis: "financier", question: "Bénéfice mensuel estimé ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "af3", axis: "financier", question: "Revenus réguliers ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "af4", axis: "financier", question: "Besoin de financement structuré ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "af5", axis: "financier", question: "Gestion financière claire ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  // AXE 3 : TECHNIQUE & OPÉRATIONNEL (20 pts)
  { id: "at1", axis: "technique", question: "Compétences pour gérer l'activité ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "at2", axis: "technique", question: "Ressources disponibles ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "at3", axis: "technique", question: "Plan d'action clair ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "at4", axis: "technique", question: "Activité prête à fonctionner ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  { id: "at5", axis: "technique", question: "Organisation structurée ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 1 }, { label: "Oui", value: 3 }], maxPoints: 3 },
  // AXE 4 : MARCHÉ & MODÈLE ÉCONOMIQUE (20 pts)
  { id: "am1", axis: "marche", question: "Problème réel identifié ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "am2", axis: "marche", question: "Connaissance des clients ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "am3", axis: "marche", question: "Existence d'une demande ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "am4", axis: "marche", question: "Avantage concurrentiel ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "am5", axis: "marche", question: "Stratégie commerciale ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  // AXE 5 : IMPACT, RISQUES & DURABILITÉ (20 pts)
  { id: "ai1", axis: "impact", question: "Impact positif ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 5 }], maxPoints: 5 },
  { id: "ai2", axis: "impact", question: "Risques identifiés ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "ai3", axis: "impact", question: "Solutions prévues ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "ai4", axis: "impact", question: "Durabilité de l'activité ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 4 }], maxPoints: 4 },
  { id: "ai5", axis: "impact", question: "Attractivité pour investisseurs ?", options: [{ label: "Non", value: 0 }, { label: "Partiel", value: 2 }, { label: "Oui", value: 3 }], maxPoints: 3 },
];

interface MPScoringProps {
  onBack?: () => void;
}

const MPScoring = ({ onBack }: MPScoringProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scoringType, setScoringType] = useState<"startup" | "activite" | null>(null);
  const [currentAxisIdx, setCurrentAxisIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedProject, setSelectedProject] = useState("");
  const [projects, setProjects] = useState<{ id: string; title: string; activity_type: string | null }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingResults, setExistingResults] = useState<any[]>([]);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [lastScoreResult, setLastScoreResult] = useState<any>(null);

  const QUESTIONS = scoringType === "startup" ? QUESTIONS_STARTUP : QUESTIONS_ACTIVITE;

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data } = await supabase.from("mp_projects").select("id, title, activity_type").eq("user_id", user.id);
      if (data) setProjects(data);
    };
    const fetchResults = async () => {
      const { data } = await supabase.from("mp_scoring_results").select("*").eq("user_id", user.id).eq("is_active", true).order("created_at", { ascending: false });
      if (data) setExistingResults(data);
    };
    fetchProjects();
    fetchResults();
  }, [user]);

  // Auto-detect scoring type based on project activity_type
  useEffect(() => {
    if (!selectedProject) return;
    const project = projects.find(p => p.id === selectedProject);
    if (project?.activity_type === "startup") {
      setScoringType("startup");
    } else {
      setScoringType("activite");
    }
    setAnswers({});
    setCurrentAxisIdx(0);
  }, [selectedProject, projects]);

  const currentAxis = AXES[currentAxisIdx];
  const axisQuestions = QUESTIONS.filter((q) => q.axis === currentAxis.key);
  const allAnswered = axisQuestions.every((q) => answers[q.id] !== undefined);
  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;

  const calculateScores = () => {
    const scores: Record<string, number> = {};
    AXES.forEach((axis) => {
      const qs = QUESTIONS.filter((q) => q.axis === axis.key);
      scores[axis.key] = qs.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
    });
    scores.global = Object.values(scores).reduce((a, b) => a + b, 0);
    return scores;
  };

  const getNiveau = (score: number) => {
    if (score >= 80) return "financable";
    if (score >= 60) return "prometteur";
    if (score >= 40) return "fragile";
    return "non_financable";
  };

  const getNiveauLabel = (niveau: string) => {
    const map: Record<string, string> = { financable: "Finançable", prometteur: "Prometteur", fragile: "Fragile", non_financable: "Non finançable" };
    return map[niveau] || niveau;
  };

  const getNiveauColor = (niveau: string) => {
    const map: Record<string, string> = { financable: "text-emerald-600", prometteur: "text-blue-600", fragile: "text-amber-600", non_financable: "text-rose-600" };
    return map[niveau] || "";
  };

  const handleSave = async () => {
    if (!user || !selectedProject) return;
    setSaving(true);
    const scores = calculateScores();
    const niveau = getNiveau(scores.global);

    await supabase.from("mp_scoring_results").update({ is_active: false }).eq("user_id", user.id).eq("project_id", selectedProject);

    const forces: string[] = [];
    const faiblesses: string[] = [];
    const recommandations: string[] = [];

    AXES.forEach(axis => {
      const pct = (scores[axis.key] / axis.max) * 100;
      if (pct >= 70) forces.push(`${axis.label} : solide (${scores[axis.key]}/${axis.max})`);
      else if (pct < 40) {
        faiblesses.push(`${axis.label} : à renforcer (${scores[axis.key]}/${axis.max})`);
        recommandations.push(`Améliorer votre ${axis.label.toLowerCase()}`);
      }
    });

    const { error } = await supabase.from("mp_scoring_results").insert({
      user_id: user.id,
      project_id: selectedProject,
      score_juridique: scores.juridique,
      score_financier: scores.financier,
      score_technique: scores.technique,
      score_marche: scores.marche,
      score_impact: scores.impact,
      score_global: scores.global,
      niveau,
      answers,
      forces,
      faiblesses,
      recommandations,
      is_active: true,
    });

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "📊 MIPROJET SCORE calculé",
        message: `Score : ${scores.global}/100 – ${getNiveauLabel(niveau)}. ${scoringType === "startup" ? "Parcours Startup" : "Parcours Activité existante"}`,
        type: "scoring",
        link: "/miprojet-plus/app",
      });

      const projectTitle = projects.find(p => p.id === selectedProject)?.title || "Mon projet";
      setLastScoreResult({
        score: scores.global,
        niveau,
        scores: { juridique: scores.juridique, financier: scores.financier, technique: scores.technique, marche: scores.marche, impact: scores.impact },
        projectTitle,
        scoringType,
      });
      setShowResultPopup(true);
      setShowResults(true);
    }
  };

  const handleExportPDF = () => {
    const result = lastScoreResult || (existingResults.length > 0 ? {
      score: existingResults[0].score_global,
      niveau: existingResults[0].niveau,
      scores: {
        juridique: existingResults[0].score_juridique,
        financier: existingResults[0].score_financier,
        technique: existingResults[0].score_technique,
        marche: existingResults[0].score_marche,
        impact: existingResults[0].score_impact,
      },
      projectTitle: projects.find(p => p.id === existingResults[0].project_id)?.title || "Mon projet",
    } : null);

    if (result) {
      exportScoringPDF({
        ...result,
        date: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
      });
    }
  };

  // ===== RESULTS VIEW =====
  if (showResults || (existingResults.length > 0 && answeredCount === 0)) {
    const scores = showResults ? calculateScores() : null;
    const result = showResults
      ? { score_global: scores!.global, score_juridique: scores!.juridique, score_financier: scores!.financier, score_technique: scores!.technique, score_marche: scores!.marche, score_impact: scores!.impact, niveau: getNiveau(scores!.global), project_id: selectedProject }
      : existingResults[0];

    return (
      <div className="space-y-6">
        {showResultPopup && lastScoreResult && user && (
          <ScoringResultPopup
            open={showResultPopup}
            onClose={() => setShowResultPopup(false)}
            score={lastScoreResult.score}
            niveau={lastScoreResult.niveau}
            scores={lastScoreResult.scores}
            projectTitle={lastScoreResult.projectTitle}
            userId={user.id}
            onExportPDF={handleExportPDF}
          />
        )}

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-bold">MIPROJET SCORE</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowResults(false); setAnswers({}); setCurrentAxisIdx(0); setScoringType(null); }}>
              Nouvelle évaluation
            </Button>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-muted/50 mb-4">
              <span className={`text-4xl font-bold ${getNiveauColor(result.niveau)}`}>{result.score_global}</span>
            </div>
            <p className="text-sm text-muted-foreground">sur 100</p>
            <p className={`text-lg font-bold mt-2 ${getNiveauColor(result.niveau)}`}>{getNiveauLabel(result.niveau)}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {AXES.map((axis) => {
            const key = `score_${axis.key}` as keyof typeof result;
            const score = Number(result[key]) || 0;
            return (
              <Card key={axis.key} className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className={`w-10 h-10 rounded-full ${axis.color} mx-auto mb-2 flex items-center justify-center text-white font-bold text-sm`}>{score}</div>
                  <p className="text-xs text-muted-foreground font-medium">{axis.label}</p>
                  <p className="text-[10px] text-muted-foreground/60">max {axis.max}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {existingResults.length > 1 && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Historique des évaluations</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {existingResults.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="flex justify-between text-sm p-2 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                    <span className={`font-bold ${getNiveauColor(r.niveau)}`}>{r.score_global}/100</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ===== EVALUATION FORM =====
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">MIPROJET SCORE – Évaluation</h2>

      {projects.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-foreground font-medium">Créez d'abord un projet</p>
            <p className="text-sm text-muted-foreground mt-1">Vous devez avoir un projet pour lancer une évaluation</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Projet à évaluer</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger><SelectValue placeholder="Sélectionnez un projet" /></SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title} {p.activity_type === "startup" ? "🚀" : "🏢"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProject && scoringType && (
            <>
              {/* Scoring type indicator */}
              <Card className={`border-0 shadow-sm ${scoringType === "startup" ? "bg-purple-50" : "bg-blue-50"}`}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{scoringType === "startup" ? "🚀" : "🏢"}</span>
                  <div>
                    <p className="font-semibold text-sm">
                      {scoringType === "startup" ? "Parcours Startup / Projet en création" : "Parcours Activité existante (PME / Micro-activité)"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scoringType === "startup"
                        ? "Évaluation basée sur les prévisions, la cohérence du modèle et le potentiel"
                        : "Évaluation basée sur les données réelles, l'historique et la performance"
                      }
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => setScoringType(scoringType === "startup" ? "activite" : "startup")}>
                    Changer
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progression</span>
                  <span className="font-medium">{answeredCount}/{totalQuestions}</span>
                </div>
                <Progress value={(answeredCount / totalQuestions) * 100} className="h-2" />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-2">
                {AXES.map((axis, idx) => {
                  const qs = QUESTIONS.filter((q) => q.axis === axis.key);
                  const done = qs.every((q) => answers[q.id] !== undefined);
                  return (
                    <button key={axis.key} onClick={() => setCurrentAxisIdx(idx)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                        idx === currentAxisIdx ? "bg-emerald-100 text-emerald-700" : done ? "bg-muted text-emerald-600" : "bg-muted/50 text-muted-foreground"
                      }`}>
                      {done && <CheckCircle className="h-3 w-3" />}
                      {axis.label}
                    </button>
                  );
                })}
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${currentAxis.color}`} />
                    <CardTitle className="text-base">{currentAxis.label}</CardTitle>
                    <span className="text-xs text-muted-foreground ml-auto">{currentAxis.max} pts max</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {axisQuestions.map((q) => (
                    <div key={q.id} className="space-y-3">
                      <p className="text-sm font-medium text-foreground">{q.question}</p>
                      <RadioGroup value={answers[q.id]?.toString()} onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v) }))}>
                        {q.options.map((opt) => (
                          <div key={opt.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={opt.value.toString()} id={`${q.id}-${opt.value}`} />
                            <Label htmlFor={`${q.id}-${opt.value}`} className="text-sm text-muted-foreground cursor-pointer">
                              {opt.label} <span className="text-muted-foreground/50">({opt.value} pts)</span>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" disabled={currentAxisIdx === 0} onClick={() => setCurrentAxisIdx((i) => i - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Précédent
                </Button>
                {currentAxisIdx < AXES.length - 1 ? (
                  <Button disabled={!allAnswered} onClick={() => setCurrentAxisIdx((i) => i + 1)} className="bg-emerald-600 hover:bg-emerald-700">
                    Suivant <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button disabled={answeredCount < totalQuestions || saving} onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Calculer mon score"}
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MPScoring;
