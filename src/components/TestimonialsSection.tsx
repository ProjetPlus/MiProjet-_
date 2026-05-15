import { useState, useEffect } from "react";
import { Quote, Star, ChevronLeft, ChevronRight, ExternalLink, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoAgricapital from "@/assets/logo-agricapital.jpg";

const testimonials = [
  {
    id: 1, name: "Inocent KOFFI", initials: "IK", logo: logoAgricapital,
    role: { fr: "Fondateur & CEO, AgriCapital SARL", en: "Founder & CEO, AgriCapital SARL" },
    content: { fr: "MIPROJET a été un partenaire déterminant dans la structuration de notre modèle d'accompagnement agricole. Grâce à leur expertise en structuration ISO 21500, AgriCapital a pu consolider son offre de support aux producteurs.", en: "MIPROJET was a decisive partner in structuring our agricultural support model." },
    rating: 5, project: { fr: "Accompagnement producteurs agricoles", en: "Agricultural producers support" },
    funded: "85M FCFA", website: "www.agricapital.ci", country: "🇨🇮 Côte d'Ivoire",
  },
  {
    id: 2, name: "Aminata Diallo", initials: "AD",
    role: { fr: "Directrice Générale, TechFem Abidjan", en: "General Manager, TechFem Abidjan" },
    content: { fr: "Notre centre de formation numérique pour femmes a été structuré par MIPROJET avec un professionnalisme remarquable. En 6 mois, nous avons obtenu une subvention de la BAD et formé 200 jeunes femmes au codage.", en: "Our digital training center for women was structured by MIPROJET with remarkable professionalism." },
    rating: 5, project: { fr: "Formation numérique pour femmes", en: "Digital training for women" },
    funded: "45M FCFA", country: "🇨🇮 Côte d'Ivoire",
  },
  {
    id: 3, name: "Oumar Konaté", initials: "OK",
    role: { fr: "Fondateur, AgroSolaire Mali", en: "Founder, AgroSolaire Mali" },
    content: { fr: "À 28 ans, j'ai pu structurer mon projet d'irrigation solaire grâce à MIPROJET. Leur méthodologie ISO 21500 nous a permis de convaincre un fonds d'investissement à impact. Nous irriguons 150 hectares.", en: "At 28, I was able to structure my solar irrigation project thanks to MIPROJET." },
    rating: 5, project: { fr: "Irrigation solaire agricole", en: "Agricultural solar irrigation" },
    funded: "120M FCFA", country: "🇲🇱 Mali",
  },
  {
    id: 4, name: "Fatou Sow", initials: "FS",
    role: { fr: "CEO, KaritéGold Sénégal", en: "CEO, KaritéGold Senegal" },
    content: { fr: "MIPROJET a structuré notre coopérative de transformation du karité de A à Z. Nous employons maintenant 150 femmes et exportons vers 5 pays européens.", en: "MIPROJET structured our shea butter cooperative from A to Z." },
    rating: 5, project: { fr: "Coopérative transformation karité", en: "Shea butter transformation cooperative" },
    funded: "65M FCFA", country: "🇸🇳 Sénégal",
  },
  {
    id: 5, name: "Yao Kouamé", initials: "YK",
    role: { fr: "Fondateur, MobiHealth CI", en: "Founder, MobiHealth CI" },
    content: { fr: "Notre application de télémédecine rurale a été structurée par MIPROJET en 4 mois. À 26 ans, nous connectons maintenant 50 villages à des médecins qualifiés.", en: "Our rural telemedicine app was structured by MIPROJET in 4 months." },
    rating: 5, project: { fr: "Télémédecine rurale", en: "Rural telemedicine" },
    funded: "35M FCFA", country: "🇨🇮 Côte d'Ivoire",
  },
  {
    id: 6, name: "Mariama Bah", initials: "MB",
    role: { fr: "Directrice, EcoPlast Guinée", en: "Director, EcoPlast Guinea" },
    content: { fr: "Notre usine de recyclage plastique a bénéficié d'une structuration exemplaire par MIPROJET. Nous recyclons 500 tonnes de plastique par an à Conakry.", en: "Our plastic recycling plant benefited from exemplary structuring by MIPROJET." },
    rating: 5, project: { fr: "Recyclage plastique urbain", en: "Urban plastic recycling" },
    funded: "95M FCFA", country: "🇬🇳 Guinée",
  },
];

const avatarColors = [
  'bg-primary text-primary-foreground', 'bg-success text-white',
  'bg-accent text-accent-foreground', 'bg-warning text-white',
  'bg-destructive text-white', 'bg-secondary text-secondary-foreground',
];

export const TestimonialsSection = () => {
  const { language } = useLanguage();

  const getContent = (obj: Record<string, string>) => obj[language] || obj.fr;

  return (
    <section className="py-16 md:py-24 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <span className="inline-block px-4 py-2 bg-success/10 rounded-full text-success font-semibold text-sm mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ils ont réussi avec MIPROJET
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Découvrez les histoires de succès de nos porteurs de projets structurés
          </p>
        </div>

        {/* Responsive Grid: 1 mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {testimonials.map((t, index) => {
            const avatarColor = avatarColors[index % avatarColors.length];
            return (
              <Card key={t.id} className="border-border/50 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                    ))}
                  </div>
                  
                  <p className="text-sm text-foreground leading-relaxed italic mb-4 line-clamp-4">
                    "{getContent(t.content)}"
                  </p>

                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className={`h-10 w-10 border border-primary/30 ${!t.logo ? avatarColor : ''}`}>
                      {t.logo ? (
                        <AvatarImage src={t.logo} alt={t.name} className="object-contain bg-white p-0.5" />
                      ) : (
                        <AvatarFallback className={avatarColor}>{t.initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{getContent(t.role)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                    <span>{getContent(t.project)}</span>
                    <span className="font-semibold text-primary">{t.funded}</span>
                  </div>
                  {t.country && (
                    <p className="text-xs text-muted-foreground mt-1">{t.country}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center flex flex-wrap justify-center gap-3">
          <Link to="/success-stories">
            <Button variant="outline" className="gap-2">
              Voir tous les témoignages
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
