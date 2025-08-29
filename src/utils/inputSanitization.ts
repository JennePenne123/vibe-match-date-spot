/**
 * Input sanitization utilities to prevent XSS and clean user input
 */

/**
 * Sanitize user input by removing potentially dangerous characters
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, 1000); // Limit length
};

/**
 * Sanitize user name input
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  return name
    .replace(/[<>]/g, '')
    .replace(/[^\w\s'-]/g, '') // Only allow word characters, spaces, apostrophes, hyphens
    .trim()
    .substring(0, 100);
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 254);
};

/**
 * Sanitize message content
 */
export const sanitizeMessage = (message: string): string => {
  if (!message) return '';
  
  return message
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 1000);
};

/**
 * Clean and validate venue search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return query
    .replace(/[<>]/g, '')
    .replace(/[^\w\s.-]/g, '') // Only allow alphanumeric, spaces, dots, hyphens
    .trim()
    .substring(0, 200);
};