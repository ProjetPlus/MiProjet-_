import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, XCircle, CreditCard, Search, Mail, Phone, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

export const AdminPaymentsJournal = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_admin_payments");
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      setRows([]);
    } else {
      setRows((data || []) as PaymentRow[]);
    }
    setLoading(false);
  };

  const fmt = (a: number, c: string) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: c || "XOF", minimumFractionDigits: 0 }).format(a);

  const statusBadge = (s: string) => {
    switch (s) {
      case "completed":
      case "success":
        return <Badge className="bg-success text-success-foreground"><CheckCircle className="h-3 w-3 mr-1" />Réussi</Badge>;
      case "pending":
        return <Badge className="bg-warning text-warning-foreground"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
      case "failed":
      case "error":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Échoué</Badge>;
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  const filtered = rows.filter(r => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      r.email?.toLowerCase().includes(q) ||
      `${r.first_name || ""} ${r.last_name || ""}`.toLowerCase().includes(q) ||
      r.payment_reference?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const totalSuccess = rows.filter(r => r.status === "completed" || r.status === "success")
    .reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" /> Journal des paiements
        </h1>
        <p className="text-muted-foreground">Historique complet des transactions liées aux utilisateurs</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total réussis</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-success">{fmt(totalSuccess, "XOF")}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{rows.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">En attente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-warning">{rows.filter(r => r.status === "pending").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Échoués</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-destructive">{rows.filter(r => r.status === "failed").length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher utilisateur, email, référence..." className="pl-10"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                <SelectItem value="completed">Réussis</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoués</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">Aucun paiement</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.first_name || ""} {r.last_name || ""}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.email && <div>{r.email}</div>}
                      {r.phone && <div>{r.phone}</div>}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{fmt(Number(r.amount), r.currency)}</TableCell>
                    <TableCell><Badge variant="outline">{r.payment_method || "-"}</Badge></TableCell>
                    <TableCell className="font-mono text-xs">{r.payment_reference || "-"}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-xs">{format(new Date(r.created_at), "dd MMM yyyy HH:mm", { locale: fr })}</TableCell>
                    <TableCell className="text-right">
                      {r.email && (
                        <Button variant="ghost" size="icon" asChild>
                          <a href={`mailto:${r.email}`}><Mail className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
