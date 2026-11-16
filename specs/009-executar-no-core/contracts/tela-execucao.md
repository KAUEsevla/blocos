# Contrato: tela da execução (`index.html`, `src/ui/`, `src/main.js`)

Interface, fora da cobertura. Conferida no [quickstart.md](../quickstart.md) e, na parte
estrutural do HTML, em `tests/unidade/tela-estrutura.test.js`. Decisões:
[research.md](../research.md), R-09, R-10 e R-13.

## Barra (`index.html`, `src/ui/barra.js`)

| Elemento | Antes (001) | Depois (009) |
| --- | --- | --- |
| `#botao-executar` | `disabled`, `title="Disponível em breve"` | habilitado, sem `title` |
| `#botao-parar` | não existe | `<button type="button" id="botao-parar" disabled>Parar</button>`, logo depois do Executar |
| `#botao-salvar`, `#botao-carregar` | `disabled` | sem mudança (011, 012) |

`ligarBarra` ganha `aoExecutar` e `aoParar`. Uma função nova,
`mostrarEstadoExecucao(estado)`, aplica a tabela de estados do
[R-10](../research.md): Executar `disabled` fora do `ocioso`; Parar `disabled` no
`ocioso`.

O [contrato tela.md da 001](../../001-tela-tres-paineis/contracts/tela.md) é atualizado
numa task `docs`, e o `tela-estrutura.test.js` passa a esperar essa ordem e esses estados.

## Painel Saída (`src/ui/painel-saida.js`)

Extensões permitidas pelo [contrato da 001](../../001-tela-tres-paineis/contracts/painel-saida.md),
sem mudar o que já existe:

| Membro novo | Comportamento |
| --- | --- |
| `escreverVarias(linhas, tipo = 'programa')` | Acrescenta todas as linhas num `DocumentFragment` e rola até o fim uma vez (R-13). |
| `escreverDetalhe(texto)` | Acrescenta `<details class="saida-detalhe"><summary>Detalhes técnicos</summary><pre>` com `textContent = texto`. Fechado por padrão. |
| `mostrarAvisos(avisos, aoClicar)` | `renderizarAvisos(areaAvisos, avisos, aoClicar)` da 008/T042. |

CSS (`src/estilos.css`): `.saida-linha:empty` tem a altura de uma linha (o `escreva("")`
fica visível como linha vazia); `.saida-detalhe` usa fonte menor e cor secundária.

Os textos da execução vêm de `src/execucao/mensagens.js` (núcleo, testado). A regra da
001 ("textos de `src/ui/textos.js`") fica valendo para os textos da interface; o
contrato da Saída da 001 ganha essa exceção numa task `docs`, como já acontece com o
`motivo` de `src/portugol/execucao.js`.

## Ligação (`src/main.js`)

```js
const executor = criarExecutor({
  criarWorker: () => new Worker(new URL('./execucao/worker.js', import.meta.url), { type: 'module' }),
});
const controlador = criarControladorExecucao({
  obterPrograma: () => { tempoReal.atualizarAgora(); return { codigo: ultimoCodigo, avisos: ultimosAvisos }; },
  executor,
  saida,
  destacar: (blocoId) => destacarBloco(ws, blocoId),
  aoMudarEstado: mostrarEstadoExecucao,
});
ligarBarra({ ..., aoExecutar: () => controlador.executar(), aoParar: () => controlador.parar() });
```

- `atualizarPortugol` passa a guardar `ultimosAvisos = resultado.avisos`, junto do
  `ultimoCodigo` que já guarda.
- "Novo" durante uma execução chama `controlador.parar()` antes de trocar o projeto.

## `vite.config.js`

- `worker: { format: 'es' }` (R-02).
- `coverage.include` ganha `src/execucao/**`; `coverage.exclude` ganha
  `src/execucao/worker.js` (R-11).
