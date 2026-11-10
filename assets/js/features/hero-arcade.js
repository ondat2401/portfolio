import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RUNNER_WIDTH, RUNNER_HEIGHT, createRunner, startRunner, jump, setDuck, stepRunner, drawRunner } from './arcade-runner.js';
import { INTRO_DURATION, sampleIntro } from './arcade-intro.js';
import { createFeedback, clearFeedback, emitFeedback, updateFeedback, drawFeedback } from './arcade-feedback.js';

export function mountArcade(host) {
  const stage = host.closest('.stage');
  const play = stage.querySelector('[data-arcade-play]');
  const stop = stage.querySelector('[data-arcade-stop]');
  const status = stage.querySelector('.cube-status');
  const game = createRunner();
  const canvas = document.createElement('canvas');
  const rasterScale = Math.min(2, Math.max(1, devicePixelRatio));
  canvas.width = Math.round(RUNNER_WIDTH * rasterScale);
  canvas.height = Math.round(RUNNER_HEIGHT * rasterScale);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(canvas.width / RUNNER_WIDTH, 0, 0, canvas.height / RUNNER_HEIGHT, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.colorSpace = T.SRGBColorSpace;
  texture.flipY = false;
  texture.generateMipmaps = false;
  texture.minFilter = T.LinearFilter;
  texture.magFilter = T.NearestFilter;
  let renderer, joystick, button, duckButton, machine;
  const fx = createFeedback();
  const intro = { phase: 'idle', coin: 0, shake: 0, zoom: 0, scan: 0 };
  let introTime = 0;
  let wasAnimating = true;
  let active = false, starting = false, paused = false, visible = true, dirty = true;
  let last = 0, accumulator = 0, pressTime = 0, cameraProgress = 0, cameraTarget = 0;
  let view = 'loading';
  let touchStartY = 0, touchPointer = null, cabinetButtonPointer = null, duckButtonPointer = null, touchDucking = false, ignoreClick = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new T.Scene();
  const camera = new T.OrthographicCamera(-1.8, 1.8, 1.8, -1.8, .1, 50);
  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();
  const widePosition = new T.Vector3(3.1, 2.55, 6);
  const wideTarget = new T.Vector3(0, 1.2, 0);
  const screenCenter = new T.Vector3();
  const closePosition = new T.Vector3();
  const lookTarget = new T.Vector3();
  const cameraRest = new T.Vector3();
  const coinSlot = new T.Vector3(0, .81, .49);
  const coinStart = new T.Vector3(.42, 1.13, 1.04);
  const coinLight = new T.PointLight(0xffc768, 0, .65, 2);
  coinLight.position.set(coinSlot.x, coinSlot.y, coinSlot.z + .08);
  scene.add(coinLight);
  const coin = new T.Group();
  const coinFace = new T.Mesh(new T.CylinderGeometry(.055, .055, .012, 24), new T.MeshStandardMaterial({ color: 0xd9ad61, roughness: .45, metalness: .25 }));
  const coinRim = new T.Mesh(new T.TorusGeometry(.038, .003, 6, 24), new T.MeshBasicMaterial({ color: 0x897142 }));
  coinRim.rotation.x = -Math.PI / 2;
  coinRim.position.y = .007;
  coin.add(coinFace, coinRim);
  coin.visible = false;
  scene.add(coin);
  camera.position.copy(widePosition);
  camera.lookAt(wideTarget);
  scene.add(new T.HemisphereLight(0xfff7e5, 0x53554b, 2.2));
  const light = new T.DirectionalLight(0xffffff, 2.8);
  light.position.set(-3, 6, 5);
  scene.add(light);
  const fill = new T.DirectionalLight(0xffe4ce, 1.1);
  fill.position.set(4, 3, -2);
  scene.add(fill);

  function updateCamera() {
    const aspect = host.clientWidth / (host.clientHeight || 1);
    const t = cameraProgress;
    const ease = t * t * t * (t * (t * 6 - 15) + 10);
    camera.position.lerpVectors(widePosition, closePosition, ease);
    camera.position.y += Math.sin(ease * Math.PI) * .18;
    lookTarget.lerpVectors(wideTarget, screenCenter, ease);
    lookTarget.y -= .10 * ease;
    camera.lookAt(lookTarget);
    cameraRest.copy(camera.position);
    const wideHeight = Math.max(1.48, 1.16 / aspect);
    const closeHeight = Math.max(.62, .71 / aspect);
    const halfHeight = T.MathUtils.lerp(wideHeight, closeHeight, ease);
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.right = halfHeight * aspect;
    camera.left = -camera.right;
    camera.updateProjectionMatrix();
    host.dataset.cameraState = t === 0 ? 'wide' : t === 1 ? 'screen' : 'moving';
  }

  function resetIntro() {
    introTime = 0;
    intro.phase = 'idle';
    intro.coin = intro.shake = intro.zoom = intro.scan = 0;
    coin.visible = false;
    coinLight.intensity = 0;
    if (machine) { machine.rotation.z = 0; machine.position.x = 0; }
    if (joystick) joystick.rotation.x = 0;
    host.dataset.introPhase = 'idle';
    stage.dataset.arcadeIntro = 'idle';
  }

  function drawCrtReveal(progress) {
    const center = 207, half = 96 * progress;
    ctx.save();
    ctx.fillStyle = '#191918';
    ctx.fillRect(20, 110, 728, 194);
    ctx.save();
    ctx.beginPath();
    ctx.rect(24, center - half, 720, half * 2);
    ctx.clip();
    drawRunner(ctx, game, false, 1);
    ctx.restore();
    ctx.globalAlpha = Math.sin(progress * Math.PI) * .8;
    ctx.fillStyle = '#eee5d2';
    ctx.fillRect(24, center - half - 1, 720, 2);
    ctx.fillStyle = '#b34a40';
    ctx.fillRect(24, center + half - 1, 720, 3);
    ctx.restore();
  }

  function pickCabinetButton(event) {
    if (view !== '3d' || !renderer || !button || !duckButton) return null;
    const bounds = renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;
    pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, 1 - (event.clientY - bounds.top) / bounds.height * 2);
    raycaster.setFromCamera(pointer, camera);
    let object = raycaster.intersectObjects([button, duckButton], true)[0]?.object;
    while (object) {
      if (object === button || object === duckButton) return object;
      object = object.parent;
    }
    return null;
  }

  function updateUI() {
    play.disabled = view === 'loading' || (active && !paused && (starting || game.phase === 'running'));
    stop.disabled = !active;
    const message = `${paused ? 'PAUSED / PRESS PLAY TO RESUME' : starting ? (intro.phase === 'coin' ? 'INSERT COIN' : intro.phase === 'shake' ? 'CREDIT ACCEPTED' : 'GET READY') : game.phase === 'over' ? 'GAME OVER / PRESS PLAY TO RETRY' : game.phase === 'running' ? 'IN PLAY' : 'READY TO PLAY'} / SCORE ${game.score * 100}${view === '2d' ? ' / 2D MODE' : ''}`;
    if (status.textContent !== message) status.textContent = message;
    host.dataset.gameState = paused ? 'paused' : starting ? 'starting' : game.phase;
    host.dataset.playing = String(active);
  }

  function playRun() {
    if (view === 'loading') return;
    if (!paused) {
      const retry = active && game.phase === 'over' && cameraProgress === 1;
      Object.assign(game, createRunner());
      clearFeedback(fx);
      resetIntro();
      starting = !retry;
      if (retry) startRunner(game);
    }
    active = true;
    paused = false;
    cameraTarget = starting ? 0 : view === '3d' ? 1 : 0;
    accumulator = 0;
    dirty = true;
    host.focus({ preventScroll: true });
    updateUI();
  }

  function stopRun() {
    active = starting = paused = false;
    cameraTarget = 0;
    pressTime = accumulator = 0;
    resetIntro();
    clearFeedback(fx);
    Object.assign(game, createRunner());
    dirty = true;
    play.focus({ preventScroll: true });
    updateUI();
  }

  function jumpRun() {
    if (!active || starting || paused || game.phase !== 'running') return;
    const grounded = game.y === 0 && game.velocity <= 0;
    jump(game);
    if (grounded && game.velocity > 0 && !reduced.matches && !document.body.classList.contains('motion-paused')) emitFeedback(fx, 'jump', 140, 259);
    pressTime = .18;
    dirty = true;
  }

  function pauseRun() {
    setDuck(game, false);
    touchPointer = cabinetButtonPointer = duckButtonPointer = null;
    if (!active || (!starting && game.phase !== 'running')) return;
    paused = true;
    dirty = true;
    updateUI();
  }

  function fallback() {
    renderer?.dispose();
    renderer = null;
    view = '2d';
    cameraTarget = cameraProgress = 0;
    resetIntro();
    clearFeedback(fx);
    host.replaceChildren(canvas);
    host.dataset.arcadeView = view;
    dirty = true;
    updateUI();
  }

  try {
    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute('aria-hidden', 'true');
    host.replaceChildren(renderer.domElement);
    new GLTFLoader().load(new URL('../../models/arcade/comic-arcade.glb', import.meta.url).href, gltf => {
      const model = gltf.scene;
      machine = model;
      const screen = model.getObjectByName('Screen_Surface');
      if (!screen) { fallback(); return; }
      screen.material = new T.MeshBasicMaterial({ map: texture, toneMapped: false });
      model.updateMatrixWorld(true);
      new T.Box3().setFromObject(screen).getCenter(screenCenter);
      const normal = new T.Vector3().fromBufferAttribute(screen.geometry.attributes.normal, 0)
        .applyMatrix3(new T.Matrix3().getNormalMatrix(screen.matrixWorld)).normalize();
      closePosition.copy(screenCenter).addScaledVector(normal, 5);
      closePosition.y -= .21;
      joystick = model.getObjectByName('Joystick_Pivot');
      for (const name of ['Joystick / socket', 'Joystick / collar']) {
        const fixedBase = model.getObjectByName(name);
        if (fixedBase) model.attach(fixedBase);
      }
      button = model.getObjectByName('Button_A');
      duckButton = model.getObjectByName('Button_B');
      if (button) button.userData.restY = button.position.y;
      if (duckButton) duckButton.userData.restY = duckButton.position.y;
      scene.add(model);
      const bounds = new T.Box3().setFromObject(model);
      const center = bounds.getCenter(new T.Vector3());
      const size = bounds.getSize(new T.Vector3());
      const floor = new T.Mesh(new T.PlaneGeometry(12, 6), new T.MeshBasicMaterial({ color: 0x242620 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(center.x, bounds.min.y - .012, center.z);
      scene.add(floor);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = shadowCanvas.height = 128;
      const shadowCtx = shadowCanvas.getContext('2d');
      const gradient = shadowCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(8, 9, 7, .85)');
      gradient.addColorStop(.55, 'rgba(8, 9, 7, .55)');
      gradient.addColorStop(1, 'rgba(8, 9, 7, 0)');
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 128, 128);
      const shadow = new T.Mesh(
        new T.PlaneGeometry(size.x * 1.25, size.z * 1.35),
        new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }),
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(center.x, bounds.min.y - .008, center.z);
      scene.add(shadow);
      view = '3d';
      host.dataset.arcadeView = view;
      updateCamera();
      dirty = true;
      updateUI();
    }, undefined, fallback);
  } catch { fallback(); }

  new ResizeObserver(() => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height || !renderer) return;
    renderer.setSize(width, height);
    updateCamera();
    dirty = true;
  }).observe(host);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (!visible) pauseRun();
    dirty = true;
  }).observe(host);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRun(); });
  window.addEventListener('blur', pauseRun);
  host.addEventListener('click', () => {
    if (ignoreClick) { ignoreClick = false; return; }
    host.focus({ preventScroll: true });
    jumpRun();
  });
  host.addEventListener('blur', () => { setDuck(game, false); dirty = true; });
  stage.addEventListener('keydown', event => {
    if (event.target !== host || !active || !['Space', 'ArrowUp', 'ArrowDown'].includes(event.code)) return;
    event.preventDefault();
    if (event.code === 'ArrowDown') {
      if (!starting && !paused) { setDuck(game, true); dirty = true; }
    } else if (!event.repeat) jumpRun();
  });
  window.addEventListener('keyup', event => {
    if (event.code === 'ArrowDown') { setDuck(game, false); dirty = true; }
  });
  host.addEventListener('pointerdown', event => {
    if (!active || starting || paused) return;
    const cabinetButton = pickCabinetButton(event);
    if (cabinetButton) {
      host.setPointerCapture(event.pointerId);
      host.focus({ preventScroll: true });
      cabinetButtonPointer = event.pointerId;
      if (cabinetButton === duckButton) {
        duckButtonPointer = event.pointerId;
        setDuck(game, true);
        dirty = true;
      } else jumpRun();
      ignoreClick = true;
      event.preventDefault();
      return;
    }
    if (event.pointerType !== 'touch') return;
    touchStartY = event.clientY;
    touchPointer = event.pointerId;
    touchDucking = ignoreClick = false;
    host.setPointerCapture(event.pointerId);
  });
  host.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || touchPointer !== event.pointerId || starting || paused) return;
    if (event.clientY - touchStartY > 24) {
      touchDucking = true;
      setDuck(game, true);
      dirty = true;
    }
  });
  function releasePointer(event) {
    if (cabinetButtonPointer === event.pointerId) {
      cabinetButtonPointer = null;
      if (duckButtonPointer === event.pointerId) {
        duckButtonPointer = null;
        setDuck(game, false);
      }
      ignoreClick = event.type === 'pointerup';
      dirty = true;
      return;
    }
    if (event.pointerType !== 'touch' || touchPointer !== event.pointerId) return;
    touchPointer = null;
    ignoreClick = event.type === 'pointerup' && touchDucking;
    touchDucking = false;
    setDuck(game, false);
    dirty = true;
  }
  host.addEventListener('pointerup', releasePointer);
  host.addEventListener('pointercancel', releasePointer);
  play.addEventListener('click', playRun);
  stop.addEventListener('click', stopRun);
  renderer?.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    pauseRun();
    fallback();
  });

  function frame(time) {
    requestAnimationFrame(frame);
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    if (!visible || document.hidden) return;
    const animate = !reduced.matches && !document.body.classList.contains('motion-paused');
    if (animate !== wasAnimating) {
      clearFeedback(fx);
      wasAnimating = animate;
      dirty = true;
    }
    if (starting && !paused && (view !== '3d' || !animate)) {
      cameraProgress = cameraTarget = view === '3d' ? 1 : 0;
      resetIntro();
      updateCamera();
      startRunner(game);
      starting = false;
      dirty = true;
    }
    // On first entry: coin 0–.44s, cabinet kick .44–.68s, camera .68–1.4s.
    if (starting && !paused && view === '3d' && (introTime > 0 || cameraProgress === 0)) {
      introTime = Math.min(INTRO_DURATION, introTime + dt);
      sampleIntro(introTime, intro);
      host.dataset.introPhase = intro.phase;
      stage.dataset.arcadeIntro = intro.phase;
      coinLight.intensity = Math.max(0, 1 - Math.abs(introTime - .44) / .1) * 2.4;
      coin.visible = intro.phase === 'coin';
      if (coin.visible) {
        const p = intro.coin * intro.coin;
        coin.position.lerpVectors(coinStart, coinSlot, p);
        coin.position.y += Math.sin(p * Math.PI) * .09;
        coin.rotation.set((1 - p) * Math.PI / 2, 0, (1 - p) * Math.PI * 2);
        coin.scale.setScalar(1.25 - p * .45);
      }
      if (machine) {
        const kick = intro.phase === 'shake' ? 1 - intro.shake : 0;
        machine.rotation.z = Math.sin(intro.shake * Math.PI * 4) * .022 * kick;
        machine.position.x = Math.sin(intro.shake * Math.PI * 5) * .014 * kick;
        if (joystick) joystick.rotation.x = Math.sin(intro.shake * Math.PI * 4) * .16 * kick;
      }
      cameraProgress = cameraTarget = intro.zoom;
      updateCamera();
      dirty = true;
      if (intro.phase === 'ready') { startRunner(game); starting = false; }
    } else if (!paused && cameraProgress !== cameraTarget) {
      cameraProgress = animate ? T.MathUtils.clamp(cameraProgress + Math.sign(cameraTarget - cameraProgress) * dt / .5, 0, 1) : cameraTarget;
      updateCamera();
      dirty = true;
    }
    const frozen = fx.freeze > 0;
    if (!paused && updateFeedback(fx, dt)) dirty = true;
    if (game.phase === 'running' && !paused && !frozen) {
      accumulator += dt;
      while (accumulator >= 1 / 60) {
        const previousHeight = game.y, previousScore = game.score, previousPhase = game.phase;
        stepRunner(game, 1 / 60);
        if (animate) {
          if (previousHeight > 0 && game.y === 0) emitFeedback(fx, 'land', 140, 259);
          if (game.score !== previousScore) emitFeedback(fx, 'score', 164, 225);
          if (previousPhase === 'running' && game.phase === 'over') emitFeedback(fx, 'hit', 155, 236 - game.y);
        }
        accumulator -= 1 / 60;
      }
      dirty = true;
    } else accumulator = 0;
    if (pressTime > 0) { pressTime = Math.max(0, pressTime - dt); dirty = true; }
    if (!dirty) return;
    drawRunner(ctx, game, paused, game.phase === 'running' && !paused ? accumulator * 60 : 1);
    if (starting && view === '3d') drawCrtReveal(intro.scan);
    if (animate) drawFeedback(ctx, fx);
    texture.needsUpdate = true;
    const press = animate ? Math.sin(Math.PI * pressTime / .18) : 0;
    if (button) button.position.y = button.userData.restY - press * .015;
    if (duckButton) duckButton.position.y = T.MathUtils.damp(duckButton.position.y, duckButton.userData.restY - (game.ducking ? .015 : 0), 20, dt);
    if (joystick && !starting) joystick.rotation.x = 0;
    camera.position.copy(cameraRest);
    if (animate && fx.shake > 0) {
      const strength = fx.shake * fx.shake * .018;
      camera.position.x += Math.sin(time * .071) * strength;
      camera.position.y += Math.sin(time * .093) * strength * .65;
    }
    if (renderer) renderer.render(scene, camera);
    updateUI();
    dirty = false;
  }
  updateUI();
  requestAnimationFrame(frame);
}
