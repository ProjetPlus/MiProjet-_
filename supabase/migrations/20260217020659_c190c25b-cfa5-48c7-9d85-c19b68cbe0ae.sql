-- Update Essentiel plan features (remove nothing specific but keeping clean)
UPDATE subscription_plans 
SET features = '["Accès illimités aux subventions locales & internationales", "Opportunités de partenariats & financements", "Alertes personnalisées", "Support par email", "Accès au forum abonnés"]'::jsonb
WHERE id = 'b32e1be6-1e83-4bd9-aa32-92f8588c5f48';

-- Update Avancé plan: remove "Webinaires mensuels" and "Support prioritaire"
UPDATE subscription_plans 
SET features = '["Accès illimités aux subventions locales & internationales", "Opportunités de partenariats & financements", "Alertes personnalisées prioritaires", "Support par email", "Accès au forum abonnés"]'::jsonb
WHERE id = '81a1a5e9-c938-4b89-a637-e6e678af4827';

-- Add promo_premium_count to platform_settings for tracking the 100 first subscribers
INSERT INTO platform_settings (key, value, category)
VALUES ('promo_premium_count', '0', 'promo')
ON CONFLICT DO NOTHING;

-- Add test_payment_count to platform_settings
INSERT INTO platform_settings (key, value, category)
VALUES ('test_payment_count', '0', 'payment')
ON CONFLICT DO NOTHING;