import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es Miprojet, l'assistant virtuel intelligent de la plateforme MIPROJET - Plateforme Panafricaine de Structuration et d'Orientation de Projets.

À PROPOS DE MIPROJET:
- MIPROJET accompagne les porteurs de projets dans la structuration professionnelle de leurs idées selon les normes ISO 21500
- La plateforme analyse, rédige des business plans, évalue les risques et attribue un label de qualité
- MIPROJET oriente ensuite les projets validés vers des partenaires adaptés (investisseurs, banques, bailleurs de fonds)
- IMPORTANT: MIPROJET n'est PAS un organisme de financement direct

SERVICES PROPOSÉS:
1. Structuration de projets selon norme ISO 21500
2. Rédaction de business plans professionnels
3. Analyse de faisabilité et évaluation des risques
4. Labellisation et validation des projets (scores A, B, C)
5. Orientation vers des partenaires financiers adaptés
6. Accompagnement et coaching entrepreneurial
7. Formation en gestion de projets
8. Création d'entreprise

CONTACT:
- Site: ivoireprojet.com
- Email: info@ivoireprojet.com
- Téléphone: +225 07 07 16 79 21
- Adresse: Bingerville – Adjin Palmeraie, 25 BP 2454 Abidjan 25, Côte d'Ivoire

RÈGLES:
- Réponds toujours en français de manière claire et professionnelle
- Sois concis mais complet
- Rappelle que MIPROJET ne finance pas directement mais oriente vers des partenaires`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- AUTH GATE ---
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const callerUserId = userResult.user.id;
    const { data: adminRow } = await supabase
      .from("user_roles").select("id")
      .eq("user_id", callerUserId).eq("role", "admin").maybeSingle();
    const isAdmin = !!adminRow;

    const body = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const action = body.action;

    // Restrict privileged actions to admins; force user_id to caller for others
    const ADMIN_ONLY_ACTIONS = new Set([
      'generate_image',
      'send_whatsapp',
      'generate_news',
      'generate_article_html',
      'generate_universal_content',
      'generate_opportunity',
      'generate_evaluation',
      'generate_email',
    ]);
    if (ADMIN_ONLY_ACTIONS.has(action) && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (body && typeof body === 'object' && 'user_id' in body && !isAdmin) {
      body.user_id = callerUserId;
    }

    // ===== AI IMAGE GENERATION =====
    if (action === 'generate_image') {
      const topic = body.topic || body.content || "professional business";
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          messages: [
            {
              role: "user",
              content: `Generate a professional, ultra-realistic, high-resolution photograph for an article about: ${topic}. Style: photojournalistic, real African business context, natural lighting, authentic people in professional settings. NO text, NO watermarks, NO logos, NO artificial elements. The image must look like a real photograph taken by a professional photographer in Africa.`
            }
          ],
          modalities: ["image", "text"]
        }),
      });

      if (!response.ok) {
        console.error("Image generation failed:", response.status);
        return new Response(JSON.stringify({ error: "Image generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const aiData = await response.json();
      const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      
      if (imageUrl) {
        const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const fileName = `ai-generated/${Date.now()}_ai_image.png`;
        const { error: uploadError } = await supabase.storage
          .from('news-media')
          .upload(fileName, bytes, { contentType: 'image/png', upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return new Response(JSON.stringify({ image_url: imageUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const { data: urlData } = supabase.storage.from('news-media').getPublicUrl(fileName);
        return new Response(JSON.stringify({ image_url: urlData.publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    // ===== OPPORTUNITY GENERATION =====
    if (action === 'generate_opportunity') {
      const content = body.content || "";
      const opportunityType = body.opportunity_type || "funding";
      
      const typeLabels: Record<string, string> = {
        funding: "Financement", training: "Formation", accompaniment: "Accompagnement",
        partnership: "Partenariat", grant: "Subvention", other: "Autre"
      };
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { 
              role: "system", 
              content: `Tu es un expert en veille d'opportunités pour MIPROJET, plateforme panafricaine.
TYPE D'OPPORTUNITÉ: ${typeLabels[opportunityType] || opportunityType}
Réponds UNIQUEMENT en JSON valide:
{
  "title": "TITRE EN MAJUSCULES (max 80 car)",
  "description": "Phrase d'accroche courte et percutante",
  "content": "Contenu structuré complet avec emojis et sections",
  "category": "funding|training|grants|partnerships|general",
  "eligibility": "Critères d'éligibilité résumés",
  "location": "Zone géographique",
  "external_link": "",
  "contact_email": "info@ivoireprojet.com",
  "contact_phone": "+225 07 07 16 79 21"
}`
            },
            { role: "user", content: `Génère une fiche d'opportunité professionnelle complète à partir de : ${content}` }
          ],
          max_tokens: 3000,
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.content) {
            parsed.content = parsed.content.replace(/<[^>]*>/g, '').replace(/#{1,6}\s*/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
          }
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e) { console.error("Parse error:", e); }
      
      return new Response(JSON.stringify({
        title: content.toUpperCase().substring(0, 80),
        description: `Opportunité de ${typeLabels[opportunityType]} - ${content}`,
        content: `🚀 ${content.toUpperCase()}\n\nOpportunité disponible.\n\n📧 CONTACT\ninfo@ivoireprojet.com | +225 07 07 16 79 21\n\n#MIPROJET #Opportunité`,
        category: "general",
        eligibility: "Porteurs de projets en Afrique",
        location: "Afrique de l'Ouest",
        contact_email: "info@ivoireprojet.com",
        contact_phone: "+225 07 07 16 79 21"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== NEWS GENERATION =====
    if (action === 'generate_news') {
      const content = body.content || "";
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { 
              role: "system", 
              content: `Tu es un rédacteur professionnel pour MIPROJET, plateforme panafricaine.
Catégories: general, events, projects, partnerships, training, opportunities, funding
Réponds UNIQUEMENT en JSON valide:
{
  "title": "TITRE ACCROCHEUR EN MAJUSCULES (max 80 car)",
  "excerpt": "Résumé court et percutant (150-200 car)",
  "content": "Contenu formaté professionnel avec emojis et sections",
  "category": "catégorie détectée"
}`
            },
            { role: "user", content: `Transforme en article professionnel complet:\n\n${content}` }
          ],
          max_tokens: 2500,
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.content) {
            parsed.content = parsed.content.replace(/<[^>]*>/g, '').replace(/#{1,6}\s*/g, '').replace(/\*\*/g, '').replace(/\*/g, '');
          }
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e) { console.error("Parse error:", e); }
      
      return new Response(JSON.stringify({
        title: content.split('\n')[0]?.substring(0, 80) || "Actualité MIPROJET",
        excerpt: content.substring(0, 200) + "...",
        content: content,
        category: "general"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== EVALUATION GENERATION =====
    if (action === 'generate_evaluation') {
      const projectData = body.projectData || {};
      const scores = body.scores || {};
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { 
              role: "system", 
              content: `Tu es un expert en évaluation de projets pour MIPROJET. Génère une évaluation professionnelle.
Réponds UNIQUEMENT en JSON valide:
{
  "resume": "Résumé exécutif (2-3 phrases)",
  "forces": ["Point fort 1", "Point fort 2", "Point fort 3"],
  "faiblesses": ["Point à améliorer 1", "Point à améliorer 2"],
  "recommandations": ["Recommandation 1", "Recommandation 2", "Recommandation 3"]
}`
            },
            { 
              role: "user", 
              content: `Évalue ce projet:\nProjet: ${projectData.title || "Non spécifié"}\nSecteur: ${projectData.sector || "Non spécifié"}\nDescription: ${projectData.description || "Non fournie"}\n\nScores:\n- Porteur: ${scores.porteur || 0}/100\n- Projet: ${scores.projet || 0}/100\n- Financier: ${scores.financier || 0}/100\n- Maturité: ${scores.maturite || 0}/100\n- Impact: ${scores.impact || 0}/100\n- Équipe: ${scores.equipe || 0}/100`
            }
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) throw new Error("AI evaluation failed");

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return new Response(JSON.stringify(JSON.parse(jsonMatch[0])), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e) { console.error("Evaluation parse error:", e); }
      
      return new Response(JSON.stringify({
        resume: "Projet en cours d'évaluation.",
        forces: ["Idée innovante", "Secteur porteur", "Engagement du porteur"],
        faiblesses: ["Documentation à compléter", "Projections à affiner"],
        recommandations: ["Finaliser le business plan", "Identifier des partenaires"]
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== ARTICLE HTML GENERATION (WYSIWYG) - ENHANCED =====
    if (action === 'generate_article_html' || action === 'generate_universal_content') {
      const content = body.content || "";
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { 
              role: "system", 
              content: `Tu es un rédacteur en chef professionnel pour MIPROJET, plateforme panafricaine de structuration de projets.

CAPACITÉ CLÉ: À partir d'un SEUL MOT ou d'une phrase, tu génères un article complet, structuré et professionnel.

RÈGLES DE RÉDACTION CRITIQUES:
- Ton journalistique, factuel, sobre et respectueux des institutions
- Jamais détectable comme généré par IA
- Pas de superlatifs excessifs ni de formules creuses
- Contenu immédiatement publiable sur un site professionnel
- Minimum 800 mots, maximum 2000 mots
- Chaque section doit avoir au moins 2 paragraphes bien développés

FORMAT HTML OBLIGATOIRE:
Le contenu DOIT être du HTML propre et bien structuré:

1. STRUCTURE:
   - <h2> pour les titres de sections (jamais de <h1>)
   - <h3> pour les sous-sections
   - <p> pour chaque paragraphe (TOUJOURS séparer les paragraphes avec des balises <p>)
   - <strong> pour les mots-clés importants dans le texte
   - <em> pour les citations ou termes techniques

2. MISE EN FORME:
   - <ul><li> ou <ol><li> pour les listes à puces/numérotées
   - <blockquote> pour les citations ou points importants
   - <table><thead><tr><th></th></tr></thead><tbody><tr><td></td></tr></tbody></table> pour les tableaux comparatifs
   - <hr> pour séparer les grandes sections

3. STRUCTURE TYPE:
   <h2>Introduction contextuelle</h2>
   <p>Premier paragraphe d'introduction...</p>
   <p>Deuxième paragraphe avec contexte...</p>

   <h2>Section principale 1</h2>
   <p>Développement détaillé...</p>
   <p>Suite du développement...</p>

   <h3>Sous-section si nécessaire</h3>
   <p>Détails supplémentaires...</p>
   <ul><li>Point important 1</li><li>Point important 2</li></ul>

   <h2>Section principale 2</h2>
   <p>Contenu développé...</p>

   <blockquote>Citation ou point clé à retenir</blockquote>

   <h2>Conclusion et perspectives</h2>
   <p>Synthèse...</p>

   <hr>
   <p><em>MIPROJET – Plateforme Panafricaine de Structuration de Projets</em></p>
   <p><em>📧 info@ivoireprojet.com | 📞 +225 07 07 16 79 21 | 🌐 ivoireprojet.com</em></p>

4. INTERDICTIONS:
   - PAS de classes CSS ni de styles inline
   - PAS de <h1>
   - PAS de balises <div>
   - PAS de Markdown
   - PAS d'emojis dans les titres h2/h3 (mais OK dans le texte)

Catégories disponibles: general, events, projects, partnerships, training, opportunities, funding

Réponds UNIQUEMENT en JSON valide:
{
  "title": "TITRE EN MAJUSCULES ACCROCHEUR (max 80 caractères)",
  "excerpt": "Résumé éditorial en une phrase percutante (max 200 caractères)",
  "content": "<h2>...</h2><p>...</p>...",
  "category": "catégorie la plus pertinente"
}`
            },
            { role: "user", content: `Rédige un article professionnel complet et structuré à partir de:\n${content}` }
          ],
          max_tokens: 4000,
        }),
      });

      if (!response.ok) throw new Error("AI generation failed");

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e) { console.error("Parse error:", e); }
      
      return new Response(JSON.stringify({
        title: content.split('\n')[0]?.substring(0, 80).toUpperCase() || "CONTENU MIPROJET",
        excerpt: content.substring(0, 200) + "...",
        content: `<h2>${content}</h2><p>Contenu en cours de rédaction.</p>`,
        category: "general"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ===== WHATSAPP NOTIFICATION =====
    if (action === 'send_whatsapp') {
      const { phone, message, notification_type } = body;
      
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { 
              role: "system", 
              content: `Tu génères des messages WhatsApp professionnels pour MIPROJET.
Le message doit commencer par: "📢 [MIPROJET - Message automatique]"
Suivi de: "⚠️ Ceci est un message automatique, merci de ne pas répondre."
Puis le contenu personnalisé.
Court (max 500 car), professionnel.
Terminer par: "MIPROJET | ivoireprojet.com | +225 07 07 16 79 21"`
            },
            { role: "user", content: `Type: ${notification_type}\nContenu: ${message}` }
          ],
          max_tokens: 300,
        }),
      });

      let finalMessage = message;
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        finalMessage = aiData.choices?.[0]?.message?.content || message;
      }

      if (body.user_id) {
        await supabase.from('notifications').insert({
          user_id: body.user_id,
          title: `WhatsApp: ${notification_type}`,
          message: finalMessage,
          type: 'info',
          metadata: { channel: 'whatsapp', phone, notification_type }
        });
      }

      const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_BUSINESS_TOKEN");
      const WHATSAPP_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
      
      if (WHATSAPP_TOKEN && WHATSAPP_PHONE_ID) {
        try {
          const waResponse = await fetch(
            `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_ID}/messages`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone.replace(/[^0-9]/g, ''),
                type: "text",
                text: { body: finalMessage }
              }),
            }
          );
          
          const waData = await waResponse.json();
          return new Response(JSON.stringify({ success: true, whatsapp_sent: true, data: waData }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        } catch (waError) {
          console.error("WhatsApp API error:", waError);
        }
      }

      return new Response(JSON.stringify({ 
        success: true, whatsapp_sent: false, 
        message: "Notification enregistrée.",
        generated_message: finalMessage
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ===== EMAIL GENERATION =====
    if (action === 'generate_email') {
      const { template_type, variables } = body;
      
      const templates: Record<string, string> = {
        welcome: `Génère un email de bienvenue pour un nouvel inscrit sur MIPROJET. Nom: ${variables?.name || 'Membre'}.`,
        payment_success: `Génère un email de confirmation de paiement. Plan: ${variables?.plan || 'Premium'}. Montant: ${variables?.amount || '30 000'} FCFA.`,
        new_opportunity: `Génère un email d'alerte pour une nouvelle opportunité. Titre: ${variables?.title || 'Opportunité'}.`,
        password_reset: `Génère un email de réinitialisation de mot de passe.`,
        subscription_expiry: `Génère un email d'alerte expiration d'abonnement. Plan: ${variables?.plan || 'Standard'}.`,
      };
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { 
              role: "system", 
              content: `Tu es le rédacteur d'emails pour MIPROJET.
Génère des emails HTML professionnels avec design sobre, couleur #1a365d, bouton CTA vert #38a169.
Footer: MIPROJET | info@ivoireprojet.com | +225 07 07 16 79 21
Réponds en JSON: { "subject": "Objet", "html": "HTML complet" }`
            },
            { role: "user", content: templates[template_type] || `Génère un email professionnel: ${template_type}` }
          ],
          max_tokens: 2000,
        }),
      });

      if (!response.ok) throw new Error("Email generation failed");

      const aiData = await response.json();
      const aiContent = aiData.choices?.[0]?.message?.content || "";
      
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return new Response(JSON.stringify(JSON.parse(jsonMatch[0])), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }
      } catch (e) { console.error("Email parse error:", e); }
      
      return new Response(JSON.stringify({ subject: "MIPROJET", html: "<p>Email MIPROJET</p>" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ===== DEFAULT: CHAT ASSISTANT =====
    const messages = body.messages || [];
    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Format de messages invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes atteinte, réessayez plus tard." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
