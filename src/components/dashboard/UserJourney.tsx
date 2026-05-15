import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, Loader2, Compass, Rocket, ArrowRight } from "lucide-react";

type JourneyType = "existing" | "startup";

const JOURNEYS: Record<JourneyType, { title: string; icon: any; steps: { title: string; description: string }[] }> = {
  existing: {
    title: "Activités existantes",
    icon: Compass,
    steps: [
      { title: "Diagnostic", description: "Évaluation de l'activité existante, forces et faiblesses" },
      { title: "Organisation", description: "Mise en place d'une organisation interne efficace" },
      { title: "Structuration financière", description: "Comptabilité, gestion de trésorerie, prévisions" },
      { title: "Stabilisation", description: "Consolidation des opérations et processus clés" },
      { title: "Crédibilité", description: "Documentation, conformité et image professionnelle" },
      { title: "Accès au financement", description: "Préparation du dossier et mise en relation bailleurs" },
    ],
  },
  startup: {
    title: "Startup / Nouveau projet",
    icon: Rocket,
    steps: [
      { title: "Définition de l'idée", description: "Clarifier l'idée et la vision du projet" },
      { title: "Problème & solution", description: "Valider le problème ciblé et la solution proposée" },
      { title: "Modèle économique", description: "Définir le business model et les sources de revenus" },
      { title: "Étude de marché", description: "Analyse marché, clients cibles, concurrence" },
      { title: "Structuration", description: "Statut juridique, organisation, plan opérationnel" },
      { title: "Préparation financement", description: "Business plan financier, pitch et levée de fonds" },
    ],
  },
};

interface JourneyRow {
  id: string;
  journey_type: string;
  current_step: number;
  steps_completed: number[] | null;
  status: string | null;
}

export const UserJourney = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<JourneyType>("existing");
  const [journeys, setJourneys] = useState<Record<string, JourneyRow | null>>({ existing: null, startup: null });

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_journeys")
      .select("*")
      .eq("user_id", user.id);
    const map: Record<string, JourneyRow | null> = { existing: null, startup: null };
    (data || []).forEach((j: any) => { map[j.journey_type] = j; });
    setJourneys(map);
    setLoading(false);
  };

  const startJourney = async (type: JourneyType) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("user_journeys")
      .insert({ user_id: user.id, journey_type: type, current_step: 1, steps_completed: [], status: "active" })
      .select()
      .single();
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    setJourneys(prev => ({ ...prev, [type]: data as any }));
    toast({ title: "Parcours démarré", description: JOURNEYS[type].title });
  };

  const toggleStep = async (type: JourneyType, stepIdx: number) => {
    const j = journeys[type];
    if (!j || !user) return;
    const completed = new Set(j.steps_completed || []);
    if (completed.has(stepIdx)) completed.delete(stepIdx);
    else completed.add(stepIdx);
    const arr = Array.from(completed).sort((a, b) => a - b);
    const next = arr.length === JOURNEYS[type].steps.length ? "completed" : "active";
    const newCurrent = Math.min(JOURNEYS[type].steps.length, Math.max(...arr, 0) + 1);
    const { data, error } = await supabase
      .from("user_journeys")
      .update({ steps_completed: arr, current_step: newCurrent, status: next })
      .eq("id", j.id)
      .select()
      .single();
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    setJourneys(prev => ({ ...prev, [type]: data as any }));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const renderJourney = (type: JourneyType) => {
    const def = JOURNEYS[type];
    const j = journeys[type];
    const completed = new Set(j?.steps_completed || []);
    const progress = j ? Math.round((completed.size / def.steps.length) * 100) : 0;
    const Icon = def.icon;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10"><Icon className="h-6 w-6 text-primary" /></div>
              <div>
                <CardTitle>{def.title}</CardTitle>
                <CardDescription>{def.steps.length} étapes structurées</CardDescription>
              </div>
            </div>
            {j ? (
              <Badge variant={j.status === "completed" ? "default" : "secondary"}>
                {j.status === "completed" ? "Terminé" : `Étape ${j.current_step}/${def.steps.length}`}
              </Badge>
            ) : (
              <Button size="sm" onClick={() => startJourney(type)}>Démarrer <ArrowRight className="h-4 w-4 ml-1" /></Button>
            )}
          </div>
          {j && (
            <div className="pt-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{progress}% complété</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {def.steps.map((step, idx) => {
              const isDone = completed.has(idx);
              const isCurrent = j && idx === j.current_step - 1 && !isDone;
              return (
                <li
                  key={idx}
                  className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                    isDone ? "bg-success/5 border-success/30" : isCurrent ? "bg-primary/5 border-primary/30" : "border-border"
                  } ${j ? "cursor-pointer hover:bg-muted/50" : "opacity-60"}`}
                  onClick={() => j && toggleStep(type, idx)}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isCurrent ? "text-primary" : "text-muted-foreground"}`} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">{String(idx + 1).padStart(2, "0")}</span>
                      <p className={`font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>{step.title}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Parcours utilisateur</h2>
        <p className="text-muted-foreground">Suivez les étapes structurées pour faire avancer votre projet</p>
      </div>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as JourneyType)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="existing"><Compass className="h-4 w-4 mr-2" />Activités existantes</TabsTrigger>
          <TabsTrigger value="startup"><Rocket className="h-4 w-4 mr-2" />Startup</TabsTrigger>
        </TabsList>
        <TabsContent value="existing" className="mt-4">{renderJourney("existing")}</TabsContent>
        <TabsContent value="startup" className="mt-4">{renderJourney("startup")}</TabsContent>
      </Tabs>
    </div>
  );
};
