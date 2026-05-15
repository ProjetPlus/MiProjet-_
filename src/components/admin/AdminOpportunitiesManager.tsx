import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Plus, Edit, Trash2, Check, X, Search, Briefcase, ExternalLink, BarChart3, Loader2, Send, RefreshCw, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UniversalAIEditor, type EditorField } from "./UniversalAIEditor";
import { WYSIWYGEditor } from "./WYSIWYGEditor";
import { purgeOgCache, openOgDebug } from "@/lib/ogPurge";

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  content: string;
  opportunity_type: string;
  category: string;
  image_url: string | null;
  deadline: string | null;
  location: string | null;
  eligibility: string | null;
  amount_min: number | null;
  amount_max: number | null;
  currency: string;
  external_link: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_featured: boolean;
  is_active: boolean;
  status: string;
  views_count: number;
  created_at: string;
  short_slug?: string | null;
}

const opportunityTypes = [
  { value: 'grant', label: 'Subvention' },
  { value: 'investment', label: 'Investissement' },
  { value: 'prize', label: 'Prix / Concours' },
  { value: 'loan', label: 'Prêt' },
  { value: 'funding', label: 'Financement' },
  { value: 'training', label: 'Formation' },
  { value: 'accompaniment', label: 'Accompagnement' },
  { value: 'partnership', label: 'Partenariat' },
  { value: 'other', label: 'Autre' },
];

const opportunityCategories = [
  { value: "general", label: "Général" },
  { value: "agriculture", label: "Agriculture" },
  { value: "digital", label: "Digital & Numérique" },
  { value: "climate", label: "Climat & Environnement" },
  { value: "health", label: "Santé" },
  { value: "education", label: "Éducation" },
  { value: "energy", label: "Énergie" },
  { value: "funding", label: "Financement" },
  { value: "training", label: "Formation" },
  { value: "grants", label: "Subventions" },
  { value: "partnerships", label: "Partenariats" },
];

const competitivityLevels = [
  { value: "low", label: "Faible" },
  { value: "medium", label: "Moyen" },
  { value: "high", label: "Élevé" },
];

const eligibleBeneficiaries = [
  "ONG", "Entreprise", "Startup", "Institution", "Association", "Université", "Coopérative", "Groupement"
];

const editorFields: EditorField[] = [
  { name: 'title', label: 'Titre de l\'appel', type: 'text', placeholder: 'Ex: Appel à projets PME innovantes 2026', required: true },
  { name: 'author_name', label: 'Auteur (nom affiché)', type: 'text', placeholder: 'Ex: Rédaction MIPROJET' },
  { name: 'image_url', label: 'Image', type: 'upload-image', maxSize: 20 },
];

export const AdminOpportunitiesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Opportunity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [formData, setFormData] = useState<Record<string, any>>({
    // Section A - Identité
    title: "", organisme: "", opportunity_type: "grant", location: "",
    category: "general", deadline: "", external_link: "", image_url: "",
    // Section B - Financement
    amount_min: "", amount_max: "", currency: "XOF", cofinancement: "", budget_programme: "",
    // Section C - Éligibilité
    beneficiaires: [] as string[], duree_min: "", duree_max: "", eligibility: "",
    // Section D - Contenu stratégique
    objectif: "", activites_financees: "", description: "", content: "",
    competitivite: "medium", recommandation: "",
    // Section E - Diffusion
    send_to_premium: false, publish_member_space: true, scheduled_date: "",
    // Contact
    contact_email: "info@ivoireprojet.com", contact_phone: "+225 07 07 16 79 21",
    is_featured: false, is_premium: false, author_name: "",
  });

  useEffect(() => { fetchOpportunities(); }, [filterType, filterStatus]);

  const fetchOpportunities = async () => {
    setLoading(true);
    let query = supabase.from('opportunities').select('*').order('created_at', { ascending: false });
    if (filterType !== "all") query = query.eq('opportunity_type', filterType);
    if (filterStatus !== "all") query = query.eq('status', filterStatus);
    const { data } = await query;
    if (data) setOpportunities(data);
    setLoading(false);
  };

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleBeneficiaire = (b: string) => {
    setFormData(prev => {
      const current = prev.beneficiaires || [];
      return {
        ...prev,
        beneficiaires: current.includes(b) ? current.filter((x: string) => x !== b) : [...current, b]
      };
    });
  };

  const buildContent = () => {
    let content = "";
    if (formData.organisme) content += `**Organisme / Bailleur :** ${formData.organisme}\n\n`;
    if (formData.objectif) content += `## Objectif de l'appel\n${formData.objectif}\n\n`;
    if (formData.activites_financees) content += `## Activités financées\n${formData.activites_financees}\n\n`;
    if (formData.content) content += `## Détails\n${formData.content}\n\n`;
    if (formData.recommandation) content += `## Recommandation MIPROJET\n${formData.recommandation}\n\n`;
    return content || formData.content || "";
  };

  const buildEligibility = () => {
    let elig = "";
    if (formData.beneficiaires?.length > 0) {
      elig += `Bénéficiaires éligibles : ${formData.beneficiaires.join(", ")}\n`;
    }
    if (formData.duree_min || formData.duree_max) {
      elig += `Durée du projet : ${formData.duree_min || "?"} – ${formData.duree_max || "?"} mois\n`;
    }
    if (formData.eligibility) elig += formData.eligibility;
    return elig || null;
  };

  const handleSubmit = async (e: React.FormEvent, publishDirectly = false) => {
    e.preventDefault();
    if (!user) return;
    
    const opportunityData = {
      title: formData.title,
      description: formData.description || null,
      content: buildContent(),
      opportunity_type: formData.opportunity_type || 'grant',
      category: formData.category || 'general',
      image_url: formData.image_url || null,
      amount_min: formData.amount_min ? parseFloat(formData.amount_min) : null,
      amount_max: formData.amount_max ? parseFloat(formData.amount_max) : null,
      deadline: formData.deadline || null,
      location: formData.location || null,
      eligibility: buildEligibility(),
      external_link: formData.external_link || null,
      contact_email: formData.contact_email || null,
      contact_phone: formData.contact_phone || null,
      currency: formData.currency || 'XOF',
      is_featured: formData.is_featured || false,
      is_premium: formData.is_premium || false,
      author_id: user.id,
      author_name: formData.author_name?.trim() || null,
      ...(publishDirectly ? { status: 'published', published_at: new Date().toISOString() } : {}),
    };

    if (editingItem) {
      const { error } = await supabase.from('opportunities').update(opportunityData).eq('id', editingItem.id);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
      else {
        toast({ title: "Succès", description: publishDirectly ? "Publiée !" : "Modifiée" });
        const slug = (editingItem as any).short_slug;
        if ((editingItem.status === 'published' || publishDirectly) && slug) {
          purgeOgCache("opportunites", slug);
        }
        fetchOpportunities(); resetForm();
      }
    } else {
      const { error } = await supabase.from('opportunities').insert([opportunityData]);
      if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Succès", description: publishDirectly ? "Publiée !" : "Créée en brouillon" }); fetchOpportunities(); resetForm(); }
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === 'published') updates.published_at = new Date().toISOString();
    const { error } = await supabase.from('opportunities').update(updates).eq('id', id);
    if (!error) {
      toast({ title: "Succès" });
      if (status === 'published') {
        const item = opportunities.find(o => o.id === id);
        if (item?.short_slug) purgeOgCache("opportunites", item.short_slug);
      }
      fetchOpportunities();
    }
  };

  const refreshSocialPreview = async (slug: string | null | undefined) => {
    if (!slug) {
      toast({ title: "Slug manquant", description: "Publiez d'abord l'opportunité", variant: "destructive" });
      return;
    }
    toast({ title: "Rafraîchissement...", description: "Purge du cache social en cours" });
    const res = await purgeOgCache("opportunites", slug);
    if (res.ok) toast({ title: "Aperçu social rafraîchi" });
    else toast({ title: "Échec purge", description: res.error, variant: "destructive" });
  };

  const deleteOpportunity = async (id: string) => {
    if (!confirm("Supprimer cette opportunité ?")) return;
    const { error } = await supabase.from('opportunities').delete().eq('id', id);
    if (!error) { toast({ title: "Supprimée" }); fetchOpportunities(); }
  };

  const resetForm = () => {
    setFormData({
      title: "", organisme: "", opportunity_type: "grant", location: "",
      category: "general", deadline: "", external_link: "", image_url: "",
      amount_min: "", amount_max: "", currency: "XOF", cofinancement: "", budget_programme: "",
      beneficiaires: [], duree_min: "", duree_max: "", eligibility: "",
      objectif: "", activites_financees: "", description: "", content: "",
      competitivite: "medium", recommandation: "",
      send_to_premium: false, publish_member_space: true, scheduled_date: "",
      contact_email: "info@ivoireprojet.com", contact_phone: "+225 07 07 16 79 21",
      is_featured: false, is_premium: false,
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (item: Opportunity) => {
    setEditingItem(item);
    setFormData({
      title: item.title, organisme: "", opportunity_type: item.opportunity_type,
      category: item.category, image_url: item.image_url || "",
      deadline: item.deadline || "", location: item.location || "",
      eligibility: item.eligibility || "", description: item.description || "",
      content: item.content, amount_min: item.amount_min?.toString() || "",
      amount_max: item.amount_max?.toString() || "", currency: item.currency,
      external_link: item.external_link || "",
      contact_email: item.contact_email || "info@ivoireprojet.com",
      contact_phone: item.contact_phone || "+225 07 07 16 79 21",
      is_featured: item.is_featured, is_premium: (item as any).is_premium || false, beneficiaires: [], duree_min: "", duree_max: "",
      objectif: "", activites_financees: "", competitivite: "medium", recommandation: "",
      cofinancement: "", budget_programme: "",
      send_to_premium: false, publish_member_space: true, scheduled_date: "",
    });
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published': return <Badge className="bg-success text-success-foreground">Publié</Badge>;
      case 'archived': return <Badge variant="secondary">Archivé</Badge>;
      default: return <Badge variant="outline">Brouillon</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const t = opportunityTypes.find(t => t.value === type);
    return <Badge variant="outline">{t?.label || type}</Badge>;
  };

  const filteredOpportunities = opportunities.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Briefcase className="h-7 w-7" />Publication Appel à Projets – Club MIPROJET
          </h1>
          <p className="text-muted-foreground text-sm">Formulaire complet de publication d'opportunités</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />Nouvel appel à projets
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingItem ? "Modifier l'appel" : "📋 Publication Appel à Projets – Club MIPROJET"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
              {/* SECTION A – IDENTITÉ DE L'APPEL */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">SECTION A – Identité de l'appel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <UniversalAIEditor
                    fields={editorFields}
                    values={formData}
                    onChange={handleFieldChange}
                    contentFieldName="content"
                    storageFolder="news-media"
                    shareKind="opportunity"
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organisme / Bailleur *</Label>
                      <Input value={formData.organisme} onChange={(e) => handleFieldChange('organisme', e.target.value)} placeholder="Ex: Banque Mondiale, BAD, UE..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Type de financement</Label>
                      <Select value={formData.opportunity_type} onValueChange={(v) => handleFieldChange('opportunity_type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {opportunityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Zone géographique éligible</Label>
                      <Input value={formData.location} onChange={(e) => handleFieldChange('location', e.target.value)} placeholder="Afrique de l'Ouest, Côte d'Ivoire..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Secteur / Thématique</Label>
                      <Select value={formData.category} onValueChange={(v) => handleFieldChange('category', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {opportunityCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Date limite</Label>
                      <Input type="date" value={formData.deadline} onChange={(e) => handleFieldChange('deadline', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><ExternalLink className="h-3 w-3" />Lien officiel</Label>
                    <Input value={formData.external_link} onChange={(e) => handleFieldChange('external_link', e.target.value)} placeholder="https://..." />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION B – FINANCEMENT */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">SECTION B – Financement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Budget minimum</Label>
                      <Input type="number" value={formData.amount_min} onChange={(e) => handleFieldChange('amount_min', e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget maximum</Label>
                      <Input type="number" value={formData.amount_max} onChange={(e) => handleFieldChange('amount_max', e.target.value)} placeholder="100 000 000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Devise</Label>
                      <Select value={formData.currency} onValueChange={(v) => handleFieldChange('currency', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Taux de cofinancement (si applicable)</Label>
                      <Input value={formData.cofinancement} onChange={(e) => handleFieldChange('cofinancement', e.target.value)} placeholder="Ex: 20% d'apport personnel" />
                    </div>
                    <div className="space-y-2">
                      <Label>Budget total du programme (si disponible)</Label>
                      <Input value={formData.budget_programme} onChange={(e) => handleFieldChange('budget_programme', e.target.value)} placeholder="Ex: 5 milliards FCFA" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SECTION C – ÉLIGIBILITÉ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">SECTION C – Éligibilité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-3 block">Bénéficiaires éligibles</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {eligibleBeneficiaries.map((b) => (
                        <div key={b} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ben-${b}`}
                            checked={formData.beneficiaires?.includes(b)}
                            onCheckedChange={() => toggleBeneficiaire(b)}
                          />
                          <Label htmlFor={`ben-${b}`} className="text-sm cursor-pointer">{b}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Durée min du projet (mois)</Label>
                      <Input value={formData.duree_min} onChange={(e) => handleFieldChange('duree_min', e.target.value)} placeholder="6" />
                    </div>
                    <div className="space-y-2">
                      <Label>Durée max du projet (mois)</Label>
                      <Input value={formData.duree_max} onChange={(e) => handleFieldChange('duree_max', e.target.value)} placeholder="24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Critères d'éligibilité supplémentaires</Label>
                    <Textarea value={formData.eligibility} onChange={(e) => handleFieldChange('eligibility', e.target.value)} rows={3} placeholder="Autres critères spécifiques..." />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION D – CONTENU STRATÉGIQUE */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">SECTION D – Contenu stratégique</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Objectif de l'appel</Label>
                    <Textarea value={formData.objectif} onChange={(e) => handleFieldChange('objectif', e.target.value)} rows={3} placeholder="Décrivez l'objectif principal de cet appel..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Activités financées</Label>
                    <Textarea value={formData.activites_financees} onChange={(e) => handleFieldChange('activites_financees', e.target.value)} rows={3} placeholder="Listez les activités qui seront financées..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Résumé stratégique (5 à 10 lignes)</Label>
                    <Textarea value={formData.description} onChange={(e) => handleFieldChange('description', e.target.value)} rows={4} placeholder="Résumé concis pour les membres..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Analyse MIPROJET (votre valeur ajoutée)</Label>
                    <WYSIWYGEditor
                      value={formData.content}
                      onChange={(html) => handleFieldChange('content', html)}
                      placeholder="Analyse approfondie, contexte, conseils stratégiques. Utilisez la barre d'outils pour formater, insérer images / documents / vidéos. Cliquez sur « Générer avec IA » pour structurer automatiquement."
                      minHeight="320px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Niveau de compétitivité</Label>
                    <Select value={formData.competitivite} onValueChange={(v) => handleFieldChange('competitivite', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {competitivityLevels.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recommandation MIPROJET (À qui c'est fortement conseillé)</Label>
                    <Textarea value={formData.recommandation} onChange={(e) => handleFieldChange('recommandation', e.target.value)} rows={2} placeholder="Fortement conseillé aux PME agricoles..." />
                  </div>
                </CardContent>
              </Card>

              {/* SECTION E – DIFFUSION */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-primary">SECTION E – Diffusion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="send_premium" checked={formData.send_to_premium}
                        onCheckedChange={(checked) => handleFieldChange('send_to_premium', checked === true)} />
                      <Label htmlFor="send_premium" className="cursor-pointer">Envoyer automatiquement aux abonnés Premium/Élite</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="publish_space" checked={formData.publish_member_space}
                        onCheckedChange={(checked) => handleFieldChange('publish_member_space', checked === true)} />
                      <Label htmlFor="publish_space" className="cursor-pointer">Publier dans l'espace membre</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is_featured" checked={formData.is_featured}
                        onCheckedChange={(checked) => handleFieldChange('is_featured', checked === true)} />
                      <Label htmlFor="is_featured" className="cursor-pointer">Mettre en avant (À la une)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is_premium" checked={formData.is_premium}
                        onCheckedChange={(checked) => handleFieldChange('is_premium', checked === true)} />
                      <Label htmlFor="is_premium" className="cursor-pointer font-semibold text-amber-600">
                        🔒 Opportunité Premium (réservée aux abonnés)
                      </Label>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Programmer une date d'envoi</Label>
                      <Input type="datetime-local" value={formData.scheduled_date} onChange={(e) => handleFieldChange('scheduled_date', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email de contact</Label>
                      <Input type="email" value={formData.contact_email} onChange={(e) => handleFieldChange('contact_email', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={formData.contact_phone} onChange={(e) => handleFieldChange('contact_phone', e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                <Button type="submit" variant="outline">{editingItem ? "Modifier" : "Enregistrer brouillon"}</Button>
                <Button type="button" onClick={(e) => handleSubmit(e as any, true)} className="bg-success text-success-foreground hover:bg-success/90">
                  <Check className="h-4 w-4 mr-2" />Publier maintenant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {opportunityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="published">Publié</SelectItem>
                <SelectItem value="archived">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead className="text-center"><BarChart3 className="h-3 w-3 inline mr-1" />Vues</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunities.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucune opportunité</TableCell></TableRow>
                  ) : filteredOpportunities.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium line-clamp-1">{item.title}</p>
                          {item.is_featured && <Badge variant="secondary" className="mt-1 text-xs">À la une</Badge>}
                          {item.external_link && (
                            <a href={item.external_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                              <ExternalLink className="h-3 w-3" />Lien
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(item.opportunity_type)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.deadline ? format(new Date(item.deadline), 'dd/MM/yyyy') : '-'}</TableCell>
                      <TableCell className="text-center">{item.views_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {item.status === 'draft' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'published')} title="Publier"><Check className="h-4 w-4" /></Button>
                          )}
                          {item.status === 'published' && (
                            <Button size="sm" variant="outline" onClick={() => updateStatus(item.id, 'archived')} title="Archiver"><X className="h-4 w-4" /></Button>
                          )}
                          {item.status === 'published' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => refreshSocialPreview(item.short_slug)} title="Rafraîchir aperçu social">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => openOgDebug("opportunites", item.short_slug)} title="Vérifier OG (debug)">
                                <Link2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openEditDialog(item)} title="Modifier"><Edit className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteOpportunity(item.id)} title="Supprimer"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
