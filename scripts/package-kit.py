from pathlib import Path
import json,zipfile,re
R=Path(__file__).resolve().parents[1];D=R/'assets/v001'
m=json.loads((D/'manifest.json').read_text(encoding='utf-8'))
files={'manifest.json','audit.json','README.md'}
for a in m['assets']:
    files.add(a['path'])
    for key in ['png','poster']:
        if a.get(key):files.add(a[key])
page=(D/'index.html').read_text(encoding='utf-8')
page=re.sub(r'<footer>.*?</footer>','<footer>Kit autónomo v001 · <a href="README.md">Guía de uso y procedencia</a> · <a href="manifest.json">Manifiesto de recursos</a> · Las capturas y documentación del análisis están en el proyecto Obsidian original.</footer>',page,flags=re.S)
out=R/'deliverables/ritmo-cardio-assets-v001.zip';out.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    z.writestr('index.html',page)
    for f in sorted(files):z.write(D/f,f)
with zipfile.ZipFile(out) as z:
    bad=z.testzip()
    if bad:raise ValueError('Corrupt ZIP '+bad)
    names=set(z.namelist())
    if not files.issubset(names):raise ValueError('Missing package entries')
print(out, out.stat().st_size,'bytes;',len(files)+1,'archivos; ZIP íntegro')
