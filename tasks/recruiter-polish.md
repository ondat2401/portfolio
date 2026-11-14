# Portfolio polish for hiring

## Direction

Keep the existing charcoal, ivory, red, Bangers/Barlow comic identity and playable arcade. Make the first reading path explain the developer's specialty, personal ownership, implementation decisions, and supported outcomes. Use the existing project data, hash routing, modal, filters, pagination, and media assets; add no dependency.

## Changes

- Hero: clear Unity/mobile positioning, direct case-study CTA, and evidence links driven by highlight data.
- Highlights: full-width case studies with gameplay footage alongside the challenge, contribution, and outcome.
- All 14 projects: concise summaries, explicit roles, technical focus, and structured challenge/contribution notes. Per-project configs match the main collection.
- Case-study dialogs: lead with personal ownership and implementation; retain video, playable, hypotheses, and store access. Outcome notes distinguish project-reported results from unavailable campaign data.
- Library: readable summaries, role labels, contribution actions, and quieter frame animation.
- Contact: CV/contact-details CTA and named social links; unfinished email/LinkedIn placeholders are omitted. The Android mirror listing is labeled as a listing rather than Google Play.
- Motion: respect paused/reduced motion for hover previews, avatar playback, pagination, and counters. Preview video requests use metadata preload.
- Semantics: main landmark, English document language, consistent project/timeline headings, and descriptive case-study actions.

## Validation

- `node --test tests/*.test.js`: 22 tests passed, including project assets/config consistency, renderer output, case-study routing, CV/contact CTA, and original MP4 avatar/reduced-motion configuration.
- `node --check assets/js/main.js` and `node --check assets/js/comic.js`: passed.
- New stylesheet parsed with Lightning CSS: zero warnings.
- Local HTTP requests for the page, changed JS/CSS, and project data returned 200.
- `npm run build`: passed with the existing classic-script and chunk-size warnings.
- Chrome headless avatar QA: original `avt.mp4` decoded at 1080 × 1224, played muted/inline, and completed a real 5.1-second loop. Motion pause/resume and reduced-motion pause passed; mobile avatar was visually checked at a 390px viewport. No page JavaScript errors during the check. This check did not cover every page interaction or both themes.

## Content limits

The 70% CPI reduction and under-5-MB size are retained from existing project notes. No campaign spend, baseline CPI, test duration, device measurements, or new metrics have been invented. Existing career dates and unpublished social/contact fields remain unchanged. The footer uses the existing CV for contact details.

## Skills and comic avatar follow-up

- Skills now use three equal columns with consistent headings, 18px skill names and 16px descriptions. The art is compact above the copy; textured frames and the oversized Build panel are removed. Tablet uses a full-width panel with two skills side by side; phones use a single reading column.
- User requested the existing animated wizard avatar in comic style. The new `assets/media/avatar-comic-sheet.png` was generated with built-in imagegen using a thumbnail extracted from `assets/media/avt.mp4` as the identity/costume/setting reference. Original video is retained.
- Prompt: transform the pixel-art avatar into smooth hand-inked comic illustration; preserve the black hair, rectangular glasses, blue/gold wizard cloak, cyan-flame staff and candlelit library. Produce a registered 3-column by 2-row sheet of six square frames with a subtle blink and changing flame, no gutters, text, camera movement or redesign.
- The page plays the six frames with a five-second CSS loop. This is an animated sprite sheet, not a regenerated MP4. Motion off and OS reduced motion show the first frame. It adds no JS animation loop or dependency.
- New avatar renderer and PNG grid geometry are covered by the content tests. Browser rendering remains unverified because of the previously recorded browser-tool restriction.
