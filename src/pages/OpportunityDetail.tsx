import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { 
  ArrowLeft, Calendar, MapPin, Banknote, Mail, Phone,
  ExternalLink, Loader2, Crown, Lock, Users, Clock, Share2
} from "lucide-react";
import { SocialSharePopup } from "@/components/SocialSharePopup";
import { ArticleLayout, RelatedItem } from "@/components/article/ArticleLayout";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  content: string;
  opportunity_type: string;
  category: string;
  image_url: string | null;
  deadline: string | null;
  location: string | null;
  eligibility: string | null;
  amount_min: number | null;
  amount_max: number | null;
  currency: string;
  external_link: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_featured: boolean;
  is_premium: boolean;
  views_count: number;
  published_at: string | null;
}

const OpportunityDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [related, setRelated] = useState<any[]>([]);
  const { toast } = useToast();
  const newsletter = useNewsletterSubscribe("opportunity");

  useEffect(() => {
    if (opportunity) {
      document.title = `${opportunity.title} | MIPROJET`;
      const setMeta = (attr: string, key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
        if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
        el.content = content;
      };
      const desc = opportunity.description || opportunity.content?.substring(0, 160) || "";
      const img = opportunity.image_url || window.location.origin + "/favicon.png";
      setMeta("property", "og:title", opportunity.title);
      setMeta("property", "og:description", desc);
      setMeta("property", "og:image", img);
      setMeta("property", "og:url", window.location.href);
      setMeta("property", "og:type", "article");
      setMeta("name", "twitter:card", "summary_large_image");
      setMeta("name", "twitter:title", opportunity.title);
      setMeta("name", "twitter:description", desc);
      setMeta("name", "twitter:image", img);
    }
  }, [opportunity]);

  useEffect(() => {
    if (id) fetchOpportunity();
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("opportunities")
        .select("id, title, image_url, published_at, views_count")
        .eq("status", "published")
        .neq("id", id || "")
        .order("published_at", { ascending: false })
        .limit(3);
      if (data) setRelated(data);
    })();
  }, [id]);

  const fetchOpportunity = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('opportunities')
      .select('id,title,description,content,opportunity_type,category,image_url,deadline,location,eligibility,amount_min,amount_max,currency,is_featured,is_premium,views_count,published_at,short_slug,status,is_active')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (!error && data) {
      setOpportunity({ ...(data as any), contact_email: null, contact_phone: null, external_link: null });
      await supabase.from('opportunities').update({ views_count: ((data as any).views_count || 0) + 1 }).eq('id', id);
    }
    setLoading(false);
  };

  // Determine access level
  const isPremium = opportunity?.is_premium;
  const canSeeStrategicInfo = isPremium
    ? (user && hasActiveSubscription)
    : hasAccess; // Free opps need lead capture for strategic info

  if (loading || authLoading || subLoading) {
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

  // Premium opp without subscription
  if (isPremium && (!user || !hasActiveSubscription)) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-amber-500/10 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Crown className="h-10 w-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Opportunité Premium</h1>
            <p className="text-muted-foreground mb-6">
              Cette opportunité est réservée aux abonnés MIPROJET. Abonnez-vous pour accéder au contenu complet.
            </p>
            <div className="space-y-3">
              {!user && (
                <Button onClick={() => navigate('/auth?redirect=/opportunities/' + id)} variant="outline" className="w-full">
                  Se connecter
                </Button>
              )}
              <Button onClick={() => navigate('/subscription')} className="w-full">
                <Crown className="h-4 w-4 mr-2" /> S'abonner
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-28 md:pt-32 pb-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Opportunité non trouvée</h1>
          <Button onClick={() => navigate('/opportunities')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const subtitle = opportunity.description;
  const relatedItems: RelatedItem[] = related.map((r) => ({
    id: r.id,
    title: r.title,
    image: r.image_url,
    date: r.published_at,
    views: r.views_count,
    href: `/opportunities/${r.id}`,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-28 md:pt-32">
        <ArticleLayout
          backHref="/opportunities"
          backLabel="Retour aux opportunités"
          topTag={isPremium ? "Opportunité Premium" : "Opportunité"}
          category={opportunity.opportunity_type}
          title={opportunity.title}
          subtitle={subtitle}
          image={opportunity.image_url}
          imageAlt={opportunity.title}
          author="MIPROJET"
          dateISO={opportunity.published_at}
          viewsCount={opportunity.views_count}
          contentHtml={opportunity.content}
          preContent={
            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {opportunity.deadline && (
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div><p className="text-xs text-muted-foreground">Date limite</p>
                  <p className="font-medium">{format(new Date(opportunity.deadline), "d MMMM yyyy", { locale: fr })}</p></div>
                </CardContent></Card>
              )}
              {opportunity.location && (
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div><p className="text-xs text-muted-foreground">Localisation</p>
                  <p className="font-medium">{opportunity.location}</p></div>
                </CardContent></Card>
              )}
              {(opportunity.amount_min || opportunity.amount_max) && (
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <Banknote className="h-5 w-5 text-primary" />
                  <div><p className="text-xs text-muted-foreground">Montant</p>
                  <p className="font-medium">
                    {opportunity.amount_min && opportunity.amount_max
                      ? `${opportunity.amount_min.toLocaleString()} - ${opportunity.amount_max.toLocaleString()} ${opportunity.currency}`
                      : opportunity.amount_max
                      ? `Jusqu'à ${opportunity.amount_max.toLocaleString()} ${opportunity.currency}`
                      : `À partir de ${opportunity.amount_min?.toLocaleString()} ${opportunity.currency}`}
                  </p></div>
                </CardContent></Card>
              )}
            </div>
          }
          postContent={
            <>
              {opportunity.eligibility && (
                <Card className="my-8"><CardContent className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="h-5 w-5" /> Critères d'éligibilité</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{opportunity.eligibility}</p>
                </CardContent></Card>
              )}
              {!canSeeStrategicInfo && !isPremium && (
                <Card className="my-8 border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-8 text-center">
                    <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Informations stratégiques</h3>
                    <p className="text-muted-foreground mb-6">Pour accéder au lien de candidature, remplissez le formulaire.</p>
                    <Button onClick={() => setShowLeadForm(true)} size="lg">Voir les informations pour postuler</Button>
                  </CardContent>
                </Card>
              )}
              {canSeeStrategicInfo && (opportunity.contact_email || opportunity.contact_phone || opportunity.external_link) && (
                <Card className="my-8"><CardContent className="p-6 space-y-3">
                  <h3 className="font-semibold">Contact & Candidature</h3>
                  {opportunity.contact_email && (
                    <a href={`mailto:${opportunity.contact_email}`} className="flex items-center gap-3 text-primary hover:underline"><Mail className="h-5 w-5" /> {opportunity.contact_email}</a>
                  )}
                  {opportunity.contact_phone && (
                    <a href={`tel:${opportunity.contact_phone}`} className="flex items-center gap-3 text-primary hover:underline"><Phone className="h-5 w-5" /> {opportunity.contact_phone}</a>
                  )}
                  {opportunity.external_link && (
                    <Button asChild className="w-full"><a href={opportunity.external_link} target="_blank" rel="noopener noreferrer">Postuler / En savoir plus<ExternalLink className="h-4 w-4 ml-2" /></a></Button>
                  )}
                </CardContent></Card>
              )}
            </>
          }
          onShare={() => setShowShare(true)}
          relatedTitle="Opportunités similaires"
          relatedItems={relatedItems}
          relatedHref="/opportunities"
          onNewsletterSubmit={(email) => newsletter.subscribe(email)}
        />
      </main>
      <Footer />

      <LeadCaptureForm
        open={showLeadForm}
        onClose={() => setShowLeadForm(false)}
        onSuccess={() => { setShowLeadForm(false); setHasAccess(true); }}
        leadSource="opportunity"
        sourceId={opportunity?.id}
        title="Accéder aux informations de candidature"
        description="Renseignez vos coordonnées pour voir le lien de candidature et les informations stratégiques"
      />

      {opportunity && (
        <SocialSharePopup
          open={showShare}
          onClose={() => setShowShare(false)}
          url={`${window.location.origin}/opportunities/${opportunity.id}`}
          title={opportunity.title}
          description={opportunity.description || opportunity.content.substring(0, 150)}
          imageUrl={opportunity.image_url || undefined}
          shareType="opportunity"
          shareId={opportunity.id}
          shortSlug={(opportunity as any).short_slug || undefined}
          cta="Découvrir cette opportunité sur MIPROJET"
        />
      )}
    </div>
  );
};

export default OpportunityDetail;
