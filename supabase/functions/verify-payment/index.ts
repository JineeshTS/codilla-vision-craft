import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Token packages configuration (must match frontend)
const TOKEN_PACKAGES: Record<string, { tokens: number; price: number }> = {
  starter: { tokens: 1000, price: 999 },
  pro: { tokens: 5000, price: 4499 },
  enterprise: { tokens: 10000, price: 7999 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth user
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Get request body
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      packageId,
    } = await req.json();

    // Validate input
    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature ||
      !packageId
    ) {
      throw new Error("Missing required parameters");
    }

    // Verify package exists
    const tokenPackage = TOKEN_PACKAGES[packageId];
    if (!tokenPackage) {
      throw new Error("Invalid package ID");
    }

    // Verify Razorpay signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret);
    const bodyData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, bodyData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid signature - payment verification failed");
    }

    console.log("Payment verified successfully:", razorpay_payment_id);

    // Add tokens to user's account
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("total_tokens")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    const newTotalTokens = profile.total_tokens + tokenPackage.tokens;

    const { error: updateError } = await supabaseClient
      .from("profiles")
      .update({ total_tokens: newTotalTokens })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Create transaction record
    const { error: transactionError } = await supabaseClient
      .from("token_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "purchase",
        amount: tokenPackage.tokens,
        balance_after: newTotalTokens,
        description: `Purchased ${tokenPackage.tokens} tokens`,
        metadata: {
          package_id: packageId,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          price: tokenPackage.price,
        },
      });

    if (transactionError) throw transactionError;

    console.log("Tokens added successfully:", tokenPackage.tokens);

    return new Response(
      JSON.stringify({
        success: true,
        tokensAdded: tokenPackage.tokens,
        newBalance: newTotalTokens,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
