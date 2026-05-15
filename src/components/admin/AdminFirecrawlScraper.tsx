import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { Loader2, Search, Globe, Download, CheckCircle, AlertCircle } from "lucide-react";

interface ScrapedOpportunity {
  title: string;
  description: string;
  category: string;
  source_url: string;
  selected: boolean;
}

export const AdminFirecrawlScraper = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<"search" | "scrape">("search");
  const [query, setQuery] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<ScrapedOpportunity[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const response = await firecrawlApi.search(
        `${query} opportunités investissement Afrique financement`,
        { limit: 10, lang: "fr", country: "CI" }
      );
      // Firecrawl v1 returns { success, data: [...] } OR sometimes { success, web: [...] }
      const raw: any = response;
      const list: any[] = Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.data?.data)
          ? raw.data.data
          : Array.isArray(raw?.web)
            ? raw.web
            : [];
      if (raw?.success !== false && list.length > 0) {
        const items: ScrapedOpportunity[] = list.map((r: any) => ({
          title: r.title || r.metadata?.title || "Sans titre",
          description: r.description || r.snippet || (r.markdown ? String(r.markdown).substring(0, 300) : ""),
          category: "general",
          source_url: r.url || r.link || "",
          selected: false,
        }));
        setResults(items);
        if (items.length === 0) toast({ title: "Aucun résultat", description: "Aucune opportunité trouvée pour cette recherche." });
      } else {
        toast({ title: "Erreur", description: raw?.error || "Échec de la recherche — vérifiez la clé Firecrawl", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de contacter Firecrawl", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const response: any = await firecrawlApi.scrape(url, { formats: ["markdown"], onlyMainContent: true });
      if (response?.success !== false) {
        const content = response.markdown || response.data?.markdown || "";
        const title = response.metadata?.title || response.data?.metadata?.title || "Opportunité scrapée";
        if (!content) {
          toast({ title: "Aucun contenu", description: "La page n'a retourné aucun contenu exploitable" });
        } else {
          setResults([{
            title,
            description: content.substring(0, 500),
            category: "general",
            source_url: url,
            selected: true,
          }]);
        }
      } else {
        toast({ title: "Erreur", description: response?.error || "Échec du scraping", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de scraper cette URL", variant: "destructive" });
    }
    setLoading(false);
  };

  const toggleSelect = (idx: number) => {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, selected: !r.selected } : r));
  };

  const importSelected = async () => {
    const selected = results.filter(r => r.selected);
    if (selected.length === 0) {
      toast({ title: "Aucune sélection", description: "Sélectionnez au moins une opportunité" });
      return;
    }
    setImporting(true);
    let successCount = 0;
    for (const item of selected) {
      const { error } = await supabase.from("opportunities").insert({
        title: item.title,
        description: item.description.substring(0, 500),
        content: item.description,
        category: item.category,
        external_link: item.source_url,
        status: "draft",
        opportunity_type: "funding",
      });
      if (!error) successCount++;
    }
    toast({
      title: "Import terminé",
      description: `${successCount}/${selected.length} opportunités importées avec succès`,
    });
    setResults(prev => prev.map(r => ({ ...r, selected: false })));
    setImporting(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scraper d'opportunités (Firecrawl)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={mode === "search" ? "default" : "outline"} onClick={() => setMode("search")} size="sm">
              <Search className="h-4 w-4 mr-1" /> Recherche web
            </Button>
            <Button variant={mode === "scrape" ? "default" : "outline"} onClick={() => setMode("scrape")} size="sm">
              <Globe className="h-4 w-4 mr-1" /> Scraper une URL
            </Button>
          </div>

          {mode === "search" ? (
            <div className="flex gap-2">
              <Input placeholder="Ex: opportunités financement agriculture Côte d'Ivoire" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input placeholder="https://example.com/opportunites" value={url} onChange={e => setUrl(e.target.value)} />
              <Button onClick={handleScrape} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{results.length} résultats trouvés</CardTitle>
              <Button onClick={importSelected} disabled={importing || results.filter(r => r.selected).length === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
                Importer ({results.filter(r => r.selected).length})
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`p-3 border rounded-lg cursor-pointer transition-colors ${r.selected ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => toggleSelect(i)}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${r.selected ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                    {r.selected && <CheckCircle className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{r.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{r.description}</p>
                    {r.source_url && (
                      <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-block" onClick={e => e.stopPropagation()}>
                        {r.source_url.substring(0, 60)}...
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
