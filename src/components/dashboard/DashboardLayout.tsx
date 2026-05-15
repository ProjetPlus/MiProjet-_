import { ReactNode, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import {
  LayoutDashboard, FolderKanban, FileText, DollarSign,
  MessageSquare, Settings, LogOut, Menu, Search,
  Building2, Users, TrendingUp, CreditCard, FileCheck,
  HelpCircle, ChevronRight, Home, Compass
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
  userType?: 'individual' | 'enterprise' | 'investor' | 'funder' | 'admin';
}

const getMenuItems = (userType: string, t: (key: string) => string) => {
  const common = [
    { icon: LayoutDashboard, label: t('dashboard.overview') || 'Vue d\'ensemble', href: '/dashboard', id: 'overview' },
    { icon: Compass, label: 'Mon parcours', href: '/journey', id: 'journey' },
    { icon: MessageSquare, label: t('dashboard.messages') || 'Messages', href: '/dashboard/messages', id: 'messages' },
    { icon: Settings, label: t('dashboard.settings') || 'Paramètres', href: '/dashboard/settings', id: 'settings' },
  ];

  switch (userType) {
    case 'enterprise':
      return [
        ...common.slice(0, 2),
        { icon: Building2, label: 'Mon Entreprise', href: '/dashboard/company', id: 'company' },
        { icon: FolderKanban, label: t('dashboard.myProjects') || 'Mes Projets', href: '/dashboard/projects', id: 'projects' },
        { icon: FileText, label: 'Demandes de Service', href: '/dashboard/requests', id: 'requests' },
        { icon: FileCheck, label: 'Documents', href: '/dashboard/documents', id: 'documents' },
        { icon: CreditCard, label: 'Paiements', href: '/dashboard/payments', id: 'payments' },
        ...common.slice(2),
      ];
    case 'investor':
      return [
        ...common.slice(0, 2),
        { icon: TrendingUp, label: 'Mes Investissements', href: '/dashboard/investments', id: 'investments' },
        { icon: FolderKanban, label: 'Projets Disponibles', href: '/dashboard/available-projects', id: 'available' },
        { icon: DollarSign, label: 'Portefeuille', href: '/dashboard/portfolio', id: 'portfolio' },
        { icon: FileText, label: 'Rapports', href: '/dashboard/reports', id: 'reports' },
        ...common.slice(2),
      ];
    case 'funder':
      return [
        ...common.slice(0, 2),
        { icon: Building2, label: 'Organisation', href: '/dashboard/organization', id: 'organization' },
        { icon: FolderKanban, label: 'Projets Financés', href: '/dashboard/funded-projects', id: 'funded' },
        { icon: Users, label: 'Partenaires', href: '/dashboard/partners', id: 'partners' },
        { icon: FileText, label: 'Rapports d\'Impact', href: '/dashboard/impact', id: 'impact' },
        { icon: CreditCard, label: 'Décaissements', href: '/dashboard/disbursements', id: 'disbursements' },
        ...common.slice(2),
      ];
    default: // individual
      return [
        ...common.slice(0, 2),
        { icon: FolderKanban, label: t('dashboard.myProjects') || 'Mes Projets', href: '/dashboard/projects', id: 'projects' },
        { icon: FileText, label: t('dashboard.myDocuments') || 'Mes Documents', href: '/dashboard/documents', id: 'documents' },
        { icon: DollarSign, label: t('dashboard.myInvestments') || 'Mes Investissements', href: '/dashboard/investments', id: 'investments' },
        { icon: CreditCard, label: 'Paiements', href: '/dashboard/payments', id: 'payments' },
        ...common.slice(2),
      ];
  }
};

export const DashboardLayout = ({ children, userType = 'individual' }: DashboardLayoutProps) => {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = getMenuItems(userType, t);
  const activeItem = menuItems.find(item => location.pathname === item.href) || menuItems[0];

  const userTypeLabels: Record<string, string> = {
    individual: 'Porteur de projet',
    enterprise: 'Entreprise',
    investor: 'Investisseur',
    funder: 'Bailleur de fonds',
    admin: 'Administrateur'
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">M</span>
          </div>
          <div>
            <span className="font-bold text-lg">MIPROJET</span>
            <Badge variant="secondary" className="ml-2 text-xs">
              {userTypeLabels[userType]}
            </Badge>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.id}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Help & Logout */}
      <div className="p-4 border-t border-border/50 space-y-2">
        <Link
          to="/faq"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="font-medium">Aide & Support</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all w-full"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{t('nav.logout') || 'Déconnexion'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border/50 bg-card">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border/50 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Mobile Menu */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-72">
                <Sidebar />
              </SheetContent>
            </Sheet>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2 text-sm">
              <Link to="/" className="text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{activeItem.label}</span>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('common.search') || 'Rechercher...'}
                  className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <NotificationBell />

              <div className="flex items-center gap-3 pl-3 border-l border-border/50">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium">
                    {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : user?.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{userTypeLabels[userType]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};