import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const monthlyData = [
  { month: 'Jan', projets: 12, fonds: 2400000, users: 45 },
  { month: 'Fév', projets: 19, fonds: 4500000, users: 78 },
  { month: 'Mar', projets: 15, fonds: 3200000, users: 62 },
  { month: 'Avr', projets: 22, fonds: 5800000, users: 95 },
  { month: 'Mai', projets: 28, fonds: 7200000, users: 120 },
  { month: 'Juin', projets: 35, fonds: 9500000, users: 156 },
];

const categoryData = [
  { name: 'Agriculture', value: 35, color: '#10b981' },
  { name: 'Technologie', value: 25, color: '#3b82f6' },
  { name: 'Commerce', value: 20, color: '#f59e0b' },
  { name: 'Éducation', value: 12, color: '#8b5cf6' },
  { name: 'Santé', value: 8, color: '#ef4444' },
];

const fundingProgress = [
  { name: 'Semaine 1', collecté: 1200000, objectif: 5000000 },
  { name: 'Semaine 2', collecté: 2800000, objectif: 5000000 },
  { name: 'Semaine 3', collecté: 3500000, objectif: 5000000 },
  { name: 'Semaine 4', collecté: 4200000, objectif: 5000000 },
];

export const AdminCharts = () => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Projects & Funding */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Évolution Mensuelle</CardTitle>
          <CardDescription>Projets et fonds collectés sur les 6 derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorFonds" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M FCFA`, 'Fonds']}
              />
              <Area 
                type="monotone" 
                dataKey="fonds" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorFonds)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Projects by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition par Catégorie</CardTitle>
          <CardDescription>Distribution des projets</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                <span className="text-sm">{cat.name} ({cat.value}%)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Croissance Utilisateurs</CardTitle>
          <CardDescription>Nouveaux abonnés par mois</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="users" 
                fill="hsl(var(--info))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Funding Progress */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Progression des Financements</CardTitle>
          <CardDescription>Évolution de la collecte vs objectifs</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fundingProgress}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M FCFA`]}
              />
              <Line 
                type="monotone" 
                dataKey="collecté" 
                stroke="hsl(var(--success))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="objectif" 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
