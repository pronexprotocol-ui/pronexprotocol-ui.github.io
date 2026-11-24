/* Pronex_Link · 01-dados.js
   Listas fixas da app (áreas, estados, regras, modelos, selos, ajuda, novidades) e os dados de exemplo
   do modo de demonstração. Não tem lógica: só texto e listas. */
'use strict';
const APP_NOME = 'PRONEX'; // 0.16: a app chama-se PRONEX; esta secção é o Freelancer
const APP_VERSION = '0.16.0';

// Áreas. grupo 'projeto' = fazer uma coisa; grupo 'materia' = explicar e tirar dúvidas.
const AREAS = [
  { id: 'design', nome: 'Design e marcas', grupo: 'projeto', cor: '#E879C0' },
  { id: 'sites', nome: 'Sites e programação', grupo: 'projeto', cor: '#5FA0FC' },
  { id: 'video', nome: 'Vídeo e edição', grupo: 'projeto', cor: '#FF8C6B' },
  { id: 'foto', nome: 'Fotografia', grupo: 'projeto', cor: '#FFC93C' },
  { id: '3d', nome: 'Modelação 3D', grupo: 'projeto', cor: '#7FE0FF' },
  { id: 'som', nome: 'Som e música', grupo: 'projeto', cor: '#2DD4A0' },
  { id: 'desenho', nome: 'Ilustração e desenho', grupo: 'projeto', cor: '#B9A6FF' },
  { id: 'texto', nome: 'Escrita e revisão', grupo: 'projeto', cor: '#F2A65A' },
  { id: 'mat', nome: 'Matemática', grupo: 'materia', cor: '#6F8BFF' },
  { id: 'pt', nome: 'Português', grupo: 'materia', cor: '#F28DB2' },
  { id: 'ing', nome: 'Inglês', grupo: 'materia', cor: '#4FD1C5' },
  { id: 'fq', nome: 'Física e Química', grupo: 'materia', cor: '#9AE66E' },
  { id: 'exames', nome: 'Exames nacionais', grupo: 'materia', cor: '#FFB23D' },
  { id: 'outra', nome: 'Outra área', grupo: 'projeto', cor: '#A9B0D6' }
];
const AREA = id => AREAS.find(a => a.id === id) || AREAS[AREAS.length - 1];
const NIVEIS = ['', 'A aprender', 'Com prática', 'Avançado'];

const TIPOS_PEDIDO = [
  { id: 'projeto', nome: 'Um projeto', desc: 'Marca, site, vídeo, cartaz…' },
  { id: 'ajuda', nome: 'Ajuda com matéria', desc: 'Explicações e dúvidas' },
  { id: 'equipa', nome: 'Alguém para a equipa', desc: 'Um parceiro para um projeto teu' }
];
const TIPO = id => TIPOS_PEDIDO.find(t => t.id === id) || TIPOS_PEDIDO[0];
const FORMATOS = [{ id: '', nome: 'Tanto faz' }, { id: 'escola', nome: 'Na escola' }, { id: 'online', nome: 'À distância' }];

// Modelos: preenchem o pedido com as perguntas certas para cada tipo de trabalho.
const MODELOS = [
  { id: 'logo', nome: 'Logótipo', tipo: 'projeto', area: 'design', titulo: 'Logótipo para ', precisa: 'Nome da marca: \nO que a marca faz: \nCores e estilo de que gosto: \nOnde vai ser usado: ' },
  { id: 'site', nome: 'Site', tipo: 'projeto', area: 'sites', titulo: 'Site para ', precisa: 'Páginas que o site precisa: \nTextos e imagens que já tenho: \nSites de que gosto: ' },
  { id: 'video', nome: 'Vídeo', tipo: 'projeto', area: 'video', titulo: 'Vídeo de ', precisa: 'Duração aproximada: \nMaterial que já está gravado: \nOnde vai ser publicado: ' },
  { id: 'explica', nome: 'Explicação', tipo: 'ajuda', area: 'mat', titulo: 'Dúvidas em ', precisa: 'Matéria em que tenho dúvidas: \nO que já tentei: \nQuantas sessões preciso: ' }
];

// Percurso de um trabalho, pela ordem em que acontece.
const ESTADOS = {
  aberto: { nome: 'Aberto', chip: 'pri', passo: 0 },
  em_curso: { nome: 'Em curso', chip: 'warn', passo: 1 },
  entregue: { nome: 'Entregue', chip: 'warn', passo: 2 },
  concluido: { nome: 'Concluído', chip: 'ok', passo: 3 },
  cancelado: { nome: 'Cancelado', chip: 'bad', passo: -1 }
};
const PASSOS = ['Publicado', 'Em curso', 'Entregue', 'Concluído'];

// Limites que evitam abusos. Com servidor, os mesmos limites ficam nas regras da base de dados.
const LIMITES = { pedidosAbertos: 5, propostasPendentes: 10, tarefas: 20, perguntasPorPedido: 20, diasSemResposta: 7, pecas: 24, experiencias: 20 };

const REGRAS = [
  'Aqui não se pedem nem se fazem trabalhos que contam para nota. Explicar a matéria e tirar dúvidas, sim.',
  'Não há dinheiro. Quem faz o trabalho fica com ele no portefólio, com a avaliação de quem pediu.',
  'Quem pede decide, ao publicar, se o trabalho pode ser mostrado no portefólio.',
  'Cumpre o que combinas. Se não conseguires acabar, desiste do trabalho para outra pessoa o poder fazer.',
  'Fala com respeito. Qualquer pedido, perfil ou conversa pode ser denunciado.',
  'Não partilhes moradas, palavras-passe nem contactos de outras pessoas.'
];
// Motivos de denúncia: os mesmos da Pronex_Study, mais o que é próprio desta app (trabalhos para nota).
const MOTIVOS_DENUNCIA = [['nota', 'É um trabalho para nota'], ['ofensivo', 'Linguagem ofensiva ou insultos'], ['assedio', 'Assédio ou bullying'], ['dados_pessoais', 'Partilha dados pessoais'], ['improprio', 'Conteúdo impróprio'], ['spam', 'Spam ou publicidade'], ['outro', 'Outro motivo']];
const MOTIVO = k => (MOTIVOS_DENUNCIA.find(m => m[0] === k) || [k, k])[1];
const AJUDA_DENUNCIA = 'Se alguém te está a incomodar, fala com o teu diretor de turma ou com alguém de confiança. Também podes ligar, de graça: Linha Internet Segura 800 21 90 90 · SOS Criança 116 111.';

/* Segurança igual à da Pronex_Study (js/06-entrada-definicoes.js e js/03-nucleo.js): mesmo filtro, mesma deteção
   de contactos e mesmas mensagens de crise. Se lá mudarem, mudar aqui também. */
const FILTRO_INSULTOS = /(^|[^a-zà-ÿ])(caralho|foda-se|fodasse|filh[oa] da puta|puta|cabr[ãa]o|paneleiro|panasca|atrasad[oa] mental|vai-te foder|vai te foder)($|[^a-zà-ÿ])/i;
// Palavras extra proibidas pelo administrador (link_config/filtro), além da lista fixa.
let PALAVRAS_EXTRA = [];
// Interruptores (link_config/flags): o admin desliga uma funcionalidade nova sem publicar código. Por omissão tudo ligado.
let FLAGS = {};
const FLAGS_NOMES = { mural: 'Mural da comunidade', desafio: 'Desafio do mês', reunioes: 'Marcar reuniões', mentor: 'Professor mentor', acordo: 'Acordo do trabalho' };
const ligado = n => FLAGS[n] !== false;
const filtroPublicacao = t => { const s = String(t || ''); if (FILTRO_INSULTOS.test(s)) return 'Reformula sem insultos: a comunidade é para todos.';
  const n = ' ' + s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ') + ' ';
  return PALAVRAS_EXTRA.some(p => p && n.includes(' ' + p + ' ')) ? 'Reformula o texto: tem uma palavra que não é permitida na comunidade.' : ''; };
const normPalavra = p => String(p || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]+/g, ' ').trim().replace(/\s+/g, ' ');
const LIMITE_PROPOSTAS_DIA = 10;
// Política de privacidade (mapa de dados): o que se guarda, porquê, onde, quanto tempo, quem vê e como apagar.
const PRIVACIDADE_DATA = '22 de novembro de 2026';
const PRIVACIDADE = [
  ['Quem trata os dados', 'A PRONEX, projeto de alunos, para a comunidade da escola. A conta é a mesma do Study.'],
  ['O que guardamos', 'O teu perfil (nome, aluno ou professor, ano e curso, escola, apresentação, frase de destaque, capa, formação, áreas e níveis, programas, horário, foto, experiências e ligações externas), os pedidos, propostas, perguntas e avaliações que fazes, as publicações, comentários e reações, as tuas ligações, grupos e candidaturas, as validações e recomendações que dás e recebes, quem viu o teu perfil, as conversas, os avisos, as denúncias que fazes, e o que guardaste, bloqueaste ou segues.'],
  ['O que não guardamos', 'Moradas, telefones, datas de nascimento, localização, contactos do telemóvel ou dados de pagamento. A app não usa publicidade nem serviços de estatística de terceiros.'],
  ['Para quê', 'Para pedires e fazeres trabalhos, falares com quem trabalha contigo, construíres o portefólio e mantermos a comunidade segura (limites de ritmo, denúncias e moderação).'],
  ['Onde ficam', 'Nos servidores do Firebase (Google), com ligação cifrada (HTTPS). As regras do servidor decidem quem pode ler cada coisa.'],
  ['Quem vê', 'O perfil e os pedidos são vistos por quem tem conta. O ano e o curso podem ficar só para quem trabalha contigo. As conversas são só das duas pessoas do trabalho; a moderação pode lê-las quando trata uma denúncia. Propostas: só quem a fez e quem pediu. As publicações e as ligações aceites são vistas por quem tem conta. Recomendações escritas só aparecem se as aceitares. Quem viu o teu perfil só tu vês; com o modo privado ligado, as tuas visitas não ficam registadas. Candidaturas: só tu e quem publicou a vaga.'],
  ['Durante quanto tempo', 'Enquanto tiveres conta. Avisos lidos e visitas ao perfil apagam-se ao fim de 90 dias; conversas de pedidos cancelados ao fim de 180 dias; contagens diárias de propostas ao fim de alguns dias. As cópias de segurança diárias guardam-se pouco tempo e servem só para recuperar a app.'],
  ['Números da comunidade', 'Os números do painel e da escola são contagens sem nomes (quantos pedidos, quantos concluídos, a média do questionário).'],
  ['Os teus direitos', 'Podes ver e corrigir o perfil, descarregar todos os teus dados (Perfil › Conta › Descarregar os meus dados) e apagar a conta, de imediato ou daqui a 7 dias. Ao apagar, sai tudo o que era só teu; os trabalhos feitos com outra pessoa ficam sem o teu nome.'],
  ['Menores', 'A app é para quem tem 13 anos ou mais (é pedido ao criar a conta). Não peças nem partilhes dados pessoais nas conversas: a moderação apaga-os.']
];
// Níveis pelo número de trabalhos concluídos (feitos para outros).
const NIVEIS_CONTA = [[0, 'A começar'], [1, 'Primeiro trabalho'], [3, 'Colaborador'], [6, 'Experiente'], [10, 'Referência']];
// Fila da moderação: o que pode magoar alguém vem primeiro.
const PRIORIDADE_DENUNCIA = { assedio: 0, dados_pessoais: 1, ofensivo: 2, improprio: 3, nota: 4, spam: 5, outro: 6 };
// Questionário SUS (System Usability Scale), 10 frases, de 1 (discordo totalmente) a 5 (concordo totalmente).
const SUS = ['Gostava de usar esta app com frequência.', 'Achei a app mais complicada do que precisava de ser.', 'Achei a app fácil de usar.', 'Precisava da ajuda de alguém para conseguir usar a app.', 'As várias partes da app estão bem ligadas entre si.', 'Há coisas na app que não batem certo umas com as outras.', 'Acho que a maioria das pessoas aprende a usar a app depressa.', 'Achei a app muito trabalhosa de usar.', 'Senti-me confiante a usar a app.', 'Tive de aprender muita coisa antes de conseguir usar a app.'];
const notaSUS = r => Array.isArray(r) && r.length === 10 && r.every(x => x >= 1 && x <= 5) ? Math.round(r.reduce((s, x, i) => s + (i % 2 === 0 ? x - 1 : 5 - x), 0) * 2.5) : null;
// Ícone de cada área (desenhado nos cartões e chips).
const ICO_AREA = { design: 'pincel', sites: 'codigo', video: 'video', foto: 'camara', '3d': 'cubo', som: 'nota', desenho: 'lapis', texto: 'texto', mat: 'mais', pt: 'texto', ing: 'globo', fq: 'raio', exames: 'selo', outra: 'mais3' };
const diaUTCISO = () => new Date().toISOString().slice(0, 10);
const diaUTC = () => { const d = new Date(); return d.getUTCFullYear() + '-' + (d.getUTCMonth() + 1) + '-' + d.getUTCDate(); };
function pareceContacto(t) {
  t = String(t || '');
  if (/[\w.+-]+\s*@\s*[\w-]+\s*\.\s*[a-z]{2,}/i.test(t) || /(instagram|insta|snap|snapchat|tiktok|whatsapp|telegram)\s*[:@]?\s*@?[\w.]{3,}/i.test(t)) return true;
  if (/\b(votos?|eleitores|inscritos|habitantes|euros?|lugares)\b|€/i.test(t)) return false;
  const s = t.replace(/(\d)[\s.\-](?=\d)/g, '$1');
  return /(^|[^\d,.])(00351|\+?351)?(9[1236]|2\d)\d{7}(?![\d]|,\d)/.test(s);
}
const CRISE_RE = /(suic[ií]d|matar-me|me matar|mato-me|quero morrer|n[aã]o quero (viver|estar c[aá])|acabar com (a minha vida|tudo)|cortar-me|me cortar|automutila|auto-mutila|fazer-me mal|magoar-me|n[aã]o aguento mais|ningu[eé]m gosta de mim|abus[oa]d|abusou de mim|bater-me|bate-me|amea[cç]a(m|ram)-me|bullying)/i;
const CRISE_AJUDA = ['112: emergência', 'SNS 24: 808 24 24 24 (aconselhamento psicológico)', 'SOS Voz Amiga: 213 544 545', 'SOS Criança: 116 111'];
// Ritmo, igual às regras da Pronex_Study: segundos entre mensagens e entre publicações (pedidos, propostas, perguntas).
const RITMO = { msg: 3, post: 10 };
/* ---------- Rede (0.13): publicações, ligações, grupos e vagas ---------- */
// Reações a uma publicação (uma por pessoa; carregar outra vez tira).
const REACOES = [['gosto', 'Gosto', '👍'], ['bravo', 'Bravo', '👏'], ['apoio', 'Apoio', '🤝'], ['ideia', 'Boa ideia', '💡'], ['curioso', 'Curioso', '🤔']];
const REDE_COLS = ['posts', 'comentarios', 'reacoes', 'ligacoes', 'validacoes', 'testemunhos', 'visitas', 'grupos', 'membros', 'vagas', 'candidaturas', 'duvidas', 'respostas', 'votos', 'sessoes', 'inscricoes'];
/* ---------- Estudo (0.14): dúvidas, sessões de estudo e conversas de grupo ---------- */
// Exames nacionais do secundário (código do IAVE e nome), para marcar uma dúvida.
const EXAMES = [['639', 'Português'], ['635', 'Matemática A'], ['735', 'Matemática B'], ['835', 'MACS'], ['715', 'Física e Química A'], ['702', 'Biologia e Geologia'], ['623', 'História A'], ['719', 'Geografia A'], ['712', 'Economia A'], ['714', 'Filosofia'], ['706', 'Desenho A'], ['708', 'Geometria Descritiva A'], ['724', 'História da Cultura e das Artes'], ['550', 'Inglês']];
const EXAME = c => (EXAMES.find(e => e[0] === c) || ['', ''])[1];
const FORMATOS_SESSAO = [['escola', 'Na escola'], ['online', 'Online']];
const REACAO = id => REACOES.find(r => r[0] === id) || REACOES[0];
// Ao que a pessoa está aberta (aparece no perfil e nas sugestões).
const ABERTO_A = [['estagio', 'Estágios'], ['projetos', 'Projetos com colegas'], ['voluntariado', 'Voluntariado'], ['explicar', 'Explicar matéria']];
const TIPOS_VAGA = [['estagio', 'Estágio (FCT)'], ['projeto', 'Projeto da escola'], ['voluntariado', 'Voluntariado'], ['evento', 'Evento ou concurso']];
const TIPOS_GRUPO = [['curso', 'Curso'], ['turma', 'Turma'], ['clube', 'Clube'], ['interesse', 'Interesse']];
const RELACOES = [['colega', 'Colega de turma ou curso'], ['trabalho', 'Fizemos um trabalho juntos'], ['professor', 'Fui professor/a'], ['aluno', 'Fui aluno/a']];
// Só ligações para vídeo de serviços conhecidos (não se guardam vídeos na app: ficariam pesados de mais).
const VIDEO_OK = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/|drive\.google\.com\/)[^\s]{3,200}$/i;
// Cores do avatar: as 12 da Pronex_Study (0 a 5 para todos; 6 a 11 vêm da loja da Pronex_Study).
const CORES = 12;
// Expressões que costumam aparecer em pedidos de trabalhos para nota. Só gera um aviso: não bloqueia.
const PARECE_NOTA = /para (a )?nota|conta para (a )?nota|trabalho (de|da|para a) disciplina|entregar ao? (professora?|stor[a]?)|faz(er|am|e)?(-me)? o (meu )?(trabalho|relat[óo]rio|tpc)/i;
const RESPOSTAS_RAPIDAS = ['Já vi, obrigado.', 'Consegues enviar ainda hoje?', 'Podemos falar na escola?'];

// Selos: aparecem no perfil quando a condição se cumpre. `ok` recebe os números da pessoa.
const SELOS = [
  { id: 'primeiro', nome: 'Primeiro trabalho', desc: 'Concluiu o primeiro trabalho.', ok: n => n.concluidos >= 1 },
  { id: 'cinco', nome: 'Cinco trabalhos', desc: 'Concluiu cinco trabalhos.', ok: n => n.concluidos >= 5 },
  { id: 'estrelas', nome: 'Muito bem avaliado', desc: 'Média de 4,5 ou mais em pelo menos três avaliações.', ok: n => n.avaliacoes >= 3 && n.media >= 4.5 },
  { id: 'areas', nome: 'Várias áreas', desc: 'Concluiu trabalhos em três áreas diferentes.', ok: n => n.areas >= 3 },
  { id: 'explica', nome: 'Explicador', desc: 'Ajudou três vezes com matéria.', ok: n => n.ajudas >= 3 },
  { id: 'recomendado', nome: 'Recomendado', desc: 'Tem uma recomendação de um professor.', ok: n => n.recs >= 1 },
  { id: 'perfil', nome: 'Perfil completo', desc: 'Preencheu o perfil todo.', ok: n => n.completo >= 100 }
];

// Exemplos reais do tipo de pedido que cabe na app (mostrados nas boas-vindas).
const EXEMPLOS_PEDIDO = [
  ['Logótipo para o clube de teatro', 'Design e marcas', 'Quem pede: o clube. Quem faz: um aluno de Multimédia que junta o trabalho ao portefólio.'],
  ['Montagem do vídeo da visita de estudo', 'Vídeo e edição', 'Há gravações de três telemóveis; falta juntar, cortar e pôr música sem direitos.'],
  ['Explicar funções antes do teste', 'Matemática', 'Uma sessão de ajuda na biblioteca. Não é fazer o trabalho de ninguém: é perceber a matéria.']
];
const COMO_FUNCIONA = [
  ['Publica o pedido', 'Explica o que precisas, o que queres alcançar e para que é.'],
  ['Escolhe quem faz', 'Recebes propostas ou convidas alguém da lista de freelancers.'],
  ['Acompanha o trabalho', 'Combinam na conversa e seguem a lista de tarefas.'],
  ['Confirma e avalia', 'O trabalho entra no portefólio de quem o fez, com a tua avaliação.']
];
// Critérios da avaliação de um trabalho (opcionais, de 1 a 5, além das estrelas).
const CRITERIOS = [['qualidade', 'Qualidade do trabalho'], ['prazo', 'Cumpriu o prazo'], ['comunicacao', 'Comunicação']];
// A troca que a app propõe (a regra mais importante, dita logo no início).
const TROCA = 'Aqui ninguém paga nem recebe dinheiro: quem faz ganha um trabalho real para o portefólio e uma avaliação. E não vale pedir trabalhos que contam para nota: pede antes que te expliquem a matéria.';
// Palavras da app, explicadas em linguagem simples.
const GLOSSARIO = [
  ['Pedido', 'O que alguém precisa: um logótipo, um vídeo, ajuda numa matéria. Diz o que é preciso, o objetivo e para que é.'],
  ['Proposta', 'A resposta de quem quer fazer um pedido: como o faria e em quantos dias. Quem pediu escolhe uma.'],
  ['Convite', 'Quem pediu também pode convidar diretamente alguém da lista de freelancers. Se aceitar, o trabalho começa.'],
  ['Freelancer', 'Qualquer aluno ou professor que se diz disponível para fazer trabalhos nas suas áreas.'],
  ['Em curso', 'O trabalho começou: as duas pessoas combinam na conversa e seguem a lista de tarefas.'],
  ['Entrega', 'Quem fez mostra o resultado (texto, ligação ou imagem). Quem pediu pode aceitar ou pedir alterações.'],
  ['Concluído', 'Quem pediu aceitou a entrega e avaliou. O trabalho entra no portefólio de quem o fez.'],
  ['Portefólio', 'Os trabalhos que mostram o que sabes fazer: os feitos aqui e os que juntas tu.'],
  ['Comprovativo', 'Um resumo de um trabalho concluído, com a avaliação, que podes guardar em PDF.'],
  ['Selos', 'Pequenas conquistas no perfil: primeiro trabalho, boas avaliações, ajudar em várias áreas.']
];
const PERGUNTAS_FREQUENTES = [
  ['Tenho de pagar?', 'Não. Ninguém paga nem recebe dinheiro. Quem faz fica com o trabalho no portefólio e com a avaliação.'],
  ['Posso pedir que me façam um trabalho da escola?', 'Não, se contar para nota. Podes pedir que te expliquem a matéria ou que te tirem dúvidas.'],
  ['E se quem pediu nunca confirmar a entrega?', 'Ao fim de ' + LIMITES.diasSemResposta + ' dias sem resposta, quem fez pode fechar o trabalho sozinho.'],
  ['E se eu não conseguir acabar o trabalho?', 'Abre o pedido e escolhe «Desistir do trabalho». O pedido volta a ficar aberto para outra pessoa.'],
  ['Quem vê o meu perfil?', 'Só quem está na app. Tu decides o que escreves e podes apagar a conta nas definições.'],
  ['Alguém me faltou ao respeito. O que faço?', 'Denuncia o pedido, o perfil ou a conversa. Também podes bloquear a pessoa no perfil dela.']
];
const NOVIDADES = [
  { v: '0.16.0', d: 'novembro de 2026', itens: ['A app passa a chamar-se PRONEX, com duas secções: Study e Freelancer (esta). Ao abrir aparece a marca PRONEX.', 'No topo: o escudo PRONEX e o nome da secção. Carrega nele para mudar para o Study ou para o site da PRONEX, na mesma janela.', 'Instalada, é uma só app no telemóvel: «PRONEX».'] },
  { v: '0.15.1', d: 'novembro de 2026', itens: ['A Pronex_Link passou a estar também dentro da app PRONEX, ao lado da Pronex_Study: cada uma tem um separador no topo e a conta é a mesma.', 'Dentro da app PRONEX, entrar com o Google abre a Pronex_Link no ecrã inteiro, porque a página do Google não abre lá dentro.'] },
  { v: '0.15.0', d: 'novembro de 2026', itens: ['Conversas novas: a lista e a conversa lado a lado no computador, todas as conversas (trabalho, diretas e de grupo) numa só lista, por ordem da última mensagem.', 'A conversa ocupa o ecrã inteiro, com a caixa de escrever sempre em baixo; as mensagens seguidas da mesma pessoa ficam juntas.', 'Perfil com a fotografia sobre a capa e a apresentação num só cartão.', 'Publicações mais arrumadas e os ecrãs entram com suavidade ao mudar de separador.'] },
  { v: '0.14.0', d: 'novembro de 2026', itens: ['Novo separador Estudo, com Dúvidas: pergunta por disciplina e por exame nacional, vota nas respostas que ajudam e marca a que resolveu a tua dúvida.', 'As respostas de professores aparecem destacadas, e o perfil mostra quantas respostas deste e quantas foram escolhidas.', 'Sessões de estudo: marca uma explicação ou um estudo em grupo, na escola ou online, com lugares contados; quem se inscreve vê o lembrete no Início.', 'Conversas de grupo: cada equipa de um pedido e cada grupo da rede têm a sua conversa, em Conversas.', 'Se o servidor recusar uma publicação por ter sido logo a seguir a outra, a app volta a enviá-la sozinha uns segundos depois.'] },
  { v: '0.13.0', d: 'novembro de 2026', itens: ['Publicações no Início: escreve, junta uma imagem ou um vídeo, reage, comenta e partilha.', 'Ligações: liga-te a colegas e professores, vê quem talvez conheças e troca mensagens diretas com as tuas ligações.', 'Perfil profissional: capa, frase de destaque, «aberto a», formação, destaques, competências validadas e recomendações escritas.', 'Quem viu o teu perfil, com modo privado para veres perfis sem deixar rasto.', 'Grupos de curso, turma e clubes, com publicações só do grupo.', 'Vagas de estágio, projetos e voluntariado publicadas por professores, com candidaturas.', 'O separador Freelancers passa a chamar-se Rede.'] },
  { v: '0.12.0', d: 'novembro de 2026', itens: ['Acordo do trabalho: uma pessoa escreve o que fica combinado e a outra aceita.', 'Um professor pode acompanhar um trabalho como mentor e deixar notas.', 'Entregas com até três imagens e versões numeradas; comparar propostas lado a lado; pedidos parecidos.', 'Marcar reuniões na conversa, fixar uma mensagem no topo e escrever as tuas respostas rápidas.', 'Pedidos que se repetem (semanais ou mensais), desafio do mês e mural de trabalhos concluídos.', 'Perfil com nível, competências confirmadas por avaliações, linha do tempo, ligações e currículo em PDF.', 'Seguir pessoas, esconder o ano e o curso de quem não trabalha contigo, filtros por escola e ordenação dos freelancers.', 'Segurança: moderadores, advertências, palavras proibidas no servidor, limite de 10 propostas por dia, apagar a conta com 7 dias para voltar atrás e descarregar os teus dados.', 'Tema como o sistema, poupança de dados, ícones por área, zonas de toque maiores e política de privacidade dentro da app.'] },
  { v: '0.11.0', d: 'novembro de 2026', itens: ['Avaliação por critérios (qualidade, prazo e comunicação), com a média de cada um no perfil.', 'Vês sempre se o que fizeste já foi guardado: «A guardar…», «Guardado» ou «Por enviar» sem internet.', 'Nas equipas, toda a equipa é avisada quando o trabalho é concluído.', 'Juntar várias pessoas à equipa seguidas já não dá erro: a app espera o tempo que falta e envia.'] },
  { v: '0.10.0', d: 'novembro de 2026', itens: ['Pedidos de equipa: em «Alguém para a equipa» escolhes até 5 pessoas para o mesmo projeto.', 'Cada pessoa da equipa tem a sua conversa contigo; quem coordena entrega o trabalho.', 'Enquanto houver vagas, o pedido continua nos pedidos abertos («Faltam 2 na equipa»).', 'Quem está na equipa pode sair; no fim, o trabalho e a avaliação ficam no portefólio de todos.'] },
  { v: '0.9.0', d: 'novembro de 2026', itens: ['Ao ligar o «visto», as pessoas com quem trabalhas veem logo até onde já leste.', 'Partilhar um pedido envia o resumo e a ligação juntos.', 'Por dentro: código revisto e arrumado, verificado automaticamente em cada versão, com limites de rapidez e de tamanho.'] },
  { v: '0.8.0', d: 'novembro de 2026', itens: ['Os teus primeiros passos no Início: o caminho até ao primeiro trabalho, com o que já fizeste.', 'Medidor de clareza ao publicar um pedido, com uma dica de cada vez.', 'A troca da app (sem dinheiro, sem trabalhos para nota) explicada logo no guia, e as palavras da app num glossário.', 'Definições mais arrumadas, filtros lado a lado e um só botão para partilhar.', 'Mais segurança: os avisos têm ritmo próprio, e a base de dados passa a ser auditada nos testes.'] },
  { v: '0.7.0', d: 'novembro de 2026', itens: ['«Visto» nas conversas, só entre pessoas que o ligam (Perfil → Definições).', 'Modelos de pedido teus e vários rascunhos guardados («Guardar para mais tarde»).', 'As perguntas de um pedido só são carregadas quando o abres: a app abre mais depressa.', 'Com perfil na Pronex_Study, o nome é sempre o de lá, também no servidor.', 'Quando o servidor recusa uma alteração, só essa parte volta atrás.'] },
  { v: '0.6.0', d: 'novembro de 2026', itens: ['Pesquisa geral (tecla /): pedidos, pessoas e conversas num só sítio. Tecla N para um pedido novo.', 'Responder a uma mensagem concreta; ligações nas mensagens passam a abrir.', 'Tarefas com data, aviso de prazos a chegar e filtro por formato (escola ou online).', 'Alertas de pedidos novos nas áreas que segues.', 'Portefólio e comprovativo em PDF, um trabalho em destaque, dias em que podes e os teus números.', 'Pedidos parados há mais de um mês: mantém ou fecha.', 'Professores pedem a confirmação na própria app.', 'Painel: gráficos, anúncio para todos, CSV para a escola, arquivar todas as denúncias e histórico por pessoa.', 'Contraste alto, deslizar da borda para voltar e aviso quando há versão nova.', 'Mais segurança: pedidos ocultados fechados no servidor, quem foi bloqueado deixa de poder escrever, ritmo nas denúncias.'] },
  { v: '0.5.0', d: 'novembro de 2026', itens: ['Ligações diretas: partilha um pedido aberto com uma ligação que o abre logo (também por WhatsApp ou Instagram).', 'Avisos no dispositivo e número no ícone da app, como na Pronex_Study (liga em Perfil → Definições).', 'Imagens em grande: carrega numa imagem de uma conversa, de uma entrega ou de um pedido.', 'Aviso quando estás sem internet; o que fizeres é enviado quando a ligação voltar.', 'Escolher imagens ficou mais simples e os separadores do painel cabem no telemóvel.', 'Mais segurança: os avisos só chegam de quem está ligado a ti por um pedido ou por uma recomendação.'] },
  { v: '0.4.0', d: 'novembro de 2026', itens: ['A mesma segurança da Pronex_Study: filtro de insultos, aviso de contactos, ritmo entre mensagens, aviso de crise e suspensões.', 'Perfil com o nome, a foto, a cor, o nível e a sequência da Pronex_Study.', 'Conversa com avatar, nome e hora em cada mensagem, e um menu para denunciar ou apagar.', 'Painel de controlo com PIN para o administrador.'] },
  { v: '0.3.0', d: 'novembro de 2026', itens: ['Contas verdadeiras: entras com a mesma conta da Pronex_Study e tudo fica guardado no servidor, em tempo real.', 'Professores confirmados pelo administrador.', 'O modo de demonstração continua disponível, sem conta.'] },
  { v: '0.2.0', d: 'novembro de 2026', itens: ['Avisos, perguntas nos pedidos, lista de tarefas, guardados e selos.', 'Recomendações de professores e avaliação nos dois sentidos.', 'Editar pedidos, desistir de um trabalho e fechar trabalhos sem resposta.', 'Bloquear pessoas, painel de moderação, apagar a conta e copiar os dados.', 'Fotografia de perfil, ferramentas, níveis por área e perfil completo.'] },
  { v: '0.1.0', d: 'novembro de 2026', itens: ['Primeira versão: pedidos, freelancers, conversas, perfil e portefólio.'] }
];

/* Dados de exemplo. Só existem neste dispositivo e servem para experimentar a app antes de haver contas.
   Todas as pessoas aqui são inventadas e aparecem marcadas com «Exemplo». */
function dadosExemplo(agora) {
  const dia = 86400000, t = n => agora - n * dia;
  const base = { exemplo: true, foto: '', cor: 0, ferramentas: [], niveis: {}, horas: '', experiencias: [] };
  const pessoas = {
    ex_rita: Object.assign({}, base, { uid: 'ex_rita', cor: 4, nome: 'Rita M.', tipo: 'aluno', curso: '11.º, Multimédia', disponivel: true, criadoEm: t(40),
      bio: 'Gosto de criar logótipos e identidades.', oferece: 'Logótipos, cartazes, cartões e publicações para redes sociais.',
      areas: ['design', 'desenho'], niveis: { design: 3, desenho: 2 }, ferramentas: ['Illustrator', 'Photoshop'], horas: '4 horas por semana',
      experiencias: [{ id: 'e1', titulo: 'Cartaz da festa de finalistas', onde: 'Escola', ano: '2026' }] }),
    ex_tiago: Object.assign({}, base, { uid: 'ex_tiago', cor: 1, nome: 'Tiago S.', tipo: 'aluno', curso: '12.º, Programação', disponivel: true, criadoEm: t(35),
      bio: 'Faço sites e estou a aprender Python.', oferece: 'Sites simples de apresentação, portefólios online e correção de erros.',
      areas: ['sites', 'mat'], niveis: { sites: 3, mat: 2 }, ferramentas: ['HTML', 'CSS', 'JavaScript'], horas: '3 horas por semana',
      experiencias: [{ id: 'e1', titulo: 'Site do clube de xadrez', onde: 'Projeto pessoal', ano: '2026' }] }),
    ex_ines: Object.assign({}, base, { uid: 'ex_ines', cor: 2, nome: 'Inês F.', tipo: 'aluno', curso: '12.º, Vídeo', disponivel: false, criadoEm: t(30),
      bio: 'Gravo e edito vídeo.', oferece: 'Edição de vídeos curtos, legendas e correção de cor.',
      areas: ['video', 'foto', 'som'], niveis: { video: 3, foto: 2, som: 1 }, ferramentas: ['Premiere', 'DaVinci Resolve'] }),
    ex_helena: Object.assign({}, base, { uid: 'ex_helena', cor: 3, nome: 'Prof. Helena C.', tipo: 'professor', curso: 'Matemática', disponivel: true, criadoEm: t(28),
      bio: 'Dou apoio a quem se está a preparar para o exame nacional de Matemática.', oferece: 'Sessões de dúvidas em grupo e correção de exames de anos anteriores.',
      areas: ['mat', 'exames'], niveis: { mat: 3, exames: 3 } })
  };
  const novo = o => Object.assign({ formato: '', img: '', tarefas: [], entregas: [], prazo: '', portefolioOk: true, freelancerUid: '', oculto: false }, o);
  const pedidos = [
    novo({ id: 'pd1', uid: 'ex_tiago', tipo: 'projeto', area: 'design', titulo: 'Logótipo para o meu portefólio de programador',
      precisa: 'Um logótipo simples com as minhas iniciais (TS), em versão clara e escura.', objetivo: 'Usar no meu site e no currículo para parecer mais profissional.',
      finalidade: 'Projeto pessoal, para concorrer a estágios.', estado: 'aberto', criadoEm: t(2) }),
    novo({ id: 'pd2', uid: 'ex_ines', tipo: 'ajuda', area: 'mat', formato: 'escola', titulo: 'Dúvidas em funções para o exame nacional',
      precisa: 'Alguém que me explique funções exponenciais e logarítmicas com exercícios de exame.', objetivo: 'Conseguir resolver sozinha os exercícios do grupo de funções.',
      finalidade: 'Preparação para o exame nacional de Matemática.', estado: 'aberto', criadoEm: t(1) }),
    novo({ id: 'pd4', uid: 'ex_helena', tipo: 'projeto', area: 'video', titulo: 'Vídeo curto a apresentar o clube de Matemática',
      precisa: 'Um vídeo de um minuto com imagens das sessões do clube e legendas.', objetivo: 'Mostrar o clube aos alunos novos no início do ano.',
      finalidade: 'Clube de Matemática da escola.', estado: 'aberto', criadoEm: t(3) }),
    novo({ id: 'pd3', uid: 'ex_rita', tipo: 'projeto', area: 'sites', titulo: 'Site para mostrar os meus trabalhos de design',
      precisa: 'Uma página com galeria, uma secção «sobre mim» e um formulário de contacto.', objetivo: 'Ter um endereço para enviar a clientes e empresas.',
      finalidade: 'Portefólio pessoal.', estado: 'concluido', freelancerUid: 'ex_tiago', criadoEm: t(20), concluidoEm: t(7),
      propostaId: 'pr1', tarefas: [{ id: 'tf1', texto: 'Esboço da página inicial', feito: true }, { id: 'tf2', texto: 'Galeria com os trabalhos', feito: true }],
      entrega: { texto: 'Site publicado com galeria, página «sobre» e formulário de contacto.', link: '', img: '', em: t(8) },
      entregas: [{ texto: 'Site publicado com galeria, página «sobre» e formulário de contacto.', link: '', img: '', em: t(8) }],
      avaliacao: { estrelas: 5, texto: 'Entregou antes do prazo e explicou-me como atualizar a galeria.', em: t(7) },
      avalDono: { estrelas: 5, texto: 'Explicou bem o que queria e respondeu sempre depressa.', em: t(7) } })
  ];
  const pecas = [{ id: 'p1', uid: 'ex_rita', titulo: 'Logótipo «Padaria do Largo»', desc: 'Proposta de marca para uma padaria: símbolo, cores e tipo de letra.', area: 'design', img: '', link: '', em: t(25) }];
  const propostas = [{ id: 'pr1', pedidoId: 'pd3', dono: 'ex_rita', uid: 'ex_tiago', texto: 'Faço-te o site em duas semanas. Mostro-te primeiro um esboço.', dias: 14, origem: 'proposta', estado: 'aceite', criadoEm: t(19) }];
  const conversas = [{ id: 'cv_pd3_ex_tiago', pedidoId: 'pd3', uids: ['ex_rita', 'ex_tiago'], msgs: [
    { id: 'm1', uid: '', texto: 'O trabalho começou. Combinem aqui os detalhes.', em: t(19) },
    { id: 'm2', uid: 'ex_rita', texto: 'Olá! Envio-te as imagens ainda hoje.', em: t(19) + 600000 },
    { id: 'm3', uid: 'ex_tiago', texto: 'Combinado. Amanhã mostro-te o esboço.', em: t(18) }
  ] }];
  const perguntas = [{ id: 'q1', pedidoId: 'pd1', dono: 'ex_tiago', uid: 'ex_rita', texto: 'Preferes um logótipo só com letras ou com um símbolo?', em: t(1), resposta: 'Só com letras, o mais simples possível.', respEm: t(1) + 3600000 }];
  const recs = [{ id: 'rc_ex_helena_ex_tiago', de: 'ex_helena', para: 'ex_tiago', texto: 'O Tiago ajudou vários colegas em Matemática e explica com muita paciência.', em: t(10) }];
  // números da Pronex_Study (nível, sequência e XP), como a app os lê do perfil de lá
  const study = { ex_rita: { nivel: 6, streak: 4, xp: 980 }, ex_tiago: { nivel: 9, streak: 12, xp: 2310 }, ex_ines: { nivel: 3, streak: 0, xp: 240 } };
  // Rede (tutorial da demonstração): publicações, ligações, grupos e vagas de exemplo.
  Object.assign(pessoas.ex_rita, { destaque: 'Designer em formação · Identidades visuais e cartazes', escola: 'Escola Profissional da Lousã', aberto: ['estagio', 'projetos'],
    formacao: [{ id: 'f1', escola: 'Escola Profissional da Lousã', curso: 'Curso Profissional de Multimédia', de: '2024', ate: '2027' }], destaques: [{ t: 'post', id: 'ps1' }] });
  Object.assign(pessoas.ex_tiago, { destaque: 'Programador júnior · Sites e Python', escola: 'Escola Profissional da Lousã', aberto: ['estagio', 'explicar'],
    formacao: [{ id: 'f1', escola: 'Escola Profissional da Lousã', curso: 'Programação de Sistemas de Informação', de: '2023', ate: '2026' }] });
  Object.assign(pessoas.ex_ines, { destaque: 'Vídeo e fotografia', escola: 'Escola Profissional da Lousã', aberto: ['projetos'] });
  Object.assign(pessoas.ex_helena, { destaque: 'Professora de Matemática · Clube de Matemática', escola: 'Escola Profissional da Lousã', aberto: ['explicar'] });
  const posts = [
    { id: 'ps1', uid: 'ex_rita', texto: 'Acabei a identidade visual da «Padaria do Largo»: símbolo, cores e tipo de letra. Foi o meu primeiro trabalho para um negócio a sério. O que mudariam?', img: '', video: '', grupoId: '', partilhaDe: '', em: t(2), oculto: false },
    { id: 'ps2', uid: 'ex_tiago', texto: 'Dica para quem está a começar em HTML: escrevam primeiro o conteúdo e só depois o estilo. O site fica mais fácil de ler e de manter.', img: '', video: '', grupoId: '', partilhaDe: '', em: t(1), oculto: false },
    { id: 'ps3', uid: 'ex_helena', texto: 'O Clube de Matemática volta na quarta-feira, às 16h, na sala 12. Tragam os exercícios de funções do último exame.', img: '', video: '', grupoId: 'gr1', partilhaDe: '', em: t(0.5), oculto: false },
    { id: 'ps4', uid: 'ex_ines', texto: 'Gravei o making-of do vídeo da visita de estudo. Fica aqui a ligação para quem quiser ver como foi feito.', img: '', video: 'https://www.youtube.com/watch?v=exemplo123', grupoId: '', partilhaDe: '', em: t(3), oculto: false }
  ];
  const comentarios = [
    { id: 'cm1', postId: 'ps1', dono: 'ex_rita', uid: 'ex_tiago', texto: 'Ficou muito limpo. Experimentava o símbolo também só a uma cor.', em: t(1.8) },
    { id: 'cm2', postId: 'ps2', dono: 'ex_tiago', uid: 'ex_ines', texto: 'Obrigada, vou experimentar no meu portefólio.', em: t(0.9) }
  ];
  const reacoes = [
    { id: 'ps1_ex_tiago', postId: 'ps1', dono: 'ex_rita', uid: 'ex_tiago', tipo: 'bravo', em: t(1.8) },
    { id: 'ps1_ex_ines', postId: 'ps1', dono: 'ex_rita', uid: 'ex_ines', tipo: 'gosto', em: t(1.5) },
    { id: 'ps2_ex_rita', postId: 'ps2', dono: 'ex_tiago', uid: 'ex_rita', tipo: 'ideia', em: t(0.8) }
  ];
  const ligacoes = [
    { id: 'ex_rita_ex_tiago', uids: ['ex_rita', 'ex_tiago'], de: 'ex_tiago', para: 'ex_rita', estado: 'aceite', nota: '', em: t(15), aceiteEm: t(14) },
    { id: 'ex_ines_ex_rita', uids: ['ex_ines', 'ex_rita'], de: 'ex_ines', para: 'ex_rita', estado: 'aceite', nota: '', em: t(10), aceiteEm: t(9) }
  ];
  const validacoes = [{ id: 'ex_rita_ex_tiago_design', alvo: 'ex_rita', uid: 'ex_tiago', area: 'design', em: t(6) }];
  const testemunhos = [{ id: 'ex_rita_ex_tiago', alvo: 'ex_rita', uid: 'ex_tiago', relacao: 'trabalho', texto: 'A Rita explica bem o que quer e dá ideias que melhoram o projeto. Recomendo trabalhar com ela.', em: t(6), visivel: true }];
  const grupos = [
    { id: 'gr1', nome: 'Clube de Matemática', descricao: 'Dúvidas, exercícios de exame e as sessões de quarta-feira.', tipo: 'clube', area: 'mat', uid: 'ex_helena', em: t(25) },
    { id: 'gr2', nome: 'Multimédia', descricao: 'Para quem está no curso de Multimédia: trabalhos, programas e oportunidades.', tipo: 'curso', area: 'design', uid: 'ex_rita', em: t(22) }
  ];
  const membros = [
    { id: 'gr1_ex_helena', grupoId: 'gr1', uid: 'ex_helena', em: t(25) }, { id: 'gr1_ex_ines', grupoId: 'gr1', uid: 'ex_ines', em: t(20) },
    { id: 'gr2_ex_rita', grupoId: 'gr2', uid: 'ex_rita', em: t(22) }, { id: 'gr2_ex_ines', grupoId: 'gr2', uid: 'ex_ines', em: t(21) }
  ];
  const vagas = [
    { id: 'vg1', uid: 'ex_helena', titulo: 'Estágio em design gráfico (FCT)', entidade: 'Gráfica da vila', tipo: 'estagio', area: 'design', local: 'Lousã', texto: 'Estágio curricular de 3 meses: paginação, cartazes e preparação de ficheiros para impressão.', ate: isoDe(new Date(agora + 30 * dia)), link: '', em: t(4), oculto: false, fechada: false },
    { id: 'vg2', uid: 'ex_helena', titulo: 'Equipa para o vídeo do Dia da Escola', entidade: 'Escola', tipo: 'projeto', area: 'video', local: 'Na escola', texto: 'Procuramos 3 alunos para gravar e editar o vídeo de apresentação do Dia da Escola.', ate: isoDe(new Date(agora + 12 * dia)), link: '', em: t(2), oculto: false, fechada: false }
  ];
  const candidaturas = [{ id: 'vg2_ex_ines', vagaId: 'vg2', dono: 'ex_helena', uid: 'ex_ines', texto: 'Já editei o vídeo da visita de estudo e tenho câmara.', em: t(1), estado: 'enviada' }];
  // Estudo (tutorial da demonstração): uma dúvida resolvida, uma por responder e uma sessão marcada.
  const duvidas = [
    { id: 'dv1', uid: 'ex_ines', titulo: 'Como resolvo uma equação exponencial com bases diferentes?', texto: 'No exame de 2024 aparece 2^(x+1) = 3^x e não sei por onde começar.', area: 'mat', exame: '635', img: '', em: t(3), oculto: false, resolvida: 'dv1_ex_helena' },
    { id: 'dv2', uid: 'ex_tiago', titulo: 'Qual é a diferença entre «há» e «à» numa frase?', texto: 'Escrevo sempre mal no Português. Há alguma forma rápida de saber qual usar?', area: 'pt', exame: '639', img: '', em: t(1), oculto: false, resolvida: '' },
    { id: 'dv3', uid: 'ex_rita', titulo: 'Que resolução devo usar num cartaz A3 para imprimir?', texto: '', area: 'design', exame: '', img: '', em: t(0.4), oculto: false, resolvida: '' }
  ];
  const respostas = [
    { id: 'dv1_ex_helena', duvidaId: 'dv1', dono: 'ex_ines', uid: 'ex_helena', texto: 'Aplica o logaritmo aos dois lados: (x+1)·ln 2 = x·ln 3. Junta os termos com x de um lado: x·(ln 3 − ln 2) = ln 2, e por isso x = ln 2 / (ln 3 − ln 2), cerca de 1,71.', img: '', em: t(2.8), oculto: false },
    { id: 'dv1_ex_tiago', duvidaId: 'dv1', dono: 'ex_ines', uid: 'ex_tiago', texto: 'Também dá com log de base 10, o resultado é o mesmo. Confirma na calculadora no fim.', img: '', em: t(2.5), oculto: false },
    { id: 'dv2_ex_rita', duvidaId: 'dv2', dono: 'ex_tiago', uid: 'ex_rita', texto: 'Se puderes trocar por «existe» ou por «faz» (tempo), é «há». Se for «a + a», como em «vou à escola», é «à».', img: '', em: t(0.7), oculto: false }
  ];
  const votos = [
    { id: 'dv1_ex_helena_ex_ines', respostaId: 'dv1_ex_helena', duvidaId: 'dv1', autor: 'ex_helena', uid: 'ex_ines', em: t(2.7) },
    { id: 'dv1_ex_helena_ex_rita', respostaId: 'dv1_ex_helena', duvidaId: 'dv1', autor: 'ex_helena', uid: 'ex_rita', em: t(2) },
    { id: 'dv2_ex_rita_ex_ines', respostaId: 'dv2_ex_rita', duvidaId: 'dv2', autor: 'ex_rita', uid: 'ex_ines', em: t(0.5) }
  ];
  const sessoes = [
    { id: 'se1', uid: 'ex_helena', titulo: 'Funções para o exame de Matemática A', texto: 'Resolvemos juntos o grupo de funções dos exames de 2023 e 2024. Tragam calculadora.', area: 'mat', quando: new Date(agora + 2 * dia).setHours(16, 0, 0, 0), duracao: 90, formato: 'escola', onde: 'Sala 12', lugares: 12, em: t(2), cancelada: false, oculto: false },
    { id: 'se2', uid: 'ex_tiago', titulo: 'Primeiros passos em HTML e CSS', texto: 'Para quem nunca fez um site: montamos uma página do zero.', area: 'sites', quando: new Date(agora + 5 * dia).setHours(18, 30, 0, 0), duracao: 60, formato: 'online', onde: 'Ligação enviada na conversa do grupo', lugares: 6, em: t(1), cancelada: false, oculto: false }
  ];
  const inscricoes = [{ id: 'se1_ex_ines', sessaoId: 'se1', dono: 'ex_helena', uid: 'ex_ines', em: t(1) }, { id: 'se1_ex_tiago', sessaoId: 'se1', dono: 'ex_helena', uid: 'ex_tiago', em: t(0.8) }];
  const salamsgs = [
    { id: 'sm1', sala: 'gr~gr1', uid: 'ex_helena', texto: 'Bem-vindos à conversa do clube. Aqui combinamos as sessões de quarta-feira.', img: '', em: t(6) },
    { id: 'sm2', sala: 'gr~gr1', uid: 'ex_ines', texto: 'Posso levar os exercícios de funções do exame de 2024?', img: '', em: t(5.9) }
  ];
  return { pessoas, pedidos, propostas, conversas, perguntas, recs, pecas, study, posts, comentarios, reacoes, ligacoes, validacoes, testemunhos, visitas: [], grupos, membros, vagas, candidaturas, duvidas, respostas, votos, sessoes, inscricoes, salamsgs };
}

/* ---------- Datas e dias (comuns à loja e aos ecrãs) ---------- */
const isoDe = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const hojeISO = () => isoDe(new Date());
const diaCurto = d => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); return m ? m[3] + '/' + m[2] : ''; };
const DIAS_SEMANA = [['seg', 'Seg'], ['ter', 'Ter'], ['qua', 'Qua'], ['qui', 'Qui'], ['sex', 'Sex'], ['sab', 'Sáb'], ['dom', 'Dom']];
