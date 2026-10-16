"""Produce recursos vectoriales propios y un catálogo local. No contiene gameplay."""
from pathlib import Path
import json, math, html

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'v001'
items = []
COLORS = {'cyan':'#23e5ed','pink':'#f54fce','yellow':'#fff23c','purple':'#a97bff'}

def save(name, category, body, w=512, h=512, note='Interpretación vectorial propia de la referencia; primera versión.'):
    folder=OUT/category; folder.mkdir(parents=True,exist_ok=True)
    path=folder/(name+'.svg')
    svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><filter id="glow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="7"/></filter><linearGradient id="tile" x2="0" y2="1"><stop stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".2"/></linearGradient></defs>{body}</svg>'
    path.write_text(svg,encoding='utf-8')
    items.append(dict(id=name,category=category,path=f'{category}/{name}.svg',width=w,height=h,format='SVG',alpha=category!='backgrounds',bytes=path.stat().st_size,note=note))

foot='<path d="M251 181 C212 181 191 214 197 248 C201 276 223 277 217 310 C209 351 231 381 263 376 C304 368 304 333 281 309 C263 289 267 271 287 244 C310 215 288 180 251 181Z"/><ellipse cx="225" cy="151" rx="22" ry="29"/><ellipse cx="265" cy="139" rx="16" ry="24"/><ellipse cx="297" cy="153" rx="13" ry="20"/><ellipse cx="318" cy="177" rx="11" ry="17"/><ellipse cx="330" cy="202" rx="9" ry="13"/>'
fist='<path d="M158 278 L145 231 Q139 210 157 202 L174 201 L179 169 Q187 145 212 158 Q227 139 248 153 Q272 137 291 157 Q317 149 331 172 L351 216 L348 282 Q342 309 317 317 L221 317 Q199 321 190 301Z" fill="none" stroke="currentColor" stroke-width="13" stroke-linejoin="round"/><path d="M178 203 L184 258 M216 169 L222 251 M254 166 L260 248 M295 176 L301 246 M205 282 Q235 259 285 278 L317 292 M294 294 L293 313" fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>'
hand='<path d="M193 347 L178 283 L139 239 Q126 219 144 210 Q155 207 169 220 L194 241 L188 139 Q188 118 204 118 Q220 118 221 139 L226 215 L230 111 Q232 92 246 95 Q260 96 260 115 L261 215 L270 124 Q273 105 287 110 Q300 114 297 133 L291 222 L305 154 Q309 138 322 143 Q335 147 330 166 L315 284 Q308 323 290 346Z"/>'
arrow='<path d="M256 120 L375 247 L301 247 L301 378 L211 378 L211 247 L137 247Z"/>'
for color,c in COLORS.items():
    for symbol,art in [('foot',foot),('fist',fist),('hand',hand),('arrow',arrow)]:
        for side in ['left','right']:
            flip='translate(512 0) scale(-1 1)' if side=='right' else ''
            tile=f'<rect x="63" y="70" width="386" height="386" rx="26" fill="#060810"/><rect x="63" y="56" width="386" height="386" rx="26" fill="{c}"/><rect x="63" y="56" width="386" height="386" rx="26" fill="url(#tile)"/>'
            save(f'note-{symbol}-{side}-{color}','notes',tile+f'<g transform="{flip}" fill="#090b16" color="#090b16">{art}</g>')
    save(f'pad-active-{color}','pads',f'<path d="M78 66 H434 L475 407 V454 H37 V407Z" fill="#10121d" stroke="#353848" stroke-width="3"/><path d="M78 66 H434 L475 407 H37Z" fill="{c}"/><path d="M78 66 H434 L475 407 H37Z" fill="url(#tile)"/>')
    save(f'impact-ring-{color}','effects',f'<ellipse cx="256" cy="256" rx="208" ry="95" fill="none" stroke="{c}" stroke-width="25" opacity=".55" filter="url(#glow)"/><ellipse cx="256" cy="256" rx="208" ry="95" fill="none" stroke="{c}" stroke-width="8"/>')
    squares=''.join(f'<rect x="{256+math.cos(i*2.4)*(60+i*7):.1f}" y="{256+math.sin(i*2.4)*(60+i*7):.1f}" width="{10+i%4*5}" height="{10+i%4*5}" rx="2" fill="{c}" opacity="{.4+i%5*.12}" transform="rotate({i*17} {256+math.cos(i*2.4)*(60+i*7):.1f} {256+math.sin(i*2.4)*(60+i*7):.1f})"/>' for i in range(22))
    save(f'impact-fragments-{color}','effects',squares)
    save(f'wall-{color}','obstacles',f'<rect x="50" y="32" width="412" height="448" fill="{c}" opacity=".12"/><rect x="50" y="32" width="412" height="448" fill="none" stroke="{c}" stroke-width="16" opacity=".6" filter="url(#glow)"/><rect x="50" y="32" width="412" height="448" fill="none" stroke="#fff" stroke-width="4"/>')
save('pad-idle','pads','<path d="M78 66 H434 L475 407 V454 H37 V407Z" fill="#11121b" stroke="#3d404d" stroke-width="3"/><path d="M78 66 H434 L475 407 H37Z" fill="#20212c" stroke="#414350" stroke-width="3"/>')
save('track-transparent','track','<path d="M890 420 L120 1080 H1800 L1030 420Z" fill="#04080d"/><path d="M890 420 L120 1080" stroke="#23e5ed" stroke-width="8"/><path d="M1030 420 L1800 1080" stroke="#f54fce" stroke-width="8"/>',1920,1080)

# Human pose diagrams: source art for the instruction panel, not tracking output.
poses={'neutral':[(195,225),(174,303),(163,355),(317,225),(338,303),(350,355),(226,345),(208,418),(199,477),(286,345),(304,418),(313,477)],
'arms-up':[(195,225),(168,168),(168,98),(317,225),(344,168),(344,98),(226,345),(222,418),(218,477),(286,345),(290,418),(294,477)],
'punch-left':[(195,225),(141,226),(115,206),(317,225),(329,283),(301,298),(226,345),(214,418),(204,477),(286,345),(298,418),(308,477)],
'punch-right':[(195,225),(183,283),(211,298),(317,225),(371,226),(397,206),(226,345),(214,418),(204,477),(286,345),(298,418),(308,477)],
'squat':[(195,225),(168,274),(148,303),(317,225),(344,274),(364,303),(226,345),(175,385),(153,445),(286,345),(337,385),(359,445)],
'step-left':[(195,225),(179,278),(170,330),(317,225),(333,278),(342,330),(226,345),(183,408),(133,467),(286,345),(296,415),(302,477)],
'step-right':[(195,225),(179,278),(170,330),(317,225),(333,278),(342,330),(226,345),(216,415),(210,477),(286,345),(329,408),(379,467)]}
for name,p in poses.items():
    limbs=''.join(f'<polyline points="{p[i][0]},{p[i][1]} {p[i+1][0]},{p[i+1][1]} {p[i+2][0]},{p[i+2][1]}"/>' for i in range(0,12,3))
    figure='<circle cx="256" cy="158" r="37"/><path d="M228 198 L195 225 L219 345 L293 345 L317 225 L284 198Z"/>'+limbs
    save('pose-'+name,'guides',f'<g fill="#06070c" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">{figure}</g>',512,512,'Figura esquemática propia; requiere refinamiento de silueta respecto del video.')
save('guide-panel','guides','<rect x="8" y="8" width="304" height="544" fill="#090b0d" stroke="#94989e" stroke-width="4"/>',320,560)
for word,c in [('NICE','#23e5ed'),('GREAT','#5cff9e'),('AWESOME','#ff744c'),('UNSTOPPABLE','#aa80ff'),('PERFECT','#fff23c'),('MISS','#ff4567')]:
    save('rating-'+word.lower(),'hud',f'<g transform="rotate(-6 400 80)"><rect x="18" y="25" width="764" height="105" fill="#070912" stroke="{c}" stroke-width="4"/><text x="400" y="98" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="{56 if len(word)>10 else 72}" fill="{c}">{word}</text></g>',800,160,'Reconstrucción propia; PERFECT/MISS son recursos propuestos para el futuro feedback, no confirmados en el muestreo.')
for digit in range(10):
    save(f'digit-{digit}','hud',f'<text x="96" y="205" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-style="italic" font-size="220" fill="#fff">{digit}</text>',192,256)

def background(theme):
    body='<rect width="1920" height="1080" fill="#060610"/><rect y="490" width="1920" height="590" fill="#090d17"/>'
    for i in range(95):
        x=(i*347)%1920; y=(i*113)%650
        body+=f'<circle cx="{x}" cy="{y}" r="{1+i%3}" fill="#b1cbec" opacity=".45"/>'
    for i in reversed(range(20)):
        s=1/(1+i*.22); cx=960; cy=480; r=1010*s
        c=list(COLORS.values())[i%4]
        if theme=='fairground':
            path=f'M{cx-r} 1000 V{cy} A{r} {r} 0 0 1 {cx+r} {cy} V1000'
        else:
            points=[]
            for k in range(97):
                a=math.pi+k*math.pi/96
                rr=r*(1+.045*math.sin(a*(16 if theme=='gears' else 10)))
                points.append(f'{cx+math.cos(a)*rr:.1f},{cy+math.sin(a)*rr:.1f}')
            path='M'+ ' L'.join(points)
        body+=f'<path d="{path}" fill="none" stroke="{c}" stroke-width="{max(2,14*s)}" opacity=".4" filter="url(#glow)"/><path d="{path}" fill="none" stroke="{c}" stroke-width="{max(1,4*s)}"/>'
        for side in [-1,1]:
            x=cx+side*r*1.16; y=cy+35*s
            if theme=='fairground':
                body+=f'<circle cx="{x}" cy="{y}" r="{r*.2}" fill="none" stroke="{c}" stroke-width="2"/>'
                for k in range(12):
                    a=k*math.tau/12
                    body+=f'<path d="M{x} {y} L{x+math.cos(a)*r*.2} {y+math.sin(a)*r*.2}" stroke="{c}" stroke-width="1"/>'
                body+=f'<path d="M{x-r*.15} {y+r*.4} L{x} {y+r*.2} L{x+r*.15} {y+r*.4}Z" fill="{c}" opacity=".4"/>'
            elif theme=='diamonds':
                body+=f'<path d="M{x} {y-r*.16} L{x-r*.12} {y} L{x} {y+r*.19} L{x+r*.12} {y}Z M{x-r*.12} {y} H{x+r*.12} M{x} {y-r*.16} V{y+r*.19}" fill="none" stroke="{c}" stroke-width="2"/>'
            else:
                body+=f'<circle cx="{x}" cy="{y}" r="{r*.22}" stroke="{c}" stroke-width="{12*s}" stroke-dasharray="{10*s} {7*s}" fill="none"/><circle cx="{x}" cy="{y}" r="{r*.07}" stroke="{c}" stroke-width="2" fill="none"/>'
    body+='<path d="M904 480 L150 1080 H1770 L1016 480Z" fill="#02060a"/><path d="M904 480 L150 1080" stroke="#23e5ed" stroke-width="6"/><path d="M1016 480 L1770 1080" stroke="#f54fce" stroke-width="6"/>'
    return body
for theme in ['fairground','diamonds','gears']:
    save('background-'+theme,'backgrounds',background(theme),1920,1080,'Estudio estático de perspectiva v001; geometría propia. Pendientes reflejos y loop animado.')

# Símbolos sin placa para composición y proyección independientes.
for symbol,art in [('foot',foot),('fist',fist),('hand',hand)]:
    for side in ['left','right']:
        flip='translate(512 0) scale(-1 1)' if side=='right' else ''
        save(f'icon-{symbol}-{side}','icons',f'<g transform="{flip}" fill="#080a12" color="#080a12">{art}</g>')
for color,c in COLORS.items():
    save(f'trail-{color}','effects',f'<defs><linearGradient id="fade" x1="0" y1="1" x2="0" y2="0"><stop stop-color="{c}" stop-opacity=".75"/><stop offset="1" stop-color="{c}" stop-opacity="0"/></linearGradient></defs><path d="M190 0 H322 L414 512 H98Z" fill="url(#fade)"/>')
    save(f'flash-{color}','effects',f'<circle cx="256" cy="256" r="64" fill="{c}" filter="url(#glow)"/><path d="M256 40 L277 225 L472 256 L277 277 L256 472 L235 277 L40 256 L235 225Z" fill="{c}"/><circle cx="256" cy="256" r="28" fill="white"/>')
    save(f'note-pair-feet-{color}','pairs',f'<rect x="28" y="30" width="968" height="452" rx="24" fill="{c}"/><g transform="translate(0 0)" fill="#090b16">{foot}</g><g transform="translate(1024 0) scale(-1 1)" fill="#090b16">{foot}</g>',1024,512)
    save(f'note-pair-fists-{color}','pairs',f'<rect x="28" y="30" width="968" height="452" rx="24" fill="{c}"/><g color="#090b16">{fist}</g><g transform="translate(1024 0) scale(-1 1)" color="#090b16">{fist}</g>',1024,512)
controls={'pause':'<path d="M176 136 H230 V376 H176Z M282 136 H336 V376 H282Z"/>',
'play':'<path d="M188 128 L388 256 L188 384Z"/>',
'back':'<path d="M290 126 L160 256 L290 386 L326 350 L232 256 L326 162Z"/>',
'camera':'<rect x="110" y="170" width="292" height="216" rx="28"/><path d="M172 170 L199 125 H313 L340 170Z"/><circle cx="256" cy="275" r="67" fill="#101827"/><circle cx="256" cy="275" r="44"/>',
'audio':'<path d="M112 213 H178 L272 137 V375 L178 299 H112Z"/><path d="M315 187 Q386 256 315 325 M348 140 Q460 256 348 372" fill="none" stroke="white" stroke-width="20"/>',
'retry':'<path d="M355 171 A145 145 0 1 0 395 290" fill="none" stroke="white" stroke-width="30"/><path d="M299 177 L391 205 L387 111Z"/>'}
for name,art in controls.items():
    save('control-'+name,'interface',f'<rect x="32" y="32" width="448" height="448" rx="80" fill="#101827" stroke="#31e3ed" stroke-width="5"/><g fill="white">{art}</g>')
for name,title,subtitle in [('ready','PREPÁRATE','Cuerpo completo dentro de la cámara'),('go','¡VAMOS!','Sigue el ritmo'),('paused','PAUSA','Respira y vuelve cuando estés listo'),('complete','¡SESIÓN COMPLETA!','Revisa tus resultados'),('camera-lost','NO TE VEMOS','Vuelve al encuadre'),('move-back','DA UN PASO ATRÁS','Necesitamos ver tus manos y pies')]:
    save('card-'+name,'interface',f'<rect x="8" y="8" width="1264" height="344" rx="32" fill="#0c1220" stroke="#32e5eb" stroke-width="4"/><text x="640" y="166" text-anchor="middle" font-family="Arial,sans-serif" font-size="{64 if len(title)>20 else 80}" font-weight="900" fill="#fff">{title}</text><text x="640" y="250" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#a8bfd8">{subtitle}</text>',1280,360,'Recurso de interfaz propuesto para la adaptación; texto español. No implementa su comportamiento.')
save('calibration-body-frame','interface','<path d="M72 152 V72 H172 M852 72 H952 V152 M952 872 V952 H852 M172 952 H72 V872" fill="none" stroke="#39e4ed" stroke-width="8"/><path d="M312 800 L460 800 M564 800 L712 800" stroke="#f455cb" stroke-width="12"/>',1024,1024)
save('combo-label','hud','<text x="256" y="75" text-anchor="middle" font-family="Arial,sans-serif" font-size="50" letter-spacing="14" fill="white">COMBO</text>',512,100)

OUT.mkdir(parents=True,exist_ok=True)
(OUT/'manifest.json').write_text(json.dumps({'version':'v001','stage':'primer lote vectorial, revisión pendiente','assets':items},ensure_ascii=False,indent=2),encoding='utf-8')
cards=[]
for item in items:
    cards.append(f'<article data-category="{item["category"]}"><a href="{item["path"]}" target="_blank"><img loading="lazy" src="{item["path"]}" alt="{item["id"]}"></a><h3>{item["id"]}</h3><p>{item["width"]} × {item["height"]} · SVG · {item["bytes"]:,} B</p><p>{html.escape(item["note"])}</p><a download href="{item["path"]}">Descargar SVG ↗</a></article>')
page='''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Rhythm Lab · Biblioteca de assets</title><style>*{box-sizing:border-box}body{margin:0;background:#090d16;color:#ecf1ff;font:15px system-ui}header,main{max-width:1500px;margin:auto;padding:32px}header{border-bottom:1px solid #293145}h1{font-size:clamp(32px,5vw,64px);margin:8px 0}header p{max-width:850px;line-height:1.7;color:#b7c3d8}.eyebrow{color:#33e2e8;letter-spacing:.2em;font-size:12px}nav{display:flex;gap:8px;flex-wrap:wrap;margin:24px 0}button,input{padding:12px 16px;border:1px solid #39465e;border-radius:8px;background:#131d2c;color:white}button{cursor:pointer}button[aria-pressed=true]{background:#24d7df;color:#031014}input{width:min(100%,560px)}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:18px}article{background:#121a27;border:1px solid #27334a;border-radius:12px;padding:16px;overflow:hidden}article img{width:100%;height:220px;object-fit:contain;background:repeating-conic-gradient(#202936 0% 25%,#18212f 0% 50%) 50%/24px 24px;border-radius:6px}article h3{overflow-wrap:anywhere;font-size:15px}article p{color:#aab9cf;font-size:13px;line-height:1.6}a{color:#63e9ed}article[hidden]{display:none}.notice{padding:14px 18px;border:1px solid #77642f;background:#332c19;border-radius:8px}.count{color:#98aec7;margin:20px 0}footer{padding:32px;color:#9fb0cb}</style><header><span class="eyebrow">DEVIN VIBETHON / ART RESOURCES</span><h1>Rhythm Lab</h1><p>Biblioteca local de recursos gráficos para el prototipo de cardio. Reconstrucciones propias a partir del análisis visual de STAY ON BEAT #18. Abre cada imagen para verla a tamaño completo.</p><div class="notice">Primer lote v001 · revisión artística pendiente. Todavía faltan el análisis denso de la referencia, fondos animados, exportaciones PNG y audio. Esta página es un catálogo de recursos; no implementa el videojuego.</div></header><main><input id="search" aria-label="Buscar recursos" placeholder="Buscar puños, pads, colores…"><nav id="categories"></nav><div class="count" id="count"></div><div class="grid">'''+''.join(cards)+'''</div></main><footer>Archivos editables locales · <a href="manifest.json">Manifiesto JSON</a> · <a href="../../index.md">Wiki del proyecto</a></footer><script>const cards=[...document.querySelectorAll('article')],nav=document.querySelector('#categories');let category='all';for(const value of ['all',...new Set(cards.map(c=>c.dataset.category))]){const b=document.createElement('button');b.textContent=value==='all'?'Todos':value;b.setAttribute('aria-pressed',value===category);b.onclick=()=>{category=value;[...nav.children].forEach(x=>x.setAttribute('aria-pressed',x===b));filter()};nav.append(b)}function filter(){let n=0;for(const c of cards){c.hidden=!(category==='all'||c.dataset.category===category)||!c.textContent.toLowerCase().includes(document.querySelector('#search').value.toLowerCase());if(!c.hidden)n++}document.querySelector('#count').textContent=n+' recursos visibles de '+cards.length}document.querySelector('#search').oninput=filter;filter();</script></html>'''
(OUT/'index.html').write_text(page,encoding='utf-8')
print(f'{len(items)} SVG y biblioteca creados en {OUT}')
