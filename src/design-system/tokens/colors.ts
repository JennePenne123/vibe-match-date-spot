// Design system color tokens - Wellness-Inspired Earth Tones
export const colorTokens = {
  // Wellness Brand palette - Calm, grounded, reassuring
  brand: {
    // Muted Sage Green - Primary
    primary: {
      50: 'hsl(150, 30%, 97%)',
      100: 'hsl(150, 28%, 92%)',
      200: 'hsl(150, 26%, 85%)',
      300: 'hsl(150, 25%, 72%)',
      400: 'hsl(150, 24%, 58%)',
      500: 'hsl(150, 25%, 45%)',  // Main sage green
      600: 'hsl(150, 28%, 38%)',
      700: 'hsl(150, 30%, 32%)',
      800: 'hsl(150, 32%, 26%)',
      900: 'hsl(150, 35%, 20%)',
    },
    // Warm Sand - Secondary
    secondary: {
      50: 'hsl(35, 40%, 97%)',
      100: 'hsl(35, 35%, 92%)',
      200: 'hsl(35, 30%, 85%)',
      300: 'hsl(35, 28%, 75%)',
      400: 'hsl(35, 25%, 62%)',
      500: 'hsl(35, 22%, 50%)',
      600: 'hsl(35, 25%, 42%)',
      700: 'hsl(35, 28%, 35%)',
      800: 'hsl(35, 30%, 28%)',
      900: 'hsl(35, 32%, 22%)',
    },
    // Soft Terracotta - Accent
    accent: {
      50: 'hsl(25, 45%, 97%)',
      100: 'hsl(25, 40%, 92%)',
      200: 'hsl(25, 38%, 82%)',
      300: 'hsl(25, 36%, 70%)',
      400: 'hsl(25, 35%, 60%)',
      500: 'hsl(25, 35%, 55%)',  // Soft terracotta
      600: 'hsl(25, 38%, 48%)',
      700: 'hsl(25, 40%, 40%)',
      800: 'hsl(25, 42%, 32%)',
      900: 'hsl(25, 45%, 25%)',
    }
  },

  // Softer semantic colors for wellness feel
  semantic: {
    success: {
      50: 'hsl(145, 45%, 97%)',
      100: 'hsl(145, 42%, 92%)',
      200: 'hsl(145, 40%, 85%)',
      300: 'hsl(145, 38%, 72%)',
      400: 'hsl(145, 35%, 55%)',
      500: 'hsl(145, 40%, 42%)',  // Forest green
      600: 'hsl(145, 42%, 38%)',
      700: 'hsl(145, 45%, 32%)',
      800: 'hsl(145, 48%, 25%)',
      900: 'hsl(145, 50%, 20%)',
    },
    warning: {
      50: 'hsl(40, 80%, 97%)',
      100: 'hsl(40, 75%, 92%)',
      200: 'hsl(40, 72%, 82%)',
      300: 'hsl(40, 70%, 68%)',
      400: 'hsl(40, 68%, 58%)',
      500: 'hsl(40, 70%, 50%)',  // Warm amber
      600: 'hsl(40, 72%, 45%)',
      700: 'hsl(40, 75%, 38%)',
      800: 'hsl(40, 78%, 32%)',
      900: 'hsl(40, 80%, 25%)',
    },
    error: {
      50: 'hsl(0, 60%, 97%)',
      100: 'hsl(0, 55%, 92%)',
      200: 'hsl(0, 52%, 85%)',
      300: 'hsl(0, 50%, 75%)',
      400: 'hsl(0, 48%, 65%)',
      500: 'hsl(0, 50%, 55%)',  // Dusty rose
      600: 'hsl(0, 52%, 50%)',
      700: 'hsl(0, 55%, 42%)',
      800: 'hsl(0, 58%, 35%)',
      900: 'hsl(0, 60%, 28%)',
    }
  },

  // Warm neutral palette with earth undertones
  neutral: {
    50: 'hsl(40, 30%, 98%)',   // Warm cream
    100: 'hsl(40, 25%, 96%)',
    200: 'hsl(35, 20%, 92%)',
    300: 'hsl(35, 18%, 85%)',
    400: 'hsl(35, 15%, 65%)',
    500: 'hsl(35, 12%, 48%)',
    600: 'hsl(35, 15%, 36%)',
    700: 'hsl(35, 18%, 28%)',
    800: 'hsl(35, 20%, 18%)',
    900: 'hsl(35, 22%, 12%)',  // Deep warm charcoal
  },

  // Traditional gray for contrast elements
  gray: {
    50: 'hsl(35, 15%, 98%)',
    100: 'hsl(35, 12%, 96%)',
    200: 'hsl(35, 10%, 91%)',
    300: 'hsl(35, 8%, 84%)',
    400: 'hsl(35, 6%, 65%)',
    500: 'hsl(35, 5%, 46%)',
    600: 'hsl(35, 8%, 34%)',
    700: 'hsl(35, 12%, 27%)',
    800: 'hsl(35, 15%, 17%)',
    900: 'hsl(35, 18%, 11%)',
  }
};

// Figma sync compatible format
export const figmaTokens = {
  "color": {
    "brand": {
      "primary": {
        "50": { "value": colorTokens.brand.primary[50], "type": "color" },
        "100": { "value": colorTokens.brand.primary[100], "type": "color" },
        "500": { "value": colorTokens.brand.primary[500], "type": "color" },
        "900": { "value": colorTokens.brand.primary[900], "type": "color" }
      },
      "secondary": {
        "50": { "value": colorTokens.brand.secondary[50], "type": "color" },
        "500": { "value": colorTokens.brand.secondary[500], "type": "color" },
      },
      "accent": {
        "50": { "value": colorTokens.brand.accent[50], "type": "color" },
        "500": { "value": colorTokens.brand.accent[500], "type": "color" },
      }
    }
  }
};
