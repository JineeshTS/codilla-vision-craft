import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Lightbulb, FolderKanban, Eye, Trash2 } from "lucide-react";
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

interface Idea {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  user_id: string;
}

interface Project {
  id: string;
  name: string;
  current_phase: number;
  created_at: string;
  user_id: string;
}

export default function AdminContent() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'idea' | 'project'; id: string } | null>(null);

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
      await Promise.all([loadIdeas(), loadProjects()]);
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
      .select('id, title, description, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logError(error, { context: 'loadIdeas' });
      return;
    }
    setIdeas(data || []);
  };

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, current_phase, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logError(error, { context: 'loadProjects' });
      return;
    }
    setProjects(data || []);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      const table = deleteTarget.type === 'idea' ? 'ideas' : 'projects';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast.success(`${deleteTarget.type === 'idea' ? 'Idea' : 'Project'} deleted`);
      
      if (deleteTarget.type === 'idea') {
        setIdeas(ideas.filter(i => i.id !== deleteTarget.id));
      } else {
        setProjects(projects.filter(p => p.id !== deleteTarget.id));
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error deleting content'), { context: 'handleDelete' });
      toast.error("Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'default';
      case 'in_development': return 'default';
      case 'completed': return 'default';
      case 'draft': return 'secondary';
      default: return 'outline';
    }
  };

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
        <h1 className="text-3xl font-bold mb-2">Content Management</h1>
        <p className="text-muted-foreground">View and moderate platform content</p>
      </div>

      <Tabs defaultValue="ideas">
        <TabsList className="mb-6">
          <TabsTrigger value="ideas" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Ideas ({ideas.length})
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects ({projects.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ideas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No ideas found
                    </TableCell>
                  </TableRow>
                ) : (
                  ideas.map((idea) => (
                    <TableRow key={idea.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{idea.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {idea.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(idea.status)}>
                          {idea.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(idea.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/ideas/${idea.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: 'idea', id: idea.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Phase {project.current_phase}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(project.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/projects/${project.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: 'project', id: project.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {deleteTarget?.type} and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
