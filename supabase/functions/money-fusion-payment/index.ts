import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  amount: number;
  currency?: string;
  payment_method: string;
  phone_number?: string;
  project_id?: string;
  service_request_id?: string;
  description?: string;
  callback_url?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const moneyFusionApiKey = Deno.env.get('MONEY_FUSION_API_KEY');
    const moneyFusionMerchantId = Deno.env.get('MONEY_FUSION_MERCHANT_ID');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: PaymentRequest = await req.json();
    const { 
      amount, 
      currency = 'XOF', 
      payment_method, 
      phone_number,
      project_id, 
      service_request_id, 
      description,
      callback_url 
    } = body;

    console.log('Processing payment request:', { amount, payment_method, project_id, user_id: user.id });

    // Validate required fields
    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payment_method) {
      return new Response(JSON.stringify({ error: 'Payment method required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique payment reference
    const paymentReference = `MIPROJET-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount,
        currency,
        payment_method,
        payment_reference: paymentReference,
        project_id: project_id || null,
        service_request_id: service_request_id || null,
        status: 'pending',
        metadata: {
          phone_number,
          description,
          initiated_at: new Date().toISOString(),
        }
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      return new Response(JSON.stringify({ error: 'Failed to create payment' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If Money Fusion credentials are available, call their API
    let externalPaymentResponse = null;
    
    if (moneyFusionApiKey && moneyFusionMerchantId) {
      try {
        // Money Fusion API integration
        const moneyFusionPayload = {
          merchant_id: moneyFusionMerchantId,
          amount: amount,
          currency: currency,
          payment_method: payment_method,
          phone_number: phone_number,
          reference: paymentReference,
          description: description || `Paiement MIPROJET - ${paymentReference}`,
          callback_url: callback_url || `${supabaseUrl}/functions/v1/money-fusion-webhook`,
          metadata: {
            payment_id: payment.id,
            user_id: user.id,
            project_id,
            service_request_id,
          }
        };

        const moneyFusionResponse = await fetch('https://api.moneyfusion.net/v1/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${moneyFusionApiKey}`,
          },
          body: JSON.stringify(moneyFusionPayload),
        });

        externalPaymentResponse = await moneyFusionResponse.json();
        console.log('Money Fusion response:', externalPaymentResponse);

        // Update payment with external reference
        if (externalPaymentResponse.success && externalPaymentResponse.transaction_id) {
          await supabase
            .from('payments')
            .update({
              metadata: {
                ...payment.metadata,
                external_transaction_id: externalPaymentResponse.transaction_id,
                payment_url: externalPaymentResponse.payment_url,
              }
            })
            .eq('id', payment.id);
        }
      } catch (apiError) {
        console.error('Money Fusion API error:', apiError);
        // Continue with local payment record even if external API fails
      }
    } else {
      console.log('Money Fusion credentials not configured, simulating payment');
      // Simulate successful payment for demo
      externalPaymentResponse = {
        success: true,
        message: 'Payment initiated (demo mode)',
        transaction_id: paymentReference,
      };
    }

    return new Response(JSON.stringify({
      success: true,
      payment_id: payment.id,
      reference: paymentReference,
      status: payment.status,
      amount,
      currency,
      payment_method,
      external_response: externalPaymentResponse,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
