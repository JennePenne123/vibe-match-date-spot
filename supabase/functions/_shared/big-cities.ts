/**
 * Google Places is restricted to cities with >= 100,000 inhabitants.
 * Everywhere else we rely on free sources (OSM/Overpass, Wikimedia, cache).
 * Each entry: [name, lat, lng, radiusKm].
 */
const BIG_CITIES: Array<[string, number, number, number]> = [
  // DE
  ['Berlin', 52.52, 13.405, 25], ['Hamburg', 53.5503, 9.9937, 22], ['München', 48.1372, 11.5756, 20],
  ['Köln', 50.9375, 6.9603, 18], ['Frankfurt am Main', 50.1109, 8.6821, 16], ['Stuttgart', 48.7758, 9.1829, 15],
  ['Düsseldorf', 51.2277, 6.7735, 14], ['Leipzig', 51.3397, 12.3731, 15], ['Dortmund', 51.5136, 7.4653, 15],
  ['Essen', 51.4556, 7.0116, 13], ['Bremen', 53.0793, 8.8017, 15], ['Dresden', 51.0504, 13.7373, 15],
  ['Hannover', 52.3759, 9.732, 14], ['Nürnberg', 49.4521, 11.0767, 13], ['Duisburg', 51.4344, 6.7623, 13],
  ['Bochum', 51.4818, 7.2162, 11], ['Wuppertal', 51.2562, 7.1508, 12], ['Bielefeld', 52.0302, 8.5325, 13],
  ['Bonn', 50.7374, 7.0982, 11], ['Münster', 51.9607, 7.6261, 13], ['Mannheim', 49.4875, 8.466, 11],
  ['Karlsruhe', 49.0069, 8.4037, 12], ['Augsburg', 48.3705, 10.8978, 11], ['Wiesbaden', 50.0782, 8.2398, 12],
  ['Mönchengladbach', 51.1805, 6.4428, 11], ['Gelsenkirchen', 51.5177, 7.0857, 9], ['Aachen', 50.7753, 6.0839, 12],
  ['Braunschweig', 52.2689, 10.5268, 11], ['Chemnitz', 50.8278, 12.9214, 12], ['Kiel', 54.3233, 10.1228, 11],
  ['Halle (Saale)', 51.4825, 11.9705, 11], ['Magdeburg', 52.1205, 11.6276, 12], ['Freiburg im Breisgau', 47.999, 7.8421, 11],
  ['Krefeld', 51.3388, 6.5853, 10], ['Mainz', 49.9929, 8.2473, 10], ['Lübeck', 53.8655, 10.6866, 12],
  ['Erfurt', 50.9848, 11.0299, 12], ['Oberhausen', 51.4963, 6.8638, 9], ['Rostock', 54.0924, 12.0991, 13],
  ['Kassel', 51.3127, 9.4797, 10], ['Hagen', 51.3671, 7.4633, 10], ['Potsdam', 52.3906, 13.0645, 11],
  ['Saarbrücken', 49.2402, 6.9969, 11], ['Hamm', 51.6739, 7.815, 11], ['Ludwigshafen', 49.4774, 8.4452, 9],
  ['Oldenburg', 53.1435, 8.2146, 10], ['Osnabrück', 52.2799, 8.0472, 10], ['Leverkusen', 51.0459, 7.0192, 9],
  ['Solingen', 51.1652, 7.0671, 8], ['Darmstadt', 49.8728, 8.6512, 10], ['Heidelberg', 49.3988, 8.6724, 9],
  ['Herne', 51.5369, 7.2009, 7], ['Neuss', 51.2042, 6.6879, 9], ['Regensburg', 49.0134, 12.1016, 9],
  ['Paderborn', 51.7189, 8.7575, 10], ['Ingolstadt', 48.7665, 11.4258, 10],
  // AT
  ['Wien', 48.2082, 16.3738, 18], ['Graz', 47.0707, 15.4395, 11], ['Linz', 48.3069, 14.2858, 10],
  ['Salzburg', 47.8095, 13.055, 9],
  // CH
  ['Zürich', 47.3769, 8.5417, 11], ['Genf', 46.2044, 6.1432, 9], ['Basel', 47.5596, 7.5886, 8],
  // US
  ['New York', 40.7128, -74.006, 25], ['Los Angeles', 34.0522, -118.2437, 35],
];

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** True when the coordinate lies inside a city with >= 150k inhabitants. */
export function isInBigCity(lat: unknown, lng: unknown): boolean {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return false;
  return BIG_CITIES.some(([, cLat, cLng, r]) => distanceKm(la, ln, cLat, cLng) <= r);
}
