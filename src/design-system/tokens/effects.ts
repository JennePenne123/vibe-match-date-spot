// Design system effects tokens (shadows, borders, etc.)
export const effectTokens = {
  // Shadow system
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

  // Brand-specific shadows (with DateSpot pink)
  brandShadow: {
    sm: '0 1px 3px 0 hsl(330 81% 60% / 0.1), 0 1px 2px -1px hsl(330 81% 60% / 0.1)',
    md: '0 4px 6px -1px hsl(330 81% 60% / 0.1), 0 2px 4px -2px hsl(330 81% 60% / 0.1)',
    lg: '0 10px 15px -3px hsl(330 81% 60% / 0.1), 0 4px 6px -4px hsl(330 81% 60% / 0.1)',
    glow: '0 0 20px hsl(330 81% 60% / 0.3)',
  },

  // Border radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',     // 2px
    md: '0.25rem',      // 4px
    DEFAULT: '0.375rem', // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    '3xl': '1.5rem',    // 24px
    full: '9999px',
  },

  // Border widths
  borderWidth: {
    0: '0px',
    DEFAULT: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  // Backdrop filters
  backdropBlur: {
    none: 'blur(0)',
    sm: 'blur(4px)',
    md: 'blur(8px)',
    lg: 'blur(16px)',
    xl: 'blur(24px)',
    '2xl': 'blur(40px)',
    '3xl': 'blur(64px)',
  },

  // Gradients
  gradients: {
    brand: {
      primary: 'linear-gradient(135deg, hsl(330 81% 60%), hsl(330 81% 52%))',
      secondary: 'linear-gradient(135deg, hsl(351 86% 55%), hsl(351 83% 48%))',
      accent: 'linear-gradient(135deg, hsl(195 87% 45%), hsl(195 85% 38%))',
    },
    surface: {
      subtle: 'linear-gradient(135deg, hsl(210 20% 98%), hsl(220 14% 96%))',
      card: 'linear-gradient(135deg, hsl(0 0% 100%), hsl(220 14% 96%))',
    }
  }
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