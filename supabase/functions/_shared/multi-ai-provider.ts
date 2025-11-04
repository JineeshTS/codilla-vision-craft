// Multi-AI Provider Abstraction Layer
// Supports Claude (Anthropic), Gemini (Google), and Codex (OpenAI GPT-5)

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type AIModel = 'claude' | 'gemini' | 'codex';

export interface AIProviderConfig {
  model: AIModel;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

// Call Claude (Anthropic API)
export async function callClaude(
  messages: AIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 4096,
  stream: boolean = false
): Promise<Response> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Convert messages to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

  const body = {
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: maxTokens,
    temperature,
    system: systemMessage,
    messages: conversationMessages,
    stream
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  return response;
}

// Call Gemini (Google AI API)
export async function callGemini(
  messages: AIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 4096,
  stream: boolean = false
): Promise<Response> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }

  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const endpoint = stream 
    ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent'
    : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

  const response = await fetch(`${endpoint}?key=${googleApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  return response;
}

// Call Codex (OpenAI GPT-5 API)
export async function callCodex(
  messages: AIMessage[],
  temperature: number = 0.7,
  maxTokens: number = 4096,
  stream: boolean = false
): Promise<Response> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const body = {
    model: 'gpt-4-turbo', // Update to 'gpt-5' when available
    messages: messages.map(m => ({
      role: m.role,
      content: m.content
    })),
    temperature,
    max_tokens: maxTokens,
    stream
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return response;
}

// Main function to call any AI provider
export async function callAI(config: AIProviderConfig): Promise<Response> {
  const { model, messages, temperature = 0.7, maxTokens = 4096, stream = false } = config;

  switch (model) {
    case 'claude':
      return callClaude(messages, temperature, maxTokens, stream);
    case 'gemini':
      return callGemini(messages, temperature, maxTokens, stream);
    case 'codex':
      return callCodex(messages, temperature, maxTokens, stream);
    default:
      throw new Error(`Unsupported AI model: ${model}`);
  }
}

// Parse non-streaming response
export async function parseAIResponse(response: Response, model: AIModel): Promise<string> {
  const data = await response.json();

  switch (model) {
    case 'claude':
      return data.content[0].text;
    case 'gemini':
      return data.candidates[0].content.parts[0].text;
    case 'codex':
      return data.choices[0].message.content;
    default:
      throw new Error(`Unsupported model for parsing: ${model}`);
  }
}

// Estimate tokens (rough approximation)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
