import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Award, Loader2, FileCheck, Clock, CheckCircle, XCircle, Trash2, Eye } from "lucide-react";

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "En attente", icon: Clock, color: "text-amber-600" },
  in_review: { label: "En cours d'examen", icon: FileCheck, color: "text-blue-600" },
  certified: { label: "Certifié", icon: CheckCircle, color: "text-emerald-600" },
  rejected: { label: "Refusé", icon: XCircle, color: "text-rose-600" },
};

const MPCertification = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [projects, setProjects] = useState<{ id: string; title: string }[]>([]);
  const [scores, setScores] = useState<Record<string, any>>({});
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [viewCert, setViewCert] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [projRes, certRes] = await Promise.all([
        supabase.from("mp_projects").select("id, title").eq("user_id", user.id),
        supabase.from("mp_certifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (projRes.data) setProjects(projRes.data);
      if (certRes.data) setCertifications(certRes.data);

      if (projRes.data) {
        const scoreMap: Record<string, any> = {};
        for (const p of projRes.data) {
          const { data } = await supabase.from("mp_scoring_results").select("score_global, niveau").eq("project_id", p.id).eq("is_active", true).limit(1).maybeSingle();
          if (data) scoreMap[p.id] = data;
        }
        setScores(scoreMap);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleRequest = async () => {
    if (!user || !selectedProject) return;
    const score = scores[selectedProject];
    if (!score) { toast({ title: "Score requis", description: "Effectuez d'abord une évaluation MIPROJET SCORE", variant: "destructive" }); return; }
    if (score.score_global < 60) { toast({ title: "Score insuffisant", description: "Un score minimum de 60/100 est requis pour la certification", variant: "destructive" }); return; }

    // Check for existing pending/in_review certification
    const existing = certifications.find(c => c.project_id === selectedProject && (c.status === "pending" || c.status === "in_review"));
    if (existing) { toast({ title: "Demande existante", description: "Une demande de certification est déjà en cours pour ce projet", variant: "destructive" }); return; }

    setRequesting(true);
    const { error } = await supabase.from("mp_certifications").insert({ user_id: user.id, project_id: selectedProject, certification_type: "standard", status: "pending" });
    setRequesting(false);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Demande envoyée", description: "Votre demande de certification sera examinée sous 48h" });
    const { data } = await supabase.from("mp_certifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setCertifications(data);
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("Supprimer cette demande de certification ?")) return;
    const { error } = await supabase.from("mp_certifications").delete().eq("id", id);
    if (!error) {
      toast({ title: "Demande supprimée" });
      setCertifications(prev => prev.filter(c => c.id !== id));
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Certification</h2>

      <Card className="border-0 shadow-sm bg-emerald-50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Award className="h-8 w-8 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Certification MIPROJET<span className="text-emerald-600">+</span></p>
              <p className="text-sm text-emerald-700 mt-1">La certification atteste que votre projet est structuré et finançable. Elle est reconnue par les partenaires financiers de notre réseau. Score minimum requis : 60/100.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-base">Demander une certification</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-sm">Projet</Label><Select value={selectedProject} onValueChange={setSelectedProject}><SelectTrigger><SelectValue placeholder="Sélectionnez un projet" /></SelectTrigger><SelectContent>{projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent></Select></div>
          {selectedProject && scores[selectedProject] ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Score actuel :</span>
              <span className={`font-bold ${scores[selectedProject].score_global >= 60 ? "text-emerald-600" : "text-rose-600"}`}>{scores[selectedProject].score_global}/100</span>
              {scores[selectedProject].score_global >= 60 ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-rose-600" />}
            </div>
          ) : selectedProject ? (
            <p className="text-sm text-amber-600">⚠️ Aucune évaluation trouvée. Faites d'abord un MIPROJET Score.</p>
          ) : null}
          <Button onClick={handleRequest} disabled={requesting || !selectedProject || !scores[selectedProject] || scores[selectedProject]?.score_global < 60} className="w-full bg-emerald-600 hover:bg-emerald-700">
            {requesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Demander la certification"}
          </Button>
        </CardContent>
      </Card>

      {/* View certification detail */}
      <Dialog open={!!viewCert} onOpenChange={(o) => { if (!o) setViewCert(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-emerald-600" />Détails de la certification</DialogTitle>
            <DialogDescription>Informations sur votre demande</DialogDescription>
          </DialogHeader>
          {viewCert && (
            <div className="space-y-4">
              <div><p className="text-xs text-muted-foreground">Projet</p><p className="font-medium">{projects.find(p => p.id === viewCert.project_id)?.title || "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{viewCert.certification_type || "Standard"}</p></div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Statut :</p>
                {(() => { const s = statusMap[viewCert.status] || statusMap.pending; const Icon = s.icon; return <><Icon className={`h-4 w-4 ${s.color}`} /><Badge variant="outline" className={s.color}>{s.label}</Badge></>; })()}
              </div>
              <div><p className="text-xs text-muted-foreground">Date de demande</p><p className="text-sm">{new Date(viewCert.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>
              {viewCert.certified_at && <div><p className="text-xs text-muted-foreground">Date de certification</p><p className="text-sm text-emerald-600 font-medium">{new Date(viewCert.certified_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p></div>}
              {viewCert.admin_notes && <div><p className="text-xs text-muted-foreground">Notes de l'équipe</p><p className="text-sm bg-muted/50 p-3 rounded-lg">{viewCert.admin_notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {certifications.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Mes certifications</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {certifications.map((c) => {
                const s = statusMap[c.status] || statusMap.pending;
                const Icon = s.icon;
                const proj = projects.find((p) => p.id === c.project_id);
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setViewCert(c)}>
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{proj?.title || "Projet"}</p>
                        <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Icon className={`h-4 w-4 ${s.color}`} />
                      <Badge variant="outline" className={s.color}>{s.label}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={(e) => { e.stopPropagation(); handleDeleteCert(c.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MPCertification;
