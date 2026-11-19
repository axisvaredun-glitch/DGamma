/**
 * Compact cartoon sky + photo grass + asset clouds/bolts + canvas rain.
 */
import { toVisualCondition, VISUAL_PHASES } from '../lib/weatherVisual.js';
import { mountRain } from './rain.js';

const SUN_POS = {
  sunrise: 'translate(318 48)',
  day: 'translate(322 42)',
  sunset: 'translate(316 56)',
  night: 'translate(322 42)',
};

const CLOUD_SRC = {
  few: [
    { file: 'awan.png', className: 'cloud cloud-a' },
    { file: 'awan.png', className: 'cloud cloud-b is-flip' },
  ],
  many: [
    { file: 'awan.png', className: 'cloud cloud-c extra is-flip' },
    { file: 'awan.png', className: 'cloud cloud-d extra' },
  ],
};

const BOLT_FILES = ['b6.png', 'b7.png', 'b3.png', 'b5.png', 'b8.png'];

function assetUrl(folder, file) {
  return new URL(`./assets/${folder}/png/${file}`, import.meta.url).href;
}

function sunMotes() {
  const motes = [
    [36, -4, 1.6],
    [44, 10, 1.2],
    [32, 24, 1.4],
    [-36, -12, 1.3],
    [-44, 8, 1.0],
    [-24, 28, 1.2],
    [14, -34, 0.9],
    [-10, -36, 1.1],
  ];
  return motes
    .map(
      ([x, y, r], i) =>
        `<circle class="sun-mote m${i % 4}" cx="${x}" cy="${y}" r="${r}" fill="#fff6c4"/>`,
    )
    .join('');
}

function skyMarkup() {
  return `
<svg class="sky" viewBox="0 0 400 240" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
  <defs>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8d2" stop-opacity="0.95"/>
      <stop offset="34%" stop-color="#ffd45a" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#ffcc44" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#f4f1e4" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#d8e4f4" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#d8e4f4" stop-opacity="0"/>
    </radialGradient>
    <filter id="softLight" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect class="sky-fill" width="400" height="240"/>
  <g class="sun" transform="${SUN_POS.day}" filter="url(#softLight)">
    <circle class="sun-halo" r="36" fill="url(#sunGlow)"/>
    <circle class="sun-core" r="18" fill="#f5c400"/>
    <circle class="sun-hot" r="10" fill="#fff3b0" opacity="0.65"/>
    ${sunMotes()}
  </g>
  <g class="moon" transform="${SUN_POS.night}">
    <circle class="moon-halo" r="36" fill="url(#moonGlow)"/>
    <circle class="moon-disk" r="18" fill="#f4f1e4"/>
    <circle class="moon-cut" r="16" cx="8" cy="-5"/>
  </g>
</svg>`;
}

function cloudMarkup() {
  const all = [...CLOUD_SRC.few, ...CLOUD_SRC.many];
  return all
    .map(
      (cloud) =>
        `<img class="${cloud.className}" src="${assetUrl('clouds', cloud.file)}" alt="" draggable="false">`,
    )
    .join('');
}

function punchBlack(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = frame.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i] < 24 && px[i + 1] < 24 && px[i + 2] < 24) px[i + 3] = 0;
      }
      ctx.putImageData(frame, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = src;
  });
}

let lightningTimer = null;

function stopLightning() {
  if (lightningTimer != null) {
    clearTimeout(lightningTimer);
    lightningTimer = null;
  }
}

function startLightning(stage, boltEl, layer) {
  stopLightning();
  const loop = () => {
    const origins = cloudOrigins(stage, layer);
    const cloud = origins[Math.floor(Math.random() * Math.max(origins.length, 1))];
    const file = BOLT_FILES[Math.floor(Math.random() * BOLT_FILES.length)];
    boltEl.src = assetUrl('thunder', file);
    if (cloud) {
      boltEl.style.left = `${cloud.x + cloud.w * 0.42}px`;
      boltEl.style.top = `${cloud.y + cloud.h * 0.78}px`;
    } else {
      boltEl.style.left = '28%';
      boltEl.style.top = '42%';
    }
    boltEl.classList.add('on');
    stage.classList.add('flash');
    setTimeout(() => {
      boltEl.classList.remove('on');
      stage.classList.remove('flash');
    }, 160);
    lightningTimer = setTimeout(loop, 2400 + Math.random() * 2600);
  };
  lightningTimer = setTimeout(loop, 520);
}

export function mountScene(stage) {
  if (!stage) return { apply() {} };

  let scene = stage.querySelector('#scene');
  if (!scene) {
    scene = document.createElement('div');
    scene.id = 'scene';
    scene.className = 'scene';
    stage.prepend(scene);
  }
  scene.innerHTML = skyMarkup();

  let clouds = stage.querySelector('.cloud-layer');
  if (!clouds) {
    clouds = document.createElement('div');
    clouds.className = 'cloud-layer';
    stage.appendChild(clouds);
  }
  clouds.innerHTML = cloudMarkup();
  [...clouds.querySelectorAll('img')].forEach((img) => {
    punchBlack(img.src).then((url) => {
      img.src = url;
    });
  });

  let boltEl = stage.querySelector('.bolt-fx');
  if (!boltEl) {
    boltEl = document.createElement('img');
    boltEl.className = 'bolt-fx';
    boltEl.alt = '';
    stage.appendChild(boltEl);
  }

  let ground = stage.querySelector('.ground');
  if (!ground) {
    ground = document.createElement('img');
    ground.className = 'ground';
    ground.alt = '';
    stage.appendChild(ground);
    punchBlack(new URL('./land.png', import.meta.url).href).then((url) => {
      ground.src = url;
    });
  }

  let canvas = stage.querySelector('#rain-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'rain-canvas';
    canvas.className = 'rain-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    stage.appendChild(canvas);
  }

  [scene, clouds, boltEl, canvas, ground].forEach((el) => stage.appendChild(el));

  const sky = scene.querySelector('.sky');
  const sun = sky.querySelector('.sun');
  const moon = sky.querySelector('.moon');
  const rain = mountRain(canvas, () => cloudOrigins(stage, clouds));

  return {
    apply(phase, condition) {
      const p = VISUAL_PHASES.includes(phase) ? phase : 'day';
      const c = toVisualCondition(condition);

      stage.dataset.phase = p;
      stage.dataset.condition = c;
      sky.dataset.phase = p;
      sky.dataset.condition = c;

      sun.setAttribute('transform', SUN_POS[p] || SUN_POS.day);
      moon.setAttribute('transform', SUN_POS.night);

      if (c === 'thunderstorm') {
        rain.setMode('storm');
        startLightning(stage, boltEl, clouds);
      } else if (c === 'rain') {
        rain.setMode('rain');
        stopLightning();
        boltEl.classList.remove('on');
        stage.classList.remove('flash');
      } else {
        rain.setMode('off');
        stopLightning();
        boltEl.classList.remove('on');
        stage.classList.remove('flash');
      }
    },
  };
}

function cloudOrigins(stage, layer) {
  const box = stage.getBoundingClientRect();
  return [...layer.querySelectorAll('.cloud')]
    .filter((el) => Number.parseFloat(getComputedStyle(el).opacity) > 0.2)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return {
        x: r.left - box.left,
        y: r.top - box.top,
        w: r.width,
        h: r.height,
      };
    });
}