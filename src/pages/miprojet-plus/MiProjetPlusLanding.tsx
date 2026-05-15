import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/components/SEOHead";
import miprojetPlusLogo from "@/assets/miprojet-plus-logo.jpg";
import InstallPWAPopup from "@/components/miprojet-plus/InstallPWAPopup";
import {
  BarChart3, Shield, TrendingUp, Users, FileCheck, Smartphone,
  ArrowRight, CheckCircle, Eye, EyeOff, Loader2
} from "lucide-react";

const features = [
  { icon: BarChart3, title: "MIPROJET SCORE", desc: "Évaluation sur 100 points de votre activité ou projet" },
  { icon: TrendingUp, title: "Suivi financier", desc: "Recettes, dépenses, bénéfices en temps réel" },
  { icon: FileCheck, title: "Certification", desc: "Rapports certifiés reconnus par les financeurs" },
  { icon: Users, title: "Mise en relation", desc: "Connexion avec banques, microfinances et investisseurs" },
  { icon: Shield, title: "Structuration", desc: "Transformation de votre activité en entreprise solvable" },
  { icon: Smartphone, title: "Mode offline", desc: "Utilisez l'app sans connexion internet" },
];

const steps = [
  { num: "01", title: "Inscription", desc: "Créez votre profil promoteur" },
  { num: "02", title: "Collecte", desc: "Saisissez vos données d'activité ou projet" },
  { num: "03", title: "Diagnostic", desc: "Obtenez votre MIPROJET SCORE sur 100" },
  { num: "04", title: "Structuration", desc: "Améliorez votre dossier avec notre accompagnement" },
  { num: "05", title: "Financement", desc: "Accédez aux financeurs partenaires" },
];

const MiProjetPlusLanding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useSEO({
    title: "MiProjet+ – Structurez et financez votre activité",
    description: "MiProjet+ structure vos micro-activités, PME et startups pour les rendre solvables et éligibles au financement. Score de maturité, suivi financier, certification.",
    url: "https://ivoireprojet.com/miprojet-plus",
    siteName: "MiProjet+",
    image: "https://ivoireprojet.com/miprojet-plus-icon-512.png",
  });

  if (user) {
    navigate("/miprojet-plus/app");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/miprojet-plus/app");
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { first_name: firstName },
            emailRedirectTo: window.location.origin + "/miprojet-plus/app",
          },
        });
        if (error) throw error;
        toast({ title: "Inscription réussie", description: "Vérifiez votre email pour confirmer votre compte." });
      }
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <InstallPWAPopup />

      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={miprojetPlusLogo} alt="MiProjet+" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold">MiProjet<span className="text-emerald-600">+</span></span>
          </div>
          <a href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">
            ← Retour à MIPROJET
          </a>
        </div>
      </header>

      {/* Hero + Login */}
      <section className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
          {/* Left */}
          <div className="space-y-6">
            <div>
              <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium mb-4">
                Application de structuration
              </span>
              <h1 className="text-3xl lg:text-5xl font-bold leading-tight text-gray-900">
                Transformez votre activité en{" "}
                <span className="text-emerald-600">entreprise finançable</span>
              </h1>
              <p className="text-gray-600 mt-4 text-base lg:text-lg leading-relaxed max-w-xl">
                MiProjet<span className="text-emerald-600">+</span> structure vos micro-activités, PME et startups pour les rendre
                solvables et éligibles au financement. Score de maturité, suivi financier,
                certification et mise en relation avec les financeurs.
              </p>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: "100", label: "Score sur 100" },
                { value: "5", label: "Axes d'évaluation" },
                { value: "6", label: "Étapes clés" },
              ].map((s) => (
                <div key={s.label} className="text-center p-4 bg-emerald-50 rounded-xl">
                  <div className="text-2xl font-bold text-emerald-600">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Steps */}
            <div className="space-y-3 hidden lg:block">
              {steps.map((step) => (
                <div key={step.num} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{step.title}</p>
                    <p className="text-gray-500 text-xs">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Login form */}
          <Card className="bg-white border border-gray-200 shadow-xl">
            <CardContent className="p-6 lg:p-8">
              <div className="text-center mb-6">
                <img src={miprojetPlusLogo} alt="MiProjet+" className="h-16 w-16 rounded-2xl mx-auto mb-3" />
                <h2 className="text-xl font-bold text-gray-900">
                  {isLogin ? "Connexion à MiProjet" : "Créer un compte MiProjet"}<span className="text-emerald-600">+</span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {isLogin ? "Accédez à votre espace de structuration" : "Commencez à structurer votre activité"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-1.5">
                    <Label className="text-gray-700 text-sm">Prénom</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom" required className="h-11" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.com" required className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-gray-700 text-sm">Mot de passe</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} className="h-11 pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-12 rounded-xl text-base">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{isLogin ? "Se connecter" : "Créer mon compte"}<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 hover:text-emerald-700 text-sm">
                  {isLogin ? "Pas encore de compte ? Inscrivez-vous" : "Déjà un compte ? Connectez-vous"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Tout ce dont vous avez besoin pour <span className="text-emerald-600">réussir</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-5 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                  <Icon className="h-8 w-8 text-emerald-600 mb-3" />
                  <h3 className="font-semibold text-sm mb-1 text-gray-900">{f.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Score */}
      <section className="container mx-auto px-4 py-12 lg:py-16">
        <div className="bg-gray-50 rounded-2xl p-6 lg:p-10 border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">MIPROJET SCORE – Évaluation sur 100</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { axis: "Juridique & Gouvernance", pts: 15, color: "bg-blue-500" },
              { axis: "Financier", pts: 25, color: "bg-emerald-500" },
              { axis: "Technique & Opérationnel", pts: 20, color: "bg-amber-500" },
              { axis: "Marché & Modèle", pts: 20, color: "bg-purple-500" },
              { axis: "Impact & Durabilité", pts: 20, color: "bg-rose-500" },
            ].map((a) => (
              <div key={a.axis} className="text-center p-4 bg-white rounded-xl border border-gray-100">
                <div className={`w-12 h-12 rounded-full ${a.color} mx-auto mb-2 flex items-center justify-center text-lg font-bold text-white`}>
                  {a.pts}
                </div>
                <p className="text-xs font-medium text-gray-600">{a.axis}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
            {[
              { range: "80-100", label: "Finançable", color: "text-emerald-600" },
              { range: "60-79", label: "Prometteur", color: "text-blue-600" },
              { range: "40-59", label: "Fragile", color: "text-amber-600" },
              { range: "< 40", label: "Non finançable", color: "text-rose-600" },
            ].map((l) => (
              <div key={l.range} className="flex items-center gap-2 text-sm">
                <CheckCircle className={`h-4 w-4 ${l.color}`} />
                <span className={`${l.color} font-medium`}>{l.range} : {l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-gray-400 text-sm">
          © {new Date().getFullYear()} MiProjet<span className="text-emerald-600">+</span> par MIPROJET – Plateforme de structuration et d'inclusion financière
        </p>
      </footer>
    </div>
  );
};

export default MiProjetPlusLanding;
