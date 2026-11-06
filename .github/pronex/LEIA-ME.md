# Pronex_Study · tarefas automáticas

Esta pasta não faz parte do site. São tarefas que o GitHub corre sozinho para a Pronex_Study.

| Tarefa | Quando | O que faz |
|---|---|---|
| `pronex-avisos.yml` | de 10 em 10 minutos | Envia para os telemóveis os avisos novos da coleção `notifs` (mesmo com a app fechada). |
| `pronex-copia.yml` | todos os dias às 03:17 UTC | Copia a base de dados toda, cifra a cópia com `BACKUP_PASS` e guarda-a 30 dias. |
| `pronex-ligas.yml` | todos os dias às 00:07 UTC | Fecha a semana das ligas (subidas, descidas, medalhas e moedas do pódio) e faz os grupos. Escreve `config/ligas` e `premios/{uid}`. |
| `pronex-testes.yml` | sempre que muda algo da Pronex_Study | No Firebase simulado: testa as regras, estas tarefas e o restauro, e faz o ensaio completo da app no Chrome. |

## Segredos (Settings → Secrets and variables → Actions)

- `FIREBASE_SA`: chave da conta de serviço do Firebase (JSON). Dá acesso total à base de dados. Nunca a partilhar.
- `BACKUP_PASS`: palavra-passe da cópia de segurança (mínimo 16 caracteres). Guardá-la num gestor de palavras-passe: sem ela, as cópias não abrem.

Nada destas tarefas escreve dados dos alunos nos registos: o repositório é público.

## Abrir uma cópia de segurança

1. Actions → "Pronex_Study · cópia de segurança" → escolher o dia → descarregar o artifact (vem num .zip).
2. Tirar do .zip o ficheiro `pronex-copia-AAAA-MM-DD.json.gz.enc`.
3. Num terminal (Linux, macOS ou Git Bash no Windows):

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in pronex-copia-AAAA-MM-DD.json.gz.enc -out copia.json.gz
gunzip copia.json.gz
```

O `copia.json` tem todas as coleções. Datas aparecem como `{"__ts": milissegundos}`.

## Repor uma cópia de segurança

`restaurar.mjs` volta a escrever os dados de um `copia.json`. Sem o emulador, recusa-se a correr, a não ser que se escreva de propósito:

```
RESTAURAR_CONFIRMO=restaurar-base-real FIREBASE_SA='...' node restaurar.mjs copia.json
```

Substitui os documentos com o mesmo caminho e não apaga os que entretanto foram criados. O teste do restauro corre sempre em `teste-tarefas.mjs`.

## Testar no computador

Precisa de Node 22, Java 11 ou mais recente e Chrome.

```
cd .github/pronex/regras && npm ci && npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-pronex "npx mocha rules.test.js --timeout 20000"
cd .github/pronex && npm ci && npx firebase-tools@13.35.1 emulators:exec --only firestore --project demo-pronex --config regras/firebase.json "node teste-tarefas.mjs"
cd .github/pronex/app && npm ci && npx firebase-tools@13.35.1 emulators:exec --only auth,firestore --project demo-pronex --config ../regras/firebase.json "node e2e.mjs"
```

## Publicar uma versão sem surpresas

1. Trabalhar num ramo próprio e só integrar no ramo principal com os testes a passar: tudo o que chega ao ramo principal fica logo publicado.
2. Se a versão exigir regras novas, publicar **primeiro a app**, que tem de funcionar com as regras antigas e as novas, e só depois as regras.
3. Subir a versão mínima no Painel quando já não fizer falta suportar as versões anteriores.

**Voltar atrás:** `git revert` do que foi publicado, com um número de versão novo em `sw.js` e `APP_VERSION`, para os telemóveis receberem a correção. As regras recuperam-se no histórico da consola do Firebase.

## Limite das regras

O Firestore só avalia 1000 expressões por pedido. Uma escrita de perfil completa tinha folga para entre 40 e 60 comparações a mais, medida a 6 de novembro de 2026. Antes de acrescentar validações a `perfilOk` ou `subidaOk`, confirmar que os testes dos perfis continuam a passar. Se o limite for ultrapassado, o perfil deixa de sincronizar sem aviso.
