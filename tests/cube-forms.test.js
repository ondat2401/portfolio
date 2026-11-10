import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PIECE_COUNT, createForms, createPose, createScatter, sampleAssembly } from '../assets/js/features/cube-forms.js';

test('all silhouettes use the same 54 distinct bricks, with recognizable robot parts', () => {
  const forms = createForms();
  assert.equal(forms.length, 3);
  for (const form of forms) {
    assert.equal(form.length, PIECE_COUNT);
    assert.equal(new Set(form.map(pose => pose.position.toArray().join(','))).size, PIECE_COUNT);
    for (const pose of form) {
      assert.ok(pose.scale.toArray().every(size => size > 0));
      assert.ok(pose.position.length() < 3);
    }
  }
  assert.equal(forms[2].filter(pose => pose.part === 'hand').length, 4);
  assert.equal(forms[2].filter(pose => pose.part === 'head').length, 14);
});

test('each transformation starts and ends exactly on its poses, with finite bounded flight paths', () => {
  const forms = createForms();
  const scatter = createScatter();
  const out = createPose();
  for (let form = 0; form < forms.length; form++) for (let i = 0; i < PIECE_COUNT; i++) {
    const from = forms[form][i];
    const to = forms[(form + 1) % forms.length][i];
    sampleAssembly(from, to, scatter[i], 0, i, out);
    assert.ok(out.position.equals(from.position));
    sampleAssembly(from, to, scatter[i], 1, i, out);
    assert.ok(out.position.equals(to.position));
    assert.ok(out.scale.equals(to.scale));
    assert.ok(out.quaternion.equals(to.quaternion));
    assert.ok(out.color.equals(to.color));
    for (let frame = 0; frame <= 48; frame++) {
      sampleAssembly(from, to, scatter[i], frame / 48, i, out);
      assert.ok(Number.isFinite(out.position.length()) && out.position.length() < 5);
      assert.ok(out.scale.toArray().every(size => size > 0));
      assert.ok(Math.abs(out.quaternion.length() - 1) < 1e-6);
    }
  }
});

test('retargeting halfway through a transformation preserves the visible starting pose', () => {
  const forms = createForms(), scatter = createScatter();
  const interrupted = createPose(), next = createPose();
  sampleAssembly(forms[0][0], forms[1][0], scatter[0], .48, 0, interrupted);
  sampleAssembly(interrupted, forms[2][0], scatter[0], 0, 0, next);
  assert.ok(next.position.equals(interrupted.position));
  assert.ok(next.quaternion.equals(interrupted.quaternion));
  assert.ok(next.scale.equals(interrupted.scale));
});
