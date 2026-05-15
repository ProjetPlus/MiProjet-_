import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Wallet, Loader2, Trash2 } from "lucide-react";

const CATEGORIES = {
  revenue: ["Vente produits", "Prestation services", "Subvention", "Autre revenu"],
  expense: ["Matières premières", "Salaires", "Loyer", "Transport", "Communication", "Impôts", "Autre charge"],
  investment: ["Équipement", "Formation", "Marketing", "Autre investissement"],
};

const MPFinancial = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ record_type: "revenue", category: "", description: "", amount: 0, record_date: new Date().toISOString().split("T")[0] });

  useEffect(() => {
    if (!user) return;
    supabase.from("mp_projects").select("id, title").eq("user_id", user.id).then(({ data }) => {
      if (data) setProjects(data);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!selectedProject) return;
    supabase.from("mp_financial_records").select("*").eq("project_id", selectedProject).order("record_date", { ascending: false }).then(({ data }) => {
      if (data) setRecords(data);
    });
  }, [selectedProject]);

  const totals = {
    revenue: records.filter((r) => r.record_type === "revenue").reduce((s, r) => s + Number(r.amount), 0),
    expense: records.filter((r) => r.record_type === "expense").reduce((s, r) => s + Number(r.amount), 0),
    investment: records.filter((r) => r.record_type === "investment").reduce((s, r) => s + Number(r.amount), 0),
  };
  const profit = totals.revenue - totals.expense;

  const handleSubmit = async () => {
    if (!user || !selectedProject || !form.amount) return;
    setSaving(true);
    const { error } = await supabase.from("mp_financial_records").insert({ ...form, user_id: user.id, project_id: selectedProject });
    setSaving(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Enregistrement ajouté" });
    setShowForm(false);
    setForm({ record_type: "revenue", category: "", description: "", amount: 0, record_date: new Date().toISOString().split("T")[0] });
    const { data } = await supabase.from("mp_financial_records").select("*").eq("project_id", selectedProject).order("record_date", { ascending: false });
    if (data) setRecords(data);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mp_financial_records").delete().eq("id", id);
    setRecords((r) => r.filter((x) => x.id !== id));
  };

  const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Suivi financier</h2>
        {selectedProject && (
          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogTrigger asChild><Button className="bg-emerald-600 hover:bg-emerald-700" size="sm"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nouvel enregistrement</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Type</Label><Select value={form.record_type} onValueChange={(v) => setForm({ ...form, record_type: v, category: "" })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="revenue">Recette</SelectItem><SelectItem value="expense">Dépense</SelectItem><SelectItem value="investment">Investissement</SelectItem></SelectContent></Select></div>
                <div><Label>Catégorie</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue placeholder="Catégorie" /></SelectTrigger><SelectContent>{(CATEGORIES[form.record_type as keyof typeof CATEGORIES] || []).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Montant (XOF)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })} /></div>
                <div><Label>Date</Label><Input type="date" value={form.record_date} onChange={(e) => setForm({ ...form, record_date: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optionnel" /></div>
                <Button onClick={handleSubmit} disabled={saving || !form.amount} className="w-full bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div><Label className="text-sm">Projet</Label><Select value={selectedProject} onValueChange={setSelectedProject}><SelectTrigger><SelectValue placeholder="Sélectionnez un projet" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>

      {selectedProject && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="border-0 shadow-sm"><CardContent className="p-4"><TrendingUp className="h-5 w-5 text-emerald-600 mb-1" /><p className="text-xs text-gray-500">Recettes</p><p className="text-lg font-bold text-emerald-600">{fmt(totals.revenue)}</p></CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-4"><TrendingDown className="h-5 w-5 text-rose-600 mb-1" /><p className="text-xs text-gray-500">Dépenses</p><p className="text-lg font-bold text-rose-600">{fmt(totals.expense)}</p></CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-4"><Wallet className="h-5 w-5 text-blue-600 mb-1" /><p className="text-xs text-gray-500">Investissements</p><p className="text-lg font-bold text-blue-600">{fmt(totals.investment)}</p></CardContent></Card>
            <Card className="border-0 shadow-sm"><CardContent className="p-4"><TrendingUp className="h-5 w-5 text-purple-600 mb-1" /><p className="text-xs text-gray-500">Bénéfice</p><p className={`text-lg font-bold ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{fmt(profit)}</p></CardContent></Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Historique</CardTitle></CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">Aucun enregistrement</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {records.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={r.record_type === "revenue" ? "default" : r.record_type === "expense" ? "destructive" : "secondary"} className="text-[10px]">
                            {r.record_type === "revenue" ? "Recette" : r.record_type === "expense" ? "Dépense" : "Invest."}
                          </Badge>
                          <span className="text-xs text-gray-400">{new Date(r.record_date).toLocaleDateString("fr-FR")}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{r.category}{r.description ? ` – ${r.description}` : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-bold text-sm ${r.record_type === "revenue" ? "text-emerald-600" : "text-rose-600"}`}>
                          {r.record_type === "revenue" ? "+" : "-"}{fmt(Number(r.amount))}
                        </span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(r.id)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MPFinancial;
