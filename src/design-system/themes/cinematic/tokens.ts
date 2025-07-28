// Cinematic Design System - Premium & Cinematic Theme
export const cinematicTokens = {
  // Cinematic Color Palette - Dark-first with premium accents
  colors: {
    brand: {
      primary: {
        50: "hsl(45, 100%, 96%)",   // Champagne light
        100: "hsl(45, 94%, 88%)",
        200: "hsl(43, 89%, 78%)",
        300: "hsl(41, 86%, 68%)",
        400: "hsl(39, 85%, 58%)",
        500: "hsl(37, 84%, 48%)",   // Premium gold
        600: "hsl(35, 82%, 38%)",
        700: "hsl(33, 80%, 28%)",
        800: "hsl(31, 78%, 18%)",
        900: "hsl(29, 76%, 8%)"
      },
      secondary: {
        50: "hsl(220, 25%, 96%)",
        100: "hsl(220, 20%, 88%)",
        200: "hsl(220, 18%, 78%)",
        300: "hsl(220, 16%, 68%)",
        400: "hsl(220, 14%, 58%)",
        500: "hsl(220, 12%, 48%)",   // Platinum
        600: "hsl(220, 10%, 38%)",
        700: "hsl(220, 8%, 28%)",
        800: "hsl(220, 6%, 18%)",
        900: "hsl(220, 4%, 8%)"
      },
      accent: {
        50: "hsl(280, 25%, 96%)",
        100: "hsl(280, 20%, 88%)",
        200: "hsl(280, 18%, 78%)",
        300: "hsl(280, 16%, 68%)",
        400: "hsl(280, 14%, 58%)",
        500: "hsl(280, 12%, 48%)",   // Deep purple
        600: "hsl(280, 10%, 38%)",
        700: "hsl(280, 8%, 28%)",
        800: "hsl(280, 6%, 18%)",
        900: "hsl(280, 4%, 8%)"
      }
    },

    // Cinematic surface colors with depth
    surface: {
      primary: "hsl(240, 8%, 4%)",      // Deep black
      secondary: "hsl(240, 6%, 8%)",    // Rich charcoal
      tertiary: "hsl(240, 4%, 12%)",    // Elevated dark
      glass: "hsl(240, 8%, 4% / 0.8)",  // Glass morphism
      overlay: "hsl(240, 8%, 4% / 0.9)" // Modal overlay
    },

    // Cinematic text hierarchy
    text: {
      primary: "hsl(45, 100%, 96%)",    // Champagne white
      secondary: "hsl(45, 50%, 80%)",   // Warm secondary
      muted: "hsl(220, 12%, 60%)",      // Platinum muted
      inverse: "hsl(240, 8%, 4%)"       // Deep black
    }
  },

  // Cinematic typography with dramatic scale
  typography: {
    scale: {
      display: {
        sm: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        md: ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        lg: ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.04em' }],
        xl: ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }]
      },
      headline: {
        sm: ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        md: ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        lg: ['3rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }]
      },
      body: {
        sm: ['0.875rem', { lineHeight: '1.6' }],
        md: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.5' }]
      }
    },
    weights: {
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900
    }
  },

  // Cinematic spacing with dramatic scale
  spacing: {
    cinematic: {
      xs: '0.5rem',    // 8px
      sm: '1rem',      // 16px
      md: '2rem',      // 32px
      lg: '3rem',      // 48px
      xl: '4rem',      // 64px
      '2xl': '6rem',   // 96px
      '3xl': '8rem',   // 128px
      '4xl': '12rem'   // 192px
    }
  },

  // Cinematic effects with depth and drama
  effects: {
    // Dramatic shadows with gold glow
    shadows: {
      glow: {
        sm: '0 0 10px hsl(37, 84%, 48% / 0.3)',
        md: '0 0 20px hsl(37, 84%, 48% / 0.4)',
        lg: '0 0 40px hsl(37, 84%, 48% / 0.5)',
        xl: '0 0 80px hsl(37, 84%, 48% / 0.6)'
      },
      depth: {
        sm: '0 4px 20px hsl(240, 8%, 4% / 0.3)',
        md: '0 8px 40px hsl(240, 8%, 4% / 0.4)',
        lg: '0 16px 60px hsl(240, 8%, 4% / 0.5)',
        xl: '0 24px 80px hsl(240, 8%, 4% / 0.6)'
      },
      layered: {
        sm: '0 4px 20px hsl(240, 8%, 4% / 0.3), 0 0 10px hsl(37, 84%, 48% / 0.2)',
        md: '0 8px 40px hsl(240, 8%, 4% / 0.4), 0 0 20px hsl(37, 84%, 48% / 0.3)',
        lg: '0 16px 60px hsl(240, 8%, 4% / 0.5), 0 0 40px hsl(37, 84%, 48% / 0.4)'
      }
    },

    // Glass morphism effects
    glass: {
      subtle: 'backdrop-blur(8px) saturate(180%)',
      medium: 'backdrop-blur(16px) saturate(180%)',
      strong: 'backdrop-blur(24px) saturate(180%)'
    },

    // Cinematic gradients
    gradients: {
      hero: 'linear-gradient(135deg, hsl(240, 8%, 4%) 0%, hsl(240, 6%, 8%) 50%, hsl(37, 84%, 48% / 0.1) 100%)',
      surface: 'linear-gradient(180deg, hsl(240, 6%, 8%) 0%, hsl(240, 4%, 12%) 100%)',
      glow: 'radial-gradient(circle at center, hsl(37, 84%, 48% / 0.3) 0%, transparent 70%)',
      overlay: 'linear-gradient(180deg, transparent 0%, hsl(240, 8%, 4% / 0.8) 100%)'
    }
  },

  // Cinematic animations with smooth, dramatic motion
  animations: {
    duration: {
      fast: '200ms',
      medium: '400ms',
      slow: '600ms',
      cinematic: '1000ms'
    },
    easing: {
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      dramatic: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      cinematic: 'cubic-bezier(0.23, 1, 0.32, 1)'
    }
  }
};

// Cinematic component variants
export const cinematicVariants = {
  button: {
    hero: 'bg-gradient-to-r from-gold-500 to-gold-600 text-surface-primary shadow-glow-lg hover:shadow-glow-xl transition-all duration-medium',
    glass: 'bg-surface-glass backdrop-blur-medium border border-gold-500/20 text-text-primary hover:border-gold-500/40 transition-all duration-medium',
    minimal: 'text-text-primary hover:text-gold-500 transition-colors duration-fast'
  },
  
  card: {
    glass: 'bg-surface-glass backdrop-blur-medium border border-surface-tertiary/20 shadow-layered-md',
    elevated: 'bg-surface-secondary shadow-depth-lg border border-surface-tertiary/10',
    hero: 'bg-gradient-hero shadow-layered-lg border border-gold-500/10'
  },

  typography: {
    display: 'font-display font-black text-text-primary',
    headline: 'font-sans font-bold text-text-primary',
    body: 'font-sans font-regular text-text-secondary'
  }
};