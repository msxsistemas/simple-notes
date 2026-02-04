import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const WOOVI_API_BASE = "https://api.openpix.com.br/api/v1";

type SubaccountAction = 
  | "create" 
  | "list" 
  | "get" 
  | "delete" 
  | "withdraw" 
  | "debit" 
  | "transfer";

interface SubaccountRequest {
  action: SubaccountAction;
  // For create
  name?: string;
  pixKey?: string;
  // For get/delete/withdraw/debit
  subaccountId?: string;
  // For withdraw/debit/transfer
  value?: number;
  // For transfer
  fromSubaccountId?: string;
  toSubaccountId?: string;
  // For list pagination
  skip?: number;
  limit?: number;
}

interface WooviSubaccount {
  name: string;
  pixKey: string;
  subaccountId: string;
  balance: number;
  createdAt: string;
}

// Create a new subaccount
async function createSubaccount(apiKey: string, name: string, pixKey: string): Promise<{ success: boolean; data?: WooviSubaccount; error?: string }> {
  console.log("Creating subaccount:", name, pixKey);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, pixKey }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi create subaccount error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Subaccount created:", data);
  return { 
    success: true, 
    data: data.subaccount || data 
  };
}

// List all subaccounts
async function listSubaccounts(apiKey: string, skip = 0, limit = 100): Promise<{ success: boolean; data?: WooviSubaccount[]; error?: string }> {
  console.log("Listing subaccounts, skip:", skip, "limit:", limit);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount?skip=${skip}&limit=${limit}`, {
    method: "GET",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi list subaccounts error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Listed", data.subaccounts?.length || 0, "subaccounts");
  return { 
    success: true, 
    data: data.subaccounts || [] 
  };
}

// Get subaccount details
async function getSubaccount(apiKey: string, subaccountId: string): Promise<{ success: boolean; data?: WooviSubaccount; error?: string }> {
  console.log("Getting subaccount:", subaccountId);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount/${subaccountId}`, {
    method: "GET",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi get subaccount error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Subaccount retrieved:", data);
  return { 
    success: true, 
    data: data.subaccount || data 
  };
}

// Delete a subaccount
async function deleteSubaccount(apiKey: string, subaccountId: string): Promise<{ success: boolean; error?: string }> {
  console.log("Deleting subaccount:", subaccountId);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount/${subaccountId}`, {
    method: "DELETE",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    console.error("Woovi delete subaccount error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Subaccount deleted successfully");
  return { success: true };
}

// Withdraw from a subaccount (to owner's bank account)
async function withdrawFromSubaccount(apiKey: string, subaccountId: string, value: number): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  console.log("Withdrawing from subaccount:", subaccountId, "value:", value);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount/${subaccountId}/withdraw`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }), // value in cents
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi withdraw error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Withdrawal successful:", data);
  return { success: true, data };
}

// Debit from a subaccount (send to main account)
async function debitFromSubaccount(apiKey: string, subaccountId: string, value: number): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  console.log("Debiting from subaccount:", subaccountId, "value:", value);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount/${subaccountId}/debit`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ value }), // value in cents
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi debit error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Debit successful:", data);
  return { success: true, data };
}

// Transfer between subaccounts
async function transferBetweenSubaccounts(
  apiKey: string, 
  fromSubaccountId: string, 
  toSubaccountId: string, 
  value: number
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string }> {
  console.log("Transferring between subaccounts:", fromSubaccountId, "->", toSubaccountId, "value:", value);
  
  const response = await fetch(`${WOOVI_API_BASE}/subaccount/transfer`, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      fromSubaccountId,
      toSubaccountId,
      value // value in cents
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error("Woovi transfer error:", data);
    return { 
      success: false, 
      error: data.error || data.message || `HTTP ${response.status}` 
    };
  }

  console.log("Transfer successful:", data);
  return { success: true, data };
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
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables are not configured");
      throw new Error("Supabase environment variables are not configured");
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error("Invalid token:", userError?.message);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("User authenticated:", user.id);

    const body: SubaccountRequest = await req.json();
    const { action } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Action is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let result: { success: boolean; data?: unknown; error?: string };

    switch (action) {
      case "create": {
        if (!body.name || !body.pixKey) {
          return new Response(
            JSON.stringify({ success: false, error: "name and pixKey are required for create" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await createSubaccount(WOOVI_API_KEY, body.name, body.pixKey);
        break;
      }

      case "list": {
        result = await listSubaccounts(WOOVI_API_KEY, body.skip || 0, body.limit || 100);
        break;
      }

      case "get": {
        if (!body.subaccountId) {
          return new Response(
            JSON.stringify({ success: false, error: "subaccountId is required for get" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await getSubaccount(WOOVI_API_KEY, body.subaccountId);
        break;
      }

      case "delete": {
        if (!body.subaccountId) {
          return new Response(
            JSON.stringify({ success: false, error: "subaccountId is required for delete" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await deleteSubaccount(WOOVI_API_KEY, body.subaccountId);
        break;
      }

      case "withdraw": {
        if (!body.subaccountId || !body.value) {
          return new Response(
            JSON.stringify({ success: false, error: "subaccountId and value are required for withdraw" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await withdrawFromSubaccount(WOOVI_API_KEY, body.subaccountId, body.value);
        break;
      }

      case "debit": {
        if (!body.subaccountId || !body.value) {
          return new Response(
            JSON.stringify({ success: false, error: "subaccountId and value are required for debit" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await debitFromSubaccount(WOOVI_API_KEY, body.subaccountId, body.value);
        break;
      }

      case "transfer": {
        if (!body.fromSubaccountId || !body.toSubaccountId || !body.value) {
          return new Response(
            JSON.stringify({ success: false, error: "fromSubaccountId, toSubaccountId, and value are required for transfer" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await transferBetweenSubaccounts(
          WOOVI_API_KEY, 
          body.fromSubaccountId, 
          body.toSubaccountId, 
          body.value
        );
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    console.log("Action", action, "completed:", result.success);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in woovi-subaccount:", error);
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
