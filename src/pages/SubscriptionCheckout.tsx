import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Check, Wallet, 
  Shield, Loader2, AlertCircle
} from "lucide-react";

const SubscriptionCheckout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan');
  const { user, loading: authLoading } = useAuth();
  const { plans, createSubscription, loading } = useSubscription();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPlan = plans.find(p => p.id === planId);

  useEffect(() => {
    document.title = "Paiement Abonnement | MIPROJET";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/subscription');
    }
  }, [user, authLoading, navigate]);

  const handlePayment = async () => {
    if (!selectedPlan || !user) return;

    setIsProcessing(true);

    try {
      const { data: subscription, error: subError } = await createSubscription(selectedPlan.id);
      if (subError) throw new Error(typeof subError === 'string' ? subError : 'Une erreur est survenue');

      const successUrl = 'https://ivoireprojet.com/payment/callback?status=success';
      const errorUrl = 'https://ivoireprojet.com/payment/callback?status=failed';

      const { data, error } = await supabase.functions.invoke('wave-payment', {
        body: {
          amount: selectedPlan.price,
          description: `Abonnement MIPROJET - ${selectedPlan.name}`,
          subscription_id: subscription?.id,
          plan_id: selectedPlan.id,
          success_url: successUrl,
          error_url: errorUrl,
        },
      });

      if (error) {
        console.error('Wave payment invoke error:', error);
        throw new Error(error.message || 'Erreur lors de la communication avec le service de paiement');
      }

      if (data?.error) {
        console.error('Wave payment data error:', data.error);
        if (data.preview_mode) {
          throw new Error('Le service Wave n\'est pas encore configuré. Contactez l\'administrateur.');
        }
        throw new Error(data.error);
      }

      if (data?.wave_launch_url) {
        // Send WhatsApp notification for new subscription
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, whatsapp, phone')
            .eq('id', user.id)
            .single();
          
          if (profile) {
            const phone = profile.whatsapp || profile.phone;
            if (phone) {
              await supabase.functions.invoke('miprojet-assistant', {
                body: {
                  action: 'send_whatsapp',
                  phone,
                  message: `Bonjour ${profile.first_name || ''} ! Votre abonnement ${selectedPlan.name} (${selectedPlan.price.toLocaleString()} FCFA) est en cours de traitement. Merci de votre confiance ! – MIPROJET`,
                  notification_type: 'paiement',
                  user_id: user.id,
                }
              });
            }
          }
        } catch (notifErr) {
          console.warn('WhatsApp notification failed (non-blocking):', notifErr);
        }

        window.location.href = data.wave_launch_url;
      } else {
        throw new Error('URL de paiement non reçue. Veuillez réessayer.');
      }
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 md:pt-32 pb-16 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Plan non trouvé</h1>
          <p className="text-muted-foreground mb-6">Le plan sélectionné n'existe pas ou n'est plus disponible.</p>
          <Button onClick={() => navigate('/subscription')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux plans
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
          onClick={() => navigate('/subscription')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux plans
        </Button>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
              <CardDescription>Votre abonnement MIPROJET</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-semibold">{selectedPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </div>
                <Badge variant="secondary">{selectedPlan.duration_days} jours</Badge>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Avantages inclus :</h4>
                <ul className="space-y-2">
                  {selectedPlan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total à payer</span>
                  <span className="text-primary">{selectedPlan.price.toLocaleString()} FCFA</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Paiement via Wave
              </CardTitle>
              <CardDescription>Paiement sécurisé et rapide</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Wallet className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Wave Mobile Money</p>
                    <p className="text-sm text-muted-foreground">
                      Vous serez redirigé vers Wave pour finaliser votre paiement en toute sécurité.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Redirection vers Wave...
                  </>
                ) : (
                  <>
                    Payer {selectedPlan.price.toLocaleString()} FCFA via Wave
                  </>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Paiements sécurisés par Wave
              </p>
              <p className="text-center text-xs text-muted-foreground mt-2">
                En cas de difficulté, contactez-nous : <a href="https://wa.me/+2250707167921" className="text-primary hover:underline">WhatsApp : +225 07 07 16 79 21</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionCheckout;
