import { useState, useEffect } from "react";
import { X, Crown, Flame, Gift, ArrowRight, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logoImage from "@/assets/logo-miprojet-new.png";

export const PromoPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const PROMO_END = new Date("2026-02-28T23:59:59");
  const NOW = new Date();
  const isPromoActive = NOW < PROMO_END;

  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem("miprojet_popup_shown_v2");
    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        sessionStorage.setItem("miprojet_popup_shown_v2", "true");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isPromoActive || !isOpen) return;
    const interval = setInterval(() => {
      const now = new Date();
      const diff = PROMO_END.getTime() - now.getTime();
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPromoActive, isOpen]);

  if (!isOpen) return null;

  // After Feb 28, show the regular welcome popup
  if (!isPromoActive) {
    return <WelcomePopupFallback onClose={() => setIsOpen(false)} />;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      
      <div className="relative bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-in">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <button onClick={() => setIsOpen(false)}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10"
          aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>

        <div className="relative p-6 sm:p-8 text-center text-white">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-xl p-2.5 shadow-lg">
              <img src={logoImage} alt="MIPROJET" className="h-10 w-auto" />
            </div>
          </div>

          {/* Promo badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 px-4 py-1.5 rounded-full text-sm font-bold mb-4 animate-pulse">
            <Flame className="h-4 w-4" />
            OFFRE DE LANCEMENT
            <Flame className="h-4 w-4" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 leading-tight">
            🎉 15 mois au prix de 12 !
          </h2>
          
          <p className="text-white/90 text-base sm:text-lg mb-1">
            <span className="font-bold text-yellow-300">Abonnement Élite</span> – 30 000 FCFA
          </p>
          <p className="text-white/70 text-sm mb-5">
            Pour les <span className="font-bold text-yellow-300">100 premiers abonnés</span> uniquement
          </p>

          {/* Countdown */}
          <div className="grid grid-cols-4 gap-2 mb-6 max-w-xs mx-auto">
            {[
              { value: timeLeft.days, label: "Jours" },
              { value: timeLeft.hours, label: "Heures" },
              { value: timeLeft.minutes, label: "Min" },
              { value: timeLeft.seconds, label: "Sec" },
            ].map((item, i) => (
              <div key={i} className="bg-black/30 backdrop-blur-sm rounded-lg p-2">
                <p className="text-2xl sm:text-3xl font-mono font-bold text-yellow-300">
                  {String(item.value).padStart(2, "0")}
                </p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
            <div className="bg-white/10 rounded-lg p-2.5 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-300 shrink-0" />
              <span>Accès illimité</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2.5 flex items-center gap-2">
              <Gift className="h-4 w-4 text-yellow-300 shrink-0" />
              <span>+3 mois offerts</span>
            </div>
          </div>

          {/* CTA */}
          <Link to="/subscription" onClick={() => setIsOpen(false)}>
            <Button size="lg" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg shadow-lg shadow-yellow-400/30">
              Profiter de l'offre
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <p className="text-white/50 text-xs mt-3">
            Offre valable jusqu'au 28 février 2026 ou jusqu'à épuisement des 100 places
          </p>
        </div>
      </div>
    </div>
  );
};

// Fallback welcome popup after promo ends
const WelcomePopupFallback = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative bg-gradient-to-br from-primary via-primary to-primary/90 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
      <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white z-10" aria-label="Fermer">
        <X className="h-5 w-5" />
      </button>
      <div className="relative p-6 sm:p-8 text-center text-white">
        <div className="flex justify-center mb-4">
          <div className="bg-white rounded-xl p-3 shadow-lg">
            <img src={logoImage} alt="MIPROJET" className="h-12 w-auto" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-3">Bienvenue sur MIPROJET</h2>
        <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
          Plateforme panafricaine de structuration et d'orientation de projets. Transformez votre idée en projet crédible et prêt pour le financement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/submit-project" className="flex-1" onClick={onClose}>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" size="lg">
              Soumettre un projet
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link to="/projects" className="flex-1" onClick={onClose}>
            <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20" size="lg">
              Explorer
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);
