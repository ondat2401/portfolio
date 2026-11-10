// Pair panels in reading order; mixed aspect ratios share a 1:2 comic spread.
export function layoutComicPanels(container, selector = ':scope > *') {
  const items = [...container.querySelectorAll(selector)].filter(item => !item.hidden);
  let index = 0;
  let spread = 0;
  while (index < items.length) {
    const first = items[index];
    const second = items[index + 1];
    const portrait = item => item.matches('.portrait') || !!item.querySelector('.is-portrait');
    let columns;
    if (!second) columns = [portrait(first) ? 6 : 12];
    else if (portrait(first) && portrait(second) && items[index + 2] && portrait(items[index + 2])) columns = [4, 4, 4];
    else if (portrait(first) !== portrait(second)) columns = portrait(first) ? [4, 8] : [8, 4];
    else if (portrait(first)) columns = [6, 6];
    else columns = spread % 2 ? [5, 7] : [7, 5];
    for (const [offset, width] of columns.entries()) {
      const item = items[index + offset];
      item.style.setProperty('--panel-columns', width);
      item.style.setProperty('--panel-tilt', (spread + offset) % 2 ? '.65deg' : '-.65deg');
    }
    index += columns.length;
    spread++;
  }
}
