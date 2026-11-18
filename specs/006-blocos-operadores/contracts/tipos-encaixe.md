# Contrato: tipos dos encaixes (SC-002, RF-06; pendência P-2 da 002)

Módulo `src/blocos/tipos.js` (núcleo, puro, sem Blockly) e a chave opcional
`tipoPelaVariavel` do registro. Decisões: [research.md](../research.md), R-08 a R-10.

## Tipos

```js
export const TIPO_VALOR = Object.freeze({ NUMERO: 'Numero', TEXTO: 'Texto', LOGICO: 'Logico' });

// Tipo da variável (inteiro, real, cadeia, logico) → check; desconhecido ou ausente → null.
export function checkDoTipoVariavel(tipo) → string[] | null
//   inteiro, real → ['Numero'];  cadeia → ['Texto'];  logico → ['Logico'];  outro → null

// Regra do Blockly: null de qualquer lado = compatível; senão, precisa de um tipo em comum.
export function compativeis(checkA, checkB) → boolean
```

## Chave do registro `tipoPelaVariavel`

Opcional. Quando presente, o `check` daquele ponto do bloco vem do tipo da variável do campo
`VAR`, e não da `definicao`.

| Valor | Ponto | Usado por |
| --- | --- | --- |
| `'saida'` | a saída do bloco | `variavel` |
| nome de um `input_value` (`'VALOR'`) | aquele encaixe | `variavel_recebe` |

O registro recusa (erro ao registrar) um valor que não seja `'saida'` nem o nome de um
`input_value` da `definicao`, e recusa a chave em bloco sem campo `VAR`. O contrato
[registro-blocos.md](../../008-portugol-valido/contracts/registro-blocos.md) da 008 ganha esta
linha.

## Check efetivo

```js
// ponto: 'saida' ou o nome do encaixe. tipoVariavel: o tipo da variável do campo VAR do
// bloco, ou undefined. Devolve o check que vale naquele ponto agora.
export function checkEfetivo(entradaRegistro, ponto, tipoVariavel) → string[] | null
```

| Situação | Resultado |
| --- | --- |
| `entradaRegistro.tipoPelaVariavel === ponto` | `checkDoTipoVariavel(tipoVariavel)` |
| `ponto === 'saida'` | `definicao.output` (normalizado: string → `[string]`, `null` → `null`) |
| encaixe | `check` do `input_value` com esse nome, ou `null` |
| bloco desconhecido (sem entrada) | `null` |

## Encaixes incompatíveis

```js
// estado: o objeto `blocks` do Blockly ({ languageVersion, blocks: [...] }), como em
// projeto.blocos.blocks. tipos: Map ou objeto idVariavel → tipo.
// Percorre todos os blocos de topo, seus inputs e next (inclusive blocos soltos).
export function encaixesIncompativeis(estado, registro, tipos)
  → Array<{ pai: string, encaixe: string, filho: string }>   // ids dos blocos, na ordem da visita
```

Para cada filho encaixado em `inputs[encaixe].block`: incompatível se
`!compativeis(checkEfetivo(pai, encaixe, tipoDe(pai)), checkEfetivo(filho, 'saida', tipoDe(filho)))`,
em que `tipoDe(b) = tipos[b.fields?.VAR?.id]`. Shadows não existem no editor e são ignorados.

Usado por:

- **meta-aceitação**: todo caso em `tests/aceitacao/casos/` precisa devolver `[]`;
- **mudar o tipo** e **trocar a variável** (interface, [editor-operadores.md](editor-operadores.md)):
  chamada com o tipo novo simulado em `tipos`, para saber o que desencaixar antes.

## Matriz do SC-002 (teste de unidade)

✅ = encaixa, ❌ = não encaixa. Linhas: saída do filho. Colunas: encaixe do pai.

| Filho \ Encaixe | `aritmetico` A/B | `negativo` X | `relacional` A/B | `e_ou` A/B | `nao` X | `recebe` inteiro/real | `recebe` cadeia | `recebe` logico | `recebe` sem variável | `escreva` | `se` condição (004) | `enquanto` condição (005) | `para` de/até/passo (005) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `numero` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `texto` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `logico` | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `aritmetico` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `negativo` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `relacional`, `e_ou`, `nao` | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `variavel` inteiro/real | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `variavel` cadeia | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `variavel` logico | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| `variavel` sem variável | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

SC-002 em uma linha: nenhuma célula ❌ fica ✅ entre {lógico} e {número} — conferido célula a
célula pelo teste.

## Regra para as specs 004 e 005

| Bloco (spec) | Encaixe | `check` |
| --- | --- | --- |
| `se` (004) | condição | `['Logico']` — aplicada na 004 ([bloco-se.md](../../004-blocos-se-senao/contracts/bloco-se.md)) |
| `enquanto` (005) | condição | `['Logico']` — aplicada na 005 ([blocos-repeticao.md](../../005-blocos-repeticao/contracts/blocos-repeticao.md)) |
| `para` (005) | de, até, passo | `['Numero']` — aplicada na 005 ([blocos-repeticao.md](../../005-blocos-repeticao/contracts/blocos-repeticao.md)) |

Assim uma variável lógica, uma comparação ou um `e`/`ou` cabem na condição, e um número não.

## Regra para a spec 012

Carregar um arquivo com um encaixe incompatível (por exemplo, feito à mão) faz o
`Blockly.serialization.workspaces.load` lançar `BadConnectionCheck`, porque o verificador
`meupia` recusa o encaixe. A 012 trata esse erro e mostra uma mensagem amigável em pt-BR,
sem stack trace (princípio V). `encaixesIncompativeis` pode ser usada antes da carga para
apontar quais blocos estão no lugar errado (research R-15).

**Resolvida pela 012** ([contracts/carregar.md](../../012-carregar-projeto/contracts/carregar.md)):
`validarBlocos` chama `encaixesIncompativeis` antes da carga e recusa o arquivo com a
mensagem "um valor lógico está encaixado onde só cabe número" (os nomes vêm do check dos dois
lados); se o Blockly ainda lançar `BadConnectionCheck` no ensaio, `classificarErroCarga` o
traduz para "um bloco está encaixado num lugar onde não cabe". O projeto aberto não muda.
