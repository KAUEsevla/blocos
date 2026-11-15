# Contrato: blocos escreva e leia e a categoria "Entrada e saída"

Módulos `src/blocos/entrada-saida.js`, `src/blocos/campo-variavel.js` e
`src/blocos/caixa-blocos.js` (núcleo, sem Blockly, dentro da cobertura). Entradas do
[registro de blocos](../../008-portugol-valido/contracts/registro-blocos.md). Dados em
[data-model.md](../data-model.md).

## `campoVariavel()` (`src/blocos/campo-variavel.js`)

```js
export function campoVariavel(): {
  type: 'campo_variavel', name: 'VAR', variable: null,
  variableTypes: ['inteiro', 'real', 'cadeia', 'logico'], defaultType: 'inteiro',
}
```

Mesmo objeto que a 002 usava dentro de `src/blocos/variaveis.js`, agora exportado e
usado por `variavel_recebe`, `variavel` e `leia` (P-3). Sem mudança de comportamento.

## `BLOCO_ESCREVA`

| Chave | Valor |
| --- | --- |
| `tipo` | `'escreva'` |
| `rotulo` | `'escreva'` |
| `categoria` | `'comando'` |
| `variantes` | `um valor` (`quantidadeValores(b) === 1`), `vários valores` (`> 1`) |
| `definicao` | `type: 'escreva'`, `message0: 'escreva %1'` com `VALOR1`, `previousStatement`, `nextStatement`, `inputsInline: true`, `mutator: 'mutador_escreva'`, `tooltip: 'Mostra os valores na tela, um ao lado do outro, e passa para a próxima linha'`, cor da categoria. Os encaixes `VALOR2…VALORn` são criados pelo mutador a partir do `extraState`. |

```js
export const MAX_VALORES = 10;
export function quantidadeValores(bloco) → number   // 1..10, regra do data-model
export function nomeEncaixe(k) → string              // 'VALOR' + k
```

`gerar(bloco, ctx)`:

```js
const n = quantidadeValores(bloco);
const valores = [];
for (let k = 1; k <= n; k++)
  valores.push(ctx.valor(bloco, nomeEncaixe(k), n === 1 ? 'o valor' : `o valor ${k}`));
ctx.linha(`escreva(${valores.join(', ')})`);
```

Garantias: nunca emite `escreva()`; avisos saem na ordem dos encaixes; os encaixes
acima de `n` não são lidos.

## `BLOCO_LEIA`

| Chave | Valor |
| --- | --- |
| `tipo` | `'leia'` |
| `rotulo` | `'leia'` |
| `categoria` | `'comando'` |
| `variantes` | nenhuma (padrão) |
| `definicao` | `type: 'leia'`, `message0: 'leia %1'`, `args0: [campoVariavel()]`, `previousStatement`, `nextStatement`, `tooltip: 'Pede um valor a quem usa o programa e guarda na variável. Numa variável lógica, só “verdadeiro” vira verdadeiro; o resto vira falso.'`, cor da categoria. **Sem** `input_value`. |

`gerar(bloco, ctx)`: `ctx.linha(\`leia(${ctx.variavel(bloco, 'VAR', 'a variável')})\`)`.

## Caixa de blocos (`src/blocos/caixa-blocos.js`)

```js
export const CATEGORIA_ENTRADA_SAIDA = 'ENTRADA_SAIDA';
export const COR_ENTRADA_SAIDA = 160;            // valor final escolhido na task
export const TEXTO_LEIA_SEM_VARIAVEL = 'Para usar o leia, crie uma variável primeiro.';
export function conteudoCategoriaEntradaSaida(variaveis) → ItemCaixa[]
```

`CAIXA_BLOCOS.contents` passa a ser, em ordem: Variáveis (002), **Entrada e saída**
(`custom: 'ENTRADA_SAIDA'`), **Valores** e **Contas** (ver
[blocos-valores-contas.md](blocos-valores-contas.md)).

`conteudoCategoriaEntradaSaida(variaveis)`:

| `variaveis` | Itens, em ordem |
| --- | --- |
| vazia, ausente ou não lista | `escreva` com `inputs.VALOR1.block` = `texto` “Olá, mundo!”; `{ kind: 'label', text: TEXTO_LEIA_SEM_VARIAVEL }`; `{ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL }` |
| com variáveis | o mesmo `escreva`; `leia` com `fields.VAR = { id }` da **última** da lista (mesma regra do "recebe" da 002) |

Pura: a mesma lista dá sempre os mesmos itens; não lê o workspace.
