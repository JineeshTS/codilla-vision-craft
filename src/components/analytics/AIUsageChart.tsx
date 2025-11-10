import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Loader2 } from "lucide-react";
import { logError } from "@/lib/errorTracking";

export const AIUsageChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIUsage();
  }, []);

  const fetchAIUsage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get AI requests by agent
      const { data: requests } = await supabase
        .from('ai_requests')
        .select('ai_agent, tokens_used, created_at')
        .eq('user_id', user.id)
        .eq('success', true);

      if (!requests) return;

      // Group by AI agent
      const grouped = requests.reduce((acc: any, req) => {
        const agent = req.ai_agent || 'unknown';
        if (!acc[agent]) {
          acc[agent] = { name: agent, requests: 0, tokens: 0 };
        }
        acc[agent].requests++;
        acc[agent].tokens += req.tokens_used || 0;
        return acc;
      }, {});

      setData(Object.values(grouped));
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error fetching AI usage'), { context: 'fetchAIUsage' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-panel p-6">
      <h3 className="text-lg font-semibold mb-4">AI Model Usage</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
          <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
          <YAxis stroke="hsl(var(--foreground))" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px'
            }} 
          />
          <Legend />
          <Bar dataKey="requests" fill="hsl(var(--primary))" name="Requests" />
          <Bar dataKey="tokens" fill="hsl(var(--secondary))" name="Tokens Used" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};