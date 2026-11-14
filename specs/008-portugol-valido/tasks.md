---

description: "Tasks da spec 008: Portugol válido para o Core (e base do projeto)"
---

# Tasks: Portugol válido para o Core

**Entrada**: documentos de design em `specs/008-portugol-valido/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constitution exige cobertura ≥ 80% no núcleo e testes de
aceitação com o `meupia-core` real (princípio IV, RNF-04, RNF-07). Em cada história,
os testes vêm antes da implementação e devem falhar primeiro.

**Organização**: tarefas agrupadas por história de usuário da spec. Esta spec também
cria a base do projeto (Fases 1 e 2), usada por todas as outras.

**Rastreabilidade (constitution v1.2.0, princípio III)**: cada task cita o requisito
entre parênteses no fim. O commit de uma task usa `008/Txxx (RF-xx): descrição`, por
exemplo `008/T033 (RF-08): gerador da seção var`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]/[US2]**: história da spec (US1 = História 1, US2 = História 2)
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup (base do projeto)

**Objetivo**: criar o projeto Vite + Vitest com a versão do Core num ponto só.

- [X] T001 Criar `package.json` na raiz com `"type": "module"`, `"private": true`, `"license": "GPL-3.0"`, `"engines": { "node": ">=20" }` e os scripts `dev` (`vite`), `build` (`vite build`), `test` (`vitest run`), `test:unidade` (`vitest run --project unidade`), `test:aceitacao` (`vitest run --project aceitacao`), `cobertura` (`vitest run --coverage --reporter=default --reporter=json --outputFile.json=cobertura/testes.json && node scripts/atualizar-readme.mjs`). Instalar com versão exata (`npm install --save-exact`): `blockly` (série 12, última estável), `pyodide@0.25.0`; e em dev: `vite`, `vitest` e `@vitest/coverage-v8` (mesma versão do `vitest`). Versionar o `package-lock.json`. Não incluir `meupia-core` no `package.json` (R-07) (RNF-06, RNF-04)
- [X] T002 [P] Adicionar `node_modules/` e `dist/` ao `.gitignore` sem remover as entradas existentes, e criar `.gitattributes` com `*.js text eol=lf`, `*.mjs text eol=lf`, `*.json text eol=lf`, `*.html text eol=lf` e `*.yml text eol=lf`, para que código e casos de aceitação fiquem com LF (R-12) (RF-08)
- [X] T003 Criar `vite.config.js` com `test.projects` contendo dois projetos: `unidade` (`include: ['tests/unidade/**/*.test.js']`, `environment: 'node'`) e `aceitacao` (`include: ['tests/aceitacao/**/*.test.js']`, `testTimeout: 120000`, `hookTimeout: 120000`, `pool: 'forks'` e um único worker). Para o único worker, usar a opção da versão instalada do Vitest: na série 4, `maxWorkers: 1` com `isolate: false`; na série 3, `poolOptions: { forks: { singleFork: true } }`. Configurar `test.coverage`: `provider: 'v8'`, `include: ['src/portugol/**', 'src/blocos/**', 'src/projeto/**', 'src/core/**']`, `exclude: ['src/ui/**', 'src/main.js']` (só interface e renderização, como permite o princípio IV), `reporter: ['text', 'html', 'json-summary']`, `reportsDirectory: 'cobertura'`, `thresholds: { lines: 80, branches: 80 }` (depende de T001) (RNF-04)
- [X] T004 [P] Criar `src/config.js` exportando `MEUPIA_CORE_VERSAO = '1.4.1'`. É o único arquivo de código ou configuração que pode conter o número da versão do Core (constitution v1.2.0, princípio I) (RNF-02)
- [X] T005 [P] Criar `tests/unidade/versao-unica.test.js`. O teste lê `MEUPIA_CORE_VERSAO` de `src/config.js` e varre recursivamente `src/`, `tests/`, `scripts/` e `.github/`, além de `index.html`, `package.json` e `vite.config.js`, ignorando `src/config.js`. Ele falha em dois casos: (a) qualquer ocorrência de `/meupia[-_]core\s*(==|@|>=|~=)\s*\d/i`; (b) a versão como literal entre aspas (`'1.4.1'`, `"1.4.1"` ou `` `1.4.1` ``, montado a partir da constante) em arquivos `.js`, `.mjs`, `.html` ou `.yml`. A mensagem cita o arquivo e a linha. Não varrer `package-lock.json` nem `node_modules/`, onde outras dependências podem ter o mesmo número de versão. Pastas que ainda não existem são ignoradas (depende de T004) (RNF-02)
- [X] T006 [P] Criar `index.html` (lang `pt-BR`, título "meuPiá Blocos") com `<div id="area-blocos">`, `<pre id="painel-portugol" aria-label="Portugol gerado">` e `<script type="module" src="/src/main.js">`, e criar `src/main.js` vazio com comentário de bootstrap. A tela de três painéis completa é da spec 001 (RF-01)

**Checkpoint**: `npm install`, `npm run test:unidade` (só `versao-unica` verde) e `npm run dev` funcionam.

---

## Fase 2: Fundação (pré-requisitos bloqueantes)

**Objetivo**: emissor, avisos, registro de blocos, bloco `programa`, formato de projeto, ambiente do Core e adapter, com a suíte de aceitação rodando no Core real.

**⚠️ CRÍTICO**: nenhuma história começa antes desta fase.

### Testes da fundação

- [X] T007 [P] Escrever `tests/unidade/emissor.test.js` para `criarEmissor()`: `linha(texto)` emite com `"    ".repeat(nivel)`; `entrar()`/`sair()` mudam o nível; `sair()` abaixo de 0 lança erro; `linhaEmBranco()` emite linha vazia sem espaços; `texto()` junta com `\n`, termina com exatamente um `\n` e nunca contém `\t`, `\r` nem espaço no fim de linha (regex `/ +$/m`) (RF-08)
- [X] T008 [P] Escrever `tests/unidade/avisos.test.js`: `MARCADOR_AUSENTE === '???'`; `criarAviso({ bloco, encaixe, parte, rotulo })` devolve `{ blocoId, tipoBloco, encaixe, mensagem }` com a mensagem `Falta ${parte} do bloco ${rotulo}` (ex.: `"Falta a condição do bloco se"`, `"Falta o valor do bloco escreva"`); `criarAvisoComMensagem({ bloco, encaixe, mensagem })` preserva a mensagem própria (RF-08)
- [X] T009 [P] Escrever `tests/unidade/registro.test.js` conforme `contracts/registro-blocos.md`:
  - `criarRegistro()` devolve registro vazio;
  - `registrarBloco({ tipo, rotulo, categoria, definicao, gerar, areas, variantes })` exige `tipo`, `rotulo`, `categoria`, `definicao` e `gerar`, com `categoria` em `'comando' | 'valor' | 'raiz'`;
  - `areas` (padrão `[]`) é uma lista de nomes de áreas de comandos;
  - `variantes` (padrão `[]`) é uma lista de `{ nome, presente }` com `nome` único no bloco e `presente` função;
  - tipo duplicado lança erro;
  - `obter(tipo)` devolve a entrada ou `undefined`;
  - `tiposRegistrados()` lista os tipos na ordem de registro;
  - `variantesDe(tipo)` devolve as variantes declaradas ou, sem variantes, `[{ nome: 'padrão', presente: () => true }]`;
  - `registroPadrao` contém o tipo `programa` com `categoria: 'raiz'` e `areas: ['COMANDOS']`.
  (RF-08)
- [X] T010 [P] Escrever `tests/unidade/formato.test.js`: `FORMATO === 'meupia-blocos'`, `VERSAO_FORMATO === 1`, `TIPOS_VARIAVEL` igual a `['inteiro', 'real', 'cadeia', 'logico']`; `projetoVazio()` devolve `{ formato, versao: 1, nome: 'MeuPrograma', variaveis: [], blocos }` com um único bloco de topo `type: 'programa'` e **sem** a chave `blocos.variables` (data-model, "Origem das variáveis"); duas chamadas devolvem objetos iguais e independentes (alterar um não altera o outro) (RF-08, RF-11)
- [X] T011 [P] Escrever `tests/unidade/bloco-programa.test.js` com Blockly headless (`import * as Blockly from 'blockly'`, `new Blockly.Workspace()`): depois de definir o bloco a partir de `registroPadrao.obter('programa').definicao`, um bloco `programa` criado não tem conexão anterior nem seguinte, tem a área de comandos `COMANDOS`, mostra o rótulo "programa" e, serializado com `Blockly.serialization.workspaces.save`, tem `type: 'programa'` (RF-08)
- [X] T012 [P] Escrever `tests/unidade/executor-core.test.js` para as funções puras do adapter:
  - `interpretarErroCompilacao(saidaCompilador)` extrai `mensagem`, `etapa` (`léxico`/`sintático`/`semântico`), `linha` e `coluna` de um texto que contém `[COMPILATION ERROR]:\n\tErro sintático na linha 3, coluna 5: esperado "entao", encontrado "escreva"`;
  - quando o formato não casa, devolve `etapa/linha/coluna: null` e a mensagem bruta;
  - `traduzirErroExecucao(tipo, mensagem)` gera "Divisão por zero" para `ZeroDivisionError`, "O valor digitado não é um número" para `ValueError` de `int()`/`float()`, "O programa pediu mais dados do que os informados" para `EOFError` e uma mensagem genérica em pt-BR nos demais casos;
  - `traduzirErroExecucao` sempre preenche `detalhe = "<Tipo>: <mensagem>"`.
  (contracts/executor-core.md) (RF-09, RNF-01)
- [X] T013 [P] Escrever `tests/unidade/ambiente.test.js` com um Pyodide falso (`{ loadPackage: vi.fn(), pyimport: vi.fn(() => ({ install: vi.fn() })) }`):
  - `instalarCore(pyodide)` chama `loadPackage('micropip')` e depois `install` com `meupia-core==` seguido de `MEUPIA_CORE_VERSAO` (importado de `src/config.js`, sem repetir o número);
  - se `loadPackage` ou `install` rejeitar, `instalarCore` rejeita com `ErroAmbiente`, de `name === 'ErroAmbiente'`, mensagem "Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo." e o erro original em `cause`.
  (RF-09, RNF-02)
- [X] T014 [P] Escrever `tests/unidade/motor-navegador.test.js` com `vi.mock('pyodide', () => ({ loadPyodide: vi.fn(), version: '0.25.0' }))`:
  - `criarMotorNavegador()` chama `loadPyodide` com `{ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' }`, depois `instalarCore` com a instância, e devolve a instância;
  - se `loadPyodide` rejeitar, a função rejeita com `ErroAmbiente` (com a causa original);
  - se `instalarCore` rejeitar, a rejeição é propagada.
  (RF-09, RNF-06)

### Implementação da fundação

- [X] T015 [P] Implementar `src/portugol/emissor.js` (`criarEmissor`) até T007 passar (RF-08)
- [X] T016 [P] Implementar `src/portugol/avisos.js` (`MARCADOR_AUSENTE`, `criarAviso`, `criarAvisoComMensagem`) até T008 passar (RF-08)
- [X] T017 Implementar `src/blocos/registro.js` (`criarRegistro`, `registrarBloco`, `obter`, `tiposRegistrados`, `variantesDe`, `registroPadrao`) e `src/blocos/programa.js`. A `definicao` do `programa` é JSON de `Blockly.defineBlocksWithJsonArray`: `type: 'programa'`, `message0: 'programa %1 %2'` com `input_dummy` e `input_statement` `COMANDOS`, sem `previousStatement`/`nextStatement`, e `tooltip` "Os blocos encaixados aqui formam o seu programa". O programa é registrado com `categoria: 'raiz'`, `areas: ['COMANDOS']` e sem variantes, e `registroPadrao` o inclui. `src/blocos/` não importa `blockly`; só a UI chama `defineBlocksWithJsonArray` (R-05, R-13). Implementar até T009 e T011 passarem (RF-08)
- [X] T018 [P] Implementar `src/projeto/formato.js` (`FORMATO`, `VERSAO_FORMATO`, `TIPOS_VARIAVEL`, `projetoVazio`). O bloco raiz de `projetoVazio` usa `{ type: 'programa', id: 'programa', x: 24, y: 24, deletable: false }` dentro de `blocos.blocks = { languageVersion: 0, blocks: [...] }`, sem `blocos.variables`. Implementar até T010 passar (RF-08, RF-11)
- [X] T019 Implementar `src/core/ponte-python.js` exportando a string Python `PONTE_PYTHON` e `src/core/executor-core.js` com `compilarEExecutar(motor, codigo, entrada = [])`, `interpretarErroCompilacao` e `traduzirErroExecucao`. O fluxo segue o contrato:
  - apagar `output/main.py` e gravar `main.por` em UTF-8;
  - chamar `meuPia.compiler.main("main.por", "output")` com o stdout em `io.StringIO`;
  - com retorno `!= 0` ou sem `output/main.py`, o Python devolve a saída bruta do compilador e o JS a interpreta com `interpretarErroCompilacao` (`status: 'erro_compilacao'`);
  - senão, `exec` com `{"__name__": "__main__"}`, stdout capturado e stdin a partir de `entrada` via `motor.setStdin`;
  - exceção: o Python devolve o tipo e a mensagem, e o JS monta o erro com `traduzirErroExecucao` (`erro_execucao`);
  - `SystemExit` é ignorado.
  (contracts/executor-core.md, R-01). Implementar até T012 passar (RF-09, RNF-01)
- [X] T020 [P] Implementar `src/core/ambiente.js` com `ErroAmbiente` (subclasse de `Error`, `name = 'ErroAmbiente'`) e `instalarCore(pyodide)`, que faz `loadPackage('micropip')` e `pyimport('micropip').install(\`meupia-core==${MEUPIA_CORE_VERSAO}\`)` e embrulha qualquer falha em `ErroAmbiente` com a causa original. Único lugar que instala o Core (R-03, R-04). Implementar até T013 passar (RF-09, RNF-02)
- [X] T021 [P] Implementar `tests/aceitacao/suporte/motor-node.js` com `criarMotorNode()`: `loadPyodide()` do pacote npm `pyodide` (falha vira `ErroAmbiente`) seguido de `instalarCore(pyodide)` de `src/core/ambiente.js`. Não pode repetir lógica de instalação (depende de T020) (RNF-07)
- [X] T022 [P] Implementar `src/core/motor-navegador.js` com `criarMotorNavegador()`: `loadPyodide({ indexURL: \`https://cdn.jsdelivr.net/pyodide/v${version}/full/\` })`, em que `loadPyodide` e `version` vêm do pacote `pyodide`; falha do `loadPyodide` vira `ErroAmbiente`; depois `instalarCore(pyodide)`. O arquivo está dentro da cobertura. Implementar até T014 passar (depende de T020) (RF-09, RNF-06)
- [X] T023 Implementar `tests/aceitacao/suporte/validar-caso.js` com `validarCaso(caso, arquivo)`, que verifica os campos de `contracts/caso-aceitacao.schema.json` sem dependência nova:
  - `descricao` não vazia;
  - `requisitos` não vazio, com itens que casam `^(RF|RNF)-[A-Z]?[0-9]{2}$`;
  - `projeto.formato === 'meupia-blocos'` e `projeto.versao === 1`;
  - `variaveis[].tipo` em `inteiro|real|cadeia|logico`;
  - `entrada` é array de strings e `saidaEsperada` é string;
  - `portugolEsperado` ausente ou string;
  - `statusEsperado` ausente ou em `ok|erro_execucao`;
  - nenhuma chave extra no topo.
  A mensagem de erro cita o arquivo (RNF-07)
- [X] T024 Criar `tests/aceitacao/adapter-core.test.js` com o Core real. Um `beforeAll` cria o motor (T021). Casos:
  - (a) `importlib.metadata.version("meupia-core")` é igual a `MEUPIA_CORE_VERSAO`;
  - (b) o texto do cenário 1 (`algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n`) dá `status: 'ok'` e `saida: ''`;
  - (c) um texto inválido escrito à mão (`se` sem `entao`) dá `erro_compilacao` com `etapa: 'sintático'` e `linha` preenchida;
  - (d) um texto com `???` é recusado com `erro_compilacao` (defesa em profundidade de SC-003);
  - (e) `escreva(1 / 0)` dá `erro_execucao` com a mensagem "Divisão por zero";
  - (f) `leia` de inteiro com `entrada: ['7']` lê o valor, e com `entrada: []` dá "O programa pediu mais dados do que os informados";
  - (g) dois programas seguidos não compartilham variáveis nem saída.
  (depende de T019, T021) (RF-09, RNF-01, RNF-07)

**Checkpoint**: `npm run test:unidade` e `npm run test:aceitacao` verdes; o Core real roda no Node.

---

## Fase 3: História 1 — Código completo e bem formado (Prioridade: P1) 🎯 MVP

**Objetivo**: todo projeto completo gera um algoritmo Portugol com a estrutura, a seção `var`, a indentação e o nome corretos, determinístico e aceito pelo Core.

**Teste independente**: para cada caso em `tests/aceitacao/casos/`, gerar o Portugol, compilar e executar no Core e comparar com a saída esperada; conferir o texto exato do cenário 1.

### Testes da História 1

- [X] T025 [P] [US1] Escrever `tests/unidade/nome-programa.test.js` para `sanearNomePrograma(nome)` (R-11):
  - `undefined`, `null`, `''` e `'   '` viram `'MeuPrograma'`;
  - `'Meu "Jogo"'` vira `'Meu Jogo'` e `'a\\b'` vira `'ab'`;
  - quebras de linha, `\t` e outros caracteres de controle são removidos;
  - espaços das pontas são tirados;
  - nome com 41+ caracteres é cortado em 40 pontos de código, sem partir acentos (ex.: 39 letras + `'çã'` dá 40 caracteres terminando em `ç`), e os espaços finais depois do corte são tirados;
  - um nome só com `"` e `\` vira `'MeuPrograma'`.
  (FR-007) (RF-08)
- [X] T026 [P] [US1] Escrever `tests/unidade/variaveis.test.js` para `gerarSecaoVar(variaveis, emissor)`:
  - lista vazia não emite nada;
  - com variáveis, emite `var`, uma linha `    nome: tipo` por variável e uma linha em branco;
  - a ordem é inteiro, real, cadeia, logico e, dentro de cada tipo, a ordem do array (ex.: `[{n:'b',inteiro},{n:'x',cadeia},{n:'a',inteiro},{n:'ok',logico},{n:'m',real}]` dá `b`, `a`, `m`, `x`, `ok`);
  - um tipo fora de `TIPOS_VARIAVEL` lança erro.
  (FR-002; spec 002 FR-004) (RF-08, RF-02)
- [X] T027 [P] [US1] Criar `tests/auxiliares/blocos-teste.js` com `criarRegistroTeste()`, que devolve um registro com `programa` e com blocos falsos:
  - `teste_comando` (categoria `comando`, emite `escreva("x")`);
  - `teste_bloco` (comando com `areas: ['CORPO']`; emite `se verdadeiro entao`, os comandos de `CORPO` e `fim_se`);
  - `teste_valor` (valor, devolve `{ codigo: '1', precedencia: 99 }`).
  Só para testes (RF-08)
- [X] T028 [P] [US1] Escrever `tests/unidade/gerador.test.js` para `gerarPortugol(projeto, registro)` usando `criarRegistroTeste()`:
  - `projetoVazio()` gera exatamente `algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n` e `avisos: []` (cenário 1);
  - com variáveis e comandos, a ordem é `algoritmo`, linha em branco, `var` + declarações, linha em branco, `inicio`, comandos e `fim_algoritmo` (cenário 2);
  - `teste_bloco` aninhado em 6 níveis indenta cada nível com +4 espaços, sem `\t` nem espaço no fim de linha (cenário 3, FR-003);
  - blocos de topo diferentes de `programa` são ignorados (spec 007);
  - projeto sem bloco `programa` ou com `blocos: {}` gera o programa sem comandos;
  - com dois `programa`, usa o primeiro da serialização;
  - `type` desconhecido gera o aviso "Bloco desconhecido: <type>" e `???` no lugar;
  - um `blocos.variables` diferente de `projeto.variaveis` é ignorado, e só `variaveis` gera a seção `var` (data-model, C1);
  - o objeto `projeto` recebido não é alterado (`structuredClone` antes e `toEqual` depois);
  - 100 `teste_comando` encadeados geram em menos de 500 ms. Esta folga evita falhas à toa em máquina lenta; a meta de 50 ms fica no plan.
  (FR-001..FR-004) (RF-08)
- [X] T029 [P] [US1] Escrever `tests/unidade/determinismo.test.js`: para três projetos (vazio, com variáveis, aninhado), `gerarPortugol` chamado duas vezes e chamado sobre `JSON.parse(JSON.stringify(projeto))` produz `codigo` idêntico caractere por caractere e `avisos` iguais. O teste também falha se, depois de retirar os comentários `//…` e `/* … */` de cada arquivo de `src/portugol/`, o texto contiver `Date`, `Math.random`, `performance.now`, `document` ou `window` como palavra inteira (`\b…\b`) (FR-004, princípio II) (RF-08)
- [X] T030 [P] [US1] Criar os casos de aceitação seguindo `contracts/caso-aceitacao.schema.json`, todos com `requisitos: ["RF-08", "RNF-07"]` e `portugolEsperado`:
  - `tests/aceitacao/casos/programa-vazio.json`: `projetoVazio()` serializado; `portugolEsperado` do cenário 1; `saidaEsperada: ""`.
  - `tests/aceitacao/casos/nome-saneado.json`: nome `Meu "Jogo" \\ 1`; `portugolEsperado` começando com `algoritmo "Meu Jogo  1"`; aceito pelo Core.
  - `tests/aceitacao/casos/nome-vazio.json`: `nome: ""`; `portugolEsperado` com `algoritmo "MeuPrograma"`.
  - `tests/aceitacao/casos/variaveis-quatro-tipos.json`: variáveis `idade:inteiro`, `altura:real`, `nome:cadeia`, `ok:logico` criadas fora da ordem de tipo; `portugolEsperado` com a seção `var` na ordem de FR-004; `saidaEsperada: ""`.
  (RF-08, RNF-07)
- [X] T031 [US1] Criar `tests/aceitacao/aceitacao.test.js`. Um `beforeAll` cria o motor (T021) e lê cada `tests/aceitacao/casos/*.json` em ordem alfabética, passando por `validarCaso` (T023). Cada caso vira um `it(descricao)` que:
  1. gera com `gerarPortugol(caso.projeto)` (registro padrão);
  2. exige `avisos.length === 0`;
  3. compara com `portugolEsperado` quando existir;
  4. roda `compilarEExecutar(motor, codigo, caso.entrada)`;
  5. exige `status === (caso.statusEsperado ?? 'ok')` e `saida === caso.saidaEsperada`.

  Um `erro_compilacao` sempre falha o teste e mostra `erro.mensagem` (SC-001, SC-003).

  Incluir também duas verificações de meta-aceitação. Elas consideram só os blocos alcançáveis a partir do `programa` (via `inputs` e `next`); blocos soltos não contam.
  - **(a) Cobertura de blocos (SC-002, E1)**: para cada `tipo` de `registroPadrao.tiposRegistrados()` e cada variante de `variantesDe(tipo)`, algum caso tem um bloco desse tipo para o qual `presente(bloco)` é `true`. A falha lista os pares `(tipo, variante)` sem caso.
  - **(b) Indentação real (E3)**: todo caso que contém um bloco cuja entrada no registro tem `areas` não vazias e `categoria` diferente de `raiz` precisa ter `portugolEsperado`.

  (depende de T019, T021, T023, T030) (RNF-07, RF-08)

### Implementação da História 1

- [X] T032 [P] [US1] Implementar `src/portugol/nome-programa.js` (`sanearNomePrograma`) conforme R-11 até T025 passar (RF-08)
- [X] T033 [P] [US1] Implementar `src/portugol/variaveis.js` (`gerarSecaoVar`) conforme o contrato do gerador: uma variável por linha, `nome: tipo`, agrupadas na ordem `TIPOS_VARIAVEL` e, dentro do tipo, na ordem de criação. Implementar até T026 passar (RF-08, RF-02)
- [X] T034 [US1] Implementar `src/portugol/gerador.js` com `gerarPortugol(projeto, registro = registroPadrao)`:
  - emitir `algoritmo "<nome saneado>"`, uma linha em branco, a seção `var` (T033, só a partir de `projeto.variaveis`, ignorando `blocos.variables`), `inicio`, a cadeia de `inputs.COMANDOS` do primeiro bloco `programa` no nível 1 e `fim_algoritmo`;
  - montar o `ctx` do contrato `registro-blocos.md`: `linha`, `comandos(bloco, encaixe)` (+1 nível, percorre `next`), `valor(bloco, encaixe, parte)` (devolve o `codigo` do bloco encaixado), `variavel(bloco, campo, parte)` (resolve `{ id }` em `projeto.variaveis`), `campo` e `aviso`;
  - bloco de `type` desconhecido gera "Bloco desconhecido: <type>" e `???`;
  - não ler nada fora de `projeto`/`registro` e não alterar a entrada.
  Implementar até T028 e T029 passarem; o tratamento de encaixe vazio fica para a US2 (depende de T015, T016, T017, T032, T033) (RF-08)
- [X] T035 [US1] Ligar a página em `src/main.js` e `src/ui/workspace.js`:
  - definir os blocos de `registroPadrao` com `Blockly.defineBlocksWithJsonArray`;
  - injetar o workspace em `#area-blocos`, carregando `projetoVazio().blocos` com `Blockly.serialization.workspaces.load`;
  - a cada evento de mudança que não seja de UI (`!evento.isUiEvent`), gerar com `gerarPortugol({ ...projeto, blocos: Blockly.serialization.workspaces.save(ws) })` e escrever `codigo` em `#painel-portugol` com `textContent` (somente leitura).
  A atualização completa em tempo real é da spec 007 (arquivos fora da cobertura) (RF-08, RF-07)
- [ ] T036 [US1] Rodar `npm run test:aceitacao` e corrigir até todos os casos de T030 passarem no Core real. Depois colar o Portugol de `variaveis-quatro-tipos.json` no meuPiá Lab e confirmar que roda (premissa da spec; quickstart, passo 5) (SC-001) (RF-08, RNF-07)

**Checkpoint**: História 1 completa. O projeto novo mostra o Portugol do cenário 1, e todos os casos passam no Core real.

---

## Fase 4: História 2 — Blocos incompletos não geram código quebrado (Prioridade: P1)

**Objetivo**: um encaixe obrigatório vazio marca o bloco, gera aviso em pt-BR e `???` no texto, e a função pura de verificação bloqueia a execução. O bloqueio na tela é da spec 009 (ver "Pendências para a spec 009").

**Teste independente**: deixar vazio o encaixe obrigatório de um bloco (um bloco falso nos testes; o `se` real a partir da spec 004) e verificar o aviso, o `???`, a marcação do bloco e o resultado de `verificarExecucao`.

### Testes da História 2

- [X] T037 [P] [US2] Acrescentar a `tests/auxiliares/blocos-teste.js` dois blocos falsos:
  - `teste_se` (comando, `rotulo: 'se'`, `areas: ['CORPO']`): o gerador chama `ctx.valor(bloco, 'CONDICAO', 'a condição')` e emite `se <cond> entao` / `CORPO` / `fim_se`;
  - `teste_leia` (comando, `rotulo: 'leia'`): emite `leia(<var>)` com `ctx.variavel(bloco, 'VAR', 'a variável')`.
  (RF-08)
- [X] T038 [P] [US2] Escrever `tests/unidade/avisos-gerador.test.js`:
  - `teste_se` sem `CONDICAO` gera `se ??? entao` e um aviso `{ blocoId, tipoBloco: 'teste_se', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco se' }` (cenário 1);
  - `teste_leia` sem variável, ou com `{ id }` que não existe em `variaveis`, gera `leia(???)` e "Falta a variável do bloco leia";
  - três blocos incompletos (um deles aninhado) geram três avisos na ordem em que aparecem no texto (caso de borda "vários avisos");
  - `teste_se` incompleto fora do `programa` não gera aviso;
  - com aviso, `codigo` contém `???`; sem aviso, não contém (invariantes do data-model).
  (FR-005) (RF-08)
- [X] T039 [P] [US2] Escrever `tests/unidade/execucao.test.js` para `verificarExecucao({ codigo, avisos })`: sem avisos devolve `{ permitida: true, motivo: null, avisos: [] }`; com avisos devolve `{ permitida: false, motivo: 'O programa tem blocos incompletos. Complete-os para executar.', avisos }`, os mesmos e na mesma ordem (FR-006, cenário 2) (RF-08)

### Implementação da História 2

- [X] T040 [US2] Completar `src/portugol/gerador.js`:
  - `ctx.valor` e `ctx.variavel` com encaixe vazio (ou `{ id }` inexistente) registram `criarAviso({ bloco, encaixe, parte, rotulo: entrada.rotulo })` e devolvem `MARCADOR_AUSENTE`;
  - `ctx.aviso` registra mensagem própria;
  - os avisos são acumulados na ordem de emissão e devolvidos em `avisos`;
  - blocos soltos nunca são visitados.
  Implementar até T038 passar sem quebrar T028/T029 (depende de T034, T037) (RF-08)
- [X] T041 [P] [US2] Implementar `src/portugol/execucao.js` (`verificarExecucao`) até T039 passar (RF-08)
- [X] T042 [US2] Implementar `src/ui/avisos-ui.js`:
  - `aplicarAvisos(workspace, avisos)`: limpa os avisos anteriores (`setWarningText(null)` nos blocos marcados antes) e chama `block.setWarningText(mensagens do bloco)` em cada `blocoId`, juntando com `\n` vários avisos do mesmo bloco;
  - `renderizarAvisos(container, avisos, aoClicar)`: monta uma lista `<ul>` com um `<button>` por aviso, na ordem recebida;
  - `destacarBloco(workspace, blocoId)`: `block.select()` e `workspace.centerOnBlock(blocoId)`.
  Ligar só `aplicarAvisos` em `src/main.js` a cada geração (T035). As outras duas funções ficam prontas para a spec 009. Arquivo fora da cobertura (FR-005, cenário 1) (RF-08)

**Checkpoint**: Histórias 1 e 2 completas no escopo desta spec. Os avisos aparecem marcados nos blocos, e `verificarExecucao` bloqueia programas incompletos.

---

## Fase 5: Acabamento e transversais

- [X] T043 [P] Implementar `scripts/atualizar-readme.mjs`:
  - ler `cobertura/coverage-summary.json` (`total.lines.pct`) e `cobertura/testes.json` (`numTotalTests`);
  - atualizar no `README.md` a linha já existente que começa com `**Testes:**`, no mesmo lugar, para `**Testes:** N · **Cobertura:** X%`, que é o formato e a posição do modelo do repositório oficial (constitution v1.2.0, princípio IV). X tem até uma casa decimal, com vírgula como separador;
  - se a linha não existir, falhar com mensagem clara sem tocar no README;
  - não mover, criar nem apagar nenhuma outra linha.
  (R-08) (RNF-04)
- [X] T044 [P] Criar `.github/workflows/testes.yml` (nome "Testes"):
  - disparar em `push` e `pull_request` para `main`;
  - job em `ubuntu-latest` com `actions/checkout@v4`, `actions/setup-node@v4` (`node-version: 20`, `cache: npm`), `npm ci` e `npm test -- --coverage`;
  - esse último roda as suítes de unidade e de aceitação, com o Core real baixado do PyPI, e falha abaixo de 80% de linhas ou branches pelos `thresholds` da T003;
  - sem segredos nem permissões além de `contents: read`;
  - o workflow não altera o README nem os arquivos versionados de `cobertura/`.
  Marcar esse check como obrigatório na proteção da `main` é uma configuração do GitHub feita pela dupla (princípio IV: "NÃO PODE ser integrada à `main`") (RNF-04, RNF-07)
- [X] T045 Rodar `npm run cobertura`, confirmar linhas e branches ≥ 80% no núcleo e versionar `cobertura/coverage-summary.json`, `cobertura/index.html` (com os arquivos do relatório HTML) e `cobertura/testes.json`, junto com o `README.md` atualizado (depende de T043 e das fases 3 e 4) (RNF-04)
- [ ] T046 [P] Registrar a lacuna R-09: a dupla abre a issue em `github.com/meuPia/core`, "Expor `compilar(texto) -> (python, erro)` sem efeitos em arquivo", descrevendo o adapter de `src/core/executor-core.js`, e anota o link da issue na linha correspondente de `specs/008-portugol-valido/research.md` (princípio I) (RNF-01)
- [X] T047 Validar o `specs/008-portugol-valido/quickstart.md` de ponta a ponta (passos 1 a 5) numa cópia limpa (`npm ci`), e corrigir o quickstart onde os comandos ou as saídas reais divergirem (RF-08, RNF-07)

---

## Pendências para a spec 009

A parte de tela dos cenários 2 e 3 da História 2 (FR-006) depende do painel Saída
(spec 001) e do botão Executar (spec 009). Ela não é uma task desta spec e deve entrar
no `tasks.md` da 009, citando RF-08 e RF-09:

- No clique em Executar, chamar `verificarExecucao` (T041). Com `permitida: false`, não iniciar a execução, limpar a Saída e mostrar `motivo`, seguido de `renderizarAvisos` (T042) com `aoClicar = (aviso) => destacarBloco(ws, aviso.blocoId)`.
- Teste: com um bloco incompleto, Executar não chama `compilarEExecutar` e a Saída lista os avisos na ordem do texto; clicar num aviso seleciona o bloco correspondente.

A matriz de [specs/README.md](../README.md) registra que a 009 também atende RF-08 nesse ponto.

---

## Dependências e ordem de execução

### Dependências entre fases

- **Setup (Fase 1)**: sem dependências. T003 depende de T001; T005 depende de T004.
- **Fundação (Fase 2)**: depende do Setup e bloqueia as histórias. Dentro dela:
  - cada teste (T007–T014) vem antes da implementação correspondente (T015–T022);
  - T021 e T022 dependem de T020;
  - T024 depende de T019 e T021.
- **História 1 (Fase 3)**: depende da Fundação. T034 depende de T015, T016, T017, T032 e T033; T031 depende de T023 e T030; T036 fecha a história.
- **História 2 (Fase 4)**: depende da T034 (gerador base). T040 estende o mesmo arquivo da T034, então as duas não podem rodar em paralelo.
- **Acabamento (Fase 5)**: T045 depende de T043 e das fases 3 e 4. T044 pode entrar assim que T001–T003 existirem.

### Dependências com outras specs (specs/README.md)

- Esta spec é a primeira e não depende de nenhuma.
- As specs 002–006 registram blocos em `src/blocos/`, com `variantes` e `areas`, e adicionam casos em `tests/aceitacao/casos/`. A meta-aceitação da T031 obriga cada par (tipo, variante) a ter um caso (SC-002) e cada bloco com área de comandos a ter `portugolEsperado`.
- A 009 reaproveita `compilarEExecutar` e `motor-navegador.js` (T019, T022) e implementa as "Pendências para a spec 009". A 011/012 reaproveitam `formato.js` (T018) e a regra de `blocos.variables` do data-model.

### Dentro de cada história

- Os testes são escritos primeiro e falham antes da implementação.
- O núcleo puro (`src/portugol/`) vem antes da UI (`src/ui/`, `src/main.js`).

---

## Oportunidades de paralelismo

- **Setup**: T002, T004, T005 e T006 em paralelo depois da T001.
- **Fundação**:
  - os testes T007–T014 em paralelo;
  - depois, T015, T016, T018 e T020 em paralelo;
  - T021 e T022 em paralelo depois da T020, enquanto a T019 avança.
- **História 1**: T025–T030 em paralelo; depois T032 e T033 em paralelo; T034 sozinha.
- **História 2**: T037, T038 e T039 em paralelo (T038 usa os blocos da T037, mas fica em outro arquivo); T041 em paralelo com T040.
- **Acabamento**: T043, T044 e T046 em paralelo.

### Exemplo: História 1

```text
Task: "T025 tests/unidade/nome-programa.test.js"
Task: "T026 tests/unidade/variaveis.test.js"
Task: "T028 tests/unidade/gerador.test.js"
Task: "T030 tests/aceitacao/casos/*.json"

Task: "T032 src/portugol/nome-programa.js"
Task: "T033 src/portugol/variaveis.js"
```

---

## Estratégia de implementação

### MVP primeiro (História 1)

1. Fase 1 (Setup) e Fase 2 (Fundação), com o Core real rodando no Node (T024 verde).
2. Fase 3 (História 1): o Portugol do projeto novo aparece na página e passa no Core.
3. **Parar e validar**: `npm test` verde, cobertura ≥ 80% e o cenário 1 conferido no meuPiá Lab.

### Entrega incremental

1. Setup + Fundação → base pronta para todas as specs; a T044 liga a CI cedo.
2. História 1 → MVP (cenário 1 rodando no Core); seguir com as specs 001 e 007 (ordem do specs/README.md).
3. História 2 → avisos, marcação e verificação de execução no núcleo e nos blocos.
4. T045 atualiza cobertura e README a cada entrega. As pendências de tela vão para a 009.

---

## Observações

- Commits: `008/Txxx (RF-xx): descrição`, um por task ou por grupo pequeno de tasks.
- Mudanças em spec, plan ou quickstart durante a implementação: `docs(008) (RF-08): descrição`.
- Nenhuma task copia ou modifica arquivos do meuPiá; o Core vem sempre do PyPI na versão de `src/config.js`.
- Uma entrega com cobertura abaixo de 80% ou com aceitação falhando não entra na `main` (princípio IV); a T044 automatiza essa verificação.
