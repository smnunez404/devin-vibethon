const fs=require('fs');
const path=require('path');
const {Resvg}=require('../.tools/svg/node_modules/@resvg/resvg-js');
const root=path.resolve(__dirname,'../assets/v001');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
for(const asset of manifest.assets){
  if(asset.format!=='SVG') continue;
  if(process.argv[2] && asset.category!==process.argv[2]) continue;
  const source=path.join(root,asset.path);
  const png=asset.path.replace(/\.svg$/,'.png');
  const rendered=new Resvg(fs.readFileSync(source),{font:{loadSystemFonts:true}}).render().asPng();
  fs.writeFileSync(path.join(root,png),rendered);
  asset.png=png;
  asset.pngBytes=rendered.length;
  asset.pivot=[0.5,0.5];
  asset.colorSpace='sRGB';
}
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
console.log('Exportación PNG terminada',process.argv[2]||'todas las categorías');
