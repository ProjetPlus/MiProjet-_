import { Link2, ExternalLink, Globe, TestTube2 } from "lucide-react";
import { resolveCover } from "@/lib/coverImage";
import { Button } from "@/components/ui/button";

interface SocialPreviewProps {
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  authorName?: string;
  authorAvatar?: string;
  excerpt?: string;
  shortUrl?: string;
}

export const SocialPreview = ({
  title,
  content,
  imageUrl,
  videoUrl,
  authorName = "MIPROJET",
  authorAvatar,
  excerpt,
  shortUrl,
}: SocialPreviewProps) => {
  const cover = resolveCover(imageUrl);
  const desc = (excerpt || content || "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  const link = shortUrl || "https://ivoireprojet.com";
  const domain = (() => {
    try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return "ivoireprojet.com"; }
  })();

  const encoded = encodeURIComponent(link);
  const testers: { label: string; href: string }[] = [
    { label: "Facebook Debugger", href: `https://developers.facebook.com/tools/debug/?q=${encoded}` },
    { label: "LinkedIn Inspector", href: `https://www.linkedin.com/post-inspector/inspect/${encoded}` },
    { label: "X / Twitter", href: `https://cards-dev.twitter.com/validator?url=${encoded}` },
    { label: "WhatsApp", href: `https://api.whatsapp.com/send?text=${encoded}` },
  ];

  return (
    <div className="space-y-6">
      <div className="text-xs text-muted-foreground flex items-center gap-2">
        <Globe className="h-3 w-3" />
        Aperçu Open Graph — rendu réel sur WhatsApp, Facebook, LinkedIn, X, Telegram
      </div>

      <div className="flex flex-wrap gap-2 border rounded-lg p-3 bg-muted/20">
        <span className="text-xs font-semibold flex items-center gap-1 mr-2"><TestTube2 className="h-3.5 w-3.5" /> Tester avant publication :</span>
        {testers.map((t) => (
          <Button key={t.label} type="button" size="sm" variant="outline" asChild>
            <a href={t.href} target="_blank" rel="noopener noreferrer">{t.label}</a>
          </Button>
        ))}
      </div>

      {/* Facebook / LinkedIn style card */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">📘 Facebook / LinkedIn</p>
        <div className="border rounded-lg overflow-hidden bg-card max-w-md">
          {videoUrl ? (
            <video src={videoUrl} className="w-full aspect-[1.91/1] object-cover bg-black" muted />
          ) : (
            <img src={cover} alt={title} className="w-full aspect-[1.91/1] object-cover bg-muted" />
          )}
          <div className="p-3 bg-muted/40">
            <p className="text-[11px] uppercase text-muted-foreground tracking-wide">{domain}</p>
            <p className="font-semibold text-foreground text-sm leading-snug line-clamp-2">{title || "Titre de la publication"}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{desc || "Le résumé apparaîtra ici…"}</p>
          </div>
        </div>
      </div>

      {/* WhatsApp style card */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">💬 WhatsApp</p>
        <div className="border-l-4 border-primary bg-muted/30 rounded p-2 max-w-sm">
          <div className="flex gap-2">
            <img src={cover} alt={title} className="w-20 h-20 object-cover rounded flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground line-clamp-2">{title || "Titre"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{desc || "Résumé…"}</p>
              <p className="text-[10px] text-primary mt-1 truncate">{link}</p>
            </div>
          </div>
        </div>
      </div>

      {/* X / Twitter style card */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">🐦 X / Twitter</p>
        <div className="border rounded-2xl overflow-hidden max-w-md">
          <img src={cover} alt={title} className="w-full aspect-[1.91/1] object-cover bg-muted" />
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground">🔗 {domain}</p>
            <p className="font-medium text-sm text-foreground line-clamp-2">{title || "Titre"}</p>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{desc}</p>
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div className="border rounded-lg p-3 bg-muted/30 text-xs space-y-1.5">
        <p className="font-semibold text-foreground flex items-center gap-1.5">
          <Link2 className="h-3 w-3" /> Métadonnées OG
        </p>
        <p><span className="text-muted-foreground">Auteur :</span> <span className="font-medium">{authorName}</span></p>
        <p><span className="text-muted-foreground">Titre :</span> {title || <em className="text-destructive">manquant</em>}</p>
        <p><span className="text-muted-foreground">Description :</span> {desc || <em className="text-destructive">manquante</em>}</p>
        <p className="flex items-center gap-1"><span className="text-muted-foreground">Couverture :</span>
          {imageUrl ? <span className="text-green-600">✓ personnalisée</span> : <span className="text-yellow-600">⚠ couverture par défaut</span>}
        </p>
        <p className="flex items-center gap-1"><span className="text-muted-foreground">Lien court :</span>
          <a href={link} target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1 truncate">
            {link} <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>
    </div>
  );
};
