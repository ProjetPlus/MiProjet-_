import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Crown, Lock, Search, Loader2 } from "lucide-react";

const categories = [
  { value: "all", label: "Toutes les catégories" },
  { value: "general", label: "Général" },
  { value: "investment", label: "Investissement" },
  { value: "guide", label: "Guide pratique" },
  { value: "formation", label: "Formation" },
  { value: "rapport", label: "Rapport" },
  { value: "template", label: "Template / Modèle" },
];

const audiences = [
  { value: "all", label: "Tous les publics" },
  { value: "public", label: "Public" },
  { value: "investors", label: "Investisseurs" },
  { value: "project_owners", label: "Porteurs de projet" },
];

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("all");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('platform_documents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (data) setDocuments(data);
    setLoading(false);
  };

  const filtered = documents.filter(doc => {
    if (category !== "all" && doc.category !== category) return false;
    if (audience !== "all" && doc.target_audience !== audience) return false;
    if (search && !doc.title.toLowerCase().includes(search.toLowerCase()) &&
        !(doc.description || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const audienceLabel = (v: string) => {
    if (v === 'investors') return '💼 Investisseurs';
    if (v === 'project_owners') return '🚀 Porteurs de projet';
    return '👥 Public';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">📚 Documents & Ressources</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Accédez à nos guides, rapports et ressources pour développer vos projets et investissements en Côte d'Ivoire.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-8 max-w-4xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher un document..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger className="w-full md:w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {audiences.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun document trouvé</h3>
            <p className="text-muted-foreground">Essayez de modifier vos filtres.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {filtered.map(doc => (
              <Link key={doc.id} to={`/documents/${doc.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow group cursor-pointer border-border/50 hover:border-primary/30">
                  <CardContent className="p-0">
                    {doc.cover_url ? (
                      <img src={doc.cover_url} alt={doc.title} className="w-full h-48 object-cover rounded-t-lg" />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-t-lg flex items-center justify-center">
                        <FileText className="h-16 w-16 text-primary/40" />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="text-xs">{audienceLabel(doc.target_audience || 'public')}</Badge>
                        <Badge className={doc.access_level === 'premium' ? 'bg-accent/10 text-accent text-xs' : 'bg-emerald-500/10 text-emerald-600 text-xs'}>
                          {doc.access_level === 'premium' ? '👑 Premium' : '🆓 Gratuit'}
                        </Badge>
                        {doc.requires_login && <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" />Connexion</Badge>}
                      </div>
                      <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">{doc.title}</h3>
                      {doc.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span><Download className="h-3 w-3 inline mr-1" />{doc.download_count || 0} téléchargements</span>
                        <span>{doc.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Documents;
