-- Create referral system table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referee_id UUID,
  referral_code VARCHAR(20) NOT NULL UNIQUE,
  referral_link TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'paid')),
  commission_rate NUMERIC(5,2) DEFAULT 6.5,
  commission_amount NUMERIC(15,2) DEFAULT 0,
  payment_id UUID REFERENCES public.payments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Create policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Users can create referrals for themselves" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

-- Add referral tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by VARCHAR(20);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_commissions NUMERIC(15,2) DEFAULT 0;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_id UUID)
RETURNS VARCHAR(20)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code VARCHAR(20);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric code
    new_code := 'MIP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS (SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  -- Update the user's profile with the new code
  UPDATE profiles SET referral_code = new_code WHERE id = user_id;
  
  RETURN new_code;
END;
$$;

-- Create function to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.auto_generate_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'MIP-' || UPPER(SUBSTRING(MD5(NEW.id::TEXT || RANDOM()::TEXT) FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto referral code generation
DROP TRIGGER IF EXISTS trigger_auto_referral_code ON profiles;
CREATE TRIGGER trigger_auto_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION auto_generate_referral_code();

-- Admin policy for referrals
CREATE POLICY "Admins can view all referrals" 
ON public.referrals 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));