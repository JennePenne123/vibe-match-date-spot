import { describe, it, expect } from 'vitest';
import { getPhotoVibeScoreModifier, extractPhotoVibes, getPhotoVibeLabel, type PhotoVibe } from './photoVibeScoring';

describe('extractPhotoVibes', () => {
  it('returns empty for no photos', () => {
    expect(extractPhotoVibes([])).toHaveLength(0);
  });

  it('extracts vibes from tagged photos', () => {
    const photos: PhotoVibe[] = [
      { url: 'test.jpg', vibeTags: ['candlelight'] },
    ];
    const vibes = extractPhotoVibes(photos);
    expect(vibes).toContain('romantic');
    expect(vibes).toContain('cozy');
    expect(vibes).toContain('elegant');
  });

  it('deduplicates vibes across photos', () => {
    const photos: PhotoVibe[] = [
      { url: 'a.jpg', vibeTags: ['candlelight'] },
      { url: 'b.jpg', vibeTags: ['fireplace'] }, // also has 'cozy', 'romantic'
    ];
    const vibes = extractPhotoVibes(photos);
    const romanticCount = vibes.filter(v => v === 'romantic').length;
    expect(romanticCount).toBe(1); // deduplicated
  });

  it('ignores unknown tags', () => {
    const photos: PhotoVibe[] = [
      { url: 'test.jpg', vibeTags: ['unknown-tag-xyz'] },
    ];
    expect(extractPhotoVibes(photos)).toHaveLength(0);
  });
});

describe('getPhotoVibeScoreModifier', () => {
  it('returns 0 for null/empty inputs', () => {
    expect(getPhotoVibeScoreModifier(null, ['romantic']).modifier).toBe(0);
    expect(getPhotoVibeScoreModifier([], ['romantic']).modifier).toBe(0);
    expect(getPhotoVibeScoreModifier([{ url: 'a.jpg', vibeTags: ['candlelight'] }], null).modifier).toBe(0);
    expect(getPhotoVibeScoreModifier([{ url: 'a.jpg', vibeTags: ['candlelight'] }], []).modifier).toBe(0);
  });

  it('gives positive modifier when vibes match', () => {
    const photos: PhotoVibe[] = [{ url: 'a.jpg', vibeTags: ['candlelight'] }];
    const result = getPhotoVibeScoreModifier(photos, ['romantic']);
    expect(result.modifier).toBeGreaterThan(0);
    expect(result.matchedVibes).toContain('romantic');
  });

  it('gives 0 modifier when vibes dont match', () => {
    const photos: PhotoVibe[] = [{ url: 'a.jpg', vibeTags: ['bright-modern'] }];
    const result = getPhotoVibeScoreModifier(photos, ['romantic']);
    expect(result.modifier).toBe(0);
    expect(result.matchedVibes).toHaveLength(0);
  });

  it('caps modifier at 0.12', () => {
    const photos: PhotoVibe[] = [
      { url: 'a.jpg', vibeTags: ['candlelight', 'fireplace', 'fine-dining', 'waterfront', 'cozy-interior'] },
    ];
    const result = getPhotoVibeScoreModifier(photos, ['romantic', 'cozy', 'elegant', 'outdoor', 'adventurous']);
    expect(result.modifier).toBeLessThanOrEqual(0.12);
  });
});

describe('getPhotoVibeLabel', () => {
  it('returns null for empty', () => {
    expect(getPhotoVibeLabel([])).toBeNull();
  });

  it('returns single vibe label', () => {
    expect(getPhotoVibeLabel(['romantic'])).toBe('📸 Photo-Vibe: romantic');
  });

  it('returns multi vibe label limited to 3', () => {
    const label = getPhotoVibeLabel(['romantic', 'cozy', 'elegant', 'trendy']);
    expect(label).toBe('📸 Photo-Vibes: romantic, cozy, elegant');
  });
});
