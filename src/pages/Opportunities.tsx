import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import {
  Search, Filter, Crown, Lock, Calendar, MapPin, Award,
  Loader2, Banknote, GraduationCap, Handshake, Gift, Briefcase, AlertCircle, Eye, CheckCircle2, TrendingUp, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Opportunity {
  id: string; title: string; description: string | null; content: string;
  opportunity_type: string; category: string; image_url: string | null;
  deadline: string | null; location: string | null; eligibility: string | null;
  amount_min: number | null; amount_max: number | null; currency: string;
  external_link: string | null; is_featured: boolean; is_premium: boolean;
  views_count: number; published_at: string | null;
}

interface CertifiedProject {
  id: string; title: string; sector: string | null; city: string | null;
  country: string | null; status: string | null; user_id: string;
  certification_status?: string; certification_type?: string;
}

const opportunityTypes = [
  { value: 'all', label: 'Toutes', icon: Briefcase },
  { value: 'funding', label: 'Financement', icon: Banknote },
  { value: 'training', label: 'Formation', icon: GraduationCap },
  { value: 'accompaniment', label: 'Accompagnement', icon: Handshake },
  { value: 'grant', label: 'Subvention', icon: Gift },
  { value: 'partnership', label: 'Partenariat', icon: Handshake },
];

const PLANS = [
  { name: "Découverte", price: "Gratuit", features: ["Opportunités publiques", "Profil de base", "Newsletter"], cta: "Commencer gratuitement", target: "/auth" },
  { name: "Starter", price: "5 000 FCFA / mois", features: ["Opportunités premium", "Filtres avancés", "Alertes email"], highlight: false, cta: "S'abonner", target: "/subscription" },
  { name: "Pro Investisseur", price: "25 000 FCFA / mois", features: ["Projets certifiés MiProjet+", "Mise en relation directe", "Rapports détaillés", "Support prioritaire"], highlight: true, cta: "Devenir Pro", target: "/subscription" },
];

const Opportunities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasActiveSubscription } = useSubscription();
  const [tab, setTab] = useState<string>("porteurs");
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [projects, setProjects] = useState<CertifiedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [certFilter, setCertFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => { document.title = "Opportunités | MIPROJET"; }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase.from('opportunities').select('*')
        .eq('status', 'published').eq('is_active', true)
        .order('is_featured', { ascending: false }).order('published_at', { ascending: false });
      if (selectedType !== 'all') q = q.eq('opportunity_type', selectedType);
      const { data } = await q;
      setOpportunities((data as any) || []);

      // Certified projects for investor tab
      const { data: certs } = await supabase
        .from('mp_certifications')
        .select('project_id, status, certification_type, mp_projects(id, title, sector, city, country, status, user_id)')
        .eq('status', 'certified');
      const list: CertifiedProject[] = ((certs as any) || [])
        .filter((c: any) => c.mp_projects)
        .map((c: any) => ({ ...c.mp_projects, certification_status: c.status, certification_type: c.certification_type }));
      setProjects(list);
      setLoading(false);
    })();
  }, [selectedType]);

  const getTypeIcon = (t: string) => opportunityTypes.find(x => x.value === t)?.icon || Briefcase;
  const getTypeLabel = (t: string) => opportunityTypes.find(x => x.value === t)?.label || t;

  const filteredOpps = opportunities.filter(o =>
    o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sectors = Array.from(new Set(projects.map(p => p.sector).filter(Boolean))) as string[];

  const filteredProjects = projects.filter(p => {
    if (certFilter !== "all" && p.certification_type !== certFilter) return false;
    if (sectorFilter !== "all" && p.sector !== sectorFilter) return false;
    if (locationFilter && !(`${p.city || ""} ${p.country || ""}`.toLowerCase().includes(locationFilter.toLowerCase()))) return false;
    if (stageFilter !== "all" && p.status !== stageFilter) return false;
    if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleViewOpp = (opp: Opportunity) => {
    if (opp.is_premium) {
      if (!user) { navigate('/auth?redirect=/opportunities'); return; }
      if (!hasActiveSubscription) { navigate('/subscription'); return; }
    }
    navigate(`/opportunities/${opp.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Opportunités & Projets</h1>
          <p className="text-muted-foreground">Financements, formations, accompagnements, et projets certifiés MiProjet+.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2 mx-auto md:mx-0">
            <TabsTrigger value="porteurs"><Briefcase className="h-4 w-4 mr-2" />Porteurs</TabsTrigger>
            <TabsTrigger value="investisseurs"><TrendingUp className="h-4 w-4 mr-2" />Investisseurs</TabsTrigger>
          </TabsList>

          {/* PORTEURS TAB */}
          <TabsContent value="porteurs" className="mt-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher une opportunité…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[200px]"><Filter className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                <SelectContent>{opportunityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredOpps.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune opportunité trouvée</h3>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOpps.map(opp => {
                  const TypeIcon = getTypeIcon(opp.opportunity_type);
                  const locked = opp.is_premium && !hasActiveSubscription;
                  return (
                    <Card key={opp.id} className={`hover:shadow-lg transition-shadow ${opp.is_featured ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}>
                      {opp.image_url && (
                        <div className="relative h-40 overflow-hidden rounded-t-lg">
                          <img src={opp.image_url} alt={opp.title} className="w-full h-full object-cover" />
                          <div className="absolute top-2 right-2 flex gap-1">
                            {opp.is_featured && <Badge className="bg-primary">À la une</Badge>}
                            {opp.is_premium ? <Badge className="bg-amber-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge> : <Badge className="bg-success text-white">Gratuit</Badge>}
                          </div>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <Badge variant="outline"><TypeIcon className="h-3 w-3 mr-1" />{getTypeLabel(opp.opportunity_type)}</Badge>
                          {opp.deadline && <Badge variant="secondary"><Calendar className="h-3 w-3 mr-1" />{format(new Date(opp.deadline), 'dd MMM yyyy', { locale: fr })}</Badge>}
                        </div>
                        <CardTitle className="text-lg line-clamp-2">{opp.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{opp.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {opp.location && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{opp.location}</div>}
                          {(opp.amount_min || opp.amount_max) && <div className="flex items-center gap-2 text-muted-foreground"><Banknote className="h-4 w-4" />{opp.amount_min?.toLocaleString()} - {opp.amount_max?.toLocaleString()} {opp.currency}</div>}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full" variant={opp.is_featured ? 'default' : 'outline'} onClick={() => handleViewOpp(opp)}>
                          {locked ? <><Lock className="h-4 w-4 mr-2" />Réservé aux abonnés</> : <><Eye className="h-4 w-4 mr-2" />Voir les détails</>}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* INVESTISSEURS TAB */}
          <TabsContent value="investisseurs" className="mt-6">
            <div className="grid md:grid-cols-5 gap-3 mb-6">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher un projet…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={certFilter} onValueChange={setCertFilter}>
                <SelectTrigger><SelectValue placeholder="Certification" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes certifications</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="elite">Elite</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous secteurs</SelectItem>
                  {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Localisation" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} />
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun projet certifié pour ces filtres</h3>
                <p className="text-muted-foreground">Ajustez vos filtres ou revenez bientôt.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProjects.map(p => (
                  <Card key={p.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 mr-1" />Certifié {p.certification_type || "standard"}
                        </Badge>
                        {p.sector && <Badge variant="outline">{p.sector}</Badge>}
                      </div>
                      <CardTitle className="text-lg line-clamp-2 mt-2">{p.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3 w-3" />{[p.city, p.country].filter(Boolean).join(", ")}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button className="w-full" onClick={() => navigate(user ? `/projects/${p.id}` : `/auth?redirect=/projects/${p.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />Voir le projet
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {/* Plan comparator */}
            <div className="mt-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center justify-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Choisissez votre formule</h2>
                <p className="text-muted-foreground">Accédez à plus de projets certifiés et d'opportunités exclusives.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                {PLANS.map(plan => (
                  <Card key={plan.name} className={plan.highlight ? "border-primary ring-2 ring-primary/30 shadow-xl scale-[1.02]" : ""}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {plan.name}
                        {plan.highlight && <Badge className="bg-primary">Recommandé</Badge>}
                      </CardTitle>
                      <div className="text-2xl font-bold text-primary mt-2">{plan.price}</div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />{f}</li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full" variant={plan.highlight ? "default" : "outline"} onClick={() => navigate(plan.target)}>{plan.cta}</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Global CTA */}
        {!user && (
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-8 gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">Rejoignez MIPROJET aujourd'hui</h3>
                <p className="text-muted-foreground">Créez votre compte gratuitement et accédez à toutes les opportunités.</p>
              </div>
              <Button size="lg" onClick={() => navigate('/auth')}>Commencer gratuitement</Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Opportunities;
