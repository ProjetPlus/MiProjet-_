import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { SocialSharePopup } from "@/components/SocialSharePopup";
import ebookCover from "@/assets/ebook-cover-new.png";
import {
  BookOpen, Download, CheckCircle, TrendingUp, Shield,
  Users, Lightbulb, Share2, Eye
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const highlights = [
  "Agriculture & Agro-industrie",
  "Santé & Infrastructures médicales",
  "Immobilier & Résidences locatives",
  "Logistique & Transport",
  "Digital & Technologie",
  "Énergie & Infrastructures",
  "Industrie de transformation",
  "Commerce & Distribution",
];

const features = [
  { icon: TrendingUp, text: "50 projets analysés et structurés" },
  { icon: Shield, text: "Étude de rentabilité pour chaque projet" },
  { icon: Users, text: "Adapté aux investisseurs débutants et confirmés" },
  { icon: Lightbulb, text: "Secteurs porteurs identifiés" },
];

const Ebook = () => {
  const [showForm, setShowForm] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [showShare, setShowShare] = useState(false);
  const [docRecord, setDocRecord] = useState<any>(null);

  useEffect(() => {
    document.title = "E-book : 50 Opportunités d'Investissement | MIPROJET";
    const setMetaTag = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!meta) { meta = document.createElement("meta"); meta.setAttribute("property", property); document.head.appendChild(meta); }
      meta.content = content;
    };
    const setNameTag = (name: string, content: string) => {
      let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!meta) { meta = document.createElement("meta"); meta.setAttribute("name", name); document.head.appendChild(meta); }
      meta.content = content;
    };
    const ogTitle = "50 Opportunités d'Investissement Rentables en Côte d'Ivoire";
    const ogDesc = "Découvrez notre sélection exclusive de projets d'investissement analysés et structurés par les experts de MIPROJET. Guide gratuit.";
    const ogImage = window.location.origin + ebookCover;
    setMetaTag("og:title", ogTitle);
    setMetaTag("og:description", ogDesc);
    setMetaTag("og:image", ogImage);
    setMetaTag("og:url", window.location.href);
    setMetaTag("og:type", "article");
    setMetaTag("og:site_name", "MIPROJET");
    setNameTag("twitter:card", "summary_large_image");
    setNameTag("twitter:title", ogTitle);
    setNameTag("twitter:description", ogDesc);
    setNameTag("twitter:image", ogImage);
    setNameTag("description", ogDesc);
    fetchDocumentRecord();
  }, []);


  const fetchDocumentRecord = async () => {
    // Try to find the document in platform_documents
    const { data } = await supabase
      .from('platform_documents')
      .select('*')
      .ilike('title', '%50 Opportun%')
      .eq('is_active', true)
      .limit(1);

    if (data && data.length > 0) {
      setDocRecord(data[0]);
      setDownloadCount((data[0] as any).download_count || 0);
    } else {
      // Fallback: count from leads
      const { count } = await supabase.from("leads" as any).select("*", { count: "exact", head: true }).eq("lead_source", "ebook");
      if (count) setDownloadCount(count);
    }
  };

  const pdfUrl = docRecord?.file_url || "/50_Opportunités_d'Investissement_Rentables_en_Côte_d'Ivoire.pdf";

  const handleDownloadSuccess = () => {
    setShowForm(false);
    setUnlocked(true);
    setDownloadCount(prev => prev + 1);
    window.open(pdfUrl, "_blank");
    // Update download count in DB
    if (docRecord) {
      supabase.from('platform_documents')
        .update({ download_count: (docRecord.download_count || 0) + 1 } as any)
        .eq('id', docRecord.id)
        .then();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-success/10 text-success">🎁 GUIDE GRATUIT</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">
              50 Opportunités d'Investissement Rentables en Côte d'Ivoire
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez notre sélection exclusive de projets d'investissement analysés et structurés par
              les experts de MIPROJET. Un guide pratique pour identifier les meilleures opportunités du marché ivoirien.
            </p>
          </div>

          {/* Main CTA Card with Cover */}
          <Card className="mb-12 bg-gradient-to-br from-primary/5 via-accent/5 to-success/5 border-primary/20">
            <CardContent className="p-8 sm:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Cover Image */}
                <div className="shrink-0">
                  <img 
                    src={ebookCover} 
                    alt="Couverture du guide 50 Opportunités d'Investissement" 
                    className="w-48 md:w-56 rounded-lg shadow-xl"
                  />
                </div>

                <div className="text-center md:text-left flex-1">
                  <h2 className="text-2xl font-bold mb-4">Téléchargez votre guide gratuitement</h2>
                  <p className="text-muted-foreground mb-4 max-w-xl">
                    Remplissez le formulaire ci-dessous pour recevoir instantanément votre copie du guide
                    des 50 opportunités d'investissement les plus rentables en Côte d'Ivoire.
                  </p>

                  <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{downloadCount}+ téléchargements</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowShare(true)} className="gap-1">
                      <Share2 className="h-4 w-4" /> Partager
                    </Button>
                  </div>

                  {unlocked ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center md:justify-start gap-2 text-success">
                        <CheckCircle className="h-6 w-6" />
                        <span className="font-semibold">Guide débloqué !</span>
                      </div>
                      <Button size="lg" onClick={() => window.open(pdfUrl, "_blank")}>
                        <Download className="h-5 w-5 mr-2" />
                        Télécharger à nouveau
                      </Button>
                      <div>
                        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                          Cliquer ici pour télécharger votre document
                        </a>
                      </div>
                    </div>
                  ) : (
                    <Button size="lg" onClick={() => setShowForm(true)} className="gap-2">
                      <Download className="h-5 w-5" />
                      Télécharger le guide gratuit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's inside */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Ce que contient le guide</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{f.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sectors covered */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Secteurs couverts</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {highlights.map((h, i) => (
                <Badge key={i} variant="secondary" className="text-sm py-2 px-4">{h}</Badge>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-3">Ne manquez pas cette opportunité</h3>
              <p className="opacity-90 mb-6">
                Rejoignez plus de {downloadCount > 0 ? downloadCount : 500} investisseurs qui ont déjà téléchargé ce guide.
              </p>
              {!unlocked && (
                <Button variant="secondary" size="lg" onClick={() => setShowForm(true)} className="gap-2">
                  <Download className="h-5 w-5" />
                  Obtenir mon guide gratuit
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />

      <LeadCaptureForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleDownloadSuccess}
        leadSource="ebook"
        title="Télécharger le guide des 50 opportunités"
        description="Renseignez vos coordonnées pour recevoir votre guide gratuit"
        showInvestorFields={true}
      />

      <SocialSharePopup
        open={showShare}
        onClose={() => setShowShare(false)}
        url={window.location.href}
        title="50 Opportunités d'Investissement Rentables en Côte d'Ivoire"
        description="Découvrez notre sélection exclusive de projets d'investissement analysés par MIPROJET."
        imageUrl={window.location.origin + ebookCover}
        shareType={docRecord?.id ? "ebook" : undefined}
        shareId={docRecord?.id}
        shortSlug={(docRecord as any)?.short_slug || undefined}
        cta="Télécharger le guide gratuit sur MIPROJET"
      />
    </div>
  );
};

export default Ebook;
