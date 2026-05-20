import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { MathCaptcha } from "@/components/MathCaptcha";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackLead } from "@/lib/leadTracking";
import { PROFILE_TYPES } from "@/pages/ProfileSelect";
import { Card } from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const signupSchema = loginSchema.extend({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  whatsapp: z.string().min(8, "Numéro WhatsApp invalide"),
});

const REFERRAL_KEY = "miprojet_pending_ref";

const isSuperAdminSession = async (_userEmail?: string | null) => {
  // Primary source of truth: user_roles via RPC
  const { data, error } = await supabase.rpc('current_user_has_role', { _role: 'admin' });
  if (!error && data === true) return true;
  // Fallback: direct read of user_roles (covers RPC errors after a fresh signin)
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return false;
  const { data: row } = await supabase
    .from('user_roles').select('id')
    .eq('user_id', u.user.id).eq('role', 'admin').maybeSingle();
  return !!row;
};

const countryCodes = [
  { code: "+225", country: "🇨🇮 Côte d'Ivoire" },
  { code: "+228", country: "🇹🇬 Togo" },
  { code: "+229", country: "🇧🇯 Bénin" },
  { code: "+226", country: "🇧🇫 Burkina Faso" },
  { code: "+223", country: "🇲🇱 Mali" },
  { code: "+221", country: "🇸🇳 Sénégal" },
  { code: "+224", country: "🇬🇳 Guinée" },
  { code: "+227", country: "🇳🇪 Niger" },
  { code: "+237", country: "🇨🇲 Cameroun" },
  { code: "+242", country: "🇨🇬 Congo" },
  { code: "+243", country: "🇨🇩 RD Congo" },
  { code: "+241", country: "🇬🇦 Gabon" },
  { code: "+33", country: "🇫🇷 France" },
  { code: "+1", country: "🇺🇸 USA/Canada" },
  { code: "+44", country: "🇬🇧 Royaume-Uni" },
  { code: "+212", country: "🇲🇦 Maroc" },
  { code: "+216", country: "🇹🇳 Tunisie" },
  { code: "+234", country: "🇳🇬 Nigeria" },
  { code: "+233", country: "🇬🇭 Ghana" },
];

const Auth = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+225");
  const [whatsapp, setWhatsapp] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [userType, setUserType] = useState<string>("individual");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaValid, setCaptchaValid] = useState(false);

  // Capture ?ref= query param and persist
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      const code = ref.toUpperCase();
      setReferralCode(code);
      try { localStorage.setItem(REFERRAL_KEY, code); } catch {}
    } else {
      try {
        const stored = localStorage.getItem(REFERRAL_KEY);
        if (stored) setReferralCode(stored);
      } catch {}
    }
  }, [searchParams]);

  useEffect(() => {
    document.title = mode === "login" ? "Connexion | MIPROJET" : "Inscription | MIPROJET";
    
    const checkSessionAndRedirect = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (await isSuperAdminSession(data.session.user.email)) {
          navigate(redirect || '/admin');
        } else {
          navigate(redirect || '/dashboard');
        }
      }
    };
    
    checkSessionAndRedirect();
  }, [mode, navigate, redirect]);

  const handleCaptchaChange = useCallback((isValid: boolean) => {
    setCaptchaValid(isValid);
  }, []);

  const validate = () => {
    try {
      if (mode === "login") {
        loginSchema.parse({ email, password });
      } else {
        signupSchema.parse({ email, password, firstName, lastName, whatsapp });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaValid) {
      toast({ title: "Vérification requise", description: "Veuillez résoudre le calcul de sécurité.", variant: "destructive" });
      return;
    }
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      if (mode === "login") {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Invalid login")) {
            throw new Error("Email ou mot de passe incorrect");
          }
          throw error;
        }
        
        if (authData.user) {
          const isSuperAdmin = await isSuperAdminSession(authData.user.email);
          toast({ title: t('auth.loginSuccess'), description: t('auth.welcome') });
          if (isSuperAdmin) {
            navigate(redirect || '/admin');
          } else {
            // Route based on user_type
            const { data: prof } = await supabase.from('profiles').select('user_type').eq('id', authData.user.id).maybeSingle();
            const target = PROFILE_TYPES.find(p => p.id === prof?.user_type)?.target || '/dashboard';
            navigate(redirect || target);
          }
        }
      } else {
        const fullWhatsapp = `${countryCode}${whatsapp}`;
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              whatsapp: fullWhatsapp,
              referred_by_code: referralCode || null,
              user_type: userType,
            },
          },
        });
        if (error) {
          if (error.message.includes("already registered")) {
            throw new Error("Cet email est déjà utilisé");
          }
          throw error;
        }

        // Update profile with whatsapp + referral code
        if (authData.user) {
          await supabase.from('profiles').update({
            whatsapp: fullWhatsapp,
            referred_by_code: referralCode || null,
            user_type: userType,
          }).eq('id', authData.user.id);

          // Track lead with source = signup
          await trackLead("signup", {
            first_name: firstName,
            last_name: lastName,
            email,
            whatsapp: fullWhatsapp,
            phone: fullWhatsapp,
            user_id: authData.user.id,
            additional_info: { referral_code: referralCode || null },
          });

          try { localStorage.removeItem(REFERRAL_KEY); } catch {}
        }

        toast({ title: "✅ Inscription réussie.", description: "Veuillez confirmer votre adresse email pour activer votre compte et accéder à votre espace sécurisé." });
        
        // Clear form
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setWhatsapp("");
        setCaptchaValid(false);
        
        // Wait 5 seconds then redirect to login
        setTimeout(() => {
          setMode("login");
        }, 5000);
      }
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message ?? "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
        <section className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {mode === "login" ? t('auth.login') : t('auth.signup')}
              </h1>
              <p className="text-muted-foreground">{t('auth.accessDescription')}</p>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" placeholder="Inocent" />
                      </div>
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="pl-10" placeholder="KOFFI" />
                      </div>
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
                    </div>
                  </div>

                  {/* WhatsApp field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">Contact (WhatsApp) *</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countryCodes.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                              {c.country} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          id="whatsapp" 
                          value={whatsapp} 
                          onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))} 
                          className="pl-10" 
                          placeholder="0759566087" 
                        />
                      </div>
                    </div>
                    {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
                  </div>

                  {/* Referral code (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="refcode">Code de parrainage (optionnel)</Label>
                    <Input
                      id="refcode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Ex: ABC12345"
                      maxLength={20}
                    />
                    {referralCode && (
                      <p className="text-xs text-success">Code parrain enregistré : <strong>{referralCode}</strong></p>
                    )}
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" placeholder="vous@exemple.com" required />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password" type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" placeholder="••••••••" required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              {/* Math CAPTCHA */}
              <MathCaptcha onValidChange={handleCaptchaChange} />
              
              <Button type="submit" className="w-full" size="lg" disabled={loading || !captchaValid}>
                {loading ? t('common.loading') : mode === "login" ? t('auth.login') : t('auth.signup')}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? t('auth.noAccount') : t('auth.hasAccount')}{" "}
                <button className="text-primary font-medium hover:underline"
                  onClick={() => { setMode(mode === "login" ? "signup" : "login"); setCaptchaValid(false); }}
                >
                  {mode === "login" ? t('auth.createAccount') : t('auth.loginNow')}
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Auth;
