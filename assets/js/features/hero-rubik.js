import * as T from 'three';
import { MOVES, commitTurn, sampleComicTurn } from './rubik-turns.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FORM_NAMES, PIECE_COUNT, createForms, createPose, copyPose, createScatter, sampleAssembly } from './cube-forms.js';

export function mountCube(host, button) {
  const stage = host.closest('.stage');
  const transformButton = stage.querySelector('[data-cube-transform]');
  const status = stage.querySelector('.cube-status');
  const bubble = stage.querySelector('.bubble');
  const lettering = stage.querySelector('.cube-lettering');
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); }
  catch {
    button.disabled = true;
    if (transformButton) transformButton.disabled = true;
    if (status) status.textContent = 'The interactive sculpture needs WebGL.';
    return;
  }
  host.replaceChildren(renderer.domElement);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, .1, 100);
  camera.position.set(4.6, 3.3, 12.8);
  camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x707070, 2));
  const light = new T.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 6, 4);
  scene.add(light);
  const group = new T.Group();
  scene.add(group);
  const views = [
    new T.Quaternion().setFromEuler(new T.Euler(-.08, -.18, -.12)),
    new T.Quaternion().setFromEuler(new T.Euler(-.23, .34, -.04)),
    new T.Quaternion().setFromEuler(new T.Euler(-.23, .34, .02)),
  ];
  const speeches = ['A LITTLE CHAOS.\nA LOT OF CRAFT.', 'BUILT TO PLAY.\nONE MORE ROUND?', 'HELLO, HUMAN.\nLET’S MAKE THINGS.'];
  const sounds = ['TWIST!', 'PLAY!', 'BEEP!'];
  group.quaternion.copy(views[0]);
  const fromView = views[0].clone();
  const geometry = new RoundedBoxGeometry(1, 1, 1, 2, .08);
  const roundness = { value: 0 };
  const texture = new T.TextureLoader().load(new URL('../../comic/cube-ink.svg', import.meta.url).href);
  texture.colorSpace = T.SRGBColorSpace;
  const solid = new T.InstancedMesh(geometry, new T.MeshToonMaterial({ map: texture }), PIECE_COUNT);
  const outlines = new T.InstancedMesh(geometry, new T.MeshBasicMaterial({ color: 0x101010, side: T.BackSide }), PIECE_COUNT);
  const ghosts = new T.InstancedMesh(geometry, new T.MeshBasicMaterial({ color: 0xe9dfc9, wireframe: true, transparent: true, opacity: .15, depthWrite: false }), PIECE_COUNT);
  // Three draw calls share the same bricks; moving silhouettes must not use stale bounds.
  for (const mesh of [solid, outlines, ghosts]) {
    mesh.material.onBeforeCompile = shader => {
      shader.uniforms.uRoundness = roundness;
      shader.vertexShader = 'uniform float uRoundness;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed = mix(transformed, normalize(transformed) * .5, uRoundness);');
    };
    mesh.frustumCulled = false;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
    group.add(mesh);
  }
  solid.boundingSphere = new T.Sphere(new T.Vector3(), 8);
  ghosts.visible = false;
  const forms = createForms();
  const poses = Array.from({ length: PIECE_COUNT }, createPose);
  const from = Array.from({ length: PIECE_COUNT }, createPose);
  const scatter = createScatter();
  const cubelets = Array.from({ length: 27 }, (_, i) => {
    const original = forms[0][i * 2].position.clone().round();
    return { original, coord: original.clone(), orientation: new T.Quaternion() };
  });
  poses.forEach((pose, i) => copyPose(pose, forms[0][i]));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const ray = new T.Raycaster();
  const pointer = new T.Vector2();
  const axis = new T.Vector3();
  const rotation = new T.Quaternion();
  const pivot = new T.Vector3();
  const drawing = new T.Object3D();
  let hovered = false, pinned = false, amount = 0, visible = true, hasDrawn = false;
  let last = 0, elapsed = 0, hold = .6, moveIndex = 0, active = null;
  let formIndex = 0, destination = 0, morphing = false, morphTime = 0, restTime = 0;
  let fromRoundness = 0;
  const rounding = [0, 1, .25];
  const isStill = () => reduce.matches || document.body.classList.contains('motion-paused');

  function finishMorph() {
    morphing = false;
    formIndex = destination;
    restTime = 0;
    active = null;
    moveIndex = 0;
    hold = 1.2;
    poses.forEach((pose, i) => copyPose(pose, forms[formIndex][i]));
    group.quaternion.copy(views[formIndex]);
    roundness.value = rounding[formIndex];
    host.setAttribute('aria-label', `${FORM_NAMES[formIndex]} sculpture built from 54 comic bricks`);
  }

  function startMorph(next) {
    poses.forEach((pose, i) => copyPose(from[i], pose));
    fromView.copy(group.quaternion);
    fromRoundness = roundness.value;
    destination = next;
    morphTime = 0;
    morphing = true;
    active = null;
    for (const cubelet of cubelets) {
      cubelet.coord.copy(cubelet.original);
      cubelet.orientation.identity();
    }
    if (isStill()) finishMorph();
  }

  host.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || hovered) return;
    const rect = host.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(pointer, camera);
    hovered = ray.intersectObject(solid).length > 0;
  });
  host.addEventListener('pointerleave', () => { hovered = false; });
  button.addEventListener('click', () => {
    pinned = !pinned;
    button.setAttribute('aria-pressed', String(pinned));
    button.textContent = pinned ? 'REASSEMBLE ↙' : 'BREAK APART ↗';
  });
  transformButton?.addEventListener('click', () => {
    hovered = false;
    pinned = false;
    button.setAttribute('aria-pressed', 'false');
    button.textContent = 'BREAK APART ↗';
    startMorph(((morphing ? destination : formIndex) + 1) % forms.length);
  });
  new ResizeObserver(() => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.position.set(4.6, 3.3, 12.8).normalize().multiplyScalar(12 * Math.max(1, .9 / camera.aspect));
    camera.updateProjectionMatrix();
  }).observe(host);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }).observe(host);

  renderer.setAnimationLoop(time => {
    if (time - last < 1000 / 24) return;
    const dt = Math.min((time - last) / 1000, .07);
    last = time;
    if (!visible || document.hidden) return;
    const still = isStill();
    const target = Number(pinned || hovered);
    amount = still ? target : amount + (target - amount) * (1 - Math.exp(-dt * 9));
    const running = !still && !target && amount < .02;
    if (still && morphing) finishMorph();

    if (morphing) {
      if (running) morphTime = Math.min(morphTime + dt, 3);
      const progress = Math.floor(morphTime * 16) / 48;
      roundness.value = T.MathUtils.lerp(fromRoundness, rounding[destination], progress);
      for (let i = 0; i < PIECE_COUNT; i++) sampleAssembly(from[i], forms[destination][i], scatter[i], progress, i, poses[i]);
      group.quaternion.slerpQuaternions(fromView, views[destination], progress * progress * (3 - 2 * progress));
      if (morphTime >= 3) finishMorph();
    } else if (formIndex === 0) {
      if (running) {
        if (!active) {
          hold -= dt;
          if (hold <= 0) {
            if (moveIndex === MOVES.length) startMorph(1);
            else {
              const move = MOVES[moveIndex];
              active = { ...move, pieces: cubelets.filter(piece => piece.coord[move.axis] === move.layer) };
              axis.set(0, 0, 0)[move.axis] = 1;
              elapsed = 0;
            }
          }
        } else {
          elapsed = Math.min(elapsed + dt, .85);
          if (elapsed >= .85) {
            commitTurn(active.pieces, active);
            active = null;
            moveIndex++;
            hold = moveIndex === MOVES.length ? 1 : .22;
          }
        }
      }
      if (!morphing) {
        if (active) rotation.setFromAxisAngle(axis, active.direction * Math.PI / 2 * sampleComicTurn(elapsed / .85));
        for (let i = 0; i < PIECE_COUNT; i++) {
          const cubelet = cubelets[Math.floor(i / 2)];
          const pose = poses[i];
          pose.position.set(0, i % 2 ? .23 : -.23, 0).applyQuaternion(cubelet.orientation).add(cubelet.coord);
          pose.quaternion.copy(cubelet.orientation);
          if (active && cubelet.coord[active.axis] === active.layer) {
            pose.position.applyQuaternion(rotation);
            pose.quaternion.premultiply(rotation);
          }
          pose.scale.copy(forms[0][i].scale);
          pose.color.copy(forms[0][i].color);
        }
      }
    } else {
      if (running) restTime += dt;
      const beat = Math.floor(restTime * 12) / 12;
      for (let i = 0; i < PIECE_COUNT; i++) {
        const source = forms[formIndex][i];
        copyPose(poses[i], source);
        if (formIndex !== 2 || still || beat >= 2.5) continue;
        const envelope = Math.sin(Math.PI * Math.min(beat / 2.5, 1));
        if (source.part === 'head') {
          pivot.set(0, .65, 0);
          rotation.setFromAxisAngle(axis.set(0, 0, 1), -.14 * envelope);
        } else if (source.part === 'hand') {
          pivot.set(.795, 0, 0);
          rotation.setFromAxisAngle(axis.set(0, 0, 1), envelope * (1.15 + .25 * Math.sin(beat * 12)));
        } else continue;
        poses[i].position.sub(pivot).applyQuaternion(rotation).add(pivot);
        poses[i].quaternion.copy(rotation);
      }
      if (running && restTime >= (formIndex === 2 ? 6 : 4.5)) startMorph((formIndex + 1) % forms.length);
    }

    ghosts.visible = morphing && running && hasDrawn && morphTime > .1 && morphTime < 2.8;
    if (ghosts.visible) {
      ghosts.instanceMatrix.array.set(solid.instanceMatrix.array);
      ghosts.instanceMatrix.needsUpdate = true;
    }
    const drawnAmount = still ? amount : Math.round(amount * 14) / 14;
    for (let i = 0; i < PIECE_COUNT; i++) {
      const pose = poses[i];
      drawing.position.copy(pose.position).multiplyScalar(1 + drawnAmount * .3);
      drawing.position.addScaledVector(scatter[i].position, drawnAmount * .14);
      drawing.quaternion.copy(pose.quaternion);
      drawing.scale.copy(pose.scale);
      drawing.updateMatrix();
      solid.setMatrixAt(i, drawing.matrix);
      solid.setColorAt(i, pose.color);
      drawing.scale.multiplyScalar(1.055);
      drawing.updateMatrix();
      outlines.setMatrixAt(i, drawing.matrix);
    }
    solid.instanceMatrix.needsUpdate = true;
    solid.instanceColor.needsUpdate = true;
    outlines.instanceMatrix.needsUpdate = true;
    const state = still ? 'paused' : target ? 'exploded' : morphing ? (morphTime < .9 ? 'transforming' : 'assembling') : active ? 'turning' : 'settled';
    if (stage.dataset.cubeState !== state) stage.dataset.cubeState = state;
    const nextName = FORM_NAMES[((morphing ? destination : formIndex) + 1) % forms.length];
    const label = target ? `${FORM_NAMES[formIndex].toUpperCase()} / EXPLODED VIEW`
      : morphing ? `ASSEMBLING ${FORM_NAMES[destination].toUpperCase()} / 54 PIECES`
      : still ? `${FORM_NAMES[formIndex].toUpperCase()} / STILL FRAME`
      : formIndex === 0 ? `${moveIndex < 4 ? 'SCRAMBLE' : 'REASSEMBLE'} / ${active ? active.label : 'HOLD THAT FRAME'}`
      : `${FORM_NAMES[formIndex].toUpperCase()} / BUILT TO PLAY`;
    if (status && status.textContent !== label) status.textContent = label;
    const speech = morphing ? 'SAME PIECES.\nNEW POSSIBILITIES.' : speeches[formIndex];
    if (bubble && bubble.textContent !== speech) bubble.textContent = speech;
    const sound = morphing ? (morphTime < .9 ? 'POP!' : 'CLICK!') : sounds[formIndex];
    if (lettering && lettering.textContent !== sound) lettering.textContent = sound;
    const transformLabel = `Transform into ${nextName}`;
    if (transformButton && transformButton.getAttribute('aria-label') !== transformLabel) transformButton.setAttribute('aria-label', transformLabel);
    renderer.render(scene, camera);
    hasDrawn = true;
  });
}
