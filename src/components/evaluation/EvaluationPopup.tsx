import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Eye, FileText, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EvaluationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: {
    score_global: number;
    niveau: string;
    resume?: string;
    project_id: string;
  } | null;
  projectTitle?: string;
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
    case 'A': return 'Excellent - Projet prêt pour le financement';
    case 'B': return 'Très bon - Quelques ajustements recommandés';
    case 'C': return 'Bon potentiel - Structuration nécessaire';
    case 'D': return 'À améliorer - Accompagnement requis';
    default: return 'Évaluation en cours';
  }
};

const getLevelEmoji = (niveau: string) => {
  switch (niveau) {
    case 'A': return '🏆';
    case 'B': return '⭐';
    case 'C': return '📊';
    case 'D': return '📈';
    default: return '⏳';
  }
};

export const EvaluationPopup = ({ isOpen, onClose, evaluation, projectTitle }: EvaluationPopupProps) => {
  const navigate = useNavigate();
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (isOpen && evaluation) {
      // Animate score counting
      let current = 0;
      const target = evaluation.score_global;
      const increment = Math.ceil(target / 30);
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        setAnimatedScore(current);
      }, 50);

      return () => clearInterval(timer);
    }
  }, [isOpen, evaluation]);

  if (!evaluation) return null;

  const handleViewDetails = () => {
    onClose();
    navigate(`/dashboard?tab=evaluation&project=${evaluation.project_id}`);
  };

  const handleViewSummary = () => {
    onClose();
    navigate(`/dashboard?tab=projects`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-2 -right-2 text-4xl">
                {getLevelEmoji(evaluation.niveau)}
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-2xl">
            <Sparkles className="h-5 w-5 inline mr-2 text-yellow-500" />
            Votre projet a été évalué !
          </DialogTitle>
          <DialogDescription className="text-base">
            {projectTitle || "Votre projet"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Score Display */}
          <div className="text-center py-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl">
            <div className="text-6xl font-bold text-primary mb-2">
              {animatedScore}
              <span className="text-2xl text-muted-foreground">/100</span>
            </div>
            <Badge className={`${getLevelColor(evaluation.niveau)} text-white px-4 py-1 text-lg`}>
              Niveau {evaluation.niveau}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">
              {getLevelLabel(evaluation.niveau)}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Score global</span>
              <span className="font-medium">{evaluation.score_global}%</span>
            </div>
            <Progress value={evaluation.score_global} className="h-3" />
          </div>

          {/* Quick Summary */}
          {evaluation.resume && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {evaluation.resume}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button onClick={handleViewDetails} className="w-full" size="lg">
              <Eye className="h-4 w-4 mr-2" />
              Voir l'évaluation complète
            </Button>
            <Button variant="outline" onClick={handleViewSummary} className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Voir le résumé
            </Button>
          </div>

          {/* Info Note */}
          <p className="text-xs text-center text-muted-foreground pt-2">
            Cette évaluation est basée sur les informations fournies dans votre formulaire de projet.
            Un expert MIPROJET peut ajuster ces scores après analyse approfondie.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};