import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSeasonalScoreModifier, getActiveSpecials, getSeasonalLabel, type SeasonalSpecial } from './seasonalScoring';

const makeSpecial = (overrides: Partial<SeasonalSpecial> = {}): SeasonalSpecial => ({
  id: '1',
  title: 'Winterterrasse',
  emoji: '❄️',
  startDate: '2024-01-01',
  endDate: '2025-12-31',
  tags: ['winter', 'cozy'],
  ...overrides,
});

describe('getActiveSpecials', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns empty for null/undefined', () => {
    expect(getActiveSpecials(null)).toHaveLength(0);
    expect(getActiveSpecials(undefined)).toHaveLength(0);
  });

  it('returns active specials within date range', () => {
    const specials = [makeSpecial()];
    expect(getActiveSpecials(specials)).toHaveLength(1);
  });

  it('filters out expired specials', () => {
    const specials = [makeSpecial({ endDate: '2024-01-01' })];
    expect(getActiveSpecials(specials)).toHaveLength(0);
  });

  it('filters out future specials', () => {
    const specials = [makeSpecial({ startDate: '2025-01-01' })];
    expect(getActiveSpecials(specials)).toHaveLength(0);
  });
});

describe('getSeasonalScoreModifier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns 0 for no specials', () => {
    const result = getSeasonalScoreModifier(null);
    expect(result.modifier).toBe(0);
  });

  it('gives base freshness bonus for active special', () => {
    const result = getSeasonalScoreModifier([makeSpecial()]);
    expect(result.modifier).toBeGreaterThanOrEqual(0.03);
    expect(result.activeSpecials).toHaveLength(1);
  });

  it('gives vibe matching bonus', () => {
    const result = getSeasonalScoreModifier([makeSpecial()], ['cozy', 'romantic']);
    expect(result.modifier).toBeGreaterThan(0.03);
    expect(result.matchedTags.length).toBeGreaterThan(0);
  });

  it('gives bonus for multiple active specials', () => {
    const specials = [makeSpecial(), makeSpecial({ id: '2', title: 'Sommergarten' })];
    const result = getSeasonalScoreModifier(specials);
    expect(result.modifier).toBeGreaterThanOrEqual(0.04); // 0.03 base + 0.01 multi
  });

  it('caps modifier at 0.08', () => {
    const specials = [
      makeSpecial({ tags: ['cozy', 'winter', 'romantic', 'outdoor'] }),
      makeSpecial({ id: '2', tags: ['cozy', 'summer', 'garden'] }),
    ];
    const result = getSeasonalScoreModifier(specials, ['cozy', 'winter', 'romantic', 'outdoor', 'summer', 'garden']);
    expect(result.modifier).toBeLessThanOrEqual(0.08);
  });
});

describe('getSeasonalLabel', () => {
  it('returns null for empty', () => {
    expect(getSeasonalLabel([])).toBeNull();
  });

  it('returns formatted label', () => {
    const label = getSeasonalLabel([makeSpecial()]);
    expect(label).toBe('❄️ Winterterrasse');
  });

  it('limits to 2 specials', () => {
    const label = getSeasonalLabel([
      makeSpecial(),
      makeSpecial({ id: '2', title: 'Sommergarten', emoji: '☀️' }),
      makeSpecial({ id: '3', title: 'Extra', emoji: '🎉' }),
    ]);
    expect(label).toBe('❄️ Winterterrasse, ☀️ Sommergarten');
  });
});
