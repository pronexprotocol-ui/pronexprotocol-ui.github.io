/* Pronex_Study · painel.js (1.33)
   Painel de controlo do administrador arrumado por separadores, e controlo de contas duplicadas.

   - Os cartões do painel continuam a ser feitos onde estavam: js/05 (utilizadores, denúncias, zona de perigo),
     js/06 (avisos, acesso da turma, versões, auditoria, tutor) e js/08 (aprendizagem, sugestões, erros da app).
     Aqui só são distribuídos por cinco separadores, para o painel deixar de ser uma coluna única.
   - Contas duplicadas (separador «Utilizadores»): junta as contas que parecem ser da mesma pessoa: mesmo email
     (contando as variações do Gmail), mesmo nome, ou conta automática com o nome de uma conta ligada.
     Nada é apagado sozinho: cada conta abre na ficha do utilizador, onde já se gere ou apaga.
   - Nome em uso: na entrada e ao editar o perfil, não deixa escolher um nome que outra conta da turma já usa. */
(() => {
  'use strict';
  const SEPS = [['res', 'Resumo'], ['uti', 'Utilizadores'], ['mod', 'Moderação'], ['avi', 'Avisos'], ['sis', 'Sistema']];
  let sep = 'res'; try { sep = sessionStorage.getItem('pn-sep') || 'res'; } catch (e) { }
  const E = s => (typeof esc === 'function' ? esc(s) : String(s == null ? '' : s));
  const chave = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  // o Gmail entrega no mesmo sítio «a.b+x@gmail.com» e «ab@gmail.com»
  const mailKey = e => { e = String(e || '').trim().toLowerCase(); if (!e.includes('@')) return ''; const m = /^([^@]+)@(gmail\.com|googlemail\.com)$/.exec(e); return m ? m[1].split('+')[0].replace(/\./g, '') + '@gmail.com' : e.replace(/\+[^@]*@/, '@'); };
  const nomeDe = u => ((typeof PERFIS !== 'undefined' && PERFIS[u.id]) || {}).nick || u.nick || '';

  /* ---------- contas duplicadas ---------- */
  function duplicadas(users) {
    const pai = {}, raiz = x => (pai[x] === x ? x : (pai[x] = raiz(pai[x]))), une = (a, b) => { pai[raiz(a)] = raiz(b); };
    const porChave = {}, motivo = {};
    users.forEach(u => { pai[u.id] = u.id; });
    users.forEach(u => {
      const ks = []; const m = mailKey(u.email); if (m) ks.push('e:' + m);
      const n = chave(nomeDe(u)); if (n.length >= 3 && n !== 'semnome') ks.push('n:' + n);
      ks.forEach(k => { if (porChave[k]) { une(u.id, porChave[k]); (motivo[k] = motivo[k] || new Set()).add(u.id).add(porChave[k]); } else porChave[k] = u.id; });
    });
    const grupos = {}; users.forEach(u => { (grupos[raiz(u.id)] = grupos[raiz(u.id)] || []).push(u); });
    return Object.values(grupos).filter(g => g.length > 1).map(g => {
      const ids = new Set(g.map(u => u.id)), porque = [];
      if (Object.keys(motivo).some(k => k[0] === 'e' && [...motivo[k]].some(i => ids.has(i)))) porque.push('mesmo email');
      if (Object.keys(motivo).some(k => k[0] === 'n' && [...motivo[k]].some(i => ids.has(i)))) porque.push('mesmo nome');
      if (g.some(u => u.anon) && g.some(u => !u.anon)) porque.push('conta automática e conta ligada');
      g.sort((a, b) => (a.anon ? 1 : 0) - (b.anon ? 1 : 0) || (b.ultimo || 0) - (a.ultimo || 0));
      return { contas: g, porque };
    }).sort((a, b) => b.contas.length - a.contas.length);
  }
  function dupHTML(G) {
    if (!G.length) return '<div class="x8card pndup" data-pn="uti"><h2>Contas duplicadas</h2><p>Não há contas com o mesmo email nem com o mesmo nome.</p></div>';
    const xp = u => { try { return num(((PERFIS[u.id] || {}).xp)); } catch (e) { return 0; } };
    return '<div class="x8card pndup" data-pn="uti"><h2>Contas duplicadas · ' + G.length + (G.length === 1 ? ' grupo' : ' grupos') + '</h2><p>Contas que parecem ser da mesma pessoa. Abre cada uma para veres o progresso antes de decidir; nada é apagado sozinho. Em regra fica a conta ligada com mais XP.</p>' +
      G.map(g => '<div class="pngr"><div class="pnwhy">' + E(g.porque.join(' · ')) + '</div>' + g.contas.map(u => '<button type="button" class="pnrow" data-pnu="' + E(u.id) + '"><span class="pnn"><b>' + E(nomeDe(u) || 'Sem nome') + '</b><span class="tag' + (u.anon ? '' : ' ok') + '">' + (u.anon ? 'automática' : 'ligada') + '</span></span><span class="pnm">' + E(u.email || 'sem email') + '</span><span class="pnx">' + xp(u) + ' XP · ' + (u.ultimo ? E(ago(u.ultimo)) : 'sem atividade') + '</span></button>').join('') + '</div>').join('') + '</div>';
  }

  /* ---------- separadores ---------- */
  function grupoDe(e) {
    if (e.dataset.pn) return e.dataset.pn;
    if (e.matches('.admhead,.kpis')) return 'res';
    if (e.matches('.sect-h,#adm-q,.admlist')) return 'uti';
    if (e.matches('.admrep')) return 'mod';
    const t = ((e.matches('h2,h3') ? e : e.querySelector('h2,h3,.eyebrow')) || e).textContent || '';
    if (/Den[uú]ncias|auditoria|Sugest[oõ]es/i.test(t)) return 'mod';
    if (/Enviar notifica/i.test(t)) return 'avi';
    if (/Aprendizagem da turma/i.test(t)) return 'res';
    return 'sis';
  }
  function arruma(el) {
    const sect = el.querySelector('.sect'); if (!sect || !sect.querySelector('.admhead') || sect.querySelector('.pnseps')) return;
    el.querySelectorAll('.x12admw > *').forEach(c => sect.appendChild(c));          // os cartões extra passam a irmãos dos outros
    const G = duplicadas((typeof ADM !== 'undefined' && ADM.users) || []);
    const lista = sect.querySelector('.sect-h'); if (lista) lista.insertAdjacentHTML('beforebegin', dupHTML(G));
    const head = sect.querySelector('.kpis');
    if (head && G.length) head.insertAdjacentHTML('afterend', '<button type="button" class="pnaviso" data-pn="res" data-pnir="uti"><b>' + G.length + (G.length === 1 ? ' grupo de contas possivelmente duplicadas' : ' grupos de contas possivelmente duplicadas') + '</b><span>Ver em Utilizadores</span></button>');
    const nDen = (typeof ADM !== 'undefined' && ADM.rep ? ADM.rep.length : 0), conta = { uti: G.length, mod: nDen };
    const seg = sect.querySelector('.seg'), bar = document.createElement('div'); bar.className = 'pnseps'; bar.setAttribute('role', 'tablist'); bar.setAttribute('aria-label', 'Painel de controlo');
    bar.innerHTML = SEPS.map(([k, n]) => '<button type="button" role="tab" data-pns="' + k + '" aria-selected="' + (k === sep) + '">' + n + (conta[k] ? '<i>' + conta[k] + '</i>' : '') + '</button>').join('');
    if (seg) seg.after(bar); else sect.prepend(bar);
    const mostra = () => { [...sect.children].forEach(e => { if (e === seg || e === bar) return; e.classList.toggle('pnoff', grupoDe(e) !== sep); }); bar.querySelectorAll('[data-pns]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.pns === sep))); };
    const vai = k => { sep = k; try { sessionStorage.setItem('pn-sep', k); } catch (e) { } mostra(); };
    bar.querySelectorAll('[data-pns]').forEach(b => b.onclick = () => vai(b.dataset.pns));
    sect.querySelectorAll('[data-pnir]').forEach(b => b.onclick = () => vai(b.dataset.pnir));
    sect.querySelectorAll('[data-pnu]').forEach(b => b.onclick = () => { try { openAdminUser(b.dataset.pnu); } catch (e) { } });
    mostra();
  }
  if (typeof renderProfile === 'function') {
    const _rp = renderProfile;
    renderProfile = function () {
      const r = _rp.apply(this, arguments);
      try { if (profTab === 'adm' && isOwner) arruma(document.getElementById('v-profile')); } catch (e) { }
      return r;
    };
  }

  /* ---------- nome em uso ---------- */
  function nomeEmUso(nick) {
    const k = chave(nick); if (k.length < 2 || typeof PERFIS === 'undefined') return false;
    return Object.keys(PERFIS).some(u => u !== (typeof uid !== 'undefined' ? uid : null) && PERFIS[u] && chave(PERFIS[u].nick) === k);
  }
  const aviso = n => { try { toast('Já há uma conta com o nome «' + n + '» na turma. Escolhe outro (por exemplo, junta a inicial do apelido).'); } catch (e) { } };
  document.addEventListener('click', e => {
    const bt = e.target.closest && e.target.closest('#x8-done'); if (!bt) return;
    const i = document.getElementById('x8-nick'), n = i ? i.value.trim().replace(/\s+/g, ' ') : '';
    if (n && nomeEmUso(n)) { e.preventDefault(); e.stopPropagation(); aviso(n); if (i) i.focus(); }
  }, true);
  document.addEventListener('submit', e => {
    const i = e.target.querySelector && e.target.querySelector('#pf-nick'); if (!i) return;
    const n = i.value.trim().replace(/\s+/g, ' ');
    if (n && nomeEmUso(n)) { e.preventDefault(); e.stopPropagation(); aviso(n); i.focus(); }
  }, true);
  window.PN = { duplicadas, nomeEmUso };
})();
