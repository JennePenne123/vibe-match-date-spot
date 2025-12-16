import { describe, it, expect, vi } from 'vitest';
import {
  supabaseUserToAppUser,
  venueToAppVenue,
  getUserName,
  getUserAvatar,
  getFallbackAvatar,
  getVenueDistance,
  getVenueMatchScore,
} from './typeHelpers';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { Venue } from '@/types';

describe('supabaseUserToAppUser', () => {
  it('returns null for null user', () => {
    expect(supabaseUserToAppUser(null)).toBeNull();
  });

  it('converts user with full metadata', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        name: 'John Doe',
        avatar_url: 'https://example.com/avatar.jpg',
      },
    } as unknown as SupabaseUser;

    const result = supabaseUserToAppUser(mockUser);
    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      avatar_url: 'https://example.com/avatar.jpg',
    });
  });

  it('extracts name from email when metadata missing', () => {
    const mockUser = {
      id: 'user-456',
      email: 'jane.smith@example.com',
      user_metadata: {},
    } as unknown as SupabaseUser;

    const result = supabaseUserToAppUser(mockUser);
    expect(result?.name).toBe('jane.smith');
  });

  it('defaults to User when no name or email', () => {
    const mockUser = {
      id: 'user-789',
      email: undefined,
      user_metadata: {},
    } as unknown as SupabaseUser;

    const result = supabaseUserToAppUser(mockUser);
    expect(result?.name).toBe('User');
  });
});

describe('venueToAppVenue', () => {
  const mockVenue: Venue = {
    id: 'venue-123',
    name: 'Test Restaurant',
    address: '123 Main St',
    image_url: 'https://example.com/image.jpg',
    price_range: '$$',
    rating: 4.5,
    google_place_id: 'place-abc',
    opening_hours: ['Mon-Fri: 9AM-10PM', 'Sat-Sun: 10AM-11PM'],
    cuisine_type: 'Italian',
    description: 'A nice place',
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  it('maps basic venue properties correctly', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.id).toBe('venue-123');
    expect(result.name).toBe('Test Restaurant');
    expect(result.address).toBe('123 Main St');
  });

  it('maps image_url to image', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.image).toBe('https://example.com/image.jpg');
  });

  it('maps address to location', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.location).toBe('123 Main St');
  });

  it('maps google_place_id to placeId', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.placeId).toBe('place-abc');
  });

  it('preserves opening_hours array', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.openingHours).toEqual(['Mon-Fri: 9AM-10PM', 'Sat-Sun: 10AM-11PM']);
  });

  it('provides default opening hours when missing', () => {
    const venueWithoutHours = { ...mockVenue, opening_hours: null };
    const result = venueToAppVenue(venueWithoutHours);
    expect(result.openingHours).toEqual(['Mon-Sun: 9:00 AM - 10:00 PM']);
  });

  it('adds distance property', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.distance).toBe('0.5 mi');
  });

  it('adds matchScore between 70-100', () => {
    const result = venueToAppVenue(mockVenue);
    expect(result.matchScore).toBeGreaterThanOrEqual(70);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('adds isOpen boolean', () => {
    const result = venueToAppVenue(mockVenue);
    expect(typeof result.isOpen).toBe('boolean');
  });
});

describe('getUserName', () => {
  it('returns name property when present', () => {
    expect(getUserName({ name: 'John' })).toBe('John');
  });

  it('returns user_metadata.name when name is missing', () => {
    expect(getUserName({ user_metadata: { name: 'Jane' } })).toBe('Jane');
  });

  it('extracts name from email when no name fields', () => {
    expect(getUserName({ email: 'test@example.com' })).toBe('test');
  });

  it('returns User for null', () => {
    expect(getUserName(null)).toBe('User');
  });

  it('returns User for undefined', () => {
    expect(getUserName(undefined)).toBe('User');
  });

  it('returns User for empty object', () => {
    expect(getUserName({})).toBe('User');
  });

  it('prioritizes name over user_metadata.name', () => {
    expect(getUserName({ name: 'Direct', user_metadata: { name: 'Meta' } })).toBe('Direct');
  });
});

describe('getUserAvatar', () => {
  it('returns avatar_url when present', () => {
    expect(getUserAvatar({ avatar_url: 'https://example.com/avatar.jpg' })).toBe('https://example.com/avatar.jpg');
  });

  it('returns user_metadata.avatar_url when avatar_url missing', () => {
    expect(getUserAvatar({ user_metadata: { avatar_url: 'https://example.com/meta.jpg' } })).toBe('https://example.com/meta.jpg');
  });

  it('returns undefined for empty object', () => {
    expect(getUserAvatar({})).toBeUndefined();
  });

  it('returns undefined for null', () => {
    expect(getUserAvatar(null)).toBeUndefined();
  });

  it('returns undefined for undefined', () => {
    expect(getUserAvatar(undefined)).toBeUndefined();
  });
});

describe('getFallbackAvatar', () => {
  it('generates URL with encoded name', () => {
    const result = getFallbackAvatar('John Doe');
    expect(result).toContain('ui-avatars.com');
    expect(result).toContain('name=John%20Doe');
  });

  it('uses User for null name', () => {
    const result = getFallbackAvatar(null);
    expect(result).toContain('name=User');
  });

  it('uses User for undefined name', () => {
    const result = getFallbackAvatar(undefined);
    expect(result).toContain('name=User');
  });

  it('encodes special characters', () => {
    const result = getFallbackAvatar('José García');
    expect(result).toContain('Jos%C3%A9%20Garc%C3%ADa');
  });

  it('includes expected styling parameters', () => {
    const result = getFallbackAvatar('Test');
    expect(result).toContain('background=ffc0cb');
    expect(result).toContain('color=fff');
    expect(result).toContain('size=128');
    expect(result).toContain('bold=true');
  });
});

describe('getVenueDistance', () => {
  it('returns distance when present', () => {
    expect(getVenueDistance({ distance: '1.5 mi' })).toBe('1.5 mi');
  });

  it('returns default for missing distance', () => {
    expect(getVenueDistance({})).toBe('0.5 mi');
  });

  it('returns default for null venue', () => {
    expect(getVenueDistance(null)).toBe('0.5 mi');
  });

  it('returns default for undefined venue', () => {
    expect(getVenueDistance(undefined)).toBe('0.5 mi');
  });
});

describe('getVenueMatchScore', () => {
  it('returns matchScore when present', () => {
    expect(getVenueMatchScore({ matchScore: 85 })).toBe(85);
  });

  it('returns random score 70-100 for missing matchScore', () => {
    const result = getVenueMatchScore({});
    expect(result).toBeGreaterThanOrEqual(70);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns random score 70-100 for null venue', () => {
    const result = getVenueMatchScore(null);
    expect(result).toBeGreaterThanOrEqual(70);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('returns random score 70-100 for undefined venue', () => {
    const result = getVenueMatchScore(undefined);
    expect(result).toBeGreaterThanOrEqual(70);
    expect(result).toBeLessThanOrEqual(100);
  });
});
