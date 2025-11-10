import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Github, ExternalLink, Clock, FileCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { logError } from "@/lib/errorTracking";

interface Commit {
  id: string;
  file_path: string;
  commit_message: string;
  commit_url: string;
  created_at: string;
  ai_model_used: string;
  optimized_for_lovable: boolean;
}

export const CommitHistory = () => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommits();
  }, []);

  const fetchCommits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('code_commits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) setCommits(data);
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error fetching commits'), { context: 'fetchCommits' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="glass-panel p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Commits</h3>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted/20 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-panel p-6">
      <div className="flex items-center gap-2 mb-4">
        <Github className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Recent Commits</h3>
        <Badge variant="secondary" className="ml-auto">{commits.length}</Badge>
      </div>

      {commits.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Github className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No commits yet</p>
          <p className="text-sm">Start generating code and committing to GitHub</p>
        </div>
      ) : (
        <div className="space-y-3">
          {commits.map((commit) => (
            <div
              key={commit.id}
              className="p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{commit.commit_message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <FileCode className="w-3 h-3" />
                    <span className="truncate">{commit.file_path}</span>
                  </div>
                </div>
                <a
                  href={commit.commit_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex-shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {commit.ai_model_used}
                </Badge>
                {commit.optimized_for_lovable && (
                  <Badge variant="secondary" className="text-xs">
                    Lovable Optimized
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(commit.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};