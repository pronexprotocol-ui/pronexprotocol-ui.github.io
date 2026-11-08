# Pronex_Study · como funcionam os pontos, ligas e rankings

Documento de referência para continuar o desenvolvimento (versão 1.19.0, 8 nov 2026).
O código está todo em `pronex_study/index.html`; as regras do servidor em `.github/pronex/regras/firestore.rules`;
as tarefas automáticas em `.github/pronex/*.mjs` e `.github/workflows/pronex-*.yml`.

## 1. Do exercício ao XP

1. Responder chama `record(t, n, g, modo)`.
   - Se o exercício já foi feito neste dispositivo (`st.seen`), conta como repetido (`rt: 1`) e vale 0 XP.
2. O item `{ts, t, tn, tema, q, esc, cert, ok, mode, rt?}` entra em `HIST` no dia de hoje (data do telemóvel).
3. `persistDay` → `putDay` grava em `data/users/{uid}/dia_AAAA-MM-DD` com `arrayUnion`.
   - Junta ao que já está no servidor; nunca substitui.
   - A app remove itens duplicados por `ts|q` ao ler.
   - Máximo de 400 itens por dia (regra `docOk`).
4. O XP é sempre recalculado a partir do histórico (`X16.ledger`). O servidor nunca soma.

| Antes de 7 nov 2026 | Desde 7 nov 2026 |
|---|---|
| certa +10 | certa +10 (simulação/exame `mode:'sim'` +20) |
| errada +2 | errada 0 |
| simulação completa (≥14 respostas na mesma hora) +50 | 3.ª certa seguida em diante: +2, +4, … até +10 |

- Missões cumpridas: +20 cada (`missionsFor`).
- Repetidos: 0.
- O total, a semana (`X16.week`), o mês (`X16.month`) e o tema (`X16.tema`) saem todos do mesmo `ledger`.

## 2. Do XP ao ranking: `perfis/{uid}`

`syncProfile` escreve o perfil público.

Campos:
- `xp`, `nivel`, `streak`, `streakEm`, `total`, `certos`, `badges`
- `wk` / `wxp`: semana (segunda-feira AAAA-MM-DD) e XP dessa semana
- `mk` / `mxp`: mês (AAAA-MM) e XP desse mês
- `tx`: XP por tema
- `pwk` / `pwxp`: cópia da semana anterior, escrita ao mudar de semana
- `xpIni` / `xpIniEm`: XP no início do dia (UTC), para o teto diário
- `ranking`, `nick`, `cor`, `foto`, `bio`, `curso`, `escola`, `top`

Limites que as regras impõem (`subidaOk`, `diaXpOk`, `sequenciaOk`):
- O XP nunca desce. Sobe no máximo +250 por escrita e +5000 por dia UTC. A app envia em parcelas e repete (até 40 vezes seguidas).
- `wxp` e `mxp` sobem no máximo +250 por escrita dentro da mesma semana ou mês.
- `wk` e `mk` nunca andam para trás.
- `pwk` / `pwxp` só podem ser a cópia exata de `wk` / `wxp` no momento em que a semana muda.
- A sequência sobe +1 uma vez por dia, ou desce.
- Criar o perfil exige conta confirmada, consentimento e não estar suspenso, e começa com no máximo 250 XP.

Erros:
- Se a escrita for recusada, a app tenta outra vez sem `top` e guarda o motivo em `window.SYNC_ERR`.
- O ranking mostra o aviso «Os pontos não estão a chegar ao ranking», com o motivo.

## 3. Rankings (separador Ranking da Comunidade)

Fonte: `PERFIS`, que junta duas consultas:
- `perfis` ordenados por `xp` (300 primeiros)
- `perfis` ordenados por `wxp` (150 primeiros)

O perfil do próprio (`MYP`) entra sempre. A linha do próprio usa o máximo entre o servidor e o que o telemóvel conta.

| Separador | Pontuação |
|---|---|
| A tua liga | `wxp` se `wk` for a semana atual; só membros do teu grupo (`config/ligas`) |
| Semana | igual, só quem tem > 0 |
| Mês | `mxp` se `mk` for o mês atual |
| Sempre | `xp` |
| Acerto | `certos/total`, só com 20 ou mais respostas |
| Sequência | `streak`; 0 se `streakEm` tiver mais de ~2 dias |
| Por tema | `tx[tema]` |

Ficam de fora: sem `nick`, `ranking: false` ou `banned: true`.

## 4. Ligas (`.github/pronex/ligas.mjs`, todos os dias às 00:07 UTC)

- 5 ligas: Bronze, Prata, Ouro, Safira, Diamante. Grupos de até 12 alunos da mesma liga.
- Na primeira execução de cada semana (segunda-feira de Lisboa, `semanaDe`) fecha a semana anterior.
- O XP da semana que acabou é `wxp` se `wk === semana`; senão `pwxp` se `pwk === semana`; senão 0.
- Em cada grupo sobem os 1–3 primeiros (só se tiverem XP > 0 e estiverem ativos, +15 moedas) e descem os 1–3 últimos.
- Pódio da turma: 30, 20 e 10 moedas, com medalha de ouro, prata e bronze.
- Os prémios vão para `premios/{uid}` e não se repetem para a mesma semana e motivo.
- Nos outros dias só junta alunos novos e tira contas apagadas.
- Resultado guardado em `config/ligas`: `semana`, `grupos`, `tierDe`, `anterior`.

## 5. Moedas e baús

- Ficam só no telemóvel (localStorage): `x12-chest`, `x12-spent`, `x12-top`.
- Moedas ganhas:
  - +10 por dia com o objetivo cumprido; senão +3 com 5 ou mais exercícios novos.
  - Baús abertos.
  - Prémios das ligas copiados de `premios/{uid}`.
- Baús: recordes de sequência de 3, 7, 14, 30, 60 e 100 dias.
- **Ponto aberto:** passar moedas e baús para o servidor (`data/users/{uid}/loja`, com regra nova) para não dependerem do dispositivo.

## 6. Duelos e salas

- `duelos/{id}`: `a` desafia `b`; os dois fazem os mesmos 5 exercícios (semente `seed`).
  - Cada um escreve o seu resultado uma única vez: `ra` / `rb`, de 0 a 5.
  - Se o envio falhar, fica em `x19-dp` e é reenviado.
  - A limpeza apaga duelos com mais de 30 dias.
- `salas/{id}`: temporizador partilhado (`fim`, `min`, `membros`).
  - A app só lista salas ativas.
  - A limpeza apaga as que acabaram há mais de um dia.

## 7. Grupos de estudo

- `grupos/{g_código}`: `nome`, `dono`, `membros`, `expulsos`, `ts`, `apagado`.
- O código tem 12 ou mais letras e números e só quem o tem entra.
- O dono tira alguém → `expulsos.{uid} = true`; a pessoa não volta a entrar com o código até o dono a «Deixar voltar».
- O chat do grupo está em `canais/{g_código}/msgs`.
- Grupos apagados e grupos antigos de código curto são fechados e limpos por `limpeza.mjs`.

## 8. Pontos abertos (por ordem de prioridade)

1. Moedas e baús no servidor (ver 5).
2. Datas (dia, semana, mês) sempre no fuso de Lisboa em vez do fuso do telemóvel.
3. Duelos: usar sempre a mesma variante dos exercícios para os dois jogadores (hoje depende de «Gerar exercícios novos»).
4. «Repetido» por conta e não por dispositivo (guardar a chave do exercício no item do histórico).
5. Dias com mais de 400 exercícios: dividir em vários documentos.
6. Aviso de cache: o adaptador do Firestore não passa `metadata` (por isso `HISTSRV` é sempre verdadeiro).

## 9. Testes

- Regras: `.github/pronex/regras/rules.test.js`
- Tarefas: `.github/pronex/teste-tarefas.mjs`
- App: `.github/pronex/app/e2e.mjs` e `entrada-iphone.mjs`

Correm no GitHub Actions («Pronex_Study · testes») com o Firebase simulado, em cada alteração.
