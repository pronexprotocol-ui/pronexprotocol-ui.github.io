/* Pronex_Study · 02-matematica-formulas.js
   Matemática: cartões de fórmula, lista de tipos de exercício e ajudas passo a passo.
   Os ficheiros js/01 a js/11 correm por esta ordem e partilham as mesmas variáveis globais (ver ESTRUTURA.md). */

/* ---------- Cartões de fórmula ---------- */
const V=(t,c)=>'<span class="fv c'+c+'">'+t+'</span>';
const F=(a,b)=>'<span class="fr"><span>'+a+'</span><span>'+b+'</span></span>';
const ln=(...x)=>'<div class="ln">'+x.join(' ')+'</div>';
const lb=t=>'<div class="lbl">'+t+'</div>';
const HELP={
 vve:{n:'Votos validamente expressos',t:'Eleições',f:ln(V('VVE',1),'=',V('votantes',2),'−',V('brancos',3),'−',V('nulos',4)),
   vars:[[V('VVE',1),'os votos que contam para os candidatos'],[V('votantes',2),'quem foi votar (não os inscritos)'],[V('brancos',3),'boletim sem marca'],[V('nulos',4),'boletim com marca inválida']],
   steps:['Encontra os votantes na tabela.','Tira os brancos e os nulos.','Confirma: a soma dos votos dos candidatos tem de dar o VVE.'],trap:'Começar nos inscritos ou esquecer um dos dois (brancos ou nulos).'},
 abst:{n:'Percentagem de abstenção',t:'Eleições',f:ln('% abstenção','=',F(V('inscritos',1)+' − '+V('votantes',2),V('inscritos',1)),'× 100'),
   vars:[[V('inscritos',1),'quem podia votar'],[V('votantes',2),'quem votou']],
   steps:['Subtrai primeiro: inscritos − votantes (pessoas que não votaram).','Divide pelos inscritos e multiplica por 100.','Controlo: % abstenção + % participação = 100%.'],trap:'Calcular votantes ÷ inscritos dá a % de quem VOTOU, que é o contrário.',calc:'(inscritos−votantes)÷inscritos×100'},
 pctc:{n:'Percentagem de um candidato',t:'Eleições',f:ln('% de X','=',F(V('votos de X',1),V('VVE',2)),'× 100'),
   vars:[[V('votos de X',1),'votos do candidato'],[V('VVE',2),'votantes − brancos − nulos']],
   steps:['Calcula primeiro o VVE.','Divide os votos do candidato pelo VVE.','Multiplica por 100 e arredonda às décimas só no fim.'],trap:'Dividir pelos votantes ou pelos inscritos.'},
 maj:{n:'Maioria absoluta',t:'Eleições',f:lb('Mínimo de votos')+ln(V('VVE',1),'÷ 2')+'<div class="branch"><div>deu inteiro → +1</div><div>deu decimal → arredonda para cima</div></div>',
   vars:[[V('VVE',1),'votos validamente expressos']],
   steps:['Calcula o VVE e o mínimo (mais de metade).','Compara o mais votado com o mínimo.','Se chega ao mínimo: ganha à 1.ª volta.','Se não chega: 2.ª volta só com os DOIS mais votados.'],trap:'O mais votado não ganha automaticamente. Isso é a maioria SIMPLES.'},
 simples:{n:'Maioria simples (com boletins)',t:'Eleições',f:ln('Vencedor','=','mais votos na linha da',V('1.ª preferência',1)),
   vars:[[V('1.ª preferência',1),'primeira linha da tabela de boletins']],
   steps:['Olha só para a linha da 1.ª preferência.','Para cada candidato, soma os votos de TODAS as colunas onde aparece em 1.º.','Ganha quem tem mais.'],trap:'Ver só a coluna com mais votos e esquecer que o candidato aparece noutra coluna.'},
 borda:{n:'Método de Borda',t:'Eleições',f:ln('Pontos de X','=','Σ','(',V('votos da coluna',1),'×',V('pontos da posição de X',2),')')+
   '<div class="tbl" tabindex="0" role="region" aria-label="Tabela" style="margin:0"><table class="mini"><thead><tr><th>Posição</th><th>1.º</th><th>2.º</th><th>3.º</th><th>4.º</th></tr></thead><tbody><tr><td class="l"><b>3 candidatos</b></td><td class="hl1">3</td><td>2</td><td>1</td><td>—</td></tr><tr><td class="l"><b>4 candidatos</b></td><td class="hl1">4</td><td>3</td><td>2</td><td>1</td></tr></tbody></table></div>',
   vars:[[V('votos da coluna',1),'número no topo da coluna'],[V('pontos da posição de X',2),'onde X está nessa coluna']],
   steps:['Escreve os pontos ao lado de cada linha (o 1.º lugar tem MAIS pontos).','Para cada candidato percorre TODAS as colunas: votos × pontos.','Soma tudo e ganha quem tem mais pontos.','Controlo: total de pontos = votos × 6 (3 candidatos) ou × 10 (4 candidatos).'],trap:'Inverter os pontos (dar 1 ao 1.º lugar) ou esquecer uma coluna.'},
 menos:{n:'Candidato menos desejado',t:'Eleições',f:ln('Menos desejado','=','mais votos na',V('última linha',4)),
   vars:[[V('última linha',4),'3.ª preferência (ou 4.ª com 4 candidatos)']],
   steps:['Olha só para a última linha.','Para cada candidato, soma os votos de TODAS as colunas onde está em último.','O que tem a maior soma é o menos desejado.'],trap:'Escolher o candidato que está em último na coluna com mais votos, sem somar as outras.'},
 hondt:{n:'Método de Hondt',t:'Partilha',f:ln('quociente','=',F(V('votos',1),V('1, 2, 3, 4…',2))),
   vars:[[V('votos',1),'votos (ou alunos, habitantes…) de cada lista'],[V('1, 2, 3, 4…',2),'divisores']],
   steps:['Faz uma tabela: linhas = listas, colunas = divisores 1, 2, 3…','Escolhe os m maiores quocientes de toda a tabela (m = lugares).','Conta quantos quocientes escolhidos tem cada lista.','Empate no último lugar: fica a lista com menos votos.'],trap:'Escolher por lista em vez de olhar para a tabela inteira. Favorece os MAIORES.'},
 sl:{n:'Método de Sainte-Laguë',t:'Partilha',f:ln('quociente','=',F(V('votos',1),V('1, 3, 5, 7…',2))),
   vars:[[V('votos',1),'votos de cada lista'],[V('1, 3, 5, 7…',2),'só números ímpares']],
   steps:['Divide pelos números ímpares 1, 3, 5, 7…','Escolhe os m maiores quocientes de toda a tabela.','Conta por lista.'],trap:'Usar 1, 2, 3 (isso é Hondt). Sainte-Laguë favorece os MENORES.'},
 falta:{n:'Votos a mais para 1 lugar (Hondt)',t:'Partilha',f:ln('a mais','=','(',V('último quociente escolhido',1),'→ próximo inteiro )','−',V('votos atuais',2)),
   vars:[[V('último quociente escolhido',1),'o m-ésimo maior quociente'],[V('votos atuais',2),'o que a lista já tem']],
   steps:['Aplica o Hondt e encontra o último quociente escolhido.','A lista (com divisor 1) tem de ULTRAPASSAR esse valor.','Subtrai os votos que já tem.'],trap:'Dar o total em vez do "a mais", ou ficar igual ao quociente (não chega).'},
 liq:{n:'Salário líquido',t:'Finanças',f:ln('Bruto total','=',V('base',1),'+',V('subsídio',2))+ln('Líquido','=','Bruto total','−',V('base',1)+'×0,11','−',V('base',1)+'×'+V('taxa IRS',3)),
   vars:[[V('base',1),'salário base'],[V('subsídio',2),'dias × valor por dia'],[V('taxa IRS',3),'em decimal (9% = 0,09)']],
   steps:['Subsídio = dias × valor/dia.','Bruto total = base + subsídio.','SS = base × 0,11 e IRS = base × taxa.','Líquido = bruto total − SS − IRS.'],trap:'Aplicar a SS e o IRS ao bruto total. Os descontos são só sobre a BASE.'},
 hora:{n:'Salário bruto por hora',t:'Finanças',f:ln('€/hora','=',F(V('SB',1)+' × 12','52 × '+V('h semanais',2))),
   vars:[[V('SB',1),'salário bruto mensal'],[V('h semanais',2),'horas por semana (ex.: 40)']],
   steps:['Multiplica o salário por 12 (salário anual).','Multiplica 52 pelas horas semanais (horas por ano).','Divide.'],trap:'Dividir por 4 semanas (160 h). Um mês tem mais de 4 semanas.',calc:'SB×12÷(52×h)'},
 ret:{n:'Retenção na fonte com tabela',t:'Finanças',f:ln('r','=',V('SB',1),'×',V('taxa marginal',2),'−',V('parcela a abater',3),'−',V('n.º dep.',4),'× 21,43'),
   vars:[[V('SB',1),'salário bruto'],[V('taxa marginal',2),'da linha da tabela'],[V('parcela a abater',3),'da mesma linha'],[V('n.º dep.',4),'dependentes (lê bem o enunciado)']],
   steps:['Escolhe a linha: a 1.ª cujo "Até" é maior que o salário.','Multiplica o salário pela taxa dessa linha.','Tira a parcela a abater.','Tira 21,43 € por cada dependente.'],trap:'Fazer só a multiplicação, ou contar mal os dependentes.'},
 efet:{n:'Taxa efetiva de retenção',t:'Finanças',f:ln('taxa efetiva','=',F(V('r',1),V('SB',2)),'× 100'),
   vars:[[V('r',1),'valor retido (já com as parcelas)'],[V('SB',2),'salário bruto']],
   steps:['Calcula r com a tabela (multiplicação e duas subtrações).','Divide r pelo salário e multiplica por 100.'],trap:'Responder com a taxa marginal da tabela. A efetiva é sempre mais baixa.'},
 irs:{n:'IRS anual: coleta líquida',t:'Finanças',f:lb('1. Rendimento coletável')+ln(V('bruto anual',1),'− 4587,09')+lb('2. Coleta')+ln(V('limite anterior',2),'×',V('taxa MÉDIA anterior',3),'+','(coletável −',V('limite anterior',2)+')','×',V('taxa MARGINAL tua',4))+lb('3. Coleta líquida')+ln('Coleta − deduções')+
   '<div class="tbl" tabindex="0" role="region" aria-label="Tabela" style="margin:0"><table class="mini"><thead><tr><th>Escalão</th><th>Até</th><th>Marginal</th><th>Média</th></tr></thead><tbody><tr><td class="l"><b>Anterior</b></td><td class="hl1">limite anterior</td><td>—</td><td class="hl1">usa esta</td></tr><tr><td class="l"><b>O teu</b></td><td>—</td><td class="hl2">usa esta</td><td>—</td></tr></tbody></table></div>',
   vars:[[V('limite anterior',2),'fim do escalão de cima'],[V('taxa MÉDIA anterior',3),'coluna Média, linha de cima'],[V('taxa MARGINAL tua',4),'coluna Marginal, a tua linha']],
   steps:['Coletável = bruto − 4587,09 (dedução específica de 2026). Vê em que escalão fica.','Parte 1: limite do escalão de cima × taxa MÉDIA desse escalão.','Parte 2: o que sobra acima do limite × taxa MARGINAL do teu escalão.','Soma as partes e tira as deduções.'],trap:'Usar a taxa marginal na parte 1, ou aplicar a taxa média do teu escalão a tudo.'},
 acerto:{n:'IRS: reembolso ou pagamento',t:'Finanças',f:'<div class="branch"><div>retenções &gt; coleta líquida → REEMBOLSO</div><div>retenções &lt; coleta líquida → PAGA</div></div>'+ln('valor','=','| retenções − coleta líquida |'),
   vars:[[V('retenções',1),'o que já pagou durante o ano'],[V('coleta líquida',2),'o que devia pagar']],
   steps:['Compara o que pagou (retenções) com o que devia (coleta líquida).','Se pagou a mais, recebe a diferença; se pagou a menos, paga a diferença.'],trap:'Dizer que recebe o valor total das retenções.'},
 js:{n:'Juro simples',t:'Finanças',f:ln('Cf','=',V('Ci',1),'× ( 1 +',V('r',2),'×',V('n',3),')')+ln('Juro','=','Cf − Ci'),
   vars:[[V('Ci',1),'capital inicial'],[V('r',2),'taxa em decimal (3% = 0,03)'],[V('n',3),'tempo em ANOS (meses ÷ 12)']],
   steps:['Converte a taxa para decimal.','Converte o tempo para anos.','Aplica a fórmula.'],trap:'Pôr os meses diretamente em n.',calc:'Ci×(1+r×n)'},
 jsn:{n:'Juro simples: tempo',t:'Finanças',f:ln('n','=',F(V('juro',1),V('Ci',2)+' × '+V('r',3))),
   vars:[[V('juro',1),'quanto rendeu'],[V('Ci',2),'capital inicial'],[V('r',3),'taxa em decimal']],
   steps:['Converte a taxa para decimal.','Multiplica Ci × r (juro de 1 ano).','Divide o juro por esse valor.'],trap:'Converter mal a taxa: 2% = 0,02, não 0,002.'},
 jc:{n:'Juro composto anual',t:'Finanças',f:ln('Cf','=',V('Ci',1),'× ( 1 +',V('r',2),')<sup>'+V('n',3)+'</sup>'),
   vars:[[V('Ci',1),'capital inicial'],[V('r',2),'taxa em decimal'],[V('n',3),'anos']],
   steps:['Converte a taxa para decimal.','Calcula (1 + r) e eleva a n.','Multiplica pelo capital inicial.'],trap:'Usar Ci × (1 + r × n), que é juro SIMPLES.',calc:'Ci×(1+r)^n'},
 jck:{n:'Juro composto com capitalização',t:'Finanças',f:ln('Cf','=',V('Ci',1),'× ( 1 +',F(V('r',2),V('k',4)),')<sup>'+V('k',4)+' × '+V('n',3)+'</sup>')+
   '<div class="tbl" tabindex="0" role="region" aria-label="Tabela" style="margin:0"><table class="mini"><thead><tr><th>Capitalização</th><th>anual</th><th>semestral</th><th>trimestral</th><th>mensal</th></tr></thead><tbody><tr><td class="l"><b>k</b></td><td>1</td><td class="hl2">2</td><td class="hl2">4</td><td class="hl2">12</td></tr></tbody></table></div>',
   vars:[[V('Ci',1),'capital inicial'],[V('r',2),'taxa ANUAL em decimal'],[V('k',4),'vezes por ano'],[V('n',3),'anos']],
   steps:['Escreve o k ao lado do enunciado.','Divide a taxa por k.','Multiplica o expoente: k × n.','Na calculadora usa parênteses em tudo.'],trap:'Mudar só a taxa ou só o expoente. Mudam OS DOIS.',calc:'Ci×(1+r÷k)^(k×n)'},
 esf:{n:'Taxa de esforço',t:'Finanças',f:ln('Esforço','=',F(V('encargos totais',1),V('rendimento líquido',2)),'× 100'),
   vars:[[V('encargos totais',1),'todas as prestações (inclui o novo crédito)'],[V('rendimento líquido',2),'mensal do agregado']],
   steps:['Soma todos os encargos (atuais + novo).','Divide pelo rendimento e multiplica por 100.','Compara com o limite (normalmente 30%).'],trap:'Esquecer os encargos que já existiam.'},
 max:{n:'Encargos máximos',t:'Finanças',f:ln('Encargos máx.','=',V('rendimento',1),'×',V('limite',2))+ln('Ainda disponível','=','Encargos máx. −',V('encargos atuais',3)),
   vars:[[V('rendimento',1),'líquido mensal'],[V('limite',2),'30% = 0,30'],[V('encargos atuais',3),'o que já paga']],
   steps:['Converte o limite para decimal.','Multiplica pelo rendimento.','Lê bem: a pergunta pede o máximo total ou o que ainda sobra?'],trap:'Responder com os encargos atuais.'},
 mtic:{n:'Custo total e MTIC',t:'Finanças',f:ln('Custo total','=',V('juros',2),'+',V('comissões, seguros, impostos',3))+ln('MTIC','=',V('empréstimo',1),'+','Custo total'),
   vars:[[V('empréstimo',1),'valor pedido'],[V('juros',2),'total de juros'],[V('comissões, seguros, impostos',3),'outros encargos']],
   steps:['Custo total: juros + comissões, seguros e impostos.','MTIC: soma o valor emprestado ao custo total.'],trap:'Esquecer as comissões no MTIC, ou somar o empréstimo ao custo total.'},
 liq2:{n:'Recibo: abonos e descontos',t:'Finanças',f:ln('Bruto','=','soma dos',V('abonos',1),'(base + subsídio)')+ln('Descontos','=',V('base',2)+'×0,11','+',V('base',2)+'×'+V('IRS',3),'+',V('base',2)+'×'+V('seguro',4))+ln('Líquido','=','Bruto − Descontos'),
   vars:[[V('abonos',1),'o que recebes'],[V('base',2),'salário base'],[V('IRS',3),'taxa de IRS em decimal'],[V('seguro',4),'taxa do seguro de saúde em decimal']],
   steps:['Bruto = soma da coluna Abono.','Calcula cada desconto sobre o salário base.','Soma os descontos (SS + IRS + seguro).','Líquido = bruto − total de descontos.'],trap:'Esquecer o seguro de saúde ou aplicar os descontos ao bruto.'},
 cond:{n:'Método de Condorcet',t:'Eleições',f:'<div class="branch"><div>A vs B</div><div>A vs C</div><div>B vs C</div></div>'+ln('Vencedor','=','quem ganha',V('todos os confrontos',1)),
   vars:[[V('confronto',2),'em cada coluna, conta para quem está mais acima'],[V('todos os confrontos',1),'tem de ganhar aos outros dois']],
   steps:['Escolhe um par de candidatos (por exemplo A e B).','Em cada coluna vê qual dos dois está mais acima e soma os votos dessa coluna a esse candidato.','Repete para os 3 pares.','Ganha quem vence os dois confrontos. Se ninguém vencer os dois, não há vencedor de Condorcet.'],trap:'Contar só os 1.ºs lugares. No confronto conta a posição relativa dos dois, em todas as colunas.'},
 orc:{n:'Orçamento familiar',t:'Finanças',f:ln('Saldo','=',V('rendimentos',2),'−',V('despesas',4))+ln('% de uma despesa','=',F(V('despesa',3),V('rendimentos',2)),'× 100'),
   vars:[[V('rendimentos',2),'salários, abonos e outras entradas do mês'],[V('despesas',4),'tudo o que sai no mês']],
   steps:['Soma todos os rendimentos.','Soma todas as despesas.','Saldo = rendimentos − despesas (negativo quer dizer que gastam mais do que ganham).','Para a % de uma despesa, divide pelo total dos rendimentos.'],trap:'Dividir pelo total das despesas em vez dos rendimentos.'},
 cred:{n:'Crédito: total pago e custo',t:'Finanças',f:ln('Total pago','=',V('prestação',1),'×',V('n.º de prestações',3))+ln('Custo','=','Total pago −',V('valor pedido',2)),
   vars:[[V('prestação',1),'valor de cada mês'],[V('n.º de prestações',3),'meses do prazo'],[V('valor pedido',2),'montante emprestado']],
   steps:['Multiplica a prestação pelo número de prestações.','Subtrai o valor que pediste para saber o custo do crédito.'],trap:'Multiplicar pelos anos em vez dos meses.'},
 taeg:{n:'Comparar propostas: TAN e TAEG',t:'Finanças',f:'<div class="branch"><div>'+V('TAN',1)+' só juros → decide a PRESTAÇÃO</div><div>'+V('TAEG',4)+' custo total → decide a MAIS FAVORÁVEL</div></div>',
   vars:[[V('TAN',1),'taxa anual nominal'],[V('TAEG',4),'taxa anual de encargos efetiva global']],
   steps:['Lê a pergunta: prestação mais baixa ou proposta mais favorável?','Prestação → menor TAN.','Mais favorável / mais barata no total → menor TAEG (ou menor MTIC).'],trap:'Escolher a mais favorável pela TAN.'}
};
Object.assign(HELP,st_help());
function helpCard(id){const h=HELP[id];if(!h)return'';
  return '<div class="help"><div class="h-top"><span class="h-title">'+h.n+'</span><span class="h-theme">'+h.t+'</span></div><div class="h-body">'+
   '<div class="h-formula">'+h.f+'</div>'+
   '<dl class="h-vars">'+h.vars.map(v=>'<div><dt>'+v[0]+'</dt><dd>'+v[1]+'</dd></div>').join('')+'</dl>'+
   '<ol class="h-steps">'+h.steps.map(s=>'<li><span>'+s+'</span></li>').join('')+'</ol>'+
   (h.calc?'<div class="h-calc">Na calculadora: <code>'+h.calc+'</code></div>':'')+
   '<div class="h-trap"><b>Armadilha:</b> '+h.trap+'</div></div></div>';}
