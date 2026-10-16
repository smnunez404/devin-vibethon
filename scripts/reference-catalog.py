from pathlib import Path
from PIL import Image,ImageStat,ImageDraw
import json,html,math
R=Path(__file__).resolve().parents[1]/'raw/reference'
frames=[]
for p in (R/'frames').glob('detail-*.jpg'):
    time=float(p.stem.removeprefix('detail-').replace('-','.'))
    im=Image.open(p).convert('RGB');w,h=im.size
    mean=ImageStat.Stat(im.crop((int(w*.2),70,int(w*.8),min(230,h//2)))).mean
    frames.append(dict(file='frames/'+p.name,time=time,mean=mean,usable=max(mean)>3))
frames.sort(key=lambda a:a['time'])
usable=[f for f in frames if f['usable']]
(R/'dense-index.json').write_text(json.dumps({'method':'Capturas del navegador con saltos de cinco segundos. Tiempo nominal leído del DOM; puede haber retardo del frame visible durante búsqueda. No es extracción del archivo original.','usableCount':len(usable),'frames':frames},indent=2,ensure_ascii=False),encoding='utf-8')
for page in range(math.ceil(len(usable)/24)):
    group=usable[page*24:(page+1)*24];out=Image.new('RGB',(1200,200*math.ceil(len(group)/4)),(9,14,22));draw=ImageDraw.Draw(out)
    for i,f in enumerate(group):
        im=Image.open(R/f['file']);im.thumbnail((300,175));x=(i%4)*300;y=(i//4)*200;out.paste(im,(x,y));draw.text((x+8,y+177),f'{f["time"]:.3f} s (nominal)',fill='white')
    out.save(R/f'dense-contact-{page+1:02d}.jpg')
cards=''.join(f'<figure><a href="{html.escape(f["file"])}"><img loading="lazy" src="{html.escape(f["file"])}" alt="Referencia a {f["time"]:.3f} segundos"></a><figcaption>{int(f["time"]//60):02d}:{f["time"]%60:06.3f} · tiempo nominal</figcaption></figure>' for f in usable)
(R/'index.html').write_text('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Referencia · muestreo visual</title><style>body{background:#090e18;color:#dbe6f6;font:16px system-ui;margin:30px}p{max-width:1000px;line-height:1.6}.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}figure{margin:0;padding:10px;background:#182335}img{width:100%}figcaption{padding:10px}a{color:#5ce6ee}</style><h1>STAY ON BEAT #18 · evidencia visual</h1><p>'+str(len(usable))+' capturas utilizables del muestreo denso. Conservan el marco del navegador. Las marcas de tiempo son nominales y pueden tener retardo durante la búsqueda; no usarlas para un beatmap. Las capturas pertenecen al video de referencia de Liam Fitness y se preservan para análisis, fuera del kit gráfico propio.</p><p><a href="../../assets/v001/index.html">Volver a biblioteca de recursos</a> · <a href="dense-index.json">Índice y metodología</a></p><div class="grid">'+cards+'</div></html>',encoding='utf-8')
print('Capturas utilizables:',len(usable),'de',len(frames))
