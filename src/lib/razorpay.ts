/**
 * Razorpay payment integration utilities
 */

import { supabase } from "@/integrations/supabase/client";
import { trackTokenPurchase } from "./analytics";

// Razorpay types
declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number; // in INR
  popular?: boolean;
}

/**
 * Token packages available for purchase
 */
export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    tokens: 1000,
    price: 999, // ₹9.99
  },
  {
    id: "pro",
    name: "Pro Pack",
    tokens: 5000,
    price: 4499, // ₹44.99
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    tokens: 10000,
    price: 7999, // ₹79.99
  },
];

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create a Razorpay order on the server
 */
export const createRazorpayOrder = async (
  amount: number,
  tokenPackageId: string
): Promise<{ orderId: string; amount: number }> => {
  // Call your edge function to create an order
  const { data, error } = await supabase.functions.invoke("create-payment-order", {
    body: {
      amount, // amount in paise (multiply by 100)
      currency: "INR",
      packageId: tokenPackageId,
    },
  });

  if (error) throw new Error(error.message || "Failed to create order");
  if (!data?.orderId) throw new Error("Invalid order response");

  return {
    orderId: data.orderId,
    amount: data.amount,
  };
};

/**
 * Verify payment on the server
 */
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string,
  packageId: string
): Promise<{ success: boolean; tokensAdded: number }> => {
  const { data, error } = await supabase.functions.invoke("verify-payment", {
    body: {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature,
      packageId,
    },
  });

  if (error) throw new Error(error.message || "Payment verification failed");
  if (!data?.success) throw new Error("Payment verification failed");

  return {
    success: true,
    tokensAdded: data.tokensAdded,
  };
};

/**
 * Initialize Razorpay payment
 */
export const initiatePayment = async (
  tokenPackage: TokenPackage,
  razorpayKeyId: string,
  onSuccess: (tokens: number) => void,
  onError: (error: Error) => void
): Promise<void> => {
  try {
    // Load Razorpay script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      throw new Error("Failed to load Razorpay SDK");
    }

    // Get user details
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    // Create order on server
    const amountInPaise = tokenPackage.price * 100;
    const { orderId, amount } = await createRazorpayOrder(
      amountInPaise,
      tokenPackage.id
    );

    // Configure Razorpay
    const options: RazorpayOptions = {
      key: razorpayKeyId,
      amount: amount,
      currency: "INR",
      name: "Codilla.ai",
      description: `${tokenPackage.name} - ${tokenPackage.tokens} tokens`,
      order_id: orderId,
      handler: async (response: RazorpayResponse) => {
        try {
          // Verify payment on server
          const { tokensAdded } = await verifyPayment(
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
            tokenPackage.id
          );

          // Track purchase in analytics
          trackTokenPurchase(tokenPackage.tokens, tokenPackage.price);

          onSuccess(tokensAdded);
        } catch (error) {
          onError(error as Error);
        }
      },
      prefill: {
        name: profile?.full_name || "",
        email: profile?.email || user.email || "",
      },
      theme: {
        color: "#6366f1", // Primary color
      },
      modal: {
        ondismiss: () => {
          // User closed the modal
          console.log("Payment modal closed");
        },
      },
    };

    // Open Razorpay checkout
    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();
  } catch (error) {
    onError(error as Error);
  }
};
