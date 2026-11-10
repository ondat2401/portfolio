import { mountCube } from '../../assets/js/features/hero-rubik.js';
import { createProjectDetails } from './project-details.js';
import { layoutComicPanels } from '../../assets/js/features/comic-panels.js';

mountCube(document.querySelector('#cube'), document.querySelector('#explode'));
const root = new URL('../../', document.baseURI);
const list = document.querySelector('#projects');
const showDetails = createProjectDetails(root);
const previews = new Map();
let activePreview = null;

function stopPreview(video) {
  const state = previews.get(video);
  state.request++;
  video.pause();
  state.button.textContent = '▶ PREVIEW';
  state.button.setAttribute('aria-pressed', 'false');
  if (activePreview === video) activePreview = null;
}
async function playPreview(video) {
  if (activePreview && activePreview !== video) stopPreview(activePreview);
  const state = previews.get(video);
  const request = ++state.request;
  activePreview = video;
  try {
    await video.play();
    if (request !== state.request) {
      if (activePreview !== video) video.pause();
      return;
    }
    state.button.textContent = 'Ⅱ PAUSE';
    state.button.setAttribute('aria-pressed', 'true');
  } catch {
    if (request === state.request) state.button.textContent = 'RETRY';
  }
}
const visibility = new IntersectionObserver(entries => {
  for (const entry of entries) if (!entry.isIntersecting) {
    const video = entry.target.querySelector('video');
    if (video) stopPreview(video);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && activePreview) stopPreview(activePreview);
});

function renderProject(project, category) {
  const card = document.createElement('article');
  card.className = 'panel';
  card.dataset.category = category;
  let video = null;
  if (project.video && !project.video.startsWith('http')) {
    video = document.createElement('video');
    video.src = new URL(project.video, root);
    if (project.image) video.poster = new URL(project.image, root);
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => {
      if (!video.videoWidth || !video.videoHeight) return;
      card.classList.toggle('portrait', video.videoHeight > video.videoWidth);
      if (video.videoHeight > video.videoWidth) video.removeAttribute('poster');
      video.style.aspectRatio = video.videoWidth + '/' + video.videoHeight;
      layoutComicPanels(list);
    });
    card.append(video);
  } else if (project.image) {
    const image = document.createElement('img');
    image.src = new URL(project.image, root);
    image.alt = project.title;
    image.loading = 'lazy';
    card.append(image);
  }
  const caption = document.createElement('div');
  caption.className = 'caption';
  const text = document.createElement('div');
  const heading = document.createElement('h3');
  heading.textContent = project.title;
  const role = document.createElement('p');
  role.textContent = project.role || (project.tech || []).slice(0, 3).join(' / ');
  text.append(heading, role);
  const actions = document.createElement('div');
  actions.className = 'card-actions';
  if (video) {
    const preview = document.createElement('button');
    preview.textContent = '▶ PREVIEW';
    preview.setAttribute('aria-label', 'Preview ' + project.title);
    preview.setAttribute('aria-pressed', 'false');
    previews.set(video, { button: preview, request: 0 });
    preview.addEventListener('click', () => video.paused ? playPreview(video) : stopPreview(video));
    card.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') playPreview(video); });
    card.addEventListener('pointerleave', () => stopPreview(video));
    video.addEventListener('error', () => {
      stopPreview(video);
      preview.textContent = 'UNAVAILABLE';
      preview.disabled = true;
    });
    actions.append(preview);
    visibility.observe(card);
  }
  const details = document.createElement('button');
  details.textContent = 'CASE STUDY ↗';
  details.addEventListener('click', () => {
    if (activePreview) stopPreview(activePreview);
    showDetails(project);
  });
  actions.append(details);
  caption.append(text, actions);
  card.append(caption);
  list.append(card);
}

try {
  const response = await fetch(new URL('data/projects.json', root));
  if (!response.ok) throw Error('Projects unavailable');
  const data = await response.json();
  const projects = new Map();
  for (const category of data.projectCategories) {
    for (const project of category.projects) projects.set(project.title, { project, category: category.id });
  }
  for (const project of data.highlights) {
    const old = projects.get(project.title);
    projects.set(project.title, { project: { ...old?.project, ...project }, category: old?.category || 'featured' });
  }
  const ordered = [...data.highlights.map(p => projects.get(p.title)),
    ...[...projects.values()].filter(item => !data.highlights.some(p => p.title === item.project.title))];
  for (const item of ordered) renderProject(item.project, item.category);
  layoutComicPanels(list);
  const filters = document.querySelector('#filters');
  for (const option of [{ id: 'all', label: 'ALL WORK' }, ...data.projectCategories]) {
    const button = document.createElement('button');
    button.textContent = option.label;
    button.setAttribute('aria-pressed', String(option.id === 'all'));
    button.addEventListener('click', () => {
      if (activePreview) stopPreview(activePreview);
      for (const control of filters.children) control.setAttribute('aria-pressed', String(control === button));
      for (const card of list.children) card.hidden = option.id !== 'all' && card.dataset.category !== option.id;
      layoutComicPanels(list);
    });
    filters.append(button);
  }
} catch (error) {
  list.textContent = 'Unable to load projects. Please refresh.';
  console.error(error);
}

try {
  const response = await fetch(new URL('data/profile.json', root));
  if (!response.ok) throw Error('Profile unavailable');
  const profile = await response.json();
  document.querySelector('#about-description').textContent = profile.about.description;
  const skills = document.querySelector('#skills-list');
  for (const skill of profile.skills) {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = skill.title;
    const description = document.createElement('span');
    description.textContent = skill.desc;
    item.append(title, description);
    skills.append(item);
  }
  const experience = document.querySelector('#experience-list');
  for (const job of profile.timeline) {
    const item = document.createElement('article');
    const period = document.createElement('p');
    period.className = 'eyebrow';
    period.textContent = job.period;
    const heading = document.createElement('h3');
    heading.textContent = job.role;
    const company = document.createElement('p');
    company.textContent = job.company;
    const description = document.createElement('p');
    description.textContent = job.desc;
    item.append(period, heading, company, description);
    experience.append(item);
  }
} catch (error) {
  document.querySelector('#about-description').textContent = 'Profile unavailable. Please refresh.';
  console.error(error);
}
