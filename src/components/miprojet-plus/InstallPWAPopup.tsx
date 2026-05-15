import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import miprojetPlusLogo from "@/assets/miprojet-plus-logo.jpg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const InstallPWAPopup = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Don't show in iframes or preview
    try {
      if (window.self !== window.top) return;
    } catch { return; }
    if (window.location.hostname.includes("id-preview--")) return;

    const dismissed = localStorage.getItem("mp_pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: show after 5s even without prompt (for iOS)
    const timer = setTimeout(() => {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (isIOS && !isStandalone && !dismissed) {
        setShow(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("mp_pwa_dismissed", Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center relative animate-in fade-in zoom-in-95 duration-300">
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        <img src={miprojetPlusLogo} alt="MiProjet+" className="h-20 w-20 rounded-2xl mx-auto mb-4 shadow-lg" />

        <h2 className="text-xl font-bold text-gray-900">
          Installer MiProjet<span className="text-emerald-600">+</span>
        </h2>
        <p className="text-gray-500 text-sm mt-2 mb-6">
          Accédez rapidement à votre espace de structuration directement depuis votre écran d'accueil.
        </p>

        {deferredPrompt ? (
          <Button onClick={handleInstall} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 rounded-xl text-base">
            Installer l'application
          </Button>
        ) : (
          <div className="text-left bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-2">
            <p className="font-medium text-gray-800">Sur Safari iOS :</p>
            <p>1. Appuyez sur le bouton <strong>Partager</strong> ↗</p>
            <p>2. Sélectionnez <strong>"Sur l'écran d'accueil"</strong></p>
          </div>
        )}

        <button onClick={handleDismiss} className="mt-3 text-sm text-gray-400 hover:text-gray-600">
          Plus tard
        </button>
      </div>
    </div>
  );
};

export default InstallPWAPopup;
