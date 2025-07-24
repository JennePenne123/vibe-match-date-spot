/**
 * Strips HTML tags from a string and returns clean text
 * @param html - HTML string to clean
 * @returns Clean text content without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  // Remove HTML tags using regex
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Extracts text content from HTML attribution string
 * Common for Google Places API photo attributions
 * @param attribution - HTML attribution string
 * @returns Clean attribution text
 */
export function cleanAttribution(attribution: string): string {
  if (!attribution) return 'Google Photos';
  
  // Strip HTML and return clean text, fallback to "Google Photos" if empty
  const cleaned = stripHtmlTags(attribution);
  return cleaned || 'Google Photos';
}