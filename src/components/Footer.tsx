import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone, Facebook, Linkedin, MessageCircle, Send, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNewsletterSubscribe } from "@/hooks/useNewsletterSubscribe";
import logo from "@/assets/logo-miprojet-new.png";
import cachet from "@/assets/cachet-miprojet.png";

export const Footer = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const { subscribe, submitting } = useNewsletterSubscribe("footer");
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await subscribe(email, fullName);
    if (ok) { setEmail(""); setFullName(""); }
  };

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="MIPROJET logo" className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
              <span className="font-bold text-xl text-foreground">MIPROJET</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('footer.description')}</p>
            <p className="text-primary text-sm font-medium italic">{t('footer.tagline')}</p>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/mivprojet" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href="https://www.linkedin.com/in/marcelkonan/" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
              <a href="https://www.tiktok.com/@miprojet" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors" aria-label="TikTok">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.07A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/>
                </svg>
              </a>
              <a href="https://wa.me/2250707167921" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.links')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/projects" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.projects')}</Link></li>
              <li><Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.howItWorks')}</Link></li>
              <li><Link to="/services" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.services')}</Link></li>
              <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/faq" className="text-muted-foreground hover:text-primary transition-colors">{t('nav.faq')}</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('nav.guide')}</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/guide" className="text-muted-foreground hover:text-primary transition-colors">Guide du porteur</Link></li>
              <li><Link to="/investors" className="text-muted-foreground hover:text-primary transition-colors">Guide investisseur</Link></li>
              <li><Link to="/news" className="text-muted-foreground hover:text-primary transition-colors">Actualités</Link></li>
              <li><Link to="/success-stories" className="text-muted-foreground hover:text-primary transition-colors">Success Stories</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">{t('footer.contact')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <span className="break-words">Bingerville – Adjin Palmeraie<br/>Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="tel:+2250707167921" className="hover:text-primary transition-colors">+225 07 07 16 79 21</a>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                <a href="mailto:info@ivoireprojet.com" className="hover:text-primary transition-colors break-all">info@ivoireprojet.com</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <h3 className="font-bold text-lg text-foreground flex items-center justify-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Newsletter MIPROJET
            </h3>
            <p className="text-sm text-muted-foreground">
              Recevez chaque semaine nos opportunités de financement, programmes d'incubation et guides exclusifs.
            </p>
            <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
              <Input
                type="text"
                placeholder="Nom complet"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="sm:col-span-1"
              />
              <Input
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="sm:col-span-1"
              />
              <Button type="submit" disabled={submitting} className="sm:col-span-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-1" />Je m'inscris</>}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center w-full gap-4">
            <p className="text-sm text-muted-foreground text-center md:text-left">
              © {new Date().getFullYear()} MIPROJET. {t('footer.rights')}.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">{t('footer.terms')}</Link>
            </div>
          </div>
          
          {/* Developer Credit */}
          <div className="flex items-center gap-3 mt-2">
            <a href="https://www.ikoffi.agricapital.ci" target="_blank" rel="noopener noreferrer">
              <img src={cachet} alt="Inocent KOFFI" className="h-10 w-10 rounded-full object-cover border-2 border-primary/30 hover:border-primary transition-colors cursor-pointer" />
            </a>
            <p className="text-xs text-muted-foreground">
              Plateforme développée par{" "}
              <a href="https://www.ikoffi.agricapital.ci" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                Inocent KOFFI
              </a>
              {" – "}
              <a href="https://wa.me/+2250759566087" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                +225 0759566087
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
