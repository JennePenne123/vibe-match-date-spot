# DateSpot Design System

A comprehensive design system for the DateSpot dating app, built with React, TypeScript, Tailwind CSS, and modern design principles.

## 🎨 Features

- **Comprehensive Design Tokens**: Colors, spacing, typography, effects, and animations
- **Enhanced Components**: Extended shadcn/ui components with additional variants
- **Typography System**: Inter + Playfair Display with semantic sizing
- **Brand Integration**: DateSpot pink theme with semantic color meanings
- **Dark Mode Support**: Fully compatible dark mode implementation
- **Figma Integration**: Design token sync and component library export
- **Builder.io Support**: Visual editing and page building capabilities

## 📁 Structure

```
src/design-system/
├── tokens/                 # Design tokens
│   ├── colors.ts          # Color palette and semantic colors
│   ├── spacing.ts         # Spacing scale and semantic spacing
│   ├── typography.ts      # Font families, sizes, and styles
│   ├── effects.ts         # Shadows, borders, gradients, animations
│   └── index.ts           # Combined token exports
├── components/            # Enhanced UI components
│   ├── Typography.tsx     # Display, Heading, Text, Caption components
│   └── index.ts          # Component exports
├── integrations/          # External tool integrations
│   ├── figma.ts          # Figma Design Token Studio sync
│   └── builder.ts        # Builder.io visual editing
└── README.md             # This file
```

## 🚀 Getting Started

### Installation

The design system is already integrated into your DateSpot app. The fonts are loaded from Google Fonts and the tokens are configured in your Tailwind config.

### Basic Usage

```tsx
import { Button, Display, Heading, Text } from '@/design-system/components';

function MyComponent() {
  return (
    <div className="space-y-6">
      <Display size="xl" color="primary">
        Welcome to DateSpot
      </Display>
      
      <Heading size="h2">
        Find Your Perfect Date
      </Heading>
      
      <Text size="lg" color="muted">
        Discover amazing places for memorable dates with AI-powered recommendations.
      </Text>
      
      <Button variant="premium" size="lg" fullWidth>
        Get Started
      </Button>
    </div>
  );
}
```

### Design Tokens

Use design tokens instead of hardcoded values:

```tsx
// ❌ Don't do this
<div className="bg-pink-500 text-white p-4 rounded-lg">

// ✅ Do this
<div className="bg-primary text-primary-foreground p-4 rounded-lg">

// ✅ Or use token classes
<div className="bg-primary-500 text-white p-component-md rounded-lg">
```

## 🎯 Component Variants

### Button Variants

- `default` - Primary brand button with shadow effects
- `destructive` - For dangerous actions
- `outline` - Outlined button with hover effects
- `secondary` - Secondary styling
- `ghost` - Minimal button for subtle actions
- `link` - Text-only link button
- `premium` - Gradient button with glow effects
- `soft` - Soft background with brand colors

### Button Sizes

- `xs` - Extra small (32px height)
- `sm` - Small (36px height)
- `default` - Default (40px height)
- `lg` - Large (44px height)
- `xl` - Extra large (48px height)
- `icon`, `icon-sm`, `icon-lg` - Icon-only buttons

### Typography Components

#### Display (Playfair Display)
For hero headings and prominent text:
```tsx
<Display size="2xl">Hero Heading</Display>
<Display size="xl" color="primary">Section Title</Display>
```

#### Heading (Inter)
For section headings and content hierarchy:
```tsx
<Heading size="h1">Main Heading</Heading>
<Heading size="h2" color="muted">Subheading</Heading>
```

#### Text (Inter)
For body content and descriptions:
```tsx
<Text size="lg">Large body text</Text>
<Text size="base" weight="medium">Medium weight text</Text>
```

#### Caption (Inter)
For labels and small text:
```tsx
<Caption color="primary">FEATURED</Caption>
```

## 🎨 Color System

### Brand Colors
- `primary-*` - DateSpot pink (330° hue)
- `secondary-*` - Complementary red-pink
- `accent-*` - Blue accent color

### Semantic Colors
- `success-*` - Green for success states
- `warning-*` - Orange for warnings
- `destructive-*` - Red for errors

### Usage
```tsx
// Background colors
<div className="bg-primary-50 dark:bg-primary-900">
<div className="bg-success-100 text-success-900">

// Text colors
<Text color="primary">Primary text</Text>
<Text color="muted">Muted text</Text>
```

## 📐 Spacing System

Uses an 8px base unit with semantic aliases:

### Component Spacing
- `component-xs` - 4px
- `component-sm` - 8px
- `component-md` - 16px
- `component-lg` - 24px
- `component-xl` - 32px

### Layout Spacing
- `layout-xs` - 16px
- `layout-sm` - 24px
- `layout-md` - 32px
- `layout-lg` - 48px
- `layout-xl` - 64px

## 🔗 Integrations

### Figma Integration

Export tokens to Figma Design Token Studio:

```tsx
import { exportTokensForFigma, FigmaTokenSync } from '@/design-system/integrations/figma';

// Manual export
exportTokensForFigma();

// API sync (requires backend)
const figmaSync = new FigmaTokenSync('api-key', 'file-key');
await figmaSync.pushTokens();
```

### Builder.io Integration

For visual page building:

```tsx
import { initBuilderIntegration } from '@/design-system/integrations/builder';

// Initialize Builder.io with custom components
initBuilderIntegration('your-api-key');
```

## 🌙 Dark Mode

The design system fully supports dark mode with automatically adjusted colors:

```tsx
// Colors automatically adapt
<Button variant="default">Same button, adapts to theme</Button>

// Manual dark mode variants
<div className="bg-card dark:bg-card">
```

## 📱 Responsive Design

All components are mobile-first and responsive:

```tsx
<Display size="lg" className="md:text-4xl lg:text-5xl">
  Responsive heading
</Display>

<Button size="sm" className="md:size-default lg:size-lg">
  Responsive button
</Button>
```

## 🔧 Customization

### Adding New Variants

Extend existing components with new variants:

```tsx
// In your button extension
const customButtonVariants = cva(
  buttonVariants.base,
  {
    variants: {
      ...buttonVariants.variants,
      variant: {
        ...buttonVariants.variants.variant,
        gradient: "bg-gradient-to-r from-primary-500 to-accent-500",
        neon: "bg-primary-500 shadow-brand-glow animate-pulse",
      }
    }
  }
);
```

### Custom Color Schemes

Add new color schemes by extending the color tokens:

```tsx
// In colors.ts
export const customColors = {
  brand: {
    tertiary: {
      500: 'hsl(270, 70%, 60%)',  // Purple variant
      // ... other shades
    }
  }
};
```

## 📚 Best Practices

1. **Use semantic tokens** instead of hardcoded values
2. **Prefer component variants** over custom CSS
3. **Follow the spacing scale** for consistent layout
4. **Use appropriate typography** hierarchy
5. **Test in both light and dark modes**
6. **Maintain accessibility** with proper contrast ratios
7. **Use design tokens** for consistent theming

## 🚀 Migration Guide

### From Old System

1. Replace hardcoded colors with semantic tokens
2. Update spacing to use the new scale
3. Replace typography with new components
4. Use enhanced button variants
5. Update shadows and effects

### Example Migration

```tsx
// Before
<button className="bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded font-medium">
  Click me
</button>

// After
<Button variant="default" size="default">
  Click me
</Button>
```

---

## 🤝 Contributing

When adding new components or tokens:

1. Follow the existing naming conventions
2. Add proper TypeScript types
3. Include dark mode variants
4. Update this documentation
5. Add Figma/Builder.io definitions if applicable

## 📖 Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [CVA (Class Variance Authority)](https://cva.style)
- [Figma Design Token Studio](https://tokens.studio)
- [Builder.io Documentation](https://www.builder.io/c/docs)
