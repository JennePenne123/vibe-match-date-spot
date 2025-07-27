// Design system typography tokens
export const typographyTokens = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    display: ['Playfair Display', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px/16px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px/20px
    base: ['1rem', { lineHeight: '1.5rem' }],      // 16px/24px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],   // 18px/28px
    xl: ['1.25rem', { lineHeight: '1.875rem' }],   // 20px/30px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px/32px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px/36px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px/40px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],       // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],        // 72px
    '8xl': ['6rem', { lineHeight: '1' }],          // 96px
    '9xl': ['8rem', { lineHeight: '1' }],          // 128px
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  }
};

// Semantic typography styles
export const typographyStyles = {
  // Display headings (Playfair Display)
  display: {
    '2xl': {
      fontFamily: typographyTokens.fontFamily.display,
      fontSize: typographyTokens.fontSize['5xl'],
      fontWeight: typographyTokens.fontWeight.bold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    xl: {
      fontFamily: typographyTokens.fontFamily.display,
      fontSize: typographyTokens.fontSize['4xl'],
      fontWeight: typographyTokens.fontWeight.bold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
    lg: {
      fontFamily: typographyTokens.fontFamily.display,
      fontSize: typographyTokens.fontSize['3xl'],
      fontWeight: typographyTokens.fontWeight.semibold,
      letterSpacing: typographyTokens.letterSpacing.tight,
    },
  },
  
  // Headings (Inter)
  heading: {
    h1: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize['2xl'],
      fontWeight: typographyTokens.fontWeight.bold,
      lineHeight: typographyTokens.lineHeight.tight,
    },
    h2: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize.xl,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.tight,
    },
    h3: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize.lg,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: typographyTokens.lineHeight.snug,
    },
  },
  
  // Body text
  body: {
    lg: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize.lg,
      fontWeight: typographyTokens.fontWeight.normal,
      lineHeight: typographyTokens.lineHeight.relaxed,
    },
    base: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize.base,
      fontWeight: typographyTokens.fontWeight.normal,
      lineHeight: typographyTokens.lineHeight.relaxed,
    },
    sm: {
      fontFamily: typographyTokens.fontFamily.sans,
      fontSize: typographyTokens.fontSize.sm,
      fontWeight: typographyTokens.fontWeight.normal,
      lineHeight: typographyTokens.lineHeight.normal,
    },
  },
  
  // Captions and labels
  caption: {
    fontFamily: typographyTokens.fontFamily.sans,
    fontSize: typographyTokens.fontSize.xs,
    fontWeight: typographyTokens.fontWeight.medium,
    lineHeight: typographyTokens.lineHeight.normal,
    letterSpacing: typographyTokens.letterSpacing.wide,
    textTransform: 'uppercase',
  }
};