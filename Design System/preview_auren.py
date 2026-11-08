from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json,zipfile
R=Path(__file__).resolve().parent.parent
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20)
title=ImageFont.truetype('C:/Windows/Fonts/georgia.ttf',58)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
def pic(canvas,fn,x,y,w,h=None):
 im=Image.open(R/'work'/fn).convert('RGB')
 if h:im=im.crop((0,0,im.width,min(im.height,round(h*im.width/w))))
 im=im.resize((w,round(im.height*w/im.width)),Image.Resampling.LANCZOS);canvas.paste(im,(x,y));return im.height
im=Image.new('RGB',(1880,1390),'#E6E9E1');d=ImageDraw.Draw(im)
d.text((60,42),'Auren',font=title,fill='#173F36');d.text((63,126),'CLÍNICA & DIAGNÓSTICO  /  DESIGN SYSTEM',font=font,fill='#60736B')
pic(im,'previews-desktop/02 · Agenda.png',60,210,1050)
pic(im,'previews-tablet/16 · Portal.png',1150,210,410,1000)
pic(im,'previews-mobile/03 · Agendar.png',1600,210,230)
d.text((60,1050),'DESKTOP / 1440',font=small,fill='#173F36');d.text((1150,843),'TABLET / 834',font=small,fill='#173F36');d.text((1600,1030),'MOBILE / 390',font=small,fill='#173F36')
for j,(c,label) in enumerate([('#173F36','Forest'),('#F6F5F0','Ivory'),('#E6EDE4','Sage'),('#B99B67','Champagne')]):
 x=60+j*267;d.rounded_rectangle((x,1115,x+240,1183),8,fill=c);d.text((x,1200),label,font=font,fill='#173F36')
d.text((60,1297),'Georgia + Inter    •    63 telas    •    26 componentes    •    Desktop, tablet e mobile',font=font,fill='#60736B')
im.save(R/'outputs/Auren-preview.png')
for viewport in ['desktop','tablet','mobile']:
 files=sorted((R/'work'/('previews-'+viewport)).glob('*.png'));cellw=300 if viewport=='mobile' else 440;cellh=530;columns=4;rows=(len(files)+3)//4
 board=Image.new('RGB',(columns*cellw,rows*cellh),'#DDE2DA');bd=ImageDraw.Draw(board)
 for j,p in enumerate(files):
  thumb=Image.open(p);thumb.thumbnail((cellw-20,cellh-50));x=(j%columns)*cellw+10;y=(j//columns)*cellh+34;board.paste(thumb,(x,y));bd.text((x,y-27),p.stem,font=small,fill='#173F36')
 board.save(R/'work'/f'contact-{viewport}.png')
with zipfile.ZipFile(R/'outputs/Auren-Design-System.figcraft') as z:d=json.loads(z.read('document.json'))
for n in d['nodes'].values():
 if 'parent' in n:assert str(n['parent']) in d['nodes']
 for inter in n.get('interactions',[]):
  for a in inter.get('actions',[]):
   if 'dest' in a:assert str(a['dest']) in d['nodes']
print('Validated:',len(d['nodes']),'layers;',len(d['styles']),'styles;',len(d['variables']['variables']),'variables;',sum(len(n.get('interactions',[])) for n in d['nodes'].values()),'links')
