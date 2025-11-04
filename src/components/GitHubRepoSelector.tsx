import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Github, Check, ExternalLink } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
}

export const GitHubRepoSelector = () => {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadGitHubData();
  }, []);

  const loadGitHubData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile with GitHub info
      const { data: profile } = await supabase
        .from('profiles')
        .select('github_username, selected_github_repo')
        .eq('id', user.id)
        .single();

      if (profile?.github_username) {
        setGithubUsername(profile.github_username);
        setSelectedRepo(profile.selected_github_repo || "");
        
        // Fetch repositories if connected
        await fetchGitHubRepos();
      }
    } catch (error) {
      console.error('Error loading GitHub data:', error);
    }
  };

  const fetchGitHubRepos = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.provider_token) {
        toast.error("GitHub not connected. Please sign in with GitHub.");
        return;
      }

      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          Authorization: `Bearer ${session.provider_token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data = await response.json();
      setRepos(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveRepo = async () => {
    if (!selectedRepo) {
      toast.error("Please select a repository");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('profiles')
        .update({ selected_github_repo: selectedRepo })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Repository saved successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!githubUsername) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Github className="h-8 w-8" />
          <div>
            <h3 className="font-semibold">Connect GitHub</h3>
            <p className="text-sm text-muted-foreground">
              Sign in with GitHub to enable repository integration
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">GitHub Repository</h3>
              <p className="text-sm text-muted-foreground">
                Connected as @{githubUsername}
              </p>
            </div>
          </div>
          {selectedRepo && (
            <a
              href={repos.find(r => r.full_name === selectedRepo)?.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Repo <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={selectedRepo} onValueChange={setSelectedRepo}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a repository" />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <SelectItem value="loading" disabled>
                  Loading repositories...
                </SelectItem>
              ) : repos.length === 0 ? (
                <SelectItem value="none" disabled>
                  No repositories found
                </SelectItem>
              ) : (
                repos.map((repo) => (
                  <SelectItem key={repo.id} value={repo.full_name}>
                    {repo.name} {repo.private && "(Private)"}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <Button
            onClick={handleSaveRepo}
            disabled={!selectedRepo || isSaving}
            size="sm"
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>

        {!isLoading && repos.length === 0 && (
          <Button
            onClick={fetchGitHubRepos}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Refresh Repositories
          </Button>
        )}
      </div>
    </Card>
  );
};
