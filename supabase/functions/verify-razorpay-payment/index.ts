import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: "Missing payment details" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    // Use Web Crypto API for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(razorpayKeySecret);
    const messageData = encoder.encode(text);
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== razorpay_signature) {
      // Update transaction as failed
      await supabase
        .from("payment_transactions")
        .update({ status: "failed" })
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({ error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .single();

    if (txError || !transaction) {
      throw new Error("Transaction not found");
    }

    // Update transaction as successful
    const { error: updateError } = await supabase
      .from("payment_transactions")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "success",
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id);

    if (updateError) {
      throw new Error("Failed to update transaction");
    }

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("total_tokens")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw new Error("Failed to get user profile");
    }

    const newBalance = (profile.total_tokens || 0) + transaction.tokens_purchased;

    // Update user's token balance
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({ total_tokens: newBalance })
      .eq("id", user.id);

    if (balanceError) {
      throw new Error("Failed to update token balance");
    }

    // Create token transaction record
    const { error: tokenTxError } = await supabase
      .from("token_transactions")
      .insert({
        user_id: user.id,
        transaction_type: "purchase",
        amount: transaction.tokens_purchased,
        balance_after: newBalance,
        description: `Purchased ${transaction.tokens_purchased} tokens via Razorpay`,
        metadata: {
          razorpay_order_id,
          razorpay_payment_id,
          amount_paid: transaction.amount,
        },
      });

    if (tokenTxError) {
      console.error("Failed to create token transaction:", tokenTxError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        tokens_added: transaction.tokens_purchased,
        new_balance: newBalance,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
