import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Handshake, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  tenderId: string;
  tenderTitle: string;
}

export const TenderInterestButton = ({ tenderId, tenderTitle }: Props) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [sectorOptions, setSectorOptions] = useState<string[]>([]);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", company: "", country: "", sector: "", message: "",
  });

  useEffect(() => {
    if (!open || sectorOptions.length) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("tenders")
        .select("sector")
        .eq("status", "active")
        .not("sector", "is", null)
        .limit(1000);
      const sectors = Array.from(new Set((data || []).map((t: any) => t.sector).filter(Boolean))).sort() as string[];
      setSectorOptions(sectors);
    })();
  }, [open, sectorOptions.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email) {
      toast({ title: "Champs requis", description: "Nom complet et email obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await (supabase as any).from("tender_interests").insert({
      tender_id: tenderId,
      nom: form.full_name.trim(),
      email: form.email.trim(),
      telephone: form.phone.trim() || null,
      entreprise: form.company.trim() || null,
      pays: form.country.trim() || null,
      secteur: form.sector.trim() || null,
      message: form.message.trim() || null,
    });
    setLoading(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    toast({
      title: "Intérêt enregistré ✓",
      description: "Notre équipe et dgMarket vous recontactent rapidement.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setDone(false); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="font-bold">
          <Handshake className="h-4 w-4 mr-2" /> Je suis intéressé(e)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Marquer mon intérêt</DialogTitle>
          <DialogDescription className="line-clamp-2">{tenderTitle}</DialogDescription>
        </DialogHeader>
        {done ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success" />
            <p className="font-semibold">Votre intérêt a bien été transmis.</p>
            <p className="text-sm text-muted-foreground">
              MIPROJET et son partenaire dgMarket vous recontactent sous peu.
            </p>
            <Button onClick={() => setOpen(false)} variant="outline">Fermer</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nom complet *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
              <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Entreprise</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
              <div><Label>Pays</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></div>
              <div className="col-span-2">
                <Label>Secteur d'activité</Label>
                <Input
                  list="tender-sector-options"
                  value={form.sector}
                  onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  placeholder="Choisir ou saisir un secteur"
                />
                <datalist id="tender-sector-options">
                  {sectorOptions.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
              <div className="col-span-2"><Label>Message (optionnel)</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full font-bold">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Envoyer mon intérêt
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Vos coordonnées seront transmises à MIPROJET et à son partenaire dgMarket pour suivi.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
