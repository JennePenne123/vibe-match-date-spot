// Design system color tokens
export const colorTokens = {
  // Premium Brand palette - Enhanced DateSpot theme
  brand: {
    primary: {
      50: 'hsl(330, 85%, 98%)',   // Rose Quartz
      100: 'hsl(330, 82%, 95%)',  // Soft Blush
      200: 'hsl(330, 78%, 88%)',  // Warm Blush
      300: 'hsl(330, 75%, 78%)',  // Light Romance
      400: 'hsl(330, 72%, 68%)',  // Medium Romance
      500: 'hsl(330, 81%, 60%)',  // Romantic Pink (DateSpot primary)
      600: 'hsl(330, 84%, 52%)',  // Deep Romance
      700: 'hsl(330, 87%, 45%)',  // Rich Romance
      800: 'hsl(330, 90%, 38%)',  // Dark Romance
      900: 'hsl(330, 94%, 28%)',  // Midnight Romance
    },
    secondary: {
      50: 'hsl(351, 100%, 98%)',  // Soft Coral
      100: 'hsl(351, 95%, 94%)',  // Light Coral
      200: 'hsl(351, 90%, 87%)',  // Warm Coral
      300: 'hsl(351, 88%, 78%)',  // Medium Coral
      400: 'hsl(351, 85%, 68%)',  // Rich Coral
      500: 'hsl(351, 86%, 55%)',  // Vibrant Coral
      600: 'hsl(351, 88%, 48%)',  // Deep Coral
      700: 'hsl(351, 90%, 40%)',  // Dark Coral
      800: 'hsl(351, 92%, 32%)',  // Very Dark Coral
      900: 'hsl(351, 95%, 24%)',  // Midnight Coral
    },
    accent: {
      50: 'hsl(45, 90%, 96%)',    // Champagne
      100: 'hsl(45, 85%, 90%)',   // Light Gold
      200: 'hsl(42, 82%, 82%)',   // Soft Gold
      300: 'hsl(40, 80%, 72%)',   // Warm Gold
      400: 'hsl(38, 78%, 62%)',   // Golden Hour
      500: 'hsl(35, 75%, 55%)',   // Rich Gold
      600: 'hsl(32, 78%, 48%)',   // Deep Gold
      700: 'hsl(30, 82%, 40%)',   // Dark Gold
      800: 'hsl(28, 85%, 32%)',   // Very Dark Gold
      900: 'hsl(25, 88%, 24%)',   // Midnight Gold
    }
  },

  // Enhanced semantic colors with premium feel
  semantic: {
    success: {
      50: 'hsl(138, 85%, 98%)',
      100: 'hsl(141, 88%, 94%)',
      200: 'hsl(141, 85%, 87%)',
      300: 'hsl(142, 82%, 76%)',
      400: 'hsl(142, 78%, 62%)',
      500: 'hsl(142, 76%, 48%)',
      600: 'hsl(142, 80%, 38%)',
      700: 'hsl(142, 82%, 30%)',
      800: 'hsl(143, 85%, 22%)',
      900: 'hsl(144, 88%, 18%)',
    },
    warning: {
      50: 'hsl(48, 100%, 97%)',
      100: 'hsl(48, 98%, 91%)',
      200: 'hsl(48, 95%, 80%)',
      300: 'hsl(46, 92%, 68%)',
      400: 'hsl(43, 90%, 58%)',
      500: 'hsl(38, 88%, 52%)',
      600: 'hsl(32, 90%, 46%)',
      700: 'hsl(26, 92%, 39%)',
      800: 'hsl(23, 88%, 33%)',
      900: 'hsl(22, 85%, 28%)',
    },
    error: {
      50: 'hsl(0, 90%, 98%)',
      100: 'hsl(0, 95%, 95%)',
      200: 'hsl(0, 92%, 90%)',
      300: 'hsl(0, 90%, 84%)',
      400: 'hsl(0, 88%, 73%)',
      500: 'hsl(0, 85%, 62%)',
      600: 'hsl(0, 82%, 53%)',
      700: 'hsl(0, 85%, 44%)',
      800: 'hsl(0, 88%, 37%)',
      900: 'hsl(0, 92%, 33%)',
    }
  },

  // Premium neutral palette with warm undertones
  neutral: {
    50: 'hsl(330, 20%, 99%)',    // Warm White
    100: 'hsl(330, 15%, 97%)',   // Soft White
    200: 'hsl(330, 12%, 93%)',   // Light Warm
    300: 'hsl(330, 10%, 86%)',   // Soft Warm
    400: 'hsl(330, 8%, 68%)',    // Medium Warm
    500: 'hsl(330, 6%, 48%)',    // Balanced Warm
    600: 'hsl(330, 8%, 36%)',    // Deep Warm
    700: 'hsl(330, 12%, 28%)',   // Rich Warm
    800: 'hsl(330, 16%, 18%)',   // Dark Warm
    900: 'hsl(330, 22%, 12%)',   // Midnight Warm
  },

  // Traditional gray for contrast
  gray: {
    50: 'hsl(210, 20%, 98%)',
    100: 'hsl(220, 14%, 96%)',
    200: 'hsl(220, 13%, 91%)',
    300: 'hsl(216, 12%, 84%)',
    400: 'hsl(218, 11%, 65%)',
    500: 'hsl(220, 9%, 46%)',
    600: 'hsl(215, 14%, 34%)',
    700: 'hsl(217, 19%, 27%)',
    800: 'hsl(215, 28%, 17%)',
    900: 'hsl(221, 39%, 11%)',
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
      }
    }
  }
};