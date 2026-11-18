---

description: "Tasks da spec 012: Carregar projeto em JSON"
---

# Tasks: Carregar projeto em JSON

**Entrada**: documentos de design em `specs/012-carregar-projeto/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo, que inclui a
"serialização de projeto", e testes de aceitação no Core real (princípio IV, RNF-04,
RNF-07). O núcleo (`src/projeto/formato.js`, `src/projeto/carregar.js`) tem testes escritos
antes da implementação. A carga é testada headless no Blockly 12.5.1. O que só existe no
navegador (janela de arquivos, diálogos) é verificado pelo [quickstart.md](quickstart.md).

**Reaproveitamento** (research R-01, R-02): `formato.js` (escrita v1 da 011),
`alteracoes.js`, `variaveis.js` (`blocosComVariaveis`), `nome-variavel.js`
(`validarNomeVariavel`), `tipos.js` (`encaixesIncompativeis`), `recarregarBlocos`,
`confirmar` e a sequência do `novoProjeto()` **já existem**. `alteracoes.js` não muda.

**Organização**: Fundação (leitura no `formato.js`) → História 1 (carregar um projeto salvo,
P1) → História 2 (arquivo inválido não estraga o trabalho, P1) → entrega → documentação das
outras specs.

**Commits (constituição v2.0.0, princípio III)**: um commit por fase, depois de todas as
tasks da fase marcadas e de `npm test` rodado uma vez, passando. Formato
`012/Txxx-Tyyy (RF-xx, …): descrição`; a fase de documentação usa
`docs(012) (RF-xx, …): descrição`. A linha **Commit** no fim de cada fase traz a mensagem.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1]**, **[US2]**: História 1 e História 2 da spec

---

## Fase 1: Preparação

Nada a preparar: sem dependência nova (research R-11), `src/projeto/**` já está no `include`
da cobertura e `src/ui/**` e `src/main.js` já estão no `exclude` do `vite.config.js`.

---

## Fase 2: Fundação — leitura do arquivo v1 (bloqueia as histórias)

**Objetivo**: a leitura do arquivo fica em `src/projeto/formato.js`, ao lado da escrita da 011
(Premissas da 012; research R-02, R-04).

- [X] T001 Em `tests/unidade/formato.test.js` (existente; manter os testes atuais), acrescentar os casos de `lerArquivo` de `specs/012-carregar-projeto/contracts/carregar.md`, cada um com `ok`, `motivo` e `detalhe` exatos, na ordem do research R-04: texto de 1 048 577 bytes UTF-8 → `grande-demais` (sem chamar `JSON.parse`: espiar com `vi.spyOn(JSON, 'parse')`); `''`, `'   '`, `undefined` → `nao-e-projeto`; `'{'`, `'abc'` → `nao-e-projeto`; `'[]'`, `'null'`, `'{"formato":"outro"}'`, JSON sem `formato` → `nao-e-projeto`; `versao: 2` → `versao-nova`; `versao: 0`, `1.5`, `"1"`, ausente → `dados-invalidos` / "a versão do formato é inválida"; `nome: 5` → "o nome do programa é inválido"; `variaveis: {}` e item sem `id` → "a lista de variáveis é inválida"; `tipo: 'texto'` → `a variável "x" tem o tipo "texto", que não existe`; dois `id` iguais → "há duas variáveis com a mesma identificação"; nomes `1a`, `se`, `Nota` depois de `nota` → `o nome da variável "…" é inválido`; `blocos: 5` e `blocos: { blocks: {} }` → "os blocos do projeto estão corrompidos"; `blocos: {}` aceito. Aceitos: `nome: '  Média "final"  '` volta idêntico (sem `trim`); `blocos.variables` presente → ausente no `projeto`; variável com campo extra → só `{ id, nome, tipo }`; chave extra na raiz ignorada; `lerArquivo(textoArquivo(p))` com `assinaturaProjeto(projeto) === assinaturaProjeto(p)` para `projetoVazio()` e para um projeto com `se` **sem** `extraState` (continua sem). `lerArquivo` nunca lança. Deve falhar até T002 (FR-002, FR-004) (RF-12)
- [X] T002 Em `src/projeto/formato.js` (existente; não mudar `FORMATO`, `VERSAO_FORMATO`, `TIPOS_VARIAVEL`, `projetoVazio`, `montarArquivo` nem `textoArquivo`), acrescentar `export const TAMANHO_MAXIMO_ARQUIVO = 1_048_576` e `lerArquivo(texto)` conforme `contracts/carregar.md`: tamanho por `new TextEncoder().encode(texto).length`, depois as verificações do research R-04 na ordem (a primeira que falha decide), `validarNomeVariavel(nome, anteriores)` importado de `./nome-variavel.js` para cada variável; devolve `{ ok: true, projeto: { formato, versao, nome, variaveis, blocos } }` com cópia nova (`variaveis` só `{ id, nome, tipo }`, `blocos` sem `variables`, `nome` sem alteração) ou `{ ok: false, motivo, detalhe? }`. Sem Blockly, sem DOM; nunca lança (`try/catch` só em volta do `JSON.parse`). Atualizar o comentário do topo citando a 012. Conferir que `nome-variavel.js` não importa `formato.js` (sem ciclo). Implementar até T001 passar (depende de T001) (FR-002, FR-004) (RF-12)

**Ponto de verificação**: `npm run test:unidade` passa.

**Commit**: `012/T001-T002 (RF-12): leitura do arquivo de projeto no formato.js`

---

## Fase 3: História 1 — Continuar um projeto salvo (P1) 🎯 MVP

**Objetivo**: clicar em Carregar, escolher um `.json` salvo e ter de volta nome, variáveis,
blocos (com posições) e o Portugol, com a Saída limpa e o projeto "sem alterações"; com
alterações não salvas, pedir confirmação como o Novo (orientações 1, 4 e 5 do plan).

**Teste independente**: salvar um projeto, clicar em Novo, carregar o arquivo e comparar o
Portugol com o de antes (quickstart, passos 1–5, 10 e 12).

### Testes da História 1

- [X] T003 [P] [US1] Criar `tests/unidade/carregar.test.js` com os casos **aceitos** de `contracts/carregar.md`: `prepararCarregamento(textoArquivo(p))` devolve `{ ok: true, projeto }` com assinatura igual à de `p` para: `projetoVazio()`; projeto com variáveis dos quatro tipos e pelo menos um bloco de cada tipo de `registroPadrao.tiposRegistrados()` (conferido no teste: tipo registrado ausente faz o teste falhar); `escreva` com `extraState: { valores: 10 }`; `se` com `{ senao: true }` e comandos em `SENAO`; `se` **sem** `extraState` (aceito; `temSenao` falso); `se` com `{ senao: false }`; encaixe vazio (`se` sem condição, `recebe` sem valor); `VAR` ausente e `VAR: null` (variável não escolhida); bloco solto de topo com `x`/`y`. `mensagemRecusa` com os quatro motivos dá os textos exatos da tabela "Mensagens" (o de `dados-invalidos` com o detalhe e ponto final); `prepararCarregamento` repassa a recusa do `lerArquivo` com `mensagem`. `classificarErroCarga` com instâncias de classes falsas passadas em `excecoes` (`BadConnectionCheck`, `MissingConnection` → `{ ok: false, erro: 'encaixe' }`; `new Error()`, `new TypeError()` → `'desconhecido'`). Projeto com 100 blocos `escreva` encadeados no `programa`: `prepararCarregamento` em menos de 2000 ms (`performance.now()`). Deve falhar até T005 (FR-002, FR-003, SC-003) (RF-12)
- [X] T004 [P] [US1] Criar `tests/unidade/carregar-blockly.test.js`, headless com `carregarNoWorkspace` e `projetoDoWorkspace` de `tests/auxiliares/salvar-blockly.js`: montar o mesmo projeto completo de T003 num workspace, `salvarELer`, passar `salvo.texto` por `prepararCarregamento`, carregar o `projeto` resultante num **workspace novo** e conferir `variaveis` iguais (mesma ordem), serialização dos blocos igual, `x`/`y` dos topos iguais, `se` sem senão sem `extraState`, `gerarPortugol` idêntico (código e avisos), e `assinaturaProjeto(projetoDoWorkspace(novo, base)) === salvo.referencia` (carregar deixa "sem alterações", Premissas). SC-003 de ponta a ponta: um projeto com 100 blocos `escreva` encadeados no `programa`, salvo com `salvarELer`, passa por `prepararCarregamento` + ensaio (`ensaiarNoWorkspace`, acrescentado a `tests/auxiliares/salvar-blockly.js` nesta task com a lógica de `contracts/tela-carregar.md`) + `carregarNoWorkspace` em menos de 2000 ms (`performance.now()`). Deve falhar até T005 (FR-003, SC-001, SC-003) (RF-12)
- [X] T005 [US1] Criar `src/projeto/carregar.js` conforme `contracts/carregar.md` com `prepararCarregamento(texto, registro = registroPadrao)` (= `lerArquivo` + `validarBlocos`, anexando `mensagem`), `mensagemRecusa({ motivo, detalhe })` com os quatro textos exatos, `validarBlocos(projeto, registro)` percorrendo topos, `inputs[*].block` e `next.block`, por enquanto aceitando tudo que o editor produz (as regras de recusa entram na T013), e `classificarErroCarga(erro, excecoes)` (por `instanceof`, nunca pelo nome da classe, que vem minificado), usado pelo `ensaiarNoWorkspace` da T004. Importa de `./formato.js` e `../blocos/registro.js`. Sem Blockly, sem DOM. Implementar até T003 e T004 passarem (depende de T002–T004) (FR-002, FR-003) (RF-12)
- [X] T006 [P] [US1] Criar `tests/aceitacao/carregar.test.js` (modelo: `tests/aceitacao/salvar.test.js`): para cada caso de `tests/aceitacao/casos/*.json` validado com `validarCaso`, `prepararCarregamento(textoArquivo(caso.projeto))` é `ok`; carregar `projeto` com `carregarNoWorkspace`, montar com `projetoDoWorkspace`, conferir `gerarPortugol` igual a `gerarPortugol(caso.projeto)` e `compilarEExecutar` no `meupia-core` real (`criarMotorNode`) com `statusEsperado ?? 'ok'` e `saidaEsperada` para `caso.entrada`. Só o Portugol e a saída do Core: a assinatura não é comparada aqui, porque casos escritos à mão (`"007"`, `"3,5"`) são normalizados ao carregar; ela é conferida na T004. Depende de T005 (FR-003, SC-001) (RF-12, RNF-07)

### Implementação da História 1

- [X] T007 [US1] Em `tests/unidade/tela-estrutura.test.js`, trocar a verificação de que `botao-carregar` continua `disabled` com `title="Disponível em breve"` por: sem `disabled`, sem `Disponível em breve`, `title="Carregar um projeto salvo (.json)"`; acrescentar: `<input type="file" id="arquivo-carregar">` existe com `hidden` e `accept` contendo `.json`, logo depois de `#botao-carregar` dentro de `.barra-acoes`; ordem dos botões Executar, Parar, Salvar, Carregar, Novo; chaves `carregarDica`, `carregarTitulo`, `carregarMensagem`, `carregarConfirmar` em `TEXTOS` com os textos de `contracts/tela-carregar.md`. Deve falhar até T008 (FR-001, FR-005) (RF-12)
- [X] T008 [US1] Em `index.html`, tirar `disabled` do `#botao-carregar`, trocar o `title` por `"Carregar um projeto salvo (.json)"` e acrescentar logo depois `<input type="file" id="arquivo-carregar" accept=".json,application/json" hidden>`; em `src/ui/textos.js`, acrescentar `carregarDica: 'Carregar um projeto salvo (.json)'`, `carregarTitulo: 'Carregar outro projeto?'`, `carregarMensagem: 'As alterações que não foram salvas serão perdidas.'`, `carregarConfirmar: 'Descartar e carregar'`. Implementar até T007 passar (depende de T007) (FR-001, FR-005) (RF-12)
- [X] T009 [P] [US1] Criar `src/ui/arquivo.js` conforme `contracts/tela-carregar.md`: `escolherArquivo(input)` (zera `input.value`, `input.click()`, resolve com `input.files[0]` no `change` ou `null` se vazio; ouvinte com `{ once: true }`) e `lerTexto(file)` (`file.size > TAMANHO_MAXIMO_ARQUIVO` → `{ ok: false, motivo: 'grande-demais' }` sem ler; senão `{ ok: true, texto: await file.text() }`). Sem rede. Comentário de topo: interface, fora da cobertura (FR-001; caso de borda "Cancelar a janela") (RF-12)
- [X] T010 [US1] Em `src/ui/barra.js`, `ligarBarra` passa a receber `aoCarregar` e liga o clique de `#botao-carregar` a `aoCarregar?.()`; atualizar o comentário do topo (Carregar ligado pela 012). Em `src/main.js`, criar `carregarProjeto()` conforme `contracts/tela-carregar.md`, nesta versão sem o aviso de recusa (entra na T016; por ora uma recusa só faz `console.warn(preparado.mensagem)` e `return`): `escolherArquivo` → `null` = `return`; `lerTexto` → `prepararCarregamento`; se `haAlteracoes(projetoAtual(), referencia)`, `confirmar({ titulo: TEXTOS.carregarTitulo, mensagem: TEXTOS.carregarMensagem, confirmar: TEXTOS.carregarConfirmar, cancelar: TEXTOS.cancelar })` e `return` se cancelado; depois, na ordem do research R-08: `await controlador.parar()`, `projeto = { ...preparado.projeto }`, `definirNome(projeto.nome)` (texto exato), `recarregarBlocos(ws, projeto)`, `tempoReal.atualizarAgora()` (Portugol junto com os blocos, 007), `saida.mostrarOrientacao()` (FR-006), `referencia = assinaturaProjeto(projetoAtual())`, `mostrarAlteracoes(false)`. Nada antes da linha do `controlador.parar()` muda o projeto aberto. Defesa do projeto anterior (research R-08) já nesta task, para nenhum commit deixar um arquivo com bloco desconhecido quebrar o workspace: guardar `anterior = projetoAtual()` antes do `controlador.parar()` e, se o `recarregarBlocos` real lançar, recarregar `anterior` (nome e blocos, `definirNome(anterior.nome)`), `tempoReal.atualizarAgora()`, `console.warn` com a mensagem `mensagemRecusa({ motivo: 'dados-invalidos', detalhe: 'o editor não conseguiu montar os blocos' })` e `return` (o aviso na tela entra na T016). Passar `aoCarregar: carregarProjeto` ao `ligarBarra`. Atualizar o comentário do topo do `main.js` com a spec 012 (depende de T005, T008, T009) (FR-001, FR-003, FR-005, FR-006; 001 FR-007; 007 FR-001) (RF-12, RF-01)

**Ponto de verificação**: `npm test` passa; quickstart, passos 1–5, 10 e 12, no navegador.

**Commit**: `012/T003-T010 (RF-12, RF-01, RNF-07): Carregar um projeto salvo`

---

## Fase 4: História 2 — Arquivo inválido não estraga o trabalho (P1)

**Objetivo**: todo arquivo inválido é recusado por inteiro, com mensagem clara em pt-BR, e o
projeto aberto continua intacto; o encaixe inválido da 006 (`BadConnectionCheck`) vira
mensagem amigável (orientações 2 e 3 do plan; research R-03, R-05, R-06, R-09).

**Teste independente**: com um projeto aberto, carregar um arquivo de texto qualquer e ver a
mensagem e que nada mudou (quickstart, passos 6–9 e 11).

### Testes da História 2

- [X] T011 [P] [US2] Em `tests/unidade/carregar.test.js`, acrescentar os casos **recusados** de "Detalhes de `validarBlocos`" de `contracts/carregar.md`, cada um a partir de um arquivo válido com uma só mudança e conferindo `motivo: 'dados-invalidos'`, `detalhe` e `mensagem` exatos: `type: 'xyz'` (de topo e encaixado) → `o bloco "xyz" não existe no meuPiá Blocos`; bloco sem `id` e dois blocos com o mesmo `id`; sem `programa`; dois `programa`; `programa` encaixado; `programa` com `id: 'p2'`; topo sem `x`; `leia` com `inputs.FOO`; `escreva` com `valores: 3` e `inputs.VALOR5`; `se` sem senão com `inputs.SENAO`; número encaixado como comando em `COMANDOS` e comando (`leia`) encaixado num encaixe de valor; `next` num bloco de valor; `relacional` com operador `'XX'`; `numero` com `NUM: 'abc'` e `NUM: ''` (número inválido; `'007'` e `'3,5'` continuam aceitos, conferido no mesmo teste); `leia` com `VAR: { id: 'zz' }` fora de `variaveis`; `escreva` com `valores: 0`, `11`, `2.5`; `se` com `extraState: { senao: 'sim' }`; `recebe` de variável inteira com `logico` encaixado → `um valor lógico está encaixado onde só cabe número` (006, `encaixesIncompativeis`); `recebe` de variável `cadeia` com `numero` → `um número está encaixado onde só cabe texto`. `recusaDoEnsaio` dá os dois detalhes da tabela "Detalhes do ensaio". Nenhuma `mensagem` contém palavras em inglês do Blockly (`block`, `connection`, `Invalid`). Deve falhar até T013 (FR-002, FR-004, SC-002; História 2, cenários 1–4) (RF-12)
- [X] T012 [P] [US2] Em `tests/unidade/carregar-blockly.test.js`, acrescentar: (a) para **cada** arquivo inválido da sondagem do research R-03 (tipo `xyz`, encaixe lógico em `recebe` inteiro, encaixe `FOO`, `VAR` inexistente, `valores: 99`, sem `programa`, ids repetidos, `NUM: 'abc'`) e para um texto não JSON, um JSON de outro programa e `versao: 2`: com um workspace "aberto" (headless, com um projeto de 5 blocos carregado e uma alteração na pilha de desfazer), `prepararCarregamento` recusa, e assinatura, `getUndoStack().length` e `getAllBlocks().length` do workspace aberto continuam iguais; (b) com o `ensaiarNoWorkspace(projeto)` criado na T004 (mesma lógica do `ensaiarCarga` de `contracts/tela-carregar.md`: workspace headless novo, `try { workspaces.load(…) } catch (e) { return classificarErroCarga(e, Blockly.serialization.exceptions) } finally { ws.dispose() }`), conferir que o arquivo do encaixe lógico em `recebe` inteiro, passado direto ao ensaio (pulando `validarBlocos`), devolve `{ ok: false, erro: 'encaixe' }` (o `BadConnectionCheck` real da 006), o do encaixe `FOO` também `'encaixe'` (`MissingConnection`), o do tipo `xyz` `'desconhecido'`, e todo arquivo aceito por `prepararCarregamento` nos testes da História 1 passa no ensaio (`{ ok: true }`). Deve falhar até T013 (FR-002, FR-004, SC-002) (RF-12)
- [X] T013 [US2] Em `src/projeto/carregar.js`, completar `validarBlocos` com todas as regras e detalhes de `contracts/carregar.md` e do research R-05, na ordem de visita do contrato (a primeira violação decide): registro (`registro.obter(type)`); `id` único; `programa` único, de topo, `id: 'programa'`; `x`/`y` numéricos nos topos; encaixes da `definicao` (`args*` com `input_value`/`input_statement`) mais `VALOR1…VALOR{n}` do escreva (`nomeEncaixe`, `MAX_VALORES` de `src/blocos/entrada-saida.js`) e `SENAO` só com `temSenao`; conexão do filho (valor ↔ `output` na `definicao`; comandos/`next` ↔ `previousStatement`); `field_dropdown` dentro das opções; `NUM` com `normalizarNumero(NUM) !== null` (`src/blocos/valores.js`; recusa só número inválido); `VAR.id` presente em `projeto.variaveis` (ausente/`null` aceito); `extraState` do escreva com `valores` inteiro 1..10 e do se ausente ou `{ senao: boolean }`; por último `encaixesIncompativeis(projeto.blocos.blocks, registro, tipos)` (`src/blocos/tipos.js`), com o detalhe montado pelos nomes `Numero` → "número", `Texto` → "texto", `Logico` → "valor lógico" (artigo "um"; vários checks com " ou "). Acrescentar `recusaDoEnsaio({ erro })` (`classificarErroCarga` já existe desde a T005). Implementar até T011 e T012 passarem, sem quebrar T003, T004 e T006 (depende de T005, T011, T012) (FR-002, FR-004; 006 "Regra para a spec 012") (RF-12)

### Implementação da História 2

- [X] T014 [P] [US2] Em `src/ui/workspace.js`, exportar `ensaiarCarga(projeto)` conforme `contracts/tela-carregar.md`: `new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }))`, `Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws)` em `try`, no `catch` `console.warn` com a mensagem do Blockly e `return classificarErroCarga(erro, Blockly.serialization.exceptions)`, `ws.dispose()` em `finally`; `{ ok: true }` se passou. Não toca o workspace da tela (depende de T013) (FR-004) (RF-12)
- [X] T015 [P] [US2] Em `src/ui/confirmacao.js`, exportar `avisar({ titulo, mensagem, ok })` → `Promise<void>` conforme `contracts/tela-carregar.md`: mesmo `#dialogo-confirmacao`, `#dialogo-cancelar` com `hidden` enquanto aberto, rótulo `ok` no `#dialogo-confirmar` e foco nele, resolve no clique, no Esc (`cancel` com `preventDefault`) ou no `close`, remove os ouvintes e mostra Cancelar de novo ao encerrar (o `confirmar` seguinte fica igual). Em `src/ui/textos.js`, acrescentar `carregarFalhouTitulo: 'Não foi possível carregar'` e `entendi: 'Entendi'`; em `tests/unidade/tela-estrutura.test.js`, acrescentar as duas chaves à lista verificada (FR-004; princípio V) (RF-12)
- [X] T016 [US2] Em `src/main.js`, completar `carregarProjeto()` conforme `contracts/tela-carregar.md`: recusa do `lerTexto` vira `{ ok: false, mensagem: mensagemRecusa(lido) }`; se `prepararCarregamento` aceitou, `ensaio = ensaiarCarga(preparado.projeto)` e, se `!ensaio.ok`, `preparado = recusaDoEnsaio(ensaio)`; toda recusa faz `await avisar({ titulo: TEXTOS.carregarFalhouTitulo, mensagem: preparado.mensagem, ok: TEXTOS.entendi })` e `return` **antes** da confirmação (trocar o `console.warn` da recusa da T010); na defesa do projeto anterior criada na T010, trocar o `console.warn` por `avisar` com a mesma mensagem (research R-08, última defesa). Nenhum texto do Blockly na tela (depende de T010, T013–T015) (FR-004; História 2, cenários 1–4) (RF-12)

**Ponto de verificação**: `npm test` passa; quickstart, passos 6–9 e 11, no navegador.

**Commit**: `012/T011-T016 (RF-12): arquivo inválido recusado sem mexer no projeto aberto`

---

## Fase 5: Entrega

- [X] T017 Rodar `npm run cobertura`: cobertura ≥ 80% em linhas e branches com `src/projeto/carregar.js` e os acréscimos de `formato.js` medidos (se algum ramo ficar sem teste, acrescentar o caso em `carregar.test.js` ou `formato.test.js`); relatório em `cobertura/` e linha `**Testes:** N · **Cobertura:** X%` do `README.md` atualizados pelo script. Percorrer o [quickstart.md](quickstart.md) inteiro no navegador e registrar o resultado aqui; o que não der para conferir no painel do navegador vai para "Conferências manuais pendentes" (RNF-04, RNF-07) (RF-12)
  - `npm run cobertura`: 1335 testes passando, cobertura 99,52% em linhas e 94,9% em branches (99,7% no README); `src/projeto/formato.js` 100%/100% e `src/projeto/carregar.js` 100% em linhas e 96,4% em branches (um bloco de casos de formas corrompidas foi acrescentado ao `carregar.test.js` para cobrir os ramos de objeto inválido e o erro inesperado do registro). README atualizado pelo script.
  - Feito no painel do navegador do Claude (Chromium, servidor do Vite, painel oculto), 2026-11-17. O arquivo foi entregue ao `#arquivo-carregar` por `DataTransfer` + evento `change` (a janela de arquivos do sistema não abre sem gesto real), e o Salvar foi capturado no `URL.createObjectURL`. Resultados: com nome `Média "final" 2`, variáveis dos quatro tipos e um bloco solto, Salvar → Novo (não perguntou, projeto salvo) → Carregar devolveu o nome exato, o mesmo Portugol, Saída com a orientação, indicação oculta e Desfazer desabilitado (1, 2); com alterações, Carregar abriu "Carregar outro projeto?" com foco em Cancelar; Cancelar não mudou nada e "Descartar e carregar" trocou o projeto (3); sem alterações não perguntou (4); `.txt`, JSON de outro programa, `versao: 2`, bloco `xyz`, número na condição do `se` e arquivo de 1,1 MB abriram "Não foi possível carregar" com a mensagem certa, botão "Entendi", Cancelar escondido, e nome, Portugol, Saída e indicação iguais; Cancelar voltou no diálogo seguinte (6–9, 11); com o `leia` esperando, carregar parou a execução, limpou a Saída e mostrou o projeto novo (10); depois de carregar, o `beforeunload` não foi cancelado (12, pelo evento disparado na página). Na Fase 3, antes do aviso existir, um arquivo com bloco `xyz` fez o `recarregarBlocos` lançar e o projeto anterior voltou (defesa da T010). Sem erros no console além do aviso do Chrome sobre `beforeunload` sem gesto, da automação. O passo 5 (cancelar a janela) e a janela real ficam no quadro "Conferências manuais pendentes".

**Commit**: `012/T017 (RF-12, RNF-04, RNF-07): cobertura e README`

---

## Fase 6: Documentação das outras specs

- [X] T018 [P] Em `specs/001-tela-tres-paineis/contracts/tela.md` e `specs/001-tela-tres-paineis/data-model.md`, registrar que o `#botao-carregar` foi habilitado pela 012 (sem `disabled`, `title="Carregar um projeto salvo (.json)"`) com o `#arquivo-carregar` oculto ao lado, e que a linha "Carregar" da tabela de referência aponta para `specs/012-carregar-projeto/data-model.md` (RF-01, RF-12)
- [X] T019 [P] Em `specs/006-blocos-operadores/research.md` (R-15, linha "012") e `specs/006-blocos-operadores/contracts/tipos-encaixe.md` ("Regra para a spec 012"), marcar como resolvida pela 012: `encaixesIncompativeis` antes da carga e `BadConnectionCheck` classificado no ensaio, com mensagem "um valor lógico está encaixado onde só cabe número", apontando para `specs/012-carregar-projeto/contracts/carregar.md` (RF-06, RF-12)
- [X] T020 [P] Em `specs/011-salvar-projeto/data-model.md` (linha "Carregar" da tabela de referência) e `specs/011-salvar-projeto/plan.md` (pontos de atenção 3–5, que dizem que a 012 "ainda não existe"), registrar como a 012 usou o que a 011 deixou: `lerArquivo` em `formato.js`, se sem `extraState` aceito como senão desligado, nome bruto devolvido ao campo, referência marcada depois do `recarregarBlocos` (RF-11, RF-12)

**Commit**: `docs(012) (RF-12, RF-01, RF-06, RF-11): Carregar registrado nas specs 001, 006 e 011`

## Conferências manuais pendentes

Os roteiros do quickstart foram percorridos no painel do navegador do Claude com o painel
oculto, entregando o arquivo ao campo por `DataTransfer` (T017). Fica com a dupla repetir num
navegador comum (Chrome, Firefox ou Edge) e anotar o resultado no PR. Nenhuma lacuna do Core:
o Carregar não usa o Core, e a aceitação roda todos os casos carregados no `meupia-core` 1.4.1
sem mudança, então não há issue a abrir.

**Registro (2026-11-17)**: quem conferir troca a situação para "Conferido", com o navegador e
a data.

| Conferência | O que fazer | Task | Situação |
| --- | --- | --- | --- |
| Janela de arquivos real | Clicar em Carregar, escolher na janela do sistema um `.json` baixado pelo Salvar e ver o projeto voltar (quickstart, passo 1). | T009, T010 | Pendente: navegador comum |
| Cancelar a janela | Clicar em Carregar e fechar a janela sem escolher: nada acontece, nenhum diálogo (passo 5). | T009 | Pendente: navegador comum |
| Mesmo arquivo duas vezes | Carregar um arquivo, mexer num bloco e carregar o mesmo arquivo de novo: a confirmação aparece (o `value` do campo é zerado a cada escolha). | T009 | Pendente: navegador comum |
| Arquivo editado à mão | Abrir um `.json` salvo num editor de texto, trocar um `type` por `xyz` e carregar: aviso em pt-BR, nada muda (passo 8). | T016 | Pendente: navegador comum |
| Esc no aviso | Com o aviso "Não foi possível carregar" aberto, apertar Esc: o aviso fecha e o próximo Novo mostra Cancelar normalmente. | T015 | Pendente: navegador comum |

---

## Dependências e ordem

- **Fundação (T001–T002)** bloqueia as histórias.
- **História 1**: T003 e T004 em paralelo → T005 → T006; T007 → T008; T009 em paralelo com
  T003–T008; T010 depende de T005, T008 e T009.
- **História 2**: depende da História 1 (mesmos `carregar.js`, `main.js`, `textos.js`).
  T011 e T012 em paralelo → T013 → T014 e T015 em paralelo → T016.
- **Entrega** depois das duas histórias; **Documentação** por último (T018–T020 em paralelo).

## Paralelismo

```text
Fundação pronta →
  T003 tests/unidade/carregar.test.js
  T004 tests/unidade/carregar-blockly.test.js + tests/auxiliares/salvar-blockly.js
  T009 src/ui/arquivo.js
→ T005 src/projeto/carregar.js → T006 tests/aceitacao/carregar.test.js

História 1 pronta →
  T011 tests/unidade/carregar.test.js (recusas)
  T012 tests/unidade/carregar-blockly.test.js
→ T013 src/projeto/carregar.js →
  T014 src/ui/workspace.js
  T015 src/ui/confirmacao.js + textos.js + tela-estrutura.test.js
→ T016 src/main.js
```

## Estratégia

- **MVP**: Fundação + História 1. O ciclo salvar → carregar fecha; arquivos do próprio editor
  voltam idênticos, com confirmação e Portugol imediato. Um arquivo que a leitura recusa já
  não muda nada (só não mostra a mensagem ainda), e um que quebre o Blockly na carga real
  (por exemplo, bloco desconhecido) volta ao projeto anterior.
- **Incremento**: História 2, que endurece a validação (blocos, encaixes da 006, ensaio) e
  mostra a recusa em pt-BR. As duas histórias são P1: a entrega só vai para a `main` com as
  duas.
