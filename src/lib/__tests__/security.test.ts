import { describe, it, expect } from 'vitest';
import { 
  sanitizeInput, 
  sanitizeHtml,
  sanitizeUrl,
  sanitizeEmail,
  stripHtml,
  containsXss,
  validateAlphanumeric
} from '../security';

describe('Security Utils', () => {
  describe('sanitizeInput', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      const result = sanitizeInput(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should trim whitespace', () => {
      const result = sanitizeInput('  hello  ');
      expect(result).toBe('hello');
    });

    it('should remove javascript: protocol', () => {
      const result = sanitizeInput('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      const result = sanitizeHtml('<div>Test</div>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });
  });

  describe('containsXss', () => {
    it('should detect script tags', () => {
      expect(containsXss('<script>alert(1)</script>')).toBe(true);
    });

    it('should detect inline event handlers', () => {
      expect(containsXss('<img onerror="alert(1)">')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(containsXss('Hello World')).toBe(false);
    });
  });

  describe('validateAlphanumeric', () => {
    it('should accept alphanumeric strings', () => {
      expect(validateAlphanumeric('abc123')).toBe(true);
    });

    it('should reject special characters by default', () => {
      expect(validateAlphanumeric('abc@123')).toBe(false);
    });

    it('should allow spaces when specified', () => {
      expect(validateAlphanumeric('hello world', true)).toBe(true);
    });
  });
});
