# Contrato: blocos `enquanto` e `para` no núcleo (`src/blocos/repeticao.js`)

Segue o [registro de blocos da 008](../../008-portugol-valido/contracts/registro-blocos.md) e os
[tipos dos encaixes da 006](../../006-blocos-operadores/contracts/tipos-encaixe.md). Decisões:
[research.md](../research.md), R-03 a R-07. Puro: não importa o Blockly.

## Exportações

```js
export const COR_REPETICAO = 120;
export function valorFixo(no) → string | null        // data-model.md, "Valor fixo"
export const BLOCO_ENQUANTO = { /* abaixo */ };
export const BLOCO_PARA = { /* abaixo */ };
```

## `enquanto`

| Chave | Valor |
| --- | --- |
| `tipo`, `rotulo` | `'enquanto'`, `'enquanto'` |
| `categoria` | `'comando'` |
| `areas` | `['FACA']` |
| `variantes` | nenhuma |

```js
definicao: {
  type: 'enquanto',
  message0: 'enquanto %1 faça',
  args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
  message1: '%1',
  args1: [{ type: 'input_statement', name: 'FACA' }],
  previousStatement: null,
  nextStatement: null,
  inputsInline: true,
  colour: COR_REPETICAO,
  tooltip: 'Repete os comandos de dentro enquanto a condição for verdadeira. Se ela nunca ficar falsa, use Parar.',
}
```

`gerar`:

```text
ctx.linha(`enquanto ${ctx.valor(bloco, 'CONDICAO', 'a condição')} faca`)
ctx.comandos(bloco, 'FACA')
ctx.linha('fim_enquanto')
```

## `para`

| Chave | Valor |
| --- | --- |
| `tipo`, `rotulo` | `'para'`, `'para'` |
| `categoria` | `'comando'` |
| `areas` | `['FACA']` |
| `variantes` | `sem passo` (`!b.inputs?.PASSO?.block`), `com passo` (`Boolean(b.inputs?.PASSO?.block)`) |

```js
definicao: {
  type: 'para',
  message0: 'para %1 de %2 até %3 passo %4 faça',
  args0: [
    campoVariavel(['inteiro']),                       // name: 'VAR'
    { type: 'input_value', name: 'DE', check: ['Numero'] },
    { type: 'input_value', name: 'ATE', check: ['Numero'] },
    { type: 'input_value', name: 'PASSO', check: ['Numero'] },
  ],
  message1: '%1',
  args1: [{ type: 'input_statement', name: 'FACA' }],
  previousStatement: null,
  nextStatement: null,
  inputsInline: true,
  colour: COR_REPETICAO,
  tooltip: 'Repete os comandos de dentro contando com a variável, de “de” até “até”, incluindo os dois. Sem passo, conta de 1 em 1; com passo negativo, conta para trás.',
}
```

`gerar` (avisos na ordem do texto):

```text
v     = ctx.variavel(bloco, 'VAR', 'a variável de controle')
se v ≠ '???' e ctx.tipoVariavel(bloco, 'VAR') ≠ 'inteiro':
  ctx.aviso(bloco, 'VAR', 'A variável de controle do bloco para precisa ser do tipo inteiro')
de    = ctx.valor(bloco, 'DE', 'o valor inicial (de)');   decimais(DE)
ate   = ctx.valor(bloco, 'ATE', 'o valor final (até)');   decimais(ATE)
passo = inputs.PASSO.block ? ctx.valor(bloco, 'PASSO', 'o passo') : null
se passo: decimais(PASSO); se valorFixo(PASSO) vale zero:
  ctx.aviso(bloco, 'PASSO', 'O passo do bloco para não pode ser zero: o laço nunca terminaria')
ctx.linha(`para ${v} de ${de} ate ${ate}${passo ? ` passo ${passo}` : ''} faca`)
ctx.comandos(bloco, 'FACA')
ctx.linha('fim_para')

decimais(X): se valorFixo(X) contém '.':
  ctx.aviso(bloco, X, 'O bloco para só conta com números inteiros: tire as casas decimais')
```

| Blocos | Portugol |
| --- | --- |
| `para i de 1 até 5`, passo vazio, `escreva(i)` | `para i de 1 ate 5 faca` / `    escreva(i)` / `fim_para` |
| `para i de 5 até 1 passo −1` | `para i de 5 ate 1 passo -1 faca` … |
| `para i de 1 até n × 2 passo k` | `para i de 1 ate n * 2 passo k faca` … |
| `enquanto n > 0` com dois comandos | `enquanto n > 0 faca` / `    escreva(n)` / `    n <- n - 1` / `fim_enquanto` |
| `se` dentro de `para` dentro de `enquanto` | cada um com o seu fechamento; 4 espaços a mais por nível |
| corpos vazios | só a linha de abertura e a de fechamento |
| passo `0` (ou `-0`, `0,0`) | o texto com `passo 0` e o aviso do passo zero |
| até `3,5` | `ate 3.5` e o aviso das casas decimais |
| variável `x: real` no campo | o texto com `x` e o aviso da variável inteira |

## Garantias testadas (`tests/unidade/blocos-repeticao.test.js`)

- As linhas da tabela acima, com o texto exato (FR-001, FR-002, FR-005; cenário 1 das
  Histórias 1 e 2).
- Sem passo, o texto não contém `passo` (FR-005).
- Cada aviso da tabela do [data-model.md](../data-model.md) com `encaixe` e mensagem exatos;
  passo numa expressão ou variável não gera aviso.
- `valorFixo`: `numero`, `negativo` de `numero`, `negativo` de expressão (`null`), `NUM`
  inválido (`null`), ausente (`null`).
- Definições: `check` dos encaixes, campo `VAR` só com `['inteiro']`, `FACA` como
  `input_statement`, comandos encadeáveis, cor e dicas exatas (a do `para` cita os dois
  limites, FR-006).
- Variantes do `para` nas duas formas; `registroPadrao` tem `enquanto` e `para`.

## `ctx.tipoVariavel` (`src/portugol/gerador.js`)

```js
ctx.tipoVariavel(bloco, campo) → 'inteiro' | 'real' | 'cadeia' | 'logico' | undefined
```

Resolve o `{ id }` do campo em `projeto.variaveis`, como `ctx.variavel`, e devolve o `tipo`.
Não registra aviso. Testada em `tests/unidade/gerador.test.js`.

## `campoVariavel(tipos)` (`src/blocos/campo-variavel.js`)

`campoVariavel(tipos = TIPOS_VARIAVEL)`: `variableTypes` = cópia de `tipos`; `defaultType` =
`tipos[0]`. Sem argumento, igual a hoje.

## Tipos (`tests/unidade/tipos.test.js`)

A matriz do SC-002 da 006 ganha as colunas "`enquanto` condição" e "`para` de/até/passo"
(research R-07).
