import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Lead {
  lead_source: string;
  created_at: string;
}

const SOURCE_LABEL: Record<string, string> = {
  signup: "Inscription",
  service_request: "Demande de service",
  referral: "Parrainage",
  event: "Événement / Webinaire",
  ebook: "E-book",
  contact: "Formulaire de contact",
  opportunity: "Opportunité",
  investor: "Investisseur",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--muted-foreground))",
];

export const LeadsSourceChart = ({ leads }: { leads: Lead[] }) => {
  const { data, total, topMonth } = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const k = l.lead_source || "unknown";
      counts[k] = (counts[k] || 0) + 1;
    });
    const arr = Object.entries(counts)
      .map(([k, v]) => ({ name: SOURCE_LABEL[k] || k, value: v, key: k }))
      .sort((a, b) => b.value - a.value);

    // Top source this month
    const now = new Date();
    const thisMonth: Record<string, number> = {};
    leads.forEach(l => {
      const d = new Date(l.created_at);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const k = l.lead_source || "unknown";
        thisMonth[k] = (thisMonth[k] || 0) + 1;
      }
    });
    const top = Object.entries(thisMonth).sort((a, b) => b[1] - a[1])[0];

    return {
      data: arr,
      total: leads.length,
      topMonth: top ? { name: SOURCE_LABEL[top[0]] || top[0], count: top[1] } : null,
    };
  }, [leads]);

  if (total === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Répartition par source</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => `${e.name}: ${e.value}`}>
                  {data.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">Total leads</p>
              <p className="text-3xl font-bold text-primary">{total}</p>
            </div>
            {topMonth && (
              <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                <p className="text-xs text-muted-foreground">Top source ce mois</p>
                <p className="text-lg font-bold text-success">{topMonth.name}</p>
                <p className="text-sm text-muted-foreground">{topMonth.count} leads</p>
              </div>
            )}
            <div className="space-y-1">
              {data.map(d => (
                <div key={d.key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{d.name}</span>
                  <span className="font-medium">{Math.round((d.value / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};