# Contrato: interface dos blocos de entrada e saída

Módulos `src/ui/mutador-escreva.js` e `src/ui/validador-numero.js` (novos),
`src/ui/workspace.js` e `src/ui/textos.js`.
Interface, **fora da cobertura**; as regras ficam no núcleo
([blocos-entrada-saida.md](blocos-entrada-saida.md),
[blocos-valores-contas.md](blocos-valores-contas.md)). Verificado no
[quickstart.md](../quickstart.md) e, onde o Blockly headless permite, em
`tests/unidade/entrada-saida-blockly.test.js`.

## Registro antes das definições

`definirBlocos()` (workspace.js) passa a registrar, antes do
`defineBlocksWithJsonArray`, nesta ordem e de forma idempotente:

1. `registrarCampoVariavel()` (002, sem mudança);
2. `registrarMutadorEscreva()` → `Blockly.Extensions.registerMutator('mutador_escreva', …)`;
3. `registrarValidadorNumero()` → `Blockly.Extensions.register('validar_numero', …)`.

Os testes headless que definem os blocos do `registroPadrao` chamam as mesmas três
funções.

## Mutador do `escreva` (`mutador_escreva`)

| Parte | Comportamento |
| --- | --- |
| `saveExtraState()` | `{ valores: n }` com `n` = encaixes atuais. |
| `loadExtraState(estado)` | Recria os encaixes até `quantidadeValores({ extraState: estado })`. |
| Ícone "+" | `FieldImage` clicável depois do último encaixe; acrescenta `VALOR(n+1)`. Some quando `n = MAX_VALORES`. Texto alternativo "Acrescentar um valor". |
| Ícone "−" | Remove `VALORn`; o bloco que estava nele fica solto na área, perto do `escreva`. Some quando `n = 1`. Texto alternativo "Tirar o último valor". |
| Desfazer | Cada clique dispara um `BlockChange` de `mutation` (estado antes/depois) dentro de um grupo de eventos junto com o desencaixe; um Ctrl+Z volta a quantidade e o bloco ao encaixe. |
| Métodos | Os ícones chamam `acrescentarValor()` e `tirarValor()` do mixin, que os testes sem tela também chamam. Nos limites não fazem nada. |
| Caixa de blocos | Os ícones não agem no bloco da caixa (só no workspace principal). |
| Portugol | O evento de mudança é não-UI, então o atualizador da 007 regenera o texto sem gancho extra. |

## Validador do número (`validar_numero`)

Extensão que põe no campo `NUM` um validador: `texto → normalizarNumero(texto)`.
`null` recusa a edição (o Blockly mantém o valor anterior e mostra o campo como
inválido enquanto se digita). O valor aceito é guardado já normalizado (`3,5` vira
`3.5` ao sair do campo).

## Categoria "Entrada e saída"

```js
ws.registerToolboxCategoryCallback(CATEGORIA_ENTRADA_SAIDA,
  () => conteudoCategoriaEntradaSaida(variaveisDoWorkspace(ws)));
```

O botão "Criar variável…" da orientação usa o mesmo `callbackKey` já registrado pela 002
(`BOTAO_CRIAR_VARIAVEL`): nenhuma ação nova.

## Textos novos (`textos.js`)

| Chave | Texto |
| --- | --- |
| `acrescentarValor` | `Acrescentar um valor` |
| `tirarValor` | `Tirar o último valor` |

Rótulos de categoria ("Entrada e saída", "Valores", "Contas"), dicas dos blocos e o
texto de orientação do `leia` ficam nas definições puras (núcleo), como na 002.
