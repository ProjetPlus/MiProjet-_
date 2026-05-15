import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeArticleHtml } from "@/lib/sanitizeHtml";
import { 
  Bold, Italic, Underline, List, ListOrdered, 
  Heading1, Heading2, Heading3, Quote, Link2, 
  Image, Video, AlignLeft, AlignCenter, AlignRight,
  Undo, Redo, Type, Strikethrough, Code, Loader2,
  Wand2, Upload, Paperclip
} from "lucide-react";

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  onImageUpload?: (url: string) => void;
}

export const WYSIWYGEditor = ({ 
  value, 
  onChange, 
  placeholder = "Commencez à écrire...",
  label,
  minHeight = "300px",
  onImageUpload
}: WYSIWYGEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleBold = () => execCommand('bold');
  const handleItalic = () => execCommand('italic');
  const handleUnderline = () => execCommand('underline');
  const handleStrikethrough = () => execCommand('strikeThrough');
  const handleHeading1 = () => execCommand('formatBlock', 'h1');
  const handleHeading2 = () => execCommand('formatBlock', 'h2');
  const handleHeading3 = () => execCommand('formatBlock', 'h3');
  const handleParagraph = () => execCommand('formatBlock', 'p');
  const handleQuote = () => execCommand('formatBlock', 'blockquote');
  const handleOrderedList = () => execCommand('insertOrderedList');
  const handleUnorderedList = () => execCommand('insertUnorderedList');
  const handleAlignLeft = () => execCommand('justifyLeft');
  const handleAlignCenter = () => execCommand('justifyCenter');
  const handleAlignRight = () => execCommand('justifyRight');
  const handleUndo = () => execCommand('undo');
  const handleRedo = () => execCommand('redo');
  const handleCode = () => execCommand('formatBlock', 'pre');

  const handleLink = () => {
    if (linkUrl) {
      const link = linkText ? `<a href="${linkUrl}" target="_blank" rel="noopener">${linkText}</a>` : `<a href="${linkUrl}" target="_blank" rel="noopener">${linkUrl}</a>`;
      execCommand('insertHTML', link);
      setLinkUrl("");
      setLinkText("");
      setIsLinkDialogOpen(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast({ title: "Erreur", description: "L'image ne doit pas dépasser 20 Mo", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
      const safeName = file.name.replace(/\s+/g, '_');
      const fileName = `editor/${Date.now()}_${safeName}`;
      const { data, error } = await supabase.storage
        .from('news-media')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('news-media').getPublicUrl(fileName);
      const imageHtml = `<img src="${urlData.publicUrl}" alt="${file.name}" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
      execCommand('insertHTML', imageHtml);
      
      if (onImageUpload) {
        onImageUpload(urlData.publicUrl);
      }
      
      toast({ title: "Succès", description: "Image téléchargée" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible de télécharger l'image", variant: "destructive" });
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ok = ['pdf','doc','docx','xls','xlsx','ppt','pptx','odt','ods','odp','txt','csv'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !ok.includes(ext)) {
      toast({ title: "Format non supporté", description: "PDF, Word, Excel, PowerPoint uniquement", variant: "destructive" });
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "Erreur", description: "Le document ne doit pas dépasser 50 Mo", variant: "destructive" });
      return;
    }
    setIsUploadingDoc(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userPrefix = user?.id || 'public';
      const safeName = file.name.replace(/\s+/g, '_');
      const fileName = `${userPrefix}/editor/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from('documents').upload(fileName, file, { upsert: false });
      if (error) throw error;
      // Generate signed URL valid 7 days for the inline link
      const { data: signed, error: signErr } = await supabase.storage
        .from('documents')
        .createSignedUrl(fileName, 60 * 60 * 24 * 7);
      if (signErr) throw signErr;
      const linkHtml = `<p><a href="${signed.signedUrl}" target="_blank" rel="noopener">📎 ${file.name}</a></p>`;
      execCommand('insertHTML', linkHtml);
      toast({ title: "Succès", description: "Document ajouté" });
    } catch (err: any) {
      toast({ title: "Erreur", description: err?.message || "Impossible d'uploader le document", variant: "destructive" });
    } finally {
      setIsUploadingDoc(false);
      if (documentInputRef.current) documentInputRef.current.value = "";
    }
  };

  const handleVideoUrl = () => {
    const url = prompt("Entrez l'URL de la vidéo YouTube ou Vimeo:");
    if (url) {
      let embedHtml = "";
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("youtu.be") 
          ? url.split("/").pop()?.split("?")[0]
          : url.split("v=")[1]?.split("&")[0];
        if (videoId) {
          embedHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="max-width: 100%;"></iframe>`;
        }
      } else if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        if (videoId) {
          embedHtml = `<iframe width="560" height="315" src="https://player.vimeo.com/video/${videoId}" frameborder="0" allowfullscreen style="max-width: 100%;"></iframe>`;
        }
      }
      if (embedHtml) {
        execCommand('insertHTML', `<div style="margin: 20px 0;">${embedHtml}</div>`);
      }
    }
  };

  const handleGenerateAI = async () => {
    if (!editorRef.current?.textContent || editorRef.current.textContent.length < 50) {
      toast({ 
        title: "Contenu insuffisant", 
        description: "Écrivez au moins 50 caractères pour générer avec l'IA", 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: {
          action: 'generate_news',
          content: editorRef.current.textContent
        }
      });

      if (error) throw error;

      if (data?.content) {
        // Format the generated content
        const formattedContent = data.content
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br/>')
          .replace(/##\s*(.+)/g, '<h2>$1</h2>')
          .replace(/###\s*(.+)/g, '<h3>$1</h3>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>');

        if (editorRef.current) {
          editorRef.current.innerHTML = `<p>${formattedContent}</p>`;
          onChange(editorRef.current.innerHTML);
        }
        
        toast({ title: "Succès", description: "Contenu généré par l'IA" });
      }
    } catch (error) {
      // Fallback: auto-structure locally
      if (editorRef.current) {
        const text = editorRef.current.textContent || '';
        const paragraphs = text.split('\n\n').filter(p => p.trim());
        const formatted = paragraphs.map((p, i) => {
          if (i === 0) return `<h2>${p}</h2>`;
          if (p.endsWith(':')) return `<h3>${p}</h3>`;
          return `<p>${p}</p>`;
        }).join('');
        
        editorRef.current.innerHTML = formatted;
        onChange(formatted);
      }
      toast({ title: "Génération locale", description: "Contenu structuré automatiquement" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* Toolbar */}
      <div className="border rounded-t-lg bg-muted/50 p-2 space-y-2">
        {/* Row 1: Text Formatting */}
        <div className="flex flex-wrap items-center gap-1">
          <Toggle size="sm" onPressedChange={handleBold} title="Gras (Ctrl+B)">
            <Bold className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleItalic} title="Italique (Ctrl+I)">
            <Italic className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleUnderline} title="Souligné (Ctrl+U)">
            <Underline className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleStrikethrough} title="Barré">
            <Strikethrough className="h-4 w-4" />
          </Toggle>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Toggle size="sm" onPressedChange={handleHeading1} title="Titre 1">
            <Heading1 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleHeading2} title="Titre 2">
            <Heading2 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleHeading3} title="Titre 3">
            <Heading3 className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleParagraph} title="Paragraphe">
            <Type className="h-4 w-4" />
          </Toggle>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Toggle size="sm" onPressedChange={handleUnorderedList} title="Liste à puces">
            <List className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleOrderedList} title="Liste numérotée">
            <ListOrdered className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleQuote} title="Citation">
            <Quote className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleCode} title="Code">
            <Code className="h-4 w-4" />
          </Toggle>
        </div>

        {/* Row 2: Alignment & Media */}
        <div className="flex flex-wrap items-center gap-1">
          <Toggle size="sm" onPressedChange={handleAlignLeft} title="Aligner à gauche">
            <AlignLeft className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleAlignCenter} title="Centrer">
            <AlignCenter className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleAlignRight} title="Aligner à droite">
            <AlignRight className="h-4 w-4" />
          </Toggle>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
            <DialogTrigger asChild>
              <Toggle size="sm" title="Insérer un lien">
                <Link2 className="h-4 w-4" />
              </Toggle>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Insérer un lien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input 
                    value={linkUrl} 
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texte du lien (optionnel)</Label>
                  <Input 
                    value={linkText} 
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Cliquez ici"
                  />
                </div>
                <Button onClick={handleLink} className="w-full">Insérer</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Insérer une image"
            disabled={isUploading}
            onClick={() => imageInputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />}
          </Button>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={isUploading}
          />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Insérer un document (PDF, Word, Excel…)"
            disabled={isUploadingDoc}
            onClick={() => documentInputRef.current?.click()}
          >
            {isUploadingDoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          </Button>
          <input
            ref={documentInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv"
            className="hidden"
            onChange={handleDocumentUpload}
            disabled={isUploadingDoc}
          />
          
          <Toggle size="sm" onPressedChange={handleVideoUrl} title="Insérer une vidéo">
            <Video className="h-4 w-4" />
          </Toggle>
          
          <Separator orientation="vertical" className="h-6 mx-1" />
          
          <Toggle size="sm" onPressedChange={handleUndo} title="Annuler (Ctrl+Z)">
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle size="sm" onPressedChange={handleRedo} title="Rétablir (Ctrl+Y)">
            <Redo className="h-4 w-4" />
          </Toggle>
          
          <div className="flex-1" />
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Générer avec IA
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        className="border border-t-0 rounded-b-lg p-4 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 prose prose-sm dark:prose-invert max-w-none overflow-auto"
        style={{ minHeight }}
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(value) }}
        data-placeholder={placeholder}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          font-style: italic;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        [contenteditable] blockquote { 
          border-left: 4px solid hsl(var(--primary)); 
          padding-left: 1em; 
          margin: 1em 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
        }
        [contenteditable] pre {
          background: hsl(var(--muted));
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          font-family: monospace;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin: 1em 0;
          padding-left: 2em;
        }
        [contenteditable] a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
