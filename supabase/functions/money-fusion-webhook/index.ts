import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  transaction_id: string;
  reference: string;
  status: 'success' | 'failed' | 'pending' | 'cancelled';
  amount: number;
  currency: string;
  payment_method: string;
  metadata?: {
    payment_id?: string;
    user_id?: string;
    project_id?: string;
    service_request_id?: string;
  };
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const moneyFusionWebhookSecret = Deno.env.get('MONEY_FUSION_WEBHOOK_SECRET');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read raw body for signature verification
    const rawBody = await req.text();

    // Verify webhook signature - REQUIRED for security
    if (!moneyFusionWebhookSecret) {
      console.error('MONEY_FUSION_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const signature = req.headers.get('X-MoneyFusion-Signature');
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Compute expected HMAC signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(moneyFusionWebhookSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Constant-time comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length || signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Webhook signature verified successfully');

    const payload: WebhookPayload = JSON.parse(rawBody);
    console.log('Webhook received:', payload);

    const { transaction_id, reference, status, amount, metadata } = payload;

    // Find payment by reference
    const { data: payment, error: findError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_reference', reference)
      .single();

    if (findError || !payment) {
      console.error('Payment not found for reference:', reference);
      return new Response(JSON.stringify({ error: 'Payment not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map external status to internal status
    const statusMap: Record<string, string> = {
      'success': 'completed',
      'failed': 'failed',
      'pending': 'pending',
      'cancelled': 'cancelled',
    };

    const internalStatus = statusMap[status] || 'pending';

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: internalStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          external_transaction_id: transaction_id,
          webhook_received_at: new Date().toISOString(),
          final_status: status,
        }
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Error updating payment:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If payment successful and linked to project, update project funds
    if (internalStatus === 'completed' && payment.project_id) {
      // Update project funds_raised
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
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.project_id);

        // Create contribution record
        await supabase
          .from('contributions')
          .insert({
            project_id: payment.project_id,
            user_id: payment.user_id,
            amount: amount,
            type: 'investment',
          });

        console.log(`Project ${payment.project_id} funds updated: +${amount}`);
      }
    }

    // If payment successful and linked to service request, update status
    if (internalStatus === 'completed' && payment.service_request_id) {
      await supabase
        .from('service_requests')
        .update({
          status: 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.service_request_id);

      console.log(`Service request ${payment.service_request_id} marked as paid`);
    }

    console.log(`Payment ${payment.id} updated to status: ${internalStatus}`);

    return new Response(JSON.stringify({ 
      success: true,
      payment_id: payment.id,
      status: internalStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Webhook processing failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
