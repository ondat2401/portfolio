import { mountArcade } from './features/hero-arcade.js';
import { layoutComicPanels } from './features/comic-panels.js';
import { mountPortfolioDecor } from './features/portfolio-decor.js';

let mounted = false;
function mountHero() {
  const host = document.querySelector('#cube');
  if (mounted || !host || !document.querySelector('[data-arcade-play]')) return;
  mounted = true;
  mountArcade(host);
}
document.addEventListener('portfolio:hero-ready', mountHero);
mountHero();

function layoutProjects() {
  document.querySelectorAll('.project-grid-inner').forEach(grid => layoutComicPanels(grid));
  const highlights = document.querySelector('#latestProject');
  if (highlights) layoutComicPanels(highlights);
}
document.addEventListener('portfolio:projects-rendered', layoutProjects);
document.addEventListener('portfolio:media-ready', layoutProjects);
layoutProjects();
mountPortfolioDecor();

const motionButton = document.querySelector('#motionToggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function setMotionPaused(paused) {
  document.body.classList.toggle('motion-paused', paused);
  if (motionButton) {
    motionButton.disabled = reducedMotion.matches;
    motionButton.title = reducedMotion.matches ? 'Reduced motion is enabled in your system settings.' : 'Pause decorative animation';
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.textContent = paused ? 'Motion: off' : 'Motion: on';
  }
}
setMotionPaused(reducedMotion.matches);
motionButton?.addEventListener('click', () => {
  setMotionPaused(!document.body.classList.contains('motion-paused'));
});
reducedMotion.addEventListener('change', event => setMotionPaused(event.matches));

// Decor responds to viewport entry once; project content never waits for an animation.
const inkObserver = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('ink-entered');
    inkObserver.unobserve(entry.target);
  }
}, { threshold: .15 });
document.querySelectorAll('.section-title').forEach(title => inkObserver.observe(title));
