# Pronex_Link · como o código está organizado

App para alunos e professores da escola: quem precisa publica um pedido, quem sabe fazer responde, e o trabalho concluído entra no portefólio de quem o fez.
Segue a mesma organização da Pronex_Study: uma página só (`index.html`), folhas de estilo e ficheiros JavaScript normais, sem passo de compilação.

## Estado desta versão (0.12.0)

Funciona **com contas verdadeiras**: a mesma conta e a mesma base de dados (Firebase, projeto `pronex-study`) da Pronex_Study.
Quem já entrou na Pronex_Study no mesmo browser entra aqui sem voltar a escrever a palavra-passe (o site é o mesmo).
O **modo de demonstração** continua disponível na entrada («Experimentar sem conta»): guarda tudo só no dispositivo, com pessoas de exemplo.

### Novo na 0.12 (50 melhorias e o guia «How to Build an App»)

- **Segurança e moderação:** `link_moderadores/{email}` (professores escolhidos pelo admin; veem só a moderação, sem PIN), `lkModera()` nas regras; advertências (aviso `alvo.t = 'moderacao'`); `link_config/filtro` (palavras proibidas que o admin muda sem versão nova, também verificadas na app); `link_cotas/{uid}_{dia}` (o servidor conta as propostas: no máximo 10 por dia); bloquear apaga as perguntas e recusa as propostas da pessoa; apagar a conta de imediato ou daqui a 7 dias (`link_privado.apagarEm`); descarregar os dados em JSON.
- **Trabalho:** `acordo` = `{ texto, por, em, aceiteEm? }` (regra `lkAcordo`: uma pessoa propõe, a outra aceita sem mudar o texto); `mentorUid` + `notasMentor` (até 10, uma de cada vez, só o professor escolhido: `lkMentor`); `entrega.imgs` (até 2 além de `img`: `lkImgs`); versões numeradas; `recorrente` (`semanal`/`mensal`); conversas com `fixada` (única mudança permitida numa conversa) e mensagens com `reuniao` = `{ quando, onde }` (data futura).
- **Comunidade:** seguir pessoas (`link_privado.seguidos`), escola no perfil e filtro «Só da minha escola», `cursoPrivado`, `links` (até 4, https), desafio do mês (`link_config/desafio`), mural, níveis (`NIVEIS_CONTA`), competências confirmadas (avaliações de 4 ou 5), linha do tempo, currículo em PDF.
- **Painel:** mediana do tempo até à primeira proposta, percentagem de trabalhos começados que chegam ao fim, média do SUS, funil de uso, registo em CSV, denúncias por prioridade (`PRIORIDADE_DENUNCIA`), anúncios com data de fim e só para professores (`ate`, `para`), interruptores (`link_config/flags`: desligar mural, desafio, reuniões, mentor ou acordo sem publicar código).
- **Medir sem dados pessoais:** `link_uso/{AAAA-MM-DD}_{evento}` = `{ n }` (abrir, publicar, proposta, comecar, concluir; só sobe de 1 em 1, só o admin lê; apagado ao fim de 400 dias). Não se usa um serviço externo de estatística (como o PostHog) porque receberia dados de alunos.
- **Questionário SUS:** `link_sus/{uid}` (10 respostas de 1 a 5 e a nota de 0 a 100; cada pessoa só lê o seu, o admin vê a média).
- **Privacidade:** política dentro da app (Definições › Privacidade), escrita como mapa de dados: o que se guarda, porquê, onde, quanto tempo, quem vê, direitos.
- **Tarefas automáticas:** `link-limpeza.mjs` (todos os dias: avisos lidos com mais de 90 dias, conversas de pedidos cancelados com mais de 180, cotas e contagens antigas, e `link_stats/geral`); auditoria semanal com `--estrito`.
- **Design:** tema como o sistema, poupança de dados (imagens a pedido, menos mensagens antigas), ícones por área, celebração ao concluir (sem animação com «reduzir movimento»), zonas de toque de 44 px verificadas no ensaio, imagens em WebP.
- **Testes:** `link-webkit.mjs` corre a app no WebKit (o motor do Safari e do iPhone) em cada versão.

### Novo na 0.11

- **Avaliação por critérios:** `avaliacao.criterios` = `{ qualidade, prazo, comunicacao }` (cada um de 1 a 5, todos opcionais; `CRITERIOS` em `01-dados.js`); média por critério no perfil (`Loja.criteriosDe`).
- **Estado da gravação:** `pintarGravacao` (em `03b-sistema.js`) mostra «A guardar…» enquanto o servidor não confirma um lote, «Por enviar» sem internet, «Guardado» no fim e «Não foi guardado» se for recusado.
- **Ritmo dos avisos sem erros:** se um lote com avisos chegar menos de 2 s depois do anterior, `Nuvem.enviar` espera o que falta e envia sozinho.
- **Equipas:** a conclusão avisa todos os membros, cada um na sua conversa. O ensaio com contas percorre uma equipa de duas pessoas.

### Novo na 0.10 (equipas)

- **Dados:** `link_pedidos.vagas` (1–5, só em pedidos de tipo `equipa`), `equipa` = `{ uid: id da proposta aceite }` (até 4, além de `freelancerUid`, que coordena e entrega) e `novoMembro` (o último a entrar, para as regras saberem quem entrou).
- **Percurso:** escolher a primeira pessoa não recusa as outras propostas; enquanto há vagas, o pedido aparece nos abertos e aceita propostas; quem pediu junta pessoas (`Loja.juntarEquipa`, regra `lkMembroEntra`, com a proposta aceite no mesmo lote); quando as vagas acabam, as propostas que sobram são recusadas; um membro pode sair (`sairEquipa`, regra `lkMembroSai`). Cada membro tem a conversa `cv_{pedido}_{uid}`.
- **Portefólio e avaliações:** contam para todos os membros (`naEquipa`).
- **Auditoria:** verifica vagas, propostas e conversas de cada membro.

### Novo na 0.9 (análise e arrumação)

- **Análise:** ESLint (variáveis por definir, chaves repetidas, código que nunca corre, variáveis por usar) sem nenhum problema; uma ação morta (`partilhar-pedido`) juntada ao «Partilhar»; `03-ui.js` dividido (os serviços passaram para `03b-sistema.js`); as ações de definições, pesquisa, portefólio e painel passaram de `10-acoes-pedidos.js` para `11-acoes-perfil.js`; datas comuns em `01-dados.js` (`isoDe`, `hojeISO`, `diaCurto`, `DIAS_SEMANA`); a loja deixou de ler o `localStorage` dos alertas (recebe-o por parâmetro).
- **Testes novos:** `link-lint.mjs` (ESLint nos testes do GitHub; mostra ficheiro e linha), limites de rapidez e tamanho no ensaio sem conta (arranque < 2,5 s, JS + CSS < 450 KB), e o ensaio com contas percorre também o «visto», o anúncio e o pedido de confirmação de professor.
- **Correção:** ligar o «visto» publica logo até onde se leu cada conversa.

### Novo na 0.8 (teste de utilização e auditoria)

- **Teste de utilização:** uma aluna nova percorreu a app no telemóvel. Problemas encontrados e corrigidos: a regra da troca (sem dinheiro, sem nota) não aparecia no guia; as Definições tinham 6 cartões e 14 botões de áreas abertos; havia dois botões de partilhar no pedido; «nota quando pede» não se percebia; os filtros de pedidos ocupavam meio ecrã; quem chega não tinha um caminho claro até ao primeiro trabalho.
- **Primeiros passos** (`Loja.primeirosPassos`), **glossário** (`GLOSSARIO`), **medidor de clareza** do pedido (`qualidadePedido`, 6 critérios, uma dica de cada vez).
- **Segurança:** avisos com ritmo próprio de 2 s (`utilizadores/{uid}.ultimoAviso`, separado das mensagens).
- **Auditoria da base de dados:** `.github/pronex/link-auditoria.mjs` (só lê; mostra só números e códigos). Corre nos testes, contra o emulador, depois do ensaio com contas (falha se houver dados incoerentes), e à mão pela tarefa «Pronex_Link · auditoria».

### Princípios de design (a teoria por trás das escolhas)

- **Uma troca clara antes de tudo:** a primeira coisa que se lê explica o que se ganha (portefólio e avaliação) e o que não é permitido (dinheiro, trabalhos para nota). Sem isso, o resto da app não faz sentido.
- **Revelação progressiva:** o que é raro fica recolhido (áreas dos alertas, painel, opções avançadas); o que é frequente fica à vista. Menos escolhas à vista tornam cada decisão mais rápida (lei de Hick).
- **Reconhecer em vez de lembrar:** estados com nome e cor (Publicado → Em curso → Entregue → Concluído), glossário a um toque, modelos e rascunhos em vez de formulários em branco.
- **Feedback imediato:** medidor de clareza enquanto se escreve, «A responder a…», «Visto», contadores por ver, avisos de ritmo com os segundos que faltam.
- **Prevenir erros antes de os corrigir:** filtro de insultos, aviso de contactos e de trabalhos para nota antes de publicar; as regras do servidor repetem cada verificação.
- **Um caminho, não um menu:** «Os teus primeiros passos» leva quem chega até ao primeiro trabalho concluído, que é o momento em que a app passa a valer a pena.
- **Acessível por omissão:** contraste verificado pelo axe em cada versão, contraste alto, texto maior, teclado (/, N, Esc), movimento reduzido.

### Novo na 0.7

- **«Visto»:** campo `visto` (bool) em `link_pessoas`; `link_vistos/{conversa}_{uid}` = `{cid, uid, para, em}`, escrito em `marcarLida` só por quem ligou a opção, lido com `where('para','==',eu)`. Só aparece quando as duas pessoas o ligaram.
- **Perguntas sob pedido:** a app lê sempre as perguntas que fiz e as que me fizeram (`dono`/`uid`); as de outro pedido chegam ao abri-lo (`Nuvem.verPerguntas`).
- **Nome:** com `perfis/{uid}.nick` válido (2–40, sem espaços nas pontas), `link_pessoas.nome` tem de ser igual (regra `lkNomeStudy`).
- **Modelos e rascunhos:** `localStorage` `pl-modelos` (até 8) e `pl-rascunhos` (até 5), só no dispositivo.
- **Escrita recusada:** volta a montar só as coleções desse lote.

### Novo na 0.6

- **Servidor:** `link_pedidos` só deixa ler os ocultados a quem publicou, a quem faz e ao administrador (a app lê com `where('oculto','==',false)` + `uid` + `freelancerUid`). Mensagens recusadas se a outra pessoa te bloqueou. Denúncias com ritmo (`ultimoPost`). Coleções novas: `link_pedidosprof/{uid}` (pedido de confirmação de professor) e `link_anuncios/atual` (anúncio do administrador). Campos novos: `dias` (pessoas), `destaque` (peças), `resp` (mensagens), `ate` (tarefas).
- **App:** pesquisa geral (`ACOES.procurar`, tecla `/`), tecla `N`, filtro de formato, tarefas com data e prazos a chegar no Início, alertas por área (`localStorage` `pl-alertas`), responder a mensagens (`RESPOSTA`), ligações nas mensagens (`ligacoes()`), destaque e dias no perfil, números pessoais, PDF do portefólio e do comprovativo (`imprimirHTML`), pedidos parados, passar a professor, anúncio, contraste alto (`pl-contraste`), gesto de voltar, aviso de versão nova (`#nova`).
- **Painel:** gráficos no Resumo, anúncio, CSV sem dados pessoais, arquivar todas, histórico de denúncias por pessoa, pedidos de professor por aprovar.
- **Testes:** o ensaio sem conta corre o axe (WCAG 2 A/AA, problemas sérios e críticos) em vários ecrãs.

### Novo na 0.5

- **Ligações diretas:** `#pedido/<id>`, `#pessoa/<uid>` e `#conversa/<id>` abrem o ecrã certo (também ao abrir a app; com conta, espera até 20 s que os dados cheguem). O endereço acompanha o ecrã aberto. Pedidos abertos têm o botão «Partilhar» (partilha do sistema ou copiar a ligação).
- **Avisos no dispositivo:** opção em Definições (`localStorage` `pl-push`). Mensagens e avisos novos mostram um aviso do sistema quando a app está escondida; carregar nele abre o sítio certo (`notificationclick` em `sw.js`). O número por ver aparece no ícone (`setAppBadge`) e no título.
- **Imagens em grande:** qualquer `img.zoom` abre num visor. **Sem internet:** faixa `#rede`. Campo de imagem com botão próprio (`.escolher`).
- **Regras:** um aviso só passa se estiver ligado a um pedido em que quem publicou é uma das pontas, ou a uma recomendação gravada no mesmo lote.

### O que é igual à Pronex_Study (0.4)

- **Segurança:** o mesmo filtro de insultos, o aviso quando um texto parece um contacto (telefone, email, redes), a ajuda quando um texto fala de crise, os mesmos motivos de denúncia (mais «É um trabalho para nota»), o mesmo limite de ritmo (10 s entre publicações, 3 s entre mensagens, com o carimbo do servidor em `utilizadores/{uid}`) e as mesmas suspensões (`bans/{uid}`, `bansEmail/{email}`, `perfis/{uid}.banned`) — uma suspensão vale nas duas apps.
- **Identidade:** o nome, a foto e a cor do avatar vêm do perfil da Pronex_Study (`perfis/{uid}`), com o nível, a sequência e o XP. Avatar redondo com as 12 cores da Pronex_Study.
- **Perfil:** separadores Resumo, Definições, Conta e, só para o administrador, Painel.
- **Conversa:** cada mensagem com avatar, nome e hora; menu ⋯ para copiar, apagar (as próprias) ou denunciar (as dos outros).
- **Painel:** só a conta de administrador (a das regras). Pede o PIN do painel da Pronex_Study (`config/admin`, hash com sal; 5 tentativas erradas bloqueiam 5 minutos; aberto 30 minutos). Separadores Resumo, Moderação, Utilizadores (suspender e retirar), Professores e Registo (`audit`, ações começadas por `link_`).

## Pastas

| Caminho | O que tem |
|---|---|
| `index.html` | Esqueleto da página: entrada, barra lateral, barra de topo, ecrã (`#vista`), barra inferior |
| `css/app.css` | Todos os estilos, em 12 secções numeradas. As cores e os tipos de letra são os da Pronex_Study (camada «Nova») |
| `js/` | Código da app (ver abaixo) |
| `sw.js` | *Service worker*: guarda a app para abrir sem internet. A lista `FILES` tem de incluir todos os ficheiros de `css/` e `js/` |
| `manifest.webmanifest` | Nome, ícones e atalhos da app instalada |
| `icons/` | Ícones da app e logótipo da PRONEX |
| `fontes/` | Tipos de letra (os mesmos ficheiros da Pronex_Study) e as licenças |

## Código (`js/`), pela ordem de carregamento

| Ficheiro | Área |
|---|---|
| `01-dados.js` | Listas fixas: áreas, níveis, tipos de pedido, modelos, estados, limites, regras, selos, ajuda, novidades. Dados de exemplo. **`APP_VERSION` está aqui** |
| `02-loja.js` | Onde os dados vivem (`DB`), as leituras (`Loja.media`, `Loja.selos`, …) e todas as ações que os mudam (`Loja.publicarPedido`, `Loja.aceitar`, …). Valida tudo antes de gravar e desfaz a mudança se não houver espaço |
| `03-ui.js` | Peças comuns: texto seguro (`esc`), pesquisa sem acentos (`norm`), ícones, facetas de cristal, avatar, estrelas, datas, prazo, copiar, aviso (`toast`), folha (`folha`), leitura de imagens |
| `03b-sistema.js` | Serviços do dispositivo: imagens em grande, sem internet, avisos do sistema e número no ícone, versão nova, ligações nas mensagens, PDF, contraste, modelos e rascunhos locais, medidor de clareza dos pedidos |
| `04-pecas.js` | Navegação (`ir`, `abrir`, `voltar`), filtros (`F`) e peças repetidas: cartão de pedido, cartão de pessoa, estado vazio |
| `05-ecra-inicio.js` | Ecrã Início |
| `06-ecra-pedidos.js` | Lista de pedidos e detalhe de um pedido (propostas, tarefas, entregas, perguntas, avaliações) |
| `07-ecra-pessoas.js` | Lista de freelancers e perfil (o meu e o dos outros) |
| `08-ecra-conversas.js` | Lista de conversas e conversa aberta |
| `09-ecra-mais.js` | Definições, ajuda, conta, modo de demonstração e ecrãs de entrada (entrar, confirmar o email, criar o perfil) |
| `10-acoes-pedidos.js` | `ACOES`: o que cada botão faz. Peças dos formulários, pedidos, propostas e trabalho em curso |
| `11-acoes-perfil.js` | `ACOES` de perfil, comunidade (recomendar, bloquear, denunciar, moderação), avisos, ajuda e conta |
| `12-nuvem.js` | Ligação ao Firebase: entrar, ler em tempo real e gravar só o que mudou (ver abaixo) |
| `13-arranque.js` | `desenhar()`, barras de navegação, campos dos ecrãs e arranque (conta ou demonstração) |

Regra: os ecrãs **só leem** de `DB` e **só escrevem** através de `Loja`. É isto que permite trocar o modo de demonstração por um servidor sem mexer nos ecrãs.

## Dados

| Coleção | Campos principais |
|---|---|
| `pessoas/{uid}` | nome, tipo (aluno ou professor), curso, foto, bio, oferece, areas[], niveis{}, ferramentas[], horas, disponivel, experiencias[], portefolio[] |
| `pedidos/{id}` | uid (quem pede), tipo (projeto, ajuda, equipa), area, titulo, precisa, objetivo, finalidade, prazo, formato, img, portefolioOk, estado, freelancerUid, tarefas[], entregas[], entrega, avaliacao, avalDono, oculto |
| `propostas/{id}` | pedidoId, uid (quem faz), texto, dias, origem (proposta ou convite), estado (pendente, aceite, recusada) |
| `conversas/{id}` | pedidoId, uids[2], msgs[] (texto ou imagem). Uma por pedido e por pessoa que o faz |
| `perguntas/{id}` | pedidoId, uid, texto, resposta |
| `recs/{id}` | de (professor), para (aluno), texto |
| `avisos/{id}` | para, texto, alvo, lido |
| `denuncias/{id}` | tipo, alvo, motivo, texto, uid, estado (aberta, resolvida, arquivada) |
| por pessoa | guardados, bloqueios, rascunho, lidas |

Percurso de um pedido: `aberto` → `em_curso` → `entregue` → `concluido` (ou `cancelado`).
Quem faz pode desistir (volta a `aberto`). Se quem pediu não confirmar a entrega em 7 dias, quem fez pode fechar o trabalho.
Ao concluir, se `portefolioOk` for verdadeiro, o trabalho entra no portefólio de quem o fez, ligado à avaliação.
Limites (`LIMITES` em `01-dados.js`): 5 pedidos abertos por pessoa, 10 propostas à espera, 20 tarefas e 20 perguntas por pedido.

## Publicar uma versão

1. Mudar `APP_VERSION` em `js/01-dados.js`.
2. Mudar `VERSION` em `sw.js` (e `FILES`, se houver ficheiros novos).

## Como funciona a ligação ao Firebase (`12-nuvem.js`)

- **Ler:** escuta em tempo real as coleções `link_*` e monta `DB` com a mesma forma do modo de demonstração. Os ecrãs não sabem de onde vêm os dados.
- **Gravar:** cada ação da `Loja` muda `DB` e chama `gravar()`. Com conta, isso compara `DB` com o que veio do servidor e grava, num só lote, só os documentos que mudaram.
- **Segurança:** as regras do Firestore (bloco «Pronex_Link» em `.github/pronex/regras/firestore.rules`) decidem o que cada pessoa pode escrever: cada passo de um trabalho só pode mudar os campos desse passo e só pela pessoa certa. Os testes estão em `.github/pronex/regras/link.test.js`.
- **Ficam só no dispositivo:** tema, tamanho do texto, rascunho do pedido e o guia de boas-vindas.

| Coleção | Quem lê | Quem escreve |
|---|---|---|
| `link_pessoas/{uid}` | contas confirmadas | a própria pessoa (professor só se o email estiver em `link_professores`) |
| `link_pecas/{id}` | contas confirmadas | quem a criou |
| `link_pedidos/{id}` | contas confirmadas | quem pediu, quem faz e quem foi convidado, cada um só no seu passo; o administrador só oculta |
| `link_propostas/{id}` | quem propõe e quem pediu | quem propõe, quem pediu, quem foi convidado |
| `link_conversas/{id}` e `msgs/` | as duas pessoas | as duas pessoas, só enquanto o trabalho está entre elas |
| `link_perguntas/{id}` | contas confirmadas | quem pergunta; quem pediu responde |
| `link_recs/{id}` | contas confirmadas | professores confirmados, para alunos |
| `link_avisos/{id}` | quem recebe | qualquer conta ativa (para outra pessoa) |
| `link_denuncias/{id}` | o administrador e quem denunciou | quem denuncia; o administrador decide |
| `link_privado/{uid}` | a própria pessoa | a própria pessoa (guardados, bloqueios, conversas lidas) |
| `link_professores/{email}` | o administrador (e o próprio professor) | o administrador, no cartão «Administração» do Perfil |

## Testes no GitHub (tarefa «Pronex_Study · testes»)

- `.github/pronex/regras/link.test.js`: regras do Firestore no emulador.
- `.github/pronex/app/link-demo.mjs`: a app inteira no modo de demonstração, em telemóvel e computador (cerca de 85 verificações cada).
- `.github/pronex/app/link-webkit.mjs`: ensaio curto no WebKit (Safari e iPhone).
- `.github/pronex/app/link-e2e.mjs`: a app com contas, nos emuladores do Firebase: duas pessoas fazem um trabalho completo em tempo real, um professor recomenda e o administrador modera.

## O que ainda falta

1. **Entrada só para a escola:** limitar o registo ao domínio de email da escola (falta saber o domínio).
2. **Limites por pessoa no servidor:** o limite diário de propostas já é contado no servidor (`link_cotas`); os limites de 5 pedidos abertos e 10 propostas à espera ainda só são verificados na app.
3. **Avisos fora da app:** os avisos aparecem com a app aberta; ainda não chegam ao telemóvel com a app fechada.
4. **Revisão legal:** a política de privacidade já está na app (0.12); falta alguém da escola confirmar o texto (o guia recomenda aconselhamento quando há menores).
5. **Pedidos ordenados no servidor com «carregar mais»:** precisa de um índice composto no Firestore, que só se cria na consola do Firebase (a tarefa de publicação só publica regras).
6. **Inglês:** a app está toda em português; traduzir implica separar cerca de 1500 textos do código.

## Plano para incidentes (modelo do guia, cap. 15)

1. **Perceber o que aconteceu:** ver o registo do painel (`audit` e `link_moderacao`), as denúncias e a auditoria (`node link-auditoria.mjs`).
2. **Conter:** desligar a funcionalidade com problemas nos interruptores (`link_config/flags`); se for uma regra, voltar ao conjunto de regras anterior (o ID fica no resumo de cada publicação); se for uma pessoa, suspender a conta no painel.
3. **Quem foi afetado e que dados:** a auditoria e o registo dizem que documentos mudaram.
4. **Avisar:** anúncio na app (só professores, se for preciso) e falar com a direção da escola quando há dados pessoais envolvidos (RGPD: 72 horas para comunicar à CNPD uma violação de dados).
5. **Corrigir e confirmar:** a correção passa pelos testes do GitHub antes de ser publicada.
6. **Aprender:** escrever aqui o que aconteceu e o que mudou.

## Lista de lançamento (guia, cap. 50), verificada na 0.12

| Ponto | Estado |
|---|---|
| Percurso principal do início ao fim | Testado em cada versão (demonstração e contas) |
| Telemóvel e computador, ecrãs diferentes | Chrome em 390 px e 1366 px; WebKit (iPhone) |
| Entrar, recuperar a palavra-passe | Conta da Pronex_Study (Firebase Auth) |
| Permissões no servidor | Regras do Firestore, com testes no emulador |
| Dados protegidos em trânsito | HTTPS (GitHub Pages e Firebase) |
| Chaves secretas fora do código | Só a configuração pública do Firebase está no site |
| Política de privacidade | Na app (0.12); falta revisão da escola |
| Erros e monitorização | Estado da gravação na app; auditoria semanal; números diários |
| Cópias de segurança e restauro | Cópia diária com teste de restauro (tarefas da Pronex_Study) |
| Contacto e retorno | Denúncias, questionário SUS |
| Voltar atrás numa versão má | Interruptores; regras anteriores guardadas a cada publicação |

