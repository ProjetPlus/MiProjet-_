import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PaymentModal } from "@/components/PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Calendar, Users, Target, TrendingUp, Share2, Heart,
  MessageCircle, FileText, Clock, Shield, Award, ArrowLeft, Hash,
  ClipboardList, BarChart3, CheckCircle, AlertTriangle, ArrowRight
} from "lucide-react";
import { formatProjectDisplayId } from "@/lib/projectId";
import { interpretScore, getMaturityLevel, EVALUATION_AXES } from "@/lib/evaluation";

interface Project {
  id: string;
  display_id?: string | null;
  title: string;
  description: string;
  category: string;
  sector?: string | null;
  country: string;
  city: string;
  funding_goal: number;
  funds_raised: number;
  status: string;
  risk_score: string;
  created_at: string;
  owner_id: string;
  fonds_disponibles?: string | null;
  documents?: any;
  image_url?: string | null;
}

interface Evaluation {
  id: string;
  score_global: number;
  score_juridique?: number;
  score_financier?: number;
  score_technique?: number;
  score_marche?: number;
  score_impact?: number;
  niveau?: string | null;
  niveau_maturite?: number | null;
  interpretation?: string | null;
  resume?: string | null;
  forces?: string[] | null;
  faiblesses?: string[] | null;
  recommandations?: string[] | null;
  prochaines_etapes?: string[] | null;
  parcours_recommande?: string | null;
  answers?: Record<string, any> | null;
  created_at: string;
}

interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [contributorsCount, setContributorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchUpdates();
      fetchContributors();
      fetchEvaluation();
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, [id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: t('common.error'),
        description: "Impossible de charger le projet",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdates = async () => {
    try {
      const { data } = await (supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false }) as any);

      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    }
  };

  const fetchEvaluation = async () => {
    try {
      const { data } = await (supabase
        .from("project_evaluations")
        .select("*")
        .eq("project_id", id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle() as any);
      if (data) setEvaluation(data);
    } catch (e) {
      console.error("Eval fetch error", e);
    }
  };

  const fetchContributors = async () => {
    try {
      const { count } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      setContributorsCount(count || 0);
    } catch (error) {
      console.error('Error fetching contributors:', error);
    }
  };

  const handleInvest = () => {
    if (!user) {
      toast({
        title: t('auth.required'),
        description: t('auth.loginToInvest') || "Connectez-vous pour investir",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    setShowPaymentModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 md:pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">{t('projects.notFound') || "Projet non trouvé"}</h1>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back') || "Retour aux projets"}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const progressPercent = project.funding_goal > 0 
    ? Math.min((project.funds_raised / project.funding_goal) * 100, 100) 
    : 0;
  
  const daysRemaining = 30; // Placeholder - would be calculated from deadline

  const riskColors: Record<string, string> = {
    'A': 'bg-success text-success-foreground',
    'B': 'bg-warning text-warning-foreground',
    'C': 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-28 md:pt-32 pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-hero py-12">
          <div className="container mx-auto px-4">
            <Button 
              variant="ghost" 
              className="text-primary-foreground mb-4"
              onClick={() => navigate('/projects')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back') || "Retour"}
            </Button>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="font-mono">
                    <Hash className="h-3 w-3 mr-1" />
                    {formatProjectDisplayId(project.display_id, project.id)}
                  </Badge>
                  {project.category && <Badge variant="secondary">{project.category}</Badge>}
                  {project.risk_score && (
                    <Badge className={riskColors[project.risk_score] || 'bg-muted'}>
                      Score: {project.risk_score}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30">
                    <Shield className="h-3 w-3 mr-1" />
                    {t('projects.verified') || "Vérifié MIPROJET"}
                  </Badge>
                </div>
                
                <h1 className="text-4xl font-bold text-primary-foreground mb-4">{project.title}</h1>
                
                <div className="flex items-center gap-4 text-primary-foreground/80 mb-6">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {project.city}, {project.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="premium" size="lg" onClick={handleInvest}>
                    <Target className="mr-2 h-5 w-5" />
                    {t('projects.invest') || "Investir"}
                  </Button>
                  <Button variant="outline" size="lg" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
                    <Share2 className="mr-2 h-4 w-4" />
                    {t('common.share') || "Partager"}
                  </Button>
                  <Button variant="ghost" size="icon" className="text-primary-foreground">
                    <Heart className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Funding Card */}
              <Card className="bg-card/95 backdrop-blur">
                <CardContent className="pt-6">
                  <div className="text-center mb-6">
                    <p className="text-4xl font-bold text-primary">
                      {project.funds_raised.toLocaleString()} FCFA
                    </p>
                    <p className="text-muted-foreground">
                      {t('projects.raised') || "collectés"} sur {project.funding_goal.toLocaleString()} FCFA
                    </p>
                  </div>

                  <Progress value={progressPercent} className="h-3 mb-4" />

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">{progressPercent.toFixed(0)}%</p>
                      <p className="text-sm text-muted-foreground">{t('projects.funded') || "Financé"}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{contributorsCount}</p>
                      <p className="text-sm text-muted-foreground">{t('projects.investors') || "Investisseurs"}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{daysRemaining}</p>
                      <p className="text-sm text-muted-foreground">{t('projects.daysLeft') || "Jours restants"}</p>
                    </div>
                  </div>

                  <Button className="w-full mt-6" size="lg" onClick={handleInvest}>
                    {t('projects.investNow') || "Investir maintenant"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="description" className="max-w-4xl mx-auto">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
                <TabsTrigger value="details">Données détaillées</TabsTrigger>
                <TabsTrigger value="updates">Actualités</TabsTrigger>
                <TabsTrigger value="team">Équipe</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="mt-6">
                <Card>
                  <CardContent className="pt-6 prose max-w-none">
                    <div className="whitespace-pre-wrap">{project.description}</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MODULE 8 — Évaluation avec interprétation auto */}
              <TabsContent value="evaluation" className="mt-6">
                {evaluation ? (
                  <div className="space-y-4">
                    {(() => {
                      const interp = interpretScore(evaluation.score_global);
                      const maturity = getMaturityLevel(evaluation.niveau_maturite);
                      return (
                        <>
                          <Card className={`border-2 border-${interp.color}`}>
                            <CardHeader>
                              <div className="flex items-center justify-between flex-wrap gap-3">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Score Global : {evaluation.score_global}/100
                                  </CardTitle>
                                  <CardDescription className={interp.textClass + " font-semibold mt-1"}>
                                    {interp.label}
                                  </CardDescription>
                                </div>
                                <Badge className={`${interp.bgClass} text-white text-base py-2 px-4`}>
                                  {interp.shortLabel}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <Progress value={evaluation.score_global} className="h-3" />
                              <p className="text-sm text-muted-foreground">{interp.description}</p>
                              {maturity && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <p className="text-xs uppercase text-muted-foreground">Niveau de maturité</p>
                                  <p className="font-semibold">Niveau {maturity.level} — {maturity.label}</p>
                                  <p className="text-sm text-muted-foreground">{maturity.description}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader><CardTitle className="text-lg">Détail par axe (100 pts)</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                              {EVALUATION_AXES.map((axe) => {
                                const score = (evaluation as any)[`score_${axe.key}`] ?? 0;
                                const pct = (score / axe.max) * 100;
                                return (
                                  <div key={axe.key}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>{axe.label}</span>
                                      <span className="font-semibold">{score}/{axe.max}</span>
                                    </div>
                                    <Progress value={pct} className="h-2" />
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>

                          {(evaluation.forces?.length || evaluation.faiblesses?.length) && (
                            <div className="grid md:grid-cols-2 gap-4">
                              {evaluation.forces && evaluation.forces.length > 0 && (
                                <Card>
                                  <CardHeader><CardTitle className="text-base text-emerald-600 flex items-center gap-2"><CheckCircle className="h-4 w-4" />Points forts</CardTitle></CardHeader>
                                  <CardContent><ul className="space-y-2 text-sm">{evaluation.forces.map((f, i) => <li key={i} className="flex gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /><span>{f}</span></li>)}</ul></CardContent>
                                </Card>
                              )}
                              {evaluation.faiblesses && evaluation.faiblesses.length > 0 && (
                                <Card>
                                  <CardHeader><CardTitle className="text-base text-amber-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Points à améliorer</CardTitle></CardHeader>
                                  <CardContent><ul className="space-y-2 text-sm">{evaluation.faiblesses.map((f, i) => <li key={i} className="flex gap-2"><AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /><span>{f}</span></li>)}</ul></CardContent>
                                </Card>
                              )}
                            </div>
                          )}

                          {evaluation.prochaines_etapes && evaluation.prochaines_etapes.length > 0 && (
                            <Card>
                              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4" />Prochaines étapes</CardTitle></CardHeader>
                              <CardContent><ol className="space-y-2 text-sm list-decimal list-inside">{evaluation.prochaines_etapes.map((s, i) => <li key={i}>{s}</li>)}</ol></CardContent>
                            </Card>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune évaluation disponible pour ce projet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* MODULE 1 — Onglet Données d'évaluation détaillées (100% des données) */}
              <TabsContent value="details" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Données d'évaluation détaillées</CardTitle>
                    <CardDescription>Toutes les réponses et données saisies pour ce projet (mode lecture complète).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div><p className="text-muted-foreground text-xs">ID Projet</p><p className="font-mono font-semibold">{formatProjectDisplayId(project.display_id, project.id)}</p></div>
                      <div><p className="text-muted-foreground text-xs">Titre</p><p className="font-medium">{project.title}</p></div>
                      <div><p className="text-muted-foreground text-xs">Catégorie</p><p>{project.category || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Secteur</p><p>{project.sector || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Pays</p><p>{project.country || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Ville</p><p>{project.city || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Objectif de financement</p><p>{project.funding_goal?.toLocaleString() || 0} FCFA</p></div>
                      <div><p className="text-muted-foreground text-xs">Fonds levés</p><p>{project.funds_raised?.toLocaleString() || 0} FCFA</p></div>
                      <div><p className="text-muted-foreground text-xs">Fonds disponibles porteur</p><p>{project.fonds_disponibles || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Statut</p><p>{project.status}</p></div>
                      <div><p className="text-muted-foreground text-xs">Score risque</p><p>{project.risk_score || "—"}</p></div>
                      <div><p className="text-muted-foreground text-xs">Date création</p><p>{new Date(project.created_at).toLocaleString('fr-FR')}</p></div>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs mb-1">Description complète</p>
                      <div className="bg-muted/30 rounded p-3 whitespace-pre-wrap">{project.description || "—"}</div>
                    </div>
                    {evaluation?.answers && Object.keys(evaluation.answers).length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-2 mt-4">Réponses détaillées d'évaluation ({Object.keys(evaluation.answers).length} réponses)</p>
                        <div className="bg-muted/30 rounded p-3 space-y-2">
                          {Object.entries(evaluation.answers).map(([k, v]) => (
                            <div key={k} className="border-b border-border/50 pb-2 last:border-0">
                              <p className="font-medium text-xs text-muted-foreground">{k}</p>
                              <p className="break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.documents && Array.isArray(project.documents) && project.documents.length > 0 && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-2 mt-4">Documents joints ({project.documents.length})</p>
                        <ul className="space-y-1">
                          {project.documents.map((d: any, i: number) => (
                            <li key={i} className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{d.name || d.title || `Document ${i + 1}`}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="updates" className="mt-6 space-y-4">
                {updates.length > 0 ? (
                  updates.map((update) => (
                    <Card key={update.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{update.title}</CardTitle>
                          <span className="text-sm text-muted-foreground">{new Date(update.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardHeader>
                      <CardContent><p className="text-muted-foreground">{update.content}</p></CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Aucune actualité pour le moment</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="team" className="mt-6">
                <Card className="text-center py-8">
                  <CardContent>
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Informations sur l'équipe bientôt disponibles</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <Card className="text-center py-8">
                  <CardContent>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Documents disponibles après investissement</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          projectId={project.id}
          projectTitle={project.title}
        />
      )}
    </div>
  );
};

export default ProjectDetail;
