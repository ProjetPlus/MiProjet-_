import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { InvoiceHistory } from "@/components/dashboard/InvoiceHistory";
import { EvaluationsTab } from "@/components/dashboard/EvaluationsTab";
import { UserJourney } from "@/components/dashboard/UserJourney";
import { ReferralTab } from "@/components/dashboard/ReferralTab";
import {
  FolderKanban, FileText, MessageSquare, Plus,
  Eye, Settings, Clock, CheckCircle, Award, ArrowRight,
  Crown, AlertTriangle, CreditCard, Calendar
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
  category: string | null;
}

interface ServiceRequest {
  id: string;
  service_type: string;
  status: string;
  created_at: string;
  company_name: string | null;
}

export const ProjectOwnerDashboard = () => {
  const { user } = useAuth();
  const { currentSubscription, hasActiveSubscription, loading: subLoading } = useSubscription();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    validatedProjects: 0,
    pendingRequests: 0,
    orientedProjects: 0
  });

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      const [projectsRes, requestsRes] = await Promise.all([
        supabase.from('projects').select('id, title, status, created_at, category').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('service_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      const projectsData = projectsRes.data || [];
      const requestsData = requestsRes.data || [];

      setProjects(projectsData);
      setRequests(requestsData);
      setStats({
        totalProjects: projectsData.length,
        validatedProjects: projectsData.filter(p => p.status === 'validated' || p.status === 'published').length,
        pendingRequests: requestsData.filter(r => r.status === 'pending').length,
        orientedProjects: projectsData.filter(p => p.status === 'oriented').length
      });
      setLoading(false);
    };

    loadData();
  }, [user]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      in_structuring: { variant: "outline", label: "En structuration" },
      validated: { variant: "default", label: "Validé" },
      oriented: { variant: "default", label: "Orienté" },
      published: { variant: "default", label: "Publié" },
      approved: { variant: "default", label: "Approuvé" },
      rejected: { variant: "destructive", label: "Rejeté" },
    };
    const c = config[status] || { variant: "secondary", label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getServiceTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      structuring: "Structuration",
      enterprise: "Accompagnement Entreprise",
      fullService: "Service Complet",
      training: "Formation",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Mes Projets</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Validés</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.validatedProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-success/10 flex-shrink-0">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Orientés</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.orientedProjects}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Demandes</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.pendingRequests}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-warning/10 flex-shrink-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Link to="/submit-project">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau projet</span>
            <span className="sm:hidden">Projet</span>
          </Button>
        </Link>
        <Link to="/services/structuring">
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Structuration</span>
          </Button>
        </Link>
        <Link to="/services">
          <Button variant="outline" size="sm" className="gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Nos services</span>
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:grid-cols-8 sm:inline-flex">
          <TabsTrigger value="projects" className="text-xs sm:text-sm">Projets</TabsTrigger>
          <TabsTrigger value="journey" className="text-xs sm:text-sm">Parcours</TabsTrigger>
          <TabsTrigger value="subscription" className="text-xs sm:text-sm">Abonnement</TabsTrigger>
          <TabsTrigger value="evaluations" className="text-xs sm:text-sm">Évaluations</TabsTrigger>
          <TabsTrigger value="requests" className="text-xs sm:text-sm">Demandes</TabsTrigger>
          <TabsTrigger value="invoices" className="text-xs sm:text-sm">Factures</TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs sm:text-sm">Parrainage</TabsTrigger>
          <TabsTrigger value="messages" className="text-xs sm:text-sm">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="journey" className="space-y-4">
          <UserJourney />
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <ReferralTab />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun projet</h3>
                <p className="text-muted-foreground mb-4">Commencez par soumettre votre premier projet pour structuration</p>
                <Link to="/submit-project">
                  <Button><Plus className="mr-2 h-4 w-4" />Créer un projet</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base sm:text-lg line-clamp-1">{project.title}</CardTitle>
                      {getStatusBadge(project.status)}
                    </div>
                    <CardDescription className="text-xs sm:text-sm">
                      {project.category || "Non catégorisé"} • {new Date(project.created_at).toLocaleDateString('fr-FR')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                          <Eye className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Voir
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm">
                          <Settings className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                          Gérer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          {hasActiveSubscription && currentSubscription ? (
            <div className="space-y-4">
              <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-primary/20 rounded-full">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Abonnement actif</h3>
                      <p className="text-muted-foreground">
                        Plan {(currentSubscription as any).plan?.name || 'Premium'}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-success/20 text-success border-success/30">Actif</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Début</p>
                      <p className="font-medium text-sm">
                        {currentSubscription.started_at 
                          ? new Date(currentSubscription.started_at).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Expiration</p>
                      <p className="font-medium text-sm">
                        {currentSubscription.expires_at 
                          ? new Date(currentSubscription.expires_at).toLocaleDateString('fr-FR')
                          : 'Illimité'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <CreditCard className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Méthode</p>
                      <p className="font-medium text-sm capitalize">
                        {(currentSubscription as any).payment_method || 'Wave'}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded-lg border">
                      <Crown className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Renouvellement</p>
                      <p className="font-medium text-sm">
                        {currentSubscription.auto_renew ? 'Automatique' : 'Manuel'}
                      </p>
                    </div>
                  </div>

                  {/* Expiration warning */}
                  {currentSubscription.expires_at && (() => {
                    const daysLeft = Math.ceil((new Date(currentSubscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft <= 7 && daysLeft > 0) {
                      return (
                        <div className="mt-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-warning" />
                          <p className="text-sm text-warning">
                            Votre abonnement expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}. Pensez à le renouveler.
                          </p>
                          <Link to="/subscription" className="ml-auto">
                            <Button size="sm" variant="outline">Renouveler</Button>
                          </Link>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>

              <Link to="/opportunities">
                <Button className="gap-2">
                  <Crown className="h-4 w-4" />
                  Accéder aux opportunités
                </Button>
              </Link>
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun abonnement actif</h3>
                <p className="text-muted-foreground mb-4">
                  Souscrivez à un abonnement pour accéder aux opportunités exclusives
                </p>
                <Link to="/subscription">
                  <Button className="gap-2">
                    <Crown className="h-4 w-4" />
                    S'abonner
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <EvaluationsTab projects={projects} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune demande</h3>
                <p className="text-muted-foreground mb-4">Vous n'avez pas encore fait de demande de service</p>
                <Link to="/services">
                  <Button>Découvrir nos services</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{request.company_name || "Demande sans nom"}</p>
                      <p className="text-sm text-muted-foreground">
                        {getServiceTypeLabel(request.service_type)} • {new Date(request.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 justify-between sm:justify-end">
                      {getStatusBadge(request.status)}
                      <Button variant="ghost" size="sm">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceHistory />
        </TabsContent>

        <TabsContent value="messages">
          <Card className="text-center py-12">
            <CardContent>
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun message</h3>
              <p className="text-muted-foreground">Vos conversations avec l'équipe MIPROJET apparaîtront ici</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
