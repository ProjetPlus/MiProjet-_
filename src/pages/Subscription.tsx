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
import { supabase } from "@/integrations/supabase/client";
import {
  Check, Crown, Zap, Sparkles, Star, Shield,
  Wallet, Loader2, ArrowRight, Users, TrendingUp, Building2, Banknote, GraduationCap, User as UserIcon,
} from "lucide-react";

const PROFILE_LABELS: Record<string, { label: string; icon: any; tagline: string }> = {
  individual:  { label: "Porteur de projet",       icon: UserIcon,        tagline: "Vos plans à un tarif accessible pour structurer et financer votre projet." },
  enterprise:  { label: "Entreprise / Start-up",   icon: Building2,       tagline: "Des plans pensés pour les entreprises qui veulent passer à l'échelle." },
  investor:    { label: "Investisseur",            icon: TrendingUp,      tagline: "Accédez en priorité aux projets certifiés MiProjet+ à fort potentiel." },
  funder:      { label: "Bailleur / Institution",  icon: Banknote,        tagline: "Soutenez des projets sérieux, audités et alignés à vos critères ESG." },
  expert:      { label: "Expert / Mentor",         icon: GraduationCap,   tagline: "Accompagnez les meilleurs projets et développez votre impact." },
};

const Subscription = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { plans, currentSubscription, hasActiveSubscription, loading } = useSubscription();
  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Espace abonnés | MIPROJET";
  }, []);

  useEffect(() => {
    if (!user) { setUserType(null); return; }
    supabase.from("profiles").select("user_type").eq("id", user.id).maybeSingle()
      .then(({ data }) => setUserType(data?.user_type || "individual"));
  }, [user]);

  const getPlanIcon = (durationType: string) => {
    switch (durationType) {
      case 'monthly':    return Zap;
      case 'quarterly':  return Star;
      case 'semiannual': return Sparkles;
      case 'annual':     return Crown;
      default:           return Zap;
    }
  };

  const handleSubscribe = (planId: string) => {
    if (!user) { navigate("/auth?redirect=/subscription"); return; }
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

  // -------------------- PUBLIC (no login) : unified CTA, no prices --------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
              <Crown className="h-3 w-3 mr-1" /> ESPACE MEMBRES MIPROJET
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Un seul écosystème.<br />
              <span className="text-primary">Des opportunités adaptées à chaque profil.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-4">
              <strong>Porteurs de projet</strong>, <strong>entreprises</strong>, <strong>partenaires techniques</strong>,
              <strong> investisseurs</strong>, <strong>bailleurs</strong> et <strong>institutions</strong> : MIPROJET
              est la plateforme panafricaine de structuration et de mise en relation pour des projets sérieux,
              audités et à fort impact.
            </p>
            <p className="text-base text-muted-foreground mb-8">
              Connectez-vous pour découvrir les <strong>plans, tarifs et opportunités</strong> spécifiquement
              conçus pour votre profil. Chaque membre accède à un univers sur mesure, adapté à ses moyens et à ses ambitions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={() => navigate("/auth?redirect=/subscription")} className="gap-2">
                Me connecter pour voir mes plans <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth?mode=signup&redirect=/subscription")}>
                Créer un compte gratuit
              </Button>
            </div>
          </div>

          {/* Profil teasers — sans prix */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
            {Object.entries(PROFILE_LABELS).map(([key, p]) => {
              const Icon = p.icon;
              return (
                <Card key={key} className="hover:shadow-lg transition-all border-border/60">
                  <CardContent className="p-6 text-center space-y-3">
                    <Icon className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-semibold">{p.label}</h3>
                    <p className="text-xs text-muted-foreground">{p.tagline}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Bénéfices transverses */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Pourquoi rejoindre MIPROJET ?</h2>
            <div className="grid sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="p-6">
                <Zap className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Opportunités ciblées</h3>
                <p className="text-sm text-muted-foreground">Financements, appels à projets, partenariats — filtrés selon votre profil et votre secteur.</p>
              </Card>
              <Card className="p-6">
                <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Projets sérieux & certifiés</h3>
                <p className="text-sm text-muted-foreground">Méthodologie MiProjet+ : scoring, audit et certification pour des projets bancables.</p>
              </Card>
              <Card className="p-6">
                <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Réseau panafricain</h3>
                <p className="text-sm text-muted-foreground">Porteurs, investisseurs, bailleurs et experts réunis dans un même écosystème de confiance.</p>
              </Card>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-muted-foreground mb-3">
              💡 Les plans et tarifs sont visibles uniquement après connexion, pour vous proposer
              ce qui correspond <strong>exactement à votre profil</strong>.
            </p>
            <Button size="lg" onClick={() => navigate("/auth?redirect=/subscription")}>
              Accéder à mon espace
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // -------------------- LOGGED IN : show plans for this user_type --------------------
  const effectiveType = userType || "individual";
  const profileMeta = PROFILE_LABELS[effectiveType] || PROFILE_LABELS.individual;
  const filteredPlans = plans.filter(p => !p.target_profile || p.target_profile === effectiveType || p.target_profile === "all");

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <profileMeta.icon className="h-3 w-3 mr-1" /> Profil : {profileMeta.label}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Vos plans <span className="text-primary">MIPROJET</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{profileMeta.tagline}</p>
        </div>

        {hasActiveSubscription && currentSubscription && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-full"><Crown className="h-6 w-6 text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-lg">Abonnement actif</h3>
                  <p className="text-muted-foreground">
                    Plan {(currentSubscription as any).plan?.name || 'Premium'}
                    {currentSubscription.expires_at && new Date(currentSubscription.expires_at).getFullYear() > 2100
                      ? ' à vie'
                      : ` • Expire le ${new Date(currentSubscription.expires_at || '').toLocaleDateString('fr-FR')}`}
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/opportunities')}>Voir les opportunités</Button>
            </CardContent>
          </Card>
        )}

        {filteredPlans.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <Sparkles className="h-10 w-10 text-primary mx-auto" />
              <h3 className="text-xl font-semibold">Plans sur mesure en préparation pour votre profil</h3>
              <p className="text-muted-foreground">
                Nous finalisons les offres dédiées au profil <strong>{profileMeta.label}</strong>.
                Contactez-nous pour une proposition personnalisée et un accès prioritaire.
              </p>
              <a href="https://wa.me/+2250707167921" target="_blank" rel="noopener" className="inline-block">
                <Button>Discuter avec un conseiller</Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {filteredPlans.map((plan) => {
              const Icon = getPlanIcon(plan.duration_type);
              const isHighlight = plan.duration_type === 'semiannual' || plan.duration_type === 'annual';
              return (
                <Card key={plan.id} className={`relative transition-all hover:shadow-xl hover:-translate-y-1 ${isHighlight ? 'ring-2 ring-primary/30' : ''}`}>
                  {isHighlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground whitespace-nowrap">
                      ⭐ Recommandé
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary mb-3"><Icon className="h-6 w-6" /></div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-sm min-h-[40px]">{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">{plan.currency || 'FCFA'}</span>
                      <p className="text-xs text-muted-foreground mt-1">{plan.duration_days} jours</p>
                    </div>
                    <ul className="space-y-2 text-sm text-left">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={() => handleSubscribe(plan.id)} disabled={hasActiveSubscription}>
                      {hasActiveSubscription ? 'Déjà abonné' : "S'abonner"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="mb-12">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold text-center mb-6">💳 Moyens de paiement</h3>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex items-center gap-2"><Wallet className="h-6 w-6" /><span className="font-semibold">Wave</span></div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <Shield className="inline h-4 w-4 mr-1" /> Paiements sécurisés
            </p>
            <p className="text-center text-sm mt-2">
              Autre moyen de paiement (virement, USD, sur mesure) :{" "}
              <a href="https://wa.me/+2250707167921" target="_blank" rel="noopener" className="text-primary hover:underline">
                WhatsApp +225 07 07 16 79 21
              </a>
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Subscription;
