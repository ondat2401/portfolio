export const RUNNER_WIDTH = 768;
export const RUNNER_HEIGHT = 352;

export function createRunner() {
  return { phase: 'ready', y: 0, previousY: 0, velocity: 0, ducking: false, duckBlend: 0, obstacleX: 830, previousObstacleX: 830, flying: false, score: 0, distance: 0, previousDistance: 0, time: 0, landing: 0 };
}

export function startRunner(game) {
  Object.assign(game, createRunner());
  game.phase = 'running';
}

export function jump(game) {
  if (game.phase === 'running' && game.y === 0 && !game.ducking) game.velocity = 650;
}

export function setDuck(game, held) {
  game.ducking = game.phase === 'running' && held;
  if (game.ducking && game.y > 0) game.velocity = Math.min(game.velocity, -500);
}

// Called at a fixed 60 Hz so collision and jump timing do not depend on refresh rate.
export function stepRunner(game, dt) {
  if (game.phase !== 'running') return;
  game.previousY = game.y;
  game.previousObstacleX = game.obstacleX;
  game.previousDistance = game.distance;
  game.time += dt;
  game.duckBlend += (Number(game.ducking && game.y === 0) - game.duckBlend) * (1 - Math.exp(-dt * 28));
  game.landing = Math.max(0, game.landing - dt);
  game.velocity -= (game.ducking && game.y > 0 ? 3400 : 1700) * dt;
  game.y = Math.max(0, game.y + game.velocity * dt);
  if (game.y === 0 && game.previousY > 0) game.landing = .14;
  if (game.y === 0) game.velocity = 0;
  const movement = Math.min(420, 290 + game.score * 8) * dt;
  game.obstacleX -= movement;
  game.distance += movement;
  const playerHeight = game.ducking && game.y === 0 ? 24 : 48;
  const playerLeft = game.ducking && game.y === 0 ? 115 : 120;
  const playerRight = game.ducking && game.y === 0 ? 165 : 160;
  const obstacleBottom = game.flying ? 34 : 0;
  const obstacleTop = game.flying ? 64 : 44;
  if (game.obstacleX < playerRight && game.obstacleX + 36 > playerLeft && game.y < obstacleTop && game.y + playerHeight > obstacleBottom) {
    game.phase = 'over';
  } else if (game.obstacleX < -36) {
    game.score++;
    game.flying = game.score % 3 === 2;
    game.obstacleX = 768 + (game.score % 3) * 80;
    game.previousObstacleX = game.obstacleX;
  }
}

export function drawRunner(ctx, game, paused, alpha = 1) {
  const height = game.previousY + (game.y - game.previousY) * alpha;
  const obstacleX = game.previousObstacleX + (game.obstacleX - game.previousObstacleX) * alpha;
  const distance = game.previousDistance + (game.distance - game.previousDistance) * alpha;
  const ink = '#191918', paper = '#eee5d2', red = '#b34a40', gold = '#d9ad61';
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, RUNNER_WIDTH, RUNNER_HEIGHT);
  ctx.strokeStyle = paper;
  ctx.lineWidth = 3;
  ctx.strokeRect(12, 10, 744, 332);
  ctx.textAlign = 'left';
  ctx.fillStyle = paper;
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`1UP ${String(game.score * 100).padStart(6, '0')}`, 30, 38);
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px Impact, sans-serif';
  ctx.fillText('ONE MORE TRY', 384, 81);
  ctx.fillStyle = gold;
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SMALL STEPS. BIG JUMPS.', 384, 106);
  for (let i = 0; i < 9; i++) {
    const x = 45 + i * 83;
    const y = 141 + (i % 3) * 23;
    ctx.fillRect(x, y, 3, 3);
  }
  ctx.fillStyle = paper;
  ctx.fillRect(24, 260, 720, 8);
  ctx.fillStyle = red;
  ctx.fillRect(24, 268, 720, 20);
  ctx.fillStyle = ink;
  for (let x = 24 - distance % 24; x < 744; x += 24) ctx.fillRect(x, 275, 12, 4);
  ctx.fillStyle = gold;
  if (game.flying) {
    const wing = Math.sin(game.time * 18) * 10;
    ctx.fillRect(obstacleX, 196, 36, 30);
    ctx.strokeStyle = gold;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(obstacleX + 4, 207); ctx.lineTo(obstacleX - 12, 202 + wing);
    ctx.moveTo(obstacleX + 32, 207); ctx.lineTo(obstacleX + 48, 202 - wing);
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.fillRect(obstacleX + 6, 204, 7, 6);
  } else {
    ctx.fillRect(obstacleX, 216, 36, 44);
    ctx.fillStyle = ink;
    ctx.fillRect(obstacleX + 15, 224, 6, 27);
  }
  const running = game.phase === 'running';
  const stride = running && height < 1 ? Math.sin((game.time + alpha / 60) * 19) : 0;
  const squash = game.landing / .14;
  const stretch = height > 1 ? Math.min(.12, Math.abs(game.velocity) / 5000) : -.16 * squash;
  ctx.save();
  ctx.translate(140, 260 - height);
  ctx.scale((1 - stretch * .65) * (1 + game.duckBlend * .22), (1 + stretch) * (1 - game.duckBlend * .54));
  ctx.rotate(height > 1 ? -.08 : stride * .025);
  ctx.strokeStyle = paper;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-10, -18); ctx.lineTo(-23, -10 + stride * 8);
  ctx.moveTo(10, -18); ctx.lineTo(23, -10 - stride * 8);
  ctx.moveTo(-8, -9); ctx.lineTo(-10 + stride * 9, -2 - Math.max(0, stride) * 6);
  ctx.moveTo(8, -9); ctx.lineTo(10 - stride * 9, -2 - Math.max(0, -stride) * 6);
  ctx.stroke();
  ctx.fillStyle = paper;
  ctx.fillRect(-20, -48 - Math.abs(stride) * 2, 40, 26);
  ctx.fillStyle = ink;
  ctx.fillRect(-13, -40, 6, 6);
  ctx.fillRect(7, -40, 6, 6);
  ctx.fillStyle = red;
  ctx.fillRect(-14, -22, 28, 14);
  ctx.restore();
  const message = paused ? 'PAUSED / PRESS PLAY' : game.phase === 'over' ? 'GAME OVER / PRESS PLAY' : game.phase === 'ready' ? 'PRESS PLAY' : '';
  if (message) {
    ctx.fillStyle = paper;
    ctx.font = 'bold 23px Impact, sans-serif';
    ctx.fillText(message, 384, 315);
  }
}
