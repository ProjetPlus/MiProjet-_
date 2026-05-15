import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { LeadCaptureForm } from "@/components/LeadCaptureForm";
import { 
  Search, Filter, Crown, Lock, Calendar, MapPin, 
  ExternalLink, Loader2, Banknote, GraduationCap, 
  Handshake, Gift, Briefcase, AlertCircle, Eye
} from "lucide-react";
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
  is_featured: boolean;
  is_premium: boolean;
  views_count: number;
  published_at: string | null;
}

const opportunityTypes = [
  { value: 'all', label: 'Toutes', icon: Briefcase },
  { value: 'funding', label: 'Financement', icon: Banknote },
  { value: 'training', label: 'Formation', icon: GraduationCap },
  { value: 'accompaniment', label: 'Accompagnement', icon: Handshake },
  { value: 'grant', label: 'Subvention', icon: Gift },
  { value: 'partnership', label: 'Partenariat', icon: Handshake },
];

const Opportunities = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasActiveSubscription, loading: subLoading } = useSubscription();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedOppId, setSelectedOppId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Opportunités | MIPROJET";
    fetchOpportunities();
  }, []);

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType]);

  const fetchOpportunities = async () => {
    setLoading(true);
    let query = supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'published')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false });

    if (selectedType !== 'all') {
      query = query.eq('opportunity_type', selectedType);
    }

    const { data, error } = await query;
    if (!error && data) {
      setOpportunities(data as any);
    }
    setLoading(false);
  };

  const getTypeIcon = (type: string) => {
    const typeObj = opportunityTypes.find(t => t.value === type);
    return typeObj?.icon || Briefcase;
  };

  const getTypeLabel = (type: string) => {
    const typeObj = opportunityTypes.find(t => t.value === type);
    return typeObj?.label || type;
  };

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (opp: Opportunity) => {
    if (opp.is_premium) {
      // Premium: must be subscriber
      if (!user) {
        navigate('/auth?redirect=/opportunities');
        return;
      }
      if (!hasActiveSubscription) {
        navigate('/subscription');
        return;
      }
      navigate(`/opportunities/${opp.id}`);
    } else {
      // Free: anyone can view summary, but need lead capture for strategic info
      navigate(`/opportunities/${opp.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Opportunités</h1>
          <p className="text-muted-foreground">
            Découvrez les meilleures opportunités de financement, formations et accompagnements
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une opportunité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {opportunityTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Opportunities Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune opportunité trouvée</h3>
            <p className="text-muted-foreground">
              De nouvelles opportunités seront bientôt publiées.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOpportunities.map((opp) => {
              const TypeIcon = getTypeIcon(opp.opportunity_type);
              const isPremiumLocked = opp.is_premium && !hasActiveSubscription;
              return (
                <Card key={opp.id} className={`hover:shadow-lg transition-shadow ${opp.is_featured ? 'ring-2 ring-primary/20 border-primary/30' : ''} ${isPremiumLocked ? 'opacity-90' : ''}`}>
                  {opp.image_url && (
                    <div className="relative h-40 overflow-hidden rounded-t-lg">
                      <img src={opp.image_url} alt={opp.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {opp.is_featured && <Badge className="bg-primary">À la une</Badge>}
                        {opp.is_premium ? (
                          <Badge className="bg-amber-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
                        ) : (
                          <Badge className="bg-success text-white">Gratuit</Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {!opp.image_url && (
                    <div className="px-4 pt-4 flex gap-1">
                      {opp.is_premium ? (
                        <Badge className="bg-amber-500 text-white"><Crown className="h-3 w-3 mr-1" />Premium</Badge>
                      ) : (
                        <Badge className="bg-success text-white">Gratuit</Badge>
                      )}
                      {opp.is_featured && <Badge className="bg-primary">À la une</Badge>}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="shrink-0">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {getTypeLabel(opp.opportunity_type)}
                      </Badge>
                      {opp.deadline && (
                        <Badge variant="secondary" className="shrink-0">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(opp.deadline), 'dd MMM yyyy', { locale: fr })}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{opp.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {opp.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {opp.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {opp.location}
                        </div>
                      )}
                      {(opp.amount_min || opp.amount_max) && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Banknote className="h-4 w-4" />
                          {opp.amount_min && opp.amount_max 
                            ? `${opp.amount_min.toLocaleString()} - ${opp.amount_max.toLocaleString()} ${opp.currency}`
                            : opp.amount_max 
                              ? `Jusqu'à ${opp.amount_max.toLocaleString()} ${opp.currency}`
                              : `À partir de ${opp.amount_min?.toLocaleString()} ${opp.currency}`
                          }
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={opp.is_featured ? 'default' : 'outline'}
                      onClick={() => handleViewDetails(opp)}
                    >
                      {isPremiumLocked ? (
                        <><Lock className="h-4 w-4 mr-2" />Réservé aux abonnés</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" />Voir les détails</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        {/* CTA for non-subscribers */}
        {!hasActiveSubscription && (
          <Card className="mt-12 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="flex flex-col sm:flex-row items-center justify-between p-8 gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Accédez à toutes les opportunités Premium
                </h3>
                <p className="text-muted-foreground">
                  Abonnez-vous pour accéder aux opportunités stratégiques et liens de candidature exclusifs.
                </p>
              </div>
              <Button size="lg" onClick={() => navigate('/subscription')}>
                S'abonner
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Opportunities;
