# Reusable comic assets

All SVG files are editable artwork, separate from the page and from project footage.
Palette: ivory #eee5d2, ink #141413, muted red #b34a40.

- `panel-frame.svg`: resting double ink frame.
- `panel-frames.svg`: three separately drawn outlines, stacked vertically; CSS switches frames with steps(1).
- `bubble.svg`: resting speech bubble; text stays in HTML.
- `bubble-frames.svg`: three speech bubble drawings, stacked vertically; only the artwork changes.
- `cube-ink.svg`: monochrome face texture, with hand ink edges, halftone dots and hatching. Three.js tints it with the cube palette.
- `ink-swipe.svg`: dry brush accent for labels and section headings.
- `impact-lines.svg`: short burst outside the project frame on hover.
- `doodle-spark.svg`: artwork behind Rubik lettering, triggered by explode/settle.
- `doodle-arrow.svg`: single ink reveal in the Rubik margin.

`assets/css/comic-effects.css` owns all SVG/UI motion, shared by the public page and prototype. SVG files have no embedded animation, so the public Motion toggle can stop every decorative layer. OS reduced motion also disables the animations. Video pixels, text and click targets stay independent of these layers.

Rubik state hooks: `.stage[data-cube-state="turning|settled|exploded|paused"]`.
The cube uses twelve held drawings per layer turn. Scramble/inverse turn logic stays in `rubik-turns.js`; the face texture and silhouette belong to `hero-rubik.js`.

Skills workbench assets:
- `skill-build.svg` + `skill-piece.svg`: puzzle construction drawing and independent movable piece.
- `skill-feel.svg`: rhythm waveform, revealed once in stepped frames.
- `skill-ship.svg` + `skill-chart.svg`: phone silhouette and separate chart stroke.

`comic-skills.css` arranges the three panels and animates only artwork on hover/focus-within. Text stays static; global Motion off and OS reduced motion stop the effects. Group copy and project references live in `data/profile.json` under `skillGroups`; individual skills retain their original title/description and add a `group` field.

The hero sculpture now uses 54 instanced bricks. Its reusable silhouette data and movement samples are in `assets/js/features/cube-forms.js`; the existing cube face texture also covers the gamepad and robot. Additional state hooks are `transforming` (burst/hold) and `assembling` (staggered landing). No external 3D model or new runtime dependency is required.
