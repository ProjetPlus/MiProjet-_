import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { 
  ArrowLeft, Send, Lock, CheckCircle, Clock, 
  Building, MapPin, FileText, AlertCircle 
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  country: string | null;
  city: string | null;
  status: string;
  risk_score: string | null;
}

const AccessRequest = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<any>(null);
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    document.title = "Demande d'accès | MIPROJET";
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Connexion requise",
          description: "Veuillez vous connecter pour demander l'accès",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };

    checkAuth();
  }, [navigate, toast]);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
      checkExistingRequest();
    }
  }, [projectId, user]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

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

  const checkExistingRequest = async () => {
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setExistingRequest(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !projectId) return;

    setSubmitting(true);

    try {
      const { error } = await supabase.from('access_requests').insert({
        project_id: projectId,
        user_id: user.id,
        message: message.trim() || null,
        status: 'pending',
      });

      if (error) throw error;

      // Create notification for user
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'access_request',
        title: "Demande d'accès envoyée",
        message: `Votre demande d'accès au projet "${project?.title}" a été envoyée.`,
        link: `/dashboard`,
      });

      toast({
        title: "Demande envoyée",
        description: "Votre demande d'accès a été soumise avec succès. Vous serez notifié de la décision.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || "Impossible d'envoyer la demande",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved':
        return { label: 'Approuvée', color: 'bg-success/20 text-success', icon: CheckCircle };
      case 'rejected':
        return { label: 'Refusée', color: 'bg-destructive/20 text-destructive', icon: AlertCircle };
      default:
        return { label: 'En attente', color: 'bg-warning/20 text-warning', icon: Clock };
    }
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
          <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
          <Button onClick={() => navigate('/projects')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux projets
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Project Summary */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{project.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    {project.category && (
                      <span className="flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        {project.category}
                      </span>
                    )}
                    {(project.city || project.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {project.city}, {project.country}
                      </span>
                    )}
                  </CardDescription>
                </div>
                {project.risk_score && (
                  <Badge className="bg-success text-white">
                    Score {project.risk_score}
                  </Badge>
                )}
              </div>
            </CardHeader>
            {project.description && (
              <CardContent>
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {project.description}
                </p>
              </CardContent>
            )}
          </Card>

          {/* Existing Request Status */}
          {existingRequest && (
            <Alert className={`mb-6 ${getStatusConfig(existingRequest.status).color}`}>
              {(() => {
                const StatusIcon = getStatusConfig(existingRequest.status).icon;
                return <StatusIcon className="h-4 w-4" />;
              })()}
              <AlertTitle>Demande existante</AlertTitle>
              <AlertDescription>
                Vous avez déjà soumis une demande d'accès pour ce projet. 
                Statut: <strong>{getStatusConfig(existingRequest.status).label}</strong>
                {existingRequest.admin_notes && (
                  <p className="mt-2">Note: {existingRequest.admin_notes}</p>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Access Request Form */}
          {!existingRequest && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Demande d'accès au projet</CardTitle>
                    <CardDescription>
                      Remplissez ce formulaire pour demander l'accès aux informations détaillées du projet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <Alert>
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>
                      L'accès aux informations financières détaillées est réservé aux profils 
                      investisseurs et partenaires validés. Votre demande sera examinée par notre équipe.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="message">
                      Message (optionnel)
                    </Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Présentez-vous brièvement et expliquez votre intérêt pour ce projet..."
                      className="min-h-[120px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Un message personnalisé augmente vos chances d'obtenir l'accès.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current mr-2" />
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {existingRequest && existingRequest.status === 'rejected' && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">
                  Vous pouvez soumettre une nouvelle demande avec des informations complémentaires.
                </p>
                <Button 
                  className="w-full mt-4"
                  onClick={() => setExistingRequest(null)}
                >
                  Nouvelle demande
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccessRequest;
