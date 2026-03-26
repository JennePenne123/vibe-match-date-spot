import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getPairFriendlyScoreModifier, getPairFriendlyLabel } from './pairFriendlyScoring';

describe('getPairFriendlyScoreModifier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-12-14T19:00:00')); // Saturday evening
  });
  afterEach(() => vi.useRealTimers());

  it('returns 0 modifier for solo mode', () => {
    const result = getPairFriendlyScoreModifier({ has_separee: true }, false);
    expect(result.modifier).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });

  it('gives bonus for separée', () => {
    const result = getPairFriendlyScoreModifier({ has_separee: true }, true);
    expect(result.modifier).toBeGreaterThanOrEqual(0.03);
    expect(result.reasons).toContain('Separée verfügbar');
  });

  it('gives bonus for pair-friendly features', () => {
    const result = getPairFriendlyScoreModifier({
      pair_friendly_features: ['candle_lit', 'private_room'],
    }, true);
    expect(result.modifier).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('Paar'))).toBe(true);
  });

  it('gives capacity bonus for sweet spot (20-80)', () => {
    const result = getPairFriendlyScoreModifier({ capacity: 50 }, true);
    expect(result.modifier).toBeGreaterThanOrEqual(0.02);
    expect(result.reasons).toContain('Ideale Größe für Dates');
  });

  it('gives smaller bonus for very intimate venues (<20)', () => {
    const result = getPairFriendlyScoreModifier({ capacity: 12 }, true);
    expect(result.modifier).toBeGreaterThanOrEqual(0.015);
    expect(result.reasons).toContain('Sehr intim');
  });

  it('gives no capacity bonus for large venues (>80)', () => {
    const result = getPairFriendlyScoreModifier({ capacity: 200 }, true);
    expect(result.modifier).toBe(0);
  });

  it('caps total modifier at 0.15', () => {
    const result = getPairFriendlyScoreModifier({
      pair_friendly_features: ['candle_lit', 'private_room', 'fireplace', 'view_table'],
      has_separee: true,
      capacity: 40,
      best_times: { romantic: ['saturday_evening'] },
      tags: ['romantisch', 'date-night'],
    }, true);
    expect(result.modifier).toBeLessThanOrEqual(0.15);
  });

  it('handles empty venue data gracefully', () => {
    const result = getPairFriendlyScoreModifier({}, true);
    expect(result.modifier).toBe(0);
    expect(result.reasons).toHaveLength(0);
  });
});

describe('getPairFriendlyLabel', () => {
  it('returns null for empty reasons', () => {
    expect(getPairFriendlyLabel([])).toBeNull();
  });

  it('returns label with emoji for reasons', () => {
    const label = getPairFriendlyLabel(['Separée verfügbar']);
    expect(label).toBe('💑 Separée verfügbar');
  });

  it('joins multiple reasons', () => {
    const label = getPairFriendlyLabel(['Separée verfügbar', 'Ideale Größe für Dates']);
    expect(label).toBe('💑 Separée verfügbar · Ideale Größe für Dates');
  });
});
