import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wand2, Bold, Italic, List, Heading1, Heading2, Quote, Link } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}

export const RichTextEditor = ({ value, onChange, placeholder, label, rows = 8 }: RichTextEditorProps) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });

  const wrapText = (before: string, after: string) => {
    const selectedText = value.substring(selection.start, selection.end);
    const newText = 
      value.substring(0, selection.start) + 
      before + selectedText + after + 
      value.substring(selection.end);
    onChange(newText);
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    setSelection({ start: target.selectionStart, end: target.selectionEnd });
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-muted/50 rounded-t-md border border-b-0">
        <Toggle size="sm" onClick={() => wrapText("**", "**")} title="Gras">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("*", "*")} title="Italique">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("\n## ", "\n")} title="Titre">
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("\n### ", "\n")} title="Sous-titre">
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("\n- ", "")} title="Liste">
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("\n> ", "")} title="Citation">
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" onClick={() => wrapText("[", "](url)")} title="Lien">
          <Link className="h-4 w-4" />
        </Toggle>
      </div>
      
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelect={handleSelection}
        placeholder={placeholder}
        rows={rows}
        className="rounded-t-none font-mono text-sm"
      />
      
      <p className="text-xs text-muted-foreground">
        Supporte le format Markdown pour le formatage avancé
      </p>
    </div>
  );
};
