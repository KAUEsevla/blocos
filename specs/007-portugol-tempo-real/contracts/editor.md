# Contrato: ligação do tempo real na interface

Mudanças em `index.html` e `src/ui/` (fora da cobertura), e os pontos que as specs
002 e 012 usam. Complementa o contrato da tela da 001
([tela.md](../../001-tela-tres-paineis/contracts/tela.md)); a barra não muda.

## `index.html`: cabeçalho do painel Blocos

Hoje o cabeçalho tem só o `<h2 id="titulo-blocos">`. Passa a ter, depois do título:

| Elemento | id | Texto | `title` | Estado inicial |
| --- | --- | --- | --- | --- |
| `<button type="button">` | `botao-desfazer` | `Desfazer` | `Desfazer (Ctrl+Z)` | `disabled` |
| `<button type="button">` | `botao-refazer` | `Refazer` | `Refazer (Ctrl+Y)` | `disabled` |

Estilo igual ao "Copiar código" do painel Portugol (mesmo cabeçalho flexível). O teste
`tela-estrutura.test.js` passa a conferir esses ids, textos e o `disabled`, e inclui
`Undo` e `Redo` na lista de palavras em inglês proibidas em `<button>`, `<label>` e
`title`. Mudança a refletir no `tela.md` da 001 (seção "Painéis", linha Blocos).

## `src/ui/workspace.js`

| Função | Antes | Depois |
| --- | --- | --- |
| `aoMudar(ws, cb)` | repassa só eventos não-UI | **removida**; substituída por `ouvirEventos` |
| `ouvirEventos(ws, notificar)` | — | `ws.addChangeListener(e => notificar(e, { arrastando: ws.isDragging() }))`; repassa **todos** os eventos (R-02) |
| `desfazer(ws)` | — | `ws.undo(false)` |
| `refazer(ws)` | — | `ws.undo(true)` |
| `estadoDesfazer(ws)` | — | `{ podeDesfazer: ws.getUndoStack().length > 0, podeRefazer: ws.getRedoStack().length > 0 }` |

`criarWorkspace`, `recarregarBlocos` e `serializarBlocos` não mudam nesta spec. A 002 passou
`criarWorkspace` e `recarregarBlocos` a receber o projeto inteiro (blocos e variáveis); ver
[editor-variaveis.md](../../002-blocos-variaveis/contracts/editor-variaveis.md).

## `src/ui/avisos-ui.js`

`aplicarAvisos(workspace, avisos, chave = 'incompleto')`: igual ao atual, mas
`setWarningText(texto, chave)` e o conjunto de blocos já marcados é guardado por
`workspace` **e** `chave`. Itens com o mesmo `blocoId` na mesma chave têm as mensagens
juntadas por `\n` (como hoje). `renderizarAvisos` e `destacarBloco` não mudam.

## `src/ui/painel-portugol.js`

`mostrarCodigo(pre, codigo)`: se `pre.textContent === codigo`, não faz nada; senão
guarda `scrollTop`/`scrollLeft` de `pre.parentElement`, troca o texto e restaura
(R-06). `copiarCodigo` não muda.

## `src/ui/barra-blocos.js` (novo)

```js
ligarBotoesDesfazer({ aoDesfazer, aoRefazer })        // liga os cliques
atualizarBotoesDesfazer({ podeDesfazer, podeRefazer }) // troca o disabled
```

## `src/main.js`

```js
const tempoReal = criarAtualizacaoTempoReal({
  atualizar: atualizarPortugol,          // ciclo do data-model
  agendar: (fn) => requestAnimationFrame(fn),
});
ouvirEventos(ws, tempoReal.notificar);
ligarBarra({ aoMudarNome(nome) { projeto.nome = nome; tempoReal.solicitar(); }, aoNovo: novoProjeto });
ligarBotoesDesfazer({ aoDesfazer: () => desfazer(ws), aoRefazer: () => refazer(ws) });
tempoReal.atualizarAgora();              // abertura da página
```

No Novo: `recarregarBlocos(ws, projeto)` → `tempoReal.atualizarAgora()` → marca a referência.

## Ganchos para outras specs

| Spec | Usa | Quando |
| --- | --- | --- |
| 002 | eventos do workspace (sem `tempoReal.solicitar()`) | criar, renomear, mudar o tipo e apagar variável disparam eventos não-UI do mapa de variáveis do Blockly, que já chegam ao `notificar` e entram no desfazer (002, research R-04 e R-10) |
| 012 | `recarregarBlocos(ws, projeto)` + `tempoReal.atualizarAgora()` | depois de carregar, antes de marcar a referência; o projeto leva as variáveis junto |
| 009 | `resultado.avisos` (só `incompleto`) | a marca de soltos não bloqueia Executar |
