import { requireAdmin } from "../_shared/requireAdmin.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const gate = await requireAdmin(req);
    if (!gate.ok) return gate.response;

    const body = await req.json().catch(() => ({}));
    const { url, options } = body || {};
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ success: false, error: 'URL is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) formattedUrl = `https://${formattedUrl}`;

    console.log('[firecrawl-scrape] Scraping:', formattedUrl);

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: formattedUrl,
        formats: options?.formats || ['markdown'],
        onlyMainContent: options?.onlyMainContent ?? true,
      }),
    });

    const data = await response.json();
    console.log('[firecrawl-scrape] Status:', response.status, 'Success:', data?.success);

    if (!response.ok || data?.success === false) {
      return new Response(JSON.stringify({
        success: false,
        error: data?.error || `Failed: ${response.status}`,
      }), { status: response.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Normalize: Firecrawl v1 returns { success, data: { markdown, metadata, ... } }
    // Flatten to make consumption easier on the client
    const flattened = {
      success: true,
      data: data.data || data,
      markdown: data.data?.markdown || data.markdown,
      html: data.data?.html || data.html,
      metadata: data.data?.metadata || data.metadata,
      links: data.data?.links || data.links,
    };

    return new Response(JSON.stringify(flattened), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[firecrawl-scrape] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed',
    }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
