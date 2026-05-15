-- Update lifetime subscriptions to use Premium plan instead of Elite
UPDATE user_subscriptions 
SET plan_id = 'a5c6318b-2dcf-4bc5-af36-87d9ef94082d'
WHERE payment_method = 'lifetime';

-- Update the trigger to use Premium plan (sort_order = 3) instead of highest sort_order
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
  premium_plan_id UUID;
BEGIN
  -- Grant lifetime subscription with Premium plan
  IF NEW.email = ANY(lifetime_emails) THEN
    SELECT id INTO premium_plan_id FROM public.subscription_plans WHERE name = 'Premium' AND is_active = true LIMIT 1;
    
    IF premium_plan_id IS NULL THEN
      SELECT id INTO premium_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY price DESC LIMIT 1;
    END IF;
    
    IF premium_plan_id IS NOT NULL THEN
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, auto_renew)
      VALUES (
        NEW.id,
        premium_plan_id,
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