import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-fedapay-signature',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FEDAPAY_WEBHOOK_SECRET = Deno.env.get('FEDAPAY_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      throw new Error('Configuration serveur manquante');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the raw body for signature verification
    const body = await req.text();
    const payload = JSON.parse(body);

    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Verify webhook signature — REQUIRED for security
    if (!FEDAPAY_WEBHOOK_SECRET) {
      console.error('FEDAPAY_WEBHOOK_SECRET not configured — rejecting');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const signature = req.headers.get('x-fedapay-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(FEDAPAY_WEBHOOK_SECRET),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const computedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      if (signature !== computedSignature) {
        console.warn('Webhook signature mismatch - rejecting');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Extract transaction data from webhook
    const event = payload.name || payload.event;
    const transaction = payload.entity || payload.data?.object || payload;

    console.log('Processing event:', event, 'Transaction:', transaction.id || transaction.reference);

    if (!transaction.reference && !transaction.id) {
      console.log('No transaction reference found in webhook');
      return new Response(
        JSON.stringify({ received: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Map FedaPay status to our status
    const statusMap: Record<string, string> = {
      'approved': 'completed',
      'completed': 'completed',
      'transferred': 'completed',
      'pending': 'pending',
      'declined': 'failed',
      'canceled': 'cancelled',
      'refunded': 'refunded'
    };

    const transactionStatus = transaction.status?.toLowerCase() || 'pending';
    const mappedStatus = statusMap[transactionStatus] || transactionStatus;

    // Find and update payment record
    const searchRef = transaction.reference || transaction.id?.toString();
    
    const { data: payments, error: findError } = await supabase
      .from('payments')
      .select('*')
      .or(`payment_reference.eq.${searchRef},metadata->>fedapay_transaction_id.eq.${transaction.id}`)
      .limit(1);

    if (findError) {
      console.error('Error finding payment:', findError);
    }

    if (payments && payments.length > 0) {
      const payment = payments[0];
      console.log('Found payment record:', payment.id, 'Updating status to:', mappedStatus);

      const { error: updateError } = await supabase
        .from('payments')
        .update({
          status: mappedStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            ...payment.metadata,
            webhook_received_at: new Date().toISOString(),
            fedapay_status: transactionStatus,
            fedapay_event: event
          }
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Error updating payment:', updateError);
      } else {
        console.log('Payment status updated successfully');

        // If payment is completed, update related records
        if (mappedStatus === 'completed') {
          // Update project funds if this is a project contribution
          if (payment.project_id) {
            // Update funds raised
            const { data: project } = await supabase
              .from('projects')
              .select('funds_raised')
              .eq('id', payment.project_id)
              .single();
            
            if (project) {
              await supabase
                .from('projects')
                .update({ 
                  funds_raised: (project.funds_raised || 0) + payment.amount 
                })
                .eq('id', payment.project_id);
            }

            // Create contribution record
            const { error: contribError } = await supabase
              .from('contributions')
              .insert({
                project_id: payment.project_id,
                user_id: payment.user_id,
                amount: payment.amount,
                type: 'crowdfunding'
              });

            if (contribError) {
              console.error('Error creating contribution:', contribError);
            }
          }

          // Update service request if applicable
          if (payment.service_request_id) {
            const { error: serviceError } = await supabase
              .from('service_requests')
              .update({ status: 'paid' })
              .eq('id', payment.service_request_id);

            if (serviceError) {
              console.error('Error updating service request:', serviceError);
            }
          }
        }
      }

      // Log to audit trail
      await supabase
        .from('audit_logs')
        .insert({
          user_id: payment.user_id,
          action: 'payment_webhook',
          table_name: 'payments',
          record_id: payment.id,
          details: {
            event: event,
            old_status: payment.status,
            new_status: mappedStatus,
            fedapay_transaction_id: transaction.id
          }
        });

    } else {
      console.log('No payment record found for reference:', searchRef);
    }

    return new Response(
      JSON.stringify({ received: true, status: mappedStatus }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Webhook processing error:', error);
    
    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ received: true, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});