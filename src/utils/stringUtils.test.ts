import { describe, it, expect } from 'vitest';
import { levenshteinDistance, calculateStringSimilarity, calculateGeoDistance } from './stringUtils';

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0);
  });

  it('returns correct distance for single character difference', () => {
    expect(levenshteinDistance('hello', 'hallo')).toBe(1);
  });

  it('returns string length for completely different strings', () => {
    expect(levenshteinDistance('abc', 'xyz')).toBe(3);
  });

  it('handles empty first string', () => {
    expect(levenshteinDistance('', 'hello')).toBe(5);
  });

  it('handles empty second string', () => {
    expect(levenshteinDistance('hello', '')).toBe(5);
  });

  it('returns 0 for both empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0);
  });

  it('handles insertion required', () => {
    expect(levenshteinDistance('cat', 'cats')).toBe(1);
  });

  it('handles deletion required', () => {
    expect(levenshteinDistance('cats', 'cat')).toBe(1);
  });

  it('is case sensitive', () => {
    expect(levenshteinDistance('Hello', 'hello')).toBe(1);
  });

  it('handles longer strings', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
  });
});

describe('calculateStringSimilarity', () => {
  it('returns 1.0 for identical strings', () => {
    expect(calculateStringSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('returns 0 for completely different strings of same length', () => {
    expect(calculateStringSimilarity('abc', 'xyz')).toBe(0);
  });

  it('returns 1.0 for both empty strings', () => {
    expect(calculateStringSimilarity('', '')).toBe(1.0);
  });

  it('returns value between 0 and 1 for similar strings', () => {
    const similarity = calculateStringSimilarity('kitten', 'sitting');
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1);
    expect(similarity).toBeCloseTo(0.571, 2);
  });

  it('handles different length strings', () => {
    const similarity = calculateStringSimilarity('ab', 'abcd');
    expect(similarity).toBe(0.5);
  });

  it('returns high similarity for one character difference', () => {
    const similarity = calculateStringSimilarity('test', 'tast');
    expect(similarity).toBe(0.75);
  });

  it('is symmetric', () => {
    const sim1 = calculateStringSimilarity('hello', 'hallo');
    const sim2 = calculateStringSimilarity('hallo', 'hello');
    expect(sim1).toBe(sim2);
  });
});

describe('calculateGeoDistance', () => {
  it('returns 0 for same point', () => {
    expect(calculateGeoDistance(0, 0, 0, 0)).toBe(0);
  });

  it('calculates distance between Hamburg and Berlin correctly', () => {
    const distance = calculateGeoDistance(53.5511, 9.9937, 52.5200, 13.4050);
    expect(distance).toBeGreaterThan(250);
    expect(distance).toBeLessThan(260);
  });

  it('calculates distance between London and Paris correctly', () => {
    const distance = calculateGeoDistance(51.5074, -0.1278, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(340);
    expect(distance).toBeLessThan(350);
  });

  it('calculates distance across equator', () => {
    const distance = calculateGeoDistance(10, 0, -10, 0);
    expect(distance).toBeGreaterThan(2200);
    expect(distance).toBeLessThan(2250);
  });

  it('calculates distance between NYC and LA correctly', () => {
    const distance = calculateGeoDistance(40.7128, -74.0060, 34.0522, -118.2437);
    expect(distance).toBeGreaterThan(3900);
    expect(distance).toBeLessThan(4000);
  });

  it('is symmetric', () => {
    const dist1 = calculateGeoDistance(51.5074, -0.1278, 48.8566, 2.3522);
    const dist2 = calculateGeoDistance(48.8566, 2.3522, 51.5074, -0.1278);
    expect(dist1).toBeCloseTo(dist2, 10);
  });

  it('handles negative coordinates', () => {
    const distance = calculateGeoDistance(-33.8688, 151.2093, -37.8136, 144.9631);
    expect(distance).toBeGreaterThan(700);
    expect(distance).toBeLessThan(750);
  });
});
