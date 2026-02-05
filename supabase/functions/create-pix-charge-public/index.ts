import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CreateChargeRequest {
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerTaxId?: string;
  orderId?: string;
  merchantId?: string;
  productName?: string;
  description?: string;
  expiresIn?: number;
}

interface SplitPartner {
  id: string;
  pix_key: string;
  split_type: 'percentage' | 'fixed';
  split_value: number;
  status: string;
}

interface WooviSplit {
  pixKey: string;
  value: number;
  splitType: string;
}

interface WooviChargeResponse {
  charge: {
    status: string;
    customer: {
      name: string;
      email: string;
      phone: string;
      taxID: {
        taxID: string;
        type: string;
      };
      correlationID: string;
    };
    value: number;
    comment: string;
    correlationID: string;
    paymentLinkID: string;
    paymentLinkUrl: string;
    qrCodeImage: string;
    brCode: string;
    expiresDate: string;
    expiresIn: number;
    pixKey: string;
    paymentMethods: {
      pix: {
        method: string;
        txid: string;
        value: number;
        status: string;
        fee: number;
        qrCodeImage: string;
        brCode: string;
        expiresDate: string;
        expiresIn: number;
        createdAt: string;
        updatedAt: string;
      };
    };
    globalID: string;
    transactionID: string;
    identifier: string;
    createdAt: string;
    updatedAt: string;
  };
  correlationID: string;
  brCode: string;
}

// Calculate splits for Woovi API
// Woovi cobra 1.40% ou R$0.80 (o maior) - calculamos o valor exato para a subconta
function calculateSplits(partners: SplitPartner[], amountCents: number): WooviSplit[] {
  const splits: WooviSplit[] = [];
  
  for (const partner of partners) {
    if (partner.status !== 'active') continue;
    
    let splitValueCents: number;
    
    if (partner.split_type === 'percentage') {
      // Usa o percentual definido diretamente sobre o valor total
      splitValueCents = Math.round(amountCents * (partner.split_value / 100));
    } else {
      // Valor fixo em centavos
      splitValueCents = Math.round(partner.split_value * 100);
    }
    
    if (splitValueCents > 0) {
      splits.push({
        pixKey: partner.pix_key,
        value: splitValueCents,
        splitType: 'SPLIT_SUB_ACCOUNT',
      });
      console.log(`Split para ${partner.pix_key}: R$ ${(splitValueCents / 100).toFixed(2)} (${partner.split_value}${partner.split_type === 'percentage' ? '%' : ' fixo'})`);
    }
  }
  
  console.log(`Split total: ${amountCents}c, splits=${JSON.stringify(splits)}`);
  
  return splits;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const WOOVI_API_KEY = Deno.env.get("WOOVI_API_KEY");
    if (!WOOVI_API_KEY) {
      console.error("WOOVI_API_KEY is not configured");
      throw new Error("WOOVI_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase environment variables are not configured");
      throw new Error("Supabase environment variables are not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body: CreateChargeRequest = await req.json();
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerTaxId,
      orderId,
      merchantId,
      productName,
      description,
      expiresIn = 3600,
    } = body;

   if (!amount) {
      console.error("Missing required fields");
      return new Response(
       JSON.stringify({ success: false, error: "Campo obrigatório: valor" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get merchant/owner user ID
    let ownerId: string | null = null;
    
    if (merchantId) {
      const { data: merchant } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", merchantId)
        .single();
      
      if (merchant) {
        ownerId = merchant.id;
      }
    }
    
    if (!ownerId) {
      const { data: firstUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("status", "active")
        .limit(1)
        .single();
      
      if (firstUser) {
        ownerId = firstUser.id;
      }
    }

    if (!ownerId) {
      const { data: anyUser } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .limit(1)
        .single();
      
      if (anyUser) {
        ownerId = anyUser.id;
      }
    }

    if (!ownerId) {
      console.error("No merchant/owner found");
      return new Response(
        JSON.stringify({ success: false, error: "Configuração de merchant não encontrada" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Creating charge for owner:", ownerId);

    // Get fee config and check if split is enabled
    const { data: feeConfig } = await supabaseAdmin
      .from("fee_configs")
      .select("pix_in_percentage, pix_in_fixed, split_enabled")
      .eq("user_id", ownerId)
      .single();

    const feePercentage = feeConfig?.pix_in_percentage || 1.40;
    const feeMinimum = feeConfig?.pix_in_fixed || 0.80;
    // Fee is the GREATER of: percentage OR minimum fixed amount
    const feeFromPercentage = (amount * feePercentage) / 100;
    const fee = Math.max(feeFromPercentage, feeMinimum);
    const netAmount = amount - fee;
    const splitEnabled = feeConfig?.split_enabled || false;

    // Get split partners if enabled
    let splits: WooviSplit[] = [];
    if (splitEnabled) {
      const { data: partners } = await supabaseAdmin
        .from("split_partners")
        .select("id, pix_key, split_type, split_value, status")
        .eq("user_id", ownerId)
        .eq("status", "active");

      if (partners && partners.length > 0) {
        const amountCents = Math.round(amount * 100);
        splits = calculateSplits(partners as SplitPartner[], amountCents);
        console.log("Splits calculated:", splits.length, "partners");
      }
    }

    const correlationID = `pix_pub_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

    // Build charge payload
    const chargePayload: Record<string, unknown> = {
      correlationID,
      value: Math.round(amount * 100),
      comment: description || productName || `Pagamento ${orderId || correlationID}`,
      expiresIn,
    };

   // Add customer info only if provided
   // Woovi requires at least one identifier (email, phone, or taxID) in the customer object
   // Only send customer object if we have at least one valid identifier
   const hasEmail = customerEmail && customerEmail.trim().length > 0;
   const hasPhone = customerPhone && customerPhone.replace(/\D/g, "").length >= 10;
   const hasTaxId = customerTaxId && customerTaxId.replace(/\D/g, "").length >= 11;
   
   if (hasEmail || hasPhone || hasTaxId) {
     const customerObj: Record<string, unknown> = {
       name: customerName || 'Cliente',
     };
     if (hasEmail) customerObj.email = customerEmail.trim();
     if (hasPhone) customerObj.phone = customerPhone.replace(/\D/g, "");
     if (hasTaxId) customerObj.taxID = customerTaxId.replace(/\D/g, "");
     
     chargePayload.customer = customerObj;
     console.log("Customer object:", JSON.stringify(customerObj));
   } else {
     console.log("No valid customer identifier provided, creating charge without customer object");
   }
 
    // Add splits if available
    if (splits.length > 0) {
      chargePayload.splits = splits;
      console.log("Creating charge with splits:", JSON.stringify(splits));
    }

    console.log("Creating charge on Woovi with correlationID:", correlationID);
    const wooviResponse = await fetch("https://api.openpix.com.br/api/v1/charge", {
      method: "POST",
      headers: {
        Authorization: WOOVI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chargePayload),
    });

    if (!wooviResponse.ok) {
      const errorText = await wooviResponse.text();
      console.error(`Woovi API error [${wooviResponse.status}]:`, errorText);
      throw new Error(`Erro na API Woovi: ${errorText}`);
    }

    const wooviData: WooviChargeResponse = await wooviResponse.json();
    console.log("Woovi charge created:", wooviData.charge?.transactionID);

    const transactionOrderId = orderId || `ORD-${Date.now()}`;
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("transactions")
      .insert({
        user_id: ownerId,
        order_id: transactionOrderId,
        amount,
        fee,
        net_amount: netAmount,
        payment_method: "pix",
        status: "pending",
       customer_name: customerName || 'Cliente',
       customer_email: customerEmail || 'nao-informado@checkout.local',
        customer_phone: customerPhone || null,
        pix_code: wooviData.charge?.brCode || wooviData.brCode,
        pix_qr_code: wooviData.charge?.qrCodeImage,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      throw new Error(`Erro ao criar transação: ${transactionError.message}`);
    }

    console.log("Transaction created:", transaction.id);

    const expiresAt = wooviData.charge?.expiresDate || new Date(Date.now() + expiresIn * 1000).toISOString();
    const { error: chargeError } = await supabaseAdmin
      .from("pix_charges")
      .insert({
        user_id: ownerId,
        transaction_id: transaction.id,
        woovi_charge_id: wooviData.charge?.transactionID || wooviData.charge?.identifier || correlationID,
        woovi_correlation_id: correlationID,
        amount,
        status: "ACTIVE",
        pix_code: wooviData.charge?.brCode || wooviData.brCode,
        qr_code_base64: wooviData.charge?.qrCodeImage,
        expires_at: expiresAt,
      });

    if (chargeError) {
      console.error("Error storing PIX charge:", chargeError);
    }

    const response = {
      success: true,
      transactionId: transaction.id,
      orderId: transactionOrderId,
      correlationId: correlationID,
      amount,
      fee,
      netAmount,
      pixCode: wooviData.charge?.brCode || wooviData.brCode,
      qrCodeImage: wooviData.charge?.qrCodeImage,
      expiresAt: expiresAt,
      paymentLinkUrl: wooviData.charge?.paymentLinkUrl,
      splitEnabled,
      splitsCount: splits.length,
    };

    console.log("Public charge created successfully:", response.transactionId, "with", splits.length, "splits");

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error creating public PIX charge:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
