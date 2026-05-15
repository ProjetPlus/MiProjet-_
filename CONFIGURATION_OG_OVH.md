# Configuration obligatoire OVH pour les aperçus sociaux

Le domaine `ivoireprojet.com` ne pointe pas actuellement vers Lovable. Les robots sociaux reçoivent donc la page SPA générique au lieu des meta tags dynamiques, ce qui explique l'absence d'image et de résumé sur WhatsApp, Facebook, LinkedIn et X.

## Diagnostic confirmé

- `https://ivoireprojet.com/n/art015/04/026` renvoie actuellement l'`index.html` générique.
- `https://nrrgqnruoylwztddkntm.supabase.co/functions/v1/og-image?s=art015-04-026` renvoie bien les balises `og:title`, `og:description`, `og:image`.
- Tant que le serveur OVH ne redirige pas les robots sociaux sur cette URL OG, les aperçus resteront cassés.

## Fichier à mettre sur OVH

Déployez `public/.htaccess` à la racine publique du site sur OVH.

## Résultat attendu

- navigateur humain → `https://ivoireprojet.com/n/art003/04/026` charge la SPA normalement
- robot social → la même URL reçoit le HTML OG dynamique avec image de couverture, titre et résumé exacts

## Vérification rapide

Testez ensuite :

- WhatsApp : coller `https://ivoireprojet.com/n/art015/04/026`
- Facebook Sharing Debugger
- LinkedIn Post Inspector

Ils doivent tous afficher la couverture de l'article et le résumé.