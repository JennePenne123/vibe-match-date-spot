// Design system effects tokens (shadows, borders, etc.)
export const effectTokens = {
  // Premium shadow system with layered depths
  boxShadow: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: '0 0 #0000',
  },

  // Premium brand shadows with sophisticated layering
  brandShadow: {
    subtle: '0 2px 8px -2px hsl(330 81% 60% / 0.12)',
    soft: '0 4px 16px -4px hsl(330 81% 60% / 0.18)',
    medium: '0 8px 24px -6px hsl(330 81% 60% / 0.24)',
    elegant: '0 10px 30px -10px hsl(330 81% 60% / 0.3), 0 2px 8px -2px hsl(330 81% 60% / 0.1)',
    strong: '0 16px 40px -8px hsl(330 81% 60% / 0.32)',
    glow: '0 0 24px hsl(330 81% 60% / 0.35), 0 0 48px hsl(330 81% 60% / 0.2)',
    romantic: '0 12px 32px -8px hsl(330 81% 60% / 0.4), 0 4px 16px -4px hsl(330 81% 60% / 0.2), 0 0 0 1px hsl(330 81% 60% / 0.08)',
    glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
    dreamy: '0 0 40px hsl(330 85% 95% / 0.8), 0 8px 24px hsl(330 81% 60% / 0.25)',
  },

  // Enhanced border radius with premium curves
  borderRadius: {
    none: '0px',
    xs: '0.0625rem',   // 1px
    sm: '0.125rem',    // 2px
    md: '0.375rem',    // 6px
    lg: '0.5rem',      // 8px
    xl: '0.75rem',     // 12px
    '2xl': '1rem',     // 16px
    '3xl': '1.5rem',   // 24px
    '4xl': '2rem',     // 32px
    full: '9999px',
  },

  // Premium border system
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

  // Advanced backdrop blur for premium glass effects
  backdropBlur: {
    none: 'blur(0)',
    xs: 'blur(2px)',
    sm: 'blur(4px)',
    md: 'blur(12px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
    '2xl': 'blur(40px)',
    '3xl': 'blur(64px)',
    subtle: 'blur(8px) saturate(150%)',
    premium: 'blur(16px) saturate(180%) brightness(110%)',
  },

  // Premium gradient system with sophisticated color transitions
  gradients: {
    // Enhanced brand gradients
    brand: {
      primary: 'linear-gradient(135deg, hsl(330, 81%, 60%) 0%, hsl(330, 84%, 52%) 100%)',
      secondary: 'linear-gradient(135deg, hsl(351, 86%, 55%) 0%, hsl(351, 88%, 48%) 100%)',
      accent: 'linear-gradient(135deg, hsl(45, 90%, 96%) 0%, hsl(35, 75%, 55%) 100%)',
      romantic: 'linear-gradient(135deg, hsl(330, 81%, 60%) 0%, hsl(351, 86%, 55%) 50%, hsl(330, 85%, 95%) 100%)',
      sunset: 'linear-gradient(135deg, hsl(351, 86%, 55%) 0%, hsl(38, 88%, 52%) 30%, hsl(45, 90%, 96%) 70%, hsl(330, 82%, 95%) 100%)',
      dreamy: 'linear-gradient(135deg, hsl(330, 85%, 98%) 0%, hsl(330, 82%, 95%) 25%, hsl(351, 95%, 94%) 50%, hsl(45, 85%, 90%) 75%, hsl(330, 85%, 98%) 100%)',
      luxe: 'linear-gradient(135deg, hsl(330, 94%, 28%) 0%, hsl(330, 81%, 60%) 50%, hsl(351, 86%, 55%) 100%)',
    },
    
    // Surface gradients with premium feel
    surface: {
      subtle: 'linear-gradient(135deg, hsl(330, 85%, 98%) 0%, hsl(330, 82%, 95%) 100%)',
      warm: 'linear-gradient(135deg, hsl(330, 20%, 99%) 0%, hsl(330, 15%, 97%) 100%)',
      soft: 'linear-gradient(135deg, hsl(330, 81%, 60% / 0.03) 0%, hsl(351, 86%, 55% / 0.08) 100%)',
      medium: 'linear-gradient(135deg, hsl(330, 81%, 60% / 0.08) 0%, hsl(351, 86%, 55% / 0.15) 100%)',
      rich: 'linear-gradient(135deg, hsl(330, 81%, 60% / 0.15) 0%, hsl(351, 86%, 55% / 0.25) 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
    },

    // Special effect gradients
    special: {
      aurora: 'linear-gradient(135deg, hsl(330, 81%, 60% / 0.8) 0%, hsl(351, 86%, 55% / 0.6) 25%, hsl(45, 90%, 96% / 0.4) 50%, hsl(195, 87%, 45% / 0.6) 75%, hsl(330, 81%, 60% / 0.8) 100%)',
      cosmic: 'radial-gradient(circle at 30% 20%, hsl(330, 81%, 60% / 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 80%, hsl(351, 86%, 55% / 0.2) 0%, transparent 50%)',
      shimmer: 'linear-gradient(45deg, transparent 30%, hsl(330, 81%, 60% / 0.1) 50%, transparent 70%)',
    },
  },
};

// Animation and transition tokens
export const animationTokens = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
    elastic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  transition: {
    none: 'none',
    all: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors: 'color 150ms cubic-bezier(0.4, 0, 0.2, 1), background-color 150ms cubic-bezier(0.4, 0, 0.2, 1), border-color 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 150ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  }
};