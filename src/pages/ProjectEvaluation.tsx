import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { EvaluationResult } from "@/components/evaluation/EvaluationResult";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, FileText, Award, Target } from "lucide-react";

interface Evaluation {
  id: string;
  project_id: string;
  score_global: number;
  score_porteur: number;
  score_projet: number;
  score_financier: number;
  score_maturite: number;
  score_impact: number;
  score_equipe: number;
  niveau: string;
  resume: string;
  forces: string[];
  faiblesses: string[];
  recommandations: string[];
  actions_structuration: string[];
  messages_strategiques: string[];
  is_certified: boolean;
  certified_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
}

const ProjectEvaluation = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Évaluation du projet - MIPROJET SCORE | MIPROJET";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!projectId || !user) return;

      try {
        // Fetch project
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .eq("owner_id", user.id)
          .single();

        if (projectError) {
          setError("Projet non trouvé ou vous n'avez pas accès à ce projet.");
          setLoading(false);
          return;
        }

        setProject(projectData);

        // Fetch evaluation
        const { data: evalData, error: evalError } = await supabase
          .from("project_evaluations")
          .select("*")
          .eq("project_id", projectId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (evalData) {
          setEvaluation({
            ...evalData,
            forces: (evalData.forces as string[]) || [],
            faiblesses: (evalData.faiblesses as string[]) || [],
            recommandations: (evalData.recommandations as string[]) || [],
            actions_structuration: (evalData.actions_structuration as string[]) || [],
            messages_strategiques: (evalData.messages_strategiques as string[]) || [],
          });
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    if (user && projectId) {
      fetchData();
    }
  }, [projectId, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-24">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Projet non trouvé</h2>
              <p className="text-muted-foreground mb-6">{error || "Ce projet n'existe pas ou vous n'y avez pas accès."}</p>
              <Link to="/dashboard">
                <Button>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-24">
          <Card className="max-w-lg mx-auto text-center py-12">
            <CardContent>
              <Target className="h-16 w-16 mx-auto text-primary/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Évaluation en cours</h2>
              <p className="text-muted-foreground mb-2">
                Votre projet "<strong>{project.title}</strong>" est en cours d'évaluation par nos experts.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Vous recevrez une notification dès que l'évaluation sera disponible.
              </p>
              <Link to="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour au tableau de bord
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-24">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">MIPROJET SCORE</h1>
            </div>
            <p className="text-muted-foreground">Évaluation du projet: {project.title}</p>
          </div>
        </div>

        {/* Evaluation Result */}
        <EvaluationResult
          evaluation={evaluation}
          projectTitle={project.title}
          onClose={() => navigate("/dashboard")}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ProjectEvaluation;
