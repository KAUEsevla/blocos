# Contrato: Salvar na tela (`index.html`, `src/ui/`, `src/main.js`)

Interface, **fora da cobertura** (exclusão já declarada: `src/ui/**`, `src/main.js`). A
estrutura estática é conferida por `tests/unidade/tela-estrutura.test.js`; o comportamento,
pelo [quickstart.md](../quickstart.md). Decisões em [research.md](../research.md), R-06 a
R-08.

## `index.html`

| Elemento | Antes (001) | Depois (011) |
| --- | --- | --- |
| `<button id="botao-salvar">Salvar</button>` | `disabled`, `title="Disponível em breve"` | sem `disabled`; `title="Salvar o projeto num arquivo .json"` |
| `<span id="indicador-alteracoes">` | — | novo, logo depois de `#nome-programa`, `class="indicador-alteracoes"`, `aria-live="polite"`, `hidden`, texto vazio |
| `#botao-carregar` | `disabled` | sem mudança (012) |

A ordem dos botões da barra não muda (001, contracts/tela.md).

## `src/ui/textos.js`

- `alteracoesNaoSalvas: 'alterações não salvas'`
- `salvarDica: 'Salvar o projeto num arquivo .json'` (mesmo texto do `title` no HTML)

## `src/ui/download.js` (novo)

`baixarArquivo(nomeArquivo, texto)`: cria `Blob([texto], { type: 'application/json' })`,
`URL.createObjectURL`, um `<a download="nomeArquivo" href=url>` fora da tela, `click()`,
remove o `<a>` e chama `URL.revokeObjectURL` num `setTimeout(…, 0)`. Sem rede.

## `src/ui/barra.js`

- `ligarBarra({ …, aoSalvar })`: clique em `#botao-salvar` chama `aoSalvar?.()`.
- `mostrarAlteracoes(alterado)`: `hidden = !alterado`; texto `TEXTOS.alteracoesNaoSalvas`
  quando visível.

## `src/main.js` (ligação)

```text
salvarProjeto():
  tempoReal.atualizarAgora()
  p = projetoAtual()
  { nomeArquivo, texto, referencia: r } = prepararSalvamento(p)
  baixarArquivo(nomeArquivo, texto)
  referencia = r
  mostrarAlteracoes(false)

atualizarPortugol():   … (como antes) …; mostrarAlteracoes(haAlteracoes(projetoGerado, referencia))
novoProjeto():         … (como antes) …; depois de marcar a referência: mostrarAlteracoes(false)

window 'beforeunload': se haAlteracoes(projetoAtual(), referencia):
                         evento.preventDefault(); evento.returnValue = ''
```

Regras:

- Salvar funciona com execução em andamento: não para a execução nem mexe na Saída.
- Salvar não chama `recarregarBlocos`, não limpa a pilha de desfazer, não muda o campo do
  nome (FR-005).
- Depois de Salvar, Novo não pergunta (001, FR-007) até a próxima alteração.

## O que o `tela-estrutura.test.js` DEVE conferir

| Caso | Esperado |
| --- | --- |
| `botao-salvar` | sem `disabled`, sem `Disponível em breve` |
| `botao-carregar` | continua `disabled` |
| `indicador-alteracoes` | existe, tem `hidden` e `aria-live="polite"`, vem depois de `nome-programa` e antes de `.barra-acoes` |
| `TEXTOS.alteracoesNaoSalvas`, `TEXTOS.salvarDica` | existem, em pt-BR |
