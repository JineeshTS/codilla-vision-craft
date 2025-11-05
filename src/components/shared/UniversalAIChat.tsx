import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

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
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load conversation history only once
  useEffect(() => {
    if (conversationId) {
      loadConversation();
    }
  }, [conversationId]);

  const loadConversation = useCallback(async () => {
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
      console.error('Error loading conversation:', error);
      setError('Failed to load conversation history');
    }
  }, [conversationId]);

  const handleSend = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    // Validate message length
    if (textToSend.length > 10000) {
      toast.error("Message too long (max 10,000 characters)");
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Get fresh session
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
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          toast.error(`Insufficient tokens. Need ${errorData.required}, have ${errorData.balance}`);
        } else {
          toast.error(errorData.error || "Failed to get AI response");
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

      // Handle streaming response with optimized updates
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      let updateCounter = 0;

      // Add empty assistant message
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      if (reader) {
        let buffer = '';
        try {
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
                    updateCounter++;

                    // Debounce updates: only update UI every 10 tokens for better performance
                    if (updateCounter % 10 === 0 || content.includes('\n')) {
                      setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = {
                          role: 'assistant',
                          content: assistantMessage
                        };
                        return newMessages;
                      });
                    }
                  }
                } catch (e) {
                  console.warn('Failed to parse SSE data:', e);
                }
              }
            }
          }

          // Final update with complete message
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage
            };
            return newMessages;
          });

        } catch (streamError: any) {
          if (streamError.name === 'AbortError') {
            toast.info("Message cancelled");
          } else {
            throw streamError;
          }
        }
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        return; // User cancelled, already handled
      }
      console.error('Error sending message:', error);
      setError(error.message || "Failed to send message");
      toast.error("Failed to send message");
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [input, isLoading, conversationId, context, systemPrompt]);

  const copyToClipboard = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Cancel ongoing request
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  // Memoize suggested questions to prevent re-renders
  const suggestedQuestionButtons = useMemo(() => {
    if (messages.length > 0 || suggestedQuestions.length === 0) return null;

    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">💡 Suggested questions:</p>
        <div className="grid gap-2">
          {suggestedQuestions.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-primary/5"
              onClick={() => handleSend(question)}
              disabled={isLoading}
            >
              <span className="text-sm">{question}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }, [messages.length, suggestedQuestions, isLoading, handleSend]);

  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <h3 className="font-semibold">AI Startup Mentor</h3>
        {totalTokens > 0 && (
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {totalTokens.toLocaleString()} tokens
          </span>
        )}
      </div>

      {error && (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {suggestedQuestionButtons}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border'
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                {message.role === 'assistant' && message.content && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 px-2 text-xs"
                    onClick={() => copyToClipboard(message.content, index)}
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl p-4 border border-border">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-muted/30">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your AI Startup Mentor anything..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
            maxLength={10000}
          />
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <Button
                onClick={handleCancel}
                variant="destructive"
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <AlertCircle className="h-5 w-5" />
              </Button>
            ) : (
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-[60px] w-[60px]"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        {input.length > 9000 && (
          <p className="text-xs text-muted-foreground mt-2">
            {10000 - input.length} characters remaining
          </p>
        )}
      </div>
    </Card>
  );
}
