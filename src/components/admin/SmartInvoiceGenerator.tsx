import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, FileText, Send, User, Search, Check } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import cachetMiprojet from "@/assets/cachet-miprojet.png";
import signatureDG from "@/assets/signature-dg.png";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface ClientData {
  id: string;
  user_id: string;
  name: string;
  company_name: string | null;
  phone: string | null;
  service_type: string | null;
  source: 'profile' | 'request';
  request_id?: string;
}

const serviceOptions = [
  { value: 'structuring', label: 'Structuration de projet', price: 150000 },
  { value: 'orientation', label: 'Orientation stratégique', price: 200000 },
  { value: 'full_service', label: 'Accompagnement complet', price: 350000 },
  { value: 'business_plan', label: 'Rédaction Business Plan', price: 100000 },
  { value: 'feasibility', label: 'Étude de faisabilité', price: 120000 },
  { value: 'risk_analysis', label: 'Analyse des risques', price: 80000 },
  { value: 'training', label: 'Formation / Coaching', price: 50000 },
  { value: 'consulting', label: 'Consultance (par heure)', price: 25000 },
  { value: 'company_creation', label: "Création d'entreprise", price: 75000 },
  { value: 'custom', label: 'Service personnalisé', price: 0 },
];

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MIP-${year}-${random}`;
};

export const SmartInvoiceGenerator = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: generateInvoiceNumber(),
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }] as InvoiceItem[],
    notes: 'Paiement à effectuer dans les 30 jours suivant la réception de cette facture.',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 18,
    deliveryTime: '15 jours ouvrables',
    paymentTerms: 'Paiement intégral avant démarrage des travaux',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const clientsData: ClientData[] = [];

    // Fetch ALL profiles (users)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, phone')
      .order('created_at', { ascending: false });

    if (!profilesError && profiles) {
      profiles.forEach((profile: any) => {
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Sans nom';
        clientsData.push({
          id: profile.id,
          user_id: profile.id,
          name,
          company_name: profile.company_name,
          phone: profile.phone,
          service_type: null,
          source: 'profile'
        });
      });
    }

    // Also fetch service requests for additional context
    const { data: requests, error: requestsError } = await supabase
      .from('service_requests')
      .select(`id, company_name, service_type, user_id, sector`)
      .order('created_at', { ascending: false });

    if (!requestsError && requests) {
      requests.forEach((req: any) => {
        // Check if this user is already in the list
        const existingIndex = clientsData.findIndex(c => c.user_id === req.user_id);
        if (existingIndex >= 0) {
          // Update with service request info
          clientsData[existingIndex].service_type = req.service_type;
          clientsData[existingIndex].request_id = req.id;
        }
      });
    }

    setClients(clientsData);
    setLoading(false);
  };

  const handleSelectClient = (client: ClientData) => {
    setSelectedClient(client);
    setSearchOpen(false);

    setInvoiceData(prev => ({
      ...prev,
      clientName: client.name || client.company_name || '',
      clientPhone: client.phone || '',
      clientEmail: '',
    }));
  };

  const addItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { description: '', quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (invoiceData.items.length === 1) return;
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoiceData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const selectService = (index: number, serviceValue: string) => {
    const service = serviceOptions.find(s => s.value === serviceValue);
    if (service) {
      const newItems = [...invoiceData.items];
      newItems[index] = { 
        ...newItems[index], 
        description: service.label, 
        unitPrice: service.price,
        total: newItems[index].quantity * service.price
      };
      setInvoiceData({ ...invoiceData, items: newItems });
    }
  };

  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxAmount = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSaveAndSend = async () => {
    if (!invoiceData.clientName || !selectedClient) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un demandeur", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Create invoice
      const { data: invoice, error } = await supabase.from('invoices').insert([{
        invoice_number: invoiceData.invoiceNumber,
        user_id: selectedClient.user_id,
        service_request_id: selectedClient.request_id || null,
        items: invoiceData.items as any,
        subtotal: subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: taxAmount,
        total: total,
        due_date: invoiceData.dueDate,
        notes: `${invoiceData.notes}\n\nDélai de livraison: ${invoiceData.deliveryTime}\nModalités: ${invoiceData.paymentTerms}`,
        status: 'pending',
        created_by: user.id
      }]).select().single();

      if (error) throw error;

      // Create notification for the user
      await supabase.from('notifications').insert({
        user_id: selectedClient.user_id,
        title: `Nouvelle facture ${invoiceData.invoiceNumber}`,
        message: `Une facture de ${total.toLocaleString('fr-FR')} FCFA a été émise.`,
        type: 'invoice',
        link: `/dashboard/invoices`
      });

      toast({ 
        title: "Succès", 
        description: `Facture ${invoiceData.invoiceNumber} créée et envoyée` 
      });

      // Reset form
      setInvoiceData({
        ...invoiceData,
        invoiceNumber: generateInvoiceNumber(),
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
      });
      setSelectedClient(null);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return client.name.toLowerCase().includes(searchLower) || 
           (client.company_name?.toLowerCase().includes(searchLower)) ||
           (client.service_type?.toLowerCase().includes(searchLower));
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Générateur de Factures Intelligent
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selector */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Sélectionner le demandeur *
            </Label>
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={searchOpen}
                  className="w-full justify-between"
                >
                  {selectedClient ? (
                    <span>
                      {selectedClient.name}
                      {selectedClient.service_type && ` - ${selectedClient.service_type}`}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Rechercher un demandeur...</span>
                  )}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Rechercher par nom ou entreprise..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {loading ? "Chargement..." : "Aucun demandeur trouvé"}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredClients.map((client) => (
                        <CommandItem
                          key={client.id}
                          value={client.id}
                          onSelect={() => handleSelectClient(client)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{client.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {client.company_name || 'Particulier'}
                              {client.service_type && ` • ${client.service_type}`}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Auto-filled Client Info */}
          {selectedClient && (
            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-xs text-muted-foreground">Nom du client</Label>
                <p className="font-medium">{invoiceData.clientName || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Téléphone</Label>
                <p className="font-medium">{invoiceData.clientPhone || '-'}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Entreprise</Label>
                <p className="font-medium">{selectedClient.company_name || '-'}</p>
              </div>
            </div>
          )}

          {/* Invoice Number */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Numéro de facture</Label>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Lignes de facture</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {invoiceData.items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4 space-y-2">
                    <Label>Service</Label>
                    <Select onValueChange={(v) => selectService(index, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((service) => (
                          <SelectItem key={service.value} value={service.value}>
                            {service.label} {service.price > 0 && `(${service.price.toLocaleString()} FCFA)`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label>Qté</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Prix unitaire</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label>Total</Label>
                    <div className="h-10 flex items-center font-medium">
                      {(item.quantity * item.unitPrice).toLocaleString()}
                    </div>
                  </div>
                  <div className="md:col-span-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={invoiceData.items.length === 1}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Sous-total HT</span>
                <span className="font-medium">{subtotal.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">TVA ({invoiceData.taxRate}%)</span>
                <span className="font-medium">{taxAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total TTC</span>
                <span className="text-primary">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes / Conditions</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              onClick={handleSaveAndSend}
              disabled={saving || !selectedClient}
              className="min-w-40"
            >
              {saving ? (
                <>Envoi en cours...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Créer et Envoyer
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
