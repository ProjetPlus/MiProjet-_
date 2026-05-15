import { supabase } from '@/integrations/supabase/client';

type NotificationType = 
  | 'inscription'
  | 'paiement' 
  | 'opportunite'
  | 'expiration_abonnement'
  | 'validation_dossier'
  | 'nouveau_contenu'
  | 'bienvenue';

interface SendWhatsAppParams {
  phone: string;
  message: string;
  notification_type: NotificationType;
  user_id?: string;
}

export const useWhatsAppNotification = () => {
  const sendWhatsApp = async ({ phone, message, notification_type, user_id }: SendWhatsAppParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('miprojet-assistant', {
        body: {
          action: 'send_whatsapp',
          phone,
          message,
          notification_type,
          user_id,
        }
      });

      if (error) {
        console.error('WhatsApp notification error:', error);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error('WhatsApp notification error:', err);
      return { success: false, error: err };
    }
  };

  const notifyInscription = (phone: string, name: string, userId?: string) =>
    sendWhatsApp({
      phone,
      message: `Bienvenue ${name} sur MIPROJET ! Votre inscription a été confirmée. Découvrez les opportunités sur ivoireprojet.com`,
      notification_type: 'inscription',
      user_id: userId,
    });

  const notifyPaiement = (phone: string, plan: string, amount: number, userId?: string) =>
    sendWhatsApp({
      phone,
      message: `Paiement confirmé pour ${plan} - ${amount.toLocaleString()} FCFA. Votre abonnement MIPROJET est maintenant actif.`,
      notification_type: 'paiement',
      user_id: userId,
    });

  const notifyOpportunite = (phone: string, title: string, userId?: string) =>
    sendWhatsApp({
      phone,
      message: `Nouvelle opportunité disponible : ${title}. Consultez-la sur ivoireprojet.com/opportunities`,
      notification_type: 'opportunite',
      user_id: userId,
    });

  const notifyExpirationAbonnement = (phone: string, daysLeft: number, userId?: string) =>
    sendWhatsApp({
      phone,
      message: `Votre abonnement MIPROJET expire dans ${daysLeft} jours. Renouvelez pour continuer à accéder aux opportunités.`,
      notification_type: 'expiration_abonnement',
      user_id: userId,
    });

  return {
    sendWhatsApp,
    notifyInscription,
    notifyPaiement,
    notifyOpportunite,
    notifyExpirationAbonnement,
  };
};
