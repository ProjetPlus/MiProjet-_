
-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Public read access for documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create news-media bucket for admin uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('news-media', 'news-media', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read news-media" ON storage.objects FOR SELECT USING (bucket_id = 'news-media');
CREATE POLICY "Admin can upload news-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'news-media' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can delete news-media" ON storage.objects FOR DELETE USING (bucket_id = 'news-media' AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert subscription plans
INSERT INTO public.subscription_plans (name, description, price, currency, duration_days, duration_type, sort_order, is_active, features) VALUES
('Mensuel', 'Accès complet pendant 1 mois', 5000, 'XOF', 30, 'monthly', 1, true, '["Accès aux opportunités exclusives", "Alertes personnalisées", "Support par email", "Accès au forum abonnés"]'::jsonb),
('Trimestriel', 'Accès complet pendant 3 mois', 12500, 'XOF', 90, 'quarterly', 2, true, '["Accès aux opportunités exclusives", "Alertes personnalisées", "Support prioritaire", "Accès au forum abonnés", "Webinaires mensuels"]'::jsonb),
('Semestriel', 'Le plus choisi - 6 mois d''accès', 20000, 'XOF', 180, 'semiannual', 3, true, '["Accès aux opportunités exclusives", "Alertes personnalisées", "Support VIP", "Accès au forum abonnés", "Webinaires mensuels", "Coaching personnalisé"]'::jsonb),
('Annuel', 'Offre la plus avantageuse - 12 mois', 30000, 'XOF', 365, 'annual', 4, true, '["Accès aux opportunités exclusives", "Alertes personnalisées", "Support VIP dédié", "Accès au forum abonnés", "Webinaires illimités", "Coaching personnalisé", "Certification MIPROJET", "Mise en relation investisseurs"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Insert demo news articles
INSERT INTO public.news (title, content, excerpt, category, status, is_featured, published_at, image_url) VALUES
('LANCEMENT DU PROGRAMME D''ACCOMPAGNEMENT MIPROJET 2026', '🚀 LANCEMENT DU PROGRAMME D''ACCOMPAGNEMENT MIPROJET 2026

MIPROJET lance officiellement son programme d''accompagnement 2026 pour les porteurs de projets en Afrique de l''Ouest.

📌 OBJECTIFS DU PROGRAMME
Ce programme vise à structurer 200 projets innovants dans les domaines de l''agriculture, du numérique, de la santé et de l''énergie renouvelable.

💡 AVANTAGES
- Structuration selon la norme ISO 21500
- Rédaction de business plans professionnels
- Coaching personnalisé pendant 6 mois
- Mise en relation avec des investisseurs

📧 CONTACT
info@ivoireprojet.com | +225 07 07 16 79 21

#MIPROJET #Accompagnement #Entrepreneuriat', 'MIPROJET lance son programme d''accompagnement 2026 pour 200 projets innovants en Afrique de l''Ouest.', 'events', 'published', true, now(), 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop'),

('PARTENARIAT STRATÉGIQUE AVEC LA BAD POUR LE FINANCEMENT DE PROJETS', '🤝 PARTENARIAT STRATÉGIQUE AVEC LA BAD

MIPROJET a signé un accord de partenariat avec la Banque Africaine de Développement pour faciliter l''accès au financement des projets structurés.

📌 DÉTAILS DU PARTENARIAT
- Enveloppe de 5 milliards FCFA dédiée
- Prêts à taux préférentiels pour les projets labellisés
- Accompagnement technique renforcé

✅ CONDITIONS
Les projets doivent avoir obtenu le label MIPROJET de qualité (score A ou B).

📧 CONTACT
info@ivoireprojet.com

#MIPROJET #BAD #Financement', 'Partenariat avec la BAD pour un accès facilité au financement des projets labellisés MIPROJET.', 'partnerships', 'published', true, now() - interval '2 days', 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=500&fit=crop'),

('FORMATION EN GESTION DE PROJETS - SESSION MARS 2026', '📚 FORMATION EN GESTION DE PROJETS

MIPROJET organise une session intensive de formation en gestion de projets selon les normes internationales.

📅 DATES
Du 15 au 20 mars 2026, à Abidjan.

📌 PROGRAMME
- Introduction à la norme ISO 21500
- Élaboration de business plans
- Gestion des risques
- Techniques de pitch

💰 TARIF
Gratuit pour les abonnés MIPROJET. 50 000 FCFA pour les non-abonnés.

📧 Inscription: info@ivoireprojet.com

#MIPROJET #Formation #GestionDeProjet', 'Session intensive de formation en gestion de projets du 15 au 20 mars 2026 à Abidjan.', 'training', 'published', false, now() - interval '5 days', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=500&fit=crop');

-- Insert demo opportunities
INSERT INTO public.opportunities (title, description, content, opportunity_type, category, status, is_active, is_featured, published_at, location, eligibility, amount_min, amount_max, currency, deadline, contact_email, contact_phone) VALUES
('APPEL À PROJETS INNOVANTS - FONDS VERT AFRIQUE 2026', 'Financement de projets verts et durables en Afrique de l''Ouest', '🌿 APPEL À PROJETS INNOVANTS - FONDS VERT AFRIQUE 2026

Le Fonds Vert pour l''Afrique lance un appel à projets pour financer les initiatives vertes et durables.

📌 OBJECTIFS
- Soutenir l''agriculture durable
- Promouvoir les énergies renouvelables
- Encourager l''économie circulaire

💰 MONTANT
De 5 000 000 à 50 000 000 FCFA par projet.

✅ CRITÈRES D''ÉLIGIBILITÉ
- Porteurs de projets africains
- Projet à impact environnemental positif
- Business plan structuré (label MIPROJET recommandé)

📅 DATE LIMITE
30 juin 2026

📧 CONTACT MIPROJET
info@ivoireprojet.com | +225 07 07 16 79 21

#MIPROJET #FondsVert #Entrepreneuriat', 'funding', 'funding', 'published', true, true, now(), 'Afrique de l''Ouest', 'Porteurs de projets africains avec un projet à impact environnemental', 5000000, 50000000, 'XOF', (now() + interval '4 months')::timestamptz, 'info@ivoireprojet.com', '+225 07 07 16 79 21'),

('PROGRAMME DE FORMATION ENTREPRENEURIALE - GOOGLE AFRICA', 'Programme de formation gratuit pour entrepreneurs africains', '🎓 PROGRAMME GOOGLE AFRICA - FORMATION ENTREPRENEURIALE

Google lance un programme de formation gratuit pour les entrepreneurs africains dans le domaine du numérique.

📌 CONTENU
- Marketing digital
- E-commerce
- Développement web/mobile
- Intelligence artificielle appliquée

💡 AVANTAGES
- Formation 100% gratuite
- Certification Google
- Mentorat personnalisé
- Accès à l''écosystème Google

📅 INSCRIPTION
Avant le 15 mai 2026

📧 CONTACT MIPROJET
info@ivoireprojet.com

#MIPROJET #Google #Formation', 'training', 'training', 'published', true, true, now() - interval '1 day', 'En ligne', 'Entrepreneurs africains de 18 à 40 ans', null, null, 'XOF', (now() + interval '3 months')::timestamptz, 'info@ivoireprojet.com', '+225 07 07 16 79 21'),

('SUBVENTION BAD - PROJETS AGRICOLES DURABLES', 'Subventions de la BAD pour des projets agricoles en Afrique', '🌾 SUBVENTION BAD - PROJETS AGRICOLES DURABLES

La Banque Africaine de Développement offre des subventions pour les projets agricoles durables.

💰 MONTANT
Jusqu''à 100 000 000 FCFA par projet.

📌 SECTEURS ÉLIGIBLES
- Agriculture biologique
- Transformation agroalimentaire
- Irrigation solaire
- Chaîne de valeur agricole

✅ CONDITIONS
- Projet structuré avec business plan
- Impact social mesurable
- Minimum 20 emplois créés

📧 CONTACT
info@ivoireprojet.com | +225 07 07 16 79 21

#MIPROJET #BAD #Agriculture', 'grant', 'funding', 'published', true, false, now() - interval '3 days', 'Afrique subsaharienne', 'Entreprises agricoles avec minimum 2 ans d''existence', 10000000, 100000000, 'XOF', (now() + interval '6 months')::timestamptz, 'info@ivoireprojet.com', '+225 07 07 16 79 21');

-- Insert demo projects
INSERT INTO public.projects (title, description, category, sector, country, city, status, funding_goal, current_funding, owner_id, image_url) 
SELECT 
  'Ferme Avicole Moderne - Daloa',
  'Projet de création d''une ferme avicole moderne à Daloa avec une capacité de 10 000 poulets. Objectif: produire 2 tonnes de viande par mois et créer 25 emplois directs.',
  'agriculture',
  'Élevage avicole',
  'Côte d''Ivoire',
  'Daloa',
  'published',
  25000000,
  5000000,
  id,
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&h=500&fit=crop'
FROM auth.users LIMIT 1;

INSERT INTO public.projects (title, description, category, sector, country, city, status, funding_goal, current_funding, owner_id, image_url) 
SELECT 
  'Plateforme E-commerce Agricole',
  'Marketplace digitale connectant producteurs agricoles et acheteurs en Afrique de l''Ouest. Technologies: React, Node.js, paiement mobile intégré.',
  'technologie',
  'Agritech',
  'Côte d''Ivoire',
  'Abidjan',
  'published',
  15000000,
  3000000,
  id,
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop'
FROM auth.users LIMIT 1;

INSERT INTO public.projects (title, description, category, sector, country, city, status, funding_goal, current_funding, owner_id, image_url) 
SELECT 
  'Centre de Formation Numérique - Bouaké',
  'Création d''un centre de formation aux métiers du numérique pour les jeunes de Bouaké. Capacité: 100 apprenants par session.',
  'education',
  'Formation numérique',
  'Côte d''Ivoire',
  'Bouaké',
  'published',
  35000000,
  8000000,
  id,
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop'
FROM auth.users LIMIT 1;
