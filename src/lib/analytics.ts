/**
 * Analytics tracking utilities
 *
 * This module provides a wrapper around Google Analytics (GA4)
 * and can be extended to support other analytics providers.
 */

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

/**
 * Initialize Google Analytics
 * Call this in your App component or main entry point
 */
export const initAnalytics = (measurementId: string) => {
  if (typeof window === "undefined") return;

  // Load Google Analytics script
  const script = document.createElement("script");
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  // Initialize gtag
  window.gtag =
    window.gtag ||
    function () {
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(arguments);
    };

  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    send_page_view: false, // We'll handle page views manually
  });
};

/**
 * Track a page view
 */
export const trackPageView = (path: string, title?: string) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title || document.title,
  });
};

/**
 * Track a custom event
 */
export const trackEvent = ({
  action,
  category,
  label,
  value,
}: AnalyticsEvent) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

/**
 * Track user signup
 */
export const trackSignUp = (method: string = "email") => {
  trackEvent({
    action: "sign_up",
    category: "engagement",
    label: method,
  });
};

/**
 * Track user login
 */
export const trackLogin = (method: string = "email") => {
  trackEvent({
    action: "login",
    category: "engagement",
    label: method,
  });
};

/**
 * Track idea creation
 */
export const trackIdeaCreated = (ideaId: string) => {
  trackEvent({
    action: "idea_created",
    category: "ideas",
    label: ideaId,
  });
};

/**
 * Track idea validation
 */
export const trackIdeaValidated = (ideaId: string, consensusScore: number) => {
  trackEvent({
    action: "idea_validated",
    category: "ideas",
    label: ideaId,
    value: consensusScore,
  });
};

/**
 * Track project creation
 */
export const trackProjectCreated = (projectId: string) => {
  trackEvent({
    action: "project_created",
    category: "projects",
    label: projectId,
  });
};

/**
 * Track token purchase
 */
export const trackTokenPurchase = (amount: number, value: number) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "purchase", {
    currency: "INR",
    value: value,
    items: [
      {
        item_id: "tokens",
        item_name: "Codilla Tokens",
        quantity: amount,
        price: value,
      },
    ],
  });

  trackEvent({
    action: "token_purchase",
    category: "monetization",
    label: `${amount}_tokens`,
    value: value,
  });
};

/**
 * Track template usage
 */
export const trackTemplateUsed = (templateId: string, templateName: string) => {
  trackEvent({
    action: "template_used",
    category: "templates",
    label: `${templateId}:${templateName}`,
  });
};

/**
 * Track code generation
 */
export const trackCodeGeneration = (success: boolean) => {
  trackEvent({
    action: "code_generated",
    category: "ai",
    label: success ? "success" : "failure",
    value: success ? 1 : 0,
  });
};

/**
 * Track errors
 */
export const trackError = (error: Error, context?: string) => {
  trackEvent({
    action: "error",
    category: "errors",
    label: `${context || "unknown"}: ${error.message}`,
  });
};

/**
 * Set user properties
 */
export const setUserProperties = (userId: string, properties: Record<string, any>) => {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("config", "GA_MEASUREMENT_ID", {
    user_id: userId,
    ...properties,
  });
};
