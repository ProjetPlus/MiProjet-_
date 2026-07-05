import { Navigation } from "@/components/Navigation";
import { Hero } from "@/components/Hero";
import { PartnershipBanner } from "@/components/PartnershipBanner";
import { EcosystemSolutions } from "@/components/EcosystemSolutions";
import { StatsSection } from "@/components/StatsSection";
import { HowItWorks } from "@/components/HowItWorks";
import { ServicesSection } from "@/components/ServicesSection";
import { FundingTypes } from "@/components/FundingTypes";
import { FeaturedProjects } from "@/components/FeaturedProjects";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { Features } from "@/components/Features";
import { CallToAction } from "@/components/CallToAction";
import { Footer } from "@/components/Footer";
import { PromoPopup } from "@/components/PromoPopup";
import { MembershipBanner } from "@/components/MembershipBanner";
import { RecommendedDocuments } from "@/components/RecommendedDocuments";
import { useSEO } from "@/components/SEOHead";

const Index = () => {
  useSEO({
    title: "Plateforme Panafricaine de Structuration de Projets",
    description: "MIPROJET accompagne les entrepreneurs et investisseurs africains dans la structuration, le financement et l'incubation de projets rentables en Côte d'Ivoire et en Afrique.",
    image: window.location.origin + "/favicon.png",
    url: window.location.origin,
  });

  return (
    <div className="min-h-screen bg-background">
      <PromoPopup />
      <Navigation />
      <Hero />
      <EcosystemSolutions />
      <div className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8">
            <MembershipBanner />
            <PartnershipBanner />
          </div>
        </div>
      </div>
      <FeaturedProjects />
      <RecommendedDocuments />
      <StatsSection />
      <HowItWorks />
      <ServicesSection />
      <FundingTypes />
      <TestimonialsSection />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
