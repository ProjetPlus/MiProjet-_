
-- Create a function to grant lifetime subscriptions to specific emails
-- This will be called as a trigger when users sign up or can be run manually

CREATE OR REPLACE FUNCTION public.grant_lifetime_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lifetime_emails TEXT[] := ARRAY[
    'innocentkoffi1@gmail.com',
    'inocent.koffi@agricapital.ci',
    'marcelkonan@ivoireprojet.com',
    'marcelkonankan@gmail.com',
    'admin@miprojet.ci'
  ];
  default_plan_id UUID;
BEGIN
  -- Check if the new user's email is in the lifetime list
  IF NEW.email = ANY(lifetime_emails) THEN
    -- Get a plan ID (use the first active plan)
    SELECT id INTO default_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY sort_order LIMIT 1;
    
    IF default_plan_id IS NOT NULL THEN
      -- Insert lifetime subscription (expires in 100 years)
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
  
  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (after insert, since handle_new_user creates the profile)
CREATE TRIGGER grant_lifetime_subscription_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.grant_lifetime_subscription();

-- Grant lifetime subscriptions to existing users with these emails
DO $$
DECLARE
  lifetime_emails TEXT[] := ARRAY[
    'innocentkoffi1@gmail.com',
    'inocent.koffi@agricapital.ci',
    'marcelkonan@ivoireprojet.com',
    'marcelkonankan@gmail.com',
    'admin@miprojet.ci'
  ];
  default_plan_id UUID;
  user_record RECORD;
BEGIN
  SELECT id INTO default_plan_id FROM public.subscription_plans WHERE is_active = true ORDER BY sort_order LIMIT 1;
  
  IF default_plan_id IS NOT NULL THEN
    FOR user_record IN 
      SELECT p.id, p.email FROM public.profiles p WHERE p.email = ANY(lifetime_emails)
    LOOP
      INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, auto_renew)
      VALUES (
        user_record.id,
        default_plan_id,
        'active',
        now(),
        now() + interval '100 years',
        'lifetime',
        false
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- Add payment_reference column to user_subscriptions if missing (for webhook tracking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_subscriptions' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN payment_reference TEXT;
  END IF;
END;
$$;
