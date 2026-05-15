import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Check, Crown, Zap, Sparkles, Star, Shield, 
  Clock, Wallet, Loader2
} from "lucide-react";

const Subscription = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { plans, currentSubscription, hasActiveSubscription, loading } = useSubscription();

  useEffect(() => {
    document.title = "Abonnements | MIPROJET";
  }, []);

  const getPlanIcon = (durationType: string) => {
    switch (durationType) {
      case 'monthly': return Zap;
      case 'quarterly': return Star;
      case 'semiannual': return Sparkles;
      case 'annual': return Crown;
      default: return Zap;
    }
  };

  const getPlanBgColor = (durationType: string) => {
    switch (durationType) {
      case 'monthly': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'quarterly': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      case 'semiannual': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
      case 'annual': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
      default: return 'bg-muted';
    }
  };

  const getPlanAccentColor = (durationType: string) => {
    switch (durationType) {
      case 'monthly': return 'from-blue-500 to-blue-600';
      case 'quarterly': return 'from-purple-500 to-purple-600';
      case 'semiannual': return 'from-emerald-500 to-emerald-600';
      case 'annual': return 'from-amber-500 to-amber-600';
      default: return 'from-primary to-primary/80';
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Veuillez vous connecter pour souscrire.", variant: "destructive" });
      navigate("/auth?redirect=/subscription");
      return;
    }
    navigate(`/subscription/checkout?plan=${planId}`);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Crown className="h-3 w-3 mr-1" />
            ESPACE ABONNÉ
          </Badge>
          <h1 className="text-4xl font-bold mb-4">
            Accédez aux Meilleures <span className="text-primary">Opportunités</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Financements, formations, accompagnements, partenariats... 
            Rejoignez notre communauté exclusive de porteurs de projets.
          </p>
          <Button variant="outline" onClick={() => navigate('/subscription/guide')} className="gap-2">
            📘 Voir le guide d'abonnement étape par étape
          </Button>
        </div>

        {/* Current Subscription Banner */}
        {hasActiveSubscription && currentSubscription && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full">
                  <Crown className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Abonnement actif</h3>
                  <p className="text-muted-foreground">
                    Plan {(currentSubscription as any).plan?.name || 'Élite'} 
                    {currentSubscription.expires_at && new Date(currentSubscription.expires_at).getFullYear() > 2100 
                      ? ' à vie' 
                      : ` • Expire le ${new Date(currentSubscription.expires_at || '').toLocaleDateString('fr-FR')}`
                    }
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/opportunities')}>Voir les opportunités</Button>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.duration_type);
            const isMostChosen = plan.duration_type === 'semiannual';
            const isBestValue = plan.duration_type === 'annual';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${getPlanBgColor(plan.duration_type)} ${
                  isBestValue ? 'ring-2 ring-amber-500/50 scale-[1.02]' : ''
                } ${isMostChosen ? 'ring-2 ring-emerald-500/50' : ''}`}
              >
                {isMostChosen && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white whitespace-nowrap">
                    ⭐ Le plus choisi
                  </Badge>
                )}
                {isBestValue && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white whitespace-nowrap">
                    🏆 Offre la plus avantageuse
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`mx-auto p-3 rounded-full bg-gradient-to-br ${getPlanAccentColor(plan.duration_type)} text-white mb-3`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">💳 {plan.price.toLocaleString()} FCFA — {plan.name}</CardTitle>
                  <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1">FCFA</span>
                    <p className="text-xs text-muted-foreground mt-1">{plan.duration_days} jours</p>
                  </div>
                  
                  <ul className="space-y-2 text-sm text-left">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={`w-full ${isBestValue || isMostChosen ? 'bg-gradient-to-r ' + getPlanAccentColor(plan.duration_type) + ' text-white' : ''}`}
                    variant={isBestValue || isMostChosen ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={hasActiveSubscription}
                  >
                    {hasActiveSubscription ? 'Déjà abonné' : "S'abonner"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Payment Methods */}
        <Card className="mb-12">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-center mb-6">💳 Moyens de paiement acceptés</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Wallet className="h-6 w-6" />
                <span className="font-semibold text-foreground">Wave</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <Shield className="inline h-4 w-4 mr-1" />
              Paiements sécurisés par Wave
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              En cas de difficulté avec Wave ou d'indisponibilité dans votre pays, merci de nous contacter pour une solution adaptée.
            </p>
            <p className="text-center text-sm font-medium mt-1">
              <a href="https://wa.me/+2250707167921" target="_blank" rel="noopener" className="text-primary hover:underline">
                WhatsApp : +225 07 07 16 79 21
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Pourquoi s'abonner ?</h2>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6">
              <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Opportunités Exclusives</h3>
              <p className="text-sm text-muted-foreground">Accès prioritaire aux appels à projets, subventions et financements</p>
            </Card>
            <Card className="p-6">
              <Star className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Formations Premium</h3>
              <p className="text-sm text-muted-foreground">Webinaires, ateliers et formations en gestion de projet</p>
            </Card>
            <Card className="p-6">
              <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Accompagnement VIP</h3>
              <p className="text-sm text-muted-foreground">Support dédié et orientation vers les partenaires adaptés</p>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
