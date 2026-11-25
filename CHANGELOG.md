# Site PRONEX · histórico de alterações

Cada versão publicada tem uma etiqueta no GitHub (`site-v1.0`, `site-v2.0`…), para se poder voltar atrás.
As secções da app (Study, em `pronex_study/`, e Freelancer, em `pronex_link/`) têm o seu próprio histórico.

## 25-11-2026 · anular, apagados e histórico (Freelancer 0.25.0)
- **Pedido por acabar:** se houver um rascunho de pedido, o Início mostra um aviso com «Continuar» e «Descartar».
- **Apagados recentemente:** o que se retira do portefólio ou da experiência fica 30 dias guardado no aparelho (`pl-apagados`, até 40 itens) e pode ser reposto, na conta. A seguir a retirar, o aviso traz o botão «Anular».
- **Histórico do pedido:** bloco que se abre no pedido, com as datas de publicação, alteração, início, entregas, conclusão e avaliação (calculado a partir dos campos que já existiam; nenhum campo novo).
- `pl-apagados` entrou na lista de dados congelados.

## 25-11-2026 · fila do aparelho (Freelancer 0.24.0)
- Cada escrita do Freelancer fica também guardada no aparelho (`pronex-link-fila-<uid>`) até o servidor confirmar. Se a app fechar antes (sem internet, por exemplo), a escrita segue quando a app voltar a abrir.
- Criações vão com a hora atualizada; alterações só seguem se o documento no servidor estiver como estava; o que o servidor recusar fica na fila marcado, sem se apagar.
- Ensaio novo em `link-e2e.mjs`: publicar um pedido sem internet, fechar a app, reabrir com internet e confirmar que chega ao servidor.

## 25-11-2026 · guarda dos dados (Study 1.49.0, Freelancer 0.23.0)
- **Regra fixa:** nenhuma atualização pode perder registos dos utilizadores (ver `CLAUDE.md`).
- **`js/guarda.js`** (igual nas duas secções): antes de cada versão nova, e uma vez por dia de uso, guarda no aparelho uma cópia de tudo o que a app lá tem (ficam as 6 mais recentes). Janela «Os meus registos e cópias» para ver o que a conta tem e descarregar ou repor uma cópia.
- **Ensaio de preservação** (`.github/pronex/app/preservacao.mjs`): abre a versão atual por cima de dados gravados pelo Study 1.48.0 e pelo Freelancer 0.22.0 e confirma que nenhum registo desaparece. Passou a fazer parte dos testes.
- **Lista de dados congelados** (`.github/pronex/dados-congelados.json`): chaves do aparelho e coleções do Firestore que não podem mudar de nome nem desaparecer.
- Regras do Firestore publicadas a 25-11-2026 (18:55), a pedido do Kaizer.

## site-v3.6 · 25-11-2026 · a mesma estrutura no computador nos três
- **Grelha comum:** site, Study e Freelancer usam a mesma coluna lateral de 250 px, 36 px de intervalo e 1320 px de largura máxima, centrada. A barra lateral do site deixou de estar encostada à esquerda do ecrã.
- **Grupo «Apps PRONEX»** na barra lateral do Study e do Freelancer (`js/marca.js`), igual ao do site; no computador a faixa do topo dessas secções sai. No telemóvel fica como estava.
- **Study 1.48.0:** a versão nova entra sozinha (já não depende do botão «Atualizar»), salvo a meio de um exercício ou de um texto.
- **Freelancer 0.22.0:** «Os teus primeiros passos» numa linha que abre.
- Cache do site: `pronex-site-v11`.

## site-v3.5 · 25-11-2026 · o mesmo fundo nos três; Início do Study sem piscar
- **Site:** o fundo da página passa a ser o do Study e do Freelancer (os mesmos dois brilhos, no escuro e no claro) e a barra lateral assenta nesse fundo, sem cor própria nem risco. Cache `pronex-site-v10`.
- **Study 1.47.0:** o Início deixou de piscar (o cartão de instalar repetia a animação a cada redesenho; a página era construída um fotograma depois; os perfis dos colegas redesenhavam o Início a cada mudança, agora no máximo de 20 em 20 s). Ordem fixa: cumprimento e título, revisão de hoje, «O que estudas?» numa linha que abre, e o convite para instalar no fim. A escolha em «O que estudas?» já não se perde a meio.

## site-v3.4 · 25-11-2026 · o site com a estrutura da app PRONEX
- **Como o Study:** no computador, barra lateral fixa com o escudo, as páginas (com ícones), o grupo «Apps PRONEX» (Study e Freelancer) e, em baixo, o estado, a língua, o tema e o orçamento. No telemóvel e no tablet, barra de baixo com Início, Serviços, Study, Freelancer e «Mais» (abre o menu com o resto e os contactos).
- **Topo de cada página num cartão** com o degradé azul-violeta e a linha ciano → violeta, como o cartão de entrada do Study.
- **Tema escuro por omissão**, como as duas apps (o claro fica só quando se escolhe). A faixa Início · Study · Freelancer sai do site (continua nas apps, para voltar ao início).
- Grelhas que passavam a largura com a barra lateral (comparação de formatos, orçamento, contactos, passos) acertadas entre 960 e 1400 px. Cache `pronex-site-v9`.

## site-v3.3 · 24-11-2026 · a app PRONEX abre na marca; política de segurança
- **App PRONEX:** a faixa de abas Início · Study · Freelancer passa a estar também no site (26 páginas), por cima do cabeçalho; o logótipo do cabeçalho deixa de se repetir. Uma app instalada (incluindo ícones antigos do Study ou do Freelancer) abre sempre no início da marca.
- **Segurança:** nova política de segurança (`seguranca.html` e `en/security.html`) só com o que o código faz de facto, ligada no rodapé de todas as páginas, no sitemap e na política de privacidade do Study; `/.well-known/security.txt` com o contacto para reportar falhas. Cache `pronex-site-v8`.
- **Study 1.45.0:** abre dentro da app PRONEX; a aba «Site» chama-se «Início».
- **Freelancer 0.20.0:** só com conta (saiu «Experimentar sem conta»; o modo de demonstração fica só para testes em localhost); política de segurança de conteúdo (CSP) e `referrer` restrito.

## site-v3.2 · 24-11-2026 · auditoria, 2.ª ronda
Nova passagem com axe, Lighthouse, html-validate, ESLint e uma verificação dos alvos de toque (26 páginas do site em 4 larguras e 2 temas; ecrãs do Study e do Freelancer), já sobre a v3.1.
- **Site:** contactos do rodapé, «ligação direta» das perguntas, faixa de serviços e link «Manutenção» (Serviços) com pelo menos 24 px de altura também com rato; logótipo em WebP de 76 px (4 KB em vez de 9 KB, em 38 sítios); numeração das secções do CSS corrigida (havia duas «22»). Cache `pronex-site-v7`.
- **Study 1.44.1:** sem recarregamento inútil na primeira visita (FCP no telemóvel de 7,7 s para 2,6 s no Lighthouse); nomes acessíveis certos (XP, moedas, visita guiada, menu de baixo); escudo 4 vezes mais leve; 13 variáveis e funções mortas retiradas.
- **Freelancer 0.19.1:** links de texto com 24 px; nomes próprios para o menu de baixo e as áreas principais; escudo 4 vezes mais leve.

## site-v3.1 · 24-11-2026 · auditoria: tema comum e correções no site e nas duas secções
- **Tema comum:** a escolha claro/escuro fica em `pronex-tema-comum` e vale no site, no Study e no Freelancer.
- **Site:** título da página inicial com o que a PRONEX faz (PT e EN); descrições das páginas Study e Freelancer dentro do tamanho que o Google mostra; o resumo dessas páginas deixou de ser um `aside` dentro do conteúdo principal; a lista de valores (Sobre) recebe foco quando desliza no telemóvel; `clip` e `word-break: break-word` (obsoletos) trocados por `clip-path` e `overflow-wrap`.
- **Study 1.44.0:** zona principal (`main`) e título de nível 1 em todos os ecrãs; `type` em todos os botões; contraste do nome da liga no tema claro; alvos de toque e tamanhos de letra mínimos; 6 declarações de CSS repetidas ou obsoletas.
- **Freelancer 0.19.0:** uma proposta recusada por falha passageira volta a ser enviada inteira; `type` em todos os botões; o título do pedido deixou de ser um cabeçalho dentro de um botão; alvos de toque e tamanhos de letra mínimos.
- Cache do site: `pronex-site-v6`.

## site-v3.0 · 24-11-2026 · o site com o mesmo visual do Study e do Freelancer
- **Mesmas cores:** o site passa a usar a paleta das duas secções (fundo #090B1A, cartões #12152B, violeta #6F4FF2, ciano #7FE0FF; no tema claro #F4F5FA, #FFFFFF, violeta #5B3DF5). Rodapé, terminal, cabeçalho e cor da barra do navegador acompanham.
- **Mesmas letras:** títulos em Bricolage Grotesque (700/800), como nas secções; o texto continua em Inter. As letras são servidas pelo próprio site (`fontes/bricolage-latin-*.woff2`).
- **Mesmos botões e cantos:** botão principal violeta com base mais escura que afunda ao carregar; cantos de 12/18/24 px nos cartões.
- **Faixa de abas e ecrã de abertura das secções** (`css/marca.css`, igual no Study 1.43.1 e no Freelancer 0.18.1) usam as mesmas cores.
- Cache do site: `pronex-site-v5`.

## site-v2.5 · 24-11-2026 · organização simples: o site primeiro, o Study e o Freelancer lá dentro
- **A app instalada abre o site** (`start_url` "/"). A entrada `/app/` e a página `apps.html` deixam de existir como ecrãs: só reencaminham para o site.
- **Página inicial:** a secção «Study e Freelancer» fica só com os dois cartões (sai a faixa «Tudo numa só app»). O menu continua com «Study» e «Freelancer».
- **Dentro das secções:** as abas do topo passam a ser Site · Study · Freelancer; sai a lista que abria no nome da marca e a ligação repetida no fim do Início do Study.

## site-v2.4 · 24-11-2026 · a marca primeiro, com abas em todos os ecrãs
- **A app abre sempre no início da marca** (`app/index.html`): o escudo, PRONEX e um cartão para cada secção. Já não salta sozinha para a última secção; essa fica só marcada com «Continuar».
- **Abas da PRONEX em todos os ecrãs:** Início · Study · Freelancer, numa faixa no topo da entrada, do Study e do Freelancer (`css/marca.css` e `js/marca.js` das duas secções). Sai a meio de um exercício e numa conversa aberta no telemóvel, para dar espaço.
- Atalhos para o site (Serviços, Portfólio, Contacto) na entrada da app.

## site-v2.3 · 24-11-2026 · uma só app PRONEX, com Study e Freelancer
- **Uma só app, «PRONEX».** O manifesto do site (`site.webmanifest`) passa a ser o da app: abre em `/app/` e o âmbito é o site inteiro, por isso o Study, o Freelancer e o site abrem na mesma janela. Quem já tinha a Pronex_Study ou a Pronex_Link instalada recebe a atualização para «PRONEX».
- **Entrada da app** (`app/index.html`): a marca PRONEX e a escolha entre Study e Freelancer. Da segunda vez em diante abre logo a última secção usada. Substitui a app com separadores e molduras da v2.2 (escolha do Kaizer): cada secção abre em ecrã inteiro e mostra só a marca PRONEX, e o topo serve para trocar de secção. Saem `app/app.css`, `app/app.js` e `app/app.webmanifest`.
- **Menu:** «Study» e «Freelancer» no lugar de «Apps», cada um com a sua página (`study.html`, `freelancer.html`, `en/study.html`, `en/freelancer.html`). No computador o menu fica Serviços, Portfólio, Study, Freelancer, Sobre e Contacto; «Guias» passa para o menu do telemóvel e para o rodapé.
- Página inicial e `apps.html` («A app PRONEX») com os nomes das secções e os mesmos ícones do topo da app.
- **Logótipo:** o escudo de cristal com a coroa azul-clara passa a ser o do cabeçalho, do rodapé, da página Sobre, dos dados estruturados e dos ícones do site (favicon e ecrã principal).
- O service worker do site guarda a entrada da app e o escudo, para a app abrir sem internet.

## site-v2.2 · 24-11-2026 · a app PRONEX
- **App PRONEX** (`app/`, fonte em `fonte/app/`): as duas apps numa só, com um separador no topo para **Estudos** (Pronex_Study) e outro para **Freelancer** (Pronex_Link). Cada separador mostra a app verdadeira numa moldura do mesmo site: a conta é a mesma e trocar de separador não perde o que estava aberto.
- Instalável (`app/app.webmanifest`, nome «PRONEX»), com atalhos para cada separador; lembra o último separador usado; os links de uma app para a outra trocam de separador.
- Site: faixa «Tudo numa só app» na página inicial e na página Apps (PT e EN); atalho no manifesto do site.
- Pronex_Study 1.40.1 e Pronex_Link 0.15.1: dentro da app PRONEX, entrar com o Google por redirecionamento abre a app no ecrã inteiro (a página do Google não abre em molduras).

## site-v2.1.1 · 24-11-2026 · correções na entrada das apps
- Entre 960 e 1099 px de largura, o botão «Calcular orçamento» do cabeçalho partia em duas linhas depois de o menu ganhar «Apps»; os links do menu ficam mais juntos nessa largura e o botão fica numa linha.
- O cartão e o atalho da Pronex_Study mostram o ícone atual da app (`pronex_study/icons/v2/`).

## site-v2.1 · 24-11-2026 · apps da marca no site
- Página nova **Apps** (`apps.html` e `en/apps.html`) com a entrada nas duas apps: **Estudos** (Pronex_Study) e **Freelancer** (Pronex_Link), com a mesma conta.
- Secção «Apps PRONEX» na página inicial (PT e EN), «Apps» no menu e no rodapé de todas as páginas.
- Atalhos para as duas apps no manifesto do site (ao carregar sem largar no ícone do site instalado); sitemap e `llms.txt` atualizados.

## site-v2.0 · 23-11-2026 · as 100 melhorias

**Segurança**
- Regra CSP em cada página (só corre o código do próprio site) e política de referência.
- Formulários: pausa de 30 segundos entre envios, recusa de envios em menos de 3 segundos, campo-armadilha, número do pedido (PX-AAMMDD-XXXX).
- Ligações externas com `noopener noreferrer`; `security.txt`; Dependabot e CodeQL; testes que falham se faltar a CSP ou se uma imagem tiver metadados.
- Política de privacidade atualizada (GitHub Pages, email automático, o que fica guardado no navegador, transferências para fora da UE).

**Sistema**
- A versão comentada passou a viver no repositório (`fonte/`); o GitHub constrói, testa e publica sozinho.
- `.nojekyll`; saíram `_headers` e `_redirects` (só serviam no Netlify).
- Imagens em AVIF; fontes cortadas aos caracteres usados (−13 KB); carimbo `?v=` automático.
- Títulos pensados para pesquisa, tipo de página nos dados estruturados, imagem de partilha própria para cada página, `llms.txt`.
- Vigia de 6 em 6 horas; Lighthouse: desempenho 95, acessibilidade 100, boas práticas 100, SEO 100.

**Design**
- O polimento de 20-11 passou para as regras originais do CSS (sem camada por cima).
- Telemóvel com o LifeCatch ao lado do terminal no topo; logótipo do Sobre sem auréola nem flutuação.
- Títulos sem ponto final; etiquetas como comentários de código (`// Nome`), sem maiúsculas espaçadas.
- Escala de espaços em múltiplos de 4 px, três tamanhos de cantos, números com largura fixa.
- Tema claro mais azulado e cinzento pequeno mais escuro; WhatsApp só com o ícone; faixa de serviços com ligações.
- Tablet com preços em 2 colunas; impressão do orçamento só com a estimativa e os contactos.

**Mecânicas**
- Orçamento: copiar link, comparação ao trocar de formato, total do 1.º ano da manutenção, aviso calmo ao sair.
- Questionário guarda as respostas durante a visita e explica a sugestão.
- Perguntas frequentes com endereço próprio e botão de copiar; pesquisa nos guias; filtro do portfólio no endereço.
- Página de obrigado (formulários sem JavaScript) e email automático para o cliente.
- Marcação: botão para juntar a conversa ao calendário (.ics).
- Língua escolhida lembrada; atalho T para o tema; próxima vaga configurável; página do estado do projeto.
- Service worker do site: as páginas visitadas abrem sem rede.

## site-v1.1 · 20-11-2026 · polimento visual
- Cor de destaque sólida, sem brilhos nem animações em ciclo; endereço real (pronexprotocol-ui.github.io) nos dados para o Google.

## site-v1.0 · 21-10-2026 · primeira publicação no GitHub Pages
