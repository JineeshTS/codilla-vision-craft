import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, TrendingDown, Gift } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOKEN_PACKAGES, initiatePayment, type TokenPackage } from "@/lib/razorpay";
import { trackTokenPurchase } from "@/lib/analytics";

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface Profile {
  total_tokens: number;
  tokens_used: number;
}

const Tokens = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAuthenticated = useAuthGuard();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [profileRes, transactionsRes] = await Promise.all([
        supabase.from("profiles").select("total_tokens, tokens_used").eq("id", user.id).single(),
        supabase.from("token_transactions").select("*").order("created_at", { ascending: false }).limit(50)
      ]);

      if (profileRes.error) throw profileRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setProfile(profileRes.data);
      setTransactions(transactionsRes.data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading data",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    const paymentsEnabled = import.meta.env.VITE_ENABLE_PAYMENTS === "true";

    if (!paymentsEnabled || !razorpayKeyId) {
      toast({
        title: "Payments not configured",
        description: "Payment system is not yet configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);

    await initiatePayment(
      pkg,
      razorpayKeyId,
      async (tokens) => {
        // Success callback
        toast({
          title: "Payment Successful!",
          description: `Successfully added ${tokens.toLocaleString()} tokens to your account.`,
        });

        // Track purchase in analytics
        trackTokenPurchase(tokens, pkg.price);

        // Refresh token balance and transactions
        await fetchData();
        setProcessingPayment(false);
      },
      (error) => {
        // Error callback
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: error.message || "Something went wrong. Please try again.",
        });
        setProcessingPayment(false);
      }
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase": return <TrendingUp className="w-4 h-4 text-green-400" />;
      case "consumption": return <TrendingDown className="w-4 h-4 text-red-400" />;
      case "bonus": return <Gift className="w-4 h-4 text-primary" />;
      case "refund": return <TrendingUp className="w-4 h-4 text-blue-400" />;
      default: return <Coins className="w-4 h-4" />;
    }
  };

  const availableTokens = profile ? profile.total_tokens - profile.tokens_used : 0;

  return (
    <div className="min-h-screen cosmic-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-2">Token Management</h1>
          <p className="text-muted-foreground">Track your AI processing credits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Available Tokens</span>
              <Coins className="w-5 h-5 text-primary" />
            </div>
            <p className="text-3xl font-bold">{availableTokens.toLocaleString()}</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Total Earned</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold">{profile?.total_tokens.toLocaleString() || 0}</p>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">Tokens Used</span>
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-3xl font-bold">{profile?.tokens_used.toLocaleString() || 0}</p>
          </Card>
        </div>

        <Card className="glass-panel p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Purchase Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOKEN_PACKAGES.map((pkg) => (
              <Card
                key={pkg.id}
                className={`p-6 hover:scale-105 transition-transform ${
                  pkg.popular ? "border-primary border-2" : "border-muted"
                }`}
              >
                {pkg.popular && (
                  <Badge className="mb-2 bg-primary">Most Popular</Badge>
                )}
                <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                <h4 className="text-2xl font-bold mb-2">{pkg.tokens.toLocaleString()} Tokens</h4>
                <p className="text-3xl font-bold text-primary mb-4">₹{pkg.price.toLocaleString()}</p>
                <Button
                  className="w-full"
                  onClick={() => handlePurchase(pkg)}
                  disabled={processingPayment}
                >
                  {processingPayment ? "Processing..." : "Purchase"}
                </Button>
              </Card>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h2 className="text-2xl font-semibold mb-4">Transaction History</h2>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(tx.transaction_type)}
                    <div>
                      <p className="font-medium">
                        {tx.description || tx.transaction_type.replace("_", " ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.transaction_type === "consumption" ? "text-red-400" : "text-green-400"
                    }`}>
                      {tx.transaction_type === "consumption" ? "-" : "+"}{Math.abs(tx.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {tx.balance_after}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Tokens;