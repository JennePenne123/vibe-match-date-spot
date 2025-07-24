/**
 * Utility functions for handling venue addresses and location data
 */

/**
 * Formats a venue address for display, ensuring it's never empty
 */
export function formatVenueAddress(venue: any): string {
  // Check multiple possible address fields
  const address = venue.address || venue.venue_address || venue.location || venue.formatted_address;
  
  if (!address || address.trim() === '') {
    return 'Address not available';
  }
  
  // Clean up the address - remove extra spaces and common prefixes
  let cleanAddress = address.trim();
  
  // If address is very long, truncate it intelligently
  if (cleanAddress.length > 60) {
    const parts = cleanAddress.split(',');
    if (parts.length > 1) {
      // Show street + city/area
      cleanAddress = `${parts[0].trim()}, ${parts[1].trim()}`;
    } else {
      // Just truncate
      cleanAddress = cleanAddress.substring(0, 57) + '...';
    }
  }
  
  return cleanAddress;
}

/**
 * Extracts the neighborhood or area from an address
 */
export function extractNeighborhood(address: string): string | undefined {
  if (!address) return undefined;
  
  const parts = address.split(',').map(part => part.trim());
  
  // Common patterns:
  // "Street, Neighborhood, City" -> return Neighborhood
  // "Street, City" -> return City
  if (parts.length >= 2) {
    const potentialNeighborhood = parts[1];
    
    // Skip if it looks like a postal code or country
    if (/^\d+$/.test(potentialNeighborhood) || potentialNeighborhood.length < 3) {
      return parts[2] || undefined;
    }
    
    return potentialNeighborhood;
  }
  
  return undefined;
}

/**
 * Formats distance for display
 */
export function formatDistance(distance: number): string {
  if (distance < 0.1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 1) {
    return `${Math.round(distance * 10) / 10}km`;
  } else {
    return `${Math.round(distance * 10) / 10}km`;
  }
}

/**
 * Calculates distance between two points in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Validates that a venue has minimum required address information
 */
export function validateVenueAddress(venue: any): boolean {
  const address = venue.address || venue.venue_address || venue.location;
  return address && address.trim().length > 0;
}

/**
 * Gets a fallback address based on coordinates
 */
export function getCoordinateFallback(latitude?: number, longitude?: number): string {
  if (latitude && longitude) {
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
  return 'Location not available';
}