type PreferenceSnapshot = {
  accessibility_needs?: string[] | null;
  dietary_restrictions?: string[] | null;
  home_address?: string | null;
  home_latitude?: number | null;
  home_longitude?: number | null;
  preferred_activities?: string[] | null;
  preferred_cuisines?: string[] | null;
  preferred_duration?: string | null;
  preferred_entertainment?: string[] | null;
  preferred_price_range?: string[] | null;
  preferred_times?: string[] | null;
  preferred_venue_types?: string[] | null;
  preferred_vibes?: string[] | null;
  personality_traits?: Record<string, number> | null;
  relationship_goal?: string | null;
};

const hasSelections = (value?: string[] | null) => Array.isArray(value) && value.length > 0;

const hasSavedLocation = (preferences: PreferenceSnapshot) => {
  const hasAddress = Boolean(preferences.home_address?.trim());
  const hasCoordinates = typeof preferences.home_latitude === 'number' && typeof preferences.home_longitude === 'number';

  return hasAddress || hasCoordinates;
};

export const hasCompletedPreferenceSetup = (preferences: PreferenceSnapshot | null | undefined) => {
  if (!preferences) return false;

  return (
    hasSelections(preferences.preferred_cuisines) ||
    hasSelections(preferences.preferred_vibes) ||
    hasSelections(preferences.preferred_price_range) ||
    hasSelections(preferences.preferred_times) ||
    hasSelections(preferences.dietary_restrictions) ||
    hasSelections(preferences.preferred_activities) ||
    hasSelections(preferences.preferred_entertainment) ||
    hasSelections(preferences.accessibility_needs) ||
    hasSelections(preferences.preferred_venue_types) ||
    Boolean(preferences.preferred_duration) ||
    hasSavedLocation(preferences) ||
    Boolean(preferences.personality_traits) ||
    Boolean(preferences.relationship_goal)
  );
};
