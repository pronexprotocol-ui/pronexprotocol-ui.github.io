# PRONEX · regras para quem mexe neste repositório

## Regra fixa (25-11-2026, pedida pelo Kaizer)
Nenhuma atualização do site, do Study (`pronex_study/`) ou do Freelancer (`pronex_link/`) pode perder registos dos
utilizadores: pedidos, propostas, trabalhos, entregas, conversas, portefólio e progresso de estudo.

Na prática:
- Não mudar nem apagar as chaves onde os dados ficam guardados (`localStorage`, IndexedDB e coleções do Firestore).
- Uma versão nova pode acrescentar campos; não pode remover nem renomear campos existentes.
- Antes de converter dados para um formato novo, guardar uma cópia do formato antigo e só a apagar depois de confirmar a conversão.
- A troca de versão (service worker) limpa só a cache dos ficheiros da app, nunca os dados.
- Não publicar sem um teste que abra a versão nova por cima de dados da versão anterior e confirme que nada falta.
- Apagar dados de um utilizador só a pedido dele, com confirmação.

## Outras regras
- Site, Study e Freelancer são tratados em conjunto: cada alteração é feita e testada nos três.
- `css/marca.css` e `js/marca.js` têm de ser iguais byte a byte no Study e no Freelancer.
- As regras do Firestore só são publicadas pelo Kaizer ou com a autorização dele.
- Sem IA na nuvem dentro da app; sem segredos no código.
