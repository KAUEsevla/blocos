# Contrato: adapter do meuPiá Core

Módulos `src/core/ponte-python.js`, `src/core/executor-core.js`,
`src/core/motor-navegador.js` (navegador) e `tests/aceitacao/suporte/motor-node.js`
(testes). Única porta de entrada para o Core (princípio I).

## Versão

```js
// src/config.js: único arquivo de código/configuração com o número da versão do Core
export const MEUPIA_CORE_VERSAO = '1.4.1';
```

Um teste de unidade varre `src/`, `tests/`, `scripts/`, `index.html`, `package.json` e
`vite.config.js` e falha se a string da versão aparecer fora de `src/config.js`.

## Motor

Os dois ambientes produzem o mesmo objeto "motor":

```js
criarMotorNavegador() → Promise<Motor>   // loadPyodide({ indexURL: CDN da versão do pacote pyodide }), micropip
criarMotorNode()      → Promise<Motor>   // loadPyodide() do pacote npm, micropip
// ambos: micropip.install(`meupia-core==${MEUPIA_CORE_VERSAO}`)
```

`Motor` é a instância do Pyodide. Falha ao carregar ou ao instalar gera
`ErroAmbiente` com a mensagem em pt-BR "Não foi possível carregar o ambiente do meuPiá.
Verifique a conexão e tente de novo." (base para o caso de borda da 009).

## Execução

```js
compilarEExecutar(motor, codigoPortugol: string, entrada: string[] = []) → Promise<ResultadoExecucao>
```

Passos, todos dentro do código Python de `ponte-python.js`:

1. Apaga `output/main.py` e grava `main.por` (UTF-8).
2. Chama `meuPia.compiler.main("main.por", "output")` com o stdout capturado.
3. Se o retorno não for `0` ou se `output/main.py` não existir → `status: "erro_compilacao"`.
   A mensagem é o texto depois de `[COMPILATION ERROR]:`, com `etapa`, `linha` e
   `coluna` extraídas de `Erro <etapa> na linha L, coluna C: <descrição>`.
4. Senão, faz `exec(main.py, {"__name__": "__main__"})` com o stdout capturado e o
   stdin alimentado por `entrada` (uma linha por `input()`; entrada esgotada gera
   `EOFError`, tratado como erro de execução "O programa pediu mais dados do que os
   informados").
5. Exceção → `status: "erro_execucao"`, com `detalhe = "<Tipo>: <mensagem>"` e
   `mensagem` amigável. A 009 amplia a tradução das mensagens; aqui ficam
   `ZeroDivisionError` → "Divisão por zero" e `ValueError` de `int()`/`float()` →
   "O valor digitado não é um número".
6. `SystemExit` é ignorado; o resultado é `ok`.

`ResultadoExecucao` e `ErroCore`: ver [data-model.md](../data-model.md).

**Fora deste contrato** (spec 009/010): rodar em Web Worker, botão Parar, entrada
interativa durante a execução. O adapter recebe a entrada pronta. A 010 troca
`entrada[]` por uma função de stdin interativa sem mudar o resto.

## Garantias testadas (suíte de aceitação, Core real)

- O programa do cenário 1 tem `status: "ok"` e `saida: ""`.
- Um texto propositalmente inválido (escrito à mão no teste) tem `status:
  "erro_compilacao"` com `etapa` e `linha` preenchidas. Isso prova que o adapter
  detecta o erro, não que o gerador o produza.
- `importlib.metadata.version("meupia-core") === MEUPIA_CORE_VERSAO`.
- Dois casos seguidos não compartilham variáveis nem saída.
