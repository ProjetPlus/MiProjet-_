import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Settings, Save, RefreshCw, Globe, Mail, Bell, Shield,
  CreditCard, Palette, FileText, Phone, MapPin, Building,
  Loader2, Check, Info, Smartphone, Key
} from "lucide-react";

interface PlatformSettings {
  // General
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  timezone: string;
  currency: string;
  
  // Features
  enable_registration: boolean;
  enable_projects: boolean;
  enable_evaluations: boolean;
  enable_payments: boolean;
  enable_notifications: boolean;
  enable_referrals: boolean;
  maintenance_mode: boolean;
  
  // Commission
  referral_commission_rate: number;
  mip_conversion_rate: number;
  
  // Email
  email_from_name: string;
  email_from_address: string;
  email_footer_text: string;
  
  // Social
  facebook_url: string;
  linkedin_url: string;
  twitter_url: string;
  whatsapp_number: string;
  
  // SEO
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
}

const defaultSettings: PlatformSettings = {
  site_name: "MIPROJET",
  site_description: "Plateforme de structuration et d'accompagnement de projets en Afrique",
  contact_email: "info@ivoireprojet.com",
  contact_phone: "+225 07 07 16 79 21",
  address: "Abidjan, Côte d'Ivoire",
  timezone: "Africa/Abidjan",
  currency: "XOF",
  
  enable_registration: true,
  enable_projects: true,
  enable_evaluations: true,
  enable_payments: true,
  enable_notifications: true,
  enable_referrals: true,
  maintenance_mode: false,
  
  referral_commission_rate: 6.5,
  mip_conversion_rate: 1230,
  
  email_from_name: "MIPROJET",
  email_from_address: "noreply@miprojet.com",
  email_footer_text: "© 2026 MIPROJET - Tous droits réservés",
  
  facebook_url: "",
  linkedin_url: "",
  twitter_url: "",
  whatsapp_number: "+2250707167921",
  
  meta_title: "MIPROJET - Structuration de Projets en Afrique",
  meta_description: "Plateforme de structuration, d'accompagnement et d'orientation de projets vers les partenaires financiers adaptés.",
  meta_keywords: "projet, financement, Afrique, startup, business plan, investissement"
};

export const AdminSettingsManager = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('key, value');

      if (!error && data) {
        const loadedSettings = { ...defaultSettings };
        data.forEach(item => {
          if (item.key in loadedSettings) {
            (loadedSettings as any)[item.key] = item.value;
          }
        });
        setSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      
      for (const [key, value] of entries) {
        await supabase
          .from('platform_settings')
          .upsert({ 
            key, 
            value: typeof value === 'object' ? JSON.stringify(value) : value,
            category: getCategoryForKey(key),
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      }

      toast({ title: "✅ Paramètres enregistrés", description: "Vos modifications ont été sauvegardées" });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryForKey = (key: string): string => {
    if (key.startsWith('email_')) return 'email';
    if (key.startsWith('enable_') || key === 'maintenance_mode') return 'features';
    if (key.includes('_url') || key === 'whatsapp_number') return 'social';
    if (key.startsWith('meta_')) return 'seo';
    if (key.includes('commission') || key.includes('rate') || key === 'currency') return 'finance';
    return 'general';
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Paramètres de la Plateforme
          </h1>
          <p className="text-muted-foreground">Configuration générale de MIPROJET</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {/* Maintenance Mode Alert */}
      {settings.maintenance_mode && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 dark:text-amber-200">
              <strong>Mode maintenance activé.</strong> Le site est inaccessible aux visiteurs.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span className="hidden sm:inline">Général</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Fonctionnalités</span>
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Finance</span>
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Email</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Informations Générales
              </CardTitle>
              <CardDescription>Configuration de base de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom du site</Label>
                  <Input
                    value={settings.site_name}
                    onChange={(e) => updateSetting('site_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuseau horaire</Label>
                  <Select value={settings.timezone} onValueChange={(v) => updateSetting('timezone', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Abidjan">Abidjan (GMT)</SelectItem>
                      <SelectItem value="Africa/Lagos">Lagos (GMT+1)</SelectItem>
                      <SelectItem value="Africa/Nairobi">Nairobi (GMT+3)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (GMT+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description du site</Label>
                <Textarea
                  value={settings.site_description}
                  onChange={(e) => updateSetting('site_description', e.target.value)}
                  rows={2}
                />
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email de contact
                  </Label>
                  <Input
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => updateSetting('contact_email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    value={settings.contact_phone}
                    onChange={(e) => updateSetting('contact_phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                <Input
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                />
              </div>

              <Separator />
              <h3 className="font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Réseaux sociaux
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Facebook URL</Label>
                  <Input
                    value={settings.facebook_url}
                    onChange={(e) => updateSetting('facebook_url', e.target.value)}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn URL</Label>
                  <Input
                    value={settings.linkedin_url}
                    onChange={(e) => updateSetting('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter URL</Label>
                  <Input
                    value={settings.twitter_url}
                    onChange={(e) => updateSetting('twitter_url', e.target.value)}
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input
                    value={settings.whatsapp_number}
                    onChange={(e) => updateSetting('whatsapp_number', e.target.value)}
                    placeholder="+2250707167921"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fonctionnalités
              </CardTitle>
              <CardDescription>Activez ou désactivez les modules de la plateforme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maintenance Mode - Highlighted */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <div className="space-y-0.5">
                  <Label className="text-base font-semibold text-amber-800 dark:text-amber-200">
                    🚧 Mode maintenance
                  </Label>
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    Rendre le site inaccessible aux visiteurs
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(v) => updateSetting('maintenance_mode', v)}
                />
              </div>

              <Separator />

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { key: 'enable_registration', label: "Inscriptions", desc: "Autoriser les nouvelles inscriptions" },
                  { key: 'enable_projects', label: "Projets", desc: "Module de soumission de projets" },
                  { key: 'enable_evaluations', label: "Évaluations", desc: "MIPROJET SCORE et certifications" },
                  { key: 'enable_payments', label: "Paiements", desc: "Système de paiement en ligne" },
                  { key: 'enable_notifications', label: "Notifications", desc: "Alertes et notifications utilisateur" },
                  { key: 'enable_referrals', label: "Parrainages", desc: "Système MiP et commissions" },
                ].map(feature => (
                  <div key={feature.key} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="font-medium">{feature.label}</Label>
                      <p className="text-xs text-muted-foreground">{feature.desc}</p>
                    </div>
                    <Switch
                      checked={(settings as any)[feature.key]}
                      onCheckedChange={(v) => updateSetting(feature.key as keyof PlatformSettings, v)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Settings */}
        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Paramètres Financiers
              </CardTitle>
              <CardDescription>Configuration des commissions et taux de conversion</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Devise par défaut</Label>
                  <Select value={settings.currency} onValueChange={(v) => updateSetting('currency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">FCFA (XOF)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="USD">Dollar (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Taux de commission parrainage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={settings.referral_commission_rate}
                        onChange={(e) => updateSetting('referral_commission_rate', parseFloat(e.target.value))}
                        className="w-24 text-center text-lg font-bold"
                      />
                      <span className="text-2xl font-bold text-primary">%</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Commission versée aux parrains sur chaque paiement
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Taux de conversion MiP</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium">1 MiP =</span>
                      <Input
                        type="number"
                        min="1"
                        value={settings.mip_conversion_rate}
                        onChange={(e) => updateSetting('mip_conversion_rate', parseInt(e.target.value))}
                        className="w-28 text-center text-lg font-bold"
                      />
                      <span className="text-lg font-bold text-primary">FCFA</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Valeur d'un point MiP en FCFA
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configuration Email
              </CardTitle>
              <CardDescription>Personnalisation des emails automatiques</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nom de l'expéditeur</Label>
                  <Input
                    value={settings.email_from_name}
                    onChange={(e) => updateSetting('email_from_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email de l'expéditeur</Label>
                  <Input
                    type="email"
                    value={settings.email_from_address}
                    onChange={(e) => updateSetting('email_from_address', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Texte du pied de page email</Label>
                <Textarea
                  value={settings.email_footer_text}
                  onChange={(e) => updateSetting('email_footer_text', e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Référencement SEO
              </CardTitle>
              <CardDescription>Optimisation pour les moteurs de recherche</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Titre Meta (balise title)</Label>
                <Input
                  value={settings.meta_title}
                  onChange={(e) => updateSetting('meta_title', e.target.value)}
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{settings.meta_title.length}/60 caractères</p>
              </div>

              <div className="space-y-2">
                <Label>Description Meta</Label>
                <Textarea
                  value={settings.meta_description}
                  onChange={(e) => updateSetting('meta_description', e.target.value)}
                  maxLength={160}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">{settings.meta_description.length}/160 caractères</p>
              </div>

              <div className="space-y-2">
                <Label>Mots-clés (séparés par des virgules)</Label>
                <Input
                  value={settings.meta_keywords}
                  onChange={(e) => updateSetting('meta_keywords', e.target.value)}
                  placeholder="projet, financement, Afrique, ..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
