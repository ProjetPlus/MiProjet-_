import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Wand2, Loader2, Eye, Copy, Send } from "lucide-react";

const emailTemplateTypes = [
  { value: 'welcome', label: '🎉 Bienvenue / Inscription', description: 'Email envoyé après inscription' },
  { value: 'payment_success', label: '💳 Confirmation de paiement', description: 'Reçu après paiement réussi' },
  { value: 'new_opportunity', label: '🚀 Nouvelle opportunité', description: 'Alerte pour les abonnés premium' },
  { value: 'password_reset', label: '🔐 Réinitialisation mot de passe', description: 'Lien sécurisé de réinitialisation' },
  { value: 'subscription_expiry', label: '⏰ Expiration abonnement', description: 'Rappel avant expiration' },
];

export const EmailTemplateManager = () => {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState('welcome');
  const [variables, setVariables] = useState<Record<string, string>>({
    name: 'Inocent KOFFI',
    plan: 'Premium',
    amount: '30 000',
    title: 'Financement PME Afrique de l\'Ouest',
    date: new Date().toLocaleDateString('fr-FR'),
  });
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; html: string } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateTemplate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: {
          action: 'generate_email',
          template_type: selectedType,
          variables,
        }
      });

      if (error) throw error;

      if (data?.subject && data?.html) {
        setGeneratedEmail(data);
        setShowPreview(true);
        toast({ title: "✅ Template généré", description: "Aperçu disponible ci-dessous" });
      } else {
        // Fallback templates
        setGeneratedEmail(getFallbackTemplate(selectedType, variables));
        setShowPreview(true);
      }
    } catch (err) {
      console.error("Email generation error:", err);
      setGeneratedEmail(getFallbackTemplate(selectedType, variables));
      setShowPreview(true);
      toast({ title: "Template local généré", description: "Utilisation du template par défaut" });
    } finally {
      setGenerating(false);
    }
  };

  const getFallbackTemplate = (type: string, vars: Record<string, string>) => {
    const baseStyle = `
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f8; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1a365d, #2c5282); padding: 30px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 28px; margin: 0; letter-spacing: 2px; }
        .header p { color: #a3bffa; font-size: 12px; margin: 5px 0 0; }
        .body { padding: 30px; }
        .body h2 { color: #1a365d; font-size: 22px; margin: 0 0 15px; }
        .body p { color: #4a5568; line-height: 1.7; margin: 0 0 15px; }
        .btn { display: inline-block; background: #38a169; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; }
        .info-box { background: #f7fafc; border-left: 4px solid #1a365d; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
        .footer { background: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
        .footer p { color: #718096; font-size: 12px; margin: 5px 0; }
      </style>
    `;
    
    const templates: Record<string, { subject: string; html: string }> = {
      welcome: {
        subject: `Bienvenue sur MIPROJET, ${vars.name} ! 🎉`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header"><h1>MIPROJET</h1><p>Plateforme Panafricaine de Structuration de Projets</p></div>
            <div class="body">
              <h2>Bienvenue, ${vars.name} ! 🎉</h2>
              <p>Votre inscription sur MIPROJET a été confirmée avec succès. Vous faites désormais partie d'une communauté dynamique de porteurs de projets en Afrique.</p>
              <div class="info-box">
                <p><strong>Votre espace membre vous donne accès à :</strong></p>
                <p>✅ Structuration de projets ISO 21500<br>✅ Évaluation et labellisation<br>✅ Orientation vers les financements<br>✅ Opportunités exclusives (abonnés)</p>
              </div>
              <p style="text-align:center;"><a href="https://ivoireprojet.com/dashboard" class="btn">Accéder à mon espace</a></p>
            </div>
            <div class="footer">
              <p><strong>MIPROJET</strong> | info@ivoireprojet.com | +225 07 07 16 79 21</p>
              <p>ivoireprojet.com</p>
            </div>
          </div>
        </body></html>`
      },
      payment_success: {
        subject: `✅ Paiement confirmé – ${vars.plan} MIPROJET`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header"><h1>MIPROJET</h1><p>Confirmation de paiement</p></div>
            <div class="body">
              <h2>Paiement confirmé ✅</h2>
              <p>Bonjour ${vars.name},</p>
              <p>Votre paiement a été traité avec succès. Voici le récapitulatif :</p>
              <div class="info-box">
                <p><strong>Plan :</strong> ${vars.plan}<br><strong>Montant :</strong> ${vars.amount} FCFA<br><strong>Date :</strong> ${vars.date}<br><strong>Statut :</strong> ✅ Actif</p>
              </div>
              <p>Vous avez maintenant accès à toutes les opportunités premium.</p>
              <p style="text-align:center;"><a href="https://ivoireprojet.com/opportunities" class="btn">Voir les opportunités</a></p>
            </div>
            <div class="footer">
              <p><strong>MIPROJET</strong> | info@ivoireprojet.com | +225 07 07 16 79 21</p>
            </div>
          </div>
        </body></html>`
      },
      new_opportunity: {
        subject: `🚀 Nouvelle opportunité : ${vars.title}`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header"><h1>MIPROJET</h1><p>Nouvelle opportunité disponible</p></div>
            <div class="body">
              <h2>🚀 ${vars.title}</h2>
              <p>Bonjour ${vars.name},</p>
              <p>Une nouvelle opportunité vient d'être publiée sur MIPROJET et correspond à votre profil.</p>
              <div class="info-box">
                <p><strong>${vars.title}</strong></p>
                <p>Ne manquez pas cette opportunité ! Les places sont limitées.</p>
              </div>
              <p style="text-align:center;"><a href="https://ivoireprojet.com/opportunities" class="btn">Voir l'opportunité</a></p>
            </div>
            <div class="footer">
              <p><strong>MIPROJET</strong> | info@ivoireprojet.com | +225 07 07 16 79 21</p>
            </div>
          </div>
        </body></html>`
      },
      password_reset: {
        subject: `🔐 Réinitialisation de votre mot de passe MIPROJET`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header"><h1>MIPROJET</h1><p>Sécurité de votre compte</p></div>
            <div class="body">
              <h2>Réinitialisation du mot de passe 🔐</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe MIPROJET.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <p style="text-align:center;"><a href="https://ivoireprojet.com/auth" class="btn">Réinitialiser mon mot de passe</a></p>
              <p style="color: #e53e3e; font-size: 13px;">⚠️ Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            </div>
            <div class="footer">
              <p><strong>MIPROJET</strong> | info@ivoireprojet.com | +225 07 07 16 79 21</p>
            </div>
          </div>
        </body></html>`
      },
      subscription_expiry: {
        subject: `⏰ Votre abonnement MIPROJET expire bientôt`,
        html: `<!DOCTYPE html><html><head>${baseStyle}</head><body>
          <div class="container">
            <div class="header"><h1>MIPROJET</h1><p>Rappel d'abonnement</p></div>
            <div class="body">
              <h2>Votre abonnement expire bientôt ⏰</h2>
              <p>Bonjour ${vars.name},</p>
              <p>Votre abonnement <strong>${vars.plan}</strong> expire le <strong>${vars.date}</strong>.</p>
              <div class="info-box">
                <p>Renouvelez maintenant pour continuer à accéder aux opportunités exclusives, formations et accompagnements premium.</p>
              </div>
              <p style="text-align:center;"><a href="https://ivoireprojet.com/subscription" class="btn">Renouveler mon abonnement</a></p>
            </div>
            <div class="footer">
              <p><strong>MIPROJET</strong> | info@ivoireprojet.com | +225 07 07 16 79 21</p>
            </div>
          </div>
        </body></html>`
      },
    };

    return templates[type] || templates.welcome;
  };

  const copyHtml = () => {
    if (generatedEmail?.html) {
      navigator.clipboard.writeText(generatedEmail.html);
      toast({ title: "📋 Copié", description: "Template HTML copié dans le presse-papiers" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Templates Email Professionnels
        </h1>
        <p className="text-muted-foreground">Générez des emails professionnels pour chaque événement système</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration du template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Type d'email</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {emailTemplateTypes.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <p className="font-medium">{t.label}</p>
                        <p className="text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom du destinataire</Label>
              <Input value={variables.name} onChange={(e) => setVariables(v => ({ ...v, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Input value={variables.plan} onChange={(e) => setVariables(v => ({ ...v, plan: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Montant</Label>
                <Input value={variables.amount} onChange={(e) => setVariables(v => ({ ...v, amount: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Titre opportunité</Label>
              <Input value={variables.title} onChange={(e) => setVariables(v => ({ ...v, title: e.target.value }))} />
            </div>

            <Button onClick={generateTemplate} disabled={generating} className="w-full" size="lg">
              {generating ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Génération IA...</>
              ) : (
                <><Wand2 className="h-5 w-5 mr-2" />Générer le template</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Templates disponibles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emailTemplateTypes.map(t => (
              <button
                key={t.value}
                onClick={() => { setSelectedType(t.value); generateTemplate(); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">Générer</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Preview */}
      {showPreview && generatedEmail && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Aperçu : {generatedEmail.subject}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={copyHtml}>
                <Copy className="h-4 w-4 mr-2" />
                Copier HTML
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={generatedEmail.html}
                className="w-full min-h-[600px] border-0"
                title="Email Preview"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
