# Contrato: blocos fora do programa (`src/portugol/fora-do-programa.js`)

Módulo do núcleo (dentro da cobertura). Função pura sobre a serialização do Blockly
(mesmo formato que o gerador recebe, 008/R-05). Decisão em
[research.md](../research.md), R-04.

## API

```js
export const MENSAGEM_FORA_DO_PROGRAMA = 'Esta pilha está fora do programa';

blocosForaDoPrograma(blocos) → Array<{ blocoId: string, mensagem: string }>
```

`blocos` é `projeto.blocos` (`{ blocks: { languageVersion, blocks: [...] } }`).

## Regras

1. Percorre `blocos.blocks.blocks` na ordem em que estão.
2. O **primeiro** bloco com `type === 'programa'` é a raiz e não entra no resultado.
3. Todo outro bloco de topo entra, com `blocoId = bloco.id` e a mensagem fixa,
   inclusive um segundo `programa`.
4. Blocos encaixados (em `inputs` ou `next`) nunca são visitados.
5. Itens sem `id` de texto não entram.
6. `blocos` ausente, `blocos.blocks` ausente ou `blocos.blocks.blocks` que não é lista
   → `[]`.
7. Não modifica a entrada.

É a mesma regra de raiz do gerador (`encontrarRaiz` em `src/portugol/gerador.js`): o
que a função marca é exatamente o que o gerador deixa de fora (SC-003).

## Testes (`tests/unidade/fora-do-programa.test.js`)

| Entrada | Esperado |
| --- | --- |
| `projetoVazio().blocos` | `[]` |
| programa com comandos encaixados | `[]` |
| 2 soltos (`a`, `b`) depois do programa | `[{a}, {b}]`, nessa ordem, com a mensagem |
| solto antes do programa na lista | é marcado; o programa não |
| pilha solta de 3 blocos (`next`) | 1 item (o topo) |
| solto com filhos em `inputs` | 1 item (o topo) |
| dois `programa` | o segundo é marcado |
| `undefined`, `{}`, `{ blocks: {} }`, `{ blocks: { blocks: 'x' } }` | `[]` |
| item sem `id` | ignorado |
| 100 soltos | 100 itens |
| entrada congelada (`Object.freeze` profundo) | não lança |
