# Contrato: Carregar na tela (`index.html`, `src/ui/`, `src/main.js`)

Interface, **fora da cobertura** (exclusão já declarada: `src/ui/**`, `src/main.js`). A
estrutura estática é conferida por `tests/unidade/tela-estrutura.test.js`; o comportamento,
pelo [quickstart.md](../quickstart.md). Decisões em [research.md](../research.md), R-06 a R-09.

## `index.html`

| Elemento | Antes (011) | Depois (012) |
| --- | --- | --- |
| `<button id="botao-carregar">Carregar</button>` | `disabled`, `title="Disponível em breve"` | sem `disabled`; `title="Carregar um projeto salvo (.json)"` |
| `<input type="file" id="arquivo-carregar">` | — | novo, `accept=".json,application/json"`, `hidden`, dentro da barra, logo depois de `#botao-carregar` |
| `#dialogo-confirmacao` | Cancelar + Confirmar | sem mudança na estrutura; o `avisar` esconde Cancelar enquanto está aberto |

A ordem dos botões da barra não muda (001, contracts/tela.md).

## `src/ui/textos.js`

- `carregarDica: 'Carregar um projeto salvo (.json)'` (mesmo texto do `title`)
- `carregarTitulo: 'Carregar outro projeto?'`
- `carregarMensagem: 'As alterações que não foram salvas serão perdidas.'`
- `carregarConfirmar: 'Descartar e carregar'`
- `carregarFalhouTitulo: 'Não foi possível carregar'`
- `entendi: 'Entendi'`

As mensagens de recusa ficam no núcleo (`mensagemRecusa`), não aqui: são testadas.

## `src/ui/confirmacao.js`

`avisar({ titulo, mensagem, ok })` → `Promise<void>`: usa o mesmo `<dialog>`; esconde
`#dialogo-cancelar`, rótulo `ok` no `#dialogo-confirmar`, foco nele; resolve ao clicar, Esc ou
fechar; ao encerrar, mostra Cancelar de novo (o `confirmar` seguinte continua igual).

## `src/ui/arquivo.js` (novo)

`escolherArquivo(input)` → `Promise<File | null>`: zera `input.value`, chama `input.click()`
e resolve com o primeiro arquivo no `change`; `null` se `files` vier vazio. Cancelar a
janela sem `change` deixa a promessa pendente, sem efeito (nada fica esperando por ela).

`lerTexto(file)` → `Promise<{ ok: true, texto } | { ok: false, motivo: 'grande-demais' }>`:
recusa `file.size > TAMANHO_MAXIMO_ARQUIVO` sem ler; senão `await file.text()`.

## `src/ui/workspace.js`

`ensaiarCarga(projeto)` → `{ ok: true } | { ok: false, erro }`: cria
`new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }))`,
faz `Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws)`
dentro de `try`, classifica o erro com `classificarErroCarga(erro, Blockly.serialization.exceptions)`,
escreve a mensagem do Blockly em `console.warn` e faz `ws.dispose()` em `finally`. Não toca o
workspace da tela.

## `src/ui/barra.js`

`ligarBarra({ …, aoCarregar })`: clique em `#botao-carregar` chama `aoCarregar?.()`.

## `src/main.js` (ligação)

```text
carregarProjeto():
  arquivo = await escolherArquivo(#arquivo-carregar);  se null: return
  lido = await lerTexto(arquivo)
  preparado = lido.ok ? prepararCarregamento(lido.texto) : { ok: false, mensagem: mensagemRecusa(lido) }
  se preparado.ok: ensaio = ensaiarCarga(preparado.projeto)
                   se !ensaio.ok: preparado = recusaDoEnsaio(ensaio)
  se !preparado.ok: await avisar({ titulo: carregarFalhouTitulo, mensagem: preparado.mensagem, ok: entendi }); return
  se haAlteracoes(projetoAtual(), referencia):
     se !(await confirmar({ carregarTitulo, carregarMensagem, carregarConfirmar, cancelar })): return
  anterior = projetoAtual()
  await controlador.parar()
  projeto = { ...preparado.projeto }; definirNome(projeto.nome)
  try recarregarBlocos(ws, projeto)
  catch: projeto = anterior; definirNome(anterior.nome); recarregarBlocos(ws, anterior);
         tempoReal.atualizarAgora(); avisar(dados inválidos, "o editor não conseguiu montar os blocos"); return
  tempoReal.atualizarAgora()          // Portugol já, com os blocos (007)
  saida.mostrarOrientacao()           // Saída limpa (FR-006)
  referencia = assinaturaProjeto(projetoAtual()); mostrarAlteracoes(false)
```

Regras:

- Nada antes do último bloco (`anterior = …`) muda o projeto aberto, o nome, a Saída, a
  execução, a pilha de desfazer ou a `referencia` (FR-004; decisão do README).
- A confirmação é a do Novo (001, FR-007), com textos próprios; foco em Cancelar.
- Depois de carregar: indicador oculto, Novo não pergunta, `beforeunload` não pergunta (011),
  Ctrl+Z não volta ao projeto anterior.
- Um segundo clique em Carregar enquanto o primeiro espera o aviso ou a confirmação é
  impossível: os dois diálogos são modais.

## O que o `tela-estrutura.test.js` DEVE conferir

| Caso | Esperado |
| --- | --- |
| `botao-carregar` | sem `disabled`, sem `Disponível em breve`, `title` = `TEXTOS.carregarDica` |
| `arquivo-carregar` | existe, `type="file"`, `hidden`, `accept` com `.json` |
| `TEXTOS.carregar*`, `TEXTOS.entendi` | existem, em pt-BR |
| ordem da barra | Executar, Parar, Salvar, Carregar, Novo (inalterada) |
