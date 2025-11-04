import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Github, Link, Unlink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GitHubConnectorProps {
  isConnected: boolean;
  username?: string;
  onConnectionChange?: () => void;
}

export const GitHubConnector = ({ isConnected, username, onConnectionChange }: GitHubConnectorProps) => {
  const [githubToken, setGithubToken] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleConnect = async () => {
    if (!githubToken.trim()) {
      toast.error("Please enter a GitHub token");
      return;
    }

    setIsConnecting(true);
    try {
      // Verify the token by fetching user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!userResponse.ok) {
        throw new Error('Invalid GitHub token');
      }

      const userData = await userResponse.json();

      // Save to profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          github_token: githubToken,
          github_username: userData.login,
          github_avatar_url: userData.avatar_url,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`Connected to GitHub as @${userData.login}`);
      setGithubToken("");
      setOpen(false);
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect GitHub');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          github_token: null,
          github_username: null,
          github_avatar_url: null,
          selected_github_repo: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('GitHub disconnected');
      onConnectionChange?.();
    } catch (error: any) {
      toast.error(error.message || 'Failed to disconnect GitHub');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isConnected) {
    return (
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Connected to GitHub</p>
              <p className="text-xs text-muted-foreground">@{username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
          >
            <Unlink className="h-4 w-4 mr-2" />
            {isDisconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Github className="h-4 w-4 mr-2" />
          Connect GitHub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect GitHub</DialogTitle>
          <DialogDescription>
            Enter your GitHub Personal Access Token to enable repository integration.
            <a
              href="https://github.com/settings/tokens/new?scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline block mt-2"
            >
              Create a token here →
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="github-token">Personal Access Token</Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={(e) => setGithubToken(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Required scopes: <code className="bg-muted px-1 py-0.5 rounded">repo</code>
            </p>
          </div>

          <Button
            onClick={handleConnect}
            disabled={isConnecting || !githubToken.trim()}
            className="w-full"
          >
            <Link className="h-4 w-4 mr-2" />
            {isConnecting ? "Connecting..." : "Connect"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};