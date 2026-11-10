"""Run inside Blender. Creates a separate scene and never removes existing work."""
import bpy
import math
from pathlib import Path
from mathutils import Vector

OUT = Path(r'D:/GameProject/Self/portfolio/assets/models/arcade')
assert not bpy.data.scenes.get('Comic Arcade'), 'Scene already exists; inspect before rebuilding'
scene = bpy.data.scenes.new('Comic Arcade')
bpy.context.window.scene = scene
asset = bpy.data.collections.new('ARCADE | export')
studio = bpy.data.collections.new('STUDIO | preview only')
scene.collection.children.link(asset)
scene.collection.children.link(studio)
root = bpy.data.objects.new('Arcade_Root', None)
asset.objects.link(root)
root['front'] = '-Y in Blender; +Z in glTF'
root['art_direction'] = 'Ink / aged paper / brick red; original comic artwork'

def move(obj, collection=asset):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    collection.objects.link(obj)
    if collection == asset:
        obj.parent = root
    return obj

def material(name, color, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    node = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    rgb = tuple(((int(color[i:i+2],16)/255+0.055)/1.055)**2.4 if int(color[i:i+2],16)/255 > .04045 else int(color[i:i+2],16)/255/12.92 for i in (0,2,4))
    node.inputs['Base Color'].default_value = (*rgb, 1)
    node.inputs['Roughness'].default_value = .8
    node.inputs['Emission Color'].default_value = (*rgb, 1)
    node.inputs['Emission Strength'].default_value = emission
    mat.diffuse_color = (*rgb,1)
    return mat

ink = material('01 | Ink #191918', '191918')
paper = material('02 | Paper #eee5d2', 'eee5d2')
red = material('03 | Brick #b34a40', 'b34a40')
gold = material('04 | Ochre', 'd9ad61')
dark = material('05 | Warm charcoal', '30332f')
faded = material('07 | Faded printed ink', '897c68')
screen_mat = material('06 | Original CRT artwork', 'ffffff', .45)
bsdf = next(n for n in screen_mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
tex = screen_mat.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = bpy.data.images.load(str(OUT/'screen.png'), check_existing=True)
tex.image.pack()
screen_mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
screen_mat.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Emission Color'])

def finish(obj, name, mat, bevel=0):
    obj.name = name
    move(obj)
    obj.data.materials.append(mat)
    if bevel:
        mod=obj.modifiers.new('Soft manufactured edges','BEVEL')
        mod.width=bevel
        mod.segments=2
        mod=obj.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
    return obj

def box(name, loc, size, mat, bevel=.01):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj=bpy.context.object
    obj.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(obj,name,mat,bevel)

def cylinder(name, loc, radius, depth, mat, rotation=(0,0,0), vertices=20):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc, rotation=rotation)
    return finish(bpy.context.object,name,mat,.006)

font=bpy.data.fonts.load('C:/Windows/Fonts/impact.ttf')
def text(name, words, loc, size, mat, rotation=(math.pi/2,0,0), max_width=None):
    curve=bpy.data.curves.new(name,'FONT')
    curve.body=words
    curve.font=font
    curve.align_x='CENTER'
    curve.align_y='CENTER'
    curve.size=size
    curve.extrude=.0006
    curve.resolution_u=3
    obj=bpy.data.objects.new(name,curve)
    asset.objects.link(obj)
    obj.parent=root
    obj.location=loc
    obj.rotation_euler=rotation
    curve.materials.append(mat)
    bpy.context.view_layer.update()
    if max_width and obj.dimensions.x>max_width:
        obj.scale.x*=max_width/obj.dimensions.x
    return obj

profile=[(-.40,.08),(.43,.08),(.43,2.38),(-.27,2.38),(-.38,2.15),(-.17,2.04),(-.37,1.43),(-.63,1.28),(-.63,1.10),(-.40,.99)]
def side(name, x, thickness, mat, scale=1):
    yz=[((y+.05)*scale-.05,(z-1.23)*scale+1.23) for y,z in profile]
    verts=[(xx,y,z) for xx in (x-thickness/2,x+thickness/2) for y,z in yz]
    n=len(yz)
    faces=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
    faces += [(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata(verts,[],faces)
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    asset.objects.link(obj)
    obj.parent=root
    mesh.materials.append(mat)
    # Recalculate normals so both side panels export correctly.
    bpy.context.view_layer.objects.active=obj
    obj.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    obj.select_set(False)
    return obj

for sign in (-1,1):
    side('Cabinet / ink silhouette',sign*.638,.10,ink)
    side('Cabinet / paper edge',sign*.691,.009,paper,.976)
    side('Cabinet / red enamel',sign*.698,.008,red,.954)

box('Cabinet / back',(0,.365,1.20),(1.20,.12,2.23),dark)
box('Cabinet / lower front',(0,-.365,.58),(1.20,.12,.96),ink)
box('Cabinet / kickplate',(0,-.437,.22),(1.09,.022,.20),dark)
box('Cabinet / front inset',(0,-.432,.70),(1.10,.025,.57),red)
box('Cabinet / top cap',(0,.05,2.34),(1.24,.70,.10),ink)
box('Marquee / black frame',(0,-.308,2.245),(1.24,.13,.255),ink,.018)
box('Marquee / paper',(0,-.381,2.245),(1.12,.016,.185),paper,.008)
marquee=text('Marquee / ONE MORE TRY','ONE MORE TRY',(0,-.395,2.248),.16,faded,rotation=(math.pi/2,-.025,0),max_width=.78)
marquee.data.font=bpy.data.fonts.load(str(OUT/'Bangers-Regular.ttf'))
marquee.data.space_character=1.06
marquee.data.extrude=0

tilt=.285
screen_frame=box('Screen / heavy bezel',(0,-.266,1.735),(1.20,.10,.715),ink,.045)
screen_frame.rotation_euler.x=-tilt
screen_rim=box('Screen / cream rim',(0,-.324,1.75),(1.075,.022,.60),paper,.028)
screen_rim.rotation_euler.x=-tilt
bpy.ops.mesh.primitive_plane_add(size=1,location=(0,-.341,1.755),rotation=(math.pi/2-tilt,0,0))
screen=finish(bpy.context.object,'Screen_Surface',screen_mat)
screen.scale=(1.015,.546,1)

box('Deck / black edge',(0,-.365,1.22),(1.25,.55,.135),ink,.025)
box('Deck / paper face',(0,-.37,1.295),(1.14,.46,.023),paper,.012)
box('Deck / red lip',(0,-.650,1.215),(1.14,.018,.075),red)
stick=bpy.data.objects.new('Joystick_Pivot',None)
asset.objects.link(stick)
stick.parent=root
stick.location=(-.31,-.50,1.32)
parts=[cylinder('Joystick / socket',(-.31,-.50,1.324),.105,.025,ink),cylinder('Joystick / collar',(-.31,-.50,1.344),.067,.022,red),cylinder('Joystick / stem',(-.31,-.50,1.43),.022,.17,ink)]
bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,radius=.075,location=(-.31,-.50,1.535))
parts.append(finish(bpy.context.object,'Joystick / red ball',red))
for p in parts:
    world=p.matrix_world.copy()
    p.parent=stick
    p.matrix_world=world
for name,x,y,mat in [('Button_A',.20,-.51,red),('Button_B',.40,-.47,gold)]:
    cylinder(name+' / socket',(x,y,1.325),.083,.025,ink)
    button=cylinder(name,(x,y,1.35),.064,.038,mat)
    top=cylinder(name+' / top',(x,y,1.372),.045,.004,paper)
    bpy.context.view_layer.update()
    world=top.matrix_world.copy()
    top.parent=button
    top.matrix_world=world
box('Coin / surround',(0,-.455,.77),(.28,.035,.29),ink,.018)
box('Coin / steel plate',(0,-.480,.79),(.21,.015,.20),paper,.012)
box('Coin / slot',(0,-.491,.81),(.105,.01,.019),ink,.003)
for x in (-.44,.44):
    for z in (.50,.91):
        cylinder('Front / rivet',(x,-.453,z),.012,.008,paper,(math.pi/2,0,0),12)
for x in (-.49,.49):
    for y in (-.25,.29):
        box('Foot / rubber',(x,y,.045),(.18,.20,.09),ink,.018)

# Bold side decal, kept as real flat geometry so glTF needs no custom shader.
def side_poly(name, points, x, mat):
    mesh=bpy.data.meshes.new(name)
    mesh.from_pydata([(x,y,z) for y,z in points],[],[tuple(range(len(points)))])
    mesh.update()
    obj=bpy.data.objects.new(name,mesh)
    asset.objects.link(obj)
    obj.parent=root
    mesh.materials.append(mat)
    return obj
bolt=[(.14,1.96),(-.28,1.49),(-.04,1.49),(-.25,.91),(.29,1.55),(.06,1.55)]
for sign in (-1,1):
    side_poly('Side / lightning',bolt,sign*.705,paper)
    for row in range(7):
        for col in range(4):
            y=.14+col*.06
            z=.44+row*.07
            cylinder('Side / halftone',(sign*.706,y,z),.009+(row*.001),.003,ink,(0,math.pi/2,0),8)
    for i in range(4):
        box('Side / vent',(sign*.708,.17,2.12-i*.045),(.008,.23,.012),ink,.003)
    # Small hatch marks beside the flash.
    for i in range(5):
        mark=box('Side / hatch',(sign*.708,-.22+i*.045,.78+i*.025),(.008,.016,.10),ink,.002)
        mark.rotation_euler.x=-.45

# Convert typography and bake modifiers; merge static geometry by material for web draw calls.
for obj in list(asset.objects):
    if obj.type in {'MESH','FONT'}:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH')
# Recess the complete display and raise its lower edge above the controls.
for name in ['Screen / heavy bezel','Screen / cream rim','Screen_Surface']:
    obj=bpy.data.objects[name]
    inverse=obj.matrix_world.inverted()
    for vertex in obj.data.vertices:
        world=obj.matrix_world@vertex.co
        world.y+=.095
        world.z=2.08+(world.z-2.08)*.85
        vertex.co=inverse@world
for mat in [ink,paper,red,gold,dark,faded]:
    group=[o for o in asset.objects if o.type=='MESH' and o.parent==root and not o.name.startswith(('Screen_Surface','Button_A','Button_B')) and o.data.materials[0]==mat]
    if not group:
        continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in group:
        obj.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    bpy.ops.object.join()
    group[0].name='Cabinet_'+mat.name.split('|')[0].strip()
    scene.cursor.location=(0,0,0)
    bpy.ops.object.origin_set(type='ORIGIN_CURSOR')

# Repeated ink dots and font bevels can share a simpler mesh at hero scale.
obj=bpy.data.objects['Cabinet_01']
bpy.context.view_layer.objects.active=obj
bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
mod=obj.modifiers.new('Reduce decorative ink geometry','DECIMATE')
mod.ratio=.62
bpy.ops.object.modifier_apply(modifier=mod.name)

# Studio is excluded from the GLB.
floor=box('Studio / floor',(0,0,-.055),(200,200,.05),dark,0)
move(floor,studio)
floor.parent=None
bpy.ops.object.camera_add(location=(3.5,-5.7,3.05))
camera=move(bpy.context.object,studio)
camera.name='Studio / hero camera'
camera.rotation_euler=(Vector((0,-.04,1.18))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO'
camera.data.ortho_scale=3.42
scene.camera=camera
for name,loc,power,size in [('Key',(-3,-4,6),650,4),('Fill',(4,-2,4),450,3),('Rim',(1,3,5),850,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    lamp=move(bpy.context.object,studio)
    lamp.name='Studio / '+name
    lamp.data.energy=power
    lamp.data.shape='DISK'
    lamp.data.size=size
    lamp.rotation_euler=(Vector((0,0,1.2))-lamp.location).to_track_quat('-Z','Y').to_euler()
scene.world=bpy.data.worlds.new('Arcade / studio world')
scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs['Color'].default_value=(.18,.17,.14,1)
bg.inputs['Strength'].default_value=.35
scene.render.engine='CYCLES'
scene.cycles.samples=32
scene.render.resolution_x=1000
scene.render.resolution_y=1000
scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.render.image_settings.file_format='PNG'
scene.render.filepath=str(OUT/'arcade-preview.png')
scene.render.film_transparent=False
scene.unit_settings.system='METRIC'
scene.unit_settings.scale_length=1
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
for obj in asset.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active=root
mesh_objects=[o for o in asset.objects if o.type=='MESH']
triangles=sum(len(p.vertices)-2 for o in mesh_objects for p in o.data.polygons)
assert triangles<25000, triangles
assert all(len(o.data.materials)==1 for o in mesh_objects)
assert bpy.data.objects.get('Screen_Surface')
assert bpy.data.objects.get('Joystick_Pivot')
bpy.context.view_layer.update()
screen_front=min((screen.matrix_world@Vector(c)).y for c in screen.bound_box)
controls=[o for o in mesh_objects if o.name.startswith(('Joystick /','Button_'))]
controls_back=max((o.matrix_world@Vector(c)).y for o in controls for c in o.bound_box)
assert screen_front-controls_back>.03, 'Display must remain behind the controls'
bpy.ops.export_scene.gltf(filepath=str(OUT/'comic-arcade.glb'),use_selection=True,use_active_scene=True,export_format='GLB',export_yup=True,export_animations=False)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'comic-arcade.blend'))
print({'meshes':len(mesh_objects),'triangles':triangles,'glb_bytes':(OUT/'comic-arcade.glb').stat().st_size,'output':str(OUT)})
