import assert from 'node:assert/strict';
import { test } from 'node:test';
import { INTRO_DURATION, sampleIntro } from '../assets/js/features/arcade-intro.js';
import { createFeedback, emitFeedback, updateFeedback, clearFeedback } from '../assets/js/features/arcade-feedback.js';

test('intro inserts the coin, shakes the cabinet, then zooms, within 1.4 seconds', () => {
  const state = {};
  sampleIntro(.2, state);
  assert.equal(state.phase, 'coin');
  assert.equal(state.zoom, 0);
  sampleIntro(.55, state);
  assert.equal(state.phase, 'shake');
  assert.equal(state.coin, 1);
  assert.equal(state.zoom, 0);
  sampleIntro(1, state);
  assert.equal(state.phase, 'zoom');
  assert.ok(state.zoom > 0 && state.zoom < 1);
  sampleIntro(INTRO_DURATION, state);
  assert.equal(state.phase, 'ready');
  assert.equal(state.zoom, 1);
  assert.ok(INTRO_DURATION <= 1.5);
});

test('feedback reuses a bounded pool, freezes briefly on impact, then fully settles', () => {
  const fx = createFeedback();
  const pool = fx.particles;
  for (let i = 0; i < 30; i++) emitFeedback(fx, 'hit', 140, 230);
  assert.equal(fx.particles, pool);
  assert.equal(pool.length, 32);
  assert.ok(fx.freeze > 0 && fx.freeze <= .08);
  assert.ok(fx.shake <= 1);
  for (let i = 0; i < 120; i++) updateFeedback(fx, 1 / 60);
  assert.equal(updateFeedback(fx, 1 / 60), false);
  assert.equal(fx.shake, 0);
  assert.ok(pool.every(p => p.life === 0));
  emitFeedback(fx, 'score', 160, 200);
  clearFeedback(fx);
  assert.equal(fx.scoreLife, 0);
  assert.equal(updateFeedback(fx, 1 / 60), false);
});
