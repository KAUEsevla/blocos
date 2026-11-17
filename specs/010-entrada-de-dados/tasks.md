---

description: "Tasks da spec 010: Entrada de dados durante a execução"
---

# Tasks: Entrada de dados durante a execução

**Entrada**: documentos de design em `specs/010-entrada-de-dados/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). Cada mudança em `src/core/` e
`src/execucao/` tem testes de unidade escritos antes da implementação, com motor, worker
e Saída falsos. A aceitação roda o adapter com o `meupia-core` 1.4.1 real e o executor e o
serviço reais dentro de `worker_threads` do Node (research R-10). O que só existe no
navegador (campo, foco, Enter, destaque) é verificado pelo [quickstart.md](quickstart.md).

**Organização**: Fundação (verificação da base herdada, adapter interativo, serviço e executor com o protocolo
novo, textos do pedido) e uma fase por história na ordem de prioridade: História 1
(digitar um valor, P1) com a pendência da vírgula → História 2 (desistir, P2) → entrega →
documentação das outras specs.

**Commits (constituição v2.0.0, princípio III)**: **um commit por fase**, feito quando
todas as tasks da fase estão marcadas e com os testes (`npm test`) rodados uma vez antes do
commit, passando. Formato `010/Txxx-Tyyy (RF-xx, …): descrição`, listando as tasks da fase;
tasks não consecutivas são separadas por vírgula. O commit cita todos os requisitos das
suas tasks. A fase de documentação não implementa task de código e usa
`docs(010) (RF-xx, …): descrição`. A linha **Commit** no fim de cada fase traz a mensagem.

**Pendências obrigatórias** (research R-01):

- **P-1** (009, R-14; RF-10, RF-09): entrada do `leia` durante a execução, **dentro do
  worker**, por reexecução determinística (R-02). Fundação (T001–T011) e História 1
  (T012–T020).
- **P-2** (003, R-02; Premissas da 010; RF-03, RF-10): real digitado com vírgula recusado
  pelo Core. O valor vai como digitado, a dica lembra o ponto e o erro ganha o
  complemento (R-07). T005, T006 (dica do real), T014, T015, T016.
- **P-3** (002, campo de variável, entregue no `leia` pela 003; RF-02, RF-03): o nome e
  o tipo do pedido vêm da variável do campo `VAR` (R-03). T002, T005, T012, T017, T020.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]** digitar um valor quando o programa pede, **[US2]** desistir de informar o
  valor
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Fundação (bloqueia as histórias)

**Objetivo**: o adapter executa em modo interativo e reexecuta sem recompilar; o serviço
e o executor trocam `pedido_entrada` e `entrada`; os textos do pedido existem (contratos
[adapter-core.md](contracts/adapter-core.md) e [entrada.md](contracts/entrada.md)).

### Base herdada

- [X] T001 Na branch `010-entrada-de-dados`, rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec. A verificação não altera arquivos; se exigir correção na base, ela entra no commit desta fase (RF-10)

### Adapter do Core (`src/core/`)

- [X] T002 Em `src/core/ponte-python.js` (contrato [adapter-core.md](contracts/adapter-core.md#ponte_python); research R-02, R-03):
  - acrescentar `import re` e a classe `_MeupiaPedidoEntrada(BaseException)` com o atributo `nome` (derivar de `BaseException` para um `except Exception` do programa nunca a capturar);
  - `_meupia_executar(ao_escrever=None, entrada=None, interativo=False)`: ler `output/main.py`, guardar `linhas = codigo.split("\n")` e uma fila `list(entrada or [])`;
  - definir `_meupia_input(prompt="")`: com a fila não vazia, devolver `fila.pop(0)` **exatamente como está** (sem acrescentar nem tirar quebra de linha; FR-004); vazia e `interativo`: `f = sys._getframe(1)`, casar `linhas[f.f_lineno - 1]` com `re.match(r"\s*([A-Za-z_]\w*)\s*=", …)` e levantar `_MeupiaPedidoEntrada(nome ou None)`; vazia sem `interativo`: levantar `EOFError()`;
  - executar com `exec(codigo, {"__name__": "__main__", "input": _meupia_input})`;
  - acrescentar `_meupia_compilado()`, que devolve `os.path.exists("output/main.py")` (usada por `continuarExecucao`, T003);
  - capturar `_MeupiaPedidoEntrada` **antes** do `except Exception` e devolver `pedido = {"variavel": e.nome}`; o retorno passa a ser `{"saida", "erro", "pedido"}` (`pedido` = `None` fora desse caso);
  - manter `_Escrita`, o `except SystemExit` e a restauração do `sys.stdout` no `finally`; manter só `meuPia.compiler.main` como interface do Core (princípio I).
  (P-1, P-3) (RF-10, RNF-01)
- [X] T003 Em `src/core/executor-core.js` (contrato [adapter-core.md](contracts/adapter-core.md)):
  - `compilarEExecutar(motor, codigo, entrada = [], { aoEscrever, interativo = false } = {})`: compila como hoje e delega a execução a uma função interna `executarCompilado(motor, entrada, { aoEscrever, interativo })`;
  - `executarCompilado`: chama `_meupia_executar` com `aoEscrever ?? null`, a lista `entrada` e `interativo`; **remove** o `motor.setStdin`; `execucao.pedido` → `{ status: 'aguardando_entrada', saida: execucao.saida, erro: null, pedido: { variavel: execucao.pedido.variavel ?? null } }`; `execucao.erro` → `erro_execucao` como hoje; senão `ok`;
  - exportar `continuarExecucao(motor, entrada, { aoEscrever, interativo = false } = {})`: `prepararMotor` e `executarCompilado`, sem recompilar. Se `output/main.py` não existir no motor (nenhuma compilação anterior), devolver `{ status: 'erro_execucao', saida: '', erro }` com `erro.mensagem` = "O programa parou com um erro durante a execução." (checar com a função Python `_meupia_compilado()`, acrescentada em `src/core/ponte-python.js` no T002, que devolve `os.path.exists("output/main.py")`);
  - sem `interativo`, o resultado é idêntico ao da 009 (inclusive o `EOFError` da entrada esgotada).
  (depende de T002) (P-1) (RF-10, RNF-01)
- [X] T004 Em `tests/aceitacao/adapter-core.test.js`, acrescentar um `describe('modo interativo (spec 010)')` com o Core real:
  - `leia(nome)`, `leia(idade)`, `leia(altura)`, `leia(ok)` com `interativo: true` e `entrada = []`, `["Ana"]`, `["Ana", "15"]`, `["Ana", "15", "1.5"]` → `aguardando_entrada` com `pedido.variavel` `nome`, `idade`, `altura`, `ok` em sequência, e `erro: null`;
  - `leia(nome)` dentro de `enquanto i < 2 faca … fim_enquanto` (Portugol em texto; os blocos de repetição são da 005): `[]` e `["Ana"]` → `variavel: 'nome'`; `["Ana", "Bia"]` → `ok`;
  - `continuarExecucao(motor, ["Ana", "Bia"], { interativo: true })` depois de um `aguardando_entrada` chega ao fim com a saída completa, mesmo depois de sobrescrever `main.por` com texto inválido (prova que não recompila);
  - sem `interativo`, `leia(nome)` sem entrada continua `erro_execucao` com "O programa pediu mais dados do que os informados.";
  - valor vazio: `leia(nome)` + `escreva("[", nome, "]")` com `[""]` → `[]`; `leia(idade)` com `[""]` → "O valor digitado não é um número.";
  - o valor chega sem alteração: `leia(nome)` + `escreva("[", nome, "]")` com `["  Ana "]` → `[  Ana ]`.
  Rodar também `tests/aceitacao/aceitacao.test.js` e `executar.test.js` sem mudança: precisam continuar passando sem o `setStdin` (depende de T003) (P-1, P-3) (RF-10, RNF-07)

### Textos do pedido (núcleo)

- [X] T005 [P] Escrever `tests/unidade/execucao-entrada.test.js` para `criarPedidoEntrada(variavel, variaveis)` e `TEXTOS_ENTRADA` de `src/execucao/entrada.js` (contrato [entrada.md](contracts/entrada.md#textos-do-pedido-entradajs-novo); research R-06), com `variaveis = [{ nome: 'nome', tipo: 'cadeia' }, { nome: 'idade', tipo: 'inteiro' }, { nome: 'altura', tipo: 'real' }, { nome: 'ok', tipo: 'logico' }]`:
  - `'nome'` → `{ rotulo: 'Digite o valor de nome (cadeia)', dica: null, confirmar: 'Confirmar' }`;
  - `'idade'` → rótulo `Digite o valor de idade (inteiro)`, dica `Número sem casas decimais, por exemplo 15.`;
  - `'altura'` → rótulo `Digite o valor de altura (real)`, dica `Use ponto para separar as casas decimais, por exemplo 1.72.`;
  - `'ok'` → rótulo `Digite o valor de ok (lógico)` (com acento), dica `Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro.`;
  - `null`, `'outra'` (fora da lista) e `variaveis` vazia ou ausente → `{ rotulo: 'Digite um valor', dica: null, confirmar: 'Confirmar' }`.
  (P-3) (RF-10, RNF-03)
- [X] T006 [P] Implementar `src/execucao/entrada.js` até T005 passar: puro, sem DOM nem Pyodide, com os textos congelados (`Object.freeze`) (RF-10, RNF-03)

### Serviço do worker

- [X] T007 Em `tests/unidade/execucao-servico.test.js`, acrescentar um `describe('entrada interativa (spec 010)')` com `vi.mock` de `compilarEExecutar` **e** `continuarExecucao`, e relógio falso (contrato [entrada.md](contracts/entrada.md#serviço-do-worker-servicojs); research R-04, R-05):
  - `executar` com `interativo: true` repassa `{ aoEscrever, interativo: true }` a `compilarEExecutar`; sem o campo, `interativo: false`;
  - `compilarEExecutar` escreve `antes\n` e devolve `aguardando_entrada` com `variavel: 'nome'` → postagens na ordem `saida` (`antes\n`) e `{ tipo: 'pedido_entrada', id, variavel: 'nome' }`, sem `resultado`;
  - `{ tipo: 'entrada', id, valor: 'Ana' }` → `continuarExecucao(motor, ['Ana'], { aoEscrever, interativo: true })`; a rodada escreve `antes\nOi, Ana\n` e devolve `ok` → só `Oi, Ana\n` é postado, depois o `resultado` com `saida: ''`;
  - duas entradas seguidas acumulam `['Ana']` e depois `['Ana', 'Bia']`;
  - prefixo divergente (a rodada escreve `outra\n` no lugar de `antes\n`) → `resultado` com `status: 'erro_execucao'`, a mensagem genérica "O programa parou com um erro durante a execução." e `detalhe` "A reexecução do programa produziu uma saída diferente da anterior."; nada de `outra` é postado;
  - `entrada` com outro `id`, ou sem execução pendente, é ignorada (`continuarExecucao` não é chamado);
  - um novo `executar` descarta a pendente: uma `entrada` com o `id` antigo é ignorada;
  - `continuarExecucao` rejeitando vira `resultado` com `erro_execucao` e a mensagem genérica.
  (P-1) (RF-10)
- [X] T008 Implementar em `src/execucao/servico.js` até T007 passar (e os testes da 009 continuarem passando): a execução pendente `{ id, entrada, enviado }` (data-model), o filtro de prefixo na escrita (compara os primeiros `enviado.length` caracteres e descarta; o resto entra no lote de 50 ms e é acrescentado a `enviado`), o tratamento de `aguardando_entrada` (envia o lote, posta `pedido_entrada`, guarda a pendente), a mensagem `{ tipo: 'entrada', id, valor }` em `receber` e o descarte da pendente em resultado final e em novo `executar` (depende de T003) (P-1) (RF-10)

### Executor (lado da página)

- [X] T009 Em `tests/unidade/execucao-executor.test.js`, acrescentar um `describe('entrada interativa (spec 010)')` com o `WorkerFalso` (contrato [entrada.md](contracts/entrada.md#executor-executorjs)):
  - `executar` com `aoPedirEntrada` posta `executar` com `interativo: true`; sem ele, `interativo: false`;
  - `{ tipo: 'pedido_entrada', id, variavel: 'nome' }` do id atual chama `aoPedirEntrada({ variavel: 'nome' })`; quando a promessa resolve com `'Ana'`, o worker recebe `{ tipo: 'entrada', id, valor: 'Ana' }`;
  - `pedido_entrada` de outro `id` não chama `aoPedirEntrada`;
  - resposta resolvida depois de `parar()` não é postada (nem ao worker antigo nem ao novo);
  - valor vazio `''` é postado como `''`.
  (P-1, P-3) (RF-10)
- [X] T010 Implementar em `src/execucao/executor.js` até T009 passar: `aoPedirEntrada` guardado em `atual`, `interativo: Boolean(aoPedirEntrada)` na mensagem `executar`, o caso `pedido_entrada` em `tratar` e o envio de `entrada` só se `atual?.id` ainda for o mesmo e o worker for o mesmo (P-1) (RF-10)
- [X] T011 Em `tests/aceitacao/executar.test.js`, acrescentar o teste "entrada interativa no worker real": `leia(nome)` + `escreva("Oi, ", nome)` executado com `aoPedirEntrada: async ({ variavel }) => { pedidos.push(variavel); return 'Ana'; }` → `pedidos` = `['nome']`, `status: 'ok'` e linhas `['Oi, Ana']`. Prova a Fundação de ponta a ponta no `worker_threads` (depende de T008, T010) (P-1) (RF-10, RNF-07)

**Checkpoint**: o executor, com o worker do Node e o Core real, pausa no `leia`, recebe o
valor e continua sem repetir a Saída.

**Commit**: `010/T001-T011 (RF-10, RF-02, RF-03, RNF-01, RNF-03, RNF-07): adapter interativo, reexecução no worker e textos do pedido`

---

## Fase 2: História 1 - Digitar um valor quando o programa pede (Prioridade: P1) 🎯 MVP

**Objetivo**: ao chegar num `leia`, a Saída mostra o campo com o nome e o tipo da
variável e a dica; o valor confirmado aparece como entrada e a execução continua (FR-001
a FR-005). Inclui a pendência da vírgula (P-2).

**Teste independente**: executar `leia(nome)` + `escreva("Oi, ", nome)`, digitar "Ana",
confirmar e ver `Oi, Ana`.

### Testes primeiro

- [X] T012 [P] [US1] Em `tests/unidade/execucao-controlador.test.js`, acrescentar um `describe('entrada (spec 010)')` com Saída falsa (`pedirEntrada` devolve uma promessa controlada pelo teste, `cancelarEntrada` espião) e executor falso que chama `aoPedirEntrada` (contrato [entrada.md](contracts/entrada.md#controlador-controladorjs)):
  - `obterPrograma` com `variaveis: [{ nome: 'nome', tipo: 'cadeia' }]` e pedido `{ variavel: 'nome' }` → `saida.pedirEntrada({ rotulo: 'Digite o valor de nome (cadeia)', dica: null, confirmar: 'Confirmar' })`;
  - `obterPrograma` sem `variaveis` → pedido `Digite um valor`;
  - o valor confirmado é escrito com `saida.escrever('Ana', 'entrada')` e devolvido ao executor; a linha do programa escrita depois (`Oi, Ana`) vem depois da entrada na Saída falsa;
  - uma linha incompleta no divisor é escrita antes do pedido (`aoEscrever('Nome: ')` sem `\n` e depois o pedido → `escreverVarias(['Nome: '], 'programa')` antes de `pedirEntrada`);
  - três pedidos seguidos (`nome`, `idade`, `altura`) chamam `pedirEntrada` três vezes, um de cada vez e na ordem;
  - `cancelarEntrada` é chamado no fim da execução, antes do relato ("Fim do programa");
  - o estado continua `executando` com o pedido aberto, e `executar()` nesse momento é ignorado.
  (P-3) (RF-10)
- [X] T013 [P] [US1] Em `tests/aceitacao/executar.test.js`, acrescentar (worker real, Core 1.4.1):
  - "três `leia` seguidos": `leia(nome)`, `leia(idade)`, `leia(altura)` e um `escreva` de cada → `aoPedirEntrada` chamado três vezes, um de cada vez (o segundo só depois do primeiro resolver), com `nome`, `idade`, `altura`, e Saída sem linha repetida;
  - "`leia` num `enquanto`" (Portugol em texto): `escreva("antes")` e um laço de 2 voltas com `leia(nome)` e `escreva("Oi, ", nome)` → linhas `['antes', 'Oi, Ana', 'Oi, Bia']`, cada uma uma vez;
  - **SC-001 interativo**: um `describe.each` sobre os casos de `tests/aceitacao/casos/` com `entrada` não vazia e `statusEsperado` ausente ou `ok` (hoje `leia-quatro-tipos.json` e `leia-logico-falso.json`): executar com `entrada: []` e `aoPedirEntrada` que devolve `caso.entrada` um a um; conferir que todos os valores foram pedidos e que as linhas são iguais às de `caso.saidaEsperada`.
  (P-1) (RF-10, RNF-07)

### Pendência da vírgula (P-2)

- [X] T014 [P] [US1] Em `tests/unidade/executor-core.test.js`, acrescentar (contrato [adapter-core.md](contracts/adapter-core.md#traduzirerroexecucaotipo-mensagem-rastro-ampliada); research R-07):
  - `traduzirErroExecucao('ValueError', "could not convert string to float: '1,72'")` → "O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72.";
  - `could not convert string to float: 'abc'` → "O valor digitado não é um número.";
  - `invalid literal for int() with base 10: '1,5'` → "O valor digitado não é um número." (o complemento é só do real);
  - em todos, `mensagem` sem o texto em inglês e `detalhe` com ele.
  (P-2) (RF-03, RF-10, RNF-03)
- [X] T015 [US1] Em `src/core/executor-core.js`, `traduzirErroExecucao`: para `ValueError` com `could not convert string to float: '<valor>'` em que `<valor>` contém `,`, usar a mensagem com o complemento; os demais casos não mudam. Rodar T014 até passar (depende de T014) (P-2) (RF-03, RF-10)
- [X] T016 [P] [US1] Criar `tests/aceitacao/casos/leia-real-virgula.json` no formato dos casos existentes (validado por `tests/aceitacao/suporte/validar-caso.js`), a partir de `leia-quatro-tipos.json`: projeto com a variável `altura` (`real`), `leia(altura)` e `escreva(altura)`; `entrada: ["1,72"]`; `statusEsperado: "erro_execucao"`; `saidaEsperada: ""`; `requisitos: ["RF-03", "RF-10", "RNF-07"]`; `descricao` citando a Premissa da 010 e o R-02 da 003. Em `tests/aceitacao/adapter-core.test.js`, acrescentar: `1,72` em real → `erro.mensagem` com o complemento; `1.72` → `ok` e saída `1.72` (P-2) (RF-03, RF-10, RNF-07)

### Núcleo e interface

- [X] T017 [US1] Implementar em `src/execucao/controlador.js` até T012 passar: `obterPrograma()` devolve `{ codigo, avisos, variaveis = [] }`; `aoPedirEntrada` passado ao executor faz (1) `escreverLinhas(divisor.finalizar())`, (2) `criarPedidoEntrada(variavel, variaveis)`, (3) `await saida.pedirEntrada(pedido)`, (4) `saida.escrever(valor, 'entrada')`, (5) devolve `valor`; `saida.cancelarEntrada?.()` no fim de toda execução, antes do relato (depende de T006, T010) (P-3) (RF-10)
- [X] T018 [P] [US1] Em `src/ui/painel-saida.js` (contrato [tela-entrada.md](contracts/tela-entrada.md)): acrescentar `'entrada'` a `TIPOS`; `pedirEntrada({ rotulo, dica, confirmar })` cria no fim de `areaLinhas` um `<form class="saida-entrada">` com `<label>` ligado ao `<input type="text" autocomplete="off">` (ids únicos), a dica num `<span class="saida-entrada-dica">` ligado por `aria-describedby` quando não for `null`, e `<button type="submit">` com `confirmar`; foco no campo e rolagem até o fim; no `submit` (`preventDefault`), remove o form e resolve com `input.value` **sem `trim`**; um novo `pedirEntrada` remove o form anterior; `cancelarEntrada()` remove o form sem resolver. Nenhum `window.prompt` (SC-002). Atualizar o comentário do topo do arquivo (FR-002, FR-003) (RF-10)
- [X] T019 [P] [US1] Em `src/estilos.css`: `.saida-linha--entrada` com cor própria (variável de cor do tema; criar `--cor-entrada` no `:root` se não houver uma adequada) e `::before { content: '› '; }`; `.saida-linha--entrada:empty` com altura de uma linha; `.saida-entrada` com rótulo, campo e botão em linha (`display: flex; flex-wrap: wrap; gap`), fonte da Saída; `.saida-entrada-dica` menor e na cor suave (FR-003) (RF-10)
- [X] T020 [US1] Em `src/main.js`: em `atualizarPortugol`, guardar `ultimasVariaveis = projetoGerado.variaveis.map(({ nome, tipo }) => ({ nome, tipo }))`; `obterPrograma` devolve `{ codigo: ultimoCodigo, avisos: ultimosAvisos, variaveis: ultimasVariaveis }`. Atualizar o comentário do topo (spec 010) (depende de T017) (P-3) (RF-10)

### Verificação

- [X] T021 [US1] Rodar `npm test`; depois `npm run build` para confirmar que o worker e a página continuam empacotando (depende de T013, T015–T020) (RF-10, RNF-06)
- [X] T022 [US1] Percorrer no navegador (`npm run dev`) os roteiros 1 a 7, 10 e 11 do [quickstart.md](quickstart.md#b-no-navegador): campo com rótulo e dica, Enter e botão, entrada destacada, três `leia` em ordem, vírgula com o complemento, lógico, valor vazio, nenhuma janela do navegador e espera < 0,5 s depois do Enter. Anotar navegador e tempo medido (depende de T021) (FR-001–FR-005, SC-001, SC-002) (RF-10)
  - Feito no painel do navegador do Claude (Chromium, servidor do Vite), 2026-11-16. Roteiros 1 a 7 e 10 conferidos: campo com rótulo e foco; Executar desabilitado e Parar habilitado com o campo aberto; Enter e botão Confirmar; entradas em verde com `›`; dicas do inteiro, real e lógico; `1,72` com o complemento do ponto; valor vazio numa linha visível; nenhuma janela do navegador e nenhum erro no console. Roteiro 11: o campo seguinte apareceu cerca de 28 ms depois do Enter (meta < 0,5 s). A conferência por uma pessoa, digitando, continua no quadro "Conferências manuais pendentes".

**Checkpoint**: um programa com `leia` funciona pela tela, com as entradas digitadas na
Saída.

**Commit**: `010/T012-T022 (RF-10, RF-02, RF-03, RNF-03, RNF-06, RNF-07): campo de entrada na Saída e vírgula no leia de real`

---

## Fase 3: História 2 - Desistir de informar o valor (Prioridade: P2)

**Objetivo**: com o campo aberto, Parar termina a execução com "Execução interrompida
pelo usuário" e fecha o campo (research R-09).

**Teste independente**: executar `leia(nome)`, clicar em Parar com o campo aberto e ver
a mensagem; executar de novo e funcionar.

- [X] T023 [P] [US2] Em `tests/unidade/execucao-controlador.test.js`, no `describe('entrada (spec 010)')`: com `pedirEntrada` pendente, `parar()` → `executor.parar()` chamado, `cancelarEntrada` chamado, último item escrito "Execução interrompida pelo usuário" e estado `ocioso`; a promessa de `parar()` resolve; um `executar()` depois funciona (RF-10)
- [X] T024 [P] [US2] Em `tests/aceitacao/executar.test.js`: "Parar com o pedido aberto" — `leia(nome)` com `aoPedirEntrada` que nunca resolve; ao ser chamado, `executor.parar()` → `{ status: 'interrompido', saida: '', erro: null }`; a execução seguinte do "Olá, mundo!" termina `ok` (RF-10, RNF-07)
- [X] T025 [US2] Implementar o Parar com o campo aberto até T023 e T024 passarem: em `src/execucao/controlador.js`, o caminho `interrompido` chama `saida.cancelarEntrada?.()` antes do relato "Execução interrompida pelo usuário" e volta ao estado `ocioso`; em `src/execucao/executor.js`, a resposta de um `aoPedirEntrada` resolvida depois de `parar()` não é postada (research R-09). Rodar `npm test` (depende de T023, T024) (RF-10)
  - O T023 mostrou que um valor confirmado depois do Parar ainda seria escrito na Saída: o controlador ganhou a guarda `ativa` (falsa no fim de toda execução). O executor já não postava a resposta atrasada (T010).
- [X] T026 [US2] Percorrer os roteiros 8 e 9 do [quickstart.md](quickstart.md#b-no-navegador): Parar e Novo com o campo aberto (depende de T025) (RF-10)
  - Feito no painel do navegador do Claude, 2026-11-16: Parar com o campo aberto fecha o campo e mostra "Execução interrompida pelo usuário", com Executar habilitado de novo; Novo com o campo aberto, depois de confirmar o descarte, para a execução e mostra a orientação inicial. Sem erros no console.

**Commit**: `010/T023-T026 (RF-10, RNF-07): Parar com o campo de entrada aberto`

---

## Fase 4: Entrega

**Objetivo**: cobertura, README e versão única do Core.

- [X] T027 Rodar `npm test` e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/execucao/entrada.js`, `servico.js`, `executor.js`, `controlador.js` e `src/core/executor-core.js` no relatório; conferir que `tests/unidade/versao-unica.test.js` passa (a versão do Core continua só em `src/config.js`); versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 2 e 3) (RNF-04, RNF-02)

**Commit**: `010/T027 (RF-10, RNF-02, RNF-04): cobertura e README`

---

## Fase 5: Documentação das outras specs

**Objetivo**: registrar nas specs de origem que as pendências foram resolvidas (research
R-12).

- [X] T028 [P] Atualizar `specs/001-tela-tres-paineis/contracts/painel-saida.md`: na tabela de membros, `pedirEntrada({ rotulo, dica, confirmar })`, `cancelarEntrada()` e o tipo `'entrada'` em `escrever`, marcados "Spec 010", com link para [tela-entrada.md](contracts/tela-entrada.md); acrescentar que os textos do pedido vêm de `src/execucao/entrada.js` (RF-01, RF-10)
- [X] T029 [P] Marcar as pendências como resolvidas, com link para este `tasks.md`:
  - `specs/009-executar-no-core/research.md`, R-14, linha da 010: "✅ resolvida pela 010 por reexecução determinística ([R-02](../010-entrada-de-dados/research.md)), sem `SharedArrayBuffer`";
  - `specs/009-executar-no-core/plan.md`, "Pendências para outras specs", linha da 010: o mesmo;
  - `specs/009-executar-no-core/contracts/executar.md`, seção "Protocolo do worker": uma linha apontando para as mensagens `pedido_entrada` e `entrada` e o campo `interativo` em [entrada.md](../../010-entrada-de-dados/contracts/entrada.md);
  - `specs/003-blocos-leia-escreva/plan.md`, "Pendências para outras specs", linha da 010: "✅ resolvida pela spec 010" (caixa de entrada: Fase 2; vírgula: T014–T016);
  - `specs/003-blocos-leia-escreva/research.md`, R-02, linhas "Entrada esgotada" e `leia-quatro-tipos.json`: acrescentar "entrada interativa e mensagem da vírgula na [010](../010-entrada-de-dados/research.md) (R-02, R-07)";
  - `specs/008-portugol-valido/contracts/executor-core.md`, linha 77 (passo 4, "o stdin alimentado por `entrada` via `motor.setStdin`"): acrescentar que, a partir da 010, a entrada vem de uma lista lida pelo `input` próprio da ponte, sem `setStdin`; linha 99 ("A 010 troca `entrada[]` por uma função de stdin interativa sem mudar o resto"): trocar pela forma entregue (modo `interativo`, status `aguardando_entrada` e `continuarExecucao`, por reexecução). As duas com link para [adapter-core.md](../../010-entrada-de-dados/contracts/adapter-core.md);
  - `specs/010-entrada-de-dados/spec.md`: `**Status**: Rascunho` → `**Status**: Implementada`.
  (RF-03, RF-09, RF-10, RNF-01)
- [X] T030 [P] Em `specs/005-blocos-repeticao/spec.md`, nas Premissas, só como regra de usuário (princípio III): "Um `leia` dentro de um laço pede o valor a cada volta (spec 010); conferido com os blocos de repetição." (RF-05, RF-10)
- [X] T031 [P] A issue da lacuna do Core (research R-03): o texto já está redigido em `specs/010-entrada-de-dados/research.md`, R-03 (título "Expor qual variável o `leia` vai preencher"; passos: compilar `leia(nome)` no `meupia-core` 1.4.1; obtido: `nome = _S(input())`, sem nada que identifique a variável; sugestão: passar a informação no `prompt` do `input()` ou numa função `_leia` substituível; contorno no editor: `ponte-python.js`). A **abertura** da issue em `meuPia/core` é feita pela dupla, como na 008/R-09 e na 003/R-07; quando aberta, pôr o link em "Link da issue" no R-03 e na linha do princípio I do Constitution Check do `plan.md`. **A issue precisa estar aberta antes do PR** (RNF-01, RF-10)
  - Issue aberta pela dupla: [meuPia/core#18](https://github.com/meuPia/core/issues/18). Link posto no R-03 e no Constitution Check do `plan.md`.
- [X] T032 Rodar `npm test` uma vez antes do commit e, na descrição do PR, registrar: a decisão do R-02 (reexecução, sem COOP/COEP), as pendências P-1 a P-3 fechadas, o link da issue do T031, o tempo medido no T022 e o limite conhecido (conta pesada antes de vários `leia`). Não abrir o PR sem o link da issue no R-03 (depende de T028–T031) (RNF-05, RNF-01)
  - `npm test` rodado antes do commit (863 testes passando). O PR não foi aberto (sem push, a pedido); o texto para a descrição ficou no resumo da implementação. O T031 foi concluído ([meuPia/core#18](https://github.com/meuPia/core/issues/18)), então o PR já pode ser aberto.

**Commit**: `docs(010) (RF-10, RF-01, RF-03, RF-05, RF-09, RNF-01): pendências resolvidas nas specs 001, 003, 005, 008 e 009 e issue da lacuna do Core`

## Conferências manuais pendentes

O código está pronto e testado. Fica com a dupla só a conferência que depende de uma
pessoa. Quem fizer anota o resultado no PR e marca a task.

| Pendência | O que fazer | Task |
| --- | --- | --- |
| Roteiro do quickstart por uma pessoa | Os roteiros 1 a 11 do [quickstart.md](quickstart.md#b-no-navegador) foram percorridos no painel do navegador do Claude (T022, T026). Falta uma pessoa repetir digitando, num navegador comum (Chrome, Firefox ou Edge), e anotar navegador e impressão de uso no PR. | T022, T026 (registro) |

---

## Dependências e ordem

### Entre fases

- **Fundação (1)** → **US1 (2)** → **US2 (3)** → **Entrega (4)** →
  **Documentação (5)**.
- A US1 depende da Fundação (T017 usa `entrada.js` do T006 e o `aoPedirEntrada` do T010;
  T013 usa o serviço do T008).
- A US2 depende da US1 (T023 estende o `describe` do T012; o `cancelarEntrada` é do T017)
  e mexe nos mesmos arquivos de teste; por isso vem depois.
- Como há **um commit por fase**, uma fase só começa depois do commit da anterior.

### Dentro de cada fase

Testes primeiro (falhando), depois o núcleo (`src/core/`, `src/execucao/`), depois a
interface (`src/ui/`, `src/estilos.css`, `src/main.js`) e por último a verificação no
navegador.

### Oportunidades de paralelismo

- **Fundação**: T001 primeiro; depois T002 e T005 juntos; depois T003 e T006; T004, T007 e T009 juntos
  (arquivos diferentes); depois T008 e T010; T011 fecha.
- **US1**: T012, T013, T014 e T016 juntos; depois T015, T017, T018 e T019 juntos (T017 em
  `controlador.js`, T015 em `executor-core.js`, T018/T019 na interface); T020 depois do
  T017.
- **US2**: T023 e T024 juntos.
- **Documentação**: T028, T029, T030 e T031 juntos.

### Exemplo: Fundação

```text
Antes:   T001 base herdada verde
Juntas:  T002 ponte-python | T005 entrada (teste)
Juntas:  T003 executor-core.js | T006 entrada.js
Juntas:  T004 aceitação do adapter | T007 serviço (teste) | T009 executor (teste)
Juntas:  T008 servico.js | T010 executor.js
Depois:  T011 aceitação ponta a ponta no worker_threads → commit da fase
```

### Exemplo: História 1

```text
Juntas:  T012 controlador (teste) | T013 executar.test.js | T014 vírgula (teste) | T016 caso leia-real-virgula
Juntas:  T015 tradução da vírgula | T017 controlador.js | T018 painel Saída | T019 estilos
Depois:  T020 main.js → T021 npm test e build → T022 navegador → commit da fase
```

## Estratégia de implementação

### MVP (Fundação + História 1)

Fases 1 e 2. Parar e validar: `leia(nome)` + `escreva("Oi, ", nome)` roda no navegador,
o campo aparece na Saída com o nome e o tipo, "Ana" confirmado mostra `Oi, Ana`, os casos
com `leia` passam no modo interativo (SC-001) e o real com vírgula traz a dica e o erro
claro (P-2).

### Entrega incremental

1. MVP → programas com `leia` funcionam pela tela.
2. + US2 → Parar com o campo aberto.
3. Entrega e documentação → cobertura, README e as specs de origem atualizadas.

### Pendências para outras specs

Registradas no [plan.md](plan.md) (research R-12). Não são tasks desta spec, só notas
(T030):

- **005**: `leia` dentro de um laço conferido com os blocos de repetição.
- **Specs futuras com blocos não determinísticos** (aleatório, data, hora): rever a
  reexecução do R-02.
