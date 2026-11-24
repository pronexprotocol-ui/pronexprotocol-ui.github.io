/* Pronex_Study · 04-ecras.js
   Ecrãs: navegação, sessões de exercícios, Início, Estudar, módulo de Matemática, resultado, Comunidade, Perfil, calculadora e instalação.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* ================= Navegação ================= */
/* 1.25: Ranking com separador próprio; a Comunidade fica com as conversas e o mural; o Nex tem ecrã próprio (botão flutuante) */
const NAV=[['home','Início'],['study','Estudar'],['rank','Ranking'],['social','Turma'],['profile','Perfil']];let lastSocial='chat';
let view='home',modTab='ex',profTab='stats';
function navHTML(){const on=v=>v==='rank'?view==='comm'&&commTab==='rank':v==='social'?view==='comm'&&commTab!=='rank'&&commTab!=='ai':view===v||(v==='study'&&(view==='module'||view==='play'||view==='disc'));
  return NAV.map(([v,n])=>'<button type="button" data-go="'+v+'" aria-current="'+(on(v)?'page':'false')+'">'+(IC[v]||(v==='rank'?IC.trophy:v==='social'?IC.comm:''))+'<span>'+n+'</span></button>').join('');}
function renderChrome(){
  document.getElementById('snav').innerHTML=navHTML();document.getElementById('tabbar').innerHTML=navHTML();
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  const S=stats();
  document.getElementById('topstats').innerHTML='<span class="chipstat" role="img" aria-label="'+S.streak+' dias seguidos"><span class="flame" aria-hidden="true">'+IC.flame+'</span>'+S.streak+'</span><span class="chipstat" role="img" aria-label="'+S.xp+' XP"><span class="bolt" aria-hidden="true">'+IC.bolt+'</span>'+S.xp+'</span>';
  document.getElementById('sidecard').innerHTML='<div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">'+avatar(ME.nick||'?',ME.cor,'sm',ME.foto)+'<div style="min-width:0"><b style="display:block;font-size:.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(ME.nick||'Sem perfil')+'</b><span class="dim" style="font-size:.74rem">Nível '+S.lv.n+' · '+S.lv.name+'</span></div></div>'+
    '<div class="bar"><i style="width:'+Math.round(S.lv.into/S.lv.need*100)+'%"></i></div><div style="display:flex;justify-content:space-between;margin-top:8px;font:.74rem var(--f-mono);color:var(--dim)"><span class="flame">'+pl(S.streak,'dia','dias')+'</span><span>'+S.xp+' XP</span></div>';
}
function go(v){view=v;document.querySelectorAll('[data-view]').forEach(s=>s.hidden=s.dataset.view!==v);document.body.classList.toggle('playing',v==='play');if(v!=='play')closePanel();refresh();if(typeof appBar==='function')appBar();window.scrollTo(0,0);}
function refresh(){renderChrome();({home:renderHome,study:renderStudy,module:renderModule,comm:renderComm,profile:renderProfile,play:renderPlay})[view]();}
function avatar(nick,cor,size,foto){const ini=String(nick||'?').trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'?';const f=typeof safeImg==='function'?safeImg(foto):'';return'<span class="avatar '+(size||'')+' g'+((cor|0)%12)+(f?' ph':'')+'">'+(f?'<img src="'+f+'" alt="">':esc(ini))+'</span>';}

/* ================= Sessões ================= */
function weakTypes(k){const m=typeAgg();return Object.values(m).filter(a=>active().includes(a.t)&&a.d>=1&&a.o/a.d<.8).sort((a,b)=>a.o/a.d-b.o/b.d||b.d-a.d).slice(0,k);}
/* 1.27: números novos para gémeos e refazer, numa faixa própria e sem repetir */
function newN(){st.nn=((st.nn|0)||0)+1;return 60000+st.nn*7+Math.floor(Math.random()*5);}
function startSess(kind,t){
  let list=[],title='';
  if(kind==='tipo'){/* 1.26: se a ronda deste tipo já está toda respondida, abre uma ronda nova com números novos */
    if(Array.from({length:CNT(t)},(_,n)=>K(t,n)).every(k=>st.ans[k]!=null)){st.v=st.v||{};st.v[t]=(st.v[t]||0)+1;save();}
    list=Array.from({length:CNT(t)},(_,n)=>[t,n]);title=TYPES[t].n;}
  else if(kind==='sim'){st.sr=(st.sr||0)+1;const b=300+st.sr*6;
    [[0,0],[1,0],[4,0],[3,1],[8,0],[9,0],[5,0],[26,2],[27,0],[27,1],[28,0],[29,0],[13,0],[14,0]].forEach(([tt,o])=>list.push([tt,b+o]));title='Simulação do teste';}
  else if(kind==='recap'){const ts=[...new Set(allItems().map(i=>i.t))].filter(x=>TYPES[x]&&active().includes(x));if(!ts.length){startSess('sim');return;}
    st.rr=(st.rr||0)+1;ts.forEach(x=>{list.push([x,50+2*st.rr]);list.push([x,51+2*st.rr]);});list=G(mulberry32(777+st.rr)).shuffle(list).slice(0,20);title='Recapitulação';}
  else if(kind==='weak'){const w=weakTypes(6).map(x=>x.t);if(!w.length){toast('Não tens pontos fracos. Faz uma simulação.');startSess('sim');return;}
    st.wr=(st.wr||0)+1;w.forEach(x=>{list.push([x,600+2*st.wr]);list.push([x,601+2*st.wr]);});list=G(mulberry32(31+st.wr)).shuffle(list);title='Pontos fracos';}
  else if(kind==='rev'){const due=reviewDue();if(!due.length){toast('Não tens revisões pendentes hoje.');return;}st.rv=(st.rv||0)+1;due.forEach(x=>{list.push([x,900+2*st.rv]);list.push([x,901+2*st.rv]);});list=G(mulberry32(55+st.rv)).shuffle(list).slice(0,16);title='Revisão';}
  else if(kind==='mix'){st.mr=(st.mr||0)+1;list=G(mulberry32(91+st.mr)).shuffle(active()).slice(0,12).map(x=>[x,800+st.mr*2]);title='Misturado';}
  st.sess={kind,title,list,i:0,t};aiState=null;save();go('play');loadPad();
}
function sessStep(d){const S=st.sess;S.i=Math.max(0,Math.min(S.list.length-1,S.i+d));aiState=null;save();loadPad();renderPlay();window.scrollTo(0,0);}

/* ================= Início ================= */

function ringSVG(p){const r=52,c=2*Math.PI*r;return'<svg viewBox="0 0 120 120"><defs><linearGradient id="rg" x1="0" x2="1"><stop offset="0" stop-color="#00E5FF"/><stop offset=".5" stop-color="#1E3AFF"/><stop offset="1" stop-color="#7B2CFF"/></linearGradient></defs><circle cx="60" cy="60" r="'+r+'" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="10"/><circle cx="60" cy="60" r="'+r+'" fill="none" stroke="url(#rg)" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+(c*Math.min(1,p)).toFixed(1)+' '+c.toFixed(1)+'"/></svg>';}
function subjCard(s){const on=!!s.on;let meta='';
  if(on){const agg=typeAgg(),ts=active(),dom=ts.filter(t=>agg[t]&&agg[t].d>=3&&agg[t].o/agg[t].d>=.8).length;meta='<span>'+dom+'/'+ts.length+' dominados</span><span class="pill new">Ativa</span>';}
  else meta='<span>Conteúdos a caminho</span><span class="pill soon">Em breve</span>';
  return'<button type="button" class="subj'+(on?' on1':' off')+'" '+(on?'data-subj="'+s.id+'"':'aria-disabled="true"')+'><span class="ic '+s.g+'">'+IC[s.ic]+'</span><b>'+esc(s.n)+'</b>'+(on?'<span class="dim" style="font-size:.8rem">'+esc(s.mods[0].n)+'</span>':'')+'<div class="meta">'+meta+'</div></button>';}
function bindCommon(el){
  el.querySelectorAll('[data-go2]').forEach(b=>b.onclick=()=>{if(b.dataset.go2==='profile')profTab=b.dataset.tab||'edit';go(b.dataset.go2);});
  el.querySelectorAll('[data-tt]').forEach(b=>b.onclick=()=>startSess('tipo',+b.dataset.tt));
  el.querySelectorAll('[data-subj]').forEach(b=>b.onclick=()=>{modTab='ex';go('module');});
  el.querySelectorAll('.subj.off').forEach(b=>b.onclick=()=>toast(b.querySelector('b').textContent+' chega em breve ao Study.'));
}

/* ================= Estudar ================= */
function renderStudy(){
  let h='<div class="pagehead"><div class="eyebrow">Biblioteca</div><h1>Disciplinas</h1><p class="muted">Escolhe uma disciplina. Em cada uma há um trilho de conceitos, do mais simples ao mais exigente.</p></div>';
  h+='<div class="sect"><div class="subjects">'+SUBJ.map(subjCard).join('')+'</div></div>';
  const el=document.getElementById('v-study');el.innerHTML=h;bindCommon(el);
}

/* ================= Módulo P1 ================= */
let ff='Eleições';
/* ================= v2: efeitos, som e vibração ================= */
/* 1.26: «Reduzir movimento» lido sempre (sistema ou opção da app), em vez de só no arranque */
Object.defineProperty(window,'RM',{configurable:true,get(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches||!!(document.body&&document.body.classList.contains('x11rm'));}catch(e){return false;}}});
let fxCanvas=null,fxCtx=null,parts=[],fxRun=false;
function fxInit(){if(fxCanvas)return;fxCanvas=document.createElement('canvas');fxCanvas.className='fxc';document.body.appendChild(fxCanvas);fxCtx=fxCanvas.getContext('2d');
  const r=()=>{const d=window.devicePixelRatio||1;fxCanvas.width=innerWidth*d;fxCanvas.height=innerHeight*d;fxCtx.setTransform(d,0,0,d,0,0);};r();addEventListener('resize',r);}
const FXC=['#00E5FF','#1E3AFF','#7B2CFF','#2EE6A6','#FFFFFF','#6E8BFF'];
function addParts(list){fxInit();parts=parts.concat(list);if(!fxRun){fxRun=true;requestAnimationFrame(fxStep);}}
function burst(x,y,n){if(RM)return;const L=[];for(let i=0;i<(n||28);i++){const a=Math.random()*Math.PI*2,s=2+Math.random()*5.5;L.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-2.5,r:3+Math.random()*5,rot:Math.random()*6,vr:(Math.random()-.5)*.3,c:FXC[i%FXC.length],l:1,g:.18});}addParts(L);}
function rain(){if(RM)return;const L=[];for(let i=0;i<110;i++)L.push({x:Math.random()*innerWidth,y:-20-Math.random()*260,vx:(Math.random()-.5)*1.6,vy:1.5+Math.random()*2.5,r:3+Math.random()*6,rot:Math.random()*6,vr:(Math.random()-.5)*.2,c:FXC[i%FXC.length],l:2.2,g:.05});addParts(L);}
function fxStep(){fxCtx.clearRect(0,0,innerWidth,innerHeight);parts=parts.filter(p=>p.l>0&&p.y<innerHeight+40);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=p.g;p.vx*=.985;p.rot+=p.vr;p.l-=.016;fxCtx.save();fxCtx.globalAlpha=Math.max(0,Math.min(1,p.l));fxCtx.translate(p.x,p.y);fxCtx.rotate(p.rot);fxCtx.fillStyle=p.c;
    fxCtx.beginPath();fxCtx.moveTo(0,-p.r);fxCtx.lineTo(p.r*.72,0);fxCtx.lineTo(0,p.r);fxCtx.lineTo(-p.r*.72,0);fxCtx.closePath();fxCtx.fill();fxCtx.restore();});
  if(parts.length)requestAnimationFrame(fxStep);else{fxRun=false;fxCtx.clearRect(0,0,innerWidth,innerHeight);}}
function floatXP(x,y,txt){if(RM)return;const d=document.createElement('div');d.className='floatxp';d.textContent=txt;d.style.left=x+'px';d.style.top=y+'px';document.body.appendChild(d);setTimeout(()=>d.remove(),1100);}
function haptic(p){try{if(ME.haptic!==false&&navigator.vibrate)navigator.vibrate(p);}catch(e){}}
let actx=null;
function tone(seq){if(!ME.sound)return;try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t0=actx.currentTime+.01;
  seq.forEach(([f,d,s])=>{const o=actx.createOscillator(),g=actx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(0.0001,t0+s);g.gain.exponentialRampToValueAtTime(.09,t0+s+.012);g.gain.exponentialRampToValueAtTime(.0001,t0+s+d);o.connect(g);g.connect(actx.destination);o.start(t0+s);o.stop(t0+s+d+.03);});}catch(e){}}
const SND={ok:[[784,.12,0],[1175,.2,.08]],bad:[[247,.2,0],[196,.26,.09]],win:[[523,.14,0],[659,.14,.11],[784,.14,.22],[1047,.34,.33]],tap:[[880,.05,0]]};

/* ================= v2: coroas, missões, semana ================= */
function crownsOf(a){if(!a)return 0;const p=a.o/a.d;return a.o>=10&&p>=.85?3:a.o>=6&&p>=.7?2:a.o>=3&&p>=.6?1:0;}
function bestRun(items){let m=0,c=0;items.forEach(i=>{c=i.ok?c+1:0;if(c>m)m=c;});return m;}
/* 1.25: a 3.ª missão passa a servir todas as disciplinas (desde 18 nov 2026; os dias anteriores ficam como estavam) */
function missionsFor(items,goal,date){items=realItems(items);
  const sim=items.filter(i=>i.mode==='sim').length,weak=items.filter(i=>i.mode==='weak').length,run=bestRun(items),novo=(date||today())>='2026-11-18';
  const areas=new Set(items.filter(i=>i.ok).map(i=>i.tema||'')).size;
  return[
    {n:'Faz '+goal+' exercícios',ic:'target',p:Math.min(items.length,goal),m:goal},
    {n:'Acerta 5 seguidos',ic:'flame',p:Math.min(run,5),m:5},
    novo?{n:'Acerta em 2 temas ou disciplinas diferentes',ic:'trophy',p:Math.min(areas,2),m:2}:{n:'Completa uma simulação ou 6 de pontos fracos',ic:'trophy',p:(sim>=14||weak>=6)?1:0,m:1}
  ].map(x=>Object.assign(x,{done:x.p>=x.m}));}
function missionXP(){let x=0;HIST.forEach(d=>{if(d.date==='0000-anteriores')return;x+=missionsFor(d.items||[],d.goal||15,d.date).filter(m=>m.done).length*20;});return x;}
function weekData(){const out=[],d=new Date();d.setDate(d.getDate()-6);const L=['dom','seg','ter','qua','qui','sex','sáb'];
  for(let i=0;i<7;i++){const k=dstr(d),day=HIST.find(x=>x.date===k);out.push({k,lab:L[d.getDay()],n:day?(day.items||[]).length:0,today:k===today()});d.setDate(d.getDate()+1);}return out;}
function nextType(agg){const A=active();let best=null,bs=1e9;A.forEach(t=>{const a=agg[t],c=crownsOf(a),p=a?a.o/a.d:0;const s=c*100+(a?p*50:-20)-(TYPES[t].pri?15:0)+t*.01;if(c<3&&s<bs){bs=s;best=t;}});return best==null?A[0]:best;}
function crownRow(c){let h='';for(let i=0;i<3;i++)h+=IC.crown.replace('<svg','<svg class="'+(i<c?'on':'')+'"');return'<span class="crw" aria-label="'+c+' de 3 coroas">'+h+'</span>';}

/* ================= v2: Início ================= */
function renderHome(){
  const S=stats(),goal=ME.goal||15,pct=S.today/goal,sess=st.sess,cont=sess&&sess.list.some(([t,n])=>st.ans[K(t,n)]===undefined);
  const tday=HIST.find(d=>d.date===today()),todayItems=(tday||{items:[]}).items,M=missionsFor(todayItems,(tday&&tday.goal)||goal),DUE=reviewDue(),W=weekData(),wmax=Math.max(goal,...W.map(w=>w.n));
  const hr=new Date().getHours(),sal=hr<6?'Boa noite':hr<12?'Bom dia':hr<20?'Boa tarde':'Boa noite';
  const msg=S.today>=goal?'Objetivo de hoje cumprido. O que fizeres agora é avanço extra.':S.streak>0&&S.today===0?'Tens '+S.streak+' dia'+(S.streak>1?'s':'')+' seguidos. Um exercício hoje mantém a sequência.':'Escolhe o curso que queres praticar hoje.';
  let h=installCardHTML();
  let tipX=false;try{tipX=localStorage.getItem('ps-tip-link')===today();}catch(e){}
  if(isAnon()&&S.total>=5&&!tipX)h+='<div class="tip" style="margin-bottom:14px">'+IC.info+'<div style="flex:1"><b>Liga a tua conta</b><p class="muted" style="font-size:.86rem;margin-top:2px">Já tens '+S.total+' exercícios e '+S.xp+' XP. Liga ao Google ou a um email para não perderes nada se trocares de telemóvel.</p></div><button type="button" class="btn sm cy" data-go2="profile" data-tab="acc">Ligar</button><button type="button" class="xbtn" id="tip-x" aria-label="Agora não">✕</button></div>';
  h+='<div class="hero hero2"><div><div class="eyebrow">'+sal+(ME.nick?', '+esc(ME.nick):'')+'</div><h1 style="margin-top:6px">Estuda ao nível<br>do <span class="gt">teu objetivo.</span></h1><p class="sub">'+esc(msg)+'</p>'+
    '<div class="hchips"><span class="chipstat"><span class="flame">'+IC.flame+'</span>'+pl(S.streak,'dia','dias')+'</span>'+(st.frz&&st.frz.have?'<span class="chipstat frz" title="Proteções de sequência: usam-se sozinhas se falhares um dia"><span>'+IC.snow+'</span>'+st.frz.have+'</span>':'')+'<span class="chipstat"><span class="bolt">'+IC.bolt+'</span>'+S.xp+' XP</span><span class="chipstat">Nível '+S.lv.n+' · '+S.lv.name+'</span></div></div>'+
    '<div class="ring">'+ringSVG(pct)+'<div class="in"><div><b>'+S.today+'<span style="font-size:.9rem;color:var(--dim)">/'+goal+'</span></b><span>objetivo de hoje</span></div></div></div></div>';
  if(cont)h+='<button type="button" class="card contcard" id="h-cont"><span class="hex s2" style="width:52px;height:58px">'+IC.bolt+'</span><div><div class="eyebrow">Continuar onde paraste</div><b>'+esc(sess.title)+'</b><span class="dim" style="font-size:.82rem;display:block">Exercício '+(sess.i+1)+' de '+sess.list.length+' · Matemática</span></div><span class="arr">→</span></button>';
  h+=testCardHTML();
  h+='<div class="sect"><div class="sect-h"><div><h2>O que vais praticar?</h2><p class="muted" style="font-size:.88rem;margin-top:4px">Escolhe um curso para começar.</p></div></div><div class="subjects big">'+SUBJ.filter(x=>x.on).map(subjCard).join('')+'</div><div class="soon"><span class="eyebrow" style="color:var(--dim)">A caminho</span><div class="soonl">'+SUBJ.filter(x=>!x.on).map(x=>'<span class="soonc"><span class="ic '+x.g+'">'+IC[x.ic]+'</span>'+esc(x.n)+'</span>').join('')+'</div></div></div>'+
  (DUE.length?'<button type="button" class="card contcard" id="h-rev" style="margin-top:16px"><span class="hex s1" style="width:52px;height:58px">'+IC.repeat+'</span><div><div class="eyebrow">Revisão de hoje</div><b>'+DUE.length+' tipo'+(DUE.length>1?'s':'')+' para rever</b><span class="dim" style="font-size:.82rem;display:block">Exercícios onde erraste, no momento certo para não esquecer.</span></div><span class="arr">→</span></button>':'');
  h+='<div class="home2"><div class="card"><div class="cardh"><h2>Missões de hoje</h2><span>'+M.filter(m=>m.done).length+'/3 · +20 XP cada</span></div><div class="missions">'+
    M.map(m=>'<div class="mis'+(m.done?' done':'')+'"><span class="mi">'+(m.done?IC.check:IC[m.ic])+'</span><div><b>'+esc(m.n)+'</b><div class="bar"><i class="'+(m.done?'ok':'')+'" style="width:'+Math.round(m.p/m.m*100)+'%"></i></div></div><span class="rw">'+(m.done?'feito':m.p+'/'+m.m)+'</span></div>').join('')+'</div></div>';
  h+='<div class="card"><div class="cardh"><h2>Esta semana</h2><span>'+W.reduce((s,w)=>s+w.n,0)+' exercícios</span></div><div class="week">'+
    W.map(w=>'<div><em>'+(w.n||'')+'</em><i class="'+(w.n?'on':'')+(w.today?' today':'')+'" style="height:'+Math.max(4,Math.round(w.n/wmax*86))+'px"></i><span>'+w.lab+'</span></div>').join('')+'</div></div></div>';
  const el=document.getElementById('v-home');el.innerHTML=h;bindCommon(el);
  bindInstall(el);const tcs=el.querySelector('#tc-sim');if(tcs)tcs.onclick=()=>startSess(testDays()<=1&&weakTypes(1).length?'weak':'sim');const tx=el.querySelector('#tip-x');if(tx)tx.onclick=()=>{try{localStorage.setItem('ps-tip-link',today());}catch(e){}renderHome();};const c=el.querySelector('#h-cont');if(c)c.onclick=()=>{go('play');loadPad();};const rv=el.querySelector('#h-rev');if(rv)rv.onclick=()=>startSess('rev');
}

/* ================= v2: Módulo com trilho ================= */
const ZIG=[0,70,100,70,0,-70,-100,-70];
function renderModule(){
  const agg=typeAgg(),A=active(),dom=A.filter(t=>crownsOf(agg[t])>=2).length,nt=nextType(agg),crT=A.reduce((s,t)=>s+crownsOf(agg[t]),0);
  let h='<button type="button" class="back" data-go2="study">← Disciplinas</button><div class="pagehead"><div class="eyebrow">// matemática · módulo P1</div><h1>Modelos matemáticos<br>para a cidadania</h1><p class="muted">Eleições, partilha, recibo de vencimento, IRS, juros e crédito.</p></div>';
  h+='<div class="card" style="margin-top:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;text-align:center"><div><b style="font:800 1.4rem var(--f-display)">'+Math.round(crT/Math.max(1,A.length*3)*100)+'<span class="dim" style="font-size:.9rem">%</span></b><div class="dim" style="font-size:.74rem">da matéria dominada</div></div><div><b style="font:800 1.4rem var(--f-display)">'+dom+'</b><div class="dim" style="font-size:.74rem">tipos quase dominados</div></div><div><b style="font:800 1.4rem var(--f-display)">'+(bestSim()!=null?bestSim()+'/14':'—')+'</b><div class="dim" style="font-size:.74rem">melhor simulação</div></div></div>';
  h+='<div class="sect"><div class="modes">'+
    '<button type="button" class="mode main" data-mode="sim"><b>Simulação do teste</b><span>14 exercícios pela ordem do teste</span></button>'+
    '<button type="button" class="mode" data-mode="weak"><b>Pontos fracos</b><span>Onde acertas menos</span></button>'+
    '<button type="button" class="mode" data-mode="recap"><b>Recapitulação</b><span>Números novos do que já fizeste</span></button>'+
    '<button type="button" class="mode" data-mode="rev"><b>Revisão dos erros'+(reviewDue().length?' · '+reviewDue().length:'')+'</b><span>O que erraste, na altura certa</span></button></div></div>';
  h+='<div class="sect"><div class="sect-h"><div class="seg" role="group"><button type="button" data-mt="ex" aria-pressed="'+(modTab==='ex')+'">Trilho</button><button type="button" data-mt="form" aria-pressed="'+(modTab==='form')+'">Fórmulas</button></div>'+
    (modTab==='ex'?'<label class="toggle"><input type="checkbox" id="showall"'+(st.showAll?' checked':'')+'> Borda, Hondt e Sainte-Laguë</label>':'<div class="chips">'+['Eleições','Partilha','Finanças'].map(t=>'<button type="button" class="chip" data-ff="'+t+'" aria-pressed="'+(ff===t)+'">'+t+'</button>').join('')+'</div>')+'</div>';
  if(modTab==='ex'){let i=0;h+='<div class="chapjump">'+TEMAS.map((tm,ci)=>A.some(t=>TYPES[t].t===tm)?'<button type="button" class="chip" data-jump="'+ci+'">'+tm+'</button>':'').join('')+'<button type="button" class="chip" data-jump="boss">Teste final</button></div><div class="trail">';
    TEMAS.forEach((tm,ci)=>{const ts=A.filter(t=>TYPES[t].t===tm);if(!ts.length)return;
      h+='<div class="chap" id="chap'+ci+'"><span>Capítulo 0'+(ci+1)+' · '+tm+'</span></div>';
      ts.forEach(t=>{const a=agg[t],c=crownsOf(a),cls=c?'s'+c:a?'prog':'new';const x=Math.round(ZIG[i++%ZIG.length]*(innerWidth>900?1.7:1));
        h+='<div class="nrow"><button type="button" class="node '+cls+(t===nt?' rec':'')+'" data-node="'+t+'" style="transform:translateX('+x+'px)">'+(t===nt?'<span class="ring2"></span>':'')+'<span class="hex">'+hexIcon(t)+'</span>'+crownRow(c)+'<span class="lab">'+esc(TYPES[t].n)+'</span></button></div>';});});
    h+='<div class="nrow boss" id="chapboss"><button type="button" class="node boss" data-mode="sim"><span class="hex">'+IC.crown+'</span><span class="lab">Teste final</span><span class="dim" style="font-size:.74rem">Simulação de 14 exercícios</span></button></div></div>';
  }else{const keys=Object.keys(HELP).filter(k=>HELP[k].t===ff);h+='<div class="form-grid">'+keys.map(helpCard).join('')+'</div>';}
  h+='</div>';
  const el=document.getElementById('v-module');el.innerHTML=h;bindCommon(el);
  el.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>startSess(b.dataset.mode));
  el.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>openNode(+b.dataset.node));el.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const x=document.getElementById('chap'+b.dataset.jump);if(x)x.scrollIntoView({behavior:RM?'auto':'smooth',block:'start'});});
  el.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>{modTab=b.dataset.mt;renderModule();});
  el.querySelectorAll('[data-ff]').forEach(b=>b.onclick=()=>{ff=b.dataset.ff;renderModule();});
  const sa=el.querySelector('#showall');if(sa)sa.onchange=e=>{st.showAll=e.target.checked;save();renderModule();};
}
function closeSheet(){document.querySelectorAll('.sheet-bg,.nsheet').forEach(x=>x.remove());document.removeEventListener('keydown',sheetKey);}
function sheetKey(e){if(e.key==='Escape')closeSheet();}
function openNode(t){
  closeSheet();const a=typeAgg()[t],c=crownsOf(a),TY=TYPES[t];
  const need=c===0?'Domínio 1 de 3: 3 certas com 60% de acerto':c===1?'Domínio 2 de 3: 6 certas com 70% de acerto':c===2?'Domínio 3 de 3: 10 certas com 85% de acerto':'Tipo dominado. Volta cá para manter.';
  const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label',TY.n);
  sh.innerHTML='<span class="grab"></span><div class="top"><span class="hex '+(c?'s'+c:'')+'" style="'+(c?'':'background:var(--surface2)')+'">'+hexIcon(t)+'</span><div><div class="eyebrow">'+TY.t+'</div><h2 style="font-size:1.3rem;margin-top:2px">'+esc(TY.n)+'</h2><div style="margin-top:6px">'+crownRow(c)+'</div></div></div>'+
    '<div class="ministats"><div><b>'+(a?a.d:0)+'</b><span>feitos</span></div><div><b>'+(a?a.o:0)+'</b><span>certos</span></div><div><b>'+(a?Math.round(a.o/a.d*100)+'%':'—')+'</b><span>acerto</span></div></div>'+
    '<p class="muted" style="font-size:.88rem;display:flex;gap:8px;align-items:center"><span style="width:16px;height:16px;color:var(--warn);display:inline-flex">'+IC.crown+'</span>'+need+'</p>'+
    '<div class="acts"><button type="button" class="btn" id="ns-learn">'+IC.learn.replace('<svg','<svg width="16" height="16"')+'Aprender</button><button type="button" class="btn" id="ns-form">Ver fórmula</button><button type="button" class="btn pri" id="ns-go">Começar · '+CNT(t)+' exercícios</button></div><div id="ns-help"></div>';
  document.body.appendChild(bg);document.body.appendChild(sh);document.addEventListener('keydown',sheetKey);
  sh.querySelector('#ns-go').onclick=()=>{if(!a&&!(st.lessons&&st.lessons[t])){openLesson(t);return;}closeSheet();startSess('tipo',t);};sh.querySelector('#ns-learn').onclick=()=>openLesson(t);
  sh.querySelector('#ns-form').onclick=e=>{const box=sh.querySelector('#ns-help');box.innerHTML=box.innerHTML?'':helpCard(TY.h);e.target.textContent=box.innerHTML?'Esconder fórmula':'Ver fórmula';};
  sh.querySelector('#ns-go').focus();
}

/* ================= v2: Resultado da sessão ================= */
function showResult(S){
  const done=S.list.filter(([t,n])=>st.ans[K(t,n)]!==undefined),okN=done.filter(([t,n])=>st.ans[K(t,n)]===ex(t,n).a).length,p=Math.round(okN/done.length*100);
  let run=0,c=0;S.list.forEach(([t,n])=>{c=st.ans[K(t,n)]===ex(t,n).a?c+1:0;run=Math.max(run,c);});
  const xp=(typeof X17!=='undefined'?X17.sessGain(S):okN*10+(done.length-okN)*2);
  const head=p===100?'Perfeito.':p>=80?'Muito bem.':p>=60?'Bom caminho.':'Ainda não.';
  const line=p===100?'Acertaste tudo. Estás pronto para isto.':p>=80?'Mais uma volta e fica consolidado.':p>=60?'Revê os errados com a correção e repete a sessão.':'Abre cada errado, lê a correção passo a passo e repete. É assim que fixa.';
  const r=document.createElement('div');r.className='result';r.setAttribute('role','dialog');r.setAttribute('aria-label','Resultado');
  r.innerHTML='<div class="box"><div class="eyebrow">'+esc(S.title)+' · concluída</div><h1>'+head+'</h1><div class="bigpct gt" id="r-pct">0%</div><p class="line">'+line+'</p>'+
    '<div class="rstats"><div style="animation-delay:.55s"><b>'+okN+'/'+done.length+'</b><span>certas</span></div><div style="animation-delay:.7s"><b class="gt">+'+xp+'</b><span>XP ganho</span></div><div style="animation-delay:.85s"><b>'+run+'</b><span>seguidas</span></div></div>'+
    '<div class="acts">'+(done.length-okN>0?'<button type="button" class="btn pri" id="r-redo">Refazer os '+(done.length-okN)+' errado'+(done.length-okN>1?'s':'')+' com números novos</button>':'')+'<button type="button" class="btn'+(done.length-okN>0?'':' pri')+'" id="r-again">'+(S.kind==='tipo'?'Treinar outra vez':'Nova sessão')+'</button><button type="button" class="btn" id="r-rev">Ver correções</button><button type="button" class="btn ghost" id="r-home">Voltar ao trilho</button></div></div>';
  document.body.appendChild(r);
  const el=r.querySelector('#r-pct');if(RM)el.textContent=p+'%';else{const t0=performance.now();const tick=now=>{const k=Math.min(1,(now-t0)/1100),e=1-Math.pow(1-k,3);el.textContent=Math.round(p*e)+'%';if(k<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);}
  if(p>=60){setTimeout(()=>{rain();tone(SND.win);haptic([30,40,30,40,60]);},350);}
  const close=()=>r.remove();
  r.querySelector('#r-again').onclick=()=>{close();if(S.kind==='tipo'){st.v[S.t]=(st.v[S.t]||0)+1;startSess('tipo',S.t);}else if(S.kind==='redo')go('home');else startSess(S.kind);};
  const rd=r.querySelector('#r-redo');if(rd)rd.onclick=()=>{close();const wr=done.filter(([t,n])=>st.ans[K(t,n)]!==ex(t,n).a);st.sess={kind:'redo',title:'Refazer os errados',list:wr.map(([t])=>[t,newN()]),i:0,t:S.t};aiState=null;save();go('play');loadPad();};
  r.querySelector('#r-rev').onclick=()=>{close();renderPlay();setTimeout(()=>{const s=document.querySelector('.summary');if(s)s.scrollIntoView({behavior:RM?'auto':'smooth'});},50);};
  r.querySelector('#r-home').onclick=()=>{close();modTab='ex';go('module');};
  r.querySelector('#r-again').focus();
}

/* ================= v2: Arranque e primeira utilização ================= */
function splash(done){
  /* 1.41: o ecrã de arranque é o da marca PRONEX (js/marca.js), comum ao Freelancer. O código antigo fica por baixo, para o caso de marca.js faltar. */
  if(typeof window.pxSplash==='function'){window.pxSplash(done);return;}
  let shown=false;try{shown=sessionStorage.getItem('ps-splash')==='1';sessionStorage.setItem('ps-splash','1');}catch(e){}
  if(shown||RM){done();return;}
  const s=document.createElement('div');s.className='splash';s.innerHTML='<div class="in"><img src="'+document.querySelector('.brand img').src+'" alt=""><b>Pronex<span>_</span>Study</b><code class="caret" id="sp-t"></code></div>';
  document.body.appendChild(s);const txt='a preparar a tua sessão…',el=s.querySelector('#sp-t');let i=0;
  const iv=setInterval(()=>{el.textContent=txt.slice(0,++i);if(i>=txt.length)clearInterval(iv);},34);
  setTimeout(()=>{s.classList.add('out');setTimeout(()=>{s.remove();},500);done();},1500);
}
let onbStep=0,onbGoal=15,onbCor=0;
function onboarding(){
  if(hasProfile||st.onb)return;
  const o=document.createElement('div');o.className='onb';o.id='onb';document.body.appendChild(o);onbGoal=ME.goal||15;onbCor=ME.cor||0;renderOnb();
}
function renderOnb(){
  const o=document.getElementById('onb');if(!o)return;const logo=document.querySelector('.brand img').src;
  let h='<div class="box"><div class="dots">'+[0,1,2].map(i=>'<i class="'+(i<=onbStep?'on':'')+'"></i>').join('')+'</div>';
  if(onbStep===0){h+='<div class="step"><img class="logo" src="'+logo+'" alt=""><div class="eyebrow">PRONEX Study</div><h1>Estuda ao nível<br>do <span class="gt">teu objetivo.</span></h1><p class="muted">Exercícios com números sempre novos, correção passo a passo e o teu progresso à vista. Começa por Matemática; as outras disciplinas vêm a seguir.</p>'+
    '<div class="term"><div class="c" style="animation-delay:.2s">&gt; pronex_study --iniciar</div><div style="animation-delay:.5s"><span class="g">✓</span> exercícios gerados com números novos</div><div style="animation-delay:.8s"><span class="g">✓</span> correção passo a passo em cada resposta</div><div style="animation-delay:1.1s"><span class="g">✓</span> XP, sequência de dias e conquistas</div><div class="d" style="animation-delay:1.4s">// pronto. falta só o teu nome.</div></div></div>'+
    '<div class="foot"><button type="button" class="btn ghost" id="ob-skip">Saltar</button><button type="button" class="btn pri" id="ob-next">Começar</button></div>';}
  else if(onbStep===1){h+='<div class="step"><div class="eyebrow">Passo 2 de 3</div><h1>Quanto queres<br>treinar por dia?</h1><p class="muted">Podes mudar quando quiseres no perfil. A consistência conta mais do que a quantidade.</p><div class="goalopts">'+
    [[5,'Leve','~5 min'],[10,'Normal','~10 min'],[15,'Sério','~15 min'],[20,'Intenso','~20 min']].map(([n,l,m])=>'<button type="button" class="goalopt" data-g="'+n+'" aria-pressed="'+(onbGoal===n)+'"><em>'+l+'</em><b>'+n+'</b><span>exercícios · '+m+'</span></button>').join('')+'</div></div>'+
    '<div class="foot"><button type="button" class="btn ghost" id="ob-back">Voltar</button><button type="button" class="btn pri" id="ob-next">Continuar</button></div>';}
  else{h+='<div class="step"><div class="eyebrow">Passo 3 de 3</div><h1>Como te<br>chamamos?</h1><p class="muted">É o nome que aparece no teu perfil, no mural, no ranking e na conversa.</p>'+
    '<label class="f">Nome na app<input type="text" id="ob-nick" maxlength="30" value="'+esc(ME.nick)+'" placeholder="Ex.: Kaizer"></label>'+
    '<label class="f">Curso<input type="text" id="ob-curso" maxlength="40" value="'+esc(ME.curso||'')+'"></label>'+
    '<div class="f">Cor do avatar<div class="colors">'+[0,1,2,3,4,5].map(i=>'<button type="button" class="g'+i+'" data-c="'+i+'" aria-pressed="'+(onbCor===i)+'" aria-label="Cor '+(i+1)+'"></button>').join('')+'</div></div>'+
    '<p class="hint" style="margin:0">Ao entrares, o teu progresso, as publicações, as mensagens e o tipo de dispositivo ficam guardados na nuvem e o administrador da PRONEX pode vê-los. Mais detalhes em Perfil → Conta.</p></div>'+
    '<div class="foot"><button type="button" class="btn ghost" id="ob-back">Voltar</button><button type="button" class="btn pri" id="ob-done">Entrar na app</button></div>';}
  h+='</div>';o.innerHTML=h;
  const $=id=>o.querySelector('#'+id);
  if($('ob-next'))$('ob-next').onclick=()=>{onbStep++;tone(SND.tap);renderOnb();};
  if($('ob-back'))$('ob-back').onclick=()=>{onbStep--;renderOnb();};
  if($('ob-skip'))$('ob-skip').onclick=()=>{st.onb=true;save();o.remove();};
  o.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{onbGoal=+b.dataset.g;o.querySelectorAll('[data-g]').forEach(x=>x.setAttribute('aria-pressed',x===b));haptic(10);});
  o.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{onbCor=+b.dataset.c;o.querySelectorAll('[data-c]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  if($('ob-done'))$('ob-done').onclick=()=>{const nick=$('ob-nick').value.trim();if(!nick){$('ob-nick').focus();toast('Escreve o teu nome para continuar.');return;}
    ME=Object.assign(ME,{nick,curso:$('ob-curso').value.trim(),goal:onbGoal,cor:onbCor});hasProfile=true;st.onb=true;save();lastSync='';syncProfile();
    o.remove();refresh();burst(innerWidth/2,innerHeight/3,40);tone(SND.win);toast('Bem-vindo, '+nick+'.');};
  const f=o.querySelector('.goalopt[aria-pressed="true"],#ob-nick,#ob-next');if(f)f.focus();
}

/* ================= Exercício ================= */
let aiState=null,justKey=null;
function cur(){const S=st.sess;return S?{t:S.list[S.i][0],n:S.list[S.i][1]}:null;}
function renderPlay(){
  const S=st.sess;if(!S){go('home');return;}
  const c=cur(),E=ex(c.t,c.n),TY=TYPES[c.t],k=K(c.t,c.n),given=st.ans[k];
  const isJust=justKey===k;justKey=null;
  const done=S.list.filter(([t,n])=>st.ans[K(t,n)]!==undefined),okN=done.filter(([t,n])=>st.ans[K(t,n)]===ex(t,n).a).length;
  document.getElementById('p-title').textContent=S.title;
  document.getElementById('p-count').textContent='Exercício '+(S.i+1)+' de '+S.list.length+' · '+okN+' certos';
  document.getElementById('segs').innerHTML=S.list.map(([t,n],i)=>{const g=st.ans[K(t,n)];return'<i data-i="'+i+'" class="'+(g===undefined?'':g===ex(t,n).a?'ok':'bad')+(i===S.i?' cur':'')+'" title="Exercício '+(i+1)+'"></i>';}).join('');
  document.querySelectorAll('#segs i').forEach(x=>x.onclick=()=>{S.i=+x.dataset.i;aiState=null;save();loadPad();renderPlay();});
  let h='<div class="qtag"><span class="tag">'+TY.t+'</span><span class="qname">'+esc(TY.n)+'</span>'+((S.combo||0)>=2?'<span class="combo'+(isJust&&given===E.a?' hot':'')+'" style="margin-left:auto">'+IC.flame+S.combo+' seguidas</span>':'')+'</div><div class="ctx">'+E.c+'</div><p class="q">'+E.q+'</p><div class="opts">';
  E.o.forEach((o,j)=>{let cl='opt';if(given!==undefined){if(j===E.a)cl+=' ok';else if(j===given)cl+=' bad';if(isJust&&j===given)cl+=' just';}
    h+='<button type="button" class="'+cl+'" data-j="'+j+'"'+(given!==undefined?' disabled':'')+'><span class="let">'+'ABCD'[j]+'</span><span>'+o+'</span></button>';});
  h+='</div>';
  if(given!==undefined){const ok=given===E.a;
    const rem=(ME.goal||15)-todayCount();h+='<div class="fb '+(ok?'ok':'bad')+(isJust?' just':'')+'"><h3>'+(ok?'Certo!':'Quase. Vê onde o cálculo mudou de rumo.')+'<span class="xpgain">'+(st.rtk&&st.rtk[k]?'repetido · sem XP':'+'+(ok?10:2)+' XP')+'</span></h3>'+(ok?'':'<div class="cmp"><div class="c bad"><span>A tua resposta</span><b>('+'ABCD'[given]+') '+E.o[given]+'</b></div><div class="c ok"><span>Resposta certa</span><b>('+'ABCD'[E.a]+') '+E.o[E.a]+'</b></div></div>')+(isJust&&rem>0?'<p class="goalrem">'+(rem===1?'Falta 1 exercício':'Faltam '+rem+' exercícios')+' para o objetivo de hoje.</p>':'')+'<h4 class="steps-h">Resolução passo a passo</h4><ol>'+E.s.map(x=>'<li>'+x+'</li>').join('')+'</ol>'+(E.trap?'<p class="trap">'+E.trap+'</p>':'')+'</div>';
    if(typeof TNEX!=='undefined'){if(aiState&&aiState.key===k)h+='<div class="ai"><div class="h">'+IC.spark+'Explicação do Nex</div><div class="body nxt" id="ai-body">'+TNEX.fmt(aiState.text)+'</div></div>';
      else h+='<div style="margin-top:12px"><button type="button" class="btn sm" id="ai-btn"><span style="color:var(--purple-t);display:inline-flex;width:16px">'+IC.spark+'</span>'+(ok?'Ver o método com o Nex':'Ver com o Nex onde errei')+'</button></div>';}
  }
  h+='<div class="qnav"><button type="button" class="btn" id="prev"'+(S.i===0?' disabled':'')+'>← Anterior</button>'+(given!==undefined&&given!==E.a&&['tipo','mix','weak','rev','redo'].includes(S.kind)?'<button type="button" class="btn ghost" id="twin">Outro igual, com números novos</button>':given!==undefined&&S.kind==='tipo'?'<button type="button" class="btn ghost" id="retry">Tentar de novo</button>':'')+
    '<button type="button" class="btn pri" id="next"'+(S.i===S.list.length-1?' disabled':'')+'>Seguinte →</button></div>';
  if(done.length===S.list.length){const p=Math.round(okN/done.length*100);
    const line=p===100?'Perfeito. Estás pronto.':p>=80?'Muito bom. Mais uma volta e fica consolidado.':p>=60?'Bom caminho. Revê os errados e repete.':'Revê as correções dos errados e repete: é assim que fixa.';
    h+='<div class="fb summary '+(p>=80?'ok':'bad')+'" style="margin-top:18px"><div class="celebrate"><div style="width:56px;height:56px;border-radius:16px;background:var(--grad);display:grid;place-items:center"><span style="width:28px;height:28px;color:#fff;display:inline-flex">'+IC.trophy+'</span></div><div><h3>'+esc(S.title)+': '+okN+' de '+done.length+' certas ('+p+'%)</h3><p class="muted" style="font-size:.9rem">'+line+(S.kind==='sim'&&done.length>=14?' · +50 XP de bónus':'')+'</p></div></div><div class="slist">'+
      S.list.map(([t,n],i)=>{const g=st.ans[K(t,n)],e=ex(t,n),o=g===e.a;return'<div class="srow"><span class="mk '+(o?'ok':'bad')+'">'+(o?'✓':'✗')+'</span><div class="tx"><b>'+(i+1)+'. '+esc(TYPES[t].n)+'</b>'+(o?esc(e.o[e.a]):'Escolheste '+esc(e.o[g])+' · certa '+esc(e.o[e.a]))+'</div><button type="button" class="btn sm ghost" data-goi="'+i+'">Ver</button></div>';}).join('')+
      '</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button type="button" class="btn pri" id="again">'+(S.kind==='tipo'?'Gerar exercícios novos':'Nova sessão')+'</button><button type="button" class="btn" id="tohome">Voltar ao início</button></div></div>';}
  const card=document.getElementById('qcard');card.innerHTML=h;
  card.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const g=+b.dataset.j,ok=g===E.a,r=b.getBoundingClientRect();const tb=todayCount(),wasSeen=!!(st.seen&&st.seen[k]);
    st.ans[k]=g;S.combo=ok?(S.combo||0)+1:0;save();record(c.t,c.n,g,S.kind);justKey=k;renderPlay();renderChrome();
    if(ok){burst(r.left+r.width/2,r.top+r.height/2,S.combo>=3?40:26);floatXP(r.left+r.width/2,r.top,wasSeen?'repetido':'+10 XP');tone(SND.ok);haptic(18);}else{tone(SND.bad);haptic([40,50,40]);}
    if(tb<ME.goal&&todayCount()>=ME.goal)setTimeout(()=>{frzTick();celebrateGoal();},700);
    const fb=card.querySelector('.fb');if(fb&&!RM)setTimeout(()=>{const rr=fb.getBoundingClientRect();if(rr.bottom>innerHeight)fb.scrollIntoView({behavior:'smooth',block:'nearest'});},380);
    const nowDone=S.list.every(([t,n])=>st.ans[K(t,n)]!==undefined);if(nowDone)setTimeout(()=>{if(view==='play'&&st.sess===S)showResult(S);},ok?900:1100);});
  const $=id=>card.querySelector('#'+id);
  $('prev').onclick=()=>sessStep(-1);$('next').onclick=()=>sessStep(1);
  if($('retry'))$('retry').onclick=()=>{delete st.ans[k];aiState=null;save();renderPlay();};
  /* 1.27: exercício gémeo (mesmo tipo, números novos) logo a seguir ao que errou */
  if($('twin'))$('twin').onclick=()=>{S.list.splice(S.i+1,0,[c.t,newN()]);S.i++;aiState=null;save();renderPlay();scrollTo(0,0);};
  if($('ai-btn'))$('ai-btn').onclick=()=>askExplain(c.t,c.n);
  if($('again'))$('again').onclick=()=>{if(S.kind==='tipo'){st.v[S.t]=(st.v[S.t]||0)+1;startSess('tipo',S.t);}else if(S.kind==='redo')go('home');else startSess(S.kind);};
  if($('tohome'))$('tohome').onclick=()=>go('home');
  card.querySelectorAll('[data-goi]').forEach(b=>b.onclick=()=>{S.i=+b.dataset.goi;aiState=null;save();loadPad();renderPlay();window.scrollTo(0,0);});
  if(panelTool==='help')document.getElementById('tp-help').innerHTML=helpCard(TY.h);
}
document.getElementById('quit').onclick=()=>go(st.sess&&st.sess.from?st.sess.from:(st.sess&&st.sess.kind?'module':'home'));

/* ================= Nex em Matemática ================= */
/* 1.33: a explicação sai do Nex (js/nex.js): fórmula, método, resolução e a armadilha do tipo, sem depender de modelo nem de internet. */
function askExplain(t,n){const E=ex(t,n),k=K(t,n),g=st.ans[k];if(g===undefined||typeof TNEX==='undefined')return;aiState={key:k,text:TNEX.explicaMat(t,E,g)};if(!ME.ai){ME.ai=1;syncProfile();}renderPlay();}
let histAI=null;
function askHistory(){if(typeof TNEX==='undefined')return;histAI={text:TNEX.analisaMat()};renderProfile();}

/* ================= Comunidade ================= */
const CHANS=[['geral','Geral','Conversa livre entre estudantes'],['matematica','Matemática','Dúvidas e dicas de Matemática'],['testes','Testes','Datas, matéria e preparação'],['sugestoes','Sugestões','Ideias para o Study']];
let rankMode='week',chan='geral',commTab='chat',msgs=[],unsubChat=null,chatState='idle';
function subChat(){if(!db)return;if(unsubChat)unsubChat();chatState='loading';msgs=[];
  const tm=setTimeout(()=>{if(chatState==='loading'){chatState='timeout';if(view==='comm')renderComm();}},10000);
  unsubChat=db.collection('canais/'+chan+'/msgs').orderBy('ts','desc').limit(80).onSnapshot(s=>{clearTimeout(tm);chatState='ok';msgs=s.docs.map(d=>Object.assign({id:d.id},d.data())).filter(m=>!BLOQ.has(m.uid)&&(!m.oculto||m.uid===uid||isOwner)).reverse();if(view==='comm'&&commTab==='chat')renderMsgs();},
    ()=>{clearTimeout(tm);chatState='err';if(view==='comm')renderComm();});}
function nickOf(u){if(u===uid)return ME.nick||'Tu';const p=PERFIS[u];return(p&&p.nick)||'Estudante';}
function corOf(u){if(u===uid)return ME.cor;const p=PERFIS[u];return p?p.cor|0:5;}
/* 1.26: o dono de um grupo pode apagar mensagens do grupo */
/* 1.26: aviso fixo quando não há internet */
(function(){function upd(){let b=document.getElementById('x26off');if(navigator.onLine){if(b)b.remove();return;}if(!b){b=document.createElement('div');b.id='x26off';b.setAttribute('role','status');b.textContent='Sem ligação. O estudo continua; a Turma e o ranking atualizam quando voltares.';document.body.appendChild(b);}}
  window.addEventListener('online',upd);window.addEventListener('offline',upd);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',upd);else upd();})();
/* 1.26: avisa no momento em que uma missão fica cumprida ou uma conquista é ganha (Matemática e disciplinas) */
(function(){const LSk='x26-seen';let seen=null;const get=()=>{if(seen)return seen;try{seen=JSON.parse(localStorage.getItem(LSk)||'null');}catch(e){}return seen;};
  function snap(){const d=HIST.find(x=>x.date===today());const ms=missionsFor((d||{items:[]}).items,(d&&d.goal)||ME.goal||15).filter(m=>m.done).map(m=>m.n);const bs=BADGES.filter(b=>{try{return b.ok();}catch(e){return false;}}).map(b=>b.id);return{d:today(),ms,bs};}
  function check(){try{const now=snap(),old=get();seen=now;localStorage.setItem(LSk,JSON.stringify(now));if(!old)return;
    const newM=old.d===now.d?now.ms.filter(m=>!old.ms.includes(m)):[];let newB=now.bs.filter(b=>!old.bs.includes(b));if(newB.length>2)newB=[];/* muitas de uma vez = histórico que chegou de outro dispositivo */
    newM.forEach(m=>{toast('Missão cumprida: '+m+' · +20 XP');try{tone(SND.win);haptic([20,40,20]);}catch(e){}});
    newB.forEach(id=>{const b=BADGES.find(x=>x.id===id);if(b)setTimeout(()=>{toast('Conquista ganha: '+b.n+'. '+b.d+'.');try{tone(SND.win);}catch(e){}},newM.length?2600:0);});}catch(e){}}
  const _pd=persistDay;persistDay=function(date){const r=_pd.apply(this,arguments);if(date===today())setTimeout(check,350);return r;};
  setTimeout(()=>{try{if(!get()){seen=snap();localStorage.setItem(LSk,JSON.stringify(seen));}}catch(e){}},3000);})();
function grDono(c){try{return /^g_/.test(c)&&(window.X26GR||[]).some(g=>g.id===c&&g.dono===uid);}catch(e){return false;}}
function renderMsgs(){const box=document.getElementById('msgs');if(!box)return;
  const atBottom=box.scrollHeight-box.scrollTop-box.clientHeight<80;
  box.innerHTML=chatState==='loading'?skelMsgs():chatState==='timeout'||chatState==='err'?'<p class="dim">Não foi possível carregar as mensagens. Tenta abrir outra vez a Comunidade.</p>':!msgs.length?emptyHTML(IC.comm,'Ainda não há mensagens em #'+chan,'Diz olá à turma ou deixa uma dúvida. As mensagens ficam visíveis para todos os que usam a app.'):
    msgs.map(m=>{const mine=m.uid===uid;const t=m.ts?new Date(m.ts):null;
      return'<div class="msg'+(mine?' me':'')+'"><button type="button" class="pu" data-user="'+esc(m.uid)+'" aria-label="Ver perfil">'+avU(m.uid,'sm')+'</button><div><div class="who"><b>'+esc(nickOf(m.uid))+'</b><span>'+(t?t.toLocaleDateString('pt-PT',{day:'numeric',month:'short'})+' '+t.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}):'')+'</span>'+'<button type="button" class="x25more" data-more="'+esc(m.id)+'" aria-label="Mais ações">⋯</button>'+(mine||isOwner||grDono(chan)?'<button type="button" class="del x25hid" data-del="'+esc(m.id)+'">apagar</button>':'')+(!mine?'<button type="button" class="del x25hid" data-rep="'+esc(m.id)+'">denunciar</button>':'')+'</div><div class="txt">'+esc(m.text)+'</div>'+(typeof m.img==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(m.img)?'<img class="msgimg" src="'+m.img+'" alt="Imagem enviada para revisão" loading="lazy">':'')+'</div></div>';}).join('');
  if(atBottom||chatState==='ok')box.scrollTop=box.scrollHeight;
  box.querySelectorAll('[data-rep]').forEach(b=>b.onclick=()=>{const m=msgs.find(x=>x.id===b.dataset.rep);if(!m)return;X8.motivo().then(mt=>{if(!mt)throw 0;return db.collection('denuncias').add({by:uid,tipo:'msg',canal:chan,msg:m.id,autor:m.uid,text:String(m.text||'').slice(0,500),ts:Date.now(),motivo:mt});}).then(()=>{b.textContent='denunciada';b.disabled=true;toast('Mensagem denunciada. O administrador vai rever.');}).catch(e=>{if(e!==0)toast('Não foi possível denunciar.');});});
  box.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{db.doc('canais/'+chan+'/msgs/'+b.dataset.del).delete().catch(()=>toast('Não foi possível apagar.'));});}
function renderComm(){
  let h='<div class="pagehead compact"><div class="eyebrow">Comunidade</div><h1>Estuda com a turma</h1><p class="muted">Publica no mural, conversa por canais, compara o teu progresso e tira dúvidas com o tutor.</p></div>';
  h+='<div class="sect"><div class="seg" role="group"><button type="button" data-ct="mural" aria-pressed="'+(commTab==='mural')+'">Mural</button><button type="button" data-ct="chat" aria-pressed="'+(commTab==='chat')+'">Conversa</button><button type="button" data-ct="rank" aria-pressed="'+(commTab==='rank')+'">Ranking</button><button type="button" data-ct="ai" aria-pressed="'+(commTab==='ai')+'">Tutor IA</button></div>';
  if(commTab==='ai'){h+=tutorHTML()+'</div>';}
  else if(!db){
    if(BACKEND==='claude'||!IS_APP)h+='<div class="card" style="display:flex;flex-direction:column;gap:10px;align-items:flex-start"><b>A comunidade está na app</b><p class="muted" style="font-size:.9rem">O mural, a conversa e o ranking funcionam na app PRONEX.</p><a class="btn pri" href="'+APP_URL+'" target="_blank" rel="noopener">Abrir a app</a></div></div>';
    else h+='<div class="empty">'+(authErr?'Não foi possível ligar ao servidor. Verifica a internet e abre a app outra vez.':'A ligar à comunidade…')+'</div></div>';
  }
  else if(!hasProfile){h+='<div class="tip">'+IC.info+'<div style="flex:1"><b>Escolhe o teu nome primeiro</b><p class="muted" style="font-size:.88rem">Os outros veem o nome e a foto que escolheres no perfil.</p></div><button type="button" class="btn sm cy" data-go2="profile" data-tab="edit">Criar perfil</button></div></div>';}
  else if(commTab==='mural'){h+=(BACKEND==='firebase'?muralHTML():'<div class="empty">O mural está na app PRONEX.</div>')+'</div>';}
  else if(commTab==='chat'){
    h+='<div class="comm"><nav class="chans" aria-label="Canais">'+CHANS.map(([id,n])=>'<button type="button" data-ch="'+esc(id)+'" aria-current="'+(chan===id)+'"><span>#</span>'+esc(n)+'</button>').join('')+'</nav>'+
      '<div class="card chat"><div style="padding:12px 16px;border-bottom:1px solid var(--line)"><b>#'+esc((CHANS.find(c=>c[0]===chan)||[])[1]||'')+'</b> <span class="dim" style="font-size:.82rem">'+esc((CHANS.find(c=>c[0]===chan)||[])[2]||'')+'</span></div><div class="msgs" id="msgs" tabindex="0" role="log" aria-label="Mensagens"></div>'+
      '<form class="composer" id="composer"><input type="text" id="msg-in" aria-label="Mensagem" maxlength="500" placeholder="Escreve uma mensagem para #'+chan+'" autocomplete="off"><button class="btn pri sm" type="submit">Enviar</button></form></div></div></div>';
  }else{
    const wk=weekId(Date.now()),W=rankMode==='week',score=p=>num(W?(p.wk===wk?p.wxp:0):p.xp);
    const list=Object.entries(PERFIS).filter(([u,p])=>p&&p.nick&&p.ranking!==false&&(!W||p.wk===wk)).map(([u,p])=>({u,p})).sort((a,b)=>score(b.p)-score(a.p));
    const myPos=list.findIndex(x=>x.u===uid);
    h+='<div class="chips"><button type="button" class="chip" data-rk="week" aria-pressed="'+W+'">Liga desta semana</button><button type="button" class="chip" data-rk="all" aria-pressed="'+!W+'">Desde sempre</button></div>';
    const myT=tierOf(weekXP());if(W)h+='<div class="card league"><div><div class="eyebrow">A tua liga</div><b class="lname" style="color:'+myT.col+'">Liga '+myT.name+'</b><span class="dim">'+(myT.next?'Faltam '+myT.need+' XP esta semana para a Liga '+myT.next+'.':'Estás na liga mais alta. Mantém o ritmo.')+'</span></div><div class="ltiers">'+TIERS.map(t=>'<i style="background:'+t[2]+(t[1]===myT.name?';box-shadow:0 0 0 3px rgba(255,255,255,.18)':';opacity:.35')+'" title="Liga '+t[1]+'"></i>').join('')+'</div></div>';
    h+=(myPos>=0?'<div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><div class="eyebrow">A tua posição'+(W?' esta semana':'')+'</div><b style="font:800 1.6rem var(--f-display)">'+(myPos+1)+'.º</b> <span class="dim">de '+list.length+'</span></div><span class="mono" style="color:var(--cyan);font-weight:700">'+score(list[myPos].p)+' XP</span></div>':'');
    h+=list.length?'<div class="rank">'+list.slice(0,50).map((x,i)=>'<button type="button" class="rrow'+(x.u===uid?' me':'')+'" data-user="'+esc(x.u)+'"><span class="pos'+(i<3?' top':'')+'">'+(i+1)+'</span>'+avatar(x.p.nick,x.p.cor,'',x.p.foto)+'<div class="nm"><b>'+esc(x.p.nick)+(x.u===uid?' (tu)':'')+'</b><span>Nível '+(num(x.p.nivel)||1)+' · '+pl(num(x.p.streak),'dia seguido','dias seguidos')+(x.p.wk===weekId(Date.now())?' · '+tierTag(num(x.p.wxp)):'')+(x.p.curso?' · '+esc(x.p.curso):'')+'</span></div><span class="xp">'+score(x.p)+' XP</span></button>').join('')+'</div>'
      :(!perfisLoaded?'<div class="rank">'+skelRank()+'</div>':emptyHTML(IC.trophy,W?'A liga desta semana ainda está vazia':'Ainda ninguém está no ranking',W?'Faz 5 exercícios e ficas logo em 1.º lugar.':'Faz exercícios para ganhar XP e aparecer aqui.','<button type="button" class="btn pri sm" data-go2="study">Praticar agora</button>'));
    h+='<p class="hint">'+(W?'A liga recomeça todas as segundas-feiras. Conta o XP ganho desde segunda.':'Ordenado pelo XP total.')+' Podes sair do ranking no teu perfil.</p></div>';
  }
  const el=document.getElementById('v-comm');el.innerHTML=h;bindCommon(el);
  el.querySelectorAll('[data-ct]').forEach(b=>b.onclick=()=>{commTab=b.dataset.ct;renderComm();});el.querySelectorAll('[data-rk]').forEach(b=>b.onclick=()=>{rankMode=b.dataset.rk;renderComm();});
  el.querySelectorAll('[data-ch]').forEach(b=>b.onclick=()=>{chan=b.dataset.ch;subChat();renderComm();});
  if(commTab==='mural'&&BACKEND==='firebase')bindMural(el);
  const f=el.querySelector('#composer');
  if(f){if(chatState==='idle')subChat();renderMsgs();
    f.onsubmit=e=>{e.preventDefault();const i=el.querySelector('#msg-in');const text=i.value.trim().slice(0,500);if(!text)return;i.value='';
      (BACKEND==='firebase'?addRitmo('canais/'+chan+'/msgs',{uid,text,ts:Date.now()},'ultimaMsg'):db.collection('canais/'+chan+'/msgs').add({uid,text,ts:Date.now()})).then(()=>{logEv('msg',{c:chan,t:text});if(!ME.sent){ME.sent=true;syncProfile();}}).catch(x=>{i.value=text;toast(x&&x.code==='x-filtro'?x.message:x&&x.code==='permission-denied'?motivoRecusa('Não foi possível enviar. Espera uns segundos e tenta outra vez.'):'Não foi possível enviar. Tenta outra vez.');});};}
  const tf=el.querySelector('#tu-f');if(tf){const box=el.querySelector('#tmsgs');if(box)box.scrollTop=box.scrollHeight;
    tf.onsubmit=e=>{e.preventDefault();const i=el.querySelector('#tu-in');const q=i.value;i.value='';askTutor(q);};
    el.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>askTutor(b.dataset.sug));
    const cl=el.querySelector('#tu-clear');if(cl)cl.onclick=()=>{TUTOR=[];saveTutor();renderComm();};}
}


/* ================= Perfil ================= */
let hf='all';
function fmtDate(d){if(d==='0000-anteriores')return'Antes do histórico';const [y,m,dd]=d.split('-');const dt=new Date(+y,+m-1,+dd);if(d===today())return'Hoje';
  const y2=new Date();y2.setDate(y2.getDate()-1);if(dt.toDateString()===y2.toDateString())return'Ontem';return dt.toLocaleDateString('pt-PT',{weekday:'long',day:'numeric',month:'long'});}
const hhmm=ts=>ts?new Date(ts).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}):'';
const MODE={sim:'Simulação do teste',recap:'Recapitulação',tipo:'Por tipo',weak:'Pontos fracos',mix:'Misturado',antes:'Anterior'};
function renderProfile(){
  const S=stats(),agg=typeAgg();
  let h='<div class="card phead">'+avatar(ME.nick||'?',ME.cor,'lg',ME.foto)+'<div style="flex:1;min-width:200px"><div class="eyebrow">Nível '+S.lv.n+' · '+S.lv.name+'</div><h1>'+esc(ME.nick||'Sem perfil')+'</h1><p class="muted" style="font-size:.9rem">'+esc([ME.curso,ME.escola].filter(Boolean).join(' · ')||'Completa o teu perfil')+'</p>'+(ME.bio?'<p style="margin-top:6px;font-size:.9rem">'+esc(ME.bio)+'</p>':'')+'</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chipstat"><span class="flame">'+IC.flame+'</span>'+pl(S.streak,'dia','dias')+'</span>'+(st.frz&&st.frz.have?'<span class="chipstat frz" title="Proteções de sequência: usam-se sozinhas se falhares um dia"><span>'+IC.snow+'</span>'+st.frz.have+'</span>':'')+'<span class="chipstat"><span class="bolt">'+IC.bolt+'</span>'+S.xp+' XP</span></div></div>';
  h+='<div class="sect"><div class="seg" role="group">'+[['stats','Resumo'],['hist','Histórico'],['edit','Editar'],['defs','Definições'],['acc','Conta']].concat(isOwner&&BACKEND==='firebase'?[['adm','Painel']]:[]).map(([k,n])=>'<button type="button" data-pt="'+k+'" aria-pressed="'+(profTab===k)+'">'+n+'</button>').join('')+'</div>';
  if(profTab==='stats'){
    h+='<div class="kpis"><div class="kpi"><div class="v">'+S.total+'</div><div class="s">exercícios feitos</div></div><div class="kpi"><div class="v">'+(S.total?Math.round(S.ok/S.total*100)+'%':'—')+'</div><div class="s">acerto</div></div><div class="kpi"><div class="v">'+bestStreak()+'</div><div class="s">melhor sequência</div></div><div class="kpi"><div class="v">'+((st.frz&&st.frz.have)||0)+'/2</div><div class="s">proteções de sequência</div></div><div class="kpi"><div class="v">'+(bestSim()!=null?bestSim()+'/14':'—')+'</div><div class="s">melhor simulação</div></div></div>';
    h+='<h2 style="font-size:1.15rem;margin-top:8px">Conquistas</h2><div class="badges">'+BADGES.map(b=>{const ok=b.ok();return'<div class="badge'+(ok?'':' locked')+'"><span class="bi">'+IC[b.ic]+'</span><b>'+b.n+'</b><span>'+b.d+'</span></div>';}).join('')+'</div>';
  }else if(profTab==='hist'){
    const items=S.it;
    h+='<div class="sect-h"><p class="store">'+(storeMode==='db'?'Guardado na nuvem: aparece em qualquer dispositivo com a tua conta.':IS_APP?'A ligar à nuvem… por agora está guardado neste dispositivo.':'Guardado neste navegador.')+'</p><div style="display:flex;gap:8px;flex-wrap:wrap">'+(typeof TNEX!=='undefined'&&items.length?'<button type="button" class="btn pri sm" id="hai"><span style="display:inline-flex;width:16px">'+IC.spark+'</span>Analisar com o Nex</button>':'')+(items.length?'<button type="button" class="btn sm" id="hexp">Copiar resumo</button>':'')+'</div></div>';
    if(histAI)h+='<div class="ai"><div class="h">'+IC.spark+'Análise do Nex</div><div class="body nxt" id="hai-body">'+TNEX.fmt(histAI.text)+'</div></div>';
    h+='<textarea id="hexp-t" readonly hidden style="height:150px"></textarea>';
    if(!items.length)h+='<div class="empty">Ainda não fizeste exercícios. Cada resposta fica registada aqui com a data e a hora.</div>';
    else{const rows=Object.values(agg).sort((a,b)=>a.o/a.d-b.o/b.d);
      h+='<h2 style="font-size:1.1rem">Por tipo de exercício</h2><div class="card ttable"><table><thead><tr><th>Tipo</th><th>Tema</th><th style="text-align:right">Feitos</th><th style="text-align:right">Certos</th><th style="width:150px">Acerto</th></tr></thead><tbody>'+
        rows.map(a=>{const p=Math.round(a.o/a.d*100);return'<tr><td>'+esc(TYPES[a.t].n)+'</td><td class="dim">'+TYPES[a.t].t+'</td><td class="n">'+a.d+'</td><td class="n">'+a.o+'</td><td><div style="display:flex;align-items:center;gap:8px"><div class="bar" style="flex:1"><i class="'+(p>=80?'ok':p<60?'bad':'mid')+'" style="width:'+p+'%"></i></div><span class="mono" style="font-size:.76rem">'+p+'%</span></div></td></tr>';}).join('')+'</tbody></table></div>';
      h+='<div class="sect-h"><h2 style="font-size:1.1rem">Exercícios feitos</h2><div class="chips"><button type="button" class="chip" data-hf="all" aria-pressed="'+(hf==='all')+'">Todos</button><button type="button" class="chip" data-hf="bad" aria-pressed="'+(hf==='bad')+'">Só os errados</button></div></div>';
      HIST.forEach(d=>{let its=(d.items||[]).slice().reverse();if(hf==='bad')its=its.filter(i=>!i.ok);if(!its.length)return;const o=(d.items||[]).filter(i=>i.ok).length;
        h+='<div class="day"><div class="dayh"><b>'+fmtDate(d.date)+'</b><span>'+o+'/'+(d.items||[]).length+' certos</span></div>'+its.slice(0,120).map(i=>'<div class="hrow"><span class="mk '+(i.ok?'ok':'bad')+'">'+(i.ok?'✓':'✗')+'</span><div class="tx"><b>'+esc(i.tn)+'</b>'+(i.ok?esc(i.cert):'Escolheste '+esc(i.esc)+' · certa '+esc(i.cert))+'</div><span class="tm">'+(MODE[i.mode]||'')+(i.ts?' · '+hhmm(i.ts):'')+'</span></div>').join('')+'</div>';});}
  }else if(profTab==='adm'){h+=adminHTML();
  }else if(profTab==='acc'){h+=accountCard()+(IS_APP?'':transferCard());
  }else if(profTab==='defs'){h+=X8.settingsHTML();}else if(profTab==='about'){h+=appCardHTML();
  }else{
    h+='<form class="card" id="pform" style="display:flex;flex-direction:column;gap:14px"><div class="form">'+
      '<div class="f" style="grid-column:1/-1">Foto de perfil<div class="phrow">'+avatar(ME.nick||'?',ME.cor,'lg',ME.foto)+'<label class="btn sm">'+IC.img.replace('<svg','<svg width="16" height="16"')+' Escolher foto<input type="file" id="pf-foto" accept="image/*" hidden></label>'+(ME.foto?'<button type="button" class="btn sm ghost" id="pf-nofoto">Remover</button>':'')+'</div></div>'+
      '<label class="f">Nome na app<input type="text" id="pf-nick" maxlength="30" required value="'+esc(ME.nick)+'"></label>'+
      '<label class="f">Curso<input type="text" id="pf-curso" maxlength="40" value="'+esc(ME.curso)+'"></label>'+
      '<label class="f">Escola<input type="text" id="pf-escola" maxlength="60" value="'+esc(ME.escola)+'"><span class="x26chk"><input type="checkbox" id="pf-escpub"'+(ME.escolaPub?' checked':'')+'> Mostrar a escola no perfil público</span></label>'+
      '<label class="f">Data do próximo teste<input type="date" id="pf-teste" value="'+esc(ME.teste||'')+'"></label>'+
      '<label class="f">Objetivo diário<select id="pf-goal">'+[5,10,15,20,30,40].map(n=>'<option value="'+n+'"'+(ME.goal===n?' selected':'')+'>'+n+' exercícios por dia</option>').join('')+'</select></label></div>'+
      '<label class="f">Sobre mim (aparece no teu perfil público)<textarea id="pf-bio" maxlength="160" style="height:80px">'+esc(ME.bio)+'</textarea></label>'+
      '<div class="f">Cor do avatar<div class="colors">'+[0,1,2,3,4,5].concat((()=>{try{return JSON.parse(localStorage.getItem('x21-cores')||'[]')||[];}catch(e){return[];}})()).map(i=>'<button type="button" class="g'+i+'" data-cor="'+i+'" aria-pressed="'+(ME.cor===i)+'" aria-label="Cor '+(i+1)+'"></button>').join('')+'</div><small class="hint">Mais cores na Loja do Nex (Início).</small></div>'+
      '<div class="toggles"><label class="toggle"><input type="checkbox" id="pf-rank"'+(ME.ranking?' checked':'')+'> Aparecer no ranking da comunidade</label><label class="toggle"><input type="checkbox" id="pf-snd"'+(ME.sound?' checked':'')+'> Sons nas respostas</label><label class="toggle"><input type="checkbox" id="pf-hap"'+(ME.haptic!==false?' checked':'')+'> Vibração (telemóvel)</label></div>'+
      '<div style="display:flex;gap:8px;align-items:center"><button class="btn pri" type="submit">Guardar perfil</button><span class="hint" style="margin:0">'+(IS_APP?'Versão '+APP_VERSION+'. ':'')+'O nome, a foto, o curso, a escola, a bio, o nível e o XP ficam visíveis para a comunidade. O histórico não aparece aos outros estudantes.</span></div></form>';
  }
  h+='</div>';
  const el=document.getElementById('v-profile');el.innerHTML=h;bindCommon(el);
  el.querySelectorAll('[data-pt]').forEach(b=>b.onclick=()=>{profTab=b.dataset.pt;renderProfile();});
  el.querySelectorAll('[data-hf]').forEach(b=>b.onclick=()=>{hf=b.dataset.hf;renderProfile();});
  el.querySelectorAll('[data-cor]').forEach(b=>b.onclick=()=>{el.querySelectorAll('[data-cor]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
  const hai=el.querySelector('#hai');if(hai)hai.onclick=askHistory;
  const hx=el.querySelector('#hexp');if(hx)hx.onclick=()=>{const items=allItems();
    const txt='HISTÓRICO PRONEX_STUDY · MATEMÁTICA P1\nTotal: '+items.length+' | Certos: '+items.filter(i=>i.ok).length+'\n\nPor tipo:\n'+Object.values(agg).map(a=>'- '+TYPES[a.t].n+': '+a.o+'/'+a.d).join('\n')+'\n\nErros recentes:\n'+items.filter(i=>!i.ok).slice(-25).map(i=>'- '+i.tn+': escolhi '+i.esc+' | certa '+i.cert).join('\n');
    const ta=el.querySelector('#hexp-t');ta.hidden=false;ta.value=txt;ta.focus();ta.select();if(navigator.clipboard)navigator.clipboard.writeText(txt).catch(()=>{});hx.textContent='Copiado';};
  bindAccount(el);bindTransfer(el);bindAppCard(el);if(profTab==='adm')bindAdmin(el);if(profTab==='defs')X8.bindSettings(el);const uc=el.querySelector('#upd-check');if(uc)uc.onclick=()=>checkUpdates(uc);
  const pf=el.querySelector('#pform');if(pf)pf.onsubmit=e=>{e.preventDefault();const v=id=>el.querySelector('#'+id).value.trim();
    const nick=v('pf-nick');if(!nick){toast('Escreve um nome para a app.');return;}
    const sel=el.querySelector('[data-cor][aria-pressed="true"]');
    {const fb=[nick,v('pf-curso'),v('pf-escola'),v('pf-bio')].join(' ');const fl=filtroPublicacao(fb);if(fl||pareceContacto(v('pf-bio'))){toast(fl||'Por segurança, não ponhas contactos na bio.');return;}}ME=Object.assign(ME,{nick,curso:v('pf-curso'),escola:v('pf-escola'),escolaPub:!!(el.querySelector('#pf-escpub')||{}).checked,bio:v('pf-bio'),goal:+el.querySelector('#pf-goal').value,teste:(el.querySelector('#pf-teste')||{}).value||'',ranking:el.querySelector('#pf-rank').checked,sound:el.querySelector('#pf-snd').checked,haptic:el.querySelector('#pf-hap').checked,cor:sel?+sel.dataset.cor:ME.cor});
    hasProfile=true;lastSync='';syncProfile();logEv('perfil');if(isFB())registerUser();toast('Perfil guardado.');profTab='stats';refresh();};
  const pff=el.querySelector('#pf-foto');if(pff)pff.onchange=async()=>{const file=pff.files&&pff.files[0];if(!file)return;try{ME.foto=await readAvatarImg(file);saveMeLocal();lastSync='';syncProfile();logEv('foto');toast('Foto de perfil atualizada.');renderProfile();renderChrome();}catch(e){toast('Não foi possível abrir essa imagem.');}};
  const pfn=el.querySelector('#pf-nofoto');if(pfn)pfn.onclick=()=>{ME.foto='';saveMeLocal();lastSync='';syncProfile();renderProfile();renderChrome();};
}

/* ================= Painel de ferramentas ================= */
let panelTool=null;
const TT={calc:'Calculadora',pad:'Rascunho',help:'Fórmula deste exercício'};
function openPanel(t){panelTool=t;document.getElementById('panel').hidden=false;document.getElementById('playgrid').classList.add('open');document.body.classList.add('sheet');
  document.getElementById('panel-t').textContent=TT[t];['calc','pad','help'].forEach(x=>document.getElementById('tp-'+x).hidden=x!==t);
  document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.tool===t));
  if(t==='help'){const c=cur();if(c)document.getElementById('tp-help').innerHTML=helpCard(TYPES[c.t].h);}
  if(t==='pad')requestAnimationFrame(size);}
function closePanel(){panelTool=null;const p=document.getElementById('panel');if(p)p.hidden=true;document.getElementById('playgrid').classList.remove('open');document.body.classList.remove('sheet');document.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed','false'));}
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>panelTool===b.dataset.tool?closePanel():openPanel(b.dataset.tool));
document.getElementById('panel-x').onclick=closePanel;

/* ================= Rascunho ================= */
const cv=document.getElementById('pad'),box=document.getElementById('padbox'),ctx=cv.getContext('2d');
let pen='ink',strokes=[],curS=null;
const PENS={ink:'#FFFFFF',cyan:'#00E5FF',bad:'#FF5C7A'};
function size(){const r=box.getBoundingClientRect();if(!r.width)return;const d=window.devicePixelRatio||1;cv.width=r.width*d;cv.height=r.height*d;ctx.setTransform(d,0,0,d,0,0);redraw();}
function drawStroke(s){if(!s.p.length)return;ctx.lineCap='round';ctx.lineJoin='round';ctx.globalCompositeOperation=s.k==='erase'?'destination-out':'source-over';ctx.strokeStyle=s.k==='erase'?'#000':(PENS[s.k]||'#fff');ctx.lineWidth=s.k==='erase'?22:2.4;
  ctx.beginPath();ctx.moveTo(s.p[0][0],s.p[0][1]);s.p.forEach(pt=>ctx.lineTo(pt[0],pt[1]));if(s.p.length===1)ctx.lineTo(s.p[0][0]+.1,s.p[0][1]);ctx.stroke();ctx.globalCompositeOperation='source-over';}
function redraw(){ctx.clearRect(0,0,cv.width,cv.height);strokes.forEach(drawStroke);}
function ppos(e){const r=cv.getBoundingClientRect();return[Math.round((e.clientX-r.left)*10)/10,Math.round((e.clientY-r.top)*10)/10];}
cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);curS={k:pen,p:[ppos(e)]};strokes.push(curS);redraw();});
cv.addEventListener('pointermove',e=>{if(!curS)return;curS.p.push(ppos(e));redraw();});
const endS=()=>{if(!curS)return;curS=null;const c=cur();if(c){st.pads[K(c.t,c.n)]=strokes;save();}};
cv.addEventListener('pointerup',endS);cv.addEventListener('pointercancel',endS);
function loadPad(){const c=cur();if(!c)return;const k=K(c.t,c.n);strokes=(st.pads[k]||[]).slice();st.pads[k]=strokes;redraw();document.getElementById('notes').value=st.notes[k]||'';}
document.querySelectorAll('[data-pen]').forEach(b=>b.onclick=()=>{pen=b.dataset.pen;document.querySelectorAll('[data-pen]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
document.getElementById('undo').onclick=()=>{strokes.pop();const c=cur();if(c){st.pads[K(c.t,c.n)]=strokes;save();}redraw();};
document.getElementById('clear').onclick=()=>{strokes.length=0;const c=cur();if(c){st.pads[K(c.t,c.n)]=strokes;save();}redraw();};
document.getElementById('notes').addEventListener('input',e=>{const c=cur();if(c){st.notes[K(c.t,c.n)]=e.target.value;save();}});
const tD=document.getElementById('t-draw'),tW=document.getElementById('t-write');
tD.onclick=()=>{document.getElementById('draw-area').hidden=false;document.getElementById('write-area').hidden=true;document.getElementById('pen-g').hidden=false;tD.setAttribute('aria-pressed','true');tW.setAttribute('aria-pressed','false');size();};
tW.onclick=()=>{document.getElementById('draw-area').hidden=true;document.getElementById('write-area').hidden=false;document.getElementById('pen-g').hidden=true;tW.setAttribute('aria-pressed','true');tD.setAttribute('aria-pressed','false');};
new ResizeObserver(size).observe(box);

/* ================= Calculadora científica ================= */
/*CALC-START*/
function fact(n){if(n<0||n>170||Math.abs(n-Math.round(n))>1e-9)throw 0;let r=1;for(let i=2;i<=Math.round(n);i++)r*=i;return r;}
function calcEval(src,ans,deg){
  const s=src.replace(/\s+/g,'').replace(/\*/g,'×').replace(/\//g,'÷').replace(/x/gi,'×').replace(/-/g,'−');let i=0;
  const tr=x=>deg?x*Math.PI/180:x,itr=x=>deg?x*180/Math.PI:x;
  const FN={sin:x=>Math.sin(tr(x)),cos:x=>Math.cos(tr(x)),tan:x=>Math.tan(tr(x)),asin:x=>itr(Math.asin(x)),acos:x=>itr(Math.acos(x)),atan:x=>itr(Math.atan(x)),log:Math.log10,ln:Math.log,'√':Math.sqrt,abs:Math.abs};
  const CONST={'π':Math.PI,'e':Math.E,'Ans':ans};
  const ID=/^(asin|acos|atan|sin|cos|tan|log|ln|abs|Ans|π|√|e)/;
  const peek=()=>s[i];
  function num(){const m=/^(\d+([.,]\d*)?|[.,]\d+)/.exec(s.slice(i));if(!m)return null;i+=m[0].length;return parseFloat(m[0].replace(',','.'));}
  function primary(){const c=peek();
    if(c==='−'){i++;return -power();}
    if(c==='+'){i++;return power();}
    if(c==='('){i++;const v=expr();if(peek()===')')i++;return v;}
    const n=num();if(n!==null)return n;
    const m=ID.exec(s.slice(i));if(m){i+=m[0].length;const id=m[0];if(id in CONST)return CONST[id];
      let arg;if(peek()==='('){i++;arg=expr();if(peek()===')')i++;}else arg=postfix(primary());return FN[id](arg);}
    throw 0;}
  function postfix(v){for(;;){const c=peek();if(c==='!'){i++;v=fact(v);}else if(c==='%'){i++;v=v/100;}else if(c==='²'){i++;v=v*v;}else return v;}}
  function power(){const b=postfix(primary());if(peek()==='^'){i++;return Math.pow(b,expo());}return b;}
  function expo(){if(peek()==='−'){i++;return -expo();}if(peek()==='+'){i++;return expo();}return power();}
  function term(){let v=power();for(;;){const c=peek();if(c==='×'){i++;v*=power();}else if(c==='÷'){i++;v/=power();}
    else if(c!==undefined&&(c==='('||/\d/.test(c)||ID.test(s.slice(i)))){v*=power();}else return v;}}
  function expr(){let v=term();for(;;){const c=peek();if(c==='+'){i++;v+=term();}else if(c==='−'){i++;v-=term();}else return v;}}
  if(!s)throw 0;const v=expr();if(i<s.length)throw 0;if(typeof v!=='number'||!isFinite(v))throw 0;return v;
}
/*CALC-END*/
const inp=document.getElementById('calc-in'),res=document.getElementById('res'),hist=document.getElementById('hist'),hl=document.getElementById('hlist');
let ans=0,deg=true,H=[];
const fmtC=n=>{if(Math.abs(n)>=1e12||(Math.abs(n)<1e-6&&n!==0))return n.toExponential(6).replace('.',',');const r=Math.round(n*1e8)/1e8;return r.toLocaleString('pt-PT',{maximumFractionDigits:8,useGrouping:false});};
function live(){const s=inp.value.trim();res.classList.remove('err');if(!s){res.textContent='';return;}try{res.textContent='= '+fmtC(calcEval(s,ans,deg));}catch(e){res.textContent='';}}
function calc(){const s=inp.value.trim();if(!s)return;
  try{const v=calcEval(s,ans,deg);ans=v;hist.textContent=s+' =';res.classList.remove('err');res.textContent=fmtC(v);H.unshift([s,fmtC(v)]);H=H.slice(0,6);renderH();inp.value='';}
  catch(e){res.classList.add('err');res.textContent='Conta incompleta ou inválida. Verifica os parênteses e os operadores.';}}
function renderH(){hl.innerHTML=H.map((h,i)=>'<button type="button" data-h="'+i+'"><span>'+esc(h[0])+'</span><span>'+h[1]+'</span></button>').join('');hl.querySelectorAll('button').forEach(b=>b.onclick=()=>{inp.value+=H[+b.dataset.h][1];live();});}
function ins(t){if(!inp.value&&/^[×÷+^%²!]$/.test(t)&&res.textContent&&!res.classList.contains('err'))inp.value='Ans';inp.value+=t;live();}
document.getElementById('keys').addEventListener('click',e=>{const b=e.target.closest('.key');if(!b)return;if(b.dataset.i!==undefined){ins(b.dataset.i);return;}const a=b.dataset.a;
  if(a==='C'){inp.value='';res.textContent='';hist.textContent='';res.classList.remove('err');}
  else if(a==='del'){inp.value=inp.value.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|√\(|Ans|.)$/,'');live();}
  else if(a==='eq')calc();else if(a==='inv'){inp.value=inp.value?'1÷('+inp.value+')':'1÷(Ans)';live();}else if(a==='neg'){inp.value=inp.value?'−('+inp.value+')':'−';live();}});
document.querySelectorAll('.tpl button').forEach(b=>b.onclick=()=>{inp.value+=b.dataset.t;live();});
inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();calc();}if(e.key==='Escape'){inp.value='';live();}});
inp.addEventListener('input',live);
const dB=document.getElementById('deg'),rB=document.getElementById('rad');
dB.onclick=()=>{deg=true;dB.setAttribute('aria-pressed','true');rB.setAttribute('aria-pressed','false');live();};
rB.onclick=()=>{deg=false;rB.setAttribute('aria-pressed','true');dB.setAttribute('aria-pressed','false');live();};

/* ================= App instalável: instalação e atualizações ================= */
const APP_VERSION='1.44.2';
let installEvt=null;
function appBar(){const b=document.getElementById('appbar');if(!b)return;
  const parts=[];
  if(updWaiting)parts.push('<div class="upd"><div><b>Nova versão disponível</b><span>Atualiza para teres as últimas melhorias.</span></div><button type="button" class="btn cy sm" id="upd-go">Atualizar</button><button type="button" class="btn ghost sm" id="upd-no">Depois</button></div>');
  else if(installEvt&&view!=='home')parts.push('<div class="upd"><div><b>Instala a PRONEX</b><span>Fica no ecrã principal e funciona sem internet.</span></div><button type="button" class="btn pri sm" id="ins-go">Instalar</button><button type="button" class="btn ghost sm" id="ins-no">Agora não</button></div>');
  b.innerHTML=parts.join('');b.hidden=!parts.length;
  const $=id=>b.querySelector('#'+id);
  if($('upd-go'))$('upd-go').onclick=()=>{$('upd-go').disabled=true;$('upd-go').textContent='A atualizar…';const w=(typeof SWREG!=='undefined'&&SWREG&&SWREG.waiting)||updWaiting;if(w)w.postMessage('skipWaiting');setTimeout(()=>location.reload(),4000);};
  if($('upd-no'))$('upd-no').onclick=()=>{b.hidden=true;};
  if($('ins-go'))$('ins-go').onclick=async()=>{const e=installEvt;installEvt=null;appBar();try{e.prompt();await e.userChoice;}catch(x){}};
  if($('ins-no'))$('ins-no').onclick=()=>{installEvt=null;appBar();};
}
let updWaiting=null;
if(IS_APP&&'serviceWorker' in navigator){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installEvt=e;appBar();if(view==='home')refresh();});
  navigator.serviceWorker.register('sw.js').then(reg=>{SWREG=reg;
    const watch=w=>{if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller){updWaiting=w;appBar();}});};
    if(reg.waiting&&navigator.serviceWorker.controller){updWaiting=reg.waiting;appBar();}
    reg.addEventListener('updatefound',()=>watch(reg.installing));
    const check=()=>reg.update().catch(()=>{});
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')check();});
    setInterval(check,30*60*1000);
  }).catch(()=>{});
  // 1.44.1: só recarrega quando uma versão nova substitui outra. Na primeira visita não havia controlador:
  // o service worker acabado de instalar toma conta da página e recarregar só fazia esperar (~6 s no telemóvel)
  let reloading=false;const tinhaControlador=!!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading||!tinhaControlador)return;reloading=true;location.reload();});
}

/* ================= Instalação fácil ================= */
const APP_URL='https://pronexprotocol-ui.github.io/pronex_study/';
const UA=navigator.userAgent||'';
const IS_IOS=/iP(hone|ad|od)/.test(UA)||(/Macintosh/.test(UA)&&'ontouchend' in document);
const IS_IOS_SAFARI=IS_IOS&&!/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(UA);
const IS_ANDROID=/Android/.test(UA);
const isStandalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}};
function installCardHTML(){
  if(!IS_APP||isStandalone())return'';
  if(allItems().filter(i=>i.ts).length<6)return'';
  let dismissed=false;try{dismissed=localStorage.getItem('ps-inst-x')===today();}catch(e){}
  if(dismissed)return'';
  return'<div class="instcard"><img src="icons/v2/icon-192.png" alt="" width="52" height="52"><div><b>Instala a PRONEX</b><span>Fica no ecrã principal como uma app, abre em ecrã inteiro e funciona sem internet.</span></div><div class="instb"><button type="button" class="btn pri sm" id="inst-go">Instalar</button><button type="button" class="xbtn" id="inst-x" aria-label="Agora não">✕</button></div></div>';
}
function bindInstall(el){
  const g=el.querySelector('#inst-go');if(g)g.onclick=doInstall;
  const x=el.querySelector('#inst-x');if(x)x.onclick=()=>{try{localStorage.setItem('ps-inst-x',today());}catch(e){}refresh();};
}
async function doInstall(){
  if(installEvt){const e=installEvt;installEvt=null;try{e.prompt();const r=await e.userChoice;if(r&&r.outcome==='accepted')toast('A instalar… o ícone aparece no ecrã principal.');}catch(x){}appBar();refresh();return;}
  openInstallGuide();
}
function openInstallGuide(){
  closeSheet();const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Instalar a app');
  const share='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8"/></svg>';
  const plus='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
  const dots='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>';
  let steps,title;
  if(IS_IOS&&!IS_IOS_SAFARI){title='Abre no Safari';steps=[['1','Copia o link da app','<button type="button" class="btn sm" id="ig-copy">Copiar link</button>'],['2','Abre o Safari e cola o link na barra de endereço',''],['3','Segue os passos de instalação que aparecem lá','']];}
  else if(IS_IOS){title='Instalar no iPhone';steps=[['1','Toca no botão Partilhar, em baixo no Safari',share],['2','Desce a lista e toca em "Adicionar ao ecrã principal"',plus],['3','Toca em "Adicionar". O ícone do escudo aparece no ecrã principal','']];}
  else if(IS_ANDROID){title='Instalar no Android';steps=[['1','Toca nos 3 pontos, no canto superior direito do Chrome',dots],['2','Escolhe "Instalar app" (ou "Adicionar ao ecrã principal")',plus],['3','Confirma em "Instalar". A app abre como as outras, em ecrã inteiro','']];}
  else{title='Instalar no computador';steps=[['1','No Chrome ou no Edge, procura o ícone de instalar no fim da barra de endereço',plus],['2','Clica em "Instalar"',''],['3','A PRONEX abre numa janela própria e fica no menu Iniciar','']];}
  sh.innerHTML='<span class="grab"></span><div class="eyebrow">Instalação</div><h2 style="font-size:1.35rem">'+title+'</h2><ol class="isteps">'+steps.map(s=>'<li><span class="n">'+s[0]+'</span><span class="t">'+s[1]+'</span>'+(s[2]?'<span class="i">'+s[2]+'</span>':'')+'</li>').join('')+'</ol>'+
    '<p class="hint" style="margin:0">Depois de instalada, recebe as atualizações sozinha: aparece um aviso e tu escolhes quando atualizar.</p><button type="button" class="btn pri" id="ig-ok">Percebi</button>';
  document.body.appendChild(bg);document.body.appendChild(sh);document.addEventListener('keydown',sheetKey);
  sh.querySelector('#ig-ok').onclick=closeSheet;const c=sh.querySelector('#ig-copy');if(c)c.onclick=()=>copyLink();sh.querySelector('#ig-ok').focus({preventScroll:true});
}
function copyLink(){if(navigator.clipboard)navigator.clipboard.writeText(APP_URL).then(()=>toast('Link copiado.'),()=>toast(APP_URL));else toast(APP_URL);}
async function shareApp(){
  const data={title:'PRONEX',text:'Estuda comigo no PRONEX Study: exercícios, lições e ranking da turma.',url:APP_URL};
  try{if(navigator.share){await navigator.share(data);return;}}catch(e){if(e&&e.name==='AbortError')return;}
  copyLink();
}
let qrLoaded=null;
function loadQR(){if(qrLoaded)return qrLoaded;qrLoaded=new Promise((res,rej)=>{const s=document.createElement('script');s.src='./js/lib/qrcode.min.js';s.onload=()=>res(window.QRCode);s.onerror=rej;document.head.appendChild(s);});return qrLoaded;}
function appCardHTML(){
  return'<div class="card acc"><div class="eyebrow">PRONEX Study</div><h2>Versão '+APP_VERSION+'</h2>'+
    '<p class="muted">'+(IS_APP?(isStandalone()?'Estás a usar a app instalada. Quando houver uma versão nova, aparece um aviso para atualizares.':'Estás a usar a app no browser. Instala-a para a teres no ecrã principal e sem internet.'):'Esta versão atualiza-se sozinha sempre que há novidades.')+'</p>'+
    '<div class="accb" style="flex-wrap:wrap">'+(IS_APP&&!isStandalone()?'<button type="button" class="btn pri sm" id="ap-inst">Instalar a app</button>':'')+'<button type="button" class="btn sm" id="upd-check">Procurar atualizações</button></div></div>'+
    '<div class="card acc"><div class="eyebrow">Convidar colegas</div><h2>Partilha a app com a turma</h2><p class="muted">Mostra este código QR a um colega, ou envia-lhe o link. Ele abre, instala e entra com a conta dele.</p>'+
    '<div class="qrbox"><div id="qr" aria-label="Código QR com o link da app"></div><div style="display:flex;flex-direction:column;gap:8px;min-width:0"><code class="lnk">'+APP_URL+'</code><div class="accb"><button type="button" class="btn pri sm" id="ap-share">Partilhar</button><button type="button" class="btn sm" id="ap-copy">Copiar link</button></div></div></div></div>'+
    '<h2 style="font-size:1.1rem">Histórico de versões</h2><div class="card">'+changelogHTML()+'</div>';
}
function bindAppCard(el){
  const i=el.querySelector('#ap-inst');if(i)i.onclick=doInstall;
  const s=el.querySelector('#ap-share');if(s)s.onclick=shareApp;
  const c=el.querySelector('#ap-copy');if(c)c.onclick=copyLink;
  const q=el.querySelector('#qr');if(q&&IS_APP){q.innerHTML='<img src="icons/qr.png" alt="Código QR da PRONEX" width="132" height="132">';}else if(q)loadQR().then(Q=>{q.innerHTML='';new Q(q,{text:APP_URL,width:132,height:132,colorDark:'#0A0F2B',colorLight:'#ffffff',correctLevel:Q.CorrectLevel.M});}).catch(()=>{q.innerHTML='<span class="dim" style="font-size:.8rem">Sem internet para gerar o código QR.</span>';});
}
/* Atalhos do ícone da app (manter carregado no Android) */
function handleLaunchParams(){try{const p=new URLSearchParams(location.search).get('go');if(!p)return;history.replaceState(null,'',location.pathname);
  if(p==='sim')startSess('sim');else if(p==='rev')startSess('rev');else if(p==='tutor'){commTab='ai';go('comm');}}catch(e){}}

window.addEventListener('appinstalled',()=>{installEvt=null;try{localStorage.setItem('ps-inst-x',today());}catch(e){}toast('App instalada. Já a encontras no ecrã principal.');appBar();refresh();});
