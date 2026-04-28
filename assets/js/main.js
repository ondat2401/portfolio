/**
 * Portfolio - Config-driven rendering
 * Data nằm trong data/config.json
 */

const PROJECTS_PER_PAGE = 6;
const pageState = {}; // track current page per category
let allCategories = []; // store for modal lookup
let allHighlights = []; // store highlights for deep link lookup

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
  } catch (e) { /* fallback to defaults */ }

  // --- Apply loading screen icon & text from config ---
  const loadingIcon = document.getElementById('loadingIcon');
  const loadingTextEl = document.getElementById('loadingText');
  if (loadingIcon && uiConfig.loading?.icon) loadingIcon.src = uiConfig.loading.icon;
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

  const res = await fetch('data/config.json');
  setLoadProgress(30);
  const config = await res.json();
  setLoadProgress(50);

  renderHero(config.hero, config.about.cvLink);
  renderSectionTitles(config.sectionTitles);
  renderStats(config.stats);
  setLoadProgress(60);
  renderAbout(config.about);
  renderSkills(config.skills);
  setLoadProgress(70);
  renderHighlights(config.highlights);
  renderProjectCategories(config.projectCategories);
  setLoadProgress(80);
  renderTimeline(config.timeline);
  renderFooter(config.site, config.socials);
  setLoadProgress(90);

  document.title = config.site.title;

  // Set nav CV button
  const navCv = document.getElementById('navCvBtn');
  if (navCv && config.about.cvLink) navCv.href = config.about.cvLink;

  // Set meta tags from config
  const site = config.site;
  const setMeta = (id, content) => { const el = document.getElementById(id); if (el && content) el.content = content; };
  setMeta('metaDesc', site.description);
  setMeta('ogTitle', site.title);
  setMeta('ogDesc', site.description);
  setMeta('ogImage', site.ogImage);
  setMeta('ogUrl', site.url);
  setMeta('twTitle', site.title);
  setMeta('twDesc', site.description);
  setMeta('twImage', site.ogImage);
  document.querySelector('meta[name="author"]').content = config.hero.name;
  if (site.favicon) document.querySelector('link[rel="icon"]').href = site.favicon;

  // Set navbar brand name
  const brand = document.getElementById('navBrand');
  if (brand) brand.textContent = config.hero.name;

  // --- Apply custom cursor from config ---
  if (uiConfig.cursor?.default) {
    const size = uiConfig.cursor.size || 24;
    const cursorUrl = uiConfig.cursor.default;
    document.documentElement.style.cursor = `url('${cursorUrl}') ${Math.floor(size / 2)} ${Math.floor(size / 2)}, auto`;
    document.body.style.cursor = `url('${cursorUrl}') ${Math.floor(size / 2)} ${Math.floor(size / 2)}, auto`;
  }

  initNavScroll();
  initContactForm();
  initParticles();
  initThemeToggle();
  initScrollReveal();
  initAnimatedCounters();
  initSkillBarAnimations();

  setLoadProgress(100);

  // Hide loading screen after a short delay
  const startDelay = uiConfig.typing?.startDelay || 400;
  setTimeout(() => {
    if (loadingScreen) loadingScreen.classList.add('hidden');
    // Start typing effect after loading screen fades
    setTimeout(() => initTypingEffect(config.hero, uiConfig.typing), startDelay);
    // Open project modal from URL hash (deep link)
    openProjectFromHash();
  }, 600);

  // Handle browser back/forward with hash changes
  window.addEventListener('hashchange', openProjectFromHash);
});

// --- Renderers ---

function renderHero({ name, tagline, cta }, cvLink) {
  document.getElementById('heroContent').innerHTML = `
    <h1 class="display-3 fw-bold">Hi, I'm <span class="text-primary">${name}</span></h1>
    <p class="lead mt-3"><span id="typingTarget"></span><span class="typing-cursor"></span></p>
    <div class="d-flex gap-3 justify-content-center mt-4">
      <a href="#projects" class="btn btn-primary btn-lg">${cta}</a>
      ${cvLink ? `<a href="${cvLink}" target="_blank" class="btn btn-primary btn-lg">View CV</a>` : ''}
    </div>
    <div class="mt-5 rpg-stats-bar" id="statsBar"></div>
    <div class="scroll-hint mt-4">
      <span>Press ▼ to continue</span>
      <div class="scroll-arrow"><i class="bi bi-chevron-double-down"></i></div>
    </div>
  `;
}

function renderSectionTitles(titles) {
  if (!titles) return;
  const map = {
    highlights: 'titleHighlights',
    about: 'titleAbout',
    skills: 'titleSkills',
    projects: 'titleProjects',
    experience: 'titleExperience',
    contact: 'titleContact'
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
      avatarEl.innerHTML = `<video src="${avatar}" autoplay muted loop playsinline class="w-100 h-100 rounded-circle" style="${style}"></video>`;
    } else {
      avatarEl.innerHTML = `<img src="${avatar}" alt="Avatar" class="w-100 h-100 rounded-circle" style="${style}">`;
    }
  }
  document.getElementById('aboutText').innerHTML = `
    <p class="fs-5">${description}</p>
    ${quote ? `<div class="about-quote mt-4"><span>"${quote}"</span></div>` : ''}
  `;
}

const SKILLS_PER_PAGE = 9;
let skillsPage = 0;
let allSkills = [];

function renderSkills(skills) {
  allSkills = skills;
  skillsPage = 0;

  const container = document.getElementById('skillsSection');
  container.innerHTML = `
    <div class="project-grid-wrapper">
      <div class="row g-4 project-grid-inner" id="skillsGrid"></div>
    </div>
    <div class="d-flex justify-content-center align-items-center mt-4 gap-3" id="skillsPager"></div>
  `;

  renderSkillsPage(false);
}

function renderSkillsPage(animate = true, direction = 'next') {
  const totalPages = Math.ceil(allSkills.length / SKILLS_PER_PAGE);
  const start = skillsPage * SKILLS_PER_PAGE;
  const items = allSkills.slice(start, start + SKILLS_PER_PAGE);
  const grid = document.getElementById('skillsGrid');

  const html = items.map((s) => {
    return `
    <div class="col-md-4">
      <div class="skill-bar-card">
        <div class="skill-bar-header">
          <i class="bi ${s.icon}"></i>
          <h5>${s.title}</h5>
        </div>
        <div class="skill-bar-desc">${s.desc}</div>
        <div class="skill-bar-track">
          <div class="skill-bar-fill" style="--target-width: 100%"></div>
        </div>
      </div>
    </div>
  `}).join('');

  if (animate) {
    const outClass = direction === 'next' ? 'slide-out-left' : 'slide-out-right';
    const inClass = direction === 'next' ? 'slide-in-left' : 'slide-in-right';
    grid.classList.add(outClass);
    setTimeout(() => {
      grid.innerHTML = html;
      grid.classList.remove(outClass);
      grid.classList.add(inClass);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => grid.classList.remove(inClass));
      });
      // Re-trigger bar animations
      setTimeout(() => initSkillBarAnimations(), 100);
    }, 350);
  } else {
    grid.innerHTML = html;
    requestAnimationFrame(() => {
      grid.closest('.project-grid-wrapper').style.minHeight = grid.offsetHeight + 'px';
    });
  }

  const pager = document.getElementById('skillsPager');
  if (totalPages <= 1) {
    pager.innerHTML = '';
    return;
  }

  pager.innerHTML = `
    <button class="btn btn-outline-primary btn-sm" ${skillsPage === 0 ? 'disabled' : ''} data-dir="prev">
      <i class="bi bi-chevron-left"></i> Prev
    </button>
    <span class="text-muted">${skillsPage + 1} / ${totalPages}</span>
    <button class="btn btn-outline-primary btn-sm" ${skillsPage >= totalPages - 1 ? 'disabled' : ''} data-dir="next">
      Next <i class="bi bi-chevron-right"></i>
    </button>
  `;

  pager.querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.dir;
      skillsPage += dir === 'next' ? 1 : -1;
      renderSkillsPage(true, dir);
    });
  });
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
                <video src="${project.video}" muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>
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
          <h3 style="font-size: 0.9rem; color: var(--color-primary); text-shadow: var(--glow-primary);">${project.title}</h3>
          <p class="mt-3 latest-project-desc">${project.desc}</p>
          <div class="d-flex gap-3 flex-wrap mt-3">
            ${project.playable && project.playableFiles && project.playableFiles.length ? `<button class="btn btn-sm btn-outline-warning btn-play-now"><i class="bi bi-play-fill"></i> Play Now</button>` : ''}
            <button class="btn btn-sm btn-outline-primary btn-detail btn-latest-detail">Detail</button>
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
        if (video) { video.currentTime = 0; video.play(); }
        const iframe = preview.querySelector('iframe[data-src]');
        if (iframe) {
          const sep = iframe.dataset.src.includes('?') ? '&' : '?';
          iframe.src = iframe.dataset.src + sep + 'autoplay=1&mute=1';
        }
        requestAnimationFrame(() => preview.classList.add('active'));
      });

      media.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
        if (video) video.pause();
        const iframe = preview.querySelector('iframe');
        if (iframe) iframe.src = '';
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
      <button class="filter-btn active" data-filter="all">All</button>
      ${categories.map(cat => `<button class="filter-btn" data-filter="${cat.id}">${cat.label}</button>`).join('')}
    `;

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
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
            ? `<img src="${p.image}" alt="${p.title}" style="object-fit: cover;">`
            : `<div class="d-flex align-items-center justify-content-center w-100 h-100"><i class="bi bi-image text-white fs-1"></i></div>`}
          ${isLocalVideo ? `<div class="video-preview" style="position:absolute;inset:0;">
            <video src="${p.video}" muted loop playsinline style="width:100%;height:100%;object-fit:cover;"></video>
          </div>` : ''}
          ${isEmbed ? `<div class="video-preview" style="position:absolute;inset:0;">
            <iframe data-src="${p.video}" style="width:100%;height:100%;border:none;" allow="autoplay"></iframe>
          </div>` : ''}
        </div>
        ${p.playable && p.playableFiles && p.playableFiles.length > 1 ? `<div class="playable-count-badge"><i class="bi bi-stack"></i> ${p.playableFiles.length}</div>` : ''}
        <div class="card-body d-flex align-items-center justify-content-between py-2 px-3">
          <div>
            <h5 class="card-title mb-0">${p.title}</h5>
            ${p.tech && p.tech.length ? `<div class="tech-tags mt-1">${p.tech.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>` : ''}
          </div>
          <div class="d-flex gap-2">
            ${p.playable && p.playableFiles && p.playableFiles.length ? `<button class="btn btn-sm btn-play-now" data-cat="${cat.id}" data-idx="${idx}"><i class="bi bi-play-fill"></i> Play</button>` : ''}
            <button class="btn btn-sm btn-outline-primary btn-detail" data-cat="${cat.id}" data-idx="${idx}">
              Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  `}).join('');

  const updateGrid = () => {
    grid.innerHTML = cardsHTML;

    // Bind video hover preview
    grid.querySelectorAll('.project-card[data-video="1"]').forEach((card) => {
      const preview = card.querySelector('.video-preview');
      if (!preview) return;

      const video = preview.querySelector('video');
      const iframe = preview.querySelector('iframe');

      card.addEventListener('mouseenter', () => {
        preview.style.display = 'block';
        if (video) {
          video.currentTime = 0;
          video.play();
        }
        if (iframe) {
          const sep = iframe.dataset.src.includes('?') ? '&' : '?';
          iframe.src = iframe.dataset.src + sep + 'autoplay=1&mute=1';
        }
        requestAnimationFrame(() => preview.classList.add('active'));
      });

      card.addEventListener('mouseleave', () => {
        preview.classList.remove('active');
        if (video) video.pause();
        if (iframe) iframe.src = '';
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

  if (animate) {
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
  const formatDate = (str) => {
    if (str === 'Present') return 'Present';
    const [year, month] = str.split('-');
    return `${month}/${year}`;
  };
  return `<span class="duration-badge">⏱ ${formatDate(duration.from)} → ${formatDate(duration.to)}</span>`;
};

const renderRoleBadge = (role) => {
  if (!role || !role.trim()) return '';
  return `<span class="role-badge">🎮 ${role}</span>`;
};

const renderImpacts = (impacts) => {
  if (!impacts || !Array.isArray(impacts) || !impacts.length) return '';
  return `
    <div class="impact-section">
      <h6>💡 Key Contributions</h6>
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
  return `
    <div class="hypothesis-section">
      <h6>🧪 Hypotheses Tested</h6>
      ${hypotheses.map((h) => {
        const adopted = h.adopted === true;
        const statusClass = adopted ? 'hypothesis-status--adopted' : 'hypothesis-status--rejected';
        const statusText = adopted ? '✓ Adopted' : '✗ Rejected';
        return `
          <div class="hypothesis-card">
            <h6>${h.name} <span class="hypothesis-status ${statusClass}">${statusText}</span></h6>
            <p>${h.desc}</p>
            <p><strong>Result:</strong> ${h.result}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
};

const renderMetrics = (metrics) => {
  if (!metrics || !Array.isArray(metrics) || !metrics.length) return '';
  return `
    <div class="metrics-section">
      <h6>📊 Impact Metrics</h6>
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

  let body = '';

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
    body += `
      <div class="playable-cta">
        <div class="playable-cta__text">
          <span class="playable-cta__icon">🎮</span>
          <div>
            <strong class="playable-cta__title">Play in Browser</strong>
          </div>
        </div>
        <button class="btn playable-cta__btn" onclick="closeModalAndPlay(this)" data-files='${JSON.stringify(project.playableFiles)}' data-title="${project.title}">
          <i class="bi bi-play-fill"></i> Play Now
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
  if (project.detail) {
    body += `<p>${project.detail}</p>`;
  } else {
    body += `<p>${project.desc}</p>`;
  }

  // Impacts
  body += renderImpacts(project.impacts);

  // Hypotheses
  body += renderHypotheses(project.hypotheses);

  // Metrics
  body += renderMetrics(project.metrics);

  // Store links
  const storeLinks = [];
  if (project.playStore) {
    storeLinks.push(`<a href="${project.playStore}" target="_blank" class="btn btn-outline-gplay">
      <i class="bi bi-google-play"></i> Google Play
    </a>`);
  }
  if (project.appStore) {
    storeLinks.push(`<a href="${project.appStore}" target="_blank" class="btn btn-outline-light">
      <i class="bi bi-apple"></i> App Store
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
        <h5 class="timeline-role">${t.role}</h5>
        <span class="timeline-company">${t.company}</span>
        <p class="timeline-desc">${t.desc}</p>
      </div>
    </div>
  `).join('');
}

function renderFooter({ copyright }, socials) {  document.getElementById('footerContent').innerHTML = `
    <div class="mb-3">
      ${socials.map((s) => `<a href="${s.link}" class="text-white me-3 fs-4"><i class="bi ${s.icon}"></i></a>`).join('')}
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

function initContactForm() {
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Sending...';

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          btn.textContent = 'Sent!';
          form.reset();
          setTimeout(() => { btn.textContent = 'Send Message'; btn.disabled = false; }, 3000);
        } else {
          btn.textContent = 'Error, try again';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Error, try again';
        btn.disabled = false;
      }
    });
  }
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
    window.open(randomFile, '_blank');
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
    window.open(file, '_blank');
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

// --- Skill Bar Animations ---

function initSkillBarAnimations() {
  const bars = document.querySelectorAll('.skill-bar-fill:not(.animated)');
  if (!bars.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  bars.forEach(bar => observer.observe(bar));
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
