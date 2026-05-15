import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { recipient_phone, amount, currency = 'XOF', description, payout_type, recipient_name } = await req.json();

    if (!recipient_phone || !amount || amount < 100) {
      return new Response(JSON.stringify({ error: 'Numéro et montant (min 100 FCFA) requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const waveApiKey = Deno.env.get('WAVE_API_KEY');
    if (!waveApiKey) {
      return new Response(JSON.stringify({ error: 'Wave non configuré' }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Wave Payout API
    const waveResponse = await fetch('https://api.wave.com/v1/payout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${waveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency,
        receive_amount: String(amount),
        mobile: recipient_phone,
        name: recipient_name || '',
        client_reference: `MIP-PAYOUT-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      }),
    });

    const waveResult = await waveResponse.json();
    console.log('Wave payout response:', JSON.stringify(waveResult));

    if (!waveResponse.ok) {
      return new Response(JSON.stringify({ error: waveResult.message || 'Erreur Wave Payout' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Log payout in payments table
    await supabaseAdmin.from('payments').insert({
      user_id: user.id,
      amount: -amount, // negative for payout
      currency,
      payment_method: 'wave_payout',
      payment_reference: waveResult.id || waveResult.client_reference,
      status: waveResult.status || 'completed',
      metadata: {
        payout_type,
        recipient_phone,
        recipient_name,
        description,
        wave_response: waveResult,
      }
    });

    return new Response(JSON.stringify({
      success: true,
      payout_id: waveResult.id,
      status: waveResult.status,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Payout error:', error);
    return new Response(JSON.stringify({ error: 'Erreur interne' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
