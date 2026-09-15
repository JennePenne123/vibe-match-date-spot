import { describe, it, expect, beforeEach } from 'vitest';
import {
  reconcileCategoryAnswers,
  saveCategoryAnswers,
  clearCategoryAnswers,
  type CategoryAnswerSnapshot,
} from './categoryAnswerMemory';
import { priorityWeightsForCategory } from '@/components/date-planning/preferences/PriorityPicker';

const snap = (over: Partial<CategoryAnswerSnapshot> = {}): CategoryAnswerSnapshot => ({
  cuisines: [],
  excludedCuisines: [],
  venueTypes: [],
  vibes: [],
  priceRange: [],
  times: [],
  dietary: [],
  weights: priorityWeightsForCategory(null),
  ...over,
});

describe('category answer memory', () => {
  beforeEach(() => clearCategoryAnswers());

  it('drops answers the new category does not ask for', () => {
    const { answers, droppedCount } = reconcileCategoryAnswers({
      from: 'food',
      to: 'outdoor',
      current: snap({ cuisines: ['italian'], dietary: ['vegan'], priceRange: ['$$'] }),
    });
    expect(answers.cuisines).toEqual([]);
    expect(answers.dietary).toEqual([]);
    expect(answers.priceRange).toEqual([]); // outdoor has budgetRelevant = false
    expect(droppedCount).toBeGreaterThan(0);
  });

  it('restores answers when switching back to a category', () => {
    saveCategoryAnswers('food', snap({ cuisines: ['italian'], dietary: ['vegan'] }));
    const { answers, restoredCount } = reconcileCategoryAnswers({
      from: 'outdoor',
      to: 'food',
      current: snap(),
    });
    expect(answers.cuisines).toContain('italian');
    expect(answers.dietary).toContain('vegan');
    expect(restoredCount).toBe(2);
  });

  it('keeps only venue types valid for the new category', () => {
    const { answers } = reconcileCategoryAnswers({
      from: 'culture',
      to: 'outdoor',
      current: snap({ venueTypes: ['museum', 'park', 'walking_route'] }),
    });
    expect(answers.venueTypes).not.toContain('museum');
    expect(answers.venueTypes).toEqual(expect.arrayContaining(['park', 'walking_route']));
  });

  it('presets the sliders when the user never touched them', () => {
    const { answers } = reconcileCategoryAnswers({ from: 'food', to: 'nightlife', current: snap() });
    expect(answers.weights).toEqual(priorityWeightsForCategory('nightlife'));
  });

  it('carries manual slider changes over to relevant dimensions', () => {
    const foodPreset = priorityWeightsForCategory('food');
    const { answers } = reconcileCategoryAnswers({
      from: 'food',
      to: 'outdoor',
      current: snap({ weights: { ...foodPreset, location: 1.8 } }),
      weightsTouched: true,
    });
    expect(answers.weights.location).toBe(1.8);
    expect(answers.weights.vibe).toBe(priorityWeightsForCategory('outdoor').vibe);
  });
});
