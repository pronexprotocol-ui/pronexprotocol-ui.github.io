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
| `disc/` | Conteúdo das disciplinas: `<id>.json` (mapa de conceitos, lições, exercícios) e `ferr_<id>.json` (fichas e glossário) |
| `sw.js` | *Service worker*: guarda a app para funcionar sem internet; a lista `FILES` tem de incluir todos os ficheiros de `css/` e `js/` |
| `config.js` | Ligação ao Firebase (chaves públicas da app web) |
| `ia-worker.js`, `py-worker.js` | Trabalhadores do modelo opcional do Nex (WebLLM) e do Python (Pyodide) |
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
| `nova.js` | Início reorganizado (próximo passo, mini-trilho, números do dia) |
| `painel.js` | Painel de controlo por separadores, contas duplicadas e nome em uso (`PN`) |

Muitas funções base (por exemplo `renderHome`, `renderComm`, `renderProfile`) são alargadas por ficheiros posteriores:
guardam a versão anterior, chamam-na e acrescentam a sua parte. Para saber tudo o que um ecrã mostra, procura o nome da função em todos os ficheiros.

## O Nex

1. `nex.js` lê a matéria já carregada (`disc/*.json`, fichas, glossário, fórmulas de Matemática) e monta um índice no dispositivo.
2. Responde com o texto da matéria: definição, diferença, exemplo, resumo, conta, exercício com correção, ou a explicação de um exercício («porque errei», «de outra forma», «outro parecido»).
3. O modelo opcional (`IA8`, em `06-entrada-definicoes.js`) só é usado se estiver instalado, para reescrever por outras palavras ou tentar o que não está na matéria. Se falhar, fica a resposta da matéria.

Mensagens de crise (ver `CRISE_RE` em `03-nucleo.js`) nunca chegam ao Nex: mostram contactos de ajuda fixos.

## Ícone da app

Os ícones em uso estão em `icons/v2/` e é para lá que apontam o `manifest.webmanifest`, o `index.html`, o `sw.js` e os avisos.
Os ficheiros com o mesmo nome em `icons/` têm a mesma imagem e ficam só para as versões já instaladas.
Para trocar o ícone outra vez, cria-se `icons/v3/` e mudam-se esses endereços: é o endereço novo que faz o Android atualizar o ícone da app instalada.
O ícone usa o logótipo real da PRONEX, só redimensionado, sobre uma placa e um fundo de cristal.

## Publicar uma versão

1. Mudar `APP_VERSION` em `js/04-ecras.js` e acrescentar a entrada no `CHANGELOG` em `js/03-nucleo.js`.
2. Mudar `VERSION` em `sw.js` (e a lista `FILES`, se houver ficheiros novos).
3. Enviar para o ramo `disciplinas`, esperar pelos testes («Pronex_Study · testes») e juntar ao `main`.

Os testes e as tarefas do servidor estão em `.github/pronex/` (ver `LEIA-ME.md`, `CONTEUDO.md` e `PONTOS.md` nessa pasta).
