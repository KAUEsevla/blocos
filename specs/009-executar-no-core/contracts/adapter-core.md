# Contrato: mudanças no adapter do Core (`src/core/`)

Amplia o [contrato da 008](../../008-portugol-valido/contracts/executor-core.md) sem
quebrar o que ele garante. Decisões: [research.md](../research.md), R-04 a R-07.

## `compilarEExecutar`

```js
compilarEExecutar(motor, codigo, entrada = [], { aoEscrever } = {}) → Promise<ResultadoExecucao>
```

- Sem o quarto parâmetro, o comportamento é o da 008 (a aceitação da 008 não muda).
- Com `aoEscrever`, cada pedaço que o programa escreve no stdout é passado na hora, na
  ordem. `resultado.saida` continua com tudo.
- O stdout do **compilador** nunca é passado a `aoEscrever` (R-04, item 2).

## `PONTE_PYTHON`

- `_meupia_compilar(codigo)`: além do que faz na 008, envolve `main(...)` em
  `try/except` para `SystemExit` e `Exception`. Uma falha vira
  `{ compilou: False, saidaCompilador: <stdout capturado> + <traceback> }` (R-04, item 3).
- `_meupia_executar(ao_escrever=None)`: o `sys.stdout` vira um objeto com `write` e
  `flush` que grava no buffer e chama `ao_escrever(texto)` quando ele não é `None`. Uma
  exceção devolve `{ tipo, mensagem, rastro: traceback.format_exc() }`.
- Só a interface pública do Core é usada: `meuPia.compiler.main(arquivo, saida)`
  (princípio I; [meuPia/core#14](https://github.com/meuPia/core/issues/14) continua
  aberta, R-04).

## `interpretarErroCompilacao(saida)`

| Entrada | `mensagem` | `etapa`, `linha`, `coluna` | `detalhe` |
| --- | --- | --- | --- |
| Com `[COMPILATION ERROR]:` no formato `Erro <etapa> na linha L, coluna C: …` | texto depois da marca (pt-BR do Core) | preenchidos | `saida` |
| Com a marca, fora do formato | texto depois da marca | `null` | `saida` |
| Sem a marca (falha do compilador) | "O meuPiá Core não conseguiu compilar o programa." | `null` | `saida` |

## `traduzirErroExecucao(tipo, mensagem, rastro?)`

Tabela do [R-07](../research.md). `detalhe` é `rastro`, se existir; senão
`"<Tipo>: <mensagem>"` (como na 008). `mensagem` nunca contém o texto do Python.

**Mudança visível**: `ZeroDivisionError` passa de "Divisão por zero" para "Não é
possível dividir por zero." (exemplo da spec). `tests/unidade/executor-core.test.js` e
`tests/aceitacao/adapter-core.test.js` são atualizados junto.

## `criarMotorNavegador({ aoProgresso } = {})`

Chama `aoProgresso('python')` antes do `loadPyodide` e `aoProgresso('core')` antes do
`instalarCore`. Sem o parâmetro, o comportamento é o da 008. As falhas continuam virando
`ErroAmbiente`. `criarMotorNode` (aceitação) ganha o mesmo parâmetro, para o serviço do
worker ser o mesmo nos dois ambientes.

## Garantias testadas

Unidade (sem Pyodide):

- `interpretarErroCompilacao`: as três linhas da tabela.
- `traduzirErroExecucao`: as sete linhas da tabela; `detalhe` com e sem `rastro`; a
  mensagem nunca inclui o texto em inglês recebido.
- `criarMotorNavegador` com `vi.mock('pyodide')`: as duas etapas, na ordem.

Aceitação (Core real):

- Com `aoEscrever`, os pedaços concatenados são iguais a `resultado.saida` em todos os
  casos de `tests/aceitacao/casos/`.
- A divisão por zero devolve "Não é possível dividir por zero." e `detalhe` com
  `Traceback` e `ZeroDivisionError`.
- O stdout do compilador não chega a `aoEscrever`, nem num programa válido, nem num
  inválido.
