import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Download, FileText, CheckCircle } from "lucide-react";
import logoMiprojet from "@/assets/logo-miprojet.jpg";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoicePreviewProps {
  invoiceData: {
    invoiceNumber?: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    clientAddress: string;
    items: InvoiceItem[];
    notes: string;
    dueDate: string;
    taxRate: number;
  };
  subtotal: number;
  taxAmount: number;
  total: number;
  onBack: () => void;
  onPrint: () => void;
}

export const InvoicePreview = ({
  invoiceData,
  subtotal,
  taxAmount,
  total,
  onBack,
  onPrint,
}: InvoicePreviewProps) => {
  const [downloading, setDownloading] = useState(false);
  const invoiceNumber = invoiceData.invoiceNumber || `MIP-${new Date().getFullYear()}-XXXXX`;
  const invoiceRef = useRef<HTMLDivElement>(null);

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Use browser print to PDF
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  // Calculate page breaks for pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(invoiceData.items.length / itemsPerPage);
  const paginatedItems = [];
  
  for (let i = 0; i < invoiceData.items.length; i += itemsPerPage) {
    paginatedItems.push(invoiceData.items.slice(i, i + itemsPerPage));
  }

  return (
    <div className="space-y-4">
      {/* Actions - Hidden on print */}
      <div className="flex flex-wrap gap-3 print:hidden sticky top-0 bg-background z-10 py-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <Button variant="outline" onClick={onPrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
        <Button onClick={handleDownloadPDF} disabled={downloading}>
          <Download className="h-4 w-4 mr-2" />
          {downloading ? "Génération..." : "Télécharger PDF"}
        </Button>
      </div>

      {/* Invoice Document */}
      <div 
        ref={invoiceRef}
        className="bg-white text-black rounded-lg shadow-lg max-w-4xl mx-auto print:shadow-none print:max-w-none"
      >
        {paginatedItems.map((pageItems, pageIndex) => (
          <div 
            key={pageIndex} 
            className={`p-8 md:p-12 print:p-8 ${pageIndex > 0 ? 'page-break-before' : ''}`}
            style={{ pageBreakAfter: pageIndex < paginatedItems.length - 1 ? 'always' : 'auto' }}
          >
            {/* Header - Show on every page */}
            <header className="flex justify-between items-start border-b-4 border-primary pb-6 mb-8">
              <div className="flex items-center gap-4">
                <img 
                  src={logoMiprojet} 
                  alt="MIPROJET" 
                  className="h-16 w-auto object-contain print:h-12"
                />
                <div>
                  <h1 className="text-2xl font-bold text-[hsl(158,64%,25%)]">MIPROJET</h1>
                  <p className="text-sm text-gray-600">Coopérative de Structuration de Projets</p>
                  <p className="text-xs text-gray-500">RCCM: CI-ABJ-2023-B-XXXXX</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-gray-800">FACTURE</h2>
                <p className="text-lg font-semibold text-[hsl(158,64%,25%)]">{invoiceNumber}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Page {pageIndex + 1} / {totalPages}
                </p>
              </div>
            </header>

            {/* Only show client info on first page */}
            {pageIndex === 0 && (
              <>
                {/* Company & Client Info */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[hsl(158,64%,25%)] mb-3 uppercase text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Émetteur
                    </h3>
                    <div className="text-gray-800 space-y-1">
                      <p className="font-bold text-lg">MIPROJET COOP</p>
                      <p>Bingerville – Adjin Palmeraie</p>
                      <p>25 BP 2454 Abidjan 25</p>
                      <p>Côte d'Ivoire</p>
                      <div className="pt-2 border-t border-gray-200 mt-2">
                        <p><span className="text-gray-500">Tél:</span> +225 07 07 16 79 21</p>
                        <p><span className="text-gray-500">Email:</span> info@ivoireprojet.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-[hsl(25,75%,47%)] mb-3 uppercase text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Facturé à
                    </h3>
                    <div className="text-gray-800 space-y-1">
                      <p className="font-bold text-lg">{invoiceData.clientName || "Client"}</p>
                      {invoiceData.clientAddress && (
                        <p className="whitespace-pre-wrap">{invoiceData.clientAddress}</p>
                      )}
                      {invoiceData.clientPhone && (
                        <p><span className="text-gray-500">Tél:</span> {invoiceData.clientPhone}</p>
                      )}
                      {invoiceData.clientEmail && (
                        <p><span className="text-gray-500">Email:</span> {invoiceData.clientEmail}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-4 bg-[hsl(158,64%,25%)] text-white p-4 rounded-lg mb-8">
                  <div>
                    <p className="text-sm text-white/70">Date d'émission</p>
                    <p className="font-semibold">{currentDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Date d'échéance</p>
                    <p className="font-semibold">{formatDate(invoiceData.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Devise</p>
                    <p className="font-semibold">FCFA (XOF)</p>
                  </div>
                </div>
              </>
            )}

            {/* Items Table */}
            <table className="w-full mb-8">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold rounded-l-lg">#</th>
                  <th className="text-left py-3 px-4 text-gray-700 font-semibold">Description</th>
                  <th className="text-center py-3 px-4 text-gray-700 font-semibold">Qté</th>
                  <th className="text-right py-3 px-4 text-gray-700 font-semibold">Prix unitaire</th>
                  <th className="text-right py-3 px-4 text-gray-700 font-semibold rounded-r-lg">Total</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item, index) => {
                  const globalIndex = pageIndex * itemsPerPage + index;
                  return (
                    <tr 
                      key={globalIndex} 
                      className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="py-4 px-4 text-gray-500">{globalIndex + 1}</td>
                      <td className="py-4 px-4 font-medium">{item.description || "Service"}</td>
                      <td className="py-4 px-4 text-center">{item.quantity}</td>
                      <td className="py-4 px-4 text-right">{item.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-4 px-4 text-right font-semibold text-[hsl(158,64%,25%)]">
                        {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Only show totals on last page */}
            {pageIndex === paginatedItems.length - 1 && (
              <>
                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-full md:w-1/2 lg:w-2/5">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Sous-total HT</span>
                        <span className="font-medium">{subtotal.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>TVA ({invoiceData.taxRate}%)</span>
                        <span className="font-medium">{taxAmount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t-2 border-[hsl(158,64%,25%)] text-xl font-bold">
                        <span>Total TTC</span>
                        <span className="text-[hsl(158,64%,25%)]">{total.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    </div>

                    {/* Amount in words */}
                    <div className="mt-4 p-3 bg-[hsl(158,64%,25%)]/10 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Arrêté la présente facture à la somme de : </span>
                        <span className="font-semibold text-[hsl(158,64%,25%)]">
                          {numberToWords(total)} francs CFA
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {invoiceData.notes && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-8">
                    <h4 className="font-semibold mb-2 text-amber-800 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes & Conditions
                    </h4>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoiceData.notes}</p>
                  </div>
                )}

                {/* Payment Info */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h4 className="font-semibold mb-4 text-gray-700 text-lg">Modalités de paiement</h4>
                  <div className="grid md:grid-cols-2 gap-6 text-sm">
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h5 className="font-semibold text-orange-700 mb-2">📱 Mobile Money</h5>
                      <p className="text-gray-700">
                        <strong>Orange Money / MTN / Wave / Moov</strong><br />
                        +225 07 07 16 79 21<br />
                        Nom: MIPROJET COOP
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h5 className="font-semibold text-blue-700 mb-2">🏦 Virement bancaire</h5>
                      <p className="text-gray-700">
                        <strong>MIPROJET COOP - Compte XOF</strong><br />
                        IBAN: CI XX XXXX XXXX XXXX XXXX<br />
                        Référence: {invoiceNumber}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Footer - Show on every page */}
            <footer className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
              <div className="inline-block bg-[hsl(158,64%,25%)] text-white px-6 py-2 rounded-full text-sm font-medium mb-3">
                De l'idée au financement, ensemble construisons l'avenir
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>MIPROJET</strong> - Plateforme Panafricaine de Structuration et de Financement de Projets
                </p>
                <p>
                  www.ivoireprojet.com | info@ivoireprojet.com | +225 07 07 16 79 21
                </p>
                <p>
                  Bingerville – Adjin Palmeraie, 25 BP 2454 Abidjan 25, Côte d'Ivoire
                </p>
              </div>
            </footer>
          </div>
        ))}
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          [class*="invoice"] * {
            visibility: visible;
          }
          
          .page-break-before {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function to convert number to words in French
function numberToWords(num: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  
  if (num === 0) return 'zéro';
  if (num < 0) return 'moins ' + numberToWords(-num);
  
  let result = '';
  
  // Millions
  if (num >= 1000000) {
    const millions = Math.floor(num / 1000000);
    result += (millions === 1 ? 'un million ' : numberToWords(millions) + ' millions ');
    num %= 1000000;
  }
  
  // Thousands
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    result += (thousands === 1 ? 'mille ' : numberToWords(thousands) + ' mille ');
    num %= 1000;
  }
  
  // Hundreds
  if (num >= 100) {
    const hundreds = Math.floor(num / 100);
    result += (hundreds === 1 ? 'cent ' : units[hundreds] + ' cent ');
    num %= 100;
  }
  
  // Tens and units
  if (num >= 20) {
    const tensDigit = Math.floor(num / 10);
    const unitsDigit = num % 10;
    
    if (tensDigit === 7 || tensDigit === 9) {
      result += tens[tensDigit - 1] + '-' + teens[unitsDigit] + ' ';
    } else {
      result += tens[tensDigit];
      if (unitsDigit === 1 && tensDigit !== 8) {
        result += ' et un ';
      } else if (unitsDigit > 0) {
        result += '-' + units[unitsDigit] + ' ';
      } else {
        result += ' ';
      }
    }
  } else if (num >= 10) {
    result += teens[num - 10] + ' ';
  } else if (num > 0) {
    result += units[num] + ' ';
  }
  
  return result.trim();
}
