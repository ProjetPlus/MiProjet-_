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

    const { url, options } = await req.json();
    if (!url) return new Response(JSON.stringify({ success: false, error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) return new Response(JSON.stringify({ success: false, error: 'Firecrawl not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http')) formattedUrl = `https://${formattedUrl}`;

    const response = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: formattedUrl, limit: options?.limit || 100, maxDepth: options?.maxDepth, scrapeOptions: { formats: ['markdown'] } }),
    });

    const data = await response.json();
    if (!response.ok) return new Response(JSON.stringify({ success: false, error: data.error || `Failed: ${response.status}` }), { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
