import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Key, Eye, EyeOff, Copy, Check, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeyConfig {
  enabled?: boolean;
  masked_key?: string;
  last_updated?: string;
  provider?: string;
}

interface ApiKey {
  id: string;
  config_key: string;
  config_value: ApiKeyConfig;
  category: string;
  description: string | null;
  updated_at: string;
}

const providerInfo: Record<string, { name: string; docUrl: string }> = {
  openai: { name: "OpenAI", docUrl: "https://platform.openai.com/api-keys" },
  anthropic: { name: "Anthropic", docUrl: "https://console.anthropic.com/settings/keys" },
  google: { name: "Google AI", docUrl: "https://makersuite.google.com/app/apikey" },
  razorpay: { name: "Razorpay", docUrl: "https://dashboard.razorpay.com/app/keys" },
  github: { name: "GitHub", docUrl: "https://github.com/settings/tokens" },
};

const AdminApiKeys = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider: "",
    key_name: "",
    key_value: "",
    description: "",
    enabled: true,
  });

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_config")
        .select("*")
        .eq("category", "api_keys")
        .order("config_key", { ascending: true });
      if (error) throw error;
      // Cast through unknown to handle JSON type
      return (data || []).map(item => ({
        ...item,
        config_value: (item.config_value || {}) as ApiKeyConfig
      })) as ApiKey[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: user } = await supabase.auth.getUser();
      const maskedKey = data.key_value.slice(0, 4) + "****" + data.key_value.slice(-4);
      
      const { error } = await supabase.from("system_config").insert({
        config_key: data.key_name,
        config_value: {
          enabled: data.enabled,
          masked_key: maskedKey,
          provider: data.provider,
          last_updated: new Date().toISOString(),
        },
        category: "api_keys",
        description: data.description,
        updated_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast({ title: "API key configuration saved" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to save API key", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { data: user } = await supabase.auth.getUser();
      const updateData: any = {
        description: data.description,
        updated_by: user.user?.id,
      };
      
      // Only update the masked key if a new value was provided
      if (data.key_value) {
        const maskedKey = data.key_value.slice(0, 4) + "****" + data.key_value.slice(-4);
        updateData.config_value = {
          enabled: data.enabled,
          masked_key: maskedKey,
          provider: data.provider,
          last_updated: new Date().toISOString(),
        };
      } else {
        // Just update the enabled status
        const { data: existing } = await supabase
          .from("system_config")
          .select("config_value")
          .eq("id", id)
          .single();
        
        if (existing) {
          const configValue = existing.config_value as any;
          updateData.config_value = {
            ...configValue,
            enabled: data.enabled,
            last_updated: new Date().toISOString(),
          };
        }
      }
      
      const { error } = await supabase.from("system_config").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast({ title: "API key updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to update API key", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Note: Deleting from system_config is restricted, so we'll disable instead
      const { error } = await supabase
        .from("system_config")
        .update({ 
          config_value: { enabled: false, masked_key: "DELETED", last_updated: new Date().toISOString() }
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
      toast({ title: "API key removed" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to remove API key", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      provider: "",
      key_name: "",
      key_value: "",
      description: "",
      enabled: true,
    });
    setEditingKey(null);
  };

  const handleEdit = (apiKey: ApiKey) => {
    const config = apiKey.config_value;
    setEditingKey(apiKey);
    setFormData({
      provider: config.provider || "",
      key_name: apiKey.config_key,
      key_value: "", // Don't show the actual key
      description: apiKey.description || "",
      enabled: config.enabled ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!editingKey && !formData.key_name) {
      toast({ variant: "destructive", title: "Key name is required" });
      return;
    }
    
    if (editingKey) {
      updateMutation.mutate({ id: editingKey.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const activeKeys = apiKeys?.filter(k => (k.config_value as any)?.masked_key !== "DELETED") || [];

  return (
    <>
      <SEOHead title="API Keys | Admin | Codilla.ai" description="Manage API keys and integrations" />
      <AdminLayout title="API Key Management" description="Configure and manage API keys for third-party integrations">
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            API keys are stored securely in Supabase Edge Function secrets. This page manages the configuration metadata only. 
            To update actual secret values, use the <a href="https://supabase.com/dashboard/project/numyfjzmrtvzclgyfkpx/settings/functions" target="_blank" rel="noopener noreferrer" className="underline text-primary">Supabase Dashboard</a>.
          </AlertDescription>
        </Alert>

        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add API Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingKey ? "Edit API Key" : "Add API Key"}</DialogTitle>
                <DialogDescription>
                  {editingKey ? "Update the API key configuration" : "Add a new API key configuration"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Provider</Label>
                  <Input
                    value={formData.provider}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                    placeholder="e.g., openai, anthropic, google"
                  />
                </div>
                <div>
                  <Label>Key Name (Environment Variable)</Label>
                  <Input
                    value={formData.key_name}
                    onChange={(e) => setFormData({ ...formData, key_name: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                    placeholder="e.g., OPENAI_API_KEY"
                    disabled={!!editingKey}
                  />
                </div>
                <div>
                  <Label>{editingKey ? "New Key Value (leave empty to keep current)" : "Key Value"}</Label>
                  <div className="relative">
                    <Input
                      type={showKey === "form" ? "text" : "password"}
                      value={formData.key_value}
                      onChange={(e) => setFormData({ ...formData, key_value: e.target.value })}
                      placeholder={editingKey ? "Enter new value to update" : "sk-..."}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowKey(showKey === "form" ? null : "form")}
                    >
                      {showKey === "form" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="What this key is used for"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(v) => setFormData({ ...formData, enabled: v })}
                  />
                  <Label>Enabled</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingKey ? "Update" : "Add"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(providerInfo).map(([key, info]) => (
            <Card key={key} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <a href={info.docUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-center gap-2">
                  <Key className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{info.name}</span>
                  <span className="text-xs text-muted-foreground">Get API Key →</span>
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configured API Keys</CardTitle>
            <CardDescription>API keys and their current status</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeKeys.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API keys configured</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key Name</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Masked Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeKeys.map((apiKey) => {
                    const config = apiKey.config_value;
                    return (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-mono text-sm">{apiKey.config_key}</TableCell>
                        <TableCell className="capitalize">{config.provider || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{config.masked_key}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(apiKey.config_key, apiKey.id)}
                            >
                              {copied === apiKey.id ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.enabled ? "default" : "secondary"}>
                            {config.enabled ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {config.last_updated ? format(new Date(config.last_updated), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(apiKey)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirm("Remove this API key?") && deleteMutation.mutate(apiKey.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AdminLayout>
    </>
  );
};

export default AdminApiKeys;
