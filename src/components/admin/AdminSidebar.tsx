import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  LayoutDashboard, Users, FolderKanban, Settings, 
  FileText, BarChart3, Home, Newspaper,
  Receipt, CreditCard, HelpCircle, BookOpen, Crown, Briefcase, Mail, UserCheck,
  ChevronDown, FileDown, Shield, Award, Sparkles
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onClose?: () => void;
}

const menuGroups = [
  {
    label: "Général",
    items: [
      { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestion de contenu",
    items: [
      { id: "projects", label: "Projets", icon: FolderKanban },
      { id: "opportunities", label: "Opportunités", icon: Briefcase },
      { id: "tenders", label: "Appels d'offres", icon: Briefcase },
      { id: "news", label: "Actualités", icon: Newspaper },
      { id: "documents", label: "Documents", icon: FileDown },
      { id: "faq", label: "FAQ", icon: HelpCircle },
    ],
  },
  {
    label: "Utilisateurs & Leads",
    items: [
      { id: "users", label: "Utilisateurs", icon: Users },
      { id: "leads", label: "Leads & Contacts", icon: UserCheck },
      { id: "referrals", label: "Parrainages", icon: Users },
    ],
  },
  {
    label: "Services & Évaluations",
    items: [
      { id: "requests", label: "Demandes de services", icon: FileText },
      { id: "evaluations", label: "Évaluations", icon: BarChart3 },
      { id: "subscriptions", label: "Abonnements", icon: Crown },
    ],
  },
  {
    label: "MiProjet+",
    items: [
      { id: "mp-overview", label: "Projets & Scores", icon: Sparkles },
      { id: "mp-analytics", label: "Analytiques", icon: BarChart3 },
      { id: "mp-certifications", label: "Certifications", icon: Award },
    ],
  },
  {
    label: "Finances",
    items: [
      { id: "invoices", label: "Factures", icon: Receipt },
      { id: "payments", label: "Paiements", icon: CreditCard },
    ],
  },
  {
    label: "Système",
    items: [
      { id: "database", label: "Base de données", icon: Shield },
      { id: "emails", label: "Email Marketing", icon: Mail },
      { id: "maintenance", label: "Maintenance", icon: Settings },
      { id: "settings", label: "Paramètres", icon: Settings },
    ],
  },
];

export const AdminSidebar = ({ isOpen, activeTab, onTabChange, onClose }: AdminSidebarProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleTabClick = (tab: string) => {
    onTabChange(tab);
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => 
      prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} />
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-card border-r border-border flex flex-col z-40 lg:z-auto">
        <ScrollArea className="flex-1 p-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mb-4"
          >
            <Home className="h-5 w-5" />
            <span>Retour au site</span>
          </Link>
          
          <nav className="space-y-4">
            {menuGroups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.label);
              return (
                <div key={group.label}>
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground"
                  >
                    {group.label}
                    <ChevronDown className={cn("h-3 w-3 transition-transform", isCollapsed && "-rotate-90")} />
                  </button>
                  {!isCollapsed && (
                    <div className="space-y-0.5 mt-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-border bg-card">
          <button
            onClick={() => handleTabClick('admin-guide')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
              activeTab === 'admin-guide'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <BookOpen className="h-5 w-5" />
            <span className="font-medium text-sm">Guide Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
};
