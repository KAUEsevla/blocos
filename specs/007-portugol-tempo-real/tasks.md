---

description: "Tasks da spec 007: Portugol gerado em tempo real"
---

# Tasks: Portugol gerado em tempo real

**Entrada**: documentos de design em `specs/007-portugol-tempo-real/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constitution exige cobertura ≥ 80% no núcleo (princípio IV,
RNF-04). As duas regras novas do núcleo (`src/portugol/tempo-real.js` e
`src/portugol/fora-do-programa.js`) têm testes de unidade escritos antes da
implementação. Os botões novos são conferidos pelo teste estático
`tela-estrutura.test.js`. A ligação com Blockly e DOM é verificada no navegador pelo
quickstart (research R-07).

**Organização**: tarefas agrupadas por história de usuário da spec. A base (gerador,
registro, bloco `programa`, tela, painel Portugol, `aplicarAvisos`, `recarregarBlocos`)
é das specs 008 e 001 e não é refeita aqui (plan, "O que a 001 e a 008 já entregam").

**Rastreabilidade (constitution v1.2.0, princípio III)**: cada task cita o requisito
entre parênteses no fim. O commit de uma task usa `007/Txxx (RF-07): descrição`, por
exemplo `007/T003 (RF-07): atualizador em tempo real no núcleo`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]/[US2]**: história da spec (US1 = História 1, US2 = História 2)
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: confirmar que a base herdada está verde antes de mexer.

- [X] T001 Na branch `007-portugol-tempo-real`, rodar `npm install` e `npm test` (unidade + aceitação da 008 no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-07)

---

## Fase 2: Fundação

Nenhuma task. A base que as duas histórias usam (gerador puro que já ignora blocos
soltos, regeneração a cada evento não-UI, painel Portugol, marcação de avisos) já está
na `main` (research R-01). Cada história pode começar logo depois da Fase 1.

---

## Fase 3: História 1 - Ver o código mudar a cada bloco (Prioridade: P1) 🎯 MVP

**Objetivo**: o Portugol acompanha toda alteração sem ação do estudante, uma geração por
quadro, sem mudar durante o arraste; Desfazer e Refazer visíveis; a rolagem do painel
Portugol não se move ao atualizar (FR-001, FR-002, FR-005, FR-006).

**Teste independente**: `npm run test:unidade` verde com `tempo-real.test.js` e a parte
"História 1" de `tempo-real-cenarios.test.js`; no navegador, os passos 1 a 9 da seção 2
do [quickstart.md](quickstart.md) (nome do programa em tempo real, arraste do `programa`
sem piscar o Portugol, Desfazer/Refazer, Novo zerando os botões).

### Testes da História 1

- [X] T002 [P] [US1] Escrever `tests/unidade/tempo-real.test.js` para `criarAtualizacaoTempoReal({ atualizar, agendar })` com **todos** os casos da tabela "Testes" de [contracts/tempo-real.md](contracts/tempo-real.md). Usar um agendador manual (`const fila = []; const agendar = (fn) => fila.push(fn); const rodar = () => fila.splice(0).forEach((fn) => fn());`), `atualizar = vi.fn()` e eventos como objetos simples (`{ type: 'move', isUiEvent: false }`, `{ type: 'selected', isUiEvent: true }`, `{ type: 'drag', isUiEvent: true, isStart: true }` / `isStart: false`). Conferir também: `arrastando` vale `true` entre o `drag` de início e o de fim; depois de `rodar()`, um novo evento agenda de novo (`agendar` chamado 2× no total); `atualizarAgora()` durante o arraste chama `atualizar` na hora e deixa `arrastando === false`; **arraste de comentário** (linhas da tabela com `comment_drag`/`comment_move`): com `{ arrastando: true }` nada é agendado e `arrastando` continua `false`, o primeiro evento com `{ arrastando: false }` (mesmo sendo de interface) agenda e gera 1×, e um evento não-UI seguinte volta a agendar normalmente (o atualizador não ficou preso). Deve falhar até T003 (FR-001, FR-002; caso de borda "arraste") (RF-07)

### Implementação da História 1

- [X] T003 [US1] Implementar `src/portugol/tempo-real.js` exportando `criarAtualizacaoTempoReal({ atualizar, agendar })` conforme [contracts/tempo-real.md](contracts/tempo-real.md) e o estado do [data-model](data-model.md#estado-do-atualizador) (`arrastando`, `pendente`, `agendado`, `geracao`): `TypeError` se `atualizar` ou `agendar` não for função; `notificar(evento, { arrastando } = {})` trata `type === 'drag'` **antes** do filtro de `isUiEvent` (início liga o arraste; fim desliga e agenda sempre); em seguida, se não há arraste de bloco, `opcoes.arrastando === false` e `pendente`, agenda (libera o pendente, inclusive em evento de interface); outros eventos com `isUiEvent: true` são ignorados; evento não-UI durante o arraste de bloco **ou** com `opcoes.arrastando === true` só marca `pendente`; fora disso, agenda. `opcoes.arrastando` vale só para o evento em que chega e **nunca** liga `arrastando`: só os eventos `drag` ligam e desligam (contrato, "Dois sinais de arraste"; achado F1). `solicitar()` agenda ou marca pendente. "Agendar" chama `agendar(fn)` só se não houver geração agendada; `fn` compara a `geracao` capturada com a atual e só então chama `atualizar()` uma vez, limpando `agendado` e `pendente`. `atualizarAgora()` incrementa `geracao`, limpa `agendado`, `pendente` e `arrastando` e chama `atualizar()`. Expor `get arrastando()`. Sem Blockly, sem DOM, sem `requestAnimationFrame`, `Date` ou `performance` no arquivo (o teste `determinismo.test.js` já varre `src/portugol/`). Dentro da cobertura. Implementar até T002 passar (depende de T002) (FR-001, FR-002) (RF-07)
- [X] T004 [US1] Escrever `tests/unidade/tempo-real-cenarios.test.js`, bloco `describe('História 1 …')`, ligando `criarAtualizacaoTempoReal` a `gerarPortugol` com o registro de teste (`criarRegistroTeste`, `bloco`, `projetoDeTeste` de `tests/auxiliares/blocos-teste.js`). Registrar no topo do arquivo, num `criarRegistroTeste()` próprio, um bloco de valor `teste_numero` (`categoria: 'valor'`, `gerar: (b) => ({ codigo: String(b.fields.NUM), precedencia: 99 })`) e um comando `teste_escreva` com encaixe `VALOR` que emite `escreva(${ctx.valor(bloco, 'VALOR', 'o valor')})`. Simular o editor com uma variável `estado` (projeto atual) e `atualizar = () => { exibido = gerarPortugol(estado, registro).codigo; }`. Casos: (1) projeto vazio → encaixar `teste_escreva` com `teste_numero` 5, `notificar` um evento não-UI, rodar o agendador → `exibido` contém `escreva(5)` (cenário 1); (2) trocar o campo para 8 com evento `block_field_intermediate_change` → `escreva(8)` (cenário 2); (3) `estado.nome = 'Media'` + `solicitar()` → primeira linha `algoritmo "Media"` (cenário 3); (4) voltar `estado` ao objeto do passo anterior (o que o desfazer do Blockly faz) e notificar → `exibido` igual ao texto daquele passo (cenário 4); (5) `drag` início, mudar `estado` para sem o comando, notificar `move`, rodar o agendador → `exibido` ainda tem a linha; `drag` fim e rodar → a linha sumiu (caso de borda "arraste"); (6) projeto com 100 `teste_escreva` encaixados → uma notificação gera uma vez só e o texto tem 100 linhas `escreva`. O tempo do caminho inteiro com 100 blocos (SC-002) fica no caso 6 da T016, que já depende da T013 (depende de T003) (FR-001, FR-002, SC-001) (RF-07)
- [X] T005 [P] [US1] Em `src/ui/workspace.js`, conforme [contracts/editor.md](contracts/editor.md): **remover** `aoMudar` e exportar `ouvirEventos(ws, notificar)` = `ws.addChangeListener((evento) => notificar(evento, { arrastando: ws.isDragging() }))`, repassando todos os eventos, inclusive os de interface (research R-02); exportar `desfazer(ws)` = `ws.undo(false)`, `refazer(ws)` = `ws.undo(true)` e `estadoDesfazer(ws)` = `{ podeDesfazer: ws.getUndoStack().length > 0, podeRefazer: ws.getRedoStack().length > 0 }`. Não mudar `criarWorkspace`, `recarregarBlocos` nem `serializarBlocos`. Fora da cobertura (FR-001, FR-006) (RF-07)
- [X] T006 [P] [US1] Em `src/ui/painel-portugol.js`, mudar `mostrarCodigo(pre, codigo)` (research R-06): se `pre.textContent === codigo`, retornar sem tocar no DOM; senão guardar `scrollTop` e `scrollLeft` de `pre.parentElement` (o `.painel-corpo` que rola), atribuir `pre.textContent = codigo` e restaurar os dois valores. Atualizar o comentário do topo citando a spec 007, FR-005. `copiarCodigo` não muda. Fora da cobertura (FR-005) (RF-07)
- [X] T007 [P] [US1] Em `tests/unidade/tela-estrutura.test.js`, acrescentar `'Undo'` e `'Redo'` a `PALAVRAS_INGLES` e um teste "painel Blocos com Desfazer e Refazer" conforme [contracts/editor.md](contracts/editor.md): dentro de `trecho('section', 'painel-blocos')`, a `div.painel-cabecalho` tem `<h2 id="titulo-blocos">Blocos</h2>` seguido de `botao-desfazer` (texto `Desfazer`, `title="Desfazer (Ctrl+Z)"`) e `botao-refazer` (texto `Refazer`, `title="Refazer (Ctrl+Y)"`), **nessa ordem**, ambos `type="button"` e com `disabled`. Deve falhar até T008 (FR-006) (RF-07, RNF-03)
- [X] T008 [US1] Em `index.html`, no `.painel-cabecalho` de `painel-blocos`, depois do `<h2>`, acrescentar `<button type="button" id="botao-desfazer" disabled title="Desfazer (Ctrl+Z)">Desfazer</button>` e `<button type="button" id="botao-refazer" disabled title="Refazer (Ctrl+Y)">Refazer</button>`. Em `src/estilos.css`, dar a esses botões o mesmo estilo do `#botao-copiar` no cabeçalho (reaproveitar o seletor existente, sem duplicar regras) e um estilo de `:disabled` visível. No mesmo commit, atualizar a linha "Blocos" da tabela "Painéis" de `specs/001-tela-tres-paineis/contracts/tela.md` com os dois botões e um link para `specs/007-portugol-tempo-real/contracts/editor.md`. Implementar até T007 passar (depende de T007) (FR-006) (RF-07, RNF-03)
- [X] T009 [P] [US1] Criar `src/ui/barra-blocos.js` com `ligarBotoesDesfazer({ aoDesfazer, aoRefazer })` (liga o `click` de `#botao-desfazer` e `#botao-refazer`) e `atualizarBotoesDesfazer({ podeDesfazer, podeRefazer })` (atribui `disabled = !podeDesfazer` / `!podeRefazer`). Comentário do topo citando a spec 007, FR-006, e "fora da cobertura" (FR-006) (RF-07)
- [X] T010 [US1] Em `src/main.js`, ligar o tempo real conforme a seção `src/main.js` de [contracts/editor.md](contracts/editor.md) e o "Ciclo de uma geração" do [data-model](data-model.md#ciclo-de-uma-geração): criar `tempoReal = criarAtualizacaoTempoReal({ atualizar: atualizarPortugol, agendar: (fn) => requestAnimationFrame(fn) })`; trocar `aoMudar(ws, atualizarPortugol)` por `ouvirEventos(ws, tempoReal.notificar)`; no `aoMudarNome`, trocar `atualizarPortugol()` por `tempoReal.solicitar()`; no `novoProjeto`, trocar `atualizarPortugol()` por `tempoReal.atualizarAgora()` (antes de marcar a referência); na abertura, trocar a chamada final `atualizarPortugol()` por `tempoReal.atualizarAgora()`; em `atualizarPortugol`, depois de `aplicarAvisos`, chamar `atualizarBotoesDesfazer(estadoDesfazer(ws))`; ligar `ligarBotoesDesfazer({ aoDesfazer: () => desfazer(ws), aoRefazer: () => refazer(ws) })`. Atualizar o comentário do topo (a 007 deixa de ser "pendente") (depende de T003, T005, T006, T008, T009) (FR-001, FR-002, FR-006) (RF-07)
- [X] T011 [US1] Validar no navegador (`npm run dev`, 1280 px) os passos 1 a 9 da seção 2 do [quickstart.md](quickstart.md). O passo 3 só confere que o arraste do `programa` não quebra nada (sem erro no console, `#codigo-portugol` sem mudanças, observável com um `MutationObserver` temporário): como o `programa` nunca desencaixa nada, esse passo passaria mesmo sem a suspensão do arraste. A prova da suspensão é o caso 5 da T004, e a validação no navegador é o passo D da seção 3 do quickstart, na 002 (achado C3). O FR-005 (rolagem mantida) também não é observável hoje, com 5 linhas de Portugol; é validado no passo H, na 002 (achado C4). Registrar o resultado para o PR (depende de T010) (FR-001, FR-002, FR-006; História 1, cenário 3) (RF-07)

**Checkpoint**: História 1 completa no que é observável hoje; as regras de todos os
cenários da História 1 estão cobertas no núcleo (T002, T004).

---

## Fase 4: História 2 - Blocos soltos não entram no programa (Prioridade: P2)

**Objetivo**: blocos de topo fora do `programa` continuam fora do Portugol (já
garantido pelo gerador) e ganham a marca "Esta pilha está fora do programa", sem
bloquear a execução (FR-003, FR-004, SC-003).

**Teste independente**: `npm run test:unidade` verde com `fora-do-programa.test.js` e a
parte "História 2" de `tempo-real-cenarios.test.js`; no navegador, o bloco `programa`
nunca recebe a marca e o console fica sem erros.

### Testes da História 2

- [X] T012 [P] [US2] Escrever `tests/unidade/fora-do-programa.test.js` para `blocosForaDoPrograma(blocos)` e `MENSAGEM_FORA_DO_PROGRAMA` com **todos** os casos da tabela "Testes" de [contracts/fora-do-programa.md](contracts/fora-do-programa.md), usando `projetoVazio()`, `bloco`, `encadear` e `projetoDeTeste({ soltos })` de `tests/auxiliares/blocos-teste.js`. Conferir que a mensagem é exatamente `"Esta pilha está fora do programa"` e que cada item tem só as chaves `blocoId` e `mensagem`. Para "entrada congelada", congelar a entrada em profundidade com uma função auxiliar local. Deve falhar até T013 (FR-003, FR-004) (RF-07)

### Implementação da História 2

- [X] T013 [US2] Implementar `src/portugol/fora-do-programa.js` conforme [contracts/fora-do-programa.md](contracts/fora-do-programa.md): `export const MENSAGEM_FORA_DO_PROGRAMA = 'Esta pilha está fora do programa'`; `blocosForaDoPrograma(blocos)` lê `blocos?.blocks?.blocks`, devolve `[]` se não for lista, pula o **primeiro** bloco com `type === 'programa'` e devolve `{ blocoId: bloco.id, mensagem: MENSAGEM_FORA_DO_PROGRAMA }` para cada outro bloco de topo cujo `id` seja texto, na ordem da lista; nunca visita `inputs` nem `next`; não modifica a entrada. Sem Blockly e sem DOM; dentro da cobertura. Implementar até T012 passar (depende de T012) (FR-003, FR-004) (RF-07)
- [X] T014 [P] [US2] Em `src/ui/avisos-ui.js`, mudar `aplicarAvisos(workspace, avisos)` para `aplicarAvisos(workspace, avisos, chave = 'incompleto')` conforme [contracts/editor.md](contracts/editor.md) e as "Marcas na interface" do [data-model](data-model.md#marcas-na-interface): o `WeakMap` passa a guardar, por workspace, um `Map` de `chave → Set` de ids; `setWarningText(texto, chave)` e `setWarningText(null, chave)` usam a chave; mensagens do mesmo `blocoId` na mesma chave continuam juntadas por `\n`. `renderizarAvisos` e `destacarBloco` não mudam. Atualizar o comentário do topo citando a spec 007, FR-004. Fora da cobertura (FR-004) (RF-07)
- [X] T015 [US2] Em `src/main.js`, dentro de `atualizarPortugol`: guardar `const projetoGerado = projetoAtual()`, gerar a partir dele, chamar `aplicarAvisos(ws, resultado.avisos, 'incompleto')` e, logo depois, `aplicarAvisos(ws, blocosForaDoPrograma(projetoGerado.blocos), 'fora-do-programa')`, antes de `atualizarBotoesDesfazer`. A marca de soltos **não** entra em `resultado.avisos` (ela não bloqueia Executar, research R-04) (depende de T010, T013, T014; mesmo arquivo da T010) (FR-004) (RF-07)
- [X] T016 [US2] Em `tests/unidade/tempo-real-cenarios.test.js`, acrescentar o bloco `describe('História 2 …')`, usando o mesmo registro da T004 e `blocosForaDoPrograma`: (1) `teste_escreva` solto → o código não tem `escreva` e há 1 marca com o id dele (cenário 1); (2) o mesmo bloco movido para dentro do `programa` → a linha aparece e não há marca (cenário 2); (3) pilha solta de 3 blocos → 1 marca (o topo) e nenhum dos 3 no código (cenário 3); (4) `teste_leia` sem variável, solto → `gerarPortugol(...).avisos` vazio, 1 marca de fora, e `verificarExecucao(resultado).permitida === true`; (5) para os projetos dos casos 1–4 e da História 1, todo `blocoId` marcado é um bloco de topo e nenhum bloco alcançável a partir do `programa` é marcado (SC-003); (6) **tempo do caminho inteiro com 100 blocos** (achado C2): um projeto com 100 `teste_escreva` encaixados no `programa` (cada um com um `teste_numero`), medir com `process.hrtime.bigint()` (como em `gerador.test.js` da 008) o tempo de `const copia = JSON.parse(JSON.stringify(estado))` (no lugar do `serializarBlocos` do Blockly, que não roda em Node) + `gerarPortugol(copia, registro)` + `blocosForaDoPrograma(copia.blocos)`, e conferir `ms < 200` (SC-002 no núcleo; a medida no navegador fica para a 002) (depende de T004, T013; mesmo arquivo) (FR-002, FR-003, FR-004, SC-001, SC-002, SC-003) (RF-07)
- [X] T017 [US2] Validar no navegador que o bloco `programa` não tem ícone de aviso na abertura, depois de movê-lo, depois de Desfazer e depois de Novo, e que o console não mostra erros. Os cenários com bloco solto real ficam para a 002 (seção "Pendências") (depende de T015) (FR-004) (RF-07)

**Checkpoint**: Histórias 1 e 2 completas no núcleo e ligadas na interface.

---

## Fase 5: Acabamento

- [X] T018 Rodar `npm test` (unidade + aceitação da 008 no Core real) e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/portugol/tempo-real.js` e `src/portugol/fora-do-programa.js` no relatório; versionar `cobertura/` (incluindo `coverage-summary.json`, o relatório HTML e `testes.json`) e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 3 e 4) (RNF-04)
- [X] T019 Percorrer as seções 1 e 2 do [quickstart.md](quickstart.md) inteiras e conferir que nenhum texto novo da tela está em outro idioma (botões, `title`, menu de contexto do Blockly). Registrar no PR o que foi verificado e a lista de pendências para a 002 (seção abaixo) (depende de T018) (FR-001..FR-006) (RF-07, RNF-03)

---

## Pendências para as specs 002 e 003

Registradas no [plan.md](plan.md) (research R-09). Não são tasks desta spec:

- **002**: chamar `tempoReal.solicitar()` depois de criar, renomear ou apagar variável
  em `projeto.variaveis`; decidir se essas mudanças entram no desfazer; acrescentar um
  caso de aceitação em `tests/aceitacao/casos/` com um bloco de comando real solto fora
  do `programa`; validar no navegador os passos A a J da seção 3 do
  [quickstart.md](quickstart.md). **O FR-005 (rolagem mantida) é validado na 002**
  (passo H), porque na 007 o Portugol tem poucas linhas e não rola; o mesmo vale para
  a suspensão do arraste de um bloco encaixado (passo D) e para o SC-002 no navegador
  (passo I).
- **003**: repetir os passos A, D, E e F da seção 3 com o bloco `escreva`.
- **012**: depois de carregar, chamar `tempoReal.atualizarAgora()` antes de marcar a
  referência (contrato [editor.md](contracts/editor.md), "Ganchos").

---

## Dependências e ordem de execução

### Dependências entre fases

- **Setup (Fase 1)**: sem dependências.
- **Fundação (Fase 2)**: vazia.
- **História 1 (Fase 3)**: depende só da Fase 1. T002 → T003 → T004; T005, T006, T007
  e T009 em paralelo entre si e com T002/T003; T008 depende de T007; T010 depende de
  T003, T005, T006, T008 e T009; T011 fecha a história.
- **História 2 (Fase 4)**: o núcleo (T012 → T013) e a T014 podem começar logo depois da
  Fase 1, em paralelo com a História 1. A T015 depende da T010 (mesmo `src/main.js`) e a
  T016 da T004 (mesmo arquivo de teste).
- **Acabamento (Fase 5)**: depende das fases 3 e 4.

### Arquivos compartilhados (não paralelizar)

- `src/main.js`: T010 → T015.
- `tests/unidade/tempo-real-cenarios.test.js`: T004 → T016.
- `tests/unidade/tela-estrutura.test.js` e `index.html`: T007 → T008.

### Dependências com outras specs (specs/README.md)

- Depende da 008 e da 001, já na `main`.
- A 002 usa `tempoReal.solicitar()` e herda a marca de soltos sem código extra; a 012
  usa `tempoReal.atualizarAgora()`; a 009 continua usando só `resultado.avisos`.

### Dentro de cada história

- Os testes do núcleo são escritos primeiro e falham antes da implementação.
- O núcleo (`src/portugol/`) vem antes da interface (`src/ui/`, `src/main.js`).

---

## Oportunidades de paralelismo

- **História 1**: T002, T005, T006, T007 e T009 juntas; depois T003 e T008.
- **Entre histórias**: T012, T013 e T014 em paralelo com toda a História 1 até a T010.

### Exemplo: História 1

```text
Task: "T002 tests/unidade/tempo-real.test.js"
Task: "T005 src/ui/workspace.js"
Task: "T006 src/ui/painel-portugol.js"
Task: "T007 tests/unidade/tela-estrutura.test.js"
Task: "T009 src/ui/barra-blocos.js"

Task: "T003 src/portugol/tempo-real.js"
Task: "T008 index.html + src/estilos.css"
```

### Exemplo: História 2

```text
Task: "T012 tests/unidade/fora-do-programa.test.js"
Task: "T014 src/ui/avisos-ui.js"

Task: "T013 src/portugol/fora-do-programa.js"
```

---

## Estratégia de implementação

### MVP primeiro (História 1)

1. Fase 1: base verde.
2. Fase 3: atualizador no núcleo, ligação na interface, Desfazer/Refazer e rolagem.
3. **Parar e validar**: `npm run test:unidade` verde e a seção 2 do quickstart.

### Entrega incremental

1. Setup → base confirmada.
2. História 1 → MVP (Portugol em tempo real sem piscar no arraste, desfazer visível).
3. História 2 → marca de blocos soltos.
4. Acabamento → cobertura, README e quickstart; seguir com a 002 (ordem do
   specs/README.md), levando as pendências acima.

---

## Observações

- Commits: `007/Txxx (RF-07): descrição`, um por task ou por grupo pequeno de tasks.
- Mudanças em spec, plan, contratos ou quickstart durante a implementação:
  `docs(007) (RF-07): descrição`.
- Nenhuma dependência nova (research R-08). Nenhuma task toca o Core, o gerador ou o
  adapter.
- Uma entrega com cobertura abaixo de 80% ou com a aceitação da 008 falhando não entra
  na `main` (princípio IV).
