# Esquema do conteúdo das disciplinas · Pronex_Study

Cada disciplina gera UM ficheiro JSON válido (UTF-8, PT-PT; Inglês: enunciados em inglês, explicações em PT-PT).
Tudo tem de vir do manual. Não inventar factos, datas, autores, citações ou regras que o manual não tenha.
Cada item indica a página do manual onde está a matéria (`pag`).

```json
{
  "disc": "filosofia",                 // id: filosofia | portugues | ingles | desenho | teologia | modelacao3d | python
  "nome": "Filosofia",
  "fonte": "Manual de Filosofia (2026)",
  "modulos": [
    {
      "id": "m1",                         // m1, m2, ... pela ordem do manual
      "titulo": "Unidade 1 — ...",        // título como no manual
      "pags": [5, 12],
      "licao": {                          // explicação curta para estudar antes de praticar (palavras próprias, fiel ao manual)
        "resumo": "3 a 6 frases.",
        "pontos": ["ideia-chave 1", "ideia-chave 2", "..."],  // 3 a 7
        "exemplo": "um exemplo resolvido ou aplicado, tirado do manual quando existir"
      },
      "itens": [ /* ver tipos abaixo; 8 a 14 por módulo, misturando tipos */ ]
    }
  ]
}
```

## Tipos de item (campo `tipo`)

Campos comuns: `id` (único na disciplina, ex. "m3-07"), `tipo`, `nivel` (1 fácil · 2 médio · 3 exame), `pag`, `enunciado`, `explicacao` (porquê, 1 a 3 frases, mostrada depois de responder).

1. `"mc"` escolha múltipla
   `"opcoes": ["...", "...", "...", "..."]` (4, plausíveis, só uma certa), `"certa": 0` (índice).

2. `"vf"` verdadeiro/falso
   `"certa": true|false`.

3. `"escrita"` resposta curta ou desenvolvida, corrigida por critérios
   `"modelo"`: resposta-modelo completa (o que um aluno de 18-20 valores escreveria);
   `"criterios"`: lista de 2 a 5 `{ "ideia": "o que a resposta tem de dizer", "chaves": ["palavras", "ou expressões", "e sinónimos que mostram essa ideia"], "peso": 1 }`;
   `"minimo"`: quantos pontos de peso chegam para estar certo (a ideia central do enunciado tem de estar coberta);
   `"linhas"`: tamanho esperado (1 = frase, 3 = parágrafo, 8 = texto).
   As `chaves` são em minúsculas, sem acentos obrigatórios, e incluem sinónimos e formas comuns (ex.: "conhecimento", "saber", "conhecer").

4. `"texto"` interpretação de texto: um excerto (do manual) seguido de sub-perguntas
   `"excerto": "..."` (até ~1200 caracteres, citado do manual) e `"perguntas": [ itens mc/vf/escrita ]`.

5. `"codigo"` (Python)
   `"inicio"`: código inicial (pode ser vazio), `"testes"`: lista de `{ "codigo": "assert soma(2,3)==5", "msg": "soma(2,3) deve dar 5" }`
   ou `"saida"`: texto exato que o programa deve imprimir; `"dica"`; `"solucao"`.
   Só a biblioteca padrão; sem input() (se o exercício pedir input, usar uma função com parâmetros).

6. `"desenho"` (Desenho A) desenhar no ecrã ou em papel e fotografar
   `"materiais"`, `"tempo"` (minutos), `"criterios"`: lista de frases de autoavaliação ("A linha do horizonte está à altura dos olhos"),
   `"verificacao"`: 2 a 3 itens mc sobre a técnica usada (para confirmar que percebeu).

7. `"tarefa3d"` (Modelação 3D) fazer no Blender e enviar captura de ecrã
   `"passos"`: lista de passos, `"resultado"`: o que a captura tem de mostrar,
   `"criterios"`: lista de verificações visíveis na captura, `"verificacao"`: 2 a 3 itens mc ("Que atalho usaste para...?").

## Regras de qualidade

- Seguir a ordem e a profundidade do manual; cobrir TODOS os módulos/unidades (se o manual for muito longo, 8 itens por módulo chega).
- Perguntas ao estilo de exame/teste quando o manual tiver exercícios ou exames: reaproveitar e adaptar esses (indicar a página).
- Distratores das escolhas múltiplas plausíveis (erros comuns), nunca absurdos.
- Escrita PT-PT (de Portugal): "facto", "equipa", "ecrã", "utilizador", etc.
- Nada de conteúdo ofensivo; em Teologia, linguagem neutra e respeitosa, fiel ao manual.
