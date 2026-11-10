import { Quaternion, Vector3 } from 'three';

const scramble = [
  { axis: 'x', layer: 1, direction: 1, label: 'RIGHT LAYER' },
  { axis: 'y', layer: 1, direction: -1, label: 'TOP LAYER' },
  { axis: 'z', layer: 1, direction: 1, label: 'FRONT LAYER' },
  { axis: 'x', layer: -1, direction: -1, label: 'LEFT LAYER' },
];
export const MOVES = [...scramble, ...scramble.toReversed().map(move => ({
  ...move, direction: -move.direction,
}))];

// Twelve held drawings: a small wind-up, a quick turn, then a settled overshoot.
export function sampleComicTurn(progress) {
  const t = Math.floor(Math.max(0, Math.min(1, progress)) * 12) / 12;
  if (t < .16) return -.04 * Math.sin(Math.PI * t / .16);
  if (t < .82) return 1.035 * (1 - (1 - (t - .16) / .66) ** 3);
  return 1 + .035 * (1 - (t - .82) / .18) ** 2;
}

export function commitTurn(pieces, move) {
  const axis = new Vector3();
  axis[move.axis] = 1;
  const rotation = new Quaternion().setFromAxisAngle(axis, move.direction * Math.PI / 2);
  for (const piece of pieces) {
    piece.coord.applyQuaternion(rotation).round();
    piece.orientation.premultiply(rotation).normalize();
  }
}
