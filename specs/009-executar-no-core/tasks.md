---

description: "Tasks da spec 009: Executar o programa pelo meuPiá Core"
---

# Tasks: Executar o programa pelo meuPiá Core

**Entrada**: documentos de design em `specs/009-executar-no-core/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). Cada módulo novo de
`src/execucao/` tem testes de unidade escritos antes da implementação, com o transporte e
o motor falsos. A aceitação roda o executor e o serviço reais com o `meupia-core` 1.4.1
dentro de `worker_threads` do Node (research R-11). A parte que só existe no navegador é
verificada pelo [quickstart.md](quickstart.md).

**Organização**: Setup, Fundação (adapter do Core, divisor de linhas, serviço e executor
do worker) e uma fase por história na ordem de prioridade. A pendência da 008 (bloqueio
na tela) entra na fase da História 1, no mesmo commit, para que nenhum commit mande
programa incompleto ao Core (SC-003 da 008). Ordem: História 1 com o bloqueio (rodar e
ver, P1; RF-08) → História 2 (entender um erro, P1) → História 3 (parar, P2) → entrega →
documentação das outras specs.

**Commits (constituição v2.0.0, princípio III)**: **um commit por fase**, feito quando
todas as tasks da fase estão marcadas e com os testes (`npm test`) rodados uma vez antes do
commit, passando. Formato `009/Txxx-Tyyy (RF-xx, …): descrição`, listando as tasks da fase;
tasks não consecutivas são separadas por vírgula. O commit cita todos os requisitos das
suas tasks. A fase de documentação (Fase 7) não implementa task de código e usa
`docs(009) (RF-xx, …): descrição`. A linha **Commit** no fim de cada fase traz a mensagem.

**Pendências obrigatórias** (research R-01):

- **P-1** (008, RF-08): Executar não começa com blocos incompletos, a Saída lista os
  avisos e clicar no aviso destaca o bloco. Fase 3 (T026–T030), no commit da História 1.
- **P-2** (003, FR-003, RF-03): uma linha por `escreva` na Saída da tela. T003, T004,
  T021, T022.
- **P-3** (003, SC-002, RF-03): "Olá, mundo!" montado e executado em menos de 2 minutos.
  T025 (passo A do quickstart).
- **P-4** (008, meuPia/core#14, RNF-01): `compilar(texto)` contornado só com a interface
  pública. T005, T006, T008.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]** rodar e ver o resultado, **[US2]** entender um erro, **[US3]** parar um
  programa que não termina
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: base herdada verde e configuração do worker e da cobertura.

- [X] T001 Na branch `009-executar-no-core`, rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-09)
- [X] T002 Em `vite.config.js`: acrescentar `worker: { format: 'es' }` no nível de cima da configuração (research R-02); em `test.coverage.include`, acrescentar `'src/execucao/**'`; em `test.coverage.exclude`, acrescentar `'src/execucao/worker.js'` com o comentário "cola de navegador, verificada no quickstart (research R-11)". Rodar `npm test` de novo para confirmar que nada muda (RNF-04, RNF-06)

**Commit**: `009/T001-T002 (RF-09, RNF-04, RNF-06): worker em ES module e cobertura de src/execucao`

---

## Fase 2: Fundação (bloqueia as histórias)

**Objetivo**: o adapter do Core escreve em fluxo e devolve o rastro, o divisor de linhas
existe, e o serviço e o executor do worker rodam o Core real dentro de um `worker_threads`
(contratos [adapter-core.md](contracts/adapter-core.md) e [executar.md](contracts/executar.md)).

### Divisor de linhas (núcleo)

- [X] T003 [P] Escrever `tests/unidade/execucao-linhas.test.js` para `criarDivisorLinhas()` de `src/execucao/linhas.js`:
  - `acrescentar("a\n\n")` → `["a", ""]` e `finalizar()` → `[]`;
  - `acrescentar("Ol")` → `[]`, `acrescentar("á\nx")` → `["Olá"]`, `finalizar()` → `["x"]`;
  - `acrescentar("")` → `[]`; `"a\r\nb\r\n"` → `["a", "b"]`;
  - 5.000 linhas num pedaço só saem inteiras e na ordem;
  - o `\n` final não cria linha vazia a mais (data-model, "Linha da Saída": "Linha vazia é válida (`escreva("")`) e aparece").
  (P-2) (RF-03, RF-09)
- [X] T004 [P] Implementar `src/execucao/linhas.js` (`criarDivisorLinhas`) até T003 passar, sem importar Pyodide nem tocar o DOM (RF-03, RF-09)

### Adapter do Core (`src/core/`)

- [X] T005 Em `src/core/ponte-python.js` (contrato [adapter-core.md](contracts/adapter-core.md#ponte_python)):
  - `_meupia_compilar(codigo)`: envolver `main("main.por", "output")` em `try/except (SystemExit, Exception)`; numa falha, `compilou = False` e `saidaCompilador` = stdout capturado + `traceback.format_exc()` (research R-04, item 3);
  - `_meupia_executar(ao_escrever=None)`: trocar o `io.StringIO` por uma classe `_Escrita` com `write(texto)` (grava no buffer e, se `ao_escrever` não for `None`, chama `ao_escrever(texto)`) e `flush()`; uma exceção devolve `{"tipo", "mensagem", "rastro": traceback.format_exc()}`;
  - restaurar o `sys.stdout` no `finally`, como hoje (o proxy de `ao_escrever` só é usado durante a chamada);
  - manter só `meuPia.compiler.main` como interface do Core (princípio I).
  (P-4) (RNF-01, RF-09)
- [X] T006 Em `src/core/executor-core.js`:
  - `compilarEExecutar(motor, codigo, entrada = [], { aoEscrever } = {})`: passar `aoEscrever ?? null` a `_meupia_executar` em `chamarPython`; sem o quarto parâmetro, comportamento igual ao da 008;
  - passar `execucao.erro.rastro` como terceiro argumento de `traduzirErroExecucao(tipo, mensagem, rastro)`, que usa `detalhe = rastro` quando existir e senão `"<Tipo>: <mensagem>"`;
  - `interpretarErroCompilacao`: sem a marca `[COMPILATION ERROR]:`, `mensagem` = "O meuPiá Core não conseguiu compilar o programa." e `detalhe` = a saída bruta; com a marca, como hoje (tabela do contrato).
  Atualizar `tests/unidade/executor-core.test.js`: os testes "sem o marcador, usa o texto inteiro" e "saída vazia vira mensagem genérica" passam a esperar a mensagem genérica nova; acrescentar `detalhe` com e sem `rastro` (P-4) (RNF-01, RF-09)
- [X] T007 [P] Em `src/core/motor-navegador.js`, `criarMotorNavegador({ aoProgresso } = {})`: chamar `aoProgresso?.('python')` antes do `loadPyodide` e `aoProgresso?.('core')` antes do `instalarCore`. Em `tests/aceitacao/suporte/motor-node.js`, a mesma assinatura e as mesmas duas chamadas em `criarMotorNode`. Em `tests/unidade/motor-navegador.test.js`, acrescentar: as duas etapas chegam na ordem `['python', 'core']`; sem o parâmetro, nada quebra (research R-06) (RF-09, RNF-06)
- [X] T008 Em `tests/aceitacao/adapter-core.test.js`, acrescentar (Core real):
  - com `aoEscrever`, os pedaços concatenados de `escreva("a")` / `escreva("b")` são iguais a `resultado.saida` (`"a\nb\n"`);
  - o stdout do compilador não chega a `aoEscrever`, nem num programa válido nem no texto inválido do teste de erro de compilação;
  - num erro de execução, `erro.detalhe` contém `Traceback` e `ZeroDivisionError`.
  Em `tests/aceitacao/aceitacao.test.js`, em cada caso, chamar `compilarEExecutar` com `aoEscrever` e verificar que a concatenação dos pedaços é igual a `resultado.saida`. Esta task prova o **adapter** (o fluxo de `aoEscrever` direto no Core); a Saída da tela é provada pelo T016 (depende de T005, T006) (RNF-01, RNF-07, RF-09)

### Serviço e executor do worker (núcleo)

- [X] T009 [P] Escrever `tests/unidade/execucao-servico.test.js` para `criarServicoExecucao({ criarMotor, postar, agora })` de `src/execucao/servico.js` (contrato [executar.md](contracts/executar.md#serviço-do-worker-servicojs)), com motor falso (objeto que o `compilarEExecutar` falso recebe; usar `vi.mock('../../src/core/executor-core.js')`) e relógio falso:
  - `{ tipo: 'preparar' }` duas vezes cria o motor uma vez só; posta `progresso` (`python`, `core`) repassados pelo `aoProgresso` e depois `pronto`;
  - `criarMotor` rejeitando com `ErroAmbiente` posta `{ tipo: 'falha_ambiente', mensagem }` com a mensagem do `ErroAmbiente`;
  - `{ tipo: 'executar', id, codigo, entrada }` sem `preparar` antes também prepara;
  - escritas `a`, `b`, `c`, `d` com o relógio em 0, 10, 60 e 70 ms viram dois lotes `{ tipo: 'saida', id, texto }`: `abc` (enviado aos 60 ms, 50 ms depois do início) e o resto `d` no fim, antes do `resultado`;
  - o `resultado` leva `saida: ''` e o `status`, `erro` do `compilarEExecutar`;
  - `compilarEExecutar` rejeitando vira `resultado` com `status: 'erro_execucao'` e a mensagem genérica "O programa parou com um erro durante a execução.";
  - a função `agora` padrão é `Date.now` e o lote não usa `setTimeout` (research R-05).
  (RF-09, RNF-06)
- [X] T010 Implementar `src/execucao/servico.js` até T009 passar. Importa `compilarEExecutar` de `src/core/executor-core.js` e recebe o motor por `criarMotor`; não importa o Pyodide (depende de T006) (RF-09, RNF-06)
- [X] T011 [P] Escrever `tests/unidade/execucao-executor.test.js` para `criarExecutor({ criarWorker })` de `src/execucao/executor.js`, com uma classe `WorkerFalso` (registra `postMessage`, tem `terminate` espião e `onmessage` atribuível; o teste simula as respostas):
  - nenhum worker é criado antes do primeiro `executar`; o primeiro envia `preparar` e depois `executar` com `id`, `codigo` e `entrada`;
  - `pronto()` é `false` até a mensagem `pronto`, e `true` depois;
  - `aoProgresso` recebe as etapas, `aoEscrever` recebe o `texto` de cada `saida`, e a promessa resolve com o `resultado`;
  - mensagens `saida`/`resultado` com `id` diferente do atual são ignoradas;
  - `falha_ambiente` resolve `{ status: 'falha_ambiente', saida: '', erro: { mensagem } }`, chama `terminate` e o próximo `executar` cria outro worker;
  - a segunda execução reaproveita o mesmo worker.
  (RF-09)
- [X] T012 Implementar `src/execucao/executor.js` (sem `parar`, que é da US3) até T011 passar (RF-09)
- [X] T013 Criar a cola dos dois ambientes:
  - **primeiro, a prova rápida** (research R-11): um script temporário que cria um `worker_threads` do Node, faz `loadPyodide()` do pacote npm dentro dele e devolve `runPython('1+1')`. Se der `2`, seguir. Se falhar, parar e aplicar o plano B do R-11, registrando no research o erro encontrado. O script não é versionado;
  - `src/execucao/worker.js`: `const servico = criarServicoExecucao({ criarMotor: criarMotorNavegador, postar: (m) => self.postMessage(m) }); self.onmessage = (e) => servico.receber(e.data);`
  - `tests/aceitacao/suporte/worker-node-entrada.js`: o mesmo com `criarMotorNode` e `parentPort` de `node:worker_threads`;
  - `tests/aceitacao/suporte/worker-node.js`: `criarWorkerNode()` cria `new Worker(new URL('./worker-node-entrada.js', import.meta.url))` de `node:worker_threads` e devolve `{ postMessage, terminate, onmessage }` no formato do `Worker` do navegador (repassa `worker.on('message', (data) => this.onmessage?.({ data }))`).
  (depende de T007, T010) (RF-09, RNF-06)

**Checkpoint**: o executor, com o worker do Node, compila e executa no Core real; o
adapter escreve em fluxo e devolve o rastro.

**Commit**: `009/T003-T013 (RF-09, RF-03, RNF-01, RNF-06, RNF-07): adapter em fluxo, divisor de linhas e worker de execução`

---

## Fase 3: História 1 - Rodar e ver o resultado (Prioridade: P1) 🎯 MVP

**Objetivo**: clicar em Executar mostra "Executando...", as linhas do programa e "Fim do
programa"; na primeira vez, a preparação com as duas etapas; Executar desabilitado e
Parar habilitado durante a execução. Com blocos incompletos, a execução não começa
(pendência P-1 da 008, no mesmo commit).

**Teste independente**: montar um "Olá, mundo!", clicar em Executar e ver o texto na Saída
seguido de "Fim do programa". Com um bloco incompleto, Executar não chama o executor e a
Saída lista os avisos na ordem do texto; clicar num aviso seleciona o bloco.

### Testes da História 1

- [X] T014 [P] [US1] Escrever `tests/unidade/execucao-mensagens.test.js` para `src/execucao/mensagens.js`:
  - `MENSAGENS_EXECUCAO` congelado e com os textos exatos da tabela do [contrato](contracts/executar.md#mensagens-e-relato-mensagensjs) (`preparando`, `etapaPython`, `etapaCore`, `executando`, `fim`, `interrompido`, `detalhesTecnicos`, `erroCompilacao`, `erroExecucao`, `linhaDoErro`);
  - `relatoDoResultado({ status: 'ok' })` → `[{ texto: 'Fim do programa', tipo: 'sistema' }]`;
  - `interrompido` → `[{ texto: 'Execução interrompida pelo usuário', tipo: 'sistema' }]`;
  - `falha_ambiente` → `[{ texto: erro.mensagem, tipo: 'erro' }]`.
  (FR-004) (RF-09)
- [X] T015 [P] [US1] Escrever `tests/unidade/execucao-controlador.test.js` (parte da US1) para `criarControladorExecucao` de `src/execucao/controlador.js`, com executor falso (`pronto`, `executar` que chama `aoProgresso`/`aoEscrever` e resolve um resultado) e Saída falsa que registra as chamadas em ordem:
  - primeira execução: estados `preparando` → `executando` → `ocioso` via `aoMudarEstado`; Saída: `limpar`, "Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos." (`sistema`), as duas etapas, "Executando..." (`sistema`), as linhas do programa (`escreverVarias(linhas, 'programa')`) e "Fim do programa" (FR-004; cenários 1 e 2);
  - com `executor.pronto()` `true`: só `executando` → `ocioso`, sem a mensagem `preparando`;
  - pedaço sem `\n` no fim é escrito depois do `finalizar()`, antes de "Fim do programa";
  - programa sem saída: "Executando..." e "Fim do programa" (caso de borda);
  - um segundo `executar()` enquanto o primeiro não terminou é ignorado (o executor é chamado uma vez) (FR-006);
  - o executor recebe o `codigo` lido no clique, mesmo que `obterPrograma` passe a devolver outro texto depois (caso de borda "alterar blocos durante a execução");
  - `falha_ambiente` escreve a mensagem como `erro` e volta a `ocioso`;
  - o executor rejeitando (exceção inesperada) termina com "Erro de execução" e a mensagem genérica "O programa parou com um erro durante a execução." (`erro`), e volta a `ocioso` (data-model, Estado: `ocioso` no fim "em qualquer resultado").
  (FR-001, FR-004, FR-006) (RF-09)
- [X] T016 [P] [US1] Criar `tests/aceitacao/executar.test.js` (Core real) com `criarExecutor({ criarWorker: criarWorkerNode })` num `beforeAll` que já faz uma execução para preparar o ambiente; fechar o worker no `afterAll`:
  - "Olá, mundo!" (o `portugolEsperado` de `tests/aceitacao/casos/escreva-ola-mundo.json`) termina com `status: 'ok'` e os pedaços recebidos por `aoEscrever` somam `"Olá, mundo!\n"`;
  - **SC-002**: com o ambiente pronto, `executar` do "Olá, mundo!" resolve em menos de 2.000 ms (medir com `performance.now()`);
  - **SC-001**: para cada caso de `tests/aceitacao/casos/`, gerar o Portugol, executar pelo executor e passar os pedaços pelo `criarDivisorLinhas`; as linhas são iguais a `saidaEsperada` passada pelo mesmo divisor, e o `status` é o `statusEsperado` (P-2).
  Este arquivo prova a **Saída da tela** (lotes do worker + divisor de linhas); o adapter sozinho é provado pelo T008. As duas verificações ficam (depende de T013) (RF-09, RF-03, RNF-07)

### Implementação da História 1

- [X] T017 [P] [US1] Implementar `src/execucao/mensagens.js` (`MENSAGENS_EXECUCAO`, `relatoDoResultado` para `ok`, `interrompido` e `falha_ambiente`) até T014 passar. Incluir já o relato **genérico** de `erro_execucao` (`erroExecucao` e `erro.mensagem`, os dois como `erro`), que o controlador usa para a exceção inesperada do T015. O T035 só refina as mensagens (linha do erro de compilação, `{ detalhe }`) (RF-09)
- [X] T018 [US1] Implementar `src/execucao/controlador.js` até T015 passar. Usa `criarDivisorLinhas` (T004) e `relatoDoResultado` (T017). Uma exceção do executor vira `{ status: 'erro_execucao', erro: { mensagem: 'O programa parou com um erro durante a execução.' } }` antes do relato. O passo de verificação dos avisos (`verificarExecucao`) entra no T027, ainda nesta fase (depende de T004, T017) (RF-09)
- [X] T019 [US1] Rodar `npm run test:aceitacao` e ajustar até T016 passar (depende de T013) (RF-09, RNF-07)
- [X] T020 [P] [US1] Em `index.html`, na `.barra-acoes`: tirar `disabled` e `title="Disponível em breve"` do `#botao-executar` e acrescentar, logo depois dele, `<button type="button" id="botao-parar" disabled>Parar</button>`. Em `src/ui/barra.js`: `ligarBarra({ aoMudarNome, aoNovo, aoExecutar, aoParar })` liga os cliques dos dois botões; nova `mostrarEstadoExecucao(estado)` com "Executar `disabled` fora do `ocioso`; Parar `disabled` no `ocioso`" (research R-10); atualizar o comentário do topo do arquivo. Em `tests/unidade/tela-estrutura.test.js`: a ordem dos botões passa a ser Executar, Parar, Salvar, Carregar, Novo; Executar sem `disabled` e sem `title`; Parar com `type="button"` e `disabled`; Salvar e Carregar continuam `disabled` com "Disponível em breve" (FR-006, cenário 3) (RF-09, RF-01)
- [X] T021 [P] [US1] Em `src/ui/painel-saida.js`, acrescentar ao objeto devolvido (contrato [tela-execucao.md](contracts/tela-execucao.md#painel-saída-srcuipainel-saidajs)):
  - `escreverVarias(linhas, tipo = 'programa')`: um `DocumentFragment` com uma `div.saida-linha saida-linha--{tipo}` por linha (`textContent`), um único `append` e um único ajuste de `scrollTop` (research R-13);
  - `escreverDetalhe(texto)`: `<details class="saida-detalhe"><summary>Detalhes técnicos</summary><pre>` com `textContent = texto`, fechado.
  Em `src/estilos.css`: `.saida-linha:empty { min-height: 1lh; }` (ou altura equivalente à de uma linha) e `.saida-detalhe` com fonte menor e cor secundária das variáveis de cor existentes. Atualizar o comentário do topo do arquivo (P-2) (RF-03, RF-09)
- [X] T022 [US1] Ligar em `src/main.js` (contrato [tela-execucao.md](contracts/tela-execucao.md#ligação-srcmainjs)):
  - `atualizarPortugol` guarda `ultimosAvisos = resultado.avisos`, além do `ultimoCodigo`;
  - `criarExecutor({ criarWorker: () => new Worker(new URL('./execucao/worker.js', import.meta.url), { type: 'module' }) })`;
  - `criarControladorExecucao({ obterPrograma: () => { tempoReal.atualizarAgora(); return { codigo: ultimoCodigo, avisos: ultimosAvisos }; }, executor, saida, destacar: (id) => destacarBloco(ws, id), aoMudarEstado: mostrarEstadoExecucao })`;
  - `ligarBarra` recebe `aoExecutar: () => controlador.executar()`; `mostrarEstadoExecucao('ocioso')` no fim do bootstrap.
  (depende de T012, T018, T020, T021) (FR-001, FR-008) (RF-09)
- [X] T023 [US1] Rodar `npm run build` e confirmar que o worker sai como arquivo separado em `dist/assets/` e que o build não tem erro (research R-02) (depende de T022) (RF-09, RNF-06)
- [X] T024 [US1] Na seção 2 do [quickstart.md](quickstart.md), percorrer os passos A (sem cronômetro), B, C, F, H e I no `npm run dev`. Corrigir o que divergir. É a primeira vez que o `motor-navegador.js` roda num navegador (plan, ponto de atenção 3) (depende de T022) (RF-09, RNF-06)
  - Feito: A, B, C, F e I conferidos. H coberto pelo teste do controlador (o código fica fixo no clique); a execução leva cerca de 14 ms, curta demais para mudar um bloco durante ela à mão. Ajustes encontrados: o Vite não resolvia os imports só de Node do Pyodide (plugin `pyodide-sem-node` no `vite.config.js`).
- [ ] T025 [US1] **SC-002 da 003 e SC-003 desta spec (P-3)**: com o cache do navegador limpo, refazer o passo A cronometrando: tempo da preparação até "Executando..." (≤ 30 s, com as duas etapas visíveis) e tempo total da página aberta até "Olá, mundo!" na Saída, com a montagem dos blocos (< 2 min). Anotar navegador, conexão e tempos para o PR (T047) (depende de T024) (RF-03, RF-09)
  - **Aberta.** Medido no painel do navegador do Claude (Chromium), com o cache HTTP **aquecido**: preparação 4,3 s (etapa 1 aos 0,08 s, etapa 2 aos 2,9 s, "Executando..." aos 4,3 s); execução com o ambiente pronto, 14 ms do clique a "Fim do programa". Falta a medição com o cache limpo e a montagem cronometrada por uma pessoa (< 2 min), que não dá para fazer pelo painel.

### Bloqueio por blocos incompletos (pendência P-1 da 008)

Executar não começa com blocos incompletos; a Saída mostra o motivo e lista os avisos na
ordem do texto; clicar num aviso destaca o bloco ("Pendências para a spec 009" do
[tasks.md da 008](../008-portugol-valido/tasks.md); research R-09). Fica no mesmo commit
da História 1: sem ele, um programa incompleto iria ao Core.

- [X] T026 [P] [US1] Acrescentar a `tests/unidade/execucao-controlador.test.js` um `describe('bloqueio por blocos incompletos (pendência da 008)')`:
  - `obterPrograma` devolve dois avisos (`blocoId` `b1` e `b2`, nessa ordem); `executar()` **não** chama `executor.executar`, o estado continua `ocioso` e nenhum `aoMudarEstado` diferente de `ocioso` acontece;
  - a Saída falsa recebe, em ordem, `limpar()`, `escrever('O programa tem blocos incompletos. Complete-os para executar.', 'erro')` e `mostrarAvisos(avisos, aoClicar)` com os dois avisos na mesma ordem;
  - chamar o `aoClicar` recebido com o segundo aviso chama `destacar('b2')`;
  - sem avisos, o fluxo da US1 segue normal.
  (FR-006 da 008) (RF-08, RF-09)
- [X] T027 [US1] Em `src/execucao/controlador.js`, antes do passo "permitido", chamar `verificarExecucao({ avisos })` de `src/portugol/execucao.js` e, com `permitida: false`, fazer o passo 3 do [contrato](contracts/executar.md#controlador-controladorjs). Implementar até T026 passar sem quebrar T015 (depende de T018) (RF-08, RF-09)
- [X] T028 [P] [US1] Em `src/ui/painel-saida.js`, acrescentar `mostrarAvisos(avisos, aoClicar)`, que chama `renderizarAvisos(areaAvisos, avisos, aoClicar)` de `src/ui/avisos-ui.js` (008/T042). Atualizar o comentário de `src/ui/avisos-ui.js` ("ficam prontos para a spec 009" passa a "usados pela spec 009") (RF-08)
- [X] T029 [US1] Conferir em `src/main.js` que o `destacar` passado ao controlador é `(blocoId) => destacarBloco(ws, blocoId)` (T022) e que `limpar()` da Saída esvazia também a lista de avisos de uma tentativa anterior (comportamento da 001). Ajustar se preciso (depende de T027, T028) (RF-08)
- [X] T030 [US1] Percorrer o passo D do [quickstart.md](quickstart.md): remover o valor de um `escreva` e de outro bloco, clicar em Executar, conferir a mensagem, a lista na ordem do texto e que o clique em cada aviso seleciona e centraliza o bloco certo; completar os blocos e conferir que Executar roda (depende de T029) (RF-08, RF-09)

**Checkpoint**: a História 1 funciona de ponta a ponta no navegador, com o bloqueio de
blocos incompletos; o MVP pode ser demonstrado.

**Commit**: `009/T014-T030 (RF-09, RF-08, RF-03, RF-01, RNF-06, RNF-07): Executar roda o programa, mostra a Saída e bloqueia blocos incompletos`

---

## Fase 4: História 2 - Entender um erro (Prioridade: P1)

**Objetivo**: "Erro de compilação" e "Erro de execução" distinguidos e explicados em
pt-BR, as linhas anteriores ao erro visíveis, e o rastro só em "Detalhes técnicos".

**Teste independente**: executar um programa que divide por zero e verificar a mensagem
de erro de execução em pt-BR, sem texto técnico em inglês.

### Testes da História 2

- [X] T031 [P] [US2] Em `tests/unidade/executor-core.test.js`, trocar a tabela de `traduzirErroExecucao` pela do [research R-07](research.md#r-07-mensagens-de-erro-em-pt-br-e-detalhes-técnicos), com os textos exatos (todos terminam em ponto): `ZeroDivisionError` → "Não é possível dividir por zero."; `ValueError` de `int()`/`float()` → "O valor digitado não é um número."; `EOFError` → "O programa pediu mais dados do que os informados."; `TypeError` → "Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número)."; `OverflowError` → "O número ficou grande demais para ser calculado."; `MemoryError` → "O programa usou memória demais."; outras → "O programa parou com um erro durante a execução.". Para cada linha, verificar que `mensagem` não contém a mensagem Python recebida (SC-004) (FR-005) (RF-09)
- [X] T032 [P] [US2] Em `tests/unidade/execucao-mensagens.test.js`, acrescentar `relatoDoResultado` para os erros (tabela do [contrato](contracts/executar.md#mensagens-e-relato-mensagensjs)):
  - `erro_compilacao` com `linha: 2` e o `codigo` `"algoritmo \"X\"\n    escreva(1\nfim_algoritmo\n"` → "Erro de compilação" (`erro`), `erro.mensagem` (`erro`), "Linha 2: escreva(1" (`erro`, sem a indentação) e `{ detalhe }`;
  - `erro_compilacao` com `linha: null` ou fora do código → sem o item da linha;
  - `erro_execucao` → "Erro de execução" (`erro`), `erro.mensagem` (`erro`) e `{ detalhe }`;
  - `detalhe` vazio não gera o item `{ detalhe }`.
  Em `tests/unidade/execucao-controlador.test.js`, acrescentar: com `erro_execucao` depois de duas linhas escritas, a Saída tem as duas linhas, depois o relato; o `detalhe` só chega à Saída por `escreverDetalhe`, nunca por `escrever` (cenário 3; SC-004) (FR-004, FR-005) (RF-09)
- [X] T033 [P] [US2] Em `tests/aceitacao/adapter-core.test.js`, trocar "Divisão por zero" por "Não é possível dividir por zero." e "O programa pediu mais dados do que os informados" pela versão com ponto. Em `tests/aceitacao/executar.test.js`, acrescentar: `escreva("antes")` seguido de `escreva(1 / 0)` termina com `erro_execucao`, os pedaços trazem `"antes\n"` e `erro.detalhe` contém `Traceback`; o texto inválido escrito à mão do teste de compilação do adapter termina com `erro_compilacao`, `erro.linha` preenchida e `relatoDoResultado` gera o item "Linha L: …" (cenários 1 e 2) (RF-09, RNF-07)

### Implementação da História 2

- [X] T034 [US2] Ampliar `traduzirErroExecucao` em `src/core/executor-core.js` até T031 passar (depende de T006) (RF-09)
- [X] T035 [US2] Refinar `relatoDoResultado` em `src/execucao/mensagens.js`: `erro_compilacao` completo (com a linha do Portugol) e o item `{ detalhe }` em `erro_compilacao` e `erro_execucao` (o relato genérico de `erro_execucao` já vem do T017); tratar o item `{ detalhe }` no controlador (`saida.escreverDetalhe`) até T032 e T033 passarem (depende de T017, T018) (RF-09)
- [X] T036 [US2] Percorrer o passo E do [quickstart.md](quickstart.md): "antes", "Erro de execução", "Não é possível dividir por zero." e "Detalhes técnicos" fechado; ao abrir, o `Traceback` em fonte menor (depende de T035, T021) (RF-09, RNF-03)

**Commit**: `009/T031-T036 (RF-09, RNF-03, RNF-07): erros de compilação e de execução em pt-BR`

---

## Fase 5: História 3 - Parar um programa que não termina (Prioridade: P2)

**Objetivo**: Parar interrompe a execução a qualquer momento, a Saída mostra "Execução
interrompida pelo usuário" e o editor volta a aceitar Executar.

**Teste independente**: com um `enquanto verdadeiro faca` em execução, chamar Parar e ver a
execução terminar, a mensagem e uma nova execução funcionar. Na aceitação, com Portugol
escrito à mão, porque o bloco `enquanto` é da 005 (research R-11, R-14).

### Testes da História 3

- [X] T037 [P] [US3] Em `tests/unidade/execucao-executor.test.js`, acrescentar `parar()`:
  - durante uma execução: chama `terminate`, a promessa pendente resolve `{ status: 'interrompido', saida: '', erro: null }` e um worker novo é criado e recebe `preparar` logo em seguida (research R-03);
  - `pronto()` volta a `false` até o worker novo mandar `pronto`;
  - um `saida` ou `resultado` atrasado do worker encerrado (`id` antigo) é ignorado;
  - `parar()` sem execução em andamento não faz nada.
  Em `tests/unidade/execucao-controlador.test.js`: `parar()` durante `executando` e durante `preparando` chama `executor.parar()`; a Saída termina com "Execução interrompida pelo usuário" (`sistema`); o estado volta a `ocioso`; `parar()` em `ocioso` não chama o executor (FR-007) (RF-09)
- [X] T038 [P] [US3] Em `tests/aceitacao/executar.test.js`, acrescentar (Core real em `worker_threads`):
  - programa escrito à mão com `i: inteiro`, `i <- 0` e `enquanto verdadeiro faca` / `i <- i + 1` / `escreva(i)` / `fim_enquanto`: depois do **segundo** pedaço em `aoEscrever` (prova de que a Saída chega em lotes, antes do fim), chamar `parar()`; o resultado é `interrompido` e uma execução seguinte do "Olá, mundo!" termina com `ok`;
  - programa escrito à mão com 1.500 `escreva(<n>)`: as 1.500 linhas chegam inteiras e na ordem (caso de borda "mais de 1.000 linhas"). Os 1.500 `escreva` terminam em menos de 50 ms, então o "mais de um lote" é provado no laço infinito acima.
  (FR-007) (RF-09, RNF-07)

### Implementação da História 3

- [X] T039 [US3] Implementar `parar()` em `src/execucao/executor.js` até T037 passar (depende de T012) (RF-09)
- [X] T040 [US3] Implementar `parar()` em `src/execucao/controlador.js` até T037 passar e ligar em `src/main.js`: `ligarBarra` recebe `aoParar: () => controlador.parar()`; o `novoProjeto` chama `controlador.parar()` antes de trocar o projeto (contrato [tela-execucao.md](contracts/tela-execucao.md#ligação-srcmainjs)) (depende de T018, T022, T039) (RF-09)
- [X] T041 [US3] Rodar `npm run test:aceitacao` e ajustar até T038 passar. No navegador (`npm run dev`), conferir que Parar fica habilitado durante a preparação e que clicar nele volta Executar a habilitado; o laço infinito montado com blocos fica para o quickstart da 005 (depende de T039, T040) (RF-09)

**Commit**: `009/T037-T041 (RF-09, RNF-07): Parar interrompe a execução`

---

## Fase 6: Entrega

**Objetivo**: cobertura, README, quickstart completo e o caso "sem internet".

- [ ] T042 Percorrer o passo G do [quickstart.md](quickstart.md) (rede "Offline" na primeira execução, mensagem do `ErroAmbiente`, Executar habilitado de novo, rede religada e execução normal). Depois, a seção 2 inteira numa aba nova, conferindo que nenhum texto exibido por padrão está em outro idioma (SC-004) (depende das fases 3 a 5) (RF-09, RNF-03)
  - **Aberta.** A varredura de pt-BR foi feita: todos os textos exibidos por padrão estão em pt-BR (Saída, botões, avisos, erros; os únicos termos em inglês, `ErroAmbiente`, `ValueError` e `[COMPILATION ERROR]:`, são internos e não aparecem). Falta o passo G: o painel do navegador do Claude não simula a rede "Offline". O caminho de falha está coberto pelos testes do serviço (`falha_ambiente`, nova tentativa recria o motor) e do executor (worker descartado, o próximo clique cria outro).
- [X] T043 Rodar `npm test` e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/execucao/linhas.js`, `mensagens.js`, `controlador.js`, `executor.js`, `servico.js` e `src/core/` no relatório e `src/execucao/worker.js` fora dele; conferir que `tests/unidade/versao-unica.test.js` passa com os arquivos novos (`src/execucao/`, `tests/aceitacao/suporte/worker-node*.js`), ou seja, que a versão do Core continua só em `src/config.js`; versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende de T042) (FR-002) (RNF-04, RNF-02)

**Commit**: `009/T042-T043 (RF-09, RNF-02, RNF-03, RNF-04): cobertura, README e quickstart`

---

## Fase 7: Documentação das outras specs

**Objetivo**: registrar nas specs de origem que as pendências foram resolvidas e o que
fica para a 005 e a 010.

- [X] T044 [P] Atualizar os contratos da 001 e da 008:
  - `specs/001-tela-tres-paineis/contracts/tela.md`: linha do `botao-executar` sem `disabled` (009) e linha nova do `botao-parar` (`disabled` no ocioso), com link para [tela-execucao.md](contracts/tela-execucao.md);
  - `specs/001-tela-tres-paineis/contracts/painel-saida.md`: os três membros novos (`escreverVarias`, `escreverDetalhe`, `mostrarAvisos`) e a exceção "os textos da execução vêm de `src/execucao/mensagens.js`";
  - `specs/008-portugol-valido/contracts/executor-core.md`: no fim da seção "Execução", uma linha apontando para as ampliações em [adapter-core.md](contracts/adapter-core.md) (`aoEscrever`, rastro, tradução, progresso) e registrando a mudança visível: as mensagens de erro de execução passam a terminar com ponto, inclusive as de `EOFError` e `ValueError`, e "Divisão por zero" vira "Não é possível dividir por zero.".
  (RF-01, RF-08, RF-09)
- [X] T045 [P] Marcar as pendências como resolvidas, com link para este `tasks.md`:
  - `specs/008-portugol-valido/tasks.md`, seção "Pendências para a spec 009": nota "Resolvidas na 009 (Fase 3, T026–T030)";
  - `specs/003-blocos-leia-escreva/research.md`, R-12, linha da 009: "✅ resolvida" (FR-003 na Saída da tela: T021/T022; SC-002: tempos do T025);
  - `specs/003-blocos-leia-escreva/plan.md`, "Pendências para outras specs", linha da 009: o mesmo;
  - `specs/008-portugol-valido/research.md`, R-09, linha do `compilar(texto)`: acrescentar "contorno mantido e reforçado na 009 ([R-04](../009-executar-no-core/research.md))".
  (RF-03, RF-08, RNF-01)
- [X] T046 [P] Registrar o que fica para outras specs (research R-14), só como regra de usuário nas specs, sem detalhe técnico (princípio III): em `specs/005-blocos-repeticao/spec.md`, nas Premissas, "Parar um laço infinito e a Saída com mais de 1.000 linhas são conferidos com os blocos de repetição (spec 009)". O detalhe técnico da 010 (entrada interativa no worker) fica só no R-14 desta spec, para o plan da 010 citar (RF-05, RF-10)
- [X] T047 Rodar `npm test` uma vez antes do commit e, na descrição do PR, registrar: os tempos do T025, as pendências P-1 a P-4 fechadas e o que fica para a 005 e a 010 (depende de T044–T046) (RNF-05)
  - `npm test` rodado antes do commit. O PR não foi aberto (sem push, a pedido); o texto para a descrição ficou no resumo da implementação, com os tempos medidos e as tasks abertas (T025, T042).

**Commit**: `docs(009) (RF-09, RF-01, RF-03, RF-05, RF-08, RNF-01): pendências resolvidas nas specs 001, 003, 005 e 008`

---

## Conferências manuais pendentes

O código está pronto e testado; faltam três conferências que precisam de uma pessoa ou de
um navegador com controle de rede e de cache. Por isso T025 e T042 continuam desmarcadas.
Quem conferir anota navegador, conexão e resultado no PR e marca a task.

| Conferência | Meta | Task | Como |
| --- | --- | --- | --- |
| Preparação do ambiente com o cache do navegador limpo | ≤ 30 s até "Executando...", com as duas etapas visíveis (SC-003) | T025 | Passo A do [quickstart.md](quickstart.md), com o cache limpo antes de abrir a página. Com o cache aquecido, a preparação levou 4,3 s. |
| "Olá, mundo!" montado e executado por uma pessoa | < 2 min da página aberta até "Olá, mundo!" na Saída (SC-002 da 003) | T025 | Passo A cronometrado, com a montagem dos blocos feita à mão e a primeira preparação incluída. |
| Primeira execução sem internet | Mensagem "Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo.", Executar habilitado de novo e, com a rede religada, execução normal | T042 | Passo G do [quickstart.md](quickstart.md), com a rede "Offline" nas DevTools. Hoje coberto só pelos testes de unidade do serviço e do executor. |

---

## Dependências e ordem

### Entre fases

- **Setup (1)** → **Fundação (2)** → **US1 com o bloqueio (3)** → **US2 (4)** →
  **US3 (5)** → **Entrega (6)** → **Documentação (7)**.
- Dentro da Fase 3, o bloqueio estende o controlador da US1 (T027 depende de T018) e
  entra no mesmo commit.
- A US2 depende da Fundação (T034 estende o T006) e da US1 (T035 estende T017 e T018).
- A US3 depende da Fundação (T039 estende o T012) e da US1 (T040 estende T018 e T022).
  A US2 e a US3 mexem em arquivos diferentes no núcleo (`executor-core.js` e
  `mensagens.js` contra `executor.js`), mas as duas acrescentam testes ao
  `execucao-controlador.test.js` e ao `executar.test.js`; por isso seguem em sequência,
  e a ordem de prioridade (P1 antes de P2) decide.
- Como há **um commit por fase**, uma fase só começa depois do commit da anterior.

### Dentro de cada fase

Testes primeiro (falhando), depois o núcleo (`src/execucao/`, `src/core/`), depois a
interface (`src/ui/`, `index.html`, `src/main.js`) e por último a verificação no
navegador.

### Oportunidades de paralelismo

- **Fundação**: T003, T005, T007, T009 e T011 juntos (arquivos diferentes); depois T004,
  T006, T010 e T012; T008 depois de T005/T006; T013 fecha.
- **US1**: T014, T015 e T016 juntos; depois T017, T020 e T021 juntos; T018 depois do T017;
  no bloqueio, T026 e T028 juntos.
- **US2**: T031, T032 e T033 juntos.
- **US3**: T037 e T038 juntos.
- **Documentação**: T044, T045 e T046 juntos.

### Exemplo: Fundação

```text
Juntas:  T003 linhas (teste) | T005 ponte-python | T007 motores com progresso | T009 serviço (teste) | T011 executor (teste)
Juntas:  T004 linhas.js | T006 executor-core.js | T012 executor.js
Depois:  T008 aceitação do adapter → T010 servico.js → T013 worker.js e worker do Node
```

### Exemplo: História 1

```text
Juntas:  T014 mensagens (teste) | T015 controlador (teste) | T016 executar.test.js
Juntas:  T017 mensagens.js | T020 barra e index.html | T021 painel Saída
Depois:  T018 controlador.js → T019 aceitação → T022 main.js → T023 build → T024 navegador → T025 tempos
Juntas:  T026 bloqueio (teste) | T028 mostrarAvisos
Depois:  T027 verificarExecucao no controlador → T029 main.js → T030 navegador → commit da fase
```

## Estratégia de implementação

### MVP (Fundação + História 1)

Fases 1 a 3. Parar e validar: o "Olá, mundo!" roda no navegador pelo Core real, a Saída
tem uma linha por `escreva`, a primeira execução mostra a preparação, o tempo do SC-002
da 003 está medido, e blocos incompletos bloqueiam a execução (RF-08 fechado).

### Entrega incremental

1. MVP → Executar funciona e não manda programa incompleto ao Core.
2. + US2 → erros em pt-BR com "Detalhes técnicos".
3. + US3 → Parar.
4. Entrega e documentação → cobertura, README e as specs de origem atualizadas.

### Pendências para outras specs

Registradas no [plan.md](plan.md) (research R-14). Não são tasks desta spec, só notas
(T046):

- **010**: entrada interativa do `leia` dentro do worker.
- **005**: Parar e mais de 1.000 linhas conferidos com blocos no navegador.
