import { useState, useEffect } from "react";
import { X, Sparkles, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-miprojet-new.png";

export const WelcomePopup = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    // Check if popup was already shown this session
    const hasSeenPopup = sessionStorage.getItem("miprojet_welcome_shown");
    
    if (!hasSeenPopup) {
      // Small delay before showing
      const showTimer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("miprojet_welcome_shown", "true");
      }, 1500);

      return () => clearTimeout(showTimer);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Popup Content */}
      <div className="relative bg-gradient-to-br from-primary via-primary to-primary/90 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Countdown timer */}
        <div className="absolute top-4 left-4 flex items-center gap-2 text-white/80 text-sm">
          <Clock className="h-4 w-4" />
          <span>{countdown}s</span>
        </div>

        {/* Content */}
        <div className="relative p-6 sm:p-8 text-center text-white">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-xl p-3 shadow-lg">
              <img
                src={logoImage}
                alt="MIPROJET"
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Appels à Projets en Cours</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold mb-3 leading-tight">
            Bienvenue sur MIPROJET
          </h2>

          {/* Description */}
          <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
            Plateforme panafricaine de structuration et d'orientation de projets. 
            Transformez votre idée en projet crédible et prêt pour le financement.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-accent">105+</p>
              <p className="text-xs text-white/80">Projets structurés</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-accent">5</p>
              <p className="text-xs text-white/80">Pays couverts</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-2xl font-bold text-accent">95%</p>
              <p className="text-xs text-white/80">Satisfaction</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/submit-project" className="flex-1" onClick={handleClose}>
              <Button 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                size="lg"
              >
                Soumettre un projet
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/projects" className="flex-1" onClick={handleClose}>
              <Button 
                variant="outline"
                className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20"
                size="lg"
              >
                Explorer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
