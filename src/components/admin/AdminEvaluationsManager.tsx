import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Trophy, Search, Eye, Edit, Award, RefreshCw, Download,
  Plus, Save, Loader2, CheckCircle, X, Calculator, Trash2, Wand2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EvaluationResult } from "@/components/evaluation/EvaluationResult";

interface Evaluation {
  id: string;
  project_id: string;
  user_id: string;
  score_global: number;
  score_porteur: number;
  score_projet: number;
  score_financier: number;
  score_maturite: number;
  score_impact: number;
  score_equipe: number;
  niveau: string;
  is_certified: boolean;
  resume: string | null;
  forces: string[];
  faiblesses: string[];
  recommandations: string[];
  created_at: string;
  project?: {
    title: string;
    sector: string;
    owner_id: string;
  };
}

interface Project {
  id: string;
  title: string;
  owner_id: string;
  sector: string | null;
  status: string;
  created_at: string;
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

const calculateLevel = (score: number): string => {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  return 'D';
};

export const AdminEvaluationsManager = () => {
  const { toast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Form state for editing/creating
  const [formData, setFormData] = useState({
    project_id: "",
    score_porteur: 50,
    score_projet: 50,
    score_financier: 50,
    score_maturite: 50,
    score_impact: 50,
    score_equipe: 50,
    resume: "",
    forces: "",
    faiblesses: "",
    recommandations: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch evaluations with project info
    const { data: evalData } = await (supabase
      .from('project_evaluations')
      .select(`
        *,
        project:projects(title, sector, owner_id)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as any);

    if (evalData) {
      setEvaluations(evalData as any);
    }

    // Fetch projects for creating new evaluations
    const { data: projData } = await supabase
      .from('projects')
      .select('id, title, owner_id, sector, status, created_at')
      .order('created_at', { ascending: false });

    if (projData) {
      setProjects(projData);
    }

    setLoading(false);
  };

  const calculateGlobalScore = () => {
    const scores = [
      formData.score_porteur,
      formData.score_projet,
      formData.score_financier,
      formData.score_maturite,
      formData.score_impact,
      formData.score_equipe
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const handleCreate = async () => {
    if (!formData.project_id) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un projet", variant: "destructive" });
      return;
    }

    setSaving(true);
    const globalScore = calculateGlobalScore();
    const niveau = calculateLevel(globalScore);

    const project = projects.find(p => p.id === formData.project_id);

    try {
      const { error } = await supabase
        .from('project_evaluations')
        .insert({
          project_id: formData.project_id,
          user_id: project?.owner_id,
          score_global: globalScore,
          score_porteur: formData.score_porteur,
          score_projet: formData.score_projet,
          score_financier: formData.score_financier,
          score_maturite: formData.score_maturite,
          score_impact: formData.score_impact,
          score_equipe: formData.score_equipe,
          niveau,
          resume: formData.resume,
          forces: formData.forces.split('\n').filter(Boolean),
          faiblesses: formData.faiblesses.split('\n').filter(Boolean),
          recommandations: formData.recommandations.split('\n').filter(Boolean)
        });

      if (error) throw error;

      // Notify user
      if (project?.owner_id) {
        await supabase.from('notifications').insert({
          user_id: project.owner_id,
          title: "Évaluation disponible",
          message: `Votre projet "${project.title}" a été évalué. Score: ${globalScore}/100 - Niveau ${niveau}`,
          type: "evaluation",
          link: "/dashboard"
        });
      }

      toast({ title: "Succès", description: "Évaluation créée avec succès" });
      setShowCreateDialog(false);
      fetchData();
      resetForm();

    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedEvaluation) return;

    setSaving(true);
    const globalScore = calculateGlobalScore();
    const niveau = calculateLevel(globalScore);

    try {
      const { error } = await supabase
        .from('project_evaluations')
        .update({
          score_global: globalScore,
          score_porteur: formData.score_porteur,
          score_projet: formData.score_projet,
          score_financier: formData.score_financier,
          score_maturite: formData.score_maturite,
          score_impact: formData.score_impact,
          score_equipe: formData.score_equipe,
          niveau,
          resume: formData.resume,
          forces: formData.forces.split('\n').filter(Boolean),
          faiblesses: formData.faiblesses.split('\n').filter(Boolean),
          recommandations: formData.recommandations.split('\n').filter(Boolean)
        })
        .eq('id', selectedEvaluation.id);

      if (error) throw error;

      // Notify user of update
      await supabase.from('notifications').insert({
        user_id: selectedEvaluation.user_id,
        title: "Évaluation mise à jour",
        message: "Votre évaluation a été mise à jour par un expert MIPROJET.",
        type: "evaluation",
        link: "/dashboard"
      });

      toast({ title: "Succès", description: "Évaluation mise à jour" });
      setShowEditDialog(false);
      fetchData();

    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleCertify = async (evaluation: Evaluation) => {
    try {
      const { error } = await supabase
        .from('project_evaluations')
        .update({
          is_certified: true,
          certified_at: new Date().toISOString()
        })
        .eq('id', evaluation.id);

      if (error) throw error;

      // Notify user
      await supabase.from('notifications').insert({
        user_id: evaluation.user_id,
        title: "🏆 Projet Certifié !",
        message: "Félicitations ! Votre projet a reçu la certification MIPROJET SCORE.",
        type: "certification",
        link: "/dashboard"
      });

      toast({ title: "Certifié !", description: "Le projet a reçu la certification MIPROJET SCORE" });
      fetchData();

    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (evaluation: Evaluation) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette évaluation ? Cette action est irréversible.")) return;

    try {
      const { error } = await supabase
        .from('project_evaluations')
        .delete()
        .eq('id', evaluation.id);

      if (error) throw error;

      toast({ title: "Succès", description: "Évaluation supprimée" });
      fetchData();
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const generateWithAI = async () => {
    const project = projects.find(p => p.id === formData.project_id);
    if (!project) {
      toast({ title: "Erreur", description: "Veuillez d'abord sélectionner un projet", variant: "destructive" });
      return;
    }

    setGeneratingAI(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: {
          action: 'generate_evaluation',
          projectData: {
            title: project.title,
            sector: project.sector,
            description: ""
          },
          scores: {
            porteur: formData.score_porteur,
            projet: formData.score_projet,
            financier: formData.score_financier,
            maturite: formData.score_maturite,
            impact: formData.score_impact,
            equipe: formData.score_equipe
          }
        }
      });

      if (error) throw error;

      if (data) {
        setFormData(prev => ({
          ...prev,
          resume: data.resume || prev.resume,
          forces: (data.forces || []).join('\n'),
          faiblesses: (data.faiblesses || []).join('\n'),
          recommandations: (data.recommandations || []).join('\n')
        }));
        
        toast({ title: "Génération IA réussie", description: "Résumé et recommandations générés" });
      }
    } catch (error: any) {
      // Fallback local
      setFormData(prev => ({
        ...prev,
        resume: `Projet évalué avec un score global de ${calculateGlobalScore()}/100. Ce projet présente un potentiel intéressant nécessitant une structuration approfondie.`,
        forces: "Idée innovante\nMarché porteur\nÉquipe motivée",
        faiblesses: "Business plan à compléter\nProjections financières à affiner",
        recommandations: "Structurer le business plan selon ISO 21500\nDétailler le plan financier sur 5 ans\nIdentifier les partenaires stratégiques"
      }));
      toast({ title: "Génération locale", description: "Contenu généré localement" });
    } finally {
      setGeneratingAI(false);
    }
  };

  const resetForm = () => {
    setFormData({
      project_id: "",
      score_porteur: 50,
      score_projet: 50,
      score_financier: 50,
      score_maturite: 50,
      score_impact: 50,
      score_equipe: 50,
      resume: "",
      forces: "",
      faiblesses: "",
      recommandations: ""
    });
  };

  const openEditDialog = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setFormData({
      project_id: evaluation.project_id,
      score_porteur: evaluation.score_porteur,
      score_projet: evaluation.score_projet,
      score_financier: evaluation.score_financier,
      score_maturite: evaluation.score_maturite,
      score_impact: evaluation.score_impact,
      score_equipe: evaluation.score_equipe,
      resume: evaluation.resume || "",
      forces: evaluation.forces?.join('\n') || "",
      faiblesses: evaluation.faiblesses?.join('\n') || "",
      recommandations: evaluation.recommandations?.join('\n') || ""
    });
    setShowEditDialog(true);
  };

  const filteredEvaluations = evaluations.filter(e =>
    e.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ScoreSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-medium">{value}/100</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        max={100}
        step={1}
        className="cursor-pointer"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Gestion des Évaluations MIPROJET SCORE
          </h2>
          <p className="text-muted-foreground">Évaluez, notez et certifiez les projets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={() => { resetForm(); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle évaluation
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Niveau</TableHead>
                <TableHead className="text-center">Certifié</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredEvaluations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune évaluation trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">
                      {evaluation.project?.title || 'Projet inconnu'}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-2xl font-bold">{evaluation.score_global}</span>
                      <span className="text-muted-foreground">/100</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={`${getLevelColor(evaluation.niveau)} text-white`}>
                        Niveau {evaluation.niveau}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {evaluation.is_certified ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          <Award className="h-3 w-3 mr-1" />
                          Certifié
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCertify(evaluation)}
                        >
                          <Award className="h-3 w-3 mr-1" />
                          Certifier
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(evaluation.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedEvaluation(evaluation); setShowViewDialog(true); }}
                          title="Voir"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(evaluation)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(evaluation)}
                          title="Supprimer"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Evaluation Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedEvaluation && (
            <EvaluationResult
              evaluation={selectedEvaluation as any}
              projectTitle={selectedEvaluation.project?.title}
              onClose={() => setShowViewDialog(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Evaluation Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showCreateDialog ? "Nouvelle Évaluation" : "Modifier l'Évaluation"}
            </DialogTitle>
            <DialogDescription>
              Définissez les scores pour chaque axe d'évaluation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {showCreateDialog && (
              <div className="space-y-2">
                <Label>Sélectionner un projet</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Score Preview */}
            <Card className="bg-primary/5">
              <CardContent className="py-4 text-center">
                <div className="text-4xl font-bold text-primary">{calculateGlobalScore()}</div>
                <p className="text-sm text-muted-foreground">Score Global Calculé</p>
                <Badge className={`${getLevelColor(calculateLevel(calculateGlobalScore()))} text-white mt-2`}>
                  Niveau {calculateLevel(calculateGlobalScore())}
                </Badge>
              </CardContent>
            </Card>

            {/* Score Sliders */}
            <div className="grid md:grid-cols-2 gap-4">
              <ScoreSlider
                label="Porteur de projet"
                value={formData.score_porteur}
                onChange={(v) => setFormData({ ...formData, score_porteur: v })}
              />
              <ScoreSlider
                label="Qualité du projet"
                value={formData.score_projet}
                onChange={(v) => setFormData({ ...formData, score_projet: v })}
              />
              <ScoreSlider
                label="Solidité financière"
                value={formData.score_financier}
                onChange={(v) => setFormData({ ...formData, score_financier: v })}
              />
              <ScoreSlider
                label="Maturité"
                value={formData.score_maturite}
                onChange={(v) => setFormData({ ...formData, score_maturite: v })}
              />
              <ScoreSlider
                label="Impact attendu"
                value={formData.score_impact}
                onChange={(v) => setFormData({ ...formData, score_impact: v })}
              />
              <ScoreSlider
                label="Équipe projet"
                value={formData.score_equipe}
                onChange={(v) => setFormData({ ...formData, score_equipe: v })}
              />
            </div>

            {/* Text Fields with AI Generation */}
            <div className="space-y-4">
              {/* AI Generation Button */}
              <div className="flex items-center gap-2 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <Wand2 className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Génération IA</p>
                  <p className="text-xs text-muted-foreground">
                    Générer automatiquement le résumé et les recommandations
                  </p>
                </div>
                <Button 
                  type="button" 
                  onClick={generateWithAI}
                  disabled={generatingAI || !formData.project_id}
                  variant="default"
                  size="sm"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Générer avec IA
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Résumé de l'évaluation</Label>
                <Textarea
                  value={formData.resume}
                  onChange={(e) => setFormData({ ...formData, resume: e.target.value })}
                  placeholder="Résumé global de l'évaluation..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Points forts (un par ligne)</Label>
                <Textarea
                  value={formData.forces}
                  onChange={(e) => setFormData({ ...formData, forces: e.target.value })}
                  placeholder="- Point fort 1&#10;- Point fort 2"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Points à améliorer (un par ligne)</Label>
                <Textarea
                  value={formData.faiblesses}
                  onChange={(e) => setFormData({ ...formData, faiblesses: e.target.value })}
                  placeholder="- Point à améliorer 1&#10;- Point à améliorer 2"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Recommandations (une par ligne)</Label>
                <Textarea
                  value={formData.recommandations}
                  onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                  placeholder="- Recommandation 1&#10;- Recommandation 2"
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); setShowEditDialog(false); }}>
              Annuler
            </Button>
            <Button onClick={showCreateDialog ? handleCreate : handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {showCreateDialog ? "Créer" : "Mettre à jour"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};