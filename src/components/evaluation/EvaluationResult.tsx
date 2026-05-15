import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Trophy, Target, TrendingUp, AlertTriangle, CheckCircle,
  Download, Award, Star, Zap, Shield, Users, DollarSign,
  FileText, ArrowRight, Loader2, Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoMiprojet from "@/assets/logo-miprojet-new.png";
import cachetMiprojet from "@/assets/cachet-miprojet.png";
import signatureDG from "@/assets/signature-dg.png";
import { interpretScore, getMaturityLevel, getNextSteps, computeMaturityLevel, EVALUATION_AXES } from "@/lib/evaluation";

interface EvaluationData {
  id: string;
  project_id: string;
  score_global: number;
  score_porteur: number;
  score_projet: number;
  score_financier: number;
  score_maturite: number;
  score_impact: number;
  score_equipe: number;
  score_juridique?: number;
  score_technique?: number;
  score_marche?: number;
  niveau: string;
  niveau_maturite?: number | null;
  is_certified: boolean;
  resume: string | null;
  forces: string[];
  faiblesses: string[];
  recommandations: string[];
  prochaines_etapes?: string[] | null;
  interpretation?: string | null;
  actions_structuration: string[];
  messages_strategiques: string[];
  created_at: string;
  project?: {
    title: string;
    sector: string;
    owner_id: string;
  };
}

interface EvaluationResultProps {
  evaluation: EvaluationData;
  projectTitle?: string;
  onClose?: () => void;
}

const getLevelColor = (niveau: string) => {
  switch (niveau) {
    case 'A': return 'bg-emerald-500';
    case 'B': return 'bg-blue-500';
    case 'C': return 'bg-yellow-500';
    case 'D': return 'bg-orange-500';
    default: return 'bg-muted';
  }
};

const getLevelLabel = (niveau: string) => {
  switch (niveau) {
    case 'A': return 'Excellent';
    case 'B': return 'Très bon';
    case 'C': return 'Bon';
    case 'D': return 'À améliorer';
    default: return 'En cours';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-blue-500';
  if (score >= 40) return 'text-yellow-500';
  return 'text-orange-500';
};

export const EvaluationResult = ({ evaluation, projectTitle, onClose }: EvaluationResultProps) => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);

  const scoreAxes = [
    { label: "Porteur de projet", score: evaluation.score_porteur, icon: Users, color: "primary" },
    { label: "Qualité du projet", score: evaluation.score_projet, icon: Target, color: "blue" },
    { label: "Solidité financière", score: evaluation.score_financier, icon: DollarSign, color: "emerald" },
    { label: "Maturité", score: evaluation.score_maturite, icon: TrendingUp, color: "purple" },
    { label: "Impact attendu", score: evaluation.score_impact, icon: Zap, color: "orange" },
    { label: "Équipe projet", score: evaluation.score_equipe, icon: Users, color: "pink" },
  ];

  const generatePDF = async () => {
    setGenerating(true);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Source Sans Pro', Arial, sans-serif; color: #1a3d32; padding: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1a5f4a; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #1a5f4a; }
          .logo-sub { font-size: 11px; color: #666; }
          .badge { background: ${getLevelColor(evaluation.niveau)}; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; }
          .title-section { text-align: center; margin-bottom: 30px; }
          .main-title { font-size: 24px; color: #1a5f4a; margin-bottom: 10px; }
          .project-name { font-size: 18px; color: #333; }
          .score-section { background: linear-gradient(135deg, #1a5f4a 0%, #2d8b6e 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px; }
          .score-big { font-size: 72px; font-weight: bold; }
          .score-label { font-size: 14px; opacity: 0.9; }
          .axes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
          .axe-card { border: 1px solid #e0e0e0; padding: 15px; border-radius: 8px; }
          .axe-label { font-size: 12px; color: #666; margin-bottom: 5px; }
          .axe-score { font-size: 24px; font-weight: bold; color: #1a5f4a; }
          .section { margin-bottom: 25px; }
          .section-title { font-size: 16px; font-weight: bold; color: #1a5f4a; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 15px; }
          .list-item { padding: 8px 0; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 10px; }
          .list-icon { color: #1a5f4a; font-size: 14px; }
          .certified-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 12px; text-align: center; margin: 30px 0; }
          .certified-title { color: #16a34a; font-size: 18px; font-weight: bold; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 50px; padding-top: 30px; border-top: 1px solid #e0e0e0; }
          .signature-box { text-align: center; }
          .signature-label { font-size: 10px; color: #666; margin-bottom: 10px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MIPROJET SCORE</div>
            <div class="logo-sub">Module d'Évaluation & de Notation des Projets</div>
          </div>
          <div class="badge">Niveau ${evaluation.niveau} - ${getLevelLabel(evaluation.niveau)}</div>
        </div>

        <div class="title-section">
          <h1 class="main-title">Rapport d'Évaluation</h1>
          <p class="project-name">${projectTitle || 'Projet'}</p>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">
            Évaluation réalisée le ${new Date(evaluation.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div class="score-section">
          <div class="score-big">${evaluation.score_global}</div>
          <div class="score-label">Score Global sur 100</div>
        </div>

        <div class="axes-grid">
          ${scoreAxes.map(axe => `
            <div class="axe-card">
              <div class="axe-label">${axe.label}</div>
              <div class="axe-score">${axe.score}/100</div>
            </div>
          `).join('')}
        </div>

        ${evaluation.resume ? `
        <div class="section">
          <h3 class="section-title">Résumé de l'Évaluation</h3>
          <p>${evaluation.resume}</p>
        </div>
        ` : ''}

        ${evaluation.forces?.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Points Forts</h3>
          ${evaluation.forces.map(f => `<div class="list-item"><span class="list-icon">✓</span>${f}</div>`).join('')}
        </div>
        ` : ''}

        ${evaluation.faiblesses?.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Points à Améliorer</h3>
          ${evaluation.faiblesses.map(f => `<div class="list-item"><span class="list-icon">!</span>${f}</div>`).join('')}
        </div>
        ` : ''}

        ${evaluation.recommandations?.length > 0 ? `
        <div class="section">
          <h3 class="section-title">Recommandations</h3>
          ${evaluation.recommandations.map(r => `<div class="list-item"><span class="list-icon">→</span>${r}</div>`).join('')}
        </div>
        ` : ''}

        ${evaluation.is_certified ? `
        <div class="certified-box">
          <div class="certified-title">🏆 PROJET CERTIFIÉ MIPROJET SCORE</div>
          <p style="font-size: 12px; color: #666; margin-top: 10px;">Ce projet a été évalué et certifié par les experts MIPROJET</p>
        </div>
        ` : ''}

        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-label">Cachet MIPROJET</div>
            <img src="${cachetMiprojet}" alt="Cachet" style="height: 60px;" />
          </div>
          <div class="signature-box">
            <div class="signature-label">Signature du Directeur Général</div>
            <img src="${signatureDG}" alt="Signature" style="height: 50px;" />
          </div>
        </div>

        <div class="footer">
          <p><strong>MIPROJET</strong> - Plateforme Panafricaine de Structuration de Projets</p>
          <p>Bingerville – Adjin Palmeraie, 25 BP 2454 ABIDJAN 25</p>
          <p>Ce document est un rapport officiel d'évaluation MIPROJET SCORE</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        setGenerating(false);
      }, 500);
    } else {
      setGenerating(false);
    }

    toast({ title: "PDF généré", description: "Utilisez l'impression pour sauvegarder en PDF" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Évaluation MIPROJET SCORE
          </h1>
          <p className="text-muted-foreground">{projectTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${getLevelColor(evaluation.niveau)} text-white px-4 py-2 text-lg`}>
            Niveau {evaluation.niveau}
          </Badge>
          {evaluation.is_certified && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-3 py-2">
              <Award className="h-4 w-4 mr-1" />
              Certifié
            </Badge>
          )}
        </div>
      </div>

      {/* Main Score with auto interpretation (Module 8) */}
      {(() => {
        const interp = interpretScore(evaluation.score_global);
        const maturityLevel = evaluation.niveau_maturite ?? computeMaturityLevel(evaluation.score_global);
        const maturity = getMaturityLevel(maturityLevel);
        const nextSteps = evaluation.prochaines_etapes?.length ? evaluation.prochaines_etapes : getNextSteps(evaluation.score_global);
        return (
          <>
            <Card className={`bg-gradient-to-br from-primary to-primary/80 text-primary-foreground`}>
              <CardContent className="py-8 text-center">
                <div className="text-7xl font-bold mb-2">{evaluation.score_global}</div>
                <p className="text-primary-foreground/80 mb-2">Score Global sur 100</p>
                <Badge className={`${interp.bgClass} text-white text-lg py-2 px-6 mb-3`}>
                  {interp.label}
                </Badge>
                <p className="text-sm text-primary-foreground/90 max-w-xl mx-auto">{interp.description}</p>
              </CardContent>
            </Card>

            {maturity && (
              <Card className="border-primary/20">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground uppercase">Niveau de maturité</p>
                    <p className="font-bold text-lg">Niveau {maturity.level} — {maturity.label}</p>
                    <p className="text-sm text-muted-foreground">{maturity.description}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        );
      })()}

      {/* Scores by Axis */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scoreAxes.map((axe, index) => {
          const Icon = axe.icon;
          return (
            <Card key={index}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{axe.label}</span>
                  </div>
                  <span className={`text-2xl font-bold ${getScoreColor(axe.score)}`}>
                    {axe.score}
                  </span>
                </div>
                <Progress value={axe.score} className="h-2" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resume */}
      {evaluation.resume && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Résumé de l'Évaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{evaluation.resume}</p>
          </CardContent>
        </Card>
      )}

      {/* Forces & Faiblesses */}
      <div className="grid md:grid-cols-2 gap-6">
        {evaluation.forces?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                Points Forts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.forces.map((force, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">{force}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {evaluation.faiblesses?.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                Points à Améliorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {evaluation.faiblesses.map((faiblesse, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                    <span className="text-sm">{faiblesse}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommandations */}
      {evaluation.recommandations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommandations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {evaluation.recommandations.map((rec, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <ArrowRight className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="outline" onClick={onClose}>
          Fermer
        </Button>
        <Button onClick={generatePDF} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Génération...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};