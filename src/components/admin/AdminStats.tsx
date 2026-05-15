import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, FolderKanban, DollarSign, Activity } from "lucide-react";

interface StatsData {
  totalProjects: number;
  publishedProjects: number;
  totalUsers: number;
  totalFundsRaised: number;
  totalContributions: number;
}

export const AdminStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalProjects: 0,
    publishedProjects: 0,
    totalUsers: 0,
    totalFundsRaised: 0,
    totalContributions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch projects count
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true });
        
        const { count: publishedCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'published');
        
        // Fetch users count
        const { count: usersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Fetch contributions
        const { data: contributions } = await supabase
          .from('contributions')
          .select('amount');
        
        const totalFunds = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

        setStats({
          totalProjects: projectsCount || 0,
          publishedProjects: publishedCount || 0,
          totalUsers: usersCount || 0,
          totalFundsRaised: totalFunds,
          totalContributions: contributions?.length || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Projets",
      value: stats.totalProjects,
      description: `${stats.publishedProjects} publiés`,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Utilisateurs",
      value: stats.totalUsers,
      description: "Abonnés inscrits",
      icon: Users,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Fonds Collectés",
      value: `${(stats.totalFundsRaised / 1000000).toFixed(1)}M`,
      description: "FCFA au total",
      icon: DollarSign,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Contributions",
      value: stats.totalContributions,
      description: "Investissements",
      icon: Activity,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-8 bg-muted rounded w-16 mt-2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
