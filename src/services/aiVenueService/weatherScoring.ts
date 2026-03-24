/**
 * Weather-Aware Scoring
 * Uses Open-Meteo (free, no API key) to adjust venue scores
 * based on current weather conditions.
 * - Good weather → boost outdoor/terrace/garden venues
 * - Bad weather → boost cozy/indoor/fireplace venues
 */

interface WeatherData {
  temperature: number; // °C
  weatherCode: number; // WMO code
  isGoodWeather: boolean;
  label: string;
}

interface WeatherScoreResult {
  bonus: number;
  penalty: number;
  reason: string | null;
  weather: WeatherData | null;
}

// Cache weather per location for 30 min
let weatherCache: { lat: number; lon: number; data: WeatherData; ts: number } | null = null;
const WEATHER_CACHE_TTL = 30 * 60 * 1000;

// WMO Weather codes: https://open-meteo.com/en/docs
// 0-3: Clear/Partly cloudy, 45-48: Fog, 51-67: Drizzle/Rain, 71-77: Snow, 80-82: Showers, 95-99: Thunderstorm
const GOOD_WEATHER_CODES = new Set([0, 1, 2, 3]); // Clear to partly cloudy
const BAD_WEATHER_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99]);

function classifyWeather(code: number, temp: number): { isGood: boolean; label: string } {
  if (BAD_WEATHER_CODES.has(code)) {
    if (code >= 95) return { isGood: false, label: 'Gewitter' };
    if (code >= 71) return { isGood: false, label: 'Schnee' };
    return { isGood: false, label: 'Regen' };
  }
  if (temp < 5) return { isGood: false, label: 'Kalt' };
  if (GOOD_WEATHER_CODES.has(code) && temp >= 15) return { isGood: true, label: 'Schönes Wetter' };
  if (GOOD_WEATHER_CODES.has(code)) return { isGood: true, label: 'Angenehm' };
  return { isGood: false, label: 'Bewölkt' };
}

async function fetchCurrentWeather(lat: number, lon: number): Promise<WeatherData | null> {
  const now = Date.now();
  if (
    weatherCache &&
    Math.abs(weatherCache.lat - lat) < 0.1 &&
    Math.abs(weatherCache.lon - lon) < 0.1 &&
    (now - weatherCache.ts) < WEATHER_CACHE_TTL
  ) {
    return weatherCache.data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const json = await res.json();
    const temp = json.current?.temperature_2m ?? 15;
    const code = json.current?.weather_code ?? 3;
    const { isGood, label } = classifyWeather(code, temp);

    const data: WeatherData = {
      temperature: temp,
      weatherCode: code,
      isGoodWeather: isGood,
      label,
    };

    weatherCache = { lat, lon, data, ts: now };
    return data;
  } catch (e) {
    console.warn('⚠️ WEATHER: Failed to fetch weather data:', e);
    return null;
  }
}

const OUTDOOR_KEYWORDS = ['outdoor', 'terrace', 'terrasse', 'garden', 'garten', 'beer garden', 'biergarten', 'rooftop', 'patio', 'balkon', 'open air', 'draußen'];
const INDOOR_COZY_KEYWORDS = ['cozy', 'gemütlich', 'fireplace', 'kamin', 'indoor', 'warm', 'lounge', 'wine bar', 'fondue', 'raclette'];

/**
 * Calculate weather-based score modifier for a venue.
 * Max bonus: +6, max penalty: -6
 */
export async function getWeatherScore(
  venue: { tags?: string[] | null; name?: string | null; description?: string | null },
  userLocation?: { latitude: number; longitude: number } | null
): Promise<WeatherScoreResult> {
  if (!userLocation?.latitude || !userLocation?.longitude) {
    return { bonus: 0, penalty: 0, reason: null, weather: null };
  }

  const weather = await fetchCurrentWeather(userLocation.latitude, userLocation.longitude);
  if (!weather) {
    return { bonus: 0, penalty: 0, reason: null, weather: null };
  }

  const venueTags = (venue.tags || []).map(t => t.toLowerCase());
  const venueText = [
    ...venueTags,
    (venue.name || '').toLowerCase(),
    (venue.description || '').toLowerCase(),
  ].join(' ');

  const isOutdoorVenue = OUTDOOR_KEYWORDS.some(kw => venueText.includes(kw));
  const isCozyVenue = INDOOR_COZY_KEYWORDS.some(kw => venueText.includes(kw));

  if (weather.isGoodWeather) {
    // Good weather: boost outdoor, no penalty for indoor
    if (isOutdoorVenue) {
      return {
        bonus: 6,
        penalty: 0,
        reason: `${weather.label} (${Math.round(weather.temperature)}°C) – perfekt für draußen`,
        weather,
      };
    }
    return { bonus: 0, penalty: 0, reason: null, weather };
  } else {
    // Bad weather: boost cozy indoor, penalize outdoor
    if (isCozyVenue) {
      return {
        bonus: 5,
        penalty: 0,
        reason: `${weather.label} – ideal für gemütliche Indoor-Locations`,
        weather,
      };
    }
    if (isOutdoorVenue) {
      return {
        bonus: 0,
        penalty: -6,
        reason: `${weather.label} – Outdoor weniger empfehlenswert`,
        weather,
      };
    }
    return { bonus: 0, penalty: 0, reason: null, weather };
  }
}
