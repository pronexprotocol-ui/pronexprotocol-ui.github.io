# PRONEX · site e Pronex_Study

Publicado com GitHub Pages em https://pronexprotocol-ui.github.io/

| Pasta / ficheiro | O que é |
|---|---|
| raiz (`index.html`, `servicos.html`, …) | Site da marca PRONEX |
| `en/` | Versão inglesa do site |
| `fontes/`, `imagens/` | Fontes e imagens do site |
| `pronex_study/` | App de estudo Pronex_Study, instalável no telemóvel: https://pronexprotocol-ui.github.io/pronex_study/ |
| `pronex_study/config.js` | Ligação ao Firebase (contas, conversa, ranking e IA) |
| `fonte/` | **Versão comentada do site** (a que se edita). O GitHub gera a partir dela a versão publicada na raiz |
| `sw.js` (raiz) | Service worker do site: guarda as páginas para abrirem sem rede. Não toca nas apps |
| `estado.html`, `estado/projetos.json` | Página do estado do projeto de cada cliente |
| `.github/site/`, `.github/workflows/site-*.yml` | Testes, construção, vigia e análise de segurança do site |

## Atualizar a Pronex_Study
Mudar a versão em `pronex_study/sw.js` (`VERSION`) e em `pronex_study/js/04-ecras.js` (`APP_VERSION`). Quem tem a app instalada vê o aviso "Nova versão disponível". A organização dos ficheiros da app está em `pronex_study/ESTRUTURA.md`.

## Site PRONEX: como trabalhar

**Edita só a pasta `fonte/`** (HTML, CSS e JS com os comentários). Ao fazer commit, o workflow
`Site PRONEX · construir e publicar` faz o resto sozinho:

1. corre `fonte/_nao-publicar/construir.js`, que tira os comentários, encolhe o CSS e o JS,
   calcula o carimbo `?v=` e junta a regra de segurança CSP a cada página;
2. corre os testes (`.github/site/testes.js`): 20 páginas em 3 larguras e 2 temas, preços do
   orçamento, acessibilidade (axe), CSP, referência, `_next` dos formulários e metadados das imagens;
3. se tudo passar, escreve a versão publicada na raiz e o GitHub Pages põe-na no ar.

Se um teste falhar, nada é publicado e chega um email.

**Ver no PC antes de publicar:**
```
cd fonte/_nao-publicar && npm install
node construir.js .. ../../_teste
cd ../../_teste && python -m http.server 8000      # abrir http://localhost:8000
```

Outros workflows do site: `site-vigia` (de 6 em 6 horas confirma que as páginas respondem),
`site-codeql` (análise de segurança do JavaScript) e o Dependabot (`.github/dependabot.yml`).
O histórico das alterações está em `CHANGELOG.md`.
