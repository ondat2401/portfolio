# Portfolio decorative 3D models

## Goal

Add three comic arcade props around the public portfolio. They decorate and link to existing sections; they do not add game rules or block the page.

## Decisions

- Reuse Three.js, GLTFLoader and Vite already installed in the project.
- Keep the existing arcade renderer isolated. Use one additional transparent renderer for the decorative props, not one renderer per model.
- Position props from DOM anchors so they track responsive sections. Keep each prop small in the section's lower content gutter; do not draw a wire across the page.
- Keep the links above the canvas for click, keyboard and visible focus; the canvas never captures input.
- Keep a `.blend` source, one GLB family, transparent PNG fallbacks and a manifest in `assets/models/portfolio-decor/`.
- Pause rendering when the tab is hidden or no prop is near the viewport; respect reduced motion and the existing Motion toggle.

## Model family

1. `Cartridge_Root` beside Projects; opens the project section.
2. `Logic_Core_Root` beside Skills; opens the skill section.
3. `Pixel_Mascot_Root` beside About; opens the About section.

All share the arcade paper, ink, brick red and gold palette; no baked labels or animation clips. The roots have centered pivots and stable names. The GLB excludes camera, lights and floor.

## Implementation slices

1. Author and export the low-poly model family and PNG fallbacks.
2. Add one restrained runtime feature that maps each model to its section's lower gutter.
3. Add restrained hover/focus motion, mobile sizing, reduced-motion behavior and WebGL fallback.
4. Update asset documentation and commit the portfolio changes to `origin/main` after review.

## Manual review for the user

- Scroll from About through Skills and Projects; confirm each small model stays in the lower gutter and outside the text/cards.
- Hover and keyboard-focus each model; click/tap it and confirm the matching section navigation.
- Check a narrow mobile viewport, Motion: off, OS reduced motion and a browser with WebGL unavailable.

## Risks

- The decorative feature adds a second WebGL context alongside the arcade; use capped pixel ratio, lazy GLB load and static image fallback.
- The existing worktree contains uncommitted portfolio work. Keep it intact and include only repository portfolio changes in the requested release.
- Keep the models subordinate to the work: no cable or motion that competes with the portfolio content.
- Browser interaction and build verification remain outstanding; the running Vite server stopped responding during the route audit.
