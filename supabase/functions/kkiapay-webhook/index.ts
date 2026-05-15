import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();

    // Verify signature — REQUIRED
    const KKIAPAY_WEBHOOK_SECRET = Deno.env.get('KKIAPAY_WEBHOOK_SECRET');
    if (!KKIAPAY_WEBHOOK_SECRET) {
      console.error('KKIAPAY_WEBHOOK_SECRET not configured — rejecting');
      return new Response(JSON.stringify({ success: false, error: 'Webhook secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const signature = req.headers.get('x-kkiapay-signature') || req.headers.get('x-signature');
    if (!signature) {
      return new Response(JSON.stringify({ success: false, error: 'Missing signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw', encoder.encode(KKIAPAY_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      );
      const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
      const computed = Array.from(new Uint8Array(sigBytes))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      if (signature !== computed) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid signature' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const payload = JSON.parse(rawBody);
    console.log('KKIAPAY Webhook received:', JSON.stringify(payload));

    const {
      transactionId,
      isPaymentSucces,
      amount,
      method,
      performedAt,
      event,
    } = payload;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the payment by transaction ID
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_reference', transactionId)
      .single();

    if (findError || !payment) {
      console.error('Payment not found:', transactionId);
      return new Response(
        JSON.stringify({ success: false, message: 'Payment not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Update payment status
    const newStatus = isPaymentSucces ? 'completed' : 'failed';
    
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        metadata: {
          ...payment.metadata,
          kkiapay_event: event,
          kkiapay_method: method,
          kkiapay_performed_at: performedAt,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response(
        JSON.stringify({ success: false, message: 'Failed to update payment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If payment is successful and linked to a project, update project funds
    if (isPaymentSucces && payment.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('funds_raised')
        .eq('id', payment.project_id)
        .single();

      if (project) {
        await supabase
          .from('projects')
          .update({
            funds_raised: (project.funds_raised || 0) + amount,
          })
          .eq('id', payment.project_id);
      }
    }

    // Create notification for user
    await supabase.from('notifications').insert({
      user_id: payment.user_id,
      title: isPaymentSucces ? 'Paiement réussi' : 'Paiement échoué',
      message: isPaymentSucces 
        ? `Votre paiement de ${amount.toLocaleString()} FCFA a été confirmé.`
        : `Votre paiement de ${amount.toLocaleString()} FCFA a échoué.`,
      type: isPaymentSucces ? 'success' : 'error',
      link: '/dashboard',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, message: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
