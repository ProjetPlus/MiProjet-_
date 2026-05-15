import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FileText, Download, Search, Filter, Eye, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Invoice {
  id: string;
  invoice_number: string;
  status: string | null;
  subtotal: number;
  tax_amount: number | null;
  total: number;
  currency: string | null;
  created_at: string;
  due_date: string | null;
  paid_at: string | null;
  items: unknown;
  notes: string | null;
}

export const InvoiceHistory = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    const loadInvoices = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInvoices(data);
        setFilteredInvoices(data);
      }
      setLoading(false);
    };

    loadInvoices();
  }, [user]);

  useEffect(() => {
    let result = [...invoices];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv =>
        inv.invoice_number.toLowerCase().includes(query) ||
        inv.notes?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(inv => inv.status === statusFilter);
    }

    setFilteredInvoices(result);
  }, [searchQuery, statusFilter, invoices]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      draft: { variant: "secondary", label: "Brouillon" },
      pending: { variant: "outline", label: "En attente" },
      paid: { variant: "default", label: "Payée" },
      overdue: { variant: "destructive", label: "En retard" },
      cancelled: { variant: "destructive", label: "Annulée" },
    };
    const c = config[status] || { variant: "secondary", label: status };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const handlePrint = (invoice: Invoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsArray = Array.isArray(invoice.items) ? invoice.items : [];
    const itemsHtml = itemsArray.map((item: any) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.description || ''}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.unitPrice || 0).toLocaleString()} ${invoice.currency || 'XOF'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${(item.total || 0).toLocaleString()} ${invoice.currency || 'XOF'}</td>
        </tr>
      `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Facture ${invoice.invoice_number}</title>
        <style>
          body { font-family: 'Source Sans 3', sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #1e40af; }
          .tagline { font-size: 12px; color: #666; }
          .invoice-info { text-align: right; }
          .invoice-number { font-size: 24px; font-weight: bold; color: #1e40af; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f8fafc; padding: 12px 8px; text-align: left; border-bottom: 2px solid #1e40af; }
          .totals { margin-left: auto; width: 300px; }
          .totals td { padding: 8px; }
          .total-row { font-size: 18px; font-weight: bold; background: #1e40af; color: white; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MIPROJET</div>
            <div class="tagline">Entrepreneuriat jeune</div>
            <p style="margin-top: 10px; font-size: 12px; color: #666;">
              Bingerville – Adjin Palmeraie<br/>
              Abidjan, Côte d'Ivoire<br/>
              +225 07 07 16 79 21
            </p>
          </div>
          <div class="invoice-info">
            <div class="invoice-number">${invoice.invoice_number}</div>
            <p>Date: ${format(new Date(invoice.created_at), 'dd MMMM yyyy', { locale: fr })}</p>
            ${invoice.due_date ? `<p>Échéance: ${format(new Date(invoice.due_date), 'dd MMMM yyyy', { locale: fr })}</p>` : ''}
            <p>Statut: ${invoice.status === 'paid' ? 'Payée' : invoice.status === 'pending' ? 'En attente' : invoice.status}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Prix unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <table class="totals">
          <tr>
            <td>Sous-total:</td>
            <td style="text-align: right;">${invoice.subtotal.toLocaleString()} ${invoice.currency}</td>
          </tr>
          <tr>
            <td>TVA:</td>
            <td style="text-align: right;">${(invoice.tax_amount || 0).toLocaleString()} ${invoice.currency}</td>
          </tr>
          <tr class="total-row">
            <td style="padding: 12px;">TOTAL:</td>
            <td style="text-align: right; padding: 12px;">${invoice.total.toLocaleString()} ${invoice.currency}</td>
          </tr>
        </table>
        
        ${invoice.notes ? `<p style="margin-top: 30px; font-style: italic; color: #666;">Notes: ${invoice.notes}</p>` : ''}
        
        <div class="footer">
          <p>MIPROJET - Plateforme Panafricaine de Structuration et de Financement de Projets</p>
          <p>www.miprojet.ci | info@ivoireprojet.com</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    const headers = ['N° Facture', 'Date', 'Statut', 'Montant', 'Devise'];
    const rows = filteredInvoices.map(inv => [
      inv.invoice_number,
      format(new Date(inv.created_at), 'dd/MM/yyyy'),
      inv.status,
      inv.total.toString(),
      inv.currency
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factures_miprojet_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historique des factures
            </CardTitle>
            <CardDescription>
              Consultez et exportez vos factures
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="paid">Payée</SelectItem>
              <SelectItem value="overdue">En retard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune facture</h3>
            <p className="text-muted-foreground">Vos factures apparaîtront ici</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Facture</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>
                      {format(new Date(invoice.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {invoice.total.toLocaleString()} {invoice.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handlePrint(invoice)} title="Imprimer">
                          <Printer className="h-4 w-4" />
                        </Button>
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
  );
};
