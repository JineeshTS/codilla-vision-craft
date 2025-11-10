import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { logError } from "@/lib/errorTracking";

export default function AdminSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [aiConfig, setAiConfig] = useState({
    provider: 'openai',
    model: 'gpt-4',
    apiKey: '',
  });

  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 587,
    username: '',
    password: '',
    fromName: 'Codilla.ai',
    fromEmail: '',
  });

  const [razorpayConfig, setRazorpayConfig] = useState({
    keyId: '',
    keySecret: '',
    webhookSecret: '',
  });

  const [tokenConfig, setTokenConfig] = useState({
    pricePerK: 0.10,
    topupOptions: '[]',
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role !== 'admin') {
        toast.error("Unauthorized - Admin access required");
        navigate('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadConfigs();
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error checking admin access'), { context: 'checkAdminAccess' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) throw new Error('Failed to load configs');

      const { data } = await response.json();

      // Parse configs
      data.forEach((config: any) => {
        switch (config.config_key) {
          case 'ai_providers':
            setAiConfig({
              provider: config.config_value.primary.provider,
              model: config.config_value.primary.model,
              apiKey: config.config_value.primary.apiKey || '',
            });
            break;
          case 'email_smtp':
            setEmailConfig(config.config_value);
            break;
          case 'razorpay_config':
            setRazorpayConfig(config.config_value);
            break;
          case 'token_base_price':
            setTokenConfig(prev => ({
              ...prev,
              pricePerK: config.config_value.price_per_1k,
            }));
            break;
          case 'token_topup_options':
            setTokenConfig(prev => ({
              ...prev,
              topupOptions: JSON.stringify(config.config_value, null, 2),
            }));
            break;
        }
      });
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading configs'), { context: 'loadConfigs' });
      toast.error("Failed to load configuration");
    }
  };

  const saveConfig = async (configKey: string, configValue: any, configType: string) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            configKey,
            configValue,
            configType,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to save config');

      toast.success("Configuration saved successfully");
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error saving config'), { configKey, configType });
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const saveAIConfig = () => {
    saveConfig(
      'ai_providers',
      {
        primary: {
          provider: aiConfig.provider,
          model: aiConfig.model,
          apiKey: aiConfig.apiKey,
        },
      },
      'ai'
    );
  };

  const saveEmailConfig = () => {
    saveConfig('email_smtp', emailConfig, 'email');
  };

  const saveRazorpayConfig = () => {
    saveConfig('razorpay_config', razorpayConfig, 'payment');
  };

  const saveTokenConfig = () => {
    try {
      const topupOptions = JSON.parse(tokenConfig.topupOptions);
      saveConfig('token_topup_options', topupOptions, 'tokens');
      saveConfig(
        'token_base_price',
        { price_per_1k: tokenConfig.pricePerK, currency: 'INR' },
        'tokens'
      );
    } catch (error) {
      toast.error("Invalid JSON in top-up options");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Settings</h1>
        <p className="text-muted-foreground">Configure your Codilla.ai platform</p>
      </div>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="ai">AI Providers</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="ai">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">AI Provider Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ai-provider">Provider</Label>
                <Input
                  id="ai-provider"
                  value={aiConfig.provider}
                  onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value })}
                  placeholder="openai, anthropic, google"
                />
              </div>
              <div>
                <Label htmlFor="ai-model">Model</Label>
                <Input
                  id="ai-model"
                  value={aiConfig.model}
                  onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                  placeholder="gpt-4, claude-3-5-sonnet-20241022"
                />
              </div>
              <div>
                <Label htmlFor="ai-key">API Key</Label>
                <Input
                  id="ai-key"
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
              </div>
              <Button onClick={saveAIConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save AI Config
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Email Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input
                  id="smtp-host"
                  value={emailConfig.host}
                  onChange={(e) => setEmailConfig({ ...emailConfig, host: e.target.value })}
                  placeholder="smtp.hostinger.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp-port">Port</Label>
                <Input
                  id="smtp-port"
                  type="number"
                  value={emailConfig.port}
                  onChange={(e) => setEmailConfig({ ...emailConfig, port: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  value={emailConfig.username}
                  onChange={(e) => setEmailConfig({ ...emailConfig, username: e.target.value })}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  value={emailConfig.password}
                  onChange={(e) => setEmailConfig({ ...emailConfig, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={emailConfig.fromName}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  value={emailConfig.fromEmail}
                  onChange={(e) => setEmailConfig({ ...emailConfig, fromEmail: e.target.value })}
                />
              </div>
              <Button onClick={saveEmailConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Email Config
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Razorpay Configuration</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="razorpay-key">Key ID</Label>
                <Input
                  id="razorpay-key"
                  value={razorpayConfig.keyId}
                  onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keyId: e.target.value })}
                  placeholder="rzp_test_..."
                />
              </div>
              <div>
                <Label htmlFor="razorpay-secret">Key Secret</Label>
                <Input
                  id="razorpay-secret"
                  type="password"
                  value={razorpayConfig.keySecret}
                  onChange={(e) => setRazorpayConfig({ ...razorpayConfig, keySecret: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="webhook-secret">Webhook Secret</Label>
                <Input
                  id="webhook-secret"
                  type="password"
                  value={razorpayConfig.webhookSecret}
                  onChange={(e) => setRazorpayConfig({ ...razorpayConfig, webhookSecret: e.target.value })}
                />
              </div>
              <Button onClick={saveRazorpayConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Payment Config
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tokens">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Token Pricing</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="price-per-k">Price per 1,000 tokens (INR)</Label>
                <Input
                  id="price-per-k"
                  type="number"
                  step="0.01"
                  value={tokenConfig.pricePerK}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, pricePerK: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="topup-options">Top-up Options (JSON)</Label>
                <Textarea
                  id="topup-options"
                  value={tokenConfig.topupOptions}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, topupOptions: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder='[{"amount":100,"tokens":10000,"bonus":0}]'
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format: [{"{'amount':100,'tokens':10000,'bonus':0}"}]
                </p>
              </div>
              <Button onClick={saveTokenConfig} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Token Config
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
