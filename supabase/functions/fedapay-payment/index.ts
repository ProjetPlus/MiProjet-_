import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FEDAPAY_API_URL = 'https://api.fedapay.com/v1';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FEDAPAY_SECRET_KEY = Deno.env.get('FEDAPAY_SECRET_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!FEDAPAY_SECRET_KEY) {
      console.error('FEDAPAY_SECRET_KEY not configured');
      throw new Error('Configuration de paiement manquante');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase configuration missing');
      throw new Error('Configuration serveur manquante');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth: require valid JWT; derive user_id from token, ignore body.userId
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = userResult.user.id;

    const { amount, currency = 'XOF', description, customer, projectId, serviceRequestId, callbackUrl } = await req.json();

    // Validate required fields
    if (!amount || amount <= 0) {
      throw new Error('Montant invalide');
    }

    if (!userId) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log('Creating FedaPay transaction:', { amount, currency, description, userId });

    // Create transaction with FedaPay
    const transactionResponse = await fetch(`${FEDAPAY_API_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: description || 'Paiement MIPROJET',
        amount: Math.round(amount),
        currency: currency,
        callback_url: callbackUrl || `${req.headers.get('origin')}/payment/callback`,
        customer: customer ? {
          firstname: customer.firstName || '',
          lastname: customer.lastName || '',
          email: customer.email || '',
          phone_number: {
            number: customer.phone || '',
            country: 'CI'
          }
        } : undefined
      }),
    });

    const transactionData = await transactionResponse.json();
    console.log('FedaPay transaction response:', transactionData);

    if (!transactionResponse.ok) {
      console.error('FedaPay API error:', transactionData);
      throw new Error(transactionData.message || 'Erreur lors de la création de la transaction');
    }

    const transaction = transactionData.v1?.transaction || transactionData.transaction || transactionData;

    // Generate payment token
    const tokenResponse = await fetch(`${FEDAPAY_API_URL}/transactions/${transaction.id}/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FEDAPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const tokenData = await tokenResponse.json();
    console.log('FedaPay token response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('FedaPay token error:', tokenData);
      throw new Error('Erreur lors de la génération du lien de paiement');
    }

    const token = tokenData.v1?.token || tokenData.token || tokenData;

    // Save payment record to database
    const { data: paymentRecord, error: dbError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        service_request_id: serviceRequestId || null,
        amount: amount,
        currency: currency,
        payment_method: 'fedapay',
        payment_reference: transaction.reference || transaction.id?.toString(),
        status: 'pending',
        metadata: {
          fedapay_transaction_id: transaction.id,
          description: description,
          customer: customer
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Don't throw, just log - payment was created in FedaPay
    }

    console.log('Payment record created:', paymentRecord?.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: token.url,
        transactionId: transaction.id,
        reference: transaction.reference,
        paymentId: paymentRecord?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (err: unknown) {
    const error = err as Error;
    console.error('Payment error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue lors du paiement'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});