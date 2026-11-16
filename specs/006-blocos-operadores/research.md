# Pesquisa (Fase 0): Blocos de operadores e valores

Spec: [spec.md](spec.md) (RF-06). Plano: [plan.md](plan.md).

---

## R-01. Inventário: o que já existe e o que falta

**Já na `main`** (008, 001, 007, 002, 003):

- Gerador puro com `ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0)`: abaixo da
  precedência mínima o código do filho volta entre parênteses; encaixe vazio vira `???` +
  aviso "Falta … do bloco …" (008; 003, R-06).
- `PRECEDENCIA = { ADITIVO: 50, MULTIPLICATIVO: 60, PRIMARIO: 100 }`
  (`src/portugol/precedencia.js`).
- **Entregues pela 003 pelas regras desta spec** ([R-03 da 003](../003-blocos-leia-escreva/research.md)):

  | Bloco | Módulo | Requisitos desta spec já atendidos |
  | --- | --- | --- |
  | `numero` (campo `NUM`; variantes `inteiro`, `real`) | `src/blocos/valores.js` | FR-004 (número), FR-006, "número inválido recusado" |
  | `texto` (campo `TEXTO`; variantes `simples`, `com aspas ou barra`) | `src/blocos/valores.js` | FR-004 (texto), FR-007, "texto vazio", "aspas ou barra" |
  | `aritmetico` (`A`, `OP`, `B`; variantes `+ - * / %`) | `src/blocos/contas.js` | FR-001 sem o negativo, FR-005, FR-008, "texto + número", "divisão por zero" |

  Todos com `output: null` (sem `check`). **Nesta spec eles só ganham `check`**; `type`,
  campos, opções do menu e variantes ficam iguais, e não há recriação nem migração.
- Blocos de variável (002): `variavel` (saída, `output: null`) e `variavel_recebe`
  (encaixe `VALOR` sem `check`), ambos com o campo `VAR` do tipo `campo_variavel`.
- Casos no Core da 003 que já exercitam as contas: `contas-precedencia.json`,
  `escreva-conta-idade.json` (`idade <- 15`; `escreva(idade + 1)` → `16`).
- Caixa de blocos com "Variáveis", "Entrada e saída", "Valores" (`numero`, `texto`) e
  "Contas" (`aritmetico`).

**O que falta (esta spec)**: negativo, relacionais, lógicos (`e`, `ou`, `nao`), valor fixo
lógico, os `check` de tipo das entradas e saídas (SC-002) e os cenários de aceitação que
dependem desses blocos.

**Pendências deixadas pela 002 para a 006** (plan da 002, "Pendências para as specs 003 e
006"). Entram nesta spec por pedido explícito:

| # | Pendência | Onde é resolvida aqui |
| --- | --- | --- |
| P-1 | Caso de aceitação no Core real com `idade <- 15` (História 2, cenário 1 da 002) com o bloco de número. | `recebe-idade-quinze.json` (R-11). O `escreva-conta-idade.json` da 003 também tem a atribuição, mas o caso próprio prova o cenário da 002 sozinho, com o `portugolEsperado` dele. |
| P-2 | Decidir o `check` de saída do bloco `variavel` conforme o tipo (o SC-002 desta spec proíbe lógico em lugar de número). | R-09 e R-10: saída do `variavel` e encaixe `VALOR` do `variavel_recebe` pelo tipo da variável. |
| P-3 | Passo B do quickstart da 007 (mudar um número no campo). | Já conferido no passo L do [quickstart da 003](../003-blocos-leia-escreva/quickstart.md); repetido aqui no passo F do [quickstart](quickstart.md), sem trabalho novo. |

---

## R-02. Comportamento do Core 1.4.1 (levantado em 2026-11-15)

Fonte: programas executados com o `compilarEExecutar` da 008 no Pyodide do Node (o mesmo
motor dos testes de aceitação). Só leitura do Core; nada copiado. Variáveis `a <- verdadeiro`,
`b <- falso`, `x <- 5` (ou o valor indicado).

| Tema | Programa | Resultado | Consequência |
| --- | --- | --- | --- |
| Negativo | `-x`, `-3`, `-2.5`, `-(x + 1)`, `-(7 / 2)` | `-5`, `-3`, `-2.5`, `-6`, `-3.5` | `-` unário funciona com número, variável e expressão. |
| Negativo encaixado | `2 - -x`, `2 * -3`, `x > -1`, `-x * 2`, `- -x`, `--x`, `-(-x)` | `7`, `-6`, `verdadeiro`, `-10`, `5`, `5`, `5` | Unário liga mais forte que `*` (`-x * 2` = `(-x) * 2`). O gerador ainda assim parenteseia o operando (R-03, R-04). |
| Resto com negativo | `-7 % 3` | `2` | Resto do Python (`(-7) % 3`). É regra do Core; nada a fazer. |
| Relacionais | `1 = 1`, `1 <> 2`, `1 < 2`, `2 > 1`, `2 <= 2`, `2 >= 3` | `verdadeiro` ×5, `falso` | Os seis símbolos que o gerador emite. |
| Relacional com conta | `1 + 1 = 2` | `verdadeiro` | Conta liga mais forte que comparação. |
| Relacional em relacional | `1 < 2 = verdadeiro` | **erro sintático** (`esperado ")"`) | Não associativo (confirma a 008/R-02): relacional dentro de relacional sempre entre parênteses. `(1 < 2) = verdadeiro` → `verdadeiro`. |
| Comparar textos e lógicos | `"a" = "a"`, `"a" < "b"`, `verdadeiro > falso`, `verdadeiro = 1`, `"1" = 1`, `1 = 1.0` | `verdadeiro`, `verdadeiro`, `verdadeiro`, `verdadeiro`, `falso`, `verdadeiro` | Comparação aceita qualquer tipo; misturar tipos dá resultado do Python. |
| Ordem entre texto e número | `"a" < 1` | erro de execução (`TypeError`), mensagem genérica da 008 | Como a divisão por zero: não bloqueado no editor (R-08). |
| Lógicos | `verdadeiro e falso`, `verdadeiro ou falso`, `nao verdadeiro` | `falso`, `verdadeiro`, `falso` | Palavras `e`, `ou`, `nao`. |
| `nao` e comparação | `nao (x > 10)` e `nao x > 10` (com `x` = 15) | `falso` nos dois | `nao` pega a comparação inteira; a spec pede os parênteses mesmo assim (História 3, cenário 1). |
| `nao` dentro de comparação | `nao verdadeiro = falso` | `verdadeiro` (= `nao (verdadeiro = falso)`) | `(nao a) = b` precisa de parênteses: `nao` tem precedência menor que relacional. |
| `e` antes de `ou` | `(a ou b) e c` → `falso`; `a ou b e c` → `verdadeiro` (`b`, `c` falsos) | — | Prova do cenário 2 da História 3. |
| `nao` dentro de `e`/`ou` | `a e nao b`, `b ou nao a`, `nao a e b`, `nao b ou b` | `verdadeiro`, `falso`, `falso`, `verdadeiro` | `nao` liga mais forte que `e`/`ou`: sem parênteses ali. |
| Agrupamento à direita | `a e (b e a)` | `falso` | Lado direito pede um nível a mais, como no aritmético. |
| Comparações com `e` | `x > 1 e x < 9 ou b` | `verdadeiro` | Relacional dentro de `e`/`ou` sem parênteses. |
| Lógico na atribuição | `a <- x >= 5` | `verdadeiro` | Relacional encaixa no `recebe` de variável lógica. |
| **Tipos não verificados** | `x <- verdadeiro` (inteiro), `ok <- 5` (lógico), `t <- 5` (cadeia), `x <- 2.5` (inteiro), `1 + verdadeiro`, `verdadeiro + 1`, `1 e 0`, `nao 0`, `-verdadeiro` | todos compilam: `verdadeiro`, `5`, `5`, `2.5`, `2`, `2`, `0`, `verdadeiro`, `-1` | **O Core não verifica tipos.** Os `check` do editor são a única proteção do SC-002 (R-08). Lacuna → issue (R-13). |
| Texto em conta | `"a" - 1` | erro de execução (`TypeError`) | Só o `+` faz sentido com texto (concatenação). |
| Literal lógico maiúsculo | `VERDADEIRO`, `Falso` | **erro semântico**: "a variável "VERDADEIRO" não foi declarada" | Diferente das palavras-chave (sem diferenciar maiúsculas, 008/R-02). O gerador emite sempre minúsculo. Lacuna → issue (R-13). |
| Divisão por zero | `1 / 0` | erro de execução "Divisão por zero" (traduzido pela 008) | Caso de borda da spec: não bloqueado; caso `divisao-por-zero.json`. |
| `idade <- 15` | `x <- 15; escreva(x)` | `15` | P-1. |

---

## R-03. Escala de precedência completa e regra de parênteses

**Decisão**: `PRECEDENCIA` passa a ter os oito níveis da escala da 008/R-02:

```js
{ OU: 10, E: 20, NAO: 30, RELACIONAL: 40, ADITIVO: 50, MULTIPLICATIVO: 60, UNARIO: 70, PRIMARIO: 100 }
```

O que cada bloco pede de cada encaixe (`ctx.valor(..., precedenciaMinima)`) e devolve:

| Bloco | Encaixe esquerdo / único | Encaixe direito | Devolve |
| --- | --- | --- | --- |
| `aritmetico` (003, inalterado) | nível do operador | nível + 1 | nível do operador (50 ou 60) |
| `relacional` | `RELACIONAL + 1` | `RELACIONAL + 1` | `RELACIONAL` |
| `e_ou` | nível do operador | nível + 1 | `E` ou `OU` |
| `nao` | `PRIMARIO` | — | `NAO` |
| `negativo` | `PRIMARIO` | — | `UNARIO` |
| `numero`, `texto`, `logico`, `variavel` | — | — | `PRIMARIO` |

| Blocos | Portugol | Por quê |
| --- | --- | --- |
| `nao(relacional x > 10)` | `nao (x > 10)` | 40 < 100 (História 3, cenário 1) |
| `nao(variavel ok)` | `nao ok` | 100 ≥ 100 |
| `nao(nao ok)` | `nao (nao ok)` | 30 < 100 |
| `e(ou(a, b), c)` | `(a ou b) e c` | 10 < 20 (História 3, cenário 2) |
| `ou(a, e(b, c))` | `a ou b e c` | 20 ≥ 11 |
| `e(a, e(b, c))` | `a e (b e c)` | direita 20 < 21 |
| `e(a, nao b)` | `a e nao b` | 30 ≥ 21 |
| `e(x > 1, x < 9)` | `x > 1 e x < 9` | 40 ≥ 20 e ≥ 21 |
| `relacional(relacional(1 < 2), verdadeiro)` | `(1 < 2) = verdadeiro` | 40 < 41 (o Core recusa sem parênteses) |
| `relacional(nao a, falso)` | `(nao a) = falso` | 30 < 41 |
| `relacional(soma(1, 1), 2)` | `1 + 1 = 2` | 50 ≥ 41 |
| `divisao(soma(nota1, nota2), 2)` | `(nota1 + nota2) / 2` | 50 < 60 (História 1, cenário 1) |
| `negativo(x)` / `negativo(3)` | `-x` / `-3` | 100 ≥ 100 |
| `negativo(soma(2, 3))` | `-(2 + 3)` | 50 < 100 |
| `negativo(negativo x)` | `-(-x)` | 70 < 100 (evita `--x`, que lembra comentário `//`) |
| `mult(negativo(soma(2, 3)), 4)` | `-(2 + 3) * 4` | 70 ≥ 60 |
| `sub(2, negativo 3)` | `2 - -3` | 70 ≥ 51 |

**Motivo**: a mesma regra do R-06 da 003, estendida à escala inteira. Para `nao` e
`negativo` a spec quer que o estudante veja o que está sendo invertido
(`nao (x > 10)`), mesmo quando o Core dispensaria: por isso o operando pede `PRIMARIO`.

**Alternativas consideradas**: `nao` pedindo só `NAO` (geraria `nao x > 10`: certo para o
Core, mas contra o cenário 1 da História 3); parênteses sempre (rejeitada pela 003, R-06).

---

## R-04. Bloco `negativo` (`-x`)

**Decisão**: em `src/blocos/contas.js`, `type: 'negativo'`, rótulo `negativo`, mensagem
`−%1` (sinal U+2212 no bloco; `-` no Portugol), um encaixe `X` em linha. Gera
`-${ctx.valor(bloco, 'X', 'o valor', PRIMARIO)}` com precedência `UNARIO`. Encaixe aceita
`Numero` e a saída é `Numero` (R-08). Sem variantes (o registro usa a variante `padrão`).
Dica: "O valor com o sinal trocado, como −5".

**Motivo**: o campo de número da 003 recusa `-` (R-07 da 003); o número negativo nasce
deste bloco, que também serve para variáveis e expressões, como no Portugol.

**Alternativas consideradas**: aceitar `-` no campo de número (rejeitada: dois jeitos de
fazer o mesmo e `2 - -3` viraria `2 - -3` de qualquer forma); opção "−" de um só operando no
menu do `aritmetico` (rejeitada: muda as variantes e a forma do bloco da 003).

---

## R-05. Bloco `relacional`

**Decisão**: `src/blocos/comparacoes.js`, `type: 'relacional'`, rótulo `comparação`,
`A`, `OP`, `B` em linha. Menu com rótulos amigáveis e valor = símbolo do Portugol:

| Rótulo | Valor / Portugol |
| --- | --- |
| `=` | `=` |
| `≠` | `<>` |
| `<` | `<` |
| `>` | `>` |
| `≤` | `<=` |
| `≥` | `>=` |

Variantes: uma por `OP` (seis). Os dois lados pedem `RELACIONAL + 1`, devolve `RELACIONAL`.
Encaixes aceitam qualquer tipo (comparar textos ou lógicos é válido no Core, R-02); saída
`Logico`. Dica: "Compara os dois valores. O resultado é verdadeiro ou falso". `OP` inválido
(arquivo à mão): `???` + "Escolha a comparação do bloco comparação", como no aritmético.

**Motivo**: um bloco com menu, como o `aritmetico` da 003; gerar `=` e `<>` segue a 008/R-02
(palavra que o estudante vê no Portugol).

---

## R-06. Blocos `e_ou` e `nao`

**Decisão** (`src/blocos/logica.js`):

- `e_ou`: `A`, `OP` (`e`, `ou`), `B`, em linha, rótulo `e/ou`. Precedências `E` e `OU`;
  esquerdo pede o nível, direito nível + 1. Variantes `e` e `ou`. Encaixes e saída
  `Logico`. Dica: "“e”: verdadeiro só se os dois lados forem verdadeiros. “ou”: verdadeiro
  se pelo menos um for".
- `nao`: mensagem `não %1`, encaixe `X`, rótulo `não` ("Falta o valor do bloco não").
  Gera `nao ${ctx.valor(bloco, 'X', 'o valor', PRIMARIO)}`, devolve `NAO`. Encaixe e saída
  `Logico`. Sem variantes. Dica: "Inverte o valor: verdadeiro vira falso e falso vira
  verdadeiro".

O bloco mostra "não" com acento (o Core aceita as duas formas, 008/R-02); o Portugol gerado
usa `nao` sem acento, como as demais palavras-chave.

**Motivo**: `e` e `ou` têm a mesma forma de bloco (dois lados), por isso um bloco com menu,
como o aritmético e o relacional; `nao` tem um lado só.

**Alternativas consideradas**: `e` e `ou` em blocos separados (rejeitada: duplica definição;
na caixa os dois aparecem mesmo assim, R-12).

---

## R-07. Valor fixo `logico`

**Decisão**: em `src/blocos/valores.js`, `type: 'logico'`, rótulo `lógico`, um menu
`VALOR` com `verdadeiro` e `falso` (rótulo = valor). Gera o valor em minúsculas com
`PRIMARIO`; valor inválido (arquivo à mão) gera `???` + "Escolha verdadeiro ou falso no
bloco lógico". Variantes `verdadeiro` e `falso`. Saída `Logico`. Dica: "Um valor lógico:
verdadeiro ou falso".

**Motivo**: o Core só reconhece os literais em minúsculas (R-02); um menu impede qualquer
outra grafia.

---

## R-08. Tipos dos encaixes (SC-002)

**Decisão**: três tipos de valor, como `check` do Blockly: `Numero`, `Texto`, `Logico`
(nomes internos, sem acento, nunca mostrados). Um encaixe é compatível com uma saída quando
algum dos dois é "qualquer" (`null`) ou quando as listas têm um tipo em comum (regra padrão
do Blockly).

| Bloco | Saída | Encaixes |
| --- | --- | --- |
| `numero` | `Numero` | — |
| `texto` | `Texto` | — |
| `logico` | `Logico` | — |
| `aritmetico` | `Numero`, `Texto` | `A`, `B`: `Numero`, `Texto` |
| `negativo` | `Numero` | `X`: `Numero` |
| `relacional` | `Logico` | `A`, `B`: qualquer |
| `e_ou` | `Logico` | `A`, `B`: `Logico` |
| `nao` | `Logico` | `X`: `Logico` |
| `variavel` | pelo tipo da variável (R-09) | — |
| `variavel_recebe` | — | `VALOR`: pelo tipo da variável (R-09) |
| `escreva` | — | `VALOR1…10`: qualquer |

Consequências para o SC-002: lógico (`logico`, `relacional`, `e_ou`, `nao`, variável lógica)
não encaixa em `aritmetico`, `negativo` nem no `recebe` de variável numérica; número
(`numero`, `negativo`, variável numérica) não encaixa em `e_ou`, `nao` nem no `recebe` de
variável lógica. O `aritmetico` sai como `Numero` ou `Texto` porque o `+` concatena textos
(caso de borda da spec).

**Limites aceitos** (registrados para não parecerem falhas):

- `inteiro` e `real` são o mesmo tipo `Numero`: `idade <- 2,5` é aceito, como no Core.
- `"a" - 1`, `"a" < 1` e `inteiro <- "a" + 1` não são bloqueados: o tipo depende do
  operador ou do conteúdo, não da forma do bloco. O Core informa o erro na execução, como na
  divisão por zero.
- O encaixe recusado é o comportamento normal do Blockly (o bloco não "gruda"); a dica de
  cada bloco diz o que encaixar. Sem janela extra (princípio VI).

**Alternativas consideradas**: `Inteiro` e `Real` separados (rejeitada: `idade + 0,5` e a
divisão `/`, que sempre dá real, ficariam sem encaixe possível); `check` do `aritmetico`
mudando com o operador (rejeitada: trocar `+` por `−` soltaria blocos sem o estudante
entender; o Core já avisa na execução).

---

## R-09. Tipo do bloco de variável pelo tipo da variável (pendência P-2 da 002)

**Decisão**:

- `inteiro` e `real` → `Numero`; `cadeia` → `Texto`; `logico` → `Logico`; campo sem
  variável → qualquer (o estudante pode encaixar o bloco antes de escolher a variável).
- Vale para a **saída** do `variavel` e para o **encaixe `VALOR`** do `variavel_recebe`
  (variável lógica só recebe valor lógico, e assim por diante). O `leia` não tem encaixe e
  aceita os quatro tipos, como já é.
- Cada entrada do registro pode declarar `tipoPelaVariavel: 'saida'` (o `variavel`) ou
  `tipoPelaVariavel: 'VALOR'` (o nome do encaixe, no `variavel_recebe`), sempre pela
  variável do campo `VAR`. A chave é opcional e validada pelo registro; as funções de
  `tipos.js` leem essa chave em vez de citar nomes de bloco.
- O tipo é lido **na hora** por um verificador de encaixe próprio, subclasse do
  `ConnectionChecker` do Blockly 12.5.1, registrada como `meupia` e ligada no
  `Blockly.inject` (`plugins: { connectionChecker: 'meupia' }`). O `doTypeChecks` monta o
  `check` efetivo de cada lado com `checkEfetivo` (puro, `tipos.js`): o declarado na
  definição ou, se o bloco tem `tipoPelaVariavel` naquele encaixe, o do tipo da variável do
  mapa. Os demais blocos seguem só o `check` da definição.

**Motivo**: o tipo da variável muda depois de criada (002, "Mudar o tipo…") e o mesmo
bloco troca de variável pelo menu. Ler na hora dispensa manter `setCheck` sincronizado com
cada evento e acerta a ordem do desfazer (R-10). Na carga de um projeto o mapa de variáveis
vem antes dos blocos, então o verificador já sabe o tipo.

**Alternativas consideradas**: `setCheck` num ouvinte de eventos (rejeitada: os ouvintes do
Blockly rodam depois do evento, e no Ctrl+Z o bloco tentaria voltar ao encaixe com o tipo
ainda trocado); um bloco de variável por tipo (rejeitada: muda o `type` salvo e a caixa da
002); `check` só no `variavel` e nada no `recebe` (rejeitada: `ok <- 5` passaria em silêncio,
R-02).

---

## R-10. Mudar o tipo ou trocar a variável de um bloco encaixado

**Decisão**: quando a mudança deixaria um encaixe incompatível, os blocos afetados **saem do
encaixe antes** e ficam soltos ao lado (somem do Portugol, regra da 007; o encaixe vazio
passa a mostrar `???` + aviso). Tudo num único grupo de eventos, para um Ctrl+Z desfazer a
mudança e devolver os blocos:

- **Mudar o tipo** (`mudarTipoVariavel`, 002): abre o grupo; calcula com
  `encaixesIncompativeis(estado, registro, tiposComNovo)` (puro) os pares que quebram
  — `variavel` daquela variável em encaixe que não aceita o tipo novo, e `variavel_recebe`
  daquela variável com valor encaixado que não cabe; desencaixa os filhos desses pares e os
  afasta um pouco; só então chama `changeVariableType`; fecha o grupo.
- **Trocar a variável pelo menu do campo** (`campo_variavel`): no `onItemSelected_`, antes de
  aplicar a variável nova, a mesma verificação para aquele bloco (como filho e, no `recebe`,
  como pai); desencaixa no mesmo grupo e então troca.

A ordem (soltar antes, mudar depois) faz o desfazer voltar primeiro o tipo ou a variável e
depois reencaixar, quando o encaixe já é compatível de novo. A ordem e o desfazer são
provados no teste headless (`operadores-blockly.test.js`).

**Motivo**: o Blockly só verifica tipos ao encaixar; sem isso, uma variável que muda de
`inteiro` para `logico` ficaria dentro de uma conta, contra o SC-002.

**Alternativas consideradas**: recusar a mudança de tipo quando a variável está encaixada
(rejeitada: a 002 permite mudar o tipo mesmo em uso, caso de borda dela); mostrar só as
variáveis compatíveis no menu (rejeitada: o estudante não entenderia por que uma variável
sumiu da lista).

---

## R-11. Casos de aceitação no Core real

**Decisão**: casos novos em `tests/aceitacao/casos/`, todos com `portugolEsperado` e
`saidaEsperada`, respeitando os tipos dos encaixes (meta-aceitação nova abaixo):

| Arquivo | Programa (Portugol gerado) | Saída esperada | Cobre |
| --- | --- | --- | --- |
| `recebe-idade-quinze.json` | `idade <- 15`; `escreva(idade)` | `15\n` | **P-1** (História 2, cenário 1 da 002), RF-02 e RF-06. |
| `operadores-media.json` | `nota1 <- 7`; `nota2 <- 8`; `escreva((nota1 + nota2) / 2)`; `escreva(7 / 2)`; `escreva(-nota1)`; `escreva(-(nota1 + nota2))`; `escreva(2 - -3)` | `7.5\n3.5\n-7\n-15\n5\n` | História 1 (teste independente e cenários 1 e 2); `negativo`. |
| `operadores-comparacao.json` | `idade <- 18`; `escreva(idade = 18)` … `escreva(idade >= 18)` (seis); `maior <- idade >= 18`; `escreva(maior)`; `escreva("Ana" = "Ana")` | `verdadeiro\nfalso\nfalso\nfalso\nverdadeiro\nverdadeiro\nverdadeiro\nverdadeiro\n` | História 2; seis variantes do `relacional`; relacional no `recebe` de lógico; comparar textos. |
| `operadores-logicos.json` | `x <- 15`; `a <- verdadeiro`; `b <- falso`; `c <- falso`; `escreva(nao (x > 10))`; `escreva((a ou b) e c)`; `escreva(a ou b e c)`; `escreva(a e nao b)`; `escreva(nao (nao a))`; `escreva(x > 1 e x < 20)` | `falso\nfalso\nverdadeiro\nverdadeiro\nverdadeiro\nverdadeiro\n` | História 3 (cenários 1 e 2); `e_ou` (`e`, `ou`), `nao`. |
| `valores-fixos.json` | `ok <- verdadeiro`; `escreva(ok)`; `escreva(falso)`; `escreva("Olá")`; `escreva(3.5)` (campo `NUM: "3,5"`) | `verdadeiro\nfalso\nOlá\n3.5\n` | História 4 (cenários 1 e 2); `logico` (`verdadeiro`, `falso`). |
| `expressoes-estrutura.json` | `escreva(-(2 + 3) * 4)`; `escreva((1 < 2) = verdadeiro)`; `escreva(b e b ou a)`; `escreva(b e (b ou a))`; `escreva(a e (b e a))`; `escreva((nao a) = falso)` | `-20\nverdadeiro\nverdadeiro\nfalso\nfalso\nverdadeiro\n` | SC-001: em cada linha, parênteses errados ou faltando mudariam o resultado ou quebrariam a compilação. |
| `divisao-por-zero.json` | `escreva(1 / 0)` | vazia, `statusEsperado: "erro_execucao"` | Caso de borda: não bloqueado; o Core informa na execução. |

Entradas: nenhuma (`entrada: []`). Os valores exatos serão escritos nas tasks; os textos acima
são a referência e saíram do R-02.

**Meta-aceitação nova** (`aceitacao.test.js`): para todo caso,
`encaixesIncompativeis(caso.projeto.blocos, registroPadrao, tiposDasVariaveis)` é vazio, ou
seja, todo caso é montável no editor com os tipos do R-08/R-09. Junto com o teste headless que
carrega todos os casos no Blockly com o verificador, liga o SC-002 aos casos do SC-001. A
meta-verificação de variantes da 008 passa a exigir as variantes dos cinco blocos novos.

---

## R-12. Caixa de blocos

**Decisão**:

| Categoria | Conteúdo |
| --- | --- |
| **Valores** (já existe) | `numero`, `texto` e agora `logico` (`verdadeiro`). |
| **Contas** (já existe) | `aritmetico` com `+` e agora `negativo`. |
| **Comparações** (nova, estática) | `relacional` com `=`. |
| **Lógica** (nova, estática) | `e_ou` com `e`, `e_ou` com `ou`, `nao`. |

Ordem: Variáveis, Entrada e saída, Valores, Contas, Comparações, Lógica. Cores novas
`COR_COMPARACOES = 260` e `COR_LOGICA = 290` (matiz), distintas das existentes (160, 200, 230,
330).

**Motivo**: mostrar `e` e `ou` separados ajuda o estudante a achar o bloco; o menu continua
no próprio bloco.

---

## R-13. Lacunas do Core encontradas

Pelo princípio I, cada uma vira issue em `meuPia/core`, com contorno do lado do editor. A
dupla abre e põe o link aqui, como na 003/R-07 (task `docs`).

1. **O Core não verifica tipos em atribuições e operações** (R-02: `ok <- 5`,
   `x <- verdadeiro`, `1 + verdadeiro`, `1 e 0` compilam). Contorno: os `check` dos encaixes
   (R-08, R-09).

   > **Título**: Atribuições e operações com tipos incompatíveis são aceitas
   >
   > **Versão**: `meupia-core` 1.4.1 (PyPI), Pyodide 0.25.0.
   >
   > **Passos**: compilar `algoritmo "T"` / `var` / `ok: logico` / `x: inteiro` / `inicio` /
   > `ok <- 5` / `x <- verdadeiro` / `escreva(1 + verdadeiro, " ", 1 e 0)` / `fim_algoritmo`.
   >
   > **Esperado**: erro semântico em português apontando o tipo incompatível.
   >
   > **Obtido**: compila e mostra `2 0`; `ok` passa a guardar `5`.
   >
   > **Contorno no meuPiá Blocos**: os encaixes dos blocos só aceitam o tipo esperado
   > (`src/blocos/tipos.js`).

2. **`VERDADEIRO` e `FALSO` em maiúsculas viram nome de variável**, embora as palavras-chave
   não diferenciem maiúsculas (008/R-02). Contorno: o bloco `logico` gera sempre minúsculo.

   > **Título**: `VERDADEIRO`/`FALSO` em maiúsculas são tratados como variável
   >
   > **Passos**: compilar um programa com `escreva(VERDADEIRO)`.
   >
   > **Esperado**: o mesmo que `escreva(verdadeiro)`, como `SE`/`se`.
   >
   > **Obtido**: erro semântico "a variável "VERDADEIRO" não foi declarada no bloco var".
   >
   > **Contorno no meuPiá Blocos**: o bloco lógico só oferece `verdadeiro` e `falso` em
   > minúsculas (`src/blocos/valores.js`).

**Links das issues** (abertas pela dupla):

1. Tipos incompatíveis aceitos: [meuPia/core#16](https://github.com/meuPia/core/issues/16).
2. `VERDADEIRO`/`FALSO` em maiúsculas viram variável: [meuPia/core#17](https://github.com/meuPia/core/issues/17).

---

## R-14. Dependências

**Decisão**: nenhuma dependência nova. O verificador usa `Blockly.ConnectionChecker` e
`Blockly.registry.register(Blockly.registry.Type.CONNECTION_CHECKER, …)` do Blockly 12.5.1;
os rótulos usam caracteres Unicode (`≠ ≤ ≥ −`), sem imagens.

---

## R-15. O que fica para outras specs

| Para | Item |
| --- | --- |
| 004 | Condição do `se` com `check: 'Logico'` (contrato [tipos-encaixe.md](contracts/tipos-encaixe.md)). O teste independente da História 2 desta spec ("montar `se idade >= 18`") é feito com `escreva`/`recebe` aqui; o `se` em si é da 004. |
| 005 | Condição do `enquanto` com `Logico`; limites e passo do `para` com `Numero`. |
| 012 | Mensagem amigável quando o arquivo carregado tem um encaixe incompatível (o Blockly lança `BadConnectionCheck`). Hoje nenhum projeto salvo existe (a 011 ainda não foi feita), então nada quebra. |
