import { describe, it, expect } from 'vitest';
import { calculateDistanceFromLocation, calculateDistanceFromHamburg } from './helperFunctions';

// Reference location: Hamburg city center
const HAMBURG = { latitude: 53.5511, longitude: 9.9937 };

describe('helperFunctions', () => {
  describe('calculateDistanceFromLocation', () => {
    it('should return very small distance for same coordinates', () => {
      const venue = { latitude: 53.5511, longitude: 9.9937 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      // Same coordinates should be 0m
      expect(result).toBe('0m');
    });

    it('should return distance in meters for nearby venue', () => {
      const venue = { latitude: 53.5520, longitude: 9.9950 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      // Should be in meters (< 1km)
      expect(result).toMatch(/^\d+m$/);
    });

    it('should return distance in km for Berlin', () => {
      const venue = { latitude: 52.5200, longitude: 13.4050 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      // Hamburg to Berlin is approximately 255-260 km
      expect(result).toMatch(/^\d+km$/);
      const distanceValue = parseFloat(result.replace('km', ''));
      expect(distanceValue).toBeGreaterThan(250);
      expect(distanceValue).toBeLessThan(270);
    });

    it('should return "Distance unavailable" when reference location is missing', () => {
      const venue = { latitude: 53.5511, longitude: 9.9937 };
      const result = calculateDistanceFromLocation(venue);
      expect(result).toBe('Distance unavailable');
    });

    it('should return "Distance unavailable" when venue latitude is missing', () => {
      const venue = { longitude: 9.9937 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      expect(result).toBe('Distance unavailable');
    });

    it('should return "Distance unavailable" when venue longitude is missing', () => {
      const venue = { latitude: 53.5511 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      expect(result).toBe('Distance unavailable');
    });

    it('should return "Distance unavailable" when both coordinates are missing', () => {
      const venue = {};
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      expect(result).toBe('Distance unavailable');
    });

    it('should return "Distance unavailable" for null coordinates', () => {
      const venue = { latitude: null, longitude: null };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      expect(result).toBe('Distance unavailable');
    });

    it('should handle coordinate at approximately 1km distance', () => {
      // Approximately 1km north of Hamburg
      const venue = { latitude: 53.5601, longitude: 9.9937 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      expect(result).toMatch(/^\d+\.\d+km$/);
      const distanceValue = parseFloat(result.replace('km', ''));
      expect(distanceValue).toBeGreaterThan(0.9);
      expect(distanceValue).toBeLessThan(1.1);
    });

    it('should handle venue far away (Munich)', () => {
      const venue = { latitude: 48.1351, longitude: 11.5820 };
      const result = calculateDistanceFromLocation(venue, HAMBURG);
      // Hamburg to Munich is approximately 610-620 km
      const distanceValue = parseFloat(result.replace('km', ''));
      expect(distanceValue).toBeGreaterThan(600);
      expect(distanceValue).toBeLessThan(650);
    });
  });

  describe('calculateDistanceFromHamburg (deprecated)', () => {
    it('should return "Distance unavailable" (no reference location)', () => {
      const venue = { latitude: 53.5511, longitude: 9.9937 };
      expect(calculateDistanceFromHamburg(venue)).toBe('Distance unavailable');
    });
  });
});
