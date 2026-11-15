---

description: "Tasks da spec 002: Blocos de variáveis"
---

# Tasks: Blocos de variáveis

**Entrada**: documentos de design em `specs/002-blocos-variaveis/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constitution exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). Cada módulo novo do núcleo
(`src/projeto/nome-variavel.js`, `src/projeto/variaveis.js`, `src/blocos/variaveis.js`,
`src/blocos/caixa-blocos.js`) tem testes de unidade escritos antes da implementação.
O comportamento do Blockly em que o desenho se apoia (research R-04, R-06) é conferido
no Blockly headless. A ligação com o DOM é verificada no navegador pelo
[quickstart.md](quickstart.md).

**Organização**: tarefas agrupadas por história da spec. O gerador, o registro, a
seção `var`, o `ctx.variavel`, o atualizador em tempo real e o `confirmar()` já estão
na `main` (008, 001, 007) e não são refeitos (research R-01).

**Rastreabilidade (constitution v1.2.0, princípio III)**: cada task cita o requisito
entre parênteses no fim. O commit de uma task usa `002/Txxx (RF-02): descrição`, por
exemplo `002/T010 (RF-02): regra do nome de variável no núcleo`.

**Regra da meta-verificação (008)**: a suíte de aceitação exige que todo tipo do
`registroPadrao` apareça num caso. Por isso cada task que registra um bloco traz, **no
mesmo commit**, o caso de aceitação que o usa (T026).

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]…[US4]**: história da spec (US1 = História 1, … US4 = História 4)
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: confirmar que a base herdada está verde antes de mexer.

- [X] T001 Na branch `002-blocos-variaveis`, rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-02)

---

## Fase 2: Fundação (bloqueia todas as histórias)

**Objetivo**: as variáveis passam a viver no mapa de variáveis do workspace e a chegar
ao gerador por `projetoAtual()` (research R-04); o campo `campo_variavel` existe; os
blocos de teste ficam compartilhados. Nada muda na tela ainda.

- [X] T002 [P] Em `tests/auxiliares/blocos-teste.js`, acrescentar ao `criarRegistroTeste()` os blocos de teste `teste_numero` (`categoria: 'valor'`, rótulo `número`, `gerar: (b) => ({ codigo: String(b.fields.NUM), precedencia: 99 })`), `teste_escreva` (`categoria: 'comando'`, rótulo `escreva`, encaixe `VALOR`, emite `` escreva(${ctx.valor(b, 'VALOR', 'o valor')}) ``) e `teste_soma` (`categoria: 'valor'`, rótulo `soma`, encaixes `A` e `B`, devolve `` { codigo: `${ctx.valor(b, 'A', 'o primeiro valor')} + ${ctx.valor(b, 'B', 'o segundo valor')}`, precedencia: 50 } ``). Em `tests/unidade/tempo-real-cenarios.test.js`, **apagar** os dois `registro.registrarBloco(...)` locais de `teste_numero` e `teste_escreva` (passariam a ser duplicados e o registro lança erro) e confirmar que o arquivo continua passando sem outras mudanças (RF-02)
- [X] T003 [P] Escrever `tests/unidade/variaveis-projeto.test.js` para `variaveisDoMapa` e `blocosComVariaveis` conforme a seção "Variáveis do projeto" de [contracts/blocos-variaveis.md](contracts/blocos-variaveis.md), com modelos falsos `{ getId: () => 'v1', getName: () => 'idade', getType: () => 'inteiro' }`: (1) preserva a ordem recebida e devolve `{ id, nome, tipo }`; (2) ignora modelo com tipo fora de `TIPOS_VARIAVEL` (`"inteiro" | "real" | "cadeia" | "logico"`), por exemplo `''` ou `'texto'`; (3) lista vazia → `[]`; (4) `blocosComVariaveis(blocos, variaveis)` devolve cópia com `variables: [{ id, name, type }]` na ordem de `variaveis`, **sem** alterar `blocos` (usar `Object.freeze` profundo no teste); (5) substitui uma chave `variables` que já exista; (6) `blocos` `{}` funciona. Deve falhar até T004 (FR-001, FR-004) (RF-02)
- [X] T004 Criar `src/projeto/variaveis.js` exportando `variaveisDoMapa(modelos)` e `blocosComVariaveis(blocos, variaveis)` conforme o contrato. Sem importar `blockly`, sem DOM. Comentário do topo citando a spec 002, research R-04. Implementar até T003 passar (depende de T003) (FR-001, FR-004) (RF-02)
- [X] T005 Criar `src/ui/campo-variavel.js` com `class CampoVariavel extends Blockly.FieldVariable` e `registrarCampoVariavel()` idempotente (`Blockly.fieldRegistry.register('campo_variavel', CampoVariavel)` só na primeira chamada), conforme a seção `src/ui/campo-variavel.js` de [contracts/editor-variaveis.md](contracts/editor-variaveis.md). Nesta task, só o comportamento base: menu padrão do `FieldVariable` e, quando o campo não tem variável, mostrar `???` em vez de criar a variável `item`. **Como**: sobrescrever `initModel()`, que no `FieldVariable` do 12.5.1 chama `Blockly.Variables.getOrCreateVariablePackage` quando o campo ainda não tem variável; a versão própria só chama `super.initModel()` se o campo já tiver um id de variável (`this.getValue()`), e senão não faz nada; e sobrescrever `getText()` para devolver `'???'` quando não há variável. Antes de sobrescrever, ler `node_modules/blockly/core/field_variable.d.ts` e o trecho de `initModel` em `blockly_compressed.js` para confirmar o nome e o momento da chamada. **Plano B**, se o `initModel` não for o ponto (ou o Blockly lançar ao renderizar um campo sem variável): manter o `initModel` original e, nas definições dos blocos (T024), trocar `variable: null` por `variable: '???'`, apagando a variável `???` criada pelo Blockly logo depois (num listener de `var_create` com esse nome, dentro do mesmo grupo de eventos); registrar a escolha em research R-05. A T025 confere o resultado. O menu próprio entra na T039. Comentário do topo com "fora da cobertura" (FR-001) (RF-02)
- [X] T006 Escrever `tests/unidade/variaveis-blockly.test.js` (Blockly headless, como `bloco-programa.test.js`) que confere o comportamento do `blockly` 12.5.1 descrito em research R-04: (1) em `new Blockly.Workspace()`, criar `a` (inteiro), `nome` (cadeia), `b` (inteiro) com `ws.getVariableMap().createVariable(nome, tipo, id)` → `variaveisDoMapa(ws.getVariableMap().getAllVariables())` dá `a, b, nome`; (2) `changeVariableType` de `a` para `cadeia` → `a` vai para o fim do grupo `cadeia`; (3) `Blockly.serialization.workspaces.load(blocosComVariaveis(projetoVazio().blocos, variaveis), ws)` cria as variáveis na ordem da lista, e um `load` de `projetoVazio().blocos` sem `variables` deixa o mapa vazio; (4) um listener registrado vê `var_create`, `var_rename`, `var_type_change` e `var_delete` com `isUiEvent === false`. Se algum item divergir, parar e atualizar research R-04 e o data-model antes de seguir (depende de T004) (FR-004) (RF-02)
- [X] T007 Em `src/ui/workspace.js`, conforme a tabela "src/ui/workspace.js (alterações)" de [contracts/editor-variaveis.md](contracts/editor-variaveis.md): chamar `registrarCampoVariavel()` em `definirBlocos()` antes do `defineBlocksWithJsonArray`; mudar `criarWorkspace(container, projeto)` e `recarregarBlocos(ws, projeto)` para receber o **projeto** e carregar `blocosComVariaveis(projeto.blocos, projeto.variaveis)` (o `recarregarBlocos` mantém o `ws.clearUndo()`); exportar `variaveisDoWorkspace(ws)` = `variaveisDoMapa(ws.getVariableMap().getAllVariables())`. `serializarBlocos` não muda. Em `src/main.js`: `criarWorkspace(..., projeto)`; `projetoAtual()` = `{ ...projeto, variaveis: variaveisDoWorkspace(ws), blocos: serializarBlocos(ws) }`; no `novoProjeto`, `recarregarBlocos(ws, projeto)`. Atualizar os comentários do topo (depende de T004, T005) (FR-001, FR-004) (RF-02)
- [X] T008 Rodar `npm test` e validar no navegador (`npm run dev`) que nada mudou para o estudante: Portugol do projeto novo igual ao de antes, Novo funciona, Desfazer/Refazer como na 007, console sem erros (depende de T002, T006, T007) (RF-02)

**Checkpoint**: base pronta; as histórias podem começar.

---

## Fase 3: História 1 - Criar uma variável com tipo (Prioridade: P1) 🎯 MVP

**Objetivo**: o estudante cria variáveis com nome e tipo por "Criar variável…"; nomes
inválidos são recusados com a mensagem da regra quebrada; a seção `var` aparece no
Portugol (FR-001 a FR-004).

**Teste independente**: `nome-variavel.test.js`, `caixa-blocos.test.js` e
`variaveis-projeto.test.js` verdes; `nomes-reservados.test.js` e o caso
`variaveis-nomes-limite.json` verdes no Core real; no navegador, passos 1 a 5 e 15 da
seção 2 do [quickstart.md](quickstart.md).

### Testes da História 1

- [X] T009 [P] [US1] Escrever `tests/unidade/nome-variavel.test.js` para `validarNomeVariavel(nome, variaveis, { ignorarId })` com **todos** os "Exemplos normativos" e "Garantias testadas" de [contracts/nome-variavel.md](contracts/nome-variavel.md): uma entrada por linha da tabela de research R-11 conferindo `motivo` e a `mensagem` exata ("Digite um nome para a variável.", "O nome pode ter no máximo 30 caracteres.", "O nome não pode ter espaços. Use _ no lugar, como em minha_idade.", "Use letras sem acento e sem ç.", "Use só letras, números e _ no nome.", "O nome precisa começar com uma letra.", "Este nome é reservado.", "Já existe a variável <nome existente>."); ordem das regras (`"2 lugar"` → `espaco`, `"ação 2"` → `espaco`, `"2ação"` → `acento`); limites (1 letra válido, 30 válido, 31 `longo`); `nome` devolvido sem espaços das pontas; entrada não-`string` (`undefined`, `42`) → `vazio` sem lançar; `TAMANHO_MAXIMO_NOME === 30`; para **cada** nome de `PALAVRAS_PORTUGOL`, `NATIVOS_CORE`, `NOMES_RUNTIME`, `PALAVRAS_PYTHON` e `NATIVOS_PYTHON`, o nome, `toUpperCase()` e com a primeira letra maiúscula dão `reservado`; `NOMES_RESERVADOS` tem só minúsculas e contém todos os grupos; cada grupo contém os nomes listados em research R-02 (itens 1–4) e R-03; `entrada`, `senha`, `MeuPrograma` válidos; duplicado sem diferenciar maiúsculas, com `ignorarId` liberando a própria variável; `variaveis` congelado não lança. Deve falhar até T010 (FR-002, FR-003; História 1, cenário 3; casos de borda) (RF-02)
- [X] T010 [US1] Criar `src/projeto/nome-variavel.js` conforme [contracts/nome-variavel.md](contracts/nome-variavel.md) e o [data-model](data-model.md#regra-do-nome): exportar `TAMANHO_MAXIMO_NOME = 30`, os cinco grupos como arrays congelados com os nomes **exatamente** como em research R-02 (itens 1–4, sem formas acentuadas) e R-03 (35 palavras-chave do Python 3.11 e os nomes de `dir(builtins)` listados), `NOMES_RESERVADOS` (`Set` em minúsculas da união) e `validarNomeVariavel`, que tira os espaços das pontas e verifica na ordem de R-11 parando na primeira regra quebrada; formato válido `/^[A-Za-z][A-Za-z0-9_]{0,29}$/`; acento = qualquer letra Unicode fora de `A–Z a–z` (`/\p{L}/u`). Comentário em cada grupo citando a origem (arquivo do Core 1.4.1 ou `keyword`/`builtins` do Python 3.11). Sem Blockly, sem DOM. Implementar até T009 passar (depende de T009) (FR-002, FR-003) (RF-02)
- [X] T011 [P] [US1] Escrever `tests/aceitacao/nomes-reservados.test.js`: com `criarMotorNode()` de `tests/aceitacao/suporte/motor-node.js` num `beforeAll` (mesmo tempo limite usado em `aceitacao.test.js`), rodar `pyodide.runPython('import keyword, builtins, json; json.dumps(keyword.kwlist + dir(builtins))')`, filtrar os que casam com `/^[A-Za-z]/` e conferir que **todos** estão em `NOMES_RESERVADOS` (comparando em minúsculas). Na falha, a mensagem lista os nomes que faltam. Conferir também que `pyodide.runPython('import sys; sys.version')` começa com `3.11` (se mudar, research R-03 precisa ser revista) (depende de T010) (FR-003, SC-002) (RF-02, RNF-07)
- [X] T012 [P] [US1] Criar `tests/aceitacao/casos/variaveis-nomes-limite.json` (formato de [caso-aceitacao.schema.json](../008-portugol-valido/contracts/caso-aceitacao.schema.json), `requisitos: ["RF-02", "RNF-07"]`, nome do programa `"MeuPrograma"`) só com declarações, sem blocos além do `programa`: `entrada` e `E1` inteiros, `dado_2` e `x` reais, `senha` e `MeuPrograma` cadeia, `Resultado` e um nome de 30 caracteres (`abcdefghijklmnopqrstuvwxyz1234`) lógicos, criados nessa ordem; `portugolEsperado` com a seção `var` exata (uma por linha, agrupada inteiro, real, cadeia, logico); `saidaEsperada: ""`. Conferir antes, com `validarNomeVariavel`, que todos os nomes são válidos (depende de T010) (FR-002, FR-004, SC-001) (RF-02, RNF-07)
- [X] T013 [P] [US1] Em `tests/unidade/variaveis-projeto.test.js`, acrescentar `describe('História 1 …')` com `gerarPortugol`: (1) projeto novo + `idade` inteiro → contém `var\n    idade: inteiro\n\ninicio` (cenário 1); (2) `a` inteiro, `nome` cadeia, `b` inteiro, nessa ordem → bloco `var` exatamente igual ao da spec (`    a: inteiro\n    b: inteiro\n    nome: cadeia`) (cenário 2); (3) sem variáveis → sem a linha `var` (caso de borda). As variáveis entram por `variaveisDoMapa` com modelos falsos, como faz a tela (depende de T004) (FR-001, FR-004) (RF-02)
- [X] T014 [P] [US1] Escrever `tests/unidade/caixa-blocos.test.js`: `CAIXA_BLOCOS.kind === 'categoryToolbox'` com uma categoria `name: 'Variáveis'`, `custom: 'VARIAVEIS'`; `CATEGORIA_VARIAVEIS === 'VARIAVEIS'`, `BOTAO_CRIAR_VARIAVEL === 'CRIAR_VARIAVEL'`; `conteudoCategoriaVariaveis([])` = `[{ kind: 'button', text: 'Criar variável…', callbackKey: 'CRIAR_VARIAVEL' }]`; nesta história, com variáveis o resultado também é só o botão (os blocos entram em T029 e T033); não altera a lista recebida. Deve falhar até T015 (FR-001) (RF-02)

### Implementação da História 1

- [X] T015 [US1] Criar `src/blocos/caixa-blocos.js` exportando `CATEGORIA_VARIAVEIS`, `BOTAO_CRIAR_VARIAVEL`, `CAIXA_BLOCOS` e `conteudoCategoriaVariaveis(variaveis)` conforme a seção "Caixa de blocos" de [contracts/blocos-variaveis.md](contracts/blocos-variaveis.md) (por enquanto só o botão). Comentário do topo dizendo que a 003–006 acrescentam categorias em `CAIXA_BLOCOS.contents`. Sem Blockly. Implementar até T014 passar (depende de T014) (FR-001) (RF-02)
- [X] T016 [P] [US1] Em `tests/unidade/tela-estrutura.test.js`, acrescentar o teste "diálogo de variável" conforme a seção `index.html` de [contracts/editor-variaveis.md](contracts/editor-variaveis.md): existe `<dialog id="dialogo-variavel">` com `#variavel-titulo`, `#variavel-nome` com `maxlength="30"`, `#variavel-tipo` cujos `value` são, em ordem, exatamente `TIPOS_VARIAVEL` (importar de `src/projeto/formato.js`), `#variavel-erro` com `role="alert"`, `#variavel-cancelar` com o texto `Cancelar` e `#variavel-confirmar`; o trecho não tem nenhuma palavra de `PALAVRAS_INGLES`. Deve falhar até T017 (FR-001) (RF-02, RNF-03)
- [X] T017 [US1] Em `index.html`, acrescentar o `<dialog id="dialogo-variavel">` do contrato (textos das opções: `inteiro (número sem vírgula)`, `real (número com vírgula)`, `cadeia (texto)`, `logico (verdadeiro ou falso)`), ao lado do `dialogo-confirmacao`. Em `src/estilos.css`, estilizar reaproveitando as regras do `dialogo-confirmacao` (sem duplicar) e dar ao `#variavel-erro` cor de erro e altura reservada, para o diálogo não pular quando a mensagem aparece. Implementar até T016 passar (depende de T016) (FR-001) (RF-02, RNF-03)
- [X] T018 [US1] Criar `src/ui/dialogo-variavel.js` com `pedirVariavel({ modo, nome, tipo, validar })` conforme a seção `src/ui/dialogo-variavel.js` do contrato, já com os três modos (`criar`, `renomear`, `tipo`) e os títulos e botões da tabela; textos em `src/ui/textos.js` (acrescentar `criarVariavelTitulo`, `criarVariavelBotao`, `renomearVariavelTitulo(nome)`, `renomearVariavelBotao`, `tipoVariavelTitulo(nome)`, `tipoVariavelBotao`; o `TEXTOS` continua congelado, com funções para os textos que levam nome). No envio: chamar `validar(nome)`; se `valido === false`, escrever `mensagem` em `#variavel-erro`, manter aberto e devolver o foco ao nome; no modo `tipo`, não validar nome. Esc, "Cancelar" e fechar resolvem `null`; remover os ouvintes antes de resolver (como `confirmacao.js`). Fora da cobertura (depende de T017) (FR-001, FR-002, FR-003) (RF-02, RNF-03)
- [X] T019 [US1] Criar `src/ui/acoes-variavel.js` com `criarVariavel(ws)`: lê `variaveisDoWorkspace(ws)`, chama `pedirVariavel({ modo: 'criar', validar: (n) => validarNomeVariavel(n, lista) })` e, se não for `null`, `ws.getVariableMap().createVariable(nome, tipo)`. Não chama o gerador (os eventos do workspace já disparam a 007). Fora da cobertura (depende de T007, T010, T018) (FR-001, FR-002, FR-003) (RF-02)
- [X] T020 [US1] Em `src/ui/workspace.js`, injetar com `toolbox: CAIXA_BLOCOS`; registrar `ws.registerToolboxCategoryCallback(CATEGORIA_VARIAVEIS, () => conteudoCategoriaVariaveis(variaveisDoWorkspace(ws)))` e `ws.registerButtonCallback(BOTAO_CRIAR_VARIAVEL, () => criarVariavel(ws))` (research R-05). Conferir que a categoria e o botão aparecem em pt-BR e que o painel Blocos continua redimensionando (o `ResizeObserver` da 001) (depende de T015, T019) (FR-001) (RF-02)
- [X] T021 [US1] Validar no navegador os passos 1 a 5, 15 e 17 da seção 2 do [quickstart.md](quickstart.md) (criar, seção `var` na ordem, recusas com mensagem no diálogo, `MeuPrograma` aceito, Novo zerando as variáveis, textos em pt-BR). Conferir também que criar uma variável e depois Novo pede a confirmação de descartar (a variável conta como alteração). Registrar o resultado para o PR (depende de T020) (FR-001 a FR-004) (RF-02, RNF-03)

**Checkpoint**: História 1 completa e testável sozinha (MVP): variáveis criadas
aparecem declaradas e rodam no Core.

---

## Fase 4: História 2 - Atribuir um valor (Prioridade: P1)

**Objetivo**: bloco "variável recebe valor" gerando `nome <- valor` (FR-005). Como o
único bloco de valor antes da 006 é o da própria variável, o bloco `variavel` (FR-006)
nasce aqui, usado como valor da atribuição; a História 3 completa o uso dele.

**Teste independente**: `blocos-variaveis.test.js` verde; caso
`variaveis-atribuicao.json` verde no Core real com a meta-verificação da 008 achando
`variavel_recebe` e `variavel`; no navegador, passos 6, 7 e 16 do quickstart.

### Testes da História 2

- [X] T022 [P] [US2] Escrever `tests/unidade/blocos-variaveis.test.js` com o registro `criarRegistroTeste()` mais `BLOCO_VARIAVEL_RECEBE` e `BLOCO_VARIAVEL`, conferindo com `gerarPortugol` **cada** linha dos "Exemplos normativos" de [contracts/blocos-variaveis.md](contracts/blocos-variaveis.md), incluindo os avisos exatos ("Falta a variável do bloco recebe", "Falta o valor do bloco recebe", "Falta a variável do bloco variável") e a ordem deles; `idade recebe [teste_numero 15]` → `    idade <- 15` (História 2, cenário 1); `idade recebe [ ]` → `???` e `verificarExecucao(...).permitida === false` (cenário 2). Conferir as entradas do registro: `tipo`, `rotulo` (`recebe` e `variável`), `categoria` (`comando` e `valor`), sem `areas` e sem `variantes`; na `definicao`, o campo `VAR` é `campo_variavel` com `variableTypes` igual a `TIPOS_VARIAVEL`, `VALOR` é `input_value`, o `variavel` tem `output: null`; `gerar` do `variavel` devolve `precedencia: PRECEDENCIA.PRIMARIO`. Deve falhar até T024 (FR-005, FR-006) (RF-02)

### Implementação da História 2

- [X] T023 [P] [US2] Criar `src/portugol/precedencia.js` com `export const PRECEDENCIA = Object.freeze({ PRIMARIO: 100 })` e comentário: maior número liga mais forte; a 006 acrescenta os níveis dos operadores seguindo a escala de 008/R-02 (FR-006) (RF-02)
- [X] T024 [US2] Criar `src/blocos/variaveis.js` exportando `BLOCO_VARIAVEL_RECEBE` e `BLOCO_VARIAVEL` exatamente como em [contracts/blocos-variaveis.md](contracts/blocos-variaveis.md) (mensagens `'%1 recebe %2'` e `'%1'`, `tooltip` em pt-BR, `inputsInline: true`, mesma cor para os dois, `defaultType: 'inteiro'`). `gerar` do `variavel_recebe`: `` ctx.linha(`${ctx.variavel(bloco, 'VAR', 'a variável')} <- ${ctx.valor(bloco, 'VALOR', 'o valor')}`) ``, avaliando a variável antes do valor; `gerar` do `variavel`: `{ codigo: ctx.variavel(bloco, 'VAR', 'a variável'), precedencia: PRECEDENCIA.PRIMARIO }`. Não importar `blockly`. Implementar até T022 passar (depende de T022, T023) (FR-005, FR-006) (RF-02)
- [X] T025 [US2] Em `tests/unidade/variaveis-blockly.test.js`, acrescentar o teste de ida e volta no Blockly headless: `registrarCampoVariavel()`, `defineBlocksWithJsonArray` com as definições do `programa` e dos dois blocos novos, criar `idade` e `b` inteiros, montar pelo API `programa` → `idade recebe [b]`, salvar com `Blockly.serialization.workspaces.save`, apagar `variables` e gerar com `gerarPortugol({ ...projetoVazio(), variaveis: variaveisDoMapa(...), blocos })` → contém `    idade <- b` e nenhum aviso. Conferir que o campo serializa como `{ id }` (o formato que a 008 espera) e que `newBlock('variavel')` sem variável não cria a variável `item` (depende de T005, T024) (FR-005, FR-006) (RF-02)
- [X] T026 [US2] **Num único commit**: em `src/blocos/registro.js`, registrar `BLOCO_VARIAVEL_RECEBE` e `BLOCO_VARIAVEL` no `registroPadrao`, nessa ordem, depois do `programa` (atualizar o comentário "Na 008 só existe o programa"); em `tests/unidade/registro.test.js`, conferir `registroPadrao.tiposRegistrados()` = `['programa', 'variavel_recebe', 'variavel']`; criar `tests/aceitacao/casos/variaveis-atribuicao.json` (`requisitos: ["RF-02", "RNF-07"]`, programa `"Trocas"`; variáveis `a` e `b` inteiros e `nome` cadeia; blocos `a recebe [b]`, `b recebe [a]`, `nome recebe [nome]` encadeados no `programa`; `portugolEsperado` completo; `saidaEsperada: ""`). Rodar `npm test` e confirmar que a meta-verificação acha os dois tipos novos (depende de T024) (FR-005, FR-006, SC-001) (RF-02, RNF-07)
- [X] T027 [US2] Em `src/ui/workspace.js`, nada a mudar para os blocos aparecerem no Blockly (o `definirBlocos` já define tudo do `registroPadrao`); conferir no navegador que o `campo_variavel` está registrado antes da definição (sem erro "Unknown field type" no console). Se a cor dos blocos ficar diferente da categoria, alinhar a `colour` da categoria em `src/blocos/caixa-blocos.js` com a dos blocos (depende de T020, T026) (FR-005) (RF-02)
- [X] T028 [P] [US2] Em `tests/unidade/caixa-blocos.test.js`, trocar a expectativa "com variáveis, só o botão" por: com variáveis, depois do botão vem `{ kind: 'block', type: 'variavel_recebe', fields: { VAR: { id } } }` com o id da **última** variável da lista; com uma variável e com quatro de tipos misturados. Deve falhar até T029 (FR-005) (RF-02)
- [X] T029 [US2] Em `src/blocos/caixa-blocos.js`, acrescentar o bloco `variavel_recebe` da última variável depois do botão (regra 3 de "Caixa de blocos" no contrato, primeira parte). Implementar até T028 passar (depende de T028, T026) (FR-005) (RF-02)
- [X] T030 [US2] Validar no navegador os passos 6, 7 e 16 da seção 2 e os passos A, C e D da seção 3 do [quickstart.md](quickstart.md) (atribuição sem valor com aviso, valor encaixado, SC-003 cronometrado, linha em até 1 s, desfazer, arraste sem soltar). Registrar o resultado para o PR (depende de T027, T029) (FR-005, SC-003) (RF-02, RF-07)

**Checkpoint**: Histórias 1 e 2 funcionam juntas; o editor já monta programas com
atribuições aceitos pelo Core.

---

## Fase 5: História 3 - Usar o valor de uma variável (Prioridade: P2)

**Objetivo**: o bloco de cada variável está à mão na caixa e encaixa em qualquer lugar
que espere um valor (FR-006).

**Teste independente**: casos "História 3" de `blocos-variaveis.test.js` e
`caixa-blocos.test.js` verdes; no navegador, encaixar o bloco de variável em outro
"recebe".

### Testes da História 3

- [X] T031 [P] [US3] Em `tests/unidade/blocos-variaveis.test.js`, acrescentar `describe('História 3 …')`: (1) `teste_escreva [teste_soma [idade] [teste_numero 1]]` → `    escreva(idade + 1)` sem avisos (cenário 1); (2) `variavel` na condição de `teste_se` → `    se idade entao`; (3) `variavel` no valor de `variavel_recebe` de outra variável (`a <- b`) e da própria (`a <- a`); (4) `variavel` com campo sem id dentro de `teste_soma` → `??? + 1` e o aviso "Falta a variável do bloco variável" (FR-006) (RF-02)
- [X] T032 [P] [US3] Em `tests/unidade/caixa-blocos.test.js`, acrescentar: depois do `variavel_recebe`, um `{ kind: 'block', type: 'variavel', fields: { VAR: { id } } }` por variável na **ordem da seção `var`** (agrupada `inteiro`, `real`, `cadeia`, `logico`; ordem de criação dentro do tipo), com quatro variáveis criadas fora dessa ordem. Deve falhar até T033 (FR-006) (RF-02)

### Implementação da História 3

- [X] T033 [US3] Em `src/blocos/caixa-blocos.js`, completar a regra 3 de "Caixa de blocos": um `variavel` por variável na ordem da seção `var`, reaproveitando `TIPOS_VARIAVEL` para agrupar (mesma regra de `gerarSecaoVar`, sem importar o emissor). Implementar até T032 passar (depende de T032, T029) (FR-006) (RF-02)
- [X] T034 [US3] Validar no navegador: com `idade`, `b` (inteiros) e `nome` (cadeia), criadas nessa ordem, a categoria mostra "nome recebe" (a última criada) e os blocos `idade`, `b`, `nome` nessa ordem; encaixar `idade` no valor de "b recebe" → `    b <- idade`. Fazer também os passos 7 (encaixar o bloco `b` no valor de "idade recebe" → `    idade <- b`, o aviso some) e 16 (SC-003: cronometrar do passo 1 até `idade <- b`) da seção 2 do quickstart, que ficaram da T030 por precisarem do bloco de valor na caixa. Registrar o resultado para o PR (depende de T033) (FR-006) (RF-02)

**Checkpoint**: ciclo declarar → guardar → usar completo dentro do que existe antes da
003/006 (o `escreva(idade + 1)` no Core fica para elas; plan, "Pendências").

---

## Fase 6: História 4 - Renomear e apagar variáveis (Prioridade: P3)

**Objetivo**: renomear atualiza declaração e usos; mudar o tipo é permitido; apagar
uma variável em uso pede confirmação com a contagem (FR-007, FR-008).

**Teste independente**: `variaveis-projeto.test.js` (renomear no gerador e
`textoApagar`) e `variaveis-blockly.test.js` (renomear, apagar, desfazer) verdes; no
navegador, passos 8 a 14 do quickstart.

### Testes da História 4

- [X] T035 [P] [US4] Em `tests/unidade/variaveis-projeto.test.js`, acrescentar: (1) `contarBlocosApagados(blocos, id)` conforme "Contagem" do [data-model](data-model.md#contagem): uso solto sem filhos → `{ usos: 1, total: 1 }`; `idade recebe [b]` dentro do `programa` → `{ usos: 1, total: 2 }` (o `b` encaixado conta); `x recebe [idade]` → `{ usos: 1, total: 1 }` (só o `idade`); `idade recebe [idade]` → `{ usos: 2, total: 2 }` (sem contar duas vezes); `idade recebe [b]` seguido de outro comando no `next` → o comando seguinte **não** conta; bloco de teste com área de comandos (`teste_bloco` com `CORPO`) contendo um uso → só o uso; uso com área de comandos contendo uma cadeia de 2 blocos (bloco de teste próprio com campo `VAR` e `CORPO`) → `total` inclui os 2; variável sem uso → `{ usos: 0, total: 0 }`; não altera `blocos` (congelado); (2) `textoApagar('idade', { usos, total })` devolve exatamente os textos da tabela "Mensagem" do [data-model](data-model.md#mensagem) nos quatro casos (`usos 1/total 1`, `usos 3/total 3`, `usos 1/total 3`, `usos 3/total 5`), com `titulo` "Apagar a variável idade?", `confirmar` "Apagar", `cancelar` "Cancelar"; (3) renomear no gerador: projeto com `idade` usada em três blocos (`variavel_recebe` e dois `variavel`), trocar só `variaveis[0].nome` para `anos` → a declaração e os três usos mostram `anos`, e `blocos` não foi tocado (História 4, cenário 1). Deve falhar até T036 (FR-007, FR-008) (RF-02)
- [X] T036 [US4] Em `src/projeto/variaveis.js`, acrescentar `contarBlocosApagados(blocos, idVariavel)` (percorre todos os blocos de topo de `blocos.blocks.blocks`; um bloco é uso se algum valor de `fields` for `{ id: idVariavel }`; para cada uso que não está dentro de outro uso, soma 1 mais todos os blocos alcançáveis pelos `inputs` dele, seguindo os `next` **dentro** dos encaixes, mas não o `next` do próprio uso) e `textoApagar(nome, { usos, total })` com os quatro textos do data-model. Puro, sem Blockly. Implementar até T035 passar (depende de T035) (FR-008) (RF-02)
- [X] T037 [P] [US4] Em `tests/unidade/variaveis-blockly.test.js`, acrescentar (Blockly headless, com os blocos definidos como em T025), conferindo research R-06: (1) `ws.getVariableMap().renameVariable(v, 'anos')` muda o texto dos três campos que usam `idade` e o Portugol gerado; (2) `Blockly.Variables.getVariableUsesById(ws, id).length === 3`; (3) `ws.getVariableMap().deleteVariable(v)` apaga a variável e os três blocos, e o comando seguinte a um "recebe" apagado sobe para o lugar dele; (4) um único `ws.undo(false)` desfaz o apagar inteiro (variável e blocos de volta); (5) `changeVariableType` com a variável em uso mantém os blocos; (6) **contagem igual à do Blockly** (U1): para `idade recebe [b]` + dois `idade` soltos, e para `idade recebe [idade]`, `contarBlocosApagados(serializarBlocos, id).total` é igual a `ws.getAllBlocks(false).length` antes menos depois do `deleteVariable`. Se algum item divergir, parar e atualizar research R-06 antes da T039 (depende de T025) (FR-007, FR-008) (RF-02)

### Implementação da História 4

- [X] T038 [US4] Em `src/ui/acoes-variavel.js`, acrescentar `renomearVariavel(ws, id)` (diálogo `renomear` com o nome atual; `validarNomeVariavel(n, lista, { ignorarId: id })`; aplica com `renameVariable`), `mudarTipoVariavel(ws, id)` (diálogo `tipo` com o tipo atual; aplica com `changeVariableType` se mudou) e `apagarVariavel(ws, id)` (calcula `{ usos, total } = contarBlocosApagados(serializarBlocos(ws), id)`; com `usos === 0` apaga direto; senão `confirmar(textoApagar(nome, { usos, total }))` da 001, que informa o total real de blocos removidos e só apaga se `true`; aplica com `ws.getVariableMap().deleteVariable`). Não usar `Blockly.Variables.deleteVariable` nem `window.confirm`/`window.prompt` (research R-06). Fora da cobertura (depende de T019, T036) (FR-007, FR-008) (RF-02)
- [X] T039 [US4] Em `src/ui/campo-variavel.js`, trocar o menu: sobrescrever a criação das opções para listar as variáveis e, no fim, "Renomear variável…", "Mudar o tipo…" e "Apagar a variável “<nome>”" (textos em `src/ui/textos.js`), e o tratamento da escolha (`onItemSelected_`) para chamar `renomearVariavel`, `mudarTipoVariavel` e `apagarVariavel` com o workspace do bloco e o id da variável do campo. Nenhum item em inglês (o `RENAME_VARIABLE`/`DELETE_VARIABLE` do pacote pt-br não é usado) (depende de T038) (FR-007, FR-008) (RF-02, RNF-03)
- [X] T040 [US4] Validar no navegador os passos 8 a 14 da seção 2 do [quickstart.md](quickstart.md) (renomear em três usos, só maiúsculas, mudar o tipo, apagar com Cancelar e com confirmar, Ctrl+Z, apagar sem uso). Registrar o resultado para o PR (depende de T039) (FR-007, FR-008) (RF-02)

**Checkpoint**: todas as histórias completas.

---

## Fase 7: Acabamento

- [X] T041 [P] Criar `tests/aceitacao/casos/variaveis-bloco-solto.json` (pendência da 007; research R-08, R-10): variáveis `a` e `b` inteiros; `a recebe [b]` dentro do `programa` e `b recebe [a]` solto fora dele (bloco de topo com `x`/`y`); `portugolEsperado` só com `    a <- b`; `saidaEsperada: ""`; `requisitos: ["RF-02", "RF-07", "RNF-07"]` (depende de T026) (RF-02, RF-07)
- [X] T042 Validar no navegador os passos E a J da seção 3 do [quickstart.md](quickstart.md) com o bloco "recebe" (bloco solto e aviso de fora do programa, pilha de 3, rolagem mantida com ~60 atribuições, ~100 blocos, "recebe" incompleto solto). O passo B fica para a 006. Registrar o resultado para o PR (depende de T030) (RF-02, RF-07)
- [X] T043 [P] Atualizar a documentação das outras specs: em `specs/007-portugol-tempo-real/contracts/editor.md`, linha da 002 em "Ganchos para outras specs", dizer que as ações de variável disparam a atualização pelos eventos do workspace (research R-10) e que `recarregarBlocos` agora recebe o projeto; em `specs/001-tela-tres-paineis/contracts/tela.md`, citar o `dialogo-variavel` e a caixa de blocos com link para `specs/002-blocos-variaveis/contracts/editor-variaveis.md`. Commit `docs(002) (RF-02): …` (RF-02)
- [X] T044 Rodar `npm test` (unidade + aceitação no Core real) e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/projeto/nome-variavel.js`, `src/projeto/variaveis.js`, `src/blocos/variaveis.js`, `src/blocos/caixa-blocos.js` e `src/portugol/precedencia.js` no relatório; versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 3 a 6 e de T041) (RNF-04)
- [X] T045 Percorrer a seção 2 do [quickstart.md](quickstart.md) inteira de novo, numa aba nova, conferindo que nenhum texto novo está em outro idioma (diálogo, menu do campo, categoria, botão, *tooltips*). Registrar no PR o que foi verificado e as pendências para a 003 e a 006 do [plan.md](plan.md) (depende de T044) (FR-001..FR-009) (RF-02, RNF-03)

---

## Dependências e ordem

### Entre fases

- **Setup (1)** → **Fundação (2)** → histórias.
- **US1 (3)** vem primeiro: a caixa de blocos, o diálogo e a criação de variáveis são
  usados pelas outras.
- **US2 (4)** depende de US1 (T020: caixa de blocos; T019: criar variável).
- **US3 (5)** depende de US2 (blocos registrados em T026; caixa em T029).
- **US4 (6)** depende de US2 (blocos para ter usos; T025) e de US1 (T019: `acoes-variavel.js`). Pode correr em paralelo com US3.
- **Acabamento (7)**: T041 depende de T026; T044/T045 fecham tudo.

### Dentro de cada história

Testes primeiro (falhando), depois o núcleo, depois a interface, por último a
validação no navegador.

### Oportunidades de paralelismo

- Fundação: T002 e T003 juntos; T005 em paralelo com T003/T004.
- US1: T009, T013, T014 e T016 juntos (arquivos diferentes); depois de T010, T011 e
  T012 juntos.
- US2: T022 e T023 juntos; T028 em paralelo com T025.
- US3 e US4: T031/T032 em paralelo com T035/T037.
- Acabamento: T041 e T043 juntos.

### Exemplo: História 1

```text
Juntas:  T009 nome-variavel.test.js | T013 variaveis-projeto (História 1) | T014 caixa-blocos.test.js | T016 tela-estrutura
Depois:  T010 nome-variavel.js | T015 caixa-blocos.js | T017 index.html
Juntas:  T011 nomes-reservados (Pyodide) | T012 caso variaveis-nomes-limite
Depois:  T018 diálogo → T019 criarVariavel → T020 toolbox → T021 navegador
```

### Exemplo: História 2

```text
Juntas:  T022 blocos-variaveis.test.js | T023 precedencia.js
Depois:  T024 blocos/variaveis.js → T026 registro + caso de aceitação (mesmo commit)
Juntas:  T025 ida e volta no Blockly | T028 teste da caixa
Depois:  T029 caixa → T027 conferir no navegador → T030 navegador
```

## Estratégia de implementação

### MVP (só a História 1)

Fases 1 e 2, depois a Fase 3. Para e valida: o estudante cria variáveis válidas, vê a
seção `var` e o programa roda no Core; nomes inválidos são recusados. Já fecha SC-001
e SC-002.

### Entrega incremental

1. MVP (US1) → PR parcial possível.
2. + US2 → atribuições; SC-003 medido.
3. + US3 → blocos de variável na caixa.
4. + US4 → renomear, mudar o tipo, apagar.
5. Acabamento → pendências da 007, cobertura, README.

### Pendências para as specs 003 e 006

Registradas no [plan.md](plan.md) (research R-08). Não são tasks desta spec:

- **006**: caso de aceitação `idade <- 15`; `check` de saída do bloco `variavel`
  conforme o tipo; passo B do quickstart da 007.
- **003**: caso de aceitação `escreva(idade + 1)` → `16` (também depende da 006); caso
  que escreve as quatro variáveis sem atribuir, para conferir o valor inicial no Core;
  `leia` com o `campo_variavel`.
