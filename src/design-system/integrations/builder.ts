// Builder.io integration for visual editing
import { builderTheme } from '../tokens';

/**
 * Builder.io integration utilities
 * 
 * This file provides utilities for integrating DateSpot components
 * with Builder.io for visual editing and page building.
 */

// Export theme in Builder.io compatible format
export const builderConfig = {
  theme: builderTheme,
  
  // Custom component definitions for Builder.io
  components: [
    {
      name: 'DateSpot Button',
      component: 'Button',
      inputs: [
        {
          name: 'children',
          type: 'text',
          defaultValue: 'Click me',
        },
        {
          name: 'variant',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Destructive', value: 'destructive' },
            { label: 'Outline', value: 'outline' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Ghost', value: 'ghost' },
            { label: 'Link', value: 'link' },
            { label: 'Premium', value: 'premium' },
            { label: 'Soft', value: 'soft' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'size',
          type: 'select',
          options: [
            { label: 'Extra Small', value: 'xs' },
            { label: 'Small', value: 'sm' },
            { label: 'Default', value: 'default' },
            { label: 'Large', value: 'lg' },
            { label: 'Extra Large', value: 'xl' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'fullWidth',
          type: 'boolean',
          defaultValue: false,
        },
        {
          name: 'disabled',
          type: 'boolean',
          defaultValue: false,
        },
      ],
    },
    {
      name: 'DateSpot Display',
      component: 'Display',
      inputs: [
        {
          name: 'children',
          type: 'text',
          defaultValue: 'Display Heading',
        },
        {
          name: 'size',
          type: 'select',
          options: [
            { label: '2XL', value: '2xl' },
            { label: 'XL', value: 'xl' },
            { label: 'Large', value: 'lg' },
          ],
          defaultValue: 'xl',
        },
        {
          name: 'color',
          type: 'select',
          options: [
            { label: 'Default', value: 'default' },
            { label: 'Primary', value: 'primary' },
            { label: 'Secondary', value: 'secondary' },
            { label: 'Muted', value: 'muted' },
          ],
          defaultValue: 'default',
        },
        {
          name: 'as',
          type: 'select',
          options: [
            { label: 'H1', value: 'h1' },
            { label: 'H2', value: 'h2' },
            { label: 'H3', value: 'h3' },
          ],
          defaultValue: 'h1',
        },
      ],
    },
    {
      name: 'DateSpot Card',
      component: 'Card',
      inputs: [
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Card Title',
        },
        {
          name: 'description',
          type: 'text',
          defaultValue: 'Card description',
        },
        {
          name: 'content',
          type: 'richText',
          defaultValue: 'Card content goes here...',
        },
        {
          name: 'showFooter',
          type: 'boolean',
          defaultValue: true,
        },
      ],
      childInputs: [
        {
          name: 'content',
          type: 'uiBlocks',
          defaultValue: [],
        },
      ],
    },
  ],
  
  // Custom sections for page building
  sections: [
    {
      name: 'DateSpot Hero',
      component: 'HeroSection',
      inputs: [
        {
          name: 'headline',
          type: 'text',
          defaultValue: 'Find Your Perfect Date Spot',
        },
        {
          name: 'subheadline',
          type: 'text',
          defaultValue: 'Discover amazing places for memorable dates',
        },
        {
          name: 'ctaText',
          type: 'text',
          defaultValue: 'Get Started',
        },
        {
          name: 'backgroundImage',
          type: 'file',
          allowedFileTypes: ['jpg', 'jpeg', 'png', 'webp'],
        },
      ],
    },
    {
      name: 'DateSpot Features',
      component: 'FeaturesSection',
      inputs: [
        {
          name: 'title',
          type: 'text',
          defaultValue: 'Why Choose DateSpot?',
        },
        {
          name: 'features',
          type: 'list',
          subFields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'text',
            },
            {
              name: 'icon',
              type: 'text',
            },
          ],
          defaultValue: [
            {
              title: 'AI-Powered Matching',
              description: 'Smart recommendations based on your preferences',
              icon: 'brain',
            },
            {
              title: 'Real-time Planning',
              description: 'Plan dates with friends in real-time',
              icon: 'users',
            },
          ],
        },
      ],
    },
  ],
};

// Builder.io initialization helper
export function initBuilderIntegration(apiKey: string) {
  if (typeof window !== 'undefined') {
    // Dynamic import for client-side only - requires @builder.io/react to be installed
    console.log('Builder.io integration ready for', apiKey);
    // Uncomment when @builder.io/react is installed:
    // import('@builder.io/react').then(({ Builder }) => {
    //   Builder.init(apiKey);
    //   console.log('Builder.io initialized with DateSpot design system');
    // });
  }
}

// Visual editor integration
export const builderVisualConfig = {
  // Custom toolbar for DateSpot components
  toolbar: {
    datespot: {
      label: 'DateSpot',
      items: [
        'DateSpot Button',
        'DateSpot Display',
        'DateSpot Card',
      ],
    },
  },
  
  // Custom styling controls
  styleControls: {
    spacing: {
      options: Object.keys(builderTheme.spacing),
    },
    colors: {
      palette: Object.values(builderTheme.colors),
    },
  },
};