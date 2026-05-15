import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Bug } from "lucide-react";
import {
  PUBLIC_SHORT_BASE,
  TYPE_TO_SHORT,
  buildShortPublicUrl,
  buildOgEndpoint,
  type ShareKind,
} from "@/lib/shortSlug";

interface SocialSharePopupProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description: string;
  imageUrl?: string;
  cta?: string;
  shareType?: ShareKind;
  shareId?: string;
  shortSlug?: string;
}

function getShareUrl(props: SocialSharePopupProps): string {
  if (props.shortSlug && props.shareType && TYPE_TO_SHORT[props.shareType]) {
    return buildShortPublicUrl(props.shareType, props.shortSlug);
  }
  if (props.shareType && props.shareId) {
    return buildOgEndpoint({ kind: props.shareType, id: props.shareId });
  }
  return props.url || PUBLIC_SHORT_BASE;
}

function getOgDebugUrl(props: SocialSharePopupProps): string {
  return buildOgEndpoint({
    shortSlug: props.shortSlug,
    kind: props.shareType,
    id: props.shareId,
  });
}

function buildShareText(shareUrl: string, title: string, desc: string, cta: string, whatsapp = false) {
  const safeDesc = desc.trim().replace(/\s+/g, " ").slice(0, 180);
  const safeTitle = whatsapp ? `*${title}*` : title;
  return `${safeTitle}\n\n${safeDesc}\n\n👉 ${cta}\n${shareUrl}`;
}

const platforms = [
  {
    name: "Facebook",
    icon: "📘",
    getUrl: (shareUrl: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  },
  {
    name: "WhatsApp",
    icon: "💬",
    getUrl: (shareUrl: string, title: string, desc: string, cta: string) =>
      `https://wa.me/?text=${encodeURIComponent(buildShareText(shareUrl, title, desc, cta, true))}`,
  },
  {
    name: "LinkedIn",
    icon: "💼",
    getUrl: (shareUrl: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  },
  {
    name: "Twitter / X",
    icon: "🐦",
    getUrl: (shareUrl: string, title: string, desc: string, cta: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${title}\n\n${desc.substring(0, 100)}...\n\n👉 ${cta}`)}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
    name: "Telegram",
    icon: "✈️",
    getUrl: (shareUrl: string, title: string, desc: string, cta: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`*${title}*\n\n${desc.substring(0, 120)}...\n\n👉 ${cta}`)}`,
  },
];

export const SocialSharePopup = (props: SocialSharePopupProps) => {
  const { open, onClose, title, description, cta = "Découvrir sur MIPROJET" } = props;
  const { toast } = useToast();
  const shareUrl = getShareUrl(props);
  const ogDebugUrl = getOgDebugUrl(props);

  const handleShare = (platform: typeof platforms[0]) => {
    window.open(platform.getUrl(shareUrl, title, description, cta), "_blank", "width=600,height=400");
  };

  const copyLink = () => {
    const shareText = buildShareText(shareUrl, title, description, cta);
    navigator.clipboard.writeText(shareText);
    toast({ title: "Copié !", description: "Le texte de partage a été copié dans le presse-papiers." });
  };

  const copyDebugLink = () => {
    navigator.clipboard.writeText(ogDebugUrl);
    toast({ title: "Lien debug copié", description: "Le lien OG a été copié pour vérifier les meta tags." });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Partager sur les réseaux sociaux</DialogTitle>
          <DialogDescription>Choisissez la plateforme de partage</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {platforms.map((platform) => (
            <Button
              key={platform.name}
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleShare(platform)}
            >
              <span className="text-xl">{platform.icon}</span>
              <span>{platform.name}</span>
              <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
            </Button>
          ))}

          <div className="border-t pt-3 space-y-2">
            <Button variant="secondary" className="w-full gap-2" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copier le texte de partage
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-2" onClick={copyDebugLink}>
                <Bug className="h-4 w-4" />
                Copier lien de debug OG
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.open(ogDebugUrl, "_blank") }>
                <ExternalLink className="h-4 w-4" />
                Ouvrir debug OG
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
