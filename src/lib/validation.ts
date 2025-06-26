
import { z } from 'zod';
import DOMPurify from 'dompurify';

// Input sanitization utilities
export const sanitize = {
  // HTML sanitization
  html: (input: string): string => {
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [] 
    });
  },

  // Remove special characters except letters, numbers, spaces, and basic punctuation
  text: (input: string): string => {
    return input.replace(/[^\w\s\-.,!?@]/g, '').trim();
  },

  // Email sanitization
  email: (input: string): string => {
    return input.toLowerCase().trim();
  },

  // Phone number sanitization
  phone: (input: string): string => {
    return input.replace(/[^\d+\-\(\)\s]/g, '');
  },

  // URL sanitization
  url: (input: string): string => {
    try {
      const url = new URL(input);
      return url.toString();
    } catch {
      return '';
    }
  },

  // Remove SQL injection patterns
  sql: (input: string): string => {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /['"`;]/g,
      /--/g,
      /\/\*/g,
      /\*\//g
    ];
    
    let sanitized = input;
    sqlPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
  },
};

// Enhanced validation schemas
export const enhancedAuthSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .transform(sanitize.email),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform(sanitize.text)
    .optional(),
});

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
    .transform(sanitize.text),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .transform(sanitize.email),
  
  bio: z
    .string()
    .max(500, 'Bio is too long')
    .transform(sanitize.html)
    .optional(),
});

export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long')
    .transform(sanitize.html),
  
  recipientId: z
    .string()
    .uuid('Invalid recipient ID'),
});

export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query is too long')
    .transform(sanitize.sql),
  
  filters: z.object({
    cuisines: z.array(z.string().max(50)).max(10).optional(),
    vibes: z.array(z.string().max(50)).max(10).optional(),
    area: z.string().max(100).optional(),
    priceRange: z.enum(['$', '$$', '$$$', '$$$$']).optional(),
  }).optional(),
});

// Rate limiting for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      return this.maxRequests;
    }
    
    const userRequests = this.requests.get(identifier)!;
    const validRequests = userRequests.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

export const apiRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

// Input validation middleware
export const validateInput = <T>(schema: z.ZodSchema<T>) => {
  return (input: unknown): T => {
    try {
      return schema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  };
};

export type EnhancedAuthFormData = z.infer<typeof enhancedAuthSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;
