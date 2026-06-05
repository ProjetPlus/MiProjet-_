import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, Users, Mail, Phone, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Interest = {
  id: string;
  tender_id: string;
  nom: string;
  email: string;
  telephone: string | null;
  entreprise: string | null;
  pays: string | null;
  secteur: string | null;
  message: string | null;
  created_at: string;
  tender?: { notice_title: string; country_code: string | null; country_name: string | null; sector: string | null } | null;
};

export const AdminTenderLeadsManager = () => {
  const [items, setItems] = useState<Interest[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from("tender_interests")
      .select("*, tender:tenders(notice_title, country_code, country_name, sector)")
      .order("created_at", { ascending: false })
      .limit(2000);
    setItems((data as Interest[]) || []);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((i) =>
      [i.nom, i.email, i.entreprise, i.pays, i.secteur, i.tender?.notice_title]
        .some((v) => (v || "").toLowerCase().includes(s))
    );
  }, [items, q]);

  const exportCSV = () => {
    const head = ["Date", "Nom", "Email", "Téléphone", "Entreprise", "Pays", "Secteur", "Appel d'offre", "Pays AO", "Message"];
    const rows = filtered.map((i) => [
      format(new Date(i.created_at), "yyyy-MM-dd HH:mm"),
      i.nom, i.email, i.telephone || "", i.entreprise || "", i.pays || "", i.secteur || "",
      i.tender?.notice_title || "", i.tender?.country_name || i.tender?.country_code || "", (i.message || "").replace(/\n/g, " "),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dgmarket-prospects-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Prospects Appels d'offres
          </h1>
          <p className="text-muted-foreground">
            Base prospects à transmettre à dgMarket — toutes les manifestations d'intérêt collectées.
          </p>
        </div>
        <Button onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Exporter CSV ({filtered.length})
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total prospects</p><p className="text-2xl font-bold">{items.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avec téléphone</p><p className="text-2xl font-bold">{items.filter(i => i.telephone).length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avec entreprise</p><p className="text-2xl font-bold">{items.filter(i => i.entreprise).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Manifestations d'intérêt</CardTitle>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Appel d'offre</TableHead>
                <TableHead>Secteur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chargement…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucun prospect pour le moment.</TableCell></TableRow>
              ) : filtered.slice(0, 500).map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {format(new Date(i.created_at), "dd MMM yy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">{i.nom}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{i.email}</p>
                    {i.telephone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{i.telephone}</p>}
                  </TableCell>
                  <TableCell className="text-sm">
                    {i.entreprise ? (<><Building2 className="h-3 w-3 inline mr-1" />{i.entreprise}</>) : "—"}
                    {i.pays && <p className="text-xs text-muted-foreground">{i.pays}</p>}
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <p className="text-sm line-clamp-2">{i.tender?.notice_title || "—"}</p>
                    <p className="text-xs text-muted-foreground">{i.tender?.country_name || i.tender?.country_code}</p>
                  </TableCell>
                  <TableCell>{i.secteur ? <Badge variant="secondary">{i.secteur}</Badge> : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
