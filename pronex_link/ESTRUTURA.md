# Pronex_Link · como o código está organizado

App para alunos e professores da escola: quem precisa publica um pedido, quem sabe fazer responde, e o trabalho concluído entra no portefólio de quem o fez.
Segue a mesma organização da Pronex_Study: uma página só (`index.html`), folhas de estilo e ficheiros JavaScript normais, sem passo de compilação.

## Estado desta versão (0.4.0)

Funciona **com contas verdadeiras**: a mesma conta e a mesma base de dados (Firebase, projeto `pronex-study`) da Pronex_Study.
Quem já entrou na Pronex_Study no mesmo browser entra aqui sem voltar a escrever a palavra-passe (o site é o mesmo).
O **modo de demonstração** continua disponível na entrada («Experimentar sem conta»): guarda tudo só no dispositivo, com pessoas de exemplo.

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
- `.github/pronex/app/link-e2e.mjs`: a app com contas, nos emuladores do Firebase: duas pessoas fazem um trabalho completo em tempo real, um professor recomenda e o administrador modera.

## O que ainda falta

1. **Entrada só para a escola:** limitar o registo ao domínio de email da escola (falta saber o domínio).
2. **Limites por pessoa no servidor:** os limites (5 pedidos abertos, 10 propostas à espera) só são verificados na app; as regras ainda não os contam.
3. **Avisos fora da app:** os avisos aparecem com a app aberta; ainda não chegam ao telemóvel com a app fechada.
4. **Textos legais próprios** (termos e privacidade da Pronex_Link): por agora valem os da Pronex_Study.
