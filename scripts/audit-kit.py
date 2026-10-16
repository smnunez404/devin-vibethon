from pathlib import Path
from PIL import Image,ImageStat,ImageChops
import json,wave,hashlib,subprocess,numpy as np
R=Path(__file__).resolve().parents[1];D=R/'assets/v001'
m=json.loads((D/'manifest.json').read_text(encoding='utf-8'));errors=[];report=[]
for a in m['assets']:
    p=D/a['path']
    if not p.exists():errors.append('Missing '+a['path']);continue
    a['bytes']=p.stat().st_size;a['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
    if a['format']=='SVG':
        png=p.with_suffix('.png')
        if not png.exists():errors.append('Missing PNG '+str(png));continue
        im=Image.open(png)
        if im.size!=(a['width'],a['height']):errors.append('Size '+a['id'])
        rgba=im.convert('RGBA');alpha=rgba.getchannel('A').getextrema()
        if a.get('alpha') and alpha[0]!=0:errors.append('No transparent pixels '+a['id'])
        if alpha[1]==0:errors.append('Empty '+a['id'])
        a['png']=png.relative_to(D).as_posix();a['pngBytes']=png.stat().st_size;a['pivot']=[.5,.5];a['colorSpace']='sRGB'
        report.append(dict(id=a['id'],format='PNG',size=im.size,alpha=alpha))
    elif a['format']=='WAV':
        with wave.open(str(p),'rb') as w:
            samples=np.frombuffer(w.readframes(w.getnframes()),dtype='<i2')
            peak=int(np.abs(samples.astype(np.int32)).max());duration=len(samples)/w.getframerate()
            if peak==0 or peak>=32767:errors.append('Silent/clipped '+a['id'])
            report.append(dict(id=a['id'],format='WAV',duration=duration,peak=peak,rms=float(np.sqrt(np.mean(samples.astype(float)**2)))))
    elif a['format']=='MP4':
        ffmpeg=R/'.tools/media/bin/ffmpeg.exe'
        process=subprocess.run([str(ffmpeg),'-v','error','-i',str(p),'-vf','scale=160:90','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True,check=True)
        frames=np.frombuffer(process.stdout,dtype=np.uint8).reshape(-1,90,160,3).astype(float)
        adj=np.mean(np.abs(np.diff(frames,axis=0)),axis=(1,2,3));seam=float(np.abs(frames[0]-frames[-1]).mean())
        report.append(dict(id=a['id'],format='MP4',decodedFrames=len(frames),meanAdjacentDelta=float(adj.mean()),seamDelta=seam,seamToMeanRatio=seam/float(adj.mean())))
        if len(frames)!=240:errors.append('Frame count '+a['id'])
        if float(adj.mean())<.01:errors.append('Static video '+a['id'])
        if seam>float(adj.mean())*5:errors.append('Large seam '+a['id'])
out={'assets':len(m['assets']),'errors':errors,'checks':report,'scope':'Integridad, dimensiones, alfa, picos de audio y movimiento/costura. No sustituye revisión visual o escucha.'}
(D/'audit.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
(D/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
print('Assets:',len(m['assets']),'Errors:',errors)
for r in report:
    if r['format']=='MP4':print(r)
if errors:raise SystemExit(1)
