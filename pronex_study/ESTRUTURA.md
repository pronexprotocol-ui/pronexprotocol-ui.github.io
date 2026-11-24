# Pronex_Study · como o código está organizado

A app é uma página só (`index.html`) que carrega folhas de estilo e ficheiros JavaScript normais, sem passo de compilação.
Os ficheiros `js/` são *scripts* clássicos: correm pela ordem em que estão no `index.html` e partilham as mesmas variáveis globais.
Por isso a ordem conta, e um ficheiro pode usar o que os anteriores definiram.

## Pastas

| Caminho | O que tem |
|---|---|
| `index.html` | Esqueleto da página: cabeçalho, ecrãs vazios (`#v-home`, `#v-study`, …) e a lista de *scripts* |
| `css/` | Estilos (ver abaixo) |
| `js/` | Código da app (ver abaixo) |
| `disc/` | Conteúdo das disciplinas: `<id>.json` (mapa de conceitos, lições, exercícios) e `ferr_<id>.json` (fichas e glossário). Para acrescentar uma disciplina: os dois ficheiros, uma entrada em `DISC` (`js/disciplinas.js`), na lista `DISC` do `sw.js` e em `AREA`/`DNOME` do `js/nex.js` |
| `sw.js` | *Service worker*: guarda a app para funcionar sem internet; a lista `FILES` tem de incluir todos os ficheiros de `css/` e `js/` |
| `config.js` | Ligação ao Firebase (chaves públicas da app web) |
| `ia-worker.js`, `py-worker.js` | Trabalhadores do modelo opcional do Nex (WebLLM) e do Python (Pyodide) |
| `js/lib/` | Bibliotecas de outros guardadas na própria app (1.38: QRCode.js, com a licença ao lado). Não passam pelo ESLint nem pela verificação de segurança |
| `icons/`, `anim/`, `fontes/`, `legal/`, `sobre/`, `screens/` | Ícones, animações do Nex, tipos de letra, textos legais, página pública e capturas |

## Estilos (`css/`)

| Ficheiro | Para que serve |
|---|---|
| `base.css` | Tipos de letra e a primeira camada de estilos |
| `nova.css` | Sistema visual atual (1.31+): cores, botões, superfícies, Início, disciplina, exercício, ranking, Nex, painel |
| `app.css` | Estilos históricos de todos os ecrãs. Está ligado no início do `<body>` de propósito: tem de vir depois dos estilos que `js/disciplinas.js` e `js/cristal.js` injetam no `<head>` |

Regra prática: o que é novo vai para `nova.css`, numa secção numerada.

## Código (`js/`), pela ordem de carregamento

| Ficheiro | Área |
|---|---|
| `01-matematica-geradores.js` | Matemática: geradores dos exercícios com números novos (`TYPES`) |
| `02-matematica-formulas.js` | Matemática: cartões de fórmula e ajudas passo a passo (`HELP`, `helpCard`) |
| `03-nucleo.js` | Estado da app, histórico, ligação ao Firebase, conquistas, histórico de versões (`CHANGELOG`), conversa guardada do Nex e mensagens de crise |
| `04-ecras.js` | Navegação e ecrãs base: Início, treino de Matemática, Turma, Perfil. **`APP_VERSION` está aqui** |
| `05-contas-mural-painel.js` | Contas, mural, denúncias, suspensões e base do painel do administrador |
| `06-entrada-definicoes.js` | Entrada na app, Definições, PIN do painel, avisos e o modelo opcional do Nex (`IA8`) |
| `07-cartoes-ferramentas.js` | Cartões de memória, emblemas, folhas (`X11.sheet`), ferramentas de estudo, botão do Nex |
| `08-comunidade.js` | Reações, grupos, duelos, salas de estudo, baús, loja e moedas (`X12`) |
| `09-erro-fichas-tema.js` | Caderno de erros, fichas, tema claro/escuro, cartão «App» |
| `10-pontos-ligas.js` | XP a partir do histórico, níveis, ligas, rankings, «Os teus pontos», carteira na conta (`X16`) |
| `11-arranque.js` | Arranque: o último ficheiro do núcleo |
| `disciplinas.js` | Todas as disciplinas além da Matemática: trilho de conceitos, sessão de exercícios, correção, explicações, fichas e glossário (`XD`) |
| `nex.js` | O Nex: índice da matéria, pesquisa, respostas, exercícios na conversa, ecrã do Nex (`TNEX`) |
| `cristal.js` | Elementos de cristal do visual: facetas, medalhas, fundos (`CR`) |
| `nova.js` | Início reorganizado (próximo passo, aviso da memória, mini-trilho, números do dia), ações `data-foco`/`data-ir`/`data-recarregar` e conquistas guardadas para o fim da sessão |
| `painel.js` | Painel de controlo por separadores, contas duplicadas e nome em uso (`PN`) |

Muitas funções base (por exemplo `renderHome`, `renderComm`, `renderProfile`) são alargadas por ficheiros posteriores:
guardam a versão anterior, chamam-na e acrescentam a sua parte. Para saber tudo o que um ecrã mostra, procura o nome da função em todos os ficheiros.

## O Nex

1. `nex.js` lê a matéria já carregada (`disc/*.json`, fichas, glossário, fórmulas de Matemática) e monta um índice no dispositivo.
2. Responde com o texto da matéria: definição, diferença, exemplo, resumo, conta, exercício com correção, ou a explicação de um exercício («porque errei», «de outra forma», «outro parecido»).
3. O modelo opcional (`IA8`, em `06-entrada-definicoes.js`) só é usado se estiver instalado, para reescrever por outras palavras ou tentar o que não está na matéria. Se falhar, fica a resposta da matéria.

Mensagens de crise (ver `CRISE_RE` em `03-nucleo.js`) nunca chegam ao Nex: mostram contactos de ajuda fixos.

## Memória (1.36)

Em `disciplinas.js`, `memoria(nd, st0)` diz quanto um conceito dominado já desvaneceu: compara o tempo desde a última prática
com o intervalo da revisão seguinte (3, 7, 16, 35 e 75 dias, mais 30% com 3 coroas). O número de revisões espaçadas fica em `r`,
no registo de cada conceito (`x24-nodes-<disciplina>`). No trilho, o cristal perde cor aos poucos (`--mem`, de 0 a 1) e ganha um
relógio quando chega a 1; o botão «a desvanecer» faz uma revisão misturada (até 5 conceitos, 2 exercícios de cada).

## Segurança da página

O `index.html` tem uma política de segurança (CSP): só correm os scripts da própria app, das CDN listadas e o pequeno script do tema,
autorizado pelo seu sha256. Por isso:
- não se escreve `onclick=` nem outros `on…=` no HTML gerado; usa-se `addEventListener` ou os atributos `data-foco`, `data-ir` e `data-recarregar`;
- se mudares o script do tema no `<head>`, o teste `verificar-seguranca.mjs` diz qual é o sha256 novo a pôr na CSP;
- todo o texto que vem de outros alunos (nomes, mensagens, nomes de grupos) passa por `esc()` antes de ir para o HTML.
- 1.38: os endereços de CDN têm a versão fixa (o teste recusa os que não têm) e o que der para guardar na app vai para `js/lib/`;
- 1.38: no início de `03-nucleo.js`, a app esconde-se quando é aberta dentro de uma página de outro site (iframe) e mostra só uma ligação para a abrir à parte. O GitHub Pages não deixa enviar `X-Frame-Options`.

## Falhas, ritmo e redesenhos (1.39)

- Todas as falhas de envio passam por `explicarFalha(e, base)` (js/06): diz a causa real (sem internet, email por confirmar, conta suspensa, servidor sem resposta). Uma recusa que não se explica vai para os relatórios de erros (`X12.relatar`).
- O servidor só aceita um envio de cada tipo a cada 10 s (mensagens: 3 s). `addRitmoEscrita` espera o que falta e envia sozinha, em vez de deixar o servidor recusar.
- As mudanças nos dados da conta (`data/users/{uid}`) redesenham o ecrã uma vez por cada 250 ms (`refreshDados`, js/03). Durante um exercício ou a escrever, só a barra de cima.
- Um ouvinte (`onSnapshot`) que escreve no mesmo documento que ouve tem de ignorar o eco da própria escrita (`snap.metadata.hasPendingWrites`) e marcar o envio como feito logo ao sair. Sem isso, entra em ciclo até o servidor responder (era o que acontecia com a loja em `js/10`).

## Dentro da marca PRONEX (1.40)

- O site da PRONEX (raiz do repositório, fonte em `fonte/`) é a entrada da marca: a página inicial e `apps.html` têm um cartão para cada app, **Estudos** (esta) e **Freelancer** (Pronex_Link).
- Na app: no fim do Início, `#x40-link` leva à Pronex_Link (js/10, a seguir a «Partilhar a app»); em Perfil → Definições → App há ligações para a Pronex_Link e para `../apps.html` (js/09, `X13A.cardHTML`). Abrem noutro separador.
- O ícone da Pronex_Link usado aqui é uma cópia pequena em `icons/link.webp`, guardada na cache da app (sw.js), para não depender da pasta da outra app.
- A página `sobre/` (apresentação pública) diz as 10 disciplinas e liga à Pronex_Link e ao site.

## Folhas (janelas por cima do ecrã)

Desde 1.37, `nova.js` trata todas as folhas que ficam diretamente no `<body>` (`.x11sh`, `.x8sheet`, `.nsheet`) como janelas modais:
põe `aria-modal`, torna inerte o resto da app (exceto o fundo escuro e o `#toast`), põe o foco dentro da folha e, ao fechar,
devolve-o ao botão que a abriu. Uma folha nova só precisa de ter uma destas classes e `role="dialog"`.

## Ícone da app

Os ícones em uso estão em `icons/v2/` e é para lá que apontam o `manifest.webmanifest`, o `index.html`, o `sw.js` e os avisos.
Os ficheiros com o mesmo nome em `icons/` têm a mesma imagem e ficam só para as versões já instaladas.
Para trocar o ícone outra vez, cria-se `icons/v3/` e mudam-se esses endereços: é o endereço novo que faz o Android atualizar o ícone da app instalada.
O ícone usa o logótipo real da PRONEX, só redimensionado, sobre uma placa e um fundo de cristal.

## Publicar uma versão

1. Mudar `APP_VERSION` em `js/04-ecras.js` e acrescentar a entrada no `CHANGELOG` em `js/03-nucleo.js`.
2. Mudar `VERSION` em `sw.js` (e a lista `FILES`, se houver ficheiros novos).
3. Enviar para o ramo `disciplinas`, esperar pelos testes («Pronex_Study · testes») e juntar ao `main`.

Os testes também correm o ESLint ao código (`.github/pronex/app/study-lint.mjs`: variáveis por definir, chaves repetidas, código que nunca corre) e o orçamento de desempenho (`.github/pronex/orcamento.mjs`: o que a app descarrega para abrir, comprimido, não pode passar de 400 KB). Um ficheiro novo em `js/` tem de entrar no `index.html` e no `sw.js`; uma variável global nova usada antes de ser definida vai para a lista `EXTRA` do `study-lint.mjs`.

Os testes e as tarefas do servidor estão em `.github/pronex/` (ver `LEIA-ME.md`, `CONTEUDO.md` e `PONTOS.md` nessa pasta).

- 1.40.1: a app também corre dentro da **app PRONEX** (`app/` na raiz do site, fonte em `fonte/app/`), numa moldura do mesmo site, ao lado da Pronex_Link. Dentro da moldura (`window.top!==window.self`), o Google por redirecionamento (iPhone instalado, ou popup bloqueado) é trocado por abrir a app no ecrã inteiro (`05-contas-mural-painel.js`, `loginGoogle`). Os links para `../pronex_link/` são apanhados pela app PRONEX e trocam de separador.
