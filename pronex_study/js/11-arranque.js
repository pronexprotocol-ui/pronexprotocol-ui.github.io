/* Pronex_Study · 11-arranque.js
   Arranque da app: é o último ficheiro do núcleo a correr.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */
/* O cartão «O teu estudo» entra no Início depois de todas as outras camadas (por isso fica aqui). */
setTimeout(()=>{const _rhE=renderHome;renderHome=function(){const r=_rhE.apply(this,arguments);try{const el=document.getElementById('v-home');if(el&&!el.querySelector('#x25-est')){const h=estudoCard();if(h){const f=el.firstElementChild;if(f)f.insertAdjacentHTML('afterend',h);else el.insertAdjacentHTML('afterbegin',h);bindEstudo(el);}}}catch(e){}return r;};try{if(view==='home')renderHome();}catch(e){}},0);
/* ================= Arranque ================= */
importOld();
try{frzTick();}catch(e){}
go('home');
connect();
handleLaunchParams();
splash(()=>setTimeout(()=>{onboarding();},350));

// Mudar de app: a lista fecha ao carregar fora dela ou em Escape.
document.addEventListener('click', e => document.querySelectorAll('details.troca[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }));
document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('details.troca[open]').forEach(d => { d.open = false; }); });
/* 1.49: guarda dos dados (js/guarda.js). Diz a versão, para ficar uma cópia do aparelho antes de cada versão nova, e o que está guardado. */
try{if(window.pxGuarda){window.pxGuarda.versao(APP_VERSION);window.pxGuarda.contar=()=>[{nome:'exercícios feitos',n:allItems().filter(i=>i.ts).length}];}}catch(e){}
