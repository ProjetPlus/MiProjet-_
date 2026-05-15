import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: "admin" | "moderator" | "user";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth gate: allow only if (a) no admin exists yet (bootstrap), or
    // (b) the caller is authenticated and already has the admin role.
    const { count: adminCount } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if ((adminCount ?? 0) > 0) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace(/^Bearer\s+/i, "");
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      const { data: userResult, error: userErr } = await supabaseAdmin.auth.getUser(token);
      if (userErr || !userResult?.user) {
        return new Response(
          JSON.stringify({ success: false, message: "Unauthorized" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userResult.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        return new Response(
          JSON.stringify({ success: false, message: "Forbidden" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
        );
      }
    }

    const userData: UserData = await req.json();
    
    // Validate required fields
    if (!userData.email || !userData.password) {
      return new Response(
        JSON.stringify({ success: false, message: "Email et mot de passe requis" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (userData.password.length < 6) {
      return new Response(
        JSON.stringify({ success: false, message: "Le mot de passe doit contenir au moins 6 caractères" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === userData.email);
    
    if (emailExists) {
      return new Response(
        JSON.stringify({ success: false, message: "Cet email existe déjà" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create user with service role
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Erreur d'authentification: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("Échec de la création de l'utilisateur");
    }

    // Update profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        first_name: userData.firstName,
        last_name: userData.lastName,
        phone: userData.phone,
        is_verified: true,
        user_type: 'individual'
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Assign role (default to 'admin' for backward compatibility)
    const role = userData.role || 'admin';
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: role
      });

    if (roleError) {
      console.error("Role error:", roleError);
    }

    console.log(`User created successfully: ${userData.email} with role ${role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Utilisateur créé avec succès",
        userId: authData.user.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
