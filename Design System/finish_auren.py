import json,zipfile
from pathlib import Path
root=Path(__file__).resolve().parent.parent
with zipfile.ZipFile(root/'outputs/Auren-Design-System.figcraft') as z:d=json.loads(z.read('document.json'))
tokens=json.loads((root/'outputs/Auren-tokens.json').read_text())
cmd=[{'command':'variable.createCollection','params':{'name':'Auren / Foundations','modes':['Light']}}]
for name,c in tokens['color'].items():
 cmd.append({'command':'variable.create','params':{'collection':'Auren / Foundations','name':'color/'+name,'type':'color','value':c}})
 for typ,field in [('fills','fill'),('strokes','stroke')]:
  ids=[]
  for a in d['nodes'].values():
   p=a.get(typ,[])
   if p and p[0].get('type')=='solid':
    h='#'+''.join(f'{round(p[0]["color"][ch]*255):02X}' for ch in 'rgb')
    if h==c:ids.append(a['id'])
  if ids:cmd.append({'command':'variable.bind','params':{'ids':ids,'field':field,'variable':'color/'+name}})
for size in tokens['space']:cmd.append({'command':'variable.create','params':{'collection':'Auren / Foundations','name':'space/'+str(size),'type':'number','value':size}})
for name,size in tokens['radius'].items():cmd.append({'command':'variable.create','params':{'collection':'Auren / Foundations','name':'radius/'+name,'type':'number','value':size}})
for name,font in tokens['font'].items():cmd.append({'command':'variable.create','params':{'collection':'Auren / Foundations','name':'font/'+name,'type':'string','value':font}})
seen={}
for a in d['nodes'].values():
 if a['type']=='text':
  s=a['style'];key=(s['font_family'],s['font_size'],s['font_style']);seen.setdefault(key,[]).append(a['id'])
for (font,size,weight),ids in seen.items():
 name=f'{"Display" if font=="Georgia" else "Interface"}/{size:g}/{weight}'
 cmd.append({'command':'style.create','params':{'type':'text','name':name,'from':ids[0]}})
 # Text styles are available; colors are semantic per-layer bindings.
for a in d['nodes'].values():
 if a.get('name','').startswith('Button /') or a.get('name','').startswith('Badge /'):
  cmd.append({'command':'node.set','params':{'ids':[a['id']],'layout':'horizontal','padding':[0,16 if a['name'].startswith('Button') else 11,0,16 if a['name'].startswith('Button') else 11],'crossAlign':'center','mainAlign':'min'}})
  for ch in a.get('children',[]):cmd.append({'command':'node.set','params':{'ids':[ch],'sizingH':'fill','sizingV':'hug'}})
desktop=d['pages'][3];cmd.extend([{'command':'page.select','params':{'id':desktop}},{'command':'select.set','params':{'ids':[next(a['id'] for a in d['nodes'].values() if a.get('parent')==desktop and a['name']=='02 · Agenda')]}},{'command':'view.zoomSelection','params':{}}])
(root/'work/finish.json').write_text(json.dumps(cmd,ensure_ascii=False),encoding='utf-8')
print(len(cmd),'commands; text styles:',len(seen))
