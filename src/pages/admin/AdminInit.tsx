import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import logoMiprojet from "@/assets/logo-miprojet-new.png";

const AdminInit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"check" | "init" | "complete">("check");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: ""
  });

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      // Check if any admin role exists
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (error) throw error;
      
      if (roles && roles.length > 0) {
        setAdminExists(true);
        toast({
          title: "Admin existant",
          description: "Un administrateur existe déjà. Redirection vers la connexion.",
        });
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        setStep("init");
      }
    } catch (error) {
      console.error('Error checking admin:', error);
      setStep("init");
    } finally {
      setChecking(false);
    }
  };

  const handleInitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Try using edge function for more reliable admin creation
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (!result.success) {
        // Fallback to client-side creation
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              phone: formData.phone,
            },
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Échec de la création du compte");

        // Wait for trigger
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Update profile
        await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            is_verified: true,
            user_type: 'admin'
          })
          .eq('id', authData.user.id);

        // Assign admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'admin'
          });

        if (roleError) throw roleError;
      }

      setStep("complete");
      toast({
        title: "Succès !",
        description: "Compte super administrateur créé avec succès.",
      });

      // Auto-login after 2 seconds
      setTimeout(async () => {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        
        if (!loginError) {
          navigate('/admin');
        } else {
          navigate('/auth');
        }
      }, 2000);

    } catch (error: any) {
      console.error('Init error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'initialisation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Vérification en cours...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin existant</h2>
            <p className="text-muted-foreground">Un compte administrateur existe déjà.</p>
            <Button className="mt-4" onClick={() => navigate('/auth')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "complete") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Initialisation réussie !</h2>
            <p className="text-muted-foreground mb-4">
              Le compte super administrateur a été créé avec succès.
            </p>
            <div className="bg-muted p-4 rounded-lg text-left text-sm space-y-1">
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Nom:</strong> {formData.lastName} {formData.firstName}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Connexion automatique en cours...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoMiprojet} 
              alt="MIPROJET" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Initialisation Administrateur</CardTitle>
          <CardDescription>
            Créez le compte super administrateur MIPROJET
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInitAdmin} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+225 07 00 00 00 00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Créer le compte administrateur
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInit;
