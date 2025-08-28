// Figma Design Token Studio integration
import { designTokensForFigma } from '../tokens';

/**
 * Figma Design Token Studio integration utilities
 * 
 * This file provides utilities for syncing design tokens with Figma
 * using the Design Token Studio plugin or Figma API.
 */

// Export tokens in Design Token Studio format
export const figmaTokens = designTokensForFigma;

// Figma API integration helper
export class FigmaTokenSync {
  private apiKey: string;
  private fileKey: string;

  constructor(apiKey: string, fileKey: string) {
    this.apiKey = apiKey;
    this.fileKey = fileKey;
  }

  /**
   * Push design tokens to Figma file
   * Note: This requires a backend service to handle Figma API calls
   */
  async pushTokens() {
    const endpoint = '/api/figma/sync-tokens';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokens: figmaTokens,
          fileKey: this.fileKey,
          apiKey: this.apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync tokens with Figma');
      }

      return await response.json();
    } catch (error) {
      console.error('Figma token sync error:', error);
      throw error;
    }
  }

  /**
   * Generate CSS variables from Figma tokens
   */
  static generateCSSVariables(tokens: typeof figmaTokens) {
    const cssVars: string[] = [];
    
    function processTokens(obj: any, prefix = '') {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && 'value' in value) {
          cssVars.push(`  --${prefix}${key}: ${value.value};`);
        } else if (value && typeof value === 'object') {
          processTokens(value, `${prefix}${key}-`);
        }
      }
    }
    
    processTokens(tokens.global);
    
    return `:root {\n${cssVars.join('\n')}\n}`;
  }
}

// Helper function to export tokens for manual Figma import
export function exportTokensForFigma() {
  const dataStr = JSON.stringify(figmaTokens, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = 'vybepulse-design-tokens.json';
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

// Component library mapping for Figma
export const figmaComponentMap = {
  'Button': {
    variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'premium', 'soft'],
    sizes: ['xs', 'sm', 'default', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
    props: ['fullWidth']
  },
  'Typography': {
    components: ['Display', 'Heading', 'Text', 'Caption'],
    variants: ['size', 'color', 'weight']
  },
  'Card': {
    components: ['Card', 'CardHeader', 'CardContent', 'CardFooter', 'CardTitle', 'CardDescription']
  }
};