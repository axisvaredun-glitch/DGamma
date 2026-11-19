/**
 * Canvas rain. Direction is fixed; only spawn timing/position is random.
 */

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

const DIR_X = -0.42;
const DIR_Y = 1;
const LENGTH = 18;
const SPEED = 7.2;

export function mountRain(canvas, getOrigins) {
  const ctx = canvas.getContext('2d');
  const particles = [];
  let mode = 'off';
  let frameId = 0;
  let running = false;

  function sizeToStage() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn() {
    const storm = mode === 'storm';
    const chance = storm ? 0.45 : 0.22;
    if (Math.random() > chance) return;
    const cap = storm ? 36 : 18;
    if (particles.length >= cap) return;

    const origins = typeof getOrigins === 'function' ? getOrigins() : [];
    const cloud = origins.length
      ? origins[Math.floor(Math.random() * origins.length)]
      : null;

    let x;
    let y;
    if (cloud && cloud.w > 8) {
      x = cloud.x + getRandom(cloud.w * 0.12, cloud.w * 0.88);
      y = cloud.y + cloud.h * 0.72 + getRandom(0, 10);
    } else {
      x = getRandom(0, canvas.clientWidth);
      y = getRandom(8, 40);
    }

    particles.push({
      x,
      y,
      alpha: storm ? 0.38 : 0.26,
    });
  }

  function loop() {
    if (!running) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    spawn();

    ctx.lineCap = 'round';
    ctx.lineWidth = 1.2;

    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const drop = particles[i];
      ctx.strokeStyle = `rgba(210, 220, 230, ${drop.alpha})`;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x + DIR_X * LENGTH, drop.y + DIR_Y * LENGTH);
      ctx.stroke();
      drop.x += DIR_X * SPEED;
      drop.y += DIR_Y * SPEED;
      if (drop.y > h * 0.82) particles.splice(i, 1);
    }

    frameId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    if (frameId) cancelAnimationFrame(frameId);
    frameId = 0;
    particles.length = 0;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  }

  sizeToStage();
  const resize = new ResizeObserver(() => sizeToStage());
  resize.observe(canvas.parentElement);

  return {
    setMode(next) {
      mode = next === 'storm' || next === 'rain' ? next : 'off';
      canvas.hidden = mode === 'off';
      if (mode === 'off') stop();
      else start();
    },
    destroy() {
      stop();
      resize.disconnect();
    },
  };
}