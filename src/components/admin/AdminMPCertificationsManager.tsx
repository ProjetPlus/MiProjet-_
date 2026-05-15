import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Award, CheckCircle, XCircle, Clock, FileCheck } from "lucide-react";

const statusOptions = [
  { value: "pending", label: "En attente", color: "bg-amber-100 text-amber-700" },
  { value: "in_review", label: "En examen", color: "bg-blue-100 text-blue-700" },
  { value: "certified", label: "Certifié", color: "bg-emerald-100 text-emerald-700" },
  { value: "rejected", label: "Refusé", color: "bg-rose-100 text-rose-700" },
];

export const AdminMPCertificationsManager = () => {
  const { toast } = useToast();
  const [certifications, setCertifications] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [projectNames, setProjectNames] = useState<Record<string, string>>({});
  const [scoreMap, setScoreMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const { data } = await supabase
      .from("mp_certifications")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setCertifications(data);
      
      // Collect IDs
      const userIds = new Set<string>();
      const projectIds = new Set<string>();
      data.forEach(c => { userIds.add(c.user_id); projectIds.add(c.project_id); });
      
      // Fetch profiles
      if (userIds.size > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", Array.from(userIds));
        const pMap: Record<string, any> = {};
        profs?.forEach(p => { pMap[p.id] = p; });
        setProfiles(pMap);
      }
      
      // Fetch project names
      if (projectIds.size > 0) {
        const { data: projs } = await supabase.from("mp_projects").select("id, title").in("id", Array.from(projectIds));
        const nMap: Record<string, string> = {};
        projs?.forEach(p => { nMap[p.id] = p.title; });
        setProjectNames(nMap);
      }
      
      // Fetch scores for these projects
      if (projectIds.size > 0) {
        const { data: scrs } = await supabase.from("mp_scoring_results").select("project_id, score_global, niveau").eq("is_active", true).in("project_id", Array.from(projectIds));
        const sMap: Record<string, any> = {};
        scrs?.forEach(s => { sMap[s.project_id] = s; });
        setScoreMap(sMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (id: string, status: string, userId: string) => {
    const updates: any = { status, admin_notes: notes[id] || null };
    if (status === "certified") updates.certified_at = new Date().toISOString();

    const { error } = await supabase.from("mp_certifications").update(updates).eq("id", id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }

    await supabase.from("notifications").insert({
      user_id: userId,
      title: status === "certified" ? "🎉 Certification approuvée" : status === "rejected" ? "❌ Certification refusée" : "📋 Certification en cours d'examen",
      message: status === "certified" ? "Félicitations ! Votre projet a été certifié MiProjet+." : status === "rejected" ? "Votre demande de certification a été refusée." : "Votre demande est en cours d'examen.",
      type: "certification",
      link: "/miprojet-plus/app",
    });

    toast({ title: "Statut mis à jour" });
    fetchData();
  };

  const getProfileName = (userId: string) => {
    const p = profiles[userId];
    if (!p) return "—";
    const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
    return name || p.email || "—";
  };

  const stats = {
    total: certifications.length,
    pending: certifications.filter(c => c.status === "pending").length,
    certified: certifications.filter(c => c.status === "certified").length,
    rejected: certifications.filter(c => c.status === "rejected").length,
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion Certifications MiProjet+</h1>
        <p className="text-muted-foreground text-sm">Examinez et approuvez les demandes de certification</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Award, color: "text-primary" },
          { label: "En attente", value: stats.pending, icon: Clock, color: "text-amber-600" },
          { label: "Certifiés", value: stats.certified, icon: CheckCircle, color: "text-emerald-600" },
          { label: "Refusés", value: stats.rejected, icon: XCircle, color: "text-rose-600" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className={`h-5 w-5 ${s.color}`} />
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projet</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Notes admin</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certifications.map(c => {
                  const st = statusOptions.find(s => s.value === c.status);
                  const scoring = scoreMap[c.project_id];
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{projectNames[c.project_id] || "—"}</TableCell>
                      <TableCell className="text-sm">{getProfileName(c.user_id)}</TableCell>
                      <TableCell>
                        {scoring ? <span className="font-bold">{scoring.score_global}/100</span> : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{new Date(c.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell><Badge className={st?.color}>{st?.label}</Badge></TableCell>
                      <TableCell>
                        <Textarea
                          className="min-w-[150px] text-xs"
                          rows={1}
                          placeholder="Notes..."
                          value={notes[c.id] ?? c.admin_notes ?? ""}
                          onChange={e => setNotes(prev => ({ ...prev, [c.id]: e.target.value }))}
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={c.status} onValueChange={v => handleStatusChange(c.id, v, c.user_id)}>
                          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{statusOptions.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {certifications.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune demande de certification</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
