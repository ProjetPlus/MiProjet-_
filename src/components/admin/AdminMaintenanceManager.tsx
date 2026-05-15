import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Power, History } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  action: string;
  enabled: boolean;
  reason: string | null;
  source: string | null;
  triggered_by_email: string | null;
  created_at: string;
}

export const AdminMaintenanceManager = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingState, setPendingState] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: settings }, { data: logData }] = await Promise.all([
      supabase.from("platform_settings").select("key,value").eq("key", "maintenance_mode").maybeSingle(),
      supabase.from("maintenance_log").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setEnabled(settings?.value === "true");
    setLogs((logData || []) as any);
    setLoading(false);
  };

  const requestToggle = (next: boolean) => {
    setPendingState(next);
    setReason("");
  };

  const confirmToggle = async () => {
    if (pendingState === null) return;
    if (!reason.trim()) {
      toast({ title: "Raison obligatoire", description: "Veuillez indiquer la raison.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Upsert platform setting
      const { data: existing } = await supabase
        .from("platform_settings")
        .select("id")
        .eq("key", "maintenance_mode")
        .maybeSingle();
      if (existing) {
        await supabase.from("platform_settings").update({ value: pendingState ? "true" : "false" }).eq("id", existing.id);
      } else {
        await supabase.from("platform_settings").insert({ key: "maintenance_mode", value: pendingState ? "true" : "false", category: "system" });
      }

      // Log entry
      await supabase.from("maintenance_log").insert({
        action: pendingState ? "enable" : "disable",
        enabled: pendingState,
        reason: reason.trim(),
        source: "manual",
        triggered_by: user?.id ?? null,
        triggered_by_email: user?.email ?? null,
      });

      toast({ title: pendingState ? "Maintenance activée" : "Maintenance désactivée" });
      setPendingState(null);
      setReason("");
      await load();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Power className="h-7 w-7" /> Maintenance
        </h1>
        <p className="text-muted-foreground text-sm">Activation manuelle uniquement, avec raison obligatoire et journalisation.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                {enabled ? <AlertTriangle className="h-5 w-5 text-destructive" /> : <Power className="h-5 w-5 text-success" />}
                Mode maintenance : {enabled ? "ACTIF" : "Inactif"}
              </CardTitle>
              <CardDescription>
                Quand actif, un bandeau rouge s'affiche sur tout le site.
              </CardDescription>
            </div>
            <Switch checked={enabled} onCheckedChange={requestToggle} disabled={loading} />
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Journal d'activation</CardTitle>
          <CardDescription>Historique des activations / désactivations manuelles.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Déclencheur</TableHead>
                    <TableHead>Raison</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune entrée</TableCell></TableRow>
                  ) : logs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{format(new Date(l.created_at), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant={l.enabled ? "destructive" : "secondary"}>
                          {l.enabled ? "Activée" : "Désactivée"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="outline">{l.source || "manual"}</Badge></TableCell>
                      <TableCell className="text-sm">{l.triggered_by_email || "—"}</TableCell>
                      <TableCell className="text-sm max-w-md truncate">{l.reason || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={pendingState !== null} onOpenChange={(o) => !o && setPendingState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingState ? "Activer le mode maintenance ?" : "Désactiver le mode maintenance ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingState
                ? "Un bandeau rouge sera affiché sur tout le site jusqu'à désactivation manuelle."
                : "Le bandeau d'avertissement sera retiré du site."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reason">Raison <span className="text-destructive">*</span></Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Mise à jour des modules de paiement"
              required
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); confirmToggle(); }} disabled={saving || !reason.trim()}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};