import { requireAdmin } from "../_shared/requireAdmin.ts";
import { brandedEmailShell, corsHeaders } from "../_shared/resend.ts";

const SYSTEM_PROMPT = `Tu es un expert en email marketing pour MIPROJET, plateforme panafricaine de structuration et de financement de projets en Côte d'Ivoire et en Afrique.

Génère un email PROFESSIONNEL en français, en HTML INLINE (compatible Gmail/Outlook), centré, max 600px, avec :
- Un titre H1 fort (couleur #15803d)
- 2 à 4 paragraphes courts et engageants
- Si pertinent, une liste à puces (max 5)
- Un ton chaleureux, expert, panafricain
- Aucun lien ni image — ils seront ajoutés par le système

IMPORTANT : Réponds UNIQUEMENT en JSON strict de la forme :
{"subject": "...", "preheader": "...", "innerHtml": "...", "ctaLabel": "..."}

- subject : objet accrocheur (max 70 caractères, pas d'emoji excessif)
- preheader : phrase d'accroche masquée (max 100 caractères)
- innerHtml : le contenu HTML interne (sans <html>, sans <body>, sans header/footer — juste le contenu central)
- ctaLabel : libellé court du bouton d'action (ex : "Découvrir", "Je m'abonne", "Voir l'opportunité")`;

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
      parsed = { subject: "Newsletter MIPROJET", preheader: "", innerHtml: `<p>${raw}</p>`, ctaLabel: "En savoir plus" };
    }

    const finalHtml = brandedEmailShell({
      innerHtml: parsed.innerHtml ?? "<p>(contenu vide)</p>",
      preheader: parsed.preheader ?? "",
      ctaUrl: ctaUrl ?? "https://ivoireprojet.com",
      ctaLabel: parsed.ctaLabel ?? "Découvrir",
    });

    return new Response(JSON.stringify({
      ok: true,
      subject: parsed.subject ?? "MIPROJET",
      preheader: parsed.preheader ?? "",
      html: finalHtml,
      innerHtml: parsed.innerHtml ?? "",
      ctaLabel: parsed.ctaLabel ?? "",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});