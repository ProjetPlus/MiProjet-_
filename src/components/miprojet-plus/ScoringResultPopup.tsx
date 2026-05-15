import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy, TrendingUp, AlertTriangle, XCircle, Download, Phone,
  CheckCircle, Star, ArrowRight, Sparkles, MessageCircle
} from "lucide-react";
import MiProjetPlusName from "./MiProjetPlusName";

interface ScoringResultPopupProps {
  open: boolean;
  onClose: () => void;
  score: number;
  niveau: string;
  scores: {
    juridique: number;
    financier: number;
    technique: number;
    marche: number;
    impact: number;
  };
  projectTitle: string;
  userId: string;
  onExportPDF: () => void;
}

const NIVEAU_CONFIG: Record<string, {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  message: string;
  color: string;
  bgGradient: string;
  badgeClass: string;
  recommendations: string[];
}> = {
  financable: {
    icon: <Trophy className="h-12 w-12" />,
    title: "🎉 Félicitations !",
    subtitle: "Votre projet est FINANÇABLE",
    message: "Votre projet présente un excellent niveau de structuration. Il est prêt à être présenté aux partenaires financiers et investisseurs. Vous pouvez envisager de demander la certification MIPROJET pour renforcer votre crédibilité.",
    color: "text-emerald-600",
    bgGradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    recommendations: [
      "Demandez la Certification MIPROJET pour valoriser votre projet",
      "Connectez-vous avec notre réseau de financeurs partenaires",
      "Préparez votre pitch deck pour les présentations investisseurs",
    ],
  },
  prometteur: {
    icon: <TrendingUp className="h-12 w-12" />,
    title: "👏 Bravo, c'est prometteur !",
    subtitle: "Votre projet est PROMETTEUR",
    message: "Votre projet est en bonne voie et présente de solides fondations. Quelques améliorations ciblées vous permettront d'atteindre le niveau finançable. Notre équipe peut vous accompagner dans cette démarche.",
    color: "text-blue-600",
    bgGradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
    recommendations: [
      "Renforcez les axes identifiés comme faibles dans votre scoring",
      "Envisagez un accompagnement en structuration de projet",
      "Documentez davantage vos processus financiers et opérationnels",
    ],
  },
  fragile: {
    icon: <AlertTriangle className="h-12 w-12" />,
    title: "💪 Courage, vous progressez !",
    subtitle: "Votre projet est encore FRAGILE",
    message: "Votre projet nécessite un travail de structuration important mais le potentiel est là. MIPROJET peut vous accompagner pas à pas pour consolider votre activité et la rendre éligible au financement.",
    color: "text-amber-600",
    bgGradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    recommendations: [
      "Formalisez votre statut juridique en priorité",
      "Mettez en place une comptabilité régulière",
      "Inscrivez-vous à notre programme d'incubation",
      "Contactez notre équipe pour un diagnostic approfondi gratuit",
    ],
  },
  non_financable: {
    icon: <XCircle className="h-12 w-12" />,
    title: "🌱 Chaque grand projet commence petit",
    subtitle: "Votre projet n'est PAS ENCORE finançable",
    message: "Ne vous découragez pas ! De nombreux projets qui réussissent aujourd'hui étaient à ce stade il y a quelques mois. L'important est de poser les bonnes bases. Notre équipe est là pour vous guider dans cette transformation.",
    color: "text-rose-600",
    bgGradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
    recommendations: [
      "Commencez par enregistrer officiellement votre activité",
      "Ouvrez un compte bancaire ou mobile money dédié",
      "Suivez nos formations gratuites en gestion d'entreprise",
      "Demandez à être contacté par notre équipe d'accompagnement",
    ],
  },
};

export const ScoringResultPopup = ({
  open, onClose, score, niveau, scores, projectTitle, userId, onExportPDF
}: ScoringResultPopupProps) => {
  const { toast } = useToast();
  const [contactMessage, setContactMessage] = useState("");
  const [contactSent, setContactSent] = useState(false);
  const [sending, setSending] = useState(false);

  const config = NIVEAU_CONFIG[niveau] || NIVEAU_CONFIG.non_financable;

  const handleContactRequest = async () => {
    if (!contactMessage.trim()) {
      toast({ title: "Veuillez écrire un message", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "📩 Demande de contact envoyée",
        message: `Votre demande concernant "${projectTitle}" a été transmise à notre équipe.`,
        type: "contact_request",
        link: "/miprojet-plus/app",
      });
      await supabase.from("messages").insert({
        content: `[MiProjet+ Contact Request] Projet: ${projectTitle} | Score: ${score}/100 (${niveau})\n\n${contactMessage}`,
        sender_id: userId,
        subject: `Demande de contact - Score ${score}/100`,
      });
      setContactSent(true);
      toast({ title: "✅ Demande envoyée", description: "Notre équipe vous contactera sous 48h" });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header with gradient */}
        <div className={`bg-gradient-to-br ${config.bgGradient} p-6 text-center relative`}>
          <div className="absolute top-3 right-3">
            <Badge className={`${config.badgeClass} text-xs font-bold border`}>
              {score}/100
            </Badge>
          </div>
          <div className={`${config.color} mb-3 flex justify-center`}>
            {config.icon}
          </div>
          <h2 className="text-2xl font-bold text-foreground">{config.title}</h2>
          <p className={`text-lg font-semibold ${config.color} mt-1`}>{config.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-2">
            <MiProjetPlusName /> SCORE — {projectTitle}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Score radar summary */}
          <div className="grid grid-cols-5 gap-2 text-center">
            {[
              { label: "Juridique", value: scores.juridique, max: 15 },
              { label: "Financier", value: scores.financier, max: 25 },
              { label: "Technique", value: scores.technique, max: 20 },
              { label: "Marché", value: scores.marche, max: 20 },
              { label: "Impact", value: scores.impact, max: 20 },
            ].map((axis) => {
              const pct = (axis.value / axis.max) * 100;
              return (
                <div key={axis.label} className="space-y-1">
                  <div className="relative w-10 h-10 mx-auto">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor"
                        className={config.color} strokeWidth="3" strokeDasharray={`${pct * 0.88} 88`} strokeLinecap="round" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">{axis.value}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground leading-tight">{axis.label}</p>
                </div>
              );
            })}
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed">{config.message}</p>

          {/* Recommendations */}
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Nos recommandations
            </p>
            <ul className="space-y-2">
              {config.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact request section */}
          {!contactSent ? (
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-primary" />
                Être contacté par notre équipe
              </p>
              <Textarea
                placeholder="Décrivez votre besoin d'accompagnement..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <Button onClick={handleContactRequest} disabled={sending} className="w-full" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                {sending ? "Envoi..." : "Demander à être contacté"}
              </Button>
            </div>
          ) : (
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700">Demande envoyée !</p>
              <p className="text-xs text-emerald-600">Notre équipe vous contactera sous 48h</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onExportPDF} className="flex-1" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter PDF
            </Button>
            <Button onClick={onClose} className="flex-1 bg-emerald-600 hover:bg-emerald-700" size="sm">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
