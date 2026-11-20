/* Pronex_Link · 07-ecra-pessoas.js
   Lista de freelancers e o perfil de uma pessoa (o meu ou o de outra): apresentação, áreas, experiências,
   portefólio, selos, recomendações e avaliações. O separador Perfil mostra o meu perfil e as definições. */
'use strict';
function ecraFreelancers() {
  if (NAV.sub && NAV.sub.t === 'pessoa') return ecraPessoa(NAV.sub.uid);
  const q = norm(F.pesQ.trim()), g = Loja.guardados().pessoas;
  let l = Loja.pessoasVisiveis().filter(p => p.areas.length);
  if (F.pesArea) l = l.filter(p => p.areas.includes(F.pesArea));
  if (F.pesDisp) l = l.filter(p => p.disponivel);
  if (F.pesGuard) l = l.filter(p => g.includes(p.uid));
  if (q) l = l.filter(p => norm(p.nome + ' ' + p.bio + ' ' + p.oferece + ' ' + p.ferramentas.join(' ') + ' ' + p.areas.map(a => AREA(a).nome).join(' ')).includes(q));
  l.sort((a, b) => (b.disponivel - a.disponivel) || (Loja.concluidos(b.uid) - Loja.concluidos(a.uid)) || (Loja.media(b.uid) - Loja.media(a.uid)));
  return pagina('Freelancers')
    + '<label class="procura"><span class="sr">Procurar pessoas</span>' + ico('procurar') + '<input type="search" id="pes-q" placeholder="Procurar por nome, área ou programa" value="' + esc(F.pesQ) + '" autocomplete="off"></label>'
    + filtrosArea('pes-area', F.pesArea)
    + '<div class="linhaf"><label class="chk"><input type="checkbox" id="pes-disp"' + (F.pesDisp ? ' checked' : '') + '>Só quem está disponível</label><label class="chk"><input type="checkbox" id="pes-guard"' + (F.pesGuard ? ' checked' : '') + '>Só guardados</label></div>'
    + '<div id="pes-lista" class="grelha">' + (l.length ? l.map(cartaoPessoa).join('') : '<div class="tudo">' + vazio(F.pesGuard && !g.length ? 'Ainda não guardaste ninguém' : 'Ninguém com esse filtro', F.pesGuard && !g.length ? 'Carrega no marcador de um perfil para o encontrares aqui depois.' : 'Experimenta outra área ou apaga a pesquisa.') + '</div>') + '</div>';
}

function ecraPessoa(uid) {
  const p = Loja.pessoa(uid), souEu = uid === DB.eu, eu = Loja.eu();
  if (!p || (!souEu && Loja.bloqueado(uid) && !Loja.bloqueei(uid))) return btnVoltar() + vazio('Este perfil não está disponível', 'A conta pode ter sido apagada.');
  const av = Loja.avaliacoes(uid), n = Loja.concluidos(uid), pf = Loja.portefolio(uid), sl = Loja.selos(uid), recs = Loja.recsDe(uid), cp = Loja.comoPede(uid), comp = Loja.completo(uid), blq = Loja.bloqueei(uid);
  let h = (souEu && !NAV.sub ? '' : '<div class="linhaf entre">' + btnVoltar() + (souEu ? '' : btnGuardar('pessoas', uid, p.nome).replace('class="guard"', 'class="guard solto"')) + '</div>')
    + '<div class="card phead">' + avatar(p, 'lg') + '<div class="phtxt"><span class="eyebrow">' + esc(p.tipo === 'professor' ? 'Professor' : 'Aluno') + (Loja.study(uid) ? ' · Nível ' + Math.max(1, Number(Loja.study(uid).nivel) || 1) + ' na Pronex_Study' : '') + '</span><h1>' + esc(p.nome) + '</h1><p class="muted">' + esc(p.curso || (souEu ? 'Completa o teu perfil' : '')) + '</p>' + fichasStudy(uid)
    + '<span class="chips mt6">' + (p.disponivel ? '<span class="chip ok">Disponível</span>' : '<span class="chip">' + (p.areas.length ? 'Ocupado' : 'Não faz trabalhos') + '</span>') + (p.horas ? '<span class="chip">' + esc(p.horas) + '</span>' : '') + ((p.dias || []).length ? '<span class="chip">' + esc(DIAS_SEMANA.filter(k => p.dias.includes(k[0])).map(k => k[1]).join(', ')) + '</span>' : '') + (p.exemplo ? '<span class="chip">Exemplo</span>' : '') + (Loja.suspensao(uid) && (souEu || Loja.eAdmin()) ? '<span class="chip bad">Suspensa</span>' : '') + '</span></div></div>';
  h += '<div class="nums"><div class="num"><b>' + n + '</b><span>' + (n === 1 ? 'trabalho concluído' : 'trabalhos concluídos') + '</span></div><div class="num"><b>' + (av.length ? Loja.media(uid).toFixed(1).replace('.', ',') : '–') + '</b><span>avaliação média</span></div><div class="num"><b>' + (cp.n ? cp.media.toFixed(1).replace('.', ',') : '–') + '</b><span>avaliação como quem pede</span></div></div>';
  if (blq) h += '<div class="aviso warn">Bloqueaste esta pessoa. Não veem os pedidos um do outro nem podem trabalhar juntos.</div><button class="btn" data-a="desbloquear" data-uid="' + esc(uid) + '">Desbloquear</button>';
  else if (souEu) h += '<div class="acoes"><button class="btn pri" data-a="editar-perfil">' + ico('editar') + 'Editar perfil</button><button class="btn" data-a="partilhar-perfil">' + ico('partilhar') + 'Copiar apresentação</button><button class="btn" data-a="imprimir-portefolio">' + ico('selo') + 'Portefólio em PDF</button></div>' + (comp.pct < 100 ? '<div class="card"><div class="barra" role="img" aria-label="Perfil ' + comp.pct + '% completo"><i style="width:' + comp.pct + '%"></i></div><p class="muted">Perfil ' + comp.pct + '% completo. Falta: ' + esc(comp.falta.join(', ').toLowerCase()) + '.</p></div>' : '');
  else h += '<div class="acoes"><button class="btn pri" data-a="convidar" data-uid="' + esc(uid) + '">Convidar para um pedido</button>' + (eu.tipo === 'professor' && p.tipo === 'aluno' ? '<button class="btn" data-a="recomendar" data-uid="' + esc(uid) + '">' + (recs.some(r => r.de === DB.eu) ? 'Editar recomendação' : 'Escrever recomendação') + '</button>' : '') + '</div>';

  const st = Loja.estatisticas(uid);
  const numeros = st.feitos || st.pedidos ? '<div class="card"><h2>' + (souEu ? 'Os teus números' : 'Números') + '</h2><div class="nums n3"><div class="num"><b>' + st.feitos + '</b><span>' + (st.feitos === 1 ? 'trabalho feito' : 'trabalhos feitos') + '</span></div><div class="num"><b>' + st.pedidos + '</b><span>' + (st.pedidos === 1 ? 'pedido publicado' : 'pedidos publicados') + '</span></div><div class="num"><b>' + (st.mediaDias == null ? '–' : String(st.mediaDias).replace('.', ',')) + '</b><span>dias, em média, até entregar</span></div></div>' + (st.area ? '<p class="muted sm">Área em que fez mais trabalhos: ' + esc(AREA(st.area).nome) + '</p>' : '') + '</div>' : '';
  let esq = '<div class="card"><h2>O que ' + (souEu ? 'gosto' : 'gosta') + ' de fazer</h2><p class="txt">' + (p.bio ? esc(p.bio) : '<span class="muted">' + (souEu ? 'Ainda não escreveste nada. Edita o perfil para te apresentares.' : 'Ainda sem apresentação.') + '</span>') + '</p>'
    + (p.areas.length ? '<ul class="areasniv">' + p.areas.map(a => '<li>' + chipArea(a) + (p.niveis[a] ? '<span class="niv" role="img" aria-label="' + NIVEIS[p.niveis[a]] + '"><i class="on"></i><i' + (p.niveis[a] >= 2 ? ' class="on"' : '') + '></i><i' + (p.niveis[a] >= 3 ? ' class="on"' : '') + '></i></span><span class="muted sm">' + NIVEIS[p.niveis[a]] + '</span>' : '') + '</li>').join('') + '</ul>' : '')
    + (p.ferramentas.length ? '<div><span class="muted sm">Programas</span><span class="chips mt6">' + p.ferramentas.map(f => '<span class="chip">' + esc(f) + '</span>').join('') + '</span></div>' : '') + '</div>';
  if (p.oferece || souEu) esq += '<div class="card"><h2>O que ' + (souEu ? 'me disponibilizo' : 'se disponibiliza') + ' a fazer</h2><p class="txt">' + (p.oferece ? esc(p.oferece) : '<span class="muted">Diz que trabalhos aceitas fazer.</span>') + '</p></div>';
  esq += numeros;
  esq += '<div class="card"><h2>Experiências</h2>' + (p.experiencias.length ? p.experiencias.map(e => '<div class="exp"><div><b>' + esc(e.titulo) + '</b><span>' + esc([e.onde, e.ano].filter(Boolean).join(', ')) + '</span></div>' + (souEu ? '<button class="x" data-a="editar-exp" data-id="' + esc(e.id) + '" aria-label="Editar a experiência ' + esc(e.titulo) + '">' + ico('editar') + '</button><button class="x" data-a="tirar-exp" data-id="' + esc(e.id) + '" aria-label="Apagar a experiência ' + esc(e.titulo) + '">' + ico('lixo') + '</button>' : '') + '</div>').join('') : '<p class="muted">' + (souEu ? 'Junta projetos, estágios ou concursos em que participaste.' : 'Ainda sem experiências.') + '</p>')
    + (souEu ? '<button class="btn mini" data-a="editar-exp" data-id="">' + ico('mais') + 'Juntar experiência</button>' : '') + '</div>';
  if (sl.length) esq += '<div class="card"><h2>Selos</h2><ul class="selos">' + sl.map(s => '<li>' + ico('selo') + '<div><b>' + esc(s.nome) + '</b><span>' + esc(s.desc) + '</span></div></li>').join('') + '</ul></div>';

  let dir = '<div class="col"><h2 class="h2">Portefólio' + (souEu ? '<button data-a="editar-peca" data-id="">Juntar trabalho</button>' : '') + '</h2>' + (pf.length ? '<div class="porte">' + pf.map(x => '<button class="peca" data-a="ver-peca" data-uid="' + esc(uid) + '" data-id="' + esc(x.id) + '"><i style="background-image:' + esc(capaDe(x)) + '"></i><div><b>' + esc(x.titulo) + '</b><span>' + esc(AREA(x.area).nome) + (x.origem === 'trabalho' ? ', feito aqui' : '') + '</span></div></button>').join('') + '</div>' : vazio(souEu ? 'O teu portefólio está vazio' : 'Portefólio vazio', souEu ? 'Junta trabalhos que já fizeste. Cada trabalho concluído aqui entra também, com a avaliação.' : 'Esta pessoa ainda não juntou trabalhos.')) + '</div>';
  if (recs.length) dir += '<div class="card"><h2>Recomendações de professores</h2>' + recs.map(r => { const q = Loja.pessoa(r.de); return '<div class="aval"><p>' + esc(r.texto) + '</p><span class="muted sm">' + esc(q ? q.nome : 'Conta apagada') + ', ' + quando(r.em) + '</span>' + (souEu || r.de === DB.eu ? '<button class="back" data-a="tirar-rec" data-id="' + esc(r.id) + '">Apagar recomendação</button>' : '') + '</div>'; }).join('') + '</div>';
  const crit = Loja.criteriosDe(uid);
  dir += '<div class="card"><h2>Avaliações</h2>' + (crit.length ? '<ul class="hbar crit" aria-label="Média por critério">' + crit.map(c => '<li><span>' + esc(c[0]) + '</span><i style="width:' + Math.round(c[1] / 5 * 100) + '%"></i><b>' + c[1].toFixed(1).replace('.', ',') + '</b></li>').join('') + '</ul>' : '') + (av.length ? av.map(x => { const q = Loja.pessoa(x.uid); return '<div class="aval"><div>' + estrelas(x.avaliacao.estrelas) + '</div><b class="b15">' + esc(x.titulo) + '</b>' + (x.avaliacao.texto ? '<p>' + esc(x.avaliacao.texto) + '</p>' : '') + '<span class="muted sm">' + esc(q ? q.nome : 'Conta apagada') + ', ' + quando(x.avaliacao.em) + '</span></div>'; }).join('') : '<p class="muted">As avaliações aparecem aqui depois do primeiro trabalho concluído.</p>') + '</div>';
  const corpo = '<div class="two"><div class="col">' + esq + '</div><div class="col">' + dir + '</div></div>';
  if (souEu && !NAV.sub) {
    // O meu perfil, com os separadores da Pronex_Study: Resumo, Definições, Conta e Painel (só o administrador).
    const seps = [['resumo', 'Resumo'], ['defs', 'Definições'], ['conta', 'Conta']].concat(Loja.eAdmin() ? [['painel', 'Painel']] : []);
    if (!seps.some(x => x[0] === F.perfTab)) F.perfTab = 'resumo';
    const topo = h.slice(0, h.indexOf('<div class="nums">'));
    return topo + '<div class="seg" role="group" aria-label="Partes do perfil">' + seps.map(x => '<button data-a="perf-tab" data-t="' + x[0] + '" aria-pressed="' + (F.perfTab === x[0]) + '">' + x[1] + '</button>').join('') + '</div>'
      + (F.perfTab === 'defs' ? ecraDefinicoes() : F.perfTab === 'conta' ? ecraConta() : F.perfTab === 'painel' ? ecraPainel() : h.slice(h.indexOf('<div class="nums">')) + corpo);
  }
  h += corpo;
  if (!souEu) h += '<div class="acoes ligeiras">' + (blq ? '' : '<button class="back" data-a="bloquear" data-uid="' + esc(uid) + '">' + ico('escudo') + 'Bloquear</button>') + '<button class="back" data-a="denunciar" data-tipo="perfil" data-id="' + esc(uid) + '">' + ico('bandeira') + 'Denunciar</button></div>';
  return h;
}
