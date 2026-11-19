import { ACCUWEATHER_API_KEY, DEMO_MODE, USE_METRIC } from '../config.js';
import { mockWeather } from './mock.js';
import { normalizeCondition, wallClockDate } from '../lib/solar.js';
import {
  DEMO_PLACES,
  formatKecamatanLabel,
  nearestDemoPlace,
  readSavedLocation,
} from '../lib/location.js';

const BASE = 'https://dataservice.accuweather.com';

function liveEnabled() {
  return Boolean(ACCUWEATHER_API_KEY?.trim()) && !DEMO_MODE;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`AccuWeather ${response.status}`);
  return response.json();
}

/**
 * Resolve GPS coordinates to a Kecamatan-level AccuWeather location.
 * Uses toplevel=false so AccuWeather does not snap only to the parent city.
 */
export async function resolveGeoposition(lat, lon) {
  if (!liveEnabled()) {
    return nearestDemoPlace(lat, lon);
  }

  const url =
    `${BASE}/locations/v1/cities/geoposition/search` +
    `?apikey=${encodeURIComponent(ACCUWEATHER_API_KEY)}` +
    `&q=${encodeURIComponent(`${lat},${lon}`)}` +
    `&details=true&toplevel=false`;

  const row = await getJson(url);
  if (!row?.Key) throw new Error('Geoposition returned no location');

  return {
    key: String(row.Key),
    label: formatKecamatanLabel(row),
    lat: row.GeoPosition?.Latitude ?? lat,
    lon: row.GeoPosition?.Longitude ?? lon,
    timeZone: row.TimeZone?.Name || null,
    gmtOffsetHours: row.TimeZone?.GmtOffset ?? null,
    via: 'gps',
    raw: row,
  };
}

export async function searchLocations(query) {
  const { searchJavaKecamatan } = await import('../data/javaKecamatan.js');

  // Always search the full Pulau Jawa Kecamatan dataset locally.
  const javaHits = await searchJavaKecamatan(query, 40);

  if (!liveEnabled()) {
    return javaHits.map((row) => ({
      ...row,
      detail: `${row.detail} · Jawa`,
    }));
  }

  // Live mode: merge AccuWeather autocomplete with the Jawa Kecamatan list.
  const q = query.trim();
  if (!q) return javaHits;

  try {
    const url =
      `${BASE}/locations/v1/cities/autocomplete` +
      `?apikey=${encodeURIComponent(ACCUWEATHER_API_KEY)}&q=${encodeURIComponent(q)}`;
    const rows = await getJson(url);
    const live = (Array.isArray(rows) ? rows : []).slice(0, 8).map((row) => ({
      key: String(row.Key),
      label: formatKecamatanLabel(row),
      detail: [row.AdministrativeArea?.LocalizedName, row.Country?.LocalizedName]
        .filter(Boolean)
        .join(', '),
    }));

    const seen = new Set(live.map((row) => row.label.toLowerCase()));
    const merged = [...live];
    for (const row of javaHits) {
      if (seen.has(row.label.toLowerCase())) continue;
      merged.push(row);
      if (merged.length >= 40) break;
    }
    return merged;
  } catch {
    return javaHits;
  }
}

async function resolveLivePlace(place) {
  if (!String(place.key || '').startsWith('java-')) return place;

  // Map BPS Kecamatan → AccuWeather LocationKey via autocomplete.
  const query = place.name || String(place.label || '').split(',')[0].trim();
  if (!query) return place;

  const url =
    `${BASE}/locations/v1/cities/autocomplete` +
    `?apikey=${encodeURIComponent(ACCUWEATHER_API_KEY)}&q=${encodeURIComponent(query)}`;
  const rows = await getJson(url);
  const first = Array.isArray(rows) ? rows[0] : null;
  if (!first?.Key) return place;

  return {
    ...place,
    key: String(first.Key),
    label: place.label || formatKecamatanLabel(first),
    timeZone: place.timeZone || null,
    via: place.via || 'java-map',
  };
}

export async function fetchWeather(place = readSavedLocation()) {
  if (!liveEnabled() || !place.key) {
    return {
      ...mockWeather(place),
      location: place.label,
      locationKey: place.key,
      timeZone: place.timeZone || mockWeather(place).timeZone,
      lat: place.lat,
      lon: place.lon,
      via: place.via || 'demo',
      source: 'demo',
    };
  }

  try {
    place = await resolveLivePlace(place);
    const currentUrl =
      `${BASE}/currentconditions/v1/${encodeURIComponent(place.key)}` +
      `?apikey=${encodeURIComponent(ACCUWEATHER_API_KEY)}&details=true`;
    const rows = await getJson(currentUrl);
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) throw new Error('Empty AccuWeather payload');

    // Prefer AccuWeather observation time, projected into the location timezone wall clock.
    const observed = new Date(row.LocalObservationDateTime);
    const timeZone = place.timeZone || 'Asia/Jakarta';
    const localDate = wallClockDate(timeZone, observed);
    const metric = USE_METRIC;
    const tempBlock = metric ? row.Temperature?.Metric : row.Temperature?.Imperial;
    const windBlock = metric ? row.Wind?.Speed?.Metric : row.Wind?.Speed?.Imperial;
    const pressureBlock = metric ? row.Pressure?.Metric : row.Pressure?.Imperial;
    const condition = normalizeCondition(row.WeatherText, Number(row.WeatherIcon) || 1);

    let hourly = [];
    try {
      const hourlyUrl =
        `${BASE}/forecasts/v1/hourly/12hour/${encodeURIComponent(place.key)}` +
        `?apikey=${encodeURIComponent(ACCUWEATHER_API_KEY)}&metric=${metric}`;
      const hours = await getJson(hourlyUrl);
      hourly = (Array.isArray(hours) ? hours : []).slice(0, 8).map((item) => ({
        label: new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          timeZone,
        }).format(new Date(item.DateTime)),
        temperature: Math.round(Number(item.Temperature?.Value ?? 0)),
        condition: normalizeCondition(item.IconPhrase, Number(item.WeatherIcon) || 1),
      }));
    } catch {
      hourly = mockWeather(place).hourly;
    }

    return {
      location: place.label,
      locationKey: place.key,
      lat: place.lat ?? null,
      lon: place.lon ?? null,
      via: place.via || 'accuweather',
      timeZone,
      timezoneOffsetMinutes:
        place.gmtOffsetHours != null
          ? Number(place.gmtOffsetHours) * 60
          : localDate.getTimezoneOffset() * -1,
      localDate,
      temperature: Math.round(Number(tempBlock?.Value ?? 0)),
      unit: tempBlock?.Unit || (metric ? 'C' : 'F'),
      weatherText: row.WeatherText || 'Clear',
      condition,
      isDayTime: Boolean(row.IsDayTime),
      humidity: row.RelativeHumidity ?? null,
      windKph: windBlock?.Value ?? null,
      uv: row.UVIndex ?? null,
      pressureMb: pressureBlock?.Value ?? null,
      hourly,
      source: 'accuweather',
    };
  } catch (error) {
    console.warn('AccuWeather unavailable, using demo data.', error);
    return {
      ...mockWeather(place),
      location: place.label,
      locationKey: place.key,
      timeZone: place.timeZone || null,
      via: place.via || 'demo-fallback',
      source: 'demo-fallback',
    };
  }
}
