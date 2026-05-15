-- Create subscription plans table
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    duration_type TEXT NOT NULL CHECK (duration_type IN ('weekly', 'monthly', 'quarterly', 'semiannual', 'annual')),
    duration_days INTEGER NOT NULL,
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'XOF',
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    started_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    payment_id UUID REFERENCES public.payments(id),
    payment_method TEXT,
    payment_reference TEXT,
    auto_renew BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create opportunities table (member-only content)
CREATE TABLE public.opportunities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('funding', 'training', 'accompaniment', 'partnership', 'grant', 'other')),
    category TEXT DEFAULT 'general',
    image_url TEXT,
    deadline DATE,
    location TEXT,
    eligibility TEXT,
    amount_min NUMERIC,
    amount_max NUMERIC,
    currency TEXT DEFAULT 'XOF',
    external_link TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    author_id UUID NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Subscription plans policies (public read, admin manage)
CREATE POLICY "Anyone can read active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage plans" ON public.subscription_plans
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- User subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" ON public.user_subscriptions
    FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Opportunities policies (subscribers only can view published)
CREATE POLICY "Admins can manage opportunities" ON public.opportunities
    FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Subscribers can view published opportunities" ON public.opportunities
    FOR SELECT USING (
        status = 'published' AND is_active = true AND (
            has_role(auth.uid(), 'admin') OR
            EXISTS (
                SELECT 1 FROM public.user_subscriptions us
                WHERE us.user_id = auth.uid()
                AND us.status = 'active'
                AND us.expires_at > now()
            )
        )
    );

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, duration_type, duration_days, price, features, sort_order) VALUES
('Hebdomadaire', 'Accès complet pendant 1 semaine', 'weekly', 7, 3000, '["Accès aux opportunités de financement", "Accès aux formations", "Alertes opportunités"]'::jsonb, 1),
('Mensuel', 'Accès complet pendant 1 mois', 'monthly', 30, 5000, '["Accès aux opportunités de financement", "Accès aux formations", "Accompagnement personnalisé", "Alertes opportunités"]'::jsonb, 2),
('Trimestriel', 'Accès complet pendant 3 mois - Économisez 40%', 'quarterly', 90, 10000, '["Accès aux opportunités de financement", "Accès aux formations", "Accompagnement personnalisé", "Alertes prioritaires", "Support dédié"]'::jsonb, 3),
('Semestriel', 'Accès complet pendant 6 mois - Économisez 50%', 'semiannual', 180, 25000, '["Accès illimité aux opportunités", "Formations premium", "Accompagnement VIP", "Alertes prioritaires", "Support dédié", "Webinaires exclusifs"]'::jsonb, 4),
('Annuel', 'Accès complet pendant 1 an - Meilleure offre', 'annual', 365, 50000, '["Accès illimité aux opportunités", "Toutes les formations", "Accompagnement VIP", "Alertes prioritaires", "Support premium 24/7", "Webinaires exclusifs", "Événements VIP"]'::jsonb, 5);

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_subscriptions
        WHERE user_id = user_uuid
        AND status = 'active'
        AND expires_at > now()
    )
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at
    BEFORE UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();