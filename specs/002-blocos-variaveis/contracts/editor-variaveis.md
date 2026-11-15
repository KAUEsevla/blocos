# Contrato: interface de variáveis

Interface, fora da cobertura (`src/ui/`, `src/main.js`, `index.html`). Complementa o
[contrato da tela da 001](../../001-tela-tres-paineis/contracts/tela.md) e o
[contrato do editor da 007](../../007-portugol-tempo-real/contracts/editor.md). Todas
as regras ficam no núcleo; aqui só há ligação com o Blockly e o DOM.

## `index.html`

```html
<dialog id="dialogo-variavel" aria-labelledby="variavel-titulo">
  <form method="dialog">
    <h2 id="variavel-titulo"></h2>
    <label id="variavel-rotulo-nome">Nome <input id="variavel-nome" maxlength="30" autocomplete="off" spellcheck="false"></label>
    <label id="variavel-rotulo-tipo">Tipo
      <select id="variavel-tipo">
        <option value="inteiro">inteiro (número sem vírgula)</option>
        <option value="real">real (número com vírgula)</option>
        <option value="cadeia">cadeia (texto)</option>
        <option value="logico">logico (verdadeiro ou falso)</option>
      </select>
    </label>
    <p id="variavel-erro" role="alert"></p>
    <div class="dialogo-botoes">
      <button type="button" id="variavel-cancelar">Cancelar</button>
      <button type="submit" id="variavel-confirmar"></button>
    </div>
  </form>
</dialog>
```

O `tela-estrutura.test.js` confere: o diálogo existe, os quatro `value` são
exatamente `TIPOS_VARIAVEL`, nenhum texto em inglês.

## `src/ui/dialogo-variavel.js`

```js
pedirVariavel({ modo: 'criar' | 'renomear' | 'tipo', nome?, tipo?, validar }) → Promise<{ nome, tipo } | null>
```

| Modo | Título | Mostra | Botão |
| --- | --- | --- | --- |
| `criar` | "Criar variável" | nome (vazio) + tipo (`inteiro`) | "Criar" |
| `renomear` | "Renomear a variável <nome>" | nome (preenchido, selecionado) | "Renomear" |
| `tipo` | "Mudar o tipo de <nome>" | tipo (o atual) | "Mudar o tipo" |

- `validar(nome) → ResultadoNome` (de `validarNomeVariavel`). Recusado: mostra
  `mensagem` em `#variavel-erro`, mantém o diálogo aberto e o foco no nome.
- Enter confirma; Esc, "Cancelar" e fechar resolvem `null`.
- Resolve com o `nome` já sem os espaços das pontas.

## `src/ui/campo-variavel.js`

`class CampoVariavel extends Blockly.FieldVariable`, registrado como
`campo_variavel` em `Blockly.fieldRegistry` antes do `defineBlocksWithJsonArray`.

- Menu: as variáveis (como no padrão), depois "Renomear variável…", "Mudar o tipo…" e
  "Apagar a variável “<nome>”".
- Os três itens chamam `acoes-variavel.js`; nenhum usa `window.prompt` nem
  `window.confirm`.
- Campo sem variável (projeto editado à mão): mostra "???" em vez de criar uma
  variável `item`; o gerador já avisa "Falta a variável…".

## `src/ui/acoes-variavel.js`

```js
criarVariavel(ws)                      // botão CRIAR_VARIAVEL da caixa
renomearVariavel(ws, idVariavel)
mudarTipoVariavel(ws, idVariavel)
apagarVariavel(ws, idVariavel)         // contarBlocosApagados(serializarBlocos(ws), id); confirmar() da 001 quando usos > 0
```

Cada ação lê a lista atual com `variaveisDoMapa(ws.getVariableMap().getAllVariables())`,
valida com `validarNomeVariavel` e aplica com a API do mapa de variáveis (research
R-04, R-06). Não chamam `gerarPortugol`: os eventos do workspace já disparam a 007.

## `src/ui/workspace.js` (alterações)

| Função | Mudança |
| --- | --- |
| `criarWorkspace(container, projeto)` | Registra `campo_variavel`; injeta com `toolbox: CAIXA_BLOCOS`; registra o *callback* `VARIAVEIS` (`conteudoCategoriaVariaveis`) e o botão `CRIAR_VARIAVEL`; carrega `blocosComVariaveis(projeto.blocos, projeto.variaveis)`. |
| `recarregarBlocos(ws, projeto)` | Recebe o projeto (não só os blocos) e carrega as variáveis junto; mantém o `clearUndo()`. |
| `variaveisDoWorkspace(ws)` ➕ | `variaveisDoMapa(ws.getVariableMap().getAllVariables())`. |
| `serializarBlocos(ws)` | Sem mudança (continua removendo `variables`). |

## `src/main.js` (alterações)

```js
function projetoAtual() {
  return { ...projeto, variaveis: variaveisDoWorkspace(ws), blocos: serializarBlocos(ws) };
}
```

- O Novo passa `projetoVazio()` inteiro para `recarregarBlocos`, que limpa as
  variáveis.
- Criar uma variável conta como alteração não salva (`assinaturaProjeto` já inclui
  `variaveis`).

## Ganchos para outras specs

| Spec | Usa | Quando |
| --- | --- | --- |
| 003 | `campo_variavel` no bloco `leia` | o `leia` recebe uma variável, como o `recebe` |
| 005 | `campo_variavel` com `variableTypes: ['inteiro']` | variável de controle do `para` (só inteira) |
| 006 | `PRECEDENCIA`; `check` de saída do `variavel` | escala dos operadores e tipos dos encaixes |
| 003–006 | `CAIXA_BLOCOS.contents` | acrescentar categorias |
| 012 | `validarNomeVariavel` + `recarregarBlocos(ws, projeto)` | validar e carregar as variáveis do arquivo |
