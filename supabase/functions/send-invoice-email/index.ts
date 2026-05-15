import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  paymentLink: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Auth: require admin caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResult?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const { data: adminRow } = await supabase
      .from("user_roles").select("id")
      .eq("user_id", userResult.user.id).eq("role", "admin").maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { invoiceId, recipientEmail, recipientName, invoiceNumber, amount, dueDate, paymentLink }: InvoiceEmailRequest = await req.json();

    // Create notification in database
    const { error: notifError } = await supabase.from('notifications').insert({
      user_id: (await supabase.from('invoices').select('user_id').eq('id', invoiceId).single()).data?.user_id,
      title: `Nouvelle facture ${invoiceNumber}`,
      message: `Une facture de ${amount.toLocaleString('fr-FR')} FCFA a été émise. Échéance: ${new Date(dueDate).toLocaleDateString('fr-FR')}`,
      type: 'invoice',
      link: paymentLink,
      metadata: { invoiceId, invoiceNumber, amount }
    });

    if (notifError) {
      console.error("Notification error:", notifError);
    }

    // For email sending, you would need RESEND_API_KEY configured
    // For now, we'll just log the email details
    console.log("Invoice email would be sent to:", recipientEmail, {
      invoiceNumber,
      amount,
      dueDate,
      paymentLink
    });

    return new Response(
      JSON.stringify({ success: true, message: "Notification créée avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-invoice-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
