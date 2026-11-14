import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const readJSON = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const projects = readJSON('data/projects.json');
const profile = readJSON('data/profile.json');
const allProjects = [...projects.highlights, ...projects.projectCategories.flatMap(category => category.projects)];

function renderer({ reducedMotion = false, paused = false } = {}) {
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) nodes.set(id, {
      innerHTML: '', textContent: '',
      addEventListener() {}, querySelectorAll: () => [],
      querySelector: () => ({ textContent: '', hidden: false }),
    });
    return nodes.get(id);
  };
  const context = vm.createContext({
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    matchMedia: () => ({ matches: reducedMotion }), navigator: { maxTouchPoints: 0 },
    document: { addEventListener() {}, dispatchEvent() {}, getElementById: element,
      body: { classList: { contains: name => name === 'motion-paused' && paused } } },
    history: { replaceState() {} }, Event: class {},
    bootstrap: { Modal: class { show() {} } },
  });
  vm.runInContext(readFileSync(new URL('assets/js/main.js', root), 'utf8'), context);
  return { context, element };
}

test('every project has a role, a concise summary, and concrete contribution notes', () => {
  for (const project of allProjects) {
    assert.ok(project.role, project.title);
    assert.ok(project.desc.length > 30 && project.desc.length < 220, project.title);
    assert.ok(project.caseStudy.challenge, project.title);
    assert.ok(project.caseStudy.contributions.length >= 2, project.title);
    assert.doesNotMatch(JSON.stringify(project.caseStudy), /Short description|Full detailed description|lorem ipsum/i);
    for (const path of [project.image, project.video, ...(project.playableFiles || [])]) {
      if (path && !path.startsWith('http')) assert.ok(existsSync(new URL(path, root)), path);
    }
    for (const link of [project.playStore, project.appStore]) {
      assert.doesNotMatch(link || '', /id=example|\/example\//);
    }
    const config = readJSON(`projects/${project.image.split('/')[1]}/config.json`);
    assert.deepEqual(config.caseStudy, project.caseStudy, project.title);
    assert.equal(config.desc, project.desc, project.title);
  }
});

test('highlight results link to case studies with an explicit evidence limit', () => {
  const { context, element } = renderer();
  context.renderHero(profile.hero, profile.about.cvLink, projects.highlights);
  const html = element('heroContent').innerHTML;
  for (const project of projects.highlights) {
    assert.ok(project.caseStudy.evidence, project.title);
    assert.ok(html.includes(`#project=${context.slugify(project.title)}`), project.title);
    assert.ok(html.includes(project.result.value), project.title);
  }
  context.renderHighlights(projects.highlights);
  assert.match(element('latestProject').innerHTML, /The challenge/);
  assert.match(element('latestProject').innerHTML, /Read case study/);
});

test('project dialogs lead with ownership and decisions, and keep playable/video access', () => {
  const { context, element } = renderer();
  for (const project of allProjects) {
    context.showProjectModal(project);
    const html = element('projectModalBody').innerHTML;
    assert.ok(html.includes(project.role), project.title);
    assert.ok(html.includes(project.caseStudy.challenge), project.title);
    assert.ok(html.indexOf('What I built') < html.indexOf('<video'), project.title);
    assert.doesNotMatch(html, /Short description|Full detailed description/);
    if (project.playable) assert.match(html, /closeModalAndPlay/);
  }
});

test('contact CTA uses the configured CV and omits unfinished social links', () => {
  const { context, element } = renderer();
  context.renderFooter({ copyright: 'Portfolio' }, profile.socials, 'custom-cv.pdf');
  const html = element('footerContent').innerHTML;
  assert.match(html, /href="custom-cv.pdf"/);
  assert.match(html, /GitHub/);
  assert.doesNotMatch(html, /href="mailto:"|href="https:\/\/linkedin.com\/"|href="#"/);
});

test('about uses the original MP4 with muted inline looping playback', () => {
  const { context, element } = renderer();
  context.renderAbout(profile.about);
  const html = element('aboutAvatar').innerHTML;
  assert.equal(profile.about.avatar, 'assets/media/avt.mp4');
  assert.equal(profile.about.avatarAnimation, undefined);
  assert.match(html, /<video src="assets\/media\/avt\.mp4" autoplay muted loop playsinline preload="metadata"/);
  assert.doesNotMatch(html, /avatar-comic-loop/);
  const video = readFileSync(new URL(profile.about.avatar, root));
  assert.equal(video.subarray(4, 8).toString(), 'ftyp');
});

test('avatar does not autoplay when motion is paused or reduced', () => {
  for (const options of [{ paused: true }, { reducedMotion: true }]) {
    const { context, element } = renderer(options);
    context.renderAbout(profile.about);
    const html = element('aboutAvatar').innerHTML;
    assert.match(html, /<video/);
    assert.doesNotMatch(html, /autoplay/);
  }
});
