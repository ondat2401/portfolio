export function createFeedback() {
  return { particles: Array.from({ length: 32 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, duration: 0, size: 0, color: '' })), cursor: 0, shake: 0, freeze: 0, impact: 0, scoreLife: 0 };
}

export function clearFeedback(fx) {
  for (const p of fx.particles) p.life = 0;
  fx.shake = fx.freeze = fx.impact = fx.scoreLife = 0;
  fx.cursor = 0;
}

export function emitFeedback(fx, type, x, y) {
  const hit = type === 'hit', score = type === 'score';
  const count = hit ? 18 : score ? 9 : type === 'land' ? 8 : 5;
  if (hit) {
    fx.shake = Math.min(1, fx.shake + .8);
    fx.freeze = .065;
    fx.impact = .22;
  } else if (score) fx.scoreLife = .55;
  else if (type === 'land') fx.shake = Math.min(1, fx.shake + .16);
  for (let i = 0; i < count; i++) {
    const p = fx.particles[fx.cursor];
    fx.cursor = (fx.cursor + 1) % fx.particles.length;
    const angle = hit || score ? i * 2.39996 : -Math.PI * (i + .5) / count;
    const speed = hit ? 90 + i % 4 * 35 : score ? 65 : 35 + i % 3 * 20;
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 35;
    p.duration = p.life = hit ? .48 : .32;
    p.size = hit ? 3 + i % 3 : 2 + i % 2;
    p.color = score ? '#d9ad61' : hit && i % 2 ? '#b34a40' : '#eee5d2';
  }
}

export function updateFeedback(fx, dt) {
  let changed = fx.shake > 0 || fx.freeze > 0 || fx.impact > 0 || fx.scoreLife > 0;
  fx.shake = Math.max(0, fx.shake - dt * 2.8);
  if (fx.freeze > 0) { fx.freeze = Math.max(0, fx.freeze - dt); return true; }
  fx.impact = Math.max(0, fx.impact - dt);
  fx.scoreLife = Math.max(0, fx.scoreLife - dt);
  for (const p of fx.particles) {
    if (p.life <= 0) continue;
    changed = true;
    p.life = Math.max(0, p.life - dt);
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vy += 200 * dt;
  }
  return changed;
}

export function drawFeedback(ctx, fx) {
  ctx.save();
  for (const p of fx.particles) {
    if (p.life <= 0) continue;
    ctx.globalAlpha = p.life / p.duration;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  if (fx.scoreLife > 0) {
    ctx.globalAlpha = Math.min(1, fx.scoreLife * 5);
    ctx.textAlign = 'center';
    ctx.font = 'bold 23px monospace';
    ctx.fillStyle = '#d9ad61';
    ctx.fillText('+100', 164, 204 - (1 - fx.scoreLife / .55) * 25);
  }
  if (fx.impact > 0) {
    ctx.globalAlpha = fx.impact / .22;
    ctx.strokeStyle = '#b34a40';
    ctx.lineWidth = 8;
    ctx.strokeRect(16, 14, 736, 324);
  }
  ctx.restore();
}
