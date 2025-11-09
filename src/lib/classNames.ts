/**
 * Centralized CSS class name definitions for consistent styling
 */

export const CARD_CLASSES = {
  base: 'rounded-lg border bg-card text-card-foreground shadow-sm',
  glass: 'glass-panel',
  hover: 'hover:scale-105 transition-transform duration-200',
  interactive: 'cursor-pointer hover:shadow-lg transition-all duration-200',
} as const;

export const BUTTON_CLASSES = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
} as const;

export const TEXT_CLASSES = {
  heading: 'text-2xl font-bold tracking-tight',
  subheading: 'text-xl font-semibold',
  body: 'text-base',
  muted: 'text-sm text-muted-foreground',
  error: 'text-sm text-destructive',
  gradient: 'gradient-text',
} as const;

export const LAYOUT_CLASSES = {
  container: 'container mx-auto px-4',
  section: 'py-12 md:py-24',
  grid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
  flex: 'flex items-center justify-between',
} as const;

export const ANIMATION_CLASSES = {
  fadeIn: 'animate-in fade-in duration-500',
  slideIn: 'animate-in slide-in-from-bottom-4 duration-500',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
} as const;
