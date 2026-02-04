import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-openpix-signature",
};

interface WooviWebhookPayload {
  event: string;
  charge?: {
    status: string;
    value: number;
    correlationID: string;
    transactionID: string;
    brCode: string;
    customer: {
      name: string;
      email: string;
    };
    paidAt?: string;
  };
  pix?: {
    charge: {
      correlationID: string;
      status: string;
      value: number;
    };
    payer: {
      name: string;
      taxID: string;
    };
    time: string;
    value: number;
    transactionID: string;
    infoPagador: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase environment variables are not configured");
      throw new Error("Supabase environment variables are not configured");
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Log webhook signature for debugging
    const signature = req.headers.get("x-openpix-signature") || req.headers.get("x-webhook-signature");
    console.log("Received webhook with signature:", signature ? "present" : "missing");

    const body: WooviWebhookPayload = await req.json();
    console.log("Webhook event received:", body.event);
    console.log("Webhook payload:", JSON.stringify(body, null, 2));

    // Handle different event types
    let correlationId: string | undefined;
    let newStatus: string | undefined;
    let paidAt: string | undefined;

    if (body.event === "OPENPIX:CHARGE_COMPLETED" && body.charge) {
      correlationId = body.charge.correlationID;
      newStatus = "approved";
      paidAt = body.charge.paidAt || new Date().toISOString();
      console.log("Charge completed:", correlationId);
    } else if (body.event === "OPENPIX:CHARGE_EXPIRED" && body.charge) {
      correlationId = body.charge.correlationID;
      newStatus = "expired";
      console.log("Charge expired:", correlationId);
    } else if (body.event === "OPENPIX:TRANSACTION_RECEIVED" && body.pix) {
      correlationId = body.pix.charge?.correlationID;
      newStatus = "approved";
      paidAt = body.pix.time;
      console.log("Transaction received:", correlationId);
    } else if (body.event === "OPENPIX:TRANSACTION_REFUND_RECEIVED" && body.pix) {
      correlationId = body.pix.charge?.correlationID;
      newStatus = "refunded";
      console.log("Refund received:", correlationId);
    } else {
      console.log("Unhandled event type:", body.event);
      return new Response(JSON.stringify({ received: true, handled: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!correlationId) {
      console.error("No correlationID found in webhook payload");
      return new Response(
        JSON.stringify({ error: "No correlationID found" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find the PIX charge
    const { data: pixCharge, error: findError } = await supabaseAdmin
      .from("pix_charges")
      .select("id, transaction_id, user_id, status")
      .eq("woovi_correlation_id", correlationId)
      .single();

    if (findError || !pixCharge) {
      console.error("PIX charge not found:", correlationId, findError?.message);
      return new Response(
        JSON.stringify({ error: "PIX charge not found", correlationId }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Found PIX charge:", pixCharge.id, "for transaction:", pixCharge.transaction_id);

    // Update PIX charge status
    const { error: updateChargeError } = await supabaseAdmin
      .from("pix_charges")
      .update({
        status: newStatus === "approved" ? "COMPLETED" : newStatus?.toUpperCase(),
        paid_at: paidAt || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pixCharge.id);

    if (updateChargeError) {
      console.error("Error updating PIX charge:", updateChargeError);
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseAdmin
      .from("transactions")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pixCharge.transaction_id);

    if (updateTransactionError) {
      console.error("Error updating transaction:", updateTransactionError);
      throw new Error(`Error updating transaction: ${updateTransactionError.message}`);
    }

    console.log("Transaction status updated to:", newStatus);

    // Notify user's webhooks if configured
    const { data: userWebhooks } = await supabaseAdmin
      .from("webhooks")
      .select("url, events")
      .eq("user_id", pixCharge.user_id)
      .eq("status", "active");

    if (userWebhooks && userWebhooks.length > 0) {
      const eventType = newStatus === "approved" ? "payment_approved" : 
                       newStatus === "expired" ? "payment_cancelled" : 
                       newStatus === "refunded" ? "payment_refunded" : "payment_updated";

      // Get transaction details
      const { data: transaction } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("id", pixCharge.transaction_id)
        .single();

      for (const webhook of userWebhooks) {
        const events = webhook.events as string[];
        if (events.includes(eventType) || events.includes("payment_" + newStatus)) {
          try {
            console.log("Sending webhook to:", webhook.url);
            await fetch(webhook.url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: eventType,
                data: {
                  id: transaction?.id,
                  order_id: transaction?.order_id,
                  amount: transaction?.amount,
                  status: newStatus,
                  customer: {
                    name: transaction?.customer_name,
                    email: transaction?.customer_email,
                  },
                  created_at: transaction?.created_at,
                  paid_at: paidAt,
                },
              }),
            });
            console.log("Webhook sent successfully to:", webhook.url);
          } catch (webhookError) {
            console.error("Error sending webhook to", webhook.url, webhookError);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        correlationId, 
        status: newStatus,
        transactionId: pixCharge.transaction_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Webhook processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
