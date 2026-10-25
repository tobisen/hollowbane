"""Original Hollowbane Warrior. Blender 4.5.3; no external meshes/textures/actions.
Run: Blender --background --factory-startup --python-exit-code 1 --python <this> -- <output-dir>
Every pose shares geometry, orthographic framing, lighting, root and scale.
"""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Vector, Matrix
from bpy_extras.object_utils import world_to_camera_view

OUT = Path(sys.argv[sys.argv.index('--') + 1])
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.seed = 24
scene.cycles.use_animated_seed = False
scene.cycles.use_denoising = True
scene.render.resolution_x = scene.render.resolution_y = 512
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('Cool ambient')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (.30, .36, .46, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = .22


def material(name, color, metallic=0, roughness=.5, grain=0):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    n = m.node_tree.nodes
    p = n.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metallic
    p.inputs['Roughness'].default_value = roughness
    if grain:
        noise = n.new('ShaderNodeTexNoise')
        noise.inputs['Scale'].default_value = 105
        noise.inputs['Detail'].default_value = 2
        bump = n.new('ShaderNodeBump')
        bump.inputs['Strength'].default_value = grain
        bump.inputs['Distance'].default_value = .012
        m.node_tree.links.new(noise.outputs['Fac'], bump.inputs['Height'])
        m.node_tree.links.new(bump.outputs['Normal'], p.inputs['Normal'])
    if metallic > .7 and grain:
        wear = n.new('ShaderNodeTexNoise')
        wear.inputs['Scale'].default_value = 24
        wear.inputs['Detail'].default_value = 3
        ramp = n.new('ShaderNodeValToRGB')
        ramp.color_ramp.elements[0].position = .25
        ramp.color_ramp.elements[0].color = (*(v*.45 for v in color),1)
        ramp.color_ramp.elements[1].position = .78
        ramp.color_ramp.elements[1].color = (*(v*1.6 for v in color),1)
        m.node_tree.links.new(wear.outputs['Fac'],ramp.inputs['Fac'])
        m.node_tree.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
    return m


steel = material('Forged charcoal steel', (.038, .044, .049), .87, .36, .35)
edge = material('Worn steel edges', (.19, .20, .20), .88, .35, .18)
blade = material('Blade polished ridge', (.43, .46, .48), .88, .26)
brass = material('Old bronze fittings', (.23, .16, .075), .72, .42)
cloth = material('Burgundy wool', (.065, .003, .008), 0, .85, .3)
leather = material('Charcoal leather', (.036, .026, .021), 0, .65, .32)
skin = material('Weathered skin', (.26, .147, .087), 0, .6, .08)
hair = material('Dark hair and beard', (.027, .018, .014), 0, .8, .2)
eye = material('Eyes and brows', (.012, .009, .006), 0, .6)

# Rigid armor segments bound to an actual armature; underlayers bridge joints.
rest = {
    'root': ((0, 0, 0), (0, 0, .2)),
    'torso': ((0, 0, .94), (0, 0, 1.48)),
    'head': ((0, 0, 1.48), (0, 0, 1.82)),
}
for side, x in [('L', -.16), ('R', .16)]:
    rest['thigh'+side] = ((x, 0, .94), (x, -.025, .51))
    rest['shin'+side] = ((x, -.025, .51), (x, 0, .09))
    rest['foot'+side] = ((x, 0, .09), (x, -.21, .09))
    sx = -.29 if side == 'L' else .29
    ex = -.35 if side == 'L' else .39
    hx = -.38 if side == 'L' else .44
    rest['upper'+side] = ((sx, 0, 1.44), (ex, -.03, 1.15))
    rest['fore'+side] = ((ex, -.03, 1.15), (hx, -.13, .92))
    rest['hand'+side] = ((hx, -.13, .92), (hx, -.13, .81))

arm = bpy.data.armatures.new('Warrior skeleton')
rig = bpy.data.objects.new('Warrior rig', arm)
scene.collection.objects.link(rig)
bpy.context.view_layer.objects.active = rig
rig.select_set(True)
bpy.ops.object.mode_set(mode='EDIT')
for name, (a, b) in rest.items():
    bone = arm.edit_bones.new(name)
    bone.head, bone.tail = a, b
    if name != 'root':
        bone.parent = arm.edit_bones['root']
bpy.ops.object.mode_set(mode='OBJECT')
rig.select_set(False)
parts = []
weapon = []


def bind(obj, bone, mat, sword=False):
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.select_set(False)
    group = obj.vertex_groups.new(name=bone)
    group.add(list(range(len(obj.data.vertices))), 1, 'REPLACE')
    mod = obj.modifiers.new('Rigid armor attachment', 'ARMATURE')
    mod.object = rig
    parts.append(obj)
    if sword:
        weapon.append(obj)
    return obj


def ellipsoid(name, center, radii, mat, bone='torso', segments=24):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=12, location=center)
    o = bpy.context.object
    o.name = name
    o.scale = radii
    for p in o.data.polygons:
        p.use_smooth = True
    return bind(o, bone, mat)


def box(name, center, scale, mat, bone='torso', bevel=.025, sword=False):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.object
    o.name = name
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = o.modifiers.new('Forged round edges', 'BEVEL')
    mod.width, mod.segments = bevel, 3
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.modifier_apply(modifier=mod.name)
    o.modifiers.new('Weighted plate normals', 'WEIGHTED_NORMAL')
    return bind(o, bone, mat, sword)


def mesh(name, vertices, faces, mat, bone='torso', thick=.012, sword=False):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    if thick:
        mod = o.modifiers.new('Material thickness', 'SOLIDIFY')
        mod.thickness = thick
    mod = o.modifiers.new('Soft metal edges', 'BEVEL')
    mod.width, mod.segments = .006, 2
    return bind(o, bone, mat, sword)


def segment(name, a, b, radius, mat, bone, r2=None):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=radius, radius2=r2 or radius*.84,
                                   depth=(b-a).length, location=(a+b)/2)
    o = bpy.context.object
    o.name = name
    o.rotation_mode = 'QUATERNION'
    o.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(b-a)
    mod = o.modifiers.new('Rounded seams', 'BEVEL')
    mod.width, mod.segments = .013, 3
    return bind(o, bone, mat)


# Body: fitted layered cuirass, gorget, waist lames, small bronze fasteners.
ellipsoid('Padded torso', (0, 0, 1.22), (.275, .155, .32), leather)
mesh('Fitted cuirass', [(-.20,.09,1.46),(.20,.09,1.46),(.26,-.10,1.40),(.19,-.17,1.13),(0,-.21,1.10),(-.19,-.17,1.13),(-.26,-.10,1.40),(0,-.22,1.39),(0,-.23,1.23)], [(0,1,2,7,6),(6,7,8,5),(7,2,3,8),(5,8,4),(8,3,4),(0,6,5),(1,3,2)], steel)
mesh('Raised breast ridge', [(-.009,-.233,1.39),(.009,-.233,1.39),(.012,-.243,1.23),(0,-.224,1.11),(-.012,-.243,1.23)], [(0,1,2,3,4)], edge)
for side in [-1,1]:
    mesh('Collar edge', [(side*.02,-.20,1.45),(side*.20,-.12,1.46),(side*.245,-.11,1.39),(side*.225,-.125,1.39),(side*.185,-.135,1.44)], [(0,1,2,3,4)], edge)
for z, width in [(1.13, .25), (1.055, .235), (.985, .24)]:
    box('Articulated waist lame', (0, -.075, z), (width*2, .25, .10), steel, bevel=.035)
    box('Lame lip', (0, -.203, z-.036), (width*1.8, .009, .012), edge, bevel=.004)
segment('Neck', (0, 0, 1.46), (0, 0, 1.62), .10, skin, 'head')
ellipsoid('Scarf collar', (0, 0, 1.50), (.185, .137, .041), cloth)
# Cross-body leather baldric, separately outlined and riveted.
mesh('Diagonal baldric', [(-.20,-.245,1.45),(-.13,-.255,1.48),(.22,-.24,1.03),(.15,-.25,1.02)], [(0,1,2,3)], leather)
for i in range(4):
    ellipsoid('Baldric rivet', (-.13+i*.082, -.268, 1.40-i*.095), (.012,.007,.012), brass)
box('Belt', (0, -.028, .97), (.50, .35, .07), leather, bevel=.018)
box('Belt buckle', (.04, -.213, .97), (.085, .025, .065), brass, bevel=.009)
box('Buckle inset', (.04, -.228, .97), (.047, .008, .035), leather, bevel=.004)
# Split tabard and back cloak: narrow panels preserve leg readability.
mesh('Left tabard', [(-.22,-.16,.94),(-.035,-.19,.94),(-.055,-.23,.55),(-.24,-.18,.61)], [(0,1,2,3)], cloth)
mesh('Right tabard', [(.035,-.19,.94),(.20,-.16,.94),(.235,-.17,.61),(.07,-.23,.55)], [(0,1,2,3)], cloth)
mesh('Short rear mantle', [(-.21,.09,1.48),(.21,.09,1.48),(.29,.23,.75),(.11,.255,.71),(-.05,.24,.77),(-.27,.21,.73)], [(0,1,2,3,4,5)], cloth)
# Face, nose, eyebrows, ears, hair and trimmed beard; silhouette stays fixed.
ellipsoid('Head', (0,-.008,1.70), (.112,.102,.145), skin, 'head')
ellipsoid('Nose', (0,-.113,1.697), (.022,.042,.035), skin, 'head')
ellipsoid('Beard', (0,-.061,1.62), (.093,.068,.071), hair, 'head')
box('Mouth', (0,-.124,1.638), (.049,.008,.009), leather, 'head', .003)
for x in [-.044,.044]:
    ellipsoid('Eye', (x,-.100,1.728), (.013,.006,.006), eye, 'head')
    box('Brow', (x,-.101,1.749), (.044,.014,.012), hair, 'head', .004)
    ellipsoid('Ear', (math.copysign(.111,x),.0,1.70), (.024,.029,.042), skin, 'head')
ellipsoid('Hair cap', (0,.012,1.794), (.112,.098,.055), hair, 'head')
for i in range(17):
    a = i*math.tau/17
    ellipsoid('Swept hair lock', (math.cos(a)*.084, .015+math.sin(a)*.072, 1.815+math.sin(i*2)*.013), (.022,.025,.045), hair, 'head', 16)

for side in ['L','R']:
    x = -.16 if side == 'L' else .16
    a,b = rest['thigh'+side]
    segment('Quilted thigh '+side, a, b, .112, leather, 'thigh'+side)
    box('Thigh plate '+side, (x,-.074,.736), (.18,.155,.30), steel, 'thigh'+side, .055)
    ellipsoid('Knee '+side, (x,-.065,.505), (.112,.108,.102), steel, 'shin'+side)
    a,b = rest['shin'+side]
    segment('Boot shaft '+side, a, b, .089, leather, 'shin'+side)
    box('Greave '+side, (x,-.065,.295), (.135,.14,.30), steel, 'shin'+side, .04)
    box('Greave ridge '+side, (x,-.142,.30), (.018,.013,.25), edge, 'shin'+side, .006)
    box('Boot sole '+side, (x,-.085,.032), (.19,.35,.06), leather, 'foot'+side, .025)
    ellipsoid('Armored boot '+side, (x,-.092,.083), (.095,.175,.065), steel, 'foot'+side)
    for j in range(3):
        box('Sabatons '+side, (x,-.155-j*.036,.115-j*.009), (.177,.025,.022), edge, 'foot'+side, .009)
    sx = -.29 if side == 'L' else .29
    ellipsoid('Shoulder padding '+side, (sx,0,1.43), (.115,.11,.095), leather, 'upper'+side)
    for j in range(3):
        ellipsoid('Shoulder plate '+side, (sx+math.copysign(j*.012,sx),-.014,1.49-j*.058), (.14-j*.009,.130,.070), steel, 'upper'+side)
        ellipsoid('Shoulder rivet '+side, (sx+math.copysign(.09,sx),-.13,1.43-j*.055), (.012,.009,.012), brass, 'upper'+side)
    a,b = rest['upper'+side]
    segment('Upper arm '+side, a,b,.09,steel,'upper'+side)
    a,b = rest['fore'+side]
    segment('Vambrace '+side, a,b,.092,steel,'fore'+side,r2=.068)
    ellipsoid('Elbow '+side, a, (.095,.087,.085), steel, 'fore'+side)
    h = rest['hand'+side][0]
    ellipsoid('Gauntlet '+side, (h[0],h[1],h[2]-.04), (.068,.065,.09), steel, 'hand'+side)
    for j in range(3):
        box('Finger plate '+side, (h[0]-.04+j*.035,h[1]-.056,h[2]-.065), (.025,.026,.043), edge,'hand'+side,.006)

# Sword is part of the hand rig, outside the body/leg envelope. No independent drift.
h = Vector(rest['handR'][0]) + Vector((.025,-.015,-.04))
down = Vector((.13,-.14,-.77))
u = down.normalized()
across = Vector((1,0,.13/.77)).normalized()
guard = h + u*.085
for name, c, dims, mat in [
    ('Sword grip', h-u*.008, (.035,.038,.16), leather),
    ('Bronze crossguard', guard, (.25,.055,.035), brass),
    ('Sword pommel', h-u*.105, (.06,.06,.055), brass),
]:
    box(name, c, dims, mat, 'handR', .012, True)
start = guard+u*.025
tip = start+u*.66
mid = start+u*.51
verts = [start-across*.038,start+across*.038,mid+across*.029,tip,mid-across*.029,start+Vector((0,-.014,0)),mid+Vector((0,-.014,0))]
mesh('Straight sword blade', verts, [(0,5,6,4),(5,1,2,6),(4,6,3),(6,2,3)], blade, 'handR', .009, True)

# 2:1 isometric ground basis; frame root projects exactly to (128,210) at 256px.
ortho = 2.24
elevation = math.pi/6
target = Vector((0,0,82*ortho/(256*math.cos(elevation))))
bpy.ops.object.camera_add(location=target+Vector((-6,-6,math.sqrt(72)*math.tan(elevation))))
cam = bpy.context.object
cam.name = 'SE orthographic locked camera'
cam.rotation_euler = (target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type, cam.data.ortho_scale = 'ORTHO', ortho
scene.camera = cam
for name,loc,power,size,color in [
    ('Cool soft key',(-3,-4,6),500,3,(.82,.9,1)),
    ('Warm rim',(3,1,4),400,2,(1,.74,.47)),
    ('Front fill',(0,-4,2),45,3,(.82,.86,1)),
]:
    bpy.ops.object.light_add(type='AREA',location=loc)
    light = bpy.context.object
    light.name, light.data.energy, light.data.shape, light.data.size = name,power,'DISK',size
    light.data.color = color
    light.rotation_euler = (Vector((0,0,1))-light.location).to_track_quat('-Z','Y').to_euler()


def pose_bone(name, a, b):
    a,b = Vector(a),Vector(b)
    p = rig.pose.bones[name]
    p.rotation_mode = 'QUATERNION'
    ra, rb = (Vector(v) for v in rest[name])
    rotation = (rb-ra).rotation_difference(b-a).to_matrix().to_4x4()
    p.matrix = Matrix.Translation(a) @ rotation @ Matrix.Translation(-ra) @ arm.bones[name].matrix_local
    p.keyframe_insert(data_path='location')
    p.keyframe_insert(data_path='rotation_quaternion')


def foot_path(t):
    t %= 1
    if t < .6:
        return -.27 + .54*t/.6, 0, True
    t = (t-.6)/.4
    smooth = t*t*(3-2*t)
    return .27-.54*smooth, .13*math.sin(math.pi*t), False


def project(p):
    v = world_to_camera_view(scene,cam,Vector(p))
    return [round(v.x*256,5),round((1-v.y)*256,5)]


def knee(hip, ankle, upper, lower):
    v = ankle-hip
    d = v.length
    along = (upper*upper-lower*lower+d*d)/(2*d)
    perpendicular = Vector((0,-1,0))
    direction = v.normalized()
    perpendicular = (perpendicular-direction*perpendicular.dot(direction)).normalized()
    return hip + direction*along + perpendicular*math.sqrt(max(0,upper*upper-along*along))


records=[]
for action,count in [('idle',8),('walk',16)]:
    for index in range(count):
        frame = len(records)+1
        scene.frame_set(frame)
        phase = index/count
        theta = phase*math.tau
        walking = action == 'walk'
        bob = .012*(1-math.cos(theta*2)) if walking else .004*math.sin(theta)
        shift = Vector((.009*math.sin(theta) if walking else 0,0,bob))
        pose_bone('root',*rest['root'])
        for name in ['torso','head']:
            a,b=rest[name]
            pose_bone(name,Vector(a)+shift,Vector(b)+shift)
        contacts=[]
        for side,offset in [('L',0),('R',.5)]:
            x = -.16 if side=='L' else .16
            y,z,planted = foot_path(phase+offset) if walking else (0,0,True)
            hip = Vector((x,0,.94))+shift
            ankle = Vector((x,y,.09+z))
            upper = (Vector(rest['thigh'+side][1])-Vector(rest['thigh'+side][0])).length
            lower = (Vector(rest['shin'+side][1])-Vector(rest['shin'+side][0])).length
            # Keep hips low enough for the invariant leg lengths at full stride.
            hip.z -= .045
            k = knee(hip,ankle,upper,lower)
            pose_bone('thigh'+side,hip,k)
            pose_bone('shin'+side,k,ankle)
            pose_bone('foot'+side,ankle,ankle+Vector((0,-.21,0)))
            contacts.append({'side':side,'planted':planted,'sole':[x,y,z], 'pixel':project((x,y,z))})
            # Same rigid segments rotate together about shoulder; slight opposite arm swing.
            angle = (.14 if side=='L' else .055)*math.sin(theta+offset*math.tau) if walking else .008*math.cos(theta+offset*math.tau)
            shoulder=Vector(rest['upper'+side][0])
            rot=Matrix.Rotation(angle,3,'X')
            for name in ['upper'+side,'fore'+side,'hand'+side]:
                a,b=rest[name]
                pose_bone(name,shoulder+rot@(Vector(a)-shoulder)+shift,shoulder+rot@(Vector(b)-shoulder)+shift)
        bpy.context.view_layer.update()
        depsgraph=bpy.context.evaluated_depsgraph_get()
        wp=[]
        for obj in weapon:
            evaluated=obj.evaluated_get(depsgraph)
            geometry=evaluated.to_mesh()
            wp.extend(project(evaluated.matrix_world@v.co) for v in geometry.vertices)
            evaluated.to_mesh_clear()
        name=f'{action}-se-{index:02}'
        record={'name':name,'action':action,'index':index,'root':project((0,0,0)),
                'contacts':contacts,'weaponBounds':[min(p[0] for p in wp),min(p[1] for p in wp),max(p[0] for p in wp),max(p[1] for p in wp)],
                'boneLengths':{n:round((rig.pose.bones[n].tail-rig.pose.bones[n].head).length,7) for n in rest}}
        records.append(record)
        scene.render.filepath=str(OUT/(name+'.png'))
        if '--sample' not in sys.argv or index in ([0] if action == 'idle' else [0,4,8,12]):
            bpy.ops.render.render(write_still=True)
scene.frame_start,scene.frame_end=1,24
scene.timeline_markers.new('IDLE: 1–8 loop',frame=1)
scene.timeline_markers.new('WALK: 9–24 loop',frame=9)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'warrior.blend'),compress=True)
(OUT/'rig.json').write_text(json.dumps({'version':1,'blender':bpy.app.version_string,'renderSize':512,'cell':256,'root':[128,210], 'direction':'southeast','orthoScale':ortho,'elevationDegrees':30,'strideMeters':.9,'frames':records},indent=2)+'\n')
print('WARRIOR_PILOT_RENDERED',5 if '--sample' in sys.argv else len(records))
