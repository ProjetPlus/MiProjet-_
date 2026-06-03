import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, MapPin, Briefcase, Eye, Lock, Bell } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const flagEmoji = (iso: string) => {
  if (!iso || iso.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(...iso.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65));
};

const TenderDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      let { data } = await (supabase as any).from("tenders").select("*").eq("slug", slug).maybeSingle();
      if (!data) {
        const r = await (supabase as any).from("tenders").select("*").eq("id", slug).maybeSingle();
        data = r.data;
      }
      setTender(data);
      setLoading(false);
      if (data?.id) {
        try { await (supabase as any).rpc("increment_tender_views", { _id: data.id }); } catch {}
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-32 container-luxe">
          <div className="animate-pulse h-64 rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }
  if (!tender) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-40 container-luxe text-center">
          <h1 className="text-2xl font-bold mb-2">Appel d'offre introuvable</h1>
          <Button onClick={() => navigate("/appels-doffres")} className="mt-4">Retour à la liste</Button>
        </div>
      </div>
    );
  }

  const dl = new Date(tender.notice_deadline);
  const days = Math.ceil((+dl - Date.now()) / 86400000);
  const archived = tender.status === "archived";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${tender.notice_title} — MIPROJET`} description={tender.summary || ""} />
      <Navigation />
      <main className="pt-28 pb-16">
        <div className="container-luxe max-w-4xl">
          <Link to="/appels-doffres" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Retour aux appels d'offres
          </Link>

          <Card>
            <CardContent className="p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-3xl">{flagEmoji(tender.org_country)}</span>
                <Badge variant="secondary" className="text-sm">{tender.country_name || tender.org_country}</Badge>
                {tender.sector && (
                  <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">
                    <Briefcase className="h-3 w-3 mr-1" />{tender.sector}
                  </Badge>
                )}
                {archived && <Badge variant="destructive">Expiré</Badge>}
              </div>

              <h1 className="text-2xl md:text-4xl font-bold leading-tight mb-4">{tender.notice_title}</h1>

              <div className="grid sm:grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-muted/40">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date limite</p>
                    <p className="font-semibold">{format(dl, "dd MMMM yyyy", { locale: fr })}</p>
                    <p className="text-xs text-muted-foreground">{format(dl, "HH:mm")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pays émetteur</p>
                    <p className="font-semibold">{tender.country_name || tender.org_country}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <p className="font-semibold">{archived ? "Expiré" : days >= 0 ? `J-${days}` : "—"}</p>
                  </div>
                </div>
              </div>

              {tender.summary && (
                <div className="prose prose-neutral max-w-none">
                  <h2 className="text-lg font-semibold mb-2">Résumé</h2>
                  <p className="text-muted-foreground leading-relaxed">{tender.summary}</p>
                </div>
              )}

              {tender.keywords?.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-semibold mb-2">Mots-clés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {tender.keywords.map((k: string) => (
                      <Badge key={k} variant="outline" className="text-xs">#{k}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-border">
                <div className="rounded-xl p-6 text-white" style={{ background: "var(--gradient-brand)" }}>
                  <div className="flex items-start gap-3 mb-3">
                    <Lock className="h-5 w-5 mt-0.5" />
                    <div>
                      <p className="font-bold text-lg">Accéder à l'offre complète</p>
                      <p className="text-white/90 text-sm">
                        Inscrivez-vous gratuitement sur MIPROJET pour consulter le dossier complet,
                        recevoir les alertes ciblées et accéder aux archives premium.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link to="/auth">
                      <Button className="bg-white text-primary hover:bg-white/90 font-bold">
                        <Bell className="h-4 w-4 mr-1.5" /> Créer un compte
                      </Button>
                    </Link>
                    <Link to="/subscription">
                      <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                        Voir les abonnements
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TenderDetail;
