import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const wooviApiKey = Deno.env.get("WOOVI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { amount, fee } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing withdrawal for user ${user.id}, amount: ${amount}, fee: ${fee}`);

    const { data: partnerProfile, error: partnerError } = await supabase
      .from("split_partners")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (partnerError || !partnerProfile) {
      console.error("Partner profile not found:", partnerError);
      return new Response(
        JSON.stringify({ error: "Partner profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Partner: ${partnerProfile.name}, pix_key: ${partnerProfile.pix_key}`);

    const netAmount = amount - fee;
    
    const { data: withdrawal, error: insertError } = await supabase
      .from("withdrawals")
      .insert({
        partner_id: partnerProfile.id,
        user_id: partnerProfile.user_id,
        recipient_name: partnerProfile.name,
        document: partnerProfile.document || "",
        pix_key: partnerProfile.pix_key,
        amount,
        fee,
        total: netAmount,
        status: "processing",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating withdrawal:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create withdrawal record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Withdrawal record created: ${withdrawal.id}`);

    // Call Woovi API to withdraw from subaccount
    const pixKey = encodeURIComponent(partnerProfile.pix_key);
    const wooviResponse = await fetch(
      `https://api.woovi.com/api/v1/subaccount/${pixKey}/withdraw`,
      {
        method: "POST",
        headers: {
          "Authorization": wooviApiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const wooviResult = await wooviResponse.json();
    console.log("Woovi withdraw response:", JSON.stringify(wooviResult));

    if (!wooviResponse.ok) {
      console.error("Woovi withdraw error:", wooviResult);
      
      await supabase
        .from("withdrawals")
        .update({ status: "failed" })
        .eq("id", withdrawal.id);

      return new Response(
        JSON.stringify({ error: "Failed to process withdrawal", details: wooviResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If there's a fee, debit it from subaccount to main account
    let feeDebitResult = null;
    if (fee && fee > 0) {
      const feeInCents = Math.round(fee * 100);
      console.log(`Debiting fee of ${feeInCents} cents from subaccount ${pixKey} to main account`);
      
      const feeDebitResponse = await fetch(
        `https://api.woovi.com/api/v1/subaccount/${pixKey}/debit`,
        {
          method: "POST",
          headers: {
            "Authorization": wooviApiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            value: feeInCents,
            description: `Taxa de saque - ID: ${withdrawal.id}`,
          }),
        }
      );

      feeDebitResult = await feeDebitResponse.json();
      console.log("Fee debit response:", JSON.stringify(feeDebitResult));

      if (!feeDebitResponse.ok) {
        console.error("Fee debit failed (withdrawal already processed):", feeDebitResult);
        // Note: We don't fail the withdrawal if fee debit fails, just log it
        // The withdrawal itself was successful
      } else {
        console.log(`Fee of R$ ${fee} successfully debited to main account`);
      }
    }

    await supabase
      .from("withdrawals")
      .update({ status: "completed" })
      .eq("id", withdrawal.id);

    console.log(`Withdrawal ${withdrawal.id} completed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        withdrawal: { ...withdrawal, status: "completed" }, 
        transaction: wooviResult.transaction,
        feeDebit: feeDebitResult,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
