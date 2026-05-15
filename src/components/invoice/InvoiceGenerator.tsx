import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Download, Printer, FileText, Eye } from "lucide-react";
import { InvoicePreview } from "./InvoicePreview";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  items: InvoiceItem[];
  notes: string;
  dueDate: string;
  taxRate: number;
}

const serviceOptions = [
  { value: 'structuring', label: 'Structuration de projet', price: 150000 },
  { value: 'funding_search', label: 'Recherche de financement', price: 200000 },
  { value: 'full_service', label: 'Accompagnement complet', price: 350000 },
  { value: 'business_plan', label: 'Rédaction Business Plan', price: 100000 },
  { value: 'feasibility', label: 'Étude de faisabilité', price: 120000 },
  { value: 'risk_analysis', label: 'Analyse des risques', price: 80000 },
  { value: 'training', label: 'Formation / Coaching', price: 50000 },
  { value: 'consulting', label: 'Consultance (par heure)', price: 25000 },
  { value: 'company_creation', label: 'Création d\'entreprise', price: 75000 },
  { value: 'custom', label: 'Service personnalisé', price: 0 },
];

// Generate invoice number with format MIP-YYYY-XXXX
const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  return `MIP-${year}-${random}`;
};

export const InvoiceGenerator = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: generateInvoiceNumber(),
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
    notes: 'Paiement à effectuer dans les 30 jours suivant la réception de cette facture.',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 18,
  });

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

  const handleSaveInvoice = async () => {
    if (!invoiceData.clientName) {
      toast({ title: "Erreur", description: "Le nom du client est requis", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase.from('invoices').insert([{
        invoice_number: invoiceData.invoiceNumber,
        user_id: user.id,
        items: invoiceData.items as any,
        subtotal: subtotal,
        tax_rate: invoiceData.taxRate,
        tax_amount: taxAmount,
        total: total,
        due_date: invoiceData.dueDate,
        notes: invoiceData.notes,
        status: 'draft',
        created_by: user.id
      }]).select().single();

      if (error) throw error;

      toast({ title: "Succès", description: `Facture ${invoiceData.invoiceNumber} créée avec succès` });
      setShowPreview(true);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // First show preview, then trigger print which can save as PDF
    setShowPreview(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const regenerateNumber = () => {
    setInvoiceData({ ...invoiceData, invoiceNumber: generateInvoiceNumber() });
  };

  if (showPreview) {
    return (
      <InvoicePreview
        invoiceData={invoiceData}
        subtotal={subtotal}
        taxAmount={taxAmount}
        total={total}
        onBack={() => setShowPreview(false)}
        onPrint={handlePrint}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('invoice.newInvoice')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Invoice Number */}
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>{t('invoice.number')}</Label>
              <Input
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                className="font-mono"
              />
            </div>
            <Button variant="outline" onClick={regenerateNumber} type="button">
              {t('invoice.regenerate')}
            </Button>
          </div>

          {/* Client Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('invoice.clientName')} *</Label>
              <Input
                value={invoiceData.clientName}
                onChange={(e) => setInvoiceData({ ...invoiceData, clientName: e.target.value })}
                placeholder="Kouassi Yao Marcel"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.email')}</Label>
              <Input
                type="email"
                value={invoiceData.clientEmail}
                onChange={(e) => setInvoiceData({ ...invoiceData, clientEmail: e.target.value })}
                placeholder="client@exemple.ci"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('common.phone')}</Label>
              <Input
                value={invoiceData.clientPhone}
                onChange={(e) => setInvoiceData({ ...invoiceData, clientPhone: e.target.value })}
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('invoice.dueDate')}</Label>
              <Input
                type="date"
                value={invoiceData.dueDate}
                onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('common.address')}</Label>
            <Textarea
              value={invoiceData.clientAddress}
              onChange={(e) => setInvoiceData({ ...invoiceData, clientAddress: e.target.value })}
              placeholder="Abidjan, Côte d'Ivoire"
              rows={2}
            />
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">{t('invoice.items')}</Label>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                {t('invoice.addItem')}
              </Button>
            </div>

            {invoiceData.items.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="grid md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4 space-y-2">
                    <Label>{t('invoice.service')}</Label>
                    <Select onValueChange={(v) => selectService(index, v)}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('invoice.selectService')} />
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
                    <Label>{t('common.description')}</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Description du service"
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label>{t('invoice.qty')}</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>{t('invoice.unitPrice')}</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label>{t('common.total')}</Label>
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
          <div className="border-t pt-4">
            <div className="flex justify-end">
              <div className="w-full md:w-1/3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.subtotal')}</span>
                  <span>{subtotal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground">{t('invoice.vat')}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={invoiceData.taxRate}
                      onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
                    />
                    <span>%</span>
                  </div>
                  <span>{taxAmount.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>{t('invoice.totalTTC')}</span>
                  <span className="text-primary">{total.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('invoice.notes')}</Label>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
              placeholder="Conditions de paiement, notes particulières..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              {t('invoice.preview')}
            </Button>
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              {t('invoice.exportPDF')}
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              {t('common.print')}
            </Button>
            <Button onClick={handleSaveInvoice} disabled={saving}>
              <FileText className="h-4 w-4 mr-2" />
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
