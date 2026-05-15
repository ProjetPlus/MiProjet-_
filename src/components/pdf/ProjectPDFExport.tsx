import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectData {
  id: string;
  title: string;
  description?: string;
  sector?: string;
  category?: string;
  status: string;
  funding_goal?: number;
  funds_raised?: number;
  country?: string;
  city?: string;
  created_at: string;
  owner?: {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    email?: string;
    phone?: string;
  };
}

interface ProjectPDFExportProps {
  project: ProjectData;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ProjectPDFExport = ({ 
  project, 
  variant = 'outline',
  size = 'default' 
}: ProjectPDFExportProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Source Sans Pro', Arial, sans-serif; 
              color: #1a3d32; 
              line-height: 1.6;
              padding: 40px;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 3px solid #1a5f4a;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #1a5f4a;
            }
            .logo-sub {
              font-size: 12px;
              color: #666;
            }
            .badge {
              background: #1a5f4a;
              color: white;
              padding: 8px 16px;
              border-radius: 4px;
              font-size: 14px;
            }
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1a3d32;
              margin-bottom: 10px;
            }
            .section {
              margin-bottom: 25px;
            }
            .section-title {
              font-size: 16px;
              font-weight: bold;
              color: #1a5f4a;
              border-bottom: 1px solid #e0e0e0;
              padding-bottom: 8px;
              margin-bottom: 15px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
            }
            .field {
              margin-bottom: 10px;
            }
            .field-label {
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .field-value {
              font-size: 14px;
              color: #1a3d32;
            }
            .description {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              border-left: 4px solid #1a5f4a;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .highlight-box {
              background: linear-gradient(135deg, #1a5f4a 0%, #2d8b6e 100%);
              color: white;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .highlight-box .title {
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">MIPROJET</div>
              <div class="logo-sub">Structurez, Financez, Réussissez</div>
            </div>
            <div class="badge">${project.status === 'published' ? 'Projet Validé' : 'En Structuration'}</div>
          </div>
          
          <div class="highlight-box">
            <div class="title">${project.title}</div>
            <div>${project.sector || 'Secteur non défini'} • ${project.city || ''} ${project.country || ''}</div>
          </div>

          <div class="section">
            <div class="section-title">Description du Projet</div>
            <div class="description">
              ${project.description || 'Aucune description disponible.'}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Informations Générales</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Secteur d'activité</div>
                <div class="field-value">${project.sector || 'Non défini'}</div>
              </div>
              <div class="field">
                <div class="field-label">Catégorie</div>
                <div class="field-value">${project.category || 'Non défini'}</div>
              </div>
              <div class="field">
                <div class="field-label">Localisation</div>
                <div class="field-value">${project.city || ''}, ${project.country || 'Non défini'}</div>
              </div>
              <div class="field">
                <div class="field-label">Date de création</div>
                <div class="field-value">${new Date(project.created_at).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          </div>

          ${project.funding_goal ? `
          <div class="section">
            <div class="section-title">Informations Financières</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Objectif de financement</div>
                <div class="field-value">${project.funding_goal?.toLocaleString('fr-FR')} FCFA</div>
              </div>
              <div class="field">
                <div class="field-label">Fonds collectés</div>
                <div class="field-value">${(project.funds_raised || 0).toLocaleString('fr-FR')} FCFA</div>
              </div>
            </div>
          </div>
          ` : ''}

          ${project.owner ? `
          <div class="section">
            <div class="section-title">Porteur du Projet</div>
            <div class="grid">
              <div class="field">
                <div class="field-label">Nom</div>
                <div class="field-value">${project.owner.first_name || ''} ${project.owner.last_name || ''}</div>
              </div>
              <div class="field">
                <div class="field-label">Entreprise</div>
                <div class="field-value">${project.owner.company_name || 'Non défini'}</div>
              </div>
              <div class="field">
                <div class="field-label">Email</div>
                <div class="field-value">${project.owner.email || 'Non défini'}</div>
              </div>
              <div class="field">
                <div class="field-label">Téléphone</div>
                <div class="field-value">${project.owner.phone || 'Non défini'}</div>
              </div>
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>MIPROJET</strong> - Plateforme Panafricaine de Structuration de Projets</p>
            <p>Bingerville – Adjin Palmeraie, Abidjan, Côte d'Ivoire</p>
            <p>+225 07 07 16 79 21 | info@ivoireprojet.com</p>
            <p style="margin-top: 10px;">Document généré le ${new Date().toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </body>
        </html>
      `;

      // Create a Blob with the HTML content
      const blob = new Blob([htmlContent], { type: 'text/html' });
      
      // Create an iframe to print
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.top = '-10000px';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(htmlContent);
        iframeDoc.close();
        
        // Wait for content to load then print
        setTimeout(() => {
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }, 500);
      }

      toast({
        title: "Export PDF",
        description: "Le document PDF a été généré avec succès.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du PDF.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={generatePDF}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Génération...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Exporter PDF
        </>
      )}
    </Button>
  );
};
