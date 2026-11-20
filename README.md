# PRONEX · site e Pronex_Study

Publicado com GitHub Pages em https://pronexprotocol-ui.github.io/

| Pasta / ficheiro | O que é |
|---|---|
| raiz (`index.html`, `servicos.html`, …) | Site da marca PRONEX |
| `en/` | Versão inglesa do site |
| `fontes/`, `imagens/` | Fontes e imagens do site |
| `pronex_study/` | App de estudo Pronex_Study, instalável no telemóvel: https://pronexprotocol-ui.github.io/pronex_study/ |
| `pronex_study/config.js` | Ligação ao Firebase (contas, conversa, ranking e IA) |
| `sw.js` (raiz) | Limpa a app de estudo de quem a abriu por engano no endereço do site. Pode ser apagado daqui a umas semanas. |

## Atualizar a Pronex_Study
Mudar a versão em `pronex_study/sw.js` (`VERSION`) e em `pronex_study/js/04-ecras.js` (`APP_VERSION`). Quem tem a app instalada vê o aviso "Nova versão disponível". A organização dos ficheiros da app está em `pronex_study/ESTRUTURA.md`.

## Melhorias do site (20-11-2026)

Feitas diretamente na versão publicada, porque a pasta com a versão comentada (`site-pronex`) não estava acessível. Ao passar para a versão comentada, aplicar o mesmo:

- `style.css`: bloco "POLIMENTO VISUAL" no fim do ficheiro (já comentado). Tira os degradês de texto e de botões, os brilhos e bolhas de luz do topo, as animações em ciclo da faixa de serviços e do indicador de deslizar e as maiúsculas espaçadas. As etiquetas passam a `// Nome`, como comentários de código. O rodapé fica em 2 colunas no telemóvel.
- `index.html` e `en/index.html`: título sem `data-scramble` (deixa de trocar de frase sem parar); ligações por baixo das perguntas com a classe `formats-more-link--pair`, sem o "·".
- Todas as páginas: botão do WhatsApp dentro de `<aside class="wa-float-wrap" aria-label="WhatsApp">` e botão "Voltar ao topo" dentro de `<nav class="to-top-wrap">`; os `<aside>` dentro de `<main>` (estimativa, resumo da marcação e resumo da privacidade) com `role="region"`.
- Endereço oficial: `https://pronex.pt` trocado por `https://pronexprotocol-ui.github.io` (canonical, hreflang, Open Graph, dados estruturados, `sitemap.xml` e `robots.txt`).
- `script.js`: o aviso "Also available in English" ganhou `role="region"` e `aria-label`.
