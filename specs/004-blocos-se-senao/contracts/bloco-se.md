# Contrato: bloco `se` no núcleo (`src/blocos/decisao.js`)

Segue o [registro de blocos da 008](../../008-portugol-valido/contracts/registro-blocos.md) e os
[tipos dos encaixes da 006](../../006-blocos-operadores/contracts/tipos-encaixe.md). Decisões:
[research.md](../research.md), R-03 a R-05. Puro: não importa o Blockly.

## Exportações

```js
export const COR_DECISAO = 210;
export function temSenao(bloco) → boolean          // bloco?.extraState?.senao === true
export function mensagemTirarSenao(quantidade) → string
export const BLOCO_SE = { /* entrada do registro, abaixo */ };
```

`mensagemTirarSenao`: 1 → `Tirar o senão apaga 1 bloco que está dentro dele.`; n > 1 →
`Tirar o senão apaga n blocos que estão dentro dele.` (n inteiro ≥ 1).

## Entrada do registro

| Chave | Valor |
| --- | --- |
| `tipo`, `rotulo` | `'se'`, `'se'` |
| `categoria` | `'comando'` |
| `areas` | `['ENTAO', 'SENAO']` |
| `variantes` | `sem senão` (`!temSenao(b)`), `com senão` (`temSenao(b)`) |

`definicao`:

```js
{
  type: 'se',
  message0: 'se %1 então',
  args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
  message1: '%1',
  args1: [{ type: 'input_statement', name: 'ENTAO' }],
  previousStatement: null,
  nextStatement: null,
  inputsInline: true,
  mutator: 'mutador_se',
  colour: COR_DECISAO,
  tooltip: 'Faz os comandos de dentro só quando a condição for verdadeira. Com “senão”, faz os outros comandos quando ela for falsa.',
}
```

A área `SENAO` (com o rótulo `senão`) não está na definição: é criada pelo mutador quando
o senão é ligado (contrato [editor-se.md](editor-se.md)).

## `gerar(bloco, ctx)`

```text
ctx.linha(`se ${ctx.valor(bloco, 'CONDICAO', 'a condição')} entao`)
ctx.comandos(bloco, 'ENTAO')
se temSenao(bloco):
  ctx.linha('senao')
  ctx.comandos(bloco, 'SENAO')
ctx.linha('fim_se')
```

| Blocos | Portugol |
| --- | --- |
| `se (idade >= 18)` com `escreva("Maior")` | `se idade >= 18 entao` / `    escreva("Maior")` / `fim_se` |
| o mesmo com senão e `escreva("Menor")` | `se idade >= 18 entao` / `    escreva("Maior")` / `senao` / `    escreva("Menor")` / `fim_se` |
| `se` dentro do senão de outro | cada um com o seu `fim_se`; o interno 4 espaços mais à direita |
| `se ok` sem comandos, com senão vazio | `se ok entao` / `senao` / `fim_se` |
| condição vazia | `se ??? entao` … e o aviso `Falta a condição do bloco se` |
| `extraState: { senao: 'sim' }` com `inputs.SENAO` | sem `senao`; o `SENAO` é ignorado |

## Garantias testadas (`tests/unidade/blocos-decisao.test.js`)

- As linhas da tabela acima, com o texto exato (cenário 1 das Histórias 1, 2 e 3).
- A condição não leva parênteses (`relacional`, `e_ou`, `nao`).
- 6 níveis de `se` aninhados: indentação 4, 8, …, 24 espaços (FR-005).
- `temSenao`: `true` só com `senao === true`; `undefined`, `false`, `'true'`, `1`, sem
  `extraState` → `false`.
- `mensagemTirarSenao(1)` e `mensagemTirarSenao(3)`.
- Definição: `check: ['Logico']` na `CONDICAO`, `ENTAO` como `input_statement`, comando
  encadeável, `mutator: 'mutador_se'`, cor, dica exata.
- Variantes: nomes e `presente` nas duas formas.
- `registroPadrao` tem o `se`.

## Tipos (`tests/unidade/tipos.test.js`)

A matriz do SC-002 da 006 ganha a coluna "`se` condição" (research R-05): ❌ para `numero`,
`texto`, `aritmetico`, `negativo` e `variavel` inteiro/real/cadeia; ✅ para `logico`,
`relacional`, `e_ou`, `nao`, `variavel` lógica e `variavel` sem variável.
