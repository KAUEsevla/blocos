# Contrato: mudanças no adapter do Core (`src/core/`)

Amplia o [contrato da 009](../../009-executar-no-core/contracts/adapter-core.md) e o
[da 008](../../008-portugol-valido/contracts/executor-core.md) sem quebrar o que eles
garantem. Decisões: [research.md](../research.md), R-02, R-03, R-05 e R-07.

## `compilarEExecutar`

```js
compilarEExecutar(motor, codigo, entrada = [], { aoEscrever, interativo = false } = {})
  → Promise<ResultadoExecucao>
```

- Sem `interativo` (ou `false`), o resultado é o da 009 para qualquer programa, inclusive
  a entrada esgotada (`erro_execucao`, "O programa pediu mais dados do que os
  informados."). A aceitação da 008 e da 009 não muda.
- Com `interativo: true` e a entrada esgotada num `input()`:

  ```js
  { status: 'aguardando_entrada', saida: <tudo o que a rodada escreveu>, erro: null,
    pedido: { variavel: 'nome' | null } }
  ```

- Cada valor de `entrada` é devolvido ao programa **exatamente como está** (sem quebra de
  linha acrescentada nem removida), um por `input()` (FR-004).

## `continuarExecucao` (novo)

```js
continuarExecucao(motor, entrada, { aoEscrever, interativo = false } = {}) → Promise<ResultadoExecucao>
```

- Executa de novo o `output/main.py` deixado pela última compilação bem-sucedida no
  mesmo motor, desde o começo, com a `entrada` dada. Não recompila.
- Mesmos status e formato de `compilarEExecutar`, sem `erro_compilacao`.
- Chamada sem compilação anterior no motor: `erro_execucao` com a mensagem genérica.

## `PONTE_PYTHON`

- `_MeupiaPedidoEntrada(BaseException)`: leva `nome`. Derivar de `BaseException` impede
  que um `except Exception` do programa a capture.
- `_meupia_executar(ao_escrever=None, entrada=None, interativo=False)`:
  - lê `output/main.py` e o executa com `exec(codigo, {"__name__": "__main__", "input": _meupia_input})`;
  - `_meupia_input(prompt="")` devolve o próximo item de `entrada`; esgotada:
    `interativo` → `_MeupiaPedidoEntrada(nome)`; senão → `EOFError`;
  - `nome`: linha `sys._getframe(1).f_lineno` do `main.py`, casada com
    `^\s*([A-Za-z_]\w*)\s*=`; sem casar, `None`;
  - devolve `{ saida, erro, pedido }`, em que `pedido` é `{ "variavel": nome }` ou `None`.
- O `motor.setStdin` deixa de ser usado. Nada do Core é copiado ou alterado: só o
  dicionário global do `exec` (princípio I).

## `traduzirErroExecucao(tipo, mensagem, rastro?)` (ampliada)

| `tipo` | `mensagem` do Python | `mensagem` amigável |
| --- | --- | --- |
| `ValueError` | `could not convert string to float: '<valor com vírgula>'` | "O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72." |
| `ValueError` | outros casos de `int()`/`float()` | "O valor digitado não é um número." (009) |

As demais linhas da tabela da 009 não mudam. `mensagem` continua sem o texto em inglês;
`detalhe` continua com o rastro.

## Garantias testadas

Unidade (sem Pyodide):

- `traduzirErroExecucao`: vírgula em `float` → complemento; `float` sem vírgula e `int`
  com vírgula (`invalid literal for int()`) → mensagem da 009.

Aceitação (Core 1.4.1 real):

- `interativo` com entrada vazia em `leia(nome)`, `leia(idade)`, `leia(altura)`,
  `leia(ok)` → `aguardando_entrada` com `variavel` igual ao nome de cada um.
- `leia` dentro de um `enquanto`: o mesmo nome a cada volta.
- `continuarExecucao` depois de um `aguardando_entrada`: chega ao fim com a saída
  completa, sem recompilar (o `main.por` alterado depois não muda o resultado).
- Valor vazio em cadeia → `""`; em inteiro → "O valor digitado não é um número.".
- `1,72` em real → mensagem com o complemento; `1.72` → `ok`.
- Sem `interativo`, um `leia` sem entrada continua `erro_execucao` com a mensagem do
  `EOFError`.
