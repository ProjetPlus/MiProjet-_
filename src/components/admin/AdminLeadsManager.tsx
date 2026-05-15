import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Eye, Download, Loader2, Users, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { LeadsSourceChart } from "./LeadsSourceChart";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  country: string | null;
  city: string | null;
  sector: string | null;
  entity_type: string | null;
  company_name: string | null;
  needs: string | null;
  difficulties: string | null;
  lead_source: string;
  source_id: string | null;
  investment_capacity: string | null;
  risk_tolerance: string | null;
  interested_sectors: string[] | null;
  wants_project_proposals: boolean;
  wants_foundation_participation: boolean;
  created_at: string;
}

export const AdminLeadsManager = () => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => { fetchLeads(); }, [filterSource]);

  const fetchLeads = async () => {
    setLoading(true);
    let query = supabase.from("leads" as any).select("*").order("created_at", { ascending: false });
    if (filterSource !== "all") query = query.eq("lead_source", filterSource);
    const { data } = await query;
    if (data) setLeads(data as any);
    setLoading(false);
  };

  const deleteLead = async (id: string) => {
    if (!confirm("Supprimer ce lead ?")) return;
    await supabase.from("leads" as any).delete().eq("id", id);
    toast({ title: "Lead supprimé" });
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ["Prénom", "Nom", "Email", "Téléphone", "WhatsApp", "Pays", "Ville", "Secteur", "Type", "Entreprise", "Source", "Date"];
    const rows = leads.map(l => [
      l.first_name, l.last_name, l.email, l.phone || "", l.whatsapp || "",
      l.country || "", l.city || "", l.sector || "", l.entity_type || "",
      l.company_name || "", l.lead_source, format(new Date(l.created_at), "dd/MM/yyyy")
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-miprojet-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "opportunity": return <Badge className="bg-primary/10 text-primary">Opportunité</Badge>;
      case "investor": return <Badge className="bg-success/10 text-success">Investisseur</Badge>;
      case "ebook": return <Badge className="bg-warning/10 text-warning">E-book</Badge>;
      case "signup": return <Badge className="bg-info/10 text-info">Inscription</Badge>;
      case "service_request": return <Badge className="bg-secondary/10 text-secondary">Demande service</Badge>;
      case "referral": return <Badge className="bg-accent/10 text-accent-foreground">Parrainage</Badge>;
      case "event": return <Badge variant="secondary">Événement</Badge>;
      case "contact": return <Badge variant="outline">Contact</Badge>;
      default: return <Badge variant="outline">{source}</Badge>;
    }
  };

  const filtered = leads.filter(l =>
    l.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" /> Leads & Contacts
          </h1>
          <p className="text-muted-foreground text-sm">{leads.length} contacts capturés</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" /> Exporter CSV
        </Button>
      </div>

      {/* Source distribution chart */}
      <LeadsSourceChart leads={leads} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sources</SelectItem>
                <SelectItem value="signup">Inscription</SelectItem>
                <SelectItem value="service_request">Demande de service</SelectItem>
                <SelectItem value="referral">Parrainage</SelectItem>
                <SelectItem value="event">Événement</SelectItem>
                <SelectItem value="contact">Contact</SelectItem>
                <SelectItem value="opportunity">Opportunités</SelectItem>
                <SelectItem value="investor">Investisseurs</SelectItem>
                <SelectItem value="ebook">E-book</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucun lead</TableCell></TableRow>
                  ) : filtered.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.first_name} {lead.last_name}</TableCell>
                      <TableCell>
                        <a href={`mailto:${lead.email}`} className="text-primary hover:underline flex items-center gap-1">
                          <Mail className="h-3 w-3" />{lead.email}
                        </a>
                      </TableCell>
                      <TableCell>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />{lead.phone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{getSourceBadge(lead.lead_source)}</TableCell>
                      <TableCell>{lead.country || "-"}</TableCell>
                      <TableCell>{format(new Date(lead.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setSelectedLead(lead)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => deleteLead(lead.id)}><Trash2 className="h-4 w-4" /></Button>
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

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du lead</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><strong>Prénom:</strong> {selectedLead.first_name}</div>
                <div><strong>Nom:</strong> {selectedLead.last_name}</div>
                <div><strong>Email:</strong> {selectedLead.email}</div>
                <div><strong>Téléphone:</strong> {selectedLead.phone || "-"}</div>
                <div><strong>WhatsApp:</strong> {selectedLead.whatsapp || "-"}</div>
                <div><strong>Pays:</strong> {selectedLead.country || "-"}</div>
                <div><strong>Ville:</strong> {selectedLead.city || "-"}</div>
                <div><strong>Secteur:</strong> {selectedLead.sector || "-"}</div>
                <div><strong>Type:</strong> {selectedLead.entity_type || "-"}</div>
                <div><strong>Entreprise:</strong> {selectedLead.company_name || "-"}</div>
              </div>
              {selectedLead.needs && <div><strong>Besoins:</strong> {selectedLead.needs}</div>}
              {selectedLead.difficulties && <div><strong>Difficultés:</strong> {selectedLead.difficulties}</div>}
              {selectedLead.investment_capacity && <div><strong>Capacité d'investissement:</strong> {selectedLead.investment_capacity}</div>}
              {selectedLead.risk_tolerance && <div><strong>Tolérance au risque:</strong> {selectedLead.risk_tolerance}</div>}
              {selectedLead.interested_sectors && selectedLead.interested_sectors.length > 0 && (
                <div>
                  <strong>Secteurs d'intérêt:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedLead.interested_sectors.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                </div>
              )}
              {selectedLead.wants_project_proposals && <Badge className="bg-success/10 text-success">Souhaite recevoir des propositions</Badge>}
              {selectedLead.wants_foundation_participation && <Badge className="bg-primary/10 text-primary">Intéressé par les fondations</Badge>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
