import { requireAdmin } from "../_shared/requireAdmin.ts";
import { brandedEmailShell, corsHeaders } from "../_shared/resend.ts";

/**
 * Génère un email IA pour MIPROJET.
 * Body: { prompt, ctaUrl, withImages?: boolean, imagePrompt?: string }
 *
 * STRUCTURE (ordre éditorial) :
 *   subject → title (H1) → salutation auto → [hero image si withImages] → innerHtml → CTA
 */

const SYSTEM_PROMPT = `Tu es un expert en email marketing pour MIPROJET, plateforme panafricaine de structuration et de financement de projets.

⚠️ RÈGLES STRICTES :
- Le système ajoute AUTOMATIQUEMENT le titre H1 ET la salutation "Bonjour {prénom},"
- NE JAMAIS commencer le corps par "Bonjour", "Cher", "Hello", "Salut"
- NE JAMAIS inclure de balise <h1> dans innerHtml

STRUCTURE de la réponse JSON :
- subject     : objet accrocheur (max 70 caractères)
- preheader   : phrase d'accroche masquée (max 100 caractères)
- title       : titre principal H1 (max 60 caractères)
- innerHtml   : CORPS UNIQUEMENT en HTML inline. 2-4 paragraphes courts. Liste à puces si pertinent.
- ctaLabel    : libellé du bouton CTA
- imagePrompt : (si pertinent) description courte en anglais d'une image d'illustration professionnelle, sans texte sur l'image

Réponds UNIQUEMENT en JSON strict.`;

function sanitizeInnerHtml(html: string): string {
  let s = String(html || "");
  s = s.replace(/<h1\b[^>]*>[\s\S]*?<\/h1>/gi, "");
  s = s.replace(/^\s*<p[^>]*>\s*(?:Bonjour|Bonsoir|Cher\(e\)?|Cher|Chère|Chers|Hello|Salut|Coucou)[^<]*<\/p>/i, "");
  s = s.replace(/^\s*(?:Bonjour|Bonsoir|Hello|Salut)[^.\n]{0,80}[.,]?\s*/i, "");
  return s.trim();
}

async function generateHeroImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: `Professional editorial illustration, no text: ${prompt}` }],
        modalities: ["image", "text"],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const imgUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return typeof imgUrl === "string" ? imgUrl : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { prompt, ctaUrl, withImages, imagePrompt } = await req.json();
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
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
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

    // Génère une image hero si demandé
    let heroImageUrl: string | null = null;
    if (withImages) {
      const imgPrompt = (imagePrompt && String(imagePrompt).trim()) || parsed.imagePrompt || `${title} — modern African entrepreneurship`;
      heroImageUrl = await generateHeroImage(imgPrompt, LOVABLE_API_KEY);
    }

    const heroBlock = heroImageUrl
      ? `<img src="${heroImageUrl}" alt="" style="width:100%;max-width:560px;height:auto;border-radius:12px;display:block;margin:0 auto 24px;"/>`
      : "";

    const finalHtml = brandedEmailShell({
      title,
      innerHtml: heroBlock + cleanInner,
      preheader: parsed.preheader ?? "",
      ctaUrl: ctaUrl ?? "https://ivoireprojet.com",
      ctaLabel: parsed.ctaLabel ?? "Découvrir",
      showGreeting: true,
    });

    return new Response(JSON.stringify({
      ok: true,
      subject: parsed.subject ?? "MIPROJET",
      preheader: parsed.preheader ?? "",
      title,
      html: finalHtml,
      innerHtml: heroBlock + cleanInner,
      ctaLabel: parsed.ctaLabel ?? "",
      heroImageUrl,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
