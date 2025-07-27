// Design system color tokens
export const colorTokens = {
  // Brand palette expansion - DateSpot pink theme
  brand: {
    primary: {
      50: 'hsl(330, 81%, 97%)',   // Very light pink
      100: 'hsl(330, 77%, 94%)',  // Light pink
      200: 'hsl(330, 71%, 85%)',  // Lighter pink
      300: 'hsl(330, 70%, 74%)',  // Light-medium pink
      400: 'hsl(330, 68%, 64%)',  // Medium pink
      500: 'hsl(330, 81%, 60%)',  // DateSpot primary pink
      600: 'hsl(330, 81%, 52%)',  // Darker pink
      700: 'hsl(330, 80%, 45%)',  // Dark pink
      800: 'hsl(330, 82%, 36%)',  // Very dark pink
      900: 'hsl(330, 84%, 27%)',  // Darkest pink
    },
    secondary: {
      50: 'hsl(351, 100%, 97%)',
      100: 'hsl(351, 100%, 93%)',
      200: 'hsl(351, 96%, 85%)',
      300: 'hsl(351, 95%, 75%)',
      400: 'hsl(351, 94%, 65%)',
      500: 'hsl(351, 86%, 55%)',
      600: 'hsl(351, 83%, 48%)',
      700: 'hsl(351, 81%, 40%)',
      800: 'hsl(351, 84%, 32%)',
      900: 'hsl(351, 88%, 24%)',
    },
    accent: {
      50: 'hsl(195, 100%, 95%)',
      100: 'hsl(195, 93%, 88%)',
      200: 'hsl(195, 98%, 77%)',
      300: 'hsl(195, 96%, 64%)',
      400: 'hsl(195, 93%, 52%)',
      500: 'hsl(195, 87%, 45%)',
      600: 'hsl(195, 85%, 38%)',
      700: 'hsl(195, 87%, 31%)',
      800: 'hsl(195, 90%, 25%)',
      900: 'hsl(195, 94%, 20%)',
    }
  },

  // Semantic colors
  semantic: {
    success: {
      50: 'hsl(138, 76%, 97%)',
      100: 'hsl(141, 84%, 93%)',
      200: 'hsl(141, 78%, 85%)',
      300: 'hsl(142, 77%, 73%)',
      400: 'hsl(142, 69%, 58%)',
      500: 'hsl(142, 71%, 45%)',
      600: 'hsl(142, 76%, 36%)',
      700: 'hsl(142, 72%, 29%)',
      800: 'hsl(143, 64%, 24%)',
      900: 'hsl(144, 61%, 20%)',
    },
    warning: {
      50: 'hsl(48, 100%, 96%)',
      100: 'hsl(48, 96%, 89%)',
      200: 'hsl(48, 97%, 77%)',
      300: 'hsl(46, 97%, 65%)',
      400: 'hsl(43, 96%, 56%)',
      500: 'hsl(38, 92%, 50%)',
      600: 'hsl(32, 95%, 44%)',
      700: 'hsl(26, 90%, 37%)',
      800: 'hsl(23, 83%, 31%)',
      900: 'hsl(22, 78%, 26%)',
    },
    error: {
      50: 'hsl(0, 86%, 97%)',
      100: 'hsl(0, 93%, 94%)',
      200: 'hsl(0, 96%, 89%)',
      300: 'hsl(0, 94%, 82%)',
      400: 'hsl(0, 91%, 71%)',
      500: 'hsl(0, 84%, 60%)',
      600: 'hsl(0, 72%, 51%)',
      700: 'hsl(0, 74%, 42%)',
      800: 'hsl(0, 70%, 35%)',
      900: 'hsl(0, 63%, 31%)',
    }
  },

  // Enhanced neutral palette
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