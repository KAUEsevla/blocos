# Contrato: interface dos operadores e dos tipos (RF-06, RF-02)

Módulos de interface (fora da cobertura, chamam só as regras puras de
[tipos-encaixe.md](tipos-encaixe.md)): `src/ui/verificador-encaixe.js` (novo),
`src/ui/workspace.js`, `src/ui/acoes-variavel.js`, `src/ui/campo-variavel.js`. Decisões:
[research.md](../research.md), R-09, R-10, R-12.

## Verificador de encaixe `meupia`

```js
export const NOME_VERIFICADOR = 'meupia';
export class VerificadorEncaixe extends Blockly.ConnectionChecker {
  doTypeChecks(a, b) → boolean
}
export function registrarVerificadorEncaixe()   // idempotente, como registrarCampoVariavel
```

- `doTypeChecks`: identifica qual conexão é a saída (`OUTPUT_VALUE`) e qual é o encaixe
  (`INPUT_VALUE`); para cada uma, `checkEfetivo(registroPadrao.obter(bloco.type), ponto,
  tipoVariavel)`, com `ponto` = `'saida'` ou o nome do `input` e `tipoVariavel` lido de
  `bloco.getField('VAR')?.getVariable()?.getType()`; devolve `compativeis(...)`. Conexões de
  comando (`previous`/`next`) seguem o `super.doTypeChecks`.
- `workspace.js`: `registrarVerificadorEncaixe()` em `definirBlocos()` e
  `plugins: { connectionChecker: NOME_VERIFICADOR }` no `Blockly.inject`.

## Mudar o tipo de uma variável em uso

`mudarTipoVariavel(ws, idVariavel)` (002) passa a fazer, depois da resposta do diálogo:

```text
Blockly.Events.setGroup(true)
  pares = encaixesIncompativeis(salvar(ws).blocks, registroPadrao, tipos com idVariavel → novo)
          filtrados aos que têm o pai ou o filho usando idVariavel
  para cada par: filho.unplug(); afastar o filho um pouco (fica solto, visível)
  mapa.changeVariableType(variavel, novo)
Blockly.Events.setGroup(false)
```

## Trocar a variável no menu do campo

```js
export function trocarVariavelDoBloco(bloco, idNova)   // src/ui/campo-variavel.js
```

Num único grupo de eventos: se o bloco está encaixado e a variável nova deixa a saída
incompatível com o encaixe do pai, desencaixa o bloco; se o bloco é um `variavel_recebe` e
o valor encaixado em `VALOR` não cabe no tipo novo, desencaixa esse valor; **depois** aplica
a variável no campo `VAR`. `CampoVariavel.onItemSelected_` (002) só chama essa função para
uma variável escolhida; os três itens de ação seguem para as ações de variável.

## Comportamento esperado (teste headless e quickstart)

| Ação | Resultado |
| --- | --- |
| Encaixar `numero` no `e_ou` | não encaixa |
| Encaixar `relacional` no `aritmetico` | não encaixa |
| Encaixar variável `logico` no `negativo` | não encaixa |
| Encaixar `numero` no `recebe` de variável `logico` | não encaixa |
| Encaixar `variavel` sem variável no `e_ou` e depois escolher uma variável `inteiro` | o bloco sai do encaixe e fica solto; o `e_ou` mostra `???` + aviso |
| Variável `idade` (`inteiro`) em `idade + 1`; mudar o tipo para `logico` | o bloco `idade` sai da conta; Portugol mostra `??? + 1` + aviso; Ctrl+Z volta o tipo `inteiro` e o bloco ao encaixe |
| `ok recebe 5`? | impossível montar: o `5` não encaixa no `recebe` de `ok` (`logico`) |
| Carregar qualquer caso de `tests/aceitacao/casos/` no Blockly com o verificador | carrega sem `BadConnectionCheck` |

## Caixa de blocos

`CAIXA_BLOCOS.contents` (puro, `src/blocos/caixa-blocos.js`):

```js
{ kind: 'category', name: 'Valores', colour: COR_VALORES, contents: [
    { kind: 'block', type: 'numero' }, { kind: 'block', type: 'texto' },
    { kind: 'block', type: 'logico', fields: { VALOR: 'verdadeiro' } } ] }
{ kind: 'category', name: 'Contas', colour: COR_CONTAS, contents: [
    { kind: 'block', type: 'aritmetico', fields: { OP: '+' } }, { kind: 'block', type: 'negativo' } ] }
{ kind: 'category', name: 'Comparações', colour: COR_COMPARACOES, contents: [
    { kind: 'block', type: 'relacional', fields: { OP: '=' } } ] }
{ kind: 'category', name: 'Lógica', colour: COR_LOGICA, contents: [
    { kind: 'block', type: 'e_ou', fields: { OP: 'e' } },
    { kind: 'block', type: 'e_ou', fields: { OP: 'ou' } },
    { kind: 'block', type: 'nao' } ] }
```

Ordem das categorias: Variáveis, Entrada e saída, Valores, Contas, Comparações, Lógica.
