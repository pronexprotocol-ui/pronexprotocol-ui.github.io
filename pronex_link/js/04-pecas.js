/* Pronex_Link · 04-pecas.js
   Navegação entre ecrãs e peças que se repetem em vários: cabeçalho, estado vazio, cartão de pedido e de pessoa. */
'use strict';
const SEPARADORES = [
  { id: 'inicio', nome: 'Início', ico: 'inicio' },
  { id: 'pedidos', nome: 'Pedidos', ico: 'pedidos' },
  { id: 'freelancers', nome: 'Freelancers', ico: 'pessoas' },
  { id: 'conversas', nome: 'Conversas', ico: 'conversas' },
  { id: 'perfil', nome: 'Perfil', ico: 'perfil' }
];
// NAV.v = separador ativo; NAV.sub = ecrã aberto por cima dele (um pedido, uma pessoa, uma conversa).
let NAV = { v: 'inicio', sub: null };
const PILHA = [];
const FILTROS_INICIAIS = { perfTab: 'resumo', pnSep: 'res', pnQ: '', pedSeg: 'abertos', pedArea: '', pedQ: '', pedOrd: 'recentes', pedFmt: '', pesArea: '', pesQ: '', pesDisp: false, pesGuard: false };
const F = Object.assign({}, FILTROS_INICIAIS);

function ir(v) { PILHA.length = 0; NAV = { v, sub: null }; try { if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v); } catch (e) { /* sem histórico */ } desenhar(true); }
function abrir(sub, v) { PILHA.push(NAV); NAV = { v: v || NAV.v, sub }; desenhar(true); }
function voltar() { NAV = PILHA.pop() || { v: NAV.v, sub: null }; desenhar(true); }
// Ligações diretas: #pedido/<id>, #pessoa/<uid>, #conversa/<id> (para partilhar um pedido, ou abrir a partir de um aviso).
function hashDe(nav) { const s = nav.sub; return s ? (s.t === 'pessoa' ? '#pessoa/' + s.uid : '#' + s.t + '/' + s.id) : '#' + nav.v; }
function lerLigacao(h) { const m = /^#?(pedido|pessoa|conversa)\/([A-Za-z0-9_-]{1,128})$/.exec(h || ''); return m ? { t: m[1], id: m[2], em: Date.now() } : null; }
let LIGACAO = lerLigacao(location.hash);
// Abre a ligação pendente quando o que ela aponta já chegou (com conta, os dados chegam aos poucos).
function abrirLigacao() {
  const l = LIGACAO; if (!l) return false;
  const existe = l.t === 'pedido' ? Loja.pedido(l.id) : l.t === 'pessoa' ? Loja.pessoa(l.id) : Loja.conversa(l.id);
  if (!existe) { if (Date.now() - l.em > 20000 || !Nuvem.ativa()) { LIGACAO = null; if (Date.now() - l.em < 60000) toast('Não encontrei o que essa ligação mostra. Pode ter sido apagado.'); } return false; }
  LIGACAO = null; PILHA.length = 0;
  if (l.t === 'pessoa' && l.id === DB.eu) NAV = { v: 'perfil', sub: null };
  else NAV = { v: l.t === 'pedido' ? 'pedidos' : l.t === 'pessoa' ? 'freelancers' : 'conversas', sub: l.t === 'pessoa' ? { t: 'pessoa', uid: l.id } : { t: l.t, id: l.id } };
  return true;
}
// Abre aquilo de que um aviso fala.
function irParaAlvo(alvo) { if (!alvo) return; if (alvo.t === 'pedido') abrir({ t: 'pedido', id: alvo.id }, 'pedidos'); else if (alvo.t === 'pessoa') { if (alvo.id === DB.eu) ir('perfil'); else abrir({ t: 'pessoa', uid: alvo.id }, 'freelancers'); } }

const pagina = (titulo, extra) => '<div class="pagehead"><h1>' + esc(titulo) + '</h1>' + (extra || '') + '</div>';
const btnVoltar = () => '<button class="back" data-a="voltar">' + ico('voltar') + 'Voltar</button>';
const vazio = (t, p, btn) => '<div class="vazio"><b>' + esc(t) + '</b><p>' + esc(p) + '</p>' + (btn || '') + '</div>';
const tagExemplo = p => (p && p.exemplo ? ' <span class="chip">Exemplo</span>' : '');
const btnGuardar = (t, id, nome) => { const on = Loja.guardado(t, id); return '<button class="guard" data-a="guardar" data-t="' + t + '" data-id="' + esc(id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Tirar dos guardados: ' : 'Guardar: ') + esc(nome) + '">' + ico('marcador') + '</button>'; };
const filtrosArea = (acao, sel) => '<div class="filtros" role="group" aria-label="Área"><button data-a="' + acao + '" data-area="" aria-pressed="' + (!sel) + '">Todas</button>' + AREAS.map(a => '<button data-a="' + acao + '" data-area="' + a.id + '" aria-pressed="' + (sel === a.id) + '">' + esc(a.nome) + '</button>').join('') + '</div>';
const quemBtn = (p, linha2) => '<button class="quem" data-a="ver-pessoa" data-uid="' + esc(p ? p.uid : '') + '">' + avatar(p) + '<div><b>' + esc(p ? p.nome : 'Conta apagada') + tagExemplo(p) + '</b><span>' + esc(linha2 != null ? linha2 : rotuloTipo(p)) + '</span></div></button>';

// O que falta fazer num trabalho, visto por quem está a olhar.
function proximoPasso(p) {
  const meu = p.uid === DB.eu, f = Loja.pessoa(p.freelancerUid), dono = Loja.pessoa(p.uid);
  if (p.estado === 'aberto') { const n = Loja.propostasDe(p.id).filter(x => x.estado === 'pendente' && x.origem === 'proposta').length; return n ? (n === 1 ? 'Tens 1 proposta por ver' : 'Tens ' + n + ' propostas por ver') : 'À espera de propostas'; }
  if (p.estado === 'em_curso') return meu ? (f ? f.nome : 'Alguém') + ' está a trabalhar nisto' : 'Falta entregares o trabalho';
  if (p.estado === 'entregue') return meu ? 'Confirma a entrega e avalia' : (Loja.podeFecharSozinho(p) ? 'Sem resposta há mais de ' + LIMITES.diasSemResposta + ' dias: já podes fechar' : 'À espera que ' + (dono ? dono.nome : 'quem pediu') + ' confirme');
  if (p.estado === 'concluido' && !meu && !p.avalDono) return 'Falta avaliares quem pediu';
  return '';
}
function cartaoPedido(p, comPasso) {
  const a = Loja.pessoa(p.uid), passo = comPasso ? proximoPasso(p) : '', n = Loja.propostasDe(p.id).filter(x => x.estado === 'pendente' && x.origem === 'proposta').length;
  return '<div class="ped">' + btnGuardar('pedidos', p.id, p.titulo) + '<button class="pedb" data-a="ver-pedido" data-id="' + esc(p.id) + '"><span class="chips">' + chipArea(p.area) + (p.estado !== 'aberto' || comPasso ? chipEstado(p.estado) : '') + (p.tipo !== 'projeto' ? '<span class="chip">' + esc(TIPO(p.tipo).nome) + '</span>' : '') + chipPrazo(p) + (p.oculto ? '<span class="chip bad">Oculto pela moderação</span>' : '') + '</span><h3>' + esc(p.titulo) + '</h3>'
    + (passo ? '<p class="passo">' + esc(passo) + '</p>' : '<p>' + esc(p.precisa) + '</p>')
    + '<span class="pe">' + avatar(a, 'p') + '<b>' + esc(a ? a.nome : 'Conta apagada') + '</b>' + (a && a.tipo === 'professor' ? '<span class="chip pri">Professor</span>' : '') + '<span>' + (p.estado === 'aberto' && n ? (n === 1 ? '1 proposta · ' : n + ' propostas · ') : '') + quando(p.criadoEm) + '</span></span></button></div>';
}
function cartaoPessoa(p) {
  const n = Loja.avaliacoes(p.uid).length;
  return '<div class="pes">' + btnGuardar('pessoas', p.uid, p.nome) + '<button class="pesb" data-a="ver-pessoa" data-uid="' + esc(p.uid) + '"><span class="topo">' + avatar(p) + '<div><b>' + esc(p.nome) + '</b><span>' + esc(rotuloTipo(p)) + '</span></div></span>'
    + '<span class="chips">' + p.areas.slice(0, 3).map(chipArea).join('') + '</span>'
    + (p.bio ? '<p>' + esc(p.bio) + '</p>' : '')
    + '<span class="pe">' + (n ? estrelas(Loja.media(p.uid)) + '<span>' + n + (n === 1 ? ' avaliação' : ' avaliações') + '</span>' : '<span>Ainda sem avaliações</span>') + '<span>' + (p.disponivel ? '<span class="chip ok">Disponível</span>' : '<span class="chip">Ocupado</span>') + '</span></span></button></div>';
}
