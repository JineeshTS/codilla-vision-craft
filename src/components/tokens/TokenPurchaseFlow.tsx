import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { logError } from "@/lib/errorTracking";

interface TokenPurchaseFlowProps {
  isOpen: boolean;
  onClose: () => void;
  packageDetails: {
    name: string;
    tokens: number;
    price: number;
  } | null;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const TokenPurchaseFlow = ({
  isOpen,
  onClose,
  packageDetails,
  onSuccess,
}: TokenPurchaseFlowProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePurchase = async () => {
    if (!packageDetails) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Load Razorpay script
      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error("Failed to load Razorpay SDK");
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase.functions.invoke(
        "create-razorpay-order",
        {
          body: {
            amount: packageDetails.price,
            tokens: packageDetails.tokens,
          },
        }
      );

      if (orderError) throw orderError;

      // Open Razorpay checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Codilla.ai",
        description: `${packageDetails.name} Package - ${packageDetails.tokens.toLocaleString()} Tokens`,
        order_id: orderData.orderId,
        handler: async (response: any) => {
          try {
            // Verify payment
            const { data: verifyData, error: verifyError } =
              await supabase.functions.invoke("verify-razorpay-payment", {
                body: {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });

            if (verifyError) throw verifyError;

            toast({
              title: "Purchase Successful!",
              description: `${verifyData.tokens_added.toLocaleString()} tokens added to your account. New balance: ${verifyData.new_balance.toLocaleString()} tokens`,
            });

            onSuccess();
            onClose();
          } catch (err) {
            logError(err instanceof Error ? err : new Error('Payment verification failed'), { packageDetails });
            setError("Payment verification failed. Please contact support.");
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#8B5CF6",
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      logError(err instanceof Error ? err : new Error('Purchase error'), { packageDetails });
      setError(
        err instanceof Error ? err.message : "Failed to initiate purchase"
      );
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Purchase</DialogTitle>
        </DialogHeader>

        {packageDetails && (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Package:</span>
                <span className="font-semibold">{packageDetails.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Tokens:</span>
                <span className="font-semibold">
                  {packageDetails.tokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total:</span>
                <span className="font-bold">₹{packageDetails.price}</span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handlePurchase}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Proceed to Payment
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Razorpay
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TokenPurchaseFlow;
