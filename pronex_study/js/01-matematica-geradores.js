/* Pronex_Study · 01-matematica-geradores.js
   Matemática: geradores de exercícios com números sempre novos (um por tipo de exercício).
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/*GEN-START*/
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function G(rng){return{
  int:(a,b)=>a+Math.floor(rng()*(b-a+1)),
  pick:a=>a[Math.floor(rng()*a.length)],
  shuffle:a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
};}
const rnd=(x,d=2)=>{x=Number(x);if(!isFinite(x))return x;const s=Math.abs(x).toPrecision(12);return Math.sign(x)*Number(Math.round(Number(s+'e'+d))+'e-'+d);};
const nf=(x,d=2)=>rnd(x,d).toLocaleString('pt-PT',{minimumFractionDigits:d,maximumFractionDigits:d});
const ni=x=>Number(x).toLocaleString('pt-PT',{maximumFractionDigits:0});
const eur=x=>nf(x)+' €';
const pc=(x,d=1)=>nf(x,d)+'%';
const r2=x=>rnd(x,2);
const dec=x=>String(+x.toFixed(6)).replace('.',',');
const fq=x=>Math.abs(x-Math.round(x))<1e-9?ni(Math.round(x)):nf(x,1);
const T=(head,rows)=>'<div class="tbl" tabindex="0" role="region" aria-label="Tabela"><table><thead><tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
  rows.map(r=>'<tr>'+r.map((c,i)=>i===0?'<td class="l"><b>'+c+'</b></td>':'<td>'+c+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
function opts(g,correct,dist,fb){
  const out=[correct];
  for(const d of dist){if(out.length>=4)break;if(d!=null&&!out.includes(d))out.push(d);}
  let k=1;while(out.length<4&&k<80){const d=fb(k++);if(d!=null&&!out.includes(d))out.push(d);}
  const sh=g.shuffle(out);return{o:sh,a:sh.indexOf(correct)};
}

/* ---- Eleições ---- */
function elec(g){
  const I=g.int(80,900)*10, V=Math.round(I*g.int(55,85)/100);
  const b=Math.round(V*g.int(10,30)/1000)+1, n=Math.round(V*g.int(10,30)/1000)+1, VVE=V-b-n;
  const pA=g.int(36,56)/100, pB=(1-pA)*g.int(53,75)/100;
  const vals=[Math.round(VVE*pA),Math.round(VVE*pB)];vals.push(VVE-vals[0]-vals[1]);if(new Set(vals).size<3||Math.max(...vals)===vals.slice().sort((a,b)=>b-a)[1]){vals[0]+=1;vals[2]-=1;}
  const lab=g.shuffle(['A','B','C']);
  const cand=lab.map((l,i)=>({l,v:vals[i]}));
  const tab=cand.slice().sort((x,y)=>x.l<y.l?-1:1);
  const c='<p>Resultados de uma eleição:</p>'+T(['Dados','N.º'],[['Inscritos',ni(I)],['Votantes',ni(V)],['Votos em branco',ni(b)],['Votos nulos',ni(n)]])+
    T(['Candidato','Votos'],tab.map(x=>[x.l,ni(x.v)]));
  return{I,V,b,n,VVE,cand,c};
}
function perms(n){if(n===1)return[[0]];const r=[];perms(n-1).forEach(p=>{for(let i=0;i<=p.length;i++){const q=p.slice();q.splice(i,0,n-1);r.push(q);}});return r;}
const LET='ABCD';
function analyze(cols,p){
  const first=Array(p).fill(0),last=Array(p).fill(0),borda=Array(p).fill(0);
  cols.forEach(c=>{first[c.o[0]]+=c.v;last[c.o[p-1]]+=c.v;c.o.forEach((cand,pos)=>borda[cand]+=c.v*(p-pos));});
  return{first,last,borda};
}
const argmax=a=>a.indexOf(Math.max(...a));
const uniq=a=>a.filter(x=>x===Math.max(...a)).length===1;
function prefGen(g,p,ncols,vmin,vmax,need,strict){
  const P=perms(p);let last=null;
  for(let t=0;t<400;t++){
    const cols=[];const used=new Set();
    while(cols.length<ncols){const o=g.pick(P);const k=o.join('');if(used.has(k))continue;used.add(k);cols.push({v:g.int(vmin,vmax),o});}
    const info=analyze(cols,p);
    if(need(info)){last={cols,info};if(!strict||t>=250||strict(info))return last;}
  }
  return last;
}
function prefTable(cols,p){return T(['N.º de votos',...cols.map(c=>ni(c.v))],Array.from({length:p},(_,r)=>[(r+1)+'.ª preferência',...cols.map(c=>LET[c.o[r]])]));}
function bordaSteps(cols,p){
  const s=['Pontos: '+Array.from({length:p},(_,i)=>(i+1)+'.º = '+(p-i)).join(' · ')];
  for(let c=0;c<p;c++){
    const terms=cols.map(col=>col.v+'×'+(p-col.o.indexOf(c)));
    const tot=cols.reduce((s,col)=>s+col.v*(p-col.o.indexOf(c)),0);
    s.push(LET[c]+' = '+terms.join(' + ')+' = '+ni(tot));
  }
  const V=cols.reduce((s,c)=>s+c.v,0),sp=p*(p+1)/2;
  s.push('Controlo: '+ni(V)+' votos × '+sp+' = '+ni(V*sp)+' ✓');
  return s;
}

/* ---- Partilha ---- */
function alloc(v,m,div){
  const q=[];v.forEach((x,i)=>{for(let k=0;k<m;k++)q.push({i,k,q:x/div(k)});});
  q.sort((a,b)=>b.q-a.q);const seats=v.map(()=>0);q.slice(0,m).forEach(e=>seats[e.i]++);
  return{seats,last:q[m-1].q,next:q[m].q,top:q.slice(0,m)};
}
const dH=k=>k+1,dS=k=>2*k+1;
const PCTX=[
  {intro:m=>'Distribuir <b>'+m+' mandatos</b> pelas listas, de acordo com os votos:',col:'Lista',val:'Votos',L:['A','B','C','D'],one:'um mandato'},
  {intro:m=>'Uma escola de dança tem <b>'+m+' dias de ensaio</b> para distribuir pelas modalidades, de acordo com o n.º de alunos:',col:'Modalidade',val:'Alunos',L:['Ballet','Jazz','Hip-Hop','Contemporâneo'],one:'um dia'},
  {intro:m=>'Um município vai distribuir <b>'+m+' formadores</b> pelas aldeias, de acordo com o n.º de habitantes:',col:'Aldeia',val:'Habitantes',L:['Alegre','De Cima','De Baixo','Esperança'],one:'um formador'},
  {intro:m=>'Uma empresa vai distribuir <b>'+m+' representantes</b> pelos departamentos, de acordo com o n.º de colaboradores:',col:'Departamento',val:'Colaboradores',L:['Produção','Comercial','Logística','Apoio'],one:'um representante'}];
function partGen(g,needZero){
  for(let t=0;t<500;t++){
    const sc=g.pick(PCTX),m=g.int(5,8),big=g.int(25,95)*10;
    const v=[big,Math.round(big*g.int(45,80)/100),Math.round(big*g.int(24,44)/100),Math.round(big*g.int(6,22)/100)];
    const H=alloc(v,m,dH),S=alloc(v,m,dS);
    if(Math.abs(H.last-H.next)<0.6||Math.abs(S.last-S.next)<0.6)continue;
    if(needZero&&H.seats[3]!==0)continue;
    return{sc,m,v,H,S};
  }
}
const seatStr=(L,s)=>L.map((l,i)=>l+' '+s[i]).join(' · ');
function perturb(s){const out=[];for(let i=0;i<s.length;i++)for(let j=0;j<s.length;j++){if(i!==j&&s[i]>0){const c=s.slice();c[i]--;c[j]++;out.push(c);}}return out;}
function allocSteps(P,R,div,name){
  const L=P.sc.L,s=[name];
  P.v.forEach((x,i)=>{const k=Math.min(Math.max(R.seats[i]+1,2),5);s.push(L[i]+': '+Array.from({length:k},(_,j)=>fq(x/div(j))).join(' · '));});
  s.push('Os '+P.m+' maiores: '+R.top.map(e=>fq(e.q)).join(', '));
  s.push('Resultado: '+seatStr(L,R.seats));
  return s;
}

/* ---- Finanças ---- */
const RET=[{hi:1819,tx:24.1,pa:193.33},{lo:1820,hi:2119,tx:31.1,pa:320.66},{lo:2120,hi:2499,tx:34.9,pa:401.19},{lo:2500,hi:3305,tx:38.36,pa:487.66}];
const retTable=()=>T(['Remuneração mensal','Taxa marginal máxima','Parcela a abater','Parcela adicional por dependente'],RET.map(r=>['Até '+eur(r.hi),pc(r.tx,2),eur(r.pa),'21,43 €']));
function retGen(g){const ri=g.int(1,3),row=RET[ri];const SB=g.int(Math.ceil(row.lo/10),Math.floor(row.hi/10))*10;const dep=g.int(0,5);
  const base=SB*row.tx/100,r=r2(base-row.pa-dep*21.43);
  const sit=dep===0?'sem dependentes':dep+' dependente'+(dep>1?'s':'');
  return{ri,row,SB,dep,base,r,sit,c:'<p>Salário bruto mensal: <b>'+eur(SB)+'</b>, '+sit+'. Tabela de retenção na fonte (extrato da Tabela I, continente, 2026):</p>'+retTable()};}
function retSteps(R){return['A linha certa é a 1.ª cujo "Até" é maior que '+eur(R.SB)+' → até '+eur(R.row.hi)+': taxa '+pc(R.row.tx,2)+', parcela '+eur(R.row.pa),
  'r = '+eur(R.SB)+' × '+dec(R.row.tx/100)+' − '+eur(R.row.pa)+' − '+R.dep+' × 21,43',
  'r = '+eur(r2(R.base))+' − '+eur(R.row.pa)+' − '+eur(r2(R.dep*21.43))+' = '+eur(R.r)];}
const LIM=[8342,12587,17838,23089,29397,43090,46566],MAR=[12.2,15.2,20.7,23.6,30.6,34.6,43.1],MED=[12.2,13.212,15.416,17.277,20.136,24.732,26.103],DESP=4587.09;
const irsTable=()=>T(['Escalão','Rendimento coletável','Taxa marginal','Taxa média'],LIM.map((l,i)=>[(i+1)+'.º',i===0?'Até '+ni(l)+' €':'Mais de '+ni(LIM[i-1])+' € até '+ni(l)+' €',pc(MAR[i],2),pc(MED[i],3)]));
function irsGen(g){const k=g.int(1,5);const C=g.int(Math.ceil(LIM[k-1]/10)+5,Math.floor(Math.min(LIM[k],33200)/10)-5)*10;const bruto=r2(C+DESP);
  const p1=r2(LIM[k-1]*MED[k-1]/100),exc=C-LIM[k-1],p2=r2(exc*MAR[k]/100),col=r2(p1+p2);
  const ded=Math.max(300,Math.min(g.int(10,25)*100,Math.floor(col*0.45/50)*50)),liq=r2(col-ded);
  return{k,C,bruto,ded,p1,exc,p2,col,liq};}
function jcGen(g){return{C:g.int(10,120)*100,rr:g.int(4,20)*0.25,n:g.int(2,8)};}
const KN={1:'anual',2:'semestral',4:'trimestral',12:'mensal'};
function jcK(g,k){const J=jcGen(g),r=J.rr/100,Cf=r2(J.C*Math.pow(1+r/k,k*J.n));
  const {o,a}=opts(g,eur(Cf),[eur(r2(J.C*Math.pow(1+r,J.n))),eur(r2(J.C*Math.pow(1+r/k,J.n))),eur(r2(J.C*Math.pow(1+r,k*J.n))),eur(r2(J.C*(1+r*J.n)))],x=>eur(r2(Cf+x*3.17)));
  return{c:'<p>Aplicação de <b>'+eur(J.C)+'</b> a juro composto, taxa anual de <b>'+pc(J.rr,2)+'</b>, durante <b>'+J.n+' anos</b>, capitalização <b>'+KN[k]+'</b>.</p>',
    q:'Qual é o capital acumulado no fim do prazo?',o,a,
    s:['k = '+k+' (capitalização '+KN[k]+')','Taxa por período = '+dec(r)+' ÷ '+k+(Number.isInteger(rnd(r/k*1e6,6))&&String(rnd(r/k,6)).length<9?' = ':' ≈ ')+dec(r/k),'Expoente = k × n = '+k+' × '+J.n+' = '+k*J.n,'Cf = '+eur(J.C)+' × (1 + '+dec(r)+' ÷ '+k+')^'+k*J.n+' ≈ '+eur(Cf)],
    trap:'Com capitalização '+KN[k]+' mudas DUAS coisas: a taxa (r ÷ '+k+') e o expoente ('+k+' × n). Mudar só uma dá um valor errado que também aparece nas opções.'};}

const TYPES=[
 {t:'Eleições',n:'Votos validamente expressos',h:'vve',g:g=>{const e=elec(g);const {o,a}=opts(g,ni(e.VVE),[ni(e.V),ni(e.V-e.b),ni(e.I-e.b-e.n),ni(e.V-e.n)],k=>ni(e.VVE+k*7));
   return{c:e.c,q:'Quantos votos foram validamente expressos?',o,a,s:['VVE = votantes − brancos − nulos',ni(e.V)+' − '+ni(e.b)+' − '+ni(e.n)+' = '+ni(e.VVE),'Confirmação: '+e.cand.map(x=>ni(x.v)).join(' + ')+' = '+ni(e.VVE)+' ✓'],trap:'Parte dos votantes (não dos inscritos) e tira brancos E nulos.'};}},
 {t:'Eleições',n:'Percentagem de abstenção',h:'abst',g:g=>{const e=elec(g),ab=(e.I-e.V)/e.I*100;const {o,a}=opts(g,pc(ab),[pc(e.V/e.I*100),pc((e.I-e.V)/e.V*100),pc((e.I-e.VVE)/e.I*100)],k=>pc(ab+k*1.3));
   return{c:e.c,q:'Qual foi a percentagem de abstenção (às décimas)?',o,a,s:['Abstenção = '+ni(e.I)+' − '+ni(e.V)+' = '+ni(e.I-e.V)+' pessoas',ni(e.I-e.V)+' ÷ '+ni(e.I)+' × 100 ≈ '+pc(ab),'Controlo: participação '+pc(e.V/e.I*100)+' + abstenção '+pc(ab)+' = 100%'],trap:'A abstenção é quem NÃO votou, a dividir pelos INSCRITOS.'};}},
 {t:'Eleições',n:'Percentagem de um candidato',pri:1,h:'pctc',g:g=>{const e=elec(g),X=g.pick(e.cand),p=X.v/e.VVE*100;const {o,a}=opts(g,pc(p),[pc(X.v/e.V*100),pc(X.v/e.I*100),pc(100-p)],k=>pc(p+k*1.7));
   return{c:e.c,q:'Que percentagem dos votos obteve o candidato '+X.l+' (às décimas)?',o,a,s:['VVE = '+ni(e.V)+' − '+ni(e.b)+' − '+ni(e.n)+' = '+ni(e.VVE),'% de '+X.l+' = '+ni(X.v)+' ÷ '+ni(e.VVE)+' × 100 ≈ '+pc(p)],trap:'A percentagem de um candidato é sobre os votos validamente expressos, não sobre votantes nem inscritos.'};}},
 {t:'Eleições',n:'Maioria absoluta',pri:1,h:'maj',g:(g,n)=>{const e=elec(g),min=Math.floor(e.VVE/2)+1,S=e.cand.slice().sort((x,y)=>y.v-x.v);const L=S[0],B=S[1],C=S[2];
   const st=['VVE = '+ni(e.V)+' − '+ni(e.b)+' − '+ni(e.n)+' = '+ni(e.VVE),ni(e.VVE)+' ÷ 2 = '+nf(e.VVE/2,1)+' → mínimo '+ni(min)+' votos'];
   if(n%2){const {o,a}=opts(g,ni(min),[ni(Math.floor(e.VVE/2)),ni(Math.floor(e.V/2)+1),ni(min+1)],k=>ni(min+k*3));
     return{c:e.c,q:'Qual é o número mínimo de votos para ganhar por maioria absoluta?',o,a,s:st,trap:'Tem de ser MAIS de metade dos votos validamente expressos: se a metade der inteiro soma 1, se der decimal arredonda para cima.'};}
   const win=L.v>=min,s1='Sim, '+L.l+' ganhou à 1.ª volta',s2='Não, há 2.ª volta entre '+L.l+' e '+B.l,s3='Não, há 2.ª volta entre '+L.l+' e '+C.l,s4='Sim, '+B.l+' ganhou à 1.ª volta';
   const {o,a}=opts(g,win?s1:s2,[win?s2:s1,s3,s4],()=>null);
   st.push(win?L.l+' tem '+ni(L.v)+' ≥ '+ni(min)+' → ganha à 1.ª volta':L.l+' tem '+ni(L.v)+' < '+ni(min)+' → ninguém tem maioria absoluta');if(!win)st.push('2.ª volta com os dois mais votados: '+L.l+' e '+B.l);
   return{c:e.c,q:'Houve vencedor por maioria absoluta?',o,a,s:st,trap:'Ser o mais votado não chega: tem de ter mais de metade dos votos validamente expressos.'};}},
 {t:'Eleições',n:'Maioria simples (boletins)',h:'simples',g:g=>{const P=prefGen(g,3,g.int(4,5),2,40,i=>uniq(i.first));const w=argmax(P.info.first);
   const {o,a}=opts(g,LET[w],['A','B','C','Empate'].filter(x=>x!==LET[w]),()=>null);
   return{c:'<p>Boletins de preferência:</p>'+prefTable(P.cols,3),q:'Pelo método de maioria simples, quem ganha?',o,a,s:['Só conta a linha da 1.ª preferência','A = '+P.info.first[0]+' · B = '+P.info.first[1]+' · C = '+P.info.first[2],'Ganha '+LET[w]],trap:'O mesmo candidato pode estar em 1.º lugar em várias colunas: soma-as.'};}},
 {t:'Eleições',n:'Método de Borda (3 candidatos)',h:'borda',g:g=>{const P=prefGen(g,3,g.int(4,5),2,40,i=>uniq(i.borda)&&uniq(i.first),i=>argmax(i.borda)!==argmax(i.first));const w=argmax(P.info.borda);
   const others=[0,1,2].filter(x=>x!==w);const {o,a}=opts(g,LET[w],[LET[others[0]],LET[others[1]],'Empate entre '+LET[others[0]]+' e '+LET[others[1]]],()=>null);
   return{c:'<p>Boletins de preferência:</p>'+prefTable(P.cols,3),q:'Pelo método de Borda, quem ganha?',o,a,s:[...bordaSteps(P.cols,3),'Ganha '+LET[w]],trap:'O 1.º lugar recebe MAIS pontos (3) e o último recebe 1. Percorre todas as colunas para cada candidato.'};}},
 {t:'Eleições',n:'Candidato menos desejado',pri:1,h:'menos',g:g=>{const P=prefGen(g,3,g.int(4,5),2,40,i=>uniq(i.last),i=>{const w=argmax(i.last);return P_ok(i,w);});const w=argmax(P.info.last);
   const {o,a}=opts(g,LET[w],['A','B','C','Nenhum'].filter(x=>x!==LET[w]),()=>null);
   return{c:'<p>Boletins de preferência:</p>'+prefTable(P.cols,3),q:'Qual é o candidato menos desejado (mais votos em último lugar)?',o,a,s:['Soma a última linha (3.ª preferência) para cada candidato, em todas as colunas','A = '+P.info.last[0]+' · B = '+P.info.last[1]+' · C = '+P.info.last[2],'Menos desejado: '+LET[w]],trap:'Não olhes só para a coluna com mais votos: o mesmo candidato pode estar em último em várias colunas.'};}},
 {t:'Eleições',n:'Método de Borda (4 candidatos)',pri:1,h:'borda',g:g=>{const P=prefGen(g,4,4,15,200,i=>uniq(i.borda),i=>argmax(i.borda)!==argmax(i.first));const w=argmax(P.info.borda);
   const {o,a}=opts(g,LET[w],['A','B','C','D'].filter(x=>x!==LET[w]),()=>null);
   return{c:'<p>Boletins de preferência (4 candidatos):</p>'+prefTable(P.cols,4),q:'Pelo método de Borda, quem ganha?',o,a,s:[...bordaSteps(P.cols,4),'Ganha '+LET[w]],trap:'Com 4 candidatos: 1.º = 4 pontos, 2.º = 3, 3.º = 2, 4.º = 1. Se inverteres, ganha o candidato errado.'};}},
 {t:'Partilha',n:'Método de Hondt',h:'hondt',g:g=>{const P=partGen(g);const ans=seatStr(P.sc.L,P.H.seats);
   const {o,a}=opts(g,ans,[seatStr(P.sc.L,P.S.seats),...perturb(P.H.seats).map(s=>seatStr(P.sc.L,s))],()=>null);
   return{c:'<p>'+P.sc.intro(P.m)+'</p>'+T([P.sc.col,...P.sc.L],[[P.sc.val,...P.v.map(ni)]]),q:'Qual é a distribuição pelo método de Hondt?',o,a,s:allocSteps(P,P.H,dH,'Divide por 1, 2, 3, 4…'),trap:'Escolhe os '+P.m+' maiores quocientes de TODA a tabela, não por lista.'};}},
 {t:'Partilha',n:'Método de Sainte-Laguë',h:'sl',g:g=>{const P=partGen(g);const ans=seatStr(P.sc.L,P.S.seats);
   const {o,a}=opts(g,ans,[seatStr(P.sc.L,P.H.seats),...perturb(P.S.seats).map(s=>seatStr(P.sc.L,s))],()=>null);
   return{c:'<p>'+P.sc.intro(P.m)+'</p>'+T([P.sc.col,...P.sc.L],[[P.sc.val,...P.v.map(ni)]]),q:'Qual é a distribuição pelo método de Sainte-Laguë?',o,a,s:allocSteps(P,P.S,dS,'Divide por 1, 3, 5, 7…'),trap:'Sainte-Laguë usa só divisores ímpares (1, 3, 5…). Se usares 1, 2, 3 fazes Hondt.'};}},
 {t:'Partilha',n:'Quantos faltam para 1 lugar (Hondt)',h:'falta',g:g=>{let P=partGen(g,true);for(let t=0;t<60&&Number.isInteger(P.H.last);t++)P=partGen(g,true);const Lq=P.H.last,tot=Math.floor(Lq)+1,need=tot-P.v[3];
   const {o,a}=opts(g,ni(need),[ni(tot),ni(need-1),ni(Math.round(Lq)-P.v[3]-1)],k=>ni(need+k*13));
   return{c:'<p>'+P.sc.intro(P.m)+'</p>'+T([P.sc.col,...P.sc.L],[[P.sc.val,...P.v.map(ni)]]),q:'Pelo método de Hondt, '+P.sc.L[3]+' fica sem nada. Quantos '+P.sc.val.toLowerCase()+' a mais precisaria para conseguir '+P.sc.one+'?',o,a,
     s:[...allocSteps(P,P.H,dH,'Aplica o Hondt (divide por 1, 2, 3…)').slice(0,-1),'Último quociente escolhido = '+fq(Lq),P.sc.L[3]+' (divisor 1) tem de ultrapassar '+fq(Lq)+' → precisa de '+ni(tot),ni(tot)+' − '+ni(P.v[3])+' = '+ni(need)+' a mais'],trap:'A pergunta pede quantos A MAIS, não o total. Os votos da lista têm de passar o último quociente escolhido.'};}},
 {t:'Finanças',n:'Salário líquido',h:'liq',g:g=>{const B=g.int(90,200)*10,d=g.int(40,60)/10,dias=g.int(19,22),t=g.int(12,30)/2;
   const sub=r2(d*dias),ss=r2(B*0.11),irs=r2(B*t/100),bruto=r2(B+sub),liq=r2(bruto-ss-irs);
   const {o,a}=opts(g,eur(liq),[eur(r2(bruto-r2(bruto*0.11)-r2(bruto*t/100))),eur(r2(B-ss-irs)),eur(r2(bruto-ss))],k=>eur(r2(liq+k*12.5)));
   return{c:'<p>Recibo de vencimento:</p>'+T(['Descrição','Valor'],[['Salário base',eur(B)],['Subsídio de alimentação',eur(d)+'/dia × '+dias+' dias'],['Contribuição SS','11%'],['Retenção IRS',pc(t,1)]]),q:'Qual é o salário líquido?',o,a,
     s:['Subsídio = '+eur(d)+' × '+dias+' = '+eur(sub),'Bruto total = '+eur(B)+' + '+eur(sub)+' = '+eur(bruto),'SS = '+eur(B)+' × 0,11 = '+eur(ss),'IRS = '+eur(B)+' × '+dec(t/100)+' = '+eur(irs),'Líquido = '+eur(bruto)+' − '+eur(ss)+' − '+eur(irs)+' = '+eur(liq)],trap:'SS e IRS calculam-se só sobre o salário base, nunca sobre o subsídio.'};}},
 {t:'Finanças',n:'Salário bruto por hora',pri:1,h:'hora',g:g=>{const B=g.int(80,220)*10,h=g.pick([35,38,40]),v=r2(B*12/(52*h));
   const {o,a}=opts(g,eur(v),[eur(r2(B/(4*h))),eur(r2(B/(22*8))),eur(r2(B*12/(52*(h===40?35:40))))],k=>eur(r2(v+k*0.37)));
   return{c:'<p>Salário bruto de <b>'+eur(B)+'</b> por mês, com horário de <b>'+h+' horas semanais</b>.</p>',q:'Qual é o salário bruto por hora?',o,a,
     s:['€/hora = (SB × 12) ÷ (52 × horas semanais)','('+ni(B)+' × 12) ÷ (52 × '+h+') = '+ni(B*12)+' ÷ '+ni(52*h),'≈ '+eur(v)],trap:'Não dividas por 4 semanas: um mês tem mais de 4 semanas. Usa sempre 12 meses e 52 semanas.'};}},
 {t:'Finanças',n:'Retenção na fonte (tabela)',pri:1,h:'ret',g:g=>{const R=retGen(g);const other=RET[R.ri===3?2:R.ri+1];
   const {o,a}=opts(g,eur(R.r),[eur(r2(R.base)),eur(r2(R.base-R.row.pa)),eur(r2(R.base-R.row.pa-(R.dep+1)*21.43)),eur(r2(R.SB*other.tx/100-other.pa-R.dep*21.43))],k=>eur(r2(R.r+k*9.5)));
   return{c:R.c,q:'Qual é o valor a reter na fonte?',o,a,s:retSteps(R),trap:'Uma multiplicação e DUAS subtrações. Sublinha o n.º de dependentes no enunciado.'};}},
 {t:'Finanças',n:'Taxa efetiva de retenção',pri:1,h:'efet',g:g=>{const R=retGen(g),ef=R.r/R.SB*100;
   const {o,a}=opts(g,pc(ef,2),[pc(R.row.tx,2),pc((R.base-R.row.pa)/R.SB*100,2),pc((R.r+21.43)/R.SB*100,2)],k=>pc(ef+k*0.83,2));
   return{c:R.c,q:'Qual é a taxa efetiva de retenção (às centésimas)?',o,a,s:[...retSteps(R),'Taxa efetiva = '+eur(R.r)+' ÷ '+eur(R.SB)+' × 100 ≈ '+pc(ef,2)],trap:'A taxa marginal da tabela NÃO é a taxa efetiva. Primeiro calculas r (com as parcelas) e só depois divides pelo salário.'};}},
 {t:'Finanças',n:'IRS anual: coleta líquida',pri:1,h:'irs',g:g=>{const I=irsGen(g);
   const {o,a}=opts(g,eur(I.liq),[eur(r2(r2(LIM[I.k-1]*MAR[I.k-1]/100)+I.p2-I.ded)),eur(r2(I.C*MED[I.k]/100-I.ded)),eur(I.col)],k=>eur(r2(I.liq+k*41.3)));
   return{c:'<p>Contribuinte solteiro, residente no continente (rendimentos de 2026):</p>'+T(['Dados','Valor'],[['Rendimento bruto anual',eur(I.bruto)],['Dedução específica',eur(DESP)],['Deduções (saúde, educação…)',eur(I.ded)]])+irsTable(),
     q:'Qual é o valor da coleta líquida?',o,a,
     s:['Coletável = '+eur(I.bruto)+' − '+nf(DESP)+' = '+eur(I.C)+' → '+(I.k+1)+'.º escalão','Parte 1: '+ni(LIM[I.k-1])+' × '+pc(MED[I.k-1],3)+' (taxa MÉDIA do '+I.k+'.º, linha de cima) = '+eur(I.p1),'Parte 2: ('+ni(I.C)+' − '+ni(LIM[I.k-1])+') × '+pc(MAR[I.k],2)+' (taxa MARGINAL do '+(I.k+1)+'.º) = '+ni(I.exc)+' × '+dec(MAR[I.k]/100)+' = '+eur(I.p2),'Coleta = '+eur(I.p1)+' + '+eur(I.p2)+' = '+eur(I.col),'Coleta líquida = '+eur(I.col)+' − '+eur(I.ded)+' = '+eur(I.liq)],
     trap:'Na parte 1 usas a coluna TAXA MÉDIA da linha de CIMA. A taxa marginal só entra na parte 2 (o excedente).'};}},
 {t:'Finanças',n:'IRS: reembolso ou pagamento',h:'acerto',g:g=>{const liq=r2(g.int(800,4500)+g.int(0,99)/100),diff=r2(g.int(3,60)*10+g.int(0,99)/100),pos=g.int(0,1)===1,ret=r2(pos?liq+diff:liq-diff);
   const sR='Recebe '+eur(diff)+' de reembolso',sP='Paga mais '+eur(diff),s3='Não paga nem recebe',s4='Recebe '+eur(ret)+' de reembolso';
   const {o,a}=opts(g,pos?sR:sP,[pos?sP:sR,s3,s4],()=>null);
   return{c:'<p>No fim do ano:</p>'+T(['Dados','Valor'],[['Coleta líquida (imposto devido)',eur(liq)],['Retenções na fonte durante o ano',eur(ret)]]),q:'No acerto de contas, o contribuinte…',o,a,
     s:['Devia pagar '+eur(liq)+' e já pagou '+eur(ret),pos?eur(ret)+' > '+eur(liq)+' → pagou a mais → reembolso':eur(ret)+' < '+eur(liq)+' → pagou a menos → paga a diferença','Diferença = '+eur(diff)],trap:'Retenções maiores do que a coleta líquida = reembolso. Menores = paga a diferença.'};}},
 {t:'Finanças',n:'Juro simples: capital acumulado',h:'js',g:g=>{const C=g.int(10,200)*50,rr=g.int(2,16)*0.25,m=g.pick([3,4,6,8,9,15,18,20,30]),r=rr/100,Cf=r2(C*(1+r*m/12));
   const {o,a}=opts(g,eur(Cf),[eur(r2(C*(1+r*m))),eur(r2(C*(1+r))),eur(r2(C*Math.pow(1+r,m/12)))],k=>eur(r2(Cf+k*4.1)));
   return{c:'<p>Aplicação de <b>'+eur(C)+'</b> a juro <b>simples</b>, taxa anual de <b>'+pc(rr,2)+'</b>, durante <b>'+m+' meses</b>.</p>',q:'Qual é o capital acumulado?',o,a,
     s:['n = '+m+' ÷ 12 anos','r = '+pc(rr,2)+' = '+dec(r),'Cf = '+eur(C)+' × (1 + '+dec(r)+' × '+m+'/12) = '+eur(Cf),'Juro = '+eur(Cf)+' − '+eur(C)+' = '+eur(r2(Cf-C))],trap:'O tempo entra em ANOS: meses ÷ 12. Usar o n.º de meses direto dá um valor enorme.'};}},
 {t:'Finanças',n:'Juro simples: calcular o tempo',pri:1,h:'jsn',g:g=>{const C=g.int(10,100)*100,rr=g.int(2,12)*0.25,n=g.int(2,9),J=r2(C*rr/100*n);
   const {o,a}=opts(g,n+' anos',[(n*10)+' anos',(n*12)+' anos',(n+1)+' anos'],k=>(n+k+1)+' anos');
   return{c:'<p>Uma aplicação de <b>'+eur(C)+'</b> a juro simples, taxa anual de <b>'+pc(rr,2)+'</b>, rendeu <b>'+eur(J)+'</b> de juro.</p>',q:'Durante quanto tempo esteve aplicada?',o,a,
     s:['n = juro ÷ (Ci × r)','r = '+pc(rr,2)+' = '+dec(rr/100),'n = '+eur(J)+' ÷ ('+eur(C)+' × '+dec(rr/100)+') = '+eur(J)+' ÷ '+eur(C*rr/100),'n = '+n+' anos'],trap:'Converte a taxa com cuidado: '+pc(rr,2)+' = '+dec(rr/100)+'. Um zero a mais ou a menos multiplica ou divide o tempo por 10.'};}},
 {t:'Finanças',n:'Juro composto anual',h:'jc',g:g=>{const J=jcGen(g),r=J.rr/100,Cf=r2(J.C*Math.pow(1+r,J.n));
   const {o,a}=opts(g,eur(Cf),[eur(r2(J.C*(1+r*J.n))),eur(r2(J.C*Math.pow(1+r,J.n+1))),eur(r2(J.C*Math.pow(1+r/12,12*J.n)))],k=>eur(r2(Cf+k*5.3)));
   return{c:'<p>Aplicação de <b>'+eur(J.C)+'</b> a juro <b>composto</b>, taxa anual de <b>'+pc(J.rr,2)+'</b>, durante <b>'+J.n+' anos</b>, capitalização anual.</p>',q:'Qual é o capital acumulado?',o,a,
     s:['Cf = Ci × (1 + r)^n','Cf = '+eur(J.C)+' × (1 + '+dec(r)+')^'+J.n,'≈ '+eur(Cf)],trap:'No composto o tempo é expoente. Ci × (1 + r × n) é juro SIMPLES.'};}},
 {t:'Finanças',n:'Juro composto semestral/trimestral',pri:1,h:'jck',g:(g,n)=>jcK(g,n%2?2:4)},
 {t:'Finanças',n:'Juro composto mensal',h:'jck',g:g=>jcK(g,12)},
 {t:'Finanças',n:'Taxa de esforço',h:'esf',g:g=>{const R=g.int(12,45)*100,E=g.int(2,12)*50,P=g.int(4,30)*10,v=(E+P)/R*100;
   const {o,a}=opts(g,pc(v),[pc(E/R*100),pc(P/R*100),pc(100-v)],k=>pc(v+k*1.9));
   return{c:'<p>Rendimento líquido mensal: <b>'+eur(R)+'</b>. Encargos atuais com créditos: <b>'+eur(E)+'/mês</b>. Novo crédito: prestação de <b>'+eur(P)+'/mês</b>.</p>',q:'Qual será a taxa de esforço com o novo crédito (às décimas)?',o,a,
     s:['Encargos totais = '+eur(E)+' + '+eur(P)+' = '+eur(E+P),'Taxa de esforço = '+eur(E+P)+' ÷ '+eur(R)+' × 100 ≈ '+pc(v),v>30?'Fica acima dos 30% recomendados':'Fica dentro dos 30% recomendados'],trap:'Com novo crédito, soma TODOS os encargos antes de dividir.'};}},
 {t:'Finanças',n:'Encargos máximos permitidos',pri:1,h:'max',g:g=>{const R=g.int(12,45)*100,lim=g.pick([30,30,35]),mx=r2(R*lim/100),E=g.int(2,Math.max(2,Math.floor(mx/50)-1))*50;
   const {o,a}=opts(g,eur(mx),[eur(E),eur(r2(mx-E)),eur(r2(R*(100-lim)/100))],k=>eur(r2(mx+k*25)));
   return{c:'<p>Rendimento líquido mensal: <b>'+eur(R)+'</b>. Encargos atuais: <b>'+eur(E)+'/mês</b>. O banco recomenda uma taxa de esforço máxima de <b>'+lim+'%</b>.</p>',q:'Qual o valor máximo de encargos mensais para não ultrapassar os '+lim+'%?',o,a,
     s:['Encargos máx. = rendimento × '+dec(lim/100),eur(R)+' × '+dec(lim/100)+' = '+eur(mx),'Ainda pode assumir '+eur(r2(mx-E))+' de nova prestação'],trap:'A pergunta pede o máximo TOTAL de encargos. '+eur(E)+' são os encargos que já existem e '+eur(r2(mx-E))+' é o que ainda sobra.'};}},
 {t:'Finanças',n:'MTIC e custo total',pri:1,h:'mtic',g:(g,n)=>{const L=g.int(5,50)*1000,J=r2(L*g.int(8,35)/100+g.int(0,99)/100),Cm=g.int(8,60)*10,custo=r2(J+Cm),mt=r2(L+custo);
   const c='<p>Simulação de crédito pessoal:</p>'+T(['Dados','Valor'],[['Montante do empréstimo',eur(L)],['Total de juros',eur(J)],['Comissões, seguros e impostos',eur(Cm)]]);
   if(n%2){const {o,a}=opts(g,eur(custo),[eur(mt),eur(J),eur(r2(L+J))],k=>eur(r2(custo+k*50)));
     return{c,q:'Qual é o custo total do empréstimo?',o,a,s:['Custo total = juros + comissões, seguros e impostos',eur(J)+' + '+eur(Cm)+' = '+eur(custo)],trap:'O custo total NÃO inclui o valor emprestado. Esse entra só no MTIC.'};}
   const {o,a}=opts(g,eur(mt),[eur(r2(L+J)),eur(custo),eur(r2(L+Cm))],k=>eur(r2(mt+k*50)));
   return{c,q:'Qual é o MTIC (montante total imputado ao consumidor)?',o,a,s:['Custo total = '+eur(J)+' + '+eur(Cm)+' = '+eur(custo),'MTIC = empréstimo + custo total = '+eur(L)+' + '+eur(custo)+' = '+eur(mt)],trap:'O MTIC soma TUDO: o empréstimo, os juros e as comissões, seguros e impostos.'};}},
 {t:'Finanças',n:'Comparar propostas (TAN/TAEG)',pri:1,h:'taeg',g:(g,n)=>{const t1=g.int(60,220)*5/100,t2=r2(t1+g.int(10,40)/100),e2=r2(t2+g.int(80,200)/100),e1=r2(e2+g.int(10,50)/100);
   const sw=g.int(0,1)===1;const P=sw?[{tan:t2,taeg:e2},{tan:t1,taeg:e1}]:[{tan:t1,taeg:e1},{tan:t2,taeg:e2}];
   const lowTAN=P[0].tan<P[1].tan?1:2,lowTAEG=P[0].taeg<P[1].taeg?1:2,oT=3-lowTAN,oE=3-lowTAEG;
   const c='<p>Duas propostas para o mesmo empréstimo (mesmo valor e prazo):</p>'+T(['','Proposta 1','Proposta 2'],[['TAN',pc(P[0].tan,2),pc(P[1].tan,2)],['TAEG',pc(P[0].taeg,2),pc(P[1].taeg,2)]]);
   if(n%2){const ans='Proposta '+lowTAN+', porque tem menor TAN';const {o,a}=opts(g,ans,['Proposta '+lowTAEG+', porque tem menor TAEG','São iguais','Proposta '+oT+', porque tem maior TAEG'],()=>null);
     return{c,q:'Em qual das propostas a prestação mensal tende a ser mais baixa?',o,a,s:['A prestação depende sobretudo dos juros → TAN','Menor TAN: Proposta '+lowTAN],trap:'Prestação mais baixa (TAN) não quer dizer proposta mais barata no total (TAEG).'};}
   const ans='Proposta '+lowTAEG+', porque tem menor TAEG';const {o,a}=opts(g,ans,['Proposta '+lowTAN+', porque tem menor TAN','São iguais','Proposta '+oE+', porque tem maior TAN'],()=>null);
   return{c,q:'Qual é a proposta mais favorável?',o,a,s:['A TAEG inclui juros + comissões + seguros + impostos = custo total','Para comparar propostas usa-se a TAEG','Menor TAEG: Proposta '+lowTAEG],trap:'Não escolhas pela TAN: ela só mostra os juros. Quem decide é a TAEG.'};}}
];
function P_ok(){return true;}
TYPES.push(
 {t:'Finanças',n:'Recibo com seguro de saúde',pri:1,h:'liq2',g:(g,n)=>{const B=g.int(90,190)*10+g.pick([0,0,5]),hasS=g.int(0,2)>0,d=g.int(50,75)/10,dias=g.int(19,22),ti=g.pick([6,7.5,8,9,10,11]),ts=g.pick([2,3,4]);
   const sub=hasS?r2(d*dias):0,bruto=r2(B+sub),ss=r2(B*0.11),irs=r2(B*ti/100),seg=r2(B*ts/100),desc=r2(ss+irs+seg),liq=r2(bruto-desc);
   const rows=[['Salário base',eur(B),'']];if(hasS)rows.push(['Subsídio de alimentação ('+eur(d)+' × '+dias+' dias)','?','']);
   rows.push(['Segurança Social (11%)','','?'],['Retenção IRS ('+pc(ti,1)+')','','?'],['Seguro de saúde ('+ts+'%)','','?']);
   const c='<p>Recibo de vencimento:</p>'+T(['Descrição','Abono','Desconto'],rows);
   const st=[];if(hasS)st.push('Subsídio = '+eur(d)+' × '+dias+' = '+eur(sub));st.push('Bruto = '+(hasS?eur(B)+' + '+eur(sub)+' = ':'')+eur(bruto));
   const st2=['SS = '+eur(B)+' × 0,11 = '+eur(ss),'IRS = '+eur(B)+' × '+dec(ti/100)+' = '+eur(irs),'Seguro = '+eur(B)+' × '+dec(ts/100)+' = '+eur(seg),'Total de descontos = '+eur(ss)+' + '+eur(irs)+' + '+eur(seg)+' = '+eur(desc)];
   const k=n%3;
   if(k===0&&hasS){const {o,a}=opts(g,eur(bruto),[eur(B),eur(r2(bruto-ss)),eur(r2(B+d))],x=>eur(r2(bruto+x*21)));return{c,q:'Qual é o salário bruto (montante bruto total)?',o,a,s:st,trap:'O bruto é a soma da coluna Abono: base + subsídio.'};}
   if(k!==2){const {o,a}=opts(g,eur(desc),[eur(r2(ss+irs)),eur(r2(bruto*(0.11+ti/100+ts/100))),eur(r2(desc+seg))],x=>eur(r2(desc+x*13)));return{c,q:'Qual é o total de descontos?',o,a,s:st2,trap:'O seguro de saúde também é desconto. As percentagens aplicam-se ao salário base.'};}
   const {o,a}=opts(g,eur(liq),[eur(r2(bruto-ss-irs)),eur(r2(bruto-bruto*(0.11+ti/100+ts/100))),eur(r2(B-desc))],x=>eur(r2(liq+x*17)));
   return{c,q:'Qual é o salário líquido?',o,a,s:[...st,...st2,'Líquido = '+eur(bruto)+' − '+eur(desc)+' = '+eur(liq)],trap:'Inclui o seguro de saúde nos descontos e, se houver subsídio, soma-o ao bruto (sem lhe aplicar descontos).'};}},
 {t:'Finanças',n:'Juro simples: juro e capital',pri:1,h:'js',g:(g,n)=>{const C=g.pick([8000,9000,10000,11000,12000,13000,15000]),rr=g.pick([2,2.5,3,4,5,6]),r=rr/100;
   if(n%2===0){const y=g.int(2,5),Cf=r2(C*(1+r*y)),J=r2(Cf-C);const askJ=g.int(0,1)===1;
     const c='<p>Aplicação de <b>'+eur(C)+'</b> a juro simples, taxa anual de <b>'+pc(rr,1)+'</b>, durante <b>'+y+' anos</b>.</p>';
     const s=['Cf = '+eur(C)+' × (1 + '+dec(r)+' × '+y+') = '+eur(Cf),'Juro = '+eur(Cf)+' − '+eur(C)+' = '+eur(J)];
     if(askJ){const {o,a}=opts(g,eur(J),[eur(Cf),eur(r2(C*r)),eur(r2(C*(Math.pow(1+r,y)-1)))],x=>eur(r2(J+x*100)));return{c,q:'Qual é o valor do juro obtido?',o,a,s,trap:'O juro é Cf − Ci, não o capital final.'};}
     const {o,a}=opts(g,eur(Cf),[eur(J),eur(r2(C*(1+r))),eur(r2(C*Math.pow(1+r,y)))],x=>eur(r2(Cf+x*100)));return{c,q:'Qual é o capital acumulado?',o,a,s,trap:'Em juro simples é Ci × (1 + r × n), não (1 + r)^n.'};}
   const m=g.pick([3,4,6,8,9,10]),Cf=Math.round(C*(1+r*m/12));
   const {o,a}=opts(g,ni(Cf)+' €',[ni(Math.round(C*(1+r*m)))+' €',ni(Math.round(C*Math.pow(1+r,m/12)))+' €',ni(Math.round(C*(1+r)))+' €'],x=>ni(Cf+x*25)+' €');
   return{c:'<p>Aplicação de <b>'+eur(C)+'</b> a juro simples, taxa anual de <b>'+pc(rr,1)+'</b>.</p>',q:'Ao fim de '+m+' meses, o capital acumulado, arredondado às unidades, é:',o,a,
     s:['n = '+m+' ÷ 12 anos','Cf = '+eur(C)+' × (1 + '+dec(r)+' × '+m+'/12) ≈ '+ni(Cf)+' €'],trap:'Meses ÷ 12. Se usares '+m+' direto, o valor dispara.'};}},
 {t:'Finanças',n:'Juro composto em meses',pri:1,h:'jck',g:g=>{const C=g.pick([8000,9000,10000,11000,12000]),rr=g.pick([1.5,2,2.5,3,3.5,4]),r=rr/100,m=g.pick([6,8,9,10,18]),Cf=r2(C*Math.pow(1+r/12,m));
   const {o,a}=opts(g,eur(Cf),[eur(r2(C*Math.pow(1+r,m))),eur(r2(C*(1+r*m/12))),eur(r2(C*Math.pow(1+r/12,12*m)))],x=>eur(r2(Cf+x*7)));
   return{c:'<p>Aplicação de <b>'+eur(C)+'</b> a juro composto, taxa anual de <b>'+pc(rr,1)+'</b>, com juro capitalizado <b>mensalmente</b>.</p>',q:'Qual é o capital acumulado ao fim de '+m+' meses?',o,a,
     s:['Taxa por mês = '+dec(r)+' ÷ 12','Expoente = n.º de meses = '+m,'Cf = '+eur(C)+' × (1 + '+dec(r)+'/12)^'+m+' ≈ '+eur(Cf)],trap:'Com capitalização mensal e o tempo em meses, o expoente é o número de meses (12 × n, com n = '+m+'/12).'};}},
 {t:'Finanças',n:'Retenção: taxa marginal',pri:1,h:'ret',g:g=>{const R=retGen(g),rates=RET.map(x=>pc(x.tx,2)),ans=pc(R.row.tx,2);
   const {o,a}=opts(g,ans,rates.filter(x=>x!==ans),()=>null);
   return{c:R.c,q:'Qual é a taxa marginal máxima a aplicar a este salário?',o,a,s:['Desce a coluna "Até" e para na 1.ª linha maior que '+eur(R.SB),'Linha "Até '+eur(R.row.hi)+'" → '+pc(R.row.tx,2)],trap:'Não escolhas a linha de baixo: o salário tem de caber ATÉ ao limite da linha.'};}}
);
TYPES.push(
 {t:'Eleições',n:'Método de Condorcet',pri:1,h:'cond',g:g=>{
   const wantNone=g.int(0,4)===0;let cols,res,w;
   for(let tries=0;tries<60;tries++){cols=prefGen(g,3,g.int(3,4),3,40,i=>true,null).cols;
     const beats=(x,y)=>cols.reduce((s,c)=>s+(c.o.indexOf(x)<c.o.indexOf(y)?c.v:0),0);
     res=[[0,1],[0,2],[1,2]].map(([x,y])=>({x,y,vx:beats(x,y),vy:beats(y,x)}));
     w=null;for(let c=0;c<3;c++){if(res.filter(r=>(r.x===c&&r.vx>r.vy)||(r.y===c&&r.vy>r.vx)).length===2)w=c;}
     if(res.some(r=>r.vx===r.vy))continue;if((w===null)===wantNone)break;}
   const ans=w===null?'Não há vencedor de Condorcet':LET[w];
   const {o,a}=opts(g,ans,['A','B','C','Não há vencedor de Condorcet'].filter(x=>x!==ans),()=>null);
   return{c:'<p>Boletins de preferência:</p>'+prefTable(cols,3),q:'Pelo método de Condorcet (confronto direto), quem ganha?',o,a,
     s:['Compara os candidatos dois a dois: conta os votos de quem prefere um ao outro',...res.map(r=>LET[r.x]+' vs '+LET[r.y]+': '+r.vx+' contra '+r.vy+' → ganha '+(r.vx>r.vy?LET[r.x]:r.vy>r.vx?LET[r.y]:'empate')),w===null?'Nenhum candidato vence os outros dois':'Vence os dois confrontos: '+LET[w]],
     trap:'Em cada confronto, cada coluna conta toda para o candidato que aparece mais acima nessa coluna, mesmo que nenhum dos dois esteja em 1.º lugar.'};}},
 {t:'Finanças',n:'Orçamento familiar',pri:1,h:'orc',g:(g,n)=>{
   const s1=g.int(85,180)*10,s2=g.int(0,1)?g.int(80,150)*10:0,out=g.int(0,3)*50;const R=s1+s2+out;
   const tgt=R*g.int(70,98)/100,w=[.36,.27,.12,.1,.15].map(x=>x*(0.85+g.int(0,30)/100));const ws=w.reduce((a,b)=>a+b,0);
   const [ren,ali,tra,ene,lz]=w.map(x=>Math.max(30,Math.round(tgt*x/ws/10)*10));const D=ren+ali+tra+ene+lz;
   const rows=[['Salário 1',eur(s1)]];if(s2)rows.push(['Salário 2',eur(s2)]);if(out)rows.push(['Abono de família',eur(out)]);
   const c='<p>Orçamento mensal de uma família:</p>'+T(['Rendimentos','Valor'],rows)+T(['Despesas','Valor'],[['Renda da casa',eur(ren)],['Alimentação',eur(ali)],['Transportes',eur(tra)],['Água, luz e gás',eur(ene)],['Lazer',eur(lz)]]);
   if(n%2===0){const sal=R-D;const {o,a}=opts(g,eur(sal),[eur(R),eur(D),eur(R-D+lz)],k=>eur(sal+k*35));
     return{c,q:'Qual é o saldo mensal da família?',o,a,s:['Rendimentos = '+([s1,s2,out].filter(Boolean).length>1?[s1,s2,out].filter(Boolean).map(eur).join(' + ')+' = ':'')+eur(R),'Despesas = '+[ren,ali,tra,ene,lz].map(eur).join(' + ')+' = '+eur(D),'Saldo = '+eur(R)+' − '+eur(D)+' = '+eur(sal)],trap:'Soma todos os rendimentos e todas as despesas antes de subtrair.'};}
   const p=ren/R*100;const {o,a}=opts(g,pc(p),[pc(ren/D*100),pc(D/R*100),pc((R-ren)/R*100)],k=>pc(p+k*2.3));
   return{c,q:'Que percentagem do rendimento vai para a renda da casa (às décimas)?',o,a,s:['Rendimentos = '+eur(R),'% = '+eur(ren)+' ÷ '+eur(R)+' × 100 ≈ '+pc(p)],trap:'Divide pelo total dos rendimentos, não pelo total das despesas.'};}},
 {t:'Finanças',n:'Crédito: total pago e custo',h:'cred',g:(g,n)=>{
   const L=g.int(30,200)*100,m=g.pick([24,36,48,60,72]),i=g.int(4,14)/100,P=r2(L*(1+i*m/12)/m),tot=r2(P*m),custo=r2(tot-L);
   const c='<p>Um crédito de <b>'+eur(L)+'</b> é pago em <b>'+m+' prestações mensais</b> de <b>'+eur(P)+'</b>.</p>';
   if(n%2===0){const {o,a}=opts(g,eur(tot),[eur(r2(P*m/12)),eur(r2(L+P)),eur(custo)],k=>eur(r2(tot+k*120)));
     return{c,q:'Quanto é pago no total, no fim do crédito?',o,a,s:['Total pago = prestação × n.º de prestações','= '+eur(P)+' × '+m+' = '+eur(tot)],trap:'O prazo vem em meses: multiplica pelo número de prestações, não pelos anos.'};}
   const {o,a}=opts(g,eur(custo),[eur(tot),eur(r2(custo/m)),eur(r2(L*i))],k=>eur(r2(custo+k*90)));
   return{c,q:'Quanto custa o crédito (o que se paga a mais do que o valor pedido)?',o,a,s:['Total pago = '+eur(P)+' × '+m+' = '+eur(tot),'Custo = total pago − valor pedido = '+eur(tot)+' − '+eur(L)+' = '+eur(custo)],trap:'O custo é só o que pagas a mais; o total pago inclui o valor emprestado.'};}}
);
/* =====================================================================
   Estatística (MACS 10.º ano) — novos tipos de exercício para TYPES
   ---------------------------------------------------------------------
   COMO INTEGRAR em index.html (sem dependências):
   PARTE A — colar todo este ficheiro ANTES da linha  /*GEN-END*\/
             (usa G, opts, ni, nf, pc, rnd, T, dec, que já existem nesse bloco).
   PARTE B — depois da definição de HELP (a seguir a "};" que fecha HELP,
             antes de function helpCard) acrescentar a linha:
                 Object.assign(HELP,st_help());
   PARTE C — acrescentar 'Estatística' às duas listas TEMAS
             (const TEMAS=['Eleições','Partilha','Finanças','Estatística'];).

   CONVENÇÕES (iguais às fichas MACS 10.º da DGE / Estudo Autónomo):
   - Desvio-padrão AMOSTRAL: s = √( Σ(xᵢ − x̄)² ÷ (n − 1) ), que é o Sx
     da calculadora gráfica. O desvio populacional (÷ n, σx) aparece como
     distrator. Para mudar de convenção basta pôr ST_SAMPLE=false.
   - Quartis pelo método das metades: Q1 = mediana da metade inferior e
     Q3 = mediana da metade superior; com n ímpar a mediana NÃO entra em
     nenhuma das metades (como na calculadora). Os geradores só usam n que
     NÃO seja da forma 4k+1, o único caso em que este método e o dos
     percentis (posição n × 0,25) dão valores diferentes.
   - Classes de dados agrupados fechadas à esquerda [a, b[ (a última fechada).
   ===================================================================== */
const ST_SAMPLE=true;
const st_sum=a=>a.reduce((s,x)=>s+x,0);
const st_mean=a=>st_sum(a)/a.length;
const st_sort=a=>a.slice().sort((x,y)=>x-y);
function st_med(s){const n=s.length,m=Math.floor(n/2);return n%2?s[m]:(s[m-1]+s[m])/2;}
function st_quart(a){const s=st_sort(a),n=s.length,h=Math.floor(n/2),lo=s.slice(0,h),hi=s.slice(n%2?h+1:h);return{s,lo,hi,q1:st_med(lo),me:st_med(s),q3:st_med(hi)};}
function st_sd(a,samp){const m=st_mean(a),ss=st_sum(a.map(x=>(x-m)*(x-m)));return Math.sqrt(ss/(samp?a.length-1:a.length));}
function st_r(P){const n=P.length,mx=st_mean(P.map(p=>p[0])),my=st_mean(P.map(p=>p[1]));let sxy=0,sxx=0,syy=0;P.forEach(([x,y])=>{sxy+=(x-mx)*(y-my);sxx+=(x-mx)*(x-mx);syy+=(y-my)*(y-my);});return{r:sxy/Math.sqrt(sxx*syy),a:sxy/sxx,b:my-sxy/sxx*mx,mx,my};}
/* número "limpo": inteiro, uma ou duas casas decimais */
const st_v=x=>{x=rnd(x,6);return Number.isInteger(x)?ni(x):Number.isInteger(rnd(x*10,6))?nf(x,1):nf(x,2);};
const st_m=s=>String(s).replace(/^-/,'−');
const st_list=a=>'<p class="st-data">'+a.join(' · ')+'</p>';
const st_lc=s=>/^[A-Z][a-zà-ú]/.test(s)?s[0].toLowerCase()+s.slice(1):s;
const st_cls=(a,w,last)=>'['+ni(a)+', '+ni(a+w)+(last?']':'[');

function st_ints(g,n,lo,hi,minDistinct){for(let t=0;t<200;t++){const a=Array.from({length:n},()=>g.int(lo,hi));if(new Set(a).size>=(minDistinct||Math.ceil(n*0.6)))return a;}return Array.from({length:n},(_,i)=>lo+((i*7)%(hi-lo+1)));}
const ST_LIST=[
 {i:n=>'Tempo (em minutos) que '+n+' alunos de uma turma do 10.º ano demoram a chegar à escola:',lo:5,hi:55,u:'min'},
 {i:n=>'Classificações (0 a 20 valores) de '+n+' alunos no teste de Matemática:',lo:4,hi:19,u:'valores'},
 {i:n=>'Altura (em cm) de '+n+' alunos da equipa de voleibol do desporto escolar:',lo:152,hi:189,u:'cm'},
 {i:n=>'Número de páginas lidas por '+n+' alunos durante a semana da leitura:',lo:12,hi:95,u:'páginas'},
 {i:n=>'Pontos marcados por '+n+' jogadores no torneio inter-turmas de basquetebol:',lo:0,hi:28,u:'pontos'},
 {i:n=>'Tempo (em minutos) que '+n+' alunos passaram no TikTok num domingo:',lo:10,hi:180,u:'min'}];
const ST_CAT=[
 {t:'Meio de transporte usado pelos alunos do 10.º ano para vir para a escola',col:'Meio de transporte',L:['A pé','Autocarro','Carro','Metrobus','Bicicleta']},
 {t:'Disciplina preferida dos alunos de duas turmas do curso de Multimédia',col:'Disciplina',L:['Matemática','Português','Inglês','Multimédia','Educação Física']},
 {t:'Prato escolhido na cantina da escola numa sexta-feira',col:'Prato',L:['Carne','Peixe','Vegetariano','Dieta']},
 {t:'Rede social mais usada pelos alunos do 11.º ano',col:'Rede social',L:['Instagram','TikTok','WhatsApp','YouTube','Snapchat']}];
const ST_DISC=[
 {t:'Número de irmãos dos alunos de duas turmas do 10.º ano',col:'N.º de irmãos',x:[0,1,2,3,4],w:'irmãos',w1:'irmão',p:[8,14,9,4,2]},
 {t:'Número de faltas injustificadas no 1.º período dos alunos de uma escola profissional',col:'N.º de faltas',x:[0,1,2,3,4,5],w:'faltas',w1:'falta',p:[14,9,6,4,3,2]},
 {t:'Número de livros lidos nas férias de verão pelos alunos do 10.º ano',col:'N.º de livros',x:[0,1,2,3,4,5],w:'livros',w1:'livro',p:[9,13,8,5,3,1]},
 {t:'Número de disciplinas com classificação negativa no 1.º período',col:'N.º de negativas',x:[0,1,2,3,4],w:'negativas',w1:'negativa',p:[16,8,5,3,1]},
 {t:'Número de pessoas do agregado familiar dos alunos de uma turma',col:'N.º de pessoas',x:[1,2,3,4,5,6],w:'pessoas',w1:'pessoa',p:[1,5,11,9,4,2]}];
const ST_GRP=[
 {t:'Tempo (em minutos) de deslocação casa–escola dos alunos do 10.º ano',v:'tempo de deslocação',a0:0,w:10,k:5,u:'minutos',who:'alunos'},
 {t:'Altura (em cm) dos alunos do 10.º ano de uma escola da Lousã',v:'altura',a0:150,w:5,k:6,u:'cm',who:'alunos'},
 {t:'Classificação (0 a 20 valores) no teste intermédio de MACS',v:'classificação',a0:0,w:4,k:5,u:'valores',who:'alunos'},
 {t:'Tempo diário (em minutos) passado nas redes sociais pelos alunos do 11.º ano',v:'tempo diário',a0:0,w:30,k:5,u:'minutos',who:'alunos'},
 {t:'Massa (em kg) das mochilas dos alunos do 7.º ano, pesadas à entrada da escola',v:'massa da mochila',a0:2,w:2,k:5,u:'kg',who:'alunos'}];
function st_freqs(g,k,lo,hi,peakMin){/* frequências com máximo único (diferença ≥ 2) */
  for(let t=0;t<300;t++){const f=Array.from({length:k},()=>g.int(lo,hi));const s=st_sort(f);if(s[k-1]-s[k-2]>=(peakMin||2))return f;}
  const f=Array.from({length:k},(_,i)=>lo+i);f[k-1]+=3;return f;}
function st_discGen(g){const D=g.pick(ST_DISC),sc=g.int(2,4)/2;let f=D.p.map(p=>Math.max(1,Math.round(p*sc+g.int(-2,2))));
  const mx=Math.max(...f);if(f.filter(x=>x===mx).length>1){f[f.indexOf(mx)]+=2;}
  return{D,f,N:st_sum(f)};}
const st_w=(D,x)=>x===1?D.w1:D.w;
const st_discTable=(D,f)=>T([D.col,'Frequência absoluta'],D.x.map((x,i)=>[ni(x),ni(f[i])])) ;

/* ---- SVG simples (usa as cores da app, com alternativa para o modo claro) ---- */
const ST_BAR='fill:var(--c1b,rgba(0,170,200,.18));stroke:var(--cyan,#0a8fa3);stroke-width:1.5';
const ST_TX='fill:currentColor;font-size:11px;font-family:inherit';
function st_histSVG(G0,f){const W=340,H=210,x0=42,x1=330,y0=176,y1=18,k=f.length,mx=Math.max(...f),top=Math.ceil(mx*1.15/2)*2,bw=(x1-x0)/k,Y=v=>y0-(y0-y1)*v/top;
  const lab='Histograma: '+f.map((v,i)=>st_cls(G0.a0+i*G0.w,G0.w,i===k-1)+': '+v).join('; ');
  let s='<svg class="st-svg" viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:420px;display:block;margin:8px 0" role="img" aria-label="'+lab+'">';
  for(let v=0;v<=top;v+=Math.max(1,Math.round(top/5))){s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+Y(v)+'" y2="'+Y(v)+'" style="stroke:currentColor;opacity:.15"/><text x="'+(x0-6)+'" y="'+(Y(v)+4)+'" text-anchor="end" style="'+ST_TX+'">'+v+'</text>';}
  f.forEach((v,i)=>{const x=x0+i*bw;s+='<rect x="'+x+'" y="'+Y(v)+'" width="'+bw+'" height="'+(y0-Y(v))+'" style="'+ST_BAR+'"/><text x="'+(x+bw/2)+'" y="'+(Y(v)-4)+'" text-anchor="middle" style="'+ST_TX+';font-weight:700">'+v+'</text>';});
  for(let i=0;i<=k;i++)s+='<text x="'+(x0+i*bw)+'" y="'+(y0+15)+'" text-anchor="middle" style="'+ST_TX+'">'+ni(G0.a0+i*G0.w)+'</text>';
  s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+y0+'" y2="'+y0+'" style="stroke:currentColor"/><line x1="'+x0+'" x2="'+x0+'" y1="'+y1+'" y2="'+y0+'" style="stroke:currentColor"/>';
  s+='<text x="'+((x0+x1)/2)+'" y="'+(H-2)+'" text-anchor="middle" style="'+ST_TX+';opacity:.75">'+G0.v+' ('+G0.u+')</text><text x="10" y="'+(y1-6)+'" style="'+ST_TX+';opacity:.75">N.º de '+G0.who+'</text></svg>';
  return s;}
function st_boxSVG(F,lo,hi,step,u){const W=340,H=120,x0=24,x1=326,X=v=>x0+(x1-x0)*(v-lo)/(hi-lo),yc=52,bh=30,nm=['mínimo','Q1','mediana','Q3','máximo'];
  let s='<svg class="st-svg" viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:440px;display:block;margin:8px 0" role="img" aria-label="Diagrama de extremos e quartis: '+F.map((v,i)=>nm[i]+' '+v).join('; ')+'">';
  s+='<line x1="'+X(F[0])+'" x2="'+X(F[1])+'" y1="'+yc+'" y2="'+yc+'" style="stroke:currentColor;stroke-width:1.5"/><line x1="'+X(F[3])+'" x2="'+X(F[4])+'" y1="'+yc+'" y2="'+yc+'" style="stroke:currentColor;stroke-width:1.5"/>';
  s+='<rect x="'+X(F[1])+'" y="'+(yc-bh/2)+'" width="'+(X(F[3])-X(F[1]))+'" height="'+bh+'" style="'+ST_BAR+'"/>';
  [0,2,4].forEach(i=>{const h=i===2?bh:bh*0.6;s+='<line x1="'+X(F[i])+'" x2="'+X(F[i])+'" y1="'+(yc-h/2)+'" y2="'+(yc+h/2)+'" style="stroke:'+(i===2?'var(--cyan,#0a8fa3)':'currentColor')+';stroke-width:'+(i===2?2.5:1.5)+'"/>';});
  F.forEach((v,i)=>{s+='<text x="'+X(v)+'" y="'+(i%2?yc+bh/2+13:yc-bh/2-6)+'" text-anchor="middle" style="'+ST_TX+';font-weight:700">'+st_v(v)+'</text>';});
  const ya=100;s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+ya+'" y2="'+ya+'" style="stroke:currentColor;opacity:.6"/>';
  for(let v=lo;v<=hi+1e-9;v+=step)s+='<line x1="'+X(v)+'" x2="'+X(v)+'" y1="'+(ya-3)+'" y2="'+(ya+3)+'" style="stroke:currentColor;opacity:.6"/><text x="'+X(v)+'" y="'+(ya+14)+'" text-anchor="middle" style="'+ST_TX+';opacity:.75">'+ni(v)+'</text>';
  return s+'</svg>';}
function st_scatSVG(P,xl,yl){const W=340,H=220,x0=42,x1=328,y0=182,y1=14;const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]);
  const nice=(a,b)=>{const r=(b-a)||1,st=[1,2,5,10,20,25,50,100].find(s=>r/s<=6)||200;return{lo:Math.floor(a/st)*st,hi:Math.ceil(b/st)*st,st};};
  const AX=nice(Math.min(...xs),Math.max(...xs)),AY=nice(Math.min(...ys),Math.max(...ys));const X=v=>x0+(x1-x0)*(v-AX.lo)/(AX.hi-AX.lo||1),Y=v=>y0-(y0-y1)*(v-AY.lo)/(AY.hi-AY.lo||1);
  let s='<svg class="st-svg" viewBox="0 0 '+W+' '+H+'" width="100%" style="max-width:420px;display:block;margin:8px 0" role="img" aria-label="Diagrama de dispersão: '+P.map(p=>'('+p[0]+'; '+p[1]+')').join(' ')+'">';
  for(let v=AY.lo;v<=AY.hi;v+=AY.st)s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+Y(v)+'" y2="'+Y(v)+'" style="stroke:currentColor;opacity:.12"/><text x="'+(x0-6)+'" y="'+(Y(v)+4)+'" text-anchor="end" style="'+ST_TX+'">'+ni(v)+'</text>';
  for(let v=AX.lo;v<=AX.hi;v+=AX.st)s+='<text x="'+X(v)+'" y="'+(y0+14)+'" text-anchor="middle" style="'+ST_TX+'">'+ni(v)+'</text>';
  s+='<line x1="'+x0+'" x2="'+x1+'" y1="'+y0+'" y2="'+y0+'" style="stroke:currentColor"/><line x1="'+x0+'" x2="'+x0+'" y1="'+y1+'" y2="'+y0+'" style="stroke:currentColor"/>';
  P.forEach(p=>{s+='<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="4" style="fill:var(--cyan,#0a8fa3);fill-opacity:.85"/>';});
  return s+'<text x="'+((x0+x1)/2)+'" y="'+(H-4)+'" text-anchor="middle" style="'+ST_TX+';opacity:.75">'+xl+'</text><text x="'+x0+'" y="'+(y1-3)+'" style="'+ST_TX+';opacity:.75">'+yl+'</text></svg>';}

/* ---- bancos de contextos ---- */
const ST_VARS={
 qual:['Cor dos olhos','Meio de transporte usado para vir para a escola','Clube de futebol preferido','Curso profissional frequentado','Grupo sanguíneo','Concelho de residência','Género musical preferido','Marca do telemóvel'],
 disc:['Número de irmãos','Número de faltas no 1.º período','Número de livros lidos nas férias','Número de mensagens enviadas num dia','Número de disciplinas com classificação negativa','Número de golos marcados no torneio inter-turmas','Número de pessoas do agregado familiar'],
 cont:['Altura (em cm)','Tempo de deslocação para a escola','Massa corporal (em kg)','Horas de sono na noite anterior','Distância de casa à escola (em km)','Tempo a correr 1000 m na aula de Educação Física','Temperatura da sala de aula às 8h']};
const ST_VN={qual:'qualitativa',disc:'quantitativa discreta',cont:'quantitativa contínua'};
const ST_POP=[
 {i:N=>'A associação de estudantes quer saber quanto tempo os alunos da escola passam por dia nas redes sociais. Para isso, inquiriu <b>'+N+' alunos</b> escolhidos ao acaso.',pop:'Todos os alunos da escola',am:N=>'Os '+N+' alunos inquiridos',va:'O tempo diário passado nas redes sociais',un:'Cada aluno da escola'},
 {i:N=>'A Câmara Municipal quer conhecer o grau de satisfação dos utilizadores da biblioteca municipal. Num sábado, inquiriu <b>'+N+' utilizadores</b> à saída.',pop:'Todos os utilizadores da biblioteca municipal',am:N=>'Os '+N+' utilizadores inquiridos',va:'O grau de satisfação com a biblioteca',un:'Cada utilizador da biblioteca'},
 {i:N=>'A direção da escola quer saber quanto os alunos aceitariam pagar por uma refeição na cantina. Questionou <b>'+N+' alunos</b>, escolhidos ao acaso das listas de turma.',pop:'Todos os alunos da escola',am:N=>'Os '+N+' alunos questionados',va:'O preço que aceitariam pagar por uma refeição',un:'Cada aluno da escola'},
 {i:N=>'Um clube de futebol da região quer estudar a altura dos atletas das suas equipas de formação. Mediu <b>'+N+' atletas</b> escolhidos ao acaso.',pop:'Todos os atletas das equipas de formação do clube',am:N=>'Os '+N+' atletas medidos',va:'A altura dos atletas',un:'Cada atleta das equipas de formação'},
 {i:N=>'A empresa que explora o metrobus entre a Lousã e Coimbra quer conhecer o tempo de espera dos passageiros. Num dia útil, registou o tempo de espera de <b>'+N+' passageiros</b>.',pop:'Todos os passageiros do metrobus Lousã–Coimbra',am:N=>'Os '+N+' passageiros cujo tempo foi registado',va:'O tempo de espera na paragem',un:'Cada passageiro do metrobus'}];
const ST_BIV=[
 {cat:'pf',who:'alunos',xl:'Horas de estudo por semana',yl:'Classificação no teste (0 a 20)',x:[1,12],b0:5,b1:1.15,noise:1.6,yr:[0,20]},
 {cat:'pf',who:'alunos',xl:'Altura (cm)',yl:'N.º do calçado',x:[150,190],b0:-14,b1:0.31,noise:0.7,yr:[34,47]},
 {cat:'nf',who:'alunos',xl:'Horas de ecrã por dia',yl:'Horas de sono',x:[1,9],b0:10,b1:-0.55,noise:0.45,yr:[4,11]},
 {cat:'nf',who:'alunos',xl:'Horas de treino por semana',yl:'Tempo nos 1000 m (s)',x:[0,10],b0:330,b1:-9,noise:9,yr:[200,360]},
 {cat:'n0',who:'alunos',xl:'N.º do calçado',yl:'Classificação a Matemática (0 a 20)',x:[35,45],b0:12,b1:0,noise:3.2,yr:[3,20]},
 {cat:'n0',who:'alunos',xl:'Dia do mês em que nasceu',yl:'Tempo de deslocação para a escola (min)',x:[1,31],b0:25,b1:0,noise:9,yr:[3,60]},
 {cat:'pm',who:'alunos',xl:'Minutos de leitura por dia',yl:'Classificação a Português (0 a 20)',x:[0,60],b0:9,b1:0.09,noise:2.6,yr:[2,20]},
 {cat:'pm',who:'dias de aulas',xl:'Temperatura máxima (°C)',yl:'Gelados vendidos no bar da escola',x:[14,32],b0:-10,b1:2.2,noise:16,yr:[0,90]}];
const ST_RW={pf:[0.88,0.98],nf:[-0.98,-0.88],n0:[-0.12,0.12],pm:[0.45,0.68]};
const ST_REP={pf:0.95,nf:-0.95,n0:0.03,pm:0.55};
const ST_REG=[
 {xl:'Horas de estudo (semana)',yl:'Classificação (0 a 20)',x:[1,12],b0:5.5,b1:1.1,noise:1.2,yr:[0,20],ctx:'Dados de uma turma do 10.º ano',ux:'hora de estudo semanal',yn:'a classificação prevista',yu:'valores'},
 {xl:'Horas de ecrã por dia',yl:'Horas de sono',x:[1,9],b0:10.2,b1:-0.6,noise:0.35,yr:[3,11],ctx:'Dados de uma turma do 10.º ano',ux:'hora de ecrã por dia',yn:'o tempo de sono previsto',yu:'horas'},
 {xl:'Temperatura máxima (°C)',yl:'Gelados vendidos',x:[14,32],b0:-12,b1:2.4,noise:5,yr:[0,90],ctx:'Registos do bar da escola em alguns dias de aulas',ux:'grau de temperatura',yn:'o número previsto de gelados vendidos',yu:'gelados'},
 {xl:'Horas de treino (semana)',yl:'Tempo nos 1000 m (s)',x:[0,10],b0:328,b1:-8.5,noise:6,yr:[200,360],ctx:'Dados dos atletas do desporto escolar',ux:'hora de treino semanal',yn:'o tempo previsto nos 1000 m',yu:'segundos'}];
function st_biv(g,B,n){const P=[];const used=new Set();let guard=0;
  while(P.length<n&&guard++<500){const x=g.int(B.x[0],B.x[1]);const z=(g.int(-100,100)+g.int(-100,100)+g.int(-100,100))/173;let y=Math.round(B.b0+B.b1*x+z*B.noise);y=Math.max(B.yr[0],Math.min(B.yr[1],y));const k=x+'|'+y;if(used.has(k))continue;used.add(k);P.push([x,y]);}
  return P;}
function st_bivR(g,B){const W=ST_RW[B.cat];let best=null,bd=1e9;
  for(let t=0;t<400;t++){const P=st_biv(g,B,g.int(10,14)),R=st_r(P);if(!isFinite(R.r))continue;const r=rnd(R.r,2)+0;if(r>=W[0]&&r<=W[1])return{P,R};const d=Math.min(Math.abs(r-W[0]),Math.abs(r-W[1]));if(d<bd){bd=d;best={P,R};}}
  return best;}
const st_eq=(a,b)=>'ŷ = '+st_m(nf(a,2))+'x '+(b<0?'− ':'+ ')+nf(Math.abs(b),2);

/* ======================= TIPOS DE EXERCÍCIO ======================= */
TYPES.push(
 {t:'Estatística',n:'Tipos de variáveis',h:'stvar',g:(g,n)=>{const ks=['qual','disc','cont'],K=ks[n%3],oth=ks.filter(k=>k!==K);
   const ok=g.pick(ST_VARS[K]),d=g.shuffle([g.pick(ST_VARS[oth[0]]),g.pick(ST_VARS[oth[1]]),...g.shuffle(ST_VARS[oth[g.int(0,1)]]).slice(0,2)]);
   const {o,a}=opts(g,ok,d,()=>null);const cls=x=>ks.find(k=>ST_VARS[k].includes(x));
   return{c:'<p>Num inquérito feito aos alunos de uma escola profissional registaram-se as seguintes variáveis.</p>',q:'Qual das variáveis é <b>'+ST_VN[K]+'</b>?',o,a,
     s:['Qualitativa: os valores são categorias (nomes), não números de contagem ou medição','Quantitativa discreta: resulta de uma contagem (0, 1, 2…)','Quantitativa contínua: resulta de uma medição e pode tomar qualquer valor de um intervalo',...o.map(x=>x+' → '+ST_VN[cls(x)]),'Resposta: '+ok]
     ,trap:'Pergunta-te: conta-se ou mede-se? Contar dá discreta; medir (tempo, altura, massa, distância) dá contínua. Um número de código ou uma marca não fazem da variável quantitativa.'};}},
 {t:'Estatística',n:'População, amostra e variável',h:'stpop',g:(g,n)=>{const C=g.pick(ST_POP),N=g.pick([40,50,60,80,100,120,150,200]),k=n%3;
   const all=[C.pop,C.am(N),C.va,C.un],ask=['a população','a amostra','a variável em estudo'][k],ok=all[k];
   const {o,a}=opts(g,ok,all.filter(x=>x!==ok),()=>null);
   return{c:'<p>'+C.i(N)+'</p>',q:'Neste estudo, qual é '+ask+'?',o,a,
     s:['População: o conjunto TODO sobre o qual se quer tirar conclusões → '+C.pop,'Amostra: a parte da população que foi de facto observada → '+C.am(N),'Variável: a característica que se regista em cada elemento → '+C.va,'Unidade estatística: cada elemento da população → '+C.un],
     trap:'A amostra são as pessoas observadas, não o número '+N+' (isso é a dimensão da amostra). A variável é o que se mede ou pergunta, não as pessoas.'};}},
 {t:'Estatística',n:'Frequência relativa',h:'stfr',g:g=>{const C=g.pick(ST_CAT),f=C.L.map(()=>g.int(3,32)),N=st_sum(f),i=g.int(0,C.L.length-1),fr=f[i]/N*100,Fi=st_sum(f.slice(0,i+1));
   const {o,a}=opts(g,pc(fr),[pc(f[i]/(N-f[i])*100),pc(f[i]),pc(Fi/N*100),pc(f[i]/Math.max(...f)*100)],k=>pc(fr+k*1.3));
   return{c:'<p>'+C.t+':</p>'+T([C.col,'Frequência absoluta'],C.L.map((l,j)=>[l,ni(f[j])])),q:'Qual é a frequência relativa da categoria «'+C.L[i]+'» (em percentagem, às décimas)?',o,a,
     s:['Total de respostas: N = '+f.map(ni).join(' + ')+' = '+ni(N),'fᵣ = nᵢ ÷ N = '+ni(f[i])+' ÷ '+ni(N)+' ≈ '+nf(f[i]/N,4),'Em percentagem: ≈ '+pc(fr)],
     trap:'Divide pelo TOTAL de respostas (soma de toda a coluna), não pelo resto nem pela maior frequência. A frequência absoluta não é uma percentagem.'};}},
 {t:'Estatística',n:'Frequência relativa acumulada',pri:1,h:'stfa',g:(g,n)=>{const R=st_discGen(g),D=R.D,f=R.f,N=R.N,j=g.int(1,D.x.length-2),xj=D.x[j],k=n%3;
   const le=st_sum(f.slice(0,j+1)),lt=st_sum(f.slice(0,j)),ge=N-lt,gt=N-le,eq=f[j];
   const P=v=>pc(v/N*100);const W=[['no máximo',le],['menos de',lt],['pelo menos',ge]][k];
   const d={0:[lt,eq,ge],1:[le,eq,gt],2:[gt,eq,le]}[k];
   const {o,a}=opts(g,P(W[1]),d.map(P),x=>pc(W[1]/N*100+x*2.1));
   const sym={0:'≤ '+xj,1:'< '+xj+' (ou seja, ≤ '+D.x[j-1]+')',2:'≥ '+xj}[k];
   const idx=D.x.map((_,i)=>i).filter(i=>k===0?i<=j:k===1?i<j:i>=j);
   return{c:'<p>'+D.t+':</p>'+st_discTable(D,f),q:'Que percentagem dos alunos tem <b>'+W[0]+' '+xj+'</b> '+st_w(D,xj)+' (às décimas)?',o,a,
     s:['N = '+f.map(ni).join(' + ')+' = '+ni(N),'«'+W[0]+' '+xj+'» quer dizer x '+sym,'Soma das frequências: '+idx.map(i=>ni(f[i])).join(' + ')+' = '+ni(W[1]),ni(W[1])+' ÷ '+ni(N)+' × 100 ≈ '+P(W[1])],
     trap:'«No máximo '+xj+'» inclui o '+xj+'; «menos de '+xj+'» não inclui; «pelo menos '+xj+'» é '+xj+' ou mais. Marca na tabela as linhas que entram antes de somar.'};}},
 {t:'Estatística',n:'Moda',h:'stmoda',g:(g,n)=>{
   if(n%2){const sz=g.int(14,20),base=g.int(36,40),vals=Array.from({length:7},(_,i)=>base+i);let a0;for(let t=0;t<300;t++){a0=Array.from({length:sz},()=>vals[Math.floor((g.int(0,6)+g.int(0,6))/2)]);
       const cnt={};a0.forEach(x=>cnt[x]=(cnt[x]||0)+1);const cs=Object.values(cnt).sort((x,y)=>y-x);if(cs.length>=4&&cs[0]>cs[1])break;}
     const cnt={};a0.forEach(x=>cnt[x]=(cnt[x]||0)+1);const md=+Object.keys(cnt).reduce((p,c)=>cnt[c]>cnt[p]?c:p),Q=st_quart(a0),lst=g.shuffle(a0),sorted=Object.keys(cnt).map(Number).sort((x,y)=>cnt[y]-cnt[x]);
     const {o,a}=opts(g,ni(md),[ni(cnt[md]),st_v(Q.me),ni(sorted[1]),ni(Math.max(...a0))],x=>ni(md+x));
     return{c:'<p>Número do calçado de '+sz+' alunos de uma turma:</p>'+st_list(lst),q:'Qual é a moda?',o,a,
       s:['Conta quantas vezes aparece cada valor: '+Object.keys(cnt).map(Number).sort((x,y)=>x-y).map(v=>v+' → '+cnt[v]).join(' · '),'O valor mais frequente é '+md+' ('+cnt[md]+' vezes)','Moda = '+md],
       trap:'A moda é o VALOR que mais se repete ('+md+'), não o número de vezes que se repete ('+cnt[md]+').'};}
   const R=st_discGen(g),D=R.D,f=R.f,i=f.indexOf(Math.max(...f)),md=D.x[i];const ex=[];D.x.forEach((x,j)=>{for(let q=0;q<f[j];q++)ex.push(x);});const me=st_med(ex);
   const f2=f.slice().sort((x,y)=>y-x)[1],i2=f.indexOf(f2);
   const {o,a}=opts(g,ni(md),[ni(f[i]),st_v(me),ni(D.x[i2]),ni(D.x[D.x.length-1])],x=>ni(md+x));
   return{c:'<p>'+D.t+':</p>'+st_discTable(D,f),q:'Qual é a moda da variável «'+D.col.toLowerCase()+'»?',o,a,
     s:['Procura a maior frequência absoluta: '+ni(f[i]),'Corresponde ao valor x = '+md,'Moda = '+md+' '+st_w(D,md)],
     trap:'Responde com o valor da variável (primeira coluna), não com a frequência ('+f[i]+').'};}},
 {t:'Estatística',n:'Média (tabela de frequências)',pri:1,h:'stmedia',g:g=>{const R=st_discGen(g),D=R.D,f=R.f,N=R.N,S=st_sum(D.x.map((x,i)=>x*f[i])),m=S/N,k=D.x.length;
   const {o,a}=opts(g,nf(m,2),[nf(st_mean(D.x),2),nf(S/k,2),nf(N/k,2),nf(S/(N-1),2)],x=>nf(m+x*0.13,2));
   return{c:'<p>'+D.t+':</p>'+st_discTable(D,f),q:'Qual é a média da variável (às centésimas)?',o,a,
     s:['Multiplica cada valor pela frequência: '+D.x.map((x,i)=>x+'×'+f[i]).join(' + ')+' = '+ni(S),'N = '+f.map(ni).join(' + ')+' = '+ni(N),'x̄ = '+ni(S)+' ÷ '+ni(N)+' ≈ '+nf(m,2)],
     trap:'Cada valor conta tantas vezes quanto a sua frequência. Somar só a coluna dos valores e dividir pelo número de linhas dá a média errada.'};}},
 {t:'Estatística',n:'Mediana (n par e ímpar)',pri:1,h:'stmed',g:(g,n)=>{const C=g.pick(ST_LIST),N=n%2?g.pick([9,11,13]):g.pick([8,10,12]);let A,Q;
   for(let t=0;t<100;t++){A=st_ints(g,N,C.lo,C.hi);Q=st_quart(A);const m=Math.floor(N/2),um=N%2?A[m]:(A[m-1]+A[m])/2;if(um!==Q.me&&Q.s[m-1]!==Q.s[m])break;}
   const s=Q.s,m=Math.floor(N/2),me=Q.me,um=N%2?A[m]:(A[m-1]+A[m])/2;
   const d=N%2?[st_v(um),st_v(rnd(st_mean(A),1)),st_v(s[m-1]),st_v(s[m+1])]:[st_v(um),st_v(s[m]),st_v(s[m-1]),st_v(rnd(st_mean(A),1))];
   const {o,a}=opts(g,st_v(me),d,x=>st_v(me+x*0.5));
   return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é a mediana?',o,a,
     s:['Ordena os dados: '+s.join(' · '),N%2?'n = '+N+' é ímpar → a mediana é o valor do meio, na posição (n + 1) ÷ 2 = '+(m+1)+'.ª':'n = '+N+' é par → a mediana é a média dos dois valores do meio ('+m+'.ª e '+(m+1)+'.ª posições)',N%2?'Me = '+s[m]+' '+C.u:'Me = ('+s[m-1]+' + '+s[m]+') ÷ 2 = '+st_v(me)+' '+C.u],
     trap:N%2?'Ordena SEMPRE antes de procurar o meio. O valor do meio da lista desordenada não é a mediana.':'Com n par não há um só valor no meio: faz a média dos dois centrais da lista ORDENADA.'};}},
 {t:'Estatística',n:'Média de dados agrupados',pri:1,h:'stagr',g:g=>{const G0=g.pick(ST_GRP),k=G0.k,f=Array.from({length:k},()=>g.int(2,18)),N=st_sum(f),mid=f.map((_,i)=>G0.a0+i*G0.w+G0.w/2),S=st_sum(mid.map((x,i)=>x*f[i])),m=S/N;
   const lw=st_sum(f.map((v,i)=>(G0.a0+i*G0.w)*v))/N,up=st_sum(f.map((v,i)=>(G0.a0+(i+1)*G0.w)*v))/N;
   const {o,a}=opts(g,nf(m,1),[nf(lw,1),nf(up,1),nf(st_mean(mid),1),nf(S/k,1)],x=>nf(m+x*0.7,1));
   return{c:'<p>'+G0.t+':</p>'+T(['Classe','Frequência absoluta'],f.map((v,i)=>[st_cls(G0.a0+i*G0.w,G0.w,i===k-1),ni(v)])),q:'Qual é o valor aproximado da média (às décimas)?',o,a,
     s:['Em dados agrupados, cada classe é representada pelo seu ponto médio','Pontos médios: '+mid.map(st_v).join(' · '),'Σ(ponto médio × nᵢ) = '+mid.map((x,i)=>st_v(x)+'×'+f[i]).join(' + ')+' = '+st_v(S),'N = '+ni(N),'x̄ ≈ '+st_v(S)+' ÷ '+ni(N)+' ≈ '+nf(m,1)+' '+G0.u],
     trap:'Usa o PONTO MÉDIO de cada classe ((limite inferior + limite superior) ÷ 2), não um dos limites, e divide pelo total de observações, não pelo número de classes.'};}},
 {t:'Estatística',n:'Quartis e amplitude interquartil',pri:1,h:'stquart',g:(g,n)=>{const C=g.pick(ST_LIST),N=g.pick([8,10,11,12,14,15,16]),A=st_ints(g,N,C.lo,C.hi,Math.ceil(N*0.7)),Q=st_quart(A),k=n%3,am=Q.s[N-1]-Q.s[0];
   const base=['Ordena: '+Q.s.join(' · '),'n = '+N+' → mediana = '+st_v(Q.me)+(N%2?' (a '+(Math.floor(N/2)+1)+'.ª, que não entra nas metades)':''),'Metade inferior: '+Q.lo.join(' · ')+' → Q1 = '+st_v(Q.q1),'Metade superior: '+Q.hi.join(' · ')+' → Q3 = '+st_v(Q.q3)];
   if(k===0){const {o,a}=opts(g,st_v(Q.q1),[st_v(Q.me),st_v(Q.s[Math.floor(N/4)]),st_v(Q.s[0]),st_v(st_med(A.slice(0,Math.floor(N/2))))],x=>st_v(Q.q1+x*0.5));
     return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é o 1.º quartil (Q1)?',o,a,s:base.slice(0,3),trap:'Q1 é a mediana da metade inferior dos dados ORDENADOS'+(N%2?' (com n ímpar, a mediana fica de fora das metades)':'')+'.'};}
   if(k===1){const {o,a}=opts(g,st_v(Q.q3),[st_v(Q.me),st_v(Q.s[N-1]),st_v(Q.s[Math.ceil(3*N/4)]),st_v(st_med(A.slice(Math.ceil(N/2))))],x=>st_v(Q.q3+x*0.5));
     return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é o 3.º quartil (Q3)?',o,a,s:[base[0],base[1],base[3]],trap:'Q3 é a mediana da metade superior dos dados ORDENADOS, não o maior valor.'};}
   const aiq=Q.q3-Q.q1;const {o,a}=opts(g,st_v(aiq),[st_v(am),st_v(Q.q3-Q.me),st_v(Q.me-Q.q1),st_v(Q.q3+Q.q1)],x=>st_v(aiq+x));
   return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é a amplitude interquartil?',o,a,s:[...base,'AIQ = Q3 − Q1 = '+st_v(Q.q3)+' − '+st_v(Q.q1)+' = '+st_v(aiq)],
     trap:'Amplitude interquartil = Q3 − Q1. Máximo − mínimo é a amplitude (total), que é outra medida.'};}},
 {t:'Estatística',n:'Amplitude e desvio-padrão',pri:1,h:'stdp',g:(g,n)=>{
   const C=g.pick([{i:k=>'Temperaturas máximas (°C) registadas na Lousã em '+k+' dias de maio:',lo:16,hi:29},{i:k=>'Classificações (0 a 20) de um aluno em '+k+' testes de Inglês:',lo:8,hi:19},{i:k=>'Golos marcados pela equipa da escola em '+k+' jogos do torneio:',lo:0,hi:9},{i:k=>'Tempo (em minutos) de espera pelo autocarro em '+k+' manhãs:',lo:2,hi:18}]);
   if(n%3===0){const N=g.int(7,10);let A;for(let t=0;t<80;t++){A=st_ints(g,N,C.lo,C.hi);if(A[N-1]-A[0]!==Math.max(...A)-Math.min(...A))break;}
     const am=Math.max(...A)-Math.min(...A),Q=st_quart(A);const {o,a}=opts(g,ni(am),[ni(Math.max(...A)),ni(Math.abs(A[N-1]-A[0])),st_v(Q.q3-Q.q1),ni(am+1)],x=>ni(am+x+1));
     return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é a amplitude dos dados?',o,a,s:['Máximo = '+Math.max(...A)+' · mínimo = '+Math.min(...A),'Amplitude = máximo − mínimo = '+Math.max(...A)+' − '+Math.min(...A)+' = '+am],trap:'A amplitude usa o MAIOR e o MENOR valor, não o último e o primeiro da lista (a lista não está ordenada).'};}
   const N=g.int(5,7);let A;for(let t=0;t<80;t++){A=st_ints(g,N,C.lo,C.hi,N-1);const s=st_sd(A,true),p=st_sd(A,false);if(s>1&&nf(s,2)!==nf(p,2)&&nf(s*s,2)!==nf(s,2))break;}
   const m=st_mean(A),dv=A.map(x=>(x-m)*(x-m)),SS=st_sum(dv),s=st_sd(A,ST_SAMPLE),sp=st_sd(A,!ST_SAMPLE),mad=st_mean(A.map(x=>Math.abs(x-m)));
   const div=ST_SAMPLE?N-1:N;
   const {o,a}=opts(g,nf(s,2),[nf(sp,2),nf(s*s,2),nf(mad,2),nf(SS/N,2)],x=>nf(s+x*0.21,2));
   return{c:'<p>'+C.i(N)+'</p>'+st_list(A),q:'Qual é o desvio-padrão '+(ST_SAMPLE?'(amostral, s)':'(populacional, σ)')+', às centésimas?',o,a,
     s:['Média: x̄ = '+ni(st_sum(A))+' ÷ '+N+' = '+st_v(rnd(m,4)),'Desvios ao quadrado: '+A.map(x=>'('+x+' − '+st_v(rnd(m,4))+')²').join(' + ')+' = '+nf(SS,2),'Divide por '+(ST_SAMPLE?'n − 1 = ':'n = ')+div+': '+nf(SS,2)+' ÷ '+div+' ≈ '+nf(SS/div,4)+' (variância)',(ST_SAMPLE?'s':'σ')+' = √'+nf(SS/div,4)+' ≈ '+nf(s,2)+(ST_SAMPLE?' (na calculadora: Sx)':' (na calculadora: σx)')],
     trap:ST_SAMPLE?'Em MACS divide-se por n − 1 (Sx na calculadora). Dividir por n dá o σx, e esquecer a raiz quadrada dá a variância.':'Aqui divide-se por n (σx). Dividir por n − 1 dá o Sx, e esquecer a raiz dá a variância.'};}},
 {t:'Estatística',n:'Ler um histograma',pri:1,h:'sthist',g:(g,n)=>{const G0=g.pick(ST_GRP),k=G0.k,f=st_freqs(g,k,2,16),N=st_sum(f),j=g.int(1,k-2),aj=G0.a0+j*G0.w,v=n%3;
   const c='<p>'+G0.t+' (dados de '+N+' '+G0.who+'):</p>'+st_histSVG(G0,f);
   if(v===0){const ge=st_sum(f.slice(j)),gt=st_sum(f.slice(j+1));const {o,a}=opts(g,ni(ge),[ni(gt),ni(f[j]),ni(N-ge),ni(N)],x=>ni(ge+x));
     return{c,q:'Quantos '+G0.who+' têm '+G0.v+' de pelo menos '+ni(aj)+' '+G0.u+'?',o,a,s:['«Pelo menos '+ni(aj)+'» = as classes a partir de '+st_cls(aj,G0.w,j===k-1),'Soma as alturas dessas barras: '+f.slice(j).join(' + ')+' = '+ge],trap:'A classe que começa em '+ni(aj)+' também conta. Lê a altura de cada barra (frequência), não a largura.'};}
   if(v===1){const lt=st_sum(f.slice(0,j)),p=lt/N*100;const {o,a}=opts(g,pc(p),[pc((lt+f[j])/N*100),pc(100-p),pc(lt),pc(f[j-1]/N*100)],x=>pc(p+x*1.7));
     return{c,q:'Que percentagem dos '+G0.who+' tem '+G0.v+' inferior a '+ni(aj)+' '+G0.u+' (às décimas)?',o,a,s:['«Inferior a '+ni(aj)+'» = as classes antes de '+st_cls(aj,G0.w,false),'Soma: '+f.slice(0,j).join(' + ')+' = '+lt,'Total = '+f.join(' + ')+' = '+N,lt+' ÷ '+N+' × 100 ≈ '+pc(p)],trap:'Divide pelo total de '+G0.who+' (soma de todas as barras). A classe que começa em '+ni(aj)+' já não entra.'};}
   const im=f.indexOf(Math.max(...f)),L=i=>st_cls(G0.a0+i*G0.w,G0.w,i===k-1),ans=L(im);const oth=[im-1,im+1,(im+2)%k,(im+3)%k,0,k-1].filter(i=>i>=0&&i<k&&i!==im).map(L);
   const {o,a}=opts(g,ans,oth,()=>null);
   return{c,q:'Qual é a classe modal?',o,a,s:['A classe modal é a que tem maior frequência (a barra mais alta)','Barra mais alta: '+f[im]+' '+G0.who+' → '+ans],trap:'A classe modal é uma CLASSE (um intervalo), a da barra mais alta, não o número '+f[im]+'.'};}},
 {t:'Estatística',n:'Diagrama de extremos e quartis',pri:1,h:'stbox',g:(g,n)=>{
   const C=g.pick([{t:N=>'Classificações (0 a 20 valores) de '+N+' alunos no exame de MACS',lo:0,hi:20,st:2,u:'valores',v:'classificação',dv:'da classificação',w:'alunos'},{t:N=>'Tempo (em minutos) de deslocação para a escola de '+N+' alunos',lo:0,hi:60,st:10,u:'minutos',v:'tempo de deslocação',dv:'do tempo de deslocação',w:'alunos'},{t:N=>'Altura (em cm) de '+N+' atletas de um clube de basquetebol',lo:150,hi:200,st:10,u:'cm',v:'altura',dv:'da altura',w:'atletas'}]);
   const N=g.pick([40,60,80,100,120,200]),sp=C.hi-C.lo;let F;
   for(let t=0;t<200;t++){F=st_sort([g.int(C.lo,C.hi),g.int(C.lo,C.hi),g.int(C.lo,C.hi),g.int(C.lo,C.hi),g.int(C.lo,C.hi)]);let ok=true;for(let i=1;i<5;i++)if(F[i]-F[i-1]<Math.max(1,Math.round(sp/12)))ok=false;if(ok&&new Set([F[4]-F[0],F[3]-F[1],F[3]-F[2],F[2]-F[1]]).size===4)break;}
   const c='<p>'+C.t(N)+':</p>'+st_boxSVG(F,C.lo,C.hi,C.st,C.u),v=n%3;
   if(v===0){const r=F[3]-F[1];const {o,a}=opts(g,ni(r),[ni(F[4]-F[0]),ni(F[3]-F[2]),ni(F[2]-F[1]),ni(F[3])],x=>ni(r+x));
     return{c,q:'Qual é a amplitude interquartil?',o,a,s:['Lê no diagrama: Q1 = '+F[1]+' e Q3 = '+F[3]+' (os lados da caixa)','AIQ = Q3 − Q1 = '+F[3]+' − '+F[1]+' = '+r],trap:'A AIQ é a largura da CAIXA (Q3 − Q1). Máximo − mínimo ('+(F[4]-F[0])+') é a amplitude.'};}
   if(v===1){const T0=g.pick([['pelo menos',F[3],25],['pelo menos',F[1],75],['no máximo',F[2],50],['no máximo',F[1],25],['no máximo',F[3],75]]),cnt=N*T0[2]/100;
     const {o,a}=opts(g,ni(cnt),[25,50,75,100].filter(p=>p!==T0[2]).map(p=>ni(N*p/100)),()=>null);
     return{c,q:'Aproximadamente, quantos '+C.w+' têm '+C.v+' de <b>'+T0[0]+' '+T0[1]+'</b> '+C.u+'?',o,a,s:['Cada parte do diagrama (bigode, metade da caixa, metade da caixa, bigode) tem cerca de 25% dos dados',T0[1]+' é '+(T0[1]===F[1]?'o Q1':T0[1]===F[2]?'a mediana':'o Q3')+' → '+T0[0]+' '+T0[1]+' corresponde a cerca de '+T0[2]+'%',T0[2]+'% de '+N+' = '+ni(cnt)],trap:'Um bigode mais comprido NÃO tem mais dados: cada um dos quatro pedaços tem cerca de 25%, seja qual for o tamanho.'};}
   const {o,a}=opts(g,ni(F[2]),[st_v((F[0]+F[4])/2),st_v((F[1]+F[3])/2),ni(F[1]),ni(F[3])],x=>ni(F[2]+x));
   return{c,q:'Qual é a mediana '+C.dv+'?',o,a,s:['A mediana é o traço dentro da caixa','Me = '+F[2]+' '+C.u],trap:'A mediana não é o meio da caixa nem o meio entre os extremos: é o traço desenhado dentro da caixa.'};}},
 {t:'Estatística',n:'Coeficiente de correlação',h:'stcorr',g:g=>{const cat=g.pick(['pf','nf','n0','pm']),B=g.pick(ST_BIV.filter(b=>b.cat===cat)),X=st_bivR(g,B),r=rnd(X.R.r,2)+0;
   const fmt=v=>'r ≈ '+st_m(nf(v,2)),ok=fmt(r);const cats=['pf','nf','n0','pm'].filter(c=>c!==cat);const d=[];
   if(cat!=='n0'){d.push(fmt(-r));}cats.filter(c=>!(cat==='pf'&&c==='nf')&&!(cat==='nf'&&c==='pf')).forEach(c=>d.push(fmt(ST_REP[c])));
   const {o,a}=opts(g,ok,d,()=>null);
   const sen=r>0.2?'positiva (quando x aumenta, y tende a aumentar)':r<-0.2?'negativa (quando x aumenta, y tende a diminuir)':'sem tendência visível';
   const forca=Math.abs(r)>=0.85?'forte (pontos muito perto de uma reta)':Math.abs(r)>=0.4?'moderada (nuvem alongada, mas larga)':'praticamente nula (nuvem sem forma de reta)';
   return{c:'<p>Relação entre «'+st_lc(B.xl)+'» (x) e «'+st_lc(B.yl)+'» (y), em '+X.P.length+' '+B.who+':</p>'+st_scatSVG(X.P,B.xl,B.yl),q:'Qual dos valores pode ser o coeficiente de correlação linear entre x e y?',o,a,
     s:['Sentido: '+sen,'Força: '+forca,'O sinal de r dá o sentido e |r| perto de 1 dá a força','Na calculadora (regressão linear): '+ok],
     trap:'O sinal diz o SENTIDO (sobe ou desce) e o valor absoluto diz a FORÇA. r = '+st_m(nf(-r,2))+' teria a mesma força mas sentido contrário.'};}},
 {t:'Estatística',n:'Reta de regressão: prever e interpretar',pri:1,h:'streg',g:(g,n)=>{const B=g.pick(ST_REG);let P,R;for(let t=0;t<100;t++){P=st_biv(g,B,g.int(6,8));R=st_r(P);if(Math.abs(R.r)>0.8&&Math.abs(rnd(R.a,2))>=0.1)break;}
   const A=rnd(R.a,2),Bb=rnd(R.b,2),eq=st_eq(A,Bb),Ps=P.slice().sort((p,q)=>p[0]-q[0]);
   const c='<p>'+B.ctx+':</p>'+T(['x: '+B.xl,...Ps.map(p=>ni(p[0]))],[['y: '+B.yl,...Ps.map(p=>ni(p[1]))]])+'<p>A reta de regressão (mínimos quadrados) obtida na calculadora é <b>'+eq+'</b>.</p>';
   if(n%2===0){const xs=Ps.map(p=>p[0]);let x0;for(let t=0;t<60;t++){x0=g.int(xs[0],xs[xs.length-1]);if(!xs.includes(x0))break;}const y=A*x0+Bb;
     const {o,a}=opts(g,st_m(nf(y,1)),[st_m(nf(Bb*x0+A,1)),st_m(nf(A*x0,1)),st_m(nf((x0-Bb)/A,1)),st_m(nf(A+Bb,1))],x=>st_m(nf(y+x*1.1,1)));
     return{c,q:'Usando a reta, qual é o valor previsto de y para x = '+x0+' (às décimas)?',o,a,s:['Substitui x por '+x0+' na equação '+eq,'ŷ = '+st_m(nf(A,2))+' × '+x0+(Bb<0?' − ':' + ')+nf(Math.abs(Bb),2),'ŷ ≈ '+st_m(nf(y,1))],trap:'O declive (número que multiplica x) é '+st_m(nf(A,2))+' e a ordenada na origem é '+st_m(nf(Bb,2))+'. Não os troques e não te esqueças de somar a ordenada na origem.'};}
   const dir=A>0?'aumenta':'diminui',inv=A>0?'diminui':'aumenta',aa=nf(Math.abs(A),2),bb=nf(Math.abs(Bb),2);
   const S=(v,d)=>'Por cada '+B.ux+' a mais, '+B.yn+' '+d+', em média, cerca de '+v+' '+B.yu+'.';
   const ok=S(aa,dir);const {o,a}=opts(g,ok,[S(bb,dir),S(aa,inv),'Por cada '+B.ux+' a mais, '+B.yn+' passa a ser '+aa+' '+B.yu+'.'],()=>null);
   return{c,q:'Qual é a interpretação correta do declive da reta, no contexto?',o,a,s:['Na reta ŷ = ax + b, o declive é a = '+st_m(nf(A,2)),'a '+(A>0?'> 0':'< 0')+' → quando x aumenta 1 unidade, ŷ '+dir+' |a| = '+aa,'Interpretação: '+ok],
     trap:'O declive é o número que multiplica x ('+st_m(nf(A,2))+'), não o termo independente. O sinal indica se ŷ aumenta ou diminui, e é uma variação MÉDIA, não um valor exato.'};}}
);

/* ====== fichas de fórmula (PARTE B: Object.assign(HELP,st_help()) depois de HELP) ====== */
function st_help(){return{
 stvar:{n:'Tipos de variáveis',t:'Estatística',f:'<div class="branch"><div>categorias (nomes) → QUALITATIVA</div><div>contagem → QUANTITATIVA DISCRETA</div><div>medição → QUANTITATIVA CONTÍNUA</div></div>',
   vars:[[V('qualitativa',1),'cor, transporte, clube, curso…'],[V('discreta',2),'n.º de irmãos, faltas, golos…'],[V('contínua',3),'altura, tempo, massa, distância…']],
   steps:['Lê o que se regista em cada pessoa.','Se é uma categoria, é qualitativa.','Se é um número: conta-se (discreta) ou mede-se (contínua)?'],trap:'Achar que «tempo» ou «idade em anos» é discreta só porque se escreve em números inteiros: resulta de uma medição.'},
 stpop:{n:'População e amostra',t:'Estatística',f:ln(V('amostra',2),'⊂',V('população',1)),
   vars:[[V('população',1),'todos os elementos que se quer estudar'],[V('amostra',2),'os elementos realmente observados'],[V('variável',3),'a característica registada']],
   steps:['Pergunta: sobre quem se quer concluir? → população.','Quem foi de facto inquirido ou medido? → amostra.','O que se registou? → variável.'],trap:'Confundir a amostra com a sua dimensão (o número de pessoas).'},
 stfr:{n:'Frequência relativa',t:'Estatística',f:ln(V('fᵣ',1),'=',F(V('nᵢ',2),V('N',3)))+ln('em %:',V('fᵣ',1),'× 100'),
   vars:[[V('nᵢ',2),'frequência absoluta da categoria'],[V('N',3),'total de observações']],
   steps:['Soma a coluna das frequências absolutas (N).','Divide a frequência da categoria por N.','Multiplica por 100 para ter a percentagem.','Controlo: as frequências relativas somam 1 (100%).'],trap:'Dividir pelo resto ou pela maior frequência.',calc:'nᵢ÷N×100'},
 stfa:{n:'Frequência acumulada',t:'Estatística',f:ln(V('Fᵢ',1),'=',V('n₁',2),'+',V('n₂',2),'+ … +',V('nᵢ',2))+'<div class="branch"><div>no máximo k → x ≤ k</div><div>menos de k → x &lt; k</div><div>pelo menos k → x ≥ k</div></div>',
   vars:[[V('Fᵢ',1),'soma das frequências até à linha i'],[V('nᵢ',2),'frequências absolutas']],
   steps:['Traduz a frase para ≤, < ou ≥.','Marca as linhas da tabela que entram.','Soma as frequências dessas linhas e divide pelo total.'],trap:'Incluir o k em «menos de k» ou deixá-lo de fora em «no máximo k».'},
 stmoda:{n:'Moda',t:'Estatística',f:ln(V('Mo',1),'=','valor com maior',V('frequência',2)),
   vars:[[V('Mo',1),'o valor da variável que mais se repete'],[V('frequência',2),'n.º de vezes que se repete']],
   steps:['Conta (ou lê na tabela) a frequência de cada valor.','Escolhe a maior frequência.','A moda é o VALOR correspondente.'],trap:'Responder com a frequência em vez do valor.'},
 stmedia:{n:'Média',t:'Estatística',f:ln(V('x̄',1),'=',F('Σ '+V('xᵢ',2)+' × '+V('nᵢ',3),V('N',4))),
   vars:[[V('xᵢ',2),'cada valor'],[V('nᵢ',3),'frequência do valor'],[V('N',4),'total de observações (Σ nᵢ)']],
   steps:['Multiplica cada valor pela sua frequência.','Soma esses produtos.','Divide pelo total de observações.'],trap:'Fazer a média só dos valores da primeira coluna.',calc:'Σ(x×n)÷Σn'},
 stmed:{n:'Mediana',t:'Estatística',f:'<div class="branch"><div>n ímpar → valor na posição (n + 1) ÷ 2</div><div>n par → média das posições n ÷ 2 e n ÷ 2 + 1</div></div>',
   vars:[[V('n',1),'número de dados'],[V('Me',2),'divide os dados ordenados em duas metades']],
   steps:['Ordena os dados.','Vê se n é par ou ímpar.','Ímpar: o do meio. Par: média dos dois do meio.'],trap:'Procurar o meio sem ordenar.'},
 stagr:{n:'Média de dados agrupados',t:'Estatística',f:ln(V('x̄',1),'≈',F('Σ '+V('ponto médio',2)+' × '+V('nᵢ',3),V('N',4)))+ln(V('ponto médio',2),'=',F('lim. inf. + lim. sup.','2')),
   vars:[[V('ponto médio',2),'representa a classe'],[V('nᵢ',3),'frequência da classe'],[V('N',4),'total de observações']],
   steps:['Calcula o ponto médio de cada classe.','Multiplica pela frequência e soma.','Divide pelo total.','É um valor aproximado: não se conhecem os dados originais.'],trap:'Usar um dos limites da classe ou dividir pelo número de classes.'},
 stquart:{n:'Quartis e amplitude interquartil',t:'Estatística',f:ln(V('Q1',1),'= mediana da metade inferior')+ln(V('Q3',3),'= mediana da metade superior')+ln('AIQ','=',V('Q3',3),'−',V('Q1',1)),
   vars:[[V('Q1',1),'25% dos dados ficam abaixo'],[V('Q3',3),'75% dos dados ficam abaixo'],['AIQ','dispersão dos 50% centrais']],
   steps:['Ordena os dados e calcula a mediana.','Divide em duas metades (com n ímpar, a mediana não entra em nenhuma).','Q1 e Q3 são as medianas de cada metade.','AIQ = Q3 − Q1.'],trap:'Confundir a AIQ (Q3 − Q1) com a amplitude (máximo − mínimo).'},
 stdp:{n:'Amplitude e desvio-padrão',t:'Estatística',f:ln('Amplitude','=','máx − mín')+ln(V('s',1),'=','√',F('Σ ('+V('xᵢ',2)+' − '+V('x̄',3)+')²',V('n',4)+' − 1')),
   vars:[[V('xᵢ',2),'cada valor'],[V('x̄',3),'média'],[V('n',4),'número de dados (em MACS divide-se por n − 1)']],
   steps:['Calcula a média.','Subtrai a média a cada valor e eleva ao quadrado.','Soma e divide por n − 1 (variância).','Tira a raiz quadrada. Na calculadora é o Sx.'],trap:'Esquecer a raiz (fica a variância) ou dividir por n (dá o σx).',calc:'1-Var Stats → Sx'},
 sthist:{n:'Ler um histograma',t:'Estatística',f:ln('altura da barra','=',V('frequência da classe',1))+ln('classe modal','=','barra mais alta'),
   vars:[[V('frequência da classe',1),'n.º de dados nesse intervalo'],[V('[a, b[',2),'inclui a, não inclui b']],
   steps:['Lê a altura de cada barra (está escrita em cima).','Traduz a pergunta: que classes entram?','Soma as barras dessas classes; para percentagem divide pelo total.'],trap:'Esquecer que a classe [a, b[ começa em a, incluído.'},
 stbox:{n:'Diagrama de extremos e quartis',t:'Estatística',f:'<div class="branch"><div>mín —— Q1 [ Me ] Q3 —— máx</div><div>cada pedaço ≈ 25% dos dados</div></div>'+ln('AIQ','=',V('Q3',3),'−',V('Q1',1)),
   vars:[[V('Q1',1),'lado esquerdo da caixa'],['Me','traço dentro da caixa'],[V('Q3',3),'lado direito da caixa']],
   steps:['Lê os cinco números: mínimo, Q1, mediana, Q3, máximo.','Cada bigode e cada metade da caixa têm cerca de 25% dos dados.','AIQ = largura da caixa; amplitude = de ponta a ponta.'],trap:'Achar que um bigode comprido tem mais dados.'},
 stcorr:{n:'Coeficiente de correlação',t:'Estatística',f:ln('−1 ≤',V('r',1),'≤ 1')+'<div class="branch"><div>r &gt; 0 sobe · r &lt; 0 desce</div><div>|r| perto de 1 → forte · perto de 0 → fraca</div></div>',
   vars:[[V('r',1),'mede a força e o sentido da associação LINEAR']],
   steps:['Vê se a nuvem sobe ou desce (sinal).','Vê se os pontos estão perto de uma reta (força).','Escolhe o valor de r compatível. Na calculadora: regressão linear, valor r.'],trap:'Ler o sinal ao contrário, ou achar que r = −0,9 é «fraco» por ser negativo.'},
 streg:{n:'Reta de regressão',t:'Estatística',f:ln(V('ŷ',1),'=',V('a',2),'x +',V('b',3)),
   vars:[[V('a',2),'declive: variação média de y por cada unidade de x'],[V('b',3),'ordenada na origem: ŷ quando x = 0'],[V('ŷ',1),'valor previsto']],
   steps:['Para prever: substitui x na equação.','Para interpretar o declive: «por cada unidade a mais de x, ŷ aumenta (ou diminui) |a|».','Só faz sentido prever dentro do intervalo dos dados.'],trap:'Trocar o declive com a ordenada na origem.',calc:'a×x+b'}
};}

/*GEN-END*/
