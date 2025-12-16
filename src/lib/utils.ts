import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Safe array access - returns first element or undefined
export function safeFirst<T>(arr: T[] | undefined | null): T | undefined {
  return arr?.[0];
}

// Safe string split with fallback - gets first word from a string
export function safeFirstWord(str: string | undefined | null, fallback = ''): string {
  if (!str) return fallback;
  return str.split(' ')[0] ?? fallback;
}

// Safe initials extraction from a name
export function getInitials(name: string | undefined | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map(n => n[0] ?? '')
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';
}

// Type guard for defined values (filters out null and undefined)
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Safe property access with fallback
export function safeGet<T, K extends keyof T>(
  obj: T | null | undefined, 
  key: K, 
  fallback: T[K]
): T[K] {
  return obj?.[key] ?? fallback;
}
