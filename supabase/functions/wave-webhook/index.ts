import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { Buffer } from "https://deno.land/std@0.168.0/node/buffer.ts";

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

    const rawBody = await req.text();
    console.log('Wave webhook received:', rawBody.substring(0, 500));

    // Verify webhook signature — REQUIRED, no bypass
    const webhookSecret = Deno.env.get('WAVE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('WAVE_WEBHOOK_SECRET is not configured — refusing to process webhook');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const signature = req.headers.get('wave-signature') || req.headers.get('x-wave-signature');
    if (!signature) {
      console.error('Missing wave-signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const expectedSig = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    let sigBuffer: Buffer;
    let expectedBuffer: Buffer;
    try {
      sigBuffer = Buffer.from(signature, 'hex');
      expectedBuffer = Buffer.from(expectedSig, 'hex');
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid signature format' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    if (sigBuffer.length !== expectedBuffer.length || !sigBuffer.equals(expectedBuffer)) {
      console.error('Webhook signature mismatch');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    console.log('Webhook signature verified');

    const body = JSON.parse(rawBody);
    const { type, data } = body;

    if (type === 'checkout.session.completed') {
      await handleSuccessfulPayment(supabaseAdmin, data);
    } else if (type === 'checkout.session.failed' || type === 'checkout.session.expired') {
      await handleFailedPayment(supabaseAdmin, data);
    } else {
      console.log('Unhandled event type:', type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Webhook error:', error.message, error.stack);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function handleSuccessfulPayment(supabaseAdmin: any, data: any) {
  const clientReference = data?.client_reference;
  if (!clientReference) {
    console.error('No client_reference in webhook data');
    return;
  }

  const { data: payment, error: findError } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('payment_reference', clientReference)
    .single();

  if (findError || !payment) {
    console.error('Payment not found for reference:', clientReference, findError?.message);
    return;
  }

  // Verify amount matches plan price before activating subscription
  const metadataPre = payment.metadata as Record<string, unknown> | null;
  if (metadataPre?.subscription_id && metadataPre?.plan_id) {
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('price')
      .eq('id', metadataPre.plan_id as string)
      .single();
    if (plan && Number(payment.amount) < Number(plan.price)) {
      console.error(`Amount mismatch: paid ${payment.amount} < plan price ${plan.price}. Refusing to activate subscription.`);
      await supabaseAdmin.from('payments').update({
        status: 'completed',
        metadata: { ...(metadataPre || {}), subscription_activation_refused: 'amount_below_plan_price' }
      }).eq('id', payment.id);
      return;
    }
  }

  // Update payment to completed
  await supabaseAdmin.from('payments').update({
    status: 'completed',
    payment_method: 'wave',
    metadata: {
      ...(payment.metadata as Record<string, unknown> || {}),
      wave_payment_status: data.payment_status || 'succeeded',
      wave_session_id: data.id,
    }
  }).eq('id', payment.id);

  console.log('Payment updated to completed:', payment.id);

  // If subscription payment, activate subscription
  const metadata = payment.metadata as Record<string, unknown> | null;
  if (metadata?.subscription_id) {
    const planId = metadata.plan_id as string;
    let durationDays = 30;

    if (planId) {
      const { data: plan } = await supabaseAdmin
        .from('subscription_plans')
        .select('duration_days')
        .eq('id', planId)
        .single();
      if (plan?.duration_days) durationDays = plan.duration_days;
    }

    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + durationDays);

    await supabaseAdmin.from('user_subscriptions').update({
      status: 'active',
      started_at: startDate.toISOString(),
      expires_at: expiryDate.toISOString(),
      payment_id: payment.id,
      payment_method: 'wave',
      payment_reference: clientReference,
    }).eq('id', metadata.subscription_id as string);

    // Notify user
    await supabaseAdmin.from('notifications').insert({
      user_id: payment.user_id,
      title: 'Abonnement activé ✅',
      message: 'Votre abonnement MIPROJET a été activé avec succès. Vous avez maintenant accès aux opportunités exclusives.',
      type: 'success',
      link: '/opportunities',
    });

    console.log('Subscription activated for user:', payment.user_id);
  }
}

async function handleFailedPayment(supabaseAdmin: any, data: any) {
  const clientReference = data?.client_reference;
  if (!clientReference) return;

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('payment_reference', clientReference)
    .single();

  if (!payment) return;

  await supabaseAdmin.from('payments').update({
    status: 'failed',
    metadata: {
      ...(payment.metadata as Record<string, unknown> || {}),
      wave_payment_status: 'failed',
      wave_session_id: data.id,
    }
  }).eq('id', payment.id);

  const metadata = payment.metadata as Record<string, unknown> | null;
  if (metadata?.subscription_id) {
    await supabaseAdmin.from('user_subscriptions').update({
      status: 'cancelled',
    }).eq('id', metadata.subscription_id as string);
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: payment.user_id,
    title: 'Paiement échoué',
    message: 'Votre paiement n\'a pas abouti. Veuillez réessayer.',
    type: 'error',
    link: '/subscription',
  });

  console.log('Payment failed for user:', payment.user_id);
}
