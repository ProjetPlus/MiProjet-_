import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  UserPlus, LogIn, Mail, Crown, CreditCard, 
  CheckCircle2, ArrowRight, Smartphone, Globe,
  Shield, Zap, Star, Sparkles
} from "lucide-react";
import { useEffect } from "react";

const steps = [
  {
    number: 1,
    title: "Créer un compte",
    description: "Si vous n'avez pas encore de compte, rendez-vous sur le site et cliquez sur « Connexion » dans le menu, puis « Créer un compte ».",
    details: [
      "Renseignez votre prénom, nom, email et numéro WhatsApp",
      "Choisissez un mot de passe sécurisé",
      "Validez le formulaire d'inscription",
    ],
    icon: UserPlus,
    color: "from-blue-500 to-blue-600",
  },
  {
    number: 2,
    title: "Confirmer votre email",
    description: "Un email de confirmation vous est envoyé. Rendez-vous dans votre boîte mail et cliquez sur le lien de confirmation.",
    details: [
      "Vérifiez votre boîte de réception (et les spams)",
      "Cliquez sur le lien de validation",
      "Vous serez redirigé vers la page de connexion",
    ],
    icon: Mail,
    color: "from-green-500 to-green-600",
  },
  {
    number: 3,
    title: "Se connecter",
    description: "Une fois votre email confirmé, connectez-vous avec vos identifiants (email + mot de passe).",
    details: [
      "Cliquez sur « Connexion » dans le menu",
      "Entrez votre email et mot de passe",
      "Vous accédez à votre espace personnel",
    ],
    icon: LogIn,
    color: "from-purple-500 to-purple-600",
  },
  {
    number: 4,
    title: "Choisir votre offre",
    description: "Rendez-vous dans « Espace Abonné » ou « Opportunités » dans le menu, puis sélectionnez l'offre qui vous convient.",
    details: [
      "Essentiel – 5 000 FCFA : Accès subventions + alertes",
      "Avancé – 12 500 FCFA : + alertes prioritaires + webinaires",
      "Premium – 20 000 FCFA : + support VIP + formations",
      "Élite – 30 000 FCFA : Accès complet + session stratégique",
    ],
    icon: Crown,
    color: "from-amber-500 to-amber-600",
  },
  {
    number: 5,
    title: "Payer avec Wave",
    description: "Cliquez sur « S'abonner » puis « Payer via Wave ». L'application Wave s'ouvre automatiquement sur votre téléphone.",
    details: [
      "Cliquez sur le bouton « Payer via Wave »",
      "L'application Wave s'ouvre automatiquement",
      "Confirmez le paiement dans Wave",
      "Vous êtes redirigé vers MIPROJET",
    ],
    icon: CreditCard,
    color: "from-teal-500 to-teal-600",
  },
  {
    number: 6,
    title: "Accéder aux opportunités",
    description: "Votre abonnement est activé instantanément ! Vous avez maintenant accès à toutes les opportunités exclusives.",
    details: [
      "Recevez une notification de confirmation",
      "Accédez aux opportunités de financement",
      "Recevez des alertes personnalisées",
      "Bénéficiez du support selon votre plan",
    ],
    icon: CheckCircle2,
    color: "from-emerald-500 to-emerald-600",
  },
];

const SubscriptionGuide = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Guide d'abonnement | Club MIPROJET";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20">
            <Globe className="h-3 w-3 mr-1" />
            GUIDE D'ABONNEMENT
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            Comment rejoindre le <span className="text-primary">Club MIPROJET</span> ?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Suivez ces étapes simples pour accéder aux meilleures opportunités 
            de financement et d'accompagnement entrepreneurial.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-3xl mx-auto space-y-6 mb-12">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.number} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className={`bg-gradient-to-br ${step.color} p-6 flex items-center justify-center sm:min-w-[120px]`}>
                      <div className="text-center text-white">
                        <Icon className="h-8 w-8 mx-auto mb-1" />
                        <span className="text-2xl font-bold">#{step.number}</span>
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                      <p className="text-muted-foreground mb-3">{step.description}</p>
                      <ul className="space-y-1.5">
                        {step.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex justify-center -mb-3 relative z-10">
                      <div className="w-0.5 h-6 bg-border" />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Prêt à rejoindre le Club ?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/subscription')}>
              <Crown className="h-5 w-5 mr-2" />
              Voir les offres
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
              <UserPlus className="h-5 w-5 mr-2" />
              Créer un compte
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            <Smartphone className="inline h-4 w-4 mr-1" />
            Besoin d'aide ? Contactez-nous sur{" "}
            <a href="https://wa.me/+2250707167921" target="_blank" rel="noopener" className="text-primary hover:underline font-medium">
              WhatsApp : +225 07 07 16 79 21
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubscriptionGuide;
