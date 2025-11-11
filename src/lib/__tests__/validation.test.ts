import { describe, it, expect } from 'vitest';
import { ideaSchema, signInSchema, calculatePasswordStrength, sanitizeText } from '../validation';

describe('Validation Utils', () => {
  describe('ideaSchema', () => {
    it('should validate idea with valid data', () => {
      const result = ideaSchema.safeParse({
        title: 'Valid Title',
        description: 'This is a valid description with enough characters',
      });
      
      expect(result.success).toBe(true);
    });

    it('should fail for short title', () => {
      const result = ideaSchema.safeParse({
        title: 'ab',
        description: 'Valid description here with enough characters',
      });
      
      expect(result.success).toBe(false);
    });

    it('should fail for short description', () => {
      const result = ideaSchema.safeParse({
        title: 'Valid Title',
        description: 'Short',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('should validate valid email and password', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
      });
      
      expect(result.success).toBe(true);
    });

    it('should fail for invalid email', () => {
      const result = signInSchema.safeParse({
        email: 'not-an-email',
        password: 'password123',
      });
      
      expect(result.success).toBe(false);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should return weak for simple password', () => {
      const result = calculatePasswordStrength('pass');
      expect(result.score).toBeLessThan(3);
    });

    it('should return strong for complex password', () => {
      const result = calculatePasswordStrength('MyP@ssw0rd123!');
      expect(result.score).toBeGreaterThan(3);
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      const result = sanitizeText('<script>alert("xss")</script>Hello');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const result = sanitizeText('  Hello  World  ');
      expect(result).toBe('Hello World');
    });
  });
});
