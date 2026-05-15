import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const WAVE_API_BASE = 'https://api.wave.com';

async function callWaveAPI(endpoint: string, payload: Record<string, unknown>, apiKey: string, attempt = 1): Promise<{ data: any; status: number }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${WAVE_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const text = await response.text();
    console.log(`Wave API response (attempt ${attempt}): status=${response.status}, body=${text.substring(0, 500)}`);

    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error(`Wave returned non-JSON: ${text.substring(0, 200)}`); }

    if (response.status >= 400 && response.status < 500) return { data, status: response.status };
    if (!response.ok) throw new Error(`Wave server error: ${response.status}`);
    return { data, status: response.status };
  } catch (error: any) {
    clearTimeout(timeout);
    if (attempt >= 3) throw new Error(`Wave API unavailable after ${attempt} attempts: ${error.message}`);
    console.log(`Retrying Wave API in ${2 ** attempt}s...`);
    await new Promise(r => setTimeout(r, 1000 * (2 ** attempt)));
    return callWaveAPI(endpoint, payload, apiKey, attempt + 1);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé. Veuillez vous reconnecter.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { amount, currency = 'XOF', description, subscription_id, plan_id, success_url, error_url } = body;
    console.log('Payment request from user:', user.id, JSON.stringify({ amount, currency, description, subscription_id, plan_id }));

    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: 'Montant minimum: 100 FCFA' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const waveApiKey = Deno.env.get('WAVE_API_KEY');
    if (!waveApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Le service de paiement Wave n\'est pas encore configuré. Contactez l\'administrateur.', 
        preview_mode: true 
      }), {
        status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Server-side amount validation: if a plan_id is provided, the charged amount
    // must be at least the plan's price. This prevents client-side price tampering.
    let finalAmount = amount;
    if (plan_id) {
      const { data: plan, error: planErr } = await supabaseClient
        .from('subscription_plans')
        .select('price')
        .eq('id', plan_id)
        .single();
      if (planErr || !plan) {
        return new Response(JSON.stringify({ error: 'Plan d\'abonnement introuvable.' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (Number(amount) < Number(plan.price)) {
        return new Response(JSON.stringify({ error: `Montant insuffisant pour ce plan (minimum ${plan.price} FCFA).` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      finalAmount = Number(plan.price);
    }

    const transactionId = `MIP-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        user_id: user.id,
        amount: finalAmount,
        currency,
        payment_method: 'wave',
        payment_reference: transactionId,
        status: 'pending',
        metadata: { 
          subscription_id, plan_id, description, 
          original_amount: amount,
        }
      })
      .select()
      .single();

    if (paymentError) {
      return new Response(JSON.stringify({ error: 'Erreur lors de la création du paiement: ' + paymentError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const wavePayload = {
      amount: String(Math.round(finalAmount)),
      currency,
      error_url: error_url || 'https://ivoireprojet.com/payment/callback?status=failed',
      success_url: success_url || 'https://ivoireprojet.com/payment/callback?status=success',
      client_reference: transactionId,
    };

    console.log('Wave API payload:', JSON.stringify(wavePayload));

    const { data: waveResult, status: waveStatus } = await callWaveAPI('/v1/checkout/sessions', wavePayload, waveApiKey);

    if (waveStatus >= 400) {
      await supabaseClient.from('payments').update({ status: 'failed' }).eq('id', payment.id);
      const errorMsg = waveResult?.message || waveResult?.detail || waveResult?.error || `Erreur Wave (${waveStatus})`;
      return new Response(JSON.stringify({ error: `Erreur Wave: ${errorMsg}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const launchUrl = waveResult.wave_launch_url;
    if (!launchUrl) {
      await supabaseClient.from('payments').update({ status: 'failed' }).eq('id', payment.id);
      return new Response(JSON.stringify({ error: 'URL de paiement non reçue de Wave.' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabaseClient.from('payments').update({
      metadata: { 
        ...(payment.metadata as Record<string, unknown> || {}), 
        wave_session_id: waveResult.id,
        wave_checkout_status: waveResult.checkout_status
      }
    }).eq('id', payment.id);

    return new Response(JSON.stringify({
      success: true,
      wave_launch_url: launchUrl,
      payment_id: payment.id,
      transaction_id: transactionId,
      charged_amount: finalAmount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Unexpected payment error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: error.message || 'Erreur interne du serveur. Veuillez réessayer.' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
