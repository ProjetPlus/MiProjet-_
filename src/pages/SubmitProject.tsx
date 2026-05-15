import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormProgress } from "@/hooks/useFormProgress";
import { EvaluationPopup } from "@/components/evaluation/EvaluationPopup";
import { 
  Upload, ArrowRight, ArrowLeft, CheckCircle, 
  FileText, Target, Users, DollarSign, Send, AlertCircle,
  Building, MapPin, Clock, Shield, Briefcase
} from "lucide-react";

const setMeta = (title: string, description: string) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
};

const sectors = [
  "Agriculture / Agroalimentaire",
  "Industrie",
  "Services",
  "Énergie / Environnement",
  "Éducation",
  "Santé",
  "Immobilier",
  "Numérique / Innovation",
  "Autre"
];

const profileTypes = [
  "Entrepreneur",
  "Association / ONG",
  "Coopérative",
  "Start-up",
  "Autre"
];

const fundingTypes = [
  "Donateurs",
  "Bailleurs / Subventions",
  "Prêt / Financement bancaire",
  "Investissement en capital",
  "Partenariat / Association"
];

const projectDurations = [
  "< 6 mois",
  "6 – 12 mois",
  "12 – 24 mois",
  "> 24 mois"
];

const projectStages = [
  "Idée",
  "Projet en structuration",
  "Projet pilote / test",
  "Activité existante à développer"
];

const riskTypes = [
  "Financiers",
  "Techniques",
  "Organisationnels",
  "Juridiques"
];

const documentTypes = [
  "Note conceptuelle",
  "Business plan",
  "Étude de faisabilité",
  "Présentation PowerPoint",
  "Autres documents"
];

const countries = [
  "Côte d'Ivoire", "Sénégal", "Mali", "Burkina Faso", "Guinée", 
  "Togo", "Bénin", "Niger", "Cameroun", "Gabon", "Congo", "RDC", "Autre"
];

const steps = [
  { id: 1, title: "Identification du porteur", icon: Users },
  { id: 2, title: "Identification du projet", icon: FileText },
  { id: 3, title: "Description (ISO 21500)", icon: Target },
  { id: 4, title: "Données financières", icon: DollarSign },
  { id: 5, title: "Financement & Maturité", icon: Briefcase },
  { id: 6, title: "Impact & Risques", icon: Shield },
  { id: 7, title: "Équipe & Documents", icon: Upload },
];

const generateAutoEvaluation = (formData: any, projectId: string) => {
  const scorePorteur = Math.min(100, (formData.fullName ? 20 : 0) + (formData.organization ? 20 : 0) + (formData.phone ? 15 : 0) + (formData.email ? 15 : 0) + 30);
  const scoreProjet = Math.min(100, (formData.projectTitle ? 25 : 0) + (formData.sector ? 15 : 0) + (formData.executiveSummary?.length > 50 ? 25 : 10) + 25);
  const scoreFinancier = Math.min(100, (formData.estimatedBudget ? 50 : 0) + (formData.fondsDisponibles ? 30 : 0) + 20);
  const scoreMaturite = formData.projectStage === "Activité existante à développer" ? 90 : formData.projectStage === "Projet pilote / test" ? 70 : 40;
  const scoreImpact = Math.min(100, (formData.directBeneficiaries ? 40 : 0) + (formData.expectedImpact?.length > 20 ? 40 : 20) + 20);
  const scoreEquipe = Math.min(100, (formData.teamDescription?.length > 20 ? 60 : 30) + (formData.availableDocuments?.length > 0 ? 40 : 10));
  const scoreGlobal = Math.round((scorePorteur + scoreProjet + scoreFinancier + scoreMaturite + scoreImpact + scoreEquipe) / 6);
  const niveau = scoreGlobal >= 80 ? 'A' : scoreGlobal >= 60 ? 'B' : scoreGlobal >= 40 ? 'C' : 'D';
  return { score_global: scoreGlobal, score_porteur: scorePorteur, score_projet: scoreProjet, score_financier: scoreFinancier, score_maturite: scoreMaturite, score_impact: scoreImpact, score_equipe: scoreEquipe, niveau, forces: ["Projet soumis avec succès"], faiblesses: [], recommandations: ["Contacter un expert MIPROJET"], resume: `Score automatique: ${scoreGlobal}/100 - Niveau ${niveau}` };
};

const SubmitProject = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [submittedProjectId, setSubmittedProjectId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    // Step 1 - Porteur
    fullName: "",
    organization: "",
    country: "",
    city: "",
    phone: "",
    email: "",
    profileType: "",
    profileTypeOther: "",
    referralCode: "",
    referrerName: "",
    
    // Step 2 - Projet identification
    projectTitle: "",
    sector: "",
    sectorOther: "",
    projectLocation: "",
    projectDuration: "",
    
    // Step 3 - Description ISO 21500
    executiveSummary: "",
    problemIdentified: "",
    generalObjective: "",
    specificObjectives: "",
    projectScope: "",
    expectedDeliverables: "",
    keyResources: "",
    
    // Step 4 - Données financières
    estimatedBudget: "",
    fondsDisponibles: "",
    
    // Step 5 - Financement & Maturité
    fundingType: "",
    projectStage: "",
    hasPreviousFunding: "",
    previousFundingDetails: "",
    
    // Step 6 - Impact & Risques
    directBeneficiaries: "",
    expectedImpact: "",
    identifiedRisks: [] as string[],
    
    // Step 7 - Équipe & Documents
    teamDescription: "",
    availableDocuments: [] as string[],
    certifyAccuracy: false,
    acceptTerms: false,
  });

  const { saveProgress } = useFormProgress({
    formType: 'project_submission',
    totalSteps: 7
  });

  useEffect(() => {
    setMeta(
      t('submitProject.pageTitle') || "Soumettre un Projet | MIPROJET",
      t('submitProject.pageDescription') || "Soumettez votre projet pour structuration professionnelle selon les normes ISO 21500."
    );

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
      setFormData(prev => ({ ...prev, referralCode: refCode.toUpperCase() }));
      // Fetch referrer name
      supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('referral_code', refCode.toUpperCase())
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setFormData(prev => ({
              ...prev,
              referrerName: `${data.first_name || ''} ${data.last_name || ''}`.trim()
            }));
          }
        });
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [t]);

  useEffect(() => {
    if (user) {
      saveProgress(formData, currentStep);
    }
  }, [formData, currentStep, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async (projectId: string) => {
    for (const file of files) {
      const filePath = `${user.id}/${projectId}/${file.name}`;
      await supabase.storage.from("documents").upload(filePath, file);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t('submitProject.loginRequired'),
        description: t('submitProject.loginRequiredDesc'),
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (!formData.certifyAccuracy || !formData.acceptTerms) {
      toast({
        title: t('submitProject.acceptTermsRequired'),
        description: t('submitProject.acceptTermsRequiredDesc'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.from("projects").insert({
        owner_id: user.id,
        title: formData.projectTitle,
        description: `${formData.executiveSummary}\n\nProblème: ${formData.problemIdentified}\n\nObjectif: ${formData.generalObjective}\n\nObjectifs spécifiques: ${formData.specificObjectives}\n\nPérimètre: ${formData.projectScope}\n\nLivrables: ${formData.expectedDeliverables}\n\nRessources: ${formData.keyResources}`,
        category: formData.sector === "Autre" ? formData.sectorOther : formData.sector,
        sector: formData.sector,
        country: formData.country,
        city: formData.city,
        funding_goal: parseFloat(formData.estimatedBudget) || 0,
        fonds_disponibles: formData.fondsDisponibles,
        status: "draft",
      }).select().single();

      if (error) throw error;

      // Also create a service request
      await supabase.from("service_requests").insert({
        user_id: user.id,
        service_type: "structuration",
        company_name: formData.organization,
        sector: formData.sector,
        project_stage: formData.projectStage,
        funding_needed: parseFloat(formData.estimatedBudget) || 0,
        description: formData.executiveSummary,
        has_business_plan: formData.availableDocuments.includes("Business plan"),
      });

      // Handle referral if code provided
      if (formData.referralCode) {
        const { data: referrer } = await supabase
          .from('profiles')
          .select('id')
          .eq('referral_code', formData.referralCode)
          .maybeSingle();
        
        if (referrer) {
          // Create referral record
          await supabase.from('referrals').insert({
            referrer_id: referrer.id,
            referee_id: user.id,
            referral_code: formData.referralCode,
            referral_link: `${window.location.origin}/submit-project?ref=${formData.referralCode}`,
            status: 'pending'
          });
        }
      }

      if (files.length > 0 && data) {
        await uploadFiles(data.id);
      }

      // Generate automatic MIPROJET SCORE evaluation
      const evaluationData = generateAutoEvaluation(formData, data.id);
      
      const { data: evalResult, error: evalError } = await supabase
        .from('project_evaluations')
        .insert({
          project_id: data.id,
          user_id: user.id,
          ...evaluationData
        })
        .select()
        .single();

      if (!evalError && evalResult) {
        setEvaluationResult(evalResult);
        setSubmittedProjectId(data.id);
        setShowEvaluationPopup(true);
        
        // Notify user about evaluation
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: "🏆 Évaluation MIPROJET SCORE",
          message: `Votre projet "${formData.projectTitle}" a obtenu un score de ${evaluationData.score_global}/100 (Niveau ${evaluationData.niveau})`,
          type: "evaluation",
          link: `/project-evaluation/${data.id}`
        });
      } else {
        toast({
          title: "✅ Projet enregistré avec succès",
          description: "Passez maintenant à l'étape suivante : évaluer votre projet avec MIPROJET+ pour connaître son niveau de financement.",
        });
        navigate(`/project-evaluation/${data.id}`);
      }
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message || t('submitProject.errorDesc'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 7));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('submitProject.fullName')} *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Inocent KOFFI"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">{t('submitProject.organization')}</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder={t('submitProject.organizationPlaceholder')}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('common.country')} *</Label>
                <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                  <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t('common.city')} *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Abidjan"
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('common.phone')} *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+225 07 00 00 00 00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')} *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.profileType')} *</Label>
              <Select value={formData.profileType} onValueChange={(v) => setFormData({ ...formData, profileType: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {profileTypes.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.profileType === "Autre" && (
                <Input
                  className="mt-2"
                  value={formData.profileTypeOther}
                  onChange={(e) => setFormData({ ...formData, profileTypeOther: e.target.value })}
                  placeholder={t('submitProject.specifyOther')}
                />
              )}
            </div>
            
            {/* Code Parrain Section */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="referralCode">Code du parrain (facultatif)</Label>
              <Input
                id="referralCode"
                value={formData.referralCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setFormData({ ...formData, referralCode: code, referrerName: "" });
                  // Auto-fetch referrer name
                  if (code.length >= 6) {
                    supabase
                      .from('profiles')
                      .select('first_name, last_name')
                      .eq('referral_code', code)
                      .maybeSingle()
                      .then(({ data }) => {
                        if (data) {
                          setFormData(prev => ({
                            ...prev,
                            referrerName: `${data.first_name || ''} ${data.last_name || ''}`.trim()
                          }));
                        }
                      });
                  }
                }}
                placeholder="Ex: REF-ABC123"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Si vous avez été référé par un parrain, entrez son code pour bénéficier d'avantages
              </p>
            </div>
            
            {formData.referrerName && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">Parrain identifié</p>
                  <p className="text-sm text-muted-foreground">{formData.referrerName}</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectTitle">{t('submitProject.projectTitle')} *</Label>
              <Input
                id="projectTitle"
                value={formData.projectTitle}
                onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
                placeholder={t('submitProject.projectTitlePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.sector')} *</Label>
              <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectLocation">{t('submitProject.projectLocation')} *</Label>
              <Input
                id="projectLocation"
                value={formData.projectLocation}
                onChange={(e) => setFormData({ ...formData, projectLocation: e.target.value })}
                placeholder={t('submitProject.projectLocationPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.projectDuration')} *</Label>
              <Select value={formData.projectDuration} onValueChange={(v) => setFormData({ ...formData, projectDuration: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {projectDurations.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="executiveSummary">{t('submitProject.executiveSummary')} *</Label>
              <Textarea
                id="executiveSummary"
                value={formData.executiveSummary}
                onChange={(e) => setFormData({ ...formData, executiveSummary: e.target.value })}
                placeholder={t('submitProject.executiveSummaryPlaceholder')}
                className="min-h-[100px]"
                maxLength={1500}
              />
              <p className="text-xs text-muted-foreground">{t('submitProject.maxWords')}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="problemIdentified">{t('submitProject.problemIdentified')} *</Label>
              <Textarea
                id="problemIdentified"
                value={formData.problemIdentified}
                onChange={(e) => setFormData({ ...formData, problemIdentified: e.target.value })}
                placeholder={t('submitProject.problemIdentifiedPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="generalObjective">{t('submitProject.generalObjective')} *</Label>
              <Textarea
                id="generalObjective"
                value={formData.generalObjective}
                onChange={(e) => setFormData({ ...formData, generalObjective: e.target.value })}
                placeholder={t('submitProject.generalObjectivePlaceholder')}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specificObjectives">{t('submitProject.specificObjectives')}</Label>
              <Textarea
                id="specificObjectives"
                value={formData.specificObjectives}
                onChange={(e) => setFormData({ ...formData, specificObjectives: e.target.value })}
                placeholder={t('submitProject.specificObjectivesPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectScope">{t('submitProject.projectScope')}</Label>
              <Textarea
                id="projectScope"
                value={formData.projectScope}
                onChange={(e) => setFormData({ ...formData, projectScope: e.target.value })}
                placeholder={t('submitProject.projectScopePlaceholder')}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliverables">{t('submitProject.expectedDeliverables')}</Label>
              <Textarea
                id="expectedDeliverables"
                value={formData.expectedDeliverables}
                onChange={(e) => setFormData({ ...formData, expectedDeliverables: e.target.value })}
                placeholder={t('submitProject.expectedDeliverablesPlaceholder')}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyResources">{t('submitProject.keyResources')}</Label>
              <Textarea
                id="keyResources"
                value={formData.keyResources}
                onChange={(e) => setFormData({ ...formData, keyResources: e.target.value })}
                placeholder={t('submitProject.keyResourcesPlaceholder')}
                className="min-h-[60px]"
              />
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="estimatedBudget">{t('submitProject.estimatedBudget')} *</Label>
              <Input
                id="estimatedBudget"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="Ex: 50000000"
              />
              <p className="text-xs text-muted-foreground">{t('submitProject.budgetNote')}</p>
            </div>
            <div className="space-y-2">
              <Label>Fonds disponibles *</Label>
              <Select 
                value={formData.fondsDisponibles} 
                onValueChange={(v) => setFormData({ ...formData, fondsDisponibles: v })}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="moins_1m">Moins de 1 million FCFA</SelectItem>
                  <SelectItem value="1_5m">Entre 1 et 5 millions FCFA</SelectItem>
                  <SelectItem value="5_10m">Entre 5 et 10 millions FCFA</SelectItem>
                  <SelectItem value="10_20m">Entre 10 et 20 millions FCFA</SelectItem>
                  <SelectItem value="20_50m">Entre 20 et 50 millions FCFA</SelectItem>
                  <SelectItem value="50_100m">Entre 50 et 100 millions FCFA</SelectItem>
                  <SelectItem value="plus_100m">100 millions FCFA et plus</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Ce champ permet d'évaluer votre capacité financière actuelle</p>
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label>{t('submitProject.fundingType')} *</Label>
              <Select value={formData.fundingType} onValueChange={(v) => setFormData({ ...formData, fundingType: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {fundingTypes.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Alert className="mt-2 bg-muted/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {t('submitProject.fundingTypeNote')}
                </AlertDescription>
              </Alert>
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.projectStage')} *</Label>
              <Select value={formData.projectStage} onValueChange={(v) => setFormData({ ...formData, projectStage: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  {projectStages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.hasPreviousFunding')} *</Label>
              <Select value={formData.hasPreviousFunding} onValueChange={(v) => setFormData({ ...formData, hasPreviousFunding: v })}>
                <SelectTrigger><SelectValue placeholder={t('common.select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">{t('common.yes')}</SelectItem>
                  <SelectItem value="no">{t('common.no')}</SelectItem>
                </SelectContent>
              </Select>
              {formData.hasPreviousFunding === "yes" && (
                <Textarea
                  className="mt-2"
                  value={formData.previousFundingDetails}
                  onChange={(e) => setFormData({ ...formData, previousFundingDetails: e.target.value })}
                  placeholder={t('submitProject.previousFundingDetailsPlaceholder')}
                />
              )}
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="directBeneficiaries">{t('submitProject.directBeneficiaries')} *</Label>
              <Textarea
                id="directBeneficiaries"
                value={formData.directBeneficiaries}
                onChange={(e) => setFormData({ ...formData, directBeneficiaries: e.target.value })}
                placeholder={t('submitProject.directBeneficiariesPlaceholder')}
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedImpact">{t('submitProject.expectedImpact')}</Label>
              <Textarea
                id="expectedImpact"
                value={formData.expectedImpact}
                onChange={(e) => setFormData({ ...formData, expectedImpact: e.target.value })}
                placeholder={t('submitProject.expectedImpactPlaceholder')}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.identifiedRisks')} *</Label>
              <div className="grid grid-cols-2 gap-2">
                {riskTypes.map((risk) => (
                  <div key={risk} className="flex items-center space-x-2">
                    <Checkbox
                      id={risk}
                      checked={formData.identifiedRisks.includes(risk)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          identifiedRisks: checked
                            ? [...formData.identifiedRisks, risk]
                            : formData.identifiedRisks.filter((r) => r !== risk)
                        });
                      }}
                    />
                    <Label htmlFor={risk} className="text-sm">{risk}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="teamDescription">{t('submitProject.teamDescription')} *</Label>
              <Textarea
                id="teamDescription"
                value={formData.teamDescription}
                onChange={(e) => setFormData({ ...formData, teamDescription: e.target.value })}
                placeholder={t('submitProject.teamDescriptionPlaceholder')}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('submitProject.availableDocuments')}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {documentTypes.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      checked={formData.availableDocuments.includes(doc)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          availableDocuments: checked
                            ? [...formData.availableDocuments, doc]
                            : formData.availableDocuments.filter((d) => d !== doc)
                        });
                      }}
                    />
                    <Label htmlFor={doc} className="text-sm">{doc}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center">
              <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-4" />
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-primary hover:underline">{t('submitProject.uploadFiles')}</span>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">{t('submitProject.uploadFormats')}</p>
              </Label>
            </div>
            {files.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('submitProject.selectedFiles')}</p>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    {file.name}
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="certifyAccuracy"
                  checked={formData.certifyAccuracy}
                  onCheckedChange={(checked) => setFormData({ ...formData, certifyAccuracy: !!checked })}
                />
                <Label htmlFor="certifyAccuracy" className="text-sm leading-relaxed">
                  {t('submitProject.certifyAccuracy')}
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: !!checked })}
                />
                <Label htmlFor="acceptTerms" className="text-sm leading-relaxed">
                  {t('submitProject.acceptTerms')}
                </Label>
              </div>
            </div>
            <Alert className="bg-muted/50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t('submitProject.legalNotice')}
              </AlertDescription>
            </Alert>
          </div>
        );
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
          <Card className="max-w-lg mx-auto text-center p-6 sm:p-8">
            <CardHeader>
              <CardTitle>{t('submitProject.loginRequired')}</CardTitle>
              <CardDescription>
                {t('submitProject.loginRequiredDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="hero" onClick={() => navigate("/auth")}>
                {t('nav.login')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-28 md:pt-32 sm:pt-28 md:pt-32 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                {t('submitProject.title')}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                {t('submitProject.subtitle')}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-6 sm:mb-8">
              <Progress value={(currentStep / 7) * 100} className="h-2" />
              <div className="flex justify-between mt-4 overflow-x-auto pb-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center min-w-[60px] ${
                      step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 ${
                      step.id < currentStep 
                        ? "bg-primary text-primary-foreground" 
                        : step.id === currentStep 
                          ? "bg-primary/20 border-2 border-primary" 
                          : "bg-muted"
                    }`}>
                      {step.id < currentStep ? (
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <span className="text-[10px] sm:text-xs hidden sm:block text-center">{step.title}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{steps[currentStep - 1].title}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderStep()}

                <div className="flex justify-between mt-6 sm:mt-8 gap-4">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.previous')}
                  </Button>

                  {currentStep < 7 ? (
                    <Button variant="hero" onClick={nextStep} className="flex-1 sm:flex-none">
                      {t('common.next')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="hero" 
                      onClick={handleSubmit}
                      disabled={isSubmitting || !formData.certifyAccuracy || !formData.acceptTerms}
                      className="flex-1 sm:flex-none"
                    >
                      {isSubmitting ? t('common.loading') : t('common.submit')}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SubmitProject;
