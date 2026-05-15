import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, BarChart3, FileText, TrendingUp } from "lucide-react";

export const AdminMPOverview = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [projRes, scoreRes] = await Promise.all([
        supabase.from("mp_projects").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("mp_scoring_results").select("*, mp_projects(title)").eq("is_active", true).order("created_at", { ascending: false }).limit(200),
      ]);
      
      const projData = projRes.data || [];
      const scoreData = scoreRes.data || [];
      
      // Collect unique user_ids
      const userIds = new Set<string>();
      projData.forEach(p => userIds.add(p.user_id));
      scoreData.forEach(s => userIds.add(s.user_id));
      
      // Fetch profiles for these users
      if (userIds.size > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", Array.from(userIds));
        const profileMap: Record<string, any> = {};
        profilesData?.forEach(p => { profileMap[p.id] = p; });
        setProfiles(profileMap);
      }
      
      setProjects(projData);
      setScores(scoreData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const getNiveauColor = (n: string) => {
    const m: Record<string, string> = { financable: "bg-emerald-100 text-emerald-700", prometteur: "bg-blue-100 text-blue-700", fragile: "bg-amber-100 text-amber-700", non_financable: "bg-rose-100 text-rose-700" };
    return m[n] || "bg-gray-100";
  };

  const getNiveauLabel = (n: string) => {
    const m: Record<string, string> = { financable: "Finançable", prometteur: "Prometteur", fragile: "Fragile", non_financable: "Non finançable" };
    return m[n] || n;
  };

  const getProfileName = (userId: string) => {
    const p = profiles[userId];
    if (!p) return "—";
    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return name || p.email || "—";
  };

  const stats = {
    totalProjects: projects.length,
    totalScores: scores.length,
    avgScore: scores.length > 0 ? Math.round(scores.reduce((s, r) => s + Number(r.score_global || 0), 0) / scores.length) : 0,
    financable: scores.filter(s => s.niveau === "financable").length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MiProjet+ – Vue d'ensemble</h1>
        <p className="text-muted-foreground text-sm">Projets et scores de tous les utilisateurs</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Projets MP+", value: stats.totalProjects, icon: FileText },
          { label: "Scores calculés", value: stats.totalScores, icon: BarChart3 },
          { label: "Score moyen", value: `${stats.avgScore}/100`, icon: TrendingUp },
          { label: "Finançables", value: stats.financable, icon: TrendingUp },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-5 w-5 text-emerald-600" />
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projets ({projects.length})</TabsTrigger>
          <TabsTrigger value="scores">Scores ({scores.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Secteur</TableHead>
                      <TableHead>Ville</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.title}</TableCell>
                        <TableCell className="text-sm">{getProfileName(p.user_id)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.activity_type}</Badge></TableCell>
                        <TableCell className="text-sm">{p.sector || "—"}</TableCell>
                        <TableCell className="text-sm">{p.city || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      </TableRow>
                    ))}
                    {projects.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun projet MiProjet+</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Projet</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Score global</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Juridique</TableHead>
                      <TableHead>Financier</TableHead>
                      <TableHead>Technique</TableHead>
                      <TableHead>Marché</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map(s => {
                      const project = s.mp_projects as any;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{project?.title || "—"}</TableCell>
                          <TableCell className="text-sm">{getProfileName(s.user_id)}</TableCell>
                          <TableCell><span className="font-bold text-lg">{s.score_global}/100</span></TableCell>
                          <TableCell><Badge className={getNiveauColor(s.niveau)}>{getNiveauLabel(s.niveau)}</Badge></TableCell>
                          <TableCell className="text-sm">{s.score_juridique}/15</TableCell>
                          <TableCell className="text-sm">{s.score_financier}/25</TableCell>
                          <TableCell className="text-sm">{s.score_technique}/20</TableCell>
                          <TableCell className="text-sm">{s.score_marche}/20</TableCell>
                          <TableCell className="text-sm">{s.score_impact}/20</TableCell>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(s.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        </TableRow>
                      );
                    })}
                    {scores.length === 0 && (
                      <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Aucun score MiProjet+</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
