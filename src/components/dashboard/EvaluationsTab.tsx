import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Award, Eye, FileText, Download, Star, TrendingUp } from "lucide-react";

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category: string | null;
}

interface Evaluation {
  id: string;
  project_id: string;
  score_global: number;
  niveau: string;
  is_certified: boolean;
  created_at: string;
  project?: {
    title: string;
  };
}

interface EvaluationsTabProps {
  projects: Project[];
}

const getLevelBadge = (niveau: string) => {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    A: { variant: "default", label: "Niveau A - Excellent" },
    B: { variant: "default", label: "Niveau B - Très bon" },
    C: { variant: "secondary", label: "Niveau C - Bon" },
    D: { variant: "outline", label: "Niveau D - À améliorer" },
  };
  const c = config[niveau] || { variant: "secondary", label: niveau };
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-blue-500";
  if (score >= 40) return "text-yellow-500";
  return "text-orange-500";
};

export const EvaluationsTab = ({ projects }: EvaluationsTabProps) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      if (projects.length === 0) {
        setLoading(false);
        return;
      }

      const projectIds = projects.map(p => p.id);
      const { data, error } = await (supabase
        .from('project_evaluations')
        .select('id, project_id, score_global, niveau, is_certified, created_at')
        .in('project_id', projectIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false }) as any);

      if (!error && data) {
        // Map project titles to evaluations
        const evalsWithProjects = data.map(e => ({
          ...e,
          project: projects.find(p => p.id === e.project_id)
        }));
        setEvaluations(evalsWithProjects);
      }
      setLoading(false);
    };

    fetchEvaluations();
  }, [projects]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Aucune évaluation disponible</h3>
          <p className="text-muted-foreground mb-4">
            Vos projets seront évalués par nos experts MIPROJET après soumission.
            Vous recevrez une notification dès que votre évaluation sera prête.
          </p>
          <Link to="/submit-project">
            <Button>Soumettre un projet</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Star className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">MIPROJET SCORE</h3>
              <p className="text-muted-foreground">
                {evaluations.length} projet(s) évalué(s) • 
                {evaluations.filter(e => e.is_certified).length} certifié(s)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evaluations.map((evaluation) => {
          const projectTitle = projects.find(p => p.id === evaluation.project_id)?.title || "Projet";
          
          return (
            <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg line-clamp-1">
                    {projectTitle}
                  </CardTitle>
                  {evaluation.is_certified && (
                    <Badge variant="default" className="bg-emerald-500">
                      <Award className="h-3 w-3 mr-1" />
                      Certifié
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs sm:text-sm">
                  Évalué le {new Date(evaluation.created_at).toLocaleDateString('fr-FR')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Score display */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Score global</span>
                    <span className={`text-2xl font-bold ${getScoreColor(evaluation.score_global)}`}>
                      {evaluation.score_global}/100
                    </span>
                  </div>
                  
                  <Progress value={evaluation.score_global} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    {getLevelBadge(evaluation.niveau)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link to={`/project-evaluation/${evaluation.project_id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        Voir détails
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
