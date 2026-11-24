/* Pronex_Study · 06-entrada-definicoes.js
   Entrada na app: boas-vindas, conta, consentimento, notificações, definições e motor do tutor no dispositivo.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
const X8=(()=>{
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,String(v));}catch(e){}},del:k=>{try{localStorage.removeItem(k);}catch(e){}}};
const SS={get:k=>{try{return sessionStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{sessionStorage.setItem(k,String(v));}catch(e){}},del:k=>{try{sessionStorage.removeItem(k);}catch(e){}}};
const IK={back:'<path d="M15 6l-6 6 6 6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',users:'<circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0M16 5a3 3 0 010 6M21 20a6 6 0 00-4-5.6"/>',lamp:'<path d="M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z"/>',lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01"/>',cards:'<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 012 2v12"/>',bell:'<path d="M6 16V11a6 6 0 1112 0v5l2 2H4zM10 21h4"/>',flame:'<path d="M12 3c3 4 6 6 6 11a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-8z"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',check:'<path d="M5 12l5 5 9-10"/>',alert:'<path d="M12 3l9 16H3zM12 10v4M12 17h.01"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',doc:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',refresh:'<path d="M20 11a8 8 0 00-14.9-3M4 4v4h4M4 13a8 8 0 0014.9 3M20 20v-4h-4"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',repeat:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3"/>',send:'<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',out:'<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>',phone:'<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'};
const ic=(n,s)=>'<svg viewBox="0 0 24 24" width="'+(s||22)+'" height="'+(s||22)+'" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+IK[n]+'</svg>';
const GLOGO='<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.6 28.6A14.5 14.5 0 019.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 000 24c0 3.9.9 7.5 2.7 10.7z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>';
const nex=(pose,size,cls)=>'<div class="x8nex '+(cls||'')+'"'+(pose==='normal'||pose==='festejar'?' data-lot="'+(pose==='normal'?'repouso':'festejar')+'"':'')+' style="width:'+size+'px">'+NEX(pose,size)+'</div>';
const standalone=()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}};
const ua=navigator.userAgent||'',IOS=/iP(hone|ad|od)/.test(ua)||(/Macintosh/.test(ua)&&'ontouchend' in document),ANDROID=/Android/.test(ua);
async function sha(s){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
const cmpVer=(a,b)=>{const pa=String(a).split('.').map(Number),pb=String(b).split('.').map(Number);for(let i=0;i<3;i++){const d=(pa[i]||0)-(pb[i]||0);if(d)return d;}return 0;};
const tsOf=v=>v&&typeof v.toMillis==='function'?v.toMillis():(typeof v==='number'?v:0);
const authReady=(ms)=>new Promise(r=>{if(!HAS_FB())return r(false);const t0=Date.now();(function k(){if(FB&&fbUser)return r(true);if(Date.now()-t0>(ms||15000))return r(false);setTimeout(k,200);})();});
const SRV=()=>FB&&FB.Fs&&FB.Fs.serverTimestamp?FB.Fs.serverTimestamp():Date.now();
function confetti(n){if(RM)return;const cs=['#FFC93C','#7FE7FF','#E879C0','#00C386','#FB7E5B','#FFFFFF','#9178E6'];const cx=innerWidth/2,cy=innerHeight/3;
  for(let i=0;i<(n||60);i++){const p=document.createElement('span');p.className='x8conf';p.style.background=cs[i%cs.length];if(i%3===0){p.style.borderRadius='50%';p.style.width=p.style.height='9px';}document.body.appendChild(p);
    const a=Math.random()*Math.PI*2,v=120+Math.random()*160,dx=Math.cos(a)*v,dy=Math.sin(a)*v-120,r=Math.random()*720-360;
    p.animate([{transform:'translate('+cx+'px,'+cy+'px) rotate(0)',opacity:1},{transform:'translate('+(cx+dx)+'px,'+(cy+dy)+'px) rotate('+r/2+'deg)',opacity:1,offset:.45},{transform:'translate('+(cx+dx*1.3)+'px,'+(cy+dy+320)+'px) rotate('+r+'deg)',opacity:0}],{duration:1500+Math.random()*600,easing:'cubic-bezier(.2,.6,.4,1)'}).onfinish=()=>p.remove();}}

/* ---------- configuração partilhada (config/app) ---------- */
let CFG={},cfgLoaded=false;
async function loadCfg(){if(!isFB())return CFG;try{const s=await FB.Fs.getDoc(fdoc('config/app'));CFG=s.exists()?(s.data()||{}):{};}catch(e){}cfgLoaded=true;checkForce();return CFG;}
function checkForce(){if(!CFG.minVersion||cmpVer(APP_VERSION,CFG.minVersion)>=0||document.querySelector('.x8force'))return;
  const o=document.createElement('div');o.className='x8force';o.setAttribute('role','alertdialog');o.setAttribute('aria-label','Atualização obrigatória');
  o.innerHTML='<div>'+nex('incentivar',130,'x8idle')+'<h1>Há uma versão nova</h1><p>Esta versão ('+esc(APP_VERSION)+') já não é suportada. Atualiza para a '+esc(CFG.minVersion)+' para continuares. O teu progresso fica guardado.</p><button type="button"class="x8p w" id="x8-force">'+ic('refresh')+'Atualizar agora</button></div>';
  document.body.appendChild(o);o.querySelector('#x8-force').onclick=async e=>{e.currentTarget.disabled=true;e.currentTarget.lastChild.textContent='A atualizar…';try{if(SWREG){await SWREG.update();const w=SWREG.waiting||updWaiting;if(w)w.postMessage('skipWaiting');}}catch(x){}setTimeout(()=>location.reload(),2500);};}

/* ---------- consentimento ---------- */
const consentOk=()=>LS.get('x8-consent','')===LEGAL.v;
async function pullConsent(){if(!isFB()||isAnon())return;
  if(LS.get('x8-consent-dono','')!==uid){LS.del('x8-consent');LS.del('x8-consent-em');LS.del('x17-consent-srv');LS.set('x8-consent-dono',uid);}
  if(consentOk()){if(LS.get('x17-consent-srv','')!==LEGAL.v)await pushConsent();return;}try{const s=await FB.Fs.getDoc(fdoc('consent/'+uid));if(s.exists()&&s.data().versao===LEGAL.v){LS.set('x8-consent',LEGAL.v);LS.set('x8-consent-em',tsOf(s.data().aceitouEm)||Date.now());LS.set('x17-consent-srv',LEGAL.v);}}catch(e){}}
async function pushConsent(){if(!isFB())return;LS.set('x8-consent-dono',uid);const em=+LS.get('x8-consent-em',Date.now());
  try{await FB.Fs.setDoc(fdoc('consent/'+uid),{versao:LEGAL.v,aceitouEm:SRV(),idade13:true,termos:true});LS.set('x17-consent-srv',LEGAL.v);}catch(e){}
  try{await FB.Fs.setDoc(fdoc('utilizadores/'+uid),{consent:{v:LEGAL.v,em}},{merge:true});}catch(e){}}

/* ---------- entrada (primeira utilização) ---------- */
const knownAcc=()=>{try{return localStorage.getItem('x18-saiu')!=='1'&&!!(localStorage.getItem('x8-consent-dono')||localStorage.getItem('x18-conta'));}catch(e){return false;}};
const G={o:null,list:[],total:1,mode:knownAcc()?'in':'new',err:'',busy:false,back:false,showGuide:false,goal:15,cor:0,tries:0};
function needs(){const s=[];
  if(IS_APP&&!standalone()&&LS.get('x8-inst','')!=='1')s.push('inst');
  if(LS.get('x8-hi','')!=='1'&&!hasProfile)s.push('hi');
  if(HAS_FB()&&(!fbUser||isAnon())&&!G.offline)s.push('acc');
  else if(HAS_FB()&&fbUser&&fbUser.email&&!fbUser.emailVerified&&LS.get('x8-vlater','')!==fbUser.uid)s.push('vfy');
  if(!consentOk())s.push('ok');
  if(CFG.turmaHash&&LS.get('x8-turma','')!==CFG.turmaHash&&!isOwner)s.push('turma');
  if(!hasProfile)s.push('perfil');
  return s;}
async function gate(){
  if(!IS_APP&&BACKEND==='claude'&&consentOk()&&hasProfile){afterGate();return;}
  if(HAS_FB()){let ok=await authReady(6000);
    if((!ok||isAnon())&&knownAcc()){/* a sessão da conta ainda está a ser recuperada: espera em vez de pedir para criar conta */
      if(!G.o){G.o=document.createElement('div');G.o.className='x8g';G.o.id='x8onb';G.o.setAttribute('role','dialog');G.o.setAttribute('aria-modal','true');G.o.setAttribute('aria-label','Visita guiada da Pronex_Study');document.body.appendChild(G.o);}
      G.o.innerHTML='<div class="x8box"><div class="x8mid x8c">'+nex('pensar',120,'x8think')+'<h1 style="font-size:24px">A ligar à tua conta…</h1><p class="x8sub">Pode demorar uns segundos com a internet lenta.</p></div><div class="x8dock"><button type="button"class="x8lk" id="x8-offl">Continuar sem ligação</button></div></div>';
      let skip=false;const b=document.getElementById('x8-offl');if(b)b.onclick=()=>{skip=true;};
      const t0=Date.now();while(!skip&&Date.now()-t0<25000&&!(fbUser&&!isAnon()))await new Promise(r=>setTimeout(r,300));
      if(skip&&consentOk()&&hasProfile){G.offline=true;}
      ok=!!fbUser;}
    if(ok){await Promise.all([loadCfg(),pullConsent()]);}}
  G.list=needs();if(!G.list.length){if(G.o){G.o.remove();G.o=null;}afterGate();return;}
  G.total=G.list.length;G.goal=ME.goal||15;G.cor=ME.cor||0;
  if(!G.o){G.o=document.createElement('div');G.o.className='x8g';G.o.id='x8onb';G.o.setAttribute('role','dialog');G.o.setAttribute('aria-modal','true');G.o.setAttribute('aria-label','Visita guiada da Pronex_Study');document.body.appendChild(G.o);}
  render();}
function next(){G.err='';G.busy=false;G.back=false;if(isFB()&&!isAnon()&&LS.get('x8-consent-dono','')!==uid&&G.pulled!==uid){G.pulled=uid;pullConsent().then(next);return;}G.list=needs();if(!G.list.length){finish();return;}
  if(G.list[0]==='perfil'&&HAS_FB()&&fbUser&&typeof perfisLoaded!=='undefined'&&!perfisLoaded&&(G.wait=(G.wait||0)+1)<16){G.o.innerHTML='<div class="x8box"><div class="x8mid x8c">'+nex('pensar',120,'x8think')+'<p class="x8sub">A carregar o teu perfil…</p></div></div>';setTimeout(next,250);return;}
  render();}
/* 1.17.2: se a sessão da conta chegar enquanto o ecrã de entrada está aberto, avança sozinho; e lembra que este dispositivo já teve conta */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#acc-pw');if(!b||!fbUser||!fbUser.email)return;b.disabled=true;resetPass(fbUser.email).finally(()=>{b.disabled=false;});});
setInterval(()=>{try{if(fbUser&&!isAnon()){try{localStorage.setItem('x18-conta','1');localStorage.removeItem('x18-saiu');}catch(e){}if(G.o&&G.list[0]==='acc')next();}}catch(e){}},1000);
function finish(){const o=G.o;G.o=null;if(o){o.style.transition='opacity .3s';o.style.opacity='0';setTimeout(()=>o.remove(),300);}st.onb=true;save();refresh();afterGate();}
function prog(){const done=Math.max(0,G.total-G.list.length);return'<div class="x8prog" aria-hidden="true">'+Array.from({length:Math.min(G.total,6)},(_,i)=>'<i class="'+(i<=done?'on':'')+'"></i>').join('')+'</div>';}
function top(back){return'<div class="x8top">'+(back?'<button type="button"class="x8ib" id="x8-back" aria-label="Voltar">'+ic('back')+'</button>':'<span style="width:42px"></span>')+prog()+'<span style="width:42px"></span></div>';}
function render(){const o=G.o;if(!o)return;const step=G.list[0];o.className='x8g'+(step==='inst'?' blue':'');let h='';
  if(step==='inst'){
    const guide=IOS?'<b>No iPhone ou iPad (Safari):</b> toca em <b>Partilhar</b> e depois em <b>Adicionar ao ecrã principal</b>.':ANDROID?'<b>No Android (Chrome):</b> toca no menu <b>⋮</b> e depois em <b>Instalar app</b> ou <b>Adicionar ao ecrã principal</b>.':'<b>No computador (Chrome ou Edge):</b> clica no ícone de instalar na barra de endereço, à direita.';
    h='<div class="x8box"><div class="x8mid x8c">'+nex('festejar',176,'x8jump')+'<h1>Estuda com o Nex.<br>Todos os dias.</h1><p class="x8sub">Exercícios sem fim, explicações passo a passo e um tutor que te ajuda a pensar.</p>'+
      '<div class="x8chips"><span class="x8chip" style="background:var(--x8-pink)">'+ic('quiz',18)+'Simulações</span><span class="x8chip" style="background:var(--x8-coral)">'+ic('repeat',18)+'Revisão</span><span class="x8chip" style="background:var(--x8-green)">'+ic('lamp',18)+'Nex, o tutor</span></div>'+
      (G.showGuide?'<p class="x8sub" style="background:rgba(255,255,255,.35);border-radius:18px;padding:14px 16px;text-align:left">'+guide+'</p>':'')+'</div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-inst">'+ic('download')+'Instalar a app</button><button type="button"class="x8lk" id="x8-skip">Continuar no browser</button><p class="x8fine">Grátis · Sem anúncios · Funciona sem internet</p></div></div>';}
  else if(step==='hi'){
    h='<div class="x8box'+(G.back?' back':'')+'">'+top(false)+'<div class="x8mid x8c"><div class="x8bub">Olá! Eu sou o Nex.<br>Vou estudar contigo.</div>'+nex('normal',170,'x8idle')+'</div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-go">Vamos a isso!</button>'+(HAS_FB()?'<button type="button"class="x8lk" id="x8-have">Já tenho conta</button>':'')+'</div></div>';}
  else if(step==='acc'){const isNew=G.mode==='new';
    h='<div class="x8box'+(G.back?' back':'')+'">'+top(LS.get('x8-hi','')==='1'&&!hasProfile)+'<div class="x8mid" style="justify-content:flex-start;gap:14px;padding-top:6px"><h1>'+(isNew?'Cria a tua conta':'Entra na tua conta')+'</h1><p class="x8sub">'+(isNew?'A conta guarda a sequência, o progresso e o perfil em qualquer telemóvel ou computador.':'Usa a mesma conta para continuares onde paraste.')+'</p>'+
      '<div class="x8seg" role="group" aria-label="Tipo de acesso"><button type="button"data-m="new" aria-pressed="'+isNew+'">Criar conta</button><button type="button"data-m="in" aria-pressed="'+!isNew+'">Entrar</button></div>'+
      (NO_G?'':'<button type="button"class="x8p w" id="x8-g">'+GLOGO+'Continuar com Google</button><div class="x8or">ou com email</div>')+
      '<form id="x8-f" novalidate style="display:flex;flex-direction:column;gap:12px"><label class="x8f">Email<input id="x8-e" type="email" inputmode="email" autocomplete="email" required></label>'+
      '<label class="x8f">Palavra-passe<input id="x8-p" type="password" autocomplete="'+(isNew?'new-password':'current-password')+'" minlength="8" required>'+(isNew?'<small>Pelo menos 8 caracteres, com letras e números.</small>':'')+'</label><button type="button" class="x8lk" id="x8-ver" aria-pressed="false" style="align-self:flex-start;font-size:14px;padding:0">Mostrar palavra-passe</button>'+
      '<p class="x8err" role="alert">'+esc(G.err)+'</p></form>'+(isNew?'':'<button type="button"class="x8lk" id="x8-forgot">Esqueci-me da palavra-passe</button>')+'</div>'+
      '<div class="x8dock"><button type="submit"class="x8p l" id="x8-sub" form="x8-f"'+(G.busy?' disabled':'')+'>'+(G.busy?'Um momento…':isNew?'Criar conta':'Entrar')+'</button>'+
      (NO_G?'<p class="x8fine">Na app instalada no iPhone, o Google não funciona: usa email e palavra-passe.'+(isNew?'':' Criaste a conta com o Google? Escreve o teu email e toca em «Esqueci-me da palavra-passe» para criares uma.')+'</p>':'')+'</div></div>';}
  else if(step==='vfy'){
    h='<div class="x8box">'+top(false)+'<div class="x8mid x8c"><span class="x8bigi">'+ic('mail',38)+'</span><h1>Confirma o teu email</h1><p class="x8sub">Enviámos um link para <b style="color:var(--x8-ink)">'+esc(fbUser&&fbUser.email||'')+'</b>. Abre-o e volta aqui. Se não o vires, procura no spam.</p><p class="x8err" role="alert">'+esc(G.err)+'</p></div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-vok"'+(G.busy?' disabled':'')+'>Já confirmei</button><button type="button"class="x8p gh" id="x8-vre">Reenviar email</button><button type="button"class="x8lk" id="x8-vlater">Confirmar mais tarde</button><p class="x8fine">Sem confirmar, podes estudar e usar o tutor; o mural, a conversa e o ranking ficam bloqueados.</p></div></div>';}
  else if(step==='ok'){
    h='<div class="x8box'+(G.back?' back':'')+'">'+top(false)+'<div class="x8mid" style="justify-content:flex-start;gap:12px"><div class="x8say">'+nex('incentivar',84,'x8idle')+'<div class="x8bub">Antes de começar, três coisas importantes.</div></div>'+
      '<div class="x8rule"><span class="ri" style="background:var(--x8-blue)">'+ic('shield')+'</span><div><b>Os teus dados são teus</b><p>Guardamos só o necessário para a app funcionar. Podes descarregar ou apagar tudo nas Definições.</p></div></div>'+
      '<div class="x8rule"><span class="ri" style="background:var(--x8-green)">'+ic('users')+'</span><div><b>Respeito na comunidade</b><p>Sem insultos, sem partilhar dados pessoais de ninguém, sem spam. O que publicas pode ser revisto.</p></div></div>'+
      '<div class="x8rule"><span class="ri" style="background:var(--x8-coral)">'+ic('lamp')+'</span><div><b>O Nex responde com a matéria</b><p>Usa as lições, as fichas e o glossário da app, no teu dispositivo. Pode errar: confirma sempre com o professor.</p></div></div>'+
      '<label class="x8chk"><input type="checkbox" id="x8-a1"><i></i><span>Tenho 13 anos ou mais.</span></label>'+
      '<label class="x8chk"><input type="checkbox" id="x8-a2"><i></i><span>Li e aceito os <a href="'+LEGAL_BASE+'termos.html" target="_blank" rel="noopener">Termos</a>, a <a href="'+LEGAL_BASE+'privacidade.html" target="_blank" rel="noopener">Política de Privacidade</a> e as <a href="'+LEGAL_BASE+'regras.html" target="_blank" rel="noopener">Regras da comunidade</a>.</span></label></div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-acc" disabled>Aceitar e continuar</button><p class="x8fine">Termos e privacidade, versão '+LEGAL.v+' · '+LEGAL.data+'</p></div></div>';}
  else if(step==='turma'){
    h='<div class="x8box">'+top(false)+'<div class="x8mid x8c"><span class="x8bigi">'+ic('lock',38)+'</span><h1>Código da turma</h1><p class="x8sub">Pede-o ao teu professor ou ao delegado de turma.</p>'+
      '<div class="x8otp" id="x8-otp">'+Array.from({length:6},(_,i)=>'<input maxlength="1" inputmode="text" autocomplete="one-time-code" aria-label="Carácter '+(i+1)+'" autocapitalize="characters">').join('')+'</div><p class="x8err" role="alert">'+esc(G.err)+'</p><p class="x8fine">Assim só entra quem é da tua turma.</p></div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-tok">Entrar</button></div></div>';}
  else if(step==='perfil'){
    h='<div class="x8box">'+top(false)+'<div class="x8mid" style="justify-content:flex-start;gap:14px"><h1>Como te chamamos?</h1><p class="x8sub">É o nome que aparece no perfil, no mural e no ranking da turma.</p>'+
      '<label class="x8f">Nome na app<input id="x8-nick" maxlength="30" autocomplete="nickname" value="'+esc(ME.nick||'')+'" placeholder="Ex.: Kaizer"></label>'+
      '<div class="x8f">Quanto queres treinar por dia?<div class="x8goals">'+[[5,'Leve','~5 min'],[10,'Normal','~10 min'],[15,'Sério','~15 min'],[20,'Intenso','~20 min']].map(([n,l,m])=>'<button type="button" class="x8goal" data-g="'+n+'" aria-pressed="'+(G.goal===n)+'"><em>'+l+'</em><b>'+n+'</b><span>exercícios · '+m+'</span></button>').join('')+'</div></div>'+
      '<div class="x8f">Cor do avatar<div class="x8cols">'+['#5FA0FC','#9178E6','#E879C0','#00C386','#FB7E5B','#FFC93C'].map((c,i)=>'<button type="button" data-c="'+i+'" style="background:'+c+'" aria-pressed="'+(G.cor===i)+'" aria-label="Cor '+(i+1)+'"></button>').join('')+'</div></div><p class="x8err" role="alert">'+esc(G.err)+'</p></div>'+
      '<div class="x8dock"><button type="button"class="x8p w" id="x8-done">Entrar na app</button></div></div>';}
  o.innerHTML=h;bind(step);o.scrollTop=0;
  const f=o.querySelector('#x8-go,#x8-inst,#x8-e,#x8-vok,#x8-a1,#x8-otp input,#x8-nick');if(f&&!('ontouchstart' in window))f.focus();}
function bind(step){const o=G.o,$=id=>o.querySelector('#'+id);
  const bk=$('x8-back');if(bk)bk.onclick=()=>{if(step==='acc'){LS.del('x8-hi');G.back=true;G.list=needs();render();}};
  if(step==='inst'){$('x8-inst').onclick=async()=>{if(typeof installEvt!=='undefined'&&installEvt){await doInstall();LS.set('x8-inst','1');next();}else{G.showGuide=true;render();}};$('x8-skip').onclick=()=>{LS.set('x8-inst','1');tone(SND.tap);next();};}
  if(step==='hi'){$('x8-go').onclick=()=>{LS.set('x8-hi','1');G.mode='new';tone(SND.tap);next();};const hv=$('x8-have');if(hv)hv.onclick=()=>{LS.set('x8-hi','1');G.mode='in';next();};}
  if(step==='acc'){
    o.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{G.mode=b.dataset.m;G.err='';render();});
    const g=$('x8-g');if(g)g.onclick=async()=>{if(!FB){G.err='A ligar ao servidor… tenta daqui a um segundo.';render();return;}G.busy=true;g.disabled=true;await loginGoogle();G.busy=false;if(fbUser&&!isAnon()){await pullConsent();next();}else render();};
    const fg=$('x8-forgot');if(fg)fg.onclick=async()=>{const em=$('x8-e').value.trim();if(!em){G.err='Escreve primeiro o teu email.';render();return;}fg.disabled=true;const ok=await resetPass(em);fg.disabled=false;const xe=o.querySelector('.x8err');if(xe){xe.className=ok?'x8err ok':'x8err';xe.textContent=ok?'Se existir uma conta com este email, enviámos um link para criares uma palavra-passe nova. Vê também no spam.':(window.ERRO_RESET||'Não foi possível enviar o email.');}};
    const vr=$('x8-ver');if(vr)vr.onclick=()=>{const p=$('x8-p'),v=p.type==='password';p.type=v?'text':'password';vr.textContent=v?'Esconder palavra-passe':'Mostrar palavra-passe';vr.setAttribute('aria-pressed',String(v));};
    $('x8-f').onsubmit=async e=>{e.preventDefault();const em=$('x8-e').value.trim(),pw=$('x8-p').value;
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){G.err='Esse email não parece válido.';$('x8-e').setAttribute('aria-invalid','true');o.querySelector('.x8err').textContent=G.err;return;}
      if(G.mode==='new'&&(pw.length<8||!/[0-9]/.test(pw)||!/[A-Za-zÀ-ÿ]/.test(pw))){G.err='A palavra-passe precisa de 8 caracteres, com letras e números.';$('x8-p').setAttribute('aria-invalid','true');o.querySelector('.x8err').textContent=G.err;return;}
      if(!FB){G.err='A ligar ao servidor… tenta daqui a um segundo.';o.querySelector('.x8err').textContent=G.err;return;}
      const sb=$('x8-sub');sb.disabled=true;sb.textContent='Um momento…';
      const ok=await loginEmail(G.mode,em,pw);
      if(!ok){sb.disabled=false;sb.textContent=G.mode==='new'?'Criar conta':'Entrar';G.err=window.ERRO_ENTRADA||'Não foi possível entrar. Tenta outra vez.';const xe=o.querySelector('.x8err');if(xe){xe.className='x8err';xe.textContent=G.err;}return;}
      await new Promise(r=>setTimeout(r,400));onUserUpdate();
      if(G.mode==='new'&&fbUser&&!fbUser.emailVerified){try{await FB.Au.sendEmailVerification(fbUser);}catch(x){}}
      await pullConsent();next();};}
  if(step==='vfy'){
    $('x8-vok').onclick=async()=>{G.busy=true;render();try{await FB.auth.currentUser.reload();await FB.auth.currentUser.getIdToken(true);}catch(e){}onUserUpdate();G.busy=false;if(FB.auth.currentUser&&FB.auth.currentUser.emailVerified){toast('Email confirmado.');next();}else{G.err='Ainda não está confirmado. Abre o link que te enviámos.';render();}};
    $('x8-vre').onclick=async()=>{try{await FB.Au.sendEmailVerification(FB.auth.currentUser);toast('Enviámos outro email.');}catch(e){toast(e&&e.code==='auth/too-many-requests'?'Espera um pouco antes de pedir outro email.':'Não foi possível enviar o email.');}};
    $('x8-vlater').onclick=()=>{LS.set('x8-vlater',fbUser.uid);next();};}
  if(step==='ok'){const a1=$('x8-a1'),a2=$('x8-a2'),b=$('x8-acc');const upd=()=>{b.disabled=!(a1.checked&&a2.checked);};a1.onchange=a2.onchange=()=>{upd();haptic(8);};
    b.onclick=async()=>{LS.set('x8-consent',LEGAL.v);LS.set('x8-consent-em',Date.now());logEv('consentimento',{v:LEGAL.v});tone(SND.tap);b.disabled=true;await pushConsent();next();};}
  if(step==='turma'){const ins=[...o.querySelectorAll('#x8-otp input')];
    ins.forEach((inp,i)=>{inp.oninput=()=>{inp.value=inp.value.replace(/[^0-9a-z]/gi,'').slice(-1).toUpperCase();if(inp.value&&ins[i+1])ins[i+1].focus();};
      inp.onkeydown=e=>{if(e.key==='Backspace'&&!inp.value&&ins[i-1])ins[i-1].focus();if(e.key==='Enter')$('x8-tok').click();};
      inp.onpaste=e=>{const t=(e.clipboardData.getData('text')||'').replace(/[^0-9a-z]/gi,'').toUpperCase().slice(0,6);if(!t)return;e.preventDefault();ins.forEach((x,j)=>x.value=t[j]||'');(ins[Math.min(t.length,5)]).focus();};});
    $('x8-tok').onclick=async()=>{const lock=+LS.get('x8-turma-lock',0);if(Date.now()<lock){G.err='Demasiadas tentativas. Espera um minuto.';o.querySelector('.x8err').textContent=G.err;return;}
      const code=ins.map(x=>x.value).join('');if(code.length<6){G.err='O código tem 6 caracteres.';o.querySelector('.x8err').textContent=G.err;return;}
      const h=await sha('pronex-turma:'+code);
      if(h===CFG.turmaHash){LS.set('x8-turma',h);try{await FB.Fs.setDoc(fdoc('utilizadores/'+uid),{turma:true},{merge:true});}catch(e){}tone(SND.ok||SND.tap);next();}
      else{G.tries++;if(G.tries>=5){LS.set('x8-turma-lock',Date.now()+60000);G.tries=0;}const box=$('x8-otp');box.classList.remove('bad');void box.offsetWidth;box.classList.add('bad');haptic([30,40,30]);G.err='Código errado. Confirma com o teu professor.';o.querySelector('.x8err').textContent=G.err;}};}
  if(step==='perfil'){
    o.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{G.goal=+b.dataset.g;o.querySelectorAll('[data-g]').forEach(x=>x.setAttribute('aria-pressed',x===b));haptic(10);});
    o.querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>{G.cor=+b.dataset.c;o.querySelectorAll('[data-c]').forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $('x8-done').onclick=()=>{const nick=$('x8-nick').value.trim().replace(/\s+/g,' ');if(filtroPublicacao(nick)){toast('Escolhe um nome sem insultos.');return;}
      if(nick.length<2){G.err='Escreve o teu nome (pelo menos 2 letras).';$('x8-nick').setAttribute('aria-invalid','true');o.querySelector('.x8err').textContent=G.err;$('x8-nick').focus();return;}
      ME=Object.assign(ME,{nick,goal:G.goal,cor:G.cor});hasProfile=true;st.onb=true;save();saveMeLocal();lastSync='';syncProfile();if(isFB())registerUser();logEv('perfil');
      G.o.innerHTML='<div class="x8box"><div class="x8mid x8c">'+nex('festejar',170,'x8jump')+'<h1>Bem-vindo, '+esc(nick)+'!</h1><p class="x8sub">Começa por um exercício. O Nex está contigo.</p></div></div>';confetti(70);tone(SND.win);setTimeout(finish,1700);};}
}

/* ---------- depois da entrada ---------- */
let afterDone=false;
function afterGate(){if(afterDone)return;afterDone=true;try{showNews();}catch(e){}
  authReady(20000).then(ok=>{if(!ok)return;if(!cfgLoaded)loadCfg();ntStart();});
  setInterval(()=>{if(isFB()&&document.visibilityState==='visible'){loadCfg();}},10*60*1000);
  renderBell();}

/* ---------- notificações ---------- */
let NT=[],ntSubs=[],ntFirst=true;
const readSet=()=>{try{return new Set(JSON.parse(LS.get('x8-lidas','[]')));}catch(e){return new Set();}};
const markRead=ids=>{const s=readSet();ids.forEach(i=>s.add(i));LS.set('x8-lidas',JSON.stringify([...s].slice(-300)));};
function ntStart(){if(!isFB()||ntSubs.length)return;const F=FB.Fs,got={};
  const onSnap=key=>snap=>{got[key]=snap.docs.map(d=>Object.assign({id:d.id},d.data()));const all=[].concat(got.t||[],got.u||[]).sort((a,b)=>tsOf(b.criadoEm)-tsOf(a.criadoEm)).slice(0,40);
    const last=+LS.get('x8-nt-last',0),rs=readSet();const fresh=all.filter(n=>tsOf(n.criadoEm)>last&&!rs.has(n.id));
    if(!ntFirst||last)fresh.forEach(sysNotify);ntFirst=false;
    if(all.length)LS.set('x8-nt-last',Math.max(last,...all.map(n=>tsOf(n.criadoEm))));NT=all;renderBell();if(document.querySelector('.x8sheet.nt'))openNotifs(true);};
  try{ntSubs.push(F.onSnapshot(F.query(fcol('notifs'),F.where('alvo','==','todos'),F.limit(30)),onSnap('t'),()=>{}));
    ntSubs.push(F.onSnapshot(F.query(fcol('notifs'),F.where('alvo','==',uid),F.limit(30)),onSnap('u'),()=>{}));}catch(e){}}
function localNotifs(){const out=[],d=today();let S;try{S=stats();}catch(e){return out;}
  if(updWaiting)out.push({id:'upd-'+d,ic:'star',cor:'var(--x8-lil)',t:'Versão nova disponível',p:'Atualiza para teres as últimas melhorias.',btn:['upd','Atualizar']});
  const hr=new Date().getHours();if(S.streak>0&&S.today===0&&hr>=16)out.push({id:'stk-'+d,ic:'flame',cor:'var(--x8-coral)',t:'A tua sequência está em risco',p:'Faz um exercício hoje para manteres '+S.streak+' dia'+(S.streak>1?'s':'')+' seguidos.',btn:['play','Praticar agora']});
  let due=[];try{due=reviewDue();}catch(e){}if(due.length)out.push({id:'rev-'+d,ic:'repeat',cor:'var(--x8-pink)',t:due.length+' tipo'+(due.length>1?'s':'')+' para rever hoje',p:'Exercícios em que erraste, no momento certo para não esquecer.',btn:['rev','Rever']});
  const td=typeof testDays==='function'?testDays():null;if(td!==null&&td<=3)out.push({id:'tst-'+d,ic:'cal',cor:'var(--x8-yel)',t:td===0?'O teu teste é hoje':'Teste daqui a '+td+' dia'+(td>1?'s':''),p:'Uma simulação agora mostra o que ainda falta treinar.',btn:['sim','Fazer simulação']});
  return out;}
const TIPO={aviso:['bell','var(--x8-blue)'],versao:['star','var(--x8-lil)'],turma:['users','var(--x8-green)']};
function allNotifs(){const rs=readSet();const loc=localNotifs().map(n=>Object.assign(n,{loc:true,ts:Date.now(),novo:!rs.has(n.id)}));
  const rem=NT.map(n=>{const k=TIPO[n.tipo]||TIPO.aviso;return{id:n.id,ic:k[0],cor:k[1],t:n.titulo||'',p:n.texto||'',ts:tsOf(n.criadoEm),novo:!rs.has(n.id)};});return loc.concat(rem);}
function unread(){return allNotifs().filter(n=>n.novo).length;}
function bellHTML(){const n=unread();return'<button type="button"class="x8bell" data-x8bell aria-label="Notificações'+(n?', '+n+' por ler':'')+'">'+ic('bell')+(n?'<em>'+(n>9?'9+':n)+'</em>':'')+'</button>';}
function renderBell(){const n=unread();document.querySelectorAll('[data-x8bell]').forEach(b=>b.outerHTML=bellHTML());document.querySelectorAll('[data-x8bell]').forEach(b=>b.onclick=()=>openNotifs());
  try{if(navigator.setAppBadge){n?navigator.setAppBadge(n):navigator.clearAppBadge();}}catch(e){}}
function sysNotify(n){if(LS.get('x8-push','')!=='1'||!('Notification' in window)||Notification.permission!=='granted')return;
  const t=n.titulo||'PRONEX',b=n.texto||'';try{navigator.serviceWorker.ready.then(r=>r.showNotification(t,{body:b,icon:'icons/v2/icon-192.png',badge:'icons/v2/icon-192.png',tag:n.id,lang:'pt-PT'}));}catch(e){try{new Notification(t,{body:b,icon:'icons/v2/icon-192.png'});}catch(x){}}}
async function askPush(){if(!('Notification' in window)){toast(IOS&&!standalone()?'No iPhone, instala primeiro a app no ecrã principal para receber avisos.':'Este dispositivo não suporta avisos.');return false;}
  let p=Notification.permission;if(p==='default'){try{p=await Notification.requestPermission();}catch(e){}}
  if(p==='granted'){LS.set('x8-push','1');toast('Avisos ativados.');logEv('avisos',{on:1});return true;}
  LS.set('x8-push','0');toast(p==='denied'?'Os avisos estão bloqueados nas definições do browser.':'Avisos não ativados.');return false;}
function closeSheet8(){document.querySelectorAll('.x8sheet,.x8sheet-bg').forEach(e=>e.remove());}
function openNotifs(keep){const list=allNotifs();const hoje=new Date();hoje.setHours(0,0,0,0);
  const card=n=>'<div class="x8n'+(n.novo?' new':'')+'"><span class="ni" style="background:'+n.cor+'">'+ic(n.ic,20)+'</span><div style="flex:1;min-width:0"><b>'+esc(n.t)+'</b><p>'+esc(n.p)+'</p><small>'+(n.loc?'hoje':ago(n.ts))+'</small>'+(n.btn?'<div><button type="button"class="x8p w sm" data-nb="'+n.btn[0]+'">'+esc(n.btn[1])+'</button></div>':'')+'</div>'+(n.novo?'<span class="dot" aria-label="Por ler"></span>':'')+'</div>';
  const a=list.filter(n=>n.loc||n.ts>=hoje.getTime()),b=list.filter(n=>!n.loc&&n.ts<hoje.getTime());
  const canPush='Notification' in window&&Notification.permission!=='granted'&&LS.get('x8-push','')!=='0';
  let h='<span class="grab"></span><div class="x8sh"><h2>Notificações</h2>'+(list.some(n=>n.novo)?'<button type="button"class="x8lk" id="x8-rall" style="font-size:15px">Ler todas</button>':'')+'</div>';
  if(canPush)h+='<div class="x8perm">'+ic('bell')+'<div><b>Ativar avisos</b><span>Sabe logo quando alguém te responde ou há uma versão nova.</span></div><button type="button"class="x8p l sm" id="x8-push">Ativar</button></div>';
  if(!list.length)h+='<div class="x8empty">'+nex('dormir',110,'x8sleep')+'<b>Tudo em dia</b><p>Quando houver novidades da turma ou da app, aparecem aqui.</p></div>';
  else{if(a.length)h+='<div class="x8sec">HOJE</div>'+a.map(card).join('');if(b.length)h+='<div class="x8sec">ANTES</div>'+b.map(card).join('');}
  if(!keep)closeSheet8();let sh=document.querySelector('.x8sheet.nt');
  if(!sh){const bg=document.createElement('div');bg.className='x8sheet-bg';bg.onclick=()=>{markRead(allNotifs().map(n=>n.id));closeSheet8();renderBell();};document.body.appendChild(bg);sh=document.createElement('div');sh.className='x8sheet nt';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Notificações');document.body.appendChild(sh);}
  sh.innerHTML=h;if(!sh.querySelector('.x17nx')){(sh.querySelector('.x8sh')||sh).insertAdjacentHTML('beforeend','<button type="button"class="x17nx" aria-label="Fechar">✕</button>');sh.querySelector('.x17nx').onclick=()=>{markRead(allNotifs().map(n=>n.id));closeSheet8();renderBell();};}
  const ra=sh.querySelector('#x8-rall');if(ra)ra.onclick=()=>{markRead(allNotifs().map(n=>n.id));renderBell();openNotifs(true);};
  const pb=sh.querySelector('#x8-push');if(pb)pb.onclick=async()=>{await askPush();openNotifs(true);};
  sh.querySelectorAll('[data-nb]').forEach(btn=>btn.onclick=()=>{const k=btn.dataset.nb;markRead(allNotifs().map(n=>n.id));closeSheet8();renderBell();
    if(k==='upd'){const w=(SWREG&&SWREG.waiting)||updWaiting;if(w)w.postMessage('skipWaiting');setTimeout(()=>location.reload(),3000);}else if(k==='rev')startSess('rev');else if(k==='sim')startSess('sim');else if(k==='play')startSess(weakTypes(1).length?'weak':'mix');});
  document.addEventListener('keydown',function esc8(e){if(e.key==='Escape'){markRead(allNotifs().map(n=>n.id));closeSheet8();renderBell();document.removeEventListener('keydown',esc8);}});}

/* ---------- definições ---------- */
const D8={open:false,t:'',p:'',err:'',busy:false};
const needVerify=()=>HAS_FB()&&!!fbUser&&!isAnon()&&!!fbUser.email&&!fbUser.emailVerified;
function settingsHTML(){const em=+LS.get('x8-consent-em',0);const pushOn=LS.get('x8-push','')==='1'&&'Notification' in window&&Notification.permission==='granted';
  let h='<div class="x8card"><h2>Notificações</h2><div><div class="x8row"><div class="rt"><b>Avisos no dispositivo</b><span>Avisos do professor e versões novas, mesmo com a app fechada.</span></div><label class="x8sw"><input type="checkbox" id="x8-s-push"'+(pushOn?' checked':'')+' aria-label="Avisos no dispositivo"><i></i></label></div>'+
    '<div class="x8row"><div class="rt"><b>Central de notificações</b><span>Vê tudo o que recebeste.</span></div><button type="button"class="x8p gh sm" id="x8-s-nt">Abrir</button></div></div></div>';
  h+='<div class="x8card"><h2>Privacidade e dados</h2><div class="x8kv"><span>Termos aceites</span><b>versão '+esc(LS.get('x8-consent','—'))+(em?' · '+new Date(em).toLocaleDateString('pt-PT'):'')+'</b><span>Conta</span><b>'+esc(fbUser&&fbUser.email||(isAnon()?'automática':'—'))+'</b></div><div>'+
    '<div class="x8row"><div class="rt"><b>Descarregar os meus dados</b><span>Ficheiro com o teu perfil, progresso, publicações e conversas.</span></div><button type="button"class="x8p gh sm" id="x8-s-exp">'+ic('download',18)+'Descarregar</button></div>'+
    [['privacidade','Política de Privacidade','O que guardamos e porquê'],['termos','Termos de Utilização','As regras de uso da app'],['regras','Regras da comunidade','Como nos tratamos uns aos outros'],['licencas','Licenças','Fontes e software de terceiros']].map(([f,t,s])=>'<div class="x8row"><a class="rt" href="'+LEGAL_BASE+f+'.html" target="_blank" rel="noopener"><b>'+t+'</b><span>'+s+'</span></a>'+ic('doc',18)+'</div>').join('')+'</div></div>';
  if(IS_APP)h+='<div class="x8card"><h2>Tutor Nex</h2><p>O Nex responde com a matéria da app em qualquer dispositivo, sem internet. O modelo opcional corre no teu dispositivo e serve para reescrever explicações e tentar perguntas fora da matéria; as perguntas não saem daqui.</p><div><div class="x8row"><div class="rt"><b>Modelo opcional</b><span>Leve (cerca de 450 MB) ou completo (cerca de 1,1 GB). Instala-se no ecrã do Nex.</span></div><select id="x8-s-ia" class="x8p gh sm" aria-label="Tamanho do modelo opcional"><option value="leve">Leve</option><option value="completo">Completo</option></select></div><div class="x8row"><div class="rt"><b>Apagar o modelo deste dispositivo</b><span>Liberta espaço. O Nex continua a responder com a matéria da app.</span></div><button type="button"class="x8p gh sm" id="x8-s-iadel">Apagar</button></div></div></div>';
  h+='<div class="x8card"><h2>Sessão</h2><div class="x8btns"><button type="button"class="x8p gh sm" id="x8-s-out">'+ic('out',18)+'Terminar sessão</button>'+(typeof checkUpdates==='function'&&IS_APP?'<button type="button"class="x8p gh sm" id="x8-s-upd">'+ic('refresh',18)+'Procurar atualizações</button>':'')+'</div><p class="x8sub" style="font-size:13px">PRONEX Study '+esc(APP_VERSION)+'</p></div>';
  if(isFB()){const google=fbUser&&(fbUser.providerData||[]).some(p=>p.providerId==='google.com');
    h+='<div class="x8card x8danger"><h2>Apagar a minha conta</h2><p>Apaga para sempre o teu perfil, o progresso, as tuas publicações, comentários e mensagens. Não dá para desfazer.</p><div id="x8-del-box">'+(D8.open?
      '<label class="x8f">Escreve <b style="color:var(--x8-coral)">APAGAR</b> para confirmar<input id="x8-del-t" autocomplete="off" value="'+esc(D8.t)+'"></label>'+(google?'':'<label class="x8f">A tua palavra-passe<input id="x8-del-p" type="password" autocomplete="current-password" value="'+esc(D8.p)+'"></label>')+'<div class="x8btns"><button type="button"class="x8p c sm" id="x8-del-go"'+(D8.t.trim().toUpperCase()==='APAGAR'&&!D8.busy?'':' disabled')+'>'+(D8.busy?'A apagar…':'Apagar tudo para sempre')+'</button><button type="button"class="x8p gh sm" id="x8-del-no">Cancelar</button></div><p class="x8err" id="x8-del-e" role="alert">'+esc(D8.err)+'</p>'
      :'<button type="button"class="x8p c sm" id="x8-s-del">'+ic('trash',18)+'Quero apagar a conta</button>')+'</div></div>';}
  return h;}
function bindSettings(el){const $=id=>el.querySelector('#'+id);
  const sp=$('x8-s-push');if(sp)sp.onchange=async()=>{if(sp.checked){const ok=await askPush();sp.checked=ok;}else{LS.set('x8-push','0');toast('Avisos desligados.');}};
  const nt=$('x8-s-nt');if(nt)nt.onclick=()=>openNotifs();
  const ia=$('x8-s-ia');if(ia&&typeof IA8!=='undefined'){ia.value=IA8.pref();ia.onchange=()=>{IA8.setPref(ia.value);toast('Fica escolhido o modelo '+(ia.value==='leve'?'leve':'completo')+'. Instala-o no ecrã do Nex.');};}
  const iad=$('x8-s-iadel');if(iad&&typeof IA8!=='undefined')iad.onclick=async()=>{iad.disabled=true;await IA8.remove();iad.disabled=false;toast('O modelo foi apagado deste dispositivo.');};
  const ex=$('x8-s-exp');if(ex)ex.onclick=()=>exportMine(ex);
  const out=$('x8-s-out');if(out)out.onclick=()=>{if(typeof logout==='function')logout();};
  const up=$('x8-s-upd');if(up)up.onclick=()=>checkUpdates(up);
  const dl=$('x8-s-del');if(dl)dl.onclick=()=>{D8.open=true;D8.t='';D8.p='';D8.err='';renderProfile();const t=document.getElementById('x8-del-t');if(t)t.focus();};
  const t=$('x8-del-t');if(t)t.oninput=()=>{D8.t=t.value;const g=$('x8-del-go');if(g)g.disabled=D8.t.trim().toUpperCase()!=='APAGAR';};
  const pw=$('x8-del-p');if(pw)pw.oninput=()=>{D8.p=pw.value;};
  const no=$('x8-del-no');if(no)no.onclick=()=>{D8.open=false;renderProfile();};
  const go2=$('x8-del-go');if(go2)go2.onclick=()=>deleteMine();}
function plain(v){if(v==null)return v;if(typeof v.toMillis==='function')return new Date(v.toMillis()).toISOString();if(Array.isArray(v))return v.map(plain);if(typeof v==='object'){const o={};Object.keys(v).forEach(k=>o[k]=plain(v[k]));return o;}return v;}
async function exportMine(btn){btn.disabled=true;const old=btn.innerHTML;btn.textContent='A preparar…';
  const out={app:'Pronex_Study',versao:APP_VERSION,exportadoEm:new Date().toISOString(),nota:'Cópia dos teus dados pessoais (art. 15.º e 20.º do RGPD).',perfil:Object.assign({},ME),consentimento:{versao:LS.get('x8-consent',''),em:+LS.get('x8-consent-em',0)||null},progresso:{respostas:st.ans,sessaoAtual:st.sess||null},historico:HIST,tutor:TUTOR,nuvem:{}};
  if(isFB()){const F=FB.Fs,n=out.nuvem;
    for(const p of ['perfis/'+uid,'utilizadores/'+uid,'consent/'+uid,'premios/'+uid]){try{const s=await F.getDoc(fdoc(p));if(s.exists())n[p]=plain(s.data());}catch(e){}}
    try{const s=await F.getDocs(fcol('data/users/'+uid));n['data/users/'+uid]={};s.docs.forEach(d=>n['data/users/'+uid][d.id]=plain(d.data()));}catch(e){}
    try{const s=await F.getDocs(F.query(fcol('posts'),F.where('uid','==',uid)));n.publicacoes=s.docs.map(d=>Object.assign({id:d.id},plain(d.data())));}catch(e){}
    const gq=async(k,col,...w)=>{try{const s=await F.getDocs(F.query(fcol(col),...w));n[k]=s.docs.map(d=>Object.assign({id:d.id},plain(d.data())));}catch(e){}};
    await gq('grupos','grupos',F.where('membros.'+uid,'==',true));await gq('duelos_criados','duelos',F.where('a','==',uid));await gq('duelos_recebidos','duelos',F.where('b','==',uid));
    await gq('salas','salas',F.where('dono','==',uid));await gq('sugestoes','sugestoes',F.where('by','==',uid));await gq('relatorios_de_erros','erros',F.where('by','==',uid));
    out.local={cartoes:LS.get('x10-fc',{}),objetivo:LS.get('x11-goal',{}),focoPorDia:LS.get('x11-focus',{}),destaques:LS.get('x12-top',[]),loja:{compradas:LS.get('x12-own',[]),cor:LS.get('x12-skin','lilas'),baus:LS.get('x12-chest',{})}};}
  const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pronex-study-os-meus-dados-'+today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
  logEv('exportou');btn.disabled=false;btn.innerHTML=old;toast('Ficheiro descarregado.');}
async function deleteMine(){const {Au,auth}=FB,F=FB.Fs,u=auth.currentUser;const google=(u.providerData||[]).some(p=>p.providerId==='google.com');D8.busy=true;D8.err='';renderProfile();
  try{if(google)await Au.reauthenticateWithPopup(u,new Au.GoogleAuthProvider());else if(u.email){if(!D8.p){throw{code:'x8/pw'};}await Au.reauthenticateWithCredential(u,Au.EmailAuthProvider.credential(u.email,D8.p));}}
  catch(e){D8.busy=false;D8.err=e.code==='x8/pw'?'Escreve a tua palavra-passe.':(AUTH_ERR[e.code]||'Não foi possível confirmar que és tu.');renderProfile();return;}
  stopSync();try{EVQ=[];clearTimeout(evT);clearInterval(regT);clearTimeout(syncT);hasProfile=false;}catch(e){}syncProfile=()=>{};registerUser=async()=>{};flushEv=async()=>{};logEv=()=>{};
  let FALHAS=0;
  try{const s=await F.getDocs(F.query(fcol('posts'),F.where('uid','==',uid)));for(const d of s.docs){try{const cs=await F.getDocs(fcol('posts/'+d.id+'/coments'));for(const c of cs.docs){try{await F.deleteDoc(c.ref);}catch(x){FALHAS++;}}}catch(x){FALHAS++;}try{await F.deleteDoc(d.ref);}catch(x){FALHAS++;}}}catch(e){FALHAS++;}
  // 1.17.2: sem consultas de grupo (precisavam de índices que não existem): procura canal a canal e publicação a publicação.
  const apagaQ=async(col)=>{try{const s=await F.getDocs(F.query(fcol(col),F.where('uid','==',uid)));for(const d of s.docs){try{await F.deleteDoc(d.ref);}catch(x){FALHAS++;}}}catch(e){}};
  {let gs=[];try{gs=(await F.getDocs(F.query(fcol('grupos'),F.where('membros.'+uid,'==',true)))).docs.map(d=>d.id);}catch(e){}
   for(const c of ['geral','matematica','testes','sugestoes',...gs])await apagaQ('canais/'+c+'/msgs');}
  try{const ps=await F.getDocs(F.query(fcol('posts'),F.orderBy('ts','desc'),F.limit(400)));for(const d of ps.docs)await apagaQ('posts/'+d.id+'/coments');}catch(e){FALHAS++;}
  try{const s=await F.getDocs(fcol('data/users/'+uid));for(const d of s.docs){try{await F.deleteDoc(d.ref);}catch(x){FALHAS++;}}}catch(e){FALHAS++;}
  // 1.12: grupos, salas, duelos, reações, gostos, sugestões e relatórios de erros
  const q1=async(col,...w)=>{try{return(await F.getDocs(F.query(fcol(col),...w))).docs;}catch(e){return[];}};
  for(const d of await q1('grupos',F.where('membros.'+uid,'==',true))){try{if(d.data().dono===uid)await F.updateDoc(d.ref,{apagado:true,membros:{}});else await F.updateDoc(d.ref,{['membros.'+uid]:F.deleteField()});}catch(e){FALHAS++;}}
  for(const d of await q1('salas',F.where('dono','==',uid))){try{await F.deleteDoc(d.ref);}catch(e){FALHAS++;}}
  for(const d of await q1('salas',F.limit(60))){try{if((d.data().membros||{})[uid]!=null)await F.updateDoc(d.ref,{['membros.'+uid]:F.deleteField()});}catch(e){FALHAS++;}}
  for(const k of ['a','b'])for(const d of await q1('duelos',F.where(k,'==',uid))){try{await F.deleteDoc(d.ref);}catch(e){FALHAS++;}}
  for(const d of await q1('posts',F.where('reac.'+uid,'in',['gosto','coracao','riso','uau','fogo']))){try{await F.updateDoc(d.ref,{['reac.'+uid]:F.deleteField()});}catch(e){FALHAS++;}}
  for(const d of await q1('posts',F.where('likes.'+uid,'==',true))){try{await F.updateDoc(d.ref,{['likes.'+uid]:F.deleteField()});}catch(e){FALHAS++;}}
  for(const c of ['sugestoes','erros'])for(const d of await q1(c,F.where('by','==',uid))){try{await F.deleteDoc(d.ref);}catch(e){FALHAS++;}}
  for(const p of ['perfis/'+uid,'utilizadores/'+uid,'consent/'+uid,'premios/'+uid]){try{await F.deleteDoc(fdoc(p));}catch(e){FALHAS++;}}
  try{const fica=await F.getDocs(F.query(fcol('posts'),F.where('uid','==',uid),F.limit(1)));if(!fica.empty)FALHAS++;}catch(e){FALHAS++;}
  if(FALHAS){D8.busy=false;toast('Não foi possível apagar tudo. Verifica a internet e tenta outra vez.');setTimeout(()=>location.reload(),3500);return;}
  try{['x10-fc','x11-goal','x11-calc','x11-focus','x11-lv','x11-msg','x12-top','x12-chest','x12-spent','x12-own','x12-skin','x12-men','x12-du','x12-notop','x21-dw','x21-cores','x21-wsum','x19-dp'].forEach(k=>localStorage.removeItem(k));}catch(e){}
  try{await Au.deleteUser(u);}catch(e){}
  try{(typeof LOCAL_KEYS==='function'?LOCAL_KEYS():[]).forEach(k=>localStorage.removeItem(k));['x8-consent','x8-consent-em','x8-turma','x8-hi','x8-lidas','x8-nt-last','x8-push','x8-vlater'].forEach(k=>localStorage.removeItem(k));localStorage.removeItem(KEY);}catch(e){}
  document.body.insertAdjacentHTML('beforeend','<div class="x8force" style="z-index:99999"><div>'+nex('triste',120)+'<h1>Conta apagada</h1><p>Os teus dados foram apagados. Obrigado por teres estudado connosco.</p><button type="button" class="x8p w" data-recarregar>Fechar</button></div></div>');}

/* ---------- painel: PIN, notificações, turma, versões, auditoria ---------- */
const FV={};const fv=id=>esc(FV[id]||'');
function keepVals(el){el.querySelectorAll('input[id^="x8-"]:not([type=checkbox]),textarea[id^="x8-"],select[id^="x8-"]').forEach(i=>{if(FV[i.id]!=null&&i.tagName==='SELECT')i.value=FV[i.id];i.addEventListener('input',()=>{FV[i.id]=i.value;});i.addEventListener('change',()=>{FV[i.id]=i.value;});});}
const A8={pin:'idle',salt:'',hash:'',audit:null,auditErr:false,sent:null};
const pinOpen=()=>+(SS.get('x8-pin-until')||0)>Date.now();
async function audit(acao,alvo,detalhe){if(!isFB()||!isOwner)return;try{await FB.Fs.addDoc(fcol('audit'),{acao:String(acao).slice(0,60),alvo:String(alvo||'').slice(0,120),detalhe:String(detalhe||'').slice(0,300),por:uid,em:SRV()});}catch(e){}}
async function loadPin(){A8.pin='loading';try{const s=await FB.Fs.getDoc(fdoc('config/admin'));if(s.exists()&&s.data().pinHash){A8.salt=s.data().salt;A8.hash=s.data().pinHash;A8.pin='set';}else A8.pin='none';}catch(e){A8.pin='err';}renderProfile();}
function pinHTML(){
  if(A8.pin==='idle'){setTimeout(loadPin,0);return'<p class="dim">A abrir o painel…</p>';}
  if(A8.pin==='loading')return'<p class="dim">A abrir o painel…</p>';
  const lock=+LS.get('x8-pin-lock',0);
  if(A8.pin==='err')return'<div class="x8lock">'+nex('pensar',90,'x8think')+'<b>PIN ainda não disponível</b><p>A base de dados ainda não tem as regras da versão 1.8. Publica o ficheiro firestore.rules novo na consola do Firebase e volta aqui.</p><button type="button"class="x8p gh sm" id="x8-pin-skip">Entrar sem PIN desta vez</button></div>';
  if(Date.now()<lock)return'<div class="x8lock">'+nex('triste',90)+'<b>Painel bloqueado</b><p>Demasiadas tentativas erradas. Tenta outra vez às '+new Date(lock).toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})+'.</p></div>';
  if(A8.pin==='none')return'<div class="x8lock x8pin"><span class="x8bigi">'+ic('lock',38)+'</span><b>Cria o PIN do painel</b><p>Segunda proteção do painel, além da tua conta Google confirmada. Entre 4 e 8 algarismos. Fica pedido a cada 30 minutos.</p><form id="x8-pin-new" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px"><label class="x8f">PIN<input id="x8-pn1" value="'+fv('x8-pn1')+'" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label><label class="x8f">Repete o PIN<input id="x8-pn2" value="'+fv('x8-pn2')+'" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="new-password"></label><p class="x8err" role="alert"></p><button type="submit"class="x8p l">Guardar PIN</button></form></div>';
  return'<div class="x8lock x8pin"><span class="x8bigi">'+ic('lock',38)+'</span><b>PIN do painel</b><p>Escreve o teu PIN para abrir o painel de controlo.</p><form id="x8-pin-in" style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px"><label class="x8f">PIN<input id="x8-pin" value="'+fv('x8-pin')+'" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="off"></label><p class="x8err" role="alert"></p><button type="submit"class="x8p l">Abrir painel</button></form></div>';}
function bindPin(el){keepVals(el);
  const sk=el.querySelector('#x8-pin-skip');if(sk)sk.onclick=()=>{SS.set('x8-pin-until',Date.now()+30*60e3);renderProfile();};
  const fn=el.querySelector('#x8-pin-new');if(fn){fn.querySelector('#x8-pn1').focus();fn.onsubmit=async e=>{e.preventDefault();const a=fn.querySelector('#x8-pn1').value,b=fn.querySelector('#x8-pn2').value,er=fn.querySelector('.x8err');
    if(!/^[0-9]{4,8}$/.test(a)){er.textContent='O PIN tem de ter entre 4 e 8 algarismos.';return;}if(a!==b){er.textContent='Os dois PIN não são iguais.';return;}
    const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');const hash=await sha(salt+':'+a);
    try{await FB.Fs.setDoc(fdoc('config/admin'),{pinHash:hash,salt,atualizado:Date.now()});A8.salt=salt;A8.hash=hash;delete FV['x8-pn1'];delete FV['x8-pn2'];A8.pin='set';SS.set('x8-pin-until',Date.now()+30*60e3);audit('pin_criado','painel','');toast('PIN guardado.');renderProfile();}
    catch(x){er.textContent='Não foi possível guardar (as regras novas já foram publicadas?).';}};}
  const fi=el.querySelector('#x8-pin-in');if(fi){fi.querySelector('#x8-pin').focus();fi.onsubmit=async e=>{e.preventDefault();const v=fi.querySelector('#x8-pin').value,er=fi.querySelector('.x8err');
    if(await sha(A8.salt+':'+v)===A8.hash){delete FV['x8-pin'];LS.del('x8-pin-fails');SS.set('x8-pin-until',Date.now()+30*60e3);audit('painel_entrada','painel',devInfo().tipo+' · '+devInfo().so);renderProfile();}
    else{delete FV['x8-pin'];const n=(+LS.get('x8-pin-fails',0))+1;LS.set('x8-pin-fails',n);fi.querySelector('#x8-pin').value='';fi.querySelector('#x8-pin').setAttribute('aria-invalid','true');
      if(n>=5){LS.set('x8-pin-lock',Date.now()+5*60e3);LS.del('x8-pin-fails');audit('pin_bloqueado','painel','5 tentativas erradas');renderProfile();}
      else er.textContent='PIN errado. Restam '+(5-n)+' tentativa'+(5-n>1?'s':'')+'.';}};}}
async function loadAudit(){try{const F=FB.Fs;const s=await F.getDocs(F.query(fcol('audit'),F.orderBy('em','desc'),F.limit(30)));A8.audit=s.docs.map(d=>d.data());}catch(e){A8.audit=[];A8.auditErr=true;}
  try{const F=FB.Fs;const s=await F.getDocs(F.query(fcol('notifs'),F.where('por','==',uid),F.limit(20)));A8.sent=s.docs.map(d=>Object.assign({id:d.id},d.data())).sort((a,b)=>tsOf(b.criadoEm)-tsOf(a.criadoEm));}catch(e){A8.sent=[];}
  if(view==='profile'&&profTab==='adm')renderProfile();}
function adminExtraHTML(){if(A8.audit===null){A8.audit=undefined;setTimeout(loadAudit,0);}
  const U=(ADM&&ADM.users)||[];const vers={};U.forEach(u=>{const v=u.versao||'?';vers[v]=(vers[v]||0)+1;});
  const nowV=U.filter(u=>u.versao===APP_VERSION).length;
  let h='<div class="x8card"><div class="x8sh"><h2>Enviar notificação</h2><button type="button"class="x8lk" id="x8-a-lock" style="font-size:14px">'+ic('lock',16)+' Bloquear painel</button></div><form id="x8-a-nt" style="display:flex;flex-direction:column;gap:10px">'+
    '<label class="x8f">Título<input id="x8-a-t" value="'+fv('x8-a-t')+'" maxlength="80" required placeholder="Ex.: Teste de Matemática na sexta"></label><label class="x8f">Mensagem<textarea id="x8-a-x" maxlength="300" required placeholder="Até 300 caracteres">'+fv('x8-a-x')+'</textarea></label>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="x8f">Para<select id="x8-a-a"><option value="todos">Todos</option>'+U.filter(u=>!u.anon).map(u=>'<option value="'+esc(u.id)+'">'+esc((PERFIS[u.id]||{}).nick||u.nick||u.email||u.id)+'</option>').join('')+'</select></label><label class="x8f">Tipo<select id="x8-a-k"><option value="aviso">Aviso</option><option value="turma">Turma</option><option value="versao">Versão nova</option></select></label></div>'+
    '<button type="submit"class="x8p l sm" style="align-self:flex-start">'+ic('send',18)+'Enviar</button></form>'+
    (A8.sent&&A8.sent.length?'<div class="x8sec">ENVIADAS</div>'+A8.sent.slice(0,6).map(n=>'<div class="x8log"><time>'+esc(ago(tsOf(n.criadoEm)))+'</time><span><b>'+esc(n.titulo)+'</b> · '+esc(n.alvo==='todos'?'todos':((PERFIS[n.alvo]||{}).nick||'1 aluno'))+'</span><button type="button"class="x8lk" data-ntdel="'+esc(n.id)+'" style="font-size:13px;padding:0">Apagar</button></div>').join(''):'')+'</div>';
  h+='<div class="x8card"><h2>Acesso da turma</h2><p>'+(CFG.turmaHash?'O código da turma está <b style="color:var(--x8-green)">ativo</b>: quem entra pela primeira vez tem de o escrever.':'Sem código: qualquer pessoa com o link pode criar conta.')+'</p><form id="x8-a-turma" class="x8btns" style="align-items:flex-end"><label class="x8f" style="flex:1;min-width:160px">Novo código (6 letras ou números)<input id="x8-a-c" value="'+fv('x8-a-c')+'" maxlength="6" autocapitalize="characters" autocomplete="off" style="text-transform:uppercase"></label><button type="submit"class="x8p l sm">Guardar código</button>'+(CFG.turmaHash?'<button type="button" class="x8p gh sm" id="x8-a-coff">Desligar</button>':'')+'</form></div>';
  h+='<div class="x8card"><h2>Versões nos dispositivos</h2><p>'+nowV+' de '+U.length+' alunos já estão na '+esc(APP_VERSION)+'. '+Object.entries(vers).sort((a,b)=>cmpVer(b[0],a[0])).map(([v,n])=>esc(v)+': '+n).join(' · ')+'</p><form id="x8-a-min" class="x8btns" style="align-items:flex-end"><label class="x8f" style="flex:1;min-width:160px">Versão mínima obrigatória<input id="x8-a-v" maxlength="12" placeholder="'+esc(APP_VERSION)+'" value="'+esc(CFG.minVersion||'')+'"></label><button type="submit"class="x8p l sm">Guardar</button></form><p style="font-size:13px">Quem estiver abaixo desta versão vê um ecrã a pedir para atualizar. Deixa vazio para desligar.</p></div>';
  h+='<div class="x8card"><h2>Registo de auditoria</h2>'+(A8.audit===undefined?'<p>A carregar…</p>':A8.auditErr?'<p>O registo fica disponível depois de publicares as regras novas.</p>':!A8.audit.length?'<p>Ainda sem ações registadas.</p>':'<div>'+A8.audit.map(a=>'<div class="x8log"><time>'+esc(new Date(tsOf(a.em)).toLocaleString('pt-PT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}))+'</time><span>'+esc(AUD[a.acao]||a.acao)+(a.alvo?' · '+esc(a.alvo):'')+'</span><em>'+esc(a.detalhe||'')+'</em></div>').join('')+'</div>')+'</div>';
  return h;}
const AUD={suspensao:'Conta suspensa',suspensao_levantada:'Suspensão levantada',pin_criado:'PIN do painel criado',painel_entrada:'Entrada no painel',pin_bloqueado:'Painel bloqueado por tentativas',notif_enviada:'Notificação enviada',notif_apagada:'Notificação apagada',turma_codigo:'Código da turma alterado',turma_off:'Código da turma desligado',versao_min:'Versão mínima alterada',conteudo_apagado:'Conteúdo apagado',denuncia_mantida:'Denúncia arquivada',reposicao:'Reposição de contas',chave_ia:'Chave do tutor alterada'};
function bindAdminExtra(el){const F=FB&&FB.Fs;if(!F)return;keepVals(el);
  const lk=el.querySelector('#x8-a-lock');if(lk)lk.onclick=()=>{SS.del('x8-pin-until');renderProfile();};
  const fn=el.querySelector('#x8-a-nt');if(fn)fn.onsubmit=async e=>{e.preventDefault();const t=fn.querySelector('#x8-a-t').value.trim(),x=fn.querySelector('#x8-a-x').value.trim(),a=fn.querySelector('#x8-a-a').value,k=fn.querySelector('#x8-a-k').value;if(!t||!x){toast('Escreve o título e a mensagem.');return;}
    const b=fn.querySelector('button');b.disabled=true;try{await F.addDoc(fcol('notifs'),{titulo:t.slice(0,80),texto:x.slice(0,300),alvo:a,tipo:k,criadoEm:SRV(),por:uid});audit('notif_enviada',a==='todos'?'todos':((PERFIS[a]||{}).nick||a),t);toast('Notificação enviada.');fn.reset();delete FV['x8-a-t'];delete FV['x8-a-x'];A8.audit=null;renderProfile();}catch(x){toast('Não foi possível enviar (as regras novas já foram publicadas?).');}b.disabled=false;};
  el.querySelectorAll('[data-ntdel]').forEach(b=>b.onclick=async()=>{try{await F.deleteDoc(fdoc('notifs/'+b.dataset.ntdel));audit('notif_apagada',b.dataset.ntdel,'');A8.audit=null;renderProfile();}catch(e){toast('Não foi possível apagar.');}});
  const ft=el.querySelector('#x8-a-turma');if(ft)ft.onsubmit=async e=>{e.preventDefault();const c=ft.querySelector('#x8-a-c').value.trim().toUpperCase();if(!/^[0-9A-Z]{6}$/.test(c)){toast('O código tem de ter 6 letras ou números.');return;}
    try{const h=await sha('pronex-turma:'+c);await F.setDoc(fdoc('config/app'),{turmaHash:h},{merge:true});CFG.turmaHash=h;LS.set('x8-turma',h);audit('turma_codigo','turma','');delete FV['x8-a-c'];toast('Código guardado. Diz o código à turma: '+c);A8.audit=null;renderProfile();}catch(x){toast('Não foi possível guardar.');}};
  const co=el.querySelector('#x8-a-coff');if(co)co.onclick=async()=>{try{await F.setDoc(fdoc('config/app'),{turmaHash:''},{merge:true});CFG.turmaHash='';audit('turma_off','turma','');A8.audit=null;renderProfile();}catch(x){toast('Não foi possível desligar.');}};
  const fm=el.querySelector('#x8-a-min');if(fm)fm.onsubmit=async e=>{e.preventDefault();const v=fm.querySelector('#x8-a-v').value.trim();if(v&&!/^\d+\.\d+\.\d+$/.test(v)){toast('Escreve uma versão com três números, como 1.8.2.');return;}if(v&&cmpVer(v,APP_VERSION)>0){toast('Não podes exigir uma versão acima da atual ('+APP_VERSION+').');return;}
    try{await F.setDoc(fdoc('config/app'),{minVersion:v},{merge:true});CFG.minVersion=v;audit('versao_min',v||'desligada','');toast(v?'Versão mínima: '+v:'Versão mínima desligada.');A8.audit=null;renderProfile();}catch(x){toast('Não foi possível guardar.');}};
  el.querySelectorAll('[data-rdel]').forEach(b=>b.addEventListener('click',()=>audit('conteudo_apagado',b.dataset.rdel,'denúncia')));
  el.querySelectorAll('[data-rok]').forEach(b=>b.addEventListener('click',()=>audit('denuncia_mantida',b.dataset.rok,'')));}

/* ---------- comunidade e tutor só com email confirmado ---------- */
function verifyLockHTML(){return'<div class="x8lock" style="margin-top:14px">'+nex('incentivar',100,'x8idle')+'<b>Confirma o teu email primeiro</b><p>Por segurança, o mural, a conversa e o ranking só abrem depois de confirmares o email '+esc(fbUser.email)+'. Abre o link que te enviámos (vê também o spam).</p><div class="x8btns" style="justify-content:center"><button type="button"class="x8p w sm" id="x8-cv-ok">Já confirmei</button><button type="button"class="x8p gh sm" id="x8-cv-re">Reenviar email</button><button type="button"class="x8p gh sm" id="x8-cv-ai">Falar com o tutor</button></div></div>';}
function bindVerifyLock(el){const ai=el.querySelector('#x8-cv-ai');if(ai)ai.onclick=()=>{commTab='ai';renderComm();};const ok=el.querySelector('#x8-cv-ok');if(ok)ok.onclick=async()=>{try{await FB.auth.currentUser.reload();await FB.auth.currentUser.getIdToken(true);}catch(e){}onUserUpdate();if(!needVerify())toast('Email confirmado.');else toast('Ainda não está confirmado.');refresh();};
  const re=el.querySelector('#x8-cv-re');if(re)re.onclick=async()=>{try{await FB.Au.sendEmailVerification(FB.auth.currentUser);toast('Enviámos outro email.');}catch(e){toast('Espera um pouco antes de pedir outro.');}};}

const MOTIVOS=[['ofensivo','Linguagem ofensiva ou insultos'],['assedio','Assédio ou bullying'],['dados_pessoais','Partilha dados pessoais'],['improprio','Conteúdo impróprio'],['spam','Spam ou publicidade'],['outro','Outro motivo']];
const AJUDA26='<div class="x26help"><b>Precisas de ajuda?</b><span>Se alguém te está a incomodar, fala com o teu diretor de turma ou com alguém de confiança. Também podes ligar, de graça: Linha Internet Segura <a href="tel:800219090">800 21 90 90</a> · SOS Criança <a href="tel:116111">116 111</a>.</span></div>';
function motivo(){return new Promise(res=>{closeSheet8();const bg=document.createElement('div');bg.className='x8sheet-bg';const sh=document.createElement('div');sh.className='x8sheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Denunciar');
  sh.innerHTML='<span class="grab"></span><div class="x8sh"><h2>Porque estás a denunciar?</h2></div><p class="x8sub" style="font-size:14px;margin-bottom:10px">O administrador vai rever. Quem publicou não fica a saber que foste tu.</p><div style="display:flex;flex-direction:column;gap:8px">'+MOTIVOS.map(([k,t])=>'<button type="button"class="x8p gh sm" style="justify-content:flex-start" data-mt="'+k+'">'+t+'</button>').join('')+'</div>'+AJUDA26+'<button type="button"class="x8lk" id="x8-mt-no" style="margin-top:8px">Cancelar</button>';
  document.body.appendChild(bg);document.body.appendChild(sh);const done=v=>{closeSheet8();res(v);};bg.onclick=()=>done(null);sh.querySelector('#x8-mt-no').onclick=()=>done(null);sh.querySelectorAll('[data-mt]').forEach(b=>b.onclick=()=>done(b.dataset.mt));sh.querySelector('[data-mt]').focus();});}
return{motivo,gate,settingsHTML,bindSettings,pinOpen,pinHTML,bindPin,adminExtraHTML,bindAdminExtra,bellHTML,renderBell,openNotifs,nex,needVerify,verifyLockHTML,bindVerifyLock,confetti,audit,loadCfg};
})();

/* ---------- escrita com carimbo de ritmo e perfil com limites (regras v2) ---------- */
let MYP=undefined;
/* Antes de publicar: nada de insultos fortes nem de dados de contacto (a comunidade tem menores). */
const FILTRO_INSULTOS=/(^|[^a-zà-ÿ])(caralho|foda-se|fodasse|filh[oa] da puta|puta|cabr[ãa]o|paneleiro|panasca|atrasad[oa] mental|vai-te foder|vai te foder)($|[^a-zà-ÿ])/i;
function pareceContacto(t){t=String(t||'');
  if(/[\w.+-]+\s*@\s*[\w-]+\s*\.\s*[a-z]{2,}/i.test(t)||/(instagram|insta|snap|snapchat|tiktok|whatsapp|telegram)\s*[:@]?\s*@?[\w.]{3,}/i.test(t))return true;
  if(/\b(votos?|eleitores|inscritos|habitantes|euros?|lugares)\b|€/i.test(t))return false;
  const s=t.replace(/(\d)[\s.\-](?=\d)/g,'$1');
  return /(^|[^\d,.])(00351|\+?351)?(9[1236]|2\d)\d{7}(?![\d]|,\d)/.test(s);}
function filtroPublicacao(t){return FILTRO_INSULTOS.test(String(t||''))?'Reformula sem insultos: a comunidade é para todos.':'';}
function confirmarContacto(){return new Promise(res=>{const bg=document.createElement('div');bg.className='x8sheet-bg';const sh=document.createElement('div');sh.className='x8sheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Confirmar publicação');sh.innerHTML='<span class="grab"></span><div class="x8sh"><h2>Isto parece um contacto</h2></div><p class="x8sub" style="font-size:15px">Um telefone, um email ou uma rede social ficam à vista de todos. Tens a certeza de que queres publicar?</p><div class="x8btns"><button type="button"class="x8p w sm" id="x17-cont-no">Voltar e rever</button><button type="button"class="x8p gh sm" id="x17-cont-sim">Publicar na mesma</button></div>';document.body.appendChild(bg);document.body.appendChild(sh);const fim=v=>{sh.remove();bg.remove();res(v);};bg.onclick=()=>fim(false);sh.querySelector('#x17-cont-no').onclick=()=>fim(false);sh.querySelector('#x17-cont-sim').onclick=()=>fim(true);sh.querySelector('#x17-cont-no').focus();});}
/* 1.39: explica porque é que uma ação falhou, pela causa real (sem internet, email por confirmar, conta suspensa,
   servidor sem resposta), em vez de «espera uns segundos» para tudo. O que não tem explicação vai para os relatórios de erros. */
function explicarFalha(e,base){const c=(e&&e.code)||'';base=base||'Não foi possível.';
  if(c==='x-filtro')return e.message;
  if(typeof navigator!=='undefined'&&navigator.onLine===false)return'Estás sem internet. Tenta outra vez quando a ligação voltar.';
  if(c==='permission-denied'){
    if(typeof isAnon==='function'&&isAnon())return'Para isto precisas de uma conta. Cria-a em Perfil → Definições.';
    if(X8.needVerify())return'Primeiro confirma o teu email: abre o link que te enviámos (vê também o spam). Podes pedir outro em Perfil → Definições.';
    if(SUSPENSA)return'A tua conta está suspensa'+(SUSPENSA.ate?' até '+new Date(SUSPENSA.ate).toLocaleDateString('pt-PT'):'')+(SUSPENSA.motivo?': '+SUSPENSA.motivo:'')+'.';
    verSuspensao();
    if(typeof X12!=='undefined'&&X12.relatar)X12.relatar('recusa: '+base,e&&e.stack,'recusa');
    return base+' O servidor recusou. Se voltar a acontecer, reporta em Perfil → Definições → Sugestões e problemas.';}
  if(c==='unavailable'||c==='deadline-exceeded')return'O servidor não respondeu. Verifica a internet e tenta outra vez.';
  if(c==='resource-exhausted')return'Há muita gente a usar a app agora. Tenta daqui a um minuto.';
  if(typeof X12!=='undefined'&&X12.relatar)X12.relatar('falha: '+(c||(e&&e.message)||'erro'),e&&e.stack,'tratado');
  return base+' Tenta outra vez.';}
function motivoRecusa(base){return explicarFalha({code:'permission-denied'},String(base||'').replace(/ ?Espera uns segundos e tenta outra vez\.?/,''));}
/* 1.39: o servidor só aceita um envio de cada tipo a cada 10 s (mensagens: 3 s; regras sem transição desde 25 nov 2026).
   A app espera o que falta e envia sozinha, em vez de deixar o servidor recusar. */
const RITMO_S={ultimoPost:10,ultimaMsg:3,ultimoAviso:2},RITMO_T={};
function addRitmo(colPath,data,campo){const ePub=/^(posts|canais\/)/.test(colPath);const fm=ePub?filtroPublicacao(data.text):'';if(fm){const e=new Error(fm);e.code='x-filtro';return Promise.reject(e);}
  if(ePub&&pareceContacto(data.text)&&!data.__contactoOk)return confirmarContacto().then(sim=>{if(!sim){const e=new Error('Não foi publicado. Podes rever e tentar outra vez.');e.code='x-filtro';throw e;}return addRitmoEscrita(colPath,data,campo);});
  return addRitmoEscrita(colPath,data,campo);}
function addRitmoEscrita(colPath,data,campo){
  // Se o envio anterior do mesmo tipo foi há menos tempo do que o servidor aceita, espera o que falta e envia sozinho.
  const espera=(RITMO_T[campo]||0)+(RITMO_S[campo]||0)*1000+600-Date.now();
  // Se mesmo assim o servidor recusar (app recarregada, envio noutro dispositivo, conta acabada de criar), espera o intervalo e tenta uma vez mais.
  const enviar=(tentativa)=>{RITMO_T[campo]=Date.now();const F=FB.Fs,b=F.writeBatch(FB.fs),ref=F.doc(fcol(colPath));b.set(ref,data);b.set(fdoc('utilizadores/'+uid),{[campo]:F.serverTimestamp()},{merge:true});
    return b.commit().then(()=>{RITMO_T[campo]=Date.now();return ref;}).catch(e=>{
      if(!tentativa&&e&&e.code==='permission-denied'&&RITMO_S[campo]&&!X8.needVerify()&&!SUSPENSA&&!(typeof isAnon==='function'&&isAnon())){const w=RITMO_S[campo]*1000+600;
        if(w>1500)toast('Vai ser enviado daqui a '+Math.ceil(w/1000)+' s: o servidor aceita um envio de cada vez.');return new Promise(r=>setTimeout(r,w)).then(()=>enviar(1));}
      throw e;});};
  if(espera>0){if(espera>1500)toast('Vai ser enviado daqui a '+Math.ceil(espera/1000)+' s: o servidor aceita um envio de cada vez.');RITMO_T[campo]=Date.now()+espera;return new Promise(r=>setTimeout(r,espera)).then(enviar);}
  return enviar();}
function syncProfile(){if(BACKEND!=='firebase'||!FB)return syncProfileOld();saveMeLocal();if(!db||!uid||!hasProfile)return;clearTimeout(syncT);syncT=setTimeout(()=>{
  if(MYP===undefined)return;
  // 1.16: só envia depois de ler o histórico do servidor (um dispositivo desatualizado nunca baixa os pontos)
  if(typeof HISTSRV!=='undefined'&&!HISTSRV&&!(typeof SYNCWAIT!=='undefined'&&Date.now()-SYNCWAIT>20000)){setTimeout(()=>{lastSync='';syncProfile();},3000);return;}
  const F=FB.Fs,S=stats(),cur=MYP,utc=d=>d.toISOString().slice(0,10),now=new Date();
  const xp0=cur?(cur.xp|0):0;
  const novoDia=!cur||!('xpIniEm' in cur)||(cur.xpIniEm!==null&&utc(cur.xpIniEm.toDate())!==utc(now));
  const base=novoDia?xp0:(cur.xpIni|0);
  // O XP nunca desce. A subir: no máximo +250 por escrita e +5000 por dia (o resto vai nas escritas seguintes)
  let xp=isOwner?Math.max(xp0,S.xp):Math.max(xp0,Math.min(S.xp,xp0+250,base+5000));
  if(!cur&&!isOwner)xp=Math.min(S.xp,250);
  let wk=weekId(Date.now());const dx=xp-xp0;
  // 1.19: a semana nunca anda para trás (outro dispositivo ou fuso ainda no domingo não apaga a semana nova)
  const atrasado=!!(cur&&cur.wk&&cur.wk>wk);if(atrasado)wk=cur.wk;
  // XP da semana: o maior entre o que já estava no ranking e o que este dispositivo conta (nunca desce dentro da semana)
  const wxp0=cur&&cur.wk===wk?(cur.wxp|0):0;const wLocal=atrasado?0:weekXP();let wxp=Math.max(wxp0,wLocal);wxp=Math.max(0,Math.min(wxp,xp,wxp0+250));const faltaSemana=wxp<Math.min(wLocal,xp);
  const s0=cur?(cur.streak|0):0;let streak=S.streak,stEm=false;
  if(streak>s0){const e=cur&&cur.streakEm;const outro=!cur||!('streakEm' in cur)||(e!==null&&(utc(e.toDate())!==utc(now)||utc(new Date(e.toMillis()+36e5))!==utc(new Date(now.getTime()+36e5))));
    if(outro){streak=s0+1;stEm=true;}else streak=s0;}
  const body={nick:ME.nick.slice(0,30),curso:(ME.curso||'').slice(0,40),escola:ME.escolaPub?(ME.escola||'').slice(0,60):'',bio:(ME.bio||'').slice(0,160),foto:safeImg(ME.foto)||'',cor:(ME.cor|0)%6,goal:ME.goal|0,ranking:!!ME.ranking,ai:ME.ai|0,sent:!!ME.sent,
    xp,wxp,wk,nivel:levelOf(xp).n,streak,total:Math.min(S.total,(cur?(cur.total|0):0)+400),certos:0,badges:S.badges};
  // 1.19: ao mudar de semana, guarda a semana anterior para as ligas a fecharem mesmo que já se tenha estudado na nova
  if(cur&&cur.wk&&cur.wk<wk){body.pwk=cur.wk;body.pwxp=cur.wxp|0;}
  body.certos=Math.min(S.ok,(cur?(cur.certos|0):0)+400,body.total);
  let faltaMes=body.total<S.total;
  if(typeof X16!=='undefined'){let mk=X16.monthId();const mAtr=!!(cur&&cur.mk&&cur.mk>mk);if(mAtr)mk=cur.mk;const real=mAtr?0:X16.month(mk);body.mk=mk;const mxp0=cur&&cur.mk===mk?(cur.mxp|0):0;body.mxp=Math.max(0,Math.min(xp,mxp0+250,Math.max(mxp0,real)));if(body.mxp<Math.min(real,xp))faltaMes=true;const tx=X16.tema(),lim=S.total*15;Object.keys(tx).forEach(k=>tx[k]=Math.min(tx[k],lim,xp));body.tx=tx;}
  const sig=JSON.stringify(Object.assign({},body,{upd:0}));if(sig===lastSync)return;lastSync=sig;
  if(novoDia){body.xpIni=cur?xp0:0;body.xpIniEm=F.serverTimestamp();}
  if(stEm)body.streakEm=F.serverTimestamp();
  try{const t=JSON.parse(localStorage.getItem('x12-top')||'[]');const nt=+localStorage.getItem('x12-notop')||0;if(Array.isArray(t)&&t.length&&Date.now()-nt>864e5)body.top=t.slice(0,3).map(String);}catch(e){}
  const put=b=>F.setDoc(fdoc('perfis/'+uid),b,{merge:true});
  // 1.19: em falta? volta a enviar (no máximo 40 vezes seguidas). Recusa? tenta sem os destaques; nunca baixa o XP da semana nem do mês.
  const again=()=>{SYNC_N=(SYNC_N||0)+1;if(SYNC_N<=40)setTimeout(()=>{lastSync='';syncProfile();},2500);};
  const ok=()=>{window.SYNC_ERR='';if((xp<S.xp&&xp>xp0)||faltaSemana||faltaMes)again();else SYNC_N=0;};
  put(body).then(ok).catch(e=>{const c=e&&e.code||'erro';
    // 1.25: se as regras do servidor ainda não aceitam o XP por disciplina, envia só o dos temas antigos
    const lg=['Eleições','Partilha','Finanças'],txx=body.tx&&Object.keys(body.tx).some(k=>!lg.includes(k));
    // 1.36: primeiro tenta só sem as disciplinas novas (regras ainda por publicar); só depois cai para os temas antigos
    const NOV=['Psicologia','História da Cultura e das Artes'];
    if(c==='permission-denied'&&body.tx&&NOV.some(k=>k in body.tx)){const b2=Object.assign({},body,{tx:Object.assign({},body.tx)});NOV.forEach(k=>delete b2.tx[k]);put(b2).then(ok).catch(x=>{if(x&&x.code==='permission-denied'&&(b2.top||b2.tx)){if(b2.top)delete b2.top;const o={};lg.forEach(k=>{if(b2.tx[k])o[k]=b2.tx[k];});b2.tx=o;put(b2).then(ok).catch(y=>{window.SYNC_ERR=(y&&y.code)||'erro';lastSync='';});}else{window.SYNC_ERR=(x&&x.code)||'erro';lastSync='';}});}
    else if(c==='permission-denied'&&(body.top||txx)){if(body.top){try{localStorage.setItem('x12-notop',String(Date.now()));}catch(_){}delete body.top;}if(txx){const o={};lg.forEach(k=>{if(body.tx[k])o[k]=body.tx[k];});body.tx=o;}put(body).then(ok).catch(x=>{window.SYNC_ERR=(x&&x.code)||'erro';lastSync='';});}
    else{window.SYNC_ERR=c;lastSync='';}});},1200);}
let SYNC_N=0;

/* ---------- ligações à app existente ---------- */
const X8ic=n=>'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',chev:'<path d="M9 6l6 6-6 6"/>',quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01"/>',alert:'<path d="M12 3l9 16H3zM12 10v4M12 17h.01"/>',repeat:'<path d="M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3"/>',cards:'<rect x="3" y="6" width="13" height="15" rx="2"/><path d="M8 3h11a2 2 0 012 2v12"/>'}[n]||'')+'</svg>';
const NEX8=(pose,size)=>X8.nex(pose,size,pose==='normal'||pose==='incentivar'?'x8idle':pose==='dormir'?'x8sleep':pose==='pensar'?'x8think':'');
/* Animações do Nex feitas no After Effects (Lottie). Carregam só quando aparecem; se falharem fica o desenho normal. */
const LOT8=(()=>{const BOX={repouso:{l:-7.87,t:-7.66,w:115.74,h:112.6,loop:true},festejar:{l:-19.44,t:-33.56,w:138.89,h:135.14,loop:false}};
  let lib=null;const data={},live=[];let q=0;
  const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('x11rm');}catch(e){return false;}};
  function loadLib(){if(window.lottie)return Promise.resolve(window.lottie);if(lib)return lib;lib=new Promise((ok,no)=>{const sc=document.createElement('script');sc.src='./anim/lottie_light.min.js';sc.async=true;sc.onload=()=>window.lottie?ok(window.lottie):no(new Error('lottie'));sc.onerror=no;document.head.appendChild(sc);});lib.catch(()=>{lib=null;});return lib;}
  function loadData(n){if(!data[n]){data[n]=fetch('./anim/nex-'+n+'.json').then(r=>{if(!r.ok)throw new Error(r.status);return r.json();});data[n].catch(()=>{delete data[n];});}return data[n];}
  const c3=h=>{h=h.replace('#','');return[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);};
  function skinJSON(t){try{const r=document.documentElement.style,b=r.getPropertyValue('--nex-b').trim(),l=r.getPropertyValue('--nex-l').trim();if(!b||!document.body.classList.contains('x12skin'))return t;
    const sw=(from,to)=>{const f=c3(from),g=c3(to);return t.split(JSON.stringify(f).slice(1,-1)).join(JSON.stringify(g).slice(1,-1));};t=sw('#9178E6',b);t=sw('#B3A2FF',l);return t;}catch(e){return t;}}
  function up(el){const n=el.dataset.lot,b=BOX[n];if(!b)return;el.dataset.lk='1';
    Promise.all([loadLib(),loadData(n)]).then(([L,d])=>{if(!el.isConnected)return;const c=document.createElement('div');c.className='x8lot';c.setAttribute('aria-hidden','true');c.style.cssText='left:'+b.l+'%;top:'+b.t+'%;width:'+b.w+'%;height:'+b.h+'%';el.appendChild(c);
      const a=L.loadAnimation({container:c,renderer:'svg',loop:b.loop,autoplay:true,animationData:JSON.parse(skinJSON(JSON.stringify(d))),rendererSettings:{preserveAspectRatio:'xMidYMid meet'}});
      a.addEventListener('DOMLoaded',()=>{el.classList.add('x8lotok');el.classList.remove('x8idle','x8jump');});live.push({el,a});}).catch(()=>{});}
  function scan(){q=0;for(let k=live.length-1;k>=0;k--)if(!live[k].el.isConnected){try{live[k].a.destroy();}catch(e){}live.splice(k,1);}
    if(reduced())return;document.querySelectorAll('.x8nex[data-lot]:not([data-lk])').forEach(up);}
  function start(){scan();try{new MutationObserver(()=>{if(!q)q=requestAnimationFrame(scan);}).observe(document.body,{childList:true,subtree:true});}catch(e){}}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start);
  return{scan,count:()=>live.length};})();
onboarding=function(){X8.gate();};
{const _rc=renderChrome;renderChrome=function(){_rc();const ts=document.getElementById('topstats');if(ts){ts.insertAdjacentHTML('beforeend','<button type="button"class="x8bell x26find" aria-label="Pesquisar" title="Pesquisar"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg></button>');ts.insertAdjacentHTML('beforeend',X8.bellHTML());const fb=ts.querySelector('.x26find');if(fb)fb.onclick=()=>{try{X11.tool('find');}catch(e){}};}const sc=document.getElementById('sidecard');if(sc){const r=sc.querySelector('div');if(r)r.insertAdjacentHTML('beforeend','<span style="margin-left:auto">'+X8.bellHTML()+'</span>');}X8.renderBell();};}
{const _ah=adminHTML;adminHTML=function(){if(!isOwner||!isFB())return _ah();if(!X8.pinOpen())return X8.pinHTML();return X8.adminExtraHTML()+_ah();};
 const _ba=bindAdmin;bindAdmin=function(el){if(isOwner&&isFB()&&!X8.pinOpen()){X8.bindPin(el);return;}_ba(el);X8.bindAdminExtra(el);};}
{const _rc=renderComm;renderComm=function(){if(SUSPENSA&&commTab!=='ai'&&commTab!=='rank'){const el=document.getElementById('v-comm');el.innerHTML='<div class="pagehead compact"><div class="eyebrow">Comunidade</div><h1>Estuda com a turma</h1></div>'+suspensaoHTML();el.querySelectorAll('[data-x17tab]').forEach(b=>b.onclick=()=>{commTab=b.dataset.x17tab;renderComm();});return;}if(X8.needVerify()&&commTab!=='ai'){const el=document.getElementById('v-comm');el.innerHTML='<div class="pagehead compact"><div class="eyebrow">Comunidade</div><h1>Estuda com a turma</h1></div>'+X8.verifyLockHTML();X8.bindVerifyLock(el);return;}return _rc();};}
{const _eh=emptyHTML;emptyHTML=function(icon,title,text,btn){const bad=/liga|erro|servidor|internet/i.test(String(title));return'<div class="estate">'+NEX8(bad?'triste':'dormir',96)+'<b>'+title+'</b><p>'+text+'</p>'+(btn||'')+'</div>';};}
{const _cg=celebrateGoal;celebrateGoal=function(){const r=_cg.apply(this,arguments);setTimeout(()=>{const f=document.querySelector('.celeb .cflame');if(f){f.innerHTML=NEX8('chama',130);f.classList.add('x8jump');f.style.background='none';f.style.boxShadow='none';f.style.width='auto';f.style.height='auto';}X8.confetti(50);},30);return r;};}

/* ---------- Início v1.8 (um foco por ecrã, cartões coloridos, Nex) ---------- */
renderHome=function(){
  const S=stats(),goal=ME.goal||15,sess=st.sess,cont=sess&&sess.list.some(([t,n])=>st.ans[K(t,n)]===undefined);
  const tday=HIST.find(d=>d.date===today()),todayItems=(tday||{items:[]}).items,M=missionsFor(todayItems,(tday&&tday.goal)||goal),DUE=reviewDue(),W=weekData(),wmax=Math.max(goal,...W.map(w=>w.n));
  const hr=new Date().getHours(),sal=hr<6?'Boa noite':hr<12?'Bom dia':hr<20?'Boa tarde':'Boa noite';const done=S.today>=goal,falta=Math.max(0,goal-S.today);
  const td=testDays(),weak=weakTypes(6).length;
  const pose=done?'festejar':S.today===0&&hr>=20?'dormir':'incentivar';
  let h=installCardHTML()+'<div class="x8home">';
  h+='<h1 class="hi full">'+sal+(ME.nick?', '+esc(ME.nick.split(' ')[0]):'')+'</h1>';
  h+='<div style="display:flex;flex-direction:column;gap:14px"><div class="x8goalc'+(done?' done':'')+'"><div style="min-width:0"><span class="gl">Objetivo de hoje</span><b class="gn">'+S.today+'<small>/'+goal+'</small></b><div class="gb"><i style="width:'+Math.min(100,Math.round(S.today/goal*100))+'%"></i></div><span class="gs">'+(done?'Cumprido! O que fizeres agora é extra.':'Falta'+(falta>1?'m ':' ')+falta+' exercício'+(falta>1?'s':''))+'</span></div>'+NEX8(pose,104)+'</div>';
  /* 1.25: o botão principal continua a disciplina que estudaste por último (antes abria sempre a Matemática) */
  const lastA=S.total?lastArea():null,lastD=lastA&&window.XD?XD.DISC.find(x=>x.n===lastA):null;
  h+='<button type="button"class="x8p w" id="h8-go">'+(cont?'Continuar: '+esc(sess.title):!S.total?'Escolher o que estudar':'Continuar: '+esc(lastA))+'</button>';
  h+=td!==null?'<button type="button"class="x8tst" id="h8-tst">'+X8ic('cal')+'<div><b>'+(td===0?'Teste hoje':td===1?'Teste amanhã':'Teste em '+td+' dias')+'</b><span>Matemática · '+(td<=1?'faz uma revisão dos pontos fracos':'faz uma simulação')+'</span></div>'+X8ic('chev')+'</button>'
    :'<button type="button"class="x8tst sf" data-go2="profile" data-tab="edit">'+X8ic('cal')+'<div><b>Quando é o próximo teste?</b><span>Marca a data e o Nex diz-te o que treinar.</span></div>'+X8ic('chev')+'</button>';
  h+='</div><div style="display:flex;flex-direction:column;gap:12px"><h2 class="x8h2" style="margin-top:0">Treino de Matemática</h2><div class="x8modes">'+
    [['sim','var(--x8-blue)','#4A84D6','quiz','Simulação do teste','14 perguntas'],['weak','var(--x8-coral)','#D56B4D','alert','Pontos fracos',weak?weak+' tipo'+(weak>1?'s':''):'nenhum agora'],['rev','var(--x8-pink)','#C567A3','repeat','Revisão dos erros',DUE.length?DUE.length+' para hoje':'em dia'],['mix','var(--x8-green)','#00A672','cards','Misturado','um pouco de tudo']]
    .map(([k,c,s,i,t,d])=>'<button type="button"class="x8mode" data-h8="'+k+'" style="background:'+c+';box-shadow:0 5px 0 '+s+'">'+X8ic(i)+'<b>'+t+'</b><span>'+d+'</span></button>').join('')+'</div>';
  h+='<h2 class="x8h2">Disciplinas</h2><div class="x8subjs">'+SUBJ.map(x=>{const col={g0:'var(--x8-blue)',g1:'var(--x8-yel)',g2:'var(--x8-lil)',g3:'var(--x8-pink)',g4:'var(--x8-coral)',g5:'#FF7A3D'}[x.g]||'var(--x8-lil)';return'<button type="button"class="x8subj'+(x.on?'':' off')+'" '+(x.on?'data-subj="'+x.id+'"':'data-soon="'+esc(x.n)+'"')+'><span class="si" style="background:'+col+'">'+IC[x.ic]+'</span>'+esc(x.n)+(x.on?'':'<em>em breve</em>')+'</button>';}).join('')+'</div></div>';
  h+='<div class="home2 full"><div class="card"><div class="cardh"><h2>Missões de hoje</h2><span>'+M.filter(m=>m.done).length+'/3 · +20 XP cada</span></div><div class="missions">'+
    M.map(m=>'<div class="mis'+(m.done?' done':'')+'"><span class="mi">'+(m.done?IC.check:IC[m.ic])+'</span><div><b>'+esc(m.n)+'</b><div class="bar"><i class="'+(m.done?'ok':'')+'" style="width:'+Math.round(m.p/m.m*100)+'%"></i></div></div><span class="rw">'+(m.done?'feito':m.p+'/'+m.m)+'</span></div>').join('')+'</div></div>';
  h+='<div class="card"><div class="cardh"><h2>Esta semana</h2><span>'+W.reduce((s,w)=>s+w.n,0)+' exercícios</span></div><div class="week">'+
    W.map(w=>'<div><em>'+(w.n||'')+'</em><i class="'+(w.n?'on':'')+(w.today?' today':'')+'" style="height:'+Math.max(4,Math.round(w.n/wmax*86))+'px"></i><span>'+w.lab+'</span></div>').join('')+'</div></div></div></div>';
  const el=document.getElementById('v-home');el.innerHTML=h;bindCommon(el);bindInstall(el);
  el.querySelectorAll('[data-soon]').forEach(b=>b.onclick=()=>toast(b.dataset.soon+' chega em breve.'));
  const g=el.querySelector('#h8-go');g.onclick=()=>{if(cont){go('play');loadPad();}else if(!S.total)go('study');else if(lastD)XD.open(lastD.id);else startSess(weakTypes(1).length?'weak':'mix');};
  const t=el.querySelector('#h8-tst');if(t)t.onclick=()=>startSess(td<=1&&weakTypes(1).length?'weak':'sim');
  el.querySelectorAll('[data-h8]').forEach(b=>b.onclick=()=>startSess(b.dataset.h8));
};

/* ---------- Exercício: folha de resposta ---------- */
{let fbT=null;const _rec=record;record=function(t,n,g,mode){let x0=0;try{x0=X16.total();}catch(e){}const r=_rec.apply(this,arguments);try{if(view!=='play')return r;let gain=0;try{gain=Math.max(0,X16.total()-x0);}catch(e){}const E=ex(t,n),ok=g===E.a;
  let el=document.querySelector('.x8fb');if(!el){el=document.createElement('div');el.className='x8fb';el.setAttribute('role','status');el.onclick=()=>el.classList.remove('show');document.body.appendChild(el);}
  const it=(HIST[0]&&HIST[0].items)||[],last=it[it.length-1],rt=last&&last.rt;
  el.className='x8fb '+(ok?'ok':'bad');
  el.innerHTML=NEX8(ok?'festejar':'incentivar',60)+'<div style="min-width:0"><b>'+(ok?['Isso! Acertaste.','Muito bem!','Certíssimo.','Boa! Continua.'][Math.floor(Math.random()*4)]:'Quase. Vê a explicação.')+'</b><span>'+(ok?(rt?'Já tinhas feito este: sem XP extra.':'Continua assim.'):'A certa era: '+esc(String(E.o[E.a]).replace(/<[^>]*>/g,'')))+'</span></div>'+(ok&&gain?'<span class="xp">+'+gain+' XP</span>':'');
  void el.offsetWidth;el.classList.add('show');clearTimeout(fbT);fbT=setTimeout(()=>el.classList.remove('show'),ok?1900:3200);}catch(e){}return r;};
 const _go=go;go=function(v){const f=document.querySelector('.x8fb');if(f)f.classList.remove('show');
  // 1.25: as folhas abertas fecham ao mudar de ecrã
  if(v!==view)document.querySelectorAll('.x8sheet,.x8sheet-bg,.nsheet,.nsheet-bg,.result').forEach(e=>e.remove());return _go.apply(this,arguments);};}
/* ---------- Resultado com o Nex ---------- */
{const _sr=showResult;showResult=function(S){const r=_sr.apply(this,arguments);try{const done=S.list.filter(([t,n])=>st.ans[K(t,n)]!==undefined),okN=done.filter(([t,n])=>st.ans[K(t,n)]===ex(t,n).a).length,p=done.length?okN/done.length:0;
  const box=document.querySelector('.result .box');if(box&&!box.querySelector('.x8rnex')){box.insertAdjacentHTML('afterbegin','<div class="x8rnex">'+NEX8(p>=.8?'festejar':p>=.5?'incentivar':'pensar',p>=.8?140:120)+'</div>');const n=box.querySelector('.x8rnex .x8nex');if(n&&p>=.8)n.classList.add('x8jump');}}catch(e){}return r;};}
/* ---------- Ranking com pódio ---------- */
{const _rc2=renderComm;renderComm=function(){const r=_rc2.apply(this,arguments);try{if(commTab!=='rank'||!db)return r;const el=document.getElementById('v-comm');const first=el.querySelector('.rrow');if(!first||el.querySelector('.x8pod'))return r;
  const wk=weekId(Date.now()),W=rankMode==='week',score=p=>num(W?(p.wk===wk?p.wxp:0):p.xp);
  const list=Object.entries(PERFIS).filter(([u,p])=>p&&p.nick&&p.ranking!==false&&(!W||p.wk===wk)).map(([u,p])=>({u,p})).sort((a,b)=>score(b.p)-score(a.p));
  if(list.length<3)return r;const c=(x,i)=>'<button type="button"class="pc p'+(i+1)+' linkb" data-user="'+esc(x.u)+'">'+avatar(x.p.nick,x.p.cor,i===0?'lg':'',x.p.foto)+'<b>'+esc(x.p.nick)+(x.u===uid?' (tu)':'')+'</b><small>'+score(x.p)+' XP</small><div class="pd">'+(i+1)+'</div></button>';
  const h='<div class="x8pod" aria-label="Pódio">'+c(list[1],1)+c(list[0],0)+c(list[2],2)+'</div>';
  const box=first.parentElement;box.insertAdjacentHTML('beforebegin',h);el.querySelectorAll('.x8pod [data-user]').forEach(b=>b.onclick=()=>openUser(b.dataset.user));}catch(e){}return r;};}

/* ---------- Modelo opcional do Nex no próprio dispositivo (WebLLM; sem chaves, sem servidores, sem cartão) ---------- */
const IA8=(()=>{
const WL='https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.86/+esm';
const LSg=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},LSs=(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}};
const MOD={leve:{base:'Qwen3.5-0.8B',mb:'cerca de 450 MB',nome:'Nex leve'},completo:{base:'Qwen3.5-2B',mb:'cerca de 1,1 GB',nome:'Nex completo'}};
const mobile=/Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent);
let eng=null,wk=null,loading=null,modelId=null,f16=null,progress=0,progTxt='';
const pref=()=>LSg('x8-ia-modelo','leve');
async function gpuInfo(){if(!('gpu' in navigator))return null;try{const ad=await navigator.gpu.requestAdapter();if(!ad)return null;return{f16:ad.features.has('shader-f16')};}catch(e){return null;}}
async function idFor(kind){const g=await gpuInfo();if(!g)return null;f16=g.f16;return MOD[kind].base+(g.f16?'-q4f16_1-MLC':'-q4f32_1-MLC');}
async function cached(kind){try{const id=await idFor(kind||pref());if(!id)return false;const wl=await import(WL);const h=await wl.hasModelInCache(id);
  /* 1.26: com o Nex instalado, pede ao browser para não apagar os ficheiros quando faltar espaço */
  if(h){try{if(navigator.storage&&navigator.storage.persist&&!localStorage.getItem('x26-persist')){navigator.storage.persist().then(ok=>{try{localStorage.setItem('x26-persist',ok?'1':'0');}catch(e){}});}}catch(e){}}
  return h;}catch(e){return navigator.onLine===false&&localStorage.getItem('x8-ia-pronto')?true:false;}}
function sheet(html){document.querySelectorAll('.x8sheet:not(.x11sh),.x8sheet-bg:not(.x11sh-bg)').forEach(e=>e.remove());const bg=document.createElement('div');bg.className='x8sheet-bg';const sh=document.createElement('div');sh.className='x8sheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Tutor Nex');sh.innerHTML='<span class="grab"></span>'+html;document.body.appendChild(bg);document.body.appendChild(sh);return{sh,bg,close:()=>{sh.remove();bg.remove();}};}
async function load(kind){
  if(eng&&modelId===(await idFor(kind)))return eng;
  if(loading)return loading;
  loading=(async()=>{const id=await idFor(kind);if(!id){const e=new Error('nogpu');e.code='nogpu';throw e;}
    const wl=await import(WL);
    const w=new Worker(new URL('ia-worker.js',location.href),{type:'module'});wk=w;
    eng=await wl.CreateWebWorkerMLCEngine(w,id,{initProgressCallback:r=>{progress=r.progress||0;progTxt=r.text||'';const b=document.querySelector('.x8ia .pb i');if(b)b.style.width=Math.round(progress*100)+'%';const t=document.querySelector('.x8ia .pt');if(t)t.textContent=Math.round(progress*100)+'%';}});
    modelId=id;LSs('x8-ia-pronto',id);return eng;})();
  try{return await loading;}finally{loading=null;}}
function ask(kind){return new Promise(res=>{const m=MOD[kind];
  const s=sheet('<div class="x8ia">'+NEX8('incentivar',96)+'<div class="x8sh"><h2>Carregar o Nex</h2></div><p class="x8sub" style="font-size:15px">O tutor funciona <b style="color:var(--x8-ink)">dentro do teu dispositivo</b>: as tuas perguntas não saem daqui e não precisa de internet depois. Para isso, descarrega uma vez o cérebro do Nex (<b id="x8-ia-mb">'+m.mb+'</b>). Usa Wi-Fi.</p><p class="x8fine" id="x8-ia-free"></p>'+
   '<div class="x8opts" role="radiogroup" aria-label="Tamanho do Nex"><button type="button"class="x8opt" role="radio" aria-checked="'+(kind==='leve')+'" data-k="leve"><b>Leve</b><small>'+MOD.leve.mb+' · mais rápido</small></button><button type="button"class="x8opt" role="radio" aria-checked="'+(kind==='completo')+'" data-k="completo"><b>Completo</b><small>'+MOD.completo.mb+' · explica melhor</small></button></div>'+
   '<button type="button"class="x8p w" id="x8-ia-go">Descarregar e começar</button><button type="button"class="x8lk" id="x8-ia-no">Agora não</button><p class="x8fine">Modelo Qwen3.5 (Alibaba), licença Apache-2.0. Pode errar: confirma sempre.</p></div>');
  let k=kind;s.sh.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{k=b.dataset.k;LSs('x8-ia-modelo',k);s.sh.querySelectorAll('[data-k]').forEach(x=>x.setAttribute('aria-checked',String(x===b)));const mb=s.sh.querySelector('#x8-ia-mb');if(mb)mb.textContent=MOD[k].mb;});
  try{navigator.storage&&navigator.storage.estimate&&navigator.storage.estimate().then(e=>{const f=s.sh.querySelector('#x8-ia-free');if(f&&e&&e.quota)f.textContent='Espaço disponível para a app: cerca de '+(Math.max(0,(e.quota-(e.usage||0)))/1e9).toLocaleString('pt-PT',{maximumFractionDigits:1})+' GB.';});}catch(e){}
  s.bg.onclick=s.sh.querySelector('#x8-ia-no').onclick=()=>{s.close();res(null);};
  s.sh.querySelector('#x8-ia-go').onclick=()=>{s.close();res(k);};});}
function progressSheet(){return sheet('<div class="x8ia">'+NEX8('pensar',90)+'<div class="x8sh"><h2>A preparar o Nex…</h2><b class="pt">0%</b></div><div class="pb"><i></i></div><small>Só é preciso uma vez. Podes continuar a usar a app; não feches esta página.</small></div>');}
/* 1.33: gerar texto com o modelo já instalado. Não abre folhas nem pede para instalar (isso é o install()).
   Se o modelo falhar ou não der sinal dentro do tempo de espera, o motor é reiniciado e o erro segue para quem chamou,
   que mostra a resposta da matéria (ver js/nex.js). */
function reset(){try{eng&&eng.unload&&eng.unload();}catch(e){}try{wk&&wk.terminate();}catch(e){}eng=null;wk=null;modelId=null;loading=null;}
async function gerar(msgs,opts){opts=opts||{};
  if(!eng){if(!(await cached(pref()))){const e=new Error('noinst');e.code='noinst';throw e;}await load(pref());}
  let t='',veio=false,g=0;
  const corre=(async()=>{const stream=await eng.chat.completions.create({messages:msgs,stream:true,temperature:opts.temperature==null?.4:opts.temperature,max_tokens:opts.max_tokens||600,extra_body:{enable_thinking:false}});
    for await(const ch of stream){const d=(ch.choices[0]&&ch.choices[0].delta&&ch.choices[0].delta.content)||'';if(d)veio=true;t+=d;if(opts.onText)opts.onText(t);}return t;})();
  corre.catch(()=>{});
  const tempo=new Promise((_,rej)=>{g=setTimeout(()=>{if(!veio){const e=new Error('lento');e.code='lento';rej(e);}},opts.espera||45000);});
  try{return await Promise.race([corre,tempo]);}catch(e){reset();throw e;}finally{clearTimeout(g);}}
async function remove(){reset();try{const wl=await import(WL);for(const k of ['leve','completo']){const id=await idFor(k);if(id)await wl.deleteModelAllInfoInCache(id);}}catch(e){}try{localStorage.removeItem('x8-ia-pronto');}catch(e){}}
/* 1.25: instalar o Nex antes de perguntar (ecrã do Nex) */
async function install(){if(eng)return true;if(!(await gpuInfo()))return false;let kind=pref();if(!(await cached(kind))){kind=await ask(kind);if(!kind)return false;}const ps=progressSheet();try{await load(kind);}catch(e){ps.close();return false;}ps.close();return true;}
const ready=()=>!!eng;
return{gerar,reset,cached,remove,pref,MOD,gpuInfo,load,install,ready,setPref:k=>LSs('x8-ia-modelo',k)};
})();
/* sampleFn só marca que há tutor nesta versão; as respostas saem do Nex (js/nex.js). */
if(IS_APP){sampleFn=IA8.gerar;aiCfg='ok';loadAiKey=async function(){sampleFn=IA8.gerar;aiCfg='ok';};
  aiKeyCardHTML=function(){return'<div class="x8card"><h2>Tutor Nex</h2><p>O Nex responde com a matéria da app (conceitos, lições, fichas, glossário e fórmulas), no dispositivo de cada aluno e sem internet. O modelo opcional (Qwen3.5, licença Apache-2.0) também corre no dispositivo. Não há chaves, servidores pagos nem contas de terceiros, e as perguntas não saem do telemóvel.</p></div>';};
  bindAiKey=function(){};}

/* ---------- Prazos de conservação: denúncias 12 meses ---------- */
{const _la=loadAdmin;loadAdmin=async function(){const r=await _la.apply(this,arguments);try{const lim=Date.now()-365*864e5,old=(ADM.rep||[]).filter(x=>(x.ts||0)<lim);for(const d of old){await FB.Fs.deleteDoc(fdoc('denuncias/'+d.id));}if(old.length){ADM.rep=ADM.rep.filter(x=>(x.ts||0)>=lim);}}catch(e){}return r;};}
