// Shared types for test data services

export interface TestPhaseResult {
  phase: string;
  success: boolean;
  message: string;
  duration?: number;
  data?: unknown;
}

export interface TestUser {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

export interface TestUserPreferences {
  userId: string;
  preferred_cuisines?: string[];
  preferred_vibes?: string[];
  preferred_times?: string[];
  preferred_price_range?: string[];
  max_distance?: number;
  dietary_restrictions?: string[];
}
