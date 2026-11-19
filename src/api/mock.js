import { DEMO_PLACES } from '../lib/location.js';
import { wallClockDate } from '../lib/solar.js';

const CONDITIONS = ['clear', 'partly-cloudy', 'cloudy', 'rain', 'thunderstorm'];

function hourlyFrom(seedTemp, condition, timeZone) {
  return Array.from({ length: 8 }, (_, i) => {
    const swing = Math.round(Math.sin(i / 2.2) * 2);
    return {
      label: new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        timeZone,
      }).format(new Date(Date.now() + i * 60 * 60 * 1000)),
      temperature: seedTemp + swing,
      condition,
    };
  });
}

function hashCondition(seed) {
  let h = 0;
  const text = String(seed || '');
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return CONDITIONS[h % CONDITIONS.length];
}

function hashTemp(seed, base = 27) {
  let h = 0;
  const text = String(seed || '');
  for (let i = 0; i < text.length; i += 1) h = (h * 17 + text.charCodeAt(i)) >>> 0;
  return base - 4 + (h % 9);
}

export function mockWeather(place = {}, overrides = {}) {
  const params = new URLSearchParams(location.search);
  const preset =
    DEMO_PLACES.find((row) => row.key === place.key || row.label === place.label) || null;

  const timeZone = place.timeZone || preset?.timeZone || 'Asia/Jakarta';
  const seed = place.key || place.label || 'jakarta';

  const condition =
    overrides.condition ||
    params.get('condition') ||
    preset?.condition ||
    hashCondition(seed);

  let localDate = overrides.localDate
    ? new Date(overrides.localDate)
    : wallClockDate(timeZone);

  if (overrides.hour != null) {
    localDate = wallClockDate(timeZone);
    localDate.setHours(Number(overrides.hour), 30, 0, 0);
  } else if (params.get('hour') != null && params.get('hour') !== '') {
    localDate = wallClockDate(timeZone);
    localDate.setHours(Number(params.get('hour')), 30, 0, 0);
  }

  const labels = {
    clear: 'Clear',
    'partly-cloudy': 'Partly cloudy',
    cloudy: 'Cloudy',
    rain: 'Rain',
    thunderstorm: 'Thunderstorm',
  };

  const temperature = preset?.temperature ?? hashTemp(seed);
  const hour = localDate.getHours() + localDate.getMinutes() / 60;

  return {
    location: place.label || preset?.label || 'Jakarta',
    locationKey: place.key || preset?.key || '208971',
    lat: place.lat ?? preset?.lat ?? null,
    lon: place.lon ?? preset?.lon ?? null,
    timeZone,
    timezoneOffsetMinutes: preset?.offset ?? 420,
    localDate,
    temperature,
    unit: 'C',
    weatherText: labels[condition] || 'Clear',
    condition: labels[condition] ? condition : 'clear',
    isDayTime: hour >= 6 && hour < 18,
    humidity: preset?.humidity ?? 65 + (hashTemp(seed + 'h', 0) % 25),
    windKph: preset?.wind ?? 8 + (hashTemp(seed + 'w', 0) % 16),
    uv: preset?.uv ?? (hour >= 10 && hour <= 15 ? 6 : 2),
    pressureMb: preset?.pressure ?? 1008 + (hashTemp(seed + 'p', 0) % 12),
    hourly: hourlyFrom(temperature, condition, timeZone),
  };
}
