import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Check, X, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { logError } from "@/lib/errorTracking";
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
import { Textarea } from "@/components/ui/textarea";

interface ModerationIdea {
  id: string;
  title: string;
  description: string;
  status: string;
  moderation_status: string;
  created_at: string;
  user_id: string;
  moderated_at: string | null;
}

export default function AdminIdeaModeration() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<ModerationIdea[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [moderationAction, setModerationAction] = useState<{
    idea: ModerationIdea;
    action: 'approve' | 'reject';
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadIdeas();
    }
  }, [isAdmin, activeTab]);

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
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error checking admin access'), { context: 'checkAdminAccess' });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadIdeas = async () => {
    const { data, error } = await supabase
      .from('ideas')
      .select('id, title, description, status, moderation_status, created_at, user_id, moderated_at')
      .eq('moderation_status', activeTab)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      logError(error, { context: 'loadIdeas' });
      return;
    }
    setIdeas(data || []);
  };

  const handleModeration = async () => {
    if (!moderationAction) return;

    const { idea, action } = moderationAction;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('ideas')
        .update({
          moderation_status: newStatus,
          moderated_at: new Date().toISOString(),
          moderated_by: user?.id,
        })
        .eq('id', idea.id);

      if (error) throw error;

      // Get user email to send notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', idea.user_id)
        .single();

      // Send in-app notification
      const notificationTitle = action === 'approve' 
        ? 'Your idea has been approved!' 
        : 'Update on your idea submission';
      const notificationMessage = action === 'approve'
        ? `Great news! Your idea "${idea.title}" has been approved and is ready for the next steps.`
        : `Your idea "${idea.title}" was not approved.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

      await supabase.from('notifications').insert({
        user_id: idea.user_id,
        title: notificationTitle,
        message: notificationMessage,
        type: action === 'approve' ? 'success' : 'warning',
        action_url: `/ideas/${idea.id}`,
        metadata: { idea_id: idea.id, moderation_action: action },
      });

      // Send email notification
      if (userProfile?.email) {
        const templateKey = action === 'approve' ? 'idea_approved' : 'idea_rejected';
        const appUrl = window.location.origin;
        
        await supabase.from('email_queue').insert({
          to_email: userProfile.email,
          template_key: templateKey,
          template_data: {
            idea_title: idea.title,
            idea_id: idea.id,
            app_url: appUrl,
            rejection_reason: action === 'reject' ? rejectionReason : undefined,
          },
        });
      }

      toast.success(`Idea ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setIdeas(ideas.filter(i => i.id !== idea.id));
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error moderating idea'), { context: 'handleModeration' });
      toast.error("Failed to moderate idea");
    } finally {
      setModerationAction(null);
      setRejectionReason("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModerationStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  const pendingCount = ideas.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/admin')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold mb-2">Idea Moderation</h1>
        <p className="text-muted-foreground">Review and approve user-submitted ideas before they go live</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Idea</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  {activeTab !== 'pending' && <TableHead>Moderated</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab !== 'pending' ? 5 : 4} className="text-center py-8 text-muted-foreground">
                      No {activeTab} ideas found
                    </TableCell>
                  </TableRow>
                ) : (
                  ideas.map((idea) => (
                    <TableRow key={idea.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{idea.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {idea.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getModerationStatusBadge(idea.moderation_status)}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(idea.created_at)}</TableCell>
                      {activeTab !== 'pending' && (
                        <TableCell className="text-sm">
                          {idea.moderated_at ? formatDate(idea.moderated_at) : '-'}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/ideas/${idea.id}`)}
                            title="View idea"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {activeTab === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setModerationAction({ idea, action: 'approve' })}
                                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                title="Approve"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setModerationAction({ idea, action: 'reject' })}
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                title="Reject"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!moderationAction} onOpenChange={() => setModerationAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {moderationAction?.action === 'approve' ? 'Approve' : 'Reject'} this idea?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {moderationAction?.action === 'approve' 
                    ? 'This idea will become visible and the user can proceed with validation.' 
                    : 'This idea will be rejected and the user will be notified.'}
                </p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{moderationAction?.idea.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{moderationAction?.idea.description}</p>
                </div>
                {moderationAction?.action === 'reject' && (
                  <div>
                    <label className="text-sm font-medium">Rejection reason (optional)</label>
                    <Textarea
                      placeholder="Provide feedback for the user..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleModeration}
              className={moderationAction?.action === 'approve' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-destructive hover:bg-destructive/90'}
            >
              {moderationAction?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
