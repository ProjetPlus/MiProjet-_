import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import miprojetPlusLogo from "@/assets/miprojet-plus-logo.jpg";
import InstallPWAPopup from "@/components/miprojet-plus/InstallPWAPopup";
import MPScoring from "@/components/miprojet-plus/MPScoring";
import MPProjects from "@/components/miprojet-plus/MPProjects";
import MPFinancial from "@/components/miprojet-plus/MPFinancial";
import MPCertification from "@/components/miprojet-plus/MPCertification";
import MPNetwork from "@/components/miprojet-plus/MPNetwork";
import {
  BarChart3, FileText, TrendingUp, Users, Award,
  LogOut, Plus, ChevronRight, Home, Bell, Loader2, Menu, X
} from "lucide-react";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company_name: string | null;
}

const MiProjetPlusApp = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mpProjects, setMpProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useSEO({
    title: "Tableau de bord – MiProjet+",
    description: "Gérez vos projets, scoring et financement avec MiProjet+",
    url: "https://ivoireprojet.com/miprojet-plus/app",
    siteName: "MiProjet+",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/miprojet-plus");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profileRes, projRes] = await Promise.all([
        supabase.from("profiles").select("first_name, last_name, email, company_name").eq("id", user.id).single(),
        supabase.from("mp_projects").select("id, title, sector, activity_type, status").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (projRes.data) setMpProjects(projRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/miprojet-plus");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <img src={miprojetPlusLogo} alt="MiProjet+" className="h-16 w-16 rounded-2xl mx-auto mb-4 animate-pulse" />
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const navItems = [
    { id: "dashboard", icon: Home, label: "Tableau de bord" },
    { id: "projects", icon: FileText, label: "Mes projets" },
    { id: "scoring", icon: BarChart3, label: "MiProjet Score" },
    { id: "finances", icon: TrendingUp, label: "Suivi financier" },
    { id: "certification", icon: Award, label: "Certification" },
    { id: "network", icon: Users, label: "Réseau financeurs" },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {profile?.first_name || "Promoteur"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenue sur MiProjet<span className="text-emerald-600">+</span> – Votre espace de structuration
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Projets", value: mpProjects.length, icon: FileText, color: "bg-emerald-50 text-emerald-700" },
          { label: "Micro-activités", value: mpProjects.filter((p) => p.activity_type === "micro_activity").length, icon: BarChart3, color: "bg-blue-50 text-blue-700" },
          { label: "PME", value: mpProjects.filter((p) => p.activity_type === "pme").length, icon: Award, color: "bg-amber-50 text-amber-700" },
          { label: "Startups", value: mpProjects.filter((p) => p.activity_type === "startup").length, icon: TrendingUp, color: "bg-purple-50 text-purple-700" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-xl ${s.color}`}><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Mes projets / activités</CardTitle>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("projects")}>
            <Plus className="h-4 w-4 mr-1" /> Nouveau
          </Button>
        </CardHeader>
        <CardContent>
          {mpProjects.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun projet encore</p>
              <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700" onClick={() => setActiveTab("projects")}>
                Créer un projet
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {mpProjects.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer" onClick={() => setActiveTab("projects")}>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{p.title}</p>
                    <p className="text-xs text-gray-400">{p.sector || "Secteur non défini"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{p.activity_type === "micro_activity" ? "Micro" : p.activity_type}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Méthodologie MiProjet<span className="text-emerald-600">+</span></CardTitle>
          <CardDescription>6 étapes pour rendre votre activité finançable</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { step: 1, title: "Diagnostic", desc: "Identification et analyse" },
              { step: 2, title: "Organisation", desc: "Outils et processus" },
              { step: 3, title: "Structuration", desc: "Suivi financier" },
              { step: 4, title: "Stabilisation", desc: "Performance" },
              { step: 5, title: "Crédibilité", desc: "Image professionnelle" },
              { step: 6, title: "Financement", desc: "Mise en relation" },
            ].map((s) => (
              <div key={s.step} className="p-3 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">{s.step}</div>
                  <span className="font-medium text-sm">{s.title}</span>
                </div>
                <p className="text-xs text-gray-500 ml-8">{s.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <InstallPWAPopup />

      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <img src={miprojetPlusLogo} alt="MiProjet+" className="h-8 w-8 rounded-lg" />
            <span className="font-bold text-gray-900 hidden sm:inline">MiProjet<span className="text-emerald-600">+</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-gray-500">
              <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`${mobileMenuOpen ? "block" : "hidden"} lg:block fixed lg:sticky top-14 left-0 z-40 w-60 h-[calc(100vh-3.5rem)] bg-white border-r border-gray-200 overflow-y-auto`}>
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === item.id ? "bg-emerald-50 text-emerald-700 font-medium" : "text-gray-600 hover:bg-gray-50"}`}>
                  <Icon className="h-4 w-4" />{item.label}
                </button>
              );
            })}
          </nav>
          <div className="p-3 mt-4 border-t border-gray-100">
            <a href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-emerald-600 px-3 py-2">← Retour à MIPROJET</a>
          </div>
        </aside>

        {mobileMenuOpen && <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />}

        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <div className="max-w-5xl mx-auto">
            {activeTab === "dashboard" && renderDashboard()}
            {activeTab === "projects" && <MPProjects />}
            {activeTab === "scoring" && <MPScoring />}
            {activeTab === "finances" && <MPFinancial />}
            {activeTab === "certification" && <MPCertification />}
            {activeTab === "network" && <MPNetwork />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MiProjetPlusApp;
