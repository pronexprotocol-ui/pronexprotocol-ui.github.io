# Site PRONEX · histórico de alterações

Cada versão publicada tem uma etiqueta no GitHub (`site-v1.0`, `site-v2.0`…), para se poder voltar atrás.
As apps Pronex_Study e Pronex_Link têm o seu próprio histórico.

## 24-11-2026 · secção das apps

- Página inicial (PT e EN): secção «Apps PRONEX» com dois cartões, um para entrar na Pronex_Study e outro na Pronex_Link.
- Menu de todas as páginas: ligação «Apps» para essa secção.

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
