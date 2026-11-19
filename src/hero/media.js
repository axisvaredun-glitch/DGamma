/**
 * Weather media stage (JPG sequence ready).
 * No SVG weather illustration — only phase + condition modes.
 *
 * Planned folder layout for your video frames:
 *   frames/{phase}/{condition}/frame-001.jpg …
 * Example: frames/day/rain/frame-001.jpg
 */

export const PHASES = ['sunrise', 'day', 'sunset', 'night'];

/** Weather clip modes the UI / AccuWeather mapping can select. */
export const CONDITIONS = [
  'sunny',
  'partly-cloudy',
  'cloudy',
  'rain',
  'thunderstorm',
];

export function mountMedia(root) {
  root.innerHTML = `
    <div class="media" data-phase="day" data-condition="sunny">
      <img class="media-frame" id="media-frame" alt="" />
      <div class="media-fallback">
        <p class="media-mode" id="media-mode">sunny · day</p>
        <p class="media-note">Slot gambar JPG — ganti dengan potongan video</p>
      </div>
    </div>
  `;

  const shell = root.querySelector('.media');
  const mode = root.querySelector('#media-mode');
  const frame = root.querySelector('#media-frame');

  function apply(phase, condition) {
    const nextPhase = PHASES.includes(phase) ? phase : 'day';
    const nextCondition = CONDITIONS.includes(condition) ? condition : 'sunny';

    shell.dataset.phase = nextPhase;
    shell.dataset.condition = nextCondition;
    document.documentElement.dataset.phase = nextPhase;
    document.documentElement.dataset.condition = nextCondition;

    mode.textContent = `${nextCondition} · ${nextPhase}`;

    // When frames exist, point here:
    // frame.src = `./frames/${nextPhase}/${nextCondition}/frame-001.jpg`;
    frame.removeAttribute('src');
    frame.hidden = true;
  }

  return { apply, shell, frame };
}
