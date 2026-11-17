# Contrato: o `se` no editor (interface)

Interface, fora da cobertura. Testada headless em `tests/unidade/decisao-blockly.test.js` e
no [quickstart](../quickstart.md). Decisões: [research.md](../research.md), R-04, R-06, R-08.

## Mutador `mutador_se` (`src/ui/mutador-se.js`)

```js
registrarMutadorSe({ confirmarTirarSenao }) → void   // idempotente
// confirmarTirarSenao({ quantidade, mensagem }) → Promise<boolean>
```

| Membro do bloco | Comportamento |
| --- | --- |
| `saveExtraState()` | `{ senao: true }` com o senão; `null` sem ele (nada salvo). |
| `loadExtraState(estado)` | Liga o senão se `estado?.senao === true`. |
| `ligarSenao()` | Sem senão: cria a área `SENAO` (rótulo `senão`), num grupo de eventos com um `BlockChange` de `mutation`. |
| `tirarSenao()` | Com senão e área vazia: tira a área (grupo + `mutation`). Com N blocos: chama `confirmarTirarSenao({ quantidade: N, mensagem: mensagemTirarSenao(N) })`; com `true` e o bloco ainda vivo, apaga os blocos da área e tira a área **no mesmo grupo**; com `false`, nada. |

- Ícone no fim da linha da condição: `+` (dica `Acrescentar senão`) sem senão; `−` (dica
  `Tirar o senão`) com senão. No flyout, o clique não faz nada.
- N = `getDescendants(false).length` do primeiro bloco da área e dos seguintes da cadeia
  (todos os blocos que o Blockly apagaria).
- Um Ctrl+Z depois de "Tirar o senão" volta a área e os blocos; depois de ligar, tira a
  área.

## Ligação (`src/ui/workspace.js`)

`registrarMutadorSe({ confirmarTirarSenao })` antes do `defineBlocksWithJsonArray`, ao lado
do `registrarMutadorEscreva()`. No navegador:

```js
confirmarTirarSenao: ({ mensagem }) =>
  confirmar({ titulo: TEXTOS.tirarSenaoTitulo, mensagem, confirmar: TEXTOS.tirarSenaoConfirmar, cancelar: TEXTOS.cancelar })
```

## Textos (`src/ui/textos.js`)

| Chave | Texto |
| --- | --- |
| `acrescentarSenao` | `Acrescentar senão` |
| `tirarSenao` | `Tirar o senão` |
| `tirarSenaoTitulo` | `Tirar o senão?` |
| `tirarSenaoConfirmar` | `Tirar o senão` |

## Caixa de blocos (`src/blocos/caixa-blocos.js`)

Categoria nova, logo depois de "Entrada e saída":

```js
{
  kind: 'category',
  name: 'Decisão',
  colour: COR_DECISAO,
  contents: [
    { kind: 'block', type: 'se' },
    { kind: 'block', type: 'se', extraState: { senao: true } },
  ],
}
```

## Garantias testadas (headless)

- Verificador `meupia`: a `CONDICAO` recusa `numero`, `texto`, `aritmetico`, `negativo`,
  `variavel` inteira e de texto; aceita `relacional`, `e_ou`, `nao`, `logico`, `variavel`
  lógica (P-1).
- `ok` (lógico) na condição; `aplicarTipoVariavel(ws, idOk, 'inteiro')` desencaixa o bloco
  da condição; um `ws.undo(false)` volta o tipo e o encaixe.
- `se` encaixa em `programa.COMANDOS`, no `ENTAO` e no `SENAO` de outro `se` (FR-004).
- `ligarSenao` cria `SENAO`; `tirarSenao` com área vazia tira sem chamar a confirmação.
- Com 2 comandos no senão, com um valor encaixado em cada: a confirmação recebe
  `quantidade: 4`; `true` apaga os 4 e tira a área; **um** desfazer volta a área e os 4
  blocos; `false` não muda nada.
- Bloco apagado antes da resposta: a resposta `true` é ignorada sem erro.
- Ida e volta da serialização com e sem senão; `gerarPortugol` do estado serializado igual
  ao esperado.
- Os itens da categoria "Decisão" (`tests/unidade/caixa-blocos.test.js`).
