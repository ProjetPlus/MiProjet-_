import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAdmin, adminChecked } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading');
  const [paymentDetails, setPaymentDetails] = useState<{
    amount?: number;
    reference?: string;
    projectTitle?: string;
  }>({});

  useEffect(() => {
    document.title = "Confirmation de paiement | MIPROJET";
    
    const checkPaymentStatus = async () => {
      const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
      const paymentStatus = searchParams.get('status');
      const reference = searchParams.get('reference');

      console.log('Payment callback params:', { transactionId, paymentStatus, reference });

      // If status is directly provided in URL (from Wave redirect)
      if (paymentStatus) {
        if (paymentStatus === 'approved' || paymentStatus === 'completed' || paymentStatus === 'success') {
          setStatus('success');
        } else if (paymentStatus === 'declined' || paymentStatus === 'failed' || paymentStatus === 'canceled') {
          setStatus('failed');
        } else {
          setStatus('pending');
        }
      }

      // Try to find the payment record
      if (transactionId || reference) {
        try {
          const searchValue = reference || transactionId;
          
          // Search by payment reference or transaction ID in metadata
          const { data: payments } = await supabase
            .from('payments')
            .select('*, projects(title)')
            .or(`payment_reference.eq.${searchValue},payment_reference.ilike.%${searchValue}%`)
            .limit(1);

          if (payments && payments.length > 0) {
            const payment = payments[0];
            setPaymentDetails({
              amount: payment.amount,
              reference: payment.payment_reference,
              projectTitle: payment.projects?.title,
            });

            // Update status based on DB record if not set from URL
            if (!paymentStatus) {
              if (payment.status === 'completed') {
                setStatus('success');
              } else if (payment.status === 'failed' || payment.status === 'cancelled') {
                setStatus('failed');
              } else {
                setStatus('pending');
              }
            }
          } else {
            // No payment found
            if (!paymentStatus) {
              setStatus('pending');
            }
          }
        } catch (error) {
          console.error('Error fetching payment:', error);
          if (!paymentStatus) {
            setStatus('pending');
          }
        }
      } else {
        // No transaction info at all - check latest user payment
        if (user) {
          const { data: latestPayment } = await supabase
            .from('payments')
            .select('*, projects(title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (latestPayment && latestPayment.length > 0) {
            const payment = latestPayment[0];
            // Only show if created in the last 5 minutes
            const createdAt = new Date(payment.created_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

            if (diffMinutes < 5) {
              setPaymentDetails({
                amount: payment.amount,
                reference: payment.payment_reference,
                projectTitle: payment.projects?.title,
              });
              
              if (payment.status === 'completed') {
                setStatus('success');
              } else if (payment.status === 'failed') {
                setStatus('failed');
              } else {
                setStatus('pending');
              }
              return;
            }
          }
        }
        setStatus('pending');
      }
    };

    // Small delay to allow webhook to process
    const timeout = setTimeout(checkPaymentStatus, 1500);
    return () => clearTimeout(timeout);
  }, [searchParams, user]);

  const handleDashboardRedirect = () => {
    if (adminChecked && isAdmin) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-16 w-16 text-primary animate-spin" />,
          title: "Vérification en cours...",
          description: "Nous vérifions le statut de votre paiement.",
          color: "text-primary"
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-16 w-16 text-success" />,
          title: "Paiement réussi !",
          description: "Votre paiement a été effectué avec succès. Merci pour votre contribution !",
          color: "text-success"
        };
      case 'failed':
        return {
          icon: <XCircle className="h-16 w-16 text-destructive" />,
          title: "Paiement échoué",
          description: "Votre paiement n'a pas pu être traité. Veuillez réessayer ou contacter le support.",
          color: "text-destructive"
        };
      case 'pending':
      default:
        return {
          icon: <Clock className="h-16 w-16 text-warning" />,
          title: "Paiement en attente",
          description: "Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.",
          color: "text-warning"
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="max-w-md mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8 space-y-6">
              <div className="flex justify-center">
                {content.icon}
              </div>
              
              <div className="space-y-2">
                <h1 className={`text-2xl font-bold ${content.color}`}>
                  {content.title}
                </h1>
                <p className="text-muted-foreground">
                  {content.description}
                </p>
              </div>

              {paymentDetails.amount && (
                <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant:</span>
                    <span className="font-semibold">
                      {paymentDetails.amount.toLocaleString()} FCFA
                    </span>
                  </div>
                  {paymentDetails.reference && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Référence:</span>
                      <span className="font-mono text-sm">
                        {paymentDetails.reference}
                      </span>
                    </div>
                  )}
                  {paymentDetails.projectTitle && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Projet:</span>
                      <span className="font-medium">
                        {paymentDetails.projectTitle}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleDashboardRedirect} 
                  className="w-full"
                >
                  Accéder au tableau de bord
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {status === 'failed' && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/projects')}
                    className="w-full"
                  >
                    Réessayer
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/')}
                  className="w-full"
                >
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentCallback;