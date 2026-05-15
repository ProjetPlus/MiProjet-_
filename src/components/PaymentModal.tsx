import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications } from "@/hooks/useNotifications";
import { 
  CreditCard, Shield, 
  CheckCircle, Loader2 
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  projectTitle?: string;
  minAmount?: number;
  serviceRequestId?: string;
}

export const PaymentModal = ({ 
  isOpen, 
  onClose, 
  projectId, 
  projectTitle = "Contribution",
  minAmount = 1000,
  serviceRequestId
}: PaymentModalProps) => {
  const { toast } = useToast();
  const { createNotification, createAdminNotification } = useNotifications();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const predefinedAmounts = [5000, 10000, 25000, 50000, 100000];

  const handlePayment = async () => {
    const numericAmount = parseFloat(amount);
    
    if (!amount || numericAmount < minAmount) {
      toast({
        title: "Montant invalide",
        description: `Le montant minimum est de ${minAmount.toLocaleString()} FCFA`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Non connecté", description: "Veuillez vous connecter", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const successUrl = `${window.location.origin}/payment/callback?status=success`;
      const errorUrl = `${window.location.origin}/payment/callback?status=failed`;

      const { data, error } = await supabase.functions.invoke('wave-payment', {
        body: {
          amount: numericAmount,
          description: `Paiement MIPROJET - ${projectTitle}`,
          success_url: successUrl,
          error_url: errorUrl,
        },
      });

      if (error) {
        console.error('Wave payment invoke error:', error);
        throw new Error(error.message || 'Erreur de communication avec Wave');
      }

      if (data?.error) {
        if (data.preview_mode) {
          throw new Error('Le service Wave n\'est pas encore configuré.');
        }
        throw new Error(data.error);
      }

      if (data?.wave_launch_url) {
        window.location.href = data.wave_launch_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      setIsProcessing(false);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const resetModal = () => {
    setStep(1);
    setAmount("");
    setIsProcessing(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {step === 3 ? "Paiement réussi !" : `Payer pour ${projectTitle}`}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Choisissez le montant de votre paiement"}
            {step === 3 && "Merci pour votre confiance !"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-2">
              {predefinedAmounts.map((preset) => (
                <Button
                  key={preset}
                  variant={amount === preset.toString() ? "default" : "outline"}
                  onClick={() => setAmount(preset.toString())}
                  className="text-sm"
                >
                  {preset.toLocaleString()}
                </Button>
              ))}
            </div>

            <div className="space-y-2">
              <Label className="text-foreground">Ou entrez un montant personnalisé</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Montant en FCFA"
                  className="pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  FCFA
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Minimum: {minAmount.toLocaleString()} FCFA</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">Paiement via Wave</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Vous serez redirigé vers Wave pour finaliser votre paiement en toute sécurité.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-success" />
              <span>Paiement sécurisé par Wave</span>
            </div>

            <Button 
              variant="default" 
              className="w-full"
              onClick={handlePayment}
              disabled={!amount || parseFloat(amount) < minAmount || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection vers Wave...
                </>
              ) : (
                `Payer ${amount ? parseFloat(amount).toLocaleString() : '0'} FCFA`
              )}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-16 h-16 mx-auto bg-success/20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-xl font-semibold mb-2 text-foreground">Merci pour votre paiement !</p>
              <p className="text-muted-foreground">
                Votre paiement de {parseFloat(amount).toLocaleString()} FCFA a été enregistré avec succès.
              </p>
            </div>
            <Button variant="default" onClick={resetModal} className="w-full">
              Fermer
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
