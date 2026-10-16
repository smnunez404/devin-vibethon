from pathlib import Path
import shutil
R=Path(__file__).resolve().parents[1]
src=R/'videos/neon-tunnel'
for theme in ['diamonds','gears']:
    dst=R/'videos'/('neon-'+theme)
    dst.mkdir(parents=True,exist_ok=True)
    for name in ['AGENTS.md','CLAUDE.md','hyperframes.json','package.json','BRIEF.md','design.md','STORYBOARD.md']:
        shutil.copy2(src/name,dst/name)
    (dst/'assets').mkdir(exist_ok=True)
    shutil.copy2(src/'assets/gsap.min.js',dst/'assets/gsap.min.js')
    text=(src/'index.html').read_text(encoding='utf-8').replace("const theme='fairground';",f"const theme='{theme}';")
    (dst/'index.html').write_text(text,encoding='utf-8')
    print(dst)
