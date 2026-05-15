
-- Update existing news articles to published status
UPDATE public.news SET status = 'published', published_at = now() WHERE status = 'archived';

-- Insert 3 additional test news articles
INSERT INTO public.news (title, content, excerpt, category, status, published_at, is_featured, image_url) VALUES
(
  'MIPROJET ouvre ses portes aux entrepreneurs du Sénégal et du Mali',
  'MIPROJET étend ses services de structuration de projets aux entrepreneurs du Sénégal et du Mali. Cette expansion marque une étape importante dans notre mission panafricaine d''accompagnement des porteurs de projets à fort potentiel. Les entrepreneurs de ces deux pays pourront désormais bénéficier de nos services de structuration, d''évaluation et de mise en relation avec des investisseurs.',
  'MIPROJET étend ses services aux entrepreneurs du Sénégal et du Mali, renforçant sa mission panafricaine.',
  'expansion',
  'published',
  now() - interval '1 day',
  true,
  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=800&h=500&fit=crop'
),
(
  'Programme de financement : 500 millions FCFA mobilisés pour les PME ivoiriennes',
  'Grâce à nos partenaires financiers, MIPROJET a contribué à mobiliser plus de 500 millions FCFA de financements pour les PME ivoiriennes au cours du premier trimestre 2026. Ce résultat témoigne de l''efficacité de notre approche de structuration et de mise en relation entre porteurs de projets et bailleurs de fonds.',
  '500 millions FCFA mobilisés pour les PME grâce au réseau de partenaires MIPROJET.',
  'financement',
  'published',
  now() - interval '3 days',
  false,
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop'
),
(
  'Atelier de formation : Maîtriser la rédaction d''un business plan bancable',
  'MIPROJET organise un atelier intensif de 3 jours sur la rédaction de business plans bancables. Cet atelier, destiné aux entrepreneurs et porteurs de projets, couvre les techniques de présentation financière, l''analyse de marché et les stratégies de pitch auprès des investisseurs. Inscription ouverte jusqu''au 30 mars 2026.',
  'Atelier intensif de 3 jours sur la rédaction de business plans bancables.',
  'formation',
  'published',
  now() - interval '5 days',
  false,
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop'
);
