/* Pronex_Link · 01-dados.js
   Listas fixas da app (áreas, estados, regras, modelos, selos, ajuda, novidades) e os dados de exemplo
   do modo de demonstração. Não tem lógica: só texto e listas. */
'use strict';
const APP_NOME = 'Pronex_Link';
const APP_VERSION = '0.3.0';

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
const MOTIVOS_DENUNCIA = ['É um trabalho para nota', 'Falta de respeito', 'Conteúdo impróprio', 'Conta falsa ou spam', 'Outro motivo'];
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

const COMO_FUNCIONA = [
  ['Publica o pedido', 'Explica o que precisas, o que queres alcançar e para que é.'],
  ['Escolhe quem faz', 'Recebes propostas ou convidas alguém da lista de freelancers.'],
  ['Acompanha o trabalho', 'Combinam na conversa e seguem a lista de tarefas.'],
  ['Confirma e avalia', 'O trabalho entra no portefólio de quem o fez, com a tua avaliação.']
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
  { v: '0.3.0', d: 'novembro de 2026', itens: ['Contas verdadeiras: entras com a mesma conta da Pronex_Study e tudo fica guardado no servidor, em tempo real.', 'Professores confirmados pelo administrador.', 'O modo de demonstração continua disponível, sem conta.'] },
  { v: '0.2.0', d: 'novembro de 2026', itens: ['Avisos, perguntas nos pedidos, lista de tarefas, guardados e selos.', 'Recomendações de professores e avaliação nos dois sentidos.', 'Editar pedidos, desistir de um trabalho e fechar trabalhos sem resposta.', 'Bloquear pessoas, painel de moderação, apagar a conta e copiar os dados.', 'Fotografia de perfil, ferramentas, níveis por área e perfil completo.'] },
  { v: '0.1.0', d: 'novembro de 2026', itens: ['Primeira versão: pedidos, freelancers, conversas, perfil e portefólio.'] }
];

/* Dados de exemplo. Só existem neste dispositivo e servem para experimentar a app antes de haver contas.
   Todas as pessoas aqui são inventadas e aparecem marcadas com «Exemplo». */
function dadosExemplo(agora) {
  const dia = 86400000, t = n => agora - n * dia;
  const base = { exemplo: true, foto: '', ferramentas: [], niveis: {}, horas: '', experiencias: [] };
  const pessoas = {
    ex_rita: Object.assign({}, base, { uid: 'ex_rita', nome: 'Rita M.', tipo: 'aluno', curso: '11.º, Multimédia', disponivel: true, criadoEm: t(40),
      bio: 'Gosto de criar logótipos e identidades.', oferece: 'Logótipos, cartazes, cartões e publicações para redes sociais.',
      areas: ['design', 'desenho'], niveis: { design: 3, desenho: 2 }, ferramentas: ['Illustrator', 'Photoshop'], horas: '4 horas por semana',
      experiencias: [{ id: 'e1', titulo: 'Cartaz da festa de finalistas', onde: 'Escola', ano: '2026' }] }),
    ex_tiago: Object.assign({}, base, { uid: 'ex_tiago', nome: 'Tiago S.', tipo: 'aluno', curso: '12.º, Programação', disponivel: true, criadoEm: t(35),
      bio: 'Faço sites e estou a aprender Python.', oferece: 'Sites simples de apresentação, portefólios online e correção de erros.',
      areas: ['sites', 'mat'], niveis: { sites: 3, mat: 2 }, ferramentas: ['HTML', 'CSS', 'JavaScript'], horas: '3 horas por semana',
      experiencias: [{ id: 'e1', titulo: 'Site do clube de xadrez', onde: 'Projeto pessoal', ano: '2026' }] }),
    ex_ines: Object.assign({}, base, { uid: 'ex_ines', nome: 'Inês F.', tipo: 'aluno', curso: '12.º, Vídeo', disponivel: false, criadoEm: t(30),
      bio: 'Gravo e edito vídeo.', oferece: 'Edição de vídeos curtos, legendas e correção de cor.',
      areas: ['video', 'foto', 'som'], niveis: { video: 3, foto: 2, som: 1 }, ferramentas: ['Premiere', 'DaVinci Resolve'] }),
    ex_helena: Object.assign({}, base, { uid: 'ex_helena', nome: 'Prof. Helena C.', tipo: 'professor', curso: 'Matemática', disponivel: true, criadoEm: t(28),
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
  return { pessoas, pedidos, propostas, conversas, perguntas, recs, pecas };
}
