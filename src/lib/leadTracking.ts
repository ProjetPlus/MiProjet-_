import { supabase } from "@/integrations/supabase/client";

export type LeadSource = "signup" | "service_request" | "referral" | "event" | "ebook" | "contact" | "opportunity" | "investor";

interface LeadInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  country?: string | null;
  city?: string | null;
  sector?: string | null;
  entity_type?: string | null;
  company_name?: string | null;
  user_id?: string | null;
  source_id?: string | null;
  needs?: string | null;
  additional_info?: Record<string, any>;
}

/**
 * Centralized lead tracking helper.
 * Inserts a lead row tagged with the originating source so admins can analyze
 * lead acquisition channels in AdminLeadsManager.
 */
export const trackLead = async (source: LeadSource, data: LeadInput) => {
  try {
    const { error } = await supabase.from("leads").insert({
      lead_source: source,
      first_name: data.first_name || "—",
      last_name: data.last_name || "—",
      email: data.email,
      phone: data.phone ?? null,
      whatsapp: data.whatsapp ?? null,
      country: data.country ?? null,
      city: data.city ?? null,
      sector: data.sector ?? null,
      entity_type: data.entity_type ?? null,
      company_name: data.company_name ?? null,
      user_id: data.user_id ?? null,
      source_id: data.source_id ?? null,
      needs: data.needs ?? null,
      additional_info: data.additional_info ?? {},
    });
    if (error) console.warn("[trackLead]", source, error.message);
  } catch (e) {
    console.warn("[trackLead] failed", e);
  }
};
