import { useState, useEffect } from "react";
import { ProjectCard } from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface DBProject {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  city: string | null;
  country: string | null;
  status: string | null;
  risk_score: string | null;
  image_url: string | null;
  sector: string | null;
}

export const FeaturedProjects = () => {
  const { t } = useLanguage();
  const [dbProjects, setDbProjects] = useState<DBProject[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      // Only show projects flagged as success/accompagnés by admin (status = 'completed' OR 'published' with risk_score).
      // No more hard-coded fallbacks — section reappears only when real success projects exist.
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, category, city, country, status, risk_score, image_url, sector")
        .in("status", ["completed", "published"])
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setDbProjects(data);
      setLoaded(true);
    };
    fetchProjects();
  }, []);

  const statusMap: Record<string, "in_structuring" | "validated" | "oriented"> = {
    published: "validated",
    in_progress: "in_structuring",
    completed: "oriented",
    draft: "in_structuring",
  };

  const projects = dbProjects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description || "",
    category: p.category || p.sector || "Projet",
    location: [p.city, p.country].filter(Boolean).join(", ") || "Afrique",
    fundingType: "Investissement",
    status: statusMap[p.status || "published"] || "validated",
    score: (p.risk_score as "A" | "B" | "C" | "D") || "B",
    image: p.image_url || "/placeholder.svg",
  }));

  // Hide the whole section until at least one real success project exists.
  if (loaded && projects.length === 0) {
    return null;
  }

  return (
    <section className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 sm:mb-12 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
            {t('projects.featuredTitle')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('projects.featuredSubtitle')}
          </p>
        </div>

        {projects.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {projects.map((project) => (
                <ProjectCard key={project.id || project.title} {...project} />
              ))}
            </div>

            <Alert className="mt-8 sm:mt-12 bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-sm sm:text-base text-foreground">{t('projects.notice.title')}</AlertTitle>
              <AlertDescription className="text-xs sm:text-sm text-muted-foreground">
                {t('projects.notice.description')}
              </AlertDescription>
            </Alert>

            <div className="mt-8 sm:mt-12 text-center">
              <Link to="/projects">
                <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  {t('projects.viewAll')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto text-center p-10 rounded-2xl border border-dashed border-primary/30 bg-primary/5">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Bientôt — nos premiers projets accompagnés à succès</h3>
            <p className="text-muted-foreground text-sm">
              Cette section affichera les projets réels accompagnés par MIPROJET dès leur publication par l'équipe.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
