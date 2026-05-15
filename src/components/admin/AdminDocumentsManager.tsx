import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileDown, Plus, Trash2, Edit, Loader2, Upload, Sparkles, Eye, Download, FileText
} from "lucide-react";

interface PlatformDocument {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_audience: string | null;
  access_level: string | null;
  requires_login: boolean | null;
  file_url: string | null;
  file_path: string | null;
  file_size: number | null;
  file_type: string | null;
  cover_url: string | null;
  cover_path: string | null;
  associated_form: string | null;
  download_count: number | null;
  is_active: boolean | null;
  created_at: string;
}

const categories = [
  { value: "general", label: "Général" },
  { value: "investment", label: "Investissement" },
  { value: "guide", label: "Guide pratique" },
  { value: "formation", label: "Formation" },
  { value: "rapport", label: "Rapport" },
  { value: "template", label: "Template / Modèle" },
];

const emptyForm = {
  title: "", description: "", category: "general",
  target_audience: "public", access_level: "free",
  requires_login: false, associated_form: "public",
};

export const AdminDocumentsManager = () => {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PlatformDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStep, setAiStep] = useState<'idle' | 'questions' | 'processing'>('idle');
  const [aiAnswers, setAiAnswers] = useState({ audience: '', accessLevel: '', requiresLogin: false });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setDocuments(data as any);
    setLoading(false);
  };

  const handleEdit = (doc: PlatformDocument) => {
    setEditingId(doc.id);
    setForm({
      title: doc.title,
      description: doc.description || "",
      category: doc.category || "general",
      target_audience: doc.target_audience || "public",
      access_level: doc.access_level || "free",
      requires_login: doc.requires_login || false,
      associated_form: doc.associated_form || "public",
    });
    setShowForm(true);
  };

  const uploadFile = async (f: File, folder: string) => {
    const ext = f.name.split('.').pop();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, f);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
    return { url: urlData.publicUrl, path, size: f.size, type: f.type };
  };

  const handleSave = async () => {
    if (!form.title) {
      toast({ title: "Titre requis", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let fileData: any = {};
      if (file) {
        const uploaded = await uploadFile(file, 'platform-docs');
        fileData = { file_url: uploaded.url, file_path: uploaded.path, file_size: uploaded.size, file_type: uploaded.type };
      }
      let coverData: any = {};
      if (coverFile) {
        const uploaded = await uploadFile(coverFile, 'platform-covers');
        coverData = { cover_url: uploaded.url, cover_path: uploaded.path };
      }

      const payload = {
        title: form.title,
        description: form.description || null,
        category: form.category,
        target_audience: form.target_audience,
        access_level: form.access_level,
        requires_login: form.requires_login,
        associated_form: form.target_audience === 'investors' ? 'investor' : 'public',
        ...fileData,
        ...coverData,
      };

      if (editingId) {
        await supabase.from('platform_documents').update(payload as any).eq('id', editingId);
        toast({ title: "Document mis à jour" });
      } else {
        await supabase.from('platform_documents').insert(payload as any);
        toast({ title: "Document ajouté" });
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      setFile(null);
      setCoverFile(null);
      fetchDocuments();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce document ?")) return;
    await supabase.from('platform_documents').delete().eq('id', id);
    toast({ title: "Document supprimé" });
    fetchDocuments();
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('platform_documents').update({ is_active: !current } as any).eq('id', id);
    fetchDocuments();
  };

  // AI Assistant
  const handleAIManage = () => {
    if (!file) {
      toast({ title: "Uploadez d'abord un fichier", variant: "destructive" });
      return;
    }
    setAiStep('questions');
  };

  const handleAIProcess = async () => {
    setAiStep('processing');
    setAiLoading(true);

    // Determine associated form and fill form based on answers
    const audience = aiAnswers.audience;
    const associatedForm = audience === 'investors' ? 'investor' : 'public';

    // Auto-fill based on file name and AI answers
    const fileName = file?.name || '';
    const titleFromFile = fileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());

    setForm(prev => ({
      ...prev,
      title: prev.title || titleFromFile,
      description: prev.description || `Document ${audience === 'investors' ? 'pour investisseurs' : audience === 'project_owners' ? 'pour porteurs de projet' : 'public'} - ${categories.find(c => c.value === prev.category)?.label || prev.category}`,
      target_audience: audience,
      access_level: aiAnswers.accessLevel,
      requires_login: aiAnswers.requiresLogin,
      associated_form: associatedForm,
      category: prev.category || (audience === 'investors' ? 'investment' : 'general'),
    }));

    setAiLoading(false);
    setAiStep('idle');
    toast({ title: "✨ Formulaire rempli par l'IA", description: "Vérifiez et ajustez les champs si nécessaire." });
  };

  const audienceLabel = (v: string | null) => {
    if (v === 'investors') return 'Investisseurs';
    if (v === 'project_owners') return 'Porteurs de projet';
    return 'Public';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents téléchargeables</h1>
          <p className="text-muted-foreground">Gérez les documents mis à disposition sur la plateforme</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setFile(null); setCoverFile(null); setAiStep('idle'); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Ajouter un document
        </Button>
      </div>

      {/* Documents Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucun document</h3>
            <p className="text-muted-foreground">Ajoutez votre premier document téléchargeable.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Accès</TableHead>
                <TableHead>Téléch.</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map(doc => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{doc.title}</TableCell>
                  <TableCell><Badge variant="outline">{doc.category}</Badge></TableCell>
                  <TableCell>{audienceLabel(doc.target_audience)}</TableCell>
                  <TableCell>
                    <Badge className={doc.access_level === 'premium' ? 'bg-accent/10 text-accent' : 'bg-success/10 text-success'}>
                      {doc.access_level === 'premium' ? '👑 Premium' : '🆓 Free'}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.download_count || 0}</TableCell>
                  <TableCell>
                    <Switch checked={doc.is_active ?? true} onCheckedChange={() => handleToggleActive(doc.id, doc.is_active ?? true)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {doc.file_url && (
                        <Button variant="ghost" size="icon" onClick={() => window.open(doc.file_url!, '_blank')}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => { setShowForm(false); setAiStep('idle'); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le document" : "Ajouter un document"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Fichier à uploader *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                  onChange={e => setFile(e.target.files?.[0] || null)} />
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Changer</Button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <Button variant="outline" onClick={() => fileRef.current?.click()}>Choisir un fichier</Button>
                    <p className="text-xs text-muted-foreground mt-2">PDF, Word, Excel, PowerPoint, ZIP</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Button */}
            {file && aiStep === 'idle' && (
              <Button variant="outline" onClick={handleAIManage} className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/5">
                <Sparkles className="h-4 w-4" />
                Gérer avec l'IA
              </Button>
            )}

            {/* AI Questions */}
            {aiStep === 'questions' && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Assistant IA - Questions préalables
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Le document est destiné à :</Label>
                    <Select value={aiAnswers.audience} onValueChange={v => setAiAnswers(p => ({ ...p, audience: v }))}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner l'audience" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investors">Investisseurs</SelectItem>
                        <SelectItem value="project_owners">Porteurs de projet</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau d'accès :</Label>
                    <Select value={aiAnswers.accessLevel} onValueChange={v => setAiAnswers(p => ({ ...p, accessLevel: v }))}>
                      <SelectTrigger><SelectValue placeholder="Free ou Premium" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (Gratuit)</SelectItem>
                        <SelectItem value="premium">Premium (Abonnés uniquement)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={aiAnswers.requiresLogin} onCheckedChange={v => setAiAnswers(p => ({ ...p, requiresLogin: v }))} />
                    <Label>Connexion requise pour accéder</Label>
                  </div>
                  <Button
                    onClick={handleAIProcess}
                    disabled={!aiAnswers.audience || !aiAnswers.accessLevel || aiLoading}
                    className="w-full gap-2"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Remplir automatiquement
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Titre du document *</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description courte</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Audience cible</Label>
                <Select value={form.target_audience} onValueChange={v => setForm(p => ({ ...p, target_audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investors">Investisseurs</SelectItem>
                    <SelectItem value="project_owners">Porteurs de projet</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Niveau d'accès</Label>
                <Select value={form.access_level} onValueChange={v => setForm(p => ({ ...p, access_level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free (Gratuit)</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.requires_login} onCheckedChange={v => setForm(p => ({ ...p, requires_login: v }))} />
                <Label>Connexion requise</Label>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label>Page de couverture (optionnel)</Label>
              {editingId && documents.find(d => d.id === editingId)?.cover_url && (
                <div className="flex items-center gap-3 mb-2">
                  <img src={documents.find(d => d.id === editingId)!.cover_url!} alt="Couverture actuelle" className="h-20 w-16 object-cover rounded border" />
                  <span className="text-xs text-muted-foreground">Couverture actuelle — uploadez une nouvelle image pour la remplacer</span>
                </div>
              )}
              <Input type="file" accept="image/*" onChange={e => setCoverFile(e.target.files?.[0] || null)} />
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => { setShowForm(false); setAiStep('idle'); }}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? "Mettre à jour" : "Enregistrer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
