/**
 * Venue Discovery Design System Tokens
 * 
 * Semantic tokens for venue-specific UI elements including
 * AI scores, status indicators, price levels, and map markers.
 */

export const venueScoreTokens = {
  excellent: {
    threshold: 85,
    bg: 'bg-green-100 dark:bg-green-950/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    marker: '#22c55e',
    label: 'Excellent Match',
  },
  good: {
    threshold: 70,
    bg: 'bg-blue-100 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    marker: '#3b82f6',
    label: 'Good Match',
  },
  fair: {
    threshold: 55,
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    marker: '#eab308',
    label: 'Fair Match',
  },
  low: {
    threshold: 0,
    bg: 'bg-red-100 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    marker: '#ef4444',
    label: 'Low Match',
  },
} as const;

export const venueStatusTokens = {
  open: {
    bg: 'bg-sage-100 dark:bg-sage-950/40',
    text: 'text-sage-700 dark:text-sage-300',
    icon: 'text-sage-600 dark:text-sage-400',
    label: 'Open Now',
  },
  closed: {
    bg: 'bg-red-100 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    icon: 'text-red-600 dark:text-red-400',
    label: 'Closed',
  },
  closingSoon: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    icon: 'text-amber-600 dark:text-amber-400',
    label: 'Closing Soon',
  },
} as const;

export const venuePriceTokens = {
  budget: {
    level: 1,
    text: 'text-sage-600 dark:text-sage-400',
    label: 'Budget Friendly',
    symbol: '$',
  },
  moderate: {
    level: 2,
    text: 'text-blue-600 dark:text-blue-400',
    label: 'Moderate',
    symbol: '$$',
  },
  upscale: {
    level: 3,
    text: 'text-purple-600 dark:text-purple-400',
    label: 'Upscale',
    symbol: '$$$',
  },
  premium: {
    level: 4,
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Premium',
    symbol: '$$$$',
  },
} as const;

export const venueMarkerTokens = {
  colors: {
    excellent: '#22c55e',
    good: '#3b82f6',
    fair: '#eab308',
    low: '#ef4444',
  },
  cluster: {
    small: {
      size: 30,
      bg: 'linear-gradient(135deg, hsl(150, 25%, 55%), hsl(150, 25%, 45%))',
    },
    medium: {
      size: 40,
      bg: 'linear-gradient(135deg, hsl(150, 25%, 50%), hsl(150, 25%, 40%))',
    },
    large: {
      size: 50,
      bg: 'linear-gradient(135deg, hsl(150, 25%, 45%), hsl(150, 25%, 35%))',
    },
  },
  userLocation: '#3b82f6',
  homeLocation: '#6B8E6B',
} as const;

export const venueConfidenceTokens = {
  high: {
    threshold: 80,
    color: 'bg-green-500',
    label: 'High',
  },
  medium: {
    threshold: 60,
    color: 'bg-amber-500',
    label: 'Med',
  },
  low: {
    threshold: 0,
    color: 'bg-red-500',
    label: 'Low',
  },
} as const;

export const venueFeedbackTokens = {
  superLike: {
    default: 'bg-transparent hover:bg-primary/10',
    active: 'bg-primary/10 text-primary',
    icon: 'Sparkles',
  },
  like: {
    default: 'bg-transparent hover:bg-sage-100 dark:hover:bg-sage-900/40',
    active: 'bg-sage-100 dark:bg-sage-900/40 text-sage-700 dark:text-sage-300',
    icon: 'ThumbsUp',
  },
  visited: {
    default: 'bg-transparent hover:bg-green-100 dark:hover:bg-green-900/40',
    active: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    icon: 'CheckCircle',
  },
  dislike: {
    default: 'bg-transparent hover:bg-red-100 dark:hover:bg-red-900/40',
    active: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    icon: 'ThumbsDown',
  },
  skip: {
    default: 'bg-transparent hover:bg-muted',
    active: 'bg-muted text-muted-foreground',
    icon: 'SkipForward',
  },
} as const;

// Helper functions
export function getScoreTokens(score: number) {
  if (score >= venueScoreTokens.excellent.threshold) return venueScoreTokens.excellent;
  if (score >= venueScoreTokens.good.threshold) return venueScoreTokens.good;
  if (score >= venueScoreTokens.fair.threshold) return venueScoreTokens.fair;
  return venueScoreTokens.low;
}

export function getConfidenceTokens(confidence: number) {
  if (confidence >= venueConfidenceTokens.high.threshold) return venueConfidenceTokens.high;
  if (confidence >= venueConfidenceTokens.medium.threshold) return venueConfidenceTokens.medium;
  return venueConfidenceTokens.low;
}

export function getPriceTokens(priceRange: string) {
  const count = (priceRange.match(/\$/g) || []).length;
  switch (count) {
    case 1: return venuePriceTokens.budget;
    case 2: return venuePriceTokens.moderate;
    case 3: return venuePriceTokens.upscale;
    case 4: return venuePriceTokens.premium;
    default: return venuePriceTokens.moderate;
  }
}

export function getMarkerColor(score: number): string {
  if (score >= 85) return venueMarkerTokens.colors.excellent;
  if (score >= 70) return venueMarkerTokens.colors.good;
  if (score >= 55) return venueMarkerTokens.colors.fair;
  return venueMarkerTokens.colors.low;
}
