import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield, TrendingUp, FileText, Users, Award, ArrowRight,
  Search, Filter, Download, MapPin, Banknote, Briefcase,
  Heart, Lightbulb, Building2, Loader2, BookOpen
} from "lucide-react";

function setMeta(title: string, description: string) {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
}

const benefits = [
  {
    icon: Shield,
    title: "Projets Structurés",
    description: "Nous identifions, analysons et structurons des projets à fort potentiel de rentabilité.",
    color: "bg-primary/10 text-primary"
  },
  {
    icon: Award,
    title: "Analyse de Viabilité",
    description: "Chaque projet dispose d'une analyse de viabilité économique et d'un dossier d'investissement complet.",
    color: "bg-success/10 text-success"
  },
  {
    icon: FileText,
    title: "Dossiers Complets",
    description: "Business plan, étude de faisabilité, analyse des risques et projections financières disponibles.",
    color: "bg-info/10 text-info"
  },
  {
    icon: Users,
    title: "Mise en Relation",
    description: "Nous facilitons la collaboration entre investisseurs et porteurs de projets crédibles.",
    color: "bg-warning/10 text-warning"
  },
];

const investorProfiles = [
  "Investisseurs privés", "Entrepreneurs", "Membres de la diaspora",
  "Entreprises", "Fonds d'investissement", "Institutions"
];

const investmentSectors = [
  { icon: Heart, label: "Santé & Infrastructures médicales" },
  { icon: Lightbulb, label: "Agro-industrie & Transformation agricole" },
  { icon: Building2, label: "Immobilier & Résidences locatives" },
  { icon: TrendingUp, label: "Logistique & Entrepôts" },
  { icon: Briefcase, label: "Industrie de transformation" },
  { icon: Shield, label: "Énergie & Infrastructures" },
];

interface Project {
  id: string;
  title: string;
  description: string | null;
  sector: string | null;
  country: string | null;
  city: string | null;
  funding_goal: number | null;
  risk_score: string | null;
  status: string | null;
  category: string | null;
  image_url: string | null;
  documents: any;
}

const Investors = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSector, setFilterSector] = useState("all");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  useEffect(() => {
    setMeta(
      "Investisseurs | MIPROJET",
      "Découvrez des projets africains structurés et prêts pour l'investissement."
    );
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (data) setProjects(data);
    setLoading(false);
  };

  const filteredProjects = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = filterSector === "all" || p.sector === filterSector;
    return matchSearch && matchSector;
  });

  const uniqueSectors = [...new Set(projects.map(p => p.sector).filter(Boolean))];

  const handleDownload = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowLeadForm(true);
  };

  const handleLeadSuccess = () => {
    setShowLeadForm(false);
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      if (project?.documents) {
        // Redirect to project detail
        navigate(`/projects/${selectedProjectId}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary">INVESTISSEURS</Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Investir dans des opportunités réelles en Afrique
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            L'Afrique offre aujourd'hui certaines des opportunités d'investissement les plus dynamiques au monde.
            MIPROJET identifie, analyse et structure des projets à fort potentiel pour faciliter la mise en relation
            entre investisseurs et porteurs de projets crédibles.
          </p>
        </div>

        {/* Top CTA — Rejoindre le réseau */}
        <Card className="mb-12 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Rejoindre notre réseau d'investisseurs</h2>
                <p className="text-muted-foreground">
                  Recevez en exclusivité nos meilleures opportunités d'investissement structurées en Afrique.
                </p>
              </div>
              <Button size="lg" className="w-full md:w-auto whitespace-normal" onClick={() => { setSelectedProjectId(null); setShowLeadForm(true); }}>
                S'inscrire <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                <CardHeader>
                  <div className={`p-3 rounded-xl w-fit mx-auto ${benefit.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Investment Sectors */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">Secteurs d'investissement</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {investmentSectors.map((sector, i) => {
              const Icon = sector.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <Icon className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-medium text-sm">{sector.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* E-book CTA */}
        <Card className="mb-16 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="flex flex-col md:flex-row items-center justify-between p-8 gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/20 rounded-full shrink-0">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">
                  🎁 Guide gratuit : 50 opportunités d'investissement rentables en Côte d'Ivoire
                </h3>
                <p className="text-muted-foreground">
                  Découvrez notre sélection exclusive de 50 projets d'investissement analysés et structurés par nos experts.
                </p>
              </div>
            </div>
            <Link to="/ebook">
              <Button size="lg" className="whitespace-nowrap gap-2">
                <Download className="h-4 w-4" />
                Télécharger le guide
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Projets disponibles pour investissement</h2>
          <p className="text-muted-foreground mb-6">
            Consultez nos projets structurés et téléchargez les dossiers techniques
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher un projet..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterSector} onValueChange={setFilterSector}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Secteur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les secteurs</SelectItem>
                {uniqueSectors.map(s => <SelectItem key={s!} value={s!}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun projet disponible</h3>
              <p className="text-muted-foreground">De nouveaux projets seront bientôt publiés.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map(project => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  {project.image_url && (
                    <div className="h-40 overflow-hidden rounded-t-lg">
                      <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2 flex-wrap">
                      {project.sector && <Badge variant="outline">{project.sector}</Badge>}
                      {project.risk_score && (
                        <Badge className={project.risk_score === 'A' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                          Score {project.risk_score}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                    <CardDescription className="line-clamp-3">{project.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {(project.country || project.city) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {[project.city, project.country].filter(Boolean).join(", ")}
                        </div>
                      )}
                      {project.funding_goal && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          {project.funding_goal.toLocaleString()} FCFA
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => navigate(`/projects/${project.id}`)}>
                      Voir détails
                    </Button>
                    <Button className="flex-1 gap-1" onClick={() => handleDownload(project.id)}>
                      <Download className="h-4 w-4" />
                      Télécharger
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Investor Profiles */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-center mb-6">Profils d'investisseurs</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {investorProfiles.map((p, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-2 px-4">{p}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Rejoindre notre réseau d'investisseurs</h3>
                <p className="text-muted-foreground">
                  Recevez nos meilleures opportunités d'investissement sélectionnées en Afrique.
                </p>
              </div>
              <Button size="lg" onClick={() => { setSelectedProjectId(null); setShowLeadForm(true); }}>
                S'inscrire <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            <strong>Note importante :</strong> MIPROJET n'est pas un intermédiaire financier et ne collecte aucun fonds.
            Notre rôle se limite à la structuration, la validation et l'orientation des projets vers des partenaires adaptés.
          </p>
        </div>
      </main>
      <Footer />

      <LeadCaptureForm
        open={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSuccess={handleLeadSuccess}
        leadSource="investor"
        sourceId={selectedProjectId || undefined}
        title="Accéder aux dossiers d'investissement"
        description="Renseignez vos informations pour télécharger les documents techniques des projets"
        showInvestorFields={true}
      />
    </div>
  );
};

export default Investors;
