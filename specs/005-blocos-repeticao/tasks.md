---

description: "Tasks da spec 005: Blocos de repetição (enquanto/para)"
---

# Tasks: Blocos de repetição (enquanto/para)

**Entrada**: documentos de design em `specs/005-blocos-repeticao/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). O núcleo (`src/blocos/repeticao.js`,
`campoVariavel`, `ctx.tipoVariavel`, as traduções do adapter) tem testes de unidade escritos
antes da implementação. Os encaixes e o campo de variável são testados headless no Blockly
12.5.1, como na 004 e na 006. A aceitação roda os casos novos no `meupia-core` 1.4.1 real, e
o Parar e a Saída longa rodam no worker real a partir de blocos. O que só existe na tela é
verificado pelo [quickstart.md](quickstart.md).

**Organização**: Fundação (campo com tipos, `ctx.tipoVariavel`, os dois blocos puros, as
colunas da matriz de tipos) e uma fase por história na ordem da spec: História 1 (`para`,
P1) com o registro do `para`, a categoria, as traduções do adapter, a Saída longa (P-2) e o
`leia` em laço (P-3) → História 2 (`enquanto`, P1) com o registro do `enquanto`, o Parar
(P-2) e o `se` nos laços (P-4) → entrega → documentação das outras specs.

**Por que os casos `para-contagem` e `para-regressivo` entram na História 1**: ao registrar o
`para` no `registroPadrao`, a meta-aceitação passa a exigir as variantes "sem passo" e "com
passo". O mesmo vale para o `enquanto` e `enquanto-regressiva` na História 2. Sem o caso no
mesmo commit, `npm test` falha.

**Commits (constituição v2.0.0, princípio III)**: **um commit por fase**, feito quando todas
as tasks da fase estão marcadas e com os testes (`npm test`) rodados uma vez antes do
commit, passando. Formato `005/Txxx-Tyyy (RF-xx, …): descrição`; tasks não consecutivas
separadas por vírgula. A fase de documentação usa `docs(005) (RF-xx, …): descrição`. A
linha **Commit** no fim de cada fase traz a mensagem.

**Pendências obrigatórias** (Premissas da spec; research R-01):

- **P-1** (006, [tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md#regra-para-as-specs-004-e-005); RF-06): condição do `enquanto` só lógica; de, até e passo do `para` só números. T006, T008, T012, T022.
- **P-2** (009, plan "Pendências para outras specs"; RF-09): Parar um laço infinito e a Saída com mais de 1.000 linhas, com os blocos de repetição. T017, T018, T025, T026.
- **P-3** (010, plan "Pendências para outras specs" e R-12; RF-10): um `leia` dentro de um laço pede o valor a cada volta. T016, T017, T025.
- **P-4** (004, plan "Pendências para outras specs"; RF-04): um `se` encaixa dentro de `enquanto` e `para`. T023, T024, T026.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]** repetir uma quantidade conhecida de vezes (`para`), **[US2]** repetir enquanto
  uma condição vale (`enquanto`)
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Fundação (bloqueia as histórias)

**Objetivo**: o campo de variável aceita uma lista de tipos, o `ctx` informa o tipo da
variável, os blocos `enquanto` e `para` existem no núcleo (definição, geração, avisos,
variantes) e as regras de tipo dos encaixes estão na matriz do SC-002 (contrato
[blocos-repeticao.md](contracts/blocos-repeticao.md)). Os blocos ainda não estão no
`registroPadrao`.

### Base herdada

- [X] T001 Na branch `005-blocos-repeticao` (criada da `main` com a 004), rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec (RF-05)

### Campo de variável e `ctx.tipoVariavel`

- [X] T002 [P] Em `tests/unidade/blocos-variaveis.test.js`, no `describe('campoVariavel …')`: `campoVariavel()` continua igual (os quatro tipos, `defaultType: 'inteiro'`); `campoVariavel(['inteiro'])` tem `variableTypes: ['inteiro']` e `defaultType: 'inteiro'`; `campoVariavel(['real', 'cadeia'])` tem `defaultType: 'real'`; a lista passada não é a mesma referência guardada (cópia). Deve falhar até T003 (FR-003; research R-06) (RF-05)
- [X] T003 Em `src/blocos/campo-variavel.js`, `campoVariavel(tipos = TIPOS_VARIAVEL)`: `variableTypes: [...tipos]`, `defaultType: tipos[0]`; atualizar o comentário do topo (spec 005). Rodar até T002 passar e conferir que `blocos-entrada-saida.test.js` e `blocos-variaveis.test.js` continuam passando (depende de T002) (FR-003) (RF-05)
- [X] T004 [P] Em `tests/unidade/gerador.test.js`, `describe('ctx.tipoVariavel (spec 005)')`, com um bloco de teste num registro próprio que emite `ctx.tipoVariavel(bloco, 'VAR')` numa linha: devolve `inteiro`, `real`, `cadeia` e `logico` para variáveis desses tipos; `undefined` para campo vazio, `{ id }` inexistente e campo ausente; não registra aviso. Deve falhar até T005 (research R-06) (RF-05, RF-08)
- [X] T005 Em `src/portugol/gerador.js`, acrescentar `ctx.tipoVariavel(bloco, campo)` que resolve o `{ id }` (ou o id em texto) como `ctx.variavel` e devolve `variaveisPorId.get(id)?.tipo`, sem aviso. Rodar até T004 passar (depende de T004) (research R-06; princípio II) (RF-05, RF-08)

### Blocos `enquanto` e `para` no núcleo

- [X] T006 [P] Criar `tests/unidade/blocos-repeticao.test.js` conforme [contracts/blocos-repeticao.md](contracts/blocos-repeticao.md#garantias-testadas-testsunidadeblocos-repeticaotestjs), com um registro próprio (`criarRegistro()`) contendo `BLOCO_ENQUANTO`, `BLOCO_PARA` e os blocos já existentes que os exemplos usam (`BLOCO_ESCREVA`, `BLOCO_TEXTO`, `BLOCO_NUMERO`, `BLOCO_LOGICO`, `BLOCO_VARIAVEL`, `BLOCO_VARIAVEL_RECEBE`, `BLOCO_ARITMETICO`, `BLOCO_NEGATIVO`, `BLOCO_RELACIONAL`, `BLOCO_SE`, `BLOCO_LEIA`), gerando com `gerarPortugol(projeto, registro)`:
  - **História 1, cenário 1**: `para i de (numero 1) até (numero 5)`, sem `PASSO`, com `escreva(variavel i)` → as linhas exatas `    para i de 1 ate 5 faca`, `        escreva(i)`, `    fim_para`, e o texto não contém `passo` (FR-005);
  - **História 1, cenário 2**: de `5` até `1` com `PASSO` = `negativo(numero 1)` → `    para i de 5 ate 1 passo -1 faca`;
  - de `1` até `aritmetico(n * 2)` com passo `variavel k` → `para i de 1 ate n * 2 passo k faca`, sem aviso;
  - **História 2, cenário 1**: `enquanto (relacional n > 0)` com `escreva(n)` e `n recebe n - 1` → `    enquanto n > 0 faca`, os dois comandos com 8 espaços, `    fim_enquanto`;
  - `se` dentro de `para` dentro de `enquanto`: 4 espaços a mais por nível, cada um com o seu fechamento (FR-008);
  - corpos vazios: só a abertura e o fechamento, sem aviso;
  - avisos da tabela do [data-model.md](data-model.md#avisos), com `tipoBloco`, `encaixe` e `mensagem` exatos: condição vazia (`CONDICAO`, "Falta a condição do bloco enquanto"); variável vazia e `{ id }` inexistente (`VAR`, "Falta a variável de controle do bloco para"); variável `real` (`VAR`, "A variável de controle do bloco para precisa ser do tipo inteiro"); de vazio (`DE`, "Falta o valor inicial (de) do bloco para"); até vazio (`ATE`, "Falta o valor final (até) do bloco para"); passo `0`, `00`, `0,0` e `negativo(0)` (`PASSO`, "O passo do bloco para não pode ser zero: o laço nunca terminaria"), cada um com **só** esse aviso (o `0,0` não ganha o de casas decimais; data-model, "Avisos"); `1.5` em de, `3.0` em até e `0.5` no passo (cada encaixe, "O bloco para só conta com números inteiros: tire as casas decimais"); passo `variavel k` e passo `aritmetico` sem aviso; ordem dos avisos: variável, de, até, passo;
  - `valorFixo`: `numero '7'` → `'7'`; `numero '007'` → `'7'`; `numero '1,5'` → `'1.5'`; `negativo(numero 1)` → `'-1'`; `negativo(aritmetico)` → `null`; `numero 'abc'` → `null`; `undefined` → `null`;
  - definições exatamente como no contrato: `enquanto` com `CONDICAO` `check: ['Logico']` e `FACA` `input_statement`; `para` com `args0[0]` igual a `campoVariavel(['inteiro'])` (nome `VAR`), `DE`, `ATE` e `PASSO` com `check: ['Numero']`, `FACA` `input_statement`; os dois com `previousStatement: null`, `nextStatement: null`, `inputsInline: true`, `colour: COR_REPETICAO` (`120`) e as *tooltips* exatas do contrato (a do `para` contém "incluindo os dois", FR-006);
  - entradas: `tipo`/`rotulo`, `categoria: 'comando'`, `areas: ['FACA']`; o `enquanto` sem variantes; o `para` com `sem passo` e `com passo` e o `presente` das duas formas.
  Deve falhar até T007 (FR-001 a FR-008; research R-03 a R-06) (RF-05)
- [X] T007 Criar `src/blocos/repeticao.js` (puro, sem Blockly) com `COR_REPETICAO`, `valorFixo`, `BLOCO_ENQUANTO` e `BLOCO_PARA` exatamente como em [contracts/blocos-repeticao.md](contracts/blocos-repeticao.md); `valorFixo` usa `normalizarNumero` de `src/blocos/valores.js`; zero = `Number(valor) === 0`; casas decimais = o valor contém `.`. `gerar` usa só `ctx.variavel`, `ctx.tipoVariavel`, `ctx.valor`, `ctx.aviso`, `ctx.linha` e `ctx.comandos`. Comentário do topo citando RF-05, research R-03 a R-06 e a regra da 006 (P-1). Implementar até T006 passar (depende de T003, T005, T006) (FR-001 a FR-008; P-1) (RF-05, RF-06)
- [X] T008 [P] Em `tests/unidade/tipos.test.js`, no `describe('matriz do SC-002')`, acrescentar as colunas `'enquanto CONDICAO': checkEfetivo(BLOCO_ENQUANTO, 'CONDICAO')`, `'para DE'`, `'para ATE'` e `'para PASSO'` (com `checkEfetivo(BLOCO_PARA, …)`; importar de `src/blocos/repeticao.js`, os blocos ainda não estão no `registroPadrao`) com os valores do [research.md](research.md#r-07-tipos-dos-encaixes-p-1-sc-002-da-006), R-07: `enquanto` = 1 só para `logico`, `relacional`, `e_ou`, `nao`, `variavel logico` e `variavel sem variável`; `para` = 1 para `numero`, `aritmetico`, `negativo`, `variavel inteiro`, `variavel real` e `variavel sem variável`, 0 para os demais. Rodar até passar (depende de T007) (SC-002 da 006; P-1) (RF-05, RF-06)

**Checkpoint**: os dois blocos geram o Portugol certo com todos os avisos, e os tipos dos
encaixes estão na matriz.

**Commit**: `005/T001-T008 (RF-05, RF-06, RF-08): blocos enquanto e para no núcleo, campo com tipos e ctx.tipoVariavel`

---

## Fase 2: História 1 - Repetir uma quantidade conhecida de vezes (Prioridade: P1) 🎯 MVP

**Objetivo**: o `para` está no editor (registro, categoria "Repetição"), só aceita variável
inteira e números, bloqueia o passo fixo zero, explica em pt-BR os erros de contagem e roda
no Core real com passo positivo, negativo, ausente e intervalo vazio; a Saída com 1.500
linhas e o `leia` em laço passam a ser provados com blocos (P-2, P-3).

**Teste independente**: montar `para i de 1 ate 5 faca escreva(i)` e ver 1 a 5 na Saída.

### Registro e caixa de blocos

- [X] T009 [US1] Registrar `BLOCO_PARA` no `registroPadrao` em `src/blocos/registro.js` (depois do `se`; atualizar o comentário "a 005 acrescenta os seus"); em `tests/unidade/registro.test.js`, acrescentar que o registro padrão contém o `para` com `areas: ['FACA']` e as variantes `sem passo` e `com passo`; em `tests/unidade/tipos.test.js`, trocar `checkEfetivo(BLOCO_PARA, …)` por `encaixe('para', …)` (depende de T007, T008) (FR-002) (RF-05)
- [X] T010 [P] [US1] Em `tests/unidade/caixa-blocos.test.js`, `describe('caixa de blocos da spec 005')`, conforme [editor-repeticao.md](contracts/editor-repeticao.md#categoria-repetição-srcblocoscaixa-blocosjs-núcleo): a categoria `{ kind: 'category', name: 'Repetição', custom: CATEGORIA_REPETICAO, colour: COR_REPETICAO }` logo depois de "Decisão" (procurar pelo nome); `conteudoCategoriaRepeticao([])`, `(undefined)` e só com `real`/`cadeia`/`logico` = `[rótulo TEXTO_PARA_SEM_INTEIRO, botão 'Criar variável…' com BOTAO_CRIAR_VARIAVEL]`; com `[a: inteiro, x: real, b: inteiro]` = o `para` com `fields.VAR.id` de `b` (a **última inteira**), `inputs.DE` = `numero '1'`, `inputs.ATE` = `numero '5'` e sem `PASSO`. **Nesta fase** a categoria ainda não tem o `enquanto` (entra na US2, T021). Deve falhar até T011 (research R-09) (RF-05)
- [X] T011 [US1] Em `src/blocos/caixa-blocos.js`, exportar `CATEGORIA_REPETICAO`, `TEXTO_PARA_SEM_INTEIRO` e `conteudoCategoriaRepeticao(variaveis)`, e acrescentar a categoria "Repetição" (importar `COR_REPETICAO`) depois de "Decisão"; atualizar o comentário do topo. Em `src/ui/workspace.js`, registrar o callback `ws.registerToolboxCategoryCallback(CATEGORIA_REPETICAO, () => conteudoCategoriaRepeticao(variaveisDoWorkspace(ws)))` ao lado dos de Variáveis e Entrada e saída. Rodar até T010 passar (depende de T009, T010) (research R-09) (RF-05)

### Encaixes e variável de controle (headless; P-1)

- [X] T012 [P] [US1] Criar `tests/unidade/repeticao-blockly.test.js` (headless, no modelo de `decisao-blockly.test.js`: `registrarTudo()` com o campo de variável, os mutadores do escreva e do se, o validador de número, o verificador `meupia`, e as definições do `registroPadrao`), com as variáveis `i` e `n` (inteiro), `x` (real), `nome` (cadeia) e `ok` (lógico), `describe('para (História 1)')`:
  - `CampoVariavel.dropdownCreate` do campo `VAR` de um `para` lista só `i` e `n` (FR-003);
  - `podeEncaixar` em `DE`, `ATE` e `PASSO`: `false` para `logico`, `texto`, `relacional`, `variavel ok` e `variavel nome`; `true` para `numero`, `negativo`, `aritmetico`, `variavel i` e `variavel x` (P-1, FR-004);
  - com `i` no campo, `aplicarTipoVariavel(ws, 'v-i', 'real')` mantém `i` no campo e `gerarPortugol` do workspace serializado traz o aviso "A variável de controle do bloco para precisa ser do tipo inteiro"; `aplicarTipoVariavel(ws, 'v-i', 'inteiro')` tira o aviso (research R-06);
  - `Blockly.serialization.blocks.save` / `append` de um `para` com e sem passo preserva os encaixes.
  Escrever e rodar até passar; se falhar, corrigir só a definição em `src/blocos/repeticao.js` (depende de T009) (FR-002 a FR-004; P-1) (RF-05, RF-06)

### Erros de execução em pt-BR (R-08)

- [X] T013 [P] [US1] Em `tests/unidade/executor-core.test.js`, `describe('traduções do para (spec 005)')`, conforme [editor-repeticao.md](contracts/editor-repeticao.md#mensagens-de-execução-srccoreexecutor-corejs-adapter): `traduzirErroExecucao('ValueError', 'passo do laço para não pode ser zero', rastro)` → `mensagem` `O passo do para ficou zero: o laço nunca terminaria.` e `detalhe` = rastro; `('TypeError', "'float' object cannot be interpreted as an integer", rastro)` → `O para só conta com números inteiros: de, até e passo não podem ter casas decimais.`; um `TypeError` com outro texto continua com a mensagem de tipos de hoje; o `ValueError` do real com vírgula (010) não muda. Deve falhar até T014 (research R-08; princípio V) (RF-05, RF-09)
- [X] T014 [US1] Em `src/core/executor-core.js`, acrescentar as duas traduções (texto reconhecido por `includes`/regex, antes da tradução por tipo) com comentário citando a spec 005, research R-08. Rodar até T013 passar (depende de T013) (RNF-03) (RF-05, RF-09)

### Aceitação (SC-001; P-2, P-3)

- [X] T015 [P] [US1] Criar em `tests/aceitacao/casos/`, no formato dos casos existentes (validados por `suporte/validar-caso.js`), todos com `portugolEsperado` e `requisitos` incluindo `RF-05` e `RNF-07`:
  - `para-contagem.json` (`nome: "Contagem"`): `i` (inteiro); `para i de 1 ate 5` sem passo com `escreva(i)`; `saidaEsperada: "1\n2\n3\n4\n5\n"`; `descricao` citando a História 1, cenário 1 (variante "sem passo");
  - `para-regressivo.json` (`nome: "Regressivo"`): de `5` até `1`, passo `negativo(numero 1)`; `saidaEsperada: "5\n4\n3\n2\n1\n"`; História 1, cenário 2 (variante "com passo", passo negativo);
  - `para-passo-dois.json` (`nome: "PassoDois"`): de `1` até `10` passo `2`; `saidaEsperada: "1\n3\n5\n7\n9\n"` (passo positivo);
  - `para-intervalo-vazio.json` (`nome: "IntervaloVazio"`): de `5` até `1` sem passo com `escreva(i)`, depois `escreva(texto "fim")`; `saidaEsperada: "fim\n"`; História 1, cenário 3 (regra do Core, research R-02).
  Rodar `npm run test:aceitacao` (depende de T009) (SC-001; FR-002, FR-005, FR-006) (RF-05, RNF-07)
- [X] T016 [P] [US1] Criar `tests/aceitacao/casos/repeticao-leia-soma.json` (`nome: "SomaTres"`): `i`, `x` e `soma` (inteiro); `soma recebe 0`; `para i de 1 ate 3` com `leia(x)` e `soma recebe soma + x`; depois `escreva(soma)`; `entrada: ["4", "5", "6"]`; `saidaEsperada: "15\n"`; `descricao` citando a **pendência P-3 da 010** (um `leia` em laço pede a cada volta; a suíte interativa da 010 em `executar.test.js` confere um pedido por volta); `requisitos: ["RF-05", "RF-10", "RNF-07"]`. Rodar `npm run test:aceitacao` (depende de T009) (P-3) (RF-05, RF-10, RNF-07)
- [X] T017 [US1] Criar `tests/aceitacao/suporte/projetos-repeticao.js` com funções que montam projetos em blocos (mesmo formato dos casos) para o R-11: `projetoMilEQuinhentas()` (`para i de 1 ate 1500` com `escreva(i)`), `projetoLeiaNoPara()` (`nome` cadeia, `i` inteiro; `para i de 1 ate 2` com `leia(nome)` e `escreva("Oi, ", nome)`) e `projetoPassoVariavelZero()` (`k recebe 0`; `para i de 1 ate 3 passo k` com `escreva(i)`). Em `tests/aceitacao/executar.test.js`: o teste "mais de 1.000 linhas" passa a usar `gerarPortugol(projetoMilEQuinhentas())` (esperar zero avisos e as 1.500 linhas inteiras e na ordem; **P-2**); "um leia num enquanto pede a cada volta" vira "um leia num para pede a cada volta" com `projetoLeiaNoPara()` (pedidos `['nome', 'nome']`, linhas `Oi, Ana`, `Oi, Bia`; **P-3**); novo teste: `projetoPassoVariavelZero()` → `erro_execucao` com a mensagem `O passo do para ficou zero: o laço nunca terminaria.` (R-08); novo teste (**SC-002**, analyze C1): `projetoPassoFixoZero()` (`para i de 1 ate 3 passo 0` com `escreva(i)`, também no módulo de apoio) → `gerarPortugol` traz o aviso do passo zero, e o `criarControladorExecucao` da 009 (`src/execucao/controlador.js`), com `obterPrograma` devolvendo esse `{ codigo, avisos }`, uma Saída falsa e um executor espião, ao `executar()` escreve o motivo do bloqueio, mostra o aviso e **não** chama `executor.executar`. Atualizar os comentários que dizem "os blocos de repetição são da spec 005". Rodar `npm run test:aceitacao` (depende de T009, T014) (P-2, P-3; research R-11) (RF-05, RF-09, RF-10)

### Verificação

- [X] T018 [US1] Rodar `npm test` e `npm run build`. Depois percorrer no navegador (`npm run dev`) os roteiros 1 a 10, 13, 14 e 17 do [quickstart.md](quickstart.md#b-no-navegador) (categoria sem inteiro, `para` de 1 a 5, passo −1, intervalo vazio, dicas, passo 0, `3,5`, menu só com inteiras, mudar o tipo, encaixes de/até/passo, 1.500 linhas, `leia` no `para`, passo numa variável zero). Anotar o navegador e o que não puder ser conferido no quadro "Conferências manuais pendentes" (depende de T009–T017) (FR-002 a FR-007, SC-001, SC-002; P-1, P-2, P-3) (RF-05)
  - Feito no painel do navegador do Claude (Chromium, servidor do Vite, painel visível), 2026-11-17, montando os blocos pelo Blockly da página (serialização e conexões) e clicando em Executar: sem inteiro, a categoria "Repetição" mostra a orientação e o botão (1); com `i`, o `para` vem com `i`, de 1 até 5, sem passo, e a dica diz "incluindo os dois" (2, 5); Portugol `para i de 1 ate 5 faca` e Saída `1` a `5` (2); passo −1 dá `5` a `1` (3); sem passo, de 5 até 1, nada (4); passo 0 e até `3,5` bloqueiam Executar com o aviso certo (6, 7); o menu da variável mostra só `i` com `x` real e `ok` lógico criados (8); mudar `i` para real mantém `i` e bloqueia com "precisa ser do tipo inteiro", e um desfazer volta para inteiro e executa (9); em de, até e passo, lógico, texto e `ok` são recusados e número, conta, negativo e `i` encaixam, pelo verificador da página (10); 1.500 linhas inteiras e na ordem (13); `leia(nome)` no `para` pede uma vez por volta, `Ana`, `Bia`, `Caio` dão `Oi, Ana`, `Oi, Bia`, `Oi, Caio` sem repetir linhas (14); `k recebe 0` e passo `k` dão o erro "O passo do para ficou zero: o laço nunca terminaria." com os detalhes técnicos recolhidos (17). Arrastar com o mouse e o Ctrl+Z pelo teclado ficam no quadro "Conferências manuais pendentes".

**Checkpoint**: o `para` funciona no editor e no Core; passo fixo zero não executa.

**Commit**: `005/T009-T018 (RF-05, RF-06, RF-09, RF-10, RNF-07): bloco para no editor, tipos, passo zero e Saída longa com blocos`

---

## Fase 3: História 2 - Repetir enquanto uma condição vale (Prioridade: P1)

**Objetivo**: o `enquanto` está no editor, só aceita condição lógica e roda no Core; o Parar
num laço infinito passa a ser provado com blocos (P-2); `se` encaixa nos dois laços (P-4) e
os laços se aninham (FR-008).

**Teste independente**: montar uma contagem regressiva com `enquanto` e conferir a saída.

### Registro e caixa de blocos

- [X] T019 [US2] Registrar `BLOCO_ENQUANTO` no `registroPadrao` em `src/blocos/registro.js` (antes do `para`); em `tests/unidade/registro.test.js`, o registro padrão contém o `enquanto` com `areas: ['FACA']` e a variante implícita "padrão"; em `tests/unidade/tipos.test.js`, trocar `checkEfetivo(BLOCO_ENQUANTO, …)` por `encaixe('enquanto', 'CONDICAO')`. No mesmo passo, criar `tests/aceitacao/casos/enquanto-regressiva.json` (`nome: "Regressiva"`): `n` (inteiro); `n recebe 3`; `enquanto (relacional n > 0)` com `escreva(n)` e `n recebe n - 1`; `saidaEsperada: "3\n2\n1\n"`; `portugolEsperado`; `descricao` citando a História 2 e o teste independente; `requisitos: ["RF-05", "RNF-07"]` (a meta-aceitação passa a exigir o `enquanto`) (depende de T007, T008, fase 2) (FR-001; SC-001) (RF-05, RNF-07)
- [X] T020 [P] [US2] Em `tests/unidade/caixa-blocos.test.js`, no `describe('caixa de blocos da spec 005')`: o primeiro item de `conteudoCategoriaRepeticao` é sempre `{ kind: 'block', type: 'enquanto' }`, com e sem variáveis inteiras (os demais itens como no T010). Deve falhar até T021 (research R-09) (RF-05)
- [X] T021 [US2] Em `src/blocos/caixa-blocos.js`, `conteudoCategoriaRepeticao` passa a começar pelo `enquanto`. Rodar até T020 passar (depende de T020) (research R-09) (RF-05)

### Encaixes da condição e `se` nos laços (headless; P-1, P-4)

- [X] T022 [US2] Em `tests/unidade/repeticao-blockly.test.js`, `describe('enquanto (História 2)')`: `podeEncaixar` na `CONDICAO` é `false` para `numero`, `texto`, `aritmetico`, `negativo`, `variavel i`, `variavel x` e `variavel nome`, e `true` para `relacional`, `e_ou`, `nao`, `logico` e `variavel ok`; com `ok` na condição, `aplicarTipoVariavel(ws, 'v-ok', 'inteiro')` desencaixa o bloco e `gerarPortugol` mostra `enquanto ??? faca` com o aviso "Falta a condição do bloco enquanto"; **um** `ws.undo(false)` volta o tipo e o bloco. Rodar até passar; se falhar, corrigir só a definição (depende de T019) (FR-001; P-1) (RF-05, RF-06)
- [X] T023 [US2] Em `tests/unidade/repeticao-blockly.test.js`, `describe('aninhar (FR-008, P-4)')`, com `podeEncaixarComando` (`ws.connectionChecker.canConnect(filho.previousConnection, conexao, false)`): um `se` (com e sem senão) encaixa no `FACA` do `para` e do `enquanto`; um `para` encaixa no `FACA` do `enquanto` e do `para`; um `enquanto` encaixa no `FACA` do `para`, no `ENTAO` e no `SENAO` de um `se`; `gerarPortugol` do workspace serializado com `se` dentro de `para` dentro de `enquanto` dá a indentação do contrato (depende de T019) (FR-008; P-4) (RF-05, RF-04)

### Aceitação e execução real (SC-001; P-2, P-4)

- [X] T024 [P] [US2] Criar em `tests/aceitacao/casos/`, com `portugolEsperado` e `requisitos` incluindo `RF-05` e `RNF-07`:
  - `repeticao-se-par-impar.json` (`nome: "ParImpar"`): `i` e `n` (inteiro); `para i de 1 ate 4` com `se (relacional (aritmetico i % 2) = 0)` → `escreva(i)`, senão `escreva("impar")`; depois `n recebe 3` e `enquanto n > 0` com `se n = 2 entao escreva("dois")` e `n recebe n - 1`; `saidaEsperada: "impar\n2\nimpar\n4\ndois\n"`; `descricao` citando a **pendência P-4 da 004** (`se` dentro de `para` e de `enquanto`); `requisitos` com `RF-04`;
  - `repeticao-aninhada.json` (`nome: "Aninhada"`): `i`, `j` e `n` (inteiro); `para i de 1 ate 2` com `para j de 1 ate 2` e `escreva(i, j)`; depois `para i de 1 ate 2` com `n recebe i` e `enquanto n > 0` com `escreva(n)` e `n recebe n - 1`; depois `n recebe 1` e `enquanto n > 0` com `se verdadeiro` contendo `para i de 1 ate 2` com `escreva(i)` e, depois do `se`, `n recebe 0`; `saidaEsperada` com as linhas na ordem (`11`, `12`, `21`, `22`, `1`, `2`, `1`, `1`, `2`); FR-008 e casos de borda (laços aninhados);
  - `repeticao-casos-de-borda.json` (`nome: "BordaRepeticao"`): `i`, `n` e `k` (inteiro); `enquanto falso` vazio; `para i de 1 ate 3` vazio, depois `escreva(i)`; `n recebe 2`, `k recebe 2`; `para i de 1 ate n * 2 passo k` com `escreva(i)`; `saidaEsperada: "3\n1\n3\n"`; casos de borda (corpos vazios) e FR-004 (expressão no até, variável no passo).
  Rodar `npm run test:aceitacao` (depende de T019) (SC-001; FR-004, FR-008; P-4) (RF-05, RF-04, RNF-07)
- [X] T025 [US2] Em `tests/aceitacao/suporte/projetos-repeticao.js`, acrescentar `projetoInfinito()` (`i` inteiro; `i recebe 0`; `enquanto (logico verdadeiro)` com `i recebe i + 1` e `escreva(i)`) e `projetoLeiaInfinito()` (`nome` cadeia; `enquanto verdadeiro` com `leia(nome)` e `escreva(nome)`). Em `tests/aceitacao/executar.test.js`: "Parar interrompe um enquanto infinito" passa a usar `gerarPortugol(projetoInfinito())` (zero avisos, dois lotes, Parar → `interrompido`, linhas `1`, `2`, `3`, a execução seguinte funciona; **P-2**); novo teste "Parar com o pedido aberto num enquanto" com `projetoLeiaInfinito()` (**P-3**). Tirar o Portugol escrito à mão desses testes e os comentários "o bloco enquanto é da 005". Rodar `npm run test:aceitacao` (depende de T017, T019) (P-2, P-3; research R-11) (RF-05, RF-09, RF-10)

### Verificação

- [X] T026 [US2] Rodar `npm test`; percorrer os roteiros 11, 12, 15 e 16 do [quickstart.md](quickstart.md#b-no-navegador) (contagem regressiva, Parar no `enquanto verdadeiro`, `se` dentro dos dois laços, aninhamento e corpos vazios) e a parte do roteiro 10 da condição do `enquanto`. Anotar o navegador e o que ficar pendente (depende de T019–T025) (FR-001, FR-008; P-1, P-2, P-4) (RF-05)
  - Feito no painel do navegador do Claude (Chromium, painel visível), 2026-11-17: a categoria "Repetição" mostra o `enquanto` e o `para`; `n recebe 3` e `enquanto n > 0` geram `enquanto n > 0 faca` … `fim_enquanto` e a Saída `3`, `2`, `1` (11); na condição, número, texto e `n` são recusados e comparação, `verdadeiro`, `e`/`ou`, `não` e `ok` encaixam, pelo verificador da página (10); a dica do `enquanto` em pt-BR fala do Parar; `enquanto verdadeiro` com `i recebe i + 1` e `escreva(i)` mostra os números rolando (`1`, `2`, `3`…), o botão Parar interrompe com "Execução interrompida pelo usuário" e o Executar seguinte mostra `Olá, mundo!` (12); os projetos de `repeticao-se-par-impar`, `repeticao-aninhada` e `repeticao-casos-de-borda`, carregados na página, mostram o mesmo Portugol dos casos (fora o nome do programa), sem aviso, e as saídas esperadas (15, 16). Arrastar o `se` para dentro dos laços com o mouse fica no quadro "Conferências manuais pendentes".

**Checkpoint**: os dois laços funcionam, se aninham e recebem `se`; as quatro pendências estão
provadas com blocos.

**Commit**: `005/T019-T026 (RF-05, RF-04, RF-06, RF-09, RF-10, RNF-07): bloco enquanto, Parar e se nos laços`

---

## Fase 4: Entrega

**Objetivo**: cobertura, README e conferência de pt-BR.

- [X] T027 Conferir no navegador as dicas, os avisos e as mensagens dos laços em pt-BR (roteiros 5, 6 e 17) e a categoria "Repetição" entre "Decisão" e "Valores". Rodar `npm test` e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/blocos/repeticao.js` no relatório; conferir que `tests/unidade/versao-unica.test.js` passa; versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 2 e 3) (RNF-03, RNF-04, RNF-02)
  - Navegador (2026-11-17): dicas do `para` e do `enquanto`, os avisos de passo zero e casas decimais e a mensagem do passo numa variável zero em pt-BR (roteiros 5, 6 e 17, registrados no T018); categoria "Repetição" entre "Decisão" e "Valores". Cobertura do núcleo: 99,6% em linhas e 93,9% em branches, com `src/blocos/repeticao.js` no relatório (100% em linhas); `versao-unica.test.js` passa; README com 1097 testes.

**Commit**: `005/T027 (RF-05, RNF-02, RNF-03, RNF-04): cobertura e README`

---

## Fase 5: Documentação das outras specs

**Objetivo**: registrar nas specs de origem que as pendências foram resolvidas (research
R-13).

- [X] T028 [P] Atualizar as specs de origem, com link para este `tasks.md` e para o caso ou teste de cada pendência:
  - `specs/006-blocos-operadores/contracts/tipos-encaixe.md`: na "Matriz do SC-002", as colunas "`enquanto` condição" e "`para` de/até/passo" (valores do research R-07); em "Regra para as specs 004 e 005", as linhas do `enquanto` e do `para`: "aplicada na 005 ([blocos-repeticao.md](../../005-blocos-repeticao/contracts/blocos-repeticao.md))" (**P-1**);
  - `specs/006-blocos-operadores/plan.md`, "Pendências para outras specs", linha da 004 e 005: "005 ✅" (**P-1**);
  - `specs/009-executar-no-core/plan.md`, "Pendências para outras specs", linha da 005: "✅ resolvida pela 005" com link para `tests/aceitacao/executar.test.js` (**P-2**);
  - `specs/010-entrada-de-dados/plan.md`, "Pendências para outras specs", linha da 005: o mesmo, com link para `repeticao-leia-soma.json` (**P-3**);
  - `specs/004-blocos-se-senao/plan.md`, "Pendências para outras specs", linha da 005: o mesmo, com link para `repeticao-se-par-impar.json` (**P-4**);
  - `specs/005-blocos-repeticao/spec.md`, Premissas: "(✅ conferido)" nas quatro linhas das pendências; `**Status**: Rascunho` → `**Status**: Implementada`.
  (RF-05, RF-04, RF-06, RF-09, RF-10)
- [X] T029 [P] Em `specs/008-portugol-valido/contracts/registro-blocos.md`, "Contexto de geração (`ctx`)": acrescentar a linha `ctx.tipoVariavel(bloco, campo) → string | undefined` (tipo da variável do campo em `projeto.variaveis`, sem aviso; spec 005, research R-06) e, na linha do `ctx.aviso`, trocar "(ex.: passo 0 na 005)" por um link para o `para` real em `src/blocos/repeticao.js` ([blocos-repeticao.md](../../005-blocos-repeticao/contracts/blocos-repeticao.md)) (RF-08, RF-05)
- [X] T030 Rodar `npm test` uma vez antes do commit e, na descrição do PR, registrar: as quatro pendências fechadas (P-1 a P-4, com origem), o comportamento do Core com `enquanto 1`, passo zero e reais (research R-02), o aviso de casas decimais além do texto do FR-004 (plan, ponto de atenção 3) e os navegadores usados nos roteiros (depende de T028, T029) (RNF-05)
  - `npm test` rodado antes do commit (1097 testes passando). Nenhuma lacuna nova do Core: aceitar `enquanto 1` e variável de controle não inteira é a conversão do Python, e o passo zero e os reais quebram pela contagem com `range` do Core (research R-02); o editor bloqueia o valor fixo e o adapter traduz o resto (R-05, R-08). O texto do PR ficou no resumo da implementação.

**Commit**: `docs(005) (RF-05, RF-04, RF-06, RF-08, RF-09, RF-10): pendências resolvidas nas specs de origem`

## Conferências manuais pendentes

Os roteiros do quickstart foram percorridos no painel do navegador do Claude com o painel
visível (Portugol em tempo real, Executar, Parar pelo botão, entrada interativa). Os blocos
foram montados pelo Blockly da própria página (serialização e conexões) e os encaixes
conferidos pelo verificador da página, não por arrastar com o mouse. Fica com a dupla repetir
num navegador comum (Chrome, Firefox ou Edge) e anotar o resultado no PR.

**Registro (2026-11-17)**: quem conferir troca a situação para "Conferido", com o navegador e
a data.

| Conferência | O que fazer | Task | Situação |
| --- | --- | --- | --- |
| Arrastar da categoria Repetição | Abrir "Repetição", arrastar o `enquanto` e o `para` para o programa e ver o Portugol aparecer enquanto monta (roteiros 1, 2 e 11). | T018, T026 (registro) | Pendente: navegador comum |
| Arrastar para os encaixes | Arrastar `verdadeiro`, um texto e `ok` para de, até e passo do `para`, e um número e `i` para a condição do `enquanto`, e ver que não encaixam; arrastar números, contas e comparações e ver que encaixam (roteiro 10). | T018, T026 (registro) | Pendente: navegador comum |
| Mudar o tipo pelo menu e Ctrl+Z | No menu do campo do `para`, "Mudar o tipo…" de `i` para real (o diálogo), ver o aviso e apertar Ctrl+Z (roteiro 9). | T018 (registro) | Pendente: navegador comum |
| Arrastar o `se` para dentro dos laços | Arrastar um `se` (com senão) para dentro do `para` e do `enquanto` e montar o par/ímpar (roteiro 15). | T026 (registro) | Pendente: navegador comum |

---

## Dependências e ordem

### Entre fases

- **Fundação (1)** → **US1 (2)** → **US2 (3)** → **Entrega (4)** → **Documentação (5)**.
- A US1 registra o `para` da Fundação; a US2 registra o `enquanto` e usa o `para` registrado
  nos casos de aninhamento e do `se` (P-4) e o módulo de apoio criado no T017.
- As duas histórias mexem em `registro.js`, `caixa-blocos.js`, `repeticao-blockly.test.js` e
  `executar.test.js`; por isso seguem em sequência, na ordem da spec.
- Como há **um commit por fase**, uma fase só começa depois do commit da anterior.

### Dentro de cada fase

Testes primeiro (falhando), depois o núcleo (`src/blocos/`, `src/portugol/`, `src/core/`),
depois a interface (`src/ui/`) e por último a verificação no navegador.

### Oportunidades de paralelismo

- **Fundação**: T001 primeiro; depois T002, T004 e T006 juntos; T003 e T005 em seguida
  (arquivos diferentes); T007 depois deles; T008 fecha.
- **US1**: T009 primeiro; depois T010, T012, T013, T015 e T016 juntos; T011, T014 e T017 em
  seguida; T018 fecha.
- **US2**: T019 primeiro; depois T020 e T024 juntos; T021, T022, T023 e T025 em seguida
  (T022 e T023 no mesmo arquivo, em sequência); T026 fecha.
- **Documentação**: T028 e T029 juntos.

### Exemplo: Fundação

```text
Antes:   T001 base herdada verde
Juntas:  T002 campoVariavel (teste) | T004 ctx.tipoVariavel (teste) | T006 blocos-repeticao (teste)
Depois:  T003 campo-variavel.js | T005 gerador.js → T007 repeticao.js → T008 matriz → commit
```

### Exemplo: História 1

```text
Antes:   T009 registro do para
Juntas:  T010 caixa (teste) | T012 headless | T013 traduções (teste) | T015 casos | T016 leia-soma
Depois:  T011 caixa + workspace | T014 executor-core.js → T017 executar.test.js com blocos → T018 navegador → commit
```

## Estratégia de implementação

### MVP (Fundação + História 1)

Fases 1 e 2. Parar e validar: o `para` aparece na categoria "Repetição", conta de 1 a 5, para
trás com passo −1, não roda no intervalo vazio, recusa passo fixo zero e lógicos nos limites,
e 1.500 linhas e o `leia` em laço funcionam a partir de blocos (P-1 do `para`, P-2 da Saída,
P-3).

### Entrega incremental

1. MVP → contagem com `para` no editor e no Core.
2. + US2 → `enquanto`, Parar com blocos, `se` nos laços e aninhamento (P-1 do `enquanto`,
   P-2 do Parar, P-4).
3. Entrega e documentação → cobertura, README e as specs 004, 006, 008, 009 e 010
   atualizadas.

### Pendências para outras specs

Registradas no [plan.md](plan.md). Não são tasks desta spec:

- **012**: arquivo com variável não inteira no `para` ou encaixe incompatível nos laços
  (editado à mão) chega com o campo vazio ou cai no `BadConnectionCheck` já registrado pela
  006.
