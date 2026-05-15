import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, Users, FolderKanban, FileText, CreditCard, 
  Receipt, BarChart3, Shield, Settings, CheckCircle,
  AlertTriangle, Info, HelpCircle, Newspaper, ArrowRight,
  Target, TrendingUp, Award, Zap, Globe, Phone
} from "lucide-react";

export const AdminGuide = () => {
  const sections = [
    {
      id: "overview",
      icon: BarChart3,
      title: "Vue d'ensemble",
      description: "Tableau de bord principal avec les KPIs essentiels",
      content: [
        "Consultez les statistiques en temps réel : projets, utilisateurs, demandes",
        "Visualisez les graphiques d'évolution mensuelle",
        "Identifiez rapidement les actions prioritaires",
        "Suivez les performances globales de la plateforme"
      ]
    },
    {
      id: "projects",
      icon: FolderKanban,
      title: "Gestion des Projets",
      description: "Structuration, validation et labellisation des projets",
      content: [
        "Examinez les projets soumis par les porteurs",
        "Attribuez un score de crédibilité (A, B, C)",
        "Validez la structuration selon ISO 21500",
        "Orientez les projets vers les partenaires adaptés",
        "Publiez, rejetez ou archivez les projets",
        "Modifiez les informations des projets si nécessaire"
      ]
    },
    {
      id: "users",
      icon: Users,
      title: "Gestion des Utilisateurs",
      description: "Comptes, profils et vérifications",
      content: [
        "Consultez tous les utilisateurs inscrits",
        "Vérifiez les profils des porteurs de projets",
        "Gérez les types de comptes (individuel, entreprise, investisseur)",
        "Activez ou désactivez des comptes si nécessaire",
        "Consultez l'historique des activités utilisateurs"
      ]
    },
    {
      id: "requests",
      icon: FileText,
      title: "Demandes de Services",
      description: "Traitement des demandes de structuration et d'accès",
      content: [
        "Répondez aux demandes de structuration",
        "Traitez les demandes d'accompagnement",
        "Gérez les demandes d'accès aux projets",
        "Assignez les demandes aux experts disponibles",
        "Mettez à jour les statuts des demandes"
      ]
    },
    {
      id: "evaluations",
      icon: Award,
      title: "Évaluations MIPROJET SCORE",
      description: "Système d'évaluation et certification des projets",
      content: [
        "Créez des évaluations pour les projets soumis",
        "Ajustez les scores par axe (Porteur, Projet, Financier, etc.)",
        "Utilisez l'IA pour générer résumés et recommandations",
        "Certifiez les projets avec le label MIPROJET",
        "Modifiez ou supprimez les évaluations existantes",
        "Générez des rapports PDF professionnels"
      ]
    },
    {
      id: "referrals",
      icon: TrendingUp,
      title: "Parrainages (MiP)",
      description: "Système de parrainage et commissions",
      content: [
        "Suivez les parrainages actifs",
        "Validez les commissions des parrains (6.5%)",
        "Gérez les conversions MiP (1 MiP = 1230 FCFA)",
        "Consultez l'historique des paiements de commissions"
      ]
    },
    {
      id: "payments",
      icon: CreditCard,
      title: "Paiements",
      description: "Suivi des transactions et paiements",
      content: [
        "Consultez l'historique des paiements",
        "Vérifiez les statuts (en attente, complété, échoué)",
        "Suivez les revenus de la plateforme",
        "Exportez les rapports financiers"
      ]
    },
    {
      id: "invoices",
      icon: Receipt,
      title: "Facturation",
      description: "Gestion des factures clients",
      content: [
        "Générez des factures pour les services",
        "Sélectionnez automatiquement les clients et services",
        "Suivez les factures en attente de paiement",
        "Ajoutez automatiquement cachet et signature",
        "Envoyez les factures par notification et email"
      ]
    },
    {
      id: "news",
      icon: Newspaper,
      title: "Actualités",
      description: "Publication et gestion du contenu avec IA",
      content: [
        "Rédigez et publiez des actualités",
        "Utilisez l'éditeur IA pour structurer le contenu",
        "Téléchargez images (20 Mo) et vidéos (500 Mo)",
        "Gérez les articles de blog",
        "Planifiez et archivez les publications"
      ]
    },
    {
      id: "faq",
      icon: HelpCircle,
      title: "FAQ",
      description: "Questions fréquentes",
      content: [
        "Ajoutez de nouvelles questions/réponses",
        "Organisez les FAQ par catégorie",
        "Mettez à jour les réponses existantes",
        "Activez/désactivez les FAQ"
      ]
    },
    {
      id: "security",
      icon: Shield,
      title: "Base de données",
      description: "Gestion et sauvegarde des données",
      content: [
        "Consultez les tables de la base de données",
        "Exportez les données en JSON ou CSV",
        "Créez des sauvegardes manuelles",
        "Surveillez la santé de la base de données"
      ]
    },
    {
      id: "settings",
      icon: Settings,
      title: "Paramètres",
      description: "Configuration de la plateforme",
      content: [
        "Configurez les options de la plateforme",
        "Gérez les notifications",
        "Personnalisez les emails automatiques",
        "Configurez les intégrations"
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full mb-4">
            <BookOpen className="h-5 w-5" />
            <span className="font-medium">Guide d'administration</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Documentation Admin MIPROJET
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Ce guide complet vous accompagne dans l'utilisation de l'interface d'administration. 
            Maîtrisez la gestion des projets, utilisateurs, évaluations et services.
          </p>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">Bonnes pratiques</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">Validez chaque projet avec un score de crédibilité avant orientation vers les partenaires</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-200">Attention</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">Vérifiez toujours les documents et informations avant de publier ou certifier un projet</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-sm text-blue-800 dark:text-blue-200">Rappel important</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">MIPROJET structure et oriente les projets sans collecte de fonds directe</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/50">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Workflow de traitement des projets
          </CardTitle>
          <CardDescription>Les 5 étapes clés pour traiter un projet soumis sur MIPROJET</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: 1, title: "Réception", desc: "Nouveau projet soumis par un porteur", icon: FolderKanban },
              { step: 2, title: "Analyse", desc: "Examen des documents et faisabilité", icon: FileText },
              { step: 3, title: "Structuration", desc: "Business plan selon ISO 21500", icon: Target },
              { step: 4, title: "Évaluation", desc: "Attribution du MIPROJET SCORE", icon: Award },
              { step: 5, title: "Orientation", desc: "Vers partenaires adaptés", icon: Globe },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center text-center p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-3">
                      {item.step}
                    </div>
                    <Icon className="h-6 w-6 text-primary mb-2" />
                    <p className="font-semibold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                  {index < 4 && (
                    <div className="hidden md:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sections Accordion */}
      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités par section</CardTitle>
          <CardDescription>
            Cliquez sur une section pour découvrir les détails et actions disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <AccordionItem key={section.id} value={section.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{section.title}</p>
                        <p className="text-xs text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 pl-14 pt-2">
                      {section.content.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardContent className="p-8 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
            <Phone className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold text-xl mb-2">Besoin d'aide supplémentaire ?</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Notre équipe technique est disponible pour vous accompagner dans l'utilisation de la plateforme.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Badge variant="outline" className="text-base py-2 px-4">
              📧 support@miprojet.com
            </Badge>
            <Badge variant="outline" className="text-base py-2 px-4">
              📞 +225 07 07 16 79 21
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
