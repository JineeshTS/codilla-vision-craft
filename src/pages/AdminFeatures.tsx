import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Flag, Zap, Bell, CreditCard, Settings, Link2 } from "lucide-react";
import { toast } from "sonner";

interface FeatureFlag {
  id: string;
  flag_key: string;
  name: string;
  description: string | null;
  is_enabled: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  ai: Zap,
  integrations: Link2,
  billing: CreditCard,
  notifications: Bell,
  system: Settings,
  general: Flag,
};

const categoryColors: Record<string, string> = {
  ai: "bg-purple-500/10 text-purple-500",
  integrations: "bg-blue-500/10 text-blue-500",
  billing: "bg-green-500/10 text-green-500",
  notifications: "bg-yellow-500/10 text-yellow-500",
  system: "bg-red-500/10 text-red-500",
  general: "bg-gray-500/10 text-gray-500",
};

const AdminFeatures = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [formData, setFormData] = useState({
    flag_key: "",
    name: "",
    description: "",
    category: "general",
    is_enabled: false,
  });

  const { data: flags, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data as FeatureFlag[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_flags")
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Feature flag updated");
    },
    onError: () => {
      toast.error("Failed to update feature flag");
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("feature_flags")
          .update({
            flag_key: data.flag_key,
            name: data.name,
            description: data.description || null,
            category: data.category,
            is_enabled: data.is_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("feature_flags")
          .insert({
            flag_key: data.flag_key,
            name: data.name,
            description: data.description || null,
            category: data.category,
            is_enabled: data.is_enabled,
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success(editingFlag ? "Feature flag updated" : "Feature flag created");
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error("Failed to save feature flag");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feature_flags")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Feature flag deleted");
      setDeleteDialogOpen(false);
      setEditingFlag(null);
    },
    onError: () => {
      toast.error("Failed to delete feature flag");
    },
  });

  const resetForm = () => {
    setEditingFlag(null);
    setFormData({
      flag_key: "",
      name: "",
      description: "",
      category: "general",
      is_enabled: false,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setFormData({
      flag_key: flag.flag_key,
      name: flag.name,
      description: flag.description || "",
      category: flag.category,
      is_enabled: flag.is_enabled,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.flag_key || !formData.name) {
      toast.error("Flag key and name are required");
      return;
    }
    saveMutation.mutate({ ...formData, id: editingFlag?.id });
  };

  // Group flags by category
  const groupedFlags = flags?.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>) || {};

  return (
    <AdminLayout title="Feature Flags" description="Enable or disable platform features">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Feature Flag
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFlags).map(([category, categoryFlags]) => {
              const IconComponent = categoryIcons[category] || Flag;
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <IconComponent className="h-5 w-5" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {categoryFlags.length} feature{categoryFlags.length !== 1 ? "s" : ""} in this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {categoryFlags.map((flag) => (
                        <div
                          key={flag.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{flag.name}</span>
                              <Badge variant="outline" className="font-mono text-xs">
                                {flag.flag_key}
                              </Badge>
                              <Badge className={categoryColors[flag.category]}>
                                {flag.is_enabled ? "Enabled" : "Disabled"}
                              </Badge>
                            </div>
                            {flag.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {flag.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={flag.is_enabled}
                              onCheckedChange={(checked) =>
                                toggleMutation.mutate({ id: flag.id, is_enabled: checked })
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(flag)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => {
                                setEditingFlag(flag);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingFlag ? "Edit Feature Flag" : "Create Feature Flag"}
            </DialogTitle>
            <DialogDescription>
              {editingFlag
                ? "Update the feature flag settings."
                : "Add a new feature flag to control platform functionality."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag_key">Flag Key</Label>
              <Input
                id="flag_key"
                placeholder="e.g., new_feature"
                value={formData.flag_key}
                onChange={(e) =>
                  setFormData({ ...formData, flag_key: e.target.value.toLowerCase().replace(/\s+/g, "_") })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., New Feature"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What does this feature flag control?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="integrations">Integrations</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="notifications">Notifications</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_enabled"
                checked={formData.is_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
              />
              <Label htmlFor="is_enabled">Enabled by default</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingFlag ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Feature Flag</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{editingFlag?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingFlag && deleteMutation.mutate(editingFlag.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFeatures;
