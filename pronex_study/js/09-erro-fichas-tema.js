/* Pronex_Study · 09-erro-fichas-tema.js
   Encontra o erro, fichas simuladas, tema claro/escuro, avisos no telemóvel e revisão de design 1.15.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* ===== v1.13: encontra o erro, fichas simuladas, tema claro ===== */
const X13=(()=>{
  const ls={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
  const snd=k=>{try{X12.sfx(k);}catch(e){}};
  const seed=()=>(Date.now()%2147483647)^Math.floor(Math.random()*1e9);

  /* ---------- tema ---------- */
  const mq=window.matchMedia?matchMedia('(prefers-color-scheme: light)'):null;
  function themePref(){return ls.get('x13-theme','escuro');}
  function applyTheme(){const p=themePref(),light=p==='claro'||(p==='auto'&&mq&&mq.matches);document.documentElement.classList.toggle('x13light',light);
    document.documentElement.style.colorScheme=light?'light':'dark';const m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',light?'#F6F5FB':'#090C18');}
  if(mq&&mq.addEventListener)mq.addEventListener('change',applyTheme);
  function themeHTML(){const p=themePref();return'<div class="x8card x13theme"><h3>Aparência</h3><div class="x8row"><div><b>Tema</b><span>'+(p==='auto'?'Segue o tema do dispositivo':p==='claro'?'Fundo claro':'Fundo escuro')+'</span></div><div class="x11seg" role="group" aria-label="Tema">'+
    [['escuro','Escuro'],['claro','Claro'],['auto','Auto']].map(([k,n])=>'<button data-x13th="'+k+'" class="'+(p===k?'on':'')+'" aria-pressed="'+(p===k)+'">'+n+'</button>').join('')+'</div></div></div>';}
  function bindTheme(el){el.querySelectorAll('[data-x13th]').forEach(b=>b.onclick=()=>{ls.set('x13-theme',b.dataset.x13th);applyTheme();renderProfile();});}

  /* ---------- encontra o erro ---------- */
  const NUM=/\d+(?:[   ]\d{3})*(?:,\d+)?/g;
  function breakNum(str,g){const m=[...str.matchAll(NUM)];if(!m.length)return null;
    const eq=str.lastIndexOf('=');const ordn=x=>/^\.?[ªº]/.test(str.slice(x.index+x[0].length));let cand=m.filter(x=>x.index>eq&&!ordn(x));if(!cand.length)cand=m.filter(x=>!ordn(x));if(!cand.length)return null;const x=cand[cand.length-1];
    const t=x[0],ci=t.indexOf(',');const intEnd=ci<0?t.length:ci;let pos=intEnd-1;while(pos>0&&!/\d/.test(t[pos]))pos--;
    const d=+t[pos];let nd=(d+g.int(1,8))%10;if(intEnd===1&&nd===0&&t.length===1)nd=(d+1)%10||1;
    const nt=t.slice(0,pos)+nd+t.slice(pos+1);if(nt===t)return null;return str.slice(0,x.index)+nt+str.slice(x.index+t.length);}
  function errRound(g){for(let tr=0;tr<40;tr++){const ts=active();const t=g.pick(ts);let E;try{E=exV(t,0,7000+g.int(0,4000));}catch(e){continue;}
      if(!E||!E.s||E.s.length<2)continue;const ok=E.s.map((x,i)=>i).filter(i=>!/[<>]/.test(E.s[i])&&/=\s*[^=]*\d/.test(E.s[i])&&!/^Pontos:/.test(E.s[i]));if(!ok.length)continue;
      const none=g.int(1,100)<=18;if(none)return{t,E,k:-1,steps:E.s.slice()};
      const k=g.pick(ok);const bad=breakNum(E.s[k],g);if(!bad)continue;const steps=E.s.slice();steps[k]=bad;return{t,E,k,steps,good:E.s[k]};}
    return null;}
  let ER=null;
  function err(){const g=G(mulberry32(seed()));ER={g,n:0,ok:0,tot:5};errNext();}
  function errNext(){const R=errRound(ER.g);if(!R){toast('Não foi possível criar o exercício.');return;}ER.cur=R;ER.n++;const T=TYPES[R.t];
    const h='<div class="x13top"><span class="x13pill">'+ER.n+' de '+ER.tot+'</span><span class="x13pill ghost">'+esc(T.t)+' · '+esc(T.n)+'</span></div>'+
      '<details class="x13ctx"'+(ER.n===1?' open':'')+'><summary>Ver o enunciado</summary><div class="x13c">'+R.E.c+'<p class="x13q">'+R.E.q+'</p></div></details>'+
      '<p class="x8sub">Um colega resolveu assim. <b>Toca no passo onde está o primeiro erro.</b> Se estiver tudo bem, diz-lhe.</p>'+
      '<ol class="x13steps">'+R.steps.map((s,i)=>'<li><button data-x13s="'+i+'"><i>'+(i+1)+'</i><span>'+s+'</span></button></li>').join('')+'</ol>'+
      '<button class="x8p gh w x13none" data-x13s="-1">Está tudo certo</button><div class="x13fb" id="x13-fb" aria-live="polite"></div>';
    const S=X11.sheet('Encontra o erro',h,{wide:true});
    S.sh.querySelectorAll('[data-x13s]').forEach(b=>b.onclick=()=>{if(S.sh.querySelector('.x13done'))return;const k=+b.dataset.x13s,right=k===R.k;if(right)ER.ok++;snd(right?'ok':'bad');
      S.sh.querySelector('.x13steps').classList.add('x13done');S.sh.querySelectorAll('[data-x13s]').forEach(x=>x.disabled=true);
      if(R.k>=0){const w=S.sh.querySelector('[data-x13s="'+R.k+'"]');w.classList.add('bad');w.insertAdjacentHTML('afterend','<div class="x13fix"><b>Certo:</b> '+R.good+'</div>');}
      if(!right&&k>=0)S.sh.querySelector('[data-x13s="'+k+'"]').classList.add('miss');
      const msg=right?(R.k<0?'Boa! A resolução estava toda certa.':'Boa! Encontraste o erro no passo '+(R.k+1)+'.'):(R.k<0?'Não havia erro: a resolução estava toda certa.':k<0?'Havia um erro no passo '+(R.k+1)+'.':'O primeiro erro estava no passo '+(R.k+1)+'.');
      const last=ER.n>=ER.tot;S.sh.querySelector('#x13-fb').innerHTML='<div class="x13msg '+(right?'ok':'no')+'">'+NEX8(right?'festejar':'incentivar',56)+'<div><b>'+msg+'</b>'+(R.E.trap?'<span>'+R.E.trap+'</span>':'')+'</div></div><button class="x8p w" id="x13-nx">'+(last?'Ver resultado':'Seguinte')+'</button>';
      S.sh.querySelector('#x13-nx').onclick=()=>{S.close();if(last)errEnd();else errNext();};S.sh.querySelector('#x13-nx').focus();});}
  function errEnd(){const H=ls.get('x13-err',{j:0,ok:0,best:0});H.j++;H.ok+=ER.ok;H.best=Math.max(H.best||0,ER.ok);ls.set('x13-err',H);
    const S=X11.sheet('Encontra o erro','<div class="x11empty">'+NEX8(ER.ok>=4?'festejar':'incentivar',96)+'<b>'+ER.ok+' de '+ER.tot+'</b><p>'+(ER.ok===ER.tot?'Olho de detetive. Não te escapa nada.':ER.ok>=3?'Bom olho. Rever passo a passo ajuda a não errar no teste.':'Compara cada conta com a fórmula. Com prática vês os erros mais depressa.')+'</p><div class="x10btns" style="width:100%"><button class="x8p w" id="x13-ag">Jogar outra vez</button><button class="x8p gh" id="x13-cl">Fechar</button></div></div>');
    S.sh.querySelector('#x13-ag').onclick=()=>{S.close();err();};S.sh.querySelector('#x13-cl').onclick=S.close;if(ER.ok===ER.tot)try{X8.confetti();}catch(e){}}

  /* ---------- fichas simuladas (a partir das fichas e minitestes do módulo) ---------- */
  const PEOPLE=[['A','Daniela'],['O','Bruno'],['A','Marisa'],['O','Tiago'],['A','Inês'],['O','Rui'],['A','Sofia'],['O','Diogo'],['A','Beatriz'],['O','Miguel'],['A','Carolina'],['O','Emerson']];
  const CITY=['em Coimbra','na Lousã','em Braga','em Matosinhos','na Guarda','em Leiria','em Viseu','no Porto','em Aveiro','em Faro'];
  const SECT=['eventos','design gráfico','logística','comunicação','informática','turismo','desporto','marketing'];
  const art=P=>P[0],dlA=P=>P[0]==='A'?'da':'do';
  const Q=(q,o,s)=>Object.assign({q,s},o);
  const months=()=>{const d=new Date();return String(d.getMonth()+1).padStart(2,'0')+'.'+d.getFullYear();};
  const UN=[['mandato','mandatos'],['dia','dias'],['formador','formadores'],['representante','representantes']];
  function fPart(g){let P;for(let t=0;t<60;t++){P=partGen(g,true);if(Number.isInteger(P.H.last)){P=null;continue;}const sm=P.S.seats[2]+P.S.seats[3],hm=P.H.seats[2]+P.H.seats[3];const same=P.H.seats.join()===P.S.seats.join();if(same||sm>hm)break;P=null;}if(!P){for(let t=0;t<60&&(!P||Number.isInteger(P.H.last));t++)P=partGen(g,true);}
    const L=P.sc.L,u=UN[PCTX.indexOf(P.sc)]||UN[0],uf=n=>n+' '+(n===1?u[0]:u[1]);
    const seatQ=(R,O,i)=>opts(g,uf(R.seats[i]),[uf(O.seats[i]),uf(R.seats[i]+1),R.seats[i]>0?uf(R.seats[i]-1):null],k=>uf(R.seats[i]+k+1));
    const Lq=P.H.last,tot=Math.floor(Lq)+1,need=tot-P.v[3];const same=P.H.seats.join()===P.S.seats.join();
    const cmp=['favorece as listas com mais votos','favorece as listas com menos votos','dá exatamente o mesmo resultado','dá todos os lugares à lista com mais votos'];const cr=same?cmp[2]:cmp[1];
    const sH=allocSteps(P,P.H,dH,'Hondt: divide por 1, 2, 3, 4…'),sS=allocSteps(P,P.S,dS,'Sainte-Laguë: divide por 1, 3, 5, 7…');
    return{tit:'Partilha de lugares',tipo:'Miniteste',tema:'Partilha',groups:[{ctx:'<p>'+P.sc.intro(P.m)+'</p>'+T([P.sc.col,...L],[[P.sc.val,...P.v.map(ni)]]),qs:[
      Q('Pelo método de Hondt, '+L[0]+' recebe:',seatQ(P.H,P.S,0),sH),
      Q('Pelo método de Hondt, quantos '+P.sc.val.toLowerCase()+' a mais precisaria '+L[3]+' para conseguir '+P.sc.one+'?',opts(g,ni(need),[ni(tot),ni(need-1),ni(Math.round(Lq)-P.v[3]-1)],k=>ni(need+k*13)),[...sH.slice(0,-1),'Último quociente escolhido = '+fq(Lq),L[3]+' (divisor 1) tem de passar '+fq(Lq)+' → precisa de '+ni(tot),ni(tot)+' − '+ni(P.v[3])+' = '+ni(need)]),
      Q('Pelo método de Sainte-Laguë, '+L[0]+' recebe:',seatQ(P.S,P.H,0),sS),
      Q('Pelo método de Sainte-Laguë, '+L[3]+' recebe:',seatQ(P.S,P.H,3),sS),
      Q('Comparando os dois resultados, o método de Sainte-Laguë:',opts(g,cr,cmp.filter(x=>x!==cr),()=>null),['Hondt: '+seatStr(L,P.H.seats),'Sainte-Laguë: '+seatStr(L,P.S.seats),same?'Os dois métodos dão o mesmo resultado neste caso':'Com divisores ímpares, as listas pequenas ficam com mais lugares no Sainte-Laguë'])]}]};}
  function fRecibo(g){const P=g.pick(PEOPLE),SB=g.int(85,175)*10,dias=g.int(19,22),vd=g.pick([5,5.5,6,6.5,7,7.5,8]),sub=r2(vd*dias),bruto=r2(SB+sub),ss=r2(SB*.11);
    const tx=g.int(40,160)/10,irs=r2(SB*tx/100),txe=irs/SB*100,desc=r2(ss+irs),liq=r2(bruto-desc),per=months(),ph='<span class="x13gap">?</span>';
    const tab=T(['Descrição','Período','N.º dias','Montante/un.','Abono','Desconto'],[['Salário-base',per,'','',eur(SB),''],['Cartão-refeição',per,String(dias),eur(vd),ph,''],['Montante bruto total','','','',ph,''],['Contrib. empregado p/ SS',per,'','11%','',ph],['Retenção IRS',per,'',ph,'',eur(irs)],['Total de pagamentos/deduções','','','','',ph],['Total a receber','','','',ph,'']]);
    const sSub='Subsídio = '+eur(vd)+' × '+dias+' = '+eur(sub),sBr='Bruto = '+eur(SB)+' + '+eur(sub)+' = '+eur(bruto),sSS='SS = '+eur(SB)+' × 0,11 = '+eur(ss)+' (o cartão-refeição não desconta)';
    return{tit:'Recibo de vencimento',tipo:'Questão-aula',tema:'Finanças',groups:[{ctx:'<p>'+art(P)+' '+P[1]+' trabalha numa empresa de '+g.pick(SECT)+' '+g.pick(CITY)+'. O recibo de vencimento '+dlA(P)+' '+P[1]+' tem os dados seguintes:</p>'+tab,qs:[
      Q('Quanto recebe de subsídio de alimentação (em cartão)?',opts(g,eur(sub),[eur(r2(vd*22)),eur(r2(vd*30)),eur(r2(vd*(dias-1)))],k=>eur(r2(sub+k*vd))),[sSub]),
      Q('O salário bruto total é:',opts(g,eur(bruto),[eur(SB),eur(r2(SB+vd)),eur(r2(bruto-ss))],k=>eur(r2(bruto+k*10))),[sSub,sBr]),
      Q('A contribuição para a Segurança Social é:',opts(g,eur(ss),[eur(r2(bruto*.11)),eur(r2(SB*.1)),eur(irs)],k=>eur(r2(ss+k*3.3))),[sSS]),
      Q('A taxa de retenção de IRS aplicada é (às décimas):',opts(g,pc(txe),[pc(irs/bruto*100),pc(11),pc(txe+1)],k=>pc(txe+k*.7)),['Taxa = '+eur(irs)+' ÷ '+eur(SB)+' × 100 ≈ '+pc(txe),'A retenção calcula-se sobre o salário-base, sem o cartão-refeição']),
      Q('O total de pagamentos/deduções é:',opts(g,eur(desc),[eur(ss),eur(irs),eur(r2(r2(bruto*.11)+irs))],k=>eur(r2(desc+k*7))),[sSS,'Total de descontos = '+eur(ss)+' + '+eur(irs)+' = '+eur(desc)]),
      Q('O salário líquido (total a receber) é:',opts(g,eur(liq),[eur(r2(SB-desc)),eur(r2(bruto-ss)),eur(r2(bruto-r2(bruto*.11)-irs))],k=>eur(r2(liq+k*12.5))),[sSub,sBr,sSS,'Líquido = '+eur(bruto)+' − '+eur(ss)+' − '+eur(irs)+' = '+eur(liq)])]}]};}
  function fIRS(g){const P=g.pick(PEOPLE),I=irsGen(g),k=I.k,pos=g.int(0,1)===1,diff=r2(g.int(3,60)*10+g.int(0,99)/100),ret=r2(pos?I.liq+diff:I.liq-diff);
    const sC='Coletável = '+eur(I.bruto)+' − '+nf(DESP)+' = '+eur(I.C),sE=eur(I.C)+' está entre '+ni(LIM[k-1])+' € e '+ni(LIM[k])+' € → '+(k+1)+'.º escalão',
      s1='Parte 1: '+ni(LIM[k-1])+' × '+pc(MED[k-1],3)+' (taxa MÉDIA do '+k+'.º) = '+eur(I.p1),s2='Parte 2: ('+ni(I.C)+' − '+ni(LIM[k-1])+') × '+pc(MAR[k],2)+' (taxa MARGINAL do '+(k+1)+'.º) = '+eur(I.p2),sCol='Coleta = '+eur(I.p1)+' + '+eur(I.p2)+' = '+eur(I.col),sL='Coleta líquida = '+eur(I.col)+' − '+eur(I.ded)+' = '+eur(I.liq);
    const esc_=n=>n+'.º';const ac=['Tem de pagar imposto adicional','Recebe um reembolso','Não recebe reembolso nem paga mais','Nenhuma das anteriores'];const acr=pos?ac[1]:ac[0];
    return{tit:'IRS anual',tipo:'Questão-aula',tema:'Finanças',groups:[{ctx:'<p>'+art(P)+' '+P[1]+' é solteir'+(P[0]==='A'?'a':'o')+' e mora '+g.pick(CITY)+'. No último ano apresentou estes elementos:</p><ul class="x13ul"><li>Rendimento bruto anual: <b>'+eur(I.bruto)+'</b></li><li>Dedução específica (contribuição para a SS): <b>'+eur(DESP)+'</b></li><li>Deduções (saúde, educação…): <b>'+eur(I.ded)+'</b></li><li>Retenções na fonte para IRS: <b>'+eur(ret)+'</b></li></ul>'+irsTable(),qs:[
      Q('O rendimento coletável é:',opts(g,eur(I.C),[eur(I.bruto),eur(r2(I.bruto-I.ded)),eur(r2(I.C-I.ded))],k=>eur(r2(I.C+k*100))),[sC]),
      Q('O rendimento coletável enquadra-se no escalão:',opts(g,esc_(k+1),[esc_(k),esc_(k+2),esc_(Math.max(1,k-1))].filter(x=>+x[0]>=1&&+x[0]<=7),j=>esc_(((k+j+2)%7)+1)),[sC,sE]),
      Q('O valor da coleta é:',opts(g,eur(I.col),[eur(r2(I.C*MED[k]/100)),eur(r2(I.C*MAR[k]/100)),eur(r2(r2(LIM[k-1]*MAR[k-1]/100)+I.p2))],j=>eur(r2(I.col+j*23.7))),[sC,sE,s1,s2,sCol]),
      Q('O valor da coleta líquida é:',opts(g,eur(I.liq),[eur(I.col),eur(r2(I.col+I.ded)),eur(r2(I.C*MED[k]/100-I.ded))],j=>eur(r2(I.liq+j*31.9))),[sCol,sL]),
      Q('No acerto de contas, '+P[1]+':',opts(g,acr,ac.filter(x=>x!==acr),()=>null),[sL,'Retenções = '+eur(ret),pos?eur(ret)+' > '+eur(I.liq)+' → pagou a mais → reembolso de '+eur(diff):eur(ret)+' < '+eur(I.liq)+' → pagou a menos → paga mais '+eur(diff)])]}]};}
  function fJuros(g){const P=g.pick(PEOPLE),C=g.int(4,30)*1000,rs=g.pick([2,2.5,3,3.5,4,4.5,5,6]),n=g.int(2,5),m=g.pick([4,6,8,9,10,15,18]),rc=g.pick([1.5,2,2.5,3,3.5,4]),N=g.int(5,15);
    const r=rs/100,Cn=r2(C*(1+r*n)),J=r2(Cn-C),Cm=rnd(C*(1+r*m/12),0),rm=rc/100/12,C1=r2(C*Math.pow(1+rm,12)),CN=r2(C*Math.pow(1+rm,12*N));
    return{tit:'Juros e aplicações',tipo:'Ficha',tema:'Finanças',groups:[{ctx:'<p>'+art(P)+' '+P[1]+' quer juntar dinheiro para abrir o seu negócio e aplicou <b>'+eur(C)+'</b> num depósito a prazo.</p>',qs:[
      Q('A juro simples, com taxa anual de '+pc(rs,2)+', o capital acumulado ao fim de '+n+' anos é:',opts(g,eur(Cn),[eur(r2(C*Math.pow(1+r,n))),eur(r2(C*(1+r))),eur(r2(C*r*n))],k=>eur(r2(Cn+k*50))),['Cf = Ci × (1 + r × n)','Cf = '+eur(C)+' × (1 + '+dec(r)+' × '+n+') = '+eur(Cn)]),
      Q('Nas mesmas condições, o juro obtido é:',opts(g,eur(J),[eur(r2(C*r)),eur(Cn),eur(r2(J/2))],k=>eur(r2(J+k*25))),['Juro = '+eur(Cn)+' − '+eur(C)+' = '+eur(J)]),
      Q('A juro simples, à mesma taxa, ao fim de '+m+' meses, o capital acumulado (arredondado às unidades) é:',opts(g,ni(Cm)+' €',[ni(rnd(C*(1+r*m),0))+' €',ni(rnd(C*(1+r),0))+' €',ni(rnd(C*Math.pow(1+r,m/12),0)+7)+' €'],k=>ni(Cm+k*17)+' €'),['n = '+m+' ÷ 12 anos','Cf = '+eur(C)+' × (1 + '+dec(r)+' × '+m+'/12) ≈ '+ni(Cm)+' €']),
      Q('A juro composto, taxa anual de '+pc(rc,2)+' com capitalização mensal, ao fim de 1 ano tem:',opts(g,eur(C1),[eur(r2(C*(1+rc/100))),eur(r2(C*Math.pow(1+rc/100,12))),eur(r2(C*(1+rm)))],k=>eur(r2(C1+k*11))),['Taxa mensal = '+dec(rc/100)+' ÷ 12','Cf = '+eur(C)+' × (1 + '+dec(rc/100)+'/12)^12 ≈ '+eur(C1)]),
      Q('Nas mesmas condições, ao fim de '+N+' anos tem aproximadamente:',opts(g,eur(CN),[eur(r2(C*Math.pow(1+rc/100,N))),eur(r2(C*(1+rc/100*N))),eur(r2(C*Math.pow(1+rm,N)))],k=>eur(r2(CN+k*97))),['Expoente = 12 × '+N+' = '+12*N,'Cf = '+eur(C)+' × (1 + '+dec(rc/100)+'/12)^'+12*N+' ≈ '+eur(CN)])]}]};}
  function fRet(g){const P=g.pick(PEOPLE),R=retGen(g),liq=r2(R.SB-r2(R.SB*.11)-R.r),ef=R.r/R.SB*100;
    const tab=T(['Remuneração mensal','Taxa marginal máxima','Parcela a abater','Parcela adicional por dependente'],RET.map(x=>['Até '+eur(x.hi),pc(x.tx,2),eur(x.pa),'21,43 €']));
    return{tit:'Retenção na fonte',tipo:'Ficha',tema:'Finanças',groups:[{ctx:'<p>'+art(P)+' '+P[1]+' trabalha '+g.pick(CITY)+' e '+(R.dep?'tem '+R.dep+' dependente'+(R.dep>1?'s':''):'não tem dependentes')+'. O seu salário bruto mensal é <b>'+eur(R.SB)+'</b>. Tabela de retenção na fonte (extrato da Tabela I, continente, 2026):</p>'+tab,qs:[
      Q('Qual é a taxa marginal máxima a aplicar?',opts(g,pc(R.row.tx,2),RET.filter(x=>x!==R.row).map(x=>pc(x.tx,2)),()=>null),['A linha certa é a 1.ª cujo "Até" é maior que '+eur(R.SB)+' → '+pc(R.row.tx,2)]),
      Q('Qual é o montante a reter na fonte?',opts(g,eur(R.r),[eur(r2(R.base)),eur(r2(R.base-R.row.pa)),(R.base-R.row.pa-(R.dep+1)*21.43>0?eur(r2(R.base-R.row.pa-(R.dep+1)*21.43)):null)],k=>eur(r2(R.r+k*9.5))),retSteps(R)),
      Q('A taxa de retenção efetiva é (às décimas):',opts(g,pc(ef),[pc(R.row.tx),pc((R.base-R.row.pa)/R.SB*100),pc(ef+1.5)],k=>pc(ef+k*.8)),['Taxa efetiva = '+eur(R.r)+' ÷ '+eur(R.SB)+' × 100 ≈ '+pc(ef)]),
      Q('Descontando também 11% para a Segurança Social, o salário líquido é:',opts(g,eur(liq),[eur(r2(R.SB-R.r)),eur(r2(R.SB-r2(R.SB*.11))),eur(r2(R.SB-r2(R.SB*.11)-r2(R.base)))],k=>eur(r2(liq+k*14))),['SS = '+eur(R.SB)+' × 0,11 = '+eur(r2(R.SB*.11)),'Líquido = '+eur(R.SB)+' − '+eur(r2(R.SB*.11))+' − '+eur(R.r)+' = '+eur(liq)])]}]};}
  function fHora(g){const P=g.pick(PEOPLE),SB=r2(g.int(900,1900)+g.int(0,99)/100),h=g.pick([35,38,40]),vx=SB*12/(52*h),v=r2(vx),wrong=r2(SB/(4*h)),claimT=g.int(0,1)===1&&nf(vx,1)!==nf(wrong,1);const claim=claimT?nf(vx,1):nf(wrong,1);
    const ss=r2(SB*.11),tx=g.int(60,170)/10,rf=r2(SB*tx/100),txr=rf/SB*100,liq=r2(SB-ss-rf);
    const A=['Verdadeira','Falsa, recebe menos do que diz','Falsa, recebe mais do que diz','Não é possível saber'];const ok=claimT?A[0]:(v>wrong?A[2]:A[1]);
    return{tit:'Salário por hora',tipo:'Ficha',tema:'Finanças',groups:[{ctx:'<p>'+art(P)+' '+P[1]+' tem um salário bruto de <b>'+eur(SB)+'</b> e trabalha <b>'+h+' horas semanais</b>. O salário líquido calcula-se com SL = SB − SS − RF, em que a SS é 11% do salário bruto e RF é a retenção na fonte de IRS. O salário por hora calcula-se com</p><div class="fcard x11f">S<sub>bh</sub> = (SB × 12) ÷ (52 × h<sub>s</sub>)</div>',qs:[
      Q(P[1]+' diz: «Pagam-me '+claim+' € por hora.» A afirmação é:',opts(g,ok,A.filter(x=>x!==ok),()=>null),['S = ('+nf(SB)+' × 12) ÷ (52 × '+h+') ≈ '+eur(v)+' por hora',claimT?'Arredondado às décimas dá '+claim+' € → verdadeira':claim+' € não é '+nf(vx,1)+' € → falsa']),
      Q('A contribuição para a Segurança Social é:',opts(g,eur(ss),[eur(r2(SB*.1)),eur(r2(SB*.23)),eur(r2(SB*.011))],k=>eur(r2(ss+k*4))),['SS = '+eur(SB)+' × 0,11 = '+eur(ss)]),
      Q('A retenção na fonte mensal é '+eur(rf)+'. A taxa de IRS aplicada (às décimas) é:',opts(g,pc(txr),[pc(rf/(SB-ss)*100),pc(txr+1),pc(txr-1)],k=>pc(txr+k*.6)),['Taxa = '+eur(rf)+' ÷ '+eur(SB)+' × 100 ≈ '+pc(txr)]),
      Q('O salário líquido é:',opts(g,eur(liq),[eur(r2(SB-ss)),eur(r2(SB-rf)),eur(r2(SB-ss-rf-ss))],k=>eur(r2(liq+k*15))),['SL = '+eur(SB)+' − '+eur(ss)+' − '+eur(rf)+' = '+eur(liq)])]}]};}
  function fBorda(g){const A=prefGen(g,3,3,40,200,i=>uniq(i.borda));const B=prefGen(g,4,4,30,190,i=>uniq(i.borda)&&uniq(i.first)&&uniq(i.last),i=>argmax(i.borda)!==argmax(i.first));
    const wA=argmax(A.info.borda),wB=argmax(B.info.borda),fB=argmax(B.info.first),lB=argmax(B.info.last),VB=B.cols.reduce((s,c)=>s+c.v,0),min=Math.floor(VB/2)+1,abs=B.info.first[fB]>=min;
    const LL=n=>Array.from({length:n},(_,i)=>LET[i]);
    const absA=abs?'Sim, '+LET[fB]+' tem mais de metade dos votos':'Não, ninguém tem mais de metade dos votos',absD=[abs?'Não, ninguém tem mais de metade dos votos':'Sim, '+LET[fB]+' tem mais de metade dos votos','Sim, '+LET[wB]+' tem mais de metade dos votos','Sim, todas as bandas têm a maioria'];
    return{tit:'Eleger a banda da festa',tipo:'Questão-aula',tema:'Eleições',groups:[
      {ctx:'<p>A associação de estudantes vai escolher a banda da festa de fim de ano pelo método de Borda. Concorrem as bandas A, B e C.</p>'+prefTable(A.cols,3),qs:[
        Q('Pelo método de Borda, que banda é escolhida?',opts(g,LET[wA],LL(3).filter(x=>x!==LET[wA]).concat(['Empate']),()=>null),[...bordaSteps(A.cols,3),'Ganha '+LET[wA]])]},
      {ctx:'<p>Entrou uma nova banda, a D, e a votação foi repetida:</p>'+prefTable(B.cols,4),qs:[
        Q('Pelo método de Borda, que banda é escolhida agora?',opts(g,LET[wB],LL(4).filter(x=>x!==LET[wB]),()=>null),[...bordaSteps(B.cols,4),'Ganha '+LET[wB]]),
        Q('Só com os votos da 1.ª preferência, por maioria simples, ganha:',opts(g,LET[fB],LL(4).filter(x=>x!==LET[fB]),()=>null),['1.ª preferência: '+LL(4).map((l,i)=>l+' = '+ni(B.info.first[i])).join(' · '),'Ganha '+LET[fB]]),
        Q('Por maioria absoluta (só a 1.ª preferência), alguma banda seria escolhida?',opts(g,absA,absD,()=>null),['Total de votos = '+ni(VB)+' → maioria absoluta = '+ni(min)+' votos',LET[fB]+' tem '+ni(B.info.first[fB])+(abs?' ≥ ':' < ')+ni(min)]),
        Q('Qual é a banda menos desejada (mais votos em último lugar)?',opts(g,LET[lB],LL(4).filter(x=>x!==LET[lB]),()=>null),['Última preferência: '+LL(4).map((l,i)=>l+' = '+ni(B.info.last[i])).join(' · '),'Menos desejada: '+LET[lB]])]}]};}
  function fElei(g){const e=elec(g),ab=(e.I-e.V)/e.I*100,X=g.pick(e.cand),p=X.v/e.VVE*100,min=Math.floor(e.VVE/2)+1,S=e.cand.slice().sort((a,b)=>b.v-a.v),win=S[0].v>=min;
    const w1='Sim, '+S[0].l+' ganha à 1.ª volta',w2='Não, há 2.ª volta entre '+S[0].l+' e '+S[1].l;
    return{tit:'Eleição para a junta',tipo:'Miniteste',tema:'Eleições',groups:[{ctx:'<p>Numa freguesia houve eleições para presidente da junta. Os resultados foram estes:</p>'+e.c.replace(/^<p>[^<]*<\/p>/,''),qs:[
      Q('Quantos votos foram validamente expressos?',opts(g,ni(e.VVE),[ni(e.V),ni(e.V-e.b),ni(e.I-e.b-e.n)],k=>ni(e.VVE+k*7)),['VVE = votantes − brancos − nulos',ni(e.V)+' − '+ni(e.b)+' − '+ni(e.n)+' = '+ni(e.VVE)]),
      Q('A percentagem de abstenção foi (às décimas):',opts(g,pc(ab),[pc(e.V/e.I*100),pc((e.I-e.V)/e.V*100),pc((e.I-e.VVE)/e.I*100)],k=>pc(ab+k*1.3)),['Abstenção = '+ni(e.I)+' − '+ni(e.V)+' = '+ni(e.I-e.V),ni(e.I-e.V)+' ÷ '+ni(e.I)+' × 100 ≈ '+pc(ab)]),
      Q('O candidato '+X.l+' obteve (às décimas):',opts(g,pc(p),[pc(X.v/e.V*100),pc(X.v/e.I*100),pc(100-p)],k=>pc(p+k*1.7)),['% = '+ni(X.v)+' ÷ '+ni(e.VVE)+' × 100 ≈ '+pc(p)]),
      Q('O número mínimo de votos para a maioria absoluta é:',opts(g,ni(min),[ni(Math.floor(e.VVE/2)),ni(Math.floor(e.V/2)+1),ni(min+1)],k=>ni(min+k*3)),[ni(e.VVE)+' ÷ 2 = '+nf(e.VVE/2,1)+' → mínimo '+ni(min)]),
      Q('Houve vencedor à 1.ª volta?',opts(g,win?w1:w2,[win?w2:w1,'Sim, '+S[1].l+' ganha à 1.ª volta','Não, há 2.ª volta entre '+S[0].l+' e '+S[2].l],()=>null),[S[0].l+' tem '+ni(S[0].v)+(win?' ≥ ':' < ')+ni(min),win?'Ganha à 1.ª volta':'2.ª volta com os dois mais votados'])]}]};}
  const MODELS=[['part','Partilha de lugares','Hondt e Sainte-Laguë',fPart,'var(--x8-blue)'],['recibo','Recibo de vencimento','Subsídio, SS, IRS e líquido',fRecibo,'var(--x8-green)'],['irs','IRS anual','Coletável, escalão, coleta e acerto',fIRS,'var(--x8-coral)'],['juros','Juros e aplicações','Simples e composto',fJuros,'var(--x8-yel)'],['ret','Retenção na fonte','Tabela, taxa e líquido',fRet,'var(--x8-pink)'],['hora','Salário por hora','Afirmação, SS e IRS',fHora,'var(--x8-lil)'],['borda','Eleger a banda','Borda e maiorias',fBorda,'#7FE7FF'],['elei','Eleição para a junta','VVE, abstenção e maioria',fElei,'#FF7A3D']];
  function build(id,sd){const g=G(mulberry32(sd));if(id==='mix'){const pick=g.shuffle(MODELS).slice(0,3);const parts=pick.map(m=>m[3](g));return{tit:'Miniteste completo',tipo:'Miniteste',tema:'Mistura',groups:parts.flatMap(p=>p.groups)};}const M=MODELS.find(m=>m[0]===id);return M[3](g);}
  function fichas(){const H=ls.get('x13-fic',{});
    const card=(id,n,d,c)=>{const h=H[id];return'<button class="x11tool" data-x13f="'+id+'"><span class="ti" style="background:'+c+'">'+(IC.book||'')+'</span><b>'+esc(n)+'</b><span>'+esc(d)+(h?' · melhor '+nf(h.best,1)+' val.':'')+'</span></button>';};
    const S=X11.sheet('Fichas de treino','<p class="x8sub">Iguais às fichas e minitestes do módulo, com números novos de cada vez. Respondes a tudo, entregas e vês a nota e as resoluções.</p><button class="x13mix" data-x13f="mix"><b>Miniteste completo</b><span>3 grupos misturados, como no teste</span>'+(H.mix?'<em>melhor '+nf(H.mix.best,1)+' val.</em>':'')+'</button><div class="x11tools x13fl">'+MODELS.map(m=>card(m[0],m[1],m[2],m[4])).join('')+'</div>',{wide:true});
    S.sh.querySelectorAll('[data-x13f]').forEach(b=>b.onclick=()=>{S.close();openFicha(b.dataset.x13f);});}
  let FI=null;
  function openFicha(id,sd){sd=sd||seed();const F=build(id,sd);FI={id,sd,F,ans:{},done:false};drawFicha();}
  function qList(F){const out=[];F.groups.forEach((gr,gi)=>gr.qs.forEach((q,qi)=>out.push({gi,qi,q,n:(gi+1)+'.'+(qi+1)})));return out;}
  function drawFicha(){document.getElementById('x13fi')?.remove();const F=FI.F,L=qList(F),nick=(typeof ME!=='undefined'&&ME&&ME.nick)||'';const dt=new Date().toLocaleDateString('pt-PT');
    let h='<div class="x13bar"><button class="x8ib" id="x13-fx" aria-label="Fechar">'+'✕'+'</button><b>'+esc(F.tipo)+'</b><span id="x13-fp">'+Object.keys(FI.ans).length+'/'+L.length+'</span><button class="x8p gh sm" id="x13-pr" title="As soluções saem na última página">Imprimir</button></div>';
    h+='<article class="x13paper"><header class="x13hd"><div><span class="x13k">'+esc(F.tipo)+'</span><h2>'+esc(F.tit)+'</h2></div><span class="x13mod">Matemática | Módulo P1</span></header>'+
      '<table class="x13id"><tr><td>Aluno</td><td class="w">'+esc(nick)+'</td><td>Data</td><td>'+dt+'</td></tr><tr><td>Professor</td><td class="w"></td><td>Nota</td><td id="x13-cls">'+(FI.done?'':'')+'</td></tr></table>';
    F.groups.forEach((gr,gi)=>{h+='<section class="x13grp"><div class="x13ctx2"><span class="x13gn">'+(gi+1)+'</span><div>'+gr.ctx+'</div></div>';
      gr.qs.forEach((q,qi)=>{const k=gi+'.'+qi,a=FI.ans[k];h+='<div class="x13qq'+(FI.done?(a===q.a?' ok':' no'):'')+'" data-k="'+k+'"><p><b>'+(gi+1)+'.'+(qi+1)+'.</b> '+q.q+'</p><div class="x13op" role="radiogroup">'+
        q.o.map((o,oi)=>'<label class="'+(FI.done&&oi===q.a?'right':'')+(FI.done&&a===oi&&oi!==q.a?' wrong':'')+'"><input type="radio" name="x13-'+k+'" value="'+oi+'"'+(a===oi?' checked':'')+(FI.done?' disabled':'')+'><span><b>('+'ABCD'[oi]+')</b> '+o+'</span></label>').join('')+'</div>'+
        (FI.done?'<details class="x13res"'+(a!==q.a?' open':'')+'><summary>'+(a===q.a?'Certo':'Resposta certa: ('+'ABCD'[q.a]+')')+' · ver resolução</summary><ol>'+q.s.map(x=>'<li>'+x+'</li>').join('')+'</ol></details>':'')+'</div>';});
      h+='</section>';});
    h+='<div class="x13sol"><h3>Soluções</h3><p>'+L.map(x=>x.n+' ('+'ABCD'[x.q.a]+')').join(' · ')+'</p></div></article>';
    h+='<div class="x13foot">'+(FI.done?'<button class="x8p w" id="x13-nw">Nova ficha</button><button class="x8p gh" id="x13-ls">Outras fichas</button>':'<button class="x8p w" id="x13-sub">Entregar</button>')+'</div>';
    const el=document.createElement('div');el.id='x13fi';el.className='x13fi';el.setAttribute('role','dialog');el.setAttribute('aria-label',F.tit);el.innerHTML=h;document.body.appendChild(el);document.body.classList.add('x13open');
    if(FI.done)score(el,L);
    el.querySelector('#x13-fx').onclick=closeFicha;
    el.querySelector('#x13-pr').onclick=()=>{try{window.print();}catch(e){}};
    el.querySelectorAll('input[type=radio]').forEach(r=>r.onchange=()=>{const k=r.name.slice(4);FI.ans[k]=+r.value;el.querySelector('#x13-fp').textContent=Object.keys(FI.ans).length+'/'+L.length;});
    const sb=el.querySelector('#x13-sub');if(sb)sb.onclick=()=>{const miss=L.length-Object.keys(FI.ans).length;if(miss&&!sb.dataset.c){sb.dataset.c='1';sb.textContent='Faltam '+miss+'. Entregar mesmo assim?';return;}FI.done=true;const ok=L.filter(x=>FI.ans[x.gi+'.'+x.qi]===x.q.a).length,nota=Math.round(ok/L.length*200)/10;
      const H=ls.get('x13-fic',{});const r=H[FI.id]||{n:0,best:0};r.n++;r.best=Math.max(r.best,nota);r.last=nota;H[FI.id]=r;ls.set('x13-fic',H);snd(nota>=9.5?'chest':'bad');drawFicha();el.scrollTop=0;document.getElementById('x13fi').scrollTo(0,0);if(nota>=18)try{X8.confetti();}catch(e){}};
    const nw=el.querySelector('#x13-nw');if(nw)nw.onclick=()=>openFicha(FI.id);const lsb=el.querySelector('#x13-ls');if(lsb)lsb.onclick=()=>{closeFicha();fichas();};
    setTimeout(()=>el.querySelector('#x13-fx').focus(),30);}
  function score(el,L){const ok=L.filter(x=>FI.ans[x.gi+'.'+x.qi]===x.q.a).length,nota=Math.round(ok/L.length*200)/10;const fp=el.querySelector('#x13-fp');if(fp)fp.textContent='Entregue';el.querySelector('#x13-cls').textContent=nf(nota,1)+' valores';
    el.querySelector('.x13paper').insertAdjacentHTML('afterbegin','<div class="x13score '+(nota>=9.5?'ok':'no')+'">'+NEX8(nota>=14?'festejar':nota>=9.5?'normal':'incentivar',64)+'<div><b>'+nf(nota,1)+' <small>valores</small></b><span>'+ok+' de '+L.length+' certas. '+(nota>=18?'Excelente, estás pronto para o teste.':nota>=14?'Muito bem. Revê as que falhaste.':nota>=9.5?'Positiva. Abre as resoluções das erradas.':'Ainda não. Revê as resoluções e tenta uma ficha nova.')+'</span></div></div>');}
  function closeFicha(){document.getElementById('x13fi')?.remove();document.body.classList.remove('x13open');FI=null;}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.getElementById('x13fi')&&!document.querySelector('.x11sh'))closeFicha();});
  return{applyTheme,themeHTML,bindTheme,err,fichas,openFicha,build,breakNum,errRound,MODELS,closeFicha};
})();
X13.applyTheme();
{const _rp5=renderProfile;renderProfile=function(){const r=_rp5.apply(this,arguments);try{const el=document.getElementById('v-profile');if(profTab==='defs'&&!el.querySelector('.x13theme')){const a=el.querySelector('.x11a11y');if(a){a.insertAdjacentHTML('beforebegin',X13.themeHTML());X13.bindTheme(el);}}}catch(e){}return r;};}
/* 1.13.1 · cartão App nas Definições: novidades, convidar colegas e página pública */
const X13A=(()=>{
  const SOBRE=APP_URL+'sobre/';
  function clHTML(n){return CHANGELOG.slice(0,n||CHANGELOG.length).map(c=>'<div class="x13cl"><div class="x13clh"><b>Versão '+esc(c.v)+'</b><span>'+esc(c.d)+'</span></div><ul>'+c.items.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul></div>').join('');}
  function news(all){X11.sheet(all?'Histórico de versões':'O que há de novo','<p class="x8sub">'+(all?'Tudo o que mudou na Pronex_Study.':'Atualizaste para a versão '+esc(APP_VERSION)+'.')+'</p>'+clHTML(all?0:1)+(all?'':'<button class="x8p w" id="x13-nw-all" style="width:100%;margin-top:14px">Ver todas as versões</button>'),{wide:true});
    const b=document.getElementById('x13-nw-all');if(b)b.onclick=()=>news(true);}
  async function share(){const data={title:'Pronex_Study',text:'Estuda comigo na Pronex_Study: exercícios iguais aos do teste, fichas, cartões e ranking da turma.',url:SOBRE};
    try{if(navigator.share){await navigator.share(data);return;}}catch(e){if(e&&e.name==='AbortError')return;}copy();}
  function copy(){const done=()=>toast('Link copiado.');try{navigator.clipboard.writeText(SOBRE).then(done,()=>toast(SOBRE));}catch(e){toast(SOBRE);}}
  function invite(){X11.sheet('Convidar colegas','<p class="x8sub">O código QR abre a app diretamente. O link leva à página de apresentação, com o que a app faz e como instalar.</p><div class="x13qr"><img src="icons/qr.png" alt="Código QR da Pronex_Study" width="168" height="168"></div><code class="x13lnk">'+esc(SOBRE)+'</code><div class="x8btns" style="margin-top:14px"><button class="x8p l sm" id="x13-sh">Partilhar</button><button class="x8p gh sm" id="x13-cp">Copiar link</button></div>');
    document.getElementById('x13-sh').onclick=share;document.getElementById('x13-cp').onclick=copy;}
  function cardHTML(){return'<div class="x8card x13app"><h2>App</h2><div>'+
    (typeof IS_APP!=='undefined'&&IS_APP&&typeof isStandalone==='function'&&!isStandalone()?'<div class="x8row"><div class="rt"><b>Instalar a app</b><span>No ecrã principal e a funcionar sem internet</span></div><button class="x8p gh sm" id="x13-a-ins">Instalar</button></div>':'')+
    '<div class="x8row"><div class="rt"><b>Novidades</b><span>Versão '+esc(APP_VERSION)+' · o que mudou</span></div><button class="x8p gh sm" id="x13-a-nw">Ver</button></div>'+
    '<div class="x13qrin"><img src="icons/qr.png" alt="Código QR que abre a Pronex_Study" width="132" height="132"><div class="rt"><b>Convidar colegas</b><span>Mostra este código QR a um colega: ele aponta a câmara e abre a app. Ou envia-lhe o link.</span><div class="x8btns"><button class="x8p l sm" id="x13-a-sh">Partilhar</button><button class="x8p gh sm" id="x13-a-cp">Copiar link</button><button class="x8p gh sm" id="x13-a-inv">Ampliar</button></div></div></div>'+
    '<div class="x8row"><a class="rt" href="sobre/" target="_blank" rel="noopener"><b>Página da app</b><span>Apresentação para quem ainda não a tem</span></a><span aria-hidden="true" style="font-size:20px;color:var(--x8-ink2)">↗</span></div></div></div>';}
  function bind(el){const sh=el.querySelector('#x13-a-sh');if(sh)sh.onclick=share;const cp=el.querySelector('#x13-a-cp');if(cp)cp.onclick=copy;const ins=el.querySelector('#x13-a-ins');if(ins)ins.onclick=()=>{try{doInstall();}catch(e){}};const n=el.querySelector('#x13-a-nw');if(n)n.onclick=()=>news(true);const i=el.querySelector('#x13-a-inv');if(i)i.onclick=invite;}
  return{news,invite,share,cardHTML,bind,clHTML};
})();
showNews=function(){let last=null;try{last=localStorage.getItem('ps-ver');localStorage.setItem('ps-ver',APP_VERSION);}catch(e){}if(!last||last===APP_VERSION)return;setTimeout(()=>{try{X13A.news(false);}catch(e){}},600);};
{const _rp6=renderProfile;renderProfile=function(){const r=_rp6.apply(this,arguments);try{const el=document.getElementById('v-profile');if(profTab==='defs'&&!el.querySelector('.x13app')){const out=el.querySelector('#x8-s-out');const card=out&&out.closest('.x8card');if(card){card.insertAdjacentHTML('beforebegin',X13A.cardHTML());X13A.bind(el);}}}catch(e){}return r;};}
/* 1.14.0 · avisos com a app fechada (Firebase Cloud Messaging)
   O telemóvel regista-se no FCM com a chave pública VAPID e guarda o token em data/users/{uid}/push.
   Quem envia é uma tarefa automática no GitHub (.github/pronex/push.mjs), de 10 em 10 minutos. */
const X13P=(()=>{
  const VAPID='BMQIJVlSWfXb3rZ1upgk7GmjBpU3KHpi1ZLXmt9GcllTi7f_wwXD0n4WJYxg1fjq-f9ldbdU26S9lL6KyTsSH0I';
  const L={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
  function devId(){let d=L.get('x13-dev','');if(!/^[a-z0-9]{12}$/.test(d)){d=Math.random().toString(36).slice(2,8)+Date.now().toString(36).slice(-6);d=(d+'000000000000').slice(0,12);L.set('x13-dev',d);}return d;}
  const ready=()=>!!(FB&&FB.app&&fbUser&&!fbUser.isAnonymous&&uid)&&'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  let M=null;async function msg(){if(M)return M;const mod=await import('https://www.gstatic.com/firebasejs/'+FB_VER+'/firebase-messaging.js');if(!(await mod.isSupported()))throw new Error('unsupported');M={mod,m:mod.getMessaging(FB.app)};return M;}
  async function register(force){
    if(!ready()||Notification.permission!=='granted'||L.get('x8-push','')!=='1')return false;
    const last=+L.get('x13-push-at',0);if(!force&&Date.now()-last<20*3600e3&&L.get('x13-push-uid','')===uid)return true;
    try{const {mod,m}=await msg();const reg=await navigator.serviceWorker.ready;
      const tok=await mod.getToken(m,{vapidKey:VAPID,serviceWorkerRegistration:reg});if(!tok)return false;
      const F=FB.Fs;await F.setDoc(fdoc('data/users/'+uid+'/push'),{toks:{[devId()]:tok},upd:F.serverTimestamp()},{merge:true});
      L.set('x13-push-at',Date.now());L.set('x13-push-uid',uid);return true;
    }catch(e){try{if(typeof X12!=='undefined'&&X12.report)X12.report('push: '+(e&&e.message||e),'','push');}catch(x){}return false;}}
  async function unregister(){if(!ready())return;try{const F=FB.Fs;await F.updateDoc(fdoc('data/users/'+uid+'/push'),{['toks.'+devId()]:F.deleteField(),upd:F.serverTimestamp()});}catch(e){}
    try{const {mod,m}=await msg();await mod.deleteToken(m);}catch(e){}L.set('x13-push-at',0);}
  function boot(){let n=0;const t=setInterval(()=>{n++;if(ready()){clearInterval(t);register(false);}else if(n>40)clearInterval(t);},3000);}
  return{register,unregister,boot,devId,VAPID};
})();
// O interruptor "Avisos no dispositivo" (Definições) e o botão da central de notificações pedem a permissão;
// depois de concedida, regista-se o token. Espera-se pela resposta ao pedido de permissão.
function x13pAfterAsk(){let n=0;const t=setInterval(()=>{n++;if(Notification.permission==='granted'&&localStorage.getItem('x8-push')==='1'){clearInterval(t);X13P.register(true);}else if(n>60||Notification.permission==='denied')clearInterval(t);},500);}
document.addEventListener('change',e=>{const t=e.target;if(!t||t.id!=='x8-s-push')return;if(t.checked)x13pAfterAsk();else X13P.unregister();},true);
document.addEventListener('click',e=>{const t=e.target&&e.target.closest&&e.target.closest('#x8-push');if(t)x13pAfterAsk();},true);
X13P.boot();

/* ===== 1.15.0 · revisão de design ===== */
const X15=(()=>{
  const L={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};

  // 3 · tabelas que não cabem: sombra à direita e aviso "desliza"
  function tables(root){(root||document).querySelectorAll('#v-play .tbl').forEach(t=>{
    t.classList.add('x15tw');const more=t.scrollWidth>t.clientWidth+4;t.classList.toggle('more',more);
    const nx=t.nextElementSibling,has=nx&&nx.classList.contains('x15hint');
    if(more&&!has)t.insertAdjacentHTML('afterend','<div class="x15hint" aria-hidden="true"><b>↔</b>Desliza a tabela para ver todas as colunas</div>');
    if(!more&&has)nx.remove();
    if(!t.dataset.x15){t.dataset.x15='1';t.addEventListener('scroll',()=>t.classList.toggle('more',t.scrollLeft+t.clientWidth<t.scrollWidth-4),{passive:true});}
  });}

  // 6, 7, 8, 9, 11 · Início
  function home(){const el=document.getElementById('v-home');if(!el)return;const H=el.querySelector('.x8home');if(!H)return;
    // missões e semana passam para a coluna do objetivo (no telemóvel ficam logo a seguir; no computador equilibram as colunas)
    const kids=[...H.children].filter(c=>!c.classList.contains('full')&&c.tagName==='DIV');
    const left=kids.find(c=>c.querySelector('.x8goalc')),h2=H.querySelector(':scope>.home2');
    if(left&&h2){left.classList.add('x15left');h2.classList.remove('full');left.appendChild(h2);}
    // 9 · semana vazia
    const wk=el.querySelector('.week');if(wk){const tot=[...wk.querySelectorAll('em')].reduce((s,e)=>s+(+e.textContent||0),0);
      if(!tot)wk.outerHTML='<div class="x15wk0"><span>Ainda não fizeste exercícios esta semana. Cada dia em que praticas aparece aqui como uma barra. <b>Faz 5 hoje para começar.</b></span></div>';}
    // 6 · ferramentas: 4 à vista + "Ver todas"
    const tl=el.querySelector('.x11tools');if(tl&&!el.querySelector('.x15more')){const n=tl.children.length;const open=L.get('x15-tools','0')==='1';tl.classList.toggle('x15all',open);
      if(n>4){tl.insertAdjacentHTML('afterend','<button class="x15more" aria-expanded="'+open+'">'+(open?'Mostrar menos':'Ver todas as ferramentas ('+n+')')+'</button>');
        const b=el.querySelector('.x15more');b.onclick=()=>{const o=!tl.classList.contains('x15all');tl.classList.toggle('x15all',o);L.set('x15-tools',o?'1':'0');b.setAttribute('aria-expanded',o);b.textContent=o?'Mostrar menos':'Ver todas as ferramentas ('+n+')';};}}
    // 8 · disciplinas "em breve" juntas num só botão
    const sj=el.querySelector('.x8subjs');if(sj&&!sj.querySelector('.x15soon')){const off=[...sj.querySelectorAll('.x8subj.off')];
      if(off.length>1){const names=off.map(b=>b.dataset.soon).filter(Boolean);off.forEach(b=>b.remove());
        sj.insertAdjacentHTML('beforeend','<button class="x8subj off x15soon"><span class="si">+'+names.length+'</span>Mais disciplinas<em>em breve</em></button>');
        sj.querySelector('.x15soon').onclick=()=>go('study');}}
  }

  // 8 · Estudar: separador "Em breve"
  function study(){const g=document.querySelector('#v-study .subjects');if(!g||g.querySelector('.x15soonh'))return;g.classList.add('big');
    const first=g.querySelector('.subj.off');if(first)first.insertAdjacentHTML('beforebegin','<div class="x15soonh">Em breve</div>');}

  // 14 · conquistas
  function badges(){const b=document.querySelector('#v-profile .badges');if(!b||b.dataset.x15)return;b.dataset.x15='1';
    const locked=[...b.querySelectorAll('.badge.locked')];const hide=locked.slice(3);if(!hide.length)return;hide.forEach(x=>x.classList.add('x15hide'));
    const open=L.get('x15-badges','0')==='1';b.classList.toggle('x15all',open);
    b.insertAdjacentHTML('afterend','<button class="x15more" id="x15-bdg">'+(open?'Mostrar menos':'Ver todas as conquistas ('+b.children.length+')')+'</button>');
    const t=document.getElementById('x15-bdg');t.onclick=()=>{const o=!b.classList.contains('x15all');b.classList.toggle('x15all',o);L.set('x15-badges',o?'1':'0');t.textContent=o?'Mostrar menos':'Ver todas as conquistas ('+b.children.length+')';};}

  // 12 · topo: nomes para leitores de ecrã
  function top(){document.querySelectorAll('#topstats .chipstat').forEach(c=>{if(c.querySelector('.flame')){const n=c.textContent.trim();c.title=n+' dias seguidos';c.setAttribute('aria-label',n+' dias seguidos');}
    else if(c.querySelector('.bolt')){const n=c.textContent.trim();c.title=n+' XP';c.setAttribute('aria-label',n+' pontos de experiência');}});}

  return{tables,home,study,badges,top};
})();
{const _rh=renderHome;renderHome=function(){const r=_rh.apply(this,arguments);try{X15.home();}catch(e){}return r;};}
{const _rp=renderProfile;renderProfile=function(){const r=_rp.apply(this,arguments);try{if(profTab==='stats')X15.badges();}catch(e){}return r;};}
{const _rf=refresh;refresh=function(){const r=_rf.apply(this,arguments);try{X15.top();if(view==='study')X15.study();if(view==='play')requestAnimationFrame(()=>X15.tables());}catch(e){}return r;};}
// O exercício muda sem passar por refresh(): observar o ecrã do exercício
try{const vp=document.getElementById('v-play');if(vp)new MutationObserver(()=>requestAnimationFrame(()=>X15.tables(vp))).observe(vp,{childList:true,subtree:true});}catch(e){}
addEventListener('resize',()=>{try{if(view==='play')X15.tables();}catch(e){}});
