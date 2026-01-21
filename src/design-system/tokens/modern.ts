// Modern Venue Discovery Design System Tokens
// Dark-first theme with vibrant Indigo/Violet/Pink colors

export const modernColors = {
  primary: {
    DEFAULT: '#6366F1', // Indigo-500
    light: '#818CF8',   // Indigo-400
    dark: '#4F46E5',    // Indigo-600
    foreground: '#FFFFFF',
  },
  secondary: {
    DEFAULT: '#8B5CF6', // Violet-500
    light: '#A78BFA',   // Violet-400
    dark: '#7C3AED',    // Violet-600
    foreground: '#FFFFFF',
  },
  accent: {
    DEFAULT: '#EC4899', // Pink-500
    light: '#F472B6',   // Pink-400
    dark: '#DB2777',    // Pink-600
    foreground: '#FFFFFF',
  },
  success: {
    DEFAULT: '#10B981', // Emerald-500
    light: '#34D399',   // Emerald-400
    dark: '#059669',    // Emerald-600
    foreground: '#FFFFFF',
  },
  warning: {
    DEFAULT: '#F59E0B', // Amber-500
    light: '#FBBF24',   // Amber-400
    dark: '#D97706',    // Amber-600
    foreground: '#000000',
  },
  error: {
    DEFAULT: '#EF4444', // Red-500
    light: '#F87171',   // Red-400
    dark: '#DC2626',    // Red-600
    foreground: '#FFFFFF',
  },
  neutrals: {
    background: '#0F172A', // Slate-900
    surface: '#1E293B',    // Slate-800
    card: '#334155',       // Slate-700
    border: '#475569',     // Slate-600
    muted: '#64748B',      // Slate-500
    textPrimary: '#F8FAFC',   // Slate-50
    textSecondary: '#CBD5E1', // Slate-300
    textMuted: '#94A3B8',     // Slate-400
  },
};

export const modernSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const modernTypography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  headings: {
    h1: { size: '2.25rem', weight: '700', lineHeight: '2.5rem' },   // 36px
    h2: { size: '1.875rem', weight: '700', lineHeight: '2.25rem' }, // 30px
    h3: { size: '1.5rem', weight: '600', lineHeight: '2rem' },      // 24px
    h4: { size: '1.25rem', weight: '600', lineHeight: '1.75rem' },  // 20px
  },
  body: {
    large: { size: '1.125rem', weight: '400', lineHeight: '1.75rem' }, // 18px
    base: { size: '1rem', weight: '400', lineHeight: '1.5rem' },       // 16px
    small: { size: '0.875rem', weight: '400', lineHeight: '1.25rem' }, // 14px
    tiny: { size: '0.75rem', weight: '400', lineHeight: '1rem' },      // 12px
  },
};

export const modernGlass = {
  card: 'backdrop-blur-md bg-white/10 border border-white/20',
  cardHover: 'backdrop-blur-md bg-white/15 border border-white/25',
  header: 'backdrop-blur-lg bg-slate-900/80 border-b border-white/10',
  button: 'backdrop-blur-sm bg-white/5 border border-white/10',
  overlay: 'backdrop-blur-xl bg-black/60',
  input: 'backdrop-blur-md bg-white/5 border border-white/20',
};

export const modernShadows = {
  default: '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  hover: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
  glow: {
    primary: '0 0 20px rgba(99, 102, 241, 0.4)',
    secondary: '0 0 20px rgba(139, 92, 246, 0.4)',
    accent: '0 0 20px rgba(236, 72, 153, 0.4)',
    success: '0 0 20px rgba(16, 185, 129, 0.4)',
  },
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.2)',
};

export const modernBorderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px
  full: '9999px',
};

export const modernTransitions = {
  fast: '150ms ease-in-out',
  default: '300ms ease-in-out',
  slow: '500ms ease-in-out',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};

// Tailwind class utilities
export const modernClasses = {
  // Glass cards
  glassCard: 'backdrop-blur-md bg-white/10 border border-white/20 rounded-xl',
  glassCardHover: 'hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300',
  
  // Buttons
  primaryButton: 'bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300',
  secondaryButton: 'bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl px-6 py-3 border border-white/20 transition-all duration-300',
  accentButton: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold rounded-xl px-6 py-3 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all duration-300',
  
  // Text
  textPrimary: 'text-slate-50',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  
  // Backgrounds
  bgBackground: 'bg-slate-900',
  bgSurface: 'bg-slate-800',
  bgCard: 'bg-slate-700',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900',
  
  // Touch targets (min 44px)
  touchTarget: 'min-h-[44px] min-w-[44px]',
};

// Venue-specific tokens
export const modernVenueTokens = {
  categories: {
    restaurants: { bg: 'bg-orange-500', text: 'text-orange-500', icon: '🍽️' },
    bars: { bg: 'bg-purple-500', text: 'text-purple-500', icon: '🍸' },
    clubs: { bg: 'bg-pink-500', text: 'text-pink-500', icon: '🎉' },
    cafes: { bg: 'bg-amber-500', text: 'text-amber-500', icon: '☕' },
    liveMusic: { bg: 'bg-indigo-500', text: 'text-indigo-500', icon: '🎵' },
    events: { bg: 'bg-cyan-500', text: 'text-cyan-500', icon: '🎪' },
  },
  rating: {
    filled: 'text-yellow-400',
    half: 'text-yellow-400/50',
    empty: 'text-slate-600',
  },
  price: {
    active: 'text-emerald-400',
    inactive: 'text-slate-600',
  },
  status: {
    open: { bg: 'bg-emerald-500', text: 'text-emerald-400', pulse: true },
    closed: { bg: 'bg-red-500', text: 'text-red-400', pulse: false },
    closingSoon: { bg: 'bg-amber-500', text: 'text-amber-400', pulse: true },
  },
};

// Animation keyframes (for index.css or tailwind.config.ts)
export const modernAnimations = {
  cardTap: {
    keyframes: `
      0%, 100% { transform: scale(1); }
      50% { transform: scale(0.98); }
    `,
    duration: '150ms',
  },
  heartBounce: {
    keyframes: `
      0%, 100% { transform: scale(1); }
      25% { transform: scale(1.2); }
      50% { transform: scale(0.95); }
      75% { transform: scale(1.1); }
    `,
    duration: '400ms',
  },
  shimmer: {
    keyframes: `
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    `,
    duration: '1.5s',
  },
  pulseGlow: {
    keyframes: `
      0%, 100% { opacity: 1; box-shadow: 0 0 20px currentColor; }
      50% { opacity: 0.7; box-shadow: 0 0 10px currentColor; }
    `,
    duration: '2s',
  },
};
