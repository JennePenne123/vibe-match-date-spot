// Design system tokens index
export { colorTokens, figmaTokens } from './colors';
export { spacingTokens, semanticSpacing } from './spacing';
export { typographyTokens, typographyStyles } from './typography';
export { effectTokens, animationTokens } from './effects';

// Combined token object for easy access
import { colorTokens } from './colors';
import { spacingTokens, semanticSpacing } from './spacing';
import { typographyTokens } from './typography';
import { effectTokens, animationTokens } from './effects';

export const tokens = {
  colors: colorTokens,
  spacing: spacingTokens,
  typography: typographyTokens,
  effects: effectTokens,
  animations: animationTokens,
};

// Figma Design Token Studio compatible export
export const designTokensForFigma = {
  "global": {
    "color": {
      "brand": {
        "primary": {
          "50": { "value": colorTokens.brand.primary[50], "type": "color" },
          "100": { "value": colorTokens.brand.primary[100], "type": "color" },
          "200": { "value": colorTokens.brand.primary[200], "type": "color" },
          "300": { "value": colorTokens.brand.primary[300], "type": "color" },
          "400": { "value": colorTokens.brand.primary[400], "type": "color" },
          "500": { "value": colorTokens.brand.primary[500], "type": "color" },
          "600": { "value": colorTokens.brand.primary[600], "type": "color" },
          "700": { "value": colorTokens.brand.primary[700], "type": "color" },
          "800": { "value": colorTokens.brand.primary[800], "type": "color" },
          "900": { "value": colorTokens.brand.primary[900], "type": "color" }
        }
      }
    },
    "spacing": {
      "xs": { "value": "4px", "type": "spacing" },
      "sm": { "value": "8px", "type": "spacing" },
      "md": { "value": "16px", "type": "spacing" },
      "lg": { "value": "24px", "type": "spacing" },
      "xl": { "value": "32px", "type": "spacing" }
    },
    "borderRadius": {
      "sm": { "value": "4px", "type": "borderRadius" },
      "md": { "value": "6px", "type": "borderRadius" },
      "lg": { "value": "8px", "type": "borderRadius" },
      "xl": { "value": "12px", "type": "borderRadius" }
    }
  }
};

// Builder.io compatible theme export
export const builderTheme = {
  colors: {
    primary: colorTokens.brand.primary[500],
    secondary: colorTokens.brand.secondary[500],
    accent: colorTokens.brand.accent[500],
    success: colorTokens.semantic.success[500],
    warning: colorTokens.semantic.warning[500],
    error: colorTokens.semantic.error[500],
  },
  spacing: semanticSpacing.component,
  fonts: {
    primary: typographyTokens.fontFamily.sans.join(', '),
    display: typographyTokens.fontFamily.display.join(', '),
  }
};