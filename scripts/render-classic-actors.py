"""Bounded four-view classic actor pilot from original Warrior motion sources.
--pilot exports only six opposed idle stills while auditing every selected pose.
No source file, simulation, timing or full animation library is changed.
"""
import argparse, ast, hashlib, json, math, sys
from pathlib import Path
import bpy
from mathutils import Matrix,Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1]
sys.dont_write_bytecode=True
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('output',type=Path);parser.add_argument('--pilot',action='store_true');parser.add_argument('--audit',action='store_true');parser.add_argument('--window',type=Path)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:]);args.output.mkdir(parents=True,exist_ok=True)
assert not args.output.resolve().is_relative_to(ROOT)
VIEWS={'se':0,'sw':270,'nw':180,'ne':90}
SAMPLES={'idle':[0],'walk':list(range(0,16,2)),'primary':[0,2,4,5,6,8,10,11],'hit':[0,2,5],'death':[0,3,6,9,12,15]}
WIDTH,HEIGHT=360,344
ROOT_PIXEL=[180,234]
if args.window:
    window=json.loads(args.window.read_text())['window']
    WIDTH,HEIGHT=window['width'],window['height'];ROOT_PIXEL=window['root']
records=[];sources={}
hash_file=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()

def look(kind):
    colors={
      'Forged charcoal steel':(.13,.145,.14),'Worn steel edges':(.24,.245,.215),
      'Blade polished ridge':(.32,.33,.29),'Old bronze fittings':(.18,.135,.075),
      'Burgundy wool':(.19,.043,.033),'Charcoal leather':(.055,.041,.026),
      'Weathered skin':(.28,.17,.105),'Dark hair and beard':(.032,.023,.014),'Eyes and brows':(.012,.01,.008)}
    if kind=='raider':colors.update({'Forged charcoal steel':(.105,.073,.045),'Worn steel edges':(.19,.14,.09),'Burgundy wool':(.14,.09,.043),'Weathered skin':(.25,.23,.18)})
    if kind=='runner':colors.update({'Forged charcoal steel':(.07,.085,.055),'Worn steel edges':(.12,.13,.08),'Burgundy wool':(.08,.11,.043),'Weathered skin':(.17,.18,.12)})
    for m in bpy.data.materials:
        if m.name not in colors:continue
        p=m.node_tree.nodes.get('Principled BSDF')
        for link in list(m.node_tree.links):
            if link.to_node==p:m.node_tree.links.remove(link)
        color=colors[m.name]
        p.inputs['Base Color'].default_value=(*color,1)
        p.inputs['Metallic'].default_value=.24 if kind=='warrior' and ('steel' in m.name or 'Blade' in m.name) else .04
        p.inputs['Roughness'].default_value=.83
        # Broad stable pigment variation; no micro-bump or animated noise.
        noise=m.node_tree.nodes.get('Classic pigment') or m.node_tree.nodes.new('ShaderNodeTexNoise')
        noise.name='Classic pigment';noise.inputs['Scale'].default_value=4.0;noise.inputs['Detail'].default_value=1.0
        ramp=m.node_tree.nodes.get('Classic paint') or m.node_tree.nodes.new('ShaderNodeValToRGB')
        ramp.name='Classic paint';ramp.color_ramp.elements[0].position=.25;ramp.color_ramp.elements[1].position=.75
        ramp.color_ramp.elements[0].color=(*(c*.5 for c in color),1)
        ramp.color_ramp.elements[1].color=(*(c*1.35 for c in color),1)
        m.node_tree.links.new(noise.outputs['Fac'],ramp.inputs['Fac']);m.node_tree.links.new(ramp.outputs['Color'],p.inputs['Base Color'])
    for obj in bpy.context.scene.objects:
        if obj.type!='MESH':continue
        obj.hide_render=any(s in obj.name for s in ['rivet','chasing','hair strand','strap clasp','Finger plate','Lame lip'])
        if kind=='raider' and any(s in obj.name for s in ['Hair','hair','Beard','Folded rear']):obj.hide_render=True
        if kind=='runner' and any(s in obj.name for s in ['Faceted pauldron','Pauldron worn','Shoulder plate','Thigh plate','Greave','Beard']):obj.hide_render=True


def capture(action,index,source_frame):
    if action not in SAMPLES or index not in SAMPLES[action]:return
    scene=bpy.context.scene;cam=scene.camera;rig=bpy.data.objects['Warrior rig']
    objects=[o for o in scene.objects if o.type in ('MESH','ARMATURE')]
    base={o.name:o.matrix_world.copy() for o in objects};hidden={o.name:o.hide_render for o in objects}
    before=(cam.matrix_world.copy(),cam.data.ortho_scale,cam.data.sensor_fit,cam.data.shift_x,cam.data.shift_y,scene.render.resolution_x,scene.render.resolution_y)
    bones={b.name:b.matrix.copy() for b in rig.pose.bones}
    scene.cycles.samples=24;scene.cycles.seed=24;scene.cycles.use_animated_seed=False;scene.cycles.use_denoising=True
    bpy.data.objects['Warm rim'].data.energy=0
    key=bpy.data.objects['Cool soft key'];key.data.color=(1,.92,.78);key.data.size=5
    scene.render.resolution_x,scene.render.resolution_y=WIDTH*2,HEIGHT*2
    cam.data.ortho_scale=2.240000009536743*WIDTH/256;cam.data.sensor_fit='HORIZONTAL'
    cam.data.shift_x=cam.data.shift_y=0;cam.rotation_euler.x=math.pi/2-math.asin(44/64)
    def project(point):
        p=world_to_camera_view(scene,cam,point);return Vector((p.x*WIDTH,(1-p.y)*HEIGHT))
    try:
        bpy.context.view_layer.update();p=project(Vector((0,0,0)))
        cam.location+=cam.rotation_euler.to_matrix()@Vector(((p.x-ROOT_PIXEL[0])*2.24/256,(ROOT_PIXEL[1]-p.y)*2.24/256,0))
        bpy.context.view_layer.update();assert (project(Vector((0,0,0)))-Vector(ROOT_PIXEL)).length<.001
        for kind in ['warrior','raider','runner']:
            look(kind)
            size={'warrior':(1,1,1,1),'raider':(1.12,1.06,.94,1),'runner':(.87,.9,.94,1)}[kind]
            for view,angle in VIEWS.items():
                transform=Matrix.Rotation(math.radians(angle),4,'Z')@Matrix.Diagonal(Vector(size))
                for obj in objects:obj.matrix_world=transform@base[obj.name]
                bpy.context.view_layer.update();deps=bpy.context.evaluated_depsgraph_get()
                points=[]
                for obj in objects:
                    if obj.type!='MESH' or obj.hide_render:continue
                    evaluated=obj.evaluated_get(deps)
                    points.extend(project(evaluated.matrix_world@Vector(p)) for p in evaluated.bound_box)
                bounds=[min(p.x for p in points),min(p.y for p in points),max(p.x for p in points),max(p.y for p in points)]
                if not args.audit: assert bounds[0]>=4 and bounds[1]>=4 and bounds[2]<=WIDTH-4 and bounds[3]<=HEIGHT-4,(kind,view,action,index,bounds)
                name=f'{kind}-{action}-{view}-{index:02}'
                row={'name':name,'kind':kind,'view':view,'action':action,'index':index,'sourceFrame':source_frame,'bounds':bounds}
                if not args.audit and (not args.pilot or action=='idle' and view in ['se','nw']):
                    path=args.output/(name+'.png');scene.render.filepath=str(path);bpy.ops.render.render(write_still=True);row['sha256']=hash_file(path)
                records.append(row)
    finally:
        for obj in objects:obj.matrix_world=base[obj.name];obj.hide_render=hidden[obj.name]
        cam.matrix_world,cam.data.ortho_scale,cam.data.sensor_fit=before[:3]
        cam.data.shift_x,cam.data.shift_y,scene.render.resolution_x,scene.render.resolution_y=before[3:]
        bpy.context.view_layer.update()
    assert all(b.matrix==bones[b.name] for b in rig.pose.bones)

for folder,manifest,count in [('warrior-movement-se','warrior-movement',24),('warrior-combat-se','warrior-combat',12)]:
    source=ROOT/'assets/source/q3'/folder/'warrior.blend';meta=json.loads((ROOT/'public/dev'/manifest/'warrior.json').read_text())
    assert hash_file(source)==meta['provenance']['rigSha256'];sources[str(source.relative_to(ROOT))]=hash_file(source)
    bpy.ops.wm.open_mainfile(filepath=str(source));assert bpy.app.version_string=='4.5.3 LTS'
    for ordinal,frame in enumerate(meta['frames'][:count]):
        bpy.context.scene.frame_set(ordinal+1);bpy.context.view_layer.update();capture(frame['action'],frame['index'],ordinal)
for group in ['warrior-reactions','warrior-death']:
    path=ROOT/'assets/source/q3'/group/'render.py';meta=json.loads((ROOT/'public/dev'/group/'warrior.json').read_text())
    assert hash_file(path)==meta['provenance']['rendererSha256'];sources[str(path.relative_to(ROOT))]=hash_file(path)
    tree=ast.parse(path.read_text(),filename=str(path))
    class Observe(ast.NodeTransformer):
        count=0
        def visit_Expr(self,node):
            if isinstance(node.value,ast.Call) and isinstance(node.value.func,ast.Attribute) and isinstance(node.value.func.value,ast.Name) and node.value.func.value.id=='records' and node.value.func.attr=='append':
                self.count+=1;return [node,ast.Expr(value=ast.Call(func=ast.Name(id='_capture',ctx=ast.Load()),args=[],keywords=[]))]
            return self.generic_visit(node)
    observer=Observe();tree=observer.visit(tree);assert observer.count==1;ast.fix_missing_locations(tree)
    context={'__file__':str(path),'__name__':'__classic__'}
    def observe():
        f=context['records'][-1];capture(f['action'],f['index'],len(context['records'])-1)
    context['_capture']=observe;saved=sys.argv;sys.argv=[str(path),'--',str(args.output/'authoring'/group),'se','--audit']
    try:exec(compile(tree,str(path),'exec'),context)
    finally:sys.argv=saved
assert len(records)==312,len(records)
for path,digest in sources.items():assert hash_file(ROOT/path)==digest
sys.path.insert(0,str(ROOT/'scripts'))
from act1_export_window import shared_window
window=shared_window([r['bounds'] for r in records],original=(WIDTH,HEIGHT),root=ROOT_PIXEL)
window['width']+=window['width']%2;window['height']+=window['height']%2
(args.output/'actors.json').write_text(json.dumps({'version':1,'window':window,'scope':'four-view classic actor pilot; original gameplay timing; run reuses distance-driven walk poses','samples':SAMPLES,'root':ROOT_PIXEL,'width':WIDTH,'height':HEIGHT,'renderScale':2,'runtimeScale':.5,'elevation':math.degrees(math.asin(44/64)),'sources':sources,'frames':records},indent=2)+'\n')
print('CLASSIC_ACTORS',len(records),sum('sha256' in r for r in records),flush=True)
