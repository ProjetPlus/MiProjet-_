import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard, ChevronDown, Search, Phone, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import logo from "@/assets/logo-miprojet-new.png";

type SubItem = { to: string; label: string; desc?: string; emoji?: string };
type MenuGroup = { key: string; label: string; items: SubItem[] };

export const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openMobileSub, setOpenMobileSub] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = () => (user?.email || "").charAt(0).toUpperCase();
  const toggleMobileSub = (k: string) => setOpenMobileSub((p) => (p === k ? null : k));

  const groups: MenuGroup[] = [
    {
      key: "about",
      label: "À propos",
      items: [
        { to: "/about", label: "Qui sommes-nous", emoji: "🏛️" },
        { to: "/how-it-works", label: "Comment ça marche", emoji: "⚙️" },
        { to: "/success-stories", label: "Témoignages", emoji: "🏆" },
        { to: "/journey", label: "Notre parcours", emoji: "🛤️" },
      ],
    },
    {
      key: "offers",
      label: "Nos offres",
      items: [
        { to: "/services", label: "Tous les services", emoji: "🧭" },
        { to: "/services/structuration", label: "Structuration de projet", emoji: "📋" },
        { to: "/services/accompagnement", label: "Accompagnement entreprise", emoji: "🤝" },
        { to: "/incubation", label: "Programme d'incubation", emoji: "🚀" },
        { to: "/subscription", label: "Abonnements Premium", emoji: "👑" },
      ],
    },
    {
      key: "opportunities",
      label: "Opportunités",
      items: [
        { to: "/opportunities", label: "Appels & financements", emoji: "🎯" },
        { to: "/projects", label: "Projets à financer", emoji: "💼" },
        { to: "/investors", label: "Espace investisseurs", emoji: "💰" },
        { to: "/submit-project", label: "Soumettre un projet", emoji: "📤" },
      ],
    },
    {
      key: "resources",
      label: "Actualités & Ressources",
      items: [
        { to: "/news", label: "Actualités", emoji: "📰" },
        { to: "/documents", label: "Documents", emoji: "📚" },
        { to: "/ebook", label: "Guide 50 financements", emoji: "📕" },
        { to: "/forum", label: "Forum communauté", emoji: "💬" },
        { to: "/faq", label: "FAQ", emoji: "❓" },
      ],
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <TopBar />
      <nav
        className={cn(
          "bg-background/95 backdrop-blur-xl border-b border-border/60 transition-all duration-300 supports-[backdrop-filter]:bg-background/85",
          scrolled && "shadow-card"
        )}
      >
        <div className="container-luxe">
          <div className={cn("flex items-center justify-between transition-all", scrolled ? "h-14" : "h-[68px]")}>
            {/* Logo */}
            <Link to="/" className="flex items-center group shrink-0" aria-label="MIPROJET — Accueil">
              <img
                src={logo}
                alt="MIPROJET — Entrepreneuriat jeune"
                className={cn(
                  "w-auto object-contain transition-all duration-300 group-hover:scale-[1.03]",
                  scrolled ? "h-9" : "h-11"
                )}
              />
            </Link>

            {/* Desktop centered nav */}
            <div className="hidden lg:flex items-center justify-center flex-1 px-6">
              <NavigationMenu>
                <NavigationMenuList className="gap-1">
                  {groups.map((g) => (
                    <NavigationMenuItem key={g.key}>
                      <NavigationMenuTrigger className="text-[13.5px] font-semibold bg-transparent h-10 px-3.5 data-[state=open]:text-primary hover:text-primary">
                        {g.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul className="grid w-[340px] gap-0.5 p-3">
                          {g.items.map((it) => (
                            <li key={it.to}>
                              <NavigationMenuLink asChild>
                                <Link
                                  to={it.to}
                                  className="flex items-center gap-3 rounded-lg p-2.5 text-sm hover:bg-muted transition-colors group/item"
                                >
                                  {it.emoji && <span className="text-lg">{it.emoji}</span>}
                                  <span className="font-medium group-hover/item:text-primary transition-colors">
                                    {it.label}
                                  </span>
                                </Link>
                              </NavigationMenuLink>
                            </li>
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                  <NavigationMenuItem>
                    <Link
                      to="/contact"
                      className="text-[13.5px] font-semibold px-3.5 py-2 hover:text-primary transition-colors whitespace-nowrap"
                    >
                      Contact
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Right cluster */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <button
                aria-label="Rechercher"
                className="h-9 w-9 grid place-items-center rounded-full hover:bg-muted text-foreground/70 hover:text-primary transition-colors"
                onClick={() => navigate("/projects")}
              >
                <Search className="h-4 w-4" />
              </button>

              <LanguageSelector />

              {/* MiProjet+ — detached pill (Belife "Belife & Moi" style) */}
              <Link to="/miprojet-plus" className="ml-1">
                <Button
                  size="sm"
                  className="rounded-full px-5 h-10 font-bold text-white shadow-lg hover:shadow-xl hover:scale-[1.03] transition-all"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  MiProjet+
                </Button>
              </Link>

              {/* Phone pill */}
              <a
                href="tel:+22507071679"
                aria-label="Téléphone"
                className="h-10 w-10 grid place-items-center rounded-full text-white shadow-md hover:shadow-lg transition-all hover:scale-105"
                style={{ background: "hsl(var(--accent))" }}
              >
                <Phone className="h-4 w-4" />
              </a>

              {/* User */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-1">
                      <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{isAdmin ? "Administrateur" : "Membre"}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t("nav.dashboard")}
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          {t("nav.admin")}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth" className="ml-1">
                  <Button variant="ghost" size="sm" className="font-semibold">
                    {t("nav.login")}
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile button */}
            <div className="flex items-center gap-2 lg:hidden">
              <Link to="/miprojet-plus">
                <Button
                  size="sm"
                  className="rounded-full h-9 px-3.5 font-bold text-white text-xs"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  MiProjet+
                </Button>
              </Link>
              <button
                className="text-foreground p-2 -mr-2"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="lg:hidden py-4 space-y-1 border-t border-border max-h-[78vh] overflow-y-auto animate-fade-in">
              {groups.map((g) => (
                <div key={g.key}>
                  <button
                    onClick={() => toggleMobileSub(g.key)}
                    className="w-full flex items-center justify-between py-2.5 px-2 text-foreground hover:text-primary font-semibold"
                  >
                    <span>{g.label}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        openMobileSub === g.key && "rotate-180"
                      )}
                    />
                  </button>
                  {openMobileSub === g.key && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-primary/30 ml-2 mb-2">
                      {g.items.map((it) => (
                        <Link
                          key={it.to}
                          to={it.to}
                          className="flex items-center gap-2 py-2 px-2 text-sm text-muted-foreground hover:text-primary"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {it.emoji && <span>{it.emoji}</span>}
                          <span>{it.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <Link
                to="/contact"
                className="block py-2.5 px-2 font-semibold hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>

              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex items-center justify-between px-2">
                  <LanguageSelector />
                  <a
                    href="tel:+22507071679"
                    className="flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    <Phone className="h-4 w-4" /> +225 07 07 16 79 21
                  </a>
                </div>
                {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        {t("nav.dashboard")}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <User className="mr-2 h-4 w-4" />
                          {t("nav.admin")}
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {t("nav.logout")}
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">
                      {t("nav.login")}
                    </Button>
                  </Link>
                )}
                <Link to="/submit-project" onClick={() => setIsMenuOpen(false)}>
                  <Button
                    className="w-full font-semibold text-white"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    Soumettre un projet
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
