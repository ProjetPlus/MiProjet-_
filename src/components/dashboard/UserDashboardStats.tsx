import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FolderKanban, DollarSign, FileCheck, TrendingUp,
  Clock, CheckCircle, AlertCircle, Users
} from "lucide-react";

interface DashboardStatsProps {
  userType: 'individual' | 'enterprise' | 'investor' | 'funder';
}

export const UserDashboardStats = ({ userType }: DashboardStatsProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalProjects: 0,
    pendingProjects: 0,
    publishedProjects: 0,
    totalFundsRaised: 0,
    totalInvestments: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalDocuments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch projects
        const { data: projects } = await supabase
          .from('projects')
          .select('status, funds_raised')
          .eq('owner_id', user.id);

        // Fetch service requests
        const { data: requests } = await supabase
          .from('service_requests')
          .select('status')
          .eq('user_id', user.id);

        // Fetch contributions (investments)
        const { data: contributions } = await supabase
          .from('contributions')
          .select('amount')
          .eq('user_id', user.id);

        const totalFunds = projects?.reduce((sum, p) => sum + (p.funds_raised || 0), 0) || 0;
        const totalInvested = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

        setStats({
          totalProjects: projects?.length || 0,
          pendingProjects: projects?.filter(p => p.status === 'pending').length || 0,
          publishedProjects: projects?.filter(p => p.status === 'published').length || 0,
          totalFundsRaised: totalFunds,
          totalInvestments: totalInvested,
          pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
          approvedRequests: requests?.filter(r => r.status === 'approved').length || 0,
          totalDocuments: 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const getStatsConfig = () => {
    switch (userType) {
      case 'enterprise':
        return [
          { 
            title: 'Projets Soumis', 
            value: stats.totalProjects, 
            icon: FolderKanban, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            title: 'En Attente', 
            value: stats.pendingProjects, 
            icon: Clock, 
            color: 'text-warning',
            bgColor: 'bg-warning/10'
          },
          { 
            title: 'Fonds Mobilisés', 
            value: `${(stats.totalFundsRaised / 1000000).toFixed(1)}M`, 
            suffix: 'FCFA',
            icon: DollarSign, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          { 
            title: 'Demandes Approuvées', 
            value: stats.approvedRequests, 
            icon: CheckCircle, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
        ];
      case 'investor':
        return [
          { 
            title: 'Total Investi', 
            value: `${(stats.totalInvestments / 1000000).toFixed(1)}M`, 
            suffix: 'FCFA',
            icon: DollarSign, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            title: 'Projets Financés', 
            value: stats.totalProjects, 
            icon: FolderKanban, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          { 
            title: 'ROI Moyen', 
            value: '+12%', 
            icon: TrendingUp, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          { 
            title: 'Projets Actifs', 
            value: stats.publishedProjects, 
            icon: CheckCircle, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
        ];
      case 'funder':
        return [
          { 
            title: 'Fonds Décaissés', 
            value: `${(stats.totalInvestments / 1000000).toFixed(1)}M`, 
            suffix: 'FCFA',
            icon: DollarSign, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            title: 'Projets Financés', 
            value: stats.totalProjects, 
            icon: FolderKanban, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          { 
            title: 'Bénéficiaires', 
            value: '1,250', 
            icon: Users, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            title: 'Impact Score', 
            value: 'A+', 
            icon: TrendingUp, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
        ];
      default: // individual
        return [
          { 
            title: 'Mes Projets', 
            value: stats.totalProjects, 
            icon: FolderKanban, 
            color: 'text-primary',
            bgColor: 'bg-primary/10'
          },
          { 
            title: 'En Attente', 
            value: stats.pendingRequests, 
            icon: Clock, 
            color: 'text-warning',
            bgColor: 'bg-warning/10'
          },
          { 
            title: 'Fonds Collectés', 
            value: `${(stats.totalFundsRaised / 1000000).toFixed(1)}M`, 
            suffix: 'FCFA',
            icon: DollarSign, 
            color: 'text-success',
            bgColor: 'bg-success/10'
          },
          { 
            title: 'Documents', 
            value: stats.totalDocuments, 
            icon: FileCheck, 
            color: 'text-muted-foreground',
            bgColor: 'bg-muted'
          },
        ];
    }
  };

  const statsConfig = getStatsConfig();

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statsConfig.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                    {stat.suffix && <span className="text-sm font-normal ml-1">{stat.suffix}</span>}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};