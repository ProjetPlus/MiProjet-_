import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { 
  ArrowRight, ArrowLeft, CheckCircle, FileText, Building2, 
  Briefcase, GraduationCap, Rocket, Upload, Send
} from "lucide-react";

const serviceTypes = [
  {
    id: 'structuring',
    icon: FileText,
    title: { fr: 'Structuration de Projet', en: 'Project Structuring', ar: 'هيكلة المشروع', zh: '项目结构化', es: 'Estructuración de Proyecto', de: 'Projektstrukturierung' },
    description: { fr: 'Business plan, étude de faisabilité, analyse des risques selon ISO 21500', en: 'Business plan, feasibility study, risk analysis according to ISO 21500', ar: 'خطة العمل، دراسة الجدوى، تحليل المخاطر وفقاً لـ ISO 21500', zh: '商业计划、可行性研究、ISO 21500风险分析', es: 'Plan de negocios, estudio de viabilidad, análisis de riesgos según ISO 21500', de: 'Geschäftsplan, Machbarkeitsstudie, Risikoanalyse nach ISO 21500' },
  },
  {
    id: 'fullService',
    icon: Rocket,
    title: { fr: 'Accompagnement Complet', en: 'Full Service', ar: 'الخدمة الكاملة', zh: '全套服务', es: 'Servicio Completo', de: 'Vollservice' },
    description: { fr: 'Structuration + Labellisation + Orientation vers partenaires', en: 'Structuring + Labeling + Partner orientation', ar: 'الهيكلة + التصنيف + التوجيه نحو الشركاء', zh: '结构化 + 标签 + 合作伙伴导向', es: 'Estructuración + Etiquetado + Orientación hacia socios', de: 'Strukturierung + Kennzeichnung + Partnerorientierung' },
  },
  {
    id: 'enterprise',
    icon: Building2,
    title: { fr: 'Entreprise Existante', en: 'Existing Enterprise', ar: 'مؤسسة قائمة', zh: '现有企业', es: 'Empresa Existente', de: 'Bestehendes Unternehmen' },
    description: { fr: 'Pour entreprises avec CA et bilan cherchant accompagnement ou expansion', en: 'For enterprises with revenue seeking support or expansion', ar: 'للمؤسسات ذات الإيرادات التي تبحث عن دعم أو توسع', zh: '适用于有收入寻求支持或扩张的企业', es: 'Para empresas con ingresos buscando acompañamiento o expansión', de: 'Für Unternehmen mit Umsatz auf Begleitungs- oder Expansionssuche' },
  },
  {
    id: 'training',
    icon: GraduationCap,
    title: { fr: 'Formation & Coaching', en: 'Training & Coaching', ar: 'التدريب والتوجيه', zh: '培训与辅导', es: 'Formación & Coaching', de: 'Training & Coaching' },
    description: { fr: 'Formations en gestion de projet, entrepreneuriat, pitch', en: 'Training in project management, entrepreneurship, pitch', ar: 'التدريب في إدارة المشاريع وريادة الأعمال والعرض التقديمي', zh: '项目管理、创业、路演培训', es: 'Formación en gestión de proyectos, emprendimiento, pitch', de: 'Schulung in Projektmanagement, Unternehmertum, Pitch' },
  },
];

const sectors = [
  "Agriculture", "Tech & Digital", "Éducation", "Santé", "Commerce", 
  "Industrie", "Services", "Artisanat", "Énergie", "Immobilier", 
  "Transport", "Tourisme", "Finance", "Environnement", "Autre"
];

const projectStages = [
  { value: 'idea', label: { fr: 'Idée', en: 'Idea', ar: 'فكرة', zh: '想法', es: 'Idea', de: 'Idee' } },
  { value: 'prototype', label: { fr: 'Prototype', en: 'Prototype', ar: 'نموذج أولي', zh: '原型', es: 'Prototipo', de: 'Prototyp' } },
  { value: 'mvp', label: { fr: 'MVP', en: 'MVP', ar: 'MVP', zh: 'MVP', es: 'MVP', de: 'MVP' } },
  { value: 'launched', label: { fr: 'Lancé', en: 'Launched', ar: 'تم الإطلاق', zh: '已启动', es: 'Lanzado', de: 'Gestartet' } },
  { value: 'growing', label: { fr: 'En croissance', en: 'Growing', ar: 'في نمو', zh: '成长中', es: 'En crecimiento', de: 'Wachsend' } },
];

const companyTypes = [
  { value: 'sarl', label: 'SARL' },
  { value: 'sa', label: 'SA' },
  { value: 'sas', label: 'SAS' },
  { value: 'ei', label: 'Entreprise Individuelle' },
  { value: 'cooperative', label: 'Coopérative' },
  { value: 'association', label: 'Association' },
  { value: 'none', label: 'Non encore créée' },
];

const ServiceRequest = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedType = searchParams.get('type') || '';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<File[]>([]);
  
  const [formData, setFormData] = useState({
    serviceType: preselectedType,
    companyName: '',
    companyType: '',
    sector: '',
    projectStage: '',
    description: '',
    fundingNeeded: '',
    annualRevenue: '',
    hasBusinessPlan: false,
    hasFinancialStatements: false,
  });

  useEffect(() => {
    document.title = t('services.request.title') || "Demande de Service | MIPROJET";
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [t]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t('auth.required') || "Connexion requise",
        description: t('auth.loginToSubmit') || "Veuillez vous connecter pour soumettre une demande.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("service_requests").insert({
        user_id: user.id,
        service_type: formData.serviceType,
        company_name: formData.companyName || null,
        sector: formData.sector || null,
        project_stage: formData.projectStage || null,
        description: `${formData.description || ''}\n\nType: ${formData.companyType}\nCA: ${formData.annualRevenue}\nDocs financiers: ${formData.hasFinancialStatements ? 'Oui' : 'Non'}`,
        funding_needed: formData.fundingNeeded ? parseFloat(formData.fundingNeeded) : null,
        has_business_plan: formData.hasBusinessPlan,
        status: 'pending',
      });

      if (error) throw error;

      toast({
        title: t('common.success') || "Succès",
        description: t('services.request.submitted') || "Votre demande a été soumise avec succès. Notre équipe vous contactera sous 48h.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: t('common.error') || "Erreur",
        description: error.message || "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = formData.serviceType === 'training' ? 2 : 3;
  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const renderServiceSelection = () => (
    <div className="grid gap-4 md:grid-cols-2">
      {serviceTypes.map((service) => {
        const Icon = service.icon;
        const isSelected = formData.serviceType === service.id;
        return (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
              isSelected ? 'border-primary border-2 bg-primary/5' : 'border-border'
            }`}
            onClick={() => setFormData({ ...formData, serviceType: service.id })}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">{service.title[language]}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{service.description[language]}</CardDescription>
              {isSelected && (
                <div className="mt-3 flex items-center gap-2 text-primary text-sm font-medium">
                  <CheckCircle className="h-4 w-4" />
                  {t('common.selected') || "Sélectionné"}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderProjectDetails = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('form.companyName') || "Nom de l'entreprise/projet"}</Label>
          <Input
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            placeholder="Ex: AgriTech Solutions"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('form.companyType') || "Type d'entreprise"}</Label>
          <Select value={formData.companyType} onValueChange={(v) => setFormData({ ...formData, companyType: v })}>
            <SelectTrigger><SelectValue placeholder={t('common.select') || "Sélectionnez"} /></SelectTrigger>
            <SelectContent>
              {companyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('form.sector') || "Secteur d'activité"}</Label>
          <Select value={formData.sector} onValueChange={(v) => setFormData({ ...formData, sector: v })}>
            <SelectTrigger><SelectValue placeholder={t('common.select') || "Sélectionnez"} /></SelectTrigger>
            <SelectContent>
              {sectors.map((sector) => (
                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('form.projectStage') || "Stade du projet"}</Label>
          <Select value={formData.projectStage} onValueChange={(v) => setFormData({ ...formData, projectStage: v })}>
            <SelectTrigger><SelectValue placeholder={t('common.select') || "Sélectionnez"} /></SelectTrigger>
            <SelectContent>
              {projectStages.map((stage) => (
                <SelectItem key={stage.value} value={stage.value}>{stage.label[language]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('form.description') || "Description du projet"}</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('form.descriptionPlaceholder') || "Décrivez votre projet, vos objectifs et vos besoins..."}
          className="min-h-[120px]"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('form.fundingNeeded') || "Financement recherché (FCFA)"}</Label>
          <Input
            type="number"
            value={formData.fundingNeeded}
            onChange={(e) => setFormData({ ...formData, fundingNeeded: e.target.value })}
            placeholder="Ex: 5000000"
          />
        </div>
        {(formData.serviceType === 'enterprise' || formData.serviceType === 'fundingOnly') && (
          <div className="space-y-2">
            <Label>{t('form.annualRevenue') || "Chiffre d'affaires annuel (FCFA)"}</Label>
            <Input
              type="number"
              value={formData.annualRevenue}
              onChange={(e) => setFormData({ ...formData, annualRevenue: e.target.value })}
              placeholder="Ex: 10000000"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="businessPlan"
            checked={formData.hasBusinessPlan}
            onCheckedChange={(checked) => setFormData({ ...formData, hasBusinessPlan: checked === true })}
          />
          <Label htmlFor="businessPlan" className="cursor-pointer">
            {t('form.hasBusinessPlan') || "J'ai déjà un business plan"}
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="financials"
            checked={formData.hasFinancialStatements}
            onCheckedChange={(checked) => setFormData({ ...formData, hasFinancialStatements: checked === true })}
          />
          <Label htmlFor="financials" className="cursor-pointer">
            {t('form.hasFinancialStatements') || "J'ai des états financiers"}
          </Label>
        </div>
      </div>
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>{t('form.uploadDocuments') || "Documents de support"}</Label>
        <p className="text-sm text-muted-foreground mb-4">
          {t('form.uploadHint') || "Ajoutez des documents pour renforcer votre dossier : business plan, étude de marché, états financiers, etc."}
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
            <span className="text-primary hover:underline">{t('form.clickToUpload') || "Cliquez pour ajouter des fichiers"}</span>
            <p className="text-sm text-muted-foreground mt-2">PDF, Word, Excel, PowerPoint, Images (max 10MB)</p>
          </Label>
        </div>
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">{t('form.selectedFiles') || "Fichiers sélectionnés"} :</p>
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-4">{t('form.summary') || "Résumé de votre demande"}</h4>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">{t('form.serviceType') || "Service"} :</span> {serviceTypes.find(s => s.id === formData.serviceType)?.title[language]}</p>
            {formData.companyName && <p><span className="font-medium">{t('form.companyName') || "Entreprise"} :</span> {formData.companyName}</p>}
            {formData.sector && <p><span className="font-medium">{t('form.sector') || "Secteur"} :</span> {formData.sector}</p>}
            {formData.fundingNeeded && <p><span className="font-medium">{t('form.fundingNeeded') || "Financement"} :</span> {parseInt(formData.fundingNeeded).toLocaleString()} FCFA</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderServiceSelection();
      case 2:
        return formData.serviceType === 'training' ? renderDocuments() : renderProjectDetails();
      case 3:
        return renderDocuments();
      default:
        return null;
    }
  };

  const stepTitles = [
    { fr: 'Type de Service', en: 'Service Type', ar: 'نوع الخدمة', zh: '服务类型', es: 'Tipo de Servicio', de: 'Serviceart' },
    { fr: 'Détails du Projet', en: 'Project Details', ar: 'تفاصيل المشروع', zh: '项目详情', es: 'Detalles del Proyecto', de: 'Projektdetails' },
    { fr: 'Documents & Validation', en: 'Documents & Validation', ar: 'الوثائق والتحقق', zh: '文件与验证', es: 'Documentos y Validación', de: 'Dokumente & Validierung' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 pt-28 md:pt-32 pb-16">
          <Card className="max-w-lg mx-auto text-center p-8">
            <CardHeader>
              <CardTitle>{t('auth.required') || "Connexion requise"}</CardTitle>
              <CardDescription>
                {t('auth.loginToSubmit') || "Vous devez être connecté pour faire une demande de service"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default" onClick={() => navigate("/auth")}>
                {t('auth.loginOrSignup') || "Se connecter / S'inscrire"}
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
      
      <main className="pt-28 md:pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('services.request.title') || "Demande de Service"}
              </h1>
              <p className="text-muted-foreground">
                {t('services.request.subtitle') || "Sélectionnez le service adapté à vos besoins"}
              </p>
            </div>

            {/* Progress */}
            <div className="mb-8">
              <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
              <div className="flex justify-between mt-4">
                {stepTitles.slice(0, totalSteps).map((step, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center ${
                      index + 1 <= currentStep ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      index + 1 < currentStep 
                        ? "bg-primary text-primary-foreground" 
                        : index + 1 === currentStep 
                          ? "bg-primary/20 border-2 border-primary" 
                          : "bg-muted"
                    }`}>
                      {index + 1 < currentStep ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs hidden md:block text-center">{step[language]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <Card>
              <CardHeader>
                <CardTitle>{stepTitles[currentStep - 1][language]}</CardTitle>
              </CardHeader>
              <CardContent>
                {renderStep()}

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t('common.previous') || "Précédent"}
                  </Button>

                  {currentStep < totalSteps ? (
                    <Button 
                      onClick={nextStep}
                      disabled={currentStep === 1 && !formData.serviceType}
                    >
                      {t('common.next') || "Suivant"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (t('common.loading') || "Envoi...") : (t('common.submit') || "Soumettre")}
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

export default ServiceRequest;
