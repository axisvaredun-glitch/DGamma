import { DEMO_MODE } from './config.js';
import { fetchWeather, resolveGeoposition, searchLocations } from './api/accuweather.js';
import { mockWeather } from './api/mock.js';
import { gpsStatusText, readGpsPosition } from './lib/geo.js';
import { phaseLabel, solarPhase, wallClockDate } from './lib/solar.js';
import { DEMO_PLACES, readSavedLocation, saveLocation } from './lib/location.js';
import { javaKecamatanCount, searchJavaKecamatan } from './data/javaKecamatan.js';
import { mountScene } from './hero/scene.js';
import { VISUAL_CONDITIONS, VISUAL_PHASES } from './lib/weatherVisual.js';

const PHASES = VISUAL_PHASES;
const CONDITIONS = VISUAL_CONDITIONS;
const PREVIEW_PANEL_KEY = 'previewPanelOpen';

const els = {
  scene: document.querySelector('.stage'),
  phase: document.querySelector('#phase-label'),
  clock: document.querySelector('#clock'),
  place: document.querySelector('#place'),
  placePanel: document.querySelector('#place-panel'),
  placeInput: document.querySelector('#place-input'),
  placeList: document.querySelector('#place-list'),
  gpsBtn: document.querySelector('#gps-btn'),
  gpsBadge: document.querySelector('#gps-badge'),
  temp: document.querySelector('#temp'),
  status: document.querySelector('#status'),
  humidity: document.querySelector('#humidity'),
  wind: document.querySelector('#wind'),
  uv: document.querySelector('#uv'),
  pressure: document.querySelector('#pressure'),
  hourly: document.querySelector('#hourly'),
  debug: document.querySelector('#debug'),
  debugPhase: document.querySelector('#debug-phase'),
  debugCondition: document.querySelector('#debug-condition'),
  debugSync: document.querySelector('#debug-sync'),
  debugCombo: document.querySelector('#debug-combo'),
  debugHide: document.querySelector('#debug-hide'),
  debugLauncher: document.querySelector('#debug-launcher'),
};

const scene = mountScene(els.scene);

let current = null;
let preview = { phase: null, condition: null };
let searchTimer = null;
let gpsBusy = false;

function formatClock(date, timeZone) {
  const options = {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  };
  if (timeZone) options.timeZone = timeZone;
  try {
    return new Intl.DateTimeFormat(undefined, options).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}

function setGpsBadge(code) {
  els.gpsBadge.textContent = gpsStatusText(code);
  els.gpsBadge.dataset.state = code;
  els.gpsBtn.classList.toggle('is-loading', code === 'locating');
  els.gpsBtn.disabled = code === 'locating';
}

function activePhase(weather) {
  return (
    preview.phase ||
    solarPhase(weather.localDate, weather.isDayTime, weather.timeZone || 'Asia/Jakarta')
  );
}

function activeCondition(weather) {
  return preview.condition || weather.condition;
}

function paint(weather) {
  current = weather;
  const phase = activePhase(weather);
  const condition = activeCondition(weather);

  scene.apply(phase, condition);

  els.phase.textContent = phaseLabel(phase);
  els.clock.textContent = formatClock(weather.localDate, weather.timeZone);
  els.place.textContent = weather.location;
  els.temp.textContent = String(weather.temperature);
  els.status.textContent = weather.weatherText;
  els.humidity.textContent = weather.humidity != null ? `${weather.humidity}%` : '—';
  els.wind.textContent = weather.windKph != null ? `${Math.round(weather.windKph)} km/h` : '—';
  els.uv.textContent = weather.uv != null ? String(weather.uv) : '—';
  els.pressure.textContent =
    weather.pressureMb != null ? `${Math.round(weather.pressureMb)} mb` : '—';

  els.hourly.innerHTML = (weather.hourly || [])
    .map(
      (row) => `
      <article class="hour">
        <p class="hour-t">${row.label}</p>
        <p class="hour-v">${row.temperature}°</p>
        <p class="hour-c">${row.condition}</p>
      </article>`,
    )
    .join('');

  document.title = `${weather.temperature}° · ${weather.location}`;
  syncDebug();
}

async function loadPlace(place, badge = 'saved') {
  const next = {
    ...place,
    timeZone: place.timeZone || 'Asia/Jakarta',
  };
  saveLocation(next);
  const weather = await fetchWeather(next);
  paint(weather);
  setGpsBadge(badge);
}

/**
 * High-accuracy GPS → AccuWeather geoposition (Kecamatan) → current conditions.
 */
async function detectGpsLocation() {
  if (gpsBusy) return;
  gpsBusy = true;
  setGpsBadge('locating');

  try {
    const { lat, lon } = await readGpsPosition();
    const place = await resolveGeoposition(lat, lon);
    await loadPlace(place, place.via === 'demo-gps' ? 'demo' : 'ready');
  } catch (error) {
    const code = error.code || 'error';
    setGpsBadge(code);
    if (!current) {
      await loadPlace(readSavedLocation(), code === 'denied' ? 'denied' : 'saved');
    }
  } finally {
    gpsBusy = false;
  }
}

async function setPanelOpen(open) {
  els.placePanel.hidden = !open;
  els.place.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    els.placeInput.value = '';
    els.placeInput.placeholder = 'Cari kecamatan di Pulau Jawa…';
    const total = await javaKecamatanCount();
    const starter = await searchJavaKecamatan('', 20);
    renderResults(
      [
        ...DEMO_PLACES.map((place) => ({
          key: place.key,
          label: place.label,
          detail: 'Quick pick',
        })),
        ...starter,
      ],
      `${total.toLocaleString('id-ID')} kecamatan se-Jawa · ketik untuk mencari`,
    );
    els.placeInput.focus();
  }
}

function renderResults(rows, emptyNote = 'Tidak ada kecamatan') {
  if (!rows.length) {
    els.placeList.innerHTML = `<li class="place-empty">${emptyNote}</li>`;
    return;
  }

  const note = emptyNote
    ? `<li class="place-note">${emptyNote}</li>`
    : '';

  els.placeList.innerHTML =
    note +
    rows
      .map(
        (row) => `
      <li>
        <button type="button" data-key="${row.key}" data-label="${row.label}">
          <span>${row.label}</span>
          <small>${row.detail || ''}</small>
        </button>
      </li>`,
      )
      .join('');
}

els.place.addEventListener('click', () => setPanelOpen(els.placePanel.hidden));
els.gpsBtn.addEventListener('click', () => detectGpsLocation());

els.placeInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  const query = els.placeInput.value.trim();
  searchTimer = setTimeout(async () => {
    try {
      if (!query) {
        const total = await javaKecamatanCount();
        renderResults(await searchJavaKecamatan('', 30), `${total.toLocaleString('id-ID')} kecamatan se-Jawa`);
        return;
      }
      renderResults(await searchLocations(query));
    } catch {
      els.placeList.innerHTML = '<li class="place-empty">Search failed</li>';
    }
  }, 180);
});

els.placeList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-key]');
  if (!button) return;
  setPanelOpen(false);
  const label = button.dataset.label;
  await loadPlace(
    {
      key: button.dataset.key,
      label,
      name: String(label || '').split(',')[0].trim(),
      via: 'search',
      timeZone: 'Asia/Jakarta',
    },
    'saved',
  );
});

document.addEventListener('click', (event) => {
  if (els.placePanel.hidden) return;
  if (event.target.closest('.place-wrap')) return;
  setPanelOpen(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setPanelOpen(false);
});

function readPreviewPanelOpen() {
  try {
    const raw = localStorage.getItem(PREVIEW_PANEL_KEY);
    if (raw == null) return true;
    return raw !== '0' && raw !== 'false';
  } catch {
    return true;
  }
}

function writePreviewPanelOpen(open) {
  try {
    localStorage.setItem(PREVIEW_PANEL_KEY, open ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function setPreviewPanelOpen(open) {
  if (!els.debug) return;
  els.debug.classList.toggle('is-open', open);
  els.debug.hidden = !open;
  if (els.debugLauncher) {
    els.debugLauncher.hidden = open;
  }
  writePreviewPanelOpen(open);
}

function syncDebug() {
  if (!els.debug) return;
  const phase = current ? activePhase(current) : null;
  const condition = current ? activeCondition(current) : null;

  if (els.debugCombo) {
    els.debugCombo.textContent = phase && condition ? `${phase} · ${condition}` : '—';
  }
  els.debugPhase.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('on', button.dataset.phase === phase);
  });
  els.debugCondition.querySelectorAll('button').forEach((button) => {
    button.classList.toggle('on', button.dataset.condition === condition);
  });
}

async function adjustToCurrentWeather() {
  preview = { phase: null, condition: null };
  await detectGpsLocation();
  if (!current) await loadPlace(readSavedLocation(), 'saved');
  else paint(current);
}

function buildDebug() {
  if (!els.debug) return;

  setPreviewPanelOpen(readPreviewPanelOpen());

  els.debugHide?.addEventListener('click', () => setPreviewPanelOpen(false));
  els.debugLauncher?.addEventListener('click', () => setPreviewPanelOpen(true));

  els.debugPhase.innerHTML = PHASES.map(
    (phase) => `<button type="button" data-phase="${phase}">${phase}</button>`,
  ).join('');
  els.debugCondition.innerHTML = CONDITIONS.map(
    (condition) =>
      `<button type="button" data-condition="${condition}">${condition}</button>`,
  ).join('');

  els.debugPhase.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-phase]');
    if (!button || !current) return;
    preview.phase = button.dataset.phase;
    const hour =
      {
        sunrise: 6,
        day: 12,
        sunset: 18,
        night: 22,
      }[preview.phase] ?? 12;
    paint({
      ...current,
      ...mockWeather(
        { key: current.locationKey, label: current.location, timeZone: current.timeZone },
        { hour, condition: activeCondition(current) },
      ),
      location: current.location,
      locationKey: current.locationKey,
      timeZone: current.timeZone,
      source: current.source,
      via: current.via,
    });
  });

  els.debugCondition.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-condition]');
    if (!button || !current) return;
    preview.condition = button.dataset.condition;
    paint({
      ...current,
      condition: preview.condition,
      weatherText:
        {
          clear: 'Clear',
          'partly-cloudy': 'Partly cloudy',
          cloudy: 'Cloudy',
          rain: 'Rain',
          thunderstorm: 'Thunderstorm',
        }[preview.condition] || current.weatherText,
    });
  });

  els.debugSync.addEventListener('click', () => {
    adjustToCurrentWeather();
  });
}

buildDebug();

async function boot() {
  // Show fallback immediately, then upgrade with GPS Kecamatan lock.
  await loadPlace(readSavedLocation(), 'saved');
  await detectGpsLocation();

  if (DEMO_MODE) {
    setInterval(() => {
      if (!current || preview.phase || preview.condition) return;
      const zone = current.timeZone || 'Asia/Jakarta';
      const localDate = wallClockDate(zone);
      const hour = localDate.getHours() + localDate.getMinutes() / 60;
      paint({
        ...current,
        localDate,
        isDayTime: hour >= 6 && hour < 18,
      });
    }, 60_000);
  }
}

boot();
