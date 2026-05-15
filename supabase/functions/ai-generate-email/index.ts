import { requireAdmin } from "../_shared/requireAdmin.ts";
import { brandedEmailShell, corsHeaders } from "../_shared/resend.ts";

/**
 * Génère un email IA pour la plateforme MIPROJET.
 *
 * STRUCTURE OBLIGATOIRE (ordre éditorial) :
 *   1. subject   — objet de l'email
 *   2. title     — H1 affiché EN HAUT (rendu par le shell)
 *   3. salutation — "Bonjour {nom}," AJOUTÉE AUTOMATIQUEMENT par le shell
 *   4. innerHtml — corps du message UNIQUEMENT
 *
 * ❌ INTERDIT : que innerHtml contienne "Bonjour", "Cher/Chère", "Hello", ou un H1
 *    (le shell s'en charge). Cela évite le double "Bonjour" historique.
 */

const SYSTEM_PROMPT = `Tu es un expert en email marketing pour MIPROJET, plateforme panafricaine de structuration et de financement de projets en Côte d'Ivoire et en Afrique.

Génère un email PROFESSIONNEL en français.

⚠️ RÈGLES STRICTES — LIRE ATTENTIVEMENT :
- Le système ajoute AUTOMATIQUEMENT le titre H1 ET la salutation "Bonjour {prénom},"
- Donc : NE JAMAIS commencer le corps par "Bonjour", "Cher", "Hello", "Salut" ou toute autre formule de politesse d'ouverture
- Donc : NE JAMAIS inclure de balise <h1> dans innerHtml — le titre est rendu séparément

STRUCTURE de la réponse :
- subject     : objet accrocheur (max 70 caractères, pas d'emoji excessif)
- preheader   : phrase d'accroche masquée (max 100 caractères)
- title       : titre principal H1 (court, percutant, max 60 caractères) — rendu en haut de l'email
- innerHtml   : UNIQUEMENT le CORPS de l'email en HTML inline (Gmail/Outlook). 2 à 4 paragraphes courts, ton chaleureux et expert. Liste à puces si pertinent (max 5). Aucun lien, aucune image, aucun H1, aucune salutation.
- ctaLabel    : libellé court du bouton d'action (ex : "Découvrir", "Je m'abonne", "Voir l'opportunité")

Réponds UNIQUEMENT en JSON strict :
{"subject": "...", "preheader": "...", "title": "...", "innerHtml": "...", "ctaLabel": "..."}`;

/** Nettoie le innerHtml renvoyé par l'IA : retire toute salutation ou H1 résiduels. */
function sanitizeInnerHtml(html: string): string {
  let s = String(html || "");
  // Supprime les balises h1 (le shell rend le titre)
  s = s.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "");
  // Supprime un éventuel paragraphe d'ouverture commençant par Bonjour/Cher/Hello/Salut
  s = s.replace(
    /^\s*<p[^>]*>\s*(?:Bonjour|Bonsoir|Cher\(e\)?|Cher|Chère|Chers|Hello|Salut|Coucou)[^<]*<\/p>/i,
    "",
  );
  // Supprime aussi un Bonjour brut sans balise
  s = s.replace(/^\s*(?:Bonjour|Bonsoir|Hello|Salut)[^.\n]{0,80}[.,]?\s*/i, "");
  return s.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { prompt, ctaUrl } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ ok: false, error: "prompt required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ ok: false, error: `AI gateway: ${aiRes.status} ${errText}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      parsed = { subject: "Newsletter MIPROJET", preheader: "", title: "MIPROJET", innerHtml: `<p>${raw}</p>`, ctaLabel: "En savoir plus" };
    }

    const cleanInner = sanitizeInnerHtml(parsed.innerHtml ?? "<p>(contenu vide)</p>");
    const title = (parsed.title ?? "").toString().trim() || (parsed.subject ?? "MIPROJET");

    // Aperçu : utilise un destinataire générique (la salutation sera personnalisée à l'envoi).
    const finalHtml = brandedEmailShell({
      title,
      innerHtml: cleanInner,
      preheader: parsed.preheader ?? "",
      ctaUrl: ctaUrl ?? "https://ivoireprojet.com",
      ctaLabel: parsed.ctaLabel ?? "Découvrir",
      showGreeting: true,
      // recipientName non fourni → "Bonjour," générique
    });

    return new Response(JSON.stringify({
      ok: true,
      subject: parsed.subject ?? "MIPROJET",
      preheader: parsed.preheader ?? "",
      title,
      html: finalHtml,
      innerHtml: cleanInner,
      ctaLabel: parsed.ctaLabel ?? "",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
