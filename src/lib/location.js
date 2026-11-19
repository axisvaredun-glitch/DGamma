import { LOCATION_KEY, LOCATION_LABEL } from '../config.js';

const STORAGE_KEY = 'atmosphere-location';

export const DEMO_PLACES = [
  {
    key: '208971',
    label: 'Gambir, Jakarta Pusat',
    temperature: 28,
    condition: 'thunderstorm',
    humidity: 84,
    wind: 18,
    uv: 3,
    pressure: 1008,
    offset: 420,
    timeZone: 'Asia/Jakarta',
    lat: -6.1754,
    lon: 106.8272,
  },
  {
    key: '300597',
    label: 'Tegalsari, Surabaya',
    temperature: 31,
    condition: 'cloudy',
    humidity: 72,
    wind: 14,
    uv: 7,
    pressure: 1010,
    offset: 420,
    timeZone: 'Asia/Jakarta',
    lat: -7.2575,
    lon: 112.7521,
  },
  {
    key: '211946',
    label: 'Coblong, Bandung',
    temperature: 24,
    condition: 'rain',
    humidity: 88,
    wind: 10,
    uv: 2,
    pressure: 1012,
    offset: 420,
    timeZone: 'Asia/Jakarta',
    lat: -6.8915,
    lon: 107.6107,
  },
  {
    key: '226396',
    label: 'Shibuya, Tokyo',
    temperature: 18,
    condition: 'clear',
    humidity: 55,
    wind: 12,
    uv: 5,
    pressure: 1018,
    offset: 540,
    timeZone: 'Asia/Tokyo',
    lat: 35.6595,
    lon: 139.7004,
  },
  {
    key: '2643121',
    label: 'Westminster, London',
    temperature: 12,
    condition: 'cloudy',
    humidity: 78,
    wind: 20,
    uv: 1,
    pressure: 1005,
    offset: 0,
    timeZone: 'Europe/London',
    lat: 51.4975,
    lon: -0.1357,
  },
  {
    key: '349727',
    label: 'Midtown, New York',
    temperature: 9,
    condition: 'rain',
    humidity: 81,
    wind: 22,
    uv: 1,
    pressure: 1002,
    offset: -300,
    timeZone: 'America/New_York',
    lat: 40.7549,
    lon: -73.984,
  },
];

export function readSavedLocation() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw?.key && raw?.label) {
      return {
        key: String(raw.key),
        label: String(raw.label),
        lat: raw.lat ?? null,
        lon: raw.lon ?? null,
        timeZone: raw.timeZone || null,
        via: raw.via || 'saved',
      };
    }
  } catch {
    /* ignore */
  }
  return {
    key: LOCATION_KEY,
    label: LOCATION_LABEL,
    lat: null,
    lon: null,
    timeZone: 'Asia/Jakarta',
    via: 'default',
  };
}

export function saveLocation(place) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      key: String(place.key),
      label: String(place.label),
      lat: place.lat ?? null,
      lon: place.lon ?? null,
      timeZone: place.timeZone || null,
      via: place.via || 'saved',
    }),
  );
}

/** Nearest demo Kecamatan when AccuWeather key is missing. */
export function nearestDemoPlace(lat, lon) {
  let best = DEMO_PLACES[0];
  let bestDist = Infinity;
  for (const place of DEMO_PLACES) {
    if (place.lat == null || place.lon == null) continue;
    const dist = (place.lat - lat) ** 2 + (place.lon - lon) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = place;
    }
  }
  return {
    key: best.key,
    label: best.label,
    lat,
    lon,
    timeZone: best.timeZone,
    via: 'demo-gps',
  };
}

/**
 * Build "Kecamatan, Kota/Kabupaten" from AccuWeather location payload.
 */
export function formatKecamatanLabel(row) {
  const kecamatan = row.LocalizedName || row.EnglishName || 'Unknown';
  const area =
    row.AdministrativeArea?.LocalizedName ||
    row.AdministrativeArea?.EnglishName ||
    row.ParentCity?.LocalizedName ||
    row.Country?.LocalizedName ||
    '';
  return area ? `${kecamatan}, ${area}` : kecamatan;
}
