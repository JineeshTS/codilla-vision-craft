import { supabase } from "@/integrations/supabase/client";
import { PHASE_STRUCTURES } from "@/config/phaseStructure";

export interface PhaseProgress {
  id: string;
  project_id: string;
  phase_number: number;
  completed_tasks: string[];
  task_outputs: Record<string, any>;
  progress: number;
  status: string;
}

/**
 * Check if all required tasks in a phase are completed
 */
export const areAllTasksCompleted = (
  phaseNumber: number,
  completedTasks: string[]
): boolean => {
  const phase = PHASE_STRUCTURES.find(p => p.phaseNumber === phaseNumber);
  if (!phase) return false;

  const requiredTaskIds = phase.tasks.map(t => t.id);
  return requiredTaskIds.every(taskId => completedTasks.includes(taskId));
};

/**
 * Calculate phase completion percentage
 */
export const calculatePhaseProgress = (
  phaseNumber: number,
  completedTasks: string[]
): number => {
  const phase = PHASE_STRUCTURES.find(p => p.phaseNumber === phaseNumber);
  if (!phase || phase.tasks.length === 0) return 0;

  const completedCount = completedTasks.filter(taskId => 
    phase.tasks.some(t => t.id === taskId)
  ).length;

  return Math.round((completedCount / phase.tasks.length) * 100);
};

/**
 * Mark a phase as completed and update project progress
 */
export const completePhase = async (
  projectId: string,
  phaseNumber: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Update phase_progress
    const { error: progressError } = await supabase
      .from("phase_progress")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        progress: 100,
      })
      .eq("project_id", projectId)
      .eq("phase_number", phaseNumber);

    if (progressError) throw progressError;

    // Update project current_phase and progress_percentage
    const totalPhases = PHASE_STRUCTURES.length;
    const progressPercentage = Math.round((phaseNumber / totalPhases) * 100);

    const { error: projectError } = await supabase
      .from("projects")
      .update({
        current_phase: phaseNumber + 1 <= totalPhases ? phaseNumber + 1 : phaseNumber,
        progress_percentage: progressPercentage,
      })
      .eq("id", projectId);

    if (projectError) throw projectError;

    // Create next phase if it doesn't exist
    if (phaseNumber < totalPhases) {
      const nextPhase = PHASE_STRUCTURES[phaseNumber]; // 0-indexed
      
      // Check if next phase already exists
      const { data: existingPhase } = await supabase
        .from("phase_progress")
        .select("id")
        .eq("project_id", projectId)
        .eq("phase_number", phaseNumber + 1)
        .single();

      if (!existingPhase) {
        await supabase.from("phase_progress").insert({
          project_id: projectId,
          phase_number: phaseNumber + 1,
          phase_name: nextPhase.phaseName,
          status: "not_started",
          progress: 0,
          completed_tasks: [],
          task_outputs: {},
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error completing phase:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Initialize phase progress if it doesn't exist
 */
export const initializePhaseProgress = async (
  projectId: string,
  phaseNumber: number
): Promise<{ success: boolean; data?: PhaseProgress; error?: string }> => {
  try {
    const phase = PHASE_STRUCTURES.find(p => p.phaseNumber === phaseNumber);
    if (!phase) {
      return { success: false, error: "Phase not found" };
    }

    // Check if already exists
    const { data: existing, error: fetchError } = await supabase
      .from("phase_progress")
      .select("*")
      .eq("project_id", projectId)
      .eq("phase_number", phaseNumber)
      .single();

    if (existing) {
      return { success: true, data: existing as PhaseProgress };
    }

    // Create new phase progress
    const { data, error } = await supabase
      .from("phase_progress")
      .insert({
        project_id: projectId,
        phase_number: phaseNumber,
        phase_name: phase.phaseName,
        status: phaseNumber === 1 ? "in_progress" : "not_started",
        progress: 0,
        completed_tasks: [],
        task_outputs: {},
        started_at: phaseNumber === 1 ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, data: data as PhaseProgress };
  } catch (error: any) {
    console.error("Error initializing phase progress:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Save task output/artifact
 */
export const saveTaskArtifact = async (
  projectId: string,
  phaseNumber: number,
  taskId: string,
  artifactType: string,
  artifactData: any
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from("phase_artifacts").insert({
      project_id: projectId,
      phase_number: phaseNumber,
      task_id: taskId,
      artifact_type: artifactType,
      artifact_data: artifactData,
    });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error("Error saving task artifact:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all artifacts for a phase
 */
export const getPhaseArtifacts = async (
  projectId: string,
  phaseNumber: number
): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from("phase_artifacts")
      .select("*")
      .eq("project_id", projectId)
      .eq("phase_number", phaseNumber)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error fetching phase artifacts:", error);
    return { success: false, error: error.message };
  }
};
