import { z } from 'zod';

/**
 * Authentication form validation schemas
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  fullName: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .regex(/^[a-zA-Z\s\-']+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }),
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),
  password: z
    .string()
    .min(1, { message: 'Password is required' }),
});

/**
 * Idea form validation schemas
 */
export const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, { message: 'Title must be at least 5 characters' })
    .max(200, { message: 'Title must be less than 200 characters' }),
  description: z
    .string()
    .trim()
    .min(20, { message: 'Description must be at least 20 characters' })
    .max(5000, { message: 'Description must be less than 5000 characters' }),
  problem_statement: z
    .string()
    .trim()
    .max(2000, { message: 'Problem statement must be less than 2000 characters' })
    .optional(),
  target_audience: z
    .string()
    .trim()
    .max(1000, { message: 'Target audience must be less than 1000 characters' })
    .optional(),
  unique_value_proposition: z
    .string()
    .trim()
    .max(1000, { message: 'Value proposition must be less than 1000 characters' })
    .optional(),
});

/**
 * Password strength calculator
 */
export const calculatePasswordStrength = (password: string): {
  score: number;
  label: string;
  color: string;
} => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const strength = {
    0: { label: 'Very Weak', color: 'bg-destructive' },
    1: { label: 'Weak', color: 'bg-destructive' },
    2: { label: 'Fair', color: 'bg-yellow-500' },
    3: { label: 'Good', color: 'bg-yellow-500' },
    4: { label: 'Strong', color: 'bg-green-500' },
    5: { label: 'Very Strong', color: 'bg-green-500' },
    6: { label: 'Excellent', color: 'bg-green-500' },
  };

  return {
    score,
    label: strength[score as keyof typeof strength].label,
    color: strength[score as keyof typeof strength].color,
  };
};

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, ''); // Remove < and > to prevent HTML injection
};
