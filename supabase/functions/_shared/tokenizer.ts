// Token counting utilities for different AI providers
// Provides accurate token estimation instead of rough approximation

export type AIModel = 'claude' | 'gemini' | 'codex' | 'gpt-5';

/**
 * Count tokens for Claude (Anthropic)
 * Uses Claude's token counting API endpoint
 */
async function countClaudeTokens(text: string): Promise<number> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    console.warn('ANTHROPIC_API_KEY not configured, using approximation');
    return Math.ceil(text.length / 4);
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages/count_tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        messages: [{ role: 'user', content: text }]
      })
    });

    if (!response.ok) {
      console.warn('Claude token counting failed, using approximation');
      return Math.ceil(text.length / 4);
    }

    const data = await response.json();
    return data.input_tokens || Math.ceil(text.length / 4);
  } catch (error) {
    console.error('Error counting Claude tokens:', error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens for Gemini (Google)
 * Uses Google's token counting API endpoint
 */
async function countGeminiTokens(text: string): Promise<number> {
  const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
  if (!googleApiKey) {
    console.warn('GOOGLE_API_KEY not configured, using approximation');
    return Math.ceil(text.length / 4);
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:countTokens?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text }]
          }]
        })
      }
    );

    if (!response.ok) {
      console.warn('Gemini token counting failed, using approximation');
      return Math.ceil(text.length / 4);
    }

    const data = await response.json();
    return data.totalTokens || Math.ceil(text.length / 4);
  } catch (error) {
    console.error('Error counting Gemini tokens:', error);
    return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens for OpenAI (GPT-5)
 * Uses tiktoken-like estimation (GPT-4 encoding is close enough for GPT-5)
 * Note: For true accuracy, would need tiktoken library which isn't available in Deno
 * Using improved approximation based on GPT-4 characteristics
 */
function countOpenAITokens(text: string): number {
  // Improved approximation for GPT models
  // Average: ~4 characters per token for English text
  // Adjust for common patterns:
  
  let tokenCount = 0;
  
  // Split by whitespace and punctuation
  const words = text.split(/\s+/);
  
  for (const word of words) {
    // Most English words are 1 token
    // Longer words (>8 chars) are often 2+ tokens
    // Special characters and numbers affect tokenization
    
    if (word.length === 0) continue;
    
    if (word.length <= 4) {
      tokenCount += 1;
    } else if (word.length <= 8) {
      tokenCount += 1;
    } else if (word.length <= 12) {
      tokenCount += 2;
    } else {
      tokenCount += Math.ceil(word.length / 6);
    }
    
    // Account for punctuation as separate tokens
    const punctuationCount = (word.match(/[.,!?;:()[\]{}]/g) || []).length;
    tokenCount += punctuationCount;
  }
  
  // Add overhead for message formatting (role, content structure)
  tokenCount += 4;
  
  return Math.max(1, tokenCount);
}

/**
 * Count tokens for any AI model
 * Uses provider-specific APIs when available
 */
export async function countTokens(text: string, model: AIModel): Promise<number> {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  switch (model) {
    case 'claude':
      return await countClaudeTokens(text);
    
    case 'gemini':
      return await countGeminiTokens(text);
    
    case 'codex':
    case 'gpt-5':
      return countOpenAITokens(text);
    
    default:
      console.warn(`Unknown model: ${model}, using approximation`);
      return Math.ceil(text.length / 4);
  }
}

/**
 * Count tokens for an array of messages
 * Useful for chat conversations
 */
export async function countMessagesTokens(
  messages: Array<{ role: string; content: string }>,
  model: AIModel
): Promise<number> {
  let totalTokens = 0;
  
  for (const message of messages) {
    const messageText = `${message.role}: ${message.content}`;
    totalTokens += await countTokens(messageText, model);
  }
  
  // Add overhead for message formatting
  totalTokens += messages.length * 3;
  
  return totalTokens;
}

/**
 * Estimate cost in tokens for a request
 * Returns both input and estimated output tokens
 */
export async function estimateRequestCost(
  input: string,
  model: AIModel,
  estimatedOutputLength: number = 500
): Promise<{ inputTokens: number; outputTokens: number; totalTokens: number }> {
  const inputTokens = await countTokens(input, model);
  const outputTokens = await countTokens('x'.repeat(estimatedOutputLength), model);
  
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens
  };
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use countTokens() instead
 */
export function estimateTokens(text: string): number {
  console.warn('estimateTokens() is deprecated, use countTokens() instead');
  return Math.ceil(text.length / 4);
}
