# Contrato: blocos de operadores e valor fixo lógico (RF-06)

Módulos `src/blocos/contas.js`, `src/blocos/comparacoes.js`, `src/blocos/logica.js`,
`src/blocos/valores.js`, `src/portugol/precedencia.js` (núcleo, sem Blockly). Decisões:
[research.md](../research.md), R-03 a R-08. Continua o
[contrato da 003](../../003-blocos-leia-escreva/contracts/blocos-valores-contas.md), que segue
valendo para `numero`, `texto` e `aritmetico` em tudo que não for `check`.

## Precedência

```js
export const PRECEDENCIA = Object.freeze({
  OU: 10, E: 20, NAO: 30, RELACIONAL: 40,
  ADITIVO: 50, MULTIPLICATIVO: 60, UNARIO: 70, PRIMARIO: 100,
});
```

`ADITIVO`, `MULTIPLICATIVO` e `PRIMARIO` mantêm os valores da 003.

## `BLOCO_NEGATIVO` (`contas.js`)

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` / `categoria` | `'negativo'` / `'negativo'` / `'valor'` |
| `variantes` | nenhuma (o registro usa `padrão`) |
| `definicao` | `message0: '−%1'`, `input_value X` com `check: ['Numero']`, `inputsInline: true`, `output: ['Numero']`, `colour: COR_CONTAS`, `tooltip: 'O valor com o sinal trocado, como −5'` |

```js
gerar(bloco, ctx) {
  return { codigo: `-${ctx.valor(bloco, 'X', 'o valor', PRECEDENCIA.PRIMARIO)}`, precedencia: PRECEDENCIA.UNARIO };
}
```

## `BLOCO_RELACIONAL` (`comparacoes.js`)

```js
export const COR_COMPARACOES = 260;
export const OPERADORES_RELACIONAIS = Object.freeze({
  '=': '=', '<>': '<>', '<': '<', '>': '>', '<=': '<=', '>=': '>=',
});
```

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` / `categoria` | `'relacional'` / `'comparação'` / `'valor'` |
| `variantes` | uma por `OP`: `=`, `<>`, `<`, `>`, `<=`, `>=` |
| `definicao` | `message0: '%1 %2 %3'`: `input_value A` (sem `check`), `field_dropdown OP` (`[['=','='],['≠','<>'],['<','<'],['>','>'],['≤','<='],['≥','>=']]`), `input_value B` (sem `check`); `inputsInline: true`, `output: ['Logico']`, `colour: COR_COMPARACOES`, `tooltip: 'Compara os dois valores. O resultado é verdadeiro ou falso'` |

```js
gerar(bloco, ctx) {
  const op = OPERADORES_RELACIONAIS[ctx.campo(bloco, 'OP')];
  if (!op) { ctx.aviso(bloco, 'OP', 'Escolha a comparação do bloco comparação'); return { codigo: '???', precedencia: PRIMARIO }; }
  const min = PRECEDENCIA.RELACIONAL + 1;
  const a = ctx.valor(bloco, 'A', 'o primeiro valor', min);
  const b = ctx.valor(bloco, 'B', 'o segundo valor', min);
  return { codigo: `${a} ${op} ${b}`, precedencia: PRECEDENCIA.RELACIONAL };
}
```

## `BLOCO_E_OU` e `BLOCO_NAO` (`logica.js`)

```js
export const COR_LOGICA = 290;
export const OPERADORES_LOGICOS = Object.freeze({
  e: Object.freeze({ simbolo: 'e', precedencia: PRECEDENCIA.E }),
  ou: Object.freeze({ simbolo: 'ou', precedencia: PRECEDENCIA.OU }),
});
```

| Chave | `e_ou` | `nao` |
| --- | --- | --- |
| `tipo` / `rotulo` | `'e_ou'` / `'e/ou'` | `'nao'` / `'não'` |
| `categoria` | `'valor'` | `'valor'` |
| `variantes` | `e`, `ou` (pelo `OP`) | nenhuma |
| `definicao` | `'%1 %2 %3'`: `input_value A` `check: ['Logico']`, `field_dropdown OP` `[['e','e'],['ou','ou']]`, `input_value B` `check: ['Logico']`; `inputsInline: true`, `output: ['Logico']`, `colour: COR_LOGICA`, `tooltip: '“e”: verdadeiro só se os dois lados forem verdadeiros. “ou”: verdadeiro se pelo menos um for'` | `'não %1'`: `input_value X` `check: ['Logico']`; `inputsInline: true`, `output: ['Logico']`, `colour: COR_LOGICA`, `tooltip: 'Inverte o valor: verdadeiro vira falso e falso vira verdadeiro'` |

```js
// e_ou: associativo à esquerda, como o aritmético
const op = OPERADORES_LOGICOS[ctx.campo(bloco, 'OP')];
if (!op) { ctx.aviso(bloco, 'OP', 'Escolha e ou ou no bloco e/ou'); return { codigo: '???', precedencia: PRIMARIO }; }
const a = ctx.valor(bloco, 'A', 'o primeiro valor', op.precedencia);
const b = ctx.valor(bloco, 'B', 'o segundo valor', op.precedencia + 1);
return { codigo: `${a} ${op.simbolo} ${b}`, precedencia: op.precedencia };

// nao
return { codigo: `nao ${ctx.valor(bloco, 'X', 'o valor', PRECEDENCIA.PRIMARIO)}`, precedencia: PRECEDENCIA.NAO };
```

## `BLOCO_LOGICO` (`valores.js`)

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` / `categoria` | `'logico'` / `'lógico'` / `'valor'` |
| `variantes` | `verdadeiro`, `falso` (pelo campo `VALOR`) |
| `definicao` | `message0: '%1'`, `field_dropdown VALOR` `[['verdadeiro','verdadeiro'],['falso','falso']]`, `output: ['Logico']`, `colour: COR_VALORES`, `tooltip: 'Um valor lógico: verdadeiro ou falso'` |

`gerar`: `VALOR` `verdadeiro` ou `falso` → `{ codigo: VALOR, precedencia: PRIMARIO }`; outro
valor → `ctx.aviso(bloco, 'VALOR', 'Escolha verdadeiro ou falso no bloco lógico')` e `???`.

## Blocos da 003: o que muda

Só a `definicao`:

| Bloco | Antes | Depois |
| --- | --- | --- |
| `numero` | `output: null` | `output: ['Numero']` |
| `texto` | `output: null` | `output: ['Texto']` |
| `aritmetico` | `A`, `B` sem `check`; `output: null` | `A`, `B` com `check: ['Numero', 'Texto']`; `output: ['Numero', 'Texto']` |

`type`, `message0`, campos, opções do menu, `gerar`, variantes e dicas ficam iguais. O teste
de unidade da 003 continua passando sem alteração; o novo só acrescenta os `check`.

## Exemplos de geração (testes de unidade)

| Estrutura | Portugol |
| --- | --- |
| `relacional(>=, variavel idade, numero 18)` | `idade >= 18` |
| `relacional(<>, a, b)` | `a <> b` |
| `relacional(=, relacional(<, 1, 2), logico verdadeiro)` | `(1 < 2) = verdadeiro` |
| `relacional(=, soma(1, 1), 2)` | `1 + 1 = 2` |
| `nao(relacional(>, x, 10))` | `nao (x > 10)` |
| `nao(variavel ok)` | `nao ok` |
| `nao(nao(ok))` | `nao (nao ok)` |
| `e(ou(a, b), c)` | `(a ou b) e c` |
| `ou(a, e(b, c))` | `a ou b e c` |
| `e(a, e(b, c))` | `a e (b e c)` |
| `e(a, nao(b))` | `a e nao b` |
| `relacional(=, nao(a), falso)` | `(nao a) = falso` |
| `negativo(variavel x)` | `-x` |
| `negativo(soma(2, 3))` | `-(2 + 3)` |
| `negativo(negativo(x))` | `-(-x)` |
| `mult(negativo(soma(2, 3)), 4)` | `-(2 + 3) * 4` |
| `sub(2, negativo(3))` | `2 - -3` |
| `div(soma(nota1, nota2), 2)` | `(nota1 + nota2) / 2` |
| `logico verdadeiro` / `logico falso` | `verdadeiro` / `falso` |
| `texto Olá` / `numero 3,5` | `"Olá"` / `3.5` |
| `relacional(<, ???, 1)` | `??? < 1` + "Falta o primeiro valor do bloco comparação" |
| `nao(???)` | `nao ???` + "Falta o valor do bloco não" |
| `negativo(???)` | `-???` + "Falta o valor do bloco negativo" |
| `e_ou` com `OP: 'xou'` | `???` + "Escolha e ou ou no bloco e/ou" |
