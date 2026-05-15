import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Wand2, Loader2, Bold, Italic, List, ListOrdered, Heading1, Heading2,
  Quote, Image, Video, Upload, Sparkles, ImagePlus, FileText, Film, Images, Eye,
  Paperclip, X, UserCircle2
} from "lucide-react";
import { SocialPreview } from "./SocialPreview";
import { buildShortPublicUrl, type ShareKind } from "@/lib/shortSlug";
import { normalizeArticleHtml, sanitizeArticleHtml } from "@/lib/sanitizeHtml";

export interface EditorField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'upload-image' | 'upload-video' | 'upload-media' | 'upload-document' | 'tags';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  maxSize?: number;
}

interface UniversalAIEditorProps {
  fields: EditorField[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  contentFieldName?: string;
  onAIGenerate?: () => void;
  storageFolder?: string;
  shareKind?: ShareKind;
}

type GenerationOption = 'text_only' | 'with_images';

export const UniversalAIEditor = ({
  fields, values, onChange, contentFieldName = 'content', storageFolder = 'news-media', shareKind = 'news'
}: UniversalAIEditorProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showWordPreview, setShowWordPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const generationOptions: { value: GenerationOption; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'with_images', label: 'Génération avec images', icon: <ImagePlus className="h-8 w-8" />, description: 'Image de couverture ultra-réaliste + illustrations contextuelles si pertinentes' },
    { value: 'text_only', label: 'Génération sans images', icon: <FileText className="h-8 w-8" />, description: 'Contenu textuel uniquement, structuré et professionnel' },
  ];

  const handleGenerateClick = () => {
    const content = values[contentFieldName];
    if (!content || content.trim().length < 1) {
      toast({ title: "Contenu requis", description: "Écrivez au moins un mot pour générer avec l'IA", variant: "destructive" });
      return;
    }
    setShowPopup(true);
  };

  const generateContent = async (option: GenerationOption) => {
    setShowPopup(false);
    setGenerating(true);
    const content = values[contentFieldName] || '';
    
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: {
          action: 'generate_article_html',
          content,
          option,
          fields: fields.map(f => ({ name: f.name, type: f.type, options: f.options }))
        }
      });

      if (error) throw error;

      if (data) {
        // Fill all fields returned by AI
        Object.keys(data).forEach(key => {
          if (data[key] !== undefined && data[key] !== null) {
            onChange(key, data[key]);
          }
        });
        toast({ title: "✨ Contenu généré avec succès", description: "Tous les champs ont été remplis automatiquement" });
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      // Fallback to local generation
      generateLocally();
    } finally {
      setGenerating(false);
    }

    // Generate cover image if requested
    if (option === 'with_images') {
      await generateAIImage(content);
    }
  };

  const generateAIImage = async (topic: string) => {
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: { action: 'generate_image', topic, content: topic }
      });
      
      if (!error && data?.image_url) {
        const imageField = fields.find(f => f.type === 'upload-image');
        if (imageField) onChange(imageField.name, data.image_url);
        else if (fields.find(f => f.name === 'image_url')) onChange('image_url', data.image_url);
        toast({ title: "🖼️ Image IA générée", description: "Image professionnelle ajoutée" });
      }
    } catch (e) {
      console.error("Image generation error:", e);
      toast({ title: "Info", description: "Image non générée, uploadez manuellement" });
    } finally { setGeneratingImage(false); }
  };

  const generateLocally = () => {
    const content = values[contentFieldName] || '';
    const lines = content.split('\n').filter((l: string) => l.trim());
    const title = lines[0]?.substring(0, 80).toUpperCase() || "CONTENU MIPROJET";
    const excerpt = content.substring(0, 200) + (content.length > 200 ? "..." : "");
    
    const contentLower = content.toLowerCase();
    let category = "general";
    if (contentLower.includes("formation") || contentLower.includes("atelier")) category = "training";
    else if (contentLower.includes("financement") || contentLower.includes("investissement")) category = "funding";
    else if (contentLower.includes("partenariat")) category = "partnerships";
    else if (contentLower.includes("opportunité")) category = "opportunities";
    else if (contentLower.includes("projet")) category = "projects";
    else if (contentLower.includes("événement")) category = "events";

    // Generate HTML content
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim());
    let html = `<h2>${title}</h2>`;
    paragraphs.forEach((p: string, i: number) => {
      if (i === 0) html += `<p><strong>${p}</strong></p>`;
      else html += `<p>${p}</p>`;
    });
    html += `<hr/><p><em>MIPROJET | info@ivoireprojet.com | +225 07 07 16 79 21</em></p>`;
    
    if (fields.find(f => f.name === 'title')) onChange('title', title);
    if (fields.find(f => f.name === 'excerpt')) onChange('excerpt', excerpt);
    if (fields.find(f => f.name === 'category')) onChange('category', category);
    onChange(contentFieldName, html);
    toast({ title: "✅ Contenu structuré localement" });
  };

  const handleFileUpload = async (fieldName: string, file: File, maxSize: number) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: `Maximum ${maxSize} Mo`, variant: "destructive" });
      return;
    }
    setUploading(fieldName);
    try {
      const fileName = `${storageFolder}/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { error } = await supabase.storage.from(storageFolder).upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(storageFolder).getPublicUrl(fileName);
      onChange(fieldName, urlData.publicUrl);
      toast({ title: "✅ Upload réussi" });
    } catch (error: any) {
      toast({ title: "Erreur d'upload", variant: "destructive" });
    } finally { setUploading(null); }
  };

  // WYSIWYG exec commands on the contentEditable div
  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    // Sync back to state
    if (editorRef.current) onChange(contentFieldName, editorRef.current.innerHTML);
  };

  const renderField = (field: EditorField) => {
    const value = values[field.name] || '';
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label} {field.required && '*'}</Label>
            <Input id={field.name} value={value} onChange={(e) => onChange(field.name, e.target.value)} placeholder={field.placeholder} required={field.required} />
          </div>
        );
      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <Select value={value} onValueChange={(v) => onChange(field.name, v)}>
              <SelectTrigger><SelectValue placeholder={field.placeholder || "Sélectionnez..."} /></SelectTrigger>
              <SelectContent>
                {field.options?.map(opt => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'upload-image':
        return (
          <div key={field.name} className="space-y-2">
            <Label className="flex items-center gap-2"><Image className="h-4 w-4" />{field.label} (max {field.maxSize || 20} Mo)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input type="file" accept="image/*" disabled={uploading === field.name}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(field.name, file, field.maxSize || 20); }}
                  className="flex-1" />
                <Button type="button" variant="outline" size="sm" onClick={() => generateAIImage(values[contentFieldName] || values['title'] || 'business')} disabled={generatingImage}>
                  {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                </Button>
              </div>
              {value && <img src={value} alt="Aperçu" className="h-24 w-auto object-cover rounded border" />}
              {uploading === field.name && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Téléchargement...</div>}
            </div>
          </div>
        );
      case 'upload-video':
        return (
          <div key={field.name} className="space-y-2">
            <Label className="flex items-center gap-2"><Video className="h-4 w-4" />{field.label} (max {field.maxSize || 500} Mo)</Label>
            <Input type="file" accept="video/*" disabled={uploading === field.name}
              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileUpload(field.name, file, field.maxSize || 500); }} />
            {value && <video src={value} className="h-24 w-auto rounded border" controls />}
          </div>
        );
      case 'upload-media': {
        const isVideo = typeof value === 'string' && /\.(mp4|webm|mov|m4v|ogg)$/i.test(value);
        return (
          <div key={field.name} className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Images className="h-4 w-4" />{field.label} — image ou vidéo (max {field.maxSize || 500} Mo)
            </Label>
            <div className="flex gap-2 items-start">
              <Input
                type="file"
                accept="image/*,video/*"
                disabled={uploading === field.name}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(field.name, file, field.maxSize || 500);
                }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm"
                onClick={() => generateAIImage(values[contentFieldName] || values['title'] || 'business')}
                disabled={generatingImage}>
                {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">IA</span>
              </Button>
              {value && (
                <Button type="button" variant="ghost" size="sm" onClick={() => onChange(field.name, '')} title="Retirer">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {value && (
              <div className="rounded border bg-muted/30 p-2 inline-block">
                {isVideo
                  ? <video src={value} controls className="h-32 w-auto rounded" />
                  : <img src={value} alt="Aperçu couverture" className="h-32 w-auto object-cover rounded" />}
                <p className="text-xs text-muted-foreground mt-1">📌 Définie comme couverture (utilisée comme OG image au partage)</p>
              </div>
            )}
            {uploading === field.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Téléchargement…
              </div>
            )}
          </div>
        );
      }
      case 'upload-document': {
        const docs: Array<{ url: string; name: string }> = Array.isArray(value)
          ? value
          : (value ? [{ url: value as string, name: (value as string).split('/').pop() || 'document' }] : []);
        const handleDocUpload = async (file: File) => {
          const ok = ['pdf','doc','docx','xls','xlsx','ppt','pptx','pub','odt','ods','odp','txt','csv'];
          const ext = file.name.split('.').pop()?.toLowerCase();
          if (!ext || !ok.includes(ext)) {
            toast({ title: 'Format non supporté', description: 'PDF, Word, Excel, PowerPoint, Publisher uniquement', variant: 'destructive' });
            return;
          }
          if (file.size > (field.maxSize || 50) * 1024 * 1024) {
            toast({ title: 'Fichier trop volumineux', description: `Maximum ${field.maxSize || 50} Mo`, variant: 'destructive' });
            return;
          }
          setUploading(field.name);
          try {
            const fileName = `documents/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
            const { error } = await supabase.storage.from('documents').upload(fileName, file, { upsert: true });
            if (error) throw error;
            const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);
            const next = [...docs, { url: urlData.publicUrl, name: file.name }];
            onChange(field.name, next);
            toast({ title: '✅ Document ajouté' });
          } catch (e: any) {
            toast({ title: "Erreur d'upload", description: e?.message, variant: 'destructive' });
          } finally { setUploading(null); }
        };
        return (
          <div key={field.name} className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Paperclip className="h-4 w-4" />{field.label} — PDF, Word, Excel, PowerPoint, Publisher
            </Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.pub,.odt,.ods,.odp,.txt,.csv"
              disabled={uploading === field.name}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); }}
            />
            {docs.length > 0 && (
              <ul className="space-y-1 mt-2">
                {docs.map((d, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm bg-muted/40 rounded px-3 py-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline">{d.name}</a>
                    <Button type="button" variant="ghost" size="sm"
                      onClick={() => onChange(field.name, docs.filter((_, j) => j !== i))}>
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            {uploading === field.name && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Téléchargement…
              </div>
            )}
            <p className="text-xs text-muted-foreground">💡 N'ajoutez un document que si nécessaire.</p>
          </div>
        );
      }
      case 'tags':
        return (
          <div key={field.name} className="space-y-2">
            <Label>{field.label}</Label>
            <Input value={value} onChange={(e) => onChange(field.name, e.target.value)} placeholder="#tag1 #tag2 #tag3" />
          </div>
        );
      default: return null;
    }
  };

  const contentField = fields.find(f => f.name === contentFieldName);
  const otherFields = fields.filter(f => f.name !== contentFieldName && f.type !== 'textarea');
  const excerptField = fields.find(f => f.name === 'excerpt');

  return (
    <div className="space-y-6">
      {/* AI Generation Popup */}
      <Dialog open={showPopup} onOpenChange={setShowPopup}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-6 w-6 text-primary" />
              Format de publication
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {generationOptions.map((option) => (
              <button key={option.value} onClick={() => generateContent(option.value)}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all text-left group">
                <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                  {option.icon}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{option.label}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Social Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Eye className="h-5 w-5" />Aperçu publication</DialogTitle>
          </DialogHeader>
          <SocialPreview
            title={values['title'] || ''}
            content={values[contentFieldName] || ''}
            imageUrl={values['image_url'] || ''}
            videoUrl={values['video_url'] || ''}
            excerpt={values['excerpt'] || values['description'] || ''}
            authorName={values['author_name'] || 'MIPROJET'}
            shortUrl={buildShortPublicUrl(shareKind, values['short_slug'])}
          />
        </DialogContent>
      </Dialog>

      {/* Word-like final rendering preview */}
      <Dialog open={showWordPreview} onOpenChange={setShowWordPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Aperçu Word</DialogTitle>
          </DialogHeader>
          <article className="article-body article-body--reading prose prose-lg max-w-none border border-border rounded-lg bg-background p-5 sm:p-8">
            <h1 className="!mt-0 !mb-6 text-2xl sm:text-3xl font-extrabold text-foreground">{values.title || "Titre de l’article"}</h1>
            <div dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(values[contentFieldName] || "") }} />
          </article>
        </DialogContent>
      </Dialog>

      {/* AI Generation Bar */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-3 bg-primary/20 rounded-xl">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold">🤖 Éditeur IA Avancé</p>
                <p className="text-sm text-muted-foreground">Un mot suffit — l'IA génère un article complet, structuré et illustré</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-1" />Aperçu
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowWordPreview(true)}>
                <FileText className="h-4 w-4 mr-1" />Aperçu Word
              </Button>
              <Button type="button" onClick={handleGenerateClick} disabled={generating || generatingImage} size="lg" className="min-w-[160px]">
                {generating ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Génération...</>
                  : generatingImage ? <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Image IA...</>
                  : <><Wand2 className="h-5 w-5 mr-2" />Générer</>}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {otherFields.map(field => renderField(field))}
      </div>

      {/* Excerpt */}
      {excerptField && (
        <div className="space-y-2">
          <Label>{excerptField.label}</Label>
          <Textarea value={values[excerptField.name] || ''} onChange={(e) => onChange(excerptField.name, e.target.value)} rows={2} placeholder="Sera généré automatiquement..." />
        </div>
      )}

      {/* WYSIWYG Content Editor */}
      {contentField && (
        <div className="space-y-2">
          <Label className="text-lg font-semibold">{contentField.label} *</Label>
          
          {/* Toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-t-lg border border-b-0 border-border">
            <div className="flex gap-1 border-r border-border pr-2 mr-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('bold')} title="Gras"><Bold className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('italic')} title="Italique"><Italic className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-1 border-r border-border pr-2 mr-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('formatBlock', 'h2')} title="Titre"><Heading1 className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('formatBlock', 'h3')} title="Sous-titre"><Heading2 className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-1 border-r border-border pr-2 mr-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('insertUnorderedList')} title="Liste"><List className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('insertOrderedList')} title="Liste numérotée"><ListOrdered className="h-4 w-4" /></Button>
            </div>
            <div className="flex gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => execCmd('formatBlock', 'blockquote')} title="Citation"><Quote className="h-4 w-4" /></Button>
            </div>
          </div>
          
          {/* ContentEditable WYSIWYG area */}
          <div
            ref={editorRef}
            contentEditable
            className="article-body min-h-[400px] p-4 border border-border rounded-b-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(values[contentFieldName] || '') }}
            onInput={() => {
              if (editorRef.current) {
                onChange(contentFieldName, sanitizeArticleHtml(editorRef.current.innerHTML));
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const text = e.clipboardData.getData('text/plain');
              document.execCommand('insertHTML', false, normalizeArticleHtml(text));
              if (editorRef.current) onChange(contentFieldName, editorRef.current.innerHTML);
            }}
          />
          <p className="text-xs text-muted-foreground">💡 Écrivez un mot ou une idée, puis cliquez "Générer" — l'IA structure tout automatiquement.</p>

          {/* Hidden textarea to hold the value for form submission */}
          <input type="hidden" name={contentFieldName} value={values[contentFieldName] || ''} />
        </div>
      )}
    </div>
  );
};
