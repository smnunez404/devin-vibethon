"""Síntesis determinista de recursos WAV propios. No extrae música de terceros."""
from pathlib import Path
import math,random,struct,wave,json
R=Path(__file__).resolve().parents[1]/'assets/v001'
D=R/'audio'; D.mkdir(exist_ok=True)
RATE=44100
rng=random.Random(18)
assets=[]
def write(name,data,description,bpm=None):
    peak=max(max(map(abs,data)),1)
    data=[max(-.95,min(.95,x/peak*.8)) for x in data]
    path=D/(name+'.wav')
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h',int(x*32767)) for x in data))
    assets.append(dict(id=name,category='audio',path='audio/'+path.name,format='WAV',bytes=path.stat().st_size,duration=len(data)/RATE,sampleRate=RATE,channels=1,note=description,provenance='Síntesis original mediante scripts/build-audio.py',bpm=bpm))
def sound(length,freq,decay=15,kind='sine',end=None):
    data=[];phase=0
    for i in range(round(length*RATE)):
        t=i/RATE; f=freq if end is None else end+(freq-end)*math.exp(-t*25)
        phase+=math.tau*f/RATE
        s=rng.uniform(-1,1) if kind=='noise' else math.sin(phase)
        data.append(s*math.exp(-t*decay)*min(1,t*800))
    return data
for name,freq,end in [('hit-foot',180,55),('hit-hand',420,150),('ui-click',900,700),('miss',140,65),('countdown',880,880)]:
    write(name,sound(.22,freq,19,end=end),'Efecto sintético corto de feedback; volumen ajustable al integrarlo.')
data=[0.0]*int(.8*RATE)
for offset,freq in [(0,523.25),(.12,659.25),(.24,783.99)]:
    chunk=sound(.45,freq,8)
    for j,v in enumerate(chunk):
        if int(offset*RATE)+j<len(data):data[int(offset*RATE)+j]+=v*.6
write('combo-up',data,'Arpegio ascendente de feedback.')
data=[0.0]*int(1.5*RATE)
for offset,freq in [(0,523.25),(.18,659.25),(.36,783.99),(.54,1046.5)]:
    for j,v in enumerate(sound(.8,freq,5)):
        if int(offset*RATE)+j<len(data):data[int(offset*RATE)+j]+=v*.5
write('session-complete',data,'Arpegio de cierre de sesión propuesto.')
bpm=120; beat=60/bpm; duration=16
data=[0.0]*int(duration*RATE)
def mix(at,chunk,gain):
    for j,v in enumerate(chunk):data[(int(at*RATE)+j)%len(data)]+=v*gain
for b in range(32):
    mix(b*beat,sound(.3,180,20,end=48),.65)
    if b%2:mix(b*beat,sound(.16,0,28,kind='noise'),.18)
    for sub in [0,.25]:mix(b*beat+sub,sound(.05,0,75,kind='noise'),.07)
    freq=[130.81,130.81,155.56,116.54][b//8]
    mix(b*beat,sound(.3,freq,12),.2)
write('cardio-bed-120bpm',data,'Loop rítmico provisional original: 8 compases de 4/4, 120 BPM, 16 s. No es la canción de referencia.',bpm)
manifest=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if a['category']!='audio']+assets
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(len(assets),'WAV creados')
