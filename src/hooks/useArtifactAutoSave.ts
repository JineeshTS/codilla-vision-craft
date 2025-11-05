import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseArtifactAutoSaveProps {
  artifactId: string | null;
  projectId: string;
  data: any;
  enabled?: boolean;
  intervalMs?: number;
}

export function useArtifactAutoSave({
  artifactId,
  projectId,
  data,
  enabled = true,
  intervalMs = 30000, // 30 seconds default
}: UseArtifactAutoSaveProps) {
  const lastSavedData = useRef<any>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const saveVersion = useCallback(async () => {
    if (!artifactId || !enabled) return;
    
    // Check if data has actually changed
    const currentDataStr = JSON.stringify(data);
    const lastSavedDataStr = JSON.stringify(lastSavedData.current);
    
    if (currentDataStr === lastSavedDataStr) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get next version number
      const { data: versionNum, error: versionError } = await supabase
        .rpc('get_next_version_number', { p_artifact_id: artifactId });

      if (versionError) throw versionError;

      // Create version
      const { error: insertError } = await supabase
        .from("artifact_versions")
        .insert({
          artifact_id: artifactId,
          project_id: projectId,
          version_number: versionNum,
          artifact_data: data,
          created_by: user.id,
          is_auto_save: true,
          change_summary: "Auto-saved",
        });

      if (insertError) throw insertError;

      lastSavedData.current = data;
      
      console.log("Auto-saved version", versionNum);
    } catch (error) {
      console.error("Error auto-saving:", error);
      // Silent fail for auto-save, don't disrupt user
    }
  }, [artifactId, projectId, data, enabled]);

  const createManualVersion = useCallback(async (changeSummary: string) => {
    if (!artifactId) {
      toast({
        title: "Error",
        description: "No artifact selected",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get next version number
      const { data: versionNum, error: versionError } = await supabase
        .rpc('get_next_version_number', { p_artifact_id: artifactId });

      if (versionError) throw versionError;

      // Create version
      const { error: insertError } = await supabase
        .from("artifact_versions")
        .insert({
          artifact_id: artifactId,
          project_id: projectId,
          version_number: versionNum,
          artifact_data: data,
          created_by: user.id,
          is_auto_save: false,
          change_summary: changeSummary,
        });

      if (insertError) throw insertError;

      lastSavedData.current = data;

      toast({
        title: "Version Saved",
        description: `Version ${versionNum} created successfully`,
      });
    } catch (error) {
      console.error("Error creating version:", error);
      toast({
        title: "Error",
        description: "Failed to save version",
        variant: "destructive",
      });
    }
  }, [artifactId, projectId, data, toast]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled || !artifactId) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      saveVersion();
    }, intervalMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [data, enabled, artifactId, intervalMs, saveVersion]);

  return { createManualVersion };
}
