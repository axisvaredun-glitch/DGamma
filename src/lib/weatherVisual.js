/**
 * Visual state for JPG / frame-sequence backgrounds (replaces SVG hero).
 *
 * Folder convention (you add assets later):
 *   frames/{phase}-{condition}/ezgif-frame-001.jpg
 *
 * phase: sunrise | day | sunset | night
 * condition: clear | partly-cloudy | cloudy | rain | thunderstorm
 *
 * Set FRAMES_BASE in config when files are ready; until then the stage
 * shows a simple gradient keyed only by phase + condition.
 */
import { FRAMES_BASE } from '../config.js';

export const VISUAL_CONDITIONS = [
  'clear',
  'partly-cloudy',
  'cloudy',
  'rain',
  'thunderstorm',
];

export const VISUAL_PHASES = ['sunrise', 'day', 'sunset', 'night'];

/** Map AccuWeather bucket → visual bucket (add partly-cloudy at API layer if needed). */
export function toVisualCondition(condition) {
  if (condition === 'partly-cloudy') return 'partly-cloudy';
  if (VISUAL_CONDITIONS.includes(condition)) return condition;
  return 'cloudy';
}

export function frameFolder(phase, condition) {
  const c = toVisualCondition(condition);
  return `${FRAMES_BASE}/${phase}-${c}`;
}

export function applyVisualStage(stageEl, frameImg, phase, condition) {
  const p = VISUAL_PHASES.includes(phase) ? phase : 'day';
  const c = toVisualCondition(condition);

  stageEl.dataset.phase = p;
  stageEl.dataset.condition = c;

  document.documentElement.dataset.phase = p;
  document.documentElement.dataset.condition = c;

  if (frameImg) {
    // First frame placeholder — swap to scroll/autoplay logic when JPGs exist
    frameImg.alt = `${p}, ${c}`;
    frameImg.dataset.frameSet = `${p}-${c}`;
    if (FRAMES_BASE) {
      frameImg.src = `${frameFolder(p, c)}/ezgif-frame-001.jpg`;
      frameImg.onerror = () => {
        frameImg.removeAttribute('src');
      };
    } else {
      frameImg.removeAttribute('src');
    }
  }
}