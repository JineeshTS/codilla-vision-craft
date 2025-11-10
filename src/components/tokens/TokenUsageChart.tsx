import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Loader2 } from "lucide-react";
import { logError } from "@/lib/errorTracking";

interface TokenTransaction {
  created_at: string;
  amount: number;
  transaction_type: string;
}

const TokenUsageChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from("token_transactions")
          .select("created_at, amount, transaction_type")
          .order("created_at", { ascending: true })
          .limit(30);

        if (error) throw error;

        // Group by date
        const grouped = (transactions || []).reduce((acc: any, tx: TokenTransaction) => {
          const date = new Date(tx.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          
          if (!acc[date]) {
            acc[date] = { date, used: 0, purchased: 0 };
          }
          
          if (tx.transaction_type === "usage") {
            acc[date].used += Math.abs(tx.amount);
          } else if (tx.transaction_type === "purchase" || tx.transaction_type === "bonus") {
            acc[date].purchased += tx.amount;
          }
          
          return acc;
        }, {});

        setData(Object.values(grouped));
      } catch (error) {
        logError(error instanceof Error ? error : new Error('Error fetching token transactions'), { context: 'fetchTransactions' });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px",
              }}
            />
            <Bar dataKey="purchased" fill="hsl(var(--primary))" name="Purchased" />
            <Bar dataKey="used" fill="hsl(var(--destructive))" name="Used" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default TokenUsageChart;
