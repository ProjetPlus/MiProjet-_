# Plan — Refonte MIPROJET inspirée Belife + sécurité + mailing pro

Travail très large : je propose de livrer en **vagues** courtes pour que vous voyiez du concret rapidement, dans l'ordre exact de votre demande (refonte EN PRIORITÉ).

---

## 🎨 VAGUE 1 — Refonte globale style Belife (PRIORITÉ ABSOLUE)

### 1.1 Charte graphique stricte sur le logo MiProjet
Couleurs extraites du logo :
- **Bleu MiProjet** `#1B6FB5` (le "M" et "PROJET")
- **Vert MiProjet** `#5BA84A` (le tiret + "Entrepreneuriat jeune")
- **Bleu foncé navy** `#0F4C81` pour profondeur
- Blanc / gris très clair pour fond
- Refonte complète de `src/index.css` (tokens HSL/oklch cohérents, gradients bleu→vert, ombres douces)

### 1.2 Navigation style Belife (voir capture jointe)
- **Top bar fine** orange/accent : "Particuliers · Professionnels · Investisseurs" + "Agences & contact" + icônes sociales à droite
- **Barre principale blanche aérée** : Logo gauche · Menus centrés (À propos, Nos offres, Opportunités, Actualités, Contact) avec dropdowns au survol · à droite : recherche 🔍 + **bouton "MiProjet+" détaché** (pill arrondi gradient vert→bleu) + icône téléphone
- Menus dropdowns larges (mega-menu) avec colonnes thématiques
- Mobile : drawer plein écran clean
- Sticky avec rétrécissement au scroll

### 1.3 Hero carousel automatique
- Hero plein écran avec **carousel auto-défilant** (5s) des Actualités + Opportunités
- Filtrage selon abonnement (public / Premium / Elite)
- Flèches gauche/droite manuelles + dots indicateurs
- Chaque slide : image cover + badge type (Actualité / Opportunité) + titre + extrait + CTA "Découvrir"
- Animations fluides (framer-motion)

### 1.4 Refonte de TOUTES les pages publiques
Sections home : Hero carousel → Stats → Services → Comment ça marche → Types de financement → Projets en vedette → Témoignages → Actualités → CTA → Footer
Pages refondues : Accueil, About, Services, Projects, Opportunities, News, Blog, Contact, FAQ, Documents, Subscription, Auth, Dashboard, MiProjet+, Admin (toutes), formulaires (StructuringForm, EnterpriseForm, Submit, Evaluation)

### 1.5 Responsive parfait
Audit mobile (375px), tablette (768px), desktop (1280px+) sur chaque page. Containers, paddings, breakpoints sm/md/lg/xl/2xl cohérents. Suppression de tout débordement horizontal.

---

## 🔐 VAGUE 2 — Sécurité

- **Leaked Password Protection** : action manuelle dashboard Supabase (je documenterai dans un encart admin)
- **opportunities.contact_email/phone** : déjà restreint aux `authenticated` (vérification + test)
- **email_events INSERT** : ajouter policy explicite "service_role only" pour bloquer tout client
- **Page admin "Sécurité"** : nouvelle entrée avec checklist (open / fixed / re-test), lien vers fix, statut live depuis `security--get_scan_results`

## 📧 VAGUE 3 — Mailing pro

### 3.1 Monitoring temps réel
Page `AdminEmailMonitoring` : quotas Brevo/Resend, taux ouverture/clic/bounce, échecs avec bouton "renvoyer", stats par segment, polling 15s.

### 3.2 Webhooks dashboard
Page dédiée events bruts Resend (+ Brevo si dispo) avec correspondance `email_logs`.

### 3.3 Éditeur WYSIWYG TipTap
Remplace HTML brut. Toolbar complète + upload images bucket `email-assets` + insertion CTA + preview desktop/mobile + génération IA initiale.

### 3.4 Automatisations cron (pg_cron + pg_net)
- Cron quotidien : abonnements expirant 7j → email rappel
- Cron quotidien : nouvelles opportunités du jour groupées par segment
- Cron horaire : retry échecs (max 3 tentatives, backoff)
- Newsletter planifiée (date/heure choisie dans hub admin)

---

## 📋 Détails techniques

```text
Fichiers refondus (Vague 1 — non exhaustif) :
  src/index.css                            ← tokens MiProjet stricts
  src/components/Navigation.tsx            ← style Belife (top bar + menu aéré + MP+ détaché)
  src/components/Hero.tsx                  ← carousel actu/oppo
  src/components/HeroCarousel.tsx          ← nouveau
  src/components/Footer.tsx                ← refonte
  src/components/Features|Services|...     ← refonte
  src/pages/*                              ← audit + ajustements
  src/components/admin/*                   ← refonte UI
  src/pages/miprojet-plus/*                ← refonte UI

Vague 2 :
  supabase/migrations/...                  ← email_events policy
  src/components/admin/AdminSecurityCheck.tsx ← nouveau

Vague 3 :
  src/components/admin/EmailMonitoringDashboard.tsx
  src/components/admin/EmailWebhooksDashboard.tsx
  src/components/admin/EmailVisualEditor.tsx (TipTap)
  supabase/migrations/...                  ← cron jobs + bucket email-assets
  bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

---

## 🚀 Ordre d'exécution

1. **Vague 1.1 + 1.2 + 1.3** (tokens + nav Belife + hero carousel) — livrable visible immédiat
2. **Vague 1.4 + 1.5** (refonte pages restantes + responsive)
3. **Vague 2** (sécurité)
4. **Vague 3.1 + 3.2** (monitoring + webhooks)
5. **Vague 3.3** (WYSIWYG TipTap)
6. **Vague 3.4** (crons)

Je commence **immédiatement par la Vague 1.1 → 1.3** (impact visuel maximal). Confirmez ce plan et j'attaque.
