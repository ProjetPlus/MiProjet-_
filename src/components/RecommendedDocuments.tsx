import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Doc {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  category: string | null;
  download_count: number | null;
  access_level: string | null;
}

export const RecommendedDocuments = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from("platform_documents")
        .select("id, title, description, cover_url, category, download_count, access_level")
        .eq("is_active", true)
        .order("download_count", { ascending: false })
        .limit(3);
      if (data) setDocs(data);
      setLoading(false);
    };
    fetchDocs();
  }, []);

  if (loading || docs.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl flex-shrink-0">
              <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
                Documents recommandés
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Les ressources les plus téléchargées</p>
            </div>
          </div>
          <Link to="/documents">
            <Button variant="outline" className="group hidden sm:flex">
              Tous les documents
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {docs.map((doc) => (
            <Link key={doc.id} to={`/documents/${doc.id}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
                <div className="relative h-44 overflow-hidden rounded-t-lg">
                  {doc.cover_url ? (
                    <img src={doc.cover_url} alt={doc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <FileText className="h-16 w-16 text-primary/30" />
                    </div>
                  )}
                  {doc.category && (
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">{doc.category}</Badge>
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {doc.title}
                  </h3>
                  {doc.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Download className="h-3.5 w-3.5" />
                    <span>{doc.download_count || 0} téléchargements</span>
                    {doc.access_level === "premium" && (
                      <Badge variant="secondary" className="ml-auto text-xs">Premium</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/documents">
            <Button variant="outline">Tous les documents <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
