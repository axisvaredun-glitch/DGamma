/**
 * AccuWeather + app switches.
 * DEMO_MODE true = rich demo data (no key needed).
 * For live Kecamatan GPS: set DEMO_MODE false and fill ACCUWEATHER_API_KEY.
 *
 * Admin preview panel: localStorage.setItem('isAdmin', 'true')
 */
export const DEMO_MODE = true;

export const ACCUWEATHER_API_KEY = '';

/** Fallback when GPS is denied / unavailable. */
export const LOCATION_KEY = '208971';
export const LOCATION_LABEL = 'Gambir, Jakarta Pusat';

export const USE_METRIC = true;

/**
 * Base path for looped JPG sets, e.g. "./frames" → ./frames/day-clear/ezgif-frame-001.jpg
 * Leave empty until assets exist; stage then uses CSS placeholder gradients only.
 */
export const FRAMES_BASE = '';
