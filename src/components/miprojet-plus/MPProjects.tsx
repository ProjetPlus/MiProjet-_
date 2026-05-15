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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus, FileText, Loader2, Pencil, Trash2, Eye, Archive, BarChart3, Award, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const SECTORS = ["Agriculture", "Commerce", "Artisanat", "Services", "Transport", "BTP", "Industrie", "Technologie", "Éducation", "Santé", "Autre"];

const MPProjects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [certifications, setCertifications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewProject, setViewProject] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", description: "", activity_type: "micro_activity", sector: "", legal_status: "",
    city: "", annual_revenue: 0, monthly_expenses: 0, employees_count: 0,
    has_accounting: false, has_bank_account: false, has_business_plan: false,
  });

  const fetchProjects = async () => {
    if (!user) return;
    const { data } = await supabase.from("mp_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) {
      setProjects(data);
      // Fetch scores and certifications for each project
      const scoreMap: Record<string, any> = {};
      const certMap: Record<string, any> = {};
      for (const p of data) {
        const { data: scoreData } = await supabase.from("mp_scoring_results").select("score_global, niveau, created_at").eq("project_id", p.id).eq("is_active", true).limit(1).maybeSingle();
        if (scoreData) scoreMap[p.id] = scoreData;
        const { data: certData } = await supabase.from("mp_certifications").select("status, created_at, certified_at").eq("project_id", p.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (certData) certMap[p.id] = certData;
      }
      setScores(scoreMap);
      setCertifications(certMap);
    }
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, [user]);

  const resetForm = () => {
    setForm({ title: "", description: "", activity_type: "micro_activity", sector: "", legal_status: "", city: "", annual_revenue: 0, monthly_expenses: 0, employees_count: 0, has_accounting: false, has_bank_account: false, has_business_plan: false });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!user || !form.title) return;
    setSaving(true);
    const payload = { ...form, user_id: user.id };
    let error;
    if (editingId) {
      ({ error } = await supabase.from("mp_projects").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("mp_projects").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Projet modifié" : "Projet créé" });
      setShowForm(false);
      resetForm();
      fetchProjects();
    }
  };

  const handleEdit = (p: any) => {
    setForm({ title: p.title, description: p.description || "", activity_type: p.activity_type, sector: p.sector || "", legal_status: p.legal_status || "", city: p.city || "", annual_revenue: p.annual_revenue || 0, monthly_expenses: p.monthly_expenses || 0, employees_count: p.employees_count || 0, has_accounting: p.has_accounting, has_bank_account: p.has_bank_account, has_business_plan: p.has_business_plan });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce projet définitivement ?")) return;
    const { error } = await supabase.from("mp_projects").delete().eq("id", id);
    if (!error) { toast({ title: "Projet supprimé" }); fetchProjects(); }
  };

  const handleArchive = async (id: string) => {
    const { error } = await supabase.from("mp_projects").update({ status: "archived" }).eq("id", id);
    if (!error) { toast({ title: "Projet archivé" }); fetchProjects(); }
  };

  const getNiveauLabel = (n: string) => {
    const m: Record<string, string> = { financable: "Finançable", prometteur: "Prometteur", fragile: "Fragile", non_financable: "Non finançable" };
    return m[n] || n;
  };
  const getNiveauColor = (n: string) => {
    const m: Record<string, string> = { financable: "bg-emerald-100 text-emerald-700", prometteur: "bg-blue-100 text-blue-700", fragile: "bg-amber-100 text-amber-700", non_financable: "bg-rose-100 text-rose-700" };
    return m[n] || "bg-gray-100";
  };
  const getCertStatusLabel = (s: string) => {
    const m: Record<string, string> = { pending: "En attente", in_review: "En examen", certified: "Certifié", rejected: "Refusé" };
    return m[s] || s;
  };
  const getCertStatusColor = (s: string) => {
    const m: Record<string, string> = { pending: "bg-amber-100 text-amber-700", in_review: "bg-blue-100 text-blue-700", certified: "bg-emerald-100 text-emerald-700", rejected: "bg-rose-100 text-rose-700" };
    return m[s] || "bg-gray-100";
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Mes projets</h2>
        <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm"><Plus className="h-4 w-4 mr-1" /> Nouveau</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
              <DialogDescription>Remplissez les informations de votre projet</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom du projet / activité *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Boutique de tissus Abidjan" /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Type</Label><Select value={form.activity_type} onValueChange={(v) => setForm({ ...form, activity_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="micro_activity">Micro-activité</SelectItem><SelectItem value="pme">PME</SelectItem><SelectItem value="startup">Startup</SelectItem><SelectItem value="cooperative">Coopérative</SelectItem></SelectContent></Select></div>
                <div><Label>Secteur</Label><Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}><SelectTrigger><SelectValue placeholder="Secteur" /></SelectTrigger><SelectContent>{SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ville</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                <div><Label>Statut juridique</Label><Input value={form.legal_status} onChange={(e) => setForm({ ...form, legal_status: e.target.value })} placeholder="SARL, SA, EI..." /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>CA annuel (XOF)</Label><Input type="number" value={form.annual_revenue} onChange={(e) => setForm({ ...form, annual_revenue: +e.target.value })} /></div>
                <div><Label>Charges/mois</Label><Input type="number" value={form.monthly_expenses} onChange={(e) => setForm({ ...form, monthly_expenses: +e.target.value })} /></div>
                <div><Label>Employés</Label><Input type="number" value={form.employees_count} onChange={(e) => setForm({ ...form, employees_count: +e.target.value })} /></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><Label>Comptabilité tenue</Label><Switch checked={form.has_accounting} onCheckedChange={(v) => setForm({ ...form, has_accounting: v })} /></div>
                <div className="flex items-center justify-between"><Label>Compte bancaire</Label><Switch checked={form.has_bank_account} onCheckedChange={(v) => setForm({ ...form, has_bank_account: v })} /></div>
                <div className="flex items-center justify-between"><Label>Business plan</Label><Switch checked={form.has_business_plan} onCheckedChange={(v) => setForm({ ...form, has_business_plan: v })} /></div>
              </div>
              <Button onClick={handleSubmit} disabled={saving || !form.title} className="w-full bg-emerald-600 hover:bg-emerald-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Modifier" : "Créer le projet"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* View Project Detail Dialog */}
      <Dialog open={!!viewProject} onOpenChange={(o) => { if (!o) setViewProject(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewProject?.title}</DialogTitle>
            <DialogDescription>Détails du projet</DialogDescription>
          </DialogHeader>
          {viewProject && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium text-sm">{viewProject.activity_type === "micro_activity" ? "Micro-activité" : viewProject.activity_type}</p></div>
                <div><p className="text-xs text-muted-foreground">Secteur</p><p className="font-medium text-sm">{viewProject.sector || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Ville</p><p className="font-medium text-sm">{viewProject.city || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Statut juridique</p><p className="font-medium text-sm">{viewProject.legal_status || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">CA annuel</p><p className="font-medium text-sm">{viewProject.annual_revenue?.toLocaleString("fr-FR")} XOF</p></div>
                <div><p className="text-xs text-muted-foreground">Charges/mois</p><p className="font-medium text-sm">{viewProject.monthly_expenses?.toLocaleString("fr-FR")} XOF</p></div>
                <div><p className="text-xs text-muted-foreground">Employés</p><p className="font-medium text-sm">{viewProject.employees_count}</p></div>
                <div><p className="text-xs text-muted-foreground">Statut</p><Badge variant="outline">{viewProject.status}</Badge></div>
              </div>
              {viewProject.description && <div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{viewProject.description}</p></div>}
              <div className="flex gap-2 flex-wrap">
                {viewProject.has_accounting && <Badge className="bg-emerald-100 text-emerald-700">Comptabilité ✓</Badge>}
                {viewProject.has_bank_account && <Badge className="bg-blue-100 text-blue-700">Compte bancaire ✓</Badge>}
                {viewProject.has_business_plan && <Badge className="bg-purple-100 text-purple-700">Business plan ✓</Badge>}
              </div>
              {/* Score */}
              {scores[viewProject.id] && (
                <Card className="border-0 bg-muted/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">MIPROJET SCORE</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{scores[viewProject.id].score_global}/100</span>
                      <Badge className={getNiveauColor(scores[viewProject.id].niveau)}>{getNiveauLabel(scores[viewProject.id].niveau)}</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Certification */}
              {certifications[viewProject.id] && (
                <Card className="border-0 bg-muted/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">Certification</span>
                    </div>
                    <Badge className={getCertStatusColor(certifications[viewProject.id].status)}>{getCertStatusLabel(certifications[viewProject.id].status)}</Badge>
                  </CardContent>
                </Card>
              )}
              <p className="text-xs text-muted-foreground">Créé le {new Date(viewProject.created_at).toLocaleDateString("fr-FR")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {projects.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium">Aucun projet</p>
          <p className="text-sm text-gray-400 mt-1">Créez votre premier projet pour démarrer l'évaluation</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <Card key={p.id} className={`border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${p.status === 'archived' ? 'opacity-60' : ''}`} onClick={() => setViewProject(p)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{p.title}</p>
                      {p.status === "archived" && <Badge variant="outline" className="text-xs">Archivé</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{p.activity_type === "micro_activity" ? "Micro-activité" : p.activity_type === "pme" ? "PME" : p.activity_type}</Badge>
                      {p.sector && <Badge variant="secondary" className="text-xs">{p.sector}</Badge>}
                      {p.city && <span className="text-xs text-gray-400">{p.city}</span>}
                    </div>
                    {/* Show score and certification inline */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {scores[p.id] && (
                        <Badge className={getNiveauColor(scores[p.id].niveau)}>
                          Score: {scores[p.id].score_global}/100 — {getNiveauLabel(scores[p.id].niveau)}
                        </Badge>
                      )}
                      {certifications[p.id] && (
                        <Badge className={getCertStatusColor(certifications[p.id].status)}>
                          Cert: {getCertStatusLabel(certifications[p.id].status)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewProject(p)}><Eye className="h-4 w-4 mr-2" />Voir détails</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(p)}><Pencil className="h-4 w-4 mr-2" />Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(p.id)}><Archive className="h-4 w-4 mr-2" />Archiver</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(p.id)} className="text-rose-600"><Trash2 className="h-4 w-4 mr-2" />Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MPProjects;
