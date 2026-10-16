from pathlib import Path
import json
R=Path(__file__).resolve().parents[1]/'assets/v001'
m=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
def save(name,category,body,w=512,h=512,note='Recurso propio para la adaptación. Primera versión.'):
    p=R/category/(name+'.svg');p.parent.mkdir(exist_ok=True)
    p.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>',encoding='utf-8')
    a=dict(id=name,category=category,path=p.relative_to(R).as_posix(),format='SVG',width=w,height=h,bytes=p.stat().st_size,alpha=True,pivot=[.5,.5],note=note)
    m['assets']=[x for x in m['assets'] if x['id']!=name]+[a]
for side in ['left','right']:
    arrow='<path d="M120 154 L60 210 L120 266 M180 154 L120 210 L180 266 M240 154 L180 210 L240 266" fill="none" stroke="#fff23c" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'
    transform='translate(512 0) scale(-1 1)' if side=='right' else ''
    save('wall-cue-'+side,'obstacles','<rect x="20" y="20" width="472" height="472" fill="#ff274b" fill-opacity=".16" stroke="#ff455f" stroke-width="7"/><g transform="'+transform+' translate(100 40)">'+arrow+'</g>',note='Pared frontal con cheurones direccionales observados en el bloque de diamantes; el lado del símbolo indica desplazamiento propuesto, pendiente de reglas del futuro juego.')
save('results-panel','interface','<rect x="5" y="5" width="1270" height="710" rx="32" fill="#0b1220" stroke="#23e5ed" stroke-width="5"/><text x="640" y="130" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="900" fill="white">SESIÓN COMPLETA</text><path d="M80 185 H1200 M80 350 H1200 M80 515 H1200" stroke="#33445a" stroke-width="2"/><g font-family="Arial,sans-serif" font-size="34" fill="#a3bad2"><text x="90" y="260">PRECISIÓN</text><text x="90" y="425">COMBO MÁXIMO</text><text x="90" y="590">TIEMPO ACTIVO</text></g>',1280,720,'Marco de resultados propuesto, sin valores inventados. Los datos se agregarían en la implementación futura.')
save('progress-rail','hud','<rect x="8" y="12" width="1264" height="16" rx="8" fill="#182335"/><rect x="8" y="12" width="1264" height="16" rx="8" fill="none" stroke="#54687d" stroke-width="2"/>',1280,40)
save('progress-fill','hud','<rect x="8" y="12" width="1264" height="16" rx="8" fill="#23e5ed"/>',1280,40,'Barra separada para recortar por progreso. El recorte y estado aún no están implementados.')
for kind in ['low-jump','high-duck']:
    down=kind=='high-duck'
    path='M120 90 L160 140 L200 90 M472 90 L512 140 L552 90 M824 90 L864 140 L904 90' if down else 'M120 160 L160 110 L200 160 M472 160 L512 110 L552 160 M824 160 L864 110 L904 160'
    save('hurdle-'+kind,'obstacles','<path d="M28 68 L85 24 H939 L996 68 V220 H28Z" fill="#fff23c" fill-opacity=".12" stroke="#fff9e2" stroke-width="6"/><path d="M28 68 H996 M85 24 V178 H939 V24 M28 220 L85 178 M939 178 L996 220" fill="none" stroke="#fff9e2" stroke-width="3"/><path d="'+path+'" fill="none" stroke="#fff23c" stroke-width="12"/>',1024,256,'Valla de salto baja o de paso agachado alta, reconstruida de las capturas nominales 103.783 s y 690.729 s. La altura se decide al componerla, no viene implementada en el asset.')
for a in m['assets']:
    if a['id'].startswith('note-arrow-'):
        p=R/a['path'];s=p.read_text(encoding='utf-8');angle=-90 if '-left-' in a['id'] else 90
        start=s.index('<g transform=');end=s.index('>',start)
        s=s[:start]+f'<g transform="rotate({angle} 256 256)" fill="#090b16" color="#090b16">'+s[end+1:]
        p.write_text(s,encoding='utf-8');a['bytes']=p.stat().st_size;a['note']='Flecha direccional propuesta para la adaptación; no confirmada como nota en el video.'
(R/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
print('Recursos registrados:',len(m['assets']))
