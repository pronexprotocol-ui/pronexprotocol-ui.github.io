# Pronex_Study · tarefas automáticas

Esta pasta não faz parte do site. São tarefas que o GitHub corre sozinho para a Pronex_Study.

| Tarefa | Quando | O que faz |
|---|---|---|
| `pronex-avisos.yml` | de 10 em 10 minutos | Envia para os telemóveis os avisos novos da coleção `notifs` (mesmo com a app fechada). |
| `pronex-copia.yml` | todos os dias às 03:17 UTC | Copia a base de dados toda, cifra a cópia com `BACKUP_PASS` e guarda-a 30 dias. |
| `pronex-testes.yml` | sempre que muda algo da Pronex_Study | Testa as regras do Firestore e estas tarefas no emulador. |

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
