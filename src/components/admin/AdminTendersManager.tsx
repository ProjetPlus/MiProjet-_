import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Archive, RotateCcw, Trash2, ExternalLink, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Tender = any;
type Batch = any;

const ISO_COUNTRY: Record<string, string> = {
  KE: "Kenya", TN: "Tunisie", RW: "Rwanda", ZA: "Afrique du Sud", CM: "Cameroun",
  MA: "Maroc", ET: "Éthiopie", MG: "Madagascar", ZW: "Zimbabwe", TZ: "Tanzanie",
  GA: "Gabon", CI: "Côte d'Ivoire", SN: "Sénégal", BJ: "Bénin", BF: "Burkina Faso",
  NG: "Nigéria", GH: "Ghana", ML: "Mali", CD: "RD Congo", CG: "Congo",
};

const detectSector = (t: string) => {
  const tl = t.toLowerCase();
  const map: [string, string[]][] = [
    ["Santé", ["health", "medic", "hospital", "clinic", "nursing", "pharma", "santé"]],
    ["Éducation", ["school", "training", "education", "university", "formation"]],
    ["Énergie", ["power", "energy", "electric", "solar", "hvac", "generator"]],
    ["Construction & BTP", ["construction", "build", "road", "runway", "renovation", "works", "rehabilitation"]],
    ["Agriculture", ["agro", "agric", "farm", "coffee", "livestock", "irrigation"]],
    ["TIC & Numérique", ["software", "website", "digital", "data", "monitoring"]],
    ["Transport", ["transport", "vehicle", "logistic", "fleet", "shipping"]],
    ["Environnement", ["water", "sanitation", "waste", "environment", "mosquito"]],
    ["Fournitures", ["supply", "procurement", "equipment", "furniture", "blinds"]],
  ];
  for (const [s, kws] of map) if (kws.some((k) => tl.includes(k))) return s;
  return "Autres";
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

const parseCSV = (text: string) => {
  const lines: string[][] = [];
  let cur: string[] = [];
  let val = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { val += '"'; i++; }
      else if (c === '"') inQ = false;
      else val += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { cur.push(val); val = ""; }
      else if (c === "\n") { cur.push(val); lines.push(cur); cur = []; val = ""; }
      else if (c !== "\r") val += c;
    }
  }
  if (val || cur.length) { cur.push(val); lines.push(cur); }
  return lines.filter((r) => r.some((x) => x.trim()));
};

const parseDeadline = (s: string) => {
  // 06/11/2026:00:00:00 -> ISO
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}):(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (!m) return null;
  const [, mm, dd, yyyy, hh, mi, ss] = m;
  return new Date(`${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${hh.padStart(2, "0")}:${mi.padStart(2, "0")}:${ss.padStart(2, "0")}Z`).toISOString();
};

export const AdminTendersManager = () => {
  const [tab, setTab] = useState("import");
  const [active, setActive] = useState<Tender[]>([]);
  const [archived, setArchived] = useState<Tender[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [q, setQ] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<{ inserted: number; skipped: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    const [a, ar, b] = await Promise.all([
      (supabase as any).from("tenders").select("*").eq("status", "active").order("notice_deadline").limit(1000),
      (supabase as any).from("tenders").select("*").eq("status", "archived").order("archived_at", { ascending: false }).limit(500),
      (supabase as any).from("tender_import_batches").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    setActive(a.data || []);
    setArchived(ar.data || []);
    setBatches(b.data || []);
  };
  useEffect(() => { reload(); }, []);

  const handleFile = async (file: File) => {
    if (!file) return;
    setImporting(true);
    setProgress(0);
    setReport(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      const header = rows.shift();
      if (!header) throw new Error("CSV vide");

      const { data: { user } } = await supabase.auth.getUser();
      const { data: batch } = await (supabase as any)
        .from("tender_import_batches")
        .insert({ filename: file.name, total_rows: rows.length, status: "processing", imported_by: user?.id })
        .select()
        .single();

      let inserted = 0, skipped = 0;
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK).map((r) => {
          const [title, deadline, country] = r;
          const dl = parseDeadline((deadline || "").trim());
          if (!title || !dl) return null;
          const iso = (country || "").trim().toUpperCase();
          const cn = ISO_COUNTRY[iso] || iso;
          const sector = detectSector(title);
          return {
            notice_title: title.trim(),
            notice_deadline: dl,
            org_country: iso,
            country_name: cn,
            sector,
            summary: `Appel d'offres publié au ${cn} dans le secteur ${sector}. Objet : ${title.slice(0, 140)}.`,
            slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 8)}`,
            status: "active",
            source_batch_id: batch?.id,
          };
        }).filter(Boolean);

        // Insert with ON CONFLICT DO NOTHING to skip duplicates only,
        // letting every new row pass without blocking the whole batch.
        const { data: ins, error } = await (supabase as any)
          .from("tenders")
          .upsert(slice, { onConflict: "notice_title,notice_deadline", ignoreDuplicates: true })
          .select("id");
        if (error) {
          console.error("[tenders import]", error);
          toast({ title: "Erreur SQL", description: error.message, variant: "destructive" });
        }
        const did = ins?.length || 0;
        inserted += did;
        skipped += slice.length - did;
        setProgress(Math.min(100, Math.round(((i + CHUNK) / rows.length) * 100)));
      }

      await (supabase as any).from("tender_import_batches").update({
        inserted_count: inserted,
        skipped_count: rows.length - inserted,
        status: "done",
      }).eq("id", batch?.id);

      setReport({ inserted, skipped: rows.length - inserted, total: rows.length });
      toast({ title: "Import terminé", description: `${inserted} ajoutés, ${rows.length - inserted} doublons ignorés.` });
      reload();
    } catch (e: any) {
      toast({ title: "Erreur d'import", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const archiveOne = async (id: string) => {
    await (supabase as any).from("tenders").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id);
    reload();
  };
  const restoreOne = async (id: string) => {
    await (supabase as any).from("tenders").update({ status: "active", archived_at: null }).eq("id", id);
    reload();
  };
  const deleteOne = async (id: string) => {
    if (!confirm("Supprimer définitivement cet appel d'offre ?")) return;
    await (supabase as any).from("tenders").delete().eq("id", id);
    reload();
  };

  const filter = (list: Tender[]) =>
    q ? list.filter((t) => t.notice_title.toLowerCase().includes(q.toLowerCase())) : list;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Appels d'offres</h1>
        <p className="text-muted-foreground">Import CSV quotidien, gestion des offres actives et archives.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="import"><Upload className="h-4 w-4 mr-1.5" /> Import CSV</TabsTrigger>
          <TabsTrigger value="active">Actives ({active.length})</TabsTrigger>
          <TabsTrigger value="archived"><Archive className="h-4 w-4 mr-1.5" /> Archives ({archived.length})</TabsTrigger>
          <TabsTrigger value="history">Historique imports</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="pt-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" /> Importer un CSV</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary transition"
              >
                <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold">Glissez-déposez votre fichier .csv ici</p>
                <p className="text-sm text-muted-foreground">ou cliquez pour parcourir — colonnes attendues : notice_title, notice_deadline, org_country</p>
                <input ref={fileRef} type="file" accept=".csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </div>
              {importing && (
                <div>
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground mt-2">Traitement en cours… {progress}%</p>
                </div>
              )}
              {report && (
                <Card className="bg-muted/40">
                  <CardContent className="p-4">
                    <p className="font-semibold mb-1">Rapport d'import</p>
                    <p className="text-sm">✅ {report.inserted} ajoutés · ⏭️ {report.skipped} doublons ignorés · 📦 {report.total} lignes traitées</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="pt-4 space-y-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Titre</TableHead><TableHead>Pays</TableHead><TableHead>Secteur</TableHead><TableHead>Deadline</TableHead><TableHead>Vues</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {filter(active).slice(0, 200).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-md truncate">{t.notice_title}</TableCell>
                      <TableCell>{t.country_name || t.org_country}</TableCell>
                      <TableCell><Badge variant="secondary">{t.sector || "—"}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(t.notice_deadline), "dd MMM yy", { locale: fr })}</TableCell>
                      <TableCell>{t.view_count || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" asChild><a href={`/appels-doffres/${t.slug || t.id}`} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a></Button>
                          <Button size="sm" variant="ghost" onClick={() => archiveOne(t.id)}><Archive className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteOne(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Titre</TableHead><TableHead>Pays</TableHead><TableHead>Archivé le</TableHead><TableHead>Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {archived.slice(0, 200).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="max-w-md truncate">{t.notice_title}</TableCell>
                      <TableCell>{t.country_name || t.org_country}</TableCell>
                      <TableCell className="text-xs">{t.archived_at ? format(new Date(t.archived_at), "dd MMM yy", { locale: fr }) : "—"}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => restoreOne(t.id)}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Restaurer</Button>
                        <Button size="sm" variant="ghost" onClick={() => deleteOne(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Date</TableHead><TableHead>Fichier</TableHead><TableHead>Total</TableHead><TableHead>Ajoutés</TableHead><TableHead>Doublons</TableHead><TableHead>Statut</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="text-xs">{format(new Date(b.created_at), "dd MMM yy HH:mm", { locale: fr })}</TableCell>
                      <TableCell className="truncate max-w-xs">{b.filename}</TableCell>
                      <TableCell>{b.total_rows}</TableCell>
                      <TableCell className="text-emerald-600 font-semibold">{b.inserted_count}</TableCell>
                      <TableCell className="text-muted-foreground">{b.skipped_count}</TableCell>
                      <TableCell><Badge variant={b.status === "done" ? "default" : b.status === "error" ? "destructive" : "secondary"}>{b.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
