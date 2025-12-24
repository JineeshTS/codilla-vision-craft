import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PhaseTask } from "@/config/phaseStructure";
import { TaskRenderer } from "./TaskRenderer";
import TokenCostPreview from "@/components/shared/TokenCostPreview";
import { logError } from "@/lib/errorTracking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface PhaseTaskChatProps {
  projectId: string;
  phaseNumber: number;
  task: PhaseTask;
  onComplete: () => void;
  isCompleted?: boolean;
}

export const PhaseTaskChat = ({ 
  projectId, 
  phaseNumber, 
  task, 
  onComplete,
  isCompleted = false 
}: PhaseTaskChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Let's work on **${task.title}**.\n\n${task.description}\n\nI'll guide you through this step. ${task.aiPromptContext.split('.')[0]}. What would you like to discuss first?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCostPreview, setShowCostPreview] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (newMessages: Message[]) => {
    const CHAT_URL = `https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/phase-task-chat`;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          projectId,
          phaseNumber,
          taskId: task.id,
          messages: newMessages 
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate limit exceeded",
            description: "Please try again later.",
          });
          return;
        }
        if (resp.status === 402) {
          toast({
            variant: "destructive",
            title: "AI credits exhausted",
            description: "Please add funds to continue.",
          });
          return;
        }
        throw new Error("Failed to start stream");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;
      let assistantContent = "";

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error: any) {
      logError(error instanceof Error ? error : new Error('Chat error'), { projectId, phaseNumber, taskId: task.id });
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setPendingMessage(input.trim());
    setShowCostPreview(true);
  };

  const handleConfirmSend = async () => {
    const textToSend = pendingMessage;
    setPendingMessage("");

    const userMessage: Message = { role: "user", content: textToSend };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    await streamChat(newMessages);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMarkComplete = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Fetch current phase progress
      const { data: currentProgress, error: fetchError } = await supabase
        .from("phase_progress")
        .select("completed_tasks")
        .eq("project_id", projectId)
        .eq("phase_number", phaseNumber)
        .single();

      if (fetchError) throw fetchError;

      const completedTasks = (currentProgress?.completed_tasks as string[]) || [];
      
      // Add task if not already completed
      if (!completedTasks.includes(task.id)) {
        const updatedCompletedTasks = [...completedTasks, task.id];

        // Update phase_progress with new completed task
        const { error } = await supabase
          .from("phase_progress")
          .update({ 
            completed_tasks: updatedCompletedTasks,
            progress: Math.round((updatedCompletedTasks.length / 4) * 100) // Assuming 4 tasks per phase avg
          })
          .eq("project_id", projectId)
          .eq("phase_number", phaseNumber);

        if (error) throw error;

        toast({
          title: "Task completed!",
          description: `${task.title} has been marked as complete.`,
        });
      }
      
      onComplete();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to mark task complete",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Task-specific component (if available) */}
      <TaskRenderer projectId={projectId} phaseNumber={phaseNumber} task={task} />
      
      {/* AI Chat Interface */}
      <Card className="glass-panel p-6 flex flex-col h-[600px]">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">{task.title}</h3>
              <p className="text-xs text-muted-foreground">AI Guidance</p>
            </div>
          </div>
          {isCompleted && (
            <Badge className="bg-green-400/20 text-green-400 border-green-400/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="w-8 h-8 shrink-0">
                {msg.role === "assistant" ? (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-5 h-5 text-foreground" />
                  </div>
                )}
              </Avatar>
              <div
                className={`flex-1 p-3 rounded-lg ${
                  msg.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary/10"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <Avatar className="w-8 h-8 shrink-0">
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              </Avatar>
              <div className="flex-1 p-3 rounded-lg bg-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask AI for guidance on this task..."
              className="min-h-[60px] resize-none"
              disabled={isLoading || isCompleted}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isCompleted}
              className="shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {!isCompleted && (
            <Button 
              onClick={handleMarkComplete}
              variant="outline" 
              className="w-full"
              disabled={messages.length < 3}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Task as Complete
            </Button>
          )}
          
          <p className="text-xs text-muted-foreground text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>

        <TokenCostPreview
          open={showCostPreview}
          onOpenChange={setShowCostPreview}
          onConfirm={handleConfirmSend}
          messages={[...messages, { role: 'user', content: pendingMessage }]}
          model="gemini"
        />
      </Card>
    </div>
  );
};

export default PhaseTaskChat;

