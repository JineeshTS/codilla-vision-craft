import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { SEOHead } from "@/components/shared/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash2, Bell, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  is_active: boolean;
  target_audience: string;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
  created_at: string;
}

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
};

const typeColors: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  success: "bg-green-500/20 text-green-400 border-green-500/30",
};

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "info",
    target_audience: "all",
    is_active: true,
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: "",
  });

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from("announcements").insert({
        title: data.title,
        content: data.content,
        type: data.type,
        target_audience: data.target_audience,
        is_active: data.is_active,
        starts_at: data.starts_at,
        ends_at: data.ends_at || null,
        created_by: user.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Announcement created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to create announcement", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("announcements").update({
        title: data.title,
        content: data.content,
        type: data.type,
        target_audience: data.target_audience,
        is_active: data.is_active,
        starts_at: data.starts_at,
        ends_at: data.ends_at || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Announcement updated successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to update announcement", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
      toast({ title: "Announcement deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Failed to delete announcement", description: error.message });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "info",
      target_audience: "all",
      is_active: true,
      starts_at: new Date().toISOString().slice(0, 16),
      ends_at: "",
    });
    setEditingAnnouncement(null);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      target_audience: announcement.target_audience,
      is_active: announcement.is_active,
      starts_at: announcement.starts_at.slice(0, 16),
      ends_at: announcement.ends_at?.slice(0, 16) || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <>
      <SEOHead title="Announcements | Admin | Codilla.ai" description="Manage platform announcements" />
      <AdminLayout title="Announcements" description="Create and manage platform-wide announcements">
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAnnouncement ? "Edit Announcement" : "Create Announcement"}</DialogTitle>
                <DialogDescription>
                  {editingAnnouncement ? "Update the announcement details" : "Create a new platform announcement"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                  />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Announcement content"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Audience</Label>
                    <Select value={formData.target_audience} onValueChange={(v) => setFormData({ ...formData, target_audience: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="free">Free Users</SelectItem>
                        <SelectItem value="paid">Paid Users</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ends At (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <Label>Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAnnouncement ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : announcements?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No announcements yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {announcements?.map((announcement) => {
                    const TypeIcon = typeIcons[announcement.type] || Info;
                    return (
                      <TableRow key={announcement.id}>
                        <TableCell className="font-medium">{announcement.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={typeColors[announcement.type]}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {announcement.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{announcement.target_audience}</TableCell>
                        <TableCell>
                          <Badge variant={announcement.is_active ? "default" : "secondary"}>
                            {announcement.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(announcement.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(announcement)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirm("Delete this announcement?") && deleteMutation.mutate(announcement.id)}
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

export default AdminAnnouncements;