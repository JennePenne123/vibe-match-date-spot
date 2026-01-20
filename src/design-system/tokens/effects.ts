// Design system effects tokens - Wellness-Inspired (gentle, diffused)
export const effectTokens = {
  // Gentle shadow system - diffused, neutral, calming
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.03)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.07), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.08), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.12)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.04)',
    none: '0 0 #0000',
  },

  // Wellness brand shadows - soft, warm undertones
  brandShadow: {
    subtle: '0 2px 8px -2px hsl(150 25% 45% / 0.08)',
    soft: '0 4px 16px -4px hsl(150 25% 45% / 0.12)',
    medium: '0 8px 24px -6px hsl(150 25% 45% / 0.15)',
    gentle: '0 10px 30px -10px hsl(35 20% 40% / 0.12), 0 2px 8px -2px hsl(35 15% 50% / 0.06)',
    elevated: '0 16px 40px -8px hsl(35 20% 40% / 0.15)',
    focus: '0 0 0 3px hsl(150 25% 45% / 0.15)',
    calm: '0 12px 32px -8px hsl(35 20% 40% / 0.12), 0 4px 16px -4px hsl(150 25% 45% / 0.08)',
    glass: '0 8px 32px rgba(31, 38, 50, 0.08)',
    dreamy: '0 0 40px hsl(35 30% 90% / 0.5), 0 8px 24px hsl(150 25% 45% / 0.12)',
  },

  // Rounder border radius for wellness feel
  borderRadius: {
    none: '0px',
    xs: '0.125rem',    // 2px
    sm: '0.25rem',     // 4px
    md: '0.5rem',      // 8px
    lg: '0.75rem',     // 12px
    xl: '1rem',        // 16px (default)
    '2xl': '1.25rem',  // 20px
    '3xl': '1.5rem',   // 24px
    '4xl': '2rem',     // 32px
    full: '9999px',
  },

  // Border system
  borderWidth: {
    0: '0px',
    0.5: '0.5px',
    1: '1px',
    1.5: '1.5px',
    2: '2px',
    3: '3px',
    4: '4px',
    6: '6px',
    8: '8px',
  },

  // Gentle backdrop blur for soft glass effects
  backdropBlur: {
    none: 'blur(0)',
    xs: 'blur(2px)',
    sm: 'blur(4px)',
    md: 'blur(12px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
    '2xl': 'blur(40px)',
    '3xl': 'blur(64px)',
    subtle: 'blur(8px) saturate(120%)',
    wellness: 'blur(16px) saturate(130%) brightness(105%)',
  },

  // Wellness gradient system - soft, low saturation, calming
  gradients: {
    // Wellness brand gradients
    brand: {
      primary: 'linear-gradient(135deg, hsl(150, 25%, 45%) 0%, hsl(150, 22%, 52%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(35, 30%, 85%) 0%, hsl(25, 28%, 78%) 100%)',
      accent: 'linear-gradient(135deg, hsl(40, 40%, 96%) 0%, hsl(30, 35%, 90%) 100%)',
      calm: 'linear-gradient(135deg, hsl(40, 30%, 98%) 0%, hsl(35, 25%, 95%) 50%, hsl(40, 20%, 97%) 100%)',
      earth: 'linear-gradient(135deg, hsl(35, 30%, 85%) 0%, hsl(25, 28%, 78%) 50%, hsl(40, 25%, 92%) 100%)',
      meadow: 'linear-gradient(135deg, hsl(150, 25%, 45% / 0.1) 0%, hsl(120, 20%, 50% / 0.08) 100%)',
      sunrise: 'linear-gradient(135deg, hsl(40, 40%, 96%) 0%, hsl(30, 35%, 90%) 50%, hsl(45, 30%, 94%) 100%)',
    },
    
    // Surface gradients - subtle warmth
    surface: {
      subtle: 'linear-gradient(135deg, hsl(40, 25%, 98%) 0%, hsl(35, 20%, 96%) 100%)',
      warm: 'linear-gradient(135deg, hsl(35, 30%, 97%) 0%, hsl(30, 25%, 95%) 100%)',
      soft: 'linear-gradient(135deg, hsl(150, 25%, 45% / 0.03) 0%, hsl(25, 35%, 55% / 0.05) 100%)',
      medium: 'linear-gradient(135deg, hsl(150, 25%, 45% / 0.06) 0%, hsl(25, 35%, 55% / 0.10) 100%)',
      rich: 'linear-gradient(135deg, hsl(150, 25%, 45% / 0.10) 0%, hsl(25, 35%, 55% / 0.15) 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
    },

    // Nature-inspired effect gradients
    special: {
      forest: 'linear-gradient(135deg, hsl(150, 25%, 45% / 0.3) 0%, hsl(145, 30%, 50% / 0.2) 50%, hsl(160, 20%, 55% / 0.1) 100%)',
      desert: 'radial-gradient(circle at 30% 20%, hsl(35, 30%, 75% / 0.2) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(25, 35%, 70% / 0.15) 0%, transparent 50%)',
      shimmer: 'linear-gradient(45deg, transparent 30%, hsl(150, 25%, 45% / 0.08) 50%, transparent 70%)',
    },
  },
};

// Animation and transition tokens - slower, gentler for wellness feel
export const animationTokens = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    400: '400ms',  // New default
    500: '500ms',
    600: '600ms',
    700: '700ms',
    1000: '1000ms',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',  // Gentler easing
    calm: 'cubic-bezier(0.2, 0, 0.1, 1)',        // Very smooth
  },

  transition: {
    none: 'none',
    all: 'all 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    colors: 'color 400ms cubic-bezier(0.25, 0.1, 0.25, 1), background-color 400ms cubic-bezier(0.25, 0.1, 0.25, 1), border-color 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    opacity: 'opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    shadow: 'box-shadow 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
    transform: 'transform 400ms cubic-bezier(0.25, 0.1, 0.25, 1)',
  }
};
