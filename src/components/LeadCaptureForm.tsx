import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

const entityTypes = [
  { value: "individual", label: "Particulier / Entrepreneur individuel" },
  { value: "sarl", label: "SARL" },
  { value: "sa", label: "SA" },
  { value: "coop", label: "Coopérative" },
  { value: "association", label: "Association" },
  { value: "ong", label: "ONG" },
  { value: "fondation", label: "Fondation" },
  { value: "startup", label: "Startup" },
  { value: "other", label: "Autre" },
];

const sectors = [
  "Agriculture & Agro-industrie", "Santé", "Éducation", "Digital & Numérique",
  "Énergie", "Immobilier", "Logistique & Transport", "Industrie",
  "Commerce", "Services", "Environnement", "Tourisme", "Autre"
];

interface LeadCaptureFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadSource: "opportunity" | "investor" | "ebook";
  sourceId?: string;
  title?: string;
  description?: string;
  showInvestorFields?: boolean;
}

export const LeadCaptureForm = ({
  open, onClose, onSuccess, leadSource, sourceId,
  title = "Complétez vos informations",
  description = "Renseignez vos coordonnées pour accéder au contenu",
  showInvestorFields = false,
}: LeadCaptureFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "", whatsapp: "",
    country: "", city: "", sector: "", entity_type: "", company_name: "",
    needs: "", difficulties: "",
    investment_capacity: "", risk_tolerance: "",
    interested_sectors: [] as string[],
    wants_project_proposals: false,
    wants_foundation_participation: false,
  });

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleSector = (s: string) => {
    setForm(prev => ({
      ...prev,
      interested_sectors: prev.interested_sectors.includes(s)
        ? prev.interested_sectors.filter(x => x !== s)
        : [...prev.interested_sectors, s]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.country || !form.entity_type) {
      toast({ title: "Champs requis", description: "Veuillez remplir tous les champs obligatoires (*)", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("leads" as any).insert([{
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      country: form.country || null,
      city: form.city || null,
      sector: form.sector || null,
      entity_type: form.entity_type || null,
      company_name: form.company_name || null,
      needs: form.needs || null,
      difficulties: form.difficulties || null,
      lead_source: leadSource,
      source_id: sourceId || null,
      investment_capacity: form.investment_capacity || null,
      risk_tolerance: form.risk_tolerance || null,
      interested_sectors: form.interested_sectors.length > 0 ? form.interested_sectors : null,
      wants_project_proposals: form.wants_project_proposals,
      wants_foundation_participation: form.wants_foundation_participation,
    }]);

    // Send confirmation email with download link
    if (!error && sourceId) {
      try {
        const { data: docData } = await supabase
          .from('platform_documents')
          .select('title, file_url')
          .eq('id', sourceId)
          .single();
        if (docData?.file_url) {
          await supabase.functions.invoke('send-lead-confirmation', {
            body: {
              email: form.email,
              firstName: form.first_name,
              documentTitle: docData.title,
              downloadUrl: docData.file_url,
            }
          });
        }
      } catch (emailErr) {
        console.error('Email confirmation error:', emailErr);
      }
    }

    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'enregistrer vos informations", variant: "destructive" });
    } else {
      setSuccess(true);
      setTimeout(() => { onSuccess(); setSuccess(false); }, 1500);
    }
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Merci !</h3>
            <p className="text-muted-foreground">Vos informations ont été enregistrées. Accès en cours...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Prénom *</Label>
              <Input value={form.first_name} onChange={e => handleChange("first_name", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input value={form.last_name} onChange={e => handleChange("last_name", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => handleChange("email", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Téléphone *</Label>
              <Input value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="+225..." required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>WhatsApp *</Label>
              <Input value={form.whatsapp} onChange={e => handleChange("whatsapp", e.target.value)} placeholder="+225..." required />
            </div>
            <div className="space-y-1">
              <Label>Type d'entité *</Label>
              <Select value={form.entity_type} onValueChange={v => handleChange("entity_type", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {entityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Pays *</Label>
              <Input value={form.country} onChange={e => handleChange("country", e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Ville *</Label>
              <Input value={form.city} onChange={e => handleChange("city", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Secteur d'activité</Label>
              <Select value={form.sector} onValueChange={v => handleChange("sector", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nom de l'entreprise</Label>
              <Input value={form.company_name} onChange={e => handleChange("company_name", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Besoins supplémentaires</Label>
            <Textarea value={form.needs} onChange={e => handleChange("needs", e.target.value)} rows={2} placeholder="Décrivez vos besoins..." />
          </div>

          <div className="space-y-1">
            <Label>Difficultés entrepreneuriales</Label>
            <Textarea value={form.difficulties} onChange={e => handleChange("difficulties", e.target.value)} rows={2} placeholder="Quelles sont vos principales difficultés ?" />
          </div>

          {showInvestorFields && (
            <>
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Informations investisseur</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Capacité d'investissement</Label>
                    <Select value={form.investment_capacity} onValueChange={v => handleChange("investment_capacity", v)}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="< 5M FCFA">Moins de 5M FCFA</SelectItem>
                        <SelectItem value="5M-25M FCFA">5M - 25M FCFA</SelectItem>
                        <SelectItem value="25M-100M FCFA">25M - 100M FCFA</SelectItem>
                        <SelectItem value="100M-500M FCFA">100M - 500M FCFA</SelectItem>
                        <SelectItem value="> 500M FCFA">Plus de 500M FCFA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Tolérance au risque</Label>
                    <Select value={form.risk_tolerance} onValueChange={v => handleChange("risk_tolerance", v)}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservateur</SelectItem>
                        <SelectItem value="moderate">Modéré</SelectItem>
                        <SelectItem value="aggressive">Dynamique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4">
                  <Label className="mb-2 block">Secteurs d'intérêt</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sectors.map(s => (
                      <div key={s} className="flex items-center space-x-2">
                        <Checkbox
                          id={`sec-${s}`}
                          checked={form.interested_sectors.includes(s)}
                          onCheckedChange={() => toggleSector(s)}
                        />
                        <Label htmlFor={`sec-${s}`} className="text-xs cursor-pointer">{s}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="proposals" checked={form.wants_project_proposals}
                      onCheckedChange={c => handleChange("wants_project_proposals", c === true)} />
                    <Label htmlFor="proposals" className="text-sm cursor-pointer">
                      Je souhaite recevoir des propositions de projets innovants
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="foundation" checked={form.wants_foundation_participation}
                      onCheckedChange={c => handleChange("wants_foundation_participation", c === true)} />
                    <Label htmlFor="foundation" className="text-sm cursor-pointer">
                      Je souhaite participer aux fondations et co-investissements
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Accéder au contenu
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
