
// Environment configuration with validation
interface EnvironmentConfig {
  // API Configuration
  API_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  
  // Feature Flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_GEOLOCATION: boolean;
  
  // App Configuration
  APP_NAME: string;
  APP_VERSION: string;
  MAX_UPLOAD_SIZE: number;
  
  // Development
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  ENABLE_DEBUG_LOGS: boolean;
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  API_BASE_URL: 'https://dfjwubatslzblagthbdw.supabase.co',
  SUPABASE_URL: 'https://dfjwubatslzblagthbdw.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmand1YmF0c2x6YmxhZ3RoYmR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjIzMTQsImV4cCI6MjA2NTczODMxNH0.OxA8Wt4JZPagCJW2DKxjnFJqPJFebzAkRXwleUvH0iE',
  ENABLE_ANALYTICS: false,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_GEOLOCATION: true,
  APP_NAME: 'DateSpot',
  APP_VERSION: '1.0.0',
  MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  ENABLE_DEBUG_LOGS: import.meta.env.DEV,
};

// Environment variable mapping
const getEnvironmentConfig = (): EnvironmentConfig => {
  const config: EnvironmentConfig = {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || defaultConfig.API_BASE_URL,
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || defaultConfig.SUPABASE_URL,
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || defaultConfig.SUPABASE_ANON_KEY,
    
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || defaultConfig.ENABLE_ANALYTICS,
    ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
    ENABLE_GEOLOCATION: import.meta.env.VITE_ENABLE_GEOLOCATION !== 'false',
    
    APP_NAME: import.meta.env.VITE_APP_NAME || defaultConfig.APP_NAME,
    APP_VERSION: import.meta.env.VITE_APP_VERSION || defaultConfig.APP_VERSION,
    MAX_UPLOAD_SIZE: parseInt(import.meta.env.VITE_MAX_UPLOAD_SIZE || String(defaultConfig.MAX_UPLOAD_SIZE)),
    
    IS_DEVELOPMENT: defaultConfig.IS_DEVELOPMENT,
    IS_PRODUCTION: defaultConfig.IS_PRODUCTION,
    ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true' || defaultConfig.ENABLE_DEBUG_LOGS,
  };
  
  // Validate required environment variables
  const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missingVars = requiredVars.filter(key => !config[key as keyof EnvironmentConfig]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
  }
  
  return config;
};

export const env = getEnvironmentConfig();

// Debug logger
export const logger = {
  debug: (...args: any[]) => {
    if (env.ENABLE_DEBUG_LOGS) {
      console.debug('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
};

// Feature flag checker
export const isFeatureEnabled = (feature: string): boolean => {
  switch (feature) {
    case 'analytics':
      return env.ENABLE_ANALYTICS;
    case 'notifications':
      return env.ENABLE_NOTIFICATIONS;
    case 'geolocation':
      return env.ENABLE_GEOLOCATION;
    default:
      return false;
  }
};

export type { EnvironmentConfig };
