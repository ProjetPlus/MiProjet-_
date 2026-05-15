import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { 
  LayoutDashboard, TrendingUp,
  LogOut, Search, Menu, X
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminStats } from "@/components/admin/AdminStats";
import { AdminProjectsTable } from "@/components/admin/AdminProjectsTable";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminCharts } from "@/components/admin/AdminCharts";
import { AdminRequestsTable } from "@/components/admin/AdminRequestsTable";
import { AdminKPICharts } from "@/components/admin/AdminKPICharts";
import { AdminNewsManager } from "@/components/admin/AdminNewsManager";
import { AdminFAQManager } from "@/components/admin/AdminFAQManager";
import { AdminPaymentsJournal } from "@/components/admin/AdminPaymentsJournal";
import { AdminInvoicesTable } from "@/components/admin/AdminInvoicesTable";
import { AdminGuide } from "@/components/admin/AdminGuide";
import { AdminAccessRequests } from "@/components/admin/AdminAccessRequests";
import { AdminDatabaseManager } from "@/components/admin/AdminDatabaseManager";
import { AdminEvaluationsManager } from "@/components/admin/AdminEvaluationsManager";
import { SmartInvoiceGenerator } from "@/components/admin/SmartInvoiceGenerator";
import { AdminReferralsManager } from "@/components/admin/AdminReferralsManager";
import { AdminSettingsManager } from "@/components/admin/AdminSettingsManager";
import { AdminOpportunitiesManager } from "@/components/admin/AdminOpportunitiesManager";
import { AdminSubscriptionsManager } from "@/components/admin/AdminSubscriptionsManager";
import { EmailTemplateManager } from "@/components/admin/EmailTemplateManager";
import { AdminEmailMarketing } from "@/components/admin/AdminEmailMarketing";
import { AdminLeadsManager } from "@/components/admin/AdminLeadsManager";
import { AdminDocumentsManager } from "@/components/admin/AdminDocumentsManager";
import { AdminFirecrawlScraper } from "@/components/admin/AdminFirecrawlScraper";
import { AdminMPOverview } from "@/components/admin/AdminMPOverview";
import { AdminMPCertificationsManager } from "@/components/admin/AdminMPCertificationsManager";
import { AdminMPAnalytics } from "@/components/admin/AdminMPAnalytics";
import { AdminMaintenanceManager } from "@/components/admin/AdminMaintenanceManager";

const AdminDashboard = () => {
  const { user, isAdmin, loading, adminChecked, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    document.title = "Administration | MIPROJET";
  }, []);

  useEffect(() => {
    // Only redirect after both loading is complete and admin check is done
    if (!loading && adminChecked) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/dashboard');
      }
    }
  }, [loading, adminChecked, user, isAdmin, navigate]);

  // Show loading while checking auth or admin status
  if (loading || !adminChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top Bar */}
      <header
        className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 z-50 flex items-center px-3 sm:px-4 text-white shadow-elegant"
        style={{ background: "var(--gradient-brand)" }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/10 rounded-lg mr-2 sm:mr-4 text-white"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6 text-white shrink-0" />
          <span className="font-bold text-base sm:text-xl truncate">MIPROJET Admin</span>
        </div>

        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
            <Input
              placeholder={t('common.search') || "Rechercher..."}
              className="pl-10 bg-white/15 border-white/20 text-white placeholder:text-white/70 focus-visible:ring-white/40"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <NotificationBell />
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[160px]">{user?.email}</p>
              <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">Admin</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-white hover:bg-white/10">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Sidebar */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">Tableau de bord</h1>
                <p className="text-muted-foreground">Vue d'ensemble de la plateforme MIPROJET</p>
              </div>
              
              <AdminStats />
              <AdminKPICharts />
              <AdminCharts />
            </TabsContent>
            
            <TabsContent value="projects" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Gestion des Projets</h1>
                  <p className="text-muted-foreground">Gérez tous les projets de la plateforme</p>
                </div>
                <Button>Ajouter un projet</Button>
              </div>
              
              <AdminProjectsTable />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <AdminUsersTable />
            </TabsContent>
            
            <TabsContent value="requests" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold">Demandes de Services</h1>
                  <p className="text-muted-foreground">Gérez les demandes de structuration, d'accompagnement et d'accès aux projets</p>
                </div>
              </div>
              
              <Tabs defaultValue="services">
                <TabsList>
                  <TabsTrigger value="services">Demandes de services</TabsTrigger>
                  <TabsTrigger value="access">Demandes d'accès</TabsTrigger>
                </TabsList>
                <TabsContent value="services" className="pt-4">
                  <AdminRequestsTable />
                </TabsContent>
                <TabsContent value="access" className="pt-4">
                  <AdminAccessRequests />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="news" className="space-y-6">
              <AdminNewsManager />
            </TabsContent>
            
            <TabsContent value="invoices" className="space-y-6">
              <Tabs defaultValue="list">
                <TabsList>
                  <TabsTrigger value="list">Liste des factures</TabsTrigger>
                  <TabsTrigger value="generate">Générer une facture</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="pt-4">
                  <AdminInvoicesTable />
                </TabsContent>
                <TabsContent value="generate" className="pt-4">
                  <SmartInvoiceGenerator />
                </TabsContent>
              </Tabs>
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-6">
              <AdminPaymentsJournal />
            </TabsContent>
            
            <TabsContent value="admin-guide" className="space-y-6">
              <AdminGuide />
            </TabsContent>
            
            <TabsContent value="faq" className="space-y-6">
              <AdminFAQManager />
            </TabsContent>
            
            <TabsContent value="evaluations" className="space-y-6">
              <AdminEvaluationsManager />
            </TabsContent>
            
            <TabsContent value="opportunities" className="space-y-6">
              <Tabs defaultValue="list">
                <TabsList>
                  <TabsTrigger value="list">Gérer les opportunités</TabsTrigger>
                  <TabsTrigger value="scraper">🌐 Scraper Web (Firecrawl)</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="pt-4">
                  <AdminOpportunitiesManager />
                </TabsContent>
                <TabsContent value="scraper" className="pt-4">
                  <AdminFirecrawlScraper />
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="leads" className="space-y-6">
              <AdminLeadsManager />
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              <AdminDocumentsManager />
            </TabsContent>
            
            <TabsContent value="subscriptions" className="space-y-6">
              <AdminSubscriptionsManager />
            </TabsContent>
            
            <TabsContent value="referrals" className="space-y-6">
              <AdminReferralsManager />
            </TabsContent>
            
            <TabsContent value="database" className="space-y-6">
              <AdminDatabaseManager />
            </TabsContent>
            
            <TabsContent value="email-templates" className="space-y-6">
              <EmailTemplateManager />
            </TabsContent>

            <TabsContent value="emails" className="space-y-6">
              <AdminEmailMarketing />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <AdminSettingsManager />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <AdminMaintenanceManager />
            </TabsContent>

            <TabsContent value="mp-overview" className="space-y-6">
              <AdminMPOverview />
            </TabsContent>

            <TabsContent value="mp-analytics" className="space-y-6">
              <AdminMPAnalytics />
            </TabsContent>

            <TabsContent value="mp-certifications" className="space-y-6">
              <AdminMPCertificationsManager />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
