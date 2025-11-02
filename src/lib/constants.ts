/**
 * Application-wide constants
 */

import { StatusConfig, AgentConfig } from "./types";

/**
 * Token costs for different operations
 */
export const TOKEN_COSTS = {
  IDEA_VALIDATION: 150,
  PHASE_VALIDATION: 100,
  CODE_GENERATION_BASE: 50,
  WELCOME_BONUS: 100,
} as const;

/**
 * Status configurations for ideas
 */
export const IDEA_STATUS_CONFIG: Record<string, StatusConfig> = {
  draft: {
    color: "secondary",
    bgColor: "bg-secondary/10",
    textColor: "text-secondary-foreground",
    label: "Draft",
  },
  validating: {
    color: "default",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    label: "Validating",
  },
  validated: {
    color: "default",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    label: "Validated",
  },
  in_development: {
    color: "default",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-600",
    label: "In Development",
  },
  completed: {
    color: "default",
    bgColor: "bg-green-600/10",
    textColor: "text-green-700",
    label: "Completed",
  },
  archived: {
    color: "secondary",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600",
    label: "Archived",
  },
} as const;

/**
 * Status configurations for phases
 */
export const PHASE_STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    color: "secondary",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-600",
    label: "Pending",
  },
  in_progress: {
    color: "default",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-600",
    label: "In Progress",
  },
  completed: {
    color: "default",
    bgColor: "bg-green-500/10",
    textColor: "text-green-600",
    label: "Completed",
  },
  failed: {
    color: "destructive",
    bgColor: "bg-red-500/10",
    textColor: "text-red-600",
    label: "Failed",
  },
} as const;

/**
 * AI agent configurations
 */
export const AGENT_CONFIG: Record<string, AgentConfig> = {
  claude: {
    name: "Claude",
    color: "text-blue-500",
    icon: "🤖",
    description: "Anthropic's Claude AI - Expert in reasoning and analysis",
  },
  gemini: {
    name: "Gemini",
    color: "text-green-500",
    icon: "✨",
    description: "Google's Gemini AI - Multimodal understanding",
  },
  codex: {
    name: "Codex",
    color: "text-purple-500",
    icon: "💻",
    description: "OpenAI's Codex - Code generation specialist",
  },
} as const;

/**
 * Phase names for the 10-phase development process
 */
export const PHASE_NAMES = [
  "Requirements Gathering",
  "Technical Architecture",
  "Database Design",
  "API Design",
  "Frontend Development",
  "Backend Development",
  "Integration & Testing",
  "Security & Performance",
  "Deployment",
  "Final Review",
] as const;

/**
 * Rate limits for API calls (per hour)
 */
export const RATE_LIMITS = {
  IDEA_VALIDATION: 10,
  PHASE_VALIDATION: 20,
  CODE_GENERATION: 30,
} as const;

/**
 * Company information for legal pages
 */
export const COMPANY_INFO = {
  name: "Codilla.ai",
  email: {
    support: "support@codilla.ai",
    privacy: "privacy@codilla.ai",
    legal: "legal@codilla.ai",
  },
  address: {
    line1: "[Company Address Line 1]",
    line2: "[Company Address Line 2]",
    city: "[City]",
    state: "[State]",
    zip: "[ZIP]",
    country: "[Country]",
  },
  jurisdiction: "[Your Jurisdiction - e.g., State of California, USA]",
} as const;

/**
 * Social media handles
 */
export const SOCIAL_MEDIA = {
  twitter: "@codilla_ai",
  github: "codilla-ai",
  linkedin: "codilla-ai",
} as const;

/**
 * External URLs
 */
export const EXTERNAL_URLS = {
  DOCUMENTATION: "https://docs.codilla.ai",
  SUPPORT: "https://support.codilla.ai",
  STATUS: "https://status.codilla.ai",
  BLOG: "https://blog.codilla.ai",
} as const;
