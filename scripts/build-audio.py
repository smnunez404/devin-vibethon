"""Síntesis determinista de recursos WAV propios e instrumentales libres de derechos."""
from pathlib import Path
import math,random,struct,wave,json,shutil
ROOT=Path(__file__).resolve().parents[1]
R=ROOT/'assets/v001'
D=R/'audio'; D.mkdir(exist_ok=True)
PUBLIC_AUDIO=ROOT/'app/public/assets/v001/audio'
PUBLIC_AUDIO.mkdir(parents=True,exist_ok=True)
RATE=44100
rng=random.Random(18)
assets=[]
def write(name,data,description,bpm=None):
    peak=max(max(map(abs,data)),1)
    data=[max(-.95,min(.95,x/peak*.82)) for x in data]
    path=D/(name+'.wav')
    raw_bytes=b''.join(struct.pack('<h',int(x*32767)) for x in data)
    with wave.open(str(path),'wb') as w:
        w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE)
        w.writeframes(raw_bytes)
    shutil.copyfile(path,PUBLIC_AUDIO/path.name)
    assets.append(dict(id=name,category='audio',path='audio/'+path.name,format='WAV',bytes=path.stat().st_size,duration=len(data)/RATE,sampleRate=RATE,channels=1,note=description,provenance='Síntesis instrumental mediante scripts/build-audio.py',bpm=bpm))
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
bpm=120; beat=60/bpm; total_beats=64; duration=total_beats*beat
data=[0.0]*int(duration*RATE)
def mix(at,chunk,gain):
    start=int(round(at*RATE))
    n=len(data)
    for j,v in enumerate(chunk):
        idx=(start+j)%n
        data[idx]+=v*gain

def kick_chunk():
    length=0.36; out=[]; phase=0.0
    for i in range(int(length*RATE)):
        t=i/RATE
        f=46.0+135.0*math.exp(-t*34.0)+220.0*math.exp(-t*140.0)
        phase+=math.tau*f/RATE
        sub=math.sin(phase)+0.35*math.sin(phase*2)
        click=(rng.uniform(-1,1)*0.5+math.sin(t*math.tau*1400))*math.exp(-t*180.0)
        env=math.exp(-t*10.5)*min(1.0,t*1200.0)
        out.append(math.tanh((sub*env+click*0.4)*1.35))
    return out

def clap_chunk():
    length=0.22; out=[]; phase=0.0
    for i in range(int(length*RATE)):
        t=i/RATE
        phase+=math.tau*(210+90*math.exp(-t*40))/RATE
        burst=1.0 if (t<0.012 or (0.018<t<0.028) or t>=0.034) else 0.25
        noise=rng.uniform(-1,1)*burst*math.exp(-t*19.0)
        body=math.sin(phase)*math.exp(-t*28.0)*0.45
        out.append(noise*0.75+body)
    return out

def hat_chunk(open_hat=False):
    length=0.22 if open_hat else 0.065
    decay=14.0 if open_hat else 55.0
    out=[]
    for i in range(int(length*RATE)):
        t=i/RATE
        metallic=(math.sin(t*math.tau*6340)+math.sin(t*math.tau*8910)+rng.uniform(-1,1)*1.4)/3.4
        out.append(metallic*math.exp(-t*decay)*min(1.0,t*1500.0))
    return out

def bass_note(freq,length=0.46,accent=False):
    out=[]; p1=0.0; p2=0.0
    for i in range(int(length*RATE)):
        t=i/RATE
        p1+=math.tau*freq/RATE
        p2+=math.tau*(freq*2.003)/RATE
        # Sidechain pump: duck at t=0 (kick), swell at t=0.22s
        sc=0.22+0.78*(1.0-math.exp(-t*16.0))
        saw=(2.0*((p1/math.tau)%1.0)-1.0)*0.45
        sub=math.sin(p1)*0.85
        harm=math.sin(p2)*(0.55 if accent else 0.3)*math.exp(-t*6.0)
        env=math.exp(-t*4.2)*min(1.0,t*400.0)
        out.append(math.tanh((sub+saw+harm)*env*sc*1.3))
    return out

def synth_chord(freqs,length=0.45,stab=False):
    out=[]; phases=[0.0]*(len(freqs)*2)
    detunes=[0.996,1.004]
    for i in range(int(length*RATE)):
        t=i/RATE
        sc=1.0 if stab else (0.3+0.7*(1.0-math.exp(-t*14.0)))
        env=math.exp(-t*(7.5 if stab else 3.2))*min(1.0,t*500.0)
        s=0.0
        for k,f in enumerate(freqs):
            for d_idx,det in enumerate(detunes):
                idx=k*2+d_idx
                phases[idx]+=math.tau*(f*det)/RATE
                ph=(phases[idx]/math.tau)%1.0
                s+=(2.0*ph-1.0)*0.35+math.sin(phases[idx])*0.65
        out.append((s/max(1,len(phases)))*env*sc)
    return out

def arp_note(freq,length=0.23):
    out=[]; p1=0.0; p2=0.0
    for i in range(int(length*RATE)):
        t=i/RATE
        p1+=math.tau*freq/RATE
        p2+=math.tau*(freq*1.5)/RATE
        env=math.exp(-t*11.0)*min(1.0,t*900.0)
        sig=math.sin(p1)*0.7+math.sin(p1*2)*0.35*math.exp(-t*18.0)+math.sin(p2)*0.2
        out.append(sig*env)
    return out

def riser_sweep(length=0.95):
    out=[]; phase=0.0
    for i in range(int(length*RATE)):
        t=i/RATE; p=t/length
        f=260.0+980.0*(p*p)
        phase+=math.tau*f/RATE
        out.append((math.sin(phase)*0.6+rng.uniform(-1,1)*0.4)*(p*p)*0.8)
    return out

def impact_drop(length=0.75):
    out=[]; phase=0.0
    for i in range(int(length*RATE)):
        t=i/RATE
        f=52.0+160.0*math.exp(-t*7.5)
        phase+=math.tau*f/RATE
        crash=rng.uniform(-1,1)*math.exp(-t*5.5)*0.45
        boom=math.sin(phase)*math.exp(-t*3.8)*0.85
        out.append(math.tanh((boom+crash)*1.3))
    return out

kick=kick_chunk()
clap=clap_chunk()
hat_c=hat_chunk(False)
hat_o=hat_chunk(True)
riser=riser_sweep(beat*1.9)
drop_fx=impact_drop(beat*1.5)

# Progresión electrónica en Do menor (Cm - Ab - Eb - Bb) sincronizada con el lead-in de 4 beats (2.0 s).
# songBeat b = 0 ocurre exactamente en audioBeat = 4 (t = 2.0 s).
chords=[
    (65.41,[261.63,311.13,392.00],[523.25,622.25,783.99,622.25]), # Cm
    (51.91,[207.65,261.63,311.13],[415.30,523.25,622.25,783.99]), # Ab
    (77.78,[311.13,392.00,466.16],[622.25,783.99,932.33,783.99]), # Eb
    (58.27,[233.08,293.66,349.23],[466.16,587.33,698.46,932.33]), # Bb
]

for sb in range(total_beats):
    # sb es el beat del beatmap (songTime = sb * beat); en el archivo cae en (sb + 4) % total_beats
    ab=(sb+4)%total_beats
    t=ab*beat
    pos=sb%8
    bar=(sb//8)%4
    root,triad,arp=chords[bar]

    # 1. Batería EDM (4-on-the-floor + clap en 2 y 4 + hi-hats en semicorcheas)
    mix(t,kick,0.72)
    if pos%2==1:
        mix(t,clap,0.42)
    mix(t+beat*0.5,hat_o,0.20)
    for sub in [0.25,0.75]:
        mix(t+beat*sub,hat_c,0.11)

    # 2. Bajo electrónico con acento en los pasos de pie (pos 2 y 6) y en el inicio de compás
    is_foot=(pos==2 or pos==6)
    mix(t,bass_note(root*(1.5 if is_foot else 1.0),beat*0.92,accent=is_foot),0.44 if is_foot else 0.36)
    mix(t+beat*0.5,bass_note(root*2.0,beat*0.45,accent=False),0.26)

    # 3. Acordes supersaw + stabs sincronizados con golpes dobles (pos 4) e inicio de frase (pos 0)
    if pos in (0,2,4,6):
        is_stab=(pos==4)
        mix(t,synth_chord(triad,beat*(0.85 if is_stab else 0.95),stab=is_stab),0.34 if is_stab else 0.24)
        if is_stab:
            mix(t,clap,0.30)

    # 4. Arpegio melódico electrónico en corcheas (guía rítmica constante para manos y pies)
    n1=arp[pos%4]
    n2=arp[(pos+1)%4]*(1.5 if bar>=2 and pos%2==1 else 1.0)
    mix(t,arp_note(n1,beat*0.48),0.22)
    mix(t+beat*0.5,arp_note(n2,beat*0.48),0.19)

    # 5. Riser antes del obstáculo (pos 5-6) e impacto en el obstáculo (pos 7) y el drop (pos 0)
    if pos==5:
        mix(t,riser,0.22)
    if pos==6:
        # Redoble de caja avisando el obstáculo que cruza en pos 7
        for r_sub in [0.25,0.5,0.75]:
            mix(t+beat*r_sub,clap,0.22)
    if pos==7:
        mix(t,drop_fx,0.38)
        mix(t,synth_chord([f*2 for f in triad],beat*0.9,stab=True),0.28)

write('cardio-bed-120bpm',data,'Pista electrónica cardio original (EDM 120 BPM, 64 beats / 32 s, sincronizada con frases de manos, pies, dobles y obstáculos).',bpm)

# Registrar también el catálogo de 24 canciones de estudio libres de derechos (CC-BY 4.0 Kevin MacLeod / Incompetech)
studio_catalog=[
    # 12 Electro / Beat Fever / Synth-Pop
    ('edm-detection-mode','edm-detection-mode.mp3',128,60.0,'EDM Detection Mode — Club Electro (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('laserpack','laserpack.mp3',128,60.0,'Laserpack — Electro House (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('raving-energy','raving-energy.mp3',122,62.95,'Raving Energy — Festival Anthem (122 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('raving-energy-faster','raving-energy-faster.mp3',134,57.3,'Raving Energy (Overdrive Remix) (134 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('realizer','realizer.mp3',125,61.4,'Realizer — Progressive Dance (125 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('brain-dance','brain-dance.mp3',124,61.9,'Brain Dance — Dark Electro-Pop (124 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('voltaic','voltaic.mp3',120,64.0,'Voltaic — Synthwave Cyber-Beat (120 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('eighties-action','eighties-action.mp3',132,58.18,'Eighties Action — 80s Dance-Pop (132 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('kick-shock','kick-shock.mp3',138,50.6,'Kick Shock — Lead Synth Pop-Dance (138 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('shiny-tech','shiny-tech.mp3',138,55.7,'Shiny Tech — Hyper Techno-Pop (138 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('club-diver','club-diver.mp3',140,54.9,'Club Diver — Euro Electro-Club (140 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('neon-laser-horizon','neon-laser-horizon.mp3',160,48.0,'Neon Laser Horizon — Fast Synth-Wave (160 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    # 12 Rock / Guitar Hero / Indie-Punk
    ('cool-rock','cool-rock.mp3',128,60.0,'Cool Rock — Stadium Guitar Rock (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('hotrock','hotrock.mp3',124,61.94,'Hotrock — Glam & Brass Power Rock (124 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('neolith','neolith.mp3',145,52.97,'Neolith — Punk-Rock Dual Guitars (145 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('nonstop','nonstop.mp3',128,60.0,'Nonstop — Indie Dance-Rock (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('harmful-or-fatal','harmful-or-fatal.mp3',135,56.9,'Harmful or Fatal — Fast J-Rock Guitar (135 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('professor-umlaut','professor-umlaut.mp3',160,48.0,'Professor Umlaut — Euphoric Speed Rock (160 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('metalmania','metalmania.mp3',150,51.2,'Metalmania — Intense Guitar Hero Riff (150 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('sax-rock-and-roll','sax-rock-and-roll.mp3',128,60.0,'Sax, Rock & Roll — Upbeat Pop-Rock (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('riptide-rock','riptide-rock.mp3',128,60.0,'Riptide — Driving Twin-Guitar Rock (128 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('rocket-power','rocket-power.mp3',120,64.0,'Rocket Power — Funk-Rock Bass & Guitar (120 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('cool-hard-facts','cool-hard-facts.mp3',116,66.2,'Cool Hard Facts — Power Chord Rock (116 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
    ('chipper','chipper.mp3',116,66.2,'Chipper — Garage Distortion Punk (116 BPM). CC-BY 4.0 Kevin MacLeod (incompetech.com).'),
]
for sid,fn,sbpm,sdur,snote in studio_catalog:
    p=D/fn
    if p.exists():
        assets.append(dict(id=sid,category='audio',path='audio/'+fn,format='MP3',bytes=p.stat().st_size,duration=sdur,sampleRate=44100,channels=2,note=snote,provenance='Incompetech Royalty-Free Music (CC-BY 4.0 Kevin MacLeod), alineada por onset detection',bpm=sbpm))
manifest=json.loads((R/'manifest.json').read_text(encoding='utf-8'))
manifest['assets']=[a for a in manifest['assets'] if a['category']!='audio']+assets
(R/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(len(assets),'WAV creados')
