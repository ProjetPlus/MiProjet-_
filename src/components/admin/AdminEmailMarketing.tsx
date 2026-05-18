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
import { Sparkles, Send, Loader2, Mail, Users, FileText, History, Eye, LayoutTemplate, MailPlus } from "lucide-react";
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
  const [ctaLabel, setCtaLabel] = useState("Découvrir");
  const [templateHtmlMode, setTemplateHtmlMode] = useState(false);
  const [segment, setSegment] = useState("newsletter");
  const [ctaUrl, setCtaUrl] = useState("https://ivoireprojet.com");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [stats, setStats] = useState({ subs: 0, sent: 0, failed: 0 });
  const [welcomingBatch, setWelcomingBatch] = useState(false);
  const [withImages, setWithImages] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null);
  const pendingWelcome = subs.filter((s) => s.is_active && !s.welcomed_at).length;

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Image trop volumineuse", description: "Max 20 Mo", variant: "destructive" });
      return;
    }
    const fileName = `email-hero/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const { error } = await supabase.storage.from('news-media').upload(fileName, file);
    if (error) { toast({ title: "Erreur upload", description: error.message, variant: "destructive" }); return; }
    const { data: pub } = supabase.storage.from('news-media').getPublicUrl(fileName);
    setHeroImageUrl(pub.publicUrl);
    toast({ title: "Image remplacée" });
  };

  const handleSendWelcomeBatch = async () => {
    if (!confirm(`Envoyer le mail de bienvenue à ${pendingWelcome} abonné(s) n'ayant jamais reçu de mail de bienvenue ?`)) return;
    setWelcomingBatch(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-welcome-batch", { body: { limit: 500, onlyActive: true } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Envoi échoué");
      toast({ title: "✅ Welcome envoyés", description: `${data.sent} envoyés · ${data.failed} échoués sur ${data.total}` });
      loadData();
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setWelcomingBatch(false);
    }
  };

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

  const cleanEmailBody = (value: string) => String(value || "")
    .replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "")
    .replace(/^\s*<p[^>]*>\s*(?:Bonjour|Bonsoir|Cher\(e\)?|Cher|Chère|Chers|Hello|Salut|Coucou)[^<]*<\/p>/i, "")
    .replace(/^\s*(?:Bonjour|Bonsoir|Hello|Salut)[^.\n]{0,80}[.,]?\s*/i, "")
    .trim();

  const buildCampaignHtml = (emailTitle: string, body: string) => {
    const bodyHtml = cleanEmailBody(body) || "<p></p>";
    const safeTitle = emailTitle.replace(/[&<>'"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[m] || m));
    const LOGO = "https://miprojet.lovable.app/logo-miprojet.png";
    const heroImg = heroImageUrl
      ? `<img src="${heroImageUrl}" alt="" style="width:100%;max-width:528px;height:auto;border-radius:12px;display:block;margin:0 auto 24px;"/>`
      : "";
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>MIPROJET</title></head><body style="margin:0;padding:0;background:#eef2f6;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;"><span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;visibility:hidden;">${preheader}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2f6;padding:32px 12px;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,.08);"><tr><td align="center" style="background:linear-gradient(135deg,#0c2340 0%,#1e3a5f 60%,#15803d 100%);padding:34px 24px 26px;"><img src="${LOGO}" alt="MIPROJET" width="160" style="display:block;max-width:160px;height:auto;background:#ffffff;border-radius:14px;padding:10px 14px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,.15);"/><p style="margin:14px 0 0;color:#a7d2ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Entrepreneuriat jeune · Panafricain</p></td></tr><tr><td style="padding:36px 36px 12px;font-size:15px;line-height:1.7;color:#1e293b;">${heroImg}<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#0c2340;font-weight:800;">${safeTitle}</h1><p style="margin:0 0 18px;font-size:16px;color:#0f172a;font-weight:600;">Bonjour,</p>${bodyHtml}${ctaUrl && ctaLabel ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto;"><tr><td style="background:#15803d;border-radius:12px;"><a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-weight:700;text-decoration:none;font-size:15px;">${ctaLabel}</a></td></tr></table>` : ""}</td></tr><tr><td style="padding:0 36px;"><hr style="border:0;border-top:1px solid #e2e8f0;margin:0;"/></td></tr><tr><td style="padding:24px 36px 32px;color:#64748b;font-size:12px;line-height:1.7;text-align:center;"><p style="margin:0 0 10px;"><a href="https://ivoireprojet.com" style="color:#15803d;text-decoration:none;font-weight:600;">ivoireprojet.com</a> · <a href="https://ivoireprojet.com/unsubscribe" style="color:#94a3b8;text-decoration:underline;">Se désabonner</a></p><p style="margin:0;">© ${new Date().getFullYear()} MIPROJET</p></td></tr></table></td></tr></table></body></html>`;
  };

  useEffect(() => {
    if (!templateHtmlMode) setHtml(buildCampaignHtml(title || subject || "MIPROJET", innerHtml));
  }, [subject, preheader, title, innerHtml, ctaUrl, ctaLabel, templateHtmlMode, heroImageUrl]);
    return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>MIPROJET</title></head><body style="margin:0;padding:0;background:#eef2f6;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;"><span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;visibility:hidden;">${preheader}</span><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef2f6;padding:32px 12px;"><tr><td align="center"><table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 8px 32px rgba(15,23,42,.08);"><tr><td align="center" style="background:linear-gradient(135deg,#0c2340 0%,#1e3a5f 60%,#15803d 100%);padding:34px 24px 26px;"><img src="${LOGO}" alt="MIPROJET" width="160" style="display:block;max-width:160px;height:auto;background:#ffffff;border-radius:14px;padding:10px 14px;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,.15);"/><p style="margin:14px 0 0;color:#a7d2ff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Entrepreneuriat jeune · Panafricain</p></td></tr><tr><td style="padding:36px 36px 12px;font-size:15px;line-height:1.7;color:#1e293b;"><h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;color:#0c2340;font-weight:800;">${safeTitle}</h1><p style="margin:0 0 18px;font-size:16px;color:#0f172a;font-weight:600;">Bonjour,</p>${bodyHtml}${ctaUrl && ctaLabel ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:32px auto;"><tr><td style="background:#15803d;border-radius:12px;"><a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;font-weight:700;text-decoration:none;font-size:15px;">${ctaLabel}</a></td></tr></table>` : ""}</td></tr><tr><td style="padding:0 36px;"><hr style="border:0;border-top:1px solid #e2e8f0;margin:0;"/></td></tr><tr><td style="padding:24px 36px 32px;color:#64748b;font-size:12px;line-height:1.7;text-align:center;"><p style="margin:0 0 10px;"><a href="https://ivoireprojet.com" style="color:#15803d;text-decoration:none;font-weight:600;">ivoireprojet.com</a> · <a href="https://ivoireprojet.com/unsubscribe" style="color:#94a3b8;text-decoration:underline;">Se désabonner</a></p><p style="margin:0;">© ${new Date().getFullYear()} MIPROJET</p></td></tr></table></td></tr></table></body></html>`;
  };

  useEffect(() => {
    if (!templateHtmlMode) setHtml(buildCampaignHtml(title || subject || "MIPROJET", innerHtml));
  }, [subject, preheader, title, innerHtml, ctaUrl, ctaLabel, templateHtmlMode]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt requis", description: "Saisissez un mot, une phrase ou un brief.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-generate-email", {
        body: { prompt, ctaUrl, withImages, imagePrompt },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Génération échouée");
      setSubject(data.subject || "");
      setPreheader(data.preheader || "");
      setTitle(data.title || "");
      setInnerHtml(data.innerHtml || "");
      setCtaLabel(data.ctaLabel || "Découvrir");
      setHeroImageUrl(data.heroImageUrl || null);
      setTemplateHtmlMode(false);
      setHtml(data.html || "");
      toast({ title: "✨ Email généré", description: data.heroImageUrl ? "Avec image illustrative." : "Vérifiez puis envoyez." });
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
      setSubject(""); setTitle(""); setInnerHtml(""); setHtml(""); setPreheader(""); setPrompt(""); setTemplateHtmlMode(false);
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

      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg border bg-muted/40">
        <MailPlus className="h-5 w-5 text-primary" />
        <div className="flex-1 min-w-[200px]">
          <p className="font-semibold text-sm">Mails de bienvenue manquants</p>
          <p className="text-xs text-muted-foreground">{pendingWelcome} abonné(s) actif(s) n'ont jamais reçu le mail de bienvenue.</p>
        </div>
        <Button onClick={handleSendWelcomeBatch} disabled={welcomingBatch || pendingWelcome === 0}>
          {welcomingBatch ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi…</> : <><MailPlus className="h-4 w-4 mr-2" />Envoyer le welcome ({pendingWelcome})</>}
        </Button>
      </div>

      <Tabs defaultValue="composer">
        <TabsList>
          <TabsTrigger value="composer"><Sparkles className="h-4 w-4 mr-1" />Composeur IA</TabsTrigger>
          <TabsTrigger value="templates"><LayoutTemplate className="h-4 w-4 mr-1" />Templates</TabsTrigger>
          <TabsTrigger value="campaigns"><Mail className="h-4 w-4 mr-1" />Campagnes</TabsTrigger>
          <TabsTrigger value="subscribers"><Users className="h-4 w-4 mr-1" />Abonnés</TabsTrigger>
          <TabsTrigger value="logs"><History className="h-4 w-4 mr-1" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="pt-4">
          <EmailTemplateManager onUseTemplate={(template) => {
            setSubject(template.subject);
            setTitle(template.subject.replace(/^[✅🎉🚀🔐⏰\s]+/, "").slice(0, 60));
            setInnerHtml(template.html);
            setHtml(template.html);
            setTemplateHtmlMode(true);
          }} />
        </TabsContent>

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
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} className="h-4 w-4" />
                  <span className="text-sm font-medium">🎨 Générer avec une image illustrative (IA)</span>
                </label>
                {withImages && (
                  <Input
                    placeholder="Description de l'image (optionnel, ex: 'jeunes entrepreneurs africains en réunion')"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                  />
                )}
                {heroImageUrl && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <img src={heroImageUrl} alt="hero" className="h-16 w-24 object-cover rounded" />
                    <div className="flex gap-2">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />
                        <span className="inline-flex items-center px-3 py-1.5 text-xs border rounded hover:bg-muted">Remplacer</span>
                      </label>
                      <button type="button" onClick={() => setHeroImageUrl(null)} className="px-3 py-1.5 text-xs border rounded hover:bg-muted">Retirer</button>
                    </div>
                  </div>
                )}
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
                <Label>Libellé du bouton</Label>
                <Input value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} placeholder="Découvrir" />
              </div>
              <div>
                <Label>Titre principal (H1) — affiché en haut</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre de l'email" />
                <p className="text-xs text-muted-foreground mt-1">Ordre : Sujet → Titre → "Bonjour {`{prénom}`}," (auto) → Corps</p>
              </div>
              <div>
                <Label>Corps du message</Label>
                <WYSIWYGEditor
                  value={innerHtml}
                  onChange={setInnerHtml}
                  placeholder="Rédigez votre message — ne mettez pas 'Bonjour' ni de titre, ils sont ajoutés automatiquement."
                  minHeight="260px"
                />
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