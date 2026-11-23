/* Pronex_Study · 10-pontos-ligas.js
   Pontos: XP a partir do histórico, ligas, rankings, página «Os teus pontos» e carteira de moedas na conta.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* ===== 1.16.0 · pontos, ligas e rankings =====
   Pontos à vista: XP (com o nível) e moedas. A liga é o teu grupo da semana.
   O XP calcula-se sempre a partir do histórico (igual em todos os dispositivos).
   Regras de XP a partir de 7 nov 2026 (antes ficam as antigas, para ninguém perder XP):
     certo +10 · na simulação do teste e no modo exame +20 · errado 0 · repetido 0
     certas seguidas: a partir da 3.ª, +2, +4, +6… (no máximo +10 por exercício)
     missão do dia +20
   Ligas: grupos da semana (até 12 alunos da mesma liga). Ao fim da semana sobem os primeiros e descem os últimos.
   Prémios: pódio da semana (30, 20 e 10 moedas e medalha) e +15 moedas por subir de liga. Feitos pela tarefa
   automática .github/pronex/ligas.mjs, que escreve config/ligas e premios/{uid}. */
const X16=(()=>{
  const N=v=>Number.isFinite(+v)?+v:0;
  const L={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const T0=Date.parse('2026-11-07T00:00:00Z');
  const V={ok:10,okSim:20,bad:0,okOld:10,badOld:2,combo:2,comboMax:10,mis:20};
  const TEMAS=['Eleições','Partilha','Finanças','Estatística'];
  const TIERN=['Bronze','Prata','Ouro','Safira','Diamante'],TIERC=['#c8875a','#b9c3d6','#f5c542','#4f8cff','#5ef0ff'];
  const zona=n=>n>=9?3:n>=5?2:1;
  const fmtDia=d=>{try{return new Date(d+'T12:00:00').toLocaleDateString('pt-PT',{weekday:'short',day:'numeric',month:'short'});}catch(e){return d;}};
  const fmtSem=w=>{try{return'semana de '+new Date(w+'T12:00:00').toLocaleDateString('pt-PT',{day:'numeric',month:'short'});}catch(e){return w;}};

  /* ---------- XP a partir do histórico ---------- */
  let memo=null,memoK='';
  function key(){let n=0,t=0;HIST.forEach(d=>{const it=d.items||[];n+=it.length;if(it.length)t+=N(it[it.length-1].ts)%1e7+(it[it.length-1].ok?1:0);});return HIST.length+'|'+n+'|'+t+'|'+dstr(new Date())+'|'+(ME.goal||15);}
  function dayXP(items,ant){let ex=0,cb=0,c=0;const tema={};
    items.slice().sort((a,b)=>N(a.ts)-N(b.ts)).forEach(i=>{if(i.rt)return;let v=0;
      if(ant||N(i.ts)<T0){v=i.ok?V.okOld:V.badOld;}
      else if(i.ok){v=i.mode==='sim'?V.okSim:V.ok;c++;if(c>=3){const b=Math.min(V.comboMax,(c-2)*V.combo);cb+=b;if(i.tema)tema[i.tema]=(tema[i.tema]||0)+b;}}
      else c=0;
      ex+=v;if(i.tema)tema[i.tema]=(tema[i.tema]||0)+v;});
    return{ex,cb,tema};}
  function ledger(){const k=key();if(memo&&memoK===k)return memo;
    const ev=[],tema={};let total=0;const add=(d,kind,xp,txt)=>{if(!xp)return;ev.push({d,kind,xp,txt});total+=xp;};
    const addT=t=>Object.keys(t).forEach(k=>tema[k]=(tema[k]||0)+t[k]);
    HIST.forEach(d=>{const items=d.items||[];if(d.date==='0000-anteriores'){const r=dayXP(items,true);addT(r.tema);add('0000-00-00','antes',r.ex,'Exercícios de antes da conta');return;}
      const real=items.filter(i=>!i.rt),okN=real.filter(i=>i.ok).length,r=dayXP(items,false);addT(r.tema);
      if(real.length)add(d.date,'ex',r.ex,real.length+' exercício'+(real.length>1?'s':'')+' · '+okN+' cert'+(okN===1?'o':'os'));
      add(d.date,'combo',r.cb,'Bónus de certas seguidas');
      /* 1.19: o bónus de simulação de antes de 7 nov (+50 por simulação completa) volta a contar, como estava no servidor */
      {const sims={};items.forEach(i=>{if(i.mode==='sim'&&N(i.ts)>0&&N(i.ts)<T0){const h=Math.floor(N(i.ts)/3600000);sims[h]=(sims[h]||0)+1;}});
       const ns=Object.values(sims).filter(c=>c>=14).length;add(d.date,'sim',ns*50,ns+' simulaç'+(ns>1?'ões completas':'ão completa'));}
      if(typeof missionsFor==='function'){const m=missionsFor(items,d.goal||15,d.date).filter(x=>x.done).length;add(d.date,'mis',m*V.mis,m+' miss'+(m>1?'ões cumpridas':'ão cumprida'));}});
    ev.sort((a,b)=>a.d<b.d?1:-1);memo={ev,total,tema};memoK=k;return memo;}
  const total=()=>ledger().total;
  const monthId=t=>dstr(new Date(t||Date.now())).slice(0,7);
  const sumIf=f=>ledger().ev.reduce((a,e)=>a+(f(e)?e.xp:0),0);
  const week=wk=>{wk=wk||weekId(Date.now());return sumIf(e=>e.d.length===10&&e.d!=='0000-00-00'&&weekId(e.d+'T12:00:00')===wk);};
  const month=mk=>{mk=mk||monthId();return sumIf(e=>e.d.slice(0,7)===mk);};
  /* 1.25: XP por tema da Matemática e por disciplina (as regras do servidor aceitam estas chaves) */
  const TXK=['Eleições','Partilha','Finanças','Estatística','Filosofia','Português','Inglês','Desenho A','Teologia','Modelação 3D','Python','Psicologia','História da Cultura e das Artes'];
  const tema=()=>{const t=ledger().tema,o={};TXK.forEach(k=>{if(t[k])o[k]=Math.round(t[k]);});return o;};
  {const _s=stats;stats=function(){const r=_s.apply(this,arguments);try{r.xp=total();r.lv=levelOf(r.xp);}catch(e){}return r;};}
  weekXP=function(){return week();};

  /* ---------- ligas (config/ligas) e prémios (premios/*) vindos do servidor ---------- */
  let LG=L.get('x16-lg',null),PREM={},subOn=false;
  function subscribe(){if(subOn||typeof FB==='undefined'||!FB||!FB.Fs||!fbUser||CONTA_OK!==true)return;subOn=true;const F=FB.Fs;
    try{F.onSnapshot(fdoc('config/ligas'),s=>{LG=s.exists()?s.data():null;L.set('x16-lg',LG?{semana:LG.semana,grupos:LG.grupos,tierDe:LG.tierDe,anterior:LG.anterior}:null);if(view==='comm'&&commTab==='rank')renderComm();if(view==='home')renderHome();},()=>{});}catch(e){}
    try{F.onSnapshot(fcol('premios'),s=>{PREM={};s.docs.forEach(d=>PREM[d.id]=d.data());coinsFromPrizes();if(view==='comm'&&commTab==='rank')renderComm();},()=>{});}catch(e){}}
  function coinsFromPrizes(){const p=PREM[uid];if(!p||!Array.isArray(p.hist))return;let cl={};try{cl=JSON.parse(localStorage.getItem('x12-chest')||'{}')||{};}catch(e){}
    let ch=false;p.hist.forEach(h=>{const k='p'+h.semana+(h.motivo||'');if(N(h.moedas)>0&&cl[k]!==N(h.moedas)){cl[k]=N(h.moedas);ch=true;}});if(ch)try{localStorage.setItem('x12-chest',JSON.stringify(cl));}catch(e){}}
  function myGroup(){if(!LG||!LG.grupos||!uid)return null;for(const [gid,g] of Object.entries(LG.grupos))if((g.membros||[]).includes(uid))return Object.assign({gid},g);return null;}
  function myTier(){const g=myGroup();if(g)return N(g.tier);if(LG&&LG.tierDe&&uid in LG.tierDe)return N(LG.tierDe[uid]);return 0;}
  // A liga deixa de depender do XP da semana: é o grupo em que estás
  tierOf=function(){const t=myTier();return{name:TIERN[t],col:TIERC[t],next:TIERN[t+1]||null,need:0};};
  if(typeof TIERS!=='undefined'){TIERS.length=0;TIERN.forEach((n,i)=>TIERS.push([i,n,TIERC[i]]));}
  const medals=u=>{const m=(PREM[u]||{}).medalhas||{};return{o:N(m.ouro),p:N(m.prata),b:N(m.bronze)};};
  const medalStr=u=>{const m=medals(u);return(m.o?'🥇'+m.o+' ':'')+(m.p?'🥈'+m.p+' ':'')+(m.b?'🥉'+m.b:'');};
  function endsIn(){const now=new Date(),mon=new Date(weekId(now)+'T00:00:00');mon.setDate(mon.getDate()+7);const h=Math.max(0,Math.round((mon-now)/36e5));return h>=48?Math.floor(h/24)+' dias':h+' h';}

  /* ---------- ranking ---------- */
  const R={mode:L.get('x16-rmode','liga'),tema:'Matemática'};
  const RDISC=['Matemática','Filosofia','Português','Inglês','Desenho A','Teologia','Modelação 3D','Python','Psicologia','História da Cultura e das Artes'],RCURTO={'História da Cultura e das Artes':'HCA'},MATK=['Eleições','Partilha','Finanças','Estatística'];
  const MODES=[['liga','A tua liga'],['week','Semana'],['month','Mês'],['all','Sempre'],['acc','Acerto'],['seq','Sequência'],['tema','Por tema']];
  function scoreOf(p){const wk=weekId(Date.now()),mk=monthId();
    if(R.mode==='week'||R.mode==='liga')return p.wk===wk?N(p.wxp):0;if(R.mode==='month')return p.mk===mk?N(p.mxp):0;if(R.mode==='all')return N(p.xp);
    if(R.mode==='seq'){/* 1.19: quem não estuda há mais de 2 dias perde a sequência no ranking */const e=p.streakEm&&typeof p.streakEm.toMillis==='function'?p.streakEm.toMillis():0;return e&&Date.now()-e>2.2*864e5?0:N(p.streak);}if(R.mode==='tema'){const tx=p.tx||{};return R.tema==='Matemática'?MATK.reduce((a,k)=>a+N(tx[k]),0):N(tx[R.tema]);}if(R.mode==='acc')return N(p.total)>=20?Math.round(N(p.certos)/N(p.total)*100):-1;return 0;}
  const unit=v=>R.mode==='acc'?v+'%':R.mode==='seq'?v+(v===1?' dia':' dias'):v.toLocaleString('pt-PT')+' XP';
  function mine(){const P=Object.assign({},PERFIS[uid]||{});const S=stats();P.nick=P.nick||ME.nick;P.cor=P.cor!=null?P.cor:ME.cor;P.foto=P.foto||ME.foto;
    // a tua linha usa sempre os teus pontos mais recentes, mesmo antes de chegarem ao servidor
    P.xp=Math.max(N(P.xp),S.xp);const wk=weekId(Date.now());const w=Math.max(P.wk===wk?N(P.wxp):0,week());P.wk=wk;P.wxp=w;const mk=monthId();P.mxp=Math.max(P.mk===mk?N(P.mxp):0,month());P.mk=mk;
    P.total=Math.max(N(P.total),S.total);P.certos=Math.max(N(P.certos),S.ok);P.streak=Math.max(N(P.streak),S.streak);P.tx=Object.assign({},P.tx||{},tema());return P;}
  function list(){const g=R.mode==='liga'?myGroup():null;if(R.mode==='liga'&&!g)return[];
    const src=Object.assign({},PERFIS||{});if(uid&&ME.ranking!==false)src[uid]=mine();
    return Object.entries(src).filter(([u,p])=>p&&p.nick&&p.ranking!==false&&p.banned!==true&&(!g||(g.membros||[]).includes(u))).map(([u,p])=>({u,p,s:scoreOf(p)}))
      .filter(x=>R.mode==='acc'?x.s>=0:(R.mode==='liga'||x.s>0||x.u===uid)).sort((a,b)=>b.s-a.s||N(b.p.xp)-N(a.p.xp));}
  function ligaList(){const m=R.mode;R.mode='liga';const l=list();R.mode=m;return l;}
  function modeKey(){return R.mode+(R.mode==='tema'?':'+R.tema:'');}
  function snap(lst){const today=dstr(new Date());let S=L.get('x16-snap',{d:today,p:{}}),P=L.get('x16-snap0',{d:'',p:{}});
    if(S.d!==today){P=S;S={d:today,p:{}};L.set('x16-snap0',P);}const k=modeKey(),cur={};lst.forEach((x,i)=>cur[x.u]=i+1);S.p[k]=cur;L.set('x16-snap',S);return P.p[k]||null;}
  function arrow(prev,u,i){if(!prev)return'';const a=prev[u];if(!a)return'<em class="x16ar new" title="Novo desde ontem">novo</em>';const d=a-(i+1);
    return d>0?'<em class="x16ar up" title="Subiu '+d+' desde ontem">▲'+d+'</em>':d<0?'<em class="x16ar down" title="Desceu '+(-d)+' desde ontem">▼'+(-d)+'</em>':'<em class="x16ar same" aria-hidden="true">–</em>';}
  function sub(u,p){return'Nível '+(N(p.nivel)||levelOf(N(p.xp)).n)+(N(p.streak)?' · '+N(p.streak)+' dia'+(N(p.streak)>1?'s':''):'')+(medalStr(u)?' · '+medalStr(u):'')+(p.curso&&p.curso!==ME.curso?' · '+esc(p.curso):'');}
  const HINT={liga:'O teu grupo desta semana. Conta o XP ganho desde segunda-feira.',week:'XP ganho desde segunda-feira, por toda a turma. Os 3 primeiros ganham medalha e moedas.',month:'XP ganho desde o dia 1 deste mês.',all:'Ordenado pelo XP total.',acc:'Percentagem de respostas certas. Só entra quem já fez 20 ou mais exercícios.',seq:'Dias seguidos a cumprir o estudo.',tema:'XP ganho nesta disciplina.'};
  function ligaCard(lst){const t=myTier(),g=myGroup(),n=lst.length,z=zona(n),me=lst.findIndex(x=>x.u===uid);
    let line;if(!g)line=LG?'Entras num grupo na próxima atualização das ligas (todos os dias à meia-noite).':'As ligas começam com a primeira atualização (todos os dias à meia-noite).';
    else if(me<0)line='Estás no grupo, mas o teu perfil ainda não carregou.';
    else{const pos=me+1,up=t<4&&pos<=z,down=t>0&&pos>n-z;
      if(up)line='<b>Zona de subida</b> · se ficares nos '+z+' primeiros sobes para a Liga '+TIERN[t+1]+'.';
      else if(t<4&&me>=z){const tgt=lst[z-1],gap=Math.max(1,tgt.s-lst[me].s+1);line='Faltam <b>'+gap+' XP</b> para entrares na zona de subida.';}
      else if(t===4)line='Estás na liga mais alta. Mantém-te fora dos '+z+' últimos.';
      if(down)line='<b>Zona de descida</b> · ganha XP para saíres dos '+z+' últimos.';}
    return'<div class="card x16lgc"><button class="x16embb" id="x16-lad" aria-label="Como funcionam as ligas">'+X10.emblem(TIERN[t],62)+'</button><div class="x16lgt"><div class="eyebrow">A tua liga · acaba daqui a '+endsIn()+'</div><b style="color:'+TIERC[t]+'">Liga '+TIERN[t]+'</b><span>'+line+'</span></div><button class="x15more x16pts" id="x16-pts">Os teus pontos</button></div>';}
  function syncLine(){const P=(typeof MYP!=='undefined'&&MYP)||PERFIS[uid],S=stats();
    /* 1.19: se o perfil não chegou ao servidor, a pessoa sabe porquê (antes via a sua linha e julgava que estava no ranking) */
    const why=c=>c==='permission-denied'?(fbUser&&!fbUser.emailVerified?'confirma o teu email':(!ME.ranking?'ativa «Aparecer no ranking» nas Definições':'confirma a hora do telemóvel (automática) e abre a app com internet')):'abre a app com internet';
    if(!P){if(typeof MYP==='undefined'||MYP===undefined)return'';return'<div class="x16sync" role="status" style="border-color:var(--x8-warn,#f5a524)">Ainda não estás no ranking da turma: '+why(window.SYNC_ERR)+'. Os teus pontos ficam guardados e entram quando isso estiver resolvido.</div>';}
    if(window.SYNC_ERR&&window.SYNC_ERR!=='unavailable')return'<div class="x16sync" role="status">Os pontos não estão a chegar ao ranking: '+why(window.SYNC_ERR)+'. Não perdes nada: entram assim que der.</div>';
    const srv=N(P.xp);const wk=weekId(Date.now()),wsrv=P.wk===wk?N(P.wxp):0;
    if(srv>=S.xp&&wsrv<Math.min(week(),srv))return'<div class="x16sync" role="status">A enviar os pontos desta semana para o ranking: '+wsrv.toLocaleString('pt-PT')+' de '+week().toLocaleString('pt-PT')+' XP…</div>';
    if(srv<S.xp)return'<div class="x16sync" role="status">A enviar os teus pontos para o ranking: '+srv.toLocaleString('pt-PT')+' de '+S.xp.toLocaleString('pt-PT')+' XP…</div>';
    return'<div class="x16sync ok" role="status">✓ Os teus pontos estão atualizados no ranking</div>';}
  function rankHTML(){
    /* 1.33: sem grupo de liga (ainda não foi feito), mostra-se o ranking da turma desta semana em vez de um ecrã vazio */
    let semGrupo='';if(R.mode==='liga'&&!list().length){R.mode='week';semGrupo='<div class="x16sync" role="status">O teu grupo da liga é feito à meia-noite. Até lá, este é o ranking da turma desta semana.</div>';}
    const lst=list(),prev=snap(lst),me=lst.findIndex(x=>x.u===uid);
    if(R.mode==='week'&&me>=0)L.set('x16-wpos',{wk:weekId(Date.now()),p:me+1});
    let h=ligaCard(R.mode==='liga'?lst:ligaList());
    /* 1.20: separadores em dois níveis (antes 7 em duas linhas): Liga · Turma (semana/mês/sempre) · Recordes (acerto/sequência/tema) */
    const GR=[['liga','A tua liga',['liga']],['turma','Turma',['week','month','all']],['rec','Recordes',['acc','seq','tema']]],gr=GR.find(g=>g[2].includes(R.mode))||GR[1];
    h+='<div class="x16modes x20g" role="tablist" aria-label="Ranking">'+GR.map(([k,n,ms])=>'<button role="tab" data-x20g="'+k+'" aria-selected="'+(gr[0]===k)+'">'+n+'</button>').join('')+'</div>';
    if(gr[2].length>1)h+='<div class="x20sub" role="tablist" aria-label="'+gr[1]+'">'+gr[2].map(k=>'<button role="tab" data-x16m="'+k+'" aria-selected="'+(R.mode===k)+'">'+({week:'Esta semana',month:'Este mês',all:'Desde sempre',acc:'Acerto',seq:'Sequência',tema:'Por disciplina'})[k]+'</button>').join('')+'</div>';
    if(R.mode==='tema')h+='<div class="x16f">'+RDISC.map(t=>'<button class="x16c" data-x16t="'+t+'" aria-pressed="'+(R.tema===t)+'"'+(RCURTO[t]?' aria-label="'+t+'"':'')+'>'+(RCURTO[t]||t)+'</button>').join('')+'</div>';
    h+=semGrupo+syncLine();
    if(!lst.length)h+='<div class="x8empty">'+NEX8('dormir',100)+'<b>'+(R.mode==='acc'?'Ainda ninguém tem 20 exercícios':R.mode==='liga'?'Ainda não tens grupo':'Ainda ninguém está aqui')+'</b><p>'+(R.mode==='acc'?'Quem fizer 20 exercícios entra neste ranking.':R.mode==='liga'?'Os grupos são feitos todos os dias à meia-noite. Entretanto vê o ranking da semana.':'Faz exercícios para ganhar XP e aparecer em primeiro.')+'</p><button class="x8p l sm" type="button" data-ir="home">Fazer exercícios agora</button></div>';
    else{const n=lst.length,z=zona(n),t=myTier();
      if(R.mode!=='liga'&&lst.length>=3&&lst[2].s>0){const pc=(x,i)=>'<button class="x16pc x16p'+(i+1)+'" data-user="'+esc(x.u)+'">'+(i===0?'<span class="x16crown" aria-hidden="true">♛</span>':'')+avatar(x.p.nick,x.p.cor,i===0?'lg':'',x.p.foto)+'<b>'+esc(x.p.nick)+(x.u===uid?' (tu)':'')+'</b><small>'+unit(x.s)+'</small><div class="x16step"><span>'+(i+1)+'</span></div></button>';
        h+='<div class="x16pod" aria-label="Pódio">'+pc(lst[1],1)+pc(lst[0],0)+pc(lst[2],2)+'</div>';}
      const zc=i=>R.mode!=='liga'?'':(t<4&&i<z?' zup':t>0&&i>=n-z?' zdown':'');
      const row=(x,i,cls)=>'<button class="x16row'+(x.u===uid?' me':'')+(i<3&&R.mode!=='liga'?' t'+(i+1):'')+zc(i)+(cls||'')+'" data-user="'+esc(x.u)+'"><span class="x16pos">'+(1+lst.filter(y=>y.s>x.s).length)+'</span>'+arrow(prev,x.u,i)+avatar(x.p.nick,x.p.cor,'',x.p.foto)+'<div class="x16nm"><b>'+esc(x.p.nick)+(x.u===uid?' (tu)':'')+'</b><span>'+sub(x.u,x.p)+'</span></div><span class="x16sc">'+unit(x.s)+'</span></button>';
      const pod=R.mode!=='liga'&&lst.length>=3&&lst[2].s>0;
      /* 1.20: quanto falta para passares quem está à tua frente */
      if(me>0){const ah=lst[me-1],gap=ah.s-lst[me].s;if(gap>0&&R.mode!=='acc'&&R.mode!=='seq')h+='<div class="x20gap"><b>Faltam '+unit(gap+1)+'</b> para passares '+esc(ah.p.nick)+' e ficares em '+(1+lst.filter(y=>y.s>lst[me].s+gap).length)+'.º</div>';}
      else if(me===0&&lst.length>1&&lst[0].s>0)h+='<div class="x20gap top"><b>Estás em 1.º</b> com '+unit(lst[0].s-lst[1].s)+' de vantagem sobre '+esc(lst[1].p.nick)+'.</div>';
      let rows='';lst.slice(0,100).forEach((x,i)=>{if(pod&&i<3)return;
        /* 1.25: as legendas das zonas ficam ANTES das linhas a que se referem */
        if(R.mode==='liga'&&t<4&&i===0)rows+='<div class="x16zl up">▲ Zona de subida · os '+z+' primeiros sobem para a Liga '+TIERN[t+1]+'</div>';
        if(R.mode==='liga'&&i===(t<4?z:0)&&n-(t>0?z:0)>i)rows+='<div class="x16zl mid">Ficam na Liga '+TIERN[t]+'</div>';
        if(R.mode==='liga'&&t>0&&i===n-z&&n-z>0)rows+='<div class="x16zl down">▼ Zona de descida · os '+z+' últimos descem para a Liga '+TIERN[t-1]+'</div>';rows+=row(x,i);});
      h+='<div class="x16list">'+rows+'</div>';
      if(me>=0)h+='<div class="x16mine" aria-hidden="true">'+row(lst[me],me,' sticky').replace('<button ','<button tabindex="-1" ')+'</div>';}
    h+='<p class="hint">'+HINT[R.mode]+' Os pontos atualizam-se sozinhos a cada exercício. Podes sair do ranking no teu perfil.</p>';
    /* 1.20: convidar a turma direto do ranking (código QR) */
    h+='<button class="x20inv" id="x20-inv"><img src="icons/qr.png" alt="" width="56" height="56"><span><b>Falta alguém da turma?</b><small>Mostra o código QR ou envia o link da app.</small></span><i aria-hidden="true">›</i></button>';return h;}
  function bindRank(el){const r=()=>renderComm();
    el.querySelectorAll('[data-x16m]').forEach(b=>b.onclick=()=>{R.mode=b.dataset.x16m;L.set('x16-rmode',R.mode);L.set('x20-sub-'+(['acc','seq','tema'].includes(R.mode)?'rec':'turma'),R.mode);r();});
    el.querySelectorAll('[data-x20g]').forEach(b=>b.onclick=()=>{const g=b.dataset.x20g;R.mode=g==='liga'?'liga':L.get('x20-sub-'+g,g==='rec'?'acc':'week');L.set('x16-rmode',R.mode);r();});
    const inv=el.querySelector('#x20-inv');if(inv)inv.onclick=()=>{if(typeof X13!=='undefined'&&X13.invite)X13.invite();};
    el.querySelectorAll('[data-x16t]').forEach(b=>b.onclick=()=>{R.tema=b.dataset.x16t;r();});
    el.querySelectorAll('.x16pod [data-user],.x16row[data-user]').forEach(b=>b.onclick=()=>openUser(b.dataset.user));
    const lad=el.querySelector('#x16-lad');if(lad)lad.onclick=ladder;const pt=el.querySelector('#x16-pts');if(pt)pt.onclick=points;}
  function ladder(){const t=myTier();const s=X11.sheet('Como funcionam as ligas','<p class="x8sub" style="margin:0 0 12px">Cada semana ficas num grupo de até 12 colegas da mesma liga. Conta o XP que ganhas de segunda a domingo. No fim da semana, os primeiros sobem de liga (e ganham 15 moedas) e os últimos descem.</p><div class="x16ligas big">'+TIERN.map((n,i)=>'<div class="'+(i===t?'me':'')+'">'+X10.emblem(n,44)+'<b style="color:'+TIERC[i]+'">Liga '+n+'</b><span>'+(i===0?'Começam todos aqui':'Sobe-se da Liga '+TIERN[i-1])+'</span>'+(i===t?'<em>Estás aqui</em>':'')+'</div>').join('')+'</div>'+
    '<div class="x16tbl" style="margin-top:12px"><div><span>Grupo com 9 ou mais</span><b>sobem 3 · descem 3</b></div><div><span>Grupo com 5 a 8</span><b>sobem 2 · descem 2</b></div><div><span>Grupo com menos de 5</span><b>sobe 1 · desce 1</b></div></div><p class="x8sub">Quem fica com 0 XP na semana não sobe. Na Liga Bronze ninguém desce.</p><button class="x8p w" style="width:100%;margin-top:6px" id="x16-lok">Percebi</button>');
    s.sh.querySelector('#x16-lok').onclick=s.close;}
  if(typeof X10!=='undefined')X10.ladder=ladder;

  /* ---------- página "Os teus pontos" ---------- */
  const ICK={ex:'✓',combo:'⚡',mis:'★',antes:'⟲'};
  function points(){const S=stats(),lv=S.lv,Ld=ledger(),t=myTier(),c=typeof X12!=='undefined'&&X12.coins?X12.coins():0,m=medals(uid),ph=((PREM[uid]||{}).hist||[]).slice().reverse();
    const days={};Ld.ev.forEach(e=>{(days[e.d]=days[e.d]||[]).push(e);});const ds=Object.keys(days).sort().reverse().slice(0,30);
    const hist=ds.map(d=>{const l=days[d],sum=l.reduce((a,e)=>a+e.xp,0);return'<div class="x16hd"><div class="x16hdh"><b>'+(d==='0000-00-00'?'Antes da conta':fmtDia(d))+'</b><span>+'+sum+' XP</span></div>'+
      l.map(e=>'<div class="x16he"><i>'+ICK[e.kind]+'</i><span>'+esc(e.txt)+'</span><b>+'+e.xp+'</b></div>').join('')+'</div>';}).join('');
    const rows=[['Exercício certo','+'+V.ok+' XP'],['Certo na simulação do teste ou no modo exame','+'+V.okSim+' XP'],['Certas seguidas (a partir da 3.ª)','+2, +4, +6… até +'+V.comboMax+' XP'],['Missão do dia cumprida','+'+V.mis+' XP'],['Exercício errado ou repetido','0 XP']];
    const crows=[['Objetivo do dia cumprido','+10'],['Dia com 5 ou mais exercícios','+3'],['Duelo ganho','+20'],['Baús das sequências de dias','+20 a +100'],['1.º, 2.º e 3.º da semana','+30, +20, +10'],['Subir de liga','+15']];
    const s=X11.sheet('Os teus pontos',
      '<div class="x16top"><div class="x16big"><span>XP total</span><b>'+S.xp.toLocaleString('pt-PT')+'</b><em>'+week()+' XP esta semana · '+month()+' XP este mês</em></div>'+
      '<div class="x16lv"><div class="x16lvh"><b>Nível '+lv.n+' · '+esc(lv.name)+'</b><span>'+lv.into+' / '+lv.need+' XP</span></div><div class="x16bar"><i style="width:'+Math.round(lv.into/lv.need*100)+'%"></i></div></div>'+
      '<div class="x16lg"><span class="x16emb">'+X10.emblem(TIERN[t],46)+'</span><div style="flex:1;min-width:0"><div class="x16lvh"><b style="color:'+TIERC[t]+'">Liga '+TIERN[t]+'</b><span>'+c+' moedas'+(m.o+m.p+m.b?' · '+medalStr(uid):'')+'</span></div><span class="x8sub" style="font-size:13px">A liga é o teu grupo da semana. As moedas gastam-se na loja: proteção da sequência, cores do perfil e cores do Nex.</span></div></div></div>'+
      '<h3 class="x16h3">Como ganhas XP'+(Date.now()<T0?' (a partir de 7 de novembro)':'')+'</h3><div class="x16tbl">'+rows.map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'</div>'+
      '<p class="x8sub" style="margin:6px 0 0">O XP sobe o nível e conta para os rankings. Os exercícios feitos antes de 7 de novembro mantêm as regras antigas (certo +10, errado +2).</p>'+
      '<h3 class="x16h3">Como ganhas moedas</h3><div class="x16tbl">'+crows.map(r=>'<div><span>'+r[0]+'</span><b>'+r[1]+'</b></div>').join('')+'</div><button class="x15more" id="x16-loja">Abrir a loja ('+c+' moedas)</button>'+
      '<h3 class="x16h3">Ligas</h3><p class="x8sub" style="margin:0 0 8px">Cada semana ficas num grupo com colegas da mesma liga. No domingo à meia-noite os primeiros sobem e os últimos descem.</p><button class="x15more" id="x16-plad">Como funcionam as ligas</button>'+
      (ph.length?'<h3 class="x16h3">Prémios</h3>'+ph.slice(0,20).map(p=>'<div class="x16he"><i>'+(p.medalha==='ouro'?'🥇':p.medalha==='prata'?'🥈':p.medalha==='bronze'?'🥉':'▲')+'</i><span>'+esc(p.texto||'')+' · '+fmtSem(p.semana)+'</span><b>+'+N(p.moedas)+' moedas</b></div>').join(''):'')+
      '<h3 class="x16h3">Histórico de XP</h3>'+(hist||'<p class="x8sub">Ainda não ganhaste XP. Faz o primeiro exercício.</p>')+
      '<p class="x8sub" style="margin-top:12px">O nível 2 começa nos 100 XP e cada nível seguinte pede mais 60 XP do que o anterior.</p>',{wide:true});
    s.sh.querySelector('#x16-plad').onclick=ladder;const lj=s.sh.querySelector('#x16-loja');if(lj)lj.onclick=()=>{s.close();try{X12.shop();}catch(e){}};return s;}

  /* ---------- fim de semana: resultado da liga e prémios ---------- */
  function notices(){if(!LG||!LG.anterior||!uid||document.querySelector('.x11sh,.x8sheet'))return;const A=LG.anterior,res=(A.resultados||{})[uid];if(!res)return;
    const seen=L.get('x16-seen','');if(seen===A.semana)return;L.set('x16-seen',A.semana);
    const t=N(res.tier),pod=(A.podio||[]).indexOf(uid),msg=res.mov==='sobe'?'Subiste para a Liga '+TIERN[t]+'!':res.mov==='desce'?'Desceste para a Liga '+TIERN[t]+'. Esta semana dá para voltar a subir.':'Continuas na Liga '+TIERN[t]+'.';
    const s=X11.sheet('A tua semana','<div class="x11empty"><span class="x16emb">'+X10.emblem(TIERN[t],84)+'</span><b>'+msg+'</b><div class="x16wk"><div><b>'+N(res.wxp)+'</b><span>XP na semana</span></div><div><b>'+N(res.pos)+'.º</b><span>no teu grupo</span></div><div><b>'+(pod>=0?['🥇','🥈','🥉'][pod]:'—')+'</b><span>pódio da turma</span></div></div>'+
      (N(res.moedas)?'<p>Ganhaste <b>'+N(res.moedas)+' moedas</b>. Já estão na tua loja.</p>':'<p>Começou uma semana nova: o XP da semana recomeçou do zero.</p>')+'<button class="x8p w" id="x16-wok" style="width:100%">Ver a nova liga</button></div>');
    if((res.mov==='sobe'||pod>=0)&&X8.confetti)X8.confetti(80);s.sh.querySelector('#x16-wok').onclick=()=>{s.close();commTab='rank';R.mode='liga';go('comm');};}

  /* ---------- Início: a tua posição ---------- */
  function homeHTML(){const lst=(()=>{const m=R.mode;R.mode='liga';const g=myGroup();const l=g?list():null;R.mode='week';const w=list();R.mode=m;return{l,w};})();
    const t=myTier(),pos=(l,u)=>{const m=l?l.find(x=>x.u===u):null;return m?1+l.filter(y=>y.s>m.s).length:0;},lp=pos(lst.l,uid),wp=pos(lst.w,uid);
    const wk0=week()<=0;const a=lp&&!wk0?lp+'.º no teu grupo da Liga '+TIERN[t]:'Liga '+TIERN[t];const b=wp&&!wk0?wp+'.º na semana da turma':'';
    return'<button class="x8tst sf x16home" id="x16-hr">'+X10.emblem(TIERN[t],34)+'<div><b>'+a+'</b><span>'+(wk0?'Faz 1 exercício para entrares no ranking desta semana':(b?b+' · ':'')+week()+' XP esta semana')+'</span></div>'+X8ic('chev')+'</button>';}

  return{V,T0,TIERN,ledger,total,week,month,monthId,tema,points,notices,rankHTML,bindRank,ladder,subscribe,myGroup,myTier,medalStr,homeHTML,R,zona,dayXP};
})();

/* ranking novo no separador Ranking da Comunidade */
{const _rc=renderComm;renderComm=function(){const r=_rc.apply(this,arguments);try{X16.subscribe();if(commTab!=='rank')return r;const el=document.getElementById('v-comm');
  const keep=[...el.querySelectorAll('.x12cc,.x12duels')];
  const sect=el.querySelector('.rank,.x8pod,.card.league,[data-rk]');let box=sect;while(box&&box.parentElement&&box.parentElement!==el&&!box.parentElement.classList.contains('sect'))box=box.parentElement;
  const host=(box&&box.parentElement)||el;
  [...host.querySelectorAll(':scope>.chips,:scope>.card.league,:scope>.card,:scope>.x8pod,:scope>.rank,:scope>.hint,:scope>.x8empty,:scope>.empty,:scope>.x16rank')].forEach(n=>{if(!n.querySelector('[data-ct]')&&!n.matches('.x12cc,.x12duels'))n.remove();});
  keep.forEach(n=>n.remove());
  const wrap=document.createElement('div');wrap.className='x16rank';wrap.innerHTML=X16.rankHTML();host.appendChild(wrap);
  const lgc=wrap.querySelector('.x16lgc');if(keep[0]&&lgc)lgc.after(keep[0]);if(keep[1])wrap.appendChild(keep[1]);
  X16.bindRank(wrap);if(typeof X12!=='undefined'&&X12.bindDuels)X12.bindDuels(el);}catch(e){console.error(e);}return r;};}
{const _rh=renderHome;let done=false;renderHome=function(){const r=_rh.apply(this,arguments);try{X16.subscribe();const el=document.getElementById('v-home');const t=el&&el.querySelector('.x8tst');if(t&&!el.querySelector('#x16-hr')){t.insertAdjacentHTML('afterend',X16.homeHTML());el.querySelector('#x16-hr').onclick=()=>{commTab='rank';go('comm');};}}catch(e){}
  if(!done){done=true;setTimeout(()=>{try{X16.notices();}catch(e){}},2500);}return r;};}
// a ligação ao servidor pode chegar depois do primeiro desenho
setInterval(()=>{try{X16.subscribe();}catch(e){}},5000);
// Confirma com o servidor que o histórico está atualizado (o primeiro retrato pode vir da cache do dispositivo);
// só depois disso os pontos são enviados para o ranking.
{let tried=0;const chk=setInterval(()=>{try{if(typeof HISTSRV==='undefined'||HISTSRV){clearInterval(chk);return;}
  if(!FB||!FB.Fs||!uid||!fbUser||typeof FB.Fs.getDocsFromServer!=='function'||tried>=3)return;tried++;
  FB.Fs.getDocsFromServer(fcol('data/users/'+uid)).then(()=>setTimeout(()=>{HISTSRV=true;lastSync='';syncProfile();},1500)).catch(()=>{});}catch(e){}},2500);}
/* tocar no XP do topo ou do perfil abre "Os teus pontos" */
document.addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('#topstats .chipstat,.phead .chipstat');if(c){e.preventDefault();X16.points();}});

/* ===== 1.16.1 · correções do teste completo (gametest) ===== */
const X17=(()=>{
  const N=v=>Number.isFinite(+v)?+v:0;
  const GAIN={};// XP ganho em cada exercício (chave K(t,n)), calculado com as regras certas

  /* 1 · os rascunhos não se perdem quando a página se redesenha (mural, conversa, perfil) */
  function snapFields(){const out=[];const v=document.querySelector('[data-view]:not([hidden])');if(!v)return out;
    v.querySelectorAll('textarea[id],input[id]').forEach(f=>{if(f.type==='checkbox'||f.type==='radio'||f.type==='file'||f.type==='password')return;
      out.push({id:f.id,v:f.value,focus:document.activeElement===f,s:f.selectionStart,e:f.selectionEnd});});return out;}
  function restoreFields(L){L.forEach(x=>{const f=document.getElementById(x.id);if(!f)return;if(x.v&&f.value!==x.v&&!f.value)f.value=x.v;
    if(x.focus&&document.activeElement!==f){try{f.focus({preventScroll:true});if(x.s!=null)f.setSelectionRange(x.s,x.e);}catch(e){}}});}

  /* 3 · modo exame: não mostra se está certo antes do fim */
  function examView(){if(!document.body.classList.contains('x11exam'))return;const S=st.sess;if(!S)return;
    const done=S.list.filter(([t,n])=>st.ans[K(t,n)]!==undefined).length,pc=document.getElementById('p-count');
    if(pc){const et=document.getElementById('x11-et');pc.textContent='Exercício '+(S.i+1)+' de '+S.list.length+' · '+done+(done===1?' respondida':' respondidas');if(et)pc.append(' · ',et);}
    document.querySelectorAll('#segs i').forEach(i=>{if(i.classList.contains('ok')||i.classList.contains('bad')){i.classList.remove('ok','bad');i.classList.add('x17ans');}});
    const c=cur(),g=st.ans[K(c.t,c.n)];
    document.querySelectorAll('#v-play .opts .opt').forEach(o=>{o.classList.remove('ok','bad','just');if(g!==undefined&&+o.dataset.j===g)o.classList.add('x17pick');});
    document.querySelectorAll('#v-play .fb').forEach(f=>f.remove());}

  /* 5 · XP de cada exercício com as regras certas (antes e depois de 7 nov) */
  function todayItems(){const d=HIST.find(x=>x.date===today());return d?(d.items||[]):[];}
  function dayGain(){const r=X16.dayXP(todayItems(),false);return r.ex+r.cb;}
  function gainText(k){if(st.rtk&&st.rtk[k])return'repetido · sem XP';const g=GAIN[k];if(g==null)return null;return g>0?'+'+g+' XP':'sem XP';}
  function fixPlayXP(){const c=cur();if(!c)return;const t=gainText(K(c.t,c.n));const x=document.querySelector('#v-play .fb .xpgain');if(x&&t)x.textContent=t;}
  function sessGain(S){let s=0;S.list.forEach(([t,n])=>{s+=N(GAIN[K(t,n)]);});return s;}

  /* 4 · botão "voltar" do telemóvel: fecha o que estiver aberto ou volta ao ecrã anterior, sem sair da app */
  let popping=false;
  function openOverlay(){return document.querySelector('.x11sh,.x8sheet,.result,#x13fi,.x10fc:not([hidden]),.x10lad,.sheet,.nsheet');}
  function closeOverlay(o){if(o.id==='x13fi'&&X13.closeFicha){X13.closeFicha();return;}
    const x=o.querySelector('.x11x,.x8x,#x16-lok,#r-close,.close,[aria-label="Fechar"]');if(x){x.click();return;}
    document.querySelectorAll('.x8sheet-bg,.sheet-bg,.x11sh-bg').forEach(b=>b.click());if(document.body.contains(o))o.remove();}
  function initHistory(){try{history.replaceState({x17:1,v:view},'');history.pushState({x17:1,v:view},'');}catch(e){}
    addEventListener('popstate',e=>{const o=openOverlay();
      if(o){closeOverlay(o);}
      else if(view==='disc'&&window.XD&&XD.back&&XD.back()){}
      else if(view==='play'){go(st.sess&&st.sess.from?st.sess.from:'home');}
      else if(view!=='home'){go(view==='module'?'study':'home');}
      else{/* no Início: deixa sair à segunda */return;}
      try{history.pushState({x17:1,v:view},'');}catch(err){}});}

  /* 8 · teclado: ao abrir uma folha, o foco entra nela; Escape fecha a calculadora/rascunho/fórmula */
  function focusSheets(){new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.nodeType!==1)continue;
      if(n.matches&&n.matches('.x11sh,.x8sheet')){setTimeout(()=>{if(!document.body.contains(n)||n.contains(document.activeElement))return;const f=n.querySelector('.x11x,.x8x,button,[href],input,select,textarea');if(f)try{f.focus({preventScroll:true});}catch(e){}},60);}}}).observe(document.body,{childList:true});
    document.addEventListener('keydown',e=>{
      if(e.key==='Tab'){const sh=[...document.querySelectorAll('.x11sh,.x8sheet')].pop();if(!sh)return;const f=[...sh.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])')].filter(x=>x.offsetParent!==null);if(!f.length)return;
        const a=f[0],z=f[f.length-1];if(!sh.contains(document.activeElement)){e.preventDefault();a.focus();}else if(e.shiftKey&&document.activeElement===a){e.preventDefault();z.focus();}else if(!e.shiftKey&&document.activeElement===z){e.preventDefault();a.focus();}}
      if(e.key==='Escape'&&view==='play'&&!openOverlay()){const on=document.querySelector('#v-play .tool[aria-pressed="true"]');if(on){on.click();e.preventDefault();}}});}

  /* 11 · a tua linha fixa no ranking só aparece quando a tua linha verdadeira não está à vista */
  let io=null;
  function rankMine(){const el=document.getElementById('v-comm');if(!el)return;const mine=el.querySelector('.x16mine'),me=el.querySelector('.x16list .x16row.me');if(!mine||!me)return;
    if(io)io.disconnect();io=new IntersectionObserver(es=>{es.forEach(x=>mine.classList.toggle('x17hide',x.isIntersecting));},{threshold:.6});io.observe(me);}

  /* 14 · Definições: "Apagar a minha conta" fica sempre no fim */
  function dangerLast(){const el=document.getElementById('v-profile');if(!el||profTab!=='defs')return;const d=el.querySelector('.x8card.x8danger');if(d&&d.parentElement&&d.nextElementSibling)d.parentElement.appendChild(d);}

  return{snapFields,restoreFields,examView,fixPlayXP,sessGain,GAIN,dayGain,initHistory,focusSheets,rankMine,dangerLast};
})();

{const _rf=refresh;refresh=function(){const L=X17.snapFields();const r=_rf.apply(this,arguments);try{X17.restoreFields(L);}catch(e){}return r;};}
{const _rc=renderComm;renderComm=function(){const L=X17.snapFields();const r=_rc.apply(this,arguments);try{X17.restoreFields(L);if(commTab==='rank')X17.rankMine();}catch(e){}return r;};}
{const _rec=record;record=function(t,n,g,mode){let b=0;try{b=X17.dayGain();}catch(e){}const r=_rec.apply(this,arguments);
  try{const k=K(t,n);if(!(st.rtk&&st.rtk[k]))X17.GAIN[k]=Math.max(0,X17.dayGain()-b);else X17.GAIN[k]=0;
    const x=document.querySelector('.x8fb .xp'),gk=X17.GAIN[k];if(x){if(gk>0)x.textContent='+'+gk+' XP';else x.remove();}X17.fixPlayXP();}catch(e){}return r;};}
{const _rp=renderPlay;renderPlay=function(){const r=_rp.apply(this,arguments);try{X17.fixPlayXP();X17.examView();}catch(e){}return r;};}
{const _ss=startSess;startSess=function(){const from=view;const r=_ss.apply(this,arguments);try{if(st.sess&&!st.sess.from){st.sess.from=from==='play'?'home':from;save();}}catch(e){}return r;};}
{const _rp2=renderProfile;renderProfile=function(){const r=_rp2.apply(this,arguments);try{X17.dangerLast();}catch(e){}return r;};}
/* 1.20: convidar colegas também a partir do Início (código QR grande + Partilhar + Copiar link) */
{const _rh20=renderHome;renderHome=function(){const r=_rh20.apply(this,arguments);try{const el=document.getElementById('v-home');if(el&&!el.querySelector('#x20-inv-h')){
  const b=document.createElement('button');b.className='x20inv';b.id='x20-inv-h';b.innerHTML='<img src="icons/qr.png" alt="" width="56" height="56"><span><b>Partilhar a app</b><small>Código QR e link para os colegas da turma.</small></span><i aria-hidden="true">›</i>';
  b.onclick=()=>{if(typeof X13!=='undefined'&&X13.invite)X13.invite();};const host=el.querySelector('.wrap,main,section')||el;host.appendChild(b);}}catch(e){}return r;};}
try{X17.initHistory();X17.focusSheets();}catch(e){}
/* 1.21: canais ordenados pela última mensagem, com «há quanto tempo»; os parados há mais de 14 dias ficam no fim e mais apagados */
{const LAST={},ask={};let lastAsk=0;
 function chLast(){if(typeof FB==='undefined'||!FB||!FB.Fs||!fbUser||Date.now()-lastAsk<60000)return;lastAsk=Date.now();const F=FB.Fs;
   CHANS.forEach(([id])=>{F.getDocs(F.query(fcol('canais/'+id+'/msgs'),F.orderBy('ts','desc'),F.limit(1))).then(q=>{const d=q.docs[0];const t=d?d.data().ts:0;LAST[id]=t&&t.toMillis?t.toMillis():(+t||0);if(view==='comm'&&commTab==='chat')decor();}).catch(()=>{});});}
 const ago=t=>{const m=(Date.now()-t)/6e4;return m<60?'agora':m<1440?Math.round(m/60)+' h':Math.round(m/1440)+' d';};
 function decor(){const nav=document.querySelector('#v-comm .chans');if(!nav)return;const bs=[...nav.querySelectorAll('[data-ch]')];
   bs.sort((a,b)=>(LAST[b.dataset.ch]||0)-(LAST[a.dataset.ch]||0)).forEach(b=>{const t=LAST[b.dataset.ch]||0;b.classList.toggle('x21quiet',!t||Date.now()-t>14*864e5);let e=b.querySelector('.x21ago');if(t){if(!e){e=document.createElement('em');e.className='x21ago';b.appendChild(e);}e.textContent=ago(t);}nav.appendChild(b);});
   [...nav.children].filter(x=>!x.dataset.ch).forEach(x=>nav.appendChild(x));}
 const _rc21=renderComm;renderComm=function(){const r=_rc21.apply(this,arguments);try{if(commTab==='chat'){decor();chLast();}}catch(e){}return r;};}
/* ===== 1.21 · carteira na conta: moedas gastas, baús, prémios de duelos e compras ficam em data/users/{uid}/loja =====
   O telemóvel continua a guardar uma cópia (localStorage x12-* / x21-*) para funcionar sem rede.
   Ao ligar: junta o servidor com o telemóvel (gasto = maior, baús/duelos/compras = união) e envia o resultado. */
const X21=(()=>{
  const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const N=v=>Number.isFinite(+v)?Math.max(0,Math.floor(+v)):0;
  let sub=null,subUid=null,last='',got=false,timer=null,srv=null;const skip=new Set();
  function local(){const ch=LS.get('x12-chest',{}),baus={};Object.keys(ch).forEach(k=>{if(/^[0-9]+$/.test(k))baus[k]=Math.min(200,N(ch[k]));});
    const f=(typeof st!=='undefined'&&st.frz)||{have:0,used:[],lastKey:''};
    return{gasto:N(LS.get('x12-spent',0)),baus,duelos:LS.get('x21-dw',{}),own:LS.get('x12-own',['lilas']).slice(0,20),cores:LS.get('x21-cores',[]).slice(0,12),
      skin:String(LS.get('x12-skin','lilas')).slice(0,20),top:LS.get('x12-top',[]).slice(0,3),frz:{have:Math.min(3,N(f.have)),used:(f.used||[]).slice(-60),lastKey:String(f.lastKey||'')}};}
  const sig=o=>JSON.stringify(o);
  function apply(r,serverWins){/* junta o que veio do servidor ao telemóvel */
    LS.set('x12-spent',Math.max(N(LS.get('x12-spent',0)),N(r.gasto)));
    const ch=LS.get('x12-chest',{});Object.entries(r.baus||{}).forEach(([k,v])=>{if(ch[k]==null)ch[k]=N(v);});LS.set('x12-chest',ch);
    LS.set('x21-dw',Object.assign({},r.duelos||{},LS.get('x21-dw',{})));
    LS.set('x12-own',[...new Set([...(LS.get('x12-own',['lilas'])),...(r.own||[])])]);
    LS.set('x21-cores',[...new Set([...(LS.get('x21-cores',[])),...(r.cores||[]).map(Number)])]);
    if(serverWins){if(r.skin)LS.set('x12-skin',r.skin);if(Array.isArray(r.top))LS.set('x12-top',r.top);
      if(r.frz&&typeof st!=='undefined'){st.frz={have:Math.min(3,N(r.frz.have)),used:[...new Set([...(st.frz&&st.frz.used||[]),...(r.frz.used||[])])].slice(-60),lastKey:String(r.frz.lastKey||'')};try{save();}catch(e){}}}
    try{if(typeof X12!=='undefined'&&X12.applySkin)X12.applySkin();}catch(e){}}
  /* 1.26: o servidor só aceita um duelo novo por escrita (com o id em «dk») e os baús com os valores já guardados */
  const MIL=['3','7','14','30','60','100'];
  function toSend(){const o=local(),sb=(srv&&srv.baus)||{},sd=(srv&&srv.duelos)||{};const baus={};
    Object.keys(o.baus).forEach(k=>{if(MIL.includes(k))baus[k]=sb[k]!=null?N(sb[k]):Math.min(100,o.baus[k]);});Object.keys(sb).forEach(k=>{if(MIL.includes(k)&&baus[k]==null)baus[k]=N(sb[k]);});
    const duelos=Object.assign({},srv?sd:{});let dk='';
    if(srv){const nw=Object.keys(o.duelos).filter(k=>sd[k]==null&&!skip.has(k)&&/^[A-Za-z0-9_-]{1,128}$/.test(k));if(nw.length){dk=nw[0];const v=N(o.duelos[dk]);duelos[dk]=[0,5,20].includes(v)?v:0;}}
    return Object.assign({},o,{baus,duelos,dk,gasto:Math.max(o.gasto,N(srv&&srv.gasto))});}
  /* 1.39: o envio fica marcado logo ao sair e só há um de cada vez. Antes, o eco local da própria escrita chegava
     antes da resposta do servidor e voltava a enviar e a redesenhar o Início em ciclo, enquanto a rede respondia. */
  let inflight=false;
  function push(){if(!ready()||inflight)return;const o=toSend();const g=sig(o);if(g===last)return;const F=FB.Fs;inflight=true;last=g;
    F.setDoc(fdoc('data/users/'+uid+'/loja'),Object.assign({},o,{upd:F.serverTimestamp()})).then(()=>{srv=o;}).catch(()=>{/* um duelo que o servidor já não aceita (apagado ao fim de 30 dias) é saltado */if(o.dk){skip.add(o.dk);last='';}}).finally(()=>{inflight=false;});}
  const ready=()=>typeof FB!=='undefined'&&FB&&FB.Fs&&typeof fbUser!=='undefined'&&fbUser&&!isAnon()&&uid&&got;
  function start(){if(typeof FB==='undefined'||!FB||!FB.Fs||!fbUser||isAnon()||!uid)return;if(sub&&subUid===uid)return;if(sub){try{sub();}catch(e){}}
    got=false;last='';subUid=uid;const F=FB.Fs;
    sub=F.onSnapshot(fdoc('data/users/'+uid+'/loja'),snap=>{if(got&&snap.metadata&&snap.metadata.hasPendingWrites)return;/* 1.39: eco da própria escrita */const first=!got;got=true;
      if(snap.exists()){const r=snap.data();srv={gasto:N(r.gasto),baus:r.baus||{},duelos:r.duelos||{}};const mine=sig(toSend());apply(r,first?true:mine===last);if(first)last='';}else srv=null;
      push();try{if(view==='home')renderHome();}catch(e){}},()=>{});}
  function clear(){['x12-chest','x12-spent','x12-own','x12-skin','x12-top','x12-du','x21-dw','x21-cores','x21-wsum','x26-dwd'].forEach(k=>{try{localStorage.removeItem(k);}catch(e){}});if(sub){try{sub();}catch(e){}}sub=null;subUid=null;got=false;last='';srv=null;}
  setInterval(()=>{try{start();push();}catch(e){}},4000);
  return{start,push,clear,local};
})();
// O exame acabou (tempo ou entrega): volta a mostrar as correções
setInterval(()=>{try{if(view==='play'&&!document.body.classList.contains('x11exam')&&document.querySelector('#v-play .x17pick'))renderPlay();}catch(e){}},1500);
