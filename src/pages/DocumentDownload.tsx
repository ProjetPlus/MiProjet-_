import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Lock, Crown, Loader2, CheckCircle, ExternalLink } from "lucide-react";

const DocumentDownload = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  useEffect(() => {
    if (id) fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('platform_documents')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    if (data) setDoc(data);
    setLoading(false);
  };

  const canAccess = () => {
    if (!doc) return false;
    // Premium requires subscription
    if (doc.access_level === 'premium') {
      return user && hasActiveSubscription;
    }
    // Requires login
    if (doc.requires_login) {
      return !!user;
    }
    // Free without login - needs form submission
    return unlocked;
  };

  const triggerDownload = () => {
    if (doc?.file_url) {
      // Try auto download
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.target = '_blank';
      link.download = doc.title || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadTriggered(true);

      // Increment download count
      supabase.from('platform_documents')
        .update({ download_count: (doc.download_count || 0) + 1 } as any)
        .eq('id', doc.id)
        .then();
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setUnlocked(true);
    triggerDownload();
  };

  const handleAccessClick = () => {
    if (!doc) return;

    // Premium check
    if (doc.access_level === 'premium' && (!user || !hasActiveSubscription)) {
      if (!user) navigate('/auth');
      else navigate('/subscription');
      return;
    }

    // Login check
    if (doc.requires_login && !user) {
      navigate('/auth');
      return;
    }

    // Free + logged in = direct access
    if (doc.access_level === 'free' && doc.requires_login && user) {
      setUnlocked(true);
      triggerDownload();
      return;
    }

    // Free, no login required = show form
    if (doc.associated_form === 'investor') {
      setShowForm(true);
    } else {
      setShowForm(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 md:pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Document introuvable</h1>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const accessGranted = canAccess();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="max-w-3xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border-primary/20">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {doc.cover_url ? (
                  <img src={doc.cover_url} alt={doc.title} className="w-48 rounded-lg shadow-xl" />
                ) : (
                  <div className="w-48 h-64 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-16 w-16 text-primary" />
                  </div>
                )}

                <div className="flex-1 text-center md:text-left">
                  <div className="flex gap-2 mb-3 justify-center md:justify-start">
                    <Badge className={doc.access_level === 'premium' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}>
                      {doc.access_level === 'premium' ? '👑 Premium' : '🆓 Gratuit'}
                    </Badge>
                    {doc.requires_login && <Badge variant="outline"><Lock className="h-3 w-3 mr-1" /> Connexion requise</Badge>}
                  </div>

                  <h1 className="text-2xl font-bold mb-3">{doc.title}</h1>
                  {doc.description && (
                    <p className="text-muted-foreground mb-6">{doc.description}</p>
                  )}

                  <div className="flex items-center gap-3 mb-6 text-sm text-muted-foreground justify-center md:justify-start">
                    <span><Download className="h-4 w-4 inline mr-1" />{doc.download_count || 0} téléchargements</span>
                  </div>

                  {accessGranted || unlocked ? (
                    <div className="space-y-4">
                      {downloadTriggered && (
                        <div className="flex items-center gap-2 text-success">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Téléchargement lancé !</span>
                        </div>
                      )}
                      <Button size="lg" onClick={triggerDownload} className="gap-2">
                        <Download className="h-5 w-5" />
                        Télécharger : {doc.title}
                      </Button>
                      {doc.file_url && (
                        <div>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-primary underline inline-flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" />
                            Cliquer ici pour télécharger votre document
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      {doc.access_level === 'premium' ? (
                        <Button size="lg" onClick={handleAccessClick} className="gap-2">
                          <Crown className="h-5 w-5" />
                          {user ? "Passer Premium" : "Se connecter"}
                        </Button>
                      ) : (
                        <Button size="lg" onClick={handleAccessClick} className="gap-2">
                          <Download className="h-5 w-5" />
                          Télécharger : {doc.title}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      <LeadCaptureForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        leadSource={doc.associated_form === 'investor' ? 'investor' : 'ebook'}
        sourceId={doc.id}
        title={`Accéder à : ${doc.title}`}
        description="Renseignez vos coordonnées pour télécharger le document"
        showInvestorFields={doc.associated_form === 'investor'}
      />
    </div>
  );
};

export default DocumentDownload;
