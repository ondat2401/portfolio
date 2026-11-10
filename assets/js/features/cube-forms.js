import { Color, Euler, Quaternion, Vector3 } from 'three';

export const FORM_NAMES = ['Rubik', 'Gamepad', 'Robot'];
export const PIECE_COUNT = 54;
const PAPER = '#e9dfc9', RED = '#ae4035', INK = '#292a29', GRAY = '#77776e';

export function createPose() {
  return { position: new Vector3(), quaternion: new Quaternion(), scale: new Vector3(1, 1, 1), color: new Color(PAPER) };
}

export function copyPose(target, source) {
  target.position.copy(source.position);
  target.quaternion.copy(source.quaternion);
  target.scale.copy(source.scale);
  target.color.copy(source.color);
}

// Two bricks per cubelet preserve the 3×3 layer mechanics while supplying 54 parts.
export function createForms() {
  const cube = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    for (let half = 0; half < 2; half++) {
      const pose = createPose();
      pose.position.set(x, y + (half ? .23 : -.23), z);
      pose.scale.set(.92, .44, .92);
      pose.color.set(x === 1 && y !== -1 ? RED : z === -1 ? INK : y === -1 ? GRAY : PAPER);
      cube.push(pose);
    }
  }
  const patterns = [
    ['  ###  ', '#######', '#######', '### ###', '##   ##'],
    ['   #   ', '  ###  ', '  ###  ', '   #   ', '#######', '  ###  ', '  ###  ', '  # #  ', ' ## ## '],
  ];
  const forms = patterns.map((rows, form) => {
    const parts = [];
    for (let row = 0; row < rows.length; row++) for (let col = 0; col < rows[row].length; col++) {
      if (rows[row][col] !== '#') continue;
      for (let depth = 0; depth < 2; depth++) {
        const pose = createPose();
        pose.position.set((col - 3) * .53, ((rows.length - 1) / 2 - row) * .53, (depth - .5) * .5);
        pose.scale.set(.5, .5, .47);
        pose.color.set(depth === 0 ? GRAY : PAPER);
        if (form === 0 && depth === 1) {
          // Dark directional pad and red action buttons sit on the front face.
          if ((col === 1 && row >= 1 && row <= 3) || (row === 2 && col <= 2)) pose.color.set(INK);
          if ((col === 5 && row === 1) || (col === 6 && row === 2)) pose.color.set(RED);
          if (col === 3 && row === 2) pose.color.set(INK);
        }
        if (form === 1) {
          if (row === 0 || (row === 5 && col === 3)) pose.color.set(RED);
          if (depth === 1 && row === 2 && col !== 3) pose.color.set(INK);
          pose.part = row <= 2 ? 'head' : row === 4 && col >= 5 ? 'hand' : 'body';
        }
        parts.push(pose);
      }
    }
    return parts;
  });
  const controller = [];
  const add = (x, y, z, sx, sy, sz, color, angle = 0) => {
    const pose = createPose();
    pose.position.set(x, y, z);
    pose.scale.set(sx, sy, sz);
    pose.color.set(color);
    pose.quaternion.setFromEuler(new Euler(0, 0, angle));
    controller.push(pose);
  };
  // Ellipsoids overlap into a curved shell; controls sit above the front surface.
  for (let layer = 0; layer < 2; layer++) for (let i = 0; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2;
    add(Math.cos(angle) * 1.12, Math.sin(angle) * .38 + .2, layer ? .12 : -.12, .9, .72, .65, layer ? PAPER : GRAY);
  }
  for (const side of [-1, 1]) for (let i = 0; i < 6; i++) {
    add(side * (1.12 + i * .055), -.15 - i * .15, .02, .8 - i * .035, .8, .7, PAPER, -side * .3);
  }
  for (const [x, y] of [[-1.15, .55], [-1.15, .15], [-1.35, .35], [-.95, .35]]) add(x, y, .54, .3, .3, .16, INK);
  for (const [x, y] of [[1.12, .57], [1.12, .13], [.9, .35], [1.34, .35]]) add(x, y, .55, .22, .22, .17, RED);
  for (const side of [-1, 1]) {
    add(side * .57, -.16, .57, .38, .38, .22, INK);
    add(side * .2, .36, .52, .22, .1, .12, INK, side * .2);
    for (let i = 0; i < 3; i++) add(side * (1 + i * .15), .73, -.1, .32, .2, .4, INK);
  }
  return [cube, controller, forms[1]];
}

export function createScatter() {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    const pose = createPose();
    const angle = i * 2.399963;
    const radius = 1.9 + (i % 4) * .17;
    pose.position.set(Math.cos(angle) * radius, ((i % 9) - 4) * .42, Math.sin(angle) * 1.25);
    pose.quaternion.setFromEuler(new Euler(angle, (i % 5) * .7, angle * .3));
    pose.scale.setScalar(.36);
    return pose;
  });
}

const clamp = value => Math.max(0, Math.min(1, value));

// Burst, hold, then six staggered groups lock into place; output storage is reused.
export function sampleAssembly(from, to, scatter, progress, index, out) {
  const t = clamp(progress);
  if (t === 0) { copyPose(out, from); return; }
  if (t === 1) { copyPose(out, to); return; }
  if (t < .3) {
    const phase = clamp(t / .2);
    const ease = 1 - (1 - phase) ** 3;
    out.position.copy(from.position).lerp(scatter.position, ease);
    out.position.y += Math.sin(Math.PI * phase) * .35;
    out.quaternion.slerpQuaternions(from.quaternion, scatter.quaternion, ease);
    out.scale.copy(from.scale).lerp(scatter.scale, ease);
    out.color.copy(from.color);
    return;
  }
  const phase = clamp((t - .3 - (index % 6) * .03) / .55);
  const p = phase - 1;
  const ease = 1 + 2.3 * p ** 3 + 1.3 * p ** 2;
  out.position.copy(scatter.position).lerp(to.position, ease);
  out.position.y += Math.sin(Math.PI * phase) * (index % 2 ? .35 : -.35);
  out.position.z += Math.sin(Math.PI * phase) * .65;
  out.quaternion.slerpQuaternions(scatter.quaternion, to.quaternion, clamp(ease));
  out.scale.copy(scatter.scale).lerp(to.scale, clamp(ease));
  out.color.copy(from.color).lerp(to.color, phase);
}
