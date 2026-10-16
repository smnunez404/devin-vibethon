"""Une volúmenes corporales para obtener siluetas continuas con contorno blanco."""
from pathlib import Path
import ast,json
from shapely.geometry import Point,LineString,Polygon,box
from shapely.ops import unary_union
from shapely import affinity
R=Path(__file__).resolve().parents[1];D=R/'assets/v001'
tree=ast.parse((R/'scripts/build-assets.py').read_text(encoding='utf-8'))
poses=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='poses' for t in n.targets))
manifest=json.loads((D/'manifest.json').read_text(encoding='utf-8'))
poses['jump']=poses['arms-up']
poses['duck']=poses['squat']
poses['lean-left']=poses['neutral']
poses['lean-right']=poses['neutral']
for name,p in poses.items():
    shapes=[Point(256,158).buffer(33,quad_segs=24),box(242,180,270,214),Polygon([(215,205),(297,205),(307,231),(288,312),(291,350),(221,350),(224,312),(205,231)]).buffer(7,quad_segs=12)]
    for start in [0,3,6,9]:
        upper=17 if start<6 else 19;lower=12 if start<6 else 13
        shapes.extend([LineString([p[start],p[start+1]]).buffer(upper,quad_segs=12),LineString([p[start+1],p[start+2]]).buffer(lower,quad_segs=12),Point(*p[start+2]).buffer(12 if start<6 else 15,quad_segs=12)])
    shape=unary_union(shapes).buffer(1).buffer(-1)
    if name=='jump':shape=affinity.translate(shape,yoff=-35)
    if name=='duck':shape=affinity.scale(shape,xfact=1.08,yfact=.68,origin=(256,477))
    if name=='lean-left':shape=affinity.rotate(shape,-12,origin=(256,477))
    if name=='lean-right':shape=affinity.rotate(shape,12,origin=(256,477))
    parts=list(shape.geoms) if shape.geom_type=='MultiPolygon' else [shape]
    paths=[]
    for part in parts:
        coords=list(part.exterior.coords)
        paths.append('M'+' L'.join(f'{x:.2f},{y:.2f}' for x,y in coords)+'Z')
    svg='<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><path d="'+ ' '.join(paths)+'" fill="#05070b" stroke="#f5f7fa" stroke-width="3.5" stroke-linejoin="round"/></svg>'
    path=D/'guides'/('pose-'+name+'.svg');path.write_text(svg,encoding='utf-8')
    asset=next((a for a in manifest['assets'] if a['id']=='pose-'+name),None)
    if asset is None:
        asset=dict(id='pose-'+name,category='guides',path='guides/pose-'+name+'.svg',format='SVG',width=512,height=512,alpha=True,pivot=[.5,.5])
        manifest['assets'].append(asset)
    asset['bytes']=path.stat().st_size
    asset['note']='Silueta corporal continua propia, contorno blanco y fondo transparente. Acción orientativa; no es salida de tracking.'
(D/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('Siluetas refinadas:',len(poses))
