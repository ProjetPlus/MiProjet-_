import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SHORT_TO_CONFIG, pathToSlug } from "@/lib/shortSlug";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function ShortLink() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const type = location.pathname.split("/").filter(Boolean)[0];
  const a = (params as any).a as string | undefined;
  const b = (params as any).b as string | undefined;
  const c = (params as any).c as string | undefined;

  useEffect(() => {
    const resolve = async () => {
      if (!type || !SHORT_TO_CONFIG[type]) {
        setError("Lien invalide");
        setHint("Le préfixe de l'URL n'est pas reconnu (attendu : /n/, /o/, /p/, /d/).");
        return;
      }
      const cfg = SHORT_TO_CONFIG[type];
      const segments = [a, b, c].filter(Boolean) as string[];
      if (segments.length === 0) {
        setError("Lien incomplet");
        setHint("L'URL courte ne contient pas de slug (ex : /n/art003/04/026).");
        return;
      }
      const slug = pathToSlug(segments);
      try {
        const { data, error } = await supabase
          .from(cfg.table)
          .select("id")
          .eq("short_slug", slug)
          .maybeSingle();
        if (error || !data) {
          setError("Contenu introuvable");
          setHint(`Aucun contenu ne correspond au slug « ${slug} ». Il a peut-être été supprimé ou archivé.`);
          return;
        }
        navigate(`${cfg.redirectBase}/${(data as any).id}`, { replace: true });
      } catch (e) {
        setError("Erreur de résolution du lien");
        setHint("Une erreur réseau est survenue. Veuillez réessayer dans un instant.");
      }
    };
    resolve();
  }, [type, a, b, c, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-4 max-w-md">
        {!error ? (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto" />
            <p className="text-muted-foreground">Redirection en cours…</p>
          </>
        ) : (
          <>
            <div className="text-6xl">🔗</div>
            <h1 className="text-2xl font-bold text-foreground">{error}</h1>
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button onClick={() => navigate("/")} className="gap-2">
                <Home className="h-4 w-4" /> Accueil
              </Button>
              <Button variant="outline" onClick={() => navigate("/news")} className="gap-2">
                <Search className="h-4 w-4" /> Voir les actualités
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
