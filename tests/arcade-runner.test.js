import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRunner, startRunner, jump, setDuck, stepRunner, drawRunner } from '../assets/js/features/arcade-runner.js';

test('waits for input, cannot double jump, lands at ground level', () => {
  const game = createRunner();
  stepRunner(game, 1 / 60);
  assert.equal(game.phase, 'ready');
  startRunner(game);
  assert.equal(game.velocity, 0);
  jump(game);
  stepRunner(game, 1 / 60);
  const velocity = game.velocity;
  jump(game);
  assert.equal(game.velocity, velocity);
  for (let i = 0; i < 60; i++) stepRunner(game, 1 / 60);
  assert.equal(game.y, 0);
});

test('Space cannot start or restart a run; Play resets it', () => {
  const game = createRunner();
  jump(game);
  assert.equal(game.phase, 'ready');
  game.phase = 'over';
  game.score = 12;
  jump(game);
  assert.equal(game.phase, 'over');
  startRunner(game);
  assert.equal(game.score, 0);
  assert.equal(game.y, 0);
  assert.equal(game.velocity, 0);
});

test('character animation has intermediate poses and rendering interpolates physics', () => {
  const game = createRunner();
  startRunner(game);
  jump(game);
  stepRunner(game, 1 / 60);
  const poses = [];
  const ctx = new Proxy({}, { get: (_, key) => key === 'translate' ? (x, y) => poses.push([x, y]) : () => {} , set: () => true });
  drawRunner(ctx, game, false, 0);
  drawRunner(ctx, game, false, .5);
  drawRunner(ctx, game, false, 1);
  assert.equal(poses.length, 3);
  assert.ok(poses[0][1] > poses[1][1] && poses[1][1] > poses[2][1]);
});

test('collision ends the run; retry resets score and obstacle', () => {
  const game = createRunner();
  game.phase = 'running';
  game.obstacleX = 150;
  stepRunner(game, 1 / 60);
  assert.equal(game.phase, 'over');
  startRunner(game);
  assert.equal(game.phase, 'running');
  assert.equal(game.score, 0);
  assert.ok(game.obstacleX > 768);
});

test('a timed jump clears the obstacle and earns exactly one point', () => {
  const game = createRunner();
  game.phase = 'running';
  game.obstacleX = 270;
  jump(game);
  for (let i = 0; i < 75; i++) stepRunner(game, 1 / 60);
  assert.equal(game.phase, 'running');
  assert.equal(game.score, 1);
  assert.equal(game.y, 0);
});

test('ducking clears a flying obstacle; standing collides; ground blocks still hit', () => {
  for (const [duck, flying, phase] of [[true, true, 'running'], [false, true, 'over'], [true, false, 'over']]) {
    const game = createRunner();
    startRunner(game);
    game.obstacleX = 150;
    game.flying = flying;
    setDuck(game, duck);
    stepRunner(game, 1 / 60);
    assert.equal(game.phase, phase);
  }
});

test('Down fast-falls, stays crouched on landing, and release allows jumping', () => {
  const game = createRunner();
  startRunner(game);
  jump(game);
  for (let i = 0; i < 12; i++) stepRunner(game, 1 / 60);
  assert.ok(game.y > 60 && game.velocity > 0);
  setDuck(game, true);
  for (let i = 0; i < 15; i++) stepRunner(game, 1 / 60);
  assert.equal(game.y, 0);
  jump(game);
  assert.equal(game.velocity, 0);
  setDuck(game, false);
  jump(game);
  assert.ok(game.velocity > 0);
  startRunner(game);
  assert.equal(game.ducking, false);
});

test('ground and flying obstacles both appear with enough spacing to react', () => {
  const game = createRunner();
  startRunner(game);
  let flying = false, grounded = false;
  for (let i = 0; i < 6; i++) {
    game.obstacleX = -37;
    stepRunner(game, 1 / 60);
    if (game.flying) flying = true;
    else grounded = true;
    assert.ok(game.obstacleX >= 768);
  }
  assert.ok(flying && grounded);
});
