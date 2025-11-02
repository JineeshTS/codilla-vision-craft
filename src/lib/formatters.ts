/**
 * Utility functions for formatting data
 */

import { IDEA_STATUS_CONFIG, PHASE_STATUS_CONFIG } from "./constants";
import type { IdeaStatus, PhaseStatus, TokenTransactionType } from "./types";

/**
 * Format a status string for display (replace underscores with spaces and capitalize)
 */
export const formatStatus = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

/**
 * Get status configuration for an idea status
 */
export const getIdeaStatusConfig = (status: IdeaStatus) => {
  return IDEA_STATUS_CONFIG[status] || IDEA_STATUS_CONFIG.draft;
};

/**
 * Get status configuration for a phase status
 */
export const getPhaseStatusConfig = (status: PhaseStatus) => {
  return PHASE_STATUS_CONFIG[status] || PHASE_STATUS_CONFIG.pending;
};

/**
 * Format a number as a token amount (e.g., 1000 -> "1,000")
 */
export const formatTokenAmount = (amount: number): string => {
  return amount.toLocaleString();
};

/**
 * Format a date as a relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  } else {
    return then.toLocaleDateString();
  }
};

/**
 * Format a date as a short string (e.g., "Jan 1, 2025")
 */
export const formatShortDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Format a transaction type for display
 */
export const formatTransactionType = (type: TokenTransactionType): string => {
  return formatStatus(type);
};

/**
 * Get color class for transaction type
 */
export const getTransactionTypeColor = (type: TokenTransactionType): string => {
  switch (type) {
    case "purchase":
      return "text-green-600";
    case "consumption":
      return "text-red-600";
    case "bonus":
      return "text-primary";
    case "refund":
      return "text-blue-600";
    default:
      return "text-muted-foreground";
  }
};

/**
 * Calculate percentage safely (handles division by zero)
 */
export const calculatePercentage = (
  numerator: number,
  denominator: number
): number => {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
};

/**
 * Truncate text to a maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

/**
 * Format a consensus score as a percentage
 */
export const formatConsensusScore = (score: number | null): string => {
  if (score === null) return "N/A";
  return `${score}/100`;
};

/**
 * Get color class for consensus score
 */
export const getConsensusScoreColor = (score: number | null): string => {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
};
