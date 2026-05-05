import { describe, it, expect } from 'vitest';
import {
  getSituationalCategory,
  isPureFoodVenue,
  passesSituationalHardFilter,
} from './situationalCategories';

const nightlife = getSituationalCategory('nightlife')!;
const culture = getSituationalCategory('culture')!;
const activity = getSituationalCategory('activity')!;
const food = getSituationalCategory('food')!;

describe('passesSituationalHardFilter — non-food intent strictness', () => {
  describe('nightlife', () => {
    it('drops a burger restaurant even if name contains "Lounge"', () => {
      const burgerLounge = {
        name: 'Burger Lounge',
        cuisine_type: 'burger',
        tags: ['restaurant', 'burger'],
        venue_type: 'restaurant',
      };
      expect(passesSituationalHardFilter(nightlife, burgerLounge)).toBe(false);
    });

    it('drops a generic burger venue', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Hansa Burger',
          cuisine_type: 'burger',
          tags: ['burger', 'fast_food'],
        }),
      ).toBe(false);
    });

    it('drops italian/sushi/pizza restaurants', () => {
      for (const cuisine of ['italian', 'pizza', 'sushi', 'thai', 'indian']) {
        expect(
          passesSituationalHardFilter(nightlife, {
            name: `Test ${cuisine}`,
            cuisine_type: cuisine,
            tags: ['restaurant'],
          }),
        ).toBe(false);
      }
    });

    it('keeps a real cocktail bar (cuisine=bar)', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Sky Bar',
          cuisine_type: 'bar',
          tags: ['bar', 'cocktails'],
        }),
      ).toBe(true);
    });

    it('drops burger venues even when they also carry bar/nightlife tags', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Hansa Burger',
          cuisine_type: 'bar',
          tags: ['bar', 'restaurant', 'hamburger_restaurant'],
        }),
      ).toBe(false);
    });

    it('keeps a bar that has a generic restaurant tag but no food signal', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Cinema Bar',
          tags: ['bar', 'restaurant'],
        }),
      ).toBe(true);
    });

    it('keeps a nightclub via venue_type', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Club X',
          venue_type: 'nightclub',
          tags: ['nightclub'],
        }),
      ).toBe(true);
    });

    it('keeps a karaoke bar via boostVenueTypes', () => {
      expect(
        passesSituationalHardFilter(nightlife, {
          name: 'Sing Sing',
          tags: ['karaoke'],
        }),
      ).toBe(true);
    });
  });

  describe('culture', () => {
    it('drops a burger restaurant', () => {
      expect(
        passesSituationalHardFilter(culture, {
          name: 'Art Burger',
          cuisine_type: 'burger',
          tags: ['restaurant'],
        }),
      ).toBe(false);
    });

    it('drops a restaurant whose description contains "art"', () => {
      expect(
        passesSituationalHardFilter(culture, {
          name: 'Trattoria',
          cuisine_type: 'italian',
          description: 'Culinary art at its finest',
          tags: ['restaurant'],
        }),
      ).toBe(false);
    });

    it('keeps a museum via venue_type', () => {
      expect(
        passesSituationalHardFilter(culture, {
          name: 'Kunsthalle',
          venue_type: 'museum',
          tags: ['museum'],
        }),
      ).toBe(true);
    });

    it('keeps a theater via tags', () => {
      expect(
        passesSituationalHardFilter(culture, {
          name: 'Schauspielhaus',
          tags: ['theater_venue'],
        }),
      ).toBe(true);
    });
  });

  describe('activity', () => {
    it('drops a chinese restaurant', () => {
      expect(
        passesSituationalHardFilter(activity, {
          name: 'Golden Dragon',
          cuisine_type: 'chinese',
          tags: ['restaurant'],
        }),
      ).toBe(false);
    });

    it('keeps mini_golf via venue_type', () => {
      expect(
        passesSituationalHardFilter(activity, {
          name: 'Movie Golf',
          venue_type: 'mini_golf',
          tags: ['mini_golf'],
        }),
      ).toBe(true);
    });

    it('keeps bowling via tags', () => {
      expect(
        passesSituationalHardFilter(activity, {
          name: 'Bowl Center',
          tags: ['bowling'],
        }),
      ).toBe(true);
    });

    it('keeps a spa via venue_type', () => {
      expect(
        passesSituationalHardFilter(activity, {
          name: 'Therme',
          venue_type: 'spa_wellness',
        }),
      ).toBe(true);
    });
  });

  describe('food intent (no filter)', () => {
    it('keeps any restaurant when intent is food', () => {
      expect(
        passesSituationalHardFilter(food, {
          name: 'Burger Joint',
          cuisine_type: 'burger',
          tags: ['restaurant'],
        }),
      ).toBe(true);
    });

    it('keeps everything when no category', () => {
      expect(
        passesSituationalHardFilter(null, {
          name: 'Anything',
          cuisine_type: 'burger',
        }),
      ).toBe(true);
    });
  });

  describe('pure food detection', () => {
    it('recognizes Google hamburger restaurant types as pure food', () => {
      expect(
        isPureFoodVenue({
          name: 'Hansa Burger',
          cuisineType: 'American',
          types: ['restaurant', 'hamburger_restaurant', 'point_of_interest'],
        }),
      ).toBe(true);
    });

    it('does not classify a normal bar with a generic restaurant tag as pure food', () => {
      expect(
        isPureFoodVenue({
          name: 'The Cinema Bar',
          tags: ['bar', 'restaurant'],
        }),
      ).toBe(false);
    });
  });

  describe('secondary category', () => {
    it('keeps a bar when nightlife is primary and food is secondary', () => {
      expect(
        passesSituationalHardFilter(
          nightlife,
          { name: 'Bar', cuisine_type: 'bar', tags: ['bar'] },
          food,
        ),
      ).toBe(true);
    });

    it('keeps a museum when activity is primary and culture is secondary', () => {
      expect(
        passesSituationalHardFilter(
          activity,
          { name: 'Museum', venue_type: 'museum', tags: ['museum'] },
          culture,
        ),
      ).toBe(true);
    });

    it('still drops a burger restaurant under nightlife+culture', () => {
      expect(
        passesSituationalHardFilter(
          nightlife,
          { name: 'Burger', cuisine_type: 'burger', tags: ['restaurant'] },
          culture,
        ),
      ).toBe(false);
    });
  });
});
