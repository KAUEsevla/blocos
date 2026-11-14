# Contrato: adapter do meuPiá Core

Módulos:

- `src/core/ambiente.js`: instalação do Core e `ErroAmbiente`;
- `src/core/ponte-python.js` e `src/core/executor-core.js`: compilação e execução;
- `src/core/motor-navegador.js`: motor do navegador;
- `tests/aceitacao/suporte/motor-node.js`: motor dos testes.

Juntos, são a única porta de entrada para o Core (princípio I). Todos os módulos de
`src/core/` estão dentro da medição de cobertura.

## Versão

```js
// src/config.js: único arquivo de código ou configuração com o número da versão do Core
export const MEUPIA_CORE_VERSAO = '1.4.1';
```

Um teste de unidade varre os arquivos de código e configuração (`src/`, `tests/`,
`scripts/`, `.github/`, `index.html`, `package.json`, `vite.config.js`) e falha se a
versão aparecer fora de `src/config.js`, como `meupia-core==<número>` ou como literal
entre aspas (constitution v1.2.0, princípio I).

## Ambiente (`src/core/ambiente.js`)

```js
class ErroAmbiente extends Error   // name = 'ErroAmbiente'; cause = erro original
instalarCore(pyodide) → Promise<void>
```

`instalarCore` faz `pyodide.loadPackage('micropip')` e
`pyodide.pyimport('micropip').install(\`meupia-core==${MEUPIA_CORE_VERSAO}\`)`. Qualquer
falha vira `ErroAmbiente` com a mensagem em pt-BR "Não foi possível carregar o ambiente
do meuPiá. Verifique a conexão e tente de novo." (base para o caso de borda da 009).
É o único lugar que instala o Core.

## Motor

Os dois ambientes produzem o mesmo objeto "motor" (a instância do Pyodide) e diferem
só em como carregam o Pyodide:

```js
criarMotorNavegador() → Promise<Motor>
// loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/` }),
// em que loadPyodide e version vêm do pacote npm pyodide; depois instalarCore(pyodide)

criarMotorNode() → Promise<Motor>
// loadPyodide() do pacote npm pyodide; depois instalarCore(pyodide)
```

Uma falha de `loadPyodide` também vira `ErroAmbiente`. O `motor-navegador.js` é testado
em unidade com `vi.mock('pyodide')`. O `motor-node.js` é exercitado pela suíte de
aceitação.

## Execução

```js
compilarEExecutar(motor, codigoPortugol: string, entrada: string[] = []) → Promise<ResultadoExecucao>
interpretarErroCompilacao(saidaCompilador: string) → ErroCore
traduzirErroExecucao(tipo: string, mensagem: string) → ErroCore
```

A divisão de trabalho é esta: o código Python de `ponte-python.js` executa os passos e
devolve dados brutos, e o JavaScript de `executor-core.js` interpreta e traduz esses
dados. Assim a interpretação é testável em unidade, sem Pyodide.

1. (Python) Apaga `output/main.py` e grava `main.por` (UTF-8).
2. (Python) Chama `meuPia.compiler.main("main.por", "output")` com o stdout capturado.
3. Se o retorno não for `0` ou se `output/main.py` não existir, o Python devolve
   `{ compilou: false, saidaCompilador }`. O JS monta `status: "erro_compilacao"` com
   `interpretarErroCompilacao`, que extrai `etapa`, `linha`, `coluna` e a mensagem do
   texto depois de `[COMPILATION ERROR]:`, no formato
   `Erro <etapa> na linha L, coluna C: <descrição>`. Se o formato não casar, `etapa`,
   `linha` e `coluna` ficam `null` e a mensagem é o texto bruto.
4. (Python) Senão, faz `exec(main.py, {"__name__": "__main__"})` com o stdout capturado
   e o stdin alimentado por `entrada` via `motor.setStdin` (uma linha por `input()`).
5. Se houver exceção, o Python devolve `{ tipo, mensagem }` (ex.: `ZeroDivisionError`).
   O JS monta `status: "erro_execucao"` com `traduzirErroExecucao`, que preenche
   `detalhe = "<Tipo>: <mensagem>"` e uma `mensagem` amigável:
   - `ZeroDivisionError` → "Divisão por zero";
   - `ValueError` de `int()`/`float()` → "O valor digitado não é um número";
   - `EOFError` (entrada esgotada) → "O programa pediu mais dados do que os informados";
   - outros → mensagem genérica em pt-BR.
   A 009 amplia essa tradução.
6. (Python) `SystemExit` é ignorado; o resultado é `ok`, com a saída capturada até ali.

`ResultadoExecucao` e `ErroCore`: ver [data-model.md](../data-model.md).

**Fora deste contrato** (spec 009/010): rodar em Web Worker, botão Parar, entrada
interativa durante a execução. O adapter recebe a entrada pronta. A 010 troca
`entrada[]` por uma função de stdin interativa sem mudar o resto.

## Garantias testadas

Unidade (sem Pyodide):

- `interpretarErroCompilacao` e `traduzirErroExecucao` nos formatos acima.
- `instalarCore` com Pyodide falso: chama micropip com a versão de `src/config.js`, e
  as falhas viram `ErroAmbiente` com `cause`.
- `criarMotorNavegador` com `vi.mock('pyodide')`: `indexURL` montado a partir de
  `version`, chamada de `instalarCore`, falha de `loadPyodide` como `ErroAmbiente`.

Aceitação (Core real):

- O programa do cenário 1 tem `status: "ok"` e `saida: ""`.
- Um texto propositalmente inválido (escrito à mão no teste) tem `status:
  "erro_compilacao"` com `etapa` e `linha` preenchidas. Isso prova que o adapter
  detecta o erro, não que o gerador o produza.
- Um texto com `???` é recusado pelo Core (defesa em profundidade de SC-003).
- `importlib.metadata.version("meupia-core") === MEUPIA_CORE_VERSAO`.
- Dois casos seguidos não compartilham variáveis nem saída.
