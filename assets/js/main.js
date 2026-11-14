/**
 * Portfolio - Config-driven rendering
 * Data nằm trong data/config.json
 */

const PROJECTS_PER_PAGE = 6;

// Respect the user's OS-level "reduce motion" preference.
// Used to skip heavy JS-driven animations (particles, typing loop).
const prefersReducedMotion = window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const pageState = {}; // track current page per category
let allCategories = []; // store for modal lookup
let allHighlights = []; // store highlights for deep link lookup
let modalConfig = {}; // modal UI config

// Slugify a project title for URL hash
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Find a project by slug across highlights and all categories
function findProjectBySlug(slug) {
  for (const p of allHighlights) {
    if (slugify(p.title) === slug) return p;
  }
  for (const cat of allCategories) {
    for (const p of cat.projects) {
      if (slugify(p.title) === slug) return p;
    }
  }
  return null;
}

// Open modal from URL hash if present
function openProjectFromHash() {
  const hash = location.hash;
  if (!hash.startsWith('#project=')) return;
  const slug = decodeURIComponent(hash.replace('#project=', ''));
  const project = findProjectBySlug(slug);
  if (!project) return;

  // Scroll to the project card/highlight first
  const el = document.querySelector(`[data-slug="${slug}"]`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Open modal after scroll settles
    setTimeout(() => showProjectModal(project), 500);
  } else {
    showProjectModal(project);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // --- Load UI Config first (for loading screen) ---
  let uiConfig = {};
  try {
    const uiRes = await fetch('data/ui-config.json');
    uiConfig = await uiRes.json();
    modalConfig = uiConfig.modal || {};
  } catch (e) { /* fallback to defaults */ }

  // --- Apply loading screen text from config ---
  const loadingTextEl = document.getElementById('loadingText');
  if (loadingTextEl && uiConfig.loading?.text) loadingTextEl.textContent = uiConfig.loading.text;

  // --- Loading Screen ---
  const loadingBar = document.getElementById('loadingBarFill');
  const loadingScreen = document.getElementById('loadingScreen');
  let loadProgress = 0;
  const setLoadProgress = (pct) => {
    loadProgress = pct;
    if (loadingBar) loadingBar.style.width = pct + '%';
  };
  setLoadProgress(10);

  // Load data files in parallel
  const [siteRes, profileRes, projectsRes] = await Promise.all([
    fetch('data/site.json'),
    fetch('data/profile.json'),
    fetch('data/projects.json')
  ]);
  setLoadProgress(30);
  const site = await siteRes.json();
  const profile = await profileRes.json();
  const projects = await projectsRes.json();
  setLoadProgress(50);

  renderHero(profile.hero, profile.about.cvLink, projects.highlights);
  renderSectionTitles(site.sectionTitles);
  renderStats(profile.stats);
  setLoadProgress(60);
  renderAbout(profile.about);
  renderSkills(profile.skills, profile.skillGroups);
  setLoadProgress(70);
  renderHighlights(projects.highlights);
  renderProjectCategories(projects.projectCategories);
  applyComicMediaRatios(document);
  setLoadProgress(80);
  renderTimeline(profile.timeline);
  renderFooter(site, profile.socials, profile.about.cvLink);
  setLoadProgress(90);

  document.title = site.title;

  // Set nav CV button
  const navCv = document.getElementById('navCvBtn');
  if (navCv && profile.about.cvLink) navCv.href = profile.about.cvLink;

  // Set meta tags
  const setMeta = (id, content) => { const el = document.getElementById(id); if (el && content) el.content = content; };
  setMeta('metaDesc', site.description);
  setMeta('ogTitle', site.title);
  setMeta('ogDesc', site.description);
  setMeta('ogImage', site.ogImage);
  setMeta('ogUrl', site.url);
  setMeta('twTitle', site.title);
  setMeta('twDesc', site.description);
  setMeta('twImage', site.ogImage);
  document.querySelector('meta[name="author"]').content = profile.hero.name;
  if (site.favicon) document.querySelector('link[rel="icon"]').href = site.favicon;

  // Set navbar brand name
  const brand = document.getElementById('navBrand');
  if (brand) brand.textContent = profile.hero.name;

  // --- Apply custom cursor from config ---
  if (uiConfig.cursor?.default) {
    const size = uiConfig.cursor.size || 24;
    const cursorUrl = uiConfig.cursor.default;
    document.documentElement.style.cursor = `url('${cursorUrl}') ${Math.floor(size / 2)} ${Math.floor(size / 2)}, auto`;
    document.body.style.cursor = `url('${cursorUrl}') ${Math.floor(size / 2)} ${Math.floor(size / 2)}, auto`;
  }

  initNavScroll();
  initParticles();
  initThemeToggle();
  initScrollReveal();
  initAnimatedCounters();

  setLoadProgress(100);

  // Hide loading screen after a short delay
  const startDelay = uiConfig.typing?.startDelay || 400;
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    // Start typing effect after loading screen fades
    setTimeout(() => initTypingEffect(profile.hero, uiConfig.typing), startDelay);
    // Open project modal from URL hash (deep link)
    openProjectFromHash();
  }, 600);

  // Handle browser back/forward with hash changes
  window.addEventListener('hashchange', openProjectFromHash);
});

// --- Renderers ---

function renderHero({ name, tagline, cta }, cvLink, highlights = []) {
  const container = document.getElementById('heroContent');
  const proof = highlights.filter(project => project.result).map(project => `
    <a href="#project=${slugify(project.title)}"><strong>${project.result.value}</strong><span>${project.title.split(':')[0]}: ${project.result.label}</span></a>
  `).join('');
  container.className = 'container hero';
  container.innerHTML = `
      <div class="hero-copy">
        <div class="headline"><h1>SMALL SCREEN.<br>BIG GAME<br>FEEL.</h1></div>
        <p class="intro"></p>
        <p class="hero-description">I’m On Thanh Dat. I build Unity games and playable ads, from rhythm and puzzle systems to mobile optimization and creative testing.</p>
        <div class="hero-actions"><a class="button" href="#latestProjectSection">Explore case studies</a><a class="hero-cv" target="_blank" rel="noopener">View CV ↗</a></div>
        ${proof ? `<div class="hero-proof">${proof}</div>` : ''}
        <p class="hero-note">UNITY / C# / PLAYABLE ADS</p>
      </div>
      <div class="stage arcade-stage">
        <div class="stage-index" aria-hidden="true">A WORK IN PLAY</div>
        <div id="cube" role="group" tabindex="0" aria-label="Playable arcade game. Choose Play to start or Stop to exit." aria-describedby="arcade-help"><p id="fallback">LOADING ARCADE…</p></div>
        <div class="cube-controls"><button type="button" data-arcade-play aria-controls="cube" disabled>PLAY ▶</button><button type="button" data-arcade-stop aria-controls="cube" disabled>STOP ■</button><small id="arcade-help" class="arcade-help-icons"></small></div>
        <p id="cube-status" class="cube-status" role="status" aria-live="polite">LOADING ARCADE</p>
      </div>
      <div id="statsBar" class="rpg-stats-bar"></div>
      <div class="hero-strip"><span>THINK IT.</span><span>BUILD IT.</span><span>MAKE IT FEEL ALIVE.</span><a href="#projects">SCROLL TO PLAY ↓</a></div>
    `;
  const touchMode = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const help = container.querySelector('#arcade-help');
  help.innerHTML = touchMode
    ? `<span class="arcade-help-sr-only">Tap or press the red cabinet button to jump. Swipe down and hold, or press the gold cabinet button, to duck.</span>
       <span class="arcade-help-group" aria-hidden="true"><svg viewBox="0 0 24 30"><rect x="3" y="1" width="18" height="28" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M9 25h6"/></svg><i class="arcade-button-icon is-red"></i></span>
       <span class="arcade-help-group" aria-hidden="true"><svg viewBox="0 0 24 30"><rect x="3" y="1" width="18" height="28" rx="3"/><path d="M12 7v13m-5-5 5 5 5-5M9 25h6"/></svg><i class="arcade-button-icon is-gold"></i></span>`
    : `<span class="arcade-help-sr-only">Press Space or Up Arrow, or the red cabinet button, to jump. Hold Down Arrow or the gold cabinet button to duck.</span>
       <span class="arcade-help-group" aria-hidden="true"><kbd>↑</kbd><i class="arcade-space-key"></i><i class="arcade-button-icon is-red"></i></span>
       <span class="arcade-help-group" aria-hidden="true"><kbd>↓</kbd><i class="arcade-button-icon is-gold"></i></span>`;
  const cv = container.querySelector('.hero-cv');
  if (cvLink) cv.href = cvLink;
  else cv.hidden = true;
  container.querySelector('.intro').textContent = tagline;
  container.querySelector('.button').textContent = cta || 'View Projects';
  document.dispatchEvent(new Event('portfolio:hero-ready'));
}

function renderSectionTitles(titles) {
  if (!titles) return;
  const map = {
    highlights: 'titleHighlights',
    about: 'titleAbout',
    skills: 'titleSkills',
    projects: 'titleProjects',
    experience: 'titleExperience'
  };
  Object.entries(map).forEach(([key, id]) => {
    const el = document.getElementById(id);
    if (el && titles[key]) el.textContent = titles[key];
  });
}


function renderStats(stats) {
  const bar = document.getElementById('statsBar');
  if (!bar || !stats || !stats.length) return;

  bar.innerHTML = stats.map((s) => {
    let value = s.value;
    let rawNum = null;
    let suffix = '';
    if (value === 'auto' && s.startDate) {
      const [y, m] = s.startDate.split('-').map(Number);
      const start = new Date(y, m - 1);
      const now = new Date();
      const years = (now - start) / (1000 * 60 * 60 * 24 * 365.25);
      rawNum = Math.floor(years);
      suffix = '+';
      value = rawNum + suffix;
    } else if (typeof value === 'string') {
      const match = value.match(/^(\d+)(.*)$/);
      if (match) {
        rawNum = parseInt(match[1]);
        suffix = match[2];
      }
    }
    const countAttr = rawNum !== null ? `data-count-target="${rawNum}" data-count-suffix="${suffix}"` : '';
    return `
    <div class="rpg-stat-item">
      <div class="rpg-stat-icon">${s.icon}</div>
      <div class="rpg-stat-value" ${countAttr}>${rawNum !== null ? '0' + suffix : value}</div>
      <div class="rpg-stat-label">${s.label}</div>
    </div>
  `}).join('');
}

function renderAbout({ description, cvLink, avatar, avatarZoom, avatarOffsetX, avatarOffsetY, quote }) {
  if (avatar) {
    const avatarEl = document.getElementById('aboutAvatar');
    const isVideo = avatar.match(/\.(mp4|webm|ogg)$/i);
    const zoom = avatarZoom || 1;
    const ox = avatarOffsetX || 0;
    const oy = avatarOffsetY || 0;
    const style = `object-fit: cover; transform: scale(${zoom}) translate(${ox}px, ${oy}px);`;

    if (isVideo) {
      const autoplay = !prefersReducedMotion && !document.body.classList.contains('motion-paused');
      avatarEl.innerHTML = `<video src="${avatar}" ${autoplay ? 'autoplay' : ''} muted loop playsinline preload="metadata" class="w-100 h-100 rounded-circle" style="${style}"></video>`;
    } else {
      avatarEl.innerHTML = `<img src="${avatar}" alt="Avatar" class="w-100 h-100 rounded-circle" style="${style}">`;
    }
  }
  document.getElementById('aboutText').innerHTML = `
    <p class="fs-5">${description}</p>
    ${quote ? `<div class="about-quote mt-4"><span>"${quote}"</span></div>` : ''}
  `;
}

function renderSkills(skills, groups) {
  const container = document.getElementById('skillsSection');
  container.replaceChildren();

  for (const group of groups) {
    const panel = document.createElement('article');
    panel.className = 'toolkit-panel';
    panel.dataset.skillGroup = group.id;
    panel.innerHTML = `
      <div class="toolkit-art" aria-hidden="true"></div>
      <div class="toolkit-copy">
        <h3 class="toolkit-title"></h3>
        <p class="toolkit-description"></p>
        <ul class="toolkit-skills"></ul>
        <a class="toolkit-project"><span>See this in a project</span><strong></strong><span aria-hidden="true">↗</span></a>
      </div>
    `;
    panel.querySelector('.toolkit-title').textContent = group.title;
    panel.querySelector('.toolkit-description').textContent = group.description;
    const list = panel.querySelector('.toolkit-skills');
    for (const skill of skills.filter(skill => (skill.group || 'build') === group.id)) {
      const item = document.createElement('li');
      const name = document.createElement('strong');
      const description = document.createElement('span');
      name.textContent = skill.title;
      description.textContent = skill.desc;
      item.append(name, description);
      list.append(item);
    }
    const link = panel.querySelector('.toolkit-project');
    link.href = '#project=' + slugify(group.project);
    link.querySelector('strong').textContent = group.project;
    container.append(panel);
  }
}
// --- Latest Project (Featured) ---

function renderHighlights(projects) {
  allHighlights = projects;
  const container = document.getElementById('latestProject');
  if (!container || !projects || !projects.length) return;

  container.innerHTML = projects.map((project, i) => {
    const hasVideo = project.video && project.video.trim() !== '';
    const isLocal = hasVideo && !project.video.includes('youtube.com');
    const reverse = i % 2 === 1 ? ' flex-row-reverse' : '';

    return `
      <div class="highlight-item row align-items-center g-4 mb-5${reverse}" data-index="${i}" data-slug="${slugify(project.title)}">
        <div class="col-lg-7">
          <div class="latest-project-media ratio ratio-16x9" style="overflow: hidden; border-radius: 4px; border: 2px solid var(--color-primary); box-shadow: var(--glow-primary); position: relative;">
            ${project.image
              ? `<img src="${project.image}" alt="${project.title}" class="latest-thumb" style="object-fit: cover;">`
              : `<div class="d-flex align-items-center justify-content-center bg-dark latest-thumb">
                  <i class="bi bi-controller text-primary" style="font-size: 4rem;"></i>
                </div>`}
            ${hasVideo && isLocal ? `
              <div class="video-preview" style="position:absolute;inset:0;">
                <video src="${project.video}" preload="metadata" muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>
              </div>
            ` : ''}
            ${hasVideo && !isLocal ? `
              <div class="video-preview" style="position:absolute;inset:0;">
                <iframe data-src="${project.video}" style="width:100%;height:100%;border:none;" allow="autoplay"></iframe>
              </div>
            ` : ''}
          </div>
          ${project.playable && project.playableFiles && project.playableFiles.length > 1 ? `<div class="playable-count-badge"><i class="bi bi-stack"></i> ${project.playableFiles.length}</div>` : ''}
        </div>
        <div class="col-lg-5">
          <p class="project-role">${project.role || 'Game Developer'}</p>
          <h3 style="font-size: 0.9rem; color: var(--color-primary); text-shadow: var(--glow-primary);">${project.title}</h3>
          <p class="mt-3 latest-project-desc">${project.desc}</p>
          ${project.result ? `<div class="case-result"><strong>${project.result.value}</strong><span>${project.result.label}</span></div>` : ''}
          ${project.caseStudy ? `<dl class="case-preview"><div><dt>The challenge</dt><dd>${project.caseStudy.challenge}</dd></div><div><dt>My contribution</dt><dd>${project.caseStudy.contributions[0]}</dd></div></dl>` : ''}
          <div class="d-flex gap-3 flex-wrap mt-3">
            ${project.playable && project.playableFiles && project.playableFiles.length ? `<button class="btn btn-sm btn-outline-warning btn-play-now"><i class="bi bi-play-fill"></i> Play Now</button>` : ''}
            <button class="btn btn-sm btn-outline-primary btn-detail btn-latest-detail" aria-label="Read case study: ${project.title}">Read case study</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Bind events for each highlight item
  container.querySelectorAll('.highlight-item').forEach((item) => {
    const idx = parseInt(item.dataset.index);
    const project = projects[idx];

    // Hover play for local video
    const video = item.querySelector('.latest-project-media video');
    const media = item.querySelector('.latest-project-media');
    const preview = item.querySelector('.latest-project-media .video-preview');

    if (media && preview) {
      media.addEventListener('mouseenter', () => {
        if (prefersReducedMotion || document.body.classList.contains('motion-paused')) return;
        if (video) { video.currentTime = 0; video.play().catch(() => preview.classList.remove('active')); }
        const iframe = preview.querySelector('iframe[data-src]');
        if (iframe) {
          const sep = iframe.dataset.src.includes('?') ? '&' : '?';
          iframe.src = iframe.dataset.src + sep + 'autoplay=1&mute=1';
        }
        preview.classList.add('active');
      });

      media.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
        if (video) video.pause();
        const iframe = preview.querySelector('iframe');
        if (iframe) iframe.src = 'about:blank';
      });
    }

    item.querySelector('.btn-latest-detail')?.addEventListener('click', () => {
      showProjectModal(project);
    });

    item.querySelector('.btn-play-now')?.addEventListener('click', () => {
      openPlayable(project);
    });
  });
}


// --- Project Categories with Pagination ---

function renderProjectCategories(categories) {
  allCategories = categories;
  const container = document.getElementById('projectCategories');

  // Render filter bar
  const filterBar = document.getElementById('projectFilterBar');
  if (filterBar && categories.length > 1) {
    filterBar.innerHTML = `
      <button class="filter-btn active" data-filter="all" aria-pressed="true">All</button>
      ${categories.map(cat => `<button class="filter-btn" data-filter="${cat.id}" aria-pressed="false">${cat.label}</button>`).join('')}
    `;

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const filter = btn.dataset.filter;

        container.querySelectorAll('.project-category').forEach(catEl => {
          if (filter === 'all' || catEl.dataset.catId === filter) {
            catEl.classList.remove('filter-hidden');
            catEl.classList.add('filter-visible');
          } else {
            catEl.classList.remove('filter-visible');
            catEl.classList.add('filter-hidden');
          }
        });
      });
    });
  }

  container.innerHTML = categories.map((cat) => {
    pageState[cat.id] = 0;
    return `
      <div class="project-category mb-5 filter-visible" data-cat-id="${cat.id}">
        <h3 class="mb-4">${cat.label}</h3>
        <div class="project-grid-wrapper">
          <div class="row g-4 project-grid-inner" id="grid-${cat.id}"></div>
        </div>
        <div class="d-flex justify-content-center align-items-center mt-4 gap-3" id="pager-${cat.id}"></div>
      </div>
    `;
  }).join('');

  categories.forEach((cat) => renderProjectPage(cat, false));
}

function renderProjectPage(cat, animate = true, direction = 'next') {
  const page = pageState[cat.id];
  const total = cat.projects.length;
  const totalPages = Math.ceil(total / PROJECTS_PER_PAGE);
  const start = page * PROJECTS_PER_PAGE;
  const items = cat.projects.slice(start, start + PROJECTS_PER_PAGE);

  const grid = document.getElementById(`grid-${cat.id}`);

  const cardsHTML = items.map((p, i) => {
    const idx = start + i;
    const hasVideo = p.video && p.video.trim() !== '';
    const isEmbed = hasVideo && p.video.includes('youtube.com/embed');
    const isLocalVideo = hasVideo && !p.video.includes('youtube.com');
    return `
    <div class="col-lg-4 col-md-6">
      <div class="card h-100 project-card" data-video="${hasVideo ? '1' : ''}" data-slug="${slugify(p.title)}">
        <div class="card-img-top project-thumb ratio ratio-16x9" style="position: relative; overflow: hidden;">
          ${p.image
            ? `<img src="${p.image}" alt="${p.title}" loading="lazy" decoding="async" style="object-fit: cover;">`
            : `<div class="d-flex align-items-center justify-content-center w-100 h-100"><i class="bi bi-image text-white fs-1"></i></div>`}
          ${isLocalVideo ? `<div class="video-preview" style="position:absolute;inset:0;">
            <video src="${p.video}" preload="metadata" muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>
          </div>` : ''}
          ${isEmbed ? `<div class="video-preview" style="position:absolute;inset:0;">
            <iframe data-src="${p.video}" style="width:100%;height:100%;border:none;" allow="autoplay"></iframe>
          </div>` : ''}
        </div>
        ${p.playable && p.playableFiles && p.playableFiles.length > 1 ? `<div class="playable-count-badge"><i class="bi bi-stack"></i> ${p.playableFiles.length}</div>` : ''}
        <div class="card-body d-flex align-items-center justify-content-between py-2 px-3">
          <div>
            <p class="project-role">${p.role || 'Game Developer'}</p>
            <h4 class="card-title mb-0">${p.title}</h4>
            <p class="project-summary">${p.desc || ''}</p>
            ${p.focus ? `<p class="project-focus">${p.focus}</p>` : ''}
            ${p.tech && p.tech.length ? `<div class="tech-tags mt-1">${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>` : ''}
          </div>
          <div class="d-flex gap-2">
            ${p.playable && p.playableFiles && p.playableFiles.length ? `<button class="btn btn-sm btn-play-now" data-cat="${cat.id}" data-idx="${idx}"><i class="bi bi-play-fill"></i> Play</button>` : ''}
            <button class="btn btn-sm btn-outline-primary btn-detail" data-cat="${cat.id}" data-idx="${idx}">
              My contribution
            </button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');

  const updateGrid = () => {
    grid.innerHTML = cardsHTML;
    applyComicMediaRatios(grid);
    document.dispatchEvent(new Event('portfolio:projects-rendered'));

    // Bind video hover preview
    grid.querySelectorAll('.project-card[data-video="1"]').forEach((card) => {
      const preview = card.querySelector('.video-preview');
      if (!preview) return;

      const video = preview.querySelector('video');
      const iframe = preview.querySelector('iframe');

      card.addEventListener('mouseenter', () => {
        if (prefersReducedMotion || document.body.classList.contains('motion-paused')) return;
        preview.style.display = 'block';
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => preview.classList.remove('active'));
        }
        if (iframe) {
          const sep = iframe.dataset.src.includes('?') ? '&' : '?';
          iframe.src = iframe.dataset.src + sep + 'autoplay=1&mute=1';
        }
        preview.classList.add('active');
      });

      card.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
        if (video) video.pause();
        if (iframe) iframe.src = 'about:blank';
      });
    });

    // Bind detail buttons
    grid.querySelectorAll('.btn-detail').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.cat;
        const idx = parseInt(btn.dataset.idx);
        const category = allCategories.find((c) => c.id === catId);
        if (category) showProjectModal(category.projects[idx]);
      });
    });

    // Bind play now buttons
    grid.querySelectorAll('.btn-play-now').forEach((btn) => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.cat;
        const idx = parseInt(btn.dataset.idx);
        const category = allCategories.find((c) => c.id === catId);
        if (category) openPlayable(category.projects[idx]);
      });
    });
  };

  if (animate && !prefersReducedMotion && !document.body.classList.contains('motion-paused')) {
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-left' : 'slide-in-right';

    grid.classList.add(outClass);

    setTimeout(() => {
      updateGrid();
      grid.classList.remove(outClass);
      grid.classList.add(inClass);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          grid.classList.remove(inClass);
        });
      });
    }, 350);
  } else {
    updateGrid();
    // Lock wrapper height after first render
    requestAnimationFrame(() => {
      grid.closest('.project-grid-wrapper').style.minHeight = grid.offsetHeight + 'px';
    });
  }

  // Render pager
  const pager = document.getElementById(`pager-${cat.id}`);
  if (totalPages <= 1) {
    pager.innerHTML = '';
    return;
  }

  pager.innerHTML = `
    <button class="btn btn-outline-primary btn-sm" ${page === 0 ? 'disabled' : ''} data-cat="${cat.id}" data-dir="prev">
      <i class="bi bi-chevron-left"></i> Prev
    </button>
    <span class="text-muted">${page + 1} / ${totalPages}</span>
    <button class="btn btn-outline-primary btn-sm" ${page >= totalPages - 1 ? 'disabled' : ''} data-cat="${cat.id}" data-dir="next">
      Next <i class="bi bi-chevron-right"></i>
    </button>
  `;

  pager.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      pageState[cat.id] += dir === 'next' ? 1 : -1;
      renderProjectPage(cat, true, dir);
    });
  });
}

// --- Project Detail Modal - Helper Functions ---

const renderDurationBadge = (duration) => {
  if (!duration || !duration.from || !duration.to) return '';
  const icon = modalConfig.badges?.duration?.icon || '⏱';
  const formatDate = (str) => {
    if (str === 'Present') return 'Present';
    const [year, month] = str.split('-');
    return `${month}/${year}`;
  };
  return `<span class="duration-badge">${icon} ${formatDate(duration.from)} → ${formatDate(duration.to)}</span>`;
};

const renderRoleBadge = (role) => {
  if (!role || !role.trim()) return '';
  const icon = modalConfig.badges?.role?.icon || '🎮';
  return `<span class="role-badge">${icon} ${role}</span>`;
};

const renderImpacts = (impacts) => {
  if (!impacts || !Array.isArray(impacts) || !impacts.length) return '';
  const cfg = modalConfig.sections?.impacts || {};
  const icon = cfg.icon || '💡';
  const title = cfg.title || 'Key Contributions';
  return `
    <div class="impact-section">
      <h6>${icon} ${title}</h6>
      ${impacts.map((item) => `
        <div class="impact-item">
          <strong>${item.label}:</strong> ${item.desc}
        </div>
      `).join('')}
    </div>
  `;
};

const renderHypotheses = (hypotheses) => {
  if (!hypotheses || !Array.isArray(hypotheses) || !hypotheses.length) return '';
  const cfg = modalConfig.sections?.hypotheses || {};
  const hCfg = modalConfig.hypothesis || {};
  const icon = cfg.icon || '🧪';
  const title = cfg.title || 'Hypotheses Tested';
  const adoptedText = hCfg.adopted || '✓ Adopted';
  const rejectedText = hCfg.rejected || '✗ Rejected';
  const resultLabel = hCfg.resultLabel || 'Result:';
  return `
    <div class="hypothesis-section">
      <h6>${icon} ${title}</h6>
      ${hypotheses.map((h) => {
        const adopted = h.adopted === true;
        const statusClass = adopted ? 'hypothesis-status--adopted' : 'hypothesis-status--rejected';
        const statusText = adopted ? adoptedText : rejectedText;
        return `
          <div class="hypothesis-card">
            <h6>${h.name} <span class="hypothesis-status ${statusClass}">${statusText}</span></h6>
            <p>${h.desc}</p>
            <p><strong>${resultLabel}</strong> ${h.result}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

const renderMetrics = (metrics) => {
  if (!metrics || !Array.isArray(metrics) || !metrics.length) return '';
  const cfg = modalConfig.sections?.metrics || {};
  const icon = cfg.icon || '📊';
  const title = cfg.title || 'Impact Metrics';
  return `
    <div class="metrics-section">
      <h6>${icon} ${title}</h6>
      ${metrics.map((m) => {
        let trendHtml = '';
        const before = Number(m.before);
        const after = Number(m.after);
        if (!isNaN(before) && !isNaN(after)) {
          if (after > before) {
            trendHtml = `<span class="metric-trend--up">↑</span>`;
          } else if (after < before) {
            trendHtml = m.lowerIsBetter
              ? `<span class="metric-trend--down-good">↓</span>`
              : `<span class="metric-trend--down-bad">↓</span>`;
          }
        }
        const unit = m.unit || '';
        return `
          <div class="metric-item">
            <span class="metric-label">${m.label}</span>
            <span>${m.before} → ${m.after}${unit ? ' ' + unit : ''}</span>
            ${trendHtml}
          </div>
        `;
      }).join('')}
    </div>
  `;
};

// --- Project Detail Modal ---

function showProjectModal(project) {
  document.getElementById('projectModalLabel').textContent = project.title;

  // Update URL hash for deep linking
  const projectSlug = slugify(project.title);
  history.replaceState(null, '', '#project=' + projectSlug);

  let body = `<p class="case-lead">${project.desc || ''}</p>`;
  if (project.caseStudy) {
    const study = project.caseStudy;
    body += `<section class="case-study" aria-label="Project case study">
      <p class="project-role">${project.role || 'Game Developer'}</p>
      <p class="case-scope">${project.scope || ''}</p>
      <h3>The challenge</h3><p>${study.challenge}</p>
      <h3>What I built</h3><ul>${study.contributions.map(item => `<li>${item}</li>`).join('')}</ul>
      ${study.outcome ? `<div class="case-outcome"><h3>The outcome</h3><p>${study.outcome}</p><small>${study.evidence || ''}</small></div>` : ''}
      ${study.takeaway ? `<p class="case-takeaway"><strong>What this shows</strong> ${study.takeaway}</p>` : ''}
    </section>`;
  }

  // Video embed or local
  if (project.video) {
    const isLocal = !project.video.includes('youtube.com');
    if (isLocal) {
      body += `
        <div class="mb-3">
          <video src="${project.video}" controls class="w-100" style="max-height: 400px;"></video>
        </div>
      `;
    } else {
      body += `
        <div class="ratio ratio-16x9 mb-3">
          <iframe src="${project.video}" allowfullscreen></iframe>
        </div>
      `;
    }
  }

  // Playable CTA — prominent, right after video
  if (project.playable && project.playableFiles && project.playableFiles.length) {
    const cta = modalConfig.playableCta || {};
    const ctaIcon = cta.icon || '🎮';
    const ctaTitle = cta.title || 'Play in Browser';
    const btnText = cta.btnText || 'Play Now';
    const btnIcon = cta.btnIcon || 'bi-play-fill';
    body += `
      <div class="playable-cta">
        <div class="playable-cta__text">
          <span class="playable-cta__icon">${ctaIcon}</span>
          <div>
            <strong class="playable-cta__title">${ctaTitle}</strong>
          </div>
        </div>
        <button class="btn playable-cta__btn" onclick="closeModalAndPlay(this)" data-files='${JSON.stringify(project.playableFiles)}' data-title="${project.title}">
          <i class="bi ${btnIcon}"></i> ${btnText}
        </button>
      </div>
    `;
  }

  // Meta row (duration + role)
  const durationHtml = renderDurationBadge(project.duration);
  const roleHtml = renderRoleBadge(project.role);
  if (durationHtml || roleHtml) {
    body += `<div class="modal-meta-row">${durationHtml}${roleHtml}</div>`;
  }

  // Description
  if (!project.caseStudy && project.detail) {
    body += `<p>${project.detail}</p>`;
  } else if (!project.caseStudy) {
    body += `<p>${project.desc}</p>`;
  }

  // Impacts
  if (!project.caseStudy) body += renderImpacts(project.impacts);

  // Hypotheses
  body += renderHypotheses(project.hypotheses);

  // Metrics
  body += renderMetrics(project.metrics);

  // Store links
  const storeLinks = [];
  const storeCfg = modalConfig.storeButtons || {};
  const gpCfg = storeCfg.googlePlay || {};
  const asCfg = storeCfg.appStore || {};
  if (project.playStore) {
    storeLinks.push(`<a href="${project.playStore}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-gplay">
      <i class="bi ${gpCfg.icon || 'bi-google-play'}"></i> ${project.storeLabel || gpCfg.text || 'Google Play'}
    </a>`);
  }
  if (project.appStore) {
    storeLinks.push(`<a href="${project.appStore}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-light">
      <i class="bi ${asCfg.icon || 'bi-apple'}"></i> ${asCfg.text || 'App Store'}
    </a>`);
  }
  if (storeLinks.length) {
    body += `<div class="d-flex gap-2 flex-wrap mt-3">${storeLinks.join('')}</div>`;
  }

  // Tech stack
  if (project.tech && project.tech.length) {
    body += `<div class="tech-tags mt-3">${project.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>`;
  }

  document.getElementById('projectModalBody').innerHTML = body;

  const modal = new bootstrap.Modal(document.getElementById('projectModal'));
  modal.show();

  // Stop video/iframe when modal closes & clear hash
  document.getElementById('projectModal').addEventListener('hidden.bs.modal', () => {
    const iframe = document.querySelector('#projectModalBody iframe');
    if (iframe) iframe.src = '';
    const video = document.querySelector('#projectModalBody video');
    if (video) { video.pause(); video.currentTime = 0; }
    // Clear hash without scrolling
    history.replaceState(null, '', location.pathname + location.search);
  }, { once: true });
}

// --- Timeline ---

function renderTimeline(timeline) {
  const container = document.getElementById('timelineContent');
  if (!container || !timeline || !timeline.length) return;

  container.innerHTML = timeline.map((t, i) => `
    <div class="timeline-item ${i % 2 === 0 ? 'left' : 'right'}">
      <div class="timeline-dot"></div>
      <div class="timeline-card">
        <span class="timeline-period">${t.period}</span>
        <div class="timeline-brand">
          ${t.logo ? `
            <div class="timeline-logo-frame" data-company="${t.company}" aria-hidden="true">
              <img src="${t.logo}" alt="" loading="lazy" decoding="async">
            </div>
          ` : ''}
          <div class="timeline-brand-copy">
            <span class="timeline-company">${t.company}</span>
            <h3 class="timeline-role">${t.role}</h3>
          </div>
        </div>
        <p class="timeline-desc">${t.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderFooter({ copyright }, socials, cvLink = 'assets/media/CV.pdf') {
  const validSocials = socials.filter(s => s.link && !['mailto:', 'https://linkedin.com/', '#'].includes(s.link));
  document.getElementById('footerContent').innerHTML = `
    <div class="contact-invite"><div><h2>Let’s build the next playable.</h2><p>Looking for a Unity developer who connects gameplay, feel, and iteration?</p></div><a class="btn btn-play-now" href="${cvLink}" target="_blank" rel="noopener">View CV &amp; contact details</a></div>
    <div class="footer-links mb-3">
      ${validSocials.map(s => `<a href="${s.link}" target="_blank" rel="noopener noreferrer" class="me-3"><i class="bi ${s.icon}" aria-hidden="true"></i> ${s.icon.includes('github') ? 'GitHub' : s.icon.includes('linkedin') ? 'LinkedIn' : 'Email'}</a>`).join('')}
      <a href="#hero">Back to top ↑</a>
    </div>
    <p class="mb-0">&copy; ${copyright}</p>
  `;
}

// --- Behaviors ---

function initNavScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 100;
    sections.forEach((section) => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const toggler = document.querySelector('.navbar-collapse');
      if (toggler.classList.contains('show')) {
        new bootstrap.Collapse(toggler).hide();
      }
    });
  });
}

// --- Particle System ---

// Particle color palettes per theme
const PARTICLE_COLORS = {
  dark: ['#ffcc00', '#00e5ff', '#ffb8ff', '#ff4444'],
  light: ['#cc9900', '#0077aa', '#aa44aa', '#cc2222']
};

// Shared reference so updateParticleColors() can reach particles
let _particles = [];

function getParticleColors() {
  const isDark = !document.documentElement.classList.contains('light-theme');
  return isDark ? PARTICLE_COLORS.dark : PARTICLE_COLORS.light;
}

function updateParticleColors() {
  const colors = getParticleColors();
  _particles.forEach((p) => {
    p.color = colors[Math.floor(Math.random() * colors.length)];
  });
}

function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  // Skip the animated background entirely when the user prefers reduced motion.
  if (prefersReducedMotion) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  const PARTICLE_COUNT = 50;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Pixel art shapes: mini sprites as pixel grids (1 = filled, 0 = empty)
  const PIXEL_SPRITES = [
    // Star
    [[0,1,0],[1,1,1],[0,1,0]],
    // Diamond
    [[0,1,0],[1,0,1],[0,1,0]],
    // Cross
    [[1,0,1],[0,1,0],[1,0,1]],
    // Block
    [[1,1],[1,1]],
    // L-shape
    [[1,0],[1,0],[1,1]],
    // Dot
    [[1]],
    // T-shape
    [[1,1,1],[0,1,0]],
  ];

  function createParticle() {
    const colors = getParticleColors();
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      pixelSize: Math.random() < 0.5 ? 2 : 3,
      sprite: PIXEL_SPRITES[Math.floor(Math.random() * PIXEL_SPRITES.length)],
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.3 + 0.08,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
  }

  function init() {
    resize();
    _particles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      _particles.push(createParticle());
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    _particles.forEach((p) => {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity;
      // Draw pixel sprite
      const s = p.pixelSize;
      const baseX = Math.round(p.x);
      const baseY = Math.round(p.y);
      p.sprite.forEach((row, ry) => {
        row.forEach((cell, rx) => {
          if (cell) ctx.fillRect(baseX + rx * s, baseY + ry * s, s, s);
        });
      });
    });

    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  init();
  animate();
}


// --- Theme Toggle ---

function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  function getCurrentTheme() {
    return document.documentElement.classList.contains('light-theme') ? 'light' : 'dark';
  }

  function setTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }

    try {
      localStorage.setItem('portfolio-theme', theme);
    } catch (e) {}

    updateToggleButton();
    updateParticleColors();
  }

  function updateToggleButton() {
    const theme = getCurrentTheme();
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-fill';
    }
    toggleBtn.setAttribute('aria-label',
      theme === 'dark' ? 'Chuyển sang theme sáng' : 'Chuyển sang theme tối'
    );
  }

  toggleBtn.addEventListener('click', () => {
    const newTheme = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  // Sync button state on init
  updateToggleButton();
}

// --- Playable Overlay ---

let currentPlayableFiles = [];
let currentPlayableIndex = 0;

function closeModalAndPlay(btn) {
  const files = JSON.parse(btn.dataset.files);
  const title = btn.dataset.title;
  const modal = bootstrap.Modal.getInstance(document.getElementById('projectModal'));
  if (files.length && files.every(file => /^https?:\/\//i.test(file))) {
    window.open(files[0], '_blank', 'noopener,noreferrer');
    if (modal) modal.hide();
    return;
  }
  if (modal) modal.hide();
  setTimeout(() => openPlayable({ playableFiles: files, title }), 300);
}

function openPlayable(project) {
  const files = project.playableFiles;
  if (!files || !files.length) return;

  // If all files are external, open random one in new tab
  const localFiles = files.filter(f => !f.startsWith('http://') && !f.startsWith('https://'));
  if (localFiles.length === 0) {
    const randomFile = files[Math.floor(Math.random() * files.length)];
    window.open(randomFile, '_blank', 'noopener,noreferrer');
    return;
  }

  // Pick random local file to start
  currentPlayableFiles = files;
  currentPlayableIndex = Math.floor(Math.random() * files.length);

  const overlay = document.getElementById('playableOverlay');
  const frame = document.getElementById('playableFrame');
  const title = document.getElementById('playableTitle');
  const container = document.getElementById('playableContainer');

  title.textContent = project.title;
  loadPlayableAtIndex(currentPlayableIndex);
  container.dataset.ratio = '9:16';
  document.getElementById('btnRatio916').classList.add('active');
  document.getElementById('btnRatio169').classList.remove('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  renderPlayableBar();
}

function loadPlayableAtIndex(index) {
  const file = currentPlayableFiles[index];
  if (!file) return;
  if (file.startsWith('http://') || file.startsWith('https://')) {
    window.open(file, '_blank', 'noopener,noreferrer');
    return;
  }
  const frame = document.getElementById('playableFrame');
  frame.src = file;
  currentPlayableIndex = index;
  renderPlayableBar();
}

function renderPlayableBar() {
  const bar = document.getElementById('playableNavBar');
  if (!bar) return;

  const total = currentPlayableFiles.length;
  if (total <= 1) {
    bar.style.display = 'none';
    return;
  }

  bar.style.display = 'flex';
  const idx = currentPlayableIndex;

  let html = `<button class="playable-nav-btn" data-dir="prev" ${idx === 0 ? 'disabled' : ''}><i class="bi bi-chevron-left"></i></button>`;
  for (let i = 0; i < total; i++) {
    html += `<button class="playable-nav-num ${i === idx ? 'active' : ''}" data-idx="${i}">${i + 1}</button>`;
  }
  html += `<button class="playable-nav-btn" data-dir="next" ${idx >= total - 1 ? 'disabled' : ''}><i class="bi bi-chevron-right"></i></button>`;

  bar.innerHTML = html;

  bar.querySelectorAll('.playable-nav-num').forEach(btn => {
    btn.addEventListener('click', () => loadPlayableAtIndex(parseInt(btn.dataset.idx)));
  });
  bar.querySelectorAll('.playable-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      const newIdx = currentPlayableIndex + (dir === 'next' ? 1 : -1);
      if (newIdx >= 0 && newIdx < currentPlayableFiles.length) loadPlayableAtIndex(newIdx);
    });
  });
}

function closePlayable() {
  const overlay = document.getElementById('playableOverlay');
  const frame = document.getElementById('playableFrame');
  const bar = document.getElementById('playableNavBar');

  overlay.classList.remove('active');
  frame.src = '';
  document.body.style.overflow = '';
  currentPlayableFiles = [];
  currentPlayableIndex = 0;
  if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
}

// Close button
document.addEventListener('click', (e) => {
  if (e.target.closest('#playableCloseBtn')) closePlayable();
});

// Ratio toggle buttons
document.getElementById('btnRatio916')?.addEventListener('click', () => {
  document.getElementById('playableContainer').dataset.ratio = '9:16';
  document.getElementById('btnRatio916').classList.add('active');
  document.getElementById('btnRatio169').classList.remove('active');
});
document.getElementById('btnRatio169')?.addEventListener('click', () => {
  document.getElementById('playableContainer').dataset.ratio = '16:9';
  document.getElementById('btnRatio169').classList.add('active');
  document.getElementById('btnRatio916').classList.remove('active');
});

// Reload button
document.getElementById('btnPlayableReload')?.addEventListener('click', () => {
  const frame = document.getElementById('playableFrame');
  const src = currentPlayableFiles[currentPlayableIndex];
  frame.src = '';
  requestAnimationFrame(() => { frame.src = src; });
});

// ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closePlayable();
});

// --- Typing Effect ---

function initTypingEffect(hero, typingConfig) {
  const target = document.getElementById('typingTarget');
  if (!target) return;

  const cfg = typingConfig || {};
  const phrases = cfg.phrases || [hero.tagline];
  const typeSpeed = cfg.typeSpeed || 60;
  const deleteSpeed = cfg.deleteSpeed || 30;
  const pauseDuration = cfg.pauseDuration || 2000;

  // Reduced motion: show the first phrase statically, skip the type/delete loop.
  if (prefersReducedMotion) {
    target.textContent = phrases[0] || '';
    const cursor = document.querySelector('.typing-cursor');
    if (cursor) cursor.style.display = 'none';
    return;
  }

  let phraseIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    const current = phrases[phraseIdx];

    if (!isDeleting) {
      target.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx >= current.length) {
        setTimeout(() => { isDeleting = true; tick(); }, pauseDuration);
        return;
      }
      setTimeout(tick, typeSpeed + Math.random() * 40);
    } else {
      target.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx <= 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }

  tick();
}

// --- Animated Counters ---

function initAnimatedCounters() {
  const counters = document.querySelectorAll('[data-count-target]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        if (el.dataset.counted) return;
        el.dataset.counted = '1';

        const target = parseInt(el.dataset.countTarget);
        const suffix = el.dataset.countSuffix || '';
        const duration = 1500;
        const start = performance.now();

        function update(now) {
          if (prefersReducedMotion || document.body.classList.contains('motion-paused')) {
            el.textContent = target + suffix;
            return;
          }
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const current = Math.round(eased * target);
          el.textContent = current + suffix;
          if (progress < 1) requestAnimationFrame(update);
        }

        requestAnimationFrame(update);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// --- Scroll Reveal (storytelling scroll) ---

function initScrollReveal() {
  // Fade-in observer: threshold nhỏ, rootMargin chặt
  const showObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -60px 0px'
  });

  // Fade-out observer: rootMargin rộng hơn nhiều → chỉ ẩn khi đã ra xa viewport
  const hideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) entry.target.classList.remove('is-visible');
    });
  }, {
    threshold: 0,
    rootMargin: '120px 0px 120px 0px'
  });

  const observeEl = (el) => { showObserver.observe(el); hideObserver.observe(el); };

  document.querySelectorAll('.scroll-reveal').forEach(observeEl);

  // Observe lại khi có dynamic content (projects render sau)
  const mutationObs = new MutationObserver(() => {
    document.querySelectorAll('.scroll-reveal:not(.observed)').forEach((el) => {
      el.classList.add('observed');
      observeEl(el);
    });
  });

  mutationObs.observe(document.body, { childList: true, subtree: true });
}

// Measure video itself: poster dimensions can differ from the actual preview.
function applyComicMediaRatios(container) {
  container.querySelectorAll('.project-thumb video, .latest-project-media video').forEach(video => {
    const apply = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      const media = video.closest('.project-thumb, .latest-project-media');
      media.style.setProperty('--bs-aspect-ratio', (video.videoHeight / video.videoWidth * 100) + '%');
      media.classList.toggle('is-portrait', video.videoHeight > video.videoWidth);
      const showFrame = () => media.classList.add('has-video-frame');
      if (video.readyState >= 2) showFrame();
      else video.addEventListener('loadeddata', showFrame, { once: true });
      media.closest('.highlight-item')?.classList.toggle('has-portrait', video.videoHeight > video.videoWidth);
      document.dispatchEvent(new Event('portfolio:media-ready'));
    };
    if (video.readyState >= 1) apply();
    else video.addEventListener('loadedmetadata', apply, { once: true });
  });
}
