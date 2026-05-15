import { useState, useEffect } from "react";
import { ProjectCard } from "./ProjectCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import projectPoultryFarm from "@/assets/project-poultry-farm.jpg";
import projectDigitalTraining from "@/assets/project-digital-training.jpg";
import projectOrganicFarming from "@/assets/project-organic-farming.jpg";

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

const fallbackImages = [projectPoultryFarm, projectDigitalTraining, projectOrganicFarming];

export const FeaturedProjects = () => {
  const { t } = useLanguage();
  const [dbProjects, setDbProjects] = useState<DBProject[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase
        .from("projects")
        .select("id, title, description, category, city, country, status, risk_score, image_url, sector")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      if (data) setDbProjects(data);
    };
    fetchProjects();
  }, []);

  const statusMap: Record<string, "in_structuring" | "validated" | "oriented"> = {
    published: "validated",
    in_progress: "in_structuring",
    completed: "oriented",
    draft: "in_structuring",
  };

  const projects = dbProjects.length > 0
    ? dbProjects.map((p, i) => ({
        id: p.id,
        title: p.title,
        description: p.description || "",
        category: p.category || p.sector || "Projet",
        location: [p.city, p.country].filter(Boolean).join(", ") || "Afrique",
        fundingType: "Investissement",
        status: statusMap[p.status || "published"] || "validated",
        score: (p.risk_score as "A" | "B" | "C" | "D") || "B",
        image: p.image_url || fallbackImages[i % fallbackImages.length],
      }))
    : [
        {
          id: undefined as string | undefined,
          title: "Ferme Avicole Moderne de Tiassalé",
          description: "Élevage de poulets de chair et poules pondeuses avec 50,000 sujets.",
          category: "Agriculture",
          location: "Tiassalé, Côte d'Ivoire",
          fundingType: "Investissement en capital",
          status: "validated" as const,
          score: "A" as const,
          image: projectPoultryFarm,
        },
        {
          id: undefined as string | undefined,
          title: "Centre Numérique de Formation Lomé",
          description: "Formation de 500 jeunes par an en développement web et marketing digital.",
          category: "Éducation & Formation",
          location: "Lomé, Togo",
          fundingType: "Subvention & Partenariat",
          status: "in_structuring" as const,
          score: "B" as const,
          image: projectDigitalTraining,
        },
        {
          id: undefined as string | undefined,
          title: "Coopérative Agricole Bio du Sine-Saloum",
          description: "Regroupement de 200 agriculteurs biologiques produisant riz, mil et légumes.",
          category: "Agriculture Bio",
          location: "Kaolack, Sénégal",
          fundingType: "Financement Mixte",
          status: "oriented" as const,
          score: "A" as const,
          image: projectOrganicFarming,
        },
      ];

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
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
      </div>
    </section>
  );
};
