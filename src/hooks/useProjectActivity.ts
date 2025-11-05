// @ts-nocheck
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ActivityItem {
  id: string;
  type: 'ai_request' | 'code_commit' | 'phase_complete' | 'artifact_version';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

async function fetchActivities(projectId: string): Promise<ActivityItem[]> {
  const activities: ActivityItem[] = [];

  try {
    // Fetch AI requests
    const aiRequestsQuery: any = await supabase
      .from('ai_requests')
      .select('id, request_type, success, created_at, ai_agent, tokens_used, error_message')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (aiRequestsQuery.data) {
      aiRequestsQuery.data.forEach((req: any) => {
        activities.push({
          id: req.id,
          type: 'ai_request',
          title: `AI ${req.request_type}`,
          description: req.success ? 'Completed successfully' : 'Failed',
          timestamp: req.created_at || '',
          metadata: {
            ai_agent: req.ai_agent,
            tokens_used: req.tokens_used,
            error: req.error_message
          }
        });
      });
    }

    // Fetch code commits
    const commitsQuery: any = await supabase
      .from('code_commits')
      .select('id, commit_message, created_at, commit_sha, commit_url, file_path')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (commitsQuery.data) {
      commitsQuery.data.forEach((commit: any) => {
        activities.push({
          id: commit.id,
          type: 'code_commit',
          title: 'Code Committed',
          description: commit.commit_message || 'No message',
          timestamp: commit.created_at || '',
          metadata: {
            commit_sha: commit.commit_sha,
            commit_url: commit.commit_url,
            file_path: commit.file_path
          }
        });
      });
    }

    // Fetch phase progress
    const phasesQuery: any = await supabase
      .from('phase_progress')
      .select('id, phase_number, phase_name, completed_at, tokens_used, progress')
      .eq('project_id', projectId)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (phasesQuery.data) {
      phasesQuery.data.forEach((phase: any) => {
        if (phase.completed_at) {
          activities.push({
            id: phase.id,
            type: 'phase_complete',
            title: `Phase ${phase.phase_number} Completed`,
            description: phase.phase_name,
            timestamp: phase.completed_at,
            metadata: {
              tokens_used: phase.tokens_used,
              progress: phase.progress
            }
          });
        }
      });
    }

    // Fetch artifact versions
    const versionsQuery: any = await supabase
      .from('artifact_versions')
      .select('id, version_number, change_summary, created_at, artifact_id, is_auto_save')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (versionsQuery.data) {
      versionsQuery.data.forEach((version: any) => {
        activities.push({
          id: version.id,
          type: 'artifact_version',
          title: `Version ${version.version_number} Created`,
          description: version.change_summary || 'New version saved',
          timestamp: version.created_at,
          metadata: {
            artifact_id: version.artifact_id,
            is_auto_save: version.is_auto_save
          }
        });
      });
    }
  } catch (error) {
    console.error('Error fetching project activity:', error);
  }

  // Sort all activities by timestamp
  return activities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export const useProjectActivity = (projectId: string | undefined) => {
  return useQuery({
    queryKey: ['project-activity', projectId],
    queryFn: () => fetchActivities(projectId!),
    enabled: !!projectId,
  });
};
