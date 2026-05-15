import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, HelpCircle, FileText, CreditCard, Users, Shield, Briefcase, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sort_order: number;
}

const FAQ = () => {
  const { t } = useLanguage();
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: t('faq.allCategories') || "Toutes les questions", icon: HelpCircle },
    { id: "general", label: t('faq.categoryGeneral') || "Général", icon: FileText },
    { id: "projects", label: t('faq.categoryProjects') || "Projets", icon: Briefcase },
    { id: "funding", label: t('faq.categoryFunding') || "Financement", icon: CreditCard },
    { id: "account", label: t('faq.categoryAccount') || "Compte", icon: Users },
    { id: "security", label: t('faq.categorySecurity') || "Sécurité", icon: Shield },
    { id: "enterprise", label: t('faq.categoryEnterprise') || "Entreprises", icon: Building },
  ];

  // Default FAQs if database is empty
  const defaultFaqs: FAQItem[] = [
    {
      id: "1",
      question: "Comment soumettre un projet sur MIPROJET ?",
      answer: "Pour soumettre un projet, créez d'abord un compte sur la plateforme. Ensuite, accédez à votre tableau de bord et cliquez sur « Soumettre un projet ». Remplissez le formulaire avec les détails de votre projet, incluant la description, le montant recherché, et les documents justificatifs.",
      category: "projects",
      sort_order: 1
    },
    {
      id: "2",
      question: "Quels sont les types de financement disponibles ?",
      answer: "MIPROJET propose plusieurs types de financement : l'investissement en capital (equity), les prêts participatifs, les subventions de bailleurs de fonds, et les partenariats stratégiques. Chaque type est adapté à des besoins et des stades de développement différents.",
      category: "funding",
      sort_order: 2
    },
    {
      id: "3",
      question: "Combien coûtent les services de structuration ?",
      answer: "Les frais de structuration varient selon la complexité du projet et les services requis. Nous proposons une analyse préliminaire gratuite pour évaluer vos besoins. Les tarifs détaillés vous sont communiqués après cette première évaluation.",
      category: "funding",
      sort_order: 3
    },
    {
      id: "4",
      question: "Quels documents sont nécessaires pour mon dossier ?",
      answer: "Les documents de base incluent : plan d'affaires, états financiers (si existants), pièces d'identité des dirigeants, statuts de l'entreprise, et une présentation du projet. Notre équipe vous guidera sur les documents spécifiques selon votre secteur.",
      category: "projects",
      sort_order: 4
    },
    {
      id: "5",
      question: "Comment fonctionne le processus de validation ?",
      answer: "Après soumission, votre projet est analysé par notre équipe d'experts. Nous évaluons la viabilité, le potentiel de marché, et les risques. Ce processus prend généralement 5 à 10 jours ouvrables. Vous recevez ensuite un retour détaillé avec nos recommandations.",
      category: "projects",
      sort_order: 5
    },
    {
      id: "6",
      question: "Comment créer un compte sur MIPROJET ?",
      answer: "Cliquez sur « S'inscrire » en haut de la page. Remplissez le formulaire avec vos informations personnelles et professionnelles. Un email de confirmation vous sera envoyé pour activer votre compte.",
      category: "account",
      sort_order: 6
    },
    {
      id: "7",
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui, nous utilisons des protocoles de sécurité de pointe. Toutes les données sont chiffrées, et nous respectons les normes RGPD. Vos informations financières sont protégées par des mesures de sécurité bancaires.",
      category: "security",
      sort_order: 7
    },
    {
      id: "8",
      question: "Quels pays sont éligibles ?",
      answer: "MIPROJET opère actuellement dans 15+ pays d'Afrique de l'Ouest et Centrale, incluant la Côte d'Ivoire, le Sénégal, le Mali, le Burkina Faso, le Togo, le Bénin, le Niger, le Cameroun, et d'autres. Nous étendons progressivement notre couverture.",
      category: "general",
      sort_order: 8
    },
    {
      id: "9",
      question: "Proposez-vous des services pour les grandes entreprises ?",
      answer: "Oui, nous offrons des services d'accompagnement sur mesure pour les PME et grandes entreprises : levée de fonds, restructuration financière, conseil en stratégie, et mise en relation avec des investisseurs institutionnels.",
      category: "enterprise",
      sort_order: 9
    },
    {
      id: "10",
      question: "Comment contacter l'équipe MIPROJET ?",
      answer: "Vous pouvez nous contacter via le formulaire de contact sur notre site, par email à info@ivoireprojet.com, ou par téléphone. Notre équipe répond généralement sous 24h.",
      category: "general",
      sort_order: 10
    },
  ];

  useEffect(() => {
    document.title = `FAQ | MIPROJET`;
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (!error && data && data.length > 0) {
      setFaqs(data);
    } else {
      // Use default FAQs if none in database
      setFaqs(defaultFaqs);
    }
    setLoading(false);
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat ? cat.icon : HelpCircle;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      
      <main className="flex-1 pt-28 md:pt-32">
        {/* Header */}
        <section className="bg-primary py-16 text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-primary-foreground/10 rounded-full mb-4">
              <HelpCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              {t('faq.pageTitle') || 'Foire aux Questions'}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              {t('faq.pageSubtitle') || 'Trouvez rapidement des réponses à vos questions sur MIPROJET'}
            </p>
          </div>
        </section>

        {/* Search */}
        <section className="py-8 border-b border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('faq.searchPlaceholder') || "Rechercher une question..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              {/* Category Tabs */}
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
                <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-center">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <TabsTrigger
                        key={cat.id}
                        value={cat.id}
                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 px-4 py-2"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{cat.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>

              {/* FAQ List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredFaqs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">
                    {t('faq.noResults') || 'Aucune question trouvée pour votre recherche'}
                  </p>
                </div>
              ) : (
                <Accordion type="single" collapsible className="space-y-4">
                  {filteredFaqs.map((faq, index) => {
                    const Icon = getCategoryIcon(faq.category);
                    return (
                      <AccordionItem
                        key={faq.id}
                        value={faq.id}
                        className="bg-card border border-border rounded-lg px-6 data-[state=open]:shadow-md transition-shadow"
                      >
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-start gap-3 text-left">
                            <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="pl-12">
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                            <Badge variant="secondary" className="mt-3">
                              {categories.find(c => c.id === faq.category)?.label || faq.category}
                            </Badge>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              )}

              {/* Contact CTA */}
              <div className="mt-12 text-center p-8 bg-muted/50 rounded-2xl">
                <h3 className="text-xl font-semibold mb-2">
                  {t('faq.stillNeedHelp') || "Vous n'avez pas trouvé votre réponse ?"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t('faq.contactUs') || "Notre équipe est là pour vous aider"}
                </p>
                <a href="/contact" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                  {t('faq.contactLink') || "Contactez-nous"}
                  <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default FAQ;
