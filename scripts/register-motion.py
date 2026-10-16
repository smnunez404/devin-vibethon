from pathlib import Path
import json,subprocess
R=Path(__file__).resolve().parents[1]
D=R/'assets/v001'
ffmpeg=R/'.tools/media/bin/ffmpeg.exe'
ffprobe=R/'.tools/media/bin/ffprobe.exe'
m=json.loads((D/'manifest.json').read_text(encoding='utf-8'))
m['assets']=[a for a in m['assets'] if a['format']!='MP4']
for theme in ['fairground','diamonds','gears']:
    p=D/'backgrounds'/f'loop-{theme}.mp4'
    if not p.exists():continue
    result=subprocess.run([str(ffprobe),'-v','error','-show_streams','-show_format','-of','json',str(p)],capture_output=True,text=True,check=True)
    data=json.loads(result.stdout);v=next(s for s in data['streams'] if s['codec_type']=='video')
    if int(v['nb_frames'])!=240 or abs(float(data['format']['duration'])-8)>.01:raise ValueError('Unexpected render length: '+theme)
    poster=p.with_suffix('.jpg')
    subprocess.run([str(ffmpeg),'-y','-i',str(p),'-frames:v','1','-q:v','2',str(poster)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,check=True)
    m['assets'].append(dict(id=f'loop-{theme}',category='motion',path=p.relative_to(D).as_posix(),poster=poster.relative_to(D).as_posix(),format='MP4',width=int(v['width']),height=int(v['height']),duration=8,fps=30,frames=240,bytes=p.stat().st_size,alpha=False,note='Fondo original en perspectiva, bucle de 8 s sin audio ni notas. Primera versión; geometría simplificada frente al referente.',provenance='Composición HyperFrames local en videos/neon-'+('tunnel' if theme=='fairground' else theme)))
    (D/'backgrounds'/f'loop-{theme}-probe.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
(D/'manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2),encoding='utf-8')
print('Loops registrados:',sum(a['format']=='MP4' for a in m['assets']))
