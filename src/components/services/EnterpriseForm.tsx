import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFormProgress } from "@/hooks/useFormProgress";
import { ArrowRight, ArrowLeft, Building2, CheckCircle, Upload, Send, Loader2, Save } from "lucide-react";
import { trackLead } from "@/lib/leadTracking";

interface EnterpriseFormData {
  companyName: string;
  companyType: string;
  sector: string;
  yearCreated: string;
  employees: string;
  annualRevenue: string;
  description: string;
  challenges: string;
  objectives: string;
  accompagnementTypes: string[];
  fundingNeeded: string;
  hasFinancialStatements: boolean;
  hasBusinessPlan: boolean;
  files: string[];
}

const companyTypes = [
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'sas', label: 'SAS' },
  { value: 'ei', label: 'Entreprise Individuelle' },
  { value: 'cooperative', label: 'Coopérative' },
  { value: 'other', label: 'Autre' },
];

const sectors = [
  "Agriculture", "Tech & Digital", "Éducation", "Santé", "Commerce",
  "Industrie", "Services", "Artisanat", "Énergie", "Immobilier",
  "Transport", "Tourisme", "Finance", "Environnement", "Autre"
];

const accompagnementTypesList = [
  { value: 'strategic', label: 'Conseil stratégique', description: 'Définition de la vision et de la stratégie de croissance' },
  { value: 'operational', label: 'Accompagnement opérationnel', description: 'Amélioration des processus et de la productivité' },
  { value: 'financial', label: 'Restructuration financière', description: 'Optimisation de la structure financière' },
  { value: 'digital', label: 'Transformation digitale', description: 'Digitalisation des processus et services' },
  { value: 'expansion', label: 'Expansion / Internationalisation', description: 'Développement de nouveaux marchés' },
  { value: 'funding', label: 'Levée de fonds', description: 'Accompagnement pour trouver des investisseurs' },
];

const TOTAL_STEPS = 4;

export const EnterpriseForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    currentStep,
    data: formData,
    isLoading,
    isSaving,
    saveProgress,
    nextStep,
    prevStep,
    complete,
    updateField
  } = useFormProgress<EnterpriseFormData>({
    formType: 'enterprise_accompaniment',
    totalSteps: TOTAL_STEPS,
    onComplete: () => navigate("/dashboard")
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const handleFieldChange = useCallback((field: keyof EnterpriseFormData, value: unknown) => {
    updateField(field, value);
  }, [updateField]);

  const toggleAccompagnementType = (value: string) => {
    const current = formData.accompagnementTypes || [];
    const newTypes = current.includes(value)
      ? current.filter(t => t !== value)
      : [...current, value];
    handleFieldChange('accompagnementTypes', newTypes);
  };

  const handleSaveProgress = useCallback(async () => {
    await saveProgress(formData, currentStep);
    toast({
      title: "Progression sauvegardée",
      description: "Vos données ont été enregistrées.",
    });
  }, [formData, currentStep, saveProgress, toast]);

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

    try {
      const { data: req, error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        service_type: 'enterprise',
        company_name: formData.companyName,
        sector: formData.sector,
        description: `${formData.description}\n\nType: ${formData.companyType}\nCA: ${formData.annualRevenue}\nDocs financiers: ${formData.hasFinancialStatements ? 'Oui' : 'Non'}`,
        funding_needed: formData.fundingNeeded ? parseFloat(formData.fundingNeeded) : null,
        has_business_plan: formData.hasBusinessPlan,
        status: 'pending',
      }).select().single();

      if (error) throw error;

      await trackLead("service_request", {
        first_name: user.email?.split("@")[0] || "Entreprise",
        last_name: "—",
        email: user.email || "",
        user_id: user.id,
        company_name: formData.companyName,
        sector: formData.sector,
        source_id: req?.id,
        needs: formData.description,
      });

      await complete(formData);

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
    }
  };

  const handleNextStep = async () => {
    await nextStep(formData);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement de votre progression...</p>
        </CardContent>
      </Card>
    );
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Nom de l'entreprise *</Label>
        <Input
          value={formData.companyName || ''}
          onChange={(e) => handleFieldChange('companyName', e.target.value)}
          placeholder="Ex: KOFFI & Associés SARL"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Forme juridique *</Label>
          <Select value={formData.companyType || ''} onValueChange={(v) => handleFieldChange('companyType', v)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
            <SelectContent className="bg-popover">
              {companyTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Secteur d'activité *</Label>
          <Select value={formData.sector || ''} onValueChange={(v) => handleFieldChange('sector', v)}>
            <SelectTrigger className="bg-background"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
            <SelectContent className="bg-popover">
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Année de création</Label>
          <Input
            type="number"
            value={formData.yearCreated || ''}
            onChange={(e) => handleFieldChange('yearCreated', e.target.value)}
            placeholder="Ex: 2018"
          />
        </div>
        <div className="space-y-2">
          <Label>Nombre d'employés</Label>
          <Input
            value={formData.employees || ''}
            onChange={(e) => handleFieldChange('employees', e.target.value)}
            placeholder="Ex: 25"
          />
        </div>
        <div className="space-y-2">
          <Label>CA annuel (FCFA)</Label>
          <Input
            type="number"
            value={formData.annualRevenue || ''}
            onChange={(e) => handleFieldChange('annualRevenue', e.target.value)}
            placeholder="Ex: 150000000"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description de l'entreprise *</Label>
        <Textarea
          value={formData.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Présentez votre entreprise, ses activités principales, ses produits/services..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Défis actuels de l'entreprise</Label>
        <Textarea
          value={formData.challenges || ''}
          onChange={(e) => handleFieldChange('challenges', e.target.value)}
          placeholder="Quels sont les principaux défis auxquels votre entreprise fait face?"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Objectifs de croissance</Label>
        <Textarea
          value={formData.objectives || ''}
          onChange={(e) => handleFieldChange('objectives', e.target.value)}
          placeholder="Quels sont vos objectifs à court, moyen et long terme?"
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Besoin de financement (FCFA)</Label>
        <Input
          type="number"
          value={formData.fundingNeeded || ''}
          onChange={(e) => handleFieldChange('fundingNeeded', e.target.value)}
          placeholder="Ex: 200000000"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Types d'accompagnement souhaités</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sélectionnez les types d'accompagnement dont vous avez besoin
        </p>
      </div>

      <div className="space-y-3">
        {accompagnementTypesList.map((type) => (
          <div
            key={type.value}
            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
              (formData.accompagnementTypes || []).includes(type.value) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            }`}
            onClick={() => toggleAccompagnementType(type.value)}
          >
            <Checkbox
              checked={(formData.accompagnementTypes || []).includes(type.value)}
              onCheckedChange={() => toggleAccompagnementType(type.value)}
            />
            <div>
              <Label className="font-medium cursor-pointer">{type.label}</Label>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h4 className="font-medium">Documents disponibles</h4>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="financials"
            checked={formData.hasFinancialStatements || false}
            onCheckedChange={(checked) => handleFieldChange('hasFinancialStatements', checked === true)}
          />
          <Label htmlFor="financials" className="cursor-pointer">États financiers des 3 dernières années</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="businessPlan"
            checked={formData.hasBusinessPlan || false}
            onCheckedChange={(checked) => handleFieldChange('hasBusinessPlan', checked === true)}
          />
          <Label htmlFor="businessPlan" className="cursor-pointer">Business Plan / Plan stratégique</Label>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Télécharger vos documents</Label>
        <p className="text-sm text-muted-foreground mb-4">
          Joignez vos documents : bilans, comptes de résultat, organigramme, etc.
        </p>
        <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Fonctionnalité d'upload disponible prochainement</p>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">Résumé de votre demande</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Entreprise :</span> {formData.companyName || "Non renseigné"}</p>
            <p><span className="font-medium">Secteur :</span> {formData.sector || "Non renseigné"}</p>
            <p><span className="font-medium">CA annuel :</span> {formData.annualRevenue ? `${parseInt(formData.annualRevenue).toLocaleString()} FCFA` : "Non renseigné"}</p>
            <p><span className="font-medium">Types d'accompagnement :</span></p>
            <ul className="ml-4 space-y-1">
              {(formData.accompagnementTypes || []).map(type => {
                const typeInfo = accompagnementTypesList.find(t => t.value === type);
                return (
                  <li key={type} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    {typeInfo?.label}
                  </li>
                );
              })}
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
    "Informations entreprise",
    "Défis et objectifs",
    "Types d'accompagnement",
    "Documents et validation"
  ];

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Accompagnement Entreprise
            </CardTitle>
            <CardDescription>
              Service dédié aux entreprises existantes cherchant un accompagnement stratégique
            </CardDescription>
          </div>
          {isSaving && (
            <Badge variant="secondary" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde...
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Étape {currentStep} sur {TOTAL_STEPS}</span>
            <span>{stepTitles[currentStep - 1]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="ghost"
              onClick={handleSaveProgress}
              disabled={isSaving}
            >
              <Save className="mr-2 h-4 w-4" />
              Sauvegarder
            </Button>
          </div>

          {currentStep < TOTAL_STEPS ? (
            <Button onClick={handleNextStep} disabled={!formData.companyName && currentStep === 1 || isSaving}>
              Suivant
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isSaving}>
              <Send className="mr-2 h-4 w-4" />
              Soumettre la demande
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
