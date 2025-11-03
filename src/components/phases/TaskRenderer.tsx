import { PhaseTask } from "@/config/phaseStructure";
import MarketResearchTask from "./tasks/MarketResearchTask";
import CompetitiveAnalysisTask from "./tasks/CompetitiveAnalysisTask";
import BusinessModelTask from "./tasks/BusinessModelTask";
import UserPersonasTask from "./tasks/UserPersonasTask";
import UserStoriesTask from "./tasks/UserStoriesTask";
import FeatureSpecTask from "./tasks/FeatureSpecTask";

interface TaskRendererProps {
  projectId: string;
  phaseNumber: number;
  task: PhaseTask;
}

/**
 * Renders the appropriate task component based on task ID
 * Returns null for tasks that only use AI chat (no special UI)
 */
export const TaskRenderer = ({ projectId, phaseNumber, task }: TaskRendererProps) => {
  // Phase 2 Tasks
  if (task.id === "market-research") {
    return <MarketResearchTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }
  
  if (task.id === "competitive-analysis") {
    return <CompetitiveAnalysisTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }
  
  if (task.id === "business-model") {
    return <BusinessModelTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }

  // Phase 3 Tasks
  if (task.id === "user-personas") {
    return <UserPersonasTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }
  
  if (task.id === "user-stories") {
    return <UserStoriesTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }
  
  if (task.id === "feature-specification") {
    return <FeatureSpecTask projectId={projectId} phaseNumber={phaseNumber} taskId={task.id} />;
  }

  // For tasks without special UI (like customer-interviews, prd-generation, etc.)
  // Return null - they'll just use the AI chat interface
  return null;
};
