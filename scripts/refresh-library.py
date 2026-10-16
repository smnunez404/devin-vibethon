"""Actualiza el catálogo desde el manifiesto, conservando la página sin dependencias."""
from pathlib import Path
import json,html,re
R=Path(__file__).resolve().parents[1]/'assets/v001'
m=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
cards=[]
for a in m['assets']:
    p=html.escape(a['path']); title=html.escape(a['id']); note=html.escape(a['note'])
    terms=[]
    for needle,label in [('foot','pie huella'),('feet','pies huellas'),('fist','puño golpe mano'),('hand','mano abierta'),('arrow','flecha'),('left','izquierda'),('right','derecha'),('cyan','cian'),('pink','rosa magenta'),('yellow','amarillo'),('purple','violeta'),('wall','pared esquivar'),('hurdle','valla saltar agacharse'),('pose','silueta cuerpo postura'),('pad','receptor plataforma'),('trail','estela'),('ring','anillo impacto'),('fragments','partículas fragmentos'),('fairground','feria norias'),('diamonds','diamantes'),('gears','engranajes')]:
        if needle in a['id']:terms.append(label)
    semantic=' · '.join(terms)
    if a['format']=='MP4':
        preview=f'<video controls loop muted playsinline preload="metadata" poster="{html.escape(a["poster"])}" src="{p}" style="width:100%;height:220px;object-fit:contain;background:#050710"></video><button type="button" onclick="const v=this.previousElementSibling;if(v.paused){{document.querySelectorAll(\'video\').forEach(x=>{{if(x!==v)x.pause()}});v.play();this.textContent=\'Pausar fondo\'}}else{{v.pause();this.textContent=\'Reproducir fondo\'}}">Reproducir fondo</button>'
        meta=f'{a["width"]} × {a["height"]} · {a["duration"]:.2f} s · {a["fps"]} FPS · MP4'
    elif a['format']=='WAV':
        preview=f'<div class="audio-preview">♫<audio controls preload="metadata" src="{p}"></audio></div>'
        meta=f'{a["duration"]:.2f} s · {a["sampleRate"]} Hz · mono · WAV'
    else:
        preview=f'<a href="{p}" target="_blank"><img loading="lazy" src="{p}" alt="{title}"></a>'
        meta=f'{a["width"]} × {a["height"]} · SVG'
    links=f'<a download href="{p}">Descargar {a["format"]} ↗</a>'
    if a.get('png'):links+=f' · <a download href="{html.escape(a["png"])}">PNG ↗</a>'
    cards.append(f'<article data-category="{a["category"]}">{preview}<h3>{title}</h3><p>{html.escape(semantic)}</p><p>{meta} · {a["bytes"]:,} B</p><p>{note}</p>{links}</article>')
page=(R/'index.html').read_text(encoding='utf-8')
page=re.sub(r'<div class="grid">.*?</div></main>','<div class="grid">'+''.join(cards)+'</div></main>',page,flags=re.S)
if '.audio-preview{' not in page:
    page=page.replace('</style>','.audio-preview{height:220px;background:linear-gradient(135deg,#162f3c,#251b3a);border-radius:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:24px;font-size:64px;color:#60e8ed}.audio-preview audio{width:100%;height:42px} </style>')
page=re.sub(r'<div class="notice">.*?</div>', f'<div class="notice">Primera versión · {len(m["assets"])} recursos: gráficos editables y PNG, audio original y tres fondos animados. Reconstrucción propia y simplificada para prototipo; las capturas de referencia se consultan por separado. Este catálogo no implementa el videojuego.</div>',page,flags=re.S)
page=page.replace("b.textContent=value==='all'?'Todos':value;", "const labels={all:'Todos',notes:'Notas',pads:'Receptores',effects:'Efectos',obstacles:'Obstáculos',track:'Pista',guides:'Guías corporales',hud:'Marcadores',backgrounds:'Fondos estáticos',icons:'Símbolos',pairs:'Notas dobles',interface:'Interfaz',audio:'Audio',motion:'Fondos animados'};b.textContent=labels[value]||value;")
page=page.replace('<footer>Archivos editables locales ·','<footer><a href="../../raw/reference/index.html">Capturas y análisis de referencia</a> · Archivos editables locales ·')
page=page.replace('function filter(){let n=0;', "function filter(){const norm=s=>s.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase();const query=norm(document.querySelector('#search').value).split(/\\s+/).filter(Boolean).map(t=>t.endsWith('es')&&t.length>5?t.slice(0,-2):t.endsWith('s')&&t.length>3?t.slice(0,-1):t);let n=0;")
page=page.replace("!c.textContent.toLowerCase().includes(document.querySelector('#search').value.toLowerCase())", "!query.every(t=>norm(c.textContent).includes(t))")
(R/'index.html').write_text(page,encoding='utf-8')
print('Catálogo actualizado:',len(cards),'recursos')
