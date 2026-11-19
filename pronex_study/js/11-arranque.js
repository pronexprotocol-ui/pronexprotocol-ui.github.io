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
