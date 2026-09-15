import { describe, it, expect } from 'vitest';
import {
  getCategoryWizardConfig,
  getCategoryPriorityProfile,
  getCategoryPriorityWeights,
  getVisiblePriorityDimensions,
  sectionsFromProfile,
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
