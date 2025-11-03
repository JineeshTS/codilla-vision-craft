export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'google';
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  stream: boolean = false
): Promise<Response> {
  switch (config.provider) {
    case 'openai':
      return await callOpenAI(config, messages, stream);
    case 'anthropic':
      return await callAnthropic(config, messages, stream);
    case 'google':
      return await callGoogle(config, messages, stream);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function callOpenAI(
  config: AIProviderConfig,
  messages: AIMessage[],
  stream: boolean
): Promise<Response> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4',
      messages,
      stream,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  return response;
}

async function callAnthropic(
  config: AIProviderConfig,
  messages: AIMessage[],
  stream: boolean
): Promise<Response> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages.filter(m => m.role !== 'system');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      system: systemMessage,
      messages: conversationMessages,
      stream,
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  return response;
}

async function callGoogle(
  config: AIProviderConfig,
  messages: AIMessage[],
  stream: boolean
): Promise<Response> {
  // Convert messages to Gemini format
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find(m => m.role === 'system')?.content;

  const model = config.model || 'gemini-2.0-flash-exp';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? 'streamGenerateContent' : 'generateContent'}?key=${config.apiKey}`;

  const body: any = {
    contents,
    generationConfig: {
      temperature: config.temperature || 0.7,
      maxOutputTokens: config.maxTokens || 8192,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${response.status} - ${error}`);
  }

  return response;
}

export function estimateTokens(text: string): number {
  // Rough estimation: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

export function calculateMessageTokens(messages: AIMessage[]): number {
  return messages.reduce((total, msg) => {
    return total + estimateTokens(msg.content);
  }, 0);
}
