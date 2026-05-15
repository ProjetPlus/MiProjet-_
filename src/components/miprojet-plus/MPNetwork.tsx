import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Building2, Landmark, HandCoins, Loader2, Trash2 } from "lucide-react";

const FUNDER_TYPES = [
  { value: "bank", label: "Banque", icon: Landmark },
  { value: "microfinance", label: "Microfinance", icon: HandCoins },
  { value: "investor", label: "Investisseur", icon: Building2 },
  { value: "ngo", label: "ONG / Fondation", icon: Users },
  { value: "government", label: "État / Programme public", icon: Building2 },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  prospect: { label: "Prospect", color: "bg-gray-100 text-gray-600" },
  contacted: { label: "Contacté", color: "bg-blue-100 text-blue-700" },
  in_discussion: { label: "En discussion", color: "bg-amber-100 text-amber-700" },
  approved: { label: "Approuvé", color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "Refusé", color: "bg-rose-100 text-rose-700" },
};

const MPNetwork = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({ funder_name: "", funder_type: "bank", contact_info: "", notes: "", project_id: "" });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("mp_funder_connections").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("mp_projects").select("id, title").eq("user_id", user.id),
    ]).then(([connRes, projRes]) => {
      if (connRes.data) setConnections(connRes.data);
      if (projRes.data) setProjects(projRes.data);
      setLoading(false);
    });
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !form.funder_name) return;
    setSaving(true);
    const { error } = await supabase.from("mp_funder_connections").insert({
      user_id: user.id, ...form, project_id: form.project_id || null, status: "prospect",
    });
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contact ajouté" });
    setShowForm(false);
    setForm({ funder_name: "", funder_type: "bank", contact_info: "", notes: "", project_id: "" });
    const { data } = await supabase.from("mp_funder_connections").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setConnections(data);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mp_funder_connections").delete().eq("id", id);
    setConnections((c) => c.filter((x) => x.id !== id));
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("mp_funder_connections").update({ status }).eq("id", id);
    setConnections((c) => c.map((x) => (x.id === id ? { ...x, status } : x)));
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Réseau financeurs</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700" size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouveau contact financeur</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom du financeur *</Label><Input value={form.funder_name} onChange={(e) => setForm({ ...form, funder_name: e.target.value })} placeholder="Ex: BIAO-CI, Advans, FAFCI..." /></div>
              <div><Label>Type</Label><Select value={form.funder_type} onValueChange={(v) => setForm({ ...form, funder_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{FUNDER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Projet associé</Label><Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}><SelectTrigger><SelectValue placeholder="Optionnel" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Contact</Label><Input value={form.contact_info} onChange={(e) => setForm({ ...form, contact_info: e.target.value })} placeholder="Email ou téléphone" /></div>
              <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <Button onClick={handleSubmit} disabled={saving || !form.funder_name} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total contacts", value: connections.length },
          { label: "Contactés", value: connections.filter((c) => c.status !== "prospect").length },
          { label: "En discussion", value: connections.filter((c) => c.status === "in_discussion").length },
          { label: "Approuvés", value: connections.filter((c) => c.status === "approved").length },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm"><CardContent className="p-4"><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></CardContent></Card>
        ))}
      </div>

      {connections.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Aucun contact financeur</p>
          <p className="text-sm text-gray-400 mt-1">Ajoutez des banques, microfinances ou investisseurs</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {connections.map((c) => {
            const status = STATUS_MAP[c.status] || STATUS_MAP.prospect;
            const typeInfo = FUNDER_TYPES.find((t) => t.value === c.funder_type);
            return (
              <Card key={c.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{c.funder_name}</p>
                        <Badge variant="outline" className="text-[10px]">{typeInfo?.label}</Badge>
                      </div>
                      {c.contact_info && <p className="text-xs text-gray-400 mt-0.5">{c.contact_info}</p>}
                      {c.notes && <p className="text-xs text-gray-500 mt-1">{c.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-auto"><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MPNetwork;
