/**
 * Security utilities for input sanitization and XSS protection
 */

/**
 * Sanitize HTML string to prevent XSS attacks
 * Removes dangerous tags and attributes
 */
export function sanitizeHtml(input: string): string {
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

/**
 * Sanitize user input by removing HTML tags
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data:text/html
    .trim();
}

/**
 * Sanitize URL to prevent XSS and injection attacks
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
  const urlLower = url.toLowerCase().trim();

  for (const protocol of dangerous) {
    if (urlLower.startsWith(protocol)) {
      return '';
    }
  }

  return url.trim();
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\s@.-]/g, ''); // Only allow word chars, @, ., and -
}

/**
 * Escape special characters for use in regex
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate that a string contains only alphanumeric characters and specified special chars
 */
export function validateAlphanumeric(input: string, allowSpaces = false, allowedChars = ''): boolean {
  const spaceChar = allowSpaces ? '\\s' : '';
  const escaped = escapeRegex(allowedChars);
  const regex = new RegExp(`^[a-zA-Z0-9${spaceChar}${escaped}]+$`);
  return regex.test(input);
}

/**
 * Strip all HTML tags from a string
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeInput(item) :
        typeof item === 'object' ? sanitizeObject(item) :
        item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script\b/i,
    /<iframe\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<object\b/i,
    /<embed\b/i,
    /<applet\b/i,
    /data:text\/html/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Generate a Content Security Policy header value
 */
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com",
    "frame-src 'self' https://api.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ');
}
