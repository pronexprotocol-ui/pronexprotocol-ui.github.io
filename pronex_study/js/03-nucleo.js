/* Pronex_Study · 03-nucleo.js
   Núcleo: ícones, estado guardado no dispositivo, histórico, ligação à conta (Firebase), novidades de cada versão e lições.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* ================= Ícones ================= */
const IC={
 home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/></svg>',
 study:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7"/></svg>',
 comm:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.4A8 8 0 1121 12z"/></svg>',
 profile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>',
 flame:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-6 1-9.5z"/></svg>',
 bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
 spark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>',
 calc:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
 code:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/></svg>',
 brain:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 4a3 3 0 00-3 3 3 3 0 00-2 5 3 3 0 002 5 3 3 0 006 1V5a2 2 0 00-3-1zM15 4a3 3 0 013 3 3 3 0 012 5 3 3 0 01-2 5 3 3 0 01-6 1"/></svg>',
 owl:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l9 4-9 4-9-4zM7 9v5c0 2 2.5 3 5 3s5-1 5-3V9"/></svg>',
 book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6c-2-1.5-5-2-8-1v14c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1zM12 6v14"/></svg>',
 pen:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3"/></svg>',
 col:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V10M9.5 21V10M14.5 21V10M19 21V10M2 10l10-6 10 6z"/></svg>',
 globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></svg>',
 trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 4h8v5a4 4 0 01-8 0zM8 6H4a3 3 0 003 4M16 6h4a3 3 0 01-3 4M12 13v4M8 21h8M9 17h6"/></svg>',
 target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>',
 check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12l5 5 9-10"/></svg>',
 star:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7z"/></svg>',
 crown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18h18L19 7l-4 4-3-6-3 6-4-4z"/></svg>',
 info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>'
};

/* ================= Disciplinas ================= */
const SUBJ=[
 {id:'mat',n:'Matemática',ic:'calc',g:'g0',on:true,mods:[{id:'p1',n:'P1 · Modelos matemáticos para a cidadania',d:'Eleições, partilha, salários, IRS, juros e crédito'}]},
 {id:'py',n:'Python',ic:'code',g:'g1'},
 {id:'fil',n:'Filosofia',ic:'owl',g:'g2'},
 {id:'psi',n:'Psicologia',ic:'brain',g:'g3'},
 {id:'pt',n:'Português',ic:'book',g:'g4'},
 {id:'des',n:'Desenho A',ic:'pen',g:'g2'},
 {id:'hca',n:'História e Cultura das Artes',ic:'col',g:'g5'},
 {id:'ing',n:'Inglês',ic:'globe',g:'g1'}
];

/* ================= Estado local ================= */
const IS_APP=!(window.claude&&window.claude.use)&&!/claude\.ai|claudeusercontent/.test(location.hostname);
const CLAUDE_URL='https://claude.ai/artifact/611U6xFmbo6Nf246ycRAu4';
const KEY='treino-p1-260-v1';
let st={ans:{},pads:{},notes:{},v:{},sess:null,showAll:false,imported:false};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s&&s.ans)st=Object.assign(st,s);}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}};
const keyV=(t,v,n)=>t+'.'+v+'.'+n;
/* 1.21: os exercícios de duelo (n de 700000 a 1199999) usam sempre a mesma variante, para os dois jogadores terem exercícios iguais */
const DUELN=n=>n>=700000&&n<1200000;
const K=(t,n)=>keyV(t,DUELN(n)?0:(st.v[t]||0),n);
const cache=new Map();
function exV(t,v,n){const k=keyV(t,v,n);if(!cache.has(k)){const g=G(mulberry32((t+1)*1000003+v*7919+n*104729+12345));cache.set(k,TYPES[t].g(g,n));}return cache.get(k);}
const ex=(t,n)=>exV(t,DUELN(n)?0:(st.v[t]||0),n);
const HIDE=new Set([5,7,8,9,10]),EASY=new Set([0,1,2,3,4,6]);
const CNT=t=>EASY.has(t)?3:5;
const active=()=>TYPES.map((_,t)=>t).filter(t=>st.showAll||!HIDE.has(t));
const TEMAS=['Eleições','Partilha','Finanças','Estatística'];
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{v=Number(v);return Number.isFinite(v)?Math.max(0,Math.floor(v)):0;};
let toastT=null;function toast(m){const t=document.getElementById('toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,Math.min(4200,1600+m.length*35));}

/* ================= Histórico, perfil e comunidade ================= */
const HKEY='treino-p1-hist-v1',PKEY='pronex-study-perfil-v1';
let HIST=[];try{HIST=JSON.parse(localStorage.getItem(HKEY)||'[]');}catch(e){HIST=[];}
let ME={nick:'',curso:'Multimédia',escola:'',bio:'',cor:0,goal:15,ranking:true,ai:0};
try{const p=JSON.parse(localStorage.getItem(PKEY)||'null');if(p)ME=Object.assign(ME,p);}catch(e){}
let hasProfile=!!ME.nick;
let storeMode='local',db=null,uid=null,userCap=null,sampleFn=null,isOwner=false;
let PERFIS={},perfisLoaded=false; // uid -> perfil público
const saveHistLocal=()=>{try{localStorage.setItem(HKEY,JSON.stringify(HIST));}catch(e){}};
const saveMeLocal=()=>{try{localStorage.setItem(PKEY,JSON.stringify(ME));}catch(e){}};
const allItems=()=>HIST.flatMap(d=>d.items||[]);
const dstr=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dstr(new Date());
let writeQ=Promise.resolve();
const dayDoc=date=>db.doc('data/users/'+uid+'/dia_'+date);
function persistDay(date){const day=HIST.find(d=>d.date===date);if(!day)return;saveHistLocal();
  if(storeMode!=='db')return;putDay(date,day.items,day.goal||ME.goal||15);}
/* 1.19: o dia junta-se ao que já está no servidor (arrayUnion) em vez de o substituir:
   dois dispositivos, ou um que esteve sem rede, nunca apagam exercícios um do outro. */
function putDay(date,items,goal){
  if(BACKEND==='firebase'&&FB&&FB.Fs&&uid&&items.length<=390){const F=FB.Fs;
    return F.setDoc(fdoc('data/users/'+uid+'/dia_'+date),Object.assign({date,items:F.arrayUnion(...items)},goal?{goal}:{}),{merge:true}).catch(()=>{});}
  const body={date,items:items.slice(-400)};if(goal)body.goal=goal;writeQ=writeQ.then(()=>dayDoc(date).set(body)).catch(()=>{});return writeQ;}
const dedupeItems=a=>{const m=new Map();a.forEach(i=>{if(i)m.set(i.ts+'|'+i.q,i);});return[...m.values()].sort((x,y)=>N0(x.ts)-N0(y.ts));};
const N0=v=>Number.isFinite(+v)?+v:0;
function record(t,n,g,mode){
  const E=ex(t,n),ok=g===E.a,date=today();
  const kk=K(t,n);st.seen=st.seen||{};st.rtk=st.rtk||{};const rt=st.seen[kk]?1:0;st.seen[kk]=1;if(rt)st.rtk[kk]=1;else delete st.rtk[kk];save();
  let day=HIST.find(d=>d.date===date);if(!day){day={date,goal:ME.goal||15,items:[]};HIST.unshift(day);}if(!day.goal)day.goal=ME.goal||15;
  const it={ts:Date.now(),t,tn:TYPES[t].n,tema:TYPES[t].t,q:E.q,esc:E.o[g],cert:E.o[E.a],ok,mode,k:kk};if(rt)it.rt=1;day.items.push(it);
  persistDay(date);syncProfile();
}
function importOld(){
  if(st.imported)return;st.imported=true;save();const items=[];
  Object.entries(st.ans).forEach(([k,g])=>{const [t,v,n]=k.split('.').map(Number);if(!TYPES[t])return;const E=exV(t,v,n);
    items.push({ts:0,t,tn:TYPES[t].n,tema:TYPES[t].t,q:E.q,esc:E.o[g],cert:E.o[E.a],ok:g===E.a,mode:'antes'});});
  if(!items.length)return;if(!HIST.find(d=>d.date==='0000-anteriores'))HIST.push({date:'0000-anteriores',items});persistDay('0000-anteriores');
}

/* --- Gamificação --- */
const LV=['Recruta','Aprendiz','Estudante','Focado','Dedicado','Avançado','Especialista','Mestre','Lenda'];
function xpOf(items){let x=0;items.forEach(i=>{if(!i.rt)x+=i.ok?10:2;});
  const sims={};items.filter(i=>i.mode==='sim').forEach(i=>{const k=Math.floor((i.ts||0)/3600000);sims[k]=(sims[k]||0)+1;});x+=Object.values(sims).filter(c=>c>=14).length*50;return x;}
function levelOf(xp){let n=1,need=100,acc=0;while(xp>=acc+need){acc+=need;n++;need+=60;}return{n,name:LV[Math.min(n-1,LV.length-1)],into:xp-acc,need};}
function streakOf(){const ds=new Set(HIST.filter(d=>d.items&&d.items.some(i=>i.ts)).map(d=>d.date));let s=0;const d=new Date();if(!ds.has(dstr(d)))d.setDate(d.getDate()-1);while(ds.has(dstr(d))){s++;d.setDate(d.getDate()-1);}return s;}
function bestStreak(){const ds=[...new Set(HIST.filter(d=>d.items&&d.items.some(i=>i.ts)).map(d=>d.date))].sort();let b=0,c=0,prev=null;
  ds.forEach(x=>{const dt=new Date(x+'T12:00:00');if(prev&&(dt-prev)/864e5<1.5)c++;else c=1;b=Math.max(b,c);prev=dt;});return b;}
const todayCount=()=>realItems((HIST.find(d=>d.date===today())||{items:[]}).items).length;
function typeAgg(){const m={};allItems().forEach(i=>{if(!TYPES[i.t])return;const a=m[i.t]||(m[i.t]={t:i.t,d:0,o:0,last:0});a.d++;if(i.ok)a.o++;a.last=Math.max(a.last,i.ts||0);});return m;}
function temaMastered(tema){const agg=typeAgg();const ts=active().filter(t=>TYPES[t].t===tema);return ts.length&&ts.every(t=>agg[t]&&agg[t].d>=3&&agg[t].o/agg[t].d>=.8);}
function bestSim(){const it=allItems().filter(i=>i.mode==='sim'&&i.ts);const g={};it.forEach(i=>{const k=Math.floor(i.ts/3600000);(g[k]=g[k]||[]).push(i);});
  let best=null;Object.values(g).forEach(a=>{if(a.length>=14){const o=a.filter(i=>i.ok).length;if(!best||o>best)best=o;}});return best;}
const BADGES=[
 {id:'first',n:'Primeiro passo',d:'Fazer o primeiro exercício',ic:'check',ok:()=>allItems().length>=1},
 {id:'g1',n:'Objetivo cumprido',d:'Cumprir o objetivo diário',ic:'target',ok:()=>HIST.some(d=>d.date!=='0000-anteriores'&&(d.items||[]).length>=ME.goal)},
 {id:'s3',n:'Em chamas',d:'3 dias seguidos a estudar',ic:'flame',ok:()=>bestStreak()>=3},
 {id:'s7',n:'Semana firme',d:'7 dias seguidos a estudar',ic:'flame',ok:()=>bestStreak()>=7},
 {id:'c50',n:'Meia centena',d:'50 exercícios feitos',ic:'bolt',ok:()=>allItems().length>=50},
 {id:'c200',n:'Máquina',d:'200 exercícios feitos',ic:'bolt',ok:()=>allItems().length>=200},
 {id:'sim',n:'Prova real',d:'Completar uma simulação do teste',ic:'trophy',ok:()=>bestSim()!=null},
 {id:'sim12',n:'Pronto para o teste',d:'12 ou mais certas numa simulação',ic:'crown',ok:()=>(bestSim()||0)>=12},
 {id:'ele',n:'Mestre das eleições',d:'80% em todos os tipos de Eleições',ic:'star',ok:()=>temaMastered('Eleições')},
 {id:'fin',n:'Contas em dia',d:'80% em todos os tipos de Finanças',ic:'star',ok:()=>temaMastered('Finanças')},
 {id:'ai',n:'Curioso',d:'Fazer uma pergunta ao Nex',ic:'spark',ok:()=>(ME.ai||0)>=1},
 {id:'chat',n:'Na comunidade',d:'Enviar uma mensagem',ic:'comm',ok:()=>!!ME.sent}
];
function stats(){const it=allItems(),xp=xpOf(it)+missionXP(),lv=levelOf(xp),ok=it.filter(i=>i.ok).length;return{it,xp,lv,ok,total:it.length,streak:streakOf(),today:todayCount(),badges:BADGES.filter(b=>b.ok()).length};}

/* --- Sincronizar perfil público --- */
let syncT=null,lastSync='';
function syncProfileOld(){saveMeLocal();if(!db||!uid||!hasProfile)return;clearTimeout(syncT);syncT=setTimeout(()=>{
  const S=stats();const body={nick:ME.nick.slice(0,30),curso:ME.curso.slice(0,40),escola:ME.escolaPub?ME.escola.slice(0,60):'',bio:ME.bio.slice(0,160),foto:safeImg(ME.foto)||'',cor:ME.cor|0,goal:ME.goal|0,ranking:!!ME.ranking,ai:ME.ai|0,sent:!!ME.sent,
    xp:S.xp,wxp:weekXP(),wk:weekId(Date.now()),nivel:S.lv.n,streak:S.streak,total:S.total,certos:S.ok,badges:S.badges,upd:Date.now()};
  const sig=JSON.stringify(Object.assign({},body,{upd:0}));if(sig===lastSync)return;lastSync=sig;
  db.doc('perfis/'+uid).set(body).catch(()=>{lastSync='';});},1200);}

/* ================= Ligação à nuvem (Claude ou Firebase) ================= */
const AI_MODEL='gemini-3.5-flash',FB_VER='12.19.0',OWNER_EMAIL='pronex.protocol@gmail.com';
const HAS_FB=()=>IS_APP&&!!(window.FIREBASE_CONFIG&&window.FIREBASE_CONFIG.apiKey);
let authErr='',FB=null,fbUser=null,BACKEND=IS_APP?'local':'claude',SUBS=[];
function stopSync(){SUBS.forEach(u=>{try{u();}catch(e){}});SUBS=[];if(typeof unsubChat==='function'&&unsubChat){try{unsubChat();}catch(e){}}unsubChat=null;chatState='idle';msgs=[];PERFIS={};if(typeof stopMural==='function')stopMural();}
function startDbSync(){
  stopSync();MYP=undefined;if(BACKEND==='firebase'&&FB&&uid)SUBS.push(FB.Fs.onSnapshot(fdoc('perfis/'+uid),s=>{const first=MYP===undefined;MYP=s.exists()?s.data():null;
    /* 1.19: se este dispositivo ainda não tem o perfil desta conta, vem do servidor (mesmo fora dos perfis carregados para o ranking) */
    if(first&&MYP&&MYP.nick&&!hasProfile){ME=Object.assign(ME,{nick:MYP.nick||'',curso:MYP.curso||'',escola:MYP.escola||'',escolaPub:!!MYP.escola,bio:MYP.bio||'',foto:MYP.foto||'',cor:MYP.cor|0,goal:MYP.goal||15,ranking:MYP.ranking!==false,ai:MYP.ai|0,sent:!!MYP.sent});hasProfile=true;st.onb=true;save();saveMeLocal();refresh();}
    if(first){lastSync='';syncProfile();}},()=>{MYP=null;}));
  SUBS.push(db.collection('data/users/'+uid).onSnapshot(snap=>{
    HISTSRV=!(snap.metadata&&snap.metadata.fromCache);const remote=snap.docs.filter(d=>d.id.indexOf('dia_')===0).map(d=>d.data()).filter(x=>x&&x.date).map(d=>({date:d.date,goal:d.goal,items:dedupeItems(d.items||[])}));
    /* 1.21: «repetido» passa a ser da conta: o que a conta já fez noutro dispositivo também conta como feito */
    try{st.seen=st.seen||{};remote.forEach(d=>(d.items||[]).forEach(i=>{if(i&&i.k)st.seen[i.k]=1;}));}catch(e){}
    const wasLocal=storeMode!=='db';storeMode='db';
    if(wasLocal){HIST.forEach(ld=>{const r=remote.find(x=>x.date===ld.date);
      if(!r){remote.push({date:ld.date,goal:ld.goal,items:ld.items.slice()});putDay(ld.date,ld.items,ld.goal);}
      else{const seen=new Set(r.items.map(i=>i.ts+'|'+i.q));const extra=ld.items.filter(i=>!seen.has(i.ts+'|'+i.q));if(extra.length){r.items=r.items.concat(extra).sort((a,b)=>a.ts-b.ts);putDay(ld.date,extra,r.goal||ld.goal);}}});}
    HIST=remote.sort((a,b)=>a.date<b.date?1:-1);saveHistLocal();lastSync='';syncProfile();refresh();
  },()=>{storeMode='local';refresh();}));
  /* 1.19: os perfis vêm ordenados (os 300 com mais XP e os 150 com mais XP da semana), em vez dos primeiros 300 por ordem do id */
  const PQ={a:{},b:{}};
  const onP=k=>snap=>{const m={};snap.docs.forEach(d=>{const x=d.data();if(x)m[d.id]=x;});PQ[k]=m;
    const all=Object.assign({},PQ.b,PQ.a);if(typeof MYP!=='undefined'&&MYP&&!all[uid])all[uid]=MYP;onPerfis(all);};
  SUBS.push(db.collection('perfis').orderBy('wxp','desc').limit(150).onSnapshot(onP('b'),()=>{}));
  SUBS.push(db.collection('perfis').orderBy('xp','desc').limit(300).onSnapshot(onP('a'),()=>{}));
}
function onPerfis(m){{
    PERFIS=m;perfisLoaded=true;
    const mine=m[uid];if(mine&&!hasProfile){ME=Object.assign(ME,{nick:mine.nick||'',curso:mine.curso||'',escola:mine.escola||'',bio:mine.bio||'',foto:mine.foto||'',cor:mine.cor|0,goal:mine.goal||15,ranking:mine.ranking!==false,ai:mine.ai|0,sent:!!mine.sent});hasProfile=!!ME.nick;st.onb=true;save();saveMeLocal();const o=document.getElementById('onb');if(o)o.remove();}
    /* 1.27: as mudanças nos perfis dos colegas chegam aos montes; junta-as e redesenha uma vez, sem perder o foco */
    if(view==='comm'||view==='home'||view==='profile'){clearTimeout(onPerfis.t);onPerfis.t=setTimeout(()=>{
      if(!(view==='comm'||view==='home'||view==='profile'))return;
      const ae=document.activeElement,sel=ae&&ae!==document.body?(ae.id?'#'+CSS.escape(ae.id):[...ae.attributes].filter(a=>a.name.startsWith('data-')).map(a=>'['+a.name+'="'+CSS.escape(a.value)+'"]').join('')):'';
      if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName))return;
      const y=scrollY;refresh();if(sel){try{const n=document.querySelector(sel);if(n){n.focus({preventScroll:true});scrollTo(0,y);}}catch(e){}}},700);}
  }
}
/* Firestore com a mesma forma de chamadas que a versão Claude usa */
function fsAdapter(fs,F){
  const wrap=d=>({id:d.id,data:()=>d.data()});
  const q=(path,cons)=>({
    orderBy:(f,dir)=>q(path,cons.concat([F.orderBy(f,dir||'asc')])),
    limit:n=>q(path,cons.concat([F.limit(n)])),
    onSnapshot:(next,err)=>F.onSnapshot(F.query(F.collection(fs,path),...cons),s=>next({docs:s.docs.map(wrap)}),err),
    add:data=>F.addDoc(F.collection(fs,path),data)});
  return{doc:p=>({set:d=>F.setDoc(F.doc(fs,p),d),delete:()=>F.deleteDoc(F.doc(fs,p))}),collection:p=>q(p,[])};
}
async function connectFirebase(){
  const base='https://www.gstatic.com/firebasejs/'+FB_VER+'/';
  const [A,Au,Fs,Ai]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js'),import(base+'firebase-ai.js').catch(()=>null)]);
  const app=A.initializeApp(window.FIREBASE_CONFIG);
  const auth=Au.getAuth(app);try{auth.languageCode='pt';}catch(e){}
  let fs;try{fs=Fs.initializeFirestore(app,{localCache:Fs.persistentLocalCache()});}catch(e){fs=Fs.getFirestore(app);}
  FB={A,Au,Fs,Ai,app,auth,fs};BACKEND='firebase';
  if(window.PRONEX_EMULADOR){const em=window.PRONEX_EMULADOR;Au.connectAuthEmulator(auth,em.auth,{disableWarnings:true});Fs.connectFirestoreEmulator(fs,em.host,em.porta);}
  if(window.GEMINI_KEY){sampleFn=geminiAsk;}
  else if(window.USE_FIREBASE_AI&&Ai){try{const ai=Ai.getAI(app,{backend:new Ai.GoogleAIBackend()});const model=Ai.getGenerativeModel(ai,{model:AI_MODEL});
    sampleFn=async(prompt,opts)=>{if(!fbUser){const e=new Error('login');e.code='login';throw e;}const r=await model.generateContentStream(prompt);let t='';for await(const ch of r.stream){try{t+=ch.text();}catch(e){}if(opts&&opts.onText)opts.onText({text:t});}return{text:t};};}catch(e){}}
  /* Em alguns browsers, o login que sai da página volta sem resultado: avisa em vez de voltar ao início em silêncio. */
  let voltouDoLogin=false;try{voltouDoLogin=localStorage.getItem('x17-redir')==='1';localStorage.removeItem('x17-redir');}catch(e){}
  Au.getRedirectResult(auth).then(r=>{if(r&&r.user)onUserUpdate();else if(voltouDoLogin)setTimeout(()=>toast('O login com Google não terminou neste browser. Abre a app no Chrome ou no Safari, ou entra com o teu email.'),1500);}).catch(async e=>{if(e&&(e.code==='auth/credential-already-in-use'||e.code==='auth/email-already-in-use'||e.code==='auth/account-exists-with-different-credential')){const c=Au.GoogleAuthProvider.credentialFromError(e);if(c){try{await Au.signInWithCredential(auth,c);onUserUpdate();toast('Entraste na tua conta.');}catch(x){toast(authMsg(x));}}}else if(e&&e.code)setTimeout(()=>toast(authMsg(e)),800);});
  Au.onAuthStateChanged(auth,async u=>{
    const prev=uid;fbUser=u||null;
    if(u){CONTA_OK=!u.isAnonymous&&!!u.emailVerified;db=fsAdapter(fs,Fs);if(prev&&prev!==u.uid)storeMode='local';uid=u.uid;isOwner=(u.email||'').toLowerCase()===OWNER_EMAIL&&!!u.emailVerified&&!u.isAnonymous;
      if(!u.isAnonymous&&u.emailVerified){try{const t=await u.getIdTokenResult();if(t.claims.email_verified!==true)await u.getIdToken(true);}catch(e){}}
      if(await checkReset())return;
      loadAiKey();limparDadosAntigos();verSuspensao();lerBloqueios();
      if(!ME.nick&&u.displayName)ME.nick=u.displayName.split(' ')[0];startDbSync();heartbeat();flushEv();if(!opened){opened=true;logEv('abriu',{v:APP_VERSION});}}
    else{stopSync();db=null;uid=null;isOwner=false;storeMode='local';Au.signInAnonymously(auth).catch(e=>{authErr=e&&e.code||'erro';refresh();});}
    refresh();
  });
}
async function connect(){
  if(HAS_FB()){try{await connectFirebase();}catch(e){BACKEND='local';refresh();}return;}
  if(!window.claude||!window.claude.use){refresh();return;}
  try{
    const [dbx,user,smp]=await Promise.all([claude.use('db'),claude.use('user'),claude.use('sample')]);
    sampleFn=smp||null;userCap=user||null;
    if(user){try{isOwner=!!user.isOwner();}catch(e){}}
    if(dbx&&user){const id=await user.id();if(id){db=dbx;uid=id;}}
    if(!hasProfile&&user){try{const m=await user.me();if(m&&m.name&&!ME.nick)ME.nick=m.name.split(' ')[0];}catch(e){}}
    if(db)startDbSync();
    refresh();
  }catch(e){refresh();}
}
/* --- Conta (Firebase) --- */
const AUTH_ERR={'auth/invalid-credential':'Email ou palavra-passe errados.','auth/wrong-password':'Palavra-passe errada.','auth/user-not-found':'Não existe conta com esse email.','auth/email-already-in-use':'Já existe uma conta com esse email. Usa "Entrar".','auth/weak-password':'A palavra-passe precisa de pelo menos 6 caracteres.','auth/invalid-email':'Esse email não é válido.','auth/too-many-requests':'Demasiadas tentativas. Espera um pouco e tenta outra vez.','auth/network-request-failed':'Sem ligação à internet.','auth/popup-closed-by-user':'Fechaste a janela antes de terminar.','auth/operation-not-allowed':'Este método de entrada ainda não está ativo no Firebase.','auth/unauthorized-domain':'Este endereço ainda não está autorizado no Firebase.'};
const authMsg=e=>AUTH_ERR[e&&e.code]||'Não foi possível entrar. Tenta outra vez.';


async function resetPass(email){window.ERRO_RESET='';try{await FB.Au.sendPasswordResetEmail(FB.auth,email);toast('Enviámos um email para mudares a palavra-passe.');return true;}catch(e){window.ERRO_RESET=authMsg(e);toast(window.ERRO_RESET);return false;}}
/* 1.27: ao sair, apagar do dispositivo o que é pessoal e não está na conta (rascunhos das respostas e conversas com o Nex) */
function limparPessoal(){['x24-drafts','ps-tutor','x26-seen','x26-dwd'].forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});try{TUTOR=[];}catch(e){}}

function accountCard(){
  if(BACKEND==='claude'||(!IS_APP)){return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Ligado à tua conta Claude</h2><p class="muted">O teu progresso, a sequência e o perfil ficam guardados na conta e aparecem em qualquer dispositivo onde abras esta versão.</p></div>';}
  if(!HAS_FB())return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Contas a chegar</h2><p class="muted">Por agora o progresso fica guardado neste telemóvel. Quando as contas forem ativadas, vais poder entrar com o email ou com o Google e não perder a sequência.</p></div>';
  if(!FB)return'<div class="card acc"><p class="muted">A ligar ao servidor…</p></div>';
  if(fbUser)return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Sessão iniciada</h2><p class="muted">'+esc(fbUser.email||fbUser.displayName||'')+'</p><p class="store">'+(storeMode==='db'?'Progresso, sequência e perfil guardados na nuvem.':'A sincronizar…')+'</p><div><button class="btn sm" id="acc-out">Terminar sessão</button></div></div>';
  return'<div class="card acc"><div class="eyebrow">Conta</div><h2>Guarda o teu progresso</h2><p class="muted">Com conta, a sequência, o XP e o histórico ficam na nuvem: trocas de telemóvel e não perdes nada. Também precisas de conta para a conversa, o ranking e a IA.</p>'+
    (NO_G?'<p class="hint" style="margin:0">No iPhone, com a app instalada, entra com email e palavra-passe. Criaste a conta com o Google? Escreve o teu email e toca em «Esqueci-me da palavra-passe» para criares uma palavra-passe.</p>':'<button class="btn pri" id="acc-g" style="width:100%"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path fill="#fff" opacity=".85" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z"/><path fill="#fff" opacity=".7" d="M6.4 14a6 6 0 010-3.9V7.5H3.1a10 10 0 000 9z"/><path fill="#fff" opacity=".55" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 003.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z"/></svg>Continuar com Google</button><div class="or"><span>ou com email</span></div>')+'<form id="acc-f" class="accf"><label class="f">Email<input type="text" inputmode="email" autocomplete="email" id="acc-e" required></label><label class="f">Palavra-passe<input type="password" autocomplete="current-password" id="acc-p" minlength="6" required></label>'+
    '<div class="accb"><button class="btn pri" type="submit" data-m="in">Entrar</button><button class="btn" type="submit" data-m="new">Criar conta</button></div><button type="button" class="linkb" id="acc-r">Esqueci-me da palavra-passe</button></form></div>';
}
async function refreshUser(){const u=FB.auth.currentUser;if(!u)return;await u.reload();await u.getIdToken(true);onUserUpdate();if(isOwner){ADM.state='idle';toast('Email confirmado. O Painel do administrador já está disponível.');profTab='adm';renderProfile();}else if(FB.auth.currentUser.emailVerified)toast('Email confirmado.');else toast('Ainda não está confirmado. Abre o email que te enviámos e carrega no link.');}
async function verifyGoogle(){const {Au,auth}=FB;const p=new Au.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account',login_hint:fbUser.email||''});
  try{await Au.linkWithPopup(auth.currentUser,p);}catch(e){
    if(['auth/provider-already-linked','auth/credential-already-in-use','auth/email-already-in-use','auth/account-exists-with-different-credential'].includes(e.code)){try{await Au.signInWithPopup(auth,p);}catch(x){toast(authMsg(x));return;}}
    else{toast(authMsg(e));return;}}
  await refreshUser();}
function bindAccount(el){
  const vg=el.querySelector('#acc-vg');if(vg)vg.onclick=verifyGoogle;
  const ve=el.querySelector('#acc-ve');if(ve)ve.onclick=async()=>{try{await FB.Au.sendEmailVerification(FB.auth.currentUser);toast('Enviámos um email para '+fbUser.email+'. Abre-o, carrega no link e volta aqui.');}catch(e){toast(authMsg(e));}};
  const vok=el.querySelector('#acc-vok');if(vok)vok.onclick=refreshUser;
  const g=el.querySelector('#acc-g');if(g)g.onclick=loginGoogle;
  const o=el.querySelector('#acc-out');if(o)o.onclick=logout;
  const f=el.querySelector('#acc-f');if(f){let mode='in';f.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{mode=b.dataset.m;});
    f.onsubmit=async e=>{e.preventDefault();const em=f.querySelector('#acc-e').value.trim(),pw=f.querySelector('#acc-p').value;f.querySelectorAll('button').forEach(b=>b.disabled=true);await loginEmail(mode,em,pw);f.querySelectorAll('button').forEach(b=>b.disabled=false);};
    f.querySelector('#acc-r').onclick=()=>{const em=f.querySelector('#acc-e').value.trim();if(!em){toast('Escreve primeiro o teu email.');return;}resetPass(em);};}
}
const needLogin=()=>BACKEND==='firebase'&&!fbUser;

/* ================= Atualizações e novidades ================= */
const CHANGELOG=[
 {v:'1.35.0',d:'19 nov 2026',items:['Disciplinas novas: Psicologia (do cérebro às relações com os outros) e História da Cultura e das Artes (da Grécia antiga à arte digital), com lições, conceitos, fichas, glossário e 80 exercícios cada.','O Nex já responde sobre as duas disciplinas novas.','Matemática: o aviso «Quase. Vê a explicação» passou a uma faixa curta no topo e já não tapa os botões.','O botão do Nex encolhe enquanto deslizas a página.','Sem internet, as mensagens e publicações ficam escritas e a app avisa; abrir uma disciplina nunca descarregada explica o que fazer.','Etiquetas da barra de navegação maiores.']},
 {v:'1.34.0',d:'19 nov 2026',items:['Turma: a caixa de escrever deixou de ficar escondida por baixo da barra de navegação no telemóvel.','Texto secundário com mais contraste nos dois temas (as cores da 1.31 não estavam a ser aplicadas).','Exercícios: a explicação comprida começa no topo do ecrã e os avisos de conquista já não tapam «Seguinte».','Matemática: as três ferramentas cabem numa linha e os botões depois de responder ficam alinhados.','Botões e caixas de escolha com tamanho de toque confortável; o botão do Nex já não tapa a entrada nem as folhas abertas.','Cartão «Instala a Pronex_Study» legível; campos de texto com nome para leitores de ecrã.']},
 {v:'1.33.1',d:'19 nov 2026',items:['Ícone novo da app: o escudo da PRONEX sobre uma placa de cristal, num fundo com as cores da marca (violeta, azul e ciano).','Na app já instalada: no Android o ícone muda sozinho ao fim de um ou dois dias (com o telemóvel a carregar e em Wi-Fi); no iPhone e no computador é preciso remover a app e voltar a instalá-la.']},
 {v:'1.33.0',d:'19 nov 2026',items:['Exercícios: botões «Matéria» e «Fichas e glossário» sempre à vista, «Não sei · ver a resposta» e, quando erras, a tua resposta ao lado da certa, a explicação, a regra do conceito com exemplo e «Não confundas».','No fim de cada sessão podes rever todas as respostas, com a regra de cada uma.','Nex refeito: responde com a matéria da app em qualquer dispositivo e sem internet. Dá definições, diferenças, exemplos, resumos, contas e exercícios que corrige. O modelo passou a ser opcional.','Matemática: «Ver com o Nex onde errei» mostra a fórmula, o método, a resolução e a armadilha do tipo.','Início com as moedas e atalho para a loja; Turma com «Grupos» e «Estudar juntos» à vista; Ranking mostra a turma quando ainda não tens grupo de liga.','Painel de controlo por separadores e lista de contas duplicadas; já não dá para escolher um nome que outra conta usa.','Ícone novo da app e código organizado por ficheiros.']},
 {v:'1.32.0',d:'18 nov 2026',items:['Computador: na disciplina e na Matemática o resumo fica à esquerda e o trilho à direita; em Estudar as disciplinas aparecem em duas colunas; no Ranking a liga e o desafio ficam lado a lado.','Faixas dos temas com cores mais vivas em todas as disciplinas.','Ranking sem grupo: botão para ir fazer exercícios.']},
 {v:'1.31.0',d:'18 nov 2026',items:['Visual novo em toda a app: uma só paleta, os mesmos botões, cartões, separadores e barras em todos os ecrãs, no tema escuro e no claro.','Início reorganizado: diz quantos exercícios faltam hoje, mostra o próximo conceito da disciplina em que estavas, o trilho à volta dele, e a ofensiva, o XP da semana e a liga.','Ecrã de exercício com pergunta maior e opções mais fáceis de tocar. Versão de computador com duas colunas no Início.','Fundo mais calmo e corrigido o desenho que tapava o texto no Ranking sem grupo.']},
 {v:'1.30.0',d:'18 nov 2026',items:['Português: novo separador Gramática, com 16 temas, 47 conceitos e 252 exercícios: classes de palavras, tipos de frase, ativa e passiva, concordância, todas as funções sintáticas, coordenação, subordinação substantiva, adjetiva e adverbial, tempos e valores do verbo, pronomes átonos, vírgula, erros frequentes, discurso relatado e análise completa como no exame.','Cada conceito tem uma ficha com a regra e um exemplo, e exercícios do mais fácil para o mais difícil, com explicação em cada resposta.']},
 {v:'1.29.0',d:'18 nov 2026',items:['Atualização de design em cristal, na linguagem do logótipo PRONEX: cada conceito das disciplinas tem agora o seu próprio cristal facetado (670), cada tema tem uma faixa de cristal no trilho (145) e cada tipo de exercício de Matemática também tem o seu (46).','Ícones das disciplinas, topos das disciplinas, medalhas das conquistas e ecrãs vazios redesenhados em cristal.','Fundo da app com facetas discretas, no tema escuro e no claro. Tudo é desenhado no próprio dispositivo, sem imagens descarregadas.']},
 {v:'1.28.0',d:'18 nov 2026',items:['Emblemas das ligas novos, em cristal como o logótipo PRONEX: Bronze, Prata, Ouro, Safira e Diamante, este com a coroa de cristal.']},
 {v:'1.27.1',d:'18 nov 2026',items:['Respostas escritas: quando tens as ideias certas mas a resposta ficou curta, a correção passa a dizer isso e quantas palavras são pedidas.','Inglês: nos exercícios de completar com uma palavra, a caixa e a indicação pedem só a palavra que falta, em vez de «uma ou duas frases».']},
 {v:'1.27.0',d:'18 nov 2026',items:['Na Matemática, depois de errar aparece «Outro igual, com números novos», e no fim de cada sessão podes refazer só os que erraste.','Nas disciplinas, «Treinar outra vez» traz outra ordem e as opções baralhadas de outra forma. A página da disciplina já não desce sozinha e os anos (com Exame e Extra) cabem todos no ecrã.','Início mais limpo: o plano do Nex só aparece quando há um teste, uma revisão ou um ponto fraco para treinar.','Design: o botão do Nex já não tapa o fim das listas, o cabeçalho no telemóvel fica só com o logótipo, os ícones das disciplinas no tema claro ficam visíveis, os rótulos da barra de baixo estão maiores e com mais contraste, e no computador os exercícios têm uma largura confortável.','Ao terminares a sessão, os rascunhos das respostas e a conversa com o Nex são apagados do dispositivo.','Mais rápido e fiável: o Início redesenha-se menos vezes e o conteúdo das disciplinas guardado sem internet fica sempre da mesma versão da app.']},
 {v:'1.26.0',d:'18 nov 2026',items:['Mais segurança na Turma: já podes denunciar comentários e perfis (nome, foto ou biografia). O que for denunciado por 3 pessoas diferentes fica escondido até o administrador decidir.','Bloquear alguém também impede essa pessoa de te desafiar para duelos. As salas de estudo passam a ser dos grupos: só os colegas do grupo as veem e entram, e o dono pode tirar alguém da sala.','A escola deixa de aparecer no perfil público, a não ser que escolhas mostrá-la. Junto de «denunciar» há contactos de ajuda (Linha Internet Segura e SOS Criança).','O dono de um grupo pode apagar mensagens do grupo. As moedas dos duelos contam no máximo 3 vitórias por dia e 1 por colega, e o servidor recusa moedas inventadas.','Nas respostas escritas vês quantas palavras já tens e quantas são precisas. Reabrir um tipo de exercício da Matemática já respondido dá números novos.','O Nex: se uma mensagem falar de crise, mostra logo contactos de ajuda em vez de responder; o motor fica guardado para funcionar sem internet; respostas mais rápidas.','Nas disciplinas: a resposta errada tem som e vibração, as opções saltam ou abanam como na Matemática, as correções do teste mostram a tua resposta e há um botão «Reportar erro neste exercício».','Quando cumpres uma missão do dia ou ganhas uma conquista, a app diz-to logo.','Pesquisa à vista no cabeçalho. O botão do Nex só aparece em dispositivos onde o Nex funciona.','Aviso quando não há internet, avisos lidos pelos leitores de ecrã, o tema claro já não pisca a escuro no arranque, «Reduzir movimento» desliga mesmo os efeitos e os sons respeitam «Sons» desligado.']},
 {v:'1.25.0',d:'18 nov 2026',items:['Disciplinas novas organizadas como a Matemática: escolhes o ano (10.º, 11.º, 12.º), cada tema tem conceitos com nome («Argumento válido», «Present perfect») e cada conceito tem 4 a 8 exercícios do mais fácil para o mais difícil. Ao tocar num conceito vês uma ficha curta e começas. Já não há lições com cartões longos antes de praticar.','Toda a matéria foi confrontada com o programa oficial do secundário: o que está fora do programa passou para «Extra». Inglês tem conteúdo novo B1 (10.º) e B2 (11.º, exame 550); o C2 ficou como Extra. Teologia passou a EMR (perspetiva evangélica). Mais de 500 exercícios novos para as lacunas do programa.','Matemática: tema novo de Estatística (14 tipos de exercício, com histogramas e diagramas de extremos e quartis) e IRS atualizado para 2026.','Ranking com separador próprio na barra de baixo, por disciplina, com as zonas de subida e de descida bem marcadas. A Turma fica com as conversas e o mural.','O Nex tem ecrã próprio e um botão no Início e em Estudar: um só nome, sugestões da disciplina que estudaste, e diz logo se o teu telemóvel o consegue correr e quanto ocupa antes de descarregar (o leve é o escolhido por omissão).','O Início continua a disciplina que estudaste por último, pergunta em que ano estás e mostra todas as disciplinas sem ter de deslizar. As missões do dia servem para todas as disciplinas.','A caixa de escrever das conversas já não fica escondida pela barra de baixo, e apagar/denunciar estão num menu.','Cartões das disciplinas com a cor da disciplina, «Continuar» e anel de progresso; botões com melhor contraste; o aviso de XP mostra o valor certo; as janelas fecham ao mudar de ecrã.','Proteção de sequência mais barata na loja (30 moedas).']},
 {v:'1.24.1',d:'9 nov 2026',items:['Respostas escritas mais justas: copiar a pergunta ou as ideias da ajuda já não conta como certo, ideias opostas (válido e inválido, indutivo e dedutivo) deixam de ser confundidas, as frases negadas contam como negadas e, no Inglês, a gramática tem de estar certa («I\'ve not spoken» passa, «I haven\'t spoke» não).','Trilho: as lições com cadeado só abrem depois da anterior, os Desafios têm de ser jogados e uma lição só fica feita com pelo menos 60% certas. As estrelas do trilho são as do resumo.','Teste e duelos sem pistas: a correção só aparece no fim, com a lista das respostas certas. Um duelo já não se pode repetir saindo a meio.','O botão «voltar» do telemóvel volta ao trilho em vez de sair da app, e sair a meio de uma lição pede confirmação. O que escreves fica guardado como rascunho.','Python mais fiável: carregar duas vezes em Executar já não dá «ciclo infinito», se o Python falhar a carregar basta tentar outra vez, cada exercício começa limpo e o sys.exit() funciona.','Escolhas múltiplas revistas em todas as disciplinas: a resposta certa deixou de ser quase sempre a mais comprida. Verdadeiro/Falso equilibrados.','Cartões de memória com palavras-chave melhores, o XP do resumo certo (com o bónus de certas seguidas) e o primeiro acerto depois de um erro volta a dar XP.','As disciplinas e as ferramentas ficam guardadas para usar sem internet, e o Início abre mais depressa.','Contraste melhor no tema claro, botões maiores, os leitores de ecrã anunciam a correção e o trilho diz que lições estão bloqueadas.','Desenho A: escolher uma foto da galeria ou tirar agora; um toque no quadro já não conta como desenho. O Nex só aparece nos telemóveis que o conseguem correr.']},
 {v:'1.24.0',d:'9 nov 2026',items:['O Nex chegou às disciplinas: «Explica-me esta lição» em cada módulo, «Não percebi» nos cartões e «Pergunta ao Nex» depois de cada resposta. Conhece a lição do manual e o exercício, explica porque erraste e cria exercícios parecidos. Antes de responderes, só dá pistas. Corre no teu dispositivo.','Ferramentas em todas as disciplinas, como as Fórmulas de Matemática: fichas de consulta tiradas dos manuais (argumentos e falácias, figuras de estilo, tenses, perspetiva, atalhos do Blender, sintaxe de Python e muito mais) e um glossário com pesquisa (100 a 150 termos por disciplina).','As ferramentas abrem durante os exercícios (botão no topo) e mostram primeiro o que é da lição em que estás.']},
 {v:'1.23.0',d:'9 nov 2026',items:['As disciplinas novas passam a ser um trilho de níveis, como no Duolingo: cada módulo tem uma lição por ideia-chave do manual e acaba num desafio. São perto de 200 níveis por disciplina.','Cada lição mostra uma ideia de cada vez e logo a seguir 2 ou 3 exercícios sobre ela; o que falhas volta no fim da lição.','No fim de cada lição: estrelas (1 a 3), XP, acerto à primeira e certas seguidas, e o botão para o nível seguinte.','Escolha múltipla: quando erras, vês porque é que a tua opção está errada e porque é que a certa está certa.','Respostas escritas: nas perguntas mais simples podes ver as ideias que a resposta deve ter.','Revisão de hoje no Início, com o que falhaste em todas as disciplinas.','Cartões de memória em todas as disciplinas, feitos a partir das ideias-chave.','Inglês: ouvir os textos (voz do telemóvel, sem internet) e um modo «Ouvir e responder».','Python: os erros são explicados em português, com a linha onde aconteceram.','Duelos também em Filosofia, Português, Inglês, Desenho A, Teologia, Modelação 3D e Python.','Desenho A e Modelação 3D: podes pedir a um colega do teu grupo de estudo para confirmar o teu trabalho (a imagem só vai para o grupo e é apagada ao fim de 30 dias).']},
 {v:'1.22.0',d:'9 nov 2026',items:['Sete disciplinas novas, feitas a partir dos manuais: Filosofia, Português, Inglês, Desenho A, Teologia, Modelação 3D e Python (mais de 2 500 exercícios, com a página do manual).','Cada disciplina tem módulos com uma lição curta, prática, revisão do que erraste (1, 3 e 7 dias depois) e um teste de 10 perguntas com nota de 0 a 20.','Respostas escritas: escreves por palavras tuas e a app verifica se chegaste às ideias que a pergunta pede; se faltar alguma, dá uma pista e uma segunda tentativa.','Python: escreves o código, carregas em Executar e os testes dizem se está certo. O Python corre no teu dispositivo.','Desenho A: desenhas no ecrã ou fotografas o desenho em papel. Modelação 3D: fazes no Blender e envias a captura de ecrã. Nos dois, autoavaliação com critérios e perguntas para confirmar.','Tudo dá XP e conta para a sequência, as missões, o ranking e as ligas.']},
 {v:'1.21.0',d:'8 nov 2026',items:['As moedas, os baús, as compras da loja e as proteções da sequência ficam guardados na tua conta: mudar de telemóvel ou limpar a app já não apaga nada.','Loja do Nex: compra proteções da sequência (até 3) e cores novas para o teu avatar, que a turma vê no ranking.','Duelos justos: os dois jogadores recebem sempre os mesmos exercícios. Ganhar dá 20 moedas e empatar dá 5.','Exercícios repetidos passam a contar pela conta: a partir de agora, o que fizeres num dispositivo não volta a dar XP noutro, e num computador partilhado o colega seguinte ganha os seus pontos.','Mural: gostos e reações juntos num só sítio.','Conversa: os canais aparecem pela última mensagem, com há quanto tempo; os parados ficam no fim.']},
 {v:'1.20.0',d:'8 nov 2026',items:['Ranking arrumado: três separadores (A tua liga · Turma · Recordes) em vez de sete em duas linhas; a Turma tem Esta semana, Este mês e Desde sempre, e os Recordes têm Acerto, Sequência e Por tema.','O ranking diz quanto XP te falta para passares quem está à tua frente (ou a vantagem que tens se estiveres em 1.º).','O pódio já não se repete na lista: a lista começa no 4.º lugar.','O curso só aparece quando é diferente do teu.','Partilhar a app com código QR a partir do Início e do fim do ranking.']},
 {v:'1.19.0',d:'8 nov 2026',items:['Pontos mais seguros: o histórico de cada dia junta-se ao do servidor em vez de o substituir, por isso dois telemóveis (ou um sem rede) já não apagam exercícios um do outro.','As ligas fecham a semana com o XP certo mesmo para quem já estudou na segunda-feira de manhã.','O bónus das simulações de antes de 7 de novembro voltou a contar.','No ranking aparece um aviso quando os teus pontos não estão a chegar, com o motivo.','O ranking carrega os alunos com mais pontos (e não os primeiros 300 por ordem), e esconde contas suspensas.','A sequência no ranking deixa de contar para quem não estuda há mais de dois dias.','Duelos novos e salas novas aparecem sempre; o resultado de um duelo que falhou o envio volta a ser enviado.','Grupos: quem o dono tira já não volta a entrar com o código, e o dono pode deixá-lo voltar.','As moedas do dia só contam exercícios novos (não repetidos).']},
 {v:'1.18.0',d:'7 nov 2026',items:['O botão «Continuar com Google» voltou à app instalada no iPhone e funciona: o login passa pelo próprio site da Pronex.']},
 {v:'1.17.3',d:'7 nov 2026',items:['Entrar na conta no telemóvel ficou mais fiável: se a ligação for lenta, a app espera por ti em vez de te mandar criar uma conta nova, e podes continuar sem ligação.','No iPhone com a app instalada: explicamos como criar uma palavra-passe para uma conta feita com o Google, e há o botão «Criar ou mudar palavra-passe» em Perfil.','A app guarda o servidor de contas no telemóvel e abre mais depressa com rede fraca.','O tutor já funciona antes de confirmares o email.','Apagar a conta apaga também as tuas mensagens e comentários.','O pedido de autorização deixou de aparecer repetido.']},
 {v:'1.17.1',d:'7 nov 2026',items:['As mensagens de erro ao entrar na conta voltam a aparecer: estavam escondidas atrás do ecrã de entrada.','No iPhone, com a app instalada, a app explica como criar uma palavra-passe quando a conta foi criada com o Google.','Novo botão para mostrar a palavra-passe enquanto a escreves.']},
 {v:'1.17.0',d:'6 nov 2026',items:['As perguntas ao tutor Nex passam a ficar só no teu dispositivo, e as cópias antigas são apagadas da nuvem.','A app deixa de guardar o registo do que fazes e os dados dos teus dispositivos.','Os grupos de estudo passam a ter código de convite: só os membros veem o grupo e leem as mensagens.','O mural e os canais só podem ser lidos por contas com o email confirmado.','Podes bloquear uma pessoa no perfil dela, para deixares de ver o que ela publica.','Por segurança, as publicações não aceitam insultos fortes, números de telefone nem emails.','Política de Privacidade 1.4.']},
 {v:'1.16.2',d:'6 nov 2026',items:['O código QR para convidar colegas voltou a estar à vista em Perfil → Definições → App, com Partilhar e Copiar link.']},
 {v:'1.16.1',d:'6 nov 2026',items:['Exercícios revistos um a um: arredondamentos certos (por exemplo 1903,125 € passa a 1903,13 €), encargos máximos sempre possíveis, IRS com valores coerentes e Hondt sem empates ambíguos.','Fichas: «na Lousã», «no Porto», «não tem dependentes» e opções do IRS iguais para todos.','Pontos: confirma com o servidor antes de enviar o XP para o ranking.','Política de Privacidade 1.3: avisos com a app fechada, ligas e prémios e cópias de segurança cifradas.']},
 {v:'1.16.0',d:'6 nov 2026',items:['Ranking corrigido: um dispositivo desatualizado já não baixa o XP da semana, e os pontos nunca descem. Os teus pontos aparecem no ranking logo a cada exercício.','Ligas a sério: cada semana ficas num grupo com colegas da mesma liga; no domingo os primeiros sobem e os últimos descem.','Rankings: a tua liga, semana, mês, sempre, acerto, sequência e por tema, com setas desde ontem e a tua posição sempre à vista.','Prémios da semana: medalha e 30, 20 ou 10 moedas para o pódio, e 15 moedas por subir de liga.','XP mais justo a partir de 7 de novembro: errada 0, certa na simulação ou no exame +20 e bónus por certas seguidas.','Os teus pontos: como ganhas XP e moedas, as ligas, os prémios e o histórico de cada dia (toca no XP do topo).']},
 {v:'1.15.0',d:'6 nov 2026',items:['Início mais curto: missões e semana junto do objetivo, 4 ferramentas à vista e «Ver todas» para as restantes.','Disciplinas que ainda não têm matéria agrupadas em «Em breve».','Exercícios: tabelas mais compactas no telemóvel, com aviso quando há colunas para o lado, e a faixa da resposta já não tapa a resolução.','Nomes iguais em toda a app: Simulação do teste e Revisão dos erros.','Perfil com menos separadores: o que estava em App passou para Definições → App.','Conquistas: vês as que ganhaste e as 3 seguintes; o resto em «Ver todas».','Topo com legenda (dias e XP) e caixas de escolha com o estilo da app.']},
 {v:'1.14.0',d:'6 nov 2026',items:['Avisos do professor e da app chegam ao telemóvel mesmo com a app fechada (liga-os em Definições → Notificações).','Cópia de segurança diária e cifrada de toda a base de dados.','Testes automáticos das regras de segurança sempre que a app muda.']},
 {v:'1.13.1',d:'5 nov 2026',items:['Definições → App: novidades de cada versão, convidar colegas com código QR e link, e a página da app.','O aviso «O que há de novo» depois de atualizar ficou com o visual novo.','Tema claro: as cores das fórmulas nos resumos, os botões dos grupos e a sequência passaram a ler-se bem.','Letra maior e com mais contraste nas etiquetas pequenas (em breve, ativa, fichas).']},
 {v:'1.13.0',d:'5 nov 2026',items:['Fichas de treino: oito modelos iguais às fichas e minitestes do módulo (recibo de vencimento, IRS, juros, retenção, Hondt, Borda e eleições), com números novos de cada vez, nota de 0 a 20 e impressão.','Encontra o erro: um colega resolveu um exercício e tu descobres em que passo se enganou.','Tema claro, escuro ou automático nas Definições.','Página pública da app em /sobre, com as funções, os ecrãs e como instalar.']},
 {v:'1.12.0',d:'5 nov 2026',items:['Mural: reações, perguntas com melhor resposta, menções com @nome e publicações fixadas pelo administrador.','Grupos de estudo com conversa própria e salas para estudar juntos com um temporizador partilhado.','Duelos 1 contra 1 com os mesmos 5 exercícios e desafio semanal da turma no ranking.','Baús nas sequências, moedas e a loja do Nex com cores novas para a mascote.','Conquistas em destaque no perfil público.','Envia sugestões e problemas nas Definições; os erros da app passam a ser registados para serem corrigidos.']},
 {v:'1.11.0',d:'5 nov 2026',items:['Ferramentas no início: modo exame com tempo, mapa de domínio, plano até ao teste, resumos, glossário, calculadora com histórico, modo foco, retrospetiva do mês, o teu objetivo e pesquisa.','O Nex deixa-te uma mensagem com o que fazer hoje e, à noite, propõe 5 minutos de cartões.','Animação quando sobes de nível e medalhas novas nas conquistas.','Tutor com botões para explicar de forma mais simples, corrigir o teu raciocínio e pedir exercícios.','Acessibilidade: tamanho da letra, alto contraste e reduzir movimento.','Atalhos no ícone da app para o exame e os cartões.']},
 {v:'1.10.0',d:'4 nov 2026',items:['Cartões de memória: revê as fórmulas a virar cartões; os que falhas voltam amanhã e os que sabes voltam mais tarde.','Emblemas das ligas Bronze, Prata, Ouro, Safira e Diamante, com a escada das ligas no ranking.','Avatares do Nex em oito cores para usares como foto de perfil.','Documentos legais 1.1: só a partir dos 13 anos, a escola não tem acesso aos teus dados e prazos definidos.']},
 {v:'1.9.1',d:'4 nov 2026',items:['O Nex ganhou animações feitas no After Effects: respira e pisca em repouso e salta quando festejas.','As animações só descarregam quando aparecem e respeitam a opção de reduzir movimento do dispositivo.']},
 {v:'1.9.0',d:'4 nov 2026',items:['Tutor Nex novo: a IA corre dentro do teu dispositivo, sem enviar as perguntas a nenhuma empresa e sem internet depois de descarregada.','Escolhe nas Definições entre o Nex leve e o Nex completo, ou apaga-o para libertar espaço.','Documentos legais atualizados: prazos, suspensões e quem vê o ranking.']},
 {v:'1.8.2',d:'4 nov 2026',items:['Exercícios: folha de resposta com o Nex, +10 XP à vista e animação nas opções.','Resultado da sessão com o Nex a reagir à tua nota.','Ranking com pódio dos três primeiros.']},
 {v:'1.8.1',d:'4 nov 2026',items:['Segurança: proteção contra código malicioso no ranking, nos perfis e no painel.','Denúncias com motivo e limite de ritmo nas publicações e mensagens, para travar spam.','Mural: botão de publicar e aviso arrumados.']},
 {v:'1.8.0',d:'4 nov 2026',items:['Entrada nova: ecrã de instalação, conta obrigatória (Google ou email confirmado), aceitação das condições e código da turma.','Conhece o Nex, a mascote que te acompanha no tutor, nas celebrações e nos ecrãs vazios.','Central de notificações com avisos da turma, revisões, teste e versões novas; avisos no dispositivo se os ativares.','Definições: descarregar os teus dados, apagar a conta, documentos legais e avisos.','Painel do administrador com PIN, envio de notificações, código da turma, versão mínima e registo de auditoria.']},
 {v:'1.7.0',d:'4 nov 2026',items:['Visual novo: fundo escuro, cartões coloridos, botões em pílula e letra mais forte, inspirado nas melhores apps de estudo.','Tutor IA com conversa em balões e sugestões rápidas.']},
 {v:'1.6.1',d:'4 nov 2026',items:['Contas com email: botão para confirmar o email com o Google ou por email de confirmação.']},
 {v:'1.6.0',d:'4 nov 2026',items:['Tutor IA a funcionar outra vez, mais rápido e com indicação de que está a escrever.','Proteção de sequência: ganhas uma a cada 7 dias seguidos e ela salva a sequência se falhares um dia.','Celebração quando cumpres o objetivo do dia, com a semana à vista.','Data do teste: marca-a no perfil e o Início diz quanto falta e o que treinar.','Ligas semanais: Bronze, Prata, Ouro, Safira e Diamante.','Quando erras, vês a tua resposta e a certa lado a lado, antes da resolução.','Mural, conversa e ranking com ecrãs de carregamento e mensagens mais claras.','O convite para instalar só aparece depois de experimentares a app.']},
 {v:'1.5.1',d:'4 nov 2026',items:['Novo começo: o administrador pode repor a app e cada dispositivo volta ao ecrã de boas-vindas.','Moderação: o administrador pode repor contas com nomes ou publicações impróprias.']},
 {v:'1.5.0',d:'4 nov 2026',items:['Já não é preciso iniciar sessão: cada dispositivo entra logo com uma conta automática e pode ligá-la ao Google ou a um email.','Mural da comunidade: publica texto e fotos, dá gostos e comenta.','Foto de perfil e perfil público: toca no nome de alguém para ver o nível, o XP e a sequência.','Ranking a sério com todos os que usam a app, na liga semanal e desde sempre.','O tutor com IA funciona para toda a gente, sem passos extra.','A conversa com o tutor fica guardada na nuvem.']},
 {v:'1.4.2',d:'4 nov 2026',items:['Botão Atualizar mais fiável: usa sempre a versão nova mais recente e recarrega a app sozinho.','Quem tinha uma versão muito antiga (1.0 ou 1.1) passa automaticamente para a atual.']},
 {v:'1.4.1',d:'4 nov 2026',items:['Contas ligadas na app: entra com Google ou com email e a sequência, o XP e o histórico ficam guardados na nuvem.','Conversa e ranking da turma a funcionar dentro da app instalada.']},
 {v:'1.4.0',d:'4 nov 2026',items:['Instalar ficou mais fácil: botão Instalar no Início e guia passo a passo para Android, iPhone e computador.','Convidar colegas com código QR, link e botão Partilhar (Perfil → App).','Atalhos no ícone da app: Simulação do teste, Revisão e Tutor IA.','Ecrã de instalação com imagens da app no Android.']},
 {v:'1.3.0',d:'4 nov 2026',items:['Lições: cada tipo tem uma explicação com exemplo resolvido antes de praticar.','Revisão espaçada: a app volta aos tipos onde erraste ao fim de 1, 3 e 7 dias.','Liga semanal no ranking, que recomeça às segundas.','3 tipos novos: Condorcet, orçamento familiar e custo de um crédito.','Repetir um exercício já não dá XP, para o ranking ser justo.','Ícones próprios em cada tipo do trilho e atalhos para os capítulos.','Transferir progresso entre a app do telemóvel e a versão online.','Denunciar mensagens na conversa e som desligado por defeito.']},
 {v:'1.2.0',d:'4 nov 2026',items:['Início novo: primeiro escolhes o curso, depois entras na matéria.','Contas com Google ou email para guardar a sequência na nuvem.','Conversa e ranking entre colegas em tempo real, com conta.','Tutor com IA na Comunidade, com conta.','Ecrã de novidades e procura de atualizações no perfil.']},
 {v:'1.1.0',d:'3 nov 2026',items:['Trilho com coroas, missões diárias e semana em gráfico.','Efeitos ao acertar, som e vibração.','Ecrã de resultado no fim de cada sessão.']},
 {v:'1.0.0',d:'3 nov 2026',items:['Primeira versão: Matemática P1, simulação do teste, calculadora e rascunho.']}
];
function changelogHTML(n){return CHANGELOG.slice(0,n||CHANGELOG.length).map(c=>'<div class="cl"><div class="clh"><b>Versão '+c.v+'</b><span>'+c.d+'</span></div><ul>'+c.items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul></div>').join('');}
function showNews(){
  let last=null;try{last=localStorage.getItem('ps-ver');localStorage.setItem('ps-ver',APP_VERSION);}catch(e){}
  if(!last||last===APP_VERSION)return;
  closeSheet();const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Novidades');
  sh.innerHTML='<span class="grab"></span><div class="eyebrow">Atualizado para a versão '+APP_VERSION+'</div><h2 style="font-size:1.4rem">O que há de novo</h2>'+changelogHTML(1)+'<button class="btn pri" id="nw-ok">Continuar</button>';
  document.body.appendChild(bg);document.body.appendChild(sh);sh.querySelector('#nw-ok').onclick=closeSheet;sh.querySelector('#nw-ok').focus();
}
let SWREG=null;
async function checkUpdates(btn){
  if(!IS_APP){toast('Esta versão atualiza-se sozinha.');return;}
  if(!SWREG){toast('Abre a app instalada para procurar atualizações.');return;}
  btn.disabled=true;btn.textContent='A procurar…';
  try{await SWREG.update();}catch(e){}
  setTimeout(()=>{btn.disabled=false;btn.textContent='Procurar atualizações';if(!updWaiting)toast('Tens a versão mais recente ('+APP_VERSION+').');},2500);
}

/* ================= Tutor com IA ================= */
let TUTOR=[];try{TUTOR=JSON.parse(localStorage.getItem('ps-tutor')||'[]');}catch(e){TUTOR=[];}
let tutorBusy=false;
const saveTutor=()=>{try{localStorage.setItem('ps-tutor',JSON.stringify(TUTOR.slice(-30)));}catch(e){}if(typeof cloudTutor==='function')cloudTutor();};
/* O ecrã e as respostas do Nex estão em js/nex.js. Aqui ficam a conversa guardada, as sugestões por disciplina
   e as mensagens de crise, que nunca chegam ao Nex. */
function lastArea(){for(const d of HIST){const it=(d.items||[]);for(let i=it.length-1;i>=0;i--){const t=it[i]&&it[i].tema;if(t)return TEMAS.includes(t)?'Matemática':t;}}return'Matemática';}
const NEXSUG={'Matemática':['Explica-me o método de Hondt','Como calculo a mediana com n par?','Qual a diferença entre taxa marginal e taxa média de IRS?'],
 'Filosofia':['O que torna um argumento válido?','Explica a diferença entre o modus ponens e o modus tollens','O que defende Kant sobre a moral?'],
 'Português':['Como identifico uma oração subordinada?','Quais são as figuras de estilo mais pedidas no exame?','Como estruturo um texto de opinião?'],
 'Inglês':['When do I use present perfect or past simple?','Explica-me os condicionais em inglês','How do I write a formal e-mail?'],
 'Desenho A':['Como funciona a perspetiva com um ponto de fuga?','O que é o valor tonal?','Como meço proporções com a visada?'],
 'Teologia':['Explica-me o que é a graça','Que livros tem o Novo Testamento?','O que distingue as várias igrejas cristãs?'],
 'Modelação 3D':['Para que serve o modificador Subdivision Surface?','Como faço um UV unwrap?','Que diferença há entre Eevee e Cycles?'],
 'Python':['Qual a diferença entre lista e tuplo?','Como funciona um ciclo for com range?','Explica-me o que é uma função com return']};
/* tutorHTML e askTutor são definidos em js/nex.js (carregado depois); isto é só o que aparece até lá. */
function tutorHTML(){return'<div class="card x25nex"><p class="muted">A preparar o Nex…</p></div>';}
async function askTutor(q){}
/* 1.26: mensagens de crise nunca vão ao Nex nem ao modelo: mostram contactos de ajuda fixos */
const CRISE_RE=/(suic[ií]d|matar-me|me matar|mato-me|quero morrer|n[aã]o quero (viver|estar c[aá])|acabar com (a minha vida|tudo)|cortar-me|me cortar|automutila|auto-mutila|fazer-me mal|magoar-me|n[aã]o aguento mais|ningu[eé]m gosta de mim|abus[oa]d|abusou de mim|bater-me|bate-me|amea[cç]a(m|ram)-me|bullying)/i;
const CRISE_TXT='Isto é importante e mereces apoio de uma pessoa a sério. O Nex não é a ajuda certa para isto.\n\nFala com alguém em quem confies: os teus pais, um professor ou o diretor de turma.\n\nPodes ligar, de graça:\n• 112: emergência\n• SNS 24: 808 24 24 24 (aconselhamento psicológico)\n• SOS Voz Amiga: 213 544 545\n• SOS Criança: 116 111';
window.nexCrise=q=>CRISE_RE.test(String(q||''));window.CRISE_TXT=CRISE_TXT;

/* ================= v1.3: ícones, lições, revisão, transferência ================= */
Object.assign(IC,{
 vote:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 11h16v9H4zM8 11l2-6h4l2 6M9 15h6"/></svg>',
 pct:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/></svg>',
 users:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="8" r="3"/><path d="M3 20a6 6 0 0112 0M16 5a3 3 0 010 6M21 20a6 6 0 00-4-5.6"/></svg>',
 list:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 6h11M9 12h11M9 18h11M4 6h1M4 12h1M4 18h1"/></svg>',
 pie:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4a8 8 0 108 9h-8z"/><path d="M14 3a8 8 0 017 7h-7z"/></svg>',
 wallet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H3zM3 7l12-4v4M16 13.5h2"/></svg>',
 clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 receipt:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3"/></svg>',
 trend:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>',
 scale:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M6 21h12M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z"/></svg>',
 card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
 swap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>',
 learn:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6c-2-1.5-5-2-8-1v14c3-1 6-.5 8 1 2-1.5 5-2 8-1V5c-3-1-6-.5-8 1zM12 6v14"/></svg>',
 repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 0114-5.3L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.3L4 15M4 20v-5h5"/></svg>',
 flag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 21V4h11l-2 4 2 4H5"/></svg>'
});
const TYPE_IC=['vote','pct','pct','crown','list','trophy','users','trophy','pie','pie','target','receipt','clock','col','pct','scale','swap','trend','clock','trend','trend','trend','scale','target','card','swap','receipt','trend','clock','col','users','wallet','card'];
function hexIcon(t){return IC[TYPE_IC[t]]||IC.calc;}

/* --- XP justo: repetir o mesmo exercício não dá XP --- */
if(!st.seen){st.seen={};Object.keys(st.ans).forEach(k=>st.seen[k]=1);save();}
const realItems=items=>items.filter(i=>!i.rt);

/* --- Revisão espaçada: volta aos tipos onde erraste, com intervalos de 1, 3 e 7 dias --- */
function reviewDue(){
  const by={};allItems().filter(i=>i.ts&&!i.rt).forEach(i=>{(by[i.t]=by[i.t]||[]).push(i);});
  const now=Date.now(),out=[];
  Object.entries(by).forEach(([t,its])=>{t=+t;if(!active().includes(t))return;its.sort((a,b)=>a.ts-b.ts);
    let lw=-1;its.forEach((i,ix)=>{if(!i.ok)lw=ix;});if(lw<0)return;
    const after=its.length-1-lw,last=its[its.length-1].ts;if(after>=3)return;
    const gap=[1,3,7][after]*864e5;if(now-last>=gap-36e5)out.push({t,after,last});});
  return out.sort((a,b)=>a.last-b.last).slice(0,8).map(x=>x.t);
}

/* --- Liga semanal --- */
function weekId(d){d=new Date(d);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return dstr(d);}
function weekXP(){const wk=weekId(Date.now());let x=0;HIST.forEach(d=>{if(d.date==='0000-anteriores'||weekId(d.date+'T12:00:00')!==wk)return;realItems(d.items||[]).forEach(i=>x+=i.ok?10:2);x+=missionsFor(d.items||[],d.goal||15,d.date).filter(m=>m.done).length*20;});return x;}

/* --- Lição antes de praticar --- */
function openLesson(t){
  closeSheet();const TY=TYPES[t],E=exV(t,999,0);
  const bg=document.createElement('div');bg.className='sheet-bg';bg.onclick=closeSheet;
  const sh=document.createElement('div');sh.className='nsheet lesson';sh.setAttribute('role','dialog');sh.setAttribute('aria-label','Lição: '+TY.n);
  sh.innerHTML='<span class="grab"></span><div class="eyebrow">Lição · '+TY.t+'</div><h2 style="font-size:1.35rem">'+esc(TY.n)+'</h2>'+
    '<p class="muted" style="font-size:.9rem">Lê a fórmula e os passos, segue o exemplo resolvido e depois pratica com números novos.</p>'+helpCard(TY.h)+
    '<div class="card ex-res"><div class="eyebrow">Exemplo resolvido</div><div class="ctx">'+E.c+'</div><p class="q" style="font-size:1.05rem;margin:8px 0">'+E.q+'</p>'+
    '<div class="fb ok" style="margin-top:6px"><h3>Resposta: '+E.o[E.a]+'</h3><ol>'+E.s.map(x=>'<li>'+x+'</li>').join('')+'</ol>'+(E.trap?'<p class="trap">'+E.trap+'</p>':'')+'</div></div>'+
    '<div class="acts"><button class="btn" id="ls-close">Fechar</button><button class="btn pri" id="ls-go">Praticar · '+CNT(t)+' exercícios</button></div>';
  document.body.appendChild(bg);document.body.appendChild(sh);document.addEventListener('keydown',sheetKey);
  st.lessons=st.lessons||{};st.lessons[t]=1;save();
  sh.querySelector('#ls-close').onclick=closeSheet;sh.querySelector('#ls-go').onclick=()=>{closeSheet();startSess('tipo',t);};sh.querySelector('#ls-go').focus({preventScroll:true});sh.scrollTop=0;
}

/* --- Transferir progresso entre a app e a versão online --- */
function exportCode(){
  const data={v:1,h:HIST.map(d=>({date:d.date,goal:d.goal,items:(d.items||[]).map(i=>({ts:i.ts,t:i.t,ok:i.ok?1:0,m:i.mode,rt:i.rt?1:0,e:i.esc,c:i.cert}))})),me:{nick:ME.nick,curso:ME.curso,cor:ME.cor,goal:ME.goal}};
  return 'PSX1.'+btoa(unescape(encodeURIComponent(JSON.stringify(data))));
}
function importCode(code){
  code=(code||'').trim();if(code.indexOf('PSX1.')!==0)throw new Error('formato');
  const data=JSON.parse(decodeURIComponent(escape(atob(code.slice(5)))));let added=0;
  (data.h||[]).forEach(dd=>{let day=HIST.find(x=>x.date===dd.date);if(!day){day={date:dd.date,goal:dd.goal,items:[]};HIST.push(day);}
    const seen=new Set(day.items.map(i=>i.ts+'|'+i.t));
    dd.items.forEach(i=>{if(seen.has(i.ts+'|'+i.t))return;if(!TYPES[i.t])return;day.items.push({ts:i.ts,t:i.t,tn:TYPES[i.t].n,tema:TYPES[i.t].t,q:'',esc:i.e,cert:i.c,ok:!!i.ok,mode:i.m,rt:i.rt?1:0});added++;});
    day.items.sort((a,b)=>a.ts-b.ts);persistDay(day.date);});
  HIST.sort((a,b)=>a.date<b.date?1:-1);saveHistLocal();
  if(!ME.nick&&data.me&&data.me.nick){ME=Object.assign(ME,data.me);hasProfile=true;st.onb=true;save();}
  lastSync='';syncProfile();return added;
}
function transferCard(){return'<div class="card acc"><div class="eyebrow">Transferir progresso</div><h2>Juntar a app e a versão online</h2><p class="muted">O progresso da app do telemóvel e o da versão no Claude estão separados. Copia o código de um lado e cola-o no outro: os exercícios, o XP e a sequência juntam-se, sem apagar nada.</p>'+
  '<div class="accb"><button class="btn" id="tr-copy">Copiar o meu código</button></div><textarea id="tr-in" rows="3" placeholder="Cola aqui o código que copiaste do outro lado (começa por PSX1.)"></textarea><div><button class="btn pri sm" id="tr-go">Juntar progresso</button></div></div>';}
function bindTransfer(el){
  const c=el.querySelector('#tr-copy');if(c)c.onclick=()=>{const code=exportCode();const ta=el.querySelector('#tr-in');
    if(navigator.clipboard)navigator.clipboard.writeText(code).then(()=>toast('Código copiado. Cola-o no outro lado.'),()=>{ta.value=code;ta.select();toast('Seleciona o texto e copia.');});else{ta.value=code;ta.select();}};
  const g=el.querySelector('#tr-go');if(g)g.onclick=()=>{try{const n=importCode(el.querySelector('#tr-in').value);toast(n?n+' exercícios juntados ao teu progresso.':'Não havia nada novo para juntar.');refresh();}catch(e){toast('Esse código não é válido. Copia-o outra vez.');}};
}
const IS_IOS_APP=(()=>{try{return /iP(hone|ad|od)/.test(navigator.userAgent)&&(navigator.standalone||matchMedia('(display-mode: standalone)').matches);}catch(e){return false;}})();
/* 1.18: o Google funciona na app instalada no iPhone quando o login passa pelo próprio site (pronexprotocol-ui.github.io/__/auth). */
const NO_G=IS_IOS_APP&&!(window.FIREBASE_CONFIG&&FIREBASE_CONFIG.authDomain===location.hostname);
function aiQuotaOk(){try{const k='ps-ai-'+today(),n=+(localStorage.getItem(k)||0);if(n>=40)return false;localStorage.setItem(k,n+1);return true;}catch(e){return true;}}
