import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Search, Briefcase, ArrowRight, Bell } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Tender = {
  id: string;
  notice_title: string;
  notice_deadline: string;
  org_country: string;
  country_name: string | null;
  sector: string | null;
  summary: string | null;
  keywords: string[] | null;
  slug: string | null;
  view_count: number | null;
};

const flagEmoji = (iso: string) => {
  if (!iso || iso.length !== 2) return "🌍";
  const A = 0x1f1e6;
  return String.fromCodePoint(...iso.toUpperCase().split("").map((c) => A + c.charCodeAt(0) - 65));
};

const Tenders = () => {
  const [items, setItems] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<string>("all");
  const [sector, setSector] = useState<string>("all");
  const [sort, setSort] = useState<"deadline" | "newest">("deadline");
  const [page, setPage] = useState(1);
  const PER_PAGE = 24;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("tenders")
        .select("id,notice_title,notice_deadline,org_country,country_name,sector,summary,keywords,slug,view_count")
        .eq("status", "active")
        .order("notice_deadline", { ascending: true })
        .limit(2000);
      if (!error) setItems((data as Tender[]) || []);
      setLoading(false);
    })();
  }, []);

  const countries = useMemo(() => {
    const m = new Map<string, string>();
    items.forEach((t) => m.set(t.org_country, t.country_name || t.org_country));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);
  const sectors = useMemo(
    () => Array.from(new Set(items.map((t) => t.sector).filter(Boolean))) as string[],
    [items]
  );

  const filtered = useMemo(() => {
    let arr = items;
    const q = search.trim().toLowerCase();
    if (q) arr = arr.filter((t) => t.notice_title.toLowerCase().includes(q));
    if (country !== "all") arr = arr.filter((t) => t.org_country === country);
    if (sector !== "all") arr = arr.filter((t) => t.sector === sector);
    if (sort === "newest") {
      arr = [...arr].sort((a, b) => +new Date(b.notice_deadline) - +new Date(a.notice_deadline));
    }
    return arr;
  }, [items, search, country, sector, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  useEffect(() => setPage(1), [search, country, sector, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Appels d'offres — MIPROJET"
        description="Découvrez chaque jour les appels d'offres publics et privés d'Afrique et du monde sur MIPROJET."
      />
      <Navigation />
      <main className="pt-32 pb-16">
        {/* Hero */}
        <section className="container-luxe">
          <div
            className="rounded-3xl p-8 md:p-12 text-white shadow-elegant"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Badge className="bg-white/20 text-white border-white/30 mb-4">
              <Briefcase className="h-3.5 w-3.5 mr-1.5" /> Mises à jour quotidiennes
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-3">
              Appels d'offres en Afrique & dans le monde
            </h1>
            <p className="text-white/90 text-lg max-w-3xl">
              Marchés publics et privés filtrés et résumés pour vous. Trouvez les opportunités
              qui correspondent à votre activité et soumissionnez dans les délais.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                  <Bell className="h-4 w-4 mr-2" /> Recevoir les alertes
                </Button>
              </Link>
              <Link to="/subscription">
                <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  Accéder aux archives Premium
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="container-luxe mt-8">
          <div className="grid md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par mot-clé…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue placeholder="Pays" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tous les pays</SelectItem>
                  {countries.map(([iso, name]) => (
                    <SelectItem key={iso} value={iso}>{flagEmoji(iso)} {name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tous secteurs</SelectItem>
                  {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Select value={sort} onValueChange={(v: any) => setSort(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Tri : deadline ↑</SelectItem>
                  <SelectItem value="newest">Tri : récent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {loading ? "Chargement…" : `${filtered.length} appel${filtered.length > 1 ? "s" : ""} d'offre trouvé${filtered.length > 1 ? "s" : ""}`}
          </p>
        </section>

        {/* Grid */}
        <section className="container-luxe mt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paged.map((t) => {
              const dl = new Date(t.notice_deadline);
              const days = Math.ceil((+dl - Date.now()) / 86400000);
              const urgent = days <= 7;
              return (
                <Link key={t.id} to={`/appels-doffres/${t.slug || t.id}`}>
                  <Card className="h-full hover:shadow-elegant transition-all border-border/60 hover:border-primary/40 group">
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl leading-none">{flagEmoji(t.org_country)}</span>
                          <span className="text-xs font-medium text-muted-foreground">
                            {t.country_name || t.org_country}
                          </span>
                        </div>
                        {t.sector && (
                          <Badge variant="secondary" className="text-[10px]">{t.sector}</Badge>
                        )}
                      </div>
                      <h3 className="font-semibold leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                        {t.notice_title}
                      </h3>
                      {t.summary && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{t.summary}</p>
                      )}
                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(dl, "dd MMM yyyy", { locale: fr })}
                        </span>
                        <Badge
                          className={
                            urgent
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-primary/10 text-primary border-primary/20"
                          }
                          variant="outline"
                        >
                          {days >= 0 ? `J-${days}` : "Expiré"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">Aucun appel d'offre ne correspond à vos critères.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Précédent
              </Button>
              <span className="text-sm px-3">Page {page} / {totalPages}</span>
              <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Suivant
              </Button>
            </div>
          )}
        </section>

        {/* CTA bottom */}
        <section className="container-luxe mt-16">
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 border border-primary/20 p-8 md:p-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">
              Recevez les appels d'offres qui vous intéressent
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              Inscrivez-vous gratuitement pour recevoir des alertes ciblées par pays et secteur,
              accéder aux archives, et débloquer les filtres avancés.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/auth"><Button size="lg" className="font-semibold"><Bell className="h-4 w-4 mr-2" /> Créer un compte gratuit</Button></Link>
              <Link to="/subscription"><Button size="lg" variant="outline" className="font-semibold">Voir les abonnements <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Tenders;
