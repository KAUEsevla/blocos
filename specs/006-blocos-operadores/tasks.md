---

description: "Tasks da spec 006: Blocos de operadores e valores"
---

# Tasks: Blocos de operadores e valores

**Entrada**: documentos de design em `specs/006-blocos-operadores/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). Cada módulo novo do núcleo
(`src/blocos/tipos.js`, `comparacoes.js`, `logica.js`) e cada bloco novo têm testes de
unidade escritos antes da implementação. O verificador de encaixe e o "soltar antes de
mudar" são conferidos no Blockly headless. A ligação com o DOM é verificada no navegador
pelo [quickstart.md](quickstart.md).

**Organização**: uma fase por história da spec, na ordem de prioridade: História 1
(contas, P1), História 2 (comparar, P1), História 4 (valores fixos, P1), História 3
(combinar condições, P2). Os tipos dos encaixes (SC-002) começam na Fundação (regras puras,
`check` dos blocos da 003 e das variáveis) e fecham numa fase própria depois das histórias
(mudar o tipo e trocar a variável sem quebrar encaixes).

**Blocos da 003**: `numero`, `texto` e `aritmetico` **não são recriados**. Só ganham
`check` (T008, T009); `type`, campos, opções do menu, `gerar` e variantes ficam iguais
(research R-01, [contrato](contracts/blocos-operadores.md#blocos-da-003-o-que-muda)).

**Rastreabilidade (constituição v1.2.0, princípio III)**: cada task cita o requisito entre
parênteses no fim. Commits `006/Txxx (RF-06): …`; as tasks da pendência P-1 da 002 usam
`006/Txxx (RF-02): …`. Tasks só de documentação usam `docs(006) (RF-06): …` (ou
`docs(002)`, `docs(003)`, `docs(004)`, `docs(005)`, `docs(008)` quando o arquivo é de outra spec).

**Regra da meta-verificação (008)**: a suíte de aceitação exige que todo par (tipo,
variante) do `registroPadrao` apareça num caso. Por isso cada task que registra um bloco
traz, **no mesmo commit**, os casos de aceitação que cobrem todas as variantes dele. A partir
da T010, todo caso também precisa respeitar os tipos dos encaixes.

**Pendências obrigatórias da 002** (research R-01): **P-1** caso no Core real com
`idade <- 15` (T011); **P-2** onde o bloco de variável encaixa conforme o tipo (T004–T010,
T012, T013, T033–T036); **P-3** passo B da 007 (passo F do quickstart: T036 (navegador) e T037 (documentos)).

**Formato dos casos de aceitação**: como `tests/aceitacao/casos/escreva-conta-idade.json`
(`descricao`, `requisitos`, `projeto` com `formato: "meupia-blocos"`, `versao: 1`, `nome`,
`variaveis` com `id`/`nome`/`tipo`, `blocos` com o `programa` de `id: "programa"`,
`entrada`, `portugolEsperado`, `saidaEsperada`). A seção `var` sai agrupada por tipo na
ordem `inteiro`, `real`, `cadeia`, `logico` (`gerarSecaoVar`); escrever o
`portugolEsperado` à mão nessa ordem.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]** contas, **[US2]** comparar, **[US3]** combinar condições, **[US4]** valores fixos
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: confirmar que a base herdada está verde antes de mexer.

- [X] T001 Na branch `006-blocos-operadores`, rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-06)

---

## Fase 2: Fundação (bloqueia as histórias)

**Objetivo**: a escala de precedência completa (R-03), as regras de tipo puras (R-08,
R-09), a chave `tipoPelaVariavel` no registro, os `check` dos blocos existentes, o
verificador de encaixe e a pendência P-1. Nenhum texto de Portugol atual muda.

### Precedência

- [X] T002 [P] Criar `tests/unidade/blocos-operadores.test.js` com um `describe('escala de precedência')`: `PRECEDENCIA` congelado e exatamente igual a `{ OU: 10, E: 20, NAO: 30, RELACIONAL: 40, ADITIVO: 50, MULTIPLICATIVO: 60, UNARIO: 70, PRIMARIO: 100 }`; os valores da 003 (`ADITIVO`, `MULTIPLICATIVO`, `PRIMARIO`) não mudam. Deve falhar até T003 (R-03) (RF-06)
- [X] T003 Em `src/portugol/precedencia.js`, acrescentar `OU: 10`, `E: 20`, `NAO: 30`, `RELACIONAL: 40` e `UNARIO: 70`, mantendo os três níveis atuais, e reescrever o comentário do topo com a escala inteira (`ou < e < nao < relacional < + - < * / % < - unário < primário`, 008/R-02) e a regra "relacional não associativo; `nao` e `negativo` pedem `PRIMARIO` do operando" (research R-03 da 006). `npm run test:unidade` inteiro verde (depende de T002) (RF-06)

### Regras de tipo (núcleo)

- [X] T004 [P] Criar `tests/unidade/tipos.test.js` conforme [contracts/tipos-encaixe.md](contracts/tipos-encaixe.md), com entradas de registro montadas no próprio teste (os blocos novos ainda não existem): (1) `TIPO_VALOR` congelado = `{ NUMERO: 'Numero', TEXTO: 'Texto', LOGICO: 'Logico' }`; (2) `checkDoTipoVariavel`: `'inteiro'` e `'real'` → `['Numero']`, `'cadeia'` → `['Texto']`, `'logico'` → `['Logico']`, `undefined`, `''`, `'vetor'` → `null`; (3) `compativeis`: `null` de qualquer lado → `true`; `['Numero']` × `['Numero','Texto']` → `true`; `['Logico']` × `['Numero','Texto']` → `false`; `['Numero']` × `['Logico']` → `false`; (4) `checkEfetivo`: saída com `definicao.output: null` → `null`; `output: 'Numero'` (string) → `['Numero']`; `output: ['Numero','Texto']` → a lista; encaixe com `check` no `input_value` → a lista; encaixe sem `check` → `null`; nome de encaixe inexistente → `null`; entrada `undefined` (bloco desconhecido) → `null`; entrada com `tipoPelaVariavel: 'saida'` e `tipoVariavel` `'logico'` → `['Logico']`, com `tipoVariavel` `undefined` → `null`; entrada com `tipoPelaVariavel: 'VALOR'` → o tipo da variável só no ponto `'VALOR'`; (5) `encaixesIncompativeis(estado, registro, tipos)`: lista vazia para estado sem blocos, `undefined` ou sem `blocks`; acha um par num encaixe direto, num encaixe aninhado (filho do filho), num comando ligado por `next` e num bloco solto de topo (fora do `programa`); devolve `{ pai, encaixe, filho }` com os ids, na ordem da visita; aceita `tipos` como objeto ou `Map`; ignora `inputs.X.shadow`; bloco de `type` não registrado vale `null` dos dois lados. Deve falhar até T005 (R-08, R-09) (RF-06)
- [X] T005 Criar `src/blocos/tipos.js` (puro, sem Blockly) com `TIPO_VALOR`, `checkDoTipoVariavel(tipo)`, `compativeis(checkA, checkB)`, `checkEfetivo(entradaRegistro, ponto, tipoVariavel)` e `encaixesIncompativeis(estado, registro, tipos)` exatamente como em [contracts/tipos-encaixe.md](contracts/tipos-encaixe.md). `encaixesIncompativeis` percorre `estado.blocks` (todos os blocos de topo), seus `inputs[*].block` e `next.block`, com `tipoDe(b) = tipos[b.fields?.VAR?.id]` (ou `tipos.get(...)` se for `Map`). Comentário do topo citando RF-06, SC-002 e research R-08 a R-10. Implementar até T004 passar (depende de T004) (RF-06)
- [X] T006 [P] Em `tests/unidade/registro.test.js`, acrescentar um `describe('tipoPelaVariavel')`: (1) entrada sem a chave continua válida e `obter(tipo).tipoPelaVariavel` é `undefined`; (2) `tipoPelaVariavel: 'saida'` aceito num bloco com campo `VAR` nos `args0`; (3) `'VALOR'` aceito quando `args0` tem `{ type: 'input_value', name: 'VALOR' }` e campo `VAR`; (4) erro ao registrar com `'OUTRO'` (não é `'saida'` nem um `input_value`), com `42`, ou num bloco sem campo `VAR`, com mensagens que citem o bloco (ex.: `tipoPelaVariavel inválido no bloco "x"`). Deve falhar até T007 (R-09) (RF-06)
- [X] T007 Em `src/blocos/registro.js`, validar a chave opcional `tipoPelaVariavel` em `validar()` conforme T006: valor `'saida'` ou o `name` de um `input_value` de `definicao.args0`, e exige um item de `args0` com `name: 'VAR'`. Atualizar o comentário do topo. Implementar até T006 passar (depende de T006) (RF-06)

### `check` dos blocos existentes

- [X] T008 [P] Em `tests/unidade/blocos-valores-contas.test.js`, acrescentar um `describe('tipos (006)')`: `BLOCO_NUMERO.definicao.output` = `['Numero']`; `BLOCO_TEXTO.definicao.output` = `['Texto']`; `BLOCO_ARITMETICO.definicao.output` = `['Numero', 'Texto']` e os `input_value` `A` e `B` com `check: ['Numero', 'Texto']`; nenhum outro item da definição muda (comparar `type`, `message0`, as opções do `OP`, `tooltip`, os nomes das variantes com os valores da 003). Em `tests/unidade/blocos-variaveis.test.js`, acrescentar: `BLOCO_VARIAVEL.tipoPelaVariavel === 'saida'`, `BLOCO_VARIAVEL_RECEBE.tipoPelaVariavel === 'VALOR'`, `output: null` do `variavel` e `VALOR` sem `check` na definição (o tipo vem da variável). Todos os testes atuais desses dois arquivos continuam passando sem mudança. Deve falhar até T009 (R-08, R-09) (RF-06)
- [X] T009 Em `src/blocos/valores.js`, trocar `output: null` por `output: ['Numero']` no `numero` e `output: ['Texto']` no `texto`; em `src/blocos/contas.js`, `check: ['Numero', 'Texto']` nos `input_value` `A` e `B` e `output: ['Numero', 'Texto']` no `aritmetico`, e trocar no comentário do topo "Sem check de tipos: são da 006" por uma referência ao research R-08 da 006; em `src/blocos/variaveis.js`, acrescentar `tipoPelaVariavel: 'saida'` ao `BLOCO_VARIAVEL` e `tipoPelaVariavel: 'VALOR'` ao `BLOCO_VARIAVEL_RECEBE`, com uma linha de comentário citando a pendência P-2 da 002. Nada mais muda nesses blocos. `npm test` inteiro verde (depende de T007, T008) (RF-06)

### Aceitação e pendência P-1

- [X] T010 Em `tests/aceitacao/aceitacao.test.js`, no `describe('meta-aceitação')`, acrescentar o teste "todo caso respeita os tipos dos encaixes (SC-002 da 006)": para cada caso, `encaixesIncompativeis(caso.projeto.blocos.blocks, registroPadrao, Object.fromEntries(caso.projeto.variaveis.map((v) => [v.id, v.tipo])))` deve ser `[]`; a mensagem de falha lista `arquivo: pai.encaixe ← filho`. Rodar `npm run test:aceitacao` verde com os casos atuais (se algum caso da 002/003 falhar, parar: o caso não é montável no editor e o research R-08 precisa ser revisto) (depende de T005, T009) (RF-06)
- [X] T011 [P] **P-1**: criar `tests/aceitacao/casos/recebe-idade-quinze.json`, `nome: "Idade"`, variável `idade` (inteiro, `id: "v-idade"`); `idade recebe [numero 15]` e `escreva([variavel idade])` → `portugolEsperado` `algoritmo "Idade"\n\nvar\n    idade: inteiro\n\ninicio\n    idade <- 15\n    escreva(idade)\nfim_algoritmo\n` e `saidaEsperada: "15\n"`; `descricao` citando a História 2, cenário 1 da spec 002 e a pendência do plan da 002; `requisitos: ["RF-02", "RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (R-11) (RF-02)

### Verificador de encaixe (interface, fora da cobertura)

- [X] T012 Criar `src/ui/verificador-encaixe.js` conforme "Verificador de encaixe `meupia`" de [contracts/editor-operadores.md](contracts/editor-operadores.md#verificador-de-encaixe-meupia): `NOME_VERIFICADOR = 'meupia'`, `class VerificadorEncaixe extends Blockly.ConnectionChecker` com `doTypeChecks(a, b)` que, para conexões de valor, identifica a saída (`Blockly.ConnectionType.OUTPUT_VALUE`) e o encaixe (`INPUT_VALUE`), monta o `check` efetivo de cada lado com `checkEfetivo(registroPadrao.obter(bloco.type), ponto, bloco.getField('VAR')?.getVariable?.()?.getType())` (`ponto` = `'saida'` ou `conexao.getParentInput()?.name`) e devolve `compativeis(...)`; conexões de comando seguem `super.doTypeChecks(a, b)`. `registrarVerificadorEncaixe()` idempotente com `Blockly.registry.register(Blockly.registry.Type.CONNECTION_CHECKER, NOME_VERIFICADOR, VerificadorEncaixe)`. Em `src/ui/workspace.js`, chamar `registrarVerificadorEncaixe()` em `definirBlocos()` e passar `plugins: { connectionChecker: NOME_VERIFICADOR }` no `Blockly.inject`. Antes de escrever, conferir em `node_modules/blockly/core/connection_checker.d.ts`, `registry.d.ts` e `connection.d.ts` os nomes do 12.5.1 e ajustar. Comentário do topo com "fora da cobertura" e research R-09 (depende de T005, T009) (RF-06)
- [X] T013 Criar `tests/unidade/operadores-blockly.test.js` (Blockly headless; `beforeAll` com `registrarCampoVariavel()`, `registrarMutadorEscreva()`, `registrarValidadorNumero()`, `registrarVerificadorEncaixe()` e as definições do `registroPadrao`; workspace `new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }))`, conferindo que `ws.connectionChecker` é um `VerificadorEncaixe`; **plano B**: se o workspace headless não ligar o verificador pelas opções, atribuir `ws.connectionChecker = new VerificadorEncaixe(ws)` só no teste e registrar a diferença no research R-09, na mesma task): (1) variável `ok` (logico) num `variavel` **não** encaixa no `A` de um `aritmetico` (`ws.connectionChecker.canConnect(saida, encaixe, false)` = `false`); `idade` (inteiro) encaixa; (2) `texto` não encaixa no `VALOR` de `idade recebe`; `numero` não encaixa no `VALOR` de `nome recebe` (cadeia); `numero` encaixa no `VALOR` de `idade recebe`; (3) `variavel` sem variável encaixa em qualquer um desses; (4) **todos** os arquivos de `tests/aceitacao/casos/*.json` carregam com `Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws)` sem lançar (nenhum `BadConnectionCheck`), e a quantidade de blocos de topo é a do JSON (nenhum bloco saiu do encaixe). Se algum item divergir do research R-09, parar e atualizar o research antes de seguir (depende de T012, T011) (RF-06)
- [X] T014 [P] Em `specs/008-portugol-valido/contracts/registro-blocos.md`, na tabela da entrada do registro, acrescentar a linha `tipoPelaVariavel` (opcional; `'saida'` ou o nome de um `input_value`; o tipo daquele ponto vem da variável do campo `VAR`) e uma nota de que os `check` das definições seguem [specs/006-blocos-operadores/contracts/tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md) e não entram no gerador. Commit `docs(008) (RF-06): …` (RF-06)

**Checkpoint**: tipos e precedência prontos; os blocos da 003 e da 002 já recusam encaixes
errados; P-1 fechada. As histórias podem começar.

---

## Fase 3: História 1 - Fazer contas (Prioridade: P1) 🎯 MVP

**Objetivo**: o negativo (`-x`) completa as contas da 003; a média `(nota1 + nota2) / 2` e
`7 / 2` rodam no Core (FR-001, FR-005).

**Teste independente**: parte `negativo` de `blocos-operadores.test.js` verde; caso
`operadores-media` verde no Core real; no navegador, passo B do quickstart.

- [X] T015 [P] [US1] Em `tests/unidade/blocos-operadores.test.js`, `describe('negativo')` com um registro próprio (`criarRegistro()` + `BLOCO_PROGRAMA`, `BLOCO_NUMERO`, `BLOCO_ARITMETICO`, `BLOCO_VARIAVEL`, `BLOCO_NEGATIVO`, `BLOCO_ESCREVA`; montar com o auxiliar de `tests/auxiliares/blocos-teste.js` como em `blocos-valores-contas.test.js`): as linhas de "Exemplos de geração" de [contracts/blocos-operadores.md](contracts/blocos-operadores.md#exemplos-de-geração-testes-de-unidade) que usam `negativo` — `-x`, `-3`, `-(2 + 3)`, `-(-x)`, `-(2 + 3) * 4`, `2 - -3` — e `div(soma(nota1, nota2), 2)` → `(nota1 + nota2) / 2` (História 1, cenário 1); `X` vazio → `-???` + aviso "Falta o valor do bloco negativo"; `gerar` devolve `precedencia: PRECEDENCIA.UNARIO`; a definição tem `type: 'negativo'`, `message0: '−%1'` (U+2212), `input_value X` com `check: ['Numero']`, `inputsInline: true`, `output: ['Numero']`, `colour: COR_CONTAS` e a *tooltip* exata "O valor com o sinal trocado, como −5"; `rotulo: 'negativo'`, `categoria: 'valor'`, sem variantes. Deve falhar até T016 (R-04) (RF-06)
- [X] T016 [US1] Em `src/blocos/contas.js`, acrescentar `BLOCO_NEGATIVO` conforme [contracts/blocos-operadores.md](contracts/blocos-operadores.md#bloco_negativo-contasjs): `gerar` = `` { codigo: `-${ctx.valor(bloco, 'X', 'o valor', PRECEDENCIA.PRIMARIO)}`, precedencia: PRECEDENCIA.UNARIO } ``. Sem mexer no `BLOCO_ARITMETICO` além do que T009 fez. Implementar até T015 passar (depende de T003, T009, T015) (RF-06)
- [X] T017 [US1] Registrar `BLOCO_NEGATIVO` no `registroPadrao` (depois do `aritmetico`) e atualizar `tests/unidade/registro.test.js`. No mesmo commit, `tests/aceitacao/casos/operadores-media.json` (`nome: "Media"`): `nota1`, `nota2` (inteiro); `nota1 <- 7`; `nota2 <- 8`; `escreva((nota1 + nota2) / 2)`; `escreva(7 / 2)`; `escreva(-nota1)`; `escreva(-(nota1 + nota2))`; `escreva(2 - -3)` → `saidaEsperada: "7.5\n3.5\n-7\n-15\n5\n"`; `portugolEsperado` com exatamente esses parênteses; `descricao` citando a História 1 (teste independente e cenários 1 e 2); `requisitos: ["RF-06", "RNF-07"]`. No mesmo commit, `tests/aceitacao/casos/divisao-por-zero.json` (`nome: "DivisaoZero"`, sem variáveis): `escreva(1 / 0)` → `portugolEsperado` com `    escreva(1 / 0)`, `saidaEsperada: ""` e `statusEsperado: "erro_execucao"`; `descricao` citando o caso de borda "divisão por zero não é bloqueada no editor; o Core informa o erro na execução" (research R-02, R-11); `requisitos: ["RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde, inclusive a meta-aceitação de tipos (depende de T010, T016) (RF-06)
- [X] T018 [P] [US1] Em `tests/unidade/caixa-blocos.test.js`, atualizar o teste das categorias: "Contas" tem, em ordem, `{ kind: 'block', type: 'aritmetico', fields: { OP: '+' } }` e `{ kind: 'block', type: 'negativo' }`. Deve falhar até T019 (R-12) (RF-06)
- [X] T019 [US1] Em `src/blocos/caixa-blocos.js`, acrescentar `{ kind: 'block', type: 'negativo' }` ao fim de "Contas" e atualizar o comentário do topo (a 006 trouxe os blocos dela). Implementar até T018 passar (depende de T017, T018) (RF-06)

**Checkpoint**: História 1 completa; FR-001 inteiro (com o negativo) roda no Core.

---

## Fase 4: História 2 - Comparar valores (Prioridade: P1)

**Objetivo**: o bloco de comparação com `=`, `≠`, `<`, `>`, `≤`, `≥`, gerando `= <> < > <= >=`,
com resultado lógico (FR-002, FR-008).

**Teste independente**: parte `relacional` de `blocos-operadores.test.js` verde; caso
`operadores-comparacao` verde no Core real; no navegador, passos C e H do quickstart.

- [X] T020 [P] [US2] Em `tests/unidade/blocos-operadores.test.js`, `describe('relacional')` (registro próprio com os blocos da 003, `BLOCO_VARIAVEL`, `BLOCO_ESCREVA` e `BLOCO_RELACIONAL`; o `logico` ainda não existe, então usar uma variável lógica `ok` no lugar de `verdadeiro`): `idade >= 18`, `a <> b`, uma linha por operador (os seis símbolos), `relacional(=, relacional(<, 1, 2), variavel ok)` → `(1 < 2) = ok`, `relacional(=, soma(1, 1), 2)` → `1 + 1 = 2`; `A` vazio → `??? < 1` + aviso "Falta o primeiro valor do bloco comparação" (e "Falta o segundo valor do bloco comparação" com `B` vazio); `OP: '=='` → `???` + "Escolha a comparação do bloco comparação"; precedência devolvida `PRECEDENCIA.RELACIONAL`; `OPERADORES_RELACIONAIS` congelado com as seis chaves; a definição tem o `field_dropdown OP` com exatamente `[['=','='],['≠','<>'],['<','<'],['>','>'],['≤','<='],['≥','>=']]`, `A` e `B` **sem** `check`, `output: ['Logico']`, `inputsInline: true`, `colour: COR_COMPARACOES` (`260`) e a *tooltip* exata "Compara os dois valores. O resultado é verdadeiro ou falso"; `rotulo: 'comparação'`; `variantesDe` com os nomes `=`, `<>`, `<`, `>`, `<=`, `>=`. Deve falhar até T021 (FR-002, FR-008; research R-05) (RF-06)
- [X] T021 [US2] Criar `src/blocos/comparacoes.js` com `COR_COMPARACOES = 260`, `OPERADORES_RELACIONAIS` e `BLOCO_RELACIONAL` conforme [contracts/blocos-operadores.md](contracts/blocos-operadores.md#bloco_relacional-comparacoesjs): os dois lados pedem `PRECEDENCIA.RELACIONAL + 1`. Sem Blockly, sem DOM; comentário do topo citando RF-06 e research R-05 (relacional não associativo no Core, R-02). Implementar até T020 passar (depende de T003, T020) (RF-06)
- [X] T022 [US2] Registrar `BLOCO_RELACIONAL` no `registroPadrao` e atualizar `tests/unidade/registro.test.js`. No mesmo commit, `tests/aceitacao/casos/operadores-comparacao.json` (`nome: "Comparacao"`): `idade` (inteiro), `maior` (logico); `idade <- 18`; seis `escreva(idade OP 18)` na ordem `=`, `<>`, `<`, `>`, `<=`, `>=`; `maior <- idade >= 18`; `escreva(maior)`; `escreva("Ana" = "Ana")` → `saidaEsperada: "verdadeiro\nfalso\nfalso\nfalso\nverdadeiro\nverdadeiro\nverdadeiro\nverdadeiro\n"`; `descricao` citando a História 2 (cenários 1 e 2) e o relacional no `recebe` de variável lógica; `requisitos: ["RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (depende de T010, T021) (FR-002; História 2) (RF-06)
- [X] T023 [US2] Em `tests/unidade/caixa-blocos.test.js`, esperar a categoria "Comparações" (`colour: COR_COMPARACOES`, conteúdo `[{ kind: 'block', type: 'relacional', fields: { OP: '=' } }]`) logo depois de "Contas"; em `src/blocos/caixa-blocos.js`, acrescentá-la (importando `COR_COMPARACOES` de `comparacoes.js`). Teste primeiro, falhando, depois a mudança (depende de T019, T022) (R-12) (RF-06)

**Checkpoint**: Histórias 1 e 2 completas.

---

## Fase 5: História 4 - Valores fixos (Prioridade: P1)

**Objetivo**: o valor fixo lógico `verdadeiro`/`falso`; número e texto (da 003) conferidos
nos cenários desta spec (FR-004, FR-006, FR-007).

**Teste independente**: parte `logico` de `blocos-operadores.test.js` verde; caso
`valores-fixos` verde no Core real; no navegador, passo E do quickstart.

- [X] T024 [P] [US4] Em `tests/unidade/blocos-operadores.test.js`, `describe('valor fixo lógico')`: `logico` com `VALOR: 'verdadeiro'` gera `verdadeiro` e com `'falso'` gera `falso`, ambos com `PRECEDENCIA.PRIMARIO`; `VALOR: 'VERDADEIRO'`, `'sim'` ou campo ausente → `???` + aviso "Escolha verdadeiro ou falso no bloco lógico"; a definição tem `type: 'logico'`, `message0: '%1'`, `field_dropdown VALOR` com exatamente `[['verdadeiro','verdadeiro'],['falso','falso']]`, `output: ['Logico']`, `colour: COR_VALORES` e a *tooltip* exata "Um valor lógico: verdadeiro ou falso"; `rotulo: 'lógico'`; variantes `verdadeiro` e `falso` pelo campo `VALOR`. Acrescentar também os cenários da História 4 com os blocos da 003: `texto` `Olá` gera `"Olá"` e `numero` com `NUM: '3,5'` gera `3.5`. Deve falhar até T025 (FR-004; research R-07) (RF-06)
- [X] T025 [US4] Em `src/blocos/valores.js`, acrescentar `BLOCO_LOGICO` conforme [contracts/blocos-operadores.md](contracts/blocos-operadores.md#bloco_logico-valoresjs), com uma linha de comentário citando a lacuna do Core do research R-13 (só minúsculas são reconhecidas). Implementar até T024 passar (depende de T003, T024) (RF-06)
- [X] T026 [US4] Registrar `BLOCO_LOGICO` no `registroPadrao` (depois do `numero`) e atualizar `tests/unidade/registro.test.js`. No mesmo commit, `tests/aceitacao/casos/valores-fixos.json` (`nome: "Valores"`): `ok` (logico); `ok <- verdadeiro`; `escreva(ok)`; `escreva(falso)`; `escreva("Olá")`; `escreva(3.5)` com o `numero` guardado como `NUM: "3,5"` (como digitado; prova o FR-006 no gerador) → `portugolEsperado` com `    escreva(3.5)` e `saidaEsperada: "verdadeiro\nfalso\nOlá\n3.5\n"`; `descricao` citando a História 4 (cenários 1 e 2); `requisitos: ["RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (depende de T010, T025) (FR-004, FR-006, FR-007; História 4) (RF-06)
- [X] T027 [US4] Em `tests/unidade/caixa-blocos.test.js`, esperar "Valores" com `numero`, `texto` e `{ kind: 'block', type: 'logico', fields: { VALOR: 'verdadeiro' } }`, nessa ordem; em `src/blocos/caixa-blocos.js`, acrescentar o item. Teste primeiro, falhando, depois a mudança (depende de T023, T026) (R-12) (RF-06)

**Checkpoint**: Histórias 1, 2 e 4 completas (todas as P1).

---

## Fase 6: História 3 - Combinar condições (Prioridade: P2)

**Objetivo**: `e`, `ou` e `não`, só com valores lógicos, com os parênteses que preservam o
sentido dos blocos (FR-003, FR-005), e o SC-001 com expressões em que parênteses errados
mudariam o resultado.

**Teste independente**: parte `e_ou`/`nao` de `blocos-operadores.test.js` verde; casos
`operadores-logicos` e `expressoes-estrutura` verdes no Core real; no navegador, passo D do
quickstart.

- [X] T028 [P] [US3] Em `tests/unidade/blocos-operadores.test.js`, `describe('e/ou e não')` (registro com os blocos da 003, `BLOCO_VARIAVEL`, `BLOCO_ESCREVA`, `BLOCO_RELACIONAL`, `BLOCO_LOGICO`, `BLOCO_E_OU`, `BLOCO_NAO`): as linhas de "Exemplos de geração" de [contracts/blocos-operadores.md](contracts/blocos-operadores.md#exemplos-de-geração-testes-de-unidade) com `nao`/`e_ou` — `nao (x > 10)`, `nao ok`, `nao (nao ok)`, `(a ou b) e c`, `a ou b e c`, `a e (b e c)`, `a e nao b`, `(nao a) = falso`; `nao` com `X` vazio → `nao ???` + "Falta o valor do bloco não"; `e_ou` com `A` vazio → "Falta o primeiro valor do bloco e/ou"; `OP: 'xou'` → `???` + "Escolha e ou ou no bloco e/ou"; precedências devolvidas `E`, `OU` e `NAO`; `OPERADORES_LOGICOS` congelado com `e` e `ou`; definições: `e_ou` com `A`/`B` `check: ['Logico']`, `field_dropdown OP` `[['e','e'],['ou','ou']]`, `output: ['Logico']`, `colour: COR_LOGICA` (`290`), *tooltip* exata "“e”: verdadeiro só se os dois lados forem verdadeiros. “ou”: verdadeiro se pelo menos um for", `rotulo: 'e/ou'`, variantes `e`/`ou`; `nao` com `message0: 'não %1'`, `X` `check: ['Logico']`, `output: ['Logico']`, *tooltip* exata "Inverte o valor: verdadeiro vira falso e falso vira verdadeiro", `rotulo: 'não'`, sem variantes. Deve falhar até T029 (FR-003, FR-005, FR-008; research R-03, R-06) (RF-06)
- [X] T029 [US3] Criar `src/blocos/logica.js` com `COR_LOGICA = 290`, `OPERADORES_LOGICOS`, `BLOCO_E_OU` e `BLOCO_NAO` conforme [contracts/blocos-operadores.md](contracts/blocos-operadores.md#bloco_e_ou-e-bloco_nao-logicajs): `e_ou` pede `A` com `op.precedencia` e `B` com `op.precedencia + 1`; `nao` pede `X` com `PRECEDENCIA.PRIMARIO` e gera `` `nao ${x}` `` (palavra sem acento no Portugol, "não" só no bloco). Sem Blockly, sem DOM; comentário do topo citando RF-06 e research R-06. Implementar até T028 passar (depende de T003, T025, T028) (RF-06)
- [X] T030 [US3] Registrar `BLOCO_E_OU` e `BLOCO_NAO` no `registroPadrao` e atualizar `tests/unidade/registro.test.js`. No mesmo commit: (a) `tests/aceitacao/casos/operadores-logicos.json` (`nome: "Logica"`): `x` (inteiro), `a`, `b`, `c` (logico); `x <- 15`; `a <- verdadeiro`; `b <- falso`; `c <- falso`; `escreva(nao (x > 10))`; `escreva((a ou b) e c)`; `escreva(a ou b e c)`; `escreva(a e nao b)`; `escreva(nao (nao a))`; `escreva(x > 1 e x < 20)` → `saidaEsperada: "falso\nfalso\nverdadeiro\nverdadeiro\nverdadeiro\nverdadeiro\n"`; `descricao` citando a História 3 (cenários 1 e 2); (b) `tests/aceitacao/casos/expressoes-estrutura.json` (`nome: "Estrutura"`, SC-001): `a`, `b` (logico); `a <- verdadeiro`; `b <- falso`; `escreva(-(2 + 3) * 4)`; `escreva((1 < 2) = verdadeiro)`; `escreva(b e b ou a)`; `escreva(b e (b ou a))`; `escreva(a e (b e a))`; `escreva((nao a) = falso)` → `saidaEsperada: "-20\nverdadeiro\nverdadeiro\nfalso\nfalso\nverdadeiro\n"`, com a `descricao` explicando que, em cada linha, parênteses errados ou faltando mudariam o resultado ou quebrariam a compilação (research R-02, R-11); ambos com `portugolEsperado` com exatamente esses parênteses e `requisitos: ["RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (depende de T010, T017, T022, T026, T029) (FR-003, FR-005; SC-001) (RF-06)
- [X] T031 [US3] Em `tests/unidade/caixa-blocos.test.js`, esperar a categoria "Lógica" (`colour: COR_LOGICA`) por último, com `{ kind: 'block', type: 'e_ou', fields: { OP: 'e' } }`, `{ kind: 'block', type: 'e_ou', fields: { OP: 'ou' } }` e `{ kind: 'block', type: 'nao' }`, e a ordem completa Variáveis, Entrada e saída, Valores, Contas, Comparações, Lógica; em `src/blocos/caixa-blocos.js`, acrescentá-la. Teste primeiro, falhando, depois a mudança (depende de T027, T030) (R-12) (RF-06)

**Checkpoint**: as quatro histórias completas; todos os blocos de RF-06 existem.

---

## Fase 7: Tipos das variáveis em uso (SC-002, pendência P-2 da 002)

**Objetivo**: a matriz do SC-002 conferida com todos os blocos reais, e mudar o tipo de uma
variável ou trocar a variável de um bloco nunca deixa um encaixe incompatível (R-10).

**Teste independente**: matriz de `tipos.test.js` e a parte 2 de
`operadores-blockly.test.js` verdes; no navegador, passos G, H e I do quickstart.

- [X] T032 [P] Em `tests/unidade/tipos.test.js`, `describe('matriz do SC-002')` com o `registroPadrao`: para **cada célula** da tabela "Matriz do SC-002" de [contracts/tipos-encaixe.md](contracts/tipos-encaixe.md#matriz-do-sc-002-teste-de-unidade) (linhas: `numero`, `texto`, `logico`, `aritmetico`, `negativo`, `relacional`, `e_ou`, `nao`, `variavel` inteiro/real/cadeia/logico/sem variável; colunas: `aritmetico` A e B, `negativo` X, `relacional` A e B, `e_ou` A e B, `nao` X, `recebe` inteiro/real/cadeia/logico/sem variável, `escreva` VALOR1), `compativeis(checkEfetivo(encaixe), checkEfetivo(saída))` dá o ✅/❌ da tabela, escrita como uma tabela no próprio teste (`it.each`). Um teste extra percorre a matriz e afirma que nenhum filho com saída só `Logico` encaixa num encaixe que só aceita `Numero` (e vice-versa) (SC-002) (depende de T031) (RF-06)
- [X] T033 Em `src/ui/acoes-variavel.js`, separar de `mudarTipoVariavel` uma função exportada `aplicarTipoVariavel(ws, idVariavel, novoTipo)` e chamá-la depois do diálogo, conforme "Mudar o tipo de uma variável em uso" de [contracts/editor-operadores.md](contracts/editor-operadores.md#mudar-o-tipo-de-uma-variável-em-uso): `Blockly.Events.setGroup(true)`; `encaixesIncompativeis(Blockly.serialization.workspaces.save(ws).blocks, registroPadrao, tipos com idVariavel → novoTipo)` filtrado aos pares em que o pai ou o filho tem `fields.VAR.id === idVariavel`; para cada par, `ws.getBlockById(filho).unplug()` e afastar o filho (`moveBy` alguns pixels, para ficar visível como solto); **depois** `mapa.changeVariableType(variavel, novoTipo)`; `setGroup(false)` num `finally`. Comentário citando research R-10 (a ordem soltar → mudar é o que faz um Ctrl+Z reencaixar) (depende de T012, T031) (RF-06)
- [X] T034 Em `src/ui/campo-variavel.js`, em `CampoVariavel.onItemSelected_`, para uma variável escolhida (não os três itens de ação), conforme "Trocar a variável no menu do campo" de [contracts/editor-operadores.md](contracts/editor-operadores.md#trocar-a-variável-no-menu-do-campo): exportar `trocarVariavelDoBloco(bloco, idNova)`, que faz **tudo num único grupo de eventos** (`Blockly.Events.setGroup(true)` … `setGroup(false)` num `finally`): (1) se o bloco está encaixado e `compativeis(checkEfetivo(pai, encaixe, tipoDoPai), checkDoTipoVariavel(tipoNovo))` é `false`, `bloco.unplug()` e afastar; (2) se o bloco tem `tipoPelaVariavel` num encaixe (`variavel_recebe`) e o valor encaixado ali não cabe no tipo novo, desencaixar esse valor e afastar; (3) **depois**, aplicar a variável nova no campo `VAR` (`bloco.getField('VAR').setValue(idNova)`). O `onItemSelected_` só chama `trocarVariavelDoBloco(this.getSourceBlock(), item.getValue())` para uma variável escolhida; os três itens de ação continuam indo para `ACOES`. A ordem soltar → aplicar é a do research R-10 (um Ctrl+Z volta a variável e reencaixa) (depende de T012, T031) (RF-06)
- [X] T035 Em `tests/unidade/operadores-blockly.test.js`, parte 2 (headless, mesmo `beforeAll` de T013): (1) com os blocos novos: `numero` não encaixa no `A` do `e_ou`; `relacional` não encaixa no `A` do `aritmetico`; variável `logico` não encaixa no `X` do `negativo`; `numero` não encaixa no `VALOR` de `ok recebe` (logico); `relacional` encaixa no `VALOR` de `ok recebe`; (2) **mudar o tipo**: `escreva(idade + 1)` com `idade` inteiro; `aplicarTipoVariavel(ws, idIdade, 'logico')` → o bloco `variavel` vira bloco de topo, o `A` do `aritmetico` fica vazio, `gerarPortugol` mostra `escreva(??? + 1)` com o aviso "Falta o primeiro valor do bloco conta" e o tipo é `logico`; **um** `ws.undo(false)` volta o tipo para `inteiro` e o `variavel` para o `A`; (3) `ok recebe (idade >= 18)` e `aplicarTipoVariavel(ws, idOk, 'inteiro')` → o `relacional` sai do `VALOR`; um undo volta; (4) mudar para um tipo compatível (`inteiro` → `real` em `idade + 1`) não solta nada; (5) **trocar a variável**: `variavel` de `idade` no `A` do `aritmetico`, `trocarVariavelDoBloco(bloco, idOk)` → o bloco fica solto e o campo mostra `ok`; **um** `ws.undo(false)` volta `idade` no campo e o bloco ao encaixe; `trocarVariavelDoBloco(bloco, idAltura)` (real, compatível) não solta nada; (6) `ok recebe (idade >= 18)` e `trocarVariavelDoBloco(recebe, idIdade)` → o `relacional` sai do `VALOR`; um undo volta. Se a ordem do desfazer não funcionar como no research R-10, parar e atualizar o research antes de seguir (depende de T033, T034) (SC-002) (RF-06)
- [X] T036 Validar no navegador (`npm run dev`) os passos A a K da seção 2 do [quickstart.md](quickstart.md), com o console sem erros (passo L). Registrar o resultado para o PR (depende de T035) (FR-001..FR-008; SC-002) (RF-06)

**Checkpoint**: SC-002 provado na unidade, no Blockly headless e no navegador; P-2 fechada.

---

## Fase 8: Acabamento

- [X] T037 [P] Atualizar a documentação das outras specs: em `specs/002-blocos-variaveis/plan.md`, seção "Pendências para as specs 003 e 006", marcar as três pendências da 006 como resolvidas (caso `idade <- 15` com link para `tests/aceitacao/casos/recebe-idade-quinze.json`; `check` do `variavel` pelo tipo com link para `specs/006-blocos-operadores/contracts/tipos-encaixe.md`; passo B da 007 conferido no passo F do quickstart da 006); em `specs/003-blocos-leia-escreva/plan.md` ("Pendências para outras specs") e no R-12 do research da 003, marcar a linha da 006 como resolvida com link para este `tasks.md`; em `specs/004-blocos-se-senao/spec.md` e `specs/005-blocos-repeticao/spec.md`, nas Premissas, registrar **só a regra de usuário**, sem detalhe técnico (princípio III): "a condição só aceita valores lógicos" (e, na 005, "os limites e o passo do `para` só aceitam números"); em `specs/012-carregar-projeto/spec.md`, nas Premissas, registrar só "um arquivo com encaixe inválido mostra uma mensagem amigável". O detalhe técnico (`check`, `BadConnectionCheck`) fica apenas em [contracts/tipos-encaixe.md](contracts/tipos-encaixe.md#regra-para-as-specs-004-e-005) e no research R-15 desta spec, para os plans da 004, 005 e 012 citarem. Commits `docs(002) (RF-02): …`, `docs(003) (RF-06): …`, `docs(004) (RF-04): …`, `docs(005) (RF-05): …`, `docs(012) (RF-12): …` (conferir os IDs de requisito em `docs/briefing/02-requisitos-extraidos.md`) (RF-06)
- [X] T038 [P] As duas issues do research R-13 em `meuPia/core` ("Atribuições e operações com tipos incompatíveis são aceitas" e "`VERDADEIRO`/`FALSO` em maiúsculas são tratados como variável"), com os textos do R-13. A **abertura** é feita pela dupla, como na 003/R-07; quando abertas, trocar "a preencher pela dupla" pelos links no R-13 de `specs/006-blocos-operadores/research.md`. Commit `docs(006) (RF-06): …` (RF-06)
- [X] T039 Rodar `npm test` (unidade + aceitação no Core real) e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/blocos/tipos.js`, `comparacoes.js`, `logica.js`, `valores.js`, `contas.js`, `registro.js`, `caixa-blocos.js` e `src/portugol/precedencia.js` no relatório, e a meta-aceitação verde (variantes dos cinco blocos novos e encaixes compatíveis em todos os casos); versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script. **Portão da constituição (princípio I)**: antes de abrir o PR, conferir que as duas issues do R-13 foram abertas pela dupla e que os links estão no R-13; sem elas, o PR não é aberto (depende das fases 3 a 7 e de T037, T038) (RNF-04, RNF-01)
- [X] T040 Percorrer a seção 2 do [quickstart.md](quickstart.md) inteira de novo, numa aba nova, conferindo que nenhum texto novo está em outro idioma (categorias "Comparações" e "Lógica", *tooltips*, rótulos `≠ ≤ ≥ − não verdadeiro falso`, avisos). Registrar no PR o que foi verificado, as pendências P-1 a P-3 da 002 fechadas e o que fica para 004, 005 e 012 (research R-15) (depende de T039) (FR-008) (RF-06, RNF-03)

---

## Dependências e ordem

### Entre fases

- **Setup (1)** → **Fundação (2)** → histórias.
- **US1 (3)**, **US2 (4)** e **US4 (5)** dependem só da Fundação no núcleo
  (T015/T016, T020/T021 e T024/T025 podem correr juntas). As tasks de caixa (T019, T023,
  T027, T031) mexem no mesmo arquivo e seguem em sequência.
- **US3 (6)** usa o `relacional` e o `logico` nos testes e casos: T029 depende de T025;
  T030 depende de T017, T022 e T026.
- **Tipos das variáveis (7)** depende de todas as histórias (a matriz usa os blocos reais).
- **Acabamento (8)**: T037 e T038 em paralelo; T039 e T040 fecham tudo.

### Dentro de cada fase

Testes primeiro (falhando), depois o núcleo, depois o registro com os casos de aceitação no
mesmo commit, depois a caixa de blocos, por último a validação no navegador.

### Oportunidades de paralelismo

- Fundação: T002, T004, T006, T008, T011 e T014 juntos; depois T003, T005, T007.
- Histórias: os testes T015, T020 e T024 juntos logo depois da Fundação; os núcleos T016,
  T021 e T025 juntos (arquivos diferentes: `contas.js`, `comparacoes.js`, `valores.js`).
- T018 em paralelo com T016/T017.
- Fase 7: T032 em paralelo com T033/T034 (que mexem em arquivos diferentes entre si).
- Acabamento: T037 e T038 juntos.

### Exemplo: depois da Fundação

```text
Juntas:  T015 negativo (teste) | T020 relacional (teste) | T024 lógico (teste)
Juntas:  T016 contas.js | T021 comparacoes.js | T025 valores.js
Depois:  T017 registro + operadores-media → T022 registro + operadores-comparacao → T026 registro + valores-fixos
Depois:  T018/T019 Contas → T023 Comparações → T027 Valores
Depois:  T028 e/ou e não (teste) → T029 logica.js → T030 registro + dois casos → T031 Lógica
```

### Exemplo: Fase 7

```text
Juntas:  T032 matriz SC-002 | T033 aplicarTipoVariavel | T034 trocar variável no campo
Depois:  T035 headless (Ctrl+Z) → T036 navegador
```

## Estratégia de implementação

### MVP (Fundação + História 1)

Fases 1 a 3. Para e valida: os blocos da 003 e da 002 já recusam encaixes de tipo errado,
`idade <- 15` roda no Core (P-1), o negativo existe e `(nota1 + nota2) / 2` dá `7.5`.

### Entrega incremental

1. MVP → PR parcial possível.
2. + US2 e US4 → todas as P1: comparações e `verdadeiro`/`falso`.
3. + US3 → `e`, `ou`, `não` e o SC-001 com `expressoes-estrutura`.
4. + Fase 7 → SC-002 completo com variáveis que mudam de tipo (P-2).
5. Acabamento → documentação das outras specs, issues do Core, cobertura e README.

### Pendências para outras specs

Registradas no [plan.md](plan.md) (research R-15). Não são tasks desta spec, só notas
(T037):

- **004 e 005**: `check: 'Logico'` nas condições e `'Numero'` nos limites do `para`.
- **012**: mensagem amigável para arquivo com encaixe incompatível.
