import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import '../../css/portfolio-decor.css';

const familyUrl = new URL('../../models/portfolio-decor/portfolio-decor.glb', import.meta.url);
const imageUrls = {
  cartridge: new URL('../../models/portfolio-decor/cartridge.png', import.meta.url).href,
  'logic-core': new URL('../../models/portfolio-decor/logic-core.png', import.meta.url).href,
  'pixel-mascot': new URL('../../models/portfolio-decor/pixel-mascot.png', import.meta.url).href
};
const items = [
  { id: 'pixel-mascot', root: 'Pixel_Mascot_Root', section: '#about', href: '#about', label: 'About the developer' },
  { id: 'logic-core', root: 'Logic_Core_Root', section: '#skills', href: '#skills', label: 'View game development skills' },
  { id: 'cartridge', root: 'Cartridge_Root', section: '#projects', href: '#projects', label: 'View game projects' }
];

export function mountPortfolioDecor() {
  if (document.querySelector('.portfolio-decor-overlay')) return;
  const anchors = items.map(item => {
    const section = document.querySelector(item.section);
    if (!section) return null;
    const container = section.querySelector('.container') || section;
    const anchor = document.createElement('a');
    anchor.className = `portfolio-decor-anchor portfolio-decor-anchor--${item.id}`;
    anchor.href = item.href;
    anchor.setAttribute('aria-label', item.label);
    anchor.dataset.decorId = item.id;
    const image = document.createElement('img');
    image.src = imageUrls[item.id];
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.loading = 'lazy';
    image.decoding = 'async';
    anchor.append(image);
    return { ...item, section, container, anchor, model: null, targetX: 0, targetY: 0 };
  }).filter(Boolean);
  if (!anchors.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'portfolio-decor-overlay';
  const canvas = document.createElement('canvas');
  canvas.className = 'portfolio-decor-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  overlay.append(canvas, ...anchors.map(({ anchor }) => anchor));
  document.body.append(overlay);

  let renderer;
  let scene;
  let camera;
  let rendererFailed = false;
  let frame = 0;
  let modelLoaded = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  function motionEnabled() {
    return !reducedMotion.matches && !document.body.classList.contains('motion-paused');
  }

  function createRenderer() {
    if (renderer) return true;
    if (rendererFailed) return false;
    try {
      renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      scene = new T.Scene();
      camera = new T.OrthographicCamera(0, innerWidth, innerHeight, 0, 0.1, 120);
      camera.position.set(0, 0, 90);
      camera.lookAt(0, 0, 0);
      scene.add(new T.HemisphereLight(0xfff4dc, 0x24211c, 2.1));
      const key = new T.DirectionalLight(0xffffff, 2.7);
      key.position.set(-3, 6, 8);
      scene.add(key);
      const fill = new T.DirectionalLight(0xffd7a2, 1.1);
      fill.position.set(4, -2, 4);
      scene.add(fill);
      resizeRenderer();
      return true;
    } catch {
      rendererFailed = true;
      overlay.classList.add('is-fallback');
      return false;
    }
  }

  function resizeRenderer() {
    if (renderer && camera) {
      const width = innerWidth, height = innerHeight;
      renderer.setSize(width, height, false);
      camera.left = 0;
      camera.right = width;
      camera.top = height;
      camera.bottom = 0;
      camera.updateProjectionMatrix();
    }
    scheduleRender();
  }

  function layoutModels() {
    const width = innerWidth, height = innerHeight;
    let visible = false;
    for (const item of anchors) {
      const sectionRect = item.section.getBoundingClientRect();
      const containerRect = item.container.getBoundingClientRect();
      const margin = width <= 700 ? 10 : 12;
      const anchorWidth = item.anchor.offsetWidth;
      const anchorHeight = item.anchor.offsetHeight;
      const left = Math.min(width - margin - anchorWidth, containerRect.right - margin - anchorWidth);
      item.anchor.style.left = `${Math.max(margin, left)}px`;
      item.anchor.style.top = `${sectionRect.bottom - margin - anchorHeight}px`;
      const rect = item.anchor.getBoundingClientRect();
      const inView = rect.bottom > -40 && rect.top < height + 40 && rect.right > 0 && rect.left < width;
      if (item.model) {
        item.model.visible = inView;
        if (inView) {
          const size = item.model.userData.decorSize;
          const scale = Math.min(rect.width / size.x, rect.height / size.y) * 0.84;
          item.model.scale.setScalar(scale);
          item.model.position.set(rect.left + rect.width / 2, height - rect.top - rect.height / 2, 0);
          visible = true;
        }
      }
      item.anchor.dataset.inView = String(inView);
    }
    return visible;
  }

  function renderFrame() {
    frame = 0;
    const visible = layoutModels();
    let animating = false;
    for (const item of anchors) {
      const model = item.model;
      if (!model || !model.visible) continue;
      const active = motionEnabled() && item.anchor.matches(':hover, :focus-visible');
      const targetY = active ? item.targetY : 0;
      const targetX = active ? item.targetX : 0;
      model.rotation.y += (targetY - model.rotation.y) * 0.24;
      model.rotation.x += (targetX - model.rotation.x) * 0.24;
      if (Math.abs(targetY - model.rotation.y) > 0.004 || Math.abs(targetX - model.rotation.x) > 0.004) animating = true;
    }
    if (renderer && visible) renderer.render(scene, camera);
    if (animating) frame = requestAnimationFrame(renderFrame);
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(renderFrame);
  }

  for (const item of anchors) {
    item.targetY = item.id === 'logic-core' ? 0.08 : -0.08;
    item.targetX = -0.04;
    item.anchor.addEventListener('pointerenter', scheduleRender);
    item.anchor.addEventListener('pointerleave', scheduleRender);
    item.anchor.addEventListener('focus', scheduleRender);
    item.anchor.addEventListener('blur', scheduleRender);
  }

  const resize = new ResizeObserver(scheduleRender);
  resize.observe(document.body);
  window.addEventListener('scroll', scheduleRender, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) scheduleRender(); });
  for (const event of ['portfolio:hero-ready', 'portfolio:projects-rendered', 'portfolio:media-ready']) {
    document.addEventListener(event, scheduleRender);
  }
  reducedMotion.addEventListener('change', scheduleRender);
  new MutationObserver(scheduleRender).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    overlay.classList.add('is-fallback');
    renderer?.dispose();
    renderer = null;
    canvas.hidden = true;
    for (const item of anchors) delete item.anchor.dataset.modelReady;
  });

  const loadModels = () => {
    if (modelLoaded || !createRenderer()) return;
    modelLoaded = true;
    new GLTFLoader().load(familyUrl.href, gltf => {
      for (const item of anchors) {
        const model = gltf.scene.getObjectByName(item.root);
        if (!model) continue;
        model.parent?.remove(model);
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.setScalar(1);
        scene.add(model);
        model.updateMatrixWorld(true);
        const bounds = new T.Box3().setFromObject(model);
        const size = bounds.getSize(new T.Vector3());
        model.userData.decorSize = { x: size.x || 1, y: size.y || 1 };
        item.model = model;
        item.anchor.dataset.modelReady = 'true';
      }
      overlay.classList.add('is-ready');
      scheduleRender();
    }, undefined, () => overlay.classList.add('is-fallback'));
  };

  const loaderObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    loaderObserver.disconnect();
    loadModels();
  }, { rootMargin: '320px 0px' });
  anchors.forEach(({ anchor }) => loaderObserver.observe(anchor));
  window.addEventListener('resize', resizeRenderer, { passive: true });
  resizeRenderer();
  scheduleRender();
}
