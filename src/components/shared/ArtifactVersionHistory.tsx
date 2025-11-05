import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, RotateCcw, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

interface Version {
  id: string;
  version_number: number;
  artifact_data: any;
  created_at: string;
  change_summary: string | null;
  is_auto_save: boolean;
}

interface ArtifactVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  artifactId: string;
  currentData: any;
  onRestore: (versionData: any) => void;
}

export default function ArtifactVersionHistory({
  open,
  onOpenChange,
  artifactId,
  currentData,
  onRestore,
}: ArtifactVersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && artifactId) {
      loadVersions();
    }
  }, [open, artifactId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("artifact_versions")
        .select("*")
        .eq("artifact_id", artifactId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error("Error loading versions:", error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (version: Version) => {
    try {
      onRestore(version.artifact_data);
      onOpenChange(false);
      
      toast({
        title: "Version Restored",
        description: `Restored to version ${version.version_number}`,
      });
    } catch (error) {
      console.error("Error restoring version:", error);
      toast({
        title: "Error",
        description: "Failed to restore version",
        variant: "destructive",
      });
    }
  };

  const compareData = (oldData: any, newData: any): string => {
    const changes: string[] = [];
    const oldKeys = Object.keys(oldData || {});
    const newKeys = Object.keys(newData || {});
    
    const allKeys = new Set([...oldKeys, ...newKeys]);
    allKeys.forEach(key => {
      if (JSON.stringify(oldData?.[key]) !== JSON.stringify(newData?.[key])) {
        changes.push(key);
      }
    });
    
    return changes.length > 0 ? `Modified: ${changes.join(", ")}` : "No changes detected";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Version History
          </DialogTitle>
          <DialogDescription>
            View and restore previous versions of this artifact
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : versions.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No version history available yet. Versions are automatically saved as you make changes.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium mb-3">Versions</h3>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            v{version.version_number}
                          </Badge>
                          {version.is_auto_save && (
                            <Badge variant="secondary" className="text-xs">
                              <Save className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {formatDistanceToNow(new Date(version.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {version.change_summary && (
                        <p className="text-xs text-muted-foreground truncate">
                          {version.change_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Preview</h3>
              {selectedVersion ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[300px] rounded-lg border p-4">
                    <pre className="text-xs">
                      {JSON.stringify(selectedVersion.artifact_data, null, 2)}
                    </pre>
                  </ScrollArea>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {compareData(selectedVersion.artifact_data, currentData)}
                    </p>
                    
                    <Button
                      onClick={() => handleRestore(selectedVersion)}
                      className="w-full"
                      disabled={versions[0]?.id === selectedVersion.id}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore This Version
                    </Button>
                    
                    {versions[0]?.id === selectedVersion.id && (
                      <p className="text-xs text-center text-muted-foreground">
                        This is the current version
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-[300px] border rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Select a version to preview
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
