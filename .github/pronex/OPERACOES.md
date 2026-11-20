# Pronex_Study · operações

Para quando algo corre mal e para confirmar que a app faz o que a política de privacidade promete. Segue os modelos do guia «How to Build an App» (plano de incidentes, mapa de dados e lista final de lançamento), aplicados a esta app. Publicar, recuar uma versão, abrir e repor cópias de segurança está no [LEIA-ME](LEIA-ME.md).

## 1. Incidente de segurança ou de dados

Contam como incidente, entre outros: a chave `FIREBASE_SA` ficar exposta, alguém conseguir ler ou mudar dados de outra pessoa, regras publicadas com um erro, dados apagados por engano, a conta do administrador ser usada por outra pessoa.

**1. Perceber o que aconteceu.** O quê, desde quando, que dados e quantas contas. Onde ver:
- Actions → «Pronex_Study · auditoria da base de dados» → Run workflow (só lê);
- painel da app → Sistema (erros da app) e Moderação (registo de auditoria do administrador);
- consola do Firebase → Authentication e Firestore → Utilização.

**2. Parar o problema, já.**

| Situação | O que fazer |
|---|---|
| Chave `FIREBASE_SA` exposta | Google Cloud → IAM → Contas de serviço → apagar essa chave. Criar uma nova e trocar o segredo no GitHub (Settings → Secrets). |
| Regras deixam ler ou escrever o que não deviam | Consola do Firebase → Firestore → Regras → repor a versão anterior do histórico. Confirmar com «verificar regras». |
| Conta Google do administrador | Mudar a palavra-passe, terminar as outras sessões em myaccount.google.com, ligar a verificação em dois passos e mudar o PIN do painel. |
| Um aluno a abusar | Suspender a conta no painel. |
| Versão da app com defeito grave | Publicar a correção com número de versão novo (LEIA-ME, «Voltar atrás») e subir a versão mínima no painel. |
| Dados apagados ou estragados | Repor a cópia do dia anterior (LEIA-ME, «Repor uma cópia de segurança») e voltar a aplicar o que foi decidido depois dela. |

**3. Avisar quem é preciso.**
- Se houve violação de dados pessoais, notificar a CNPD até **72 horas** depois de se saber, a não ser que não haja risco para as pessoas (art. 33.º do RGPD). Formulário em cnpd.pt.
- Se o risco para as pessoas for elevado, avisá-las sem demora (art. 34.º): aviso na app para todos e email a quem tem conta com email. Muitos alunos são menores, por isso o texto tem de ser claro para quem tem 13 anos.
- Mesmo sem notificação, o incidente fica registado (art. 33.º, n.º 5).
- Em caso de dúvida, pedir aconselhamento jurídico.

**4. Corrigir a causa** e acrescentar um teste ao CI que apanhe o mesmo problema.

**5. Registar**, fora deste repositório (é público):

```
O que aconteceu:
Quando foi detetado (data e hora):
Quem é afetado (número de contas):
Que dados ou sistemas:
O que se fez para parar:
Quem foi avisado e quando (CNPD, alunos):
Causa:
Correção e como se confirmou:
O que muda para não voltar a acontecer:
```

## 2. O que a política de privacidade promete e como se cumpre

Secção 7 da [política](../../pronex_study/legal/privacidade.html#prazos). Revisto a 20 de novembro de 2026 (versão 1.38).

| Promessa | Como se cumpre | Estado |
|---|---|---|
| Apagar a conta tira os dados de imediato | Botão «Apagar conta» nas Definições | Cumpre |
| Cópias de segurança: 30 dias | `pronex-copia.yml`, `retention-days: 30` | Cumpre |
| Ligas e prémios: últimas 60 entradas | `ligas.mjs`, `hist.slice(-60)` | Cumpre |
| Sugestões e relatórios de erros: 12 meses | `limpeza.mjs` | Cumpre |
| Salas: um dia depois de acabarem; duelos: 30 dias | `limpeza.mjs` | Cumpre (texto da política corrigido na 1.38) |
| Suspensões: até 12 meses depois de terminarem | `limpeza.mjs` (`bans`, `bansEmail`) | Cumpre |
| Conversa com o Nex só no dispositivo | `limpeza.mjs` apaga as cópias antigas que ficaram na base de dados | Cumpre |
| Denúncias: 12 meses depois da decisão | Ao decidir, a denúncia sai. As que passam de 12 meses saem quando o administrador abre o painel (só as 60 mais recentes) | Em parte. A auditoria conta as que passaram do prazo |
| Registo de auditoria do administrador: 12 meses | As regras não deixam apagar e nenhuma tarefa o faz | **Falta.** A auditoria conta os registos fora do prazo |
| Conta com email parada 12 meses: aviso; 6 meses depois, apagada | Nenhuma tarefa. A app não envia emails; o aviso no dispositivo só chega a quem o ativou | **Falta.** A auditoria conta as contas paradas há mais de 18 meses |
| Conta automática sem email parada 12 meses: apagada | Nenhuma tarefa | **Falta.** A auditoria conta-as |

Os três «Falta» só contam quando os primeiros dados passarem do prazo. Ligar a eliminação automática destes dados em `limpeza.mjs` é uma decisão do Kaizer, porque apaga dados de forma permanente. Até lá, a auditoria semanal falha e o GitHub avisa por email quando aparecer o primeiro caso.

## 3. Lista final de lançamento (guia, secção 50)

| Ponto | Na Pronex_Study |
|---|---|
| O percurso principal funciona do início ao fim | Ensaio completo no Chrome a cada alteração (`app/e2e.mjs`) |
| Testada em dispositivos e ecrãs diferentes | Entrada no iPhone com a app instalada (`app/entrada-iphone.mjs`), capturas a 390 e 1280 px. Os testes em telemóveis reais são do Kaizer |
| Entrada, recuperação da palavra-passe e da conta | Firebase Authentication, com mensagens de erro em português |
| Permissões verificadas no servidor | Regras do Firestore, testadas no CI (`regras/rules.test.js`) |
| Dados protegidos em trânsito e guardados | HTTPS no GitHub Pages; o Firestore cifra os dados; cópias cifradas com `BACKUP_PASS` |
| Chaves fora do código | Só a configuração pública do Firebase está no código. `FIREBASE_SA` e `BACKUP_PASS` são segredos do GitHub; `config/ai` está fechado |
| Política de privacidade e termos publicados | `pronex_study/legal/` |
| Registo de erros | Relatórios de erros da app no painel (Sistema), sem serviços de terceiros |
| Cópias de segurança e restauro testado | Cópia diária; o CI testa o restauro (`teste-tarefas.mjs`) |
| Contacto e sugestões | Email na política, «Sugestões e problemas» na app, «Reportar erro neste exercício» |
| Plano para voltar atrás e para incidentes | LEIA-ME («Voltar atrás») e a secção 1 deste ficheiro |
| Desempenho vigiado | Orçamento de desempenho no CI (`orcamento.mjs`) |
| Dependências controladas | Versões fixas (Firebase 12.19.0, WebLLM 0.2.86, Pyodide 0.26.4), QRCode.js guardado na app, ações do GitHub fixas por SHA; o CI recusa endereços de CDN sem versão |
| Verificação em dois passos do administrador | Depende da conta Google do Kaizer: o plano gratuito do Firebase não tem verificação em dois passos própria |
