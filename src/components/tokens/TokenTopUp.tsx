import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopUpOption {
  amount: number;
  tokens: number;
  bonus: number;
}

interface TokenTopUpProps {
  onSelectAmount: (amount: number, tokens: number) => void;
}

const TokenTopUp = ({ onSelectAmount }: TokenTopUpProps) => {
  const [topUpOptions, setTopUpOptions] = useState<TopUpOption[]>([]);
  const [basePrice, setBasePrice] = useState(0.10);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-get-config", {
        body: { configKey: "token_topup_options" }
      });

      if (error) throw error;

      if (data?.data?.config_value) {
        setTopUpOptions(data.data.config_value);
      } else {
        // Default options
        setTopUpOptions([
          { amount: 100, tokens: 10000, bonus: 0 },
          { amount: 500, tokens: 55000, bonus: 5000 },
          { amount: 1000, tokens: 120000, bonus: 20000 },
          { amount: 5000, tokens: 650000, bonus: 150000 },
        ]);
      }

      const { data: priceData } = await supabase.functions.invoke("admin-get-config", {
        body: { configKey: "token_base_price" }
      });

      if (priceData?.data?.config_value?.price_per_1k) {
        setBasePrice(priceData.data.config_value.price_per_1k);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      // Use defaults
      setTopUpOptions([
        { amount: 100, tokens: 10000, bonus: 0 },
        { amount: 500, tokens: 55000, bonus: 5000 },
        { amount: 1000, tokens: 120000, bonus: 20000 },
        { amount: 5000, tokens: 650000, bonus: 150000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const calculateCustomTokens = (amount: number) => {
    return Math.floor((amount / basePrice) * 1000);
  };

  const handleCustomTopUp = () => {
    const amount = parseInt(customAmount);
    if (amount >= 10) {
      const tokens = calculateCustomTokens(amount);
      onSelectAmount(amount, tokens);
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Top Up Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Base rate: ₹{basePrice.toFixed(2)} per 1,000 tokens
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topUpOptions.map((option, index) => {
          const isPopular = index === 1;
          const discount = option.bonus > 0 
            ? Math.round((option.bonus / option.tokens) * 100) 
            : 0;

          return (
            <Card
              key={index}
              className={`relative p-6 border-2 transition-all hover:shadow-lg ${
                isPopular
                  ? "border-primary bg-gradient-to-br from-primary/5 to-background"
                  : "border-border"
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 right-6 bg-primary">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              )}

              {discount > 0 && (
                <Badge className="absolute -top-3 left-6 bg-green-500">
                  <Zap className="w-3 h-3 mr-1" />
                  {discount}% Bonus
                </Badge>
              )}

              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold">₹{option.amount}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-primary">
                    {option.tokens.toLocaleString()} tokens
                  </p>
                  {option.bonus > 0 && (
                    <p className="text-xs text-green-500">
                      +{option.bonus.toLocaleString()} bonus tokens
                    </p>
                  )}
                </div>

                <Button
                  onClick={() => onSelectAmount(option.amount, option.tokens)}
                  className="w-full"
                  variant={isPopular ? "default" : "outline"}
                >
                  Top Up ₹{option.amount}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Amount</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="customAmount">Amount (₹)</Label>
            <Input
              id="customAmount"
              type="number"
              min="10"
              placeholder="Enter amount (min ₹10)"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
            {customAmount && parseInt(customAmount) >= 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                You'll get {calculateCustomTokens(parseInt(customAmount)).toLocaleString()} tokens
              </p>
            )}
          </div>
          <Button 
            onClick={handleCustomTopUp}
            disabled={!customAmount || parseInt(customAmount) < 10}
          >
            Top Up
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TokenTopUp;
