export function createProjectDetails(root) {
  const dialog = document.createElement('dialog');
  dialog.className = 'project-dialog';
  dialog.setAttribute('aria-labelledby', 'detail-title');
  document.body.append(dialog);
  let frame = null;
  let previousOverflow = '';
  const close = () => dialog.close();
  dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
  dialog.addEventListener('close', () => {
    if (frame) frame.src = 'about:blank';
    frame = null;
    dialog.replaceChildren();
    document.body.style.overflow = previousOverflow;
  });

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  return project => {
    const header = element('div', null, 'detail-header');
    const title = element('h2', project.title);
    title.id = 'detail-title';
    const dismiss = element('button', 'CLOSE ×');
    dismiss.addEventListener('click', close);
    header.append(title, dismiss);
    const content = element('div', null, 'detail-content');
    if (project.role) content.append(element('p', project.role, 'eyebrow'));
    // Existing project descriptions use br tags for paragraph breaks.
    content.append(element('p', (project.detail || project.desc || '')
      .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, ''), 'detail-description'));
    for (const impact of project.impacts || []) {
      const block = element('section', null, 'contribution');
      block.append(element('h3', impact.label), element('p', impact.desc));
      content.append(block);
    }
    const tags = element('p', (project.tech || []).join(' / '), 'eyebrow');
    content.append(tags);
    const actions = element('div', null, 'detail-actions');
    const media = element('div', null, 'demo-area');
    for (const [index, file] of (project.playableFiles || []).entries()) {
      const url = new URL(file, root);
      if (!['https:', 'http:'].includes(url.protocol)) continue;
      if (url.origin !== root.origin) {
        const link = element('a', 'OPEN EXTERNAL DEMO ↗', 'button');
        link.href = url.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        actions.append(link);
        continue;
      }
      if (!url.pathname.startsWith(new URL('projects/', root).pathname)) continue;
      const play = element('button', 'PLAY DEMO ' + (index + 1));
      play.addEventListener('click', () => {
        if (frame) frame.src = 'about:blank';
        frame = document.createElement('iframe');
        frame.title = project.title + ' playable demo';
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
        frame.src = url.href;
        media.replaceChildren(frame);
        media.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      });
      actions.append(play);
    }
    const ratio = element('button', 'SWITCH 9:16 / 16:9');
    ratio.addEventListener('click', () => media.classList.toggle('landscape'));
    const reload = element('button', 'RELOAD DEMO');
    reload.addEventListener('click', () => { if (frame) frame.src = frame.src; });
    if (project.playableFiles?.length) actions.append(ratio, reload);
    content.append(actions, media);
    dialog.replaceChildren(header, content);
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dismiss.focus();
  };
}
