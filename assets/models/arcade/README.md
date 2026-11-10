# Comic arcade — ONE MORE TRY

Original cabinet and screen artwork authored for this portfolio with Blender MCP (Blender 4.5) and Pillow. No downloaded models, textures or paid generators. Palette follows `assets/css/comic.css`: paper `#eee5d2`, brick `#b34a40`, ink `#191918`, with ochre accents. The marquee uses Bangers by Vernon Adams from Google Fonts, under the included `Bangers-OFL.txt`. Body labels have been removed; the marquee is flat, lightly tilted, faded ink `#897c68`.

## Deliverables

- `comic-arcade.blend`: editable geometry, materials, packed screen image, preview studio; original scene retained separately.
- `comic-arcade.glb`: cabinet only, embedded artwork, standard glTF PBR materials; no cameras, lights, floor, external textures or animation clips.
- `arcade-preview.png`: 1000×1000 studio render.
- `screen.png`: original 768×640 static platformer illustration with CRT scanlines.
- `build_arcade.py`: Blender authoring script, creates a new scene and refuses to overwrite it. Adjust `OUT` when moving the project.
- `create_artwork.py`: reproducible screen illustration (Python, Pillow, local Windows Impact font).
- `validation.json`: GLB export/import check results.

## Runtime contract

Root: `Arcade_Root`; bottom origin; 1 Blender unit = 1 metre. Dimensions approximately 1.424 × 1.091 × 2.390 m in Blender. Blender front is −Y, up +Z; exported glTF front is +Z, up +Y. Recommended hero view: 3/4 front-right, orthographic or low perspective, displayed at roughly 400–450 px high.

- `Joystick_Pivot`: runtime detaches the socket and collar, so the base stays flat. The shaft tilts only during the cabinet shake, independently of gameplay button presses.
- `Button_A`, `Button_B`: translate locally down to press; paper caps are children, sockets stay fixed. Runtime maps the red button to jump and the gold button to held duck. Local Z in Blender becomes local Y in glTF.
- `Screen_Surface`: standalone UV-mapped plane; replace material/map with a CanvasTexture for a live game. Screen content is currently static.
- `Cabinet_01/02/03/05`: static geometry merged by material.

Budget: 16 mesh objects, 14,484 triangles, 7 materials, one embedded texture, approximately 1.07 MB GLB. No collision or LOD required for the current hero prop. Decal geometry is intentionally planar and is not a collision surface.

Verified: studio render inspected; GLB reimported into a temporary Blender scene; mesh count, dimensions, materials, button hierarchy and absence of studio objects asserted. Temporary validation objects removed. Website integration, mobile GPU performance and Three.js lighting remain unverified.

## Portfolio integration

The main portfolio mounts `assets/js/features/hero-arcade.js` through `comic.js`. It loads the GLB with Vite's asset URL handling and replaces `Screen_Surface` with a live CanvasTexture. First Play runs a 1.4-second intro: a coin enters the slot for .44s and flashes the slot light, the cabinet gives a .24s two-beat kick, then a CRT aperture reveals gameplay as the camera zooms for .72s. Comic speed lines briefly frame that zoom. Gameplay starts after the camera arrives. Retry in the same session is immediate, without another coin or zoom. Stop cancels the intro/effects, resets the run and returns to the cabinet view in .5s. The close-up leaves the marquee and buttons visible.

`arcade-runner.js` owns the 60 Hz physics with interpolated drawing, continuous run poses, jump stretch and landing squash. Space/Up jumps; holding Down crouches with a shorter collision box, or fast-falls when airborne. Ground blocks alternate with flying drones that can be ducked. On touch devices, tap to jump, or swipe down and hold to duck. Blur/key release clears the held crouch. Play retries after a collision, and resumes if leaving the tab or viewport paused a run. Stop clears all state.

The existing Motion toggle and OS reduced-motion preference skip camera travel and mechanical button/joystick animation. Gameplay begins only after Play. If WebGL or model loading fails, the same game remains playable as a 2D canvas. Tests cover jumps, interpolation, collisions, ducking, fast-fall, obstacle selection and retry.

Game feedback: jump/landing dust, gold score sparks and a floating +100, a red impact edge, 65ms hit-stop and a small decaying camera shake on collision. `arcade-feedback.js` reuses a fixed 32-particle pool; feedback timing is independent of physics and drains after game over. Motion off/reduced motion skips the coin intro, slot flash, cabinet kick, CRT reveal, comic burst, shake and transient VFX. Hidden/offscreen/blur pause the sequence and game until Play; Stop always clears them. Intro timing and feedback bounds/decay have Node tests in `tests/arcade-polish.test.js`.

The live screen uses a 768×352 logical canvas to match the wide physical display instead of squeezing a nearly square image. Raster and renderer resolution follow device pixel ratio, capped at 2; dynamic mipmaps are disabled, with linear minification, nearest magnification and anisotropy up to 8. `assets/comic/arcade-room.svg` is an original static vector wall backdrop, without animated borders or extra runtime dependencies. The floor and soft contact shadow are planes in the Three.js scene, positioned from the model's world bounds so they stay under its feet during camera movement; the backdrop contains no fake floor or detached shadow.

Behavior reference only: [Chromium Dino Trex](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/components/neterror/resources/dino_game/trex.ts). No Chromium source or art is bundled.

Website integration was visually checked in desktop Chrome; mobile hardware and browser console inspection remain unverified. The prototype page retains the previous cube design for reference.
