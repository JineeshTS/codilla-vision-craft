import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Eye, Mail, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/errorTracking";

interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject: string;
  html_body: string;
  text_body: string | null;
  created_at: string;
  updated_at: string;
}

interface QueuedEmail {
  id: string;
  to_email: string;
  template_key: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error_message: string | null;
}

export default function AdminEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [emailQueue, setEmailQueue] = useState<QueuedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Template dialog
  const [templateDialog, setTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    template_key: "",
    name: "",
    subject: "",
    html_body: "",
    text_body: "",
  });
  
  // Preview dialog
  const [previewDialog, setPreviewDialog] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<EmailTemplate | null>(null);

  // Queue stats
  const [queueStats, setQueueStats] = useState({ pending: 0, sent: 0, failed: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTemplates(), loadEmailQueue(), loadQueueStats()]);
    setLoading(false);
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("name");

    if (error) {
      logError(error, { context: "loadTemplates" });
      toast.error("Failed to load templates");
      return;
    }
    setTemplates(data || []);
  };

  const loadEmailQueue = async () => {
    const { data, error } = await supabase
      .from("email_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logError(error, { context: "loadEmailQueue" });
      return;
    }
    setEmailQueue(data || []);
  };

  const loadQueueStats = async () => {
    const { data: pending } = await supabase
      .from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { data: sent } = await supabase
      .from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "sent");

    const { data: failed } = await supabase
      .from("email_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed");

    setQueueStats({
      pending: (pending as any)?.length || 0,
      sent: (sent as any)?.length || 0,
      failed: (failed as any)?.length || 0,
    });
  };

  const openTemplateDialog = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        template_key: template.template_key,
        name: template.name,
        subject: template.subject,
        html_body: template.html_body,
        text_body: template.text_body || "",
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({
        template_key: "",
        name: "",
        subject: "",
        html_body: "",
        text_body: "",
      });
    }
    setTemplateDialog(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.template_key || !templateForm.name || !templateForm.subject || !templateForm.html_body) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("email_templates")
          .update({
            template_key: templateForm.template_key,
            name: templateForm.name,
            subject: templateForm.subject,
            html_body: templateForm.html_body,
            text_body: templateForm.text_body || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated");
      } else {
        const { error } = await supabase.from("email_templates").insert({
          template_key: templateForm.template_key,
          name: templateForm.name,
          subject: templateForm.subject,
          html_body: templateForm.html_body,
          text_body: templateForm.text_body || null,
        });

        if (error) throw error;
        toast.success("Template created");
      }

      setTemplateDialog(false);
      loadTemplates();
    } catch (error) {
      logError(error instanceof Error ? error : new Error("Save template error"), { context: "saveTemplate" });
      toast.error("Failed to save template");
    }
  };

  const deleteTemplate = async () => {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from("email_templates")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) throw error;
      toast.success("Template deleted");
      setTemplates(templates.filter((t) => t.id !== deleteTarget.id));
    } catch (error) {
      logError(error instanceof Error ? error : new Error("Delete template error"), { context: "deleteTemplate" });
      toast.error("Failed to delete template");
    } finally {
      setDeleteTarget(null);
    }
  };

  const processEmailQueue = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("process-email-queue");

      if (error) throw error;

      toast.success(`Processed ${data.processed} emails (${data.success} sent, ${data.failed} failed)`);
      loadEmailQueue();
      loadQueueStats();
    } catch (error) {
      logError(error instanceof Error ? error : new Error("Process queue error"), { context: "processEmailQueue" });
      toast.error("Failed to process email queue");
    } finally {
      setProcessing(false);
    }
  };

  const retryFailedEmail = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from("email_queue")
        .update({ status: "pending", error_message: null })
        .eq("id", emailId);

      if (error) throw error;
      toast.success("Email queued for retry");
      loadEmailQueue();
      loadQueueStats();
    } catch (error) {
      toast.error("Failed to retry email");
    }
  };

  const deleteQueuedEmail = async (emailId: string) => {
    try {
      const { error } = await supabase.from("email_queue").delete().eq("id", emailId);

      if (error) throw error;
      setEmailQueue(emailQueue.filter((e) => e.id !== emailId));
      loadQueueStats();
      toast.success("Email removed from queue");
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Sent</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout title="Email Templates" description="Manage email templates and queue">
      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{queueStats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{queueStats.sent}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{queueStats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Section */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Templates
          </CardTitle>
          <Button onClick={() => openTemplateDialog()} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No templates found
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs">{template.template_key}</code>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{template.subject}</TableCell>
                    <TableCell>{formatDate(template.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPreviewHtml(template.html_body);
                            setPreviewDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openTemplateDialog(template)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(template)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Email Queue Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Email Queue
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadEmailQueue}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={processEmailQueue} disabled={processing || queueStats.pending === 0}>
              {processing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Process Queue ({queueStats.pending})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {emailQueue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No emails in queue
                  </TableCell>
                </TableRow>
              ) : (
                emailQueue.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell className="font-medium">{email.to_email}</TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-muted rounded text-xs">{email.template_key}</code>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(email.status)}
                      {email.error_message && (
                        <p className="text-xs text-destructive mt-1 max-w-xs truncate" title={email.error_message}>
                          {email.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(email.created_at)}</TableCell>
                    <TableCell>{email.sent_at ? formatDate(email.sent_at) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {email.status === "failed" && (
                          <Button variant="ghost" size="icon" onClick={() => retryFailedEmail(email.id)}>
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => deleteQueuedEmail(email.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Edit Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              Use {"{{variable}}"} syntax for dynamic content (e.g., {"{{name}}"}, {"{{email}}"})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template_key">Template Key *</Label>
                <Input
                  id="template_key"
                  value={templateForm.template_key}
                  onChange={(e) => setTemplateForm({ ...templateForm, template_key: e.target.value })}
                  placeholder="welcome_email"
                  disabled={!!editingTemplate}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Welcome Email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Welcome to Our Platform, {{name}}!"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="html_body">HTML Body *</Label>
              <Textarea
                id="html_body"
                value={templateForm.html_body}
                onChange={(e) => setTemplateForm({ ...templateForm, html_body: e.target.value })}
                placeholder="<h1>Welcome, {{name}}!</h1><p>Thanks for joining...</p>"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="text_body">Plain Text Body (optional)</Label>
              <Textarea
                id="text_body"
                value={templateForm.text_body}
                onChange={(e) => setTemplateForm({ ...templateForm, text_body: e.target.value })}
                placeholder="Welcome, {{name}}! Thanks for joining..."
                rows={4}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate}>
              {editingTemplate ? "Update" : "Create"} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg p-4 bg-white overflow-auto max-h-[60vh]">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{deleteTarget?.name}" template. Emails using this template will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteTemplate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
