import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { User, Building2, TrendingUp, Banknote, GraduationCap, Loader2 } from "lucide-react";

export const PROFILE_TYPES = [
  { id: "individual", label: "Porteur de projet (particulier)", icon: User, desc: "Vous portez une idée ou un projet personnel.", color: "from-blue-500/10 to-blue-500/5", target: "/dashboard" },
  { id: "enterprise", label: "Entreprise / Start-up", icon: Building2, desc: "Vous représentez une entreprise constituée.", color: "from-purple-500/10 to-purple-500/5", target: "/dashboard" },
  { id: "investor", label: "Investisseur", icon: TrendingUp, desc: "Vous cherchez à investir dans des projets africains.", color: "from-emerald-500/10 to-emerald-500/5", target: "/investors" },
  { id: "funder", label: "Bailleur / Institution", icon: Banknote, desc: "Vous financez ou soutenez des programmes.", color: "from-amber-500/10 to-amber-500/5", target: "/dashboard" },
  { id: "expert", label: "Expert / Mentor", icon: GraduationCap, desc: "Vous accompagnez ou conseillez des porteurs.", color: "from-rose-500/10 to-rose-500/5", target: "/dashboard" },
] as const;

const ProfileSelect = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Choisissez votre profil | MIPROJET";
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { navigate("/auth"); return; }
      setUserId(data.user.id);
    });
  }, [navigate]);

  const onConfirm = async () => {
    if (!selected || !userId) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ user_type: selected }).eq("id", userId);
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    const target = PROFILE_TYPES.find(p => p.id === selected)?.target || "/dashboard";
    toast({ title: "Profil enregistré", description: "Bienvenue sur MIPROJET !" });
    navigate(target);
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Quel est votre profil ?</h1>
          <p className="text-muted-foreground">Choisissez le profil qui correspond le mieux à votre activité pour personnaliser votre expérience.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {PROFILE_TYPES.map(p => {
            const Icon = p.icon;
            const active = selected === p.id;
            return (
              <Card
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`cursor-pointer transition-all hover:shadow-lg bg-gradient-to-br ${p.color} ${active ? "ring-2 ring-primary border-primary" : ""}`}
              >
                <CardContent className="p-6 text-center space-y-3">
                  <Icon className={`h-10 w-10 mx-auto ${active ? "text-primary" : "text-muted-foreground"}`} />
                  <h3 className="font-semibold">{p.label}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex justify-center">
          <Button size="lg" disabled={!selected || saving} onClick={onConfirm} className="min-w-[200px]">
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement…</> : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelect;
