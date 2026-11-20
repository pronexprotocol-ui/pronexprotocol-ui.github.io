/* Pronex_Study · 05-contas-mural-painel.js
   Contas, mural, fotos, perfis públicos e painel do administrador.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* ================= v1.5: contas automáticas, mural, fotos, perfis e painel ================= */
Object.assign(IC,{
 img:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>',
 heart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 019-3 4.8 4.8 0 019 3c-2 4.6-9 9-9 9z"/></svg>',
 bubble:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h16v11H9l-5 4z"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
 phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
 laptop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/></svg>',
 download:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>'
});

/* --- Identidade do dispositivo --- */
const DEV_ID=(()=>{try{let d=localStorage.getItem('ps-dev');if(!d){d='d'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);localStorage.setItem('ps-dev',d);}return d;}catch(e){return'd-sem-id';}})();
function devInfo(){const ua=navigator.userAgent||'';
  const ios=/iP(hone|ad|od)/.test(ua)||(/Macintosh/.test(ua)&&'ontouchend' in document);
  const so=/Android/.test(ua)?'Android':ios?'iOS':/Windows/.test(ua)?'Windows':/CrOS/.test(ua)?'ChromeOS':/Mac OS X|Macintosh/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'Outro';
  const nav=/SamsungBrowser/.test(ua)?'Samsung Internet':/Edg(e|A|iOS)?\//.test(ua)?'Edge':/OPR\/|Opera/.test(ua)?'Opera':/Firefox|FxiOS/.test(ua)?'Firefox':/CriOS|Chrome/.test(ua)?'Chrome':/Safari/.test(ua)?'Safari':'Outro';
  const tipo=/iPad|Tablet/.test(ua)||(ios&&!/iPhone|iPod/.test(ua))?'Tablet':/Mobi|Android|iPhone|iPod/.test(ua)?'Telemóvel':'Computador';
  let inst=false;try{inst=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){}
  return{tipo,so,nav,ecra:screen.width+'x'+screen.height,instalada:inst,lingua:navigator.language||'',versao:APP_VERSION,ultimo:Date.now()};}
const isFB=()=>BACKEND==='firebase'&&!!FB&&!!fbUser&&!!uid;
const isAnon=()=>!!(fbUser&&fbUser.isAnonymous);
const fdoc=p=>FB.Fs.doc(FB.fs,p),fcol=p=>FB.Fs.collection(FB.fs,p);
const SAFE_IMG=/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const safeImg=s=>typeof s==='string'&&s.length<800000&&SAFE_IMG.test(s)?s:'';
function ago(ts){if(!ts)return'';const s=(Date.now()-ts)/1000;if(s<60)return'agora';if(s<3600)return Math.floor(s/60)+' min';if(s<86400)return Math.floor(s/3600)+' h';if(s<7*86400)return Math.floor(s/86400)+' d';return new Date(ts).toLocaleDateString('pt-PT',{day:'numeric',month:'short'});}
function fotoOf(u){if(u===uid)return ME.foto||'';const p=PERFIS[u];return p?p.foto||'':'';}
function avU(u,size){return avatar(nickOf(u),corOf(u),size,fotoOf(u));}

/* --- Registo de utilizadores e dispositivos (só o administrador vê) --- */
let regT=null;
async function registerUser(){if(!isFB())return;const F=FB.Fs,ref=fdoc('utilizadores/'+uid);
  const body={uid,nick:(ME.nick||'').slice(0,30),email:fbUser.email||'',anon:isAnon(),ultimo:Date.now(),versao:APP_VERSION,dev:F.deleteField()};
  try{const k='ps-reg-'+uid;let known=false;try{known=localStorage.getItem(k)==='1';}catch(e){}
    if(!known){const s=await F.getDoc(ref);if(!s.exists()){body.criado=Date.now();body.criadoEm=F.serverTimestamp();}try{localStorage.setItem(k,'1');}catch(e){}}
    try{await F.setDoc(ref,body,{merge:true});}catch(e){if(e&&e.code==='permission-denied'){try{localStorage.removeItem(k);}catch(x){}}}}catch(e){}}
function heartbeat(){clearInterval(regT);registerUser();regT=setInterval(()=>{if(document.visibilityState==='visible')registerUser();},30*60*1000);}


/* --- Registo de atividade de cada utilizador --- */
let EVQ=[],evT=null,opened=false;
function logEv(){} /* 1.17: a app deixou de guardar o registo de atividade de cada pessoa. */
function flushEv(){}
let tutT=null;
function cloudTutor(){} /* 1.17: a conversa com o tutor fica só no dispositivo. */
/* Apaga da nuvem, uma vez por conta, o que as versões antigas lá deixaram. */
async function limparDadosAntigos(){if(!isFB())return;const k='x17-limpo-'+uid;try{if(localStorage.getItem(k)==='1')return;}catch(e){}const F=FB.Fs;
  try{const s=await F.getDocsFromServer(fcol('data/users/'+uid));const velhos=s.docs.filter(d=>d.id==='tutor'||d.id.indexOf('log_')===0);for(const d of velhos)await F.deleteDoc(d.ref);try{localStorage.setItem(k,'1');}catch(e){}}catch(e){}}
const _startSess=startSess;startSess=function(kind,t){const r=_startSess.apply(this,arguments);logEv('sessao',{k:kind,t:t!=null&&TYPES[t]?TYPES[t].n:''});return r;};
const _showResult=showResult;showResult=function(S){try{const its=S.list.map(([t,n])=>st.ans[K(t,n)]!==undefined&&st.ans[K(t,n)]===ex(t,n).a);logEv('fim',{k:S.kind||'',c:its.filter(Boolean).length,n:S.list.length});}catch(e){}return _showResult.apply(this,arguments);};

/* --- Conta: ligar a conta automática ao Google ou a um email --- */
/* As regras só abrem a comunidade a contas confirmadas. Quando a conta passa a estar confirmada, recarrega a app:
   todas as ligações ao servidor voltam a abrir já com a autorização nova. */
let CONTA_OK=null;
function onUserUpdate(){if(!FB)return;const u=FB.auth.currentUser;if(!u)return;const agora=!u.isAnonymous&&!!u.emailVerified;if(agora&&CONTA_OK===false){CONTA_OK=true;u.getIdToken(true).catch(()=>{}).finally(()=>location.reload());return;}CONTA_OK=agora;fbUser=u;isOwner=(u.email||'').toLowerCase()===OWNER_EMAIL&&!!u.emailVerified&&!u.isAnonymous;registerUser();refresh();}
async function loginGoogle(){const {Au,auth}=FB;const p=new Au.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  if(IS_IOS_APP){try{localStorage.setItem('x17-redir','1');if(isAnon())await Au.linkWithRedirect(auth.currentUser,p);else await Au.signInWithRedirect(auth,p);}catch(x){toast(authMsg(x));}return;}
  try{if(isAnon())await Au.linkWithPopup(auth.currentUser,p);else await Au.signInWithPopup(auth,p);onUserUpdate();toast('Conta Google ligada. O teu progresso fica guardado para sempre.');}
  catch(e){
    if(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use'||e.code==='auth/account-exists-with-different-credential'){const c=Au.GoogleAuthProvider.credentialFromError(e);try{if(c)await Au.signInWithCredential(auth,c);else await Au.signInWithPopup(auth,p);toast('Entraste na tua conta. O que fizeste neste dispositivo foi juntado.');}catch(x){toast(authMsg(x));}return;}
    if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/cancelled-popup-request'].includes(e.code)){try{localStorage.setItem('x17-redir','1');if(isAnon())await Au.linkWithRedirect(auth.currentUser,p);else await Au.signInWithRedirect(auth,p);}catch(x){toast(authMsg(x));}}
    else toast(authMsg(e));}}
async function loginEmail(mode,email,pass){const {Au,auth}=FB;
  try{if(mode==='new'){if(isAnon())await Au.linkWithCredential(auth.currentUser,Au.EmailAuthProvider.credential(email,pass));else await Au.createUserWithEmailAndPassword(auth,email,pass);onUserUpdate();toast('Conta criada. O teu progresso fica guardado para sempre.');}
    else{await Au.signInWithEmailAndPassword(auth,email,pass);toast('Sessão iniciada. O que fizeste neste dispositivo foi juntado.');}return true;}
  catch(e){window.ERRO_ENTRADA=authMsg(e);toast(window.ERRO_ENTRADA);return false;}}
async function logout(){try{localStorage.setItem('x18-saiu','1');}catch(e){}flushEv();
  HIST=[];saveHistLocal();TUTOR=[];try{localStorage.setItem('ps-tutor','[]');}catch(e){}
  ME=Object.assign({},{nick:'',curso:'Multimédia',escola:'',bio:'',foto:'',cor:0,goal:15,ranking:true,ai:0});hasProfile=false;saveMeLocal();st.onb=false;st.seen={};st.rtk={};st.frz={have:0,used:[],lastKey:''};save();try{X21.push();X21.clear();}catch(e){}
  limparPessoal();try{await FB.Au.signOut(FB.auth);}catch(e){}location.reload();}
Object.assign(AUTH_ERR,{'auth/credential-already-in-use':'Essa conta já existe. Usa "Entrar".','auth/provider-already-linked':'Esta conta já está ligada.','auth/admin-restricted-operation':'As contas automáticas ainda não estão ativas no servidor.','auth/requires-recent-login':'Por segurança, entra outra vez e repete.'});
const GBTN='<button class="btn pri" id="acc-g" style="width:100%"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#fff" opacity=".85" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z"/><path fill="#fff" opacity=".7" d="M6.4 14a6 6 0 010-3.9V7.5H3.1a10 10 0 000 9z"/><path fill="#fff" opacity=".55" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 003.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z"/></svg>Ligar com Google</button>';
const PRIV='<div class="card acc"><div class="eyebrow">Privacidade</div><h2>O que fica guardado</h2><p class="muted">Para a app funcionar em qualquer dispositivo, ficam guardados na nuvem: os teus exercícios e resultados, as publicações, os comentários e as mensagens, e o teu perfil. A conversa com o tutor fica só neste dispositivo. O administrador da Pronex_Study pode ver o teu email, o perfil e o progresso para gerir a app e manter a comunidade segura. Não guardamos a tua localização nem os teus contactos.</p></div>';
accountCard=function(){
  if(BACKEND==='claude'||!IS_APP)return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Versão de pré-visualização</h2><p class="muted">A conta, o mural, a conversa e o ranking estão na app Pronex_Study.</p><a class="btn pri" href="'+APP_URL+'" target="_blank" rel="noopener">Abrir a app</a></div>';
  if(!HAS_FB())return'<div class="card acc"><p class="muted">O servidor da app não está configurado.</p></div>';
  if(!FB||!fbUser)return'<div class="card acc"><p class="muted">A ligar ao servidor…</p></div>';
  if(!isAnon()&&fbUser.email&&!fbUser.emailVerified)return'<div class="card acc vfy"><div class="eyebrow">Conta</div><h2>Confirma o teu email</h2><p class="muted">Entraste como <b>'+esc(fbUser.email)+'</b>, mas o email ainda não está confirmado. Confirma-o para proteger a conta'+((fbUser.email||'').toLowerCase()===OWNER_EMAIL?' e abrir o Painel do administrador':'')+'.</p>'+(NO_G?'':GBTN.replace('Ligar com Google','Confirmar com Google').replace('id="acc-g"','id="acc-vg"'))+'<div class="accb"><button class="btn sm" id="acc-ve">Enviar email de confirmação</button><button class="btn sm ghost" id="acc-vok">Já confirmei</button><button class="btn sm ghost" id="acc-out">Terminar sessão</button></div></div>'+PRIV;
  if(!isAnon())return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Conta ligada</h2><p class="muted">'+esc(fbUser.email||fbUser.displayName||'')+'</p><p class="store">'+(storeMode==='db'?'Progresso, sequência, perfil e publicações guardados na nuvem. Entra com esta conta noutro dispositivo e continua onde paraste.':'A sincronizar…')+'</p><div class="accb"><button class="btn sm ghost" id="acc-pw">'+(IS_IOS_APP?'Criar ou mudar palavra-passe':'Mudar palavra-passe')+'</button><button class="btn sm" id="acc-out">Terminar sessão</button></div><p class="hint" style="margin:6px 0 0">Com uma palavra-passe, entras com este email em qualquer telemóvel, mesmo no iPhone com a app instalada.</p></div>'+PRIV;
  return'<div class="card acc"><div class="eyebrow">Conta automática</div><h2>Liga a tua conta para nunca perderes nada</h2><p class="muted">Já tens uma conta automática neste dispositivo. Liga-a ao Google ou a um email para entrares na comunidade e recuperares tudo se trocares de telemóvel ou limpares o browser.</p>'+
    (NO_G?'<p class="hint" style="margin:0">No iPhone, com a app instalada, o Google não funciona: usa email e palavra-passe. Criaste a conta com o Google? Escreve o teu email e toca em «Esqueci-me da palavra-passe» para criares uma. Ou abre a app no Safari e entra com o Google.</p>':GBTN+'<div class="or"><span>ou com email</span></div>')+
    '<form id="acc-f" class="accf"><label class="f">Email<input type="text" inputmode="email" autocomplete="email" id="acc-e" required></label><label class="f">Palavra-passe<input type="password" autocomplete="new-password" id="acc-p" minlength="6" required></label>'+
    '<div class="accb"><button class="btn pri" type="submit" data-m="new">Criar conta com este email</button><button class="btn" type="submit" data-m="in">Já tenho conta: entrar</button></div><button type="button" class="linkb" id="acc-r">Esqueci-me da palavra-passe</button></form></div>'+PRIV;
};

/* --- Imagens: foto de perfil e fotos do mural, comprimidas no próprio dispositivo --- */
function loadImgFile(file){return new Promise((res,rej)=>{if(!file||!/^image\//.test(file.type||'image/')){rej(new Error('tipo'));return;}const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{res({im,done:()=>URL.revokeObjectURL(u)});};im.onerror=()=>{URL.revokeObjectURL(u);rej(new Error('img'));};im.src=u;});}
async function readPostImg(file){const {im,done}=await loadImgFile(file);let w=im.naturalWidth,h=im.naturalHeight;const s=Math.min(1,1080/Math.max(w,h));w=Math.round(w*s);h=Math.round(h*s);
  const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,w,h);x.drawImage(im,0,0,w,h);done();
  let q=.78,d=c.toDataURL('image/jpeg',q);while(d.length>560000&&q>.35){q-=.1;d=c.toDataURL('image/jpeg',q);}return d;}
async function readAvatarImg(file){const {im,done}=await loadImgFile(file);const S=160,m=Math.min(im.naturalWidth,im.naturalHeight);
  const c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');x.drawImage(im,(im.naturalWidth-m)/2,(im.naturalHeight-m)/2,m,m,0,0,S,S);done();
  let q=.82,d=c.toDataURL('image/jpeg',q);while(d.length>40000&&q>.4){q-=.1;d=c.toDataURL('image/jpeg',q);}return d;}

/* --- Bloquear: deixas de ver o que essa pessoa publica --- */
let BLOQ=new Set();
async function lerBloqueios(){if(!isFB()||isAnon())return;try{const s=await FB.Fs.getDoc(fdoc('data/users/'+uid+'/bloqueios'));BLOQ=new Set(s.exists()?(s.data().ids||[]):[]);if(BLOQ.size){posts=posts.filter(p=>!BLOQ.has(p.uid));msgs=msgs.filter(m=>!BLOQ.has(m.uid));if(view==='comm')refresh();}}catch(e){}}
async function alternarBloqueio(u){const era=BLOQ.has(u);if(!era&&BLOQ.size>=200){toast('Chegaste ao limite de 200 pessoas bloqueadas.');return;}if(era)BLOQ.delete(u);else BLOQ.add(u);try{await FB.Fs.setDoc(fdoc('data/users/'+uid+'/bloqueios'),{ids:[...BLOQ].slice(0,200),upd:FB.Fs.serverTimestamp()});toast(era?'Pessoa desbloqueada.':'Pessoa bloqueada. Deixas de ver o que publica e ela deixa de te poder desafiar para duelos.');}catch(e){if(era)BLOQ.add(u);else BLOQ.delete(u);toast('Não foi possível guardar. Tenta outra vez.');return;}stopMural();if(unsubChat){try{unsubChat();}catch(e){}unsubChat=null;}chatState='idle';msgs=[];if(view==='comm')renderComm();}
/* --- Perfil público de outro estudante --- */
document.addEventListener('click',e=>{const b=e.target.closest('[data-user]');if(!b)return;e.preventDefault();openUser(b.dataset.user);});
/* 1.26: denunciar um perfil (nome, foto ou biografia) */
function denunciarPerfil(u){const p=PERFIS[u]||{};const go=campo=>X8.motivo().then(mt=>{if(!mt)throw 0;return FB.Fs.addDoc(fcol('denuncias'),{by:uid,tipo:'perfil',autor:u,campo,text:String(campo==='bio'?p.bio||'':campo==='nick'?p.nick||'':'').slice(0,500),ts:Date.now(),motivo:mt});}).then(()=>toast('Perfil denunciado. O administrador vai rever.')).catch(e=>{if(e!==0)toast('Não foi possível denunciar.');});
  if(typeof X11==='undefined'){go('nick');return;}
  const sh=X11.sheet('O que está mal neste perfil?','<div class="x25acts"><button class="x8p gh w" data-pc="nick">O nome</button><button class="x8p gh w" data-pc="foto">A foto</button><button class="x8p gh w" data-pc="bio">A biografia</button><button class="x8p l w" data-pc="">Cancelar</button></div>');
  sh.sh.querySelectorAll('[data-pc]').forEach(b=>b.onclick=()=>{sh.close();if(b.dataset.pc)go(b.dataset.pc);});}
function openUser(u){
  let me=u===uid,S=me?stats():null,p=me?{nick:ME.nick,curso:ME.curso,escola:ME.escola,bio:ME.bio,cor:ME.cor,foto:ME.foto,xp:S.xp,nivel:S.lv.n,streak:S.streak,total:S.total,certos:S.ok,badges:S.badges}:PERFIS[u];
  if(!p){toast('Este perfil ainda não foi carregado.');return;}
  p=Object.assign({},p,{nivel:num(p.nivel)||1,xp:num(p.xp),streak:num(p.streak),total:num(p.total),badges:num(p.badges),certos:num(p.certos)});
  const np=posts.filter(x=>x.uid===u).length;
  closeSheet();const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Perfil de '+(p.nick||'estudante'));
  sh.innerHTML='<span class="grab"></span><div class="uph">'+avatar(p.nick,p.cor,'lg',p.foto)+'<div style="min-width:0"><div class="eyebrow">Nível '+(p.nivel||1)+' · '+LV[Math.min((p.nivel||1)-1,LV.length-1)]+'</div><h2 style="font-size:1.45rem">'+esc(p.nick||'Estudante')+(me?' (tu)':'')+'</h2><p class="muted" style="font-size:.88rem">'+esc([p.curso,p.escola].filter(Boolean).join(' · '))+'</p></div></div>'+
    (p.bio?'<p style="font-size:.95rem;margin:0">'+esc(p.bio)+'</p>':'')+
    '<div class="kpis"><div class="kpi"><div class="v">'+(p.xp||0)+'</div><div class="s">XP</div></div><div class="kpi"><div class="v">'+(p.streak||0)+'</div><div class="s">dias seguidos</div></div><div class="kpi"><div class="v">'+(p.total||0)+'</div><div class="s">exercícios</div></div><div class="kpi"><div class="v">'+(p.badges||0)+'</div><div class="s">conquistas</div></div></div>'+
    '<p class="hint" style="margin:0">'+np+' publicaç'+(np===1?'ão':'ões')+' no mural.</p>'+
    '<div class="acts">'+(isOwner&&!me?'<button class="btn" id="up-adm">'+IC.shield.replace('<svg','<svg width="16" height="16"')+' Ver tudo no painel</button>':'')+(me?'<button class="btn" id="up-edit">Editar o meu perfil</button>':'')+(!me&&isFB()?'<button class="btn" id="up-block">'+(BLOQ.has(u)?'Desbloquear':'Bloquear')+'</button><button class="btn" id="up-rep">Denunciar perfil</button>':'')+'<button class="btn pri" id="up-ok">Fechar</button></div>';
  document.body.appendChild(bg);document.body.appendChild(sh);document.addEventListener('keydown',sheetKey);
  sh.querySelector('#up-ok').onclick=closeSheet;const a=sh.querySelector('#up-adm');if(a)a.onclick=()=>{closeSheet();openAdminUser(u);};
  const blk=sh.querySelector('#up-block');if(blk)blk.onclick=()=>{closeSheet();alternarBloqueio(u);};
  const rpf=sh.querySelector('#up-rep');if(rpf)rpf.onclick=()=>{closeSheet();denunciarPerfil(u);};const ed=sh.querySelector('#up-edit');if(ed)ed.onclick=()=>{closeSheet();profTab='edit';go('profile');};sh.querySelector('#up-ok').focus({preventScroll:true});
}

/* --- Mural --- */
let posts=[],unsubPosts=null,postsState='idle',postImg='',openComs={},comSubs={},coms={},postBusy=false;
function stopMural(){if(unsubPosts){try{unsubPosts();}catch(e){}}unsubPosts=null;postsState='idle';posts=[];Object.values(comSubs).forEach(f=>{try{f();}catch(e){}});comSubs={};coms={};openComs={};}
function subPosts(){if(!isFB())return;if(unsubPosts)return;postsState='loading';const F=FB.Fs;
  const tm=setTimeout(()=>{if(postsState==='loading'){postsState='err';if(view==='comm'&&commTab==='mural')renderFeed();}},12000);
  unsubPosts=F.onSnapshot(F.query(fcol('posts'),F.orderBy('ts','desc'),F.limit(40)),s=>{clearTimeout(tm);postsState='ok';posts=s.docs.map(d=>Object.assign({id:d.id},d.data())).filter(p=>!BLOQ.has(p.uid)&&(!p.oculto||p.uid===uid||isOwner));if(view==='comm'&&commTab==='mural')renderFeed();},
    ()=>{clearTimeout(tm);postsState='err';if(view==='comm'&&commTab==='mural')renderFeed();});}
function subComs(id){if(comSubs[id]||!isFB())return;const F=FB.Fs;coms[id]=null;
  comSubs[id]=F.onSnapshot(F.query(fcol('posts/'+id+'/coments'),F.orderBy('ts','asc'),F.limit(60)),s=>{coms[id]=s.docs.map(d=>Object.assign({id:d.id},d.data())).filter(c=>!BLOQ.has(c.uid)&&(!c.oculto||c.uid===uid||isOwner));if(view==='comm'&&commTab==='mural')renderFeed();},()=>{coms[id]=[];});}
function muralHTML(){
  return'<div class="mural"><form class="card pcomp" id="pcomp">'+avU(uid)+'<div class="pc"><textarea id="p-txt" aria-label="Publicação para o mural" maxlength="1000" placeholder="Partilha uma dúvida, uma dica ou uma conquista…"></textarea><div id="p-prev">'+(postImg?'<div class="pprev"><img src="'+postImg+'" alt="Pré-visualização da foto"><button type="button" class="xbtn" id="p-noimg" aria-label="Tirar a foto">✕</button></div>':'')+'</div>'+
    '<div class="pcb"><label class="btn sm ghost">'+IC.img.replace('<svg','<svg width="16" height="16"')+' Foto<input type="file" id="p-img" accept="image/*" hidden></label><span class="hint" style="margin:0;flex:1">Sê respeitoso: o mural é visto por toda a comunidade.</span><button class="btn pri sm" type="submit" id="p-go"'+(postBusy?' disabled':'')+'>Publicar</button></div></div></form><div id="feed" class="feed"></div></div>';
}
function postHTML(p){
  const mine=p.uid===uid,likes=p.likes||{},n=Object.keys(likes).length,liked=!!likes[uid],img=safeImg(p.img),open=!!openComs[p.id],cl=coms[p.id];
  return'<article class="card post"><header><button class="pu" data-user="'+esc(p.uid)+'" aria-label="Ver perfil de '+esc(nickOf(p.uid))+'">'+avU(p.uid,'sm')+'</button><div class="pmeta"><button class="linkb pn" data-user="'+esc(p.uid)+'">'+esc(nickOf(p.uid))+'</button><span>'+ago(p.ts)+'</span></div>'+
    (mine||isOwner?'<button class="del" data-pdel="'+esc(p.id)+'">apagar</button>':'')+(!mine?'<button class="del" data-prep="'+esc(p.id)+'">denunciar</button>':'')+'</header>'+(p.oculto?'<p class="x26rev">'+(p.uid===uid?'Em revisão: várias pessoas denunciaram esta publicação. Até o administrador decidir, só tu a vês.':'Escondida para a comunidade depois de 3 denúncias. Decide no painel.')+'</p>':'')+
    (p.text?'<p class="ptx">'+esc(p.text).replace(/\n/g,'<br>')+'</p>':'')+(img?'<img class="pimg" src="'+img+'" alt="Foto publicada por '+esc(nickOf(p.uid))+'" loading="lazy">':'')+
    '<footer><button class="pact'+(liked?' on':'')+'" data-like="'+esc(p.id)+'" aria-pressed="'+liked+'">'+IC.heart+'<span>'+n+'</span></button><button class="pact" data-com="'+esc(p.id)+'" aria-expanded="'+open+'">'+IC.bubble+'<span>'+(open?'Esconder':'Comentar')+'</span></button></footer>'+
    (open?'<div class="coms">'+(cl==null?'<p class="dim">A carregar…</p>':cl.map(c=>'<div class="com">'+'<button class="pu" data-user="'+esc(c.uid)+'">'+avU(c.uid,'sm')+'</button><div><b>'+esc(nickOf(c.uid))+'</b> <span class="dim">'+ago(c.ts)+'</span>'+(c.uid===uid||isOwner?' <button class="del" data-cdel="'+esc(p.id)+'|'+esc(c.id)+'">apagar</button>':'')+(c.uid!==uid?' <button class="del" data-crep="'+esc(p.id)+'|'+esc(c.id)+'">denunciar</button>':'')+(c.oculto?' <span class="x26rev">Em revisão</span>':'')+'<div>'+esc(c.text)+'</div></div></div>').join(''))+
      '<form class="composer cf" data-cf="'+esc(p.id)+'"><input type="text" maxlength="500" placeholder="Escreve um comentário…" autocomplete="off"><button class="btn sm pri" type="submit">Enviar</button></form></div>':'')+'</article>';
}
function renderFeed(){const box=document.getElementById('feed');if(!box)return;
  box.innerHTML=postsState==='loading'||postsState==='idle'?skelPosts():postsState==='err'?'<div class="empty">Não foi possível carregar o mural. Verifica a internet e abre outra vez.</div>':!posts.length?emptyHTML(IC.img,'O mural ainda está vazio','Partilha a primeira dúvida, dica ou conquista da turma. Podes juntar uma foto.','<button class="btn pri sm" type="button" data-foco="p-txt">Escrever a primeira publicação</button>'):posts.map(postHTML).join('');
  const F=FB&&FB.Fs;
  box.querySelectorAll('[data-like]').forEach(b=>b.onclick=()=>{const p=posts.find(x=>x.id===b.dataset.like);if(!p)return;const on=!(p.likes||{})[uid];
    F.updateDoc(fdoc('posts/'+p.id),{['likes.'+uid]:on?true:F.deleteField()}).catch(()=>toast('Não foi possível registar o gosto.'));if(on){haptic(8);tone(SND.tap);}});
  box.querySelectorAll('[data-com]').forEach(b=>b.onclick=()=>{const id=b.dataset.com;openComs[id]=!openComs[id];if(openComs[id])subComs(id);renderFeed();});
  box.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{if(b.dataset.ok!=='1'){b.dataset.ok='1';b.textContent='confirmar?';return;}F.deleteDoc(fdoc('posts/'+b.dataset.pdel)).then(()=>toast('Publicação apagada.')).catch(()=>toast('Não foi possível apagar.'));});
  box.querySelectorAll('[data-cdel]').forEach(b=>b.onclick=()=>{const [pid,cid]=b.dataset.cdel.split('|');F.deleteDoc(fdoc('posts/'+pid+'/coments/'+cid)).catch(()=>toast('Não foi possível apagar.'));});
  box.querySelectorAll('[data-prep]').forEach(b=>b.onclick=()=>{const p=posts.find(x=>x.id===b.dataset.prep);if(!p)return;X8.motivo().then(mt=>{if(!mt)throw 0;return F.addDoc(fcol('denuncias'),{by:uid,tipo:'post',post:p.id,autor:p.uid,text:String(p.text||'').slice(0,500),ts:Date.now(),motivo:mt});}).then(()=>{b.textContent='denunciada';b.disabled=true;toast('Publicação denunciada. O administrador vai rever.');}).catch(e=>{if(e!==0)toast('Não foi possível denunciar.');});});
  box.querySelectorAll('[data-crep]').forEach(b=>b.onclick=()=>{const [pid,cid]=b.dataset.crep.split('|');const c=(coms[pid]||[]).find(x=>x.id===cid);if(!c)return;X8.motivo().then(mt=>{if(!mt)throw 0;return F.addDoc(fcol('denuncias'),{by:uid,tipo:'com',post:pid,com:cid,autor:c.uid,text:String(c.text||'').slice(0,500),ts:Date.now(),motivo:mt});}).then(()=>{b.textContent='denunciado';b.disabled=true;toast('Comentário denunciado. O administrador vai rever.');}).catch(e=>{if(e!==0)toast('Não foi possível denunciar.');});});
  box.querySelectorAll('[data-cf]').forEach(f=>f.onsubmit=e=>{e.preventDefault();const i=f.querySelector('input'),text=i.value.trim().slice(0,500);if(!text)return;i.value='';const pid=f.dataset.cf;
    addRitmo('posts/'+pid+'/coments',{uid,text,ts:Date.now()},'ultimaMsg').then(()=>logEv('com',{p:pid,t:text})).catch(x=>{i.value=text;toast(x&&x.code==='x-filtro'?x.message:x&&x.code==='permission-denied'?motivoRecusa('Não foi possível comentar. Espera uns segundos e tenta outra vez.'):'Não foi possível comentar.');});});
}
function bindMural(el){const f=el.querySelector('#pcomp');if(!f)return;subPosts();renderFeed();
  const fi=el.querySelector('#p-img');if(fi)fi.onchange=async()=>{const file=fi.files&&fi.files[0];if(!file)return;try{postImg=await readPostImg(file);const t=el.querySelector('#p-txt').value;renderComm();el.querySelector('#p-txt').value=t;}catch(e){toast('Não foi possível abrir essa imagem.');}};
  const ni=el.querySelector('#p-noimg');if(ni)ni.onclick=()=>{const t=el.querySelector('#p-txt').value;postImg='';renderComm();el.querySelector('#p-txt').value=t;};
  f.onsubmit=async e=>{e.preventDefault();if(postBusy)return;const ta=el.querySelector('#p-txt'),text=ta.value.trim().slice(0,1000);if(!text&&!postImg){toast('Escreve alguma coisa ou junta uma foto.');return;}
    postBusy=true;el.querySelector('#p-go').disabled=true;
    try{await addRitmo('posts',{uid,text,img:postImg||'',ts:Date.now(),likes:{}},'ultimoPost');logEv('post',{t:text,f:postImg?1:0});postImg='';ta.value='';toast('Publicado no mural.');burst(innerWidth/2,innerHeight/3,24);}
    catch(x){toast(x&&x.code==='x-filtro'?x.message:x&&x.code==='permission-denied'?motivoRecusa('Não foi possível publicar. Espera uns segundos e tenta outra vez.'):'Não foi possível publicar. Verifica a internet.');}
    postBusy=false;renderComm();};
}

/* --- Painel do administrador --- */
let ADM={state:'idle',users:[],rep:[],q:'',f:'all'};
const EVN={abriu:'Abriu a app',sessao:'Começou a praticar',fim:'Terminou uma sessão',ia:'Perguntou ao tutor',post:'Publicou no mural',com:'Comentou uma publicação',msg:'Enviou uma mensagem',perfil:'Atualizou o perfil',foto:'Mudou a foto de perfil',conta:'Ligou a conta'};
async function loadAdmin(){if(!isFB()||!isOwner)return;ADM.state='loading';if(view==='profile'&&profTab==='adm')renderProfile();const F=FB.Fs;
  try{const us=await F.getDocs(fcol('utilizadores'));ADM.users=us.docs.map(d=>Object.assign({id:d.id},d.data()));
    try{const rp=await F.getDocs(F.query(fcol('denuncias'),F.orderBy('ts','desc'),F.limit(60)));ADM.rep=rp.docs.map(d=>Object.assign({id:d.id},d.data()));}catch(e){ADM.rep=[];}
    ADM.state='ok';}catch(e){ADM.state='err';ADM.err=e&&e.code||'';}
  if(view==='profile'&&profTab==='adm')renderProfile();}
function devIcon(d){return d&&d.tipo==='Computador'?IC.laptop:IC.phone;}
function adminHTML(){
  if(!isOwner)return'<div class="empty">Só o administrador vê este painel.</div>';
  if(ADM.state==='idle'){setTimeout(loadAdmin,0);return'<p class="dim">A carregar o painel…</p>';}
  if(ADM.state==='loading')return'<p class="dim">A carregar todos os utilizadores…</p>';
  if(ADM.state==='err')return'<div class="empty">Não foi possível carregar o painel ('+esc(ADM.err)+'). <button class="btn sm" id="adm-re">Tentar outra vez</button></div>';
  const U=ADM.users,now=Date.now(),d0=new Date();d0.setHours(0,0,0,0);
  const k=[[U.length,'utilizadores'],[U.filter(u=>(u.ultimo||0)>=d0.getTime()).length,'ativos hoje'],[U.filter(u=>now-(u.ultimo||0)<7*864e5).length,'ativos em 7 dias'],[U.filter(u=>!u.anon).length,'contas ligadas'],[ADM.rep.length,'denúncias']];
  let list=U.slice().sort((a,b)=>(b.ultimo||0)-(a.ultimo||0));
  const q=ADM.q.trim().toLowerCase();if(q)list=list.filter(u=>((u.nick||'')+' '+(u.email||'')+' '+((PERFIS[u.id]||{}).nick||'')).toLowerCase().includes(q));
  if(ADM.f==='today')list=list.filter(u=>(u.ultimo||0)>=d0.getTime());else if(ADM.f==='linked')list=list.filter(u=>!u.anon);else if(ADM.f==='anon')list=list.filter(u=>u.anon);
  let h='<div class="card admhead"><div><div class="eyebrow">'+IC.shield.replace('<svg','<svg width="14" height="14"')+' Painel do administrador</div><h2>Todos os que usam a Pronex_Study</h2><p class="muted" style="font-size:.88rem">Só tu vês este painel. Toca num utilizador para ver o progresso e gerir a conta.</p></div><div class="accb"><button class="btn sm" id="adm-re">Atualizar</button><button class="btn sm pri" id="adm-exp">'+IC.download.replace('<svg','<svg width="16" height="16"')+' Cópia de segurança</button></div></div>';
  h+='<div class="kpis admk">'+k.map(([v,s])=>'<div class="kpi"><div class="v">'+v+'</div><div class="s">'+s+'</div></div>').join('')+'</div>';
  if(ADM.rep.length)h+='<h2 style="font-size:1.1rem">Denúncias</h2><div class="card admrep">'+ADM.rep.map(r=>'<div class="arow"><div style="min-width:0;flex:1"><b>'+esc(r.tipo==='post'?'Publicação':r.tipo==='com'?'Comentário no mural':r.tipo==='perfil'?'Perfil ('+({nick:'nome',foto:'foto',bio:'biografia'}[r.campo]||r.campo)+')':'Mensagem em #'+(r.canal||''))+'</b> de '+esc(nickOf(r.autor))+' <span class="dim">· denunciada por '+esc(nickOf(r.by))+' · '+ago(r.ts)+'</span><div class="dim" style="font-size:.86rem">'+esc(r.text||'')+'</div></div><div class="accb">'+(r.tipo==='perfil'?'<button class="btn sm" data-ruser="'+esc(r.autor)+'">Ver perfil</button>':'<button class="btn sm" data-rdel="'+esc(r.id)+'">Apagar conteúdo</button>')+'<button class="btn sm ghost" data-rok="'+esc(r.id)+'">Ignorar</button></div></div>').join('')+'</div>';
  h+='<div class="sect-h" style="margin-top:6px"><h2 style="font-size:1.1rem">Utilizadores ('+list.length+')</h2><div class="chips">'+[['all','Todos'],['today','Hoje'],['linked','Conta ligada'],['anon','Automática']].map(([v,n])=>'<button class="chip" data-af="'+v+'" aria-pressed="'+(ADM.f===v)+'">'+n+'</button>').join('')+'</div></div>';
  h+='<input type="search" id="adm-q" placeholder="Procurar por nome ou email" value="'+esc(ADM.q)+'" style="width:100%">';
  h+='<div class="card admlist">'+(list.length?list.map(u=>{const p=PERFIS[u.id]||{};
    return'<button class="arow abtn" data-au="'+esc(u.id)+'">'+avatar(p.nick||u.nick||'?',p.cor|0,'sm',p.foto)+'<div style="min-width:0;flex:1;text-align:left"><b>'+esc(p.nick||u.nick||'Sem nome')+'</b>'+(u.anon?' <span class="tag">automática</span>':' <span class="tag ok">ligada</span>')+'<div class="dim" style="font-size:.82rem">'+esc(u.email||'sem email')+(u.versao?' · '+esc(u.versao):'')+'</div></div><div class="aright"><span class="mono">'+num(p.xp)+' XP</span><span class="dim">'+ago(u.ultimo)+'</span></div></button>';}).join(''):'<div class="empty">Nenhum utilizador com este filtro.</div>')+'</div>';
  h+=aiKeyCardHTML()+dangerHTML();
  return h;
}
/* Suspender: 7 dias, 30 dias ou definitivamente (a definitiva vale também para o email). */
let SUSPENSA=null;
async function verSuspensao(){if(!isFB()||isAnon())return;const ant=!!SUSPENSA;SUSPENSA=null;for(const p of ['bans/'+uid].concat(fbUser.email&&fbUser.emailVerified?['bansEmail/'+fbUser.email]:[])){try{const s=await FB.Fs.getDoc(fdoc(p));if(s.exists()){const v=s.data(),a=v.ate;if(!a||a.toMillis()>Date.now())SUSPENSA={ate:a?a.toMillis():0,motivo:v.motivo||''};}}catch(e){}}if(view==='comm'&&ant!==!!SUSPENSA)refresh();}
function suspensaoHTML(){return'<div class="x8lock" style="margin-top:14px">'+X8.nex('triste',100)+'<b>A tua conta está suspensa</b><p>'+(SUSPENSA.ate?'Até '+new Date(SUSPENSA.ate).toLocaleDateString('pt-PT',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})+'. ':'')+(SUSPENSA.motivo?'Motivo: '+esc(SUSPENSA.motivo)+'. ':'')+'Podes continuar a estudar, usar o tutor e ver o ranking, mas não podes publicar nem conversar. Para pedir uma revisão, escreve para pronex.protocol@gmail.com.</p><div class="x8btns" style="justify-content:center"><button class="x8p gh sm" data-x17tab="ai">Abrir o tutor</button><button class="x8p gh sm" data-x17tab="rank">Ver o ranking</button></div></div>';}
async function adminSuspender(u,dias,usr,motivo){const F=FB.Fs,b=F.writeBatch(FB.fs),email=(usr&&usr.email)||'',corpo={motivo:String(motivo||'').slice(0,200),por:uid,em:F.serverTimestamp()};if(dias)corpo.ate=F.Timestamp.fromMillis(Date.now()+dias*864e5);b.set(fdoc('bans/'+u),corpo);if(email)b.set(fdoc('bansEmail/'+email),corpo);await b.commit();await X8.audit('suspensao',u,(dias?dias+' dias':'definitiva')+': '+String(motivo||'').slice(0,120));}
async function adminLevantar(u,usr){const F=FB.Fs,b=F.writeBatch(FB.fs);b.delete(fdoc('bans/'+u));if(usr&&usr.email)b.delete(fdoc('bansEmail/'+usr.email));await b.commit();await X8.audit('suspensao_levantada',u,'');}
function bindAdmin(el){
  const re=el.querySelector('#adm-re');if(re)re.onclick=loadAdmin;
  const ex=el.querySelector('#adm-exp');if(ex)ex.onclick=()=>exportAll(ex);
  const q=el.querySelector('#adm-q');if(q)q.oninput=()=>{ADM.q=q.value;const pos=q.selectionStart;renderProfile();const n=document.getElementById('adm-q');if(n){n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}}};
  el.querySelectorAll('[data-af]').forEach(b=>b.onclick=()=>{ADM.f=b.dataset.af;renderProfile();});
  el.querySelectorAll('[data-au]').forEach(b=>b.onclick=()=>openAdminUser(b.dataset.au));bindDanger(el);bindAiKey(el);
  const F=FB&&FB.Fs;
  el.querySelectorAll('[data-ruser]').forEach(b=>b.onclick=()=>openAdminUser(b.dataset.ruser));
  /* 1.26: ignorar uma denúncia mostra outra vez o conteúdo que a tarefa escondeu e marca-o como revisto */
  el.querySelectorAll('[data-rok]').forEach(b=>b.onclick=async()=>{const r=ADM.rep.find(x=>x.id===b.dataset.rok);const c=r?(r.tipo==='post'?'posts/'+r.post:r.tipo==='com'?'posts/'+r.post+'/coments/'+r.com:r.tipo==='perfil'?'':'canais/'+r.canal+'/msgs/'+r.msg):'';
    if(c)try{await F.updateDoc(fdoc(c),{oculto:false,revisto:true});}catch(e){}
    F.deleteDoc(fdoc('denuncias/'+b.dataset.rok)).then(loadAdmin);});
  el.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=async()=>{const r=ADM.rep.find(x=>x.id===b.dataset.rdel);if(!r)return;
    try{if(r.tipo==='post')await F.deleteDoc(fdoc('posts/'+r.post));else if(r.tipo==='com')await F.deleteDoc(fdoc('posts/'+r.post+'/coments/'+r.com));else await F.deleteDoc(fdoc('canais/'+r.canal+'/msgs/'+r.msg));await F.deleteDoc(fdoc('denuncias/'+r.id));toast('Conteúdo apagado.');}catch(e){toast('Não foi possível apagar.');}loadAdmin();});
}
async function openAdminUser(u){if(!isOwner||!isFB())return;
  const usr=ADM.users.find(x=>x.id===u)||{},p=PERFIS[u]||{};
  closeSheet();const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet admsheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Dados do utilizador');
  sh.innerHTML='<span class="grab"></span><p class="dim">A carregar os dados…</p>';document.body.appendChild(bg);document.body.appendChild(sh);document.addEventListener('keydown',sheetKey);
  let docs=[];try{const s=await FB.Fs.getDocs(fcol('data/users/'+u));docs=s.docs.map(d=>Object.assign({_id:d.id},d.data()));}catch(e){}
  const days=docs.filter(d=>d._id.indexOf('dia_')===0).sort((a,b)=>a.date<b.date?1:-1);
  const its=days.flatMap(d=>d.items||[]),ok=its.filter(i=>i.ok).length;
  let h='<span class="grab"></span><div class="uph">'+avatar(p.nick||usr.nick||'?',p.cor|0,'lg',p.foto)+'<div style="min-width:0"><div class="eyebrow">'+(usr.anon?'Conta automática':'Conta ligada')+'</div><h2 style="font-size:1.4rem">'+esc(p.nick||usr.nick||'Sem nome')+'</h2><p class="muted" style="font-size:.86rem">'+esc(usr.email||'sem email')+(usr.criado?' · desde '+new Date(usr.criado).toLocaleDateString('pt-PT'):'')+' · visto '+ago(usr.ultimo)+'</p></div></div>';
  h+='<div class="kpis"><div class="kpi"><div class="v">'+num(p.xp)+'</div><div class="s">XP</div></div><div class="kpi"><div class="v">'+its.length+'</div><div class="s">exercícios</div></div><div class="kpi"><div class="v">'+(its.length?Math.round(ok/its.length*100)+'%':'—')+'</div><div class="s">acerto</div></div><div class="kpi"><div class="v">'+num(p.streak)+'</div><div class="s">dias seguidos</div></div></div>';
  h+='<h3 class="admh">Exercícios por dia</h3>'+(days.length?days.slice(0,30).map(d=>{const o=(d.items||[]).filter(i=>i.ok).length;return'<details class="aday"><summary><b>'+fmtDate(d.date)+'</b><span>'+o+'/'+(d.items||[]).length+' certos</span></summary>'+(d.items||[]).slice().reverse().slice(0,150).map(i=>'<div class="hrow"><span class="mk '+(i.ok?'ok':'bad')+'">'+(i.ok?'✓':'✗')+'</span><div class="tx"><b>'+esc(i.tn)+'</b>'+(i.ok?esc(i.cert):'Escolheu '+esc(i.esc)+' · certa '+esc(i.cert))+'</div><span class="tm">'+(MODE[i.mode]||'')+(i.ts?' · '+hhmm(i.ts):'')+'</span></div>').join('')+'</details>';}).join(''):'<p class="dim">Ainda sem exercícios.</p>');
  let susp=null;if(u!==uid){try{const bs=await FB.Fs.getDoc(fdoc('bans/'+u));if(bs.exists()&&(!bs.data().ate||bs.data().ate.toMillis()>Date.now()))susp=bs.data();if(!susp&&usr.email){const be=await FB.Fs.getDoc(fdoc('bansEmail/'+usr.email));if(be.exists()&&(!be.data().ate||be.data().ate.toMillis()>Date.now()))susp=be.data();}}catch(e){}}
  if(u!==uid)h+='<h3 class="admh">Moderação</h3><p class="dim" style="margin:0 0 8px">'+(susp?(susp.ate?'Suspensa até '+new Date(susp.ate.toMillis()).toLocaleDateString('pt-PT'):'Suspensão definitiva')+(susp.motivo?' · '+esc(susp.motivo):''):'Sem suspensão.')+'</p>'+(susp?'':'<input id="au-mot" type="text" maxlength="200" placeholder="Motivo: a pessoa vê este texto" style="width:100%;margin-bottom:8px">')+'<div class="acts">'+(susp?'<button class="btn" id="au-lev">Levantar suspensão</button>':'<button class="btn" data-sus="7">Suspender 7 dias</button><button class="btn" data-sus="30">Suspender 30 dias</button><button class="btn bad" data-sus="0">Suspensão definitiva</button>')+'</div>';
  h+='<div class="acts">'+(u!==uid?'<button class="btn bad" id="au-rs">Repor esta conta</button>':'')+'<button class="btn pri" id="au-ok">Fechar</button></div>'+(u!==uid?'<p class="hint" style="margin:0">Repor apaga o nome, a foto, as publicações e o histórico desta conta. O dispositivo dela volta ao ecrã de boas-vindas.</p>':'');
  sh.innerHTML=h;sh.querySelector('#au-ok').onclick=closeSheet;sh.querySelectorAll('[data-sus]').forEach(b=>b.onclick=async()=>{const mot=(sh.querySelector('#au-mot')||{}).value||'';if(!mot.trim()){toast('Escreve o motivo: os Termos prometem dizê-lo à pessoa.');return;}if(b.dataset.ok!=='1'){b.dataset.ok='1';b.textContent='Confirmar';return;}try{await adminSuspender(u,+b.dataset.sus,usr,mot.trim());toast('Conta suspensa.');openAdminUser(u);}catch(e){toast('Não foi possível suspender.');}});const lev=sh.querySelector('#au-lev');if(lev)lev.onclick=async()=>{try{await adminLevantar(u,usr);toast('Suspensão levantada.');openAdminUser(u);}catch(e){toast('Não foi possível levantar.');}};const rs=sh.querySelector('#au-rs');if(rs)rs.onclick=()=>{if(rs.dataset.ok!=='1'){rs.dataset.ok='1';rs.textContent='Confirmar: repor esta conta';return;}adminResetUser(u,rs);};
}
async function exportAll(btn){if(!isOwner||!isFB())return;btn.disabled=true;const F=FB.Fs;const out={app:'Pronex_Study',versao:APP_VERSION,gerado:new Date().toISOString(),utilizadores:[],perfis:PERFIS,posts:[]};
  try{if(ADM.state!=='ok')await loadAdmin();let i=0;
    for(const u of ADM.users){i++;btn.textContent='A copiar '+i+'/'+ADM.users.length+'…';let dados={};try{const s=await F.getDocs(fcol('data/users/'+u.id));s.docs.forEach(d=>dados[d.id]=d.data());}catch(e){}out.utilizadores.push(Object.assign({},u,{dados}));}
    try{const s=await F.getDocs(F.query(fcol('posts'),F.orderBy('ts','desc'),F.limit(500)));out.posts=s.docs.map(d=>Object.assign({id:d.id},d.data()));}catch(e){}
    for(const [c] of CHANS){try{const s=await F.getDocs(F.query(fcol('canais/'+c+'/msgs'),F.orderBy('ts','desc'),F.limit(500)));out['canal_'+c]=s.docs.map(d=>Object.assign({id:d.id},d.data()));}catch(e){}}
    const blob=new Blob([JSON.stringify(out,null,1)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='pronex-study-copia-'+today()+'.json';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},2000);
    toast('Cópia de segurança descarregada.');}
  catch(e){toast('Não foi possível fazer a cópia.');}
  btn.disabled=false;btn.innerHTML=IC.download.replace('<svg','<svg width="16" height="16"')+' Cópia de segurança';}

/* --- Repor contas: o administrador ordena, cada app limpa-se a si própria --- */
const LOCAL_KEYS=()=>{const ks=[KEY,HKEY,PKEY,'ps-tutor','ps-tip-link'];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.indexOf('ps-reg-')===0)ks.push(k);}}catch(e){}return ks;};
async function wipeSelf(){const F=FB.Fs;
  try{const s=await F.getDocs(fcol('data/users/'+uid));for(const d of s.docs){try{await F.deleteDoc(fdoc('data/users/'+uid+'/'+d.id));}catch(e){}}}catch(e){}
  try{await F.deleteDoc(fdoc('perfis/'+uid));}catch(e){}
  try{await F.deleteDoc(fdoc('utilizadores/'+uid));}catch(e){}
  try{LOCAL_KEYS().forEach(k=>localStorage.removeItem(k));}catch(e){}
  limparPessoal();try{await FB.Au.signOut(FB.auth);}catch(e){}
  location.reload();}
/* Devolve true se esta app foi reposta (e vai recarregar) */
async function checkReset(){if(!FB||!fbUser)return false;let cfg={};
  try{const s=await FB.Fs.getDoc(fdoc('config/app'));if(s.exists())cfg=s.data()||{};}catch(e){return false;}
  const r=Math.max(cfg.reset||0,(cfg.users&&cfg.users[fbUser.uid])||0);if(!r)return false;
  let seen=0;try{seen=+(localStorage.getItem('ps-reset')||0);}catch(e){}
  if(seen>=r)return false;
  try{localStorage.setItem('ps-reset',String(r));}catch(e){}
  const userHit=cfg.users&&cfg.users[fbUser.uid]&&cfg.users[fbUser.uid]>seen;
  const had=!!(ME.nick||HIST.length||userHit);
  if(!had||isOwner&&!userHit)return false;
  toast('A app foi reposta pelo administrador. A recomeçar…');await wipeSelf();return true;}
async function adminResetAll(btn){if(!isOwner||!isFB())return;const F=FB.Fs;btn.disabled=true;let n=0;
  const step=t=>{btn.textContent=t+' ('+n+')';};
  const now=Date.now();try{localStorage.setItem('ps-reset',String(now));}catch(e){}
  try{await F.setDoc(fdoc('config/app'),{reset:now,users:{},por:fbUser.email||'',em:new Date(now).toISOString()},{mergeFields:['reset','users','por','em']});
    const delAll=async path=>{const s=await F.getDocs(fcol(path));for(const d of s.docs){await F.deleteDoc(fdoc(path+'/'+d.id)).catch(()=>{});n++;}return s.docs;};
    step('A apagar publicações');const ps=await F.getDocs(fcol('posts'));for(const d of ps.docs){await delAll('posts/'+d.id+'/coments');await F.deleteDoc(fdoc('posts/'+d.id)).catch(()=>{});n++;step('A apagar publicações');}
    step('A apagar mensagens');for(const [c] of CHANS)await delAll('canais/'+c+'/msgs');
    step('A apagar denúncias');await delAll('denuncias');
    step('A apagar históricos');const us=await F.getDocs(fcol('utilizadores'));for(const u of us.docs){await delAll('data/users/'+u.id).catch(()=>{});}
    step('A apagar contas');await delAll('utilizadores');await delAll('perfis');
    toast('App reposta: '+n+' registos apagados. Cada dispositivo limpa-se ao abrir a app.');}
  catch(e){toast('A reposição parou: '+(e&&e.code||'erro')+'. Carrega outra vez para continuar.');}
  btn.disabled=false;btn.textContent='Repor a app para todos';
  lastSync='';syncProfile();registerUser();ADM.state='idle';loadAdmin();}
async function adminResetUser(u,btn){if(!isOwner||!isFB()||u===uid)return;const F=FB.Fs;btn.disabled=true;btn.textContent='A repor…';
  try{await F.setDoc(fdoc('config/app'),{users:{[u]:Date.now()}},{merge:true});
    const ps=await F.getDocs(fcol('posts'));for(const d of ps.docs){if(d.data().uid===u)await F.deleteDoc(fdoc('posts/'+d.id)).catch(()=>{});}
    const s=await F.getDocs(fcol('data/users/'+u));for(const d of s.docs)await F.deleteDoc(fdoc('data/users/'+u+'/'+d.id)).catch(()=>{});
    await F.deleteDoc(fdoc('perfis/'+u)).catch(()=>{});await F.deleteDoc(fdoc('utilizadores/'+u)).catch(()=>{});
    toast('Conta reposta. O nome, as publicações e o histórico foram apagados.');closeSheet();ADM.state='idle';loadAdmin();}
  catch(e){toast('Não foi possível repor esta conta.');btn.disabled=false;btn.textContent='Repor esta conta';}}
function dangerHTML(){return'<div class="card danger"><div class="eyebrow">Zona de perigo</div><h2>Repor a app para todos</h2><p class="muted">Apaga todos os nomes, perfis, fotos, publicações, comentários, mensagens, denúncias e históricos. Cada telemóvel ou computador limpa também o que tem guardado na próxima vez que abrir a app e volta ao ecrã de boas-vindas. Isto não se pode desfazer: faz primeiro uma cópia de segurança se quiseres guardar alguma coisa.</p>'+
  '<label class="f">Para confirmar, escreve REPOR<input type="text" id="rs-in" autocomplete="off" placeholder="REPOR"></label><div><button class="btn sm bad" id="rs-go" disabled>Repor a app para todos</button></div></div>';}
function bindDanger(el){const i=el.querySelector('#rs-in'),g=el.querySelector('#rs-go');if(!i||!g)return;i.oninput=()=>{g.disabled=i.value.trim()!=='REPOR';};g.onclick=()=>{if(i.value.trim()!=='REPOR')return;adminResetAll(g);};}

/* ================= v1.6: hábitos, feedback e acabamento ================= */
const pl=(n,s,p)=>n+' '+(n===1?s:p);
Object.assign(IC,{
 snow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.4-3 7.7-7 9-4-1.3-7-4.6-7-9V6z"/><path d="M12 8v8M8.5 10l7 4M15.5 10l-7 4"/></svg>',
 cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
});

/* --- Proteção de sequência: ganhas 1 a cada 7 dias seguidos (máx. 2); usa-se sozinha se falhares um dia --- */
st.frz=st.frz||{have:0,used:[],lastKey:''};
const frzDays=()=>new Set((st.frz&&st.frz.used)||[]);
function activeDaySet(){const ds=new Set(HIST.filter(d=>d.items&&d.items.some(i=>i.ts)).map(d=>d.date));frzDays().forEach(x=>ds.add(x));return ds;}
streakOf=function(){const ds=activeDaySet();let s=0;const d=new Date();if(!ds.has(dstr(d)))d.setDate(d.getDate()-1);while(ds.has(dstr(d))){s++;d.setDate(d.getDate()-1);}return s;};
bestStreak=function(){const ds=[...activeDaySet()].sort();let b=0,c=0,prev=null;ds.forEach(x=>{const dt=new Date(x+'T12:00:00');if(prev&&(dt-prev)/864e5<1.5)c++;else c=1;b=Math.max(b,c);prev=dt;});return b;};
function frzTick(){const F=st.frz,ds=activeDaySet();let changed=false;
  // usar: dias em falta entre o último dia ativo e ontem
  const y=new Date();y.setDate(y.getDate()-1);const gap=[];const d=new Date(y);
  for(let i=0;i<4&&!ds.has(dstr(d));i++){gap.push(dstr(d));d.setDate(d.getDate()-1);}
  if(gap.length&&gap.length<=F.have&&ds.has(dstr(d))){gap.forEach(x=>F.used.push(x));F.have-=gap.length;changed=true;
    setTimeout(()=>toast('Usaste '+pl(gap.length,'proteção','proteções')+'. A tua sequência de '+streakOf()+' dias continua.'),1500);}
  // ganhar: ao chegar a 7, 14, 21… dias seguidos
  const s=streakOf();if(s>0&&s%7===0&&ds.has(today())&&F.lastKey!==today()&&F.have<2){F.have++;F.lastKey=today();changed=true;setTimeout(()=>toast('Ganhaste uma proteção de sequência por '+s+' dias seguidos.'),1200);}
  F.used=F.used.slice(-60);if(changed)save();}

/* --- Celebração do objetivo diário --- */
function celebrateGoal(){const s=streakOf(),mile={3:'3 dias seguidos. O hábito está a começar.',7:'Uma semana inteira! Ganhaste uma proteção de sequência.',14:'Duas semanas seguidas. Isto já é rotina.',30:'Um mês inteiro. Poucos chegam aqui.',50:'50 dias. Lendário.',100:'100 dias seguidos. Impressionante.'}[s];
  const o=document.createElement('div');o.className='celeb';o.setAttribute('role','dialog');o.setAttribute('aria-label','Objetivo cumprido');
  o.innerHTML='<div class="cbox"><div class="cflame">'+IC.flame+'</div><div class="eyebrow">Objetivo de hoje cumprido</div><h1><span class="gt">'+s+'</span> '+(s===1?'dia seguido':'dias seguidos')+'</h1><p class="muted">'+(mile||'Voltaste a cumprir. Amanhã, mais um dia para a sequência.')+'</p>'+
    '<div class="cweek">'+weekData().map(w=>'<div class="'+(w.n>=1?'on':'')+(w.today?' today':'')+'"><i>'+(w.n>=1?IC.check:'')+'</i><span>'+w.lab+'</span></div>').join('')+'</div>'+
    '<button class="btn pri" id="cel-ok" style="min-width:220px">Continuar</button></div>';
  document.body.appendChild(o);rain();tone(SND.win);haptic([20,40,20]);const b=o.querySelector('#cel-ok');b.focus();b.onclick=()=>o.remove();o.onclick=e=>{if(e.target===o)o.remove();};}

/* --- Data do teste --- */
function testDays(){if(!ME.teste)return null;const t=new Date(ME.teste+'T09:00:00'),n=new Date();n.setHours(0,0,0,0);const d=Math.round((t-n)/864e5);return d>=0?d:null;}
function testCardHTML(){const d=testDays();
  if(d===null)return'<button class="card tcard empty" data-go2="profile" data-tab="edit"><span class="ti">'+IC.cal+'</span><div><b>Quando é o teu próximo teste?</b><span>Marca a data e a app diz-te quanto falta e o que treinar.</span></div><span class="arr">→</span></button>';
  const msg=d===0?'O teste é hoje. Faz uma revisão rápida aos pontos fracos.':d===1?'O teste é amanhã. Faz uma simulação completa hoje.':d<=7?'Faz uma simulação por dia até ao teste.':'Treina um pouco todos os dias até lá.';
  return'<div class="card tcard"><span class="ti">'+IC.cal+'</span><div><b>'+(d===0?'Teste hoje':d===1?'Teste amanhã':'Faltam '+d+' dias para o teste')+'</b><span>'+msg+'</span></div><button class="btn sm pri" id="tc-sim">'+(d<=1?'Rever agora':'Fazer simulação')+'</button></div>';}

/* --- Ligas da semana --- */
const TIERS=[[0,'Bronze','#c8875a'],[100,'Prata','#b9c3d6'],[250,'Ouro','#f5c542'],[500,'Safira','#4f8cff'],[900,'Diamante','#5ef0ff']];
function tierOf(x){let t=TIERS[0];TIERS.forEach(r=>{if(x>=r[0])t=r;});const i=TIERS.indexOf(t),nx=TIERS[i+1];return{name:t[1],col:t[2],next:nx?nx[1]:null,need:nx?nx[0]-x:0};}
function tierTag(x){const t=tierOf(x);return'<span class="tier" style="--tc:'+t[2]+';--tc:'+t.col+'">'+t.name+'</span>';}

/* --- Esqueletos de carregamento --- */
const skelPosts=()=>[0,1].map(()=>'<div class="card post skel-card"><div class="sk-row"><span class="sk sk-av"></span><div style="flex:1;display:flex;flex-direction:column;gap:6px"><span class="sk" style="width:40%"></span><span class="sk" style="width:22%;height:9px"></span></div></div><span class="sk" style="width:92%"></span><span class="sk" style="width:70%"></span><span class="sk sk-img"></span></div>').join('');
const skelMsgs=()=>[60,80,45].map(w=>'<div class="msg"><span class="sk sk-av sm"></span><div style="flex:1;display:flex;flex-direction:column;gap:6px"><span class="sk" style="width:25%"></span><span class="sk" style="width:'+w+'%"></span></div></div>').join('');
const skelRank=()=>[0,1,2,3].map(()=>'<div class="rrow skel-card"><span class="sk" style="width:20px"></span><span class="sk sk-av"></span><div style="display:flex;flex-direction:column;gap:6px"><span class="sk" style="width:120px"></span><span class="sk" style="width:80px;height:9px"></span></div><span class="sk" style="width:50px"></span></div>').join('');
function emptyHTML(icon,title,text,btn){return'<div class="estate"><span class="ei">'+icon+'</span><b>'+title+'</b><p>'+text+'</p>'+(btn||'')+'</div>';}

/* 1.36: a ligação direta à API Gemini foi retirada: a IA na nuvem não é permitida na app.
   O Nex corre no dispositivo (nex.js e IA8, em 06-entrada-definicoes.js, que substitui estas funções). */
let aiCfg='ok';
async function loadAiKey(){}
function aiKeyCardHTML(){return'';}
function bindAiKey(){}

var HISTSRV=false,SYNCWAIT=Date.now();
/* ================= v1.8: entrada com conta, consentimento, turma, notificações, definições, PIN do painel ================= */
/* Nex — mascote original da Pronex_Study (SVG, 6 poses + chama). viewBox 0 0 200 210 */
const NEX=(()=>{
  const D='#090C18',L='#9178E6',LB='#B3A2FF',Y='#FFC93C',P='#E879C0',W='#F4F2FF',C='#7FE7FF';
  const SH='M100 34c34 0 62 9 62 9v66c0 40-28 66-62 77-34-11-62-37-62-77V43s28-9 62-9z';
  const body=`<path d="${SH}" fill="${L}" stroke="${D}" stroke-width="6" stroke-linejoin="round"/>
<path d="M100 150c22-6 42-20 50-44v8c0 32-22 54-50 64-28-10-50-32-50-64v-8c8 24 28 38 50 44z" fill="${LB}" opacity=".55"/>`;
  const CR='M66 41l6-26 15 13 13-20 13 20 15-13 6 26z';
  const rim=`<path d="${SH}" fill="${W}" stroke="${W}" stroke-width="16" stroke-linejoin="round"/><path d="${CR}" fill="${W}" stroke="${W}" stroke-width="14" stroke-linejoin="round"/>`;
  const crown=`<path d="${CR}" fill="${Y}" stroke="${D}" stroke-width="5" stroke-linejoin="round"/><circle cx="100" cy="10" r="3.5" fill="${D}"/>`;
  const visor=`<rect x="54" y="70" width="92" height="46" rx="23" fill="${D}"/>`;
  const feet=`<ellipse cx="78" cy="197" rx="16" ry="9" fill="${L}" stroke="${D}" stroke-width="5"/><ellipse cx="122" cy="197" rx="16" ry="9" fill="${L}" stroke="${D}" stroke-width="5"/>`;
  const cheeks=`<ellipse cx="62" cy="126" rx="8" ry="5" fill="${P}" opacity=".85"/><ellipse cx="138" cy="126" rx="8" ry="5" fill="${P}" opacity=".85"/>`;
  const eyesOpen=(dx=0,dy=0)=>`<ellipse cx="${80+dx}" cy="${93+dy}" rx="9" ry="12" fill="${W}"/><ellipse cx="${120+dx}" cy="${93+dy}" rx="9" ry="12" fill="${W}"/><circle cx="${83+dx}" cy="${88+dy}" r="3" fill="${C}"/><circle cx="${123+dx}" cy="${88+dy}" r="3" fill="${C}"/>`;
  const eyesHappy=`<path d="M70 97q10-14 20 0M110 97q10-14 20 0" fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"/>`;
  const eyesClosed=`<path d="M70 94q10 8 20 0M110 94q10 8 20 0" fill="none" stroke="${W}" stroke-width="5" stroke-linecap="round"/>`;
  const eyesSad=`<ellipse cx="80" cy="97" rx="8" ry="9" fill="${W}"/><ellipse cx="120" cy="97" rx="8" ry="9" fill="${W}"/><path d="M68 89l18-6M132 89l-18-6" stroke="${W}" stroke-width="4" stroke-linecap="round"/>`;
  const wink=`<ellipse cx="80" cy="93" rx="9" ry="12" fill="${W}"/><circle cx="83" cy="88" r="3" fill="${C}"/><path d="M110 95q10-10 20 0" fill="none" stroke="${W}" stroke-width="6" stroke-linecap="round"/>`;
  const smile=`<path d="M88 128q12 12 24 0" fill="none" stroke="${D}" stroke-width="5" stroke-linecap="round"/>`;
  const open=`<path d="M86 126h28q-2 18-14 18t-14-18z" fill="${D}"/><path d="M92 136q8 6 16 0" fill="${P}"/>`;
  const flat=`<path d="M91 131h18" stroke="${D}" stroke-width="5" stroke-linecap="round"/>`;
  const frown=`<path d="M89 135q11-9 22 0" fill="none" stroke="${D}" stroke-width="5" stroke-linecap="round"/>`;
  const oh=`<ellipse cx="100" cy="132" rx="5" ry="6" fill="${D}"/>`;
  const arm=(x1,y1,x2,y2)=>`<path d="M${x1} ${y1}L${x2} ${y2}" stroke="${W}" stroke-width="28" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${D}" stroke-width="20" stroke-linecap="round"/><path d="M${x1} ${y1}L${x2} ${y2}" stroke="${L}" stroke-width="11" stroke-linecap="round"/>`;
  const armsDown=arm(42,118,28,146)+arm(158,118,172,146);
  const armsUp=arm(42,104,22,72)+arm(158,104,178,72);
  const spark=(x,y,s=1,c=Y)=>`<path transform="translate(${x} ${y}) scale(${s})" d="M0-10C1-3 3-1 10 0 3 1 1 3 0 10-1 3-3 1-10 0-3-1-1-3 0-10z" fill="${c}" stroke="${D}" stroke-width="2.5" stroke-linejoin="round"/>`;
  const base=(face,arms,extra='')=>`${arms}${feet}${rim}${body}${crown}${visor}${face}${cheeks}${extra}`;
  const POSES={
    normal:()=>base(eyesOpen()+smile,armsDown),
    festejar:()=>base(eyesHappy+open,armsUp,spark(20,40,1.1)+spark(182,46,.9,C)+spark(170,12,.7,P)),
    pensar:()=>base(eyesOpen(6,-4)+flat,arm(42,118,28,146)+arm(158,120,128,136),`<g transform="translate(160 28)"><circle r="18" fill="${W}" stroke="${D}" stroke-width="4"/><text y="8" text-anchor="middle" font-family="Bricolage Grotesque,Arial Black,sans-serif" font-weight="800" font-size="24" fill="${D}">?</text></g>`),
    dormir:()=>base(eyesClosed+oh,armsDown,`<text x="150" y="44" font-family="Bricolage Grotesque,Arial Black,sans-serif" font-weight="800" font-size="24" fill="${LB}">z</text><text x="166" y="24" font-family="Bricolage Grotesque,Arial Black,sans-serif" font-weight="800" font-size="16" fill="${LB}">z</text>`),
    incentivar:()=>base(wink+smile,arm(42,118,28,146)+arm(158,108,176,78),`<circle cx="178" cy="72" r="9" fill="${L}" stroke="${D}" stroke-width="5"/>`+spark(30,50,.7,C)),
    triste:()=>base(eyesSad+frown,arm(42,122,34,152)+arm(158,122,166,152),`<path d="M138 104q4 8 0 12q-4-4 0-12z" fill="${C}"/>`),
    chama:()=>base(eyesHappy+smile,arm(42,118,28,146)+arm(158,108,174,82),`<path d="M176 30c10 12 14 22 8 34-4 8-14 12-22 8-10-4-12-16-6-26 2 6 6 8 8 6-4-8 2-16 12-22z" fill="#FF7A3D" stroke="${D}" stroke-width="4" stroke-linejoin="round"/><path d="M172 56c4 4 4 10 0 12-4 1-7-2-6-6z" fill="${Y}"/>`)
  };
  return function(pose,size,cls){const f=POSES[pose]||POSES.normal;return`<svg class="nex ${cls||''} nex-${pose}" viewBox="-8 -8 216 222" width="${size||96}" height="${Math.round((size||96)*1.03)}" role="img" aria-label="Nex, a mascote da Pronex_Study">${f()}</svg>`;};
})();


const LEGAL={v:'1.4',data:'6 de novembro de 2026'};
const LEGAL_BASE=IS_APP?'legal/':'https://pronexprotocol-ui.github.io/pronex_study/legal/';
