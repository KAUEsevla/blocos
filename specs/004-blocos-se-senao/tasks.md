---

description: "Tasks da spec 004: Blocos de decisão (se/senão)"
---

# Tasks: Blocos de decisão (se/senão)

**Entrada**: documentos de design em `specs/004-blocos-se-senao/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo e testes de
aceitação no Core real (princípio IV, RNF-04, RNF-07). O núcleo (`src/blocos/decisao.js`)
tem testes de unidade escritos antes da implementação. O mutador (interface) é testado
headless no Blockly 12.5.1, como a 006 fez com o verificador. A aceitação roda os casos
novos no `meupia-core` 1.4.1 real. O que só existe na tela é verificado pelo
[quickstart.md](quickstart.md).

**Organização**: Fundação (bloco `se` puro, coluna da matriz de tipos, mutador com ligar e
desligar o senão vazio) e uma fase por história na ordem de prioridade: História 1 (se,
P1) com o registro do bloco e a pendência P-2 → História 2 (senão, P1) → História 3
(aninhar, P2) → entrega → documentação das outras specs.

**Por que o caso `se-senao.json` entra na História 1**: ao registrar o `se` no
`registroPadrao`, a meta-aceitação passa a exigir as duas variantes ("sem senão" e "com
senão"). Sem esse caso no mesmo commit, `npm test` falha.

**Commits (constituição v2.0.0, princípio III)**: **um commit por fase**, feito quando
todas as tasks da fase estão marcadas e com os testes (`npm test`) rodados uma vez antes do
commit, passando. Formato `004/Txxx-Tyyy (RF-xx, …): descrição`, listando as tasks da fase;
tasks não consecutivas são separadas por vírgula. O commit cita todos os requisitos das
suas tasks. A fase de documentação não implementa task de código e usa
`docs(004) (RF-xx, …): descrição`. A linha **Commit** no fim de cada fase traz a mensagem.

**Pendências obrigatórias da 006** (research R-01):

- **P-1** (006, [tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md#regra-para-as-specs-004-e-005); RF-06): a condição do `se` só aceita valores lógicos. T003, T004, T012, T014.
- **P-2** (006, História 2, "montar `se idade >= 18`"; RF-06): conferido no Core real com 20 e com 10. T002, T013, T014.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]** executar algo só quando a condição vale, **[US2]** escolher entre dois
  caminhos, **[US3]** decisões dentro de decisões
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Fundação (bloqueia as histórias)

**Objetivo**: o bloco `se` existe no núcleo (definição, geração, variantes), a regra de tipo
da condição está na matriz do SC-002 e o mutador liga e desliga o senão vazio (contratos
[bloco-se.md](contracts/bloco-se.md) e [editor-se.md](contracts/editor-se.md)). O bloco
ainda não está no `registroPadrao`.

### Base herdada

- [X] T001 Na branch `004-blocos-se-senao` (rebaseada na `main` com a 010), rodar `npm install` e `npm test` (unidade + aceitação no Core real) e confirmar que tudo passa. Se algo falhar, parar e registrar: a falha é da base, não desta spec. A verificação não altera arquivos; se exigir correção na base, ela entra no commit desta fase (RF-04)

### Bloco `se` no núcleo

- [X] T002 [P] Criar `tests/unidade/blocos-decisao.test.js` conforme [contracts/bloco-se.md](contracts/bloco-se.md#garantias-testadas-testsunidadeblocos-decisaotestjs), com um registro próprio (`criarRegistro()`) contendo `BLOCO_SE` e os blocos já existentes que os exemplos usam (`BLOCO_ESCREVA`, `BLOCO_TEXTO`, `BLOCO_NUMERO`, `BLOCO_LOGICO`, `BLOCO_VARIAVEL`, `BLOCO_RELACIONAL`, `BLOCO_E_OU`, `BLOCO_NAO`, `BLOCO_LEIA`), gerando com `gerarPortugol(projeto, registro)`:
  - **P-2 / História 1, cenário 1**: `se (relacional >= idade 18)` com `escreva("Maior")` → as linhas exatas `    se idade >= 18 entao`, `        escreva("Maior")`, `    fim_se`;
  - **História 2, cenário 1**: com `extraState: { senao: true }` e `escreva("Menor")` no `SENAO` → `senao` entre os ramos e um único `fim_se`;
  - **História 3, cenário 1**: `se` dentro do `SENAO` de outro → cada um com o seu `fim_se`, o interno 4 espaços mais à direita;
  - 6 níveis de `se verdadeiro` aninhados: o `escreva` do fundo com 28 espaços (4 do `inicio` + 6 × 4) e os `fim_se` na ordem inversa (FR-005);
  - `ENTAO` e `SENAO` vazios: `se ok entao` / `senao` / `fim_se`, sem aviso;
  - condição sem parênteses com `e_ou` e `nao` (`se nao (idade > 10) e ok entao`);
  - condição vazia → `se ??? entao` e um aviso `{ tipoBloco: 'se', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco se' }`;
  - `extraState: { senao: 'sim' }` (ou `1`, `'true'`, `false`) com `inputs.SENAO` preenchido → sem `senao`, o `SENAO` não aparece;
  - `temSenao`: `true` só com `senao === true`; `undefined`, sem `extraState`, `false`, `'true'`, `1` → `false`;
  - `mensagemTirarSenao(1)` = `Tirar o senão apaga 1 bloco que está dentro dele.`; `mensagemTirarSenao(3)` = `Tirar o senão apaga 3 blocos que estão dentro dele.`;
  - definição: `type: 'se'`, `message0: 'se %1 então'`, `CONDICAO` `input_value` com `check: ['Logico']`, `message1: '%1'` com `ENTAO` `input_statement`, `previousStatement: null`, `nextStatement: null`, `inputsInline: true`, `mutator: 'mutador_se'`, `colour: COR_DECISAO` (`210`) e a *tooltip* exata "Faz os comandos de dentro só quando a condição for verdadeira. Com “senão”, faz os outros comandos quando ela for falsa.";
  - entrada: `tipo`/`rotulo` `'se'`, `categoria: 'comando'`, `areas: ['ENTAO', 'SENAO']`, variantes `sem senão` e `com senão` com o `presente` das duas formas.
  Deve falhar até T003 (FR-001, FR-002, FR-003, FR-005; P-2) (RF-04, RF-06)
- [X] T003 Criar `src/blocos/decisao.js` (puro, sem Blockly) com `COR_DECISAO`, `temSenao`, `mensagemTirarSenao` e `BLOCO_SE` exatamente como em [contracts/bloco-se.md](contracts/bloco-se.md); `gerar` usa só `ctx.valor(bloco, 'CONDICAO', 'a condição')`, `ctx.linha` e `ctx.comandos`. Comentário do topo citando RF-04, research R-03 e a regra da 006 (P-1). Implementar até T002 passar (depende de T002) (FR-001, FR-002, FR-005; P-1) (RF-04, RF-06)
- [X] T004 [P] Em `tests/unidade/tipos.test.js`, no `describe('matriz do SC-002')`, acrescentar a coluna `'se CONDICAO': checkEfetivo(BLOCO_SE, 'CONDICAO')` (importar `BLOCO_SE` de `src/blocos/decisao.js`; o `se` ainda não está no `registroPadrao`) com, por linha: `numero` 0, `texto` 0, `logico` 1, `aritmetico` 0, `negativo` 0, `relacional` 1, `e_ou` 1, `nao` 1, `variavel inteiro` 0, `variavel real` 0, `variavel cadeia` 0, `variavel logico` 1, `variavel sem variável` 1 (research R-05). Rodar até passar (depende de T003) (SC-002; P-1) (RF-04, RF-06)

### Mutador (interface)

- [X] T005 [P] Criar `tests/unidade/decisao-blockly.test.js` (headless, no modelo de `operadores-blockly.test.js`), com um `beforeAll` que registra o campo de variável, o `mutador_escreva`, o validador de número, o verificador `meupia` e `registrarMutadorSe({ confirmarTirarSenao })` (função falsa espiã), e define as definições do `registroPadrao` **mais** `BLOCO_SE.definicao`:
  - `se` novo: sem área `SENAO`, `saveExtraState()` = `null`;
  - `ligarSenao()` cria `SENAO` (rótulo `senão`) e `saveExtraState()` = `{ senao: true }`; **um** `ws.undo(false)` tira a área;
  - `tirarSenao()` com a área vazia tira a área **sem** chamar `confirmarTirarSenao`; um desfazer volta;
  - `loadExtraState({ senao: true })` cria a área; `loadExtraState(null)`, `{ senao: false }` e `{ senao: 'sim' }` não criam;
  - ida e volta: `Blockly.serialization.blocks.save` / `append` com e sem senão preserva `extraState` e os blocos do `SENAO`;
  - no flyout (`isInFlyout`), `ligarSenao` e `tirarSenao` não fazem nada.
  Deve falhar até T006 (FR-002; research R-04) (RF-04)
- [X] T006 Criar `src/ui/mutador-se.js` com `registrarMutadorSe({ confirmarTirarSenao } = {})` (idempotente, como `registrarMutadorEscreva`) e o mixin do contrato [editor-se.md](contracts/editor-se.md#mutador-mutador_se-srcuimutador-sejs): `saveExtraState`, `loadExtraState`, `ligarSenao`, `tirarSenao`; ícone `FieldImage` "+"/"−" no fim da linha da condição, com as dicas `TEXTOS.acrescentarSenao` e `TEXTOS.tirarSenao` (acrescentar as duas chaves em `src/ui/textos.js`); mudança num grupo de eventos com um `BlockChange` de `mutation`, como `mudarQuantidade_` do escreva. **Nesta fase**, `tirarSenao` com blocos na área não faz nada (a confirmação é da US2, T015). Implementar até T005 passar (depende de T003, T005) (FR-002) (RF-04)

**Checkpoint**: o `se` gera o Portugol certo, a condição só aceita lógico na matriz e o
senão vazio liga e desliga no Blockly headless.

**Commit**: `004/T001-T006 (RF-04, RF-06): bloco se no núcleo, tipo da condição e mutador do senão`

---

## Fase 2: História 1 - Executar algo só quando uma condição vale (Prioridade: P1) 🎯 MVP

**Objetivo**: o `se` está no editor (registro, caixa "Decisão"), recusa condição não
lógica e roda no Core real; `se idade >= 18` dá `Maior` com 20 e nada com 10 (P-2).

**Teste independente**: montar `se idade >= 18 entao escreva("Maior")`, executar com 20 e
com 10 e comparar as saídas.

### Registro e testes headless que dependem dele

- [X] T007 [US1] Registrar `BLOCO_SE` no `registroPadrao` em `src/blocos/registro.js` (depois do `leia`; atualizar o comentário "004–005 acrescentam os seus"); em `tests/unidade/registro.test.js`, acrescentar que o registro padrão contém o `se` com `areas: ['ENTAO', 'SENAO']` e as duas variantes (depende de T003) (FR-001) (RF-04)
- [X] T008 [US1] Registrar o `mutador_se` antes do `defineBlocksWithJsonArray` em todos os testes headless que definem o `registroPadrao` inteiro: `tests/unidade/operadores-blockly.test.js` (`registrarTudo`), `tests/unidade/entrada-saida-blockly.test.js` e `tests/unidade/variaveis-blockly.test.js` (chamar `registrarMutadorSe()` ao lado de cada `registrarMutadorEscreva()`); em `tests/unidade/decisao-blockly.test.js`, tirar a definição avulsa de `BLOCO_SE` (agora vem do registro); em `tests/unidade/tipos.test.js`, trocar `checkEfetivo(BLOCO_SE, …)` por `encaixe('se', 'CONDICAO')` (depende de T006, T007) (research R-08) (RF-04)
- [X] T009 [US1] Em `src/ui/workspace.js`, `definirBlocos()`: chamar `registrarMutadorSe()` ao lado de `registrarMutadorEscreva()` (a confirmação entra na US2, T016); atualizar o comentário (spec 004) (depende de T006) (FR-001) (RF-04)

### Caixa de blocos

- [X] T010 [P] [US1] Em `tests/unidade/caixa-blocos.test.js`: acrescentar um `describe('caixa de blocos da spec 004')` que espera a categoria `{ kind: 'category', name: 'Decisão', colour: COR_DECISAO }` logo depois de "Entrada e saída", com `contents` exatamente `[{ kind: 'block', type: 'se' }, { kind: 'block', type: 'se', extraState: { senao: true } }]`; ajustar o `describe('caixa de blocos da spec 003')`, que hoje pega as categorias por posição (`slice(0, 4)` e desestruturação), para procurar pelo nome (o da 006 já procura pelo nome). Deve falhar até T011 (research R-06) (RF-04)
- [X] T011 [US1] Em `src/blocos/caixa-blocos.js`, acrescentar a categoria "Decisão" (importar `COR_DECISAO`) depois de "Entrada e saída", não congelada (como Valores e Contas); atualizar o comentário do topo. Rodar até T010 passar (depende de T003, T010) (research R-06) (RF-04)

### Encaixes da condição (P-1)

- [X] T012 [US1] Em `tests/unidade/decisao-blockly.test.js`, `describe('condição só lógica (P-1)')`, com as variáveis `idade` (inteiro), `nome` (cadeia) e `ok` (lógico): `podeEncaixar` na `CONDICAO` é `false` para `numero`, `texto`, `aritmetico`, `negativo`, `variavel idade` e `variavel nome`, e `true` para `relacional`, `e_ou`, `nao`, `logico` e `variavel ok`; com `ok` encaixado na condição, `aplicarTipoVariavel(ws, 'v-ok', 'inteiro')` desencaixa o bloco (vira bloco de topo) e `gerarPortugol` mostra `se ??? entao` com o aviso "Falta a condição do bloco se"; **um** `ws.undo(false)` volta o tipo `logico` e o bloco na condição. Escrever e rodar até passar; se falhar, corrigir só a definição (`check`) em `src/blocos/decisao.js` — o verificador e o `aplicarTipoVariavel` da 006 não mudam (research R-05) (depende de T008) (FR-003, SC-002; P-1) (RF-04, RF-06)

### Aceitação (P-2)

- [X] T013 [P] [US1] Criar em `tests/aceitacao/casos/`, no formato dos casos existentes (validados por `suporte/validar-caso.js`), com `portugolEsperado` (obrigatório para blocos com áreas):
  - `se-maior-idade.json` (`nome: "MaiorIdade"`): `idade` (inteiro); `leia(idade)`; `se (relacional >= variavel idade, numero 18)` com `escreva(texto "Maior")` no `ENTAO`; `entrada: ["20"]`; `saidaEsperada: "Maior\n"`; `descricao` citando a História 1 da 004 e a **pendência P-2 da 006** (História 2 da 006, "se idade >= 18"); `requisitos: ["RF-04", "RF-06", "RNF-07"]`;
  - `se-menor-idade.json` (`nome: "MenorIdade"`): o mesmo projeto, `entrada: ["10"]`, `saidaEsperada: ""`; `descricao` citando o teste independente da História 1 com 10;
  - `se-senao.json` (`nome: "MaiorOuMenor"`): o mesmo com `extraState: { senao: true }` e `escreva(texto "Menor")` no `SENAO`; `entrada: ["15"]`; `saidaEsperada: "Menor\n"`; `descricao` citando a História 2, cenário 1 (variante "com senão", exigida pela meta-aceitação ao registrar o bloco);
  - os três com `requisitos` incluindo `RF-04` e `RNF-07`.
  Rodar `npm run test:aceitacao` (depende de T007) (SC-001; P-2) (RF-04, RF-06, RNF-07)

### Verificação

- [X] T014 [US1] Rodar `npm test` e `npm run build`. Depois percorrer no navegador (`npm run dev`) os roteiros 1 a 4 do [quickstart.md](quickstart.md#b-no-navegador): montar `se idade >= 18`, executar com 20 e 10, tentar encaixar número/texto/`idade` na condição, mudar o tipo de `ok` com ele na condição. Anotar o navegador (depende de T007–T013) (FR-001, FR-003, SC-002; P-1, P-2) (RF-04, RF-06)
  - Feito no painel do navegador do Claude (Chromium, servidor do Vite), 2026-11-16, com o projeto do caso `se-maior-idade` carregado: a categoria "Decisão" mostra o `se` ("+") e o `se/senão` ("−"); o Portugol tem `se idade >= 18 entao` / `escreva("Maior")` / `fim_se`; com 20 a Saída mostra `Maior` e com 10 nada; na condição, número, texto, conta e as variáveis `idade` e `nome` são recusados pelo verificador da página, e `verdadeiro`, `e`/`ou`, `não` e `ok` encaixam; com `ok` na condição, mudar o tipo para inteiro solta o bloco, Executar mostra "Falta a condição do bloco se" e um desfazer volta `ok` (lógico) à condição. O painel estava oculto, então o encaixe foi conferido pelo verificador (`canConnect`) e não por arrastar com o mouse; arrastar à mão fica no quadro "Conferências manuais pendentes".

**Checkpoint**: o `se` funciona no editor e no Core; condição não lógica não encaixa.

**Commit**: `004/T007-T014 (RF-04, RF-06, RNF-07): bloco se no editor, condição lógica e se idade >= 18 no Core`

---

## Fase 3: História 2 - Escolher entre dois caminhos (Prioridade: P1)

**Objetivo**: tirar um senão com comandos pede confirmação; os blocos saem junto e um
Ctrl+Z volta tudo (História 2, cenário 2).

**Teste independente**: montar um se/senão, verificar que só um ramo executa
(`se-senao.json`, T013) e tirar o senão com comandos.

- [X] T015 [P] [US2] Em `tests/unidade/decisao-blockly.test.js`, `describe('tirar o senão com comandos (História 2)')`, com `confirmarTirarSenao` falso controlado pelo teste:
  - `SENAO` com `escreva(texto "Menor")` e `escreva(numero 1)`: `tirarSenao()` chama `confirmarTirarSenao` uma vez com `{ quantidade: 4, mensagem: 'Tirar o senão apaga 4 blocos que estão dentro dele.' }`;
  - resposta `true`: a área some, os 4 blocos são apagados (`ws.getAllBlocks(false)` sem eles), `saveExtraState()` = `null`; **um** `ws.undo(false)` volta a área e os 4 blocos no lugar;
  - resposta `false`: nada muda;
  - bloco apagado (`dispose`) antes da resposta `true`: sem erro e sem mudança;
  - `se` aninhado dentro do senão conta os blocos dele (`quantidade` inclui o `se` interno e os filhos).
  Deve falhar até T016 (research R-04; data-model "Confirmação") (RF-04)
- [X] T016 [US2] Em `src/ui/mutador-se.js`, completar `tirarSenao()` com blocos conforme [editor-se.md](contracts/editor-se.md#mutador-mutador_se-srcuimutador-sejs): contar `N` (`getDescendants(false)` do primeiro bloco da área e dos seguintes da cadeia), chamar `confirmarTirarSenao({ quantidade: N, mensagem: mensagemTirarSenao(N) })`, e com `true` e o bloco vivo (`!isDeadOrDying()`, `!isInFlyout`) apagar os blocos e tirar a área **no mesmo grupo de eventos**. Em `src/ui/workspace.js`, passar `confirmarTirarSenao: ({ mensagem }) => confirmar({ titulo: TEXTOS.tirarSenaoTitulo, mensagem, confirmar: TEXTOS.tirarSenaoConfirmar, cancelar: TEXTOS.cancelar })` a `registrarMutadorSe`; acrescentar `tirarSenaoTitulo: 'Tirar o senão?'` e `tirarSenaoConfirmar: 'Tirar o senão'` em `src/ui/textos.js`. Rodar até T015 passar (depende de T015) (research R-04) (RF-04)
  - O T015 mostrou que somar os descendentes de cada comando contava em dobro (no Blockly, o próximo bloco é filho do anterior): a quantidade passou a ser os descendentes do primeiro comando da área.
- [X] T017 [US2] Rodar `npm test`; percorrer os roteiros 5 a 7 do [quickstart.md](quickstart.md#b-no-navegador) (ligar o senão; tirar com comandos: Cancelar, depois confirmar e Ctrl+Z; tirar com a área vazia) (depende de T016) (FR-002) (RF-04)
  - Feito no painel do navegador do Claude, 2026-11-16: ligar o senão cria a área e o Portugol ganha `senao` antes do `fim_se`; com `escreva("Menor")` no senão, tirar abre o diálogo real "Tirar o senão?" com "Tirar o senão apaga 2 blocos que estão dentro dele." e os botões "Tirar o senão"/"Cancelar"; Cancelar não muda nada; confirmar apaga a área e os 2 blocos; com a área vazia, sai sem diálogo. Sem erros no console. O painel estava oculto e o Blockly não entregou os eventos (o `requestAnimationFrame` não roda), então o Ctrl+Z na tela não foi conferido; o desfazer está provado no teste headless (T015) e fica no quadro "Conferências manuais pendentes".

**Commit**: `004/T015-T017 (RF-04): tirar o senão com confirmação e desfazer`

---

## Fase 4: História 3 - Decisões dentro de decisões (Prioridade: P2)

**Objetivo**: `se` dentro de `se` e do `senão`, com a indentação certa no texto e no Core,
inclusive com mais de 5 níveis e áreas vazias.

**Teste independente**: três faixas de nota com `se` aninhados; Portugol indentado e a
saída de cada faixa.

- [X] T018 [P] [US3] Em `tests/unidade/decisao-blockly.test.js`, `describe('aninhar (FR-004)')`: um `se` encaixa em `programa.COMANDOS`, no `ENTAO` e no `SENAO` de outro `se` (`ws.connectionChecker.canConnect` com as conexões de comando); `gerarPortugol` do workspace serializado com um `se` no `SENAO` de outro dá o texto do cenário 1 da História 3 (FR-004, FR-005) (RF-04)
- [X] T019 [P] [US3] Criar em `tests/aceitacao/casos/`, com `portugolEsperado`:
  - `se-faixas-nota.json` (`nome: "FaixasNota"`): `nota` (real); três vezes `leia(nota)` seguido de `se nota >= 7 entao escreva("A") senao se nota >= 5 entao escreva("B") senao escreva("C") fim_se fim_se` (o `se` interno no `SENAO` do externo, os dois com `extraState: { senao: true }`); `entrada: ["8", "6", "3"]`; `saidaEsperada: "A\nB\nC\n"`; `descricao` citando a História 3 (cada faixa numa leitura);
  - `se-casos-de-borda.json` (`nome: "CasosDeBorda"`): `idade` (inteiro) e `ok` (lógico); `se (variavel ok)` com `ENTAO` e `SENAO` vazios (`senao: true`); depois `se (e_ou e: nao (relacional > idade 10), logico verdadeiro)` com, no `ENTAO`, 6 níveis de `se (logico verdadeiro)` aninhados e `escreva(texto "fundo")` no mais interno; `entrada: []`; `saidaEsperada: "fundo\n"`; `descricao` citando os casos de borda (áreas vazias, mais de 5 níveis) e o FR-003 (variável lógica, `nao`, `e` na condição);
  - os dois com `requisitos: ["RF-04", "RNF-07"]`.
  Rodar `npm run test:aceitacao` (SC-001; FR-004, FR-005) (RF-04, RNF-07)
- [X] T020 [US3] Rodar `npm test`; percorrer os roteiros 8 a 10 do [quickstart.md](quickstart.md#b-no-navegador) (três faixas com 8, 6 e 3; 6 níveis; áreas vazias sem aviso) (depende de T018, T019) (FR-004, FR-005) (RF-04)
  - Feito no painel do navegador do Claude, 2026-11-16, com os projetos dos casos carregados: as três faixas com 8, 6 e 3 deram `A`, `B` e `C`; o `se` com então e senão vazios executou sem aviso; os 6 níveis aninhados (dentro de mais um `se`) geraram o `escreva("fundo")` com 32 espaços e executaram no Core.

**Commit**: `004/T018-T020 (RF-04, RNF-07): se aninhado e casos de borda no Core`

---

## Fase 5: Entrega

**Objetivo**: cobertura, README e conferência de pt-BR.

- [X] T021 Percorrer o roteiro 11 do [quickstart.md](quickstart.md#b-no-navegador) (dica do bloco, ícones, diálogo e aviso em pt-BR) e conferir a categoria "Decisão" na caixa. Rodar `npm test` e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo, com `src/blocos/decisao.js` no relatório e `src/ui/mutador-se.js` fora dele; conferir que `tests/unidade/versao-unica.test.js` passa; versionar `cobertura/` e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 2 a 4) (RNF-03, RNF-04, RNF-02)
  - Roteiro 11 no painel do navegador do Claude, 2026-11-16: rótulos `se`, `então`, `senão`, dicas dos ícones "Acrescentar senão"/"Tirar o senão", *tooltip* e diálogo em pt-BR; categoria "Decisão" entre "Entrada e saída" e "Valores". Cobertura do núcleo: 99,6% em linhas e 93,6% em branches, com `src/blocos/decisao.js` no relatório e `src/ui/mutador-se.js` fora; README com 943 testes.

**Commit**: `004/T021 (RF-04, RNF-02, RNF-03, RNF-04): cobertura e README`

---

## Fase 6: Documentação das outras specs

**Objetivo**: registrar na 006 e na 008 que as pendências foram resolvidas (research R-10).

- [X] T022 [P] Atualizar a 006, com link para este `tasks.md` e para `tests/aceitacao/casos/se-maior-idade.json`:
  - `specs/006-blocos-operadores/spec.md`, Premissas ("o `se idade >= 18` é conferido na 004"): acrescentar "(✅ conferido na 004)";
  - `specs/006-blocos-operadores/research.md`, R-15, linha da 004: "✅ resolvida pela 004";
  - `specs/006-blocos-operadores/plan.md`, "Pendências para outras specs", linha da 004: o mesmo;
  - `specs/006-blocos-operadores/contracts/tipos-encaixe.md`: na "Matriz do SC-002", a coluna "`se` condição" (valores do research R-05 desta spec); em "Regra para as specs 004 e 005", linha do `se`: "aplicada na 004 ([bloco-se.md](../../004-blocos-se-senao/contracts/bloco-se.md))".
  - `specs/005-blocos-repeticao/spec.md`, nas Premissas, só como regra de usuário: "Um `se` encaixa dentro de `enquanto` e `para` (spec 004); conferido com os blocos de repetição." (FR-004).
  (RF-06, RF-04, RF-05)
- [X] T023 [P] Em `specs/008-portugol-valido/contracts/registro-blocos.md`, depois do exemplo do `se` em "Entrada do registro", uma linha: "O bloco real está em `src/blocos/decisao.js` (spec 004, [bloco-se.md](../../004-blocos-se-senao/contracts/bloco-se.md))". Em `specs/004-blocos-se-senao/spec.md`, `**Status**: Rascunho` → `**Status**: Implementada` (RF-08, RF-04)
- [X] T024 Rodar `npm test` uma vez antes do commit e, na descrição do PR, registrar: as pendências P-1 e P-2 da 006 fechadas, o comportamento do Core com `se 1 entao` (research R-02) e os navegadores usados nos roteiros (depende de T022, T023) (RNF-05)
  - `npm test` rodado antes do commit (943 testes passando). O PR não foi aberto (sem push, a pedido); o texto para a descrição ficou no resumo da implementação. Nenhuma lacuna nova do Core: aceitar `se 1 entao` é a conversão do Python, e a regra do "só lógico" é do editor (research R-02).

**Commit**: `docs(004) (RF-04, RF-06, RF-08): pendências da 006 resolvidas e registro do se`

## Conferências manuais pendentes

O código está pronto e testado. Os roteiros do quickstart foram percorridos no painel do
navegador do Claude com o painel oculto: o Blockly não entregava os eventos (o
`requestAnimationFrame` não roda), então o que depende de arrastar com o mouse e do Ctrl+Z
na tela foi conferido pelo verificador de encaixe e pelos testes headless. Fica com a dupla
repetir, num navegador comum (Chrome, Firefox ou Edge), e anotar o resultado no PR.

**Registro (2026-11-16)**: o arrastar, o ícone do senão com o Ctrl+Z e o Portugol durante a
montagem ficam para conferência num navegador comum. Quem conferir troca a situação para
"Conferido", com o navegador e a data.

| Conferência | O que fazer | Task | Situação |
| --- | --- | --- | --- |
| Arrastar para a condição | Arrastar `18`, um texto e a variável `idade` para a condição do `se` e ver que não encaixam; arrastar uma comparação, `verdadeiro`, `e`/`ou`, `não` e uma variável lógica e ver que encaixam (roteiro 3). | T014 (registro) | Pendente: navegador comum |
| Ícone do senão e Ctrl+Z | Clicar no "+" e no "−" do bloco; tirar um senão com comandos, confirmar e apertar Ctrl+Z (ou o botão Desfazer): a área e os blocos voltam (roteiros 5 e 6). | T017 (registro) | Pendente: navegador comum |
| Portugol em tempo real | Montar as três faixas de nota arrastando os blocos e conferir o Portugol no painel enquanto monta (roteiro 8). | T020 (registro) | Pendente: navegador comum |

---

## Dependências e ordem

### Entre fases

- **Fundação (1)** → **US1 (2)** → **US2 (3)** → **US3 (4)** → **Entrega (5)** →
  **Documentação (6)**.
- A US1 depende da Fundação (registra o `BLOCO_SE` do T003 e usa o mutador do T006).
- A US2 completa o mutador da Fundação e usa o caso `se-senao.json` da US1.
- A US3 depende da US1 (bloco registrado). Ela e a US2 mexem em
  `decisao-blockly.test.js`; por isso seguem em sequência, na ordem de prioridade.
- Como há **um commit por fase**, uma fase só começa depois do commit da anterior.

### Dentro de cada fase

Testes primeiro (falhando), depois o núcleo (`src/blocos/`), depois a interface
(`src/ui/`) e por último a verificação no navegador.

### Oportunidades de paralelismo

- **Fundação**: T001 primeiro; depois T002 e T005 juntos (T005 só roda depois de T003);
  T004 depois de T003; T006 fecha.
- **US1**: T007 primeiro; depois T010 e T013 juntos; T008, T009 e T011 em seguida;
  T012 e T014 fecham.
- **US2**: T015 → T016 → T017.
- **US3**: T018 e T019 juntos; T020 fecha.
- **Documentação**: T022 e T023 juntos.

### Exemplo: Fundação

```text
Antes:   T001 base herdada verde
Juntas:  T002 blocos-decisao (teste) | T005 decisao-blockly (teste)
Depois:  T003 decisao.js → T004 matriz do SC-002 | T006 mutador-se.js → commit da fase
```

### Exemplo: História 1

```text
Antes:   T007 registro
Juntas:  T010 caixa (teste) | T013 casos se-maior/menor/senao
Depois:  T008 testes headless | T009 workspace.js | T011 caixa-blocos.js → T012 condição só lógica → T014 navegador → commit
```

## Estratégia de implementação

### MVP (Fundação + História 1)

Fases 1 e 2. Parar e validar: o `se` aparece na categoria "Decisão", `se idade >= 18`
roda no Core com 20 (`Maior`) e 10 (nada), e número, texto ou variável numérica não
encaixam na condição (P-1 e P-2 fechadas).

### Entrega incremental

1. MVP → decisão simples no editor e no Core.
2. + US2 → senão com confirmação e desfazer.
3. + US3 → faixas com `se` aninhado e casos de borda.
4. Entrega e documentação → cobertura, README e a 006 e a 008 atualizadas.

### Pendências para outras specs

Registradas no [plan.md](plan.md). Não são tasks desta spec:

- **005**: `enquanto` e `para` com o mesmo modelo de condição e corpo; `se` dentro deles
  conferido com os blocos de repetição.
- **012**: arquivo com condição não lógica editado à mão cai no `BadConnectionCheck` já
  registrado pela 006.
