import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderKanban, Search, Eye, Award, 
  FileText, BarChart3, Star, TrendingUp
} from "lucide-react";

interface ProjectInterest {
  id: string;
  project_id: string;
  created_at: string;
}

export const InvestorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projectsExplored: 12,
    projectsFollowed: 5,
    requestsSent: 3,
    accessGranted: 2
  });

  useEffect(() => {
    // Simulate loading
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
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Projets explorés</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.projectsExplored}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-primary/10 flex-shrink-0">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Projets suivis</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.projectsFollowed}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-warning/10 flex-shrink-0">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Demandes d'accès</p>
                <p className="text-xl sm:text-2xl font-bold">{stats.requestsSent}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-info/10 flex-shrink-0">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">Accès accordés</p>
                <p className="text-xl sm:text-2xl font-bold text-success">{stats.accessGranted}</p>
              </div>
              <div className="p-2 sm:p-3 rounded-lg bg-success/10 flex-shrink-0">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
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
        <Link to="/investors">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Espace Partenaires</span>
          </Button>
        </Link>
      </div>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium text-sm">Comment ça fonctionne ?</p>
              <p className="text-xs text-muted-foreground mt-1">
                MIPROJET structure et labellise les projets selon la norme ISO 21500. En tant qu'investisseur, 
                vous pouvez explorer les projets validés et demander l'accès aux dossiers complets. 
                MIPROJET vous oriente vers les projets correspondant à vos critères.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="opportunities" className="space-y-4">
        <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
          <TabsTrigger value="opportunities" className="text-xs sm:text-sm">Opportunités</TabsTrigger>
          <TabsTrigger value="followed" className="text-xs sm:text-sm">Suivis</TabsTrigger>
          <TabsTrigger value="access" className="text-xs sm:text-sm">Accès</TabsTrigger>
        </TabsList>

        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projets validés disponibles</CardTitle>
              <CardDescription>Projets structurés et labellisés par MIPROJET</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">Explorez les projets validés par MIPROJET</p>
                <Link to="/projects">
                  <Button>
                    <Search className="mr-2 h-4 w-4" />
                    Voir les projets
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followed">
          <Card className="text-center py-12">
            <CardContent>
              <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun projet suivi</h3>
              <p className="text-muted-foreground mb-4">
                Ajoutez des projets à vos favoris pour les retrouver facilement
              </p>
              <Link to="/projects">
                <Button variant="outline">Explorer les projets</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Demandes d'accès</CardTitle>
              <CardDescription>Historique de vos demandes d'accès aux dossiers projets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune demande d'accès en cours</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
