import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendMail, brandedEmailShell, corsHeaders } from "../_shared/mailer.ts";

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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResult?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: adminRow } = await supabase.from("user_roles").select("id").eq("user_id", userResult.user.id).eq("role", "admin").maybeSingle();
    if (!adminRow) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { invoiceId, recipientEmail, recipientName, invoiceNumber, amount, dueDate, paymentLink }: InvoiceEmailRequest = await req.json();

    const amountFmt = Number(amount || 0).toLocaleString("fr-FR") + " FCFA";
    const dueFmt = dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "—";

    const body = `
      <p style="margin:0 0 14px;font-size:16px;font-weight:600;">Bonjour ${recipientName || "Client"},</p>
      <p style="margin:0 0 14px;">Votre facture <strong>${invoiceNumber}</strong> est disponible.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:18px 0;border-collapse:collapse;">
        <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;">Montant</td><td style="padding:10px 12px;border:1px solid #e2e8f0;font-weight:700;">${amountFmt}</td></tr>
        <tr><td style="padding:10px 12px;border:1px solid #e2e8f0;background:#f8fafc;">Échéance</td><td style="padding:10px 12px;border:1px solid #e2e8f0;">${dueFmt}</td></tr>
      </table>
      <p><a href="${paymentLink}" style="display:inline-block;padding:14px 28px;background:#15803d;color:#fff;text-decoration:none;border-radius:10px;font-weight:700;">Régler la facture</a></p>
      <p style="margin:18px 0 0;color:#64748b;font-size:13px;">Merci pour votre confiance.</p>`;

    const html = brandedEmailShell({
      title: `Facture ${invoiceNumber}`,
      preheader: `Facture ${invoiceNumber} — ${amountFmt}`,
      bodyHtml: body,
    });

    const result = await sendMail({
      to: recipientEmail,
      subject: `Votre facture ${invoiceNumber} — MIPROJET`,
      html,
      kind: "transactional",
      bypassUnsubscribeCheck: true,
    });

    // Notification in-app
    const { data: inv } = await supabase.from("invoices").select("user_id").eq("id", invoiceId).maybeSingle();
    if (inv?.user_id) {
      await supabase.from("notifications").insert({
        user_id: inv.user_id,
        title: `Nouvelle facture ${invoiceNumber}`,
        message: `Une facture de ${amountFmt} a été émise. Échéance: ${dueFmt}`,
        type: "invoice",
        link: paymentLink,
        metadata: { invoiceId, invoiceNumber, amount },
      });
    }

    if (!result.ok) {
      return new Response(JSON.stringify({ success: false, error: result.error }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, provider: result.provider, id: result.id }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("Error in send-invoice-email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
