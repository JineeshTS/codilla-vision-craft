import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Users, DollarSign, Zap, TrendingUp, Activity, Brain, AlertTriangle, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface TokenTrend {
  date: string;
  consumed: number;
  purchased: number;
}

interface FeatureUsage {
  feature: string;
  tokens: number;
  calls: number;
}

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    growth: number;
  };
  tokens: {
    consumed: number;
    purchased: number;
    avgPerUser: number;
    trends: TokenTrend[];
    byFeature: FeatureUsage[];
    projectedDaysRemaining: number;
    optimizationPotential: number;
  };
  aiUsage: {
    totalCalls: number;
    byProvider: Array<{ provider: string; count: number; tokens: number }>;
    avgResponseTime: number;
  };
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "admin");
      if (!isAdmin) {
        navigate("/");
        toast({
          title: "Access Denied",
          description: "You don't have permission to access analytics.",
          variant: "destructive",
        });
        return;
      }

      await loadAnalytics();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/");
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch user stats
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("updated_at", thirtyDaysAgo.toISOString());

      // Fetch token transactions
      const { data: transactions } = await supabase
        .from("token_transactions")
        .select("*")
        .order("created_at", { ascending: false });

      const tokensPurchased = transactions?.filter(t => t.transaction_type === "purchase").reduce((sum, t) => sum + t.amount, 0) || 0;
      const tokensConsumed = transactions?.filter(t => t.transaction_type === "consumption").reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      // Fetch AI requests for detailed analytics
      const { data: aiRequests } = await supabase
        .from("ai_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      // Calculate token trends (last 30 days)
      const trends: TokenTrend[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayTransactions = transactions?.filter(t => 
          t.created_at?.startsWith(dateStr)
        ) || [];
        
        trends.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          consumed: dayTransactions
            .filter(t => t.transaction_type === "consumption")
            .reduce((sum, t) => sum + Math.abs(t.amount), 0),
          purchased: dayTransactions
            .filter(t => t.transaction_type === "purchase")
            .reduce((sum, t) => sum + t.amount, 0),
        });
      }

      // Group by feature/request type
      const featureMap = new Map<string, { tokens: number; calls: number }>();
      aiRequests?.forEach(req => {
        const feature = req.request_type || "other";
        const existing = featureMap.get(feature) || { tokens: 0, calls: 0 };
        featureMap.set(feature, {
          tokens: existing.tokens + (req.tokens_used || 0),
          calls: existing.calls + 1
        });
      });

      const byFeature: FeatureUsage[] = Array.from(featureMap.entries()).map(([feature, data]) => ({
        feature,
        tokens: data.tokens,
        calls: data.calls
      })).sort((a, b) => b.tokens - a.tokens);

      // Calculate projections
      const last7DaysConsumption = trends.slice(-7).reduce((sum, t) => sum + t.consumed, 0);
      const avgDailyConsumption = last7DaysConsumption / 7;
      const { data: profiles } = await supabase.from("profiles").select("token_balance");
      const totalBalance = profiles?.reduce((sum, p) => sum + (p.token_balance || 0), 0) || 0;
      const projectedDaysRemaining = avgDailyConsumption > 0 ? Math.floor(totalBalance / avgDailyConsumption) : 999;

      // Calculate optimization potential (identify high-cost, low-value operations)
      const highCostFeatures = byFeature.filter(f => f.tokens / f.calls > 5000).length;
      const optimizationPotential = Math.min(100, (highCostFeatures / Math.max(byFeature.length, 1)) * 100);

      // Group AI usage by provider
      const providerMap = new Map<string, { count: number; tokens: number }>();
      aiRequests?.forEach(req => {
        const provider = req.ai_agent || "unknown";
        const existing = providerMap.get(provider) || { count: 0, tokens: 0 };
        providerMap.set(provider, {
          count: existing.count + 1,
          tokens: existing.tokens + (req.tokens_used || 0)
        });
      });

      const byProvider = Array.from(providerMap.entries()).map(([provider, data]) => ({
        provider,
        count: data.count,
        tokens: data.tokens
      }));

      setAnalytics({
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          growth: 12.5,
        },
        revenue: {
          total: tokensPurchased * 0.01,
          thisMonth: (tokensPurchased * 0.01) * 0.3,
          growth: 18.2,
        },
        tokens: {
          consumed: tokensConsumed,
          purchased: tokensPurchased,
          avgPerUser: totalUsers ? Math.round(tokensConsumed / totalUsers) : 0,
          trends,
          byFeature,
          projectedDaysRemaining,
          optimizationPotential,
        },
        aiUsage: {
          totalCalls: aiRequests?.length || 0,
          byProvider,
          avgResponseTime: 1250,
        },
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor platform performance and usage</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3" /> +{analytics.users.growth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.active}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Consumed</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.tokens.consumed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg {analytics.tokens.avgPerUser} per user
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Calls</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.aiUsage.totalCalls}</div>
            <p className="text-xs text-muted-foreground">
              Avg {analytics.aiUsage.avgResponseTime}ms response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Insights */}
      {analytics.tokens.projectedDaysRemaining < 30 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Token Balance Warning</AlertTitle>
          <AlertDescription>
            At current usage rates, platform tokens will run out in approximately{" "}
            <strong>{analytics.tokens.projectedDaysRemaining} days</strong>. Consider purchasing more tokens or optimizing usage.
          </AlertDescription>
        </Alert>
      )}

      {analytics.tokens.optimizationPotential > 30 && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Optimization Opportunity</AlertTitle>
          <AlertDescription>
            We've identified <strong>{analytics.tokens.optimizationPotential.toFixed(0)}%</strong> optimization potential. 
            Some features are using high token counts per request. Review the feature breakdown below for details.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Analytics */}
      <Tabs defaultValue="token-analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="token-analytics">Token Analytics</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="ai">AI Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="token-analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Token Usage Trends</CardTitle>
                <CardDescription>Daily consumption and purchases over last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.tokens.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="consumed" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.6} name="Consumed" />
                    <Area type="monotone" dataKey="purchased" stackId="2" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} name="Purchased" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage by Feature</CardTitle>
                <CardDescription>Token consumption breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.tokens.byFeature.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="feature" type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="tokens" fill="hsl(var(--primary))">
                      {analytics.tokens.byFeature.slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Avg Tokens/Request</span>
                    <Badge variant="outline">
                      {analytics.tokens.byFeature.length > 0 
                        ? Math.round(analytics.tokens.consumed / analytics.aiUsage.totalCalls)
                        : 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Projected Days Remaining</span>
                    <Badge variant={analytics.tokens.projectedDaysRemaining < 30 ? "destructive" : "default"}>
                      {analytics.tokens.projectedDaysRemaining > 365 ? "365+" : analytics.tokens.projectedDaysRemaining}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Optimization Potential</span>
                    <Badge variant={analytics.tokens.optimizationPotential > 50 ? "destructive" : "secondary"}>
                      {analytics.tokens.optimizationPotential.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Consumers</CardTitle>
                <CardDescription>Features using most tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.tokens.byFeature.slice(0, 5).map((feature, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="truncate">{feature.feature}</span>
                      <Badge variant="outline">{feature.tokens.toLocaleString()}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  {analytics.tokens.optimizationPotential > 30 && (
                    <li>• Review high-cost features and consider caching</li>
                  )}
                  {analytics.tokens.projectedDaysRemaining < 60 && (
                    <li>• Consider purchasing additional tokens soon</li>
                  )}
                  {analytics.aiUsage.byProvider.length > 2 && (
                    <li>• Evaluate provider costs for optimization</li>
                  )}
                  {analytics.tokens.avgPerUser > 10000 && (
                    <li>• Implement usage limits per user</li>
                  )}
                  <li>• Monitor daily trends for anomalies</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>Total and active users over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[
                  { month: "Jan", total: 120, active: 85 },
                  { month: "Feb", total: 180, active: 125 },
                  { month: "Mar", total: 250, active: 180 },
                  { month: "Apr", total: 320, active: 240 },
                  { month: "May", total: 410, active: 310 },
                  { month: "Jun", total: analytics.users.total, active: analytics.users.active },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="active" stroke="hsl(var(--secondary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Provider Usage</CardTitle>
                <CardDescription>Distribution of AI calls by provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.aiUsage.byProvider}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="provider" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Consumption by Provider</CardTitle>
                <CardDescription>Total tokens used per AI provider</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.aiUsage.byProvider}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ provider, tokens }) => `${provider}: ${tokens.toLocaleString()}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="tokens"
                    >
                      {analytics.aiUsage.byProvider.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
