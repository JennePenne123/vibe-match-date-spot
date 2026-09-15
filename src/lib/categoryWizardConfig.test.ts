import { describe, it, expect } from 'vitest';
import {
  getCategoryWizardConfig,
  getCategoryPriorityProfile,
  getCategoryPriorityWeights,
  getVisiblePriorityDimensions,
  sectionsFromProfile,
  resolveVisibleSections,
  getFollowUpQuestions,
  getCategoryVenueTypeIds,
} from './categoryWizardConfig';

describe('category priority profiles', () => {
  it('keeps food as the neutral default when no category is active', () => {
    expect(getCategoryPriorityProfile(null).summaryKey).toBe('preferences.priorityFood');
    expect(getCategoryWizardConfig(null).mainPickerStorage).toBe('preferred_cuisines');
  });

  it('prioritises cuisine for food and distance for outdoor', () => {
    const food = getCategoryPriorityWeights('food');
    const outdoor = getCategoryPriorityWeights('outdoor');
    expect(food.cuisine).toBeGreaterThan(outdoor.cuisine);
    expect(outdoor.location).toBeGreaterThan(food.location);
  });

  it('hides budget and dietary for outdoor, keeps them for food', () => {
    const outdoor = getCategoryWizardConfig('outdoor').visibleSections;
    expect(outdoor.has('budget')).toBe(false);
    expect(outdoor.has('dietary')).toBe(false);
    expect(outdoor.has('mainPicker')).toBe(true);

    const food = getCategoryWizardConfig('food').visibleSections;
    expect(food.has('budget')).toBe(true);
    expect(food.has('dietary')).toBe(true);
    expect(food.has('excluded')).toBe(true);
  });

  it('never zeroes a weight (keeps scoring stable)', () => {
    for (const id of ['food', 'culture', 'activity', 'nightlife', 'wellness', 'outdoor', 'sport_action'] as const) {
      const w = getCategoryPriorityWeights(id);
      for (const value of Object.values(w)) {
        expect(value).toBeGreaterThan(0);
      }
    }
  });

  it('shows the cuisine slider only for food and drops price when budget is hidden', () => {
    expect(getVisiblePriorityDimensions('food')).toContain('cuisine');
    expect(getVisiblePriorityDimensions('wellness')).not.toContain('cuisine');
    expect(getVisiblePriorityDimensions('outdoor')).not.toContain('price');
    expect(getVisiblePriorityDimensions('sport_action')).toContain('price');
  });

  it('derives sections from the profile flags', () => {
    const sections = sectionsFromProfile(getCategoryPriorityProfile('nightlife'));
    expect(sections.has('accessibility')).toBe(false);
    expect(sections.has('timing')).toBe(true);
    expect(sections.has('location')).toBe(true);
  });
});

describe('adaptive follow-up questions', () => {
  it('hides follow-ups until something is picked', () => {
    expect(getFollowUpQuestions('outdoor', { selectedMainItems: [] })).toHaveLength(0);
    expect(getFollowUpQuestions('outdoor', { selectedMainItems: ['park'] })).toHaveLength(1);
  });

  it('reveals the food follow-up when the vibe slider is raised', () => {
    expect(getFollowUpQuestions('food', { selectedMainItems: [], weights: { vibe: 1.0 } })).toHaveLength(0);
    expect(getFollowUpQuestions('food', { selectedMainItems: [], weights: { vibe: 1.5 } })).toHaveLength(1);
  });

  it('keeps sections in sync with the priority sliders', () => {
    // Budget is hidden for outdoor by profile, a raised price slider brings it back
    expect(resolveVisibleSections('outdoor').has('budget')).toBe(false);
    expect(resolveVisibleSections('outdoor', { weights: { price: 1.6 } }).has('budget')).toBe(true);
    // Pulling a slider to "Egal" hides the optional section
    expect(resolveVisibleSections('food', { weights: { price: 0.5 } }).has('budget')).toBe(false);
    // Never hides the essentials
    const min = resolveVisibleSections('food', { weights: { cuisine: 0.5, vibe: 0.5, price: 0.5, location: 0.5 } });
    expect(min.has('mainPicker')).toBe(true);
    expect(min.has('location')).toBe(true);
  });

  it('does not surface cuisine-only sections for non-food categories', () => {
    const s = resolveVisibleSections('wellness', { weights: { cuisine: 2.0 } });
    expect(s.has('excluded')).toBe(false);
    expect(s.has('dietary')).toBe(false);
  });

  it('exposes follow-up ids as valid venue types', () => {
    expect(getCategoryVenueTypeIds('outdoor')).toContain('walking_route');
    expect(getCategoryVenueTypeIds('outdoor')).toContain('park');
  });
});
