import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  MapPin, Phone, Mail, Clock, Send, 
  Facebook, Linkedin, MessageCircle, Globe
} from "lucide-react";

const setMeta = (title: string, description: string) => {
  document.title = title;
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
  if (!meta) { meta = document.createElement("meta"); meta.name = "description"; document.head.appendChild(meta); }
  meta.content = description;
};

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    setMeta(
      "Contact | MIPROJET - Nous Contacter",
      "Contactez MIPROJET pour vos projets. Adresse: Bingerville, Abidjan. Téléphone: +225 07 07 16 79 21. Email: info@ivoireprojet.com"
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Store message in database
      const { error } = await supabase.from("messages").insert({
        project_id: "00000000-0000-0000-0000-000000000000", // Contact form messages
        sender_id: "00000000-0000-0000-0000-000000000000",
        content: JSON.stringify(formData),
      });

      if (error) throw error;

      toast({
        title: "Message envoyé !",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });

      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-28 md:pt-32">
        {/* Hero */}
        <section className="py-16 bg-gradient-hero">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
              Contactez-<span className="text-accent">nous</span>
            </h1>
            <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
              Notre équipe est à votre écoute pour répondre à toutes vos questions
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Adresse
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Bingerville – Adjin Palmeraie<br />
                      25 BP 2454 Abidjan 25<br />
                      Côte d'Ivoire
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-primary" />
                      Téléphone
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a href="tel:+2250707167921" className="block text-muted-foreground hover:text-primary transition-colors">
                      +225 07 07 16 79 21
                    </a>
                    <a href="tel:+2250505233005" className="block text-muted-foreground hover:text-primary transition-colors">
                      +225 05 05 23 30 05
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" />
                      Email
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a href="mailto:info@ivoireprojet.com" className="block text-muted-foreground hover:text-primary transition-colors">
                      info@ivoireprojet.com
                    </a>
                    <a href="mailto:miprojet.coop@gmail.com" className="block text-muted-foreground hover:text-primary transition-colors">
                      miprojet.coop@gmail.com
                    </a>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Horaires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Lundi - Vendredi: 8h00 - 18h00<br />
                      Samedi: 9h00 - 13h00
                    </p>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <div className="flex gap-4">
                  <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a href="https://wa.me/2250707167921" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-lg hover:bg-success hover:text-primary-foreground transition-colors">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                  <a href="https://ivoireprojet.com" target="_blank" rel="noopener noreferrer" className="p-3 bg-muted rounded-lg hover:bg-info hover:text-primary-foreground transition-colors">
                    <Globe className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Envoyez-nous un message</CardTitle>
                    <CardDescription>
                      Remplissez le formulaire ci-dessous et nous vous répondrons dans les 24h
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nom complet *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="Votre nom"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            placeholder="votre@email.com"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Téléphone</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+225 XX XX XX XX XX"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Sujet *</Label>
                          <Select
                            value={formData.subject}
                            onValueChange={(value) => setFormData({ ...formData, subject: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un sujet" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="project">Soumission de projet</SelectItem>
                              <SelectItem value="investment">Investissement</SelectItem>
                              <SelectItem value="partnership">Partenariat</SelectItem>
                              <SelectItem value="services">Demande de services</SelectItem>
                              <SelectItem value="other">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Message *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                          required
                          placeholder="Décrivez votre demande..."
                          className="min-h-[150px]"
                        />
                      </div>

                      <Button type="submit" variant="hero" size="lg" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                        <Send className="ml-2 h-5 w-5" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Map placeholder */}
        <section className="h-96 bg-muted">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127067.45823!2d-3.9930!3d5.3166!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc1ea5311959121%3A0x3fe70ddce7b5e0e1!2sAbidjan%2C%20C%C3%B4te%20d'Ivoire!5e0!3m2!1sfr!2sfr!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="MIPROJET Location"
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
