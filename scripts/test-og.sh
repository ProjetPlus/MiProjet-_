#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# test-og.sh — Vérifie le rendu OG/WhatsApp pour News, Opportunités, Articles.
#
# Usage:
#   ./scripts/test-og.sh                                # exemples par défaut
#   ./scripts/test-og.sh actualites art001-05-026       # un seul slug
#   PREFIX=opportunites SLUG=opp042-04-026 ./scripts/test-og.sh
#
# Simule l'User-Agent de WhatsApp/Facebook puis extrait og:title, og:description
# et og:image réellement renvoyés par la page.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SITE="${SITE:-https://ivoireprojet.com}"
UA="WhatsApp/2.23.20.0 A"   # WhatsApp link preview crawler
# Fallback réaliste : facebookexternalhit (utilisé aussi par WhatsApp)
UA_FB="facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; NC=$'\033[0m'

extract_meta() {
  # $1 = html, $2 = property name (og:title, og:image, ...)
  local html="$1" prop="$2"
  echo "$html" \
    | grep -oiE "<meta[^>]+(property|name)=[\"']${prop}[\"'][^>]*content=[\"'][^\"']*[\"']|<meta[^>]+content=[\"'][^\"']*[\"'][^>]*(property|name)=[\"']${prop}[\"']" \
    | head -1 \
    | grep -oiE "content=[\"'][^\"']*[\"']" \
    | sed -E "s/content=[\"']([^\"']*)[\"']/\1/"
}

test_one() {
  local prefix="$1" slug="$2"
  local url="${SITE}/${prefix}/${slug}"
  echo
  echo "${BOLD}── ${prefix}/${slug}${NC}"
  echo "URL: ${url}"

  local response status html
  response=$(curl -sS -L -A "$UA_FB" -w "\n__HTTP_STATUS__:%{http_code}" "$url" || true)
  status=$(echo "$response" | grep -oE "__HTTP_STATUS__:[0-9]+" | cut -d: -f2)
  html=$(echo "$response" | sed -E 's/__HTTP_STATUS__:[0-9]+$//')

  if [[ "$status" != "200" ]]; then
    echo "  ${RED}HTTP ${status}${NC}"
    return 1
  fi
  echo "  HTTP ${GREEN}${status}${NC}"

  local title desc image tcard
  title=$(extract_meta "$html" "og:title")
  desc=$(extract_meta  "$html" "og:description")
  image=$(extract_meta "$html" "og:image")
  tcard=$(extract_meta "$html" "twitter:card")

  print_field() {
    local label="$1" val="$2"
    if [[ -z "$val" ]]; then
      echo "  ${RED}✗ ${label}: absent${NC}"
    else
      echo "  ${GREEN}✓${NC} ${label}: ${val}"
    fi
  }
  print_field "og:title       " "$title"
  print_field "og:description " "$desc"
  print_field "og:image       " "$image"
  print_field "twitter:card   " "$tcard"

  # Vérifie que l'image OG répond bien en 200 + Content-Type image/*
  if [[ -n "$image" ]]; then
    local img_status img_type
    img_status=$(curl -sS -L -o /dev/null -w "%{http_code}" -A "$UA_FB" "$image" || echo "000")
    img_type=$(curl -sS -L -o /dev/null -w "%{content_type}" -A "$UA_FB" "$image" || echo "")
    if [[ "$img_status" == "200" && "$img_type" == image/* ]]; then
      echo "  ${GREEN}✓${NC} og:image atteint (${img_status}, ${img_type})"
    else
      echo "  ${YELLOW}⚠${NC}  og:image status=${img_status} content-type=${img_type}"
    fi
  fi
}

# ── Exemples par défaut (à adapter à vos slugs réels) ───────────────────────
if [[ $# -eq 2 ]]; then
  test_one "$1" "$2"
  exit 0
fi

if [[ -n "${PREFIX:-}" && -n "${SLUG:-}" ]]; then
  test_one "$PREFIX" "$SLUG"
  exit 0
fi

echo "${BOLD}Test OG WhatsApp/Facebook — ${SITE}${NC}"
echo "Astuce: passez 'PREFIX=… SLUG=…' ou './test-og.sh prefix slug' pour cibler un item."

# Remplacez par les short_slug réels de votre base
EXAMPLES=(
  "actualites art001-05-026"
  "opportunites opp001-05-026"
  "articles art001-05-026"
)
for line in "${EXAMPLES[@]}"; do
  read -r prefix slug <<<"$line"
  test_one "$prefix" "$slug" || true
done

echo
echo "${BOLD}Validateurs en ligne :${NC}"
echo "  Facebook  : https://developers.facebook.com/tools/debug/"
echo "  LinkedIn  : https://www.linkedin.com/post-inspector/"
echo "  WhatsApp  : pas de validateur officiel — testez en envoyant le lien dans un chat"