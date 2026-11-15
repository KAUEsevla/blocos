---

description: "Tasks da spec 003: Blocos de entrada e saída (leia/escreva)"
---

# Tasks: Blocos de entrada e saída (leia/escreva)

**Entrada**: documentos de design em `specs/003-blocos-leia-escreva/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constitution exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). Cada módulo novo do núcleo
(`src/blocos/campo-variavel.js`, `entrada-saida.js`, `valores.js`, `contas.js`) e a
mudança do `ctx.valor` têm testes de unidade escritos antes da implementação. O
comportamento do Blockly (estado extra do `escreva`, `leia` ao apagar a variável) é
conferido no Blockly headless. A ligação com o DOM é verificada no navegador pelo
[quickstart.md](quickstart.md).

**Organização**: tarefas agrupadas pelas duas histórias da spec. Os três blocos
antecipados da 006 (`numero`, `texto`, `aritmetico`; research R-03) entram na História 1,
que precisa deles para o "Olá, mundo!" e para a pendência P-1 da 002.

**Rastreabilidade (constitution v1.2.0, princípio III)**: cada task cita o requisito
entre parênteses no fim. O commit de uma task usa `003/Txxx (RF-xx): descrição` com o
requisito da task: `RF-03` para `escreva`/`leia`, **`RF-06`** para `numero`, `texto`,
`aritmetico` e a precedência (ex.: `003/T012 (RF-06): bloco de número com vírgula`).
Tasks só de documentação usam `docs(003) (RF-xx): …` (ou `docs(006)`, `docs(008)` quando
o arquivo é de outra spec).

**Regra da meta-verificação (008)**: a suíte de aceitação exige que todo par (tipo,
variante) do `registroPadrao` apareça num caso. Por isso cada task que registra um bloco
traz, **no mesmo commit**, os casos de aceitação que cobrem todas as variantes dele.

**Pendências obrigatórias da 002** (research R-01): **P-1** `escreva(idade + 1)` → `16`
no Core (T015); **P-2** valores iniciais `0`, `0.0`, texto vazio, `falso` no Core
(T016); **P-3** `leia` com o mesmo `campo_variavel` da 002 (T005, T025, T026, T027).

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]**, **[US2]**: História 1 (escreva) e História 2 (leia) da spec
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: confirmar que a base herdada está verde antes de mexer.

- [X] T001 Na branch `003-blocos-leia-escreva`, rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-03)

---

## Fase 2: Fundação (bloqueia as duas histórias)

**Objetivo**: o gerador sabe pôr parênteses pela precedência (R-06) e a definição do
campo de variável vira um módulo comum (R-05). Nada muda no Portugol dos blocos atuais.

- [X] T002 [P] Em `tests/unidade/gerador.test.js`, acrescentar um `describe('ctx.valor com precedenciaMinima')` usando `criarRegistroTeste()` de `tests/auxiliares/blocos-teste.js` mais blocos de teste locais: um comando `t_mostra` que emite `` mostra(${ctx.valor(b, 'V', 'o valor', b.fields.MIN)}) `` e um valor `t_prec` que devolve `{ codigo: 'x', precedencia: b.fields.P }`. Casos, conforme a tabela de [contracts/blocos-valores-contas.md](contracts/blocos-valores-contas.md#ctxvalor-com-precedência-mínima-altera-o-contrato-da-008): (1) `P: 50`, `MIN: 50` → `mostra(x)`; (2) `P: 50`, `MIN: 51` → `mostra((x))`; (3) encaixe vazio com `MIN: 99` → `mostra(???)` sem parênteses e com o aviso "Falta o valor do bloco …"; (4) filho de tipo desconhecido com `MIN: 99` → `???` sem parênteses e aviso "Bloco desconhecido: …"; (5) sem o quarto argumento, `P: 0` → `mostra(x)` (padrão `0`). Confirmar que os testes atuais de `gerador.test.js` não mudam. Deve falhar até T003 (R-06) (RF-06)
- [X] T003 Em `src/portugol/gerador.js`, mudar `ctx.valor(bloco, encaixe, parte)` para `ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0)`: quando o filho é um bloco `valor` registrado, chamar `entrada.gerar(filho, ctx)` e devolver `` `(${codigo})` `` se `precedencia < precedenciaMinima`, senão `codigo`; os caminhos de encaixe vazio e bloco desconhecido continuam devolvendo `MARCADOR_AUSENTE` sem parênteses. Em `src/portugol/precedencia.js`, `PRECEDENCIA = Object.freeze({ ADITIVO: 50, MULTIPLICATIVO: 60, PRIMARIO: 100 })` e atualizar o comentário do topo (a 006 acrescenta `OU`, `E`, `NAO`, `RELACIONAL` abaixo de 50 e `UNARIO` entre 60 e 100). Implementar até T002 passar e `npm run test:unidade` inteiro continuar verde (depende de T002) (R-06) (RF-06)
- [X] T004 [P] Em `specs/008-portugol-valido/contracts/registro-blocos.md`, na tabela "Contexto de geração (`ctx`)", trocar a linha de `ctx.valor` por `ctx.valor(bloco, encaixe, parte, precedenciaMinima = 0) → string` com a regra "se o filho devolver `precedencia < precedenciaMinima`, o código volta entre parênteses; `???` nunca leva parênteses", com link para `specs/003-blocos-leia-escreva/contracts/blocos-valores-contas.md`. Commit `docs(008) (RF-06): …` (RF-06)
- [X] T005 [P] Criar `src/blocos/campo-variavel.js` exportando `campoVariavel()` que devolve `{ type: 'campo_variavel', name: 'VAR', variable: null, variableTypes: [...TIPOS_VARIAVEL], defaultType: 'inteiro' }` (objeto novo a cada chamada; `TIPOS_VARIAVEL` de `src/projeto/formato.js`), conforme [contracts/blocos-entrada-saida.md](contracts/blocos-entrada-saida.md#campovariavel-srcblocoscampo-variaveljs). Em `src/blocos/variaveis.js`, apagar a função local `campoVariavel` e importar a do módulo novo. Em `tests/unidade/blocos-variaveis.test.js`, acrescentar um teste: duas chamadas devolvem objetos diferentes e iguais em conteúdo, com os quatro tipos. `npm run test:unidade` continua verde sem outras mudanças (P-3) (RF-03)

**Checkpoint**: base pronta; as histórias podem começar.

---

## Fase 3: História 1 - Mostrar uma mensagem (Prioridade: P1) 🎯 MVP

**Objetivo**: o estudante usa o `escreva` com 1 a 10 valores (texto, número, variável ou
conta) e o "Olá, mundo!" sai pronto da caixa de blocos (FR-001, FR-002, FR-003,
FR-006). Inclui os blocos antecipados da 006 e as pendências P-1 e P-2 da 002.

**Teste independente**: `blocos-valores-contas.test.js`, `blocos-entrada-saida.test.js`,
`entrada-saida-blockly.test.js` e `caixa-blocos.test.js` verdes; casos
`escreva-ola-mundo`, `escreva-varios-valores`, `escreva-conta-idade`,
`escreva-valores-iniciais`, `contas-precedencia`, `texto-especial` e `numero-zeros`
verdes no Core real; no navegador, passos A, C a G e L a O da seção 2 do
[quickstart.md](quickstart.md).

### Testes da História 1

- [X] T006 [P] [US1] Criar `tests/unidade/blocos-valores-contas.test.js`, parte **valores**: (1) `normalizarNumero` com **cada** linha da tabela "Normalização" do [data-model](data-model.md#valor-fixo-de-número-numero--rf-06-antecipado-da-006): `'3'`→`'3'`, `' 3 '`→`'3'`, `'3,5'`→`'3.5'`, `'3.5'`→`'3.5'`, `'007'`→`'7'`, `'00,5'`→`'0.5'`, `'0'`→`'0'`, e `null` para `'12a'`, `'.5'`, `'5.'`, `'1.000,5'`, `'-3'`, `'1e3'`, `''`, `'   '`, `undefined`, `42` (não-`string`, sem lançar); (2) `gerarTexto`: `''`→`'""'`, `'Olá, mundo!'`→`'"Olá, mundo!"'`, `'a"b\\c'` (texto `a"b\c`)→`'"a\\"b\\\\c"'` (Portugol `"a\"b\\c"`), `'x\\ny'` (texto `x\ny` com barra) → Portugol `"x\\ny"`, `'\\"'` (barra seguida de aspas) → `"\\\""`; (3) `gerarPortugol` com um registro próprio (os blocos só entram no `registroPadrao` em T012/T013): `criarRegistro()` + `BLOCO_PROGRAMA` + `BLOCO_NUMERO` + `BLOCO_TEXTO` + o `teste_escreva` de `tests/auxiliares/blocos-teste.js`: `numero` com `NUM: '3.5'` gera `escreva(3.5)`; `numero` com `NUM: '007'` (arquivo editado à mão) gera `escreva(7)` sem aviso; `numero` com `NUM: '3,5'` gera `escreva(3.5)`; `numero` com `NUM: '12a'` (arquivo editado à mão) gera `escreva(???)` e o aviso "O número do bloco número é inválido"; `texto` sem `fields` gera `escreva("")`; (4) `variantes`: `numero` "inteiro" presente para `NUM: '3'` e "real" para `NUM: '3.5'`; `texto` "simples" para `Olá` e "com aspas ou barra" para `a"b` e para `a\b`. Deve falhar até T009 (FR-004, FR-006, FR-007 da 006; research R-07, R-08) (RF-06)
- [X] T007 [P] [US1] Em `tests/unidade/blocos-valores-contas.test.js`, parte **contas** (`describe` próprio): registro com `BLOCO_PROGRAMA`, `BLOCO_NUMERO`, `BLOCO_ARITMETICO`, `BLOCO_VARIAVEL` e o `teste_escreva`; montar com o auxiliar `bloco()` e conferir o texto gerado de **cada** linha de "Exemplos de geração" de [contracts/blocos-valores-contas.md](contracts/blocos-valores-contas.md#exemplos-de-geração-testes-de-unidade): `idade + 1`, `(2 + 3) * 4`, `10 - (3 - 2)`, `10 - 3 - 2`, `8 / (2 * 2)`, `8 / 2 * 2`, e `??? + 1` com o aviso "Falta o primeiro valor do bloco conta" (e "Falta o segundo valor do bloco conta" com `B` vazio); `OP: '%'` gera `7 % 2`; `OP: 'x'` gera `???` e o aviso "Escolha a conta do bloco conta"; a precedência devolvida é `PRECEDENCIA.ADITIVO` para `+`/`-` e `PRECEDENCIA.MULTIPLICATIVO` para `*`/`/`/`%`; `OPERADORES_ARITMETICOS` congelado com as cinco chaves; `variantesDe('aritmetico')` tem os nomes `+`, `-`, `*`, `/`, `%`; a definição tem o `field_dropdown` `OP` com exatamente `[['+','+'],['−','-'],['×','*'],['÷','/'],['resto','%']]`. Deve falhar até T010 (FR-001, FR-005, FR-008 da 006; research R-06) (RF-06)
- [X] T008 [P] [US1] Criar `tests/unidade/blocos-entrada-saida.test.js`, parte **escreva**: (1) `quantidadeValores` conforme o [data-model](data-model.md#comando-escreva-escreva): sem `extraState` → 1; `{ valores: 3 }` → 3; `0`, `-2`, `'2'`, `2.5`, `null` → 1; `11` e `99` → 10 (`MAX_VALORES === 10`); (2) `nomeEncaixe(1) === 'VALOR1'`; (3) com `criarRegistro()` + `BLOCO_PROGRAMA` + `BLOCO_ESCREVA` + `BLOCO_TEXTO` + `BLOCO_VARIAVEL`: um valor `texto` “Olá, mundo!” gera `    escreva("Olá, mundo!")`; `valores: 2` com `texto` "Idade: " e `variavel` idade gera `escreva("Idade: ", idade)`; dois `escreva` seguidos geram duas linhas; `valores: 1` vazio gera `escreva(???)` e o aviso "Falta o valor do bloco escreva"; `valores: 3` com o 2º vazio gera `escreva("a", ???, "b")` e o aviso "Falta o valor 2 do bloco escreva"; `valores: 1` com um `VALOR2` preenchido no JSON ignora o `VALOR2`; nunca sai `escreva()`; (4) variantes "um valor" (sem `extraState` e `valores: 1`) e "vários valores" (`valores: 2`); (5) a definição tem `mutator: 'mutador_escreva'`, `previousStatement`, `nextStatement`, o encaixe `VALOR1` e a *tooltip* "Mostra os valores na tela, um ao lado do outro, e passa para a próxima linha". Deve falhar até T011 (FR-001, FR-003, FR-006) (RF-03)

### Implementação da História 1 (núcleo)

- [X] T009 [US1] Criar `src/blocos/valores.js` com `normalizarNumero(texto)`, `gerarTexto(conteudo)`, `BLOCO_NUMERO` e `BLOCO_TEXTO` conforme [contracts/blocos-valores-contas.md](contracts/blocos-valores-contas.md): `numero` com `field_input` `NUM` (`text: '0'`), `extensions: ['validar_numero']`, `output: null`, *tooltip* "Um número. Use vírgula ou ponto para as casas decimais, como 3,5", variantes `inteiro`/`real`, `gerar` devolve `{ codigo: normalizarNumero(NUM), precedencia: PRECEDENCIA.PRIMARIO }` (normaliza sempre, mesmo com o campo já normalizado) ou `???` + `ctx.aviso(bloco, 'NUM', 'O número do bloco número é inválido')`; `texto` com `message0: '“%1”'`, `field_input` `TEXTO` (`text: ''`), variantes `simples`/`com aspas ou barra`. `normalizarNumero`: tirar espaços das pontas, aceitar só `/^\d+([.,]\d+)?$/`, trocar `,` por `.`, tirar zeros à esquerda da parte inteira deixando um. `gerarTexto`: `\` → `\\` **antes** de `"` → `\"`. Exportar `COR_VALORES` (valor escolhido aqui, diferente das cores existentes). Sem Blockly, sem DOM; comentário do topo citando RF-06 e research R-03, R-07, R-08 da 003 (depende de T003, T006) (RF-06)
- [X] T010 [US1] Criar `src/blocos/contas.js` com `OPERADORES_ARITMETICOS` e `BLOCO_ARITMETICO` conforme [contracts/blocos-valores-contas.md](contracts/blocos-valores-contas.md#bloco_aritmetico-srcblocoscontasjs): rótulo `conta`, `message0: '%1 %2 %3'` (`input_value A`, `field_dropdown OP`, `input_value B`), `inputsInline: true`, `output: null` (sem `check`; os `check` são da 006), *tooltip* "Faz a conta com os dois valores. “resto” é o que sobra da divisão", uma variante por operador; `gerar` pede `A` com `op.precedencia` e `B` com `op.precedencia + 1`. Exportar `COR_CONTAS`. Implementar até T007 passar (depende de T003, T007, T009) (RF-06)
- [X] T011 [US1] Criar `src/blocos/entrada-saida.js` com `MAX_VALORES`, `quantidadeValores(bloco)`, `nomeEncaixe(k)` e `BLOCO_ESCREVA` conforme [contracts/blocos-entrada-saida.md](contracts/blocos-entrada-saida.md#bloco_escreva): `message0: 'escreva %1'` com `input_value VALOR1`, `inputsInline: true`, `mutator: 'mutador_escreva'`, variantes `um valor`/`vários valores`, `gerar` com os nomes de parte `o valor` (n = 1) e `` `o valor ${k}` `` (n > 1). Exportar `COR_ENTRADA_SAIDA` de `src/blocos/caixa-blocos.js` (como `COR_VARIAVEIS`) e usá-la na definição. Comentário do topo citando RF-03 e research R-04. Implementar até T008 passar (depende de T008) (FR-001, FR-003, FR-006) (RF-03)

### Registro e aceitação no Core (História 1)

Cada task registra blocos em `src/blocos/registro.js` (`registroPadrao`) **e** cria os
casos que cobrem todas as variantes deles, no mesmo commit. Casos no formato de
`tests/aceitacao/casos/variaveis-atribuicao.json` (`formato`, `versao: 1`, `nome`,
`variaveis`, `blocos` com o `programa` de `id: "programa"`), com `portugolEsperado`
completo e `saidaEsperada` exata (research R-02, R-10).

- [X] T012 [US1] Registrar `BLOCO_ESCREVA` e `BLOCO_TEXTO` no `registroPadrao` (ordem: programa, variáveis, escreva, texto) e atualizar `tests/unidade/registro.test.js` (`tiposRegistrados()` com os tipos novos). No mesmo commit: (a) `tests/aceitacao/casos/escreva-ola-mundo.json`, `nome: "OlaMundo"`, sem variáveis, `escreva` sem `extraState` com `texto` “Olá, mundo!” → `saidaEsperada: "Olá, mundo!\n"`, `requisitos: ["RF-03", "RF-06", "RNF-07"]`; (b) `tests/aceitacao/casos/texto-especial.json`: três `escreva` com os textos `a"b\c`, `x\ny` (barra seguida de `n`, no JSON `"x\\ny"`) e vazio → `portugolEsperado` com `    escreva("a\"b\\c")`, `    escreva("x\\ny")`, `    escreva("")` e `saidaEsperada` com as três linhas `a"b\c`, `x\ny` e vazia, `requisitos: ["RF-06", "RNF-07"]`. Ainda falta a variante "vários valores" do `escreva`: incluir também (c) `tests/aceitacao/casos/escreva-varios-valores.json` só com textos por enquanto: `escreva("Idade: ", "15")` (`extraState: { valores: 2 }`) → `Idade: 15\n` (T013 acrescenta o número a este caso). Rodar `npm run test:aceitacao` verde. **Atenção**: o `escreva` (`mutator: 'mutador_escreva'`) e, na T013, o `numero` (`extensions: ['validar_numero']`) passam a estar nas definições antes de o mutador e o validador existirem (T018, T019); até a T019, não criar esses blocos no navegador nem em testes com Blockly (as suítes de unidade e aceitação só usam o JSON e não são afetadas) (depende de T009, T011) (FR-001, FR-003; História 1, cenários 1 e 3) (RF-03)
- [X] T013 [US1] Registrar `BLOCO_NUMERO` no `registroPadrao`. No mesmo commit: (a) reescrever `tests/aceitacao/casos/escreva-varios-valores.json` para o cenário 2 da História 1: variável `idade` (inteiro); `idade recebe [numero 15]`; `escreva("Idade: ", idade)` (`valores: 2`); `escreva("a", 1, 2.5)` (`valores: 3`, o `2.5` guardado como `NUM: "2.5"`) → `portugolEsperado` com `    idade <- 15`, `    escreva("Idade: ", idade)`, `    escreva("a", 1, 2.5)` e `saidaEsperada: "Idade: 15\na12.5\n"` (valores colados, regra do Core); (b) `tests/aceitacao/casos/numero-zeros.json`: `numero` com `NUM: "007"` (como num arquivo editado à mão; prova o adaptador no gerador) → `portugolEsperado` com `    escreva(7)` → `saidaEsperada: "7\n"`, e na `descricao` citar a lacuna do Core do research R-07; `requisitos` com `RF-03`, `RF-06`, `RNF-07`. Rodar `npm run test:aceitacao` verde (depende de T012) (FR-001; História 1, cenário 2) (RF-06)
- [X] T014 [US1] Registrar `BLOCO_ARITMETICO` no `registroPadrao`. No mesmo commit, `tests/aceitacao/casos/contas-precedencia.json` com as cinco variantes: `escreva(2 * (3 + 4))` → `14`, `escreva(10 - (3 - 2))` → `9`, `escreva(7 / 2)` → `3.5`, `escreva(7 % 2)` → `1`, `escreva("a" + 1)` → `a1` (concatenação, caso de borda da 006); `portugolEsperado` com os parênteses exatamente assim; `saidaEsperada: "14\n9\n3.5\n1\na1\n"`; `requisitos: ["RF-06", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (depende de T010, T013) (FR-001, FR-005 da 006) (RF-06)

### Pendências da 002 no Core real (P-1, P-2)

- [X] T015 [P] [US1] **P-1**: criar `tests/aceitacao/casos/escreva-conta-idade.json`, `nome: "Idade"`, variável `idade` (inteiro, `id: "v-idade"`); `idade recebe [numero 15]` e `escreva([conta idade + numero 1])` → `portugolEsperado` `algoritmo "Idade"\n\nvar\n    idade: inteiro\n\ninicio\n    idade <- 15\n    escreva(idade + 1)\nfim_algoritmo\n` e `saidaEsperada: "16\n"`; `descricao` citando a História 3 da spec 002; `requisitos: ["RF-02", "RF-03", "RF-06", "RNF-07"]` (depende de T014) (RF-03)
- [X] T016 [P] [US1] **P-2**: criar `tests/aceitacao/casos/escreva-valores-iniciais.json` com `idade` (inteiro), `altura` (real), `nome` (cadeia), `ok` (logico), **sem** atribuir: `escreva(idade)`, `escreva(altura)`, `escreva(nome)`, `escreva(ok)` e `escreva("[", nome, "]")` (`valores: 3`) → `saidaEsperada: "0\n0.0\n\nfalso\n[]\n"` (valores iniciais do Core, research R-02; Entidade "Variável" da 002); `requisitos: ["RF-02", "RF-03", "RNF-07"]`. Em `specs/002-blocos-variaveis/data-model.md`, trocar "Conferido por caso de aceitação na 003 (plan, \"Pendências\")" por um link para este caso (depende de T012) (RF-03)
- [X] T017 [P] [US1] Em `tests/unidade/blocos-variaveis.test.js`, trocar os testes que usam `teste_numero`, `teste_soma` e `teste_escreva` para o cenário `idade <- 15` / `escreva(idade + 1)` pelos blocos reais (`numero`, `aritmetico`, `escreva`) com o `registroPadrao`, mantendo as mesmas asserções de texto; os blocos de teste continuam em `tests/auxiliares/blocos-teste.js` para os outros testes (research R-10) (depende de T014) (RF-03)

### Interface da História 1 (fora da cobertura)

- [X] T018 [US1] Criar `src/ui/mutador-escreva.js` com `registrarMutadorEscreva()` idempotente, conforme "Mutador do `escreva`" de [contracts/editor-entrada-saida.md](contracts/editor-entrada-saida.md#mutador-do-escreva-mutador_escreva): `Blockly.Extensions.registerMutator('mutador_escreva', mixin)` com `saveExtraState()` → `{ valores: n }`, `loadExtraState(estado)` que recria `VALOR2…VALORn` até `quantidadeValores({ extraState: estado })`, os métodos `acrescentarValor()` e `tirarValor()` (que os ícones chamam e a T020 testa sem tela) e dois `FieldImage` clicáveis (SVG embutido em `data:` URI, sem arquivo novo) no fim do bloco: "+" acrescenta `VALOR(n+1)` e some com `n === MAX_VALORES`; "−" remove `VALORn` e some com `n === 1`; o bloco que estava no encaixe removido é desencaixado e deslocado para perto do `escreva` (`bumpNeighbours`/`moveBy`). Cada clique: `Blockly.Events.setGroup(true)`, guardar o estado antes, mudar, disparar `new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(bloco, 'mutation', null, antes, depois)`, `setGroup(false)`; nada acontece em bloco de *flyout* (`bloco.isInFlyout`). Textos alternativos `TEXTOS.acrescentarValor` ("Acrescentar um valor") e `TEXTOS.tirarValor` ("Tirar o último valor") em `src/ui/textos.js`. Antes de escrever, conferir em `node_modules/blockly/core/` (`extensions`, `field_image`, `events/events_block_change`) os nomes do 12.5.1 e ajustar. Comentário do topo com "fora da cobertura" (depende de T011) (FR-002) (RF-03, RNF-03)
- [X] T019 [US1] Criar `src/ui/validador-numero.js` com a extensão `validar_numero` e `registrarValidadorNumero()` idempotente, conforme "Validador do número" de [contracts/editor-entrada-saida.md](contracts/editor-entrada-saida.md#validador-do-número-validar_numero): `Blockly.Extensions.register('validar_numero', function () { this.getField('NUM').setValidator((t) => normalizarNumero(t)); })`. Em `src/ui/workspace.js`, em `definirBlocos()`, chamar `registrarCampoVariavel()`, `registrarMutadorEscreva()` e `registrarValidadorNumero()` antes do `defineBlocksWithJsonArray`; atualizar o comentário do topo. Em **todo** teste headless que define as definições do `registroPadrao` (`tests/unidade/variaveis-blockly.test.js`, `tests/unidade/bloco-programa.test.js` e os que a busca por `defineBlocksWithJsonArray` em `tests/` achar), chamar as mesmas três funções no `beforeAll` (depende de T009, T018) (FR-006 da 006) (RF-06)
- [X] T020 [US1] Criar `tests/unidade/entrada-saida-blockly.test.js` (Blockly headless, com as três funções de registro de T019 e as definições do `registroPadrao`): (1) carregar um `escreva` com `extraState: { valores: 3 }` e três `texto` → o bloco tem `VALOR1..VALOR3`, e `Blockly.serialization.workspaces.save` devolve `extraState: { valores: 3 }` e os três encaixes (ida e volta); (2) `extraState: { valores: 50 }` carrega com 10 encaixes; (3) o Portugol de `gerarPortugol({ ...projeto, blocos: serializarBlocos })` é igual ao do JSON original; (4) um `numero` com o validador recusa `12a` (`setValue('12a')` mantém `0`) e guarda `3,5` como `3.5`; (5) "+"/"−" sem tela: chamar no bloco os mesmos métodos que os ícones chamam (exportá-los do mixin, por exemplo `acrescentarValor()` e `tirarValor()`) → com `valores: 1`, acrescentar dá 2 encaixes e `saveExtraState()` = `{ valores: 2 }`; com um `texto` no `VALOR2`, tirar deixa 1 encaixe e o `texto` solto no workspace (bloco de topo); um único `ws.undo(false)` volta para 2 encaixes com o `texto` encaixado no `VALOR2`; acrescentar com 10 encaixes e tirar com 1 não mudam nada. Se algum item divergir do research R-04/R-07, parar e atualizar o research antes de seguir (depende de T019) (FR-001, FR-002) (RF-03)
- [X] T021 [P] [US1] Em `tests/unidade/caixa-blocos.test.js`, acrescentar: (1) `CAIXA_BLOCOS.contents` tem, em ordem, as categorias "Variáveis" (`custom: 'VARIAVEIS'`), "Entrada e saída" (`custom: 'ENTRADA_SAIDA'`), "Valores" (`numero`, `texto`) e "Contas" (`aritmetico` com `fields: { OP: '+' }`); (2) `CATEGORIA_ENTRADA_SAIDA === 'ENTRADA_SAIDA'`; (3) `conteudoCategoriaEntradaSaida([])` começa com `{ kind: 'block', type: 'escreva', inputs: { VALOR1: { block: { type: 'texto', fields: { TEXTO: 'Olá, mundo!' } } } } }` (bloco normal, não `shadow`); (4) entrada não-lista não lança; (5) a mesma lista dá o mesmo resultado (pura). Os itens de `leia` ficam para T034. Deve falhar até T022 (research R-09) (RF-03)
- [X] T022 [US1] Em `src/blocos/caixa-blocos.js`, acrescentar `CATEGORIA_ENTRADA_SAIDA`, as categorias "Entrada e saída" (`custom`), "Valores" e "Contas" em `CAIXA_BLOCOS.contents` (depois de "Variáveis") com `COR_VALORES`/`COR_CONTAS` de T009/T010, e `conteudoCategoriaEntradaSaida(variaveis)` devolvendo por enquanto só o `escreva` com o `texto` “Olá, mundo!”. Em `src/ui/workspace.js`, `ws.registerToolboxCategoryCallback(CATEGORIA_ENTRADA_SAIDA, () => conteudoCategoriaEntradaSaida(variaveisDoWorkspace(ws)))`. Implementar até T021 passar (depende de T021, T019) (FR-001; SC-002) (RF-03)
- [X] T023 [US1] Validar no navegador (`npm run dev`) os passos A, C, D (só o `escreva`), E, F, G, L, M, N e O da seção 2 do [quickstart.md](quickstart.md), com o console sem erros; medir o tempo do passo C (SC-002, parte de montar). Registrar o resultado para o PR (depende de T022) (FR-001, FR-002, FR-006; SC-002) (RF-03, RF-06)

**Checkpoint**: História 1 completa; o "Olá, mundo!" e as contas rodam no Core e P-1 e
P-2 estão fechadas.

---

## Fase 4: História 2 - Ler um valor digitado (Prioridade: P1)

**Objetivo**: o estudante usa o `leia` com uma variável já criada, pelo mesmo campo de
variável da 002, e a caixa orienta a criar uma variável quando não há nenhuma (FR-004,
FR-005, FR-006; P-3).

**Teste independente**: parte `leia` de `blocos-entrada-saida.test.js`, `leia` em
`entrada-saida-blockly.test.js` e `caixa-blocos.test.js` verdes; casos
`leia-quatro-tipos` e `leia-logico-falso` verdes no Core real; no navegador, passos B,
D (`leia`) e H a K do quickstart.

### Testes da História 2

- [X] T024 [P] [US2] Em `tests/unidade/blocos-entrada-saida.test.js`, parte **leia**: (1) com `criarRegistro()` + `BLOCO_PROGRAMA` + `BLOCO_LEIA`, `leia` com `fields.VAR: { id: 'v-nome' }` e a variável `nome` gera `    leia(nome)`; (2) `VAR: null`, campo ausente ou id inexistente gera `leia(???)` e o aviso "Falta a variável do bloco leia" (História 2, cenário 2); (3) a definição usa `campoVariavel()` (`args0[0]` igual a `campoVariavel()`), **não** tem nenhum `input_value` (FR-005) e tem a *tooltip* exata "Pede um valor a quem usa o programa e guarda na variável. Numa variável lógica, só “verdadeiro” vira verdadeiro; o resto vira falso."; (4) renomear: trocar só `variaveis[0].nome` para `apelido` muda o texto para `leia(apelido)`. Deve falhar até T025 (FR-004, FR-005, FR-006; P-3) (RF-03)

### Implementação da História 2

- [X] T025 [US2] Em `src/blocos/entrada-saida.js`, acrescentar `BLOCO_LEIA` conforme [contracts/blocos-entrada-saida.md](contracts/blocos-entrada-saida.md#bloco_leia): `message0: 'leia %1'`, `args0: [campoVariavel()]` (de `src/blocos/campo-variavel.js`), `previousStatement`, `nextStatement`, `COR_ENTRADA_SAIDA`, a *tooltip* de T024, sem variantes; `gerar` = `` ctx.linha(`leia(${ctx.variavel(bloco, 'VAR', 'a variável')})`) ``. Implementar até T024 passar (depende de T005, T024) (FR-004, FR-005, FR-006) (RF-03)
- [X] T026 [US2] Registrar `BLOCO_LEIA` no `registroPadrao` e atualizar `tests/unidade/registro.test.js`. No mesmo commit: (a) `tests/aceitacao/casos/leia-quatro-tipos.json` (teste independente da História 2 e P-3): variáveis `idade` (inteiro), `altura` (real), `nome` (cadeia), `ok` (logico); `leia(nome)`, `leia(idade)`, `leia(altura)`, `leia(ok)`, `escreva("Oi, ", nome)`, `escreva([conta idade + 1])`, `escreva(altura)`, `escreva(ok)`; `entrada: ["Ana", "15", "1.5", "VERDADEIRO"]` → `saidaEsperada: "Oi, Ana\n16\n1.5\nverdadeiro\n"`; (b) `tests/aceitacao/casos/leia-logico-falso.json`: `ok` (logico), `leia(ok)`, `escreva(ok)`, `entrada: ["sim"]` → `"falso\n"` (caso de borda); ambos com `portugolEsperado` e `requisitos: ["RF-03", "RNF-07"]`. Rodar `npm run test:aceitacao` verde (depende de T025, T014) (FR-004; História 2) (RF-03)
- [X] T027 [P] [US2] Em `tests/unidade/entrada-saida-blockly.test.js`, acrescentar (Blockly headless): (1) um `leia` carregado com a variável `nome` mostra `nome` no campo e, depois de `ws.getVariableMap().renameVariable(v, 'apelido')`, o Portugol mostra `leia(apelido)`; (2) com `nome` usada num `leia` e num `variavel` solto, `contarBlocosApagados(serializarBlocos(ws), id)` dá `{ usos: 2, total: 2 }` e é igual à diferença de `ws.getAllBlocks(false).length` antes e depois de `deleteVariable` (o `leia` conta como uso, 002/FR-008); (3) o comando seguinte ao `leia` apagado sobe para o lugar dele (depende de T026) (P-3) (RF-03)
- [X] T028 [P] [US2] Em `tests/unidade/caixa-blocos.test.js`, acrescentar para `conteudoCategoriaEntradaSaida`: (1) sem variáveis: depois do `escreva`, `{ kind: 'label', text: 'Para usar o leia, crie uma variável primeiro.' }` e `{ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL }`, e nenhum `leia`; (2) com `[a (inteiro), nome (cadeia)]` na ordem do mapa: depois do `escreva`, um único `{ kind: 'block', type: 'leia', fields: { VAR: { id } } }` com o id da **última** da lista, sem rótulo nem botão; (3) `TEXTO_LEIA_SEM_VARIAVEL` exportado com o texto exato. Deve falhar até T029 (caso de borda "leia num projeto sem variáveis") (RF-03)
- [X] T029 [US2] Em `src/blocos/caixa-blocos.js`, completar `conteudoCategoriaEntradaSaida(variaveis)` conforme a tabela de [contracts/blocos-entrada-saida.md](contracts/blocos-entrada-saida.md#caixa-de-blocos-srcblocoscaixa-blocosjs) e exportar `TEXTO_LEIA_SEM_VARIAVEL`. O botão reutiliza `BOTAO_CRIAR_VARIAVEL`, já tratado pela 002 em `src/ui/workspace.js` (nenhuma ação nova). Implementar até T028 passar (depende de T028, T022) (FR-004; caso de borda) (RF-03)
- [X] T030 [US2] Validar no navegador os passos B, D (`leia`), H, I, J e K da seção 2 do [quickstart.md](quickstart.md), com o console sem erros. Registrar o resultado para o PR (depende de T029) (FR-004, FR-005, FR-006; P-3) (RF-03)

**Checkpoint**: as duas histórias completas.

---

## Fase 5: Acabamento

- [X] T031 [P] Em `specs/006-blocos-operadores/spec.md`, acrescentar no fim das Premissas uma nota: "Os blocos de número, de texto e de conta aritmética (`+ - * / %`) foram entregues pela spec 003 (research R-03 da 003), seguindo FR-001 (sem o negativo), FR-004 (número e texto), FR-005, FR-006, FR-007 e FR-008 desta spec. A 006 os amplia sem mudar `type`, campos ou variantes." Commit `docs(006) (RF-06): …` (RF-06)
- [X] T032 [P] Redigir em `specs/003-blocos-leia-escreva/research.md`, R-07, o texto da issue para `meuPia/core` (título "Inteiro com zeros à esquerda gera Python inválido", passos: compilar `escreva(007)` no `meupia-core` 1.4.1; esperado: erro léxico em pt-BR ou o número 7; obtido: "Erro interno do compilador: código Python gerado inválido (leading zeros…)"; adapter no editor: `normalizarNumero`). A **abertura** da issue é feita pela dupla, como na 008/R-09; quando aberta, pôr o link no R-07. Commit `docs(003) (RF-06): …` (RF-06)
- [X] T033 [P] Atualizar a documentação das outras specs: em `specs/002-blocos-variaveis/plan.md`, seção "Pendências para as specs 003 e 006", marcar as três pendências da 003 como resolvidas com link para `tests/aceitacao/casos/escreva-conta-idade.json`, `escreva-valores-iniciais.json` e para `BLOCO_LEIA`; em `specs/007-portugol-tempo-real/quickstart.md` (passo B), dizer que o bloco de número existe desde a 003 e que o passo foi conferido no passo O do quickstart da 003; em `specs/001-tela-tres-paineis/contracts/tela.md`, citar as categorias novas da caixa com link para `specs/003-blocos-leia-escreva/contracts/editor-entrada-saida.md`; em `specs/009-executar-no-core/spec.md`, nas Premissas, registrar que a 009 fecha a parte de executar do SC-002 da 003 ("Olá, mundo!" montado e executado em menos de 2 minutos) e a Saída na tela do FR-003 da 003 (uma linha por `escreva`), com link para `specs/003-blocos-leia-escreva/research.md` (R-12); em `specs/010-entrada-de-dados/spec.md`, nas Premissas, registrar o `leia` de real com vírgula recusado pelo Core (R-02 da 003). Commit `docs(003) (RF-03): …` (RF-03)
- [X] T034 Rodar `npm test` (unidade + aceitação no Core real) e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/blocos/campo-variavel.js`, `entrada-saida.js`, `valores.js`, `contas.js`, `caixa-blocos.js`, `src/portugol/gerador.js` e `precedencia.js` no relatório, e a meta-verificação da 008 verde com as variantes dos cinco blocos novos; versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script. **Portão da constituição (princípio I)**: antes de abrir o PR, conferir que a issue do R-07 foi aberta pela dupla em `meuPia/core` e que o link está no R-07; sem ela, o PR não é aberto (depende das fases 3 e 4 e de T031–T033) (RNF-04, RNF-01)
- [X] T035 Percorrer a seção 2 do [quickstart.md](quickstart.md) inteira de novo, numa aba nova, conferindo que nenhum texto novo está em outro idioma (categorias, *tooltips*, rótulos dos operadores, textos alternativos dos ícones "+"/"−", orientação do `leia`). Registrar no PR o que foi verificado, as pendências P-1 a P-3 fechadas e o que fica para 006, 009 e 010 (research R-12) (depende de T034) (FR-001..FR-006) (RF-03, RNF-03)

---

## Dependências e ordem

### Entre fases

- **Setup (1)** → **Fundação (2)** → histórias.
- **US1 (3)** vem primeiro: registra `escreva`, `texto`, `numero` e `aritmetico`, que os
  casos da US2 usam (`escreva(idade + 1)` em `leia-quatro-tipos.json`).
- **US2 (4)** depende da Fundação (T005, campo comum) e de US1 (T014 para o caso de
  aceitação; T022 para a categoria). O núcleo do `leia` (T024, T025) pode começar em
  paralelo com a US1 logo depois da Fundação.
- **Acabamento (5)**: T031–T033 em paralelo; T034 e T035 fecham tudo.

### Dentro de cada história

Testes primeiro (falhando), depois o núcleo, depois o registro com os casos de
aceitação no mesmo commit, depois a interface, por último a validação no navegador.

### Oportunidades de paralelismo

- Fundação: T002, T004 e T005 juntos.
- US1: T006, T007 e T008 juntos; T015, T016 e T017 juntos depois de T014; T021 em
  paralelo com T018–T020.
- US2: T024 logo depois da Fundação, em paralelo com a US1; T027 e T028 juntos.
- Acabamento: T031, T032 e T033 juntos.

### Exemplo: História 1

```text
Juntas:  T006 valores (teste) | T007 contas (teste) | T008 escreva (teste)
Depois:  T009 valores.js → T010 contas.js | T011 entrada-saida.js
Depois:  T012 escreva+texto+casos → T013 numero+casos → T014 aritmetico+caso
Juntas:  T015 P-1 (16) | T016 P-2 (valores iniciais) | T017 testes da 002 com blocos reais
Depois:  T018 mutador → T019 validador e registros → T020 headless | T021 teste da caixa → T022 caixa → T023 navegador
```

### Exemplo: História 2

```text
Depois da Fundação:  T024 leia (teste) → T025 BLOCO_LEIA
Depois de T014:      T026 registro + casos leia-quatro-tipos e leia-logico-falso
Juntas:              T027 leia no Blockly headless | T028 teste da caixa
Depois:              T029 caixa → T030 navegador
```

## Estratégia de implementação

### MVP (só a História 1)

Fases 1 e 2, depois a Fase 3. Para e valida: o "Olá, mundo!" sai da caixa pronto, o
`escreva` aceita de 1 a 10 valores, as contas têm os parênteses certos e P-1 e P-2
passam no Core real. Já fecha SC-001 e a parte de montar do SC-002.

### Entrega incremental

1. MVP (US1) → PR parcial possível.
2. + US2 → `leia` com o campo da 002 (P-3) e a orientação sem variáveis.
3. Acabamento → documentação das outras specs, texto da issue do Core, cobertura e
   README.

### Pendências para outras specs

Registradas no [plan.md](plan.md) (research R-12). Não são tasks desta spec:

- **006**: negativo, relacionais, lógicos, valor fixo lógico, `check` de tipos.
- **009**: ver a Saída no navegador ao executar; completar a medição do SC-002.
- **010**: caixa de entrada do `leia`; mensagem para real digitado com vírgula no `leia`.
