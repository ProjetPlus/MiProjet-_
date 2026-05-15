
-- Update the grant_lifetime_subscription function to include new admin emails
-- and also auto-assign admin role for admin emails
CREATE OR REPLACE FUNCTION public.grant_lifetime_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lifetime_emails TEXT[] := ARRAY[
    'innocentkoffi1@gmail.com',
    'inocent.koffi@agricapital.ci',
    'marcelkonan@ivoireprojet.com',
    'marcelkonankan@gmail.com',
    'admin@miprojet.ci',
    'admin@ivoireprojet.com'
  ];
  admin_emails TEXT[] := ARRAY[
    'admin@miprojet.ci',
    'admin@ivoireprojet.com',
    'marcelkonan@ivoireprojet.com'
  ];
  default_plan_id UUID;
BEGIN
  -- Grant lifetime subscription
  IF NEW.email = ANY(lifetime_emails) THEN
    SELECT id INTO default_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY sort_order DESC LIMIT 1;
    
    IF default_plan_id IS NOT NULL THEN
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, auto_renew)
      VALUES (
        NEW.id,
        default_plan_id,
        'active',
        now(),
        now() + interval '100 years',
        'lifetime',
        false
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- Auto-assign admin role
  IF NEW.email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_profile_created_grant_lifetime ON public.profiles;
CREATE TRIGGER on_profile_created_grant_lifetime
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.grant_lifetime_subscription();

-- Add phone/whatsapp column to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
