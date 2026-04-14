// Shared blocklist for filtering non-restaurant venues from DB results
export const BLOCKED_VENUE_NAMES = [
  // 🇩🇪 Germany
  'netto', 'aldi', 'lidl', 'rewe', 'edeka', 'penny', 'kaufland', 'norma', 'rossmann', 'dm-drogerie',
  'müller drogerie', 'tegut', 'nahkauf', 'cap markt', 'nah und gut', 'combi', 'famila', 'globus',
  'real', 'hit markt', 'marktkauf', 'e center', 'e-center', 'trinkgut', 'getränke hoffmann',
  // 🇺🇸 USA
  'walmart', 'target', 'costco', 'kroger', 'whole foods', 'trader joe', 'safeway', 'publix',
  'walgreens', 'cvs', '7-eleven', 'circle k', 'dollar general', 'dollar tree', 'family dollar',
  // 🇬🇧 UK
  'tesco', 'sainsbury', 'asda', 'morrisons', 'waitrose', 'co-op food', 'iceland', 'spar',
  // 🇫🇷 France
  'carrefour', 'leclerc', 'auchan', 'intermarché', 'monoprix', 'casino', 'franprix',
  // 🇪🇸 Spain
  'mercadona', 'dia', 'eroski', 'hipercor', 'el corte inglés',
  // 🇮🇹 Italy
  'esselunga', 'conad', 'coop italia', 'eurospin',
  // 🇳🇱 Netherlands
  'albert heijn', 'jumbo', 'dirk',
  // 🇦🇹 Austria
  'billa', 'hofer', 'interspar',
  // 🇨🇭 Switzerland
  'migros', 'coop schweiz', 'denner',
  // 🇯🇵 Japan
  'lawson', 'familymart', 'ministop',
  // 🇦🇺 Australia
  'woolworths', 'coles',
  // 🌍 Delivery / ghost kitchens
  'lieferando', 'delivery hero', 'wolt', 'uber eats', 'domino', 'pizza hut delivery',
  'just eat', 'flink', 'gorillas', 'getir', 'doordash', 'grubhub', 'postmates',
  'deliveroo', 'glovo', 'rappi', 'ifood', 'swiggy', 'zomato',
  // 🌍 Gas stations
  'shell', 'bp ', 'total energies', 'aral', 'esso',
  // Pharmacies / Drugstores (removed 'apotheke' - some real cafés contain the word)
  'pharmacy',
  // Hardware / DIY
  'bauhaus', 'obi ', 'hornbach', 'toom', 'hagebau',
  // Convenience (exact-ish matches)
  'rewe to go',
];

export const BLOCKED_VENUE_TAGS = [
  'grocery', 'supermarket', 'convenience-store', 'gas-station',
  'food-delivery', 'catering', 'food-truck', 'vending-machine',
  'liquor-store', 'discount-store', 'department-store', 'drugstore',
  'market', 'deli', 'butcher', 'wholesale', 'pharmacy', 'hardware-store',
  'pet-store', 'auto-repair', 'car-wash', 'laundry', 'dry-cleaner',
  'supermarkt', 'tankstelle',
  'food-grocery',
  // Non-gastronomy entertainment/culture
  'museum', 'theatre', 'cinema', 'theater',
];

/**
 * Filters out non-restaurant venues from a list of venue objects.
 * Works with any object that has `name` and optionally `tags` fields.
 */
export function filterBlockedVenues<T extends { name: string; tags?: string[] | null }>(venues: T[]): T[] {
  return venues.filter(venue => {
    const nameLower = (venue.name || '').toLowerCase();
    
    // Check blocked names
    const hasBlockedName = BLOCKED_VENUE_NAMES.some(b => nameLower.includes(b));
    if (hasBlockedName) return false;
    
    // Check blocked tags
    if (venue.tags && Array.isArray(venue.tags)) {
      const hasBlockedTag = venue.tags.some(tag => 
        BLOCKED_VENUE_TAGS.some(b => tag.toLowerCase().includes(b))
      );
      if (hasBlockedTag) return false;
    }
    
    return true;
  });
}
