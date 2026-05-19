import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw, MailCheck, MailX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface LogRow {
  id: string;
  recipient_email: string;
  subject: string;
  status: string;
  provider: string | null;
  error: string | null;
  created_at: string;
  kind: string | null;
}

export const AdminInvoiceSendLog = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("email_logs" as any)
      .select("*")
      .or("kind.eq.invoice,subject.ilike.%Facture%")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2"><MailCheck className="h-5 w-5" /> Suivi des envois de factures</CardTitle>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Destinataire</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Erreur</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun envoi enregistré</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                <TableCell className="font-mono text-xs">{r.recipient_email}</TableCell>
                <TableCell className="max-w-[280px] truncate">{r.subject}</TableCell>
                <TableCell>
                  {r.status === "sent"
                    ? <Badge className="bg-success text-success-foreground"><MailCheck className="h-3 w-3 mr-1" />Envoyé</Badge>
                    : <Badge variant="destructive"><MailX className="h-3 w-3 mr-1" />Échec</Badge>}
                </TableCell>
                <TableCell className="text-xs uppercase">{r.provider || "—"}</TableCell>
                <TableCell className="text-xs text-destructive max-w-[260px] truncate">{r.error || ""}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
