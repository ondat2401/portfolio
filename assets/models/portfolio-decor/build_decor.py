"""Build the comic portfolio's lightweight decorative model family."""

from pathlib import Path
import json
import bpy
from mathutils import Vector


OUT = Path(__file__).resolve().parent
scene = bpy.context.scene
scene.name = "Portfolio Decor Studio"

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

assets = bpy.data.collections.new("Portfolio Decor / GLB assets")
scene.collection.children.link(assets)
studio = bpy.data.collections.new("Studio / not exported")
scene.collection.children.link(studio)


def material(name, color, metallic=0.0, roughness=0.62):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    return mat


ink = material("Ink / #191918", (0.055, 0.055, 0.05), roughness=0.78)
paper = material("Paper / #eee5d2", (0.84, 0.78, 0.65), roughness=0.83)
red = material("Brick / #b34a40", (0.45, 0.09, 0.07), roughness=0.7)
gold = material("Gold / #d9ad61", (0.62, 0.38, 0.12), metallic=0.42, roughness=0.38)
dark = material("Screen glass", (0.025, 0.045, 0.045), metallic=0.12, roughness=0.28)

current_collection = None
current_root = None


def link_asset(obj):
    for collection in list(obj.users_collection):
        collection.objects.unlink(obj)
    current_collection.objects.link(obj)
    obj.parent = current_root
    obj.matrix_parent_inverse = current_root.matrix_world.inverted()
    return obj


def box(name, location, dimensions, mat, bevel=0.025):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        edge = obj.modifiers.new("Hand-cut edge", "BEVEL")
        edge.width = bevel
        edge.segments = 1
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=edge.name)
    obj.data.materials.append(mat)
    return link_asset(obj)


def cylinder(name, location, radius, depth, mat, vertices=8, rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    if rotation:
        obj.rotation_euler = rotation
    obj.data.materials.append(mat)
    return link_asset(obj)


def ico(name, location, radius, mat, subdivisions=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=radius, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return link_asset(obj)


def new_model(name, collection_name, layout_x):
    global current_collection, current_root
    current_collection = bpy.data.collections.new(collection_name)
    assets.children.link(current_collection)
    current_root = bpy.data.objects.new(name, None)
    current_root.empty_display_type = "CUBE"
    current_collection.objects.link(current_root)
    return current_root, layout_x


models = []

# Cartridge: dark shell, brick-red body, paper label, a simple game icon and gold contacts.
root, x = new_model("Cartridge_Root", "Cartridge / projects", -1.55)
box("Cartridge / ink shell", (0, 0, 0), (0.78, 0.18, 0.98), ink, 0.06)
box("Cartridge / red face", (0, -0.095, 0.01), (0.72, 0.035, 0.9), red, 0.04)
box("Cartridge / label border", (0, -0.117, 0.07), (0.55, 0.025, 0.52), ink, 0.025)
box("Cartridge / paper label", (0, -0.134, 0.07), (0.49, 0.018, 0.46), paper, 0.018)
box("Cartridge / pixel field", (0, -0.147, 0.07), (0.28, 0.018, 0.24), red, 0.008)
box("Cartridge / pixel hero", (0, -0.16, 0.07), (0.09, 0.018, 0.12), gold, 0.006)
for px, pz, size in [(-0.085, 0.07, 0.045), (0.085, 0.07, 0.045), (0, 0.195, 0.04), (-0.045, -0.055, 0.035), (0.045, -0.055, 0.035)]:
    box("Cartridge / pixel", (px, -0.16, pz), (size, 0.018, size), ink, 0.003)
box("Cartridge / gold stripe", (0, -0.148, -0.25), (0.34, 0.018, 0.035), gold, 0.006)
for pin_x in (-0.27, -0.18, -0.09, 0, 0.09, 0.18, 0.27):
    box("Cartridge / contact", (pin_x, -0.105, -0.43), (0.045, 0.025, 0.08), gold, 0.006)
root.location.x = x
models.append(root)

# Logic core: a stepped circuit board with a central die and chunky comic traces.
root, x = new_model("Logic_Core_Root", "Logic core / skills", 0)
box("Core / ink board", (0, 0, 0), (0.92, 0.78, 0.16), ink, 0.055)
box("Core / red board", (0, 0, 0.085), (0.82, 0.68, 0.055), red, 0.035)
box("Core / die border", (0, 0, 0.15), (0.4, 0.4, 0.1), gold, 0.025)
box("Core / die glass", (0, 0, 0.205), (0.29, 0.29, 0.045), dark, 0.015)
box("Core / die glint", (0, -0.01, 0.233), (0.12, 0.055, 0.012), paper, 0.004)
for side in (-1, 1):
    box("Core / trace", (side * 0.28, 0, 0.13), (0.22, 0.035, 0.018), gold, 0.004)
    box("Core / trace", (side * 0.38, 0.14, 0.13), (0.035, 0.28, 0.018), paper, 0.004)
    for pin_y in (-0.24, -0.08, 0.08, 0.24):
        box("Core / connector", (side * 0.52, pin_y, 0), (0.16, 0.075, 0.055), gold, 0.008)
for pin_x in (-0.25, -0.08, 0.08, 0.25):
    for side in (-1, 1):
        box("Core / connector", (pin_x, side * 0.46, 0), (0.075, 0.16, 0.055), gold, 0.008)
for x_dot, y_dot in [(-0.26, -0.2), (0.26, -0.2), (-0.26, 0.2), (0.26, 0.2)]:
    cylinder("Core / via", (x_dot, y_dot, 0.125), 0.032, 0.022, ink, vertices=8)
root.location.x = x
models.append(root)

# Pixel mascot: squared robot silhouette, dark visor, gold eyes and a small antenna.
root, x = new_model("Pixel_Mascot_Root", "Pixel mascot / about", 1.55)
box("Mascot / chassis", (0, 0, -0.015), (0.62, 0.4, 0.68), ink, 0.075)
box("Mascot / red shell", (0, -0.205, -0.015), (0.54, 0.045, 0.6), red, 0.05)
box("Mascot / visor rim", (0, -0.235, 0.07), (0.43, 0.035, 0.31), paper, 0.035)
box("Mascot / visor", (0, -0.257, 0.07), (0.36, 0.025, 0.245), dark, 0.026)
for eye_x in (-0.105, 0.105):
    box("Mascot / eye", (eye_x, -0.276, 0.095), (0.055, 0.018, 0.075), gold, 0.004)
box("Mascot / mouth", (0, -0.276, -0.015), (0.09, 0.018, 0.025), paper, 0.004)
box("Mascot / chest badge", (0, -0.238, -0.2), (0.15, 0.025, 0.09), ink, 0.012)
box("Mascot / badge pixel", (0, -0.254, -0.2), (0.065, 0.014, 0.04), gold, 0.004)
for side in (-1, 1):
    box("Mascot / arm", (side * 0.39, -0.015, -0.01), (0.18, 0.31, 0.16), ink, 0.04)
    box("Mascot / hand", (side * 0.47, -0.025, -0.01), (0.105, 0.23, 0.14), gold, 0.027)
    box("Mascot / leg", (side * 0.16, 0, -0.41), (0.15, 0.25, 0.18), ink, 0.025)
    box("Mascot / boot", (side * 0.16, -0.045, -0.52), (0.21, 0.33, 0.11), paper, 0.02)
cylinder("Mascot / antenna base", (0, 0, 0.37), 0.075, 0.08, ink, vertices=8)
cylinder("Mascot / antenna", (0, 0, 0.47), 0.035, 0.18, gold, vertices=8)
ico("Mascot / beacon", (0, 0, 0.59), 0.07, red, subdivisions=1)
root.location.x = x
models.append(root)

# Studio camera and lights are kept in their own collection and excluded from the GLB selection.
bpy.ops.object.camera_add(location=(3.0, -6.5, 3.0))
camera = bpy.context.object
camera.name = "Studio / preview camera"
for collection in list(camera.users_collection):
    collection.objects.unlink(camera)
studio.objects.link(camera)
camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 4.8
scene.camera = camera

for name, location, energy, size in [
    ("Key", (-3, -4, 6), 500, 4),
    ("Fill", (4, -2, 4), 320, 3),
    ("Rim", (1, 3, 5), 650, 3),
]:
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = "Studio / " + name
    for collection in list(light.users_collection):
        collection.objects.unlink(light)
    studio.objects.link(light)
    light.data.energy = energy
    light.data.shape = "DISK"
    light.data.size = size
    light.rotation_euler = (Vector((0, 0, 0)) - light.location).to_track_quat("-Z", "Y").to_euler()

engine_ids = [item.identifier for item in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items]
scene.render.engine = next(engine for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES") if engine in engine_ids)
if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
    scene.eevee.taa_render_samples = 32
scene.render.resolution_x = 512
scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.compression = 15
scene.render.film_transparent = True
scene.view_settings.view_transform = "Standard"
scene.render.filepath = str(OUT / "preview.png")
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1

# Render one clean transparent fallback per asset.
model_collections = [bpy.data.collections[root.users_collection[0].name] for root in models]
for active_root, active_collection, filename in zip(models, model_collections, ("cartridge.png", "logic-core.png", "pixel-mascot.png")):
    for collection in model_collections:
        collection.hide_render = collection != active_collection
    camera.location = active_root.location + Vector((2.3, -4.7, 1.8))
    camera.rotation_euler = (active_root.location - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera.data.ortho_scale = 1.55
    scene.render.filepath = str(OUT / filename)
    bpy.ops.render.render(write_still=True)

for collection in model_collections:
    collection.hide_render = False

# Export just the three named roots and their children; the studio is not part of the GLB.
bpy.ops.object.select_all(action="DESELECT")
for root in models:
    root.select_set(True)
    for child in root.children_recursive:
        child.select_set(True)
bpy.context.view_layer.objects.active = models[0]
bpy.ops.export_scene.gltf(
    filepath=str(OUT / "portfolio-decor.glb"),
    use_selection=True,
    use_active_scene=True,
    export_format="GLB",
    export_yup=True,
    export_animations=False,
)

for mat in list(bpy.data.materials):
    if mat.users == 0:
        bpy.data.materials.remove(mat)

triangles = sum(len(poly.vertices) - 2 for root in models for obj in root.children_recursive if obj.type == "MESH" for poly in obj.data.polygons)
manifest = {
    "format": "glTF 2.0 binary",
    "source": "Original procedural Blender models authored for this portfolio",
    "palette": {"paper": "#eee5d2", "ink": "#191918", "red": "#b34a40", "gold": "#d9ad61"},
    "models": [
        {"root": root.name, "section": section, "interaction": interaction}
        for root, section, interaction in zip(
            models,
            ("projects", "skills", "about"),
            ("navigate to projects", "navigate to skills", "navigate to about"),
        )
    ],
    "triangles": triangles,
    "glb_bytes": (OUT / "portfolio-decor.glb").stat().st_size,
}
(OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

bpy.ops.wm.save_as_mainfile(filepath=str(OUT / "portfolio-decor.blend"))
print(json.dumps(manifest))
