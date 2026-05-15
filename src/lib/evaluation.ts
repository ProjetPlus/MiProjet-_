// Helpers d'évaluation MIPROJET — Modules 8 & 9 du MENU_ADMIN
// Structure officielle 100 points : Juridique 15 + Financier 25 + Technique 20 + Marché 20 + Impact 20

export const EVALUATION_AXES = [
  { key: "juridique", label: "Juridique & gouvernance", max: 15 },
  { key: "financier", label: "Financier", max: 25 },
  { key: "technique", label: "Technique & opérationnel", max: 20 },
  { key: "marche", label: "Marché & modèle économique", max: 20 },
  { key: "impact", label: "Impact, risques & durabilité", max: 20 },
] as const;

export const MATURITY_LEVELS = [
  { level: 1, label: "Idée (startup)", description: "Concept en phase de définition, pas encore d'activité." },
  { level: 2, label: "Activité naissante", description: "Premiers revenus ou clients, organisation informelle." },
  { level: 3, label: "PME structurée", description: "Organisation établie, comptabilité, équipe en place." },
  { level: 4, label: "PME finançable", description: "Prêt pour levée de fonds ou crédit bancaire." },
] as const;

export interface ScoreInterpretation {
  label: string;
  shortLabel: string;
  color: string;
  bgClass: string;
  textClass: string;
  description: string;
  recommendedAction: string;
}

export const interpretScore = (score: number): ScoreInterpretation => {
  if (score >= 80) {
    return {
      label: "Projet finançable",
      shortLabel: "Finançable",
      color: "#10b981",
      bgClass: "bg-emerald-500",
      textClass: "text-emerald-600",
      description:
        "Excellent score. Votre projet présente toutes les caractéristiques attendues par les financeurs (banques, investisseurs, fonds).",
      recommendedAction: "Préparer un dossier de levée de fonds ou demande de crédit.",
    };
  }
  if (score >= 60) {
    return {
      label: "Projet prometteur",
      shortLabel: "Prometteur",
      color: "#3b82f6",
      bgClass: "bg-blue-500",
      textClass: "text-blue-600",
      description:
        "Bon potentiel. Quelques axes restent à renforcer avant d'aborder sereinement les financeurs.",
      recommendedAction: "Travailler les axes faibles puis re-évaluer.",
    };
  }
  if (score >= 40) {
    return {
      label: "Projet fragile",
      shortLabel: "Fragile",
      color: "#f59e0b",
      bgClass: "bg-amber-500",
      textClass: "text-amber-600",
      description:
        "Plusieurs faiblesses structurelles. Une structuration approfondie est nécessaire avant tout financement.",
      recommendedAction: "Engager un parcours de structuration complet.",
    };
  }
  return {
    label: "Projet non finançable",
    shortLabel: "Non finançable",
    color: "#ef4444",
    bgClass: "bg-red-500",
    textClass: "text-red-600",
    description:
      "Le projet n'est pas en l'état présentable à un financeur. Une refonte complète est requise.",
    recommendedAction: "Reprendre le projet à la base avec un accompagnement MIPROJET.",
  };
};

export const getMaturityLevel = (level?: number | null) => {
  if (!level) return null;
  return MATURITY_LEVELS.find((m) => m.level === level) ?? null;
};

/**
 * Calcule le niveau de maturité automatiquement à partir du score global.
 */
export const computeMaturityLevel = (scoreGlobal: number): number => {
  if (scoreGlobal >= 80) return 4;
  if (scoreGlobal >= 60) return 3;
  if (scoreGlobal >= 40) return 2;
  return 1;
};

/**
 * Retourne les prochaines étapes selon le score (orientation parcours).
 */
export const getNextSteps = (scoreGlobal: number): string[] => {
  if (scoreGlobal >= 80) {
    return [
      "Constituer un pitch deck professionnel.",
      "Identifier les financeurs adaptés (banques, fonds, business angels).",
      "Préparer le dossier complet de demande de financement.",
      "Solliciter une certification MIPROJET pour rassurer les financeurs.",
    ];
  }
  if (scoreGlobal >= 60) {
    return [
      "Renforcer les axes les plus faibles identifiés dans l'évaluation.",
      "Finaliser les documents juridiques et comptables.",
      "Re-passer l'évaluation après améliorations.",
      "Préparer en parallèle un dossier de financement allégé.",
    ];
  }
  if (scoreGlobal >= 40) {
    return [
      "S'engager dans un parcours de structuration MIPROJET.",
      "Mettre en place une comptabilité formelle.",
      "Formaliser le statut juridique de l'activité.",
      "Construire un business plan détaillé.",
    ];
  }
  return [
    "Reprendre la définition du projet (problème, solution, marché).",
    "Suivre l'accompagnement MIPROJET « Idée → Activité ».",
    "Tester le concept à petite échelle avant d'investir.",
    "Construire progressivement les fondations du projet.",
  ];
};

/**
 * Détermine le parcours recommandé selon le type de projet et la maturité.
 */
export const getRecommendedJourney = (
  scoreGlobal: number,
  isStartup: boolean = false
): "existing_activity" | "startup" => {
  if (isStartup || scoreGlobal < 40) return "startup";
  return "existing_activity";
};
