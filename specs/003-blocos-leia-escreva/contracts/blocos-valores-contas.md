# Contrato: valores fixos, conta aritmética e parênteses (RF-06, antecipado da 006)

Módulos `src/blocos/valores.js`, `src/blocos/contas.js`, `src/portugol/precedencia.js`
e `src/portugol/gerador.js` (núcleo). Decisão de antecipar: [research.md](../research.md),
R-03. Tasks e commits citam **RF-06**. A spec 006 continua estes blocos sem mudar
`type`, campos ou variantes.

## Precedência

```js
export const PRECEDENCIA = Object.freeze({ ADITIVO: 50, MULTIPLICATIVO: 60, PRIMARIO: 100 });
```

A 006 acrescenta `OU`, `E`, `NAO`, `RELACIONAL` (abaixo de 50) e `UNARIO` (entre 60 e
100), na escala da 008/R-02.

## `ctx.valor` com precedência mínima (altera o contrato da 008)

```js
ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0) → string
```

| Filho | Resultado |
| --- | --- |
| ausente | `???` + aviso (como hoje); nunca entre parênteses |
| desconhecido ou não `valor` | `???` + aviso "Bloco desconhecido" (como hoje) |
| `{ codigo, precedencia }` com `precedencia >= precedenciaMinima` | `codigo` |
| `{ codigo, precedencia }` com `precedencia < precedenciaMinima` | `(codigo)` |

Sem o quarto argumento nada muda para `variavel_recebe`, `escreva` ou qualquer bloco
existente. O [registro-blocos.md](../../008-portugol-valido/contracts/registro-blocos.md)
da 008 é atualizado com esta linha.

## `BLOCO_NUMERO`

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` | `'numero'` / `'número'` |
| `categoria` | `'valor'` |
| `variantes` | `inteiro` (`NUM` sem `.`), `real` (`NUM` com `.`) |
| `definicao` | `message0: '%1'`, `field_input` `NUM` com `text: '0'`, `output: null`, `extensions: ['validar_numero']`, `tooltip: 'Um número. Use vírgula ou ponto para as casas decimais, como 3,5'` |

```js
export function normalizarNumero(texto) → string | null   // tabela do data-model
```

`gerar(bloco, ctx)`: `{ codigo: normalizarNumero(NUM), precedencia: PRIMARIO }` (normaliza
sempre, mesmo que o campo já guarde o valor normalizado; `NUM: "007"` gera `7`). Se
`normalizarNumero(NUM)` der `null`: `ctx.aviso(bloco, 'NUM', 'O número do bloco número é inválido')`
e `{ codigo: '???', precedencia: PRIMARIO }`.

A extensão `validar_numero` é registrada pela interface
([editor-entrada-saida.md](editor-entrada-saida.md)) e só liga o validador do campo à
`normalizarNumero`.

## `BLOCO_TEXTO`

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` | `'texto'` / `'texto'` |
| `categoria` | `'valor'` |
| `variantes` | `simples`, `com aspas ou barra` (`TEXTO` contém `"` ou `\`) |
| `definicao` | `message0: '“%1”'`, `field_input` `TEXTO` com `text: ''`, `output: null`, `tooltip: 'Um texto, mostrado exatamente como foi digitado'` |

```js
export function gerarTexto(conteudo) → string   // '"' + escapado + '"'
```

`gerar`: `{ codigo: gerarTexto(TEXTO ?? ''), precedencia: PRIMARIO }`.

## `BLOCO_ARITMETICO` (`src/blocos/contas.js`)

| Chave | Valor |
| --- | --- |
| `tipo` / `rotulo` | `'aritmetico'` / `'conta'` |
| `categoria` | `'valor'` |
| `variantes` | uma por `OP`: `+`, `-`, `*`, `/`, `%` (`presente: b => b.fields?.OP === op`) |
| `definicao` | `message0: '%1 %2 %3'`: `input_value A`, `field_dropdown OP` (`[['+','+'],['−','-'],['×','*'],['÷','/'],['resto','%']]`), `input_value B`; `inputsInline: true`, `output: null`, `tooltip: 'Faz a conta com os dois valores. “resto” é o que sobra da divisão'` |

```js
export const OPERADORES_ARITMETICOS = Object.freeze({
  '+': { simbolo: '+', precedencia: PRECEDENCIA.ADITIVO },
  '-': { simbolo: '-', precedencia: PRECEDENCIA.ADITIVO },
  '*': { simbolo: '*', precedencia: PRECEDENCIA.MULTIPLICATIVO },
  '/': { simbolo: '/', precedencia: PRECEDENCIA.MULTIPLICATIVO },
  '%': { simbolo: '%', precedencia: PRECEDENCIA.MULTIPLICATIVO },
});
```

`gerar(bloco, ctx)`:

```js
const op = OPERADORES_ARITMETICOS[ctx.campo(bloco, 'OP')];
if (!op) { ctx.aviso(bloco, 'OP', 'Escolha a conta do bloco conta'); return { codigo: '???', precedencia: PRIMARIO }; }
const a = ctx.valor(bloco, 'A', 'o primeiro valor', op.precedencia);
const b = ctx.valor(bloco, 'B', 'o segundo valor', op.precedencia + 1);
return { codigo: `${a} ${op.simbolo} ${b}`, precedencia: op.precedencia };
```

## Caixa de blocos

```js
{ kind: 'category', name: 'Valores', colour: COR_VALORES, contents: [
    { kind: 'block', type: 'numero' }, { kind: 'block', type: 'texto' } ] }
{ kind: 'category', name: 'Contas', colour: COR_CONTAS, contents: [
    { kind: 'block', type: 'aritmetico', fields: { OP: '+' } } ] }
```

## Exemplos de geração (testes de unidade)

| Estrutura | Portugol |
| --- | --- |
| `soma(variavel idade, numero 1)` | `idade + 1` |
| `mult(soma(2, 3), 4)` | `(2 + 3) * 4` |
| `sub(10, sub(3, 2))` | `10 - (3 - 2)` |
| `sub(sub(10, 3), 2)` | `10 - 3 - 2` |
| `div(8, mult(2, 2))` | `8 / (2 * 2)` |
| `mult(div(8, 2), 2)` | `8 / 2 * 2` |
| `soma(???, 1)` | `??? + 1` + aviso "Falta o primeiro valor do bloco conta" |
| `texto a"b\c` | `"a\"b\\c"` |
