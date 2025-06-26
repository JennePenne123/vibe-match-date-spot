
import { z } from 'zod';
import { sanitize } from './validation';

export const authSchema = z.object({
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

export const profileSchema = z.object({
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
});

export type AuthFormData = z.infer<typeof authSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
