# Contrato: caixa de blocos, campo e mensagens de execução dos laços

Decisões: [research.md](../research.md), R-06, R-08 e R-09.

## Categoria "Repetição" (`src/blocos/caixa-blocos.js`, núcleo)

```js
export const CATEGORIA_REPETICAO = 'REPETICAO';
export const TEXTO_PARA_SEM_INTEIRO = 'Para usar o para, crie uma variável do tipo inteiro.';
export function conteudoCategoriaRepeticao(variaveis) → itens da caixa
```

Em `CAIXA_BLOCOS.contents`, logo depois de "Decisão":
`{ kind: 'category', name: 'Repetição', custom: CATEGORIA_REPETICAO, colour: COR_REPETICAO }`.

| Variáveis | Itens |
| --- | --- |
| nenhuma inteira (lista vazia ou só real/cadeia/lógico) | `enquanto`; o rótulo `TEXTO_PARA_SEM_INTEIRO`; o botão "Criar variável…" (`BOTAO_CRIAR_VARIAVEL`) |
| alguma inteira | `enquanto`; `para` com `VAR` = a **última inteira** da lista, `DE` = `numero` `1`, `ATE` = `numero` `5`, sem `PASSO` |

Entrada inválida (não lista) = lista vazia. Testado em `tests/unidade/caixa-blocos.test.js`.

## Interface (`src/ui/workspace.js`)

`ws.registerToolboxCategoryCallback(CATEGORIA_REPETICAO, () => conteudoCategoriaRepeticao(variaveisDoWorkspace(ws)))`,
como as categorias Variáveis e Entrada e saída. Nada mais na interface: os laços não têm
mutador.

## Campo de variável do `para` (headless, `tests/unidade/repeticao-blockly.test.js`)

- O menu do campo do `para` lista só as variáveis inteiras (o filtro de `variableTypes` do
  `CampoVariavel` da 002).
- Um número ou um texto não encaixa na condição do `enquanto`; uma comparação e uma variável
  lógica encaixam. Um lógico ou um texto não encaixa em de, até e passo; um número, um
  negativo, uma conta e uma variável inteira encaixam (P-1).
- Um `se` encaixa no `FACA` dos dois; um `para` encaixa no `FACA` do `enquanto` e vice-versa
  (FR-008, P-4).
- Mudar o tipo da variável de controle para real mantém a variável no campo, e o gerador
  passa a avisar (R-06); mudar de volta tira o aviso.

## Mensagens de execução (`src/core/executor-core.js`, adapter)

`traduzirErroExecucao(tipo, mensagem, rastro)` ganha, antes da tradução por tipo:

| `tipo` | `mensagem` contém | `mensagem` amigável |
| --- | --- | --- |
| `ValueError` | `passo do laço para não pode ser zero` | `O passo do para ficou zero: o laço nunca terminaria.` |
| `TypeError` | `'float' object cannot be interpreted as an integer` | `O para só conta com números inteiros: de, até e passo não podem ter casas decimais.` |

`detalhe` continua com o rastro. Os outros `ValueError` e `TypeError` não mudam. Testado em
`tests/unidade/executor-core.test.js` e, com o Core real, num caso de `executar.test.js`
(passo numa variável que vale 0).
