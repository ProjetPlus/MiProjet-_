import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, ArrowLeft, FileText, CheckCircle, Upload, Send } from "lucide-react";
import { trackLead } from "@/lib/leadTracking";

const sectors = [
  "Agriculture", "Tech & Digital", "Éducation", "Santé", "Commerce",
  "Industrie", "Services", "Artisanat", "Énergie", "Immobilier",
  "Transport", "Tourisme", "Finance", "Environnement", "Autre"
];

const projectStages = [
  { value: 'idea', label: 'Idée / Concept' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'mvp', label: 'MVP / Produit Minimum Viable' },
  { value: 'launched', label: 'Lancé / En activité' },
  { value: 'growing', label: 'En croissance' },
];

export const StructuringForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    projectName: '',
    sector: '',
    projectStage: '',
    description: '',
    objectives: '',
    targetMarket: '',
    fundingNeeded: '',
    timeline: '',
    hasTeam: false,
    teamSize: '',
    needsBusinessPlan: true,
    needsFeasibilityStudy: true,
    needsFinancialProjections: true,
    needsRiskAnalysis: true,
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Veuillez vous connecter pour soumettre une demande.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: insertedReq, error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        service_type: 'structuring',
        company_name: formData.projectName,
        sector: formData.sector,
        project_stage: formData.projectStage,
        description: formData.description,
        funding_needed: formData.fundingNeeded ? parseFloat(formData.fundingNeeded) : null,
        has_business_plan: formData.needsBusinessPlan,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      // Track lead from service request
      await trackLead("service_request", {
        first_name: user.email?.split("@")[0] || "Client",
        last_name: "—",
        email: user.email || "",
        user_id: user.id,
        company_name: formData.projectName,
        sector: formData.sector,
        source_id: insertedReq?.id,
        needs: formData.description,
      });

      toast({
        title: "Demande envoyée ✅",
        description: "Étape suivante : évaluez votre projet avec MIPROJET+ pour connaître son niveau de financement.",
      });

      navigate("/miprojet-plus");
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Nom du projet *</Label>
        <Input
          value={formData.projectName}
          onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          placeholder="Ex: AgriTech Solutions Afrique"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Secteur d'activité *</Label>
          <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
            <SelectContent className="bg-popover">
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Stade du projet *</Label>
          <Select value={formData.projectStage} onValueChange={(v) => setFormData({ ...formData, projectStage: v })}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
            <SelectContent className="bg-popover">
              {projectStages.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description du projet *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Décrivez votre projet, le problème que vous résolvez et votre solution..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Objectifs du projet</Label>
        <Textarea
          value={formData.objectives}
          onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
          placeholder="Quels sont vos objectifs à court, moyen et long terme?"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Marché cible</Label>
        <Textarea
          value={formData.targetMarket}
          onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
          placeholder="Décrivez votre clientèle cible, la taille du marché..."
          className="min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Financement recherché (FCFA)</Label>
          <Input
            type="number"
            value={formData.fundingNeeded}
            onChange={(e) => setFormData({ ...formData, fundingNeeded: e.target.value })}
            placeholder="Ex: 50000000"
          />
        </div>
        <div className="space-y-2">
          <Label>Délai de réalisation</Label>
          <Input
            value={formData.timeline}
            onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
            placeholder="Ex: 12 mois"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasTeam"
            checked={formData.hasTeam}
            onCheckedChange={(checked) => setFormData({ ...formData, hasTeam: checked === true })}
          />
          <Label htmlFor="hasTeam" className="cursor-pointer">J'ai déjà une équipe constituée</Label>
        </div>
        {formData.hasTeam && (
          <div className="space-y-2 ml-6">
            <Label>Taille de l'équipe</Label>
            <Input
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              placeholder="Ex: 5 personnes"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Services de structuration souhaités</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sélectionnez les livrables dont vous avez besoin pour votre projet
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
          <Checkbox
            id="businessPlan"
            checked={formData.needsBusinessPlan}
            onCheckedChange={(checked) => setFormData({ ...formData, needsBusinessPlan: checked === true })}
          />
          <div>
            <Label htmlFor="businessPlan" className="font-medium cursor-pointer">Business Plan Complet</Label>
            <p className="text-sm text-muted-foreground">Document de 30-50 pages selon normes ISO 21500</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
          <Checkbox
            id="feasibility"
            checked={formData.needsFeasibilityStudy}
            onCheckedChange={(checked) => setFormData({ ...formData, needsFeasibilityStudy: checked === true })}
          />
          <div>
            <Label htmlFor="feasibility" className="font-medium cursor-pointer">Étude de Faisabilité</Label>
            <p className="text-sm text-muted-foreground">Analyse technique, commerciale et financière</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
          <Checkbox
            id="financial"
            checked={formData.needsFinancialProjections}
            onCheckedChange={(checked) => setFormData({ ...formData, needsFinancialProjections: checked === true })}
          />
          <div>
            <Label htmlFor="financial" className="font-medium cursor-pointer">Projections Financières</Label>
            <p className="text-sm text-muted-foreground">Prévisionnel sur 3-5 ans, TRI, VAN, seuil de rentabilité</p>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50">
          <Checkbox
            id="risk"
            checked={formData.needsRiskAnalysis}
            onCheckedChange={(checked) => setFormData({ ...formData, needsRiskAnalysis: checked === true })}
          />
          <div>
            <Label htmlFor="risk" className="font-medium cursor-pointer">Analyse des Risques</Label>
            <p className="text-sm text-muted-foreground">Identification et mitigation des risques projet</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Documents de support (optionnel)</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Ajoutez des documents existants : notes, études, présentations, etc.
        </p>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <Input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
          />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-primary hover:underline">Cliquez pour ajouter des fichiers</span>
            <p className="text-sm text-muted-foreground mt-2">PDF, Word, Excel, PowerPoint (max 10MB)</p>
          </Label>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm bg-muted p-2 rounded">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Résumé de votre demande</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Projet :</span> {formData.projectName || "Non renseigné"}</p>
            <p><span className="font-medium">Secteur :</span> {formData.sector || "Non renseigné"}</p>
            <p><span className="font-medium">Financement :</span> {formData.fundingNeeded ? `${parseInt(formData.fundingNeeded).toLocaleString()} FCFA` : "Non renseigné"}</p>
            <p><span className="font-medium">Livrables :</span></p>
            <ul className="ml-4 space-y-1">
              {formData.needsBusinessPlan && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Business Plan</li>}
              {formData.needsFeasibilityStudy && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Étude de faisabilité</li>}
              {formData.needsFinancialProjections && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Projections financières</li>}
              {formData.needsRiskAnalysis && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> Analyse des risques</li>}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  const stepTitles = [
    "Informations générales",
    "Détails du projet",
    "Services souhaités",
    "Documents et validation"
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Structuration de Projet
        </CardTitle>
        <CardDescription>
          Faites structurer votre projet selon les normes ISO 21500 par nos experts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Étape {currentStep} sur {totalSteps}</span>
            <span>{stepTitles[currentStep - 1]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          {currentStep < totalSteps ? (
            <Button onClick={nextStep} disabled={!formData.projectName && currentStep === 1}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                "Envoi en cours..."
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Soumettre la demande
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
