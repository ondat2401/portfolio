import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Quaternion, Vector3 } from 'three';
import { MOVES, commitTurn, sampleComicTurn } from '../assets/js/features/rubik-turns.js';

test('scramble and inverse restore every cubelet, including its face orientation', () => {
  const pieces = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const coord = new Vector3(x, y, z);
    pieces.push({ coord, original: coord.clone(), orientation: new Quaternion() });
  }
  for (const move of MOVES) {
    const layer = pieces.filter(piece => piece.coord[move.axis] === move.layer);
    assert.equal(layer.length, 9);
    commitTurn(layer, move);
    assert.equal(new Set(pieces.map(piece => piece.coord.toArray().join(','))).size, 27);
  }
  for (const piece of pieces) {
    assert.ok(piece.coord.distanceTo(piece.original) < 1e-10);
    assert.ok(piece.orientation.angleTo(new Quaternion()) < 1e-7);
  }
});

test('comic timing holds frames, winds up briefly, and ends at exactly one turn', () => {
  assert.ok(Math.abs(sampleComicTurn(0)) < 1e-10);
  assert.equal(sampleComicTurn(1), 1);
  assert.equal(sampleComicTurn(2), 1);
  assert.ok(sampleComicTurn(.1) < 0);
  assert.ok(sampleComicTurn(.84) > 1);
  assert.equal(sampleComicTurn(.2), sampleComicTurn(.24));
  for (let frame = 0; frame <= 100; frame++) {
    const angle = sampleComicTurn(frame / 100);
    assert.ok(angle >= -.04 && angle <= 1.035);
  }
});
