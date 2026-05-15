import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, TrendingUp, FolderKanban, Search,
  FileText, BarChart3, Globe, Award
} from "lucide-react";

export const FunderDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projectsAccessed: 45,
    projectsOriented: 12,
    beneficiaries: 12500,
    impactScore: "A+"
  });

  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Projets consultés</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.projectsAccessed}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Projets orientés</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.projectsOriented}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-success/10 flex-shrink-0">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Bénéficiaires</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {(stats.beneficiaries / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Score Impact</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.impactScore}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-success/10 flex-shrink-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Link to="/projects">
          <Button size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Explorer les projets</span>
            <span className="sm:hidden">Explorer</span>
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Rapport d'impact</span>
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">Zones d'intervention</span>
        </Button>
      </div>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Partenaire bailleur</p>
              <p className="text-xs text-muted-foreground mt-1">
                En tant que bailleur de fonds, MIPROJET vous oriente vers des projets structurés et labellisés 
                correspondant à vos critères d'intervention. Tous les projets sont analysés selon la norme ISO 21500.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="portfolio" className="text-xs sm:text-sm">Projets</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-xs sm:text-sm">Pipeline</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs sm:text-sm">Impact</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projets orientés vers vous</CardTitle>
              <CardDescription>Projets structurés correspondant à vos critères</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Vos projets orientés apparaîtront ici</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle>Pipeline de projets</CardTitle>
              <CardDescription>Projets en cours d'évaluation pour orientation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucun projet en pipeline</p>
                <Link to="/projects" className="mt-4 inline-block">
                  <Button variant="outline">Explorer les projets</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact">
          <Card>
            <CardHeader>
              <CardTitle>Rapport d'impact</CardTitle>
              <CardDescription>Mesurez l'impact social et économique des projets orientés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-primary/5 text-center">
                  <p className="text-3xl font-bold text-primary">1,250+</p>
                  <p className="text-sm text-muted-foreground">Emplois potentiels</p>
                </div>
                <div className="p-4 rounded-lg bg-success/5 text-center">
                  <p className="text-3xl font-bold text-success">85%</p>
                  <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 text-center">
                  <p className="text-3xl font-bold text-accent-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Pays couverts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
