import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationConfig {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export const useInputValidation = (config: ValidationConfig) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((name: string, value: string): boolean => {
    const rule = config[name];
    if (!rule) return true;

    let error: string | null = null;

    // Required validation
    if (rule.required && (!value || value.trim().length === 0)) {
      error = `${name} is required`;
    }

    // Length validations
    if (!error && rule.minLength && value.length < rule.minLength) {
      error = `${name} must be at least ${rule.minLength} characters`;
    }

    if (!error && rule.maxLength && value.length > rule.maxLength) {
      error = `${name} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (!error && rule.pattern && !rule.pattern.test(value)) {
      error = `${name} format is invalid`;
    }

    // Custom validation
    if (!error && rule.custom) {
      error = rule.custom(value);
    }

    // Update errors state
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });

    return !error;
  }, [config]);

  const validateAll = useCallback((values: Record<string, string>): boolean => {
    let isValid = true;
    const newErrors: ValidationErrors = {};

    Object.keys(config).forEach(name => {
      const value = values[name] || '';
      if (!validateField(name, value)) {
        isValid = false;
      }
    });

    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
      });
    }

    return isValid;
  }, [config, validateField]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateAll,
    clearErrors,
    hasErrors: Object.keys(errors).length > 0,
  };
};

// Common validation rules
export const validationRules = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 100,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  email: {
    required: true,
    maxLength: 254,
    pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  },
  message: {
    maxLength: 1000,
  },
  title: {
    required: true,
    minLength: 1,
    maxLength: 200,
  },
} as ValidationConfig;