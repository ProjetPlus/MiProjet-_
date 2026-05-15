
-- Add admin role for innocentkoffi1@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('2a18849a-b133-4a15-bde9-34f78cdc6291', 'admin')
ON CONFLICT DO NOTHING;

-- Add lifetime Elite subscription for innocentkoffi1@gmail.com
INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, auto_renew)
VALUES ('2a18849a-b133-4a15-bde9-34f78cdc6291', '4813ae95-bb8a-428d-b73b-574e5fd8c401', 'active', now(), now() + interval '100 years', 'lifetime', false)
ON CONFLICT DO NOTHING;

-- Add lifetime Elite subscription for marcelkonan@ivoireprojet.com
INSERT INTO public.user_subscriptions (user_id, plan_id, status, started_at, expires_at, payment_method, auto_renew)
VALUES ('47a55256-06ea-41b9-ab03-9a9fcb99c620', '4813ae95-bb8a-428d-b73b-574e5fd8c401', 'active', now(), now() + interval '100 years', 'lifetime', false)
ON CONFLICT DO NOTHING;
