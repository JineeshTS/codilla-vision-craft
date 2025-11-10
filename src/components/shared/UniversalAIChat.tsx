import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import TokenCostPreview from "./TokenCostPreview";
import { logError } from "@/lib/errorTracking";

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  timestamp?: string;
}

interface UniversalAIChatProps {
  context?: {
    type: 'idea' | 'project' | 'phase' | 'general';
    id?: string;
    phase?: number;
    data?: any;
  };
  systemPrompt?: string;
  conversationId?: string;
  suggestedQuestions?: string[];
  className?: string;
}

export default function UniversalAIChat({
  context,
  systemPrompt,
  conversationId: initialConversationId,
  suggestedQuestions = [],
  className = ""
}: UniversalAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [totalTokens, setTotalTokens] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showCostPreview, setShowCostPreview] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Load conversation history if conversationId exists
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_conversations' as any)
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      if (data && (data as any).messages) {
        setMessages((data as any).messages);
        setTotalTokens((data as any).total_tokens_used || 0);
      }
    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error loading conversation'), { conversationId });
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    // Show cost preview before sending
    setPendingMessage(textToSend);
    setShowCostPreview(true);
  };

  const handleConfirmSend = async () => {
    const textToSend = pendingMessage;
    setPendingMessage("");
    
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Get fresh session (this will refresh token if needed)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error("Please sign in to use AI chat");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/universal-ai-chat`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            conversationId,
            message: textToSend,
            context,
            systemPrompt
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          toast.error(`Insufficient tokens. Required: ${errorData.required}, Balance: ${errorData.balance}`, {
            description: "Purchase more tokens to continue using AI features"
          });
        } else if (response.status === 429) {
          const retryAfter = errorData.retryAfter || 60;
          toast.error("Rate limit exceeded", {
            description: `Please wait ${Math.ceil(retryAfter / 60)} minutes before trying again`
          });
        } else if (response.status === 401) {
          toast.error("Authentication required", {
            description: "Please sign in again to continue"
          });
          // Optionally redirect to login
          setTimeout(() => window.location.href = '/auth', 2000);
        } else {
          toast.error(errorData.error || "Failed to get AI response", {
            description: "Please try again or contact support if the issue persists"
          });
        }
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      // Get conversation ID from headers
      const newConversationId = response.headers.get('X-Conversation-Id');
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
      }

      const tokensUsed = parseInt(response.headers.get('X-Tokens-Used') || '0');
      setTotalTokens(prev => prev + tokensUsed);

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  assistantMessage += content;
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      role: 'assistant',
                      content: assistantMessage
                    };
                    return newMessages;
                  });
                }
              } catch (e) {
                // Ignore JSON parse errors
              }
            }
          }
        }
      }

    } catch (error) {
      logError(error instanceof Error ? error : new Error('Error sending message'), { context, systemPrompt });
      toast.error("Failed to send message");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 p-4 border-b">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">AI Assistant</h3>
        {totalTokens > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {totalTokens.toLocaleString()} tokens used
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && suggestedQuestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Suggested questions:</p>
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => handleSend(question)}
                  disabled={isLoading}
                >
                  {question}
                </Button>
              ))}
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'assistant' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2"
                    onClick={() => copyToClipboard(message.content, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI anything..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <TokenCostPreview
        open={showCostPreview}
        onOpenChange={setShowCostPreview}
        onConfirm={handleConfirmSend}
        messages={[...messages, { role: 'user', content: pendingMessage }]}
        model="gemini"
      />
    </Card>
  );
}
