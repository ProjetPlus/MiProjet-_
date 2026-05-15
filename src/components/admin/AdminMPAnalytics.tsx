import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, TrendingUp, Award, BarChart3, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";

export const AdminMPAnalytics = () => {
  const [scores, setScores] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [sRes, cRes] = await Promise.all([
        supabase.from("mp_scoring_results").select("score_global, niveau, created_at, score_juridique, score_financier, score_technique, score_marche, score_impact").eq("is_active", true).order("created_at", { ascending: true }).limit(500),
        supabase.from("mp_certifications").select("status, created_at, certification_type").order("created_at", { ascending: true }).limit(500),
      ]);
      if (sRes.data) setScores(sRes.data);
      if (cRes.data) setCerts(cRes.data);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // Niveau distribution
  const niveauData = [
    { name: "Finançable", value: scores.filter(s => s.niveau === "financable").length, color: "#059669" },
    { name: "Prometteur", value: scores.filter(s => s.niveau === "prometteur").length, color: "#2563eb" },
    { name: "Fragile", value: scores.filter(s => s.niveau === "fragile").length, color: "#d97706" },
    { name: "Non finançable", value: scores.filter(s => s.niveau === "non_financable").length, color: "#dc2626" },
  ].filter(d => d.value > 0);

  // Score evolution by month
  const monthlyScores: Record<string, { month: string; avgScore: number; count: number; total: number }> = {};
  scores.forEach(s => {
    const d = new Date(s.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    if (!monthlyScores[key]) monthlyScores[key] = { month: label, avgScore: 0, count: 0, total: 0 };
    monthlyScores[key].total += Number(s.score_global || 0);
    monthlyScores[key].count++;
  });
  const evolutionData = Object.values(monthlyScores).map(m => ({ ...m, avgScore: Math.round(m.total / m.count) }));

  // Average scores by axis
  const avgAxes = scores.length > 0 ? [
    { axis: "Juridique", avg: Math.round(scores.reduce((s, r) => s + Number(r.score_juridique || 0), 0) / scores.length), max: 15 },
    { axis: "Financier", avg: Math.round(scores.reduce((s, r) => s + Number(r.score_financier || 0), 0) / scores.length), max: 25 },
    { axis: "Technique", avg: Math.round(scores.reduce((s, r) => s + Number(r.score_technique || 0), 0) / scores.length), max: 20 },
    { axis: "Marché", avg: Math.round(scores.reduce((s, r) => s + Number(r.score_marche || 0), 0) / scores.length), max: 20 },
    { axis: "Impact", avg: Math.round(scores.reduce((s, r) => s + Number(r.score_impact || 0), 0) / scores.length), max: 20 },
  ] : [];

  // Certification status
  const certStatusData = [
    { name: "En attente", value: certs.filter(c => c.status === "pending").length, color: "#d97706" },
    { name: "En examen", value: certs.filter(c => c.status === "in_review").length, color: "#3b82f6" },
    { name: "Certifiées", value: certs.filter(c => c.status === "certified").length, color: "#059669" },
    { name: "Rejetées", value: certs.filter(c => c.status === "rejected").length, color: "#dc2626" },
  ].filter(d => d.value > 0);

  const avgGlobal = scores.length > 0 ? Math.round(scores.reduce((s, r) => s + Number(r.score_global || 0), 0) / scores.length) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">MiProjet+ — Analytiques</h1>
        <p className="text-muted-foreground text-sm">Tendances des scores et certifications</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Évaluations", value: scores.length, icon: BarChart3, color: "text-blue-600" },
          { label: "Score moyen", value: `${avgGlobal}/100`, icon: TrendingUp, color: "text-emerald-600" },
          { label: "Certifications", value: certs.length, icon: Award, color: "text-purple-600" },
          { label: "Taux finançable", value: scores.length > 0 ? `${Math.round((scores.filter(s => s.niveau === "financable").length / scores.length) * 100)}%` : "0%", icon: Users, color: "text-amber-600" },
        ].map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${kpi.color}`} />
                <div>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Evolution */}
        {evolutionData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Évolution du score moyen</CardTitle>
              <CardDescription>Score moyen par mois et nombre d'évaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={evolutionData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                  <Area type="monotone" dataKey="avgScore" stroke="#059669" fillOpacity={1} fill="url(#colorScore)" strokeWidth={2} name="Score moyen" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Niveau Distribution */}
        {niveauData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Répartition des niveaux</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={niveauData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {niveauData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {niveauData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scores by Axis */}
        {avgAxes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score moyen par axe</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={avgAxes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="axis" type="category" className="text-xs" width={70} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} formatter={(v: number, name: string, props: any) => [`${v}/${props.payload.max}`, "Moyenne"]} />
                  <Bar dataKey="avg" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Certification trends */}
        {certStatusData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut des certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={certStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {certStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {certStatusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name} ({d.value})
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {scores.length === 0 && certs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <p>Aucune donnée analytique disponible pour le moment.</p>
            <p className="text-sm mt-1">Les graphiques apparaîtront dès que des utilisateurs auront calculé leur score.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
