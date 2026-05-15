import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Send, Loader2, Mail, Users, FileText, History, Eye, LayoutTemplate } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { WYSIWYGEditor } from "./WYSIWYGEditor";
import { EmailTemplateManager } from "./EmailTemplateManager";

const SEGMENTS = [
  { value: "newsletter", label: "📰 Abonnés Newsletter" },
  { value: "premium", label: "⭐ Abonnés Premium" },
  { value: "elite", label: "👑 Abonnés Elite" },
  { value: "premium_elite", label: "⭐👑 Premium + Elite" },
  { value: "all_users", label: "🌍 Tous les utilisateurs" },
  { value: "admins", label: "🛡️ Administrateurs" },
];

export const AdminEmailMarketing = () => {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [title, setTitle] = useState("");
  const [innerHtml, setInnerHtml] = useState("");
  const [html, setHtml] = useState("");
  const [segment, setSegment] = useState("newsletter");
  const [ctaUrl, setCtaUrl] = useState("https://ivoireprojet.com");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [stats, setStats] = useState({ subs: 0, sent: 0, failed: 0 });

  const loadData = async () => {
    const [c, l, s] = await Promise.all([
      supabase.from("email_campaigns").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("email_logs").select("*").order("sent_at", { ascending: false }).limit(100),
      supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    setCampaigns(c.data ?? []);
    setLogs(l.data ?? []);
    setSubs(s.data ?? []);
    const sentCount = (l.data ?? []).filter((x: any) => x.status === "sent").length;
    const failCount = (l.data ?? []).filter((x: any) => x.status === "failed").length;
    setStats({ subs: (s.data ?? []).filter((x: any) => x.is_active).length, sent: sentCount, failed: failCount });
  };

  useEffect(() => { loadData(); }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt requis", description: "Saisissez un mot, une phrase ou un brief.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-email", {
        body: { prompt, ctaUrl },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Génération échouée");
      setSubject(data.subject || "");
      setPreheader(data.preheader || "");
      setTitle(data.title || "");
      setInnerHtml(data.innerHtml || "");
      setHtml(data.html || "");
      toast({ title: "✨ Email généré", description: "Vérifiez puis envoyez la campagne." });
    } catch (e: any) {
      toast({ title: "Erreur IA", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !html) {
      toast({ title: "Champs manquants", description: "Sujet et contenu HTML requis.", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-campaign", {
        body: { subject, html, segment, preheader },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Envoi échoué");
      toast({
        title: "🚀 Campagne envoyée",
        description: `${data.sent} envoyés · ${data.failed} échoués sur ${data.total}`,
      });
      setSubject(""); setHtml(""); setPreheader(""); setPrompt("");
      setConfirmOpen(false);
      loadData();
    } catch (e: any) {
      toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Mail className="h-7 w-7 text-primary" /> Email Marketing</h1>
        <p className="text-muted-foreground">Composez, générez avec l'IA et envoyez vos campagnes MIPROJET via Resend.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-2xl font-bold">{stats.subs}</p><p className="text-xs text-muted-foreground">Abonnés newsletter actifs</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Send className="h-8 w-8 text-success" /><div><p className="text-2xl font-bold">{stats.sent}</p><p className="text-xs text-muted-foreground">Emails envoyés (récents)</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><History className="h-8 w-8 text-destructive" /><div><p className="text-2xl font-bold">{stats.failed}</p><p className="text-xs text-muted-foreground">Échecs (récents)</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="composer">
        <TabsList>
          <TabsTrigger value="composer"><Sparkles className="h-4 w-4 mr-1" />Composeur IA</TabsTrigger>
          <TabsTrigger value="campaigns"><Mail className="h-4 w-4 mr-1" />Campagnes</TabsTrigger>
          <TabsTrigger value="subscribers"><Users className="h-4 w-4 mr-1" />Abonnés</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-4 w-4 mr-1" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="composer" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Générateur IA</CardTitle>
              <CardDescription>Saisissez un mot, une phrase ou un prompt — l'IA rédigera la campagne.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder={`Ex: "Annonce nouvel appel à projets agriculture en Côte d'Ivoire" ou simplement "newsletter mensuelle"`}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
              />
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>URL du bouton (CTA)</Label>
                  <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://ivoireprojet.com/..." />
                </div>
                <div>
                  <Label>Segment de destination</Label>
                  <Select value={segment} onValueChange={setSegment}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SEGMENTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerate} disabled={generating} className="w-full">
                {generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Génération...</> : <><Sparkles className="h-4 w-4 mr-2" />Générer la campagne</>}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Aperçu / Édition</CardTitle>
              <CardDescription>Modifiez avant l'envoi. Le HTML est déjà branded MIPROJET.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Sujet</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Sujet de l'email" />
              </div>
              <div>
                <Label>Preheader (texte d'aperçu)</Label>
                <Input value={preheader} onChange={(e) => setPreheader(e.target.value)} />
              </div>
              <div>
                <Label>HTML</Label>
                <Textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} className="font-mono text-xs" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!html}>
                  <Eye className="h-4 w-4 mr-2" />Aperçu
                </Button>
                <Button onClick={() => setConfirmOpen(true)} disabled={!subject || !html}>
                  <Send className="h-4 w-4 mr-2" />Envoyer la campagne
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0"><tr>
                    <th className="text-left p-3">Sujet</th><th className="text-left p-3">Segment</th>
                    <th className="text-left p-3">Statut</th><th className="text-right p-3">Envoyés</th>
                    <th className="text-right p-3">Échecs</th><th className="text-left p-3">Date</th>
                  </tr></thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-t">
                        <td className="p-3">{c.subject}</td>
                        <td className="p-3"><Badge variant="outline">{c.segment}</Badge></td>
                        <td className="p-3"><Badge>{c.status}</Badge></td>
                        <td className="p-3 text-right">{c.sent_count ?? 0}</td>
                        <td className="p-3 text-right">{c.failed_count ?? 0}</td>
                        <td className="p-3 text-muted-foreground">{new Date(c.created_at).toLocaleString("fr-FR")}</td>
                      </tr>
                    ))}
                    {campaigns.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Aucune campagne pour le moment.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0"><tr>
                    <th className="text-left p-3">Email</th><th className="text-left p-3">Source</th>
                    <th className="text-left p-3">Actif</th><th className="text-left p-3">Inscrit le</th>
                  </tr></thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-3">{s.email}</td>
                        <td className="p-3"><Badge variant="outline">{s.source ?? "—"}</Badge></td>
                        <td className="p-3">{s.is_active ? "✅" : "❌"}</td>
                        <td className="p-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("fr-FR")}</td>
                      </tr>
                    ))}
                    {subs.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Aucun abonné.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="pt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0"><tr>
                    <th className="text-left p-3">Date</th><th className="text-left p-3">Destinataire</th>
                    <th className="text-left p-3">Type</th><th className="text-left p-3">Sujet</th>
                    <th className="text-left p-3">Statut</th>
                  </tr></thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="p-3 text-muted-foreground">{l.sent_at ? new Date(l.sent_at).toLocaleString("fr-FR") : "—"}</td>
                        <td className="p-3">{l.recipient_email}</td>
                        <td className="p-3"><Badge variant="outline">{l.kind}</Badge></td>
                        <td className="p-3 truncate max-w-xs">{l.subject ?? "—"}</td>
                        <td className="p-3"><Badge variant={l.status === "sent" ? "default" : "destructive"}>{l.status}</Badge></td>
                      </tr>
                    ))}
                    {logs.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Aucun email envoyé pour le moment.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader><DialogTitle>Aperçu de la campagne</DialogTitle></DialogHeader>
          <iframe srcDoc={html} className="w-full min-h-[600px] border rounded" title="email preview" />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'envoi</DialogTitle>
            <DialogDescription>
              La campagne <strong>"{subject}"</strong> sera envoyée au segment <strong>{SEGMENTS.find(s => s.value === segment)?.label}</strong>. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Annuler</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi...</> : <><Send className="h-4 w-4 mr-2" />Confirmer & Envoyer</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};