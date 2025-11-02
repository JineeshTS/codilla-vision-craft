/**
 * Sanitized error handler for edge functions
 * 
 * This utility sanitizes error messages before sending them to clients,
 * preventing information leakage about database structure, internal paths,
 * or configuration details.
 * 
 * Full error details are logged server-side for debugging.
 */

interface ErrorMapping {
  pattern: string | RegExp;
  message: string;
}

const errorMappings: ErrorMapping[] = [
  // Database errors
  { pattern: /relation.*does not exist/i, message: 'Service temporarily unavailable' },
  { pattern: /column.*does not exist/i, message: 'Service temporarily unavailable' },
  { pattern: /table.*does not exist/i, message: 'Service temporarily unavailable' },
  { pattern: /violates.*constraint/i, message: 'Invalid data provided' },
  
  // Configuration errors
  { pattern: /LOVABLE_API_KEY/i, message: 'Service configuration error' },
  { pattern: /not configured/i, message: 'Service configuration error' },
  { pattern: /missing.*key/i, message: 'Service configuration error' },
  
  // Network/API errors
  { pattern: /fetch failed/i, message: 'AI service unavailable' },
  { pattern: /network/i, message: 'Service unavailable' },
  { pattern: /timeout/i, message: 'Request timeout' },
  { pattern: /502|503|504/i, message: 'Service temporarily unavailable' },
  
  // Auth errors
  { pattern: /JWT/i, message: 'Authentication required' },
  { pattern: /not authenticated/i, message: 'Authentication required' },
  { pattern: /unauthorized/i, message: 'Access denied' },
  
  // Data errors
  { pattern: /not found/i, message: 'Resource not found' },
  { pattern: /already exists/i, message: 'Resource already exists' },
];

/**
 * Sanitize error message for client response
 * Logs full error server-side, returns generic message to client
 */
export const sanitizeError = (error: unknown, errorId?: string): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Log full error server-side for debugging
  console.error('[ERROR]', {
    errorId,
    message: errorMessage,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Check against error mappings
  for (const mapping of errorMappings) {
    const pattern = typeof mapping.pattern === 'string' 
      ? new RegExp(mapping.pattern, 'i')
      : mapping.pattern;
    
    if (pattern.test(errorMessage)) {
      return mapping.message;
    }
  }

  // Default generic message
  return 'An unexpected error occurred';
};

/**
 * Create a standardized error response
 */
export const createErrorResponse = (
  error: unknown,
  status: number = 500,
  corsHeaders: Record<string, string>,
  errorId?: string
): Response => {
  const message = sanitizeError(error, errorId);
  
  return new Response(
    JSON.stringify({
      error: message,
      errorId,
    }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
};
