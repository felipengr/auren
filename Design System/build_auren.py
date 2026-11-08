import json,zipfile,math
from pathlib import Path
O=Path(__file__).resolve().parent.parent/'outputs'; O.mkdir(exist_ok=True)
P={'forest':'#173F36','ink':'#203B34','muted':'#60736B','paper':'#F6F5F0','white':'#FFFFFF','line':'#DCE3DB','sage':'#E6EDE4','gold':'#B99B67','sand':'#EEE7D9','red':'#A43F3F','rose':'#F9EAEA','amber':'#785719','warning':'#FAF0D9','blue':'#345E82','info':'#EAF1F7','disabled':'#E8EBE6'}
D={'format':'figcraft','version':1,'name':'Auren — Clinical Design System','imageIndex':[],'pages':[],'nodes':{},'next_id':1,'styles':[],'variables':{'collections':[],'variables':[]},'document_colors':[],'comments':[]}
links=[]; screens={}; manifest=[]
def color(c):
 c=P.get(c,c);return dict(zip(('r','g','b'),[int(c[i:i+2],16)/255 for i in (1,3,5)]),a=1)
def paint(c):return {'type':'solid','color':color(c),'opacity':1,'visible':True,'blend':'normal'}
def n(t,name,p=None,x=0,y=0,w=0,h=0,fill=None,**kw):
 i=D['next_id'];D['next_id']+=1;a={'id':i,'name':name,'type':t,'width':float(w),'height':float(h),'transform':[1,0,0,1,x,y],**kw}
 if fill:a['fills']=[paint(fill)]
 if p:a['parent']=p;D['nodes'][str(p)].setdefault('children',[]).append(i)
 D['nodes'][str(i)]=a;return i
def page(name):
 i=n('page',name,children=[],background=color('#DDE2DA'),flows=[],prototype={'device':'None','background':color('#DDE2DA'),'rotation':'portrait'});D['pages'].append(i);return i
def box(p,x,y,w,h,c='white',r=12,stroke=None,name='Surface'):
 i=n('rectangle',name,p,x,y,w,h,c,corners={'radii':[r]*4,'smoothing':0})
 if stroke:D['nodes'][str(i)].update(strokes=[paint(stroke)],stroke_weight=1)
 return i
def tx(p,s,x,y,w=400,z=16,c='ink',font='Inter',weight='Regular',lh=145):
 h=len(s.split('\n'))*z*lh/100+3
 return n('text',s.split('\n')[0][:65],p,x,y,w,h,c,characters=s,auto_resize='height',align_h='left',style={'font_family':font,'font_style':weight,'font_size':z,'line_height':{'unit':'percent','value':lh},'letter_spacing':{'unit':'percent','value':0},'decoration':'none','case':'original','fills':None,'link':None},child_layout={'sizing_h':'fixed','sizing_v':'hug','absolute':False})
def title(p,s,x,y,w=800,z=44,c='forest'):return tx(p,s,x,y,w,z,c,'Georgia',lh=118)
def rule(p,x,y,w):box(p,x,y,w,1,'line',0)
def go(i,k,v):links.append((i,k,v));return i
def btn(p,s,x,y,w=180,k=None,v='Desktop',variant='primary'):
 bg,fg={'primary':('forest','white'),'secondary':('white','forest'),'danger':('red','white'),'disabled':('disabled','muted'),'soft':('sage','forest')}[variant]
 i=n('frame','Button / '+variant+' / '+s,p,x,y,w,48,bg,children=[],clip=True,corners={'radii':[8]*4,'smoothing':0})
 if variant=='secondary':D['nodes'][str(i)].update(strokes=[paint('line')],stroke_weight=1)
 tx(i,s,16,13,w-32,14,fg,weight='SemiBold',lh=140)
 if k and variant!='disabled':go(i,k,v)
 return i
def badge(p,s,x,y,w=135,t='success'):
 bg,fg={'success':('sage','forest'),'draft':('warning','amber'),'cancel':('rose','red'),'neutral':('disabled','muted'),'info':('info','blue')}[t]
 i=n('frame','Badge / '+s,p,x,y,w,28,bg,children=[],corners={'radii':[14]*4,'smoothing':0});tx(i,s,11,5,w-22,12,fg,weight='Medium',lh=140);return i
def field(p,label,value,x,y,w,error=None):
 tx(p,label,x,y,w,13,weight='Medium');box(p,x,y+27,w,48,'white',8,'red' if error else 'line');tx(p,value,x+14,y+40,w-28,14,'ink' if value else 'muted')
 if error:tx(p,error,x,y+81,w,12,'red')
def notice(p,s,x,y,w,t='info'):
 bg,fg={'info':('info','blue'),'error':('rose','red'),'success':('sage','forest'),'warning':('warning','amber')}[t]
 box(p,x,y,w,64,bg,8);tx(p,s,x+16,y+12,w-32,13,fg)
def brand(p,x,y,light=False):
 box(p,x,y+3,26,26,'gold',13);box(p,x+9,y+9,8,14,'forest',4);title(p,'auren',x+38,y-8,180,35,'white' if light else 'forest');tx(p,'CLÍNICA & DIAGNÓSTICO',x+40,y+35,190,8,'sand' if light else 'muted',weight='Medium')
def frame(pg,name,v,j,w,h=1080):
 i=n('frame',f'{j+1:02d} · {name}',pg,(j%4)*(w+120),(j//4)*1640,w,h,'paper',children=[],clip=True,overflow='vertical');screens[(name,v)]=i;manifest.append({'screen':name,'viewport':v,'width':w,'height':h,'id':i});return i
def shell(f,v,patient=False,active='Agenda'):
 w={'Desktop':1440,'Tablet':834,'Mobile':390}[v];m=v=='Mobile';d=v=='Desktop'
 if d:
  box(f,0,0,248,1080,'forest',0);brand(f,28,34,True);tx(f,'PORTAL DO PACIENTE' if patient else 'ESPAÇO DA CLÍNICA',28,142,200,10,'sand',weight='Medium')
  items=[('Visão geral','Portal'),('Meus exames','Meus exames'),('Meus laudos','Meus laudos')] if patient else [('Agenda','Agenda'),('Laudos','Laudos')]
  for j,(s,k) in enumerate(items):
   yy=184+j*58
   if s==active:box(f,16,yy-8,216,48,'#2D5347',8);box(f,16,yy+2,3,28,'gold',1)
   go(tx(f,s,40,yy+4,180,14,'white' if s==active else '#CCDACF',weight='Medium'),k,v)
  rule(f,24,930,200);tx(f,'AC   '+('Ana Costa' if patient else 'Marina Oliveira'),28,953,205,13,'white',weight='Medium');tx(f,'Paciente' if patient else 'Equipe da clínica',61,978,175,11,'sand');go(tx(f,'Sair da conta',28,1024,180,12,'sand'),'Entrar',v)
  box(f,248,0,w-248,80,'white',0);tx(f,'Auren  /  '+('Meu cuidado' if patient else 'Gestão de exames'),288,29,600,13,'muted');badge(f,'Ambiente seguro',1204,25,152)
  return 288,124,w-328
 box(f,0,0,w,88,'white',0);brand(f,24,23);go(tx(f,'Sair',w-62,34,50,13,'muted'),'Entrar',v)
 items=[('Início','Portal'),('Exames','Meus exames'),('Laudos','Meus laudos')] if patient else [('Agenda','Agenda'),('Laudos','Laudos')]
 for j,(s,k) in enumerate(items):
  xx=24+j*(112 if m else 148);go(tx(f,s,xx,108,110,14,'forest',weight='SemiBold'),k,v)
 rule(f,24,143,w-48);return 24,174,w-48
def heading(f,s,sub,x,y,w,v):
 title(f,s,x,y,w,32 if v=='Mobile' else 42);tx(f,sub,x,y+(52 if v=='Mobile' else 62),w,14,'muted')
def auth(f,v):
 w={'Desktop':1440,'Tablet':834,'Mobile':390}[v];m=v=='Mobile';d=v=='Desktop'
 if d:
  left=n('frame','Editorial / identidade',f,0,0,690,1080,'forest',children=[],clip=True);brand(left,64,55,True)
  for a in range(4):
   i=n('ellipse','Marca / órbita',left,270+a*30,668-a*20,310+a*50,310+a*50,strokes=[paint('#52705C')],stroke_weight=1)
  tx(left,'CUIDADO EM CADA DETALHE',64,254,560,11,'sand',weight='Medium');title(left,'Precisão que acolhe.\nCuidado que conecta.',64,304,590,57,'white');tx(left,'Sua jornada de saúde,\ncom clareza e tranquilidade.',64,500,530,19,'sand');tx(left,'EXAMES  /  RESULTADOS  /  ACOLHIMENTO',64,979,560,10,'sand')
 x=784 if d else 24 if m else 167;ww=510 if d else 342 if m else 500;y=188 if d else 160
 if not d:brand(f,x,40)
 tx(f,'BEM-VINDO À AUREN',x,y,ww,11,'muted',weight='Medium');title(f,'Seu cuidado\ncomeça aqui.',x,y+34,ww,42 if m else 48)
 tx(f,'Entre com as credenciais da sua conta.',x,y+166,ww,14,'muted');field(f,'E-mail','ana@exemplo.com',x,y+218,ww);field(f,'Senha','••••••••••',x,y+322,ww)
 btn(f,'Entrar como paciente  →',x,y+437,ww,'Portal',v);btn(f,'Acessar como equipe',x,y+499,ww,'Agenda',v,'secondary');tx(f,'Acesso demonstrativo • dados fictícios',x,y+581,ww,12,'muted');tx(f,'Seus exames e laudos em um ambiente reservado.',x,y+616,ww,12,'muted')
def agenda(f,v):
 x,y,w=shell(f,v);m=v=='Mobile';d=v=='Desktop'
 heading(f,'Agenda de exames','Uma visão clara de cada atendimento.',x,y,w,v);yy=y+112
 btn(f,'+  Novo agendamento',x if m else x+w-212,yy if m else y+8,212 if not m else w,'Agendar',v)
 if m:yy+=72
 cw=(w-32)/3
 for j,(a,b) in enumerate([('Exames agendados','08'),('Horários livres','06'),('Sala de exames','01')]):
  if m and j>0:continue
  bx=x+j*(cw+16);box(f,bx,yy,w if m else cw,106,'white',12,'line');tx(f,a,bx+20,yy+17,250,12,'muted');title(f,b,bx+20,yy+43,150,34)
 yy+=134;field(f,'Data','12/11/2026',x,yy,w if m else 218)
 field(f,'Paciente','Buscar por nome',x if m else x+238,yy+98 if m else yy,w if m else w-238);yy+=208 if m else 108
 tx(f,'Quinta-feira, 12 de novembro',x,yy,w,18,weight='SemiBold');tx(f,'Sala única • intervalos de 30 min • Brasília (UTC−3)',x,yy+34,w,12,'muted');yy+=80
 rows=[('08:00','Ana Costa','Ultrassom','Agendado','info'),('08:30','Bruno Mendes','Raio-X','Laudo publicado','success'),('09:00','Clara Ribeiro','Ressonância magnética','Rascunho','draft'),('09:30','Horário disponível','Sala de exames','Livre','neutral'),('10:00','Daniel Santos','Raio-X','Cancelado','cancel')]
 if not m:
  for lab,xx in [('HORÁRIO',x+16),('PACIENTE / EXAME',x+112),('SITUAÇÃO',x+w-325),('AÇÃO',x+w-120)]:tx(f,lab,xx,yy,w,10,'muted',weight='Medium')
  yy+=34
 for j,(time,name,exam,status,t) in enumerate(rows):
  hh=155 if m else 80;box(f,x,yy,w,hh,'white',10,'line');tx(f,time,x+16,yy+20,80,16,weight='SemiBold');tx(f,name,x+(92 if not m else 91),yy+16,w-130,14,weight='Medium');tx(f,exam,x+(92 if not m else 91),yy+42,w-130,12,'muted')
  badge(f,status,x+16 if m else x+w-325,yy+80 if m else yy+25,150,t)
  go(tx(f,'Agendar →' if status=='Livre' else 'Abrir →',x+w-106,yy+89 if m else yy+29,100,12,'forest',weight='SemiBold'),'Agendar' if status=='Livre' else 'Detalhe',v);yy+=hh+10
 D['nodes'][str(f)]['height']=max(1080,yy+50)
def schedule(f,v,conflict=False):
 x,y,w=shell(f,v);m=v=='Mobile';heading(f,'Novo agendamento','Selecione o paciente, o exame e um horário livre.',x,y,w,v);yy=y+119
 box(f,x,yy,w,70,'sage',10);tx(f,'01   Paciente     /     02   Exame     /     03   Data e horário',x+16,yy+24,w-32,11 if m else 14,'forest',weight='Medium');yy+=102
 fw=w if m else (w-24)/2;field(f,'Paciente cadastrado','Ana Costa',x,yy,fw);field(f,'Tipo de exame','Ultrassom',x if m else x+fw+24,yy+104 if m else yy,fw);yy+=220 if m else 119
 field(f,'Data do exame','12/11/2026',x,yy,fw);tx(f,'Sala única • duração de 30 minutos',x,yy+88,w,12,'muted');yy+=135
 tx(f,'Horários disponíveis',x,yy,w,17,weight='SemiBold');tx(f,'Horário de Brasília • America/Sao_Paulo (UTC−3)',x,yy+34,w,12,'muted');yy+=76
 cols=3 if m else 6;gap=12;sw=(w-(cols-1)*gap)/cols
 for j,s in enumerate(['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','13:00','13:30','14:00','14:30']):
  taken=j in [0,1,2,7];selected=j==3;btn(f,s+(' •' if taken else ''),x+(j%cols)*(sw+gap),yy+(j//cols)*60,sw,'Agendar',v,'disabled' if taken else 'primary' if selected else 'secondary')
 yy+=math.ceil(12/cols)*60+10;tx(f,'• Ocupado     Verde escuro: selecionado',x,yy,w,12,'muted');yy+=43
 if conflict:notice(f,'Horário ocupado por outro agendamento.\nEscolha outro horário para continuar.',x,yy,w,'error');yy+=88
 else:notice(f,'Ana Costa • Ultrassom\n12 nov. 2026, 09:30–10:00',x,yy,w,'success');yy+=88
 btn(f,'Escolher outro horário' if conflict else 'Confirmar agendamento',x,yy,w if m else 260,'Agendar' if conflict else 'Agendado',v);go(tx(f,'Voltar para agenda',x,yy+73,w,13,'muted'),'Agenda',v);D['nodes'][str(f)]['height']=yy+145
def detail(f,v,published=False):
 x,y,w=shell(f,v);m=v=='Mobile';heading(f,'Detalhe do exame','Tudo o que a equipe precisa, no mesmo lugar.',x,y,w,v);yy=y+122
 box(f,x,yy,w,190,'white',12,'line');badge(f,'Laudo publicado' if published else 'Agendado',x+20,yy+20,153,'success' if published else 'info');title(f,'Ultrassom',x+20,yy+67,w-40,32);tx(f,'Ana Costa  •  Paciente #001',x+20,yy+115,w-40,14);tx(f,'12 nov. 2026  /  09:30–10:00  /  Sala única',x+20,yy+150,w-40,12,'muted');yy+=218
 title(f,'Laudo do exame',x,yy,w,28);tx(f,'Um laudo por agendamento.',x,yy+44,w,13,'muted');yy+=87
 if published:
  notice(f,'Publicado em 12/11/2026, às 11:42.\nEste laudo não pode ser editado.',x,yy,w,'success');yy+=92;btn(f,'Ler laudo publicado',x,yy,w if m else 260,'Leitura equipe',v);yy+=85;notice(f,'Cancelamento indisponível:\no exame possui laudo publicado.',x,yy,w,'info');yy+=90
 else:
  box(f,x,yy,w,150,'white',12,'line');tx(f,'Nenhum laudo cadastrado',x+20,yy+20,w-40,17,weight='Medium');tx(f,'Crie um rascunho para revisão da equipe.',x+20,yy+57,w-40,13,'muted');btn(f,'Cadastrar laudo',x+20,yy+89,w-40 if m else 212,'Editor',v);yy+=184;btn(f,'Cancelar agendamento',x,yy,w if m else 250,'Cancelar',v,'secondary');yy+=90
 go(tx(f,'← Voltar para agenda',x,yy,w,13,'muted'),'Agenda',v);D['nodes'][str(f)]['height']=max(1080,yy+80)
def editor(f,v):
 x,y,w=shell(f,v,active='Laudos');m=v=='Mobile';heading(f,'Escrever laudo','Ultrassom • Ana Costa • 12 nov. 2026',x,y,w,v);yy=y+116;badge(f,'Rascunho privado',x,yy,158,'draft');yy+=56
 field(f,'Título do laudo','Ultrassonografia — avaliação',x,yy,w);yy+=108;field(f,'Profissional responsável','Dra. Helena Martins',x,yy,w);yy+=111
 tx(f,'Texto do laudo',x,yy,w,13,weight='Medium');box(f,x,yy+28,w,266,'white',8,'line');tx(f,'Descrição do exame\n\nTexto demonstrativo para apresentação\nda interface. Substituir pelo laudo\nelaborado pelo profissional responsável.\n\nConclusão\nConteúdo clínico não validado.',x+16,yy+45,w-32,14,'muted',lh=160);yy+=322
 notice(f,'Somente a equipe pode acessar o rascunho.\nApós publicar, o conteúdo não poderá ser editado.',x,yy,w,'warning');yy+=90
 btn(f,'Salvar rascunho',x,yy,w if m else 230,'Rascunho salvo',v,'secondary');btn(f,'Revisar e publicar',x if m else x+250,yy+62 if m else yy,w if m else 235,'Publicar',v);D['nodes'][str(f)]['height']=max(1080,yy+165)
def reports(f,v,patient=False):
 x,y,w=shell(f,v,patient,active='Meus laudos' if patient else 'Laudos');m=v=='Mobile';heading(f,'Meus laudos' if patient else 'Central de laudos','Resultados disponíveis para leitura.' if patient else 'Rascunhos e publicações, com clareza.',x,y,w,v);yy=y+123
 field(f,'Buscar por exame' if patient else 'Buscar paciente','Ultrassom' if patient else 'Todos os pacientes',x,yy,w);yy+=110
 names=[('Ultrassom','Publicado em 12 nov. 2026','Publicado','success','Ler laudo','Laudo paciente'),('Raio-X','Publicado em 05 nov. 2026','Publicado','success','Ler laudo','Laudo paciente')] if patient else [('Ultrassom · Ana Costa','12 nov. 2026 · 09:30','Rascunho','draft','Editar laudo','Editor'),('Raio-X · Bruno Mendes','12 nov. 2026 · 08:30','Publicado','success','Ler laudo','Leitura equipe'),('Ressonância · Clara Ribeiro','12 nov. 2026 · 09:00','Sem laudo','neutral','Cadastrar','Editor')]
 for j,(a,b,c,t,cta,k) in enumerate(names):
  hh=203 if m else 145;box(f,x,yy,w,hh,'white',12,'line');tx(f,a,x+20,yy+21,w-40,17,weight='Medium');tx(f,b,x+20,yy+54,w-40,12,'muted');badge(f,c,x+20,yy+91,135,t);btn(f,cta,x+20 if m else x+w-198,yy+137 if m else yy+75,w-40 if m else 178,k,v,'secondary');yy+=hh+16
 D['nodes'][str(f)]['height']=max(1080,yy+60)
def portal(f,v,exams=False):
 x,y,w=shell(f,v,True,active='Meus exames' if exams else 'Visão geral');m=v=='Mobile';heading(f,'Meus exames' if exams else 'Olá, Ana.','Acompanhe cada etapa do seu cuidado.' if exams else 'É bom ter você por aqui.',x,y,w,v);yy=y+121
 if not exams:
  box(f,x,yy,w,230 if m else 206,'forest',16);tx(f,'SEU PRÓXIMO EXAME',x+24,yy+24,w-48,10,'sand',weight='Medium');title(f,'Ultrassom',x+24,yy+58,w-48,36,'white');tx(f,'12 de novembro de 2026\n09:30–10:00  •  Sala de exames',x+24,yy+113,w-48,14,'sand');go(tx(f,'Ver meus exames →',x+24,yy+183 if m else yy+169,w-48,13,'white',weight='Medium'),'Meus exames',v);yy+=262 if m else 238
  box(f,x,yy,w,151,'sand',12);tx(f,'Um resultado à sua espera.',x+20,yy+20,w-40,20,weight='Medium');tx(f,'Seu laudo de ultrassom está disponível.',x+20,yy+58,w-40,13,'muted');btn(f,'Ler meu laudo  →',x+20,yy+87,w-40 if m else 225,'Laudo paciente',v);yy+=190
 title(f,'Sua jornada de cuidado',x,yy,w,28);yy+=63
 for j,(a,b,status,t) in enumerate([('Ultrassom','12 nov. 2026 • 09:30','Agendado','info'),('Raio-X','05 nov. 2026 • 14:00','Laudo disponível','success'),('Ressonância magnética','29 out. 2026 • 10:00','Cancelado','cancel')]):
  box(f,x,yy,w,146 if m else 108,'white',12,'line');tx(f,a,x+20,yy+20,w-40,16,weight='Medium');tx(f,b,x+20,yy+51,w-40,12,'muted');badge(f,status,x+20 if m else x+w-190,yy+92 if m else yy+29,166,t)
  if j==1:go(tx(f,'Ler →',x+w-70,yy+98 if m else yy+69,60,12,'forest'),'Laudo paciente',v)
  yy+=162 if m else 124
 D['nodes'][str(f)]['height']=max(1080,yy+54)
def read(f,v,patient=True):
 x,y,w=shell(f,v,patient,active='Meus laudos' if patient else 'Laudos');m=v=='Mobile';go(tx(f,'← Voltar aos laudos',x,y,w,13,'muted'),'Meus laudos' if patient else 'Laudos',v);yy=y+55
 badge(f,'Laudo publicado',x,yy,152);yy+=52;title(f,'Ultrassonografia',x,yy,w,31 if m else 43);yy+=66;tx(f,'Ana Costa • Exame de 12/11/2026 às 09:30',x,yy,w,13,'muted');yy+=60
 box(f,x,yy,w,500 if m else 425,'white',12,'line');pad=20 if m else 36;xx=x+pad;ww=w-pad*2
 tx(f,'DESCRIÇÃO DO EXAME',xx,yy+30,ww,11,'muted',weight='SemiBold');tx(f,'Texto demonstrativo de um laudo\npublicado, apresentado para avaliar\na experiência de leitura da interface.',xx,yy+68,ww,16,lh=170)
 rule(f,xx,yy+182,ww);tx(f,'CONCLUSÃO',xx,yy+209,ww,11,'muted',weight='SemiBold');tx(f,'Conteúdo ilustrativo. O texto clínico\ndeve ser elaborado e revisado pelo\nprofissional responsável.',xx,yy+247,ww,15,lh=170)
 tx(f,'Dra. Helena Martins',xx,yy+365,ww,15,weight='Medium');tx(f,'Profissional responsável',xx,yy+397,ww,12,'muted');yy+=532 if m else 457
 tx(f,'Publicado em 12/11/2026, às 11:42\nHorário de Brasília • UTC−3',x,yy,w,12,'muted');D['nodes'][str(f)]['height']=max(1080,yy+120)
def state_screen(f,v,kind):
 patient=kind in ['Sem exames','Acesso restrito'];x,y,w=shell(f,v,patient);m=v=='Mobile';yy=y+56
 data={'Agendado':('Agendamento confirmado','Ana Costa • Ultrassom\n12 nov. 2026, 09:30–10:00','Voltar à agenda','Agenda','success'), 'Rascunho salvo':('Rascunho salvo','Seu trabalho foi salvo.\nO paciente ainda não pode ver este laudo.','Continuar editando','Editor','draft'),'Publicar':('Publicar este laudo?','Ana Costa terá acesso ao resultado.\nApós publicar, não será possível editar.','Confirmar publicação','Publicado','draft'),'Publicado':('Laudo publicado','O resultado já está disponível\npara a paciente Ana Costa.','Ver exame','Detalhe publicado','success'),'Cancelar':('Cancelar agendamento?','Ultrassom • Ana Costa\n12 nov. 2026 às 09:30\nO horário ficará disponível novamente.','Confirmar cancelamento','Cancelado','cancel'),'Cancelado':('Agendamento cancelado','O horário das 09:30 foi liberado.\nExames cancelados não recebem laudos.','Voltar à agenda','Agenda','cancel'),'Sem exames':('Tudo tranquilo por aqui.','Você ainda não tem exames agendados.\nSe precisar, fale com a equipe da clínica.','Voltar ao início','Portal','neutral'),'Acesso restrito':('Conteúdo indisponível','Não foi possível acessar este resultado.\nConsulte os laudos da sua conta.','Ir para meus laudos','Meus laudos','neutral')}
 a,b,c,k,t=data[kind];box(f,x,yy,w,510,'white',16,'line');box(f,x+28,yy+32,48,48,'sage' if t=='success' else 'sand',24);tx(f,'✓' if t=='success' else '—',x+43,yy+42,40,20,'forest');title(f,a,x+28,yy+119,w-56,31 if m else 41);tx(f,b,x+28,yy+225,w-56,14,'muted',lh=175);btn(f,c,x+28,yy+362,w-56 if m else 285,k,v,'danger' if kind=='Cancelar' else 'primary');
 if kind in ['Publicar','Cancelar']:go(tx(f,'Voltar sem confirmar',x+28,yy+436,w-56,13,'muted'),'Editor' if kind=='Publicar' else 'Detalhe',v)
def foundation(pg):
 f=n('frame','01 · Marca / Auren',pg,0,0,1440,1100,'forest',children=[],clip=True);brand(f,64,56,True);tx(f,'DESIGN SYSTEM  /  V.1.0',64,202,1200,12,'sand',weight='Medium');title(f,'O cuidado também\nestá na experiência.',64,266,1220,80,'white');tx(f,'Clínica & diagnóstico • Agendamento de exames e acesso a laudos',64,514,1250,20,'sand');rule(f,64,634,1312)
 for j,(a,b) in enumerate([('01 / Serenidade','Espaço, ritmo e uma leitura sem ruído.'),('02 / Confiança','Estados claros e ações previsíveis.'),('03 / Precisão','Cada detalhe apoia uma decisão.')]):tx(f,a,64+j*445,694,400,20,'white',weight='Medium');tx(f,b.replace(' e uma','\ne uma').replace(' e ações','\ne ações'),64+j*445,742,390,16,'sand')
 tx(f,'UMA MARCA CONCEITUAL  •  INTERFACE EM PORTUGUÊS  •  DADOS FICTÍCIOS',64,1010,1250,11,'sand')
 f=n('frame','02 · Cores e contraste',pg,1560,0,1440,1100,'paper',children=[],clip=True);title(f,'Uma paleta que respira.',64,54,1200,56);tx(f,'Verde para confiança. Marfim para acolhimento. Champagne como detalhe.',64,140,1260,18,'muted')
 for j,(key,label) in enumerate([('forest','Forest / ação principal'),('paper','Ivory / fundo'),('white','White / superfície'),('ink','Ink / texto'),('muted','Muted / apoio'),('gold','Champagne / assinatura'),('sage','Sage / sucesso'),('line','Line / borda'),('red','Error / erro'),('amber','Amber / aviso'),('blue','Blue / informação'),('disabled','Disabled / inativo')]):
  xx=64+(j%4)*336;yy=229+(j//4)*231;box(f,xx,yy,312,124,key,10,'line');tx(f,label,xx,yy+142,312,15,weight='Medium');tx(f,P[key],xx,yy+174,312,13,'muted')
 tx(f,'Champagne é decorativo. Texto pequeno usa Ink, Forest ou Muted sobre superfícies claras.\nSituações têm rótulos: o significado nunca depende apenas de cor.',64,967,1300,15,'muted')
 f=n('frame','03 · Tipografia e ritmo',pg,3120,0,1440,1260,'paper',children=[],clip=True);title(f,'Elegância na forma.\nClareza na leitura.',64,54,1250,64);title(f,'Georgia',64,254,580,55);tx(f,'Editorial / títulos e marca\nSerifada sóbria, com personalidade.\nFallback de implementação: serif.',64,345,600,17,'muted',lh=175);tx(f,'Inter',800,254,500,55,weight='SemiBold');tx(f,'Interface / formulários e dados\nRegular, Medium e SemiBold.\nFallback: system-ui, sans-serif.',800,345,550,17,'muted',lh=175)
 for j,(a,z) in enumerate([('Display / 64 / 1.18',64),('Heading 1 / 42 / 1.18',42),('Heading 2 / 28 / 1.25',28),('Body / 16 / 1.6',16),('Label / 14 / 1.4',14),('Caption / 12 / 1.45',12)]):
  yy=492+j*88;tx(f,a,64,yy,520,14,'muted');tx(f,'Um cuidado mais próximo.',625,yy,730,z,'forest','Georgia' if j<3 else 'Inter',lh=118)
 tx(f,'Espaçamento: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64\nRaios: 8 em controles, 12 em cards e 16 em destaque. Botões: 48 px.\nBordas: 1 px. Ícones na implementação: Lucide, traço 1.5–2 px.',64,1080,1300,16,'muted',lh=175)
def components(pg):
 f=n('frame','04 · Biblioteca / ações e formulários',pg,0,0,1440,1430,'paper',children=[],clip=True);title(f,'Componentes essenciais',64,54,1250,52);tx(f,'Masters editáveis / variantes visuais e estados de interação',64,133,1250,16,'muted')
 for j,(s,var) in enumerate([('Confirmar','primary'),('Voltar','secondary'),('Cancelar exame','danger'),('Indisponível','disabled'),('Ação de apoio','soft')]):i=btn(f,s,64+j*266,217,242,variant=var);D['nodes'][str(i)]['type']='component'
 tx(f,'FOCO / HOVER / CARREGAMENTO',64,319,1250,11,'muted',weight='SemiBold')
 for j,(s,c) in enumerate([('Confirmar · foco','forest'),('Confirmar · hover','#285547'),('Salvando…','forest')]):
  i=btn(f,s,64+j*320,365,288);D['nodes'][str(i)]['type']='component'
  if j==0:box(f,60,361,296,56,None if False else 'paper',10,'forest');i=btn(f,s,64,365,288);D['nodes'][str(i)]['type']='component'
  if j==1:D['nodes'][str(i)]['fills']=[paint(c)]
 for j,(label,val,err) in enumerate([('Paciente','Selecione um paciente',None),('E-mail','ana@exemplo.com',None),('Data','01/11/2026','Não é possível agendar no passado.')]):field(f,label,val,64+j*444,486,410,err)
 tx(f,'SITUAÇÕES / EXAME E LAUDO',64,644,1250,11,'muted',weight='SemiBold')
 for j,(s,t) in enumerate([('Agendado','info'),('Publicado','success'),('Rascunho','draft'),('Cancelado','cancel'),('Sem laudo','neutral')]):i=badge(f,s,64+j*245,692,214,t);D['nodes'][str(i)]['type']='component'
 notice(f,'Este horário acabou de ser ocupado.\nEscolha outro horário para continuar.',64,786,628,'error');notice(f,'Rascunho salvo.\nDisponível somente para a equipe.',724,786,650,'success')
 tx(f,'SELEÇÃO / HORÁRIOS FIXOS DE 30 MIN',64,922,1250,11,'muted',weight='SemiBold')
 for j,(s,var) in enumerate([('09:00 · ocupado','disabled'),('09:30','primary'),('10:00','secondary'),('10:30','secondary')]):i=btn(f,s,64+j*328,970,296,variant=var);D['nodes'][str(i)]['type']='component'
 tx(f,'SELEÇÃO / CONTROLES',64,1085,1250,11,'muted',weight='SemiBold');tx(f,'●  Ultrassom       ○  Raio-X       ○  Ressonância magnética',64,1137,1200,16);tx(f,'✓  Confirmo a publicação deste laudo para o paciente indicado.',64,1205,1200,16)
 tx(f,'Estados: padrão, hover, foco visível, selecionado, desabilitado, carregando, erro e sucesso.',64,1329,1260,14,'muted')
 f=n('frame','05 · Biblioteca / padrões compostos',pg,1560,0,1440,1450,'paper',children=[],clip=True);title(f,'Padrões que dão consistência.',64,54,1290,52)
 for j,(label,val,error) in enumerate([('E-mail','seuemail@exemplo.com',None),('Data do exame','01/11/2026','Escolha uma data futura.')]):
  c=n('component','Input / '+('erro' if error else 'padrão'),f,64+j*660,183,628,112,children=[]);field(c,label,val,0,0,628,error)
 for j,(s,t) in enumerate([('Rascunho salvo. Somente a equipe pode acessar.','success'),('Não foi possível salvar. Tente novamente.','error')]):
  c=n('component','Alert / '+t,f,64+j*660,352,628,64,children=[]);notice(c,s,0,0,628,t)
 c=n('component','Card / resultado publicado',f,64,484,628,200,'white',children=[],corners={'radii':[12]*4,'smoothing':0},strokes=[paint('line')],stroke_weight=1);tx(c,'Ultrassom',24,22,580,20,weight='Medium');tx(c,'12 nov. 2026 • Ana Costa',24,60,580,13,'muted');badge(c,'Laudo disponível',24,103,166);btn(c,'Ler resultado →',369,125,235,variant='secondary')
 c=n('component','Card / loading skeleton',f,724,484,650,200,'white',children=[],corners={'radii':[12]*4,'smoothing':0},strokes=[paint('line')],stroke_weight=1)
 for x,y,w,h in [(24,28,220,22),(24,74,340,14),(24,121,160,28)]:box(c,x,y,w,h,'disabled',4)
 tx(f,'Carregamento: preservar a geometria e anunciar o estado.',724,704,650,13,'muted')
 c=n('component','Dialog / publicação',f,64,794,628,420,'white',children=[],corners={'radii':[16]*4,'smoothing':0},strokes=[paint('line')],stroke_weight=1);title(c,'Publicar este laudo?',28,30,572,34);tx(c,'Ana Costa terá acesso ao resultado.\nDepois de publicar, o laudo não pode ser editado.',28,105,572,15,'muted',lh=170);notice(c,'Ultrassom • Ana Costa\nExame de 12/11/2026, às 09:30',28,199,572,'warning');btn(c,'Voltar',28,304,170,variant='secondary');btn(c,'Confirmar publicação',218,304,382)
 c=n('component','Navigation / mobile paciente',f,724,794,650,104,'white',children=[],strokes=[paint('line')],stroke_weight=1);brand(c,24,18);tx(c,'Início        Exames        Laudos',270,37,350,14,weight='Medium')
 tx(f,'DIALOG / COMPORTAMENTO',724,948,650,11,'muted',weight='SemiBold');tx(f,'Foco inicial no título; manter o foco dentro do diálogo.\nEscape e Voltar fecham sem salvar.\nDevolver o foco ao acionador ao fechar.\nBackdrop escuro com 32% de opacidade.',724,990,650,16,'muted',lh=180)
 tx(f,'Masters nativos: inputs, alertas, card de laudo, skeleton, diálogo e navegação.\nTokens de cor vinculados a todas as camadas; estilos de texto disponíveis na biblioteca local.',64,1300,1300,16,'muted',lh=175)
def guide(pg):
 f=n('frame','05 · Responsividade / handoff',pg,0,0,1440,1810,'paper',children=[],clip=True);title(f,'A mesma calma.\nEm qualquer tela.',64,54,1250,64)
 for j,(label,ww,desc) in enumerate([('Desktop / 1440',370,'Sidebar 248 px\nConteúdo em 12 colunas\nMargens internas: 40 px\nAgenda em linhas'),('Tablet / 834',290,'Navegação horizontal\nConteúdo em 8 colunas\nMargens: 24 px\nFormulários em 2 colunas'),('Mobile / 390',180,'Navegação compacta\nConteúdo em 4 colunas\nMargens: 24 px\nCards e campos empilhados')]):
  xx=64+j*450;box(f,xx,264,ww,228,'white',12,'line');box(f,xx+12,276,ww-24,34,'sage',4)
  for a in range(3):box(f,xx+12,326+a*48,ww-24,34,'paper',4)
  tx(f,label,xx,525,400,20,weight='Medium');tx(f,desc,xx,569,400,16,'muted',lh=180)
 sections=[('01 / Breakpoints e ergonomia','≥1200 px: sidebar. 768–1199 px: navegação no topo. <768 px: coluna única.\nAs telas são referências compostas para 1440, 834 e 390 px. Implementar layout fluido.\nControles com 48 px e área tocável mínima de 44 px; manter inputs em 16 px no mobile.'),('02 / Comportamento e acessibilidade','Teclado: ordem natural, foco visível e retorno de foco ao fechar modal.\nConfirmações: nomear paciente e consequência. Erro junto ao campo e anúncio acessível.\nRespeitar prefers-reduced-motion; transições de 160–200 ms; sem movimento decorativo contínuo.'),('03 / Regras do desafio refletidas na interface','Sala única; slots de 30 minutos; cancelamento libera horário; passado e conflito são rejeitados.\nUm laudo por exame. Rascunho privado e editável. Publicado: leitura, data de publicação, sem edição.\nExame cancelado não recebe laudo; exame com laudo publicado não pode ser cancelado.'),('04 / Autorização e consistência','Fuso adotado: America/Sao_Paulo; exibir Brasília (UTC−3) no protótipo.\nBackend deve verificar perfil e propriedade; ocultar rascunhos e impedir acesso cruzado.\nConflito de concorrência exige garantia no banco/API; design não implementa autenticação.'),('05 / Escopo e conteúdo','Protótipo visual navegável. Dados fictícios. Textos clínicos ilustrativos, sem validade médica.\nNão inclui backend, banco ou testes automatizados da aplicação. Acesso por perfil é demonstrativo.\nSem upload, assinatura digital ou geração de PDF, conforme o escopo simplificado do desafio.')]
 for j,(a,b) in enumerate(sections):
  yy=822+j*184;rule(f,64,yy,1312);tx(f,a,64,yy+21,1280,20,weight='Medium');tx(f,b,64,yy+66,1290,15,'muted',lh=175)
 # Flow map is textual to remain native and editable.
 f=n('frame','06 · Fluxos e cobertura',pg,1560,0,1440,1100,'paper',children=[],clip=True);title(f,'Da agenda ao resultado.',64,54,1260,58)
 for j,(a,b) in enumerate([('Equipe / agendamento','Entrar → Agenda → Novo agendamento → Confirmado → Detalhe'),('Equipe / laudo','Detalhe → Editor → Rascunho salvo → Revisão → Publicado → Leitura'),('Paciente / cuidado','Entrar → Visão geral → Meus exames → Meus laudos → Leitura'),('Exceções','Conflito de horário / cancelamento / sem exames / acesso restrito')]):
  yy=199+j*166;tx(f,a,64,yy,1250,23,weight='Medium');tx(f,b,64,yy+51,1270,18,'muted');rule(f,64,yy+117,1312)
 tx(f,'PROTÓTIPO',64,917,1250,11,'muted',weight='Medium');tx(f,'Use Apresentar e inicie por Entrar em cada página de dispositivo.\nAs ações principais navegam entre quadros de demonstração; campos não enviam dados.',64,957,1250,17,'muted')

brandpage=page('01 · Fundamentos');foundation(brandpage)
kit=page('02 · Componentes');components(kit)
spec=page('03 · Responsividade & fluxos');guide(spec)
names=['Entrar','Agenda','Agendar','Agendado','Detalhe','Editor','Rascunho salvo','Publicar','Publicado','Detalhe publicado','Laudos','Leitura equipe','Conflito','Cancelar','Cancelado','Portal','Meus exames','Meus laudos','Laudo paciente','Sem exames','Acesso restrito']
for v,w in [('Desktop',1440),('Tablet',834),('Mobile',390)]:
 pg=page(f'{len(D["pages"])+1:02d} · {v} / {w}')
 for j,name in enumerate(names):
  f=frame(pg,name,v,j,w)
  if name=='Entrar':auth(f,v)
  elif name=='Agenda':agenda(f,v)
  elif name in ['Agendar','Conflito']:schedule(f,v,name=='Conflito')
  elif name in ['Detalhe','Detalhe publicado']:detail(f,v,name=='Detalhe publicado')
  elif name=='Editor':editor(f,v)
  elif name=='Laudos':reports(f,v)
  elif name in ['Portal','Meus exames']:portal(f,v,name=='Meus exames')
  elif name=='Meus laudos':reports(f,v,True)
  elif name in ['Laudo paciente','Leitura equipe']:read(f,v,name=='Laudo paciente')
  else:state_screen(f,v,name)
 D['nodes'][str(pg)]['flows']=[{'name':'Equipe / Agenda e laudos','start':screens[('Entrar',v)],'description':'Entrar como equipe → Agenda → Agendar / Laudos'},{'name':'Paciente / Exames e resultados','start':screens[('Portal',v)],'description':'Portal → Meus exames → Laudo publicado'},{'name':'Exceção / Horário ocupado','start':screens[('Conflito',v)],'description':'Concorrência por um horário → escolher outro'},{'name':'Exceção / Sem exames','start':screens[('Sem exames',v)],'description':'Estado vazio do paciente'}]
for i,k,v in links:
 if (k,v) in screens:D['nodes'][str(i)]['interactions']=[{'trigger':{'type':'onClick'},'actions':[{'type':'navigate','dest':screens[(k,v)]}],'transition':{'type':'instant'},'duration_ms':180,'easing':'easeOut'}]
# Native reusable local styles and semantic variables follow the app document schema.
D['document_colors']=[color(c) for c in P.values()]
D['current_page']=D['pages'][3]
with zipfile.ZipFile(O/'Auren-Design-System.figcraft','w',zipfile.ZIP_DEFLATED) as z:z.writestr('document.json',json.dumps(D,ensure_ascii=False))
(O/'Auren-tokens.json').write_text(json.dumps({'color':P,'font':{'display':'Georgia','interface':'Inter'},'space':[4,8,12,16,24,32,48,64],'radius':{'control':8,'card':12,'feature':16},'controlHeight':48,'breakpoints':{'mobile':0,'tablet':768,'desktop':1200},'timezone':'America/Sao_Paulo'},indent=2),encoding='utf-8')
(O/'Leia-me.md').write_text('# Auren — Design System\n\nAbra Auren-Design-System.figcraft no FigCraft. São 6 páginas: fundamentos, componentes, responsividade/fluxos e 21 telas para cada viewport (1440, 834 e 390 px).\n\nInicie por Entrar em Apresentar. Paciente e equipe possuem jornadas próprias. Campos e perfis são demonstrativos; não há autenticação ou backend. Todos os nomes e dados são fictícios.\n\nPaleta: Forest, Ivory, Sage e Champagne. Georgia nos títulos; Inter na interface. Tokens em Auren-tokens.json.\n\nBaseado no PDF desafio-tecnico-agendamento-exames-laudos.pdf. O trabalho entrega design e protótipo, não a implementação exigida pelo teste.\n',encoding='utf-8')
(O/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages':len(D['pages']),'screens':len(manifest),'layers':len(D['nodes']),'links':len(links),'components':sum(a['type']=='component' for a in D['nodes'].values()),'file':str(O/'Auren-Design-System.figcraft')}))
