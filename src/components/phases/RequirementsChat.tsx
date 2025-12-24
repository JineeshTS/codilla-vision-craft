import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import TokenCostPreview from "@/components/shared/TokenCostPreview";
import { logError } from "@/lib/errorTracking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequirementsChatProps {
  ideaId: string;
  ideaTitle: string;
}

export const RequirementsChat = ({ ideaId, ideaTitle }: RequirementsChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi! I'm here to help you capture and screen "${ideaTitle}". Let's explore your idea together and validate if it's worth pursuing. To start, can you tell me more about the specific problem you're trying to solve?`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"balanced" | "fast" | "advanced">("balanced");
  const [showCostPreview, setShowCostPreview] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const streamChat = async (newMessages: Message[]) => {
    const CHAT_URL = `https://numyfjzmrtvzclgyfkpx.supabase.co/functions/v1/ai-requirements-chat`;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ideaId, messages: newMessages, model: selectedModel }),
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
      logError(error instanceof Error ? error : new Error('Chat error'), { ideaId, ideaTitle });
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

  return (
    <Card className="glass-panel p-6 flex flex-col h-[600px]">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          <h3 className="text-lg font-semibold">AI Idea Screening Chat</h3>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="model-select" className="text-sm text-muted-foreground">Model:</Label>
          <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)} disabled={isLoading}>
            <SelectTrigger id="model-select" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="fast">Fast</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
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

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Share your thoughts about the idea..."
          className="min-h-[60px] resize-none"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Tip: Press Enter to send, Shift+Enter for new line
      </p>

      <TokenCostPreview
        open={showCostPreview}
        onOpenChange={setShowCostPreview}
        onConfirm={handleConfirmSend}
        messages={[...messages, { role: 'user', content: pendingMessage }]}
        model={selectedModel}
      />
    </Card>
  );
};
