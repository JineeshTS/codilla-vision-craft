import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Coins, AlertCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { logError } from "@/lib/errorTracking";

interface TokenCostPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  messages: Array<{ role: string; content: string }>;
  model: string;
  estimatedOutputLength?: number;
}

export default function TokenCostPreview({
  open,
  onOpenChange,
  onConfirm,
  messages,
  model,
  estimatedOutputLength = 500
}: TokenCostPreviewProps) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [tokenEstimate, setTokenEstimate] = useState<{
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  } | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      calculateCost();
      fetchUserBalance();
    }
  }, [open, messages, model]);

  const fetchUserBalance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('token_balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserBalance(data?.token_balance || 0);
    } catch (err) {
      logError(err instanceof Error ? err : new Error('Error fetching balance'), { context: 'fetchUserBalance' });
    }
  };

  const calculateCost = async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/estimate-tokens`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages,
            model,
            estimatedOutputLength
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to estimate tokens');
      }

      const data = await response.json();
      setTokenEstimate(data);
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error('Error calculating cost'), { messages, model });
      setError(err.message || 'Failed to calculate token cost');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const hasEnoughBalance = tokenEstimate ? userBalance >= tokenEstimate.totalTokens : false;
  const balanceAfter = tokenEstimate ? userBalance - tokenEstimate.totalTokens : userBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Token Cost Preview
          </DialogTitle>
          <DialogDescription>
            Estimated token usage for this AI request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isCalculating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : tokenEstimate ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Input Tokens</span>
                  <Badge variant="outline">{tokenEstimate.inputTokens.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Estimated Output</span>
                  <Badge variant="outline">{tokenEstimate.outputTokens.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border-2 border-primary">
                  <span className="text-sm font-semibold">Total Cost</span>
                  <Badge className="bg-primary text-primary-foreground">
                    {tokenEstimate.totalTokens.toLocaleString()} tokens
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Balance</span>
                  <span className="font-medium">{userBalance.toLocaleString()} tokens</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Balance After</span>
                  <span className={`font-medium ${hasEnoughBalance ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    {balanceAfter.toLocaleString()} tokens
                  </span>
                </div>
              </div>

              {!hasEnoughBalance && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient token balance. Please purchase more tokens to continue.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <p className="font-medium">Model: {model}</p>
                  <p className="mt-1 opacity-80">
                    This is an estimate. Actual usage may vary based on response length.
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasEnoughBalance || isCalculating || !!error}
            className="flex-1"
          >
            {isCalculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              'Confirm & Send'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}