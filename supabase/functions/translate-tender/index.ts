import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fallbackSummary = (title: string, country?: string, sector?: string) =>
  `Appel d'offres au ${country || "pays concerné"} dans le secteur ${sector || "Autres"}. Objet : ${title.slice(0, 180)}.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const targetLanguage = String(body.targetLanguage || "fr");
    const targetLanguageLabel = String(body.targetLanguageLabel || targetLanguage);
    const tenders = Array.isArray(body.tenders) ? body.tenders.slice(0, 30) : [];

    if (!tenders.length) {
      return new Response(JSON.stringify({ translations: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Tu es traducteur professionnel pour une plateforme d'appels d'offres. Traduis strictement en ${targetLanguageLabel}. Ne change pas les noms propres, sigles, pays, montants, dates, normes et termes techniques. Réponds uniquement en JSON valide: {"translations":[{"id":"...","title":"...","summary":"..."}]}`,
          },
          {
            role: "user",
            content: JSON.stringify({ targetLanguage, tenders }),
          },
        ],
        max_tokens: 3500,
      }),
    });

    if (!response.ok) throw new Error(`AI translation failed: ${response.status}`);
    const aiData = await response.json();
    const raw = aiData.choices?.[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed.translations)) {
        return new Response(JSON.stringify({ translations: parsed.translations }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({
      translations: tenders.map((t: any) => ({ id: t.id, title: t.title, summary: t.summary || fallbackSummary(t.title, t.country, t.sector) })),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, translations: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});