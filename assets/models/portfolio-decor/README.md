# Portfolio decorative models

Original Blender assets for the comic arcade portfolio. The family contains a game cartridge for Projects, a logic core for Skills and a pixel mascot for About. Their 3D pivots are centered; runtime section positions come from the DOM. The front faces follow the arcade's Blender convention (front `-Y`, up `+Z`); the exported glTF is Y-up.

## Files

- `portfolio-decor.blend`: editable source scene with the three asset collections and a separate preview camera/light collection.
- `portfolio-decor.glb`: one runtime file with the stable roots `Cartridge_Root`, `Logic_Core_Root`, and `Pixel_Mascot_Root`; no camera, lights, floor or baked animation.
- `cartridge.png`, `logic-core.png`, `pixel-mascot.png`: transparent WebGL fallback images.
- `manifest.json`: model mapping, palette and exported budget.
- `build_decor.py`: deterministic Blender scene, render and GLB export script.

The meshes use simple beveled geometry and five shared flat PBR materials. There are no external textures, downloaded models or paid generators. Recreate the assets from the project root with `blender --background --factory-startup --python assets/models/portfolio-decor/build_decor.py`.
