import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { partnerId, productId, amount, customer } = await req.json();

    console.log("Creating partner PIX charge:", { partnerId, productId, amount });

    if (!partnerId || !productId || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get partner data
    const { data: partner, error: partnerError } = await supabase
      .from("split_partners")
      .select("id, name, pix_key, woovi_subaccount_id, user_id")
      .eq("id", partnerId)
      .eq("status", "active")
      .single();

    if (partnerError || !partner) {
      console.error("Partner not found:", partnerError);
      return new Response(
        JSON.stringify({ success: false, error: "Parceiro não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get product data
    const { data: product, error: productError } = await supabase
      .from("partner_products")
      .select("*")
      .eq("id", productId)
      .eq("partner_id", partnerId)
      .eq("status", "active")
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      return new Response(
        JSON.stringify({ success: false, error: "Produto não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get merchant's Woovi API key
    const { data: apiCredential, error: credError } = await supabase
      .from("api_credentials")
      .select("token")
      .eq("user_id", partner.user_id)
      .eq("status", "active")
      .single();

    if (credError || !apiCredential) {
      console.error("API credential not found:", credError);
      return new Response(
        JSON.stringify({ success: false, error: "Credenciais de API não configuradas" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const wooviApiKey = apiCredential.token;
    const correlationId = crypto.randomUUID();

    // Calculate fee (1.4% with minimum R$ 0.80)
    const feePercentage = 0.014;
    const minFee = 0.80;
    const calculatedFee = Math.max(amount * feePercentage, minFee);
    const netAmount = amount - calculatedFee;

    // Determine the destination account
    // Use subaccount if available, otherwise use pix_key
    const subaccountId = partner.woovi_subaccount_id || partner.pix_key;

    // Build charge payload
    const chargePayload: Record<string, any> = {
      correlationID: correlationId,
      value: Math.round(amount * 100), // Convert to cents
      comment: `Pagamento: ${product.name}`,
      // Direct payment to subaccount
      destination: subaccountId,
    };

    // Add customer if any identifier is provided
    if (customer?.email || customer?.phone || customer?.document) {
      chargePayload.customer = {};
      if (customer.name) chargePayload.customer.name = customer.name;
      if (customer.email) chargePayload.customer.email = customer.email;
      if (customer.phone) chargePayload.customer.phone = customer.phone.replace(/\D/g, "");
      if (customer.document) chargePayload.customer.taxID = { taxID: customer.document.replace(/\D/g, "") };
    }

    console.log("Creating Woovi charge with payload:", JSON.stringify(chargePayload));

    // Create charge in Woovi
    const wooviResponse = await fetch("https://api.woovi.com/api/v1/charge", {
      method: "POST",
      headers: {
        Authorization: wooviApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargePayload),
    });

    const wooviData = await wooviResponse.json();

    if (!wooviResponse.ok) {
      console.error("Woovi API error:", wooviData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: wooviData.error || "Erro ao criar cobrança PIX" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Woovi charge created:", wooviData);

    const charge = wooviData.charge;

    // Create partner transaction record
    const { error: txError } = await supabase
      .from("partner_transactions")
      .insert({
        partner_id: partnerId,
        product_id: productId,
        amount: amount,
        fee: calculatedFee,
        net_amount: netAmount,
        customer_name: customer?.name || null,
        customer_email: customer?.email || null,
        customer_phone: customer?.phone || null,
        customer_document: customer?.document || null,
        status: "pending",
        woovi_charge_id: charge.identifier || charge.transactionID,
        woovi_correlation_id: correlationId,
        pix_code: charge.brCode,
        qr_code_base64: charge.paymentLinkUrl ? null : charge.qrCodeImage,
      });

    if (txError) {
      console.error("Error creating transaction:", txError);
      // Don't fail the request, charge was created
    }

    return new Response(
      JSON.stringify({
        success: true,
        chargeId: charge.identifier || charge.transactionID,
        correlationId: correlationId,
        pixCode: charge.brCode,
        qrCodeBase64: charge.qrCodeImage,
        expiresAt: charge.expiresAt,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in create-partner-pix-charge:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
