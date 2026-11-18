---

description: "Tasks da spec 011: Salvar projeto em JSON"
---

# Tasks: Salvar projeto em JSON

**Entrada**: documentos de design em `specs/011-salvar-projeto/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constituição exige cobertura ≥ 80% no núcleo, que inclui a
"serialização de projeto", e testes de aceitação no Core real (princípio IV, RNF-04,
RNF-07). O núcleo (`src/projeto/formato.js`, `src/projeto/salvar.js`) tem testes escritos
antes da implementação. A ida e volta é testada headless no Blockly 12.5.1. O que só existe
no navegador (download, indicador, `beforeunload`) é verificado pelo
[quickstart.md](quickstart.md).

**Reaproveitamento** (orientação 3 do plan; research R-01): `src/projeto/formato.js` e
`src/projeto/alteracoes.js` **já existem**. `formato.js` só ganha funções; `alteracoes.js`
não muda; `referencia`, `projetoAtual()` e o Novo de `src/main.js` são mantidos.

**Organização**: Fundação (arquivo v1 no `formato.js`) → História 1 (Salvar, P1) →
História 2 (alterações não salvas, P3) → entrega → documentação das outras specs.

**Commits (constituição v2.0.0, princípio III)**: um commit por fase, depois de todas as
tasks da fase marcadas e de `npm test` rodado uma vez, passando. Formato
`011/Txxx-Tyyy (RF-xx, …): descrição`; a fase de documentação usa
`docs(011) (RF-xx, …): descrição`. A linha **Commit** no fim de cada fase traz a mensagem.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[US1]**, **[US2]**: História 1 e História 2 da spec

---

## Fase 1: Preparação

Nada a preparar: sem dependência nova (research R-10), `src/projeto/**` já está no `include`
da cobertura e `src/ui/**` já está no `exclude` do `vite.config.js`.

---

## Fase 2: Fundação — arquivo v1 (bloqueia as histórias)

**Objetivo**: o texto do arquivo sai de um lugar só, `src/projeto/formato.js`, com tudo que
as specs anteriores criaram (orientação 1 do plan; research R-02, R-04).

- [X] T001 Em `tests/unidade/formato.test.js` (existente; manter os testes atuais), acrescentar os casos de `montarArquivo` e `textoArquivo` da tabela de `specs/011-salvar-projeto/contracts/salvar.md`: `montarArquivo(projetoVazio())` com `Object.keys` exatamente `['formato', 'versao', 'nome', 'variaveis', 'blocos']`; projeto com `formato: 'x'` e `versao: 9` sai com `'meupia-blocos'` e `1`; projeto sem `nome`/`variaveis`/`blocos` sai com `''`, `[]`, `{}`; `blocos.variables` presente → ausente no resultado; variável `{ id, nome, tipo, extra }` → só `{ id, nome, tipo }`, na mesma ordem do array (três variáveis `inteiro`, `real`, `inteiro`); mudar um campo profundo do resultado não muda o projeto de entrada; `escreva` com `extraState: { valores: 3 }` e `se` com `extraState: { senao: true }` preservados; `se` sem `extraState` continua sem; `textoArquivo` igual a `JSON.stringify(montarArquivo(p), null, 2) + '\n'`, com `"nome": "Média"` literal (sem `\u`), e duas chamadas iguais. Deve falhar até T002 (FR-002, FR-005, SC-003) (RF-11)
- [X] T002 Em `src/projeto/formato.js` (existente; não mudar `FORMATO`, `VERSAO_FORMATO`, `TIPOS_VARIAVEL` nem `projetoVazio`), acrescentar `montarArquivo(projeto)` e `textoArquivo(projeto)` conforme `contracts/salvar.md`: chaves nesta ordem `formato: FORMATO`, `versao: VERSAO_FORMATO`, `nome`, `variaveis`, `blocos`; ausentes → `nome: ''`, `variaveis: []`, `blocos: {}`; cada variável vira `{ id, nome, tipo }`; `blocos` em cópia profunda (`structuredClone`) **sem** a chave `variables`; `textoArquivo` = `JSON.stringify(montarArquivo(projeto), null, 2) + '\n'`. Sem Blockly e sem DOM. Atualizar o comentário do topo citando a 011. Implementar até T001 passar (depende de T001) (FR-002, FR-005) (RF-11)

**Ponto de verificação**: `npm run test:unidade` passa.

**Commit**: `011/T001-T002 (RF-11): arquivo de projeto v1 no formato.js`

---

## Fase 3: História 1 — Guardar o trabalho num arquivo (P1) 🎯 MVP

**Objetivo**: clicar em Salvar baixa `<nome>.json` com o projeto inteiro, sem servidor e
sem mudar o projeto aberto; depois disso o Novo não pede confirmação (orientação 2 do
plan; 001, FR-007).

**Teste independente**: montar um programa, salvar, abrir o arquivo e ver nome, variáveis
com tipos e todos os blocos com posições (quickstart, passos 1–6 e 10–14).

### Testes da História 1

- [X] T003 [P] [US1] Criar `tests/unidade/salvar.test.js` com os casos de `contracts/salvar.md`: tabela de `nomeArquivo` (`"Media"` → `Media.json`; `"  Media  "` → `Media.json`; `"Média final"` → `Média final.json`; `'a/b\\c:d*e?f"g<h>i|j'` → `a_b_c_d_e_f_g_h_i_j.json`; `"a\tb"` e `"a\u007fb"` → `a_b.json`; `""`, `"   "`, `undefined`, `null` → `MeuPrograma.json`); `prepararSalvamento(p)` devolve `{ nomeArquivo, texto, referencia }` com `texto === textoArquivo(p)`, `referencia === assinaturaProjeto(p)`, `haAlteracoes(p, referencia) === false`, `assinaturaProjeto(JSON.parse(texto)) === referencia`, e `JSON.stringify(p)` antes = depois; projeto com 100 blocos `escreva` encadeados no `programa` prepara em menos de 1000 ms (`performance.now()`); leitura de `src/projeto/salvar.js` e `src/ui/download.js` como texto sem as chamadas `fetch(`, `new XMLHttpRequest(`, `sendBeacon(` nem `new WebSocket(` (expressões regulares com o parêntese, para não acertar comentários; o teste do `download.js` depende de T007 e falha até ela). Deve falhar até T005 (FR-001, FR-003, FR-004, FR-005, SC-002) (RF-11)
- [X] T004 [P] [US1] Criar `tests/unidade/salvar-blockly.test.js`, headless como `tests/unidade/repeticao-blockly.test.js` (mesmo `registrarTudo()` e `new Blockly.Workspace` com o `connectionChecker`), com um projeto v1 que tenha: variáveis dos quatro tipos criadas fora da ordem dos tipos (ex.: `b` inteiro, `nota` real, `a` inteiro, `nome` cadeia, `ok` logico); **pelo menos um bloco de cada tipo de `registroPadrao.tiposRegistrados()`** (conferido no próprio teste: um tipo registrado ausente do projeto faz o teste falhar); um `escreva` com `extraState: { valores: 3 }`; um `se` com `{ senao: true }` e comandos em `SENAO` e outro sem `extraState`; um bloco solto com `x`/`y` próprios; um `se` sem condição. Carregar com `Blockly.serialization.workspaces.load(blocosComVariaveis(blocos, variaveis), ws)`, montar o projeto como o `projetoAtual()` do `main.js` (`variaveisDoMapa(ws.getVariableMap().getAllVariables())` e `workspaces.save` sem `variables`), passar por `prepararSalvamento`, `JSON.parse` do `texto`, carregar num **workspace novo** do mesmo jeito e conferir: `variaveis` iguais (mesma ordem), serialização dos blocos igual, `extraState` do escreva `{ valores: 3 }`, do se com senão `{ senao: true }`, se sem senão sem `extraState`, bloco solto e `x`/`y` preservados, e `gerarPortugol` idêntico (código e avisos). Deve falhar até T005 (FR-002, SC-001) (RF-11)
- [X] T005 [US1] Criar `src/projeto/salvar.js` conforme `contracts/salvar.md`: `nomeArquivo(nome)` (`String(nome ?? '').trim()`, cada caractere de `/ \ : * ? " < > |` e de U+0000–U+001F e U+007F vira `_`, vazio → `MeuPrograma`, acrescenta `.json`) e `prepararSalvamento(projeto)` → `{ nomeArquivo: nomeArquivo(projeto.nome), texto: textoArquivo(projeto), referencia: assinaturaProjeto(projeto) }`, importando de `./formato.js` e `./alteracoes.js` (sem mudar `alteracoes.js`). Sem Blockly, sem DOM, sem rede. Implementar até T003 (exceto o teste do `download.js`) e T004 passarem (depende de T002–T004) (FR-001, FR-003, FR-004, FR-005) (RF-11)
- [X] T006 [P] [US1] Criar `tests/aceitacao/salvar.test.js`: para cada caso de `tests/aceitacao/casos/*.json` (validado com `validarCaso`, como em `tests/aceitacao/aceitacao.test.js`), carregar `caso.projeto` num workspace Blockly headless (mesmo registro de T004), montar o projeto como o `projetoAtual()`, passar por `prepararSalvamento`, `JSON.parse` do texto, e conferir que `gerarPortugol` do arquivo lido é igual a `gerarPortugol(caso.projeto)` e que `compilarEExecutar` no `meupia-core` real (`criarMotorNode`) dá `statusEsperado ?? 'ok'` e `saidaEsperada` com `caso.entrada`; conferir também que `texto` começa com `{\n  "formato": "meupia-blocos",\n  "versao": 1,`. Depende de T005 (FR-002, SC-001, SC-003) (RF-11, RNF-07)

### Implementação da História 1

- [X] T007 [P] [US1] Criar `src/ui/download.js` com `baixarArquivo(nomeArquivo, texto)` conforme `contracts/tela-salvar.md`: `new Blob([texto], { type: 'application/json' })`, `URL.createObjectURL`, `<a>` com `download = nomeArquivo` e `href = url` anexado ao `document.body` fora da tela, `click()`, `remove()`, e `URL.revokeObjectURL(url)` num `setTimeout(…, 0)`. Sem rede. Comentário de topo: interface, fora da cobertura (FR-001, FR-004) (RF-11)
- [X] T008 [US1] Em `tests/unidade/tela-estrutura.test.js`, trocar a verificação que exige `disabled` e `title="Disponível em breve"` em `botao-salvar` e `botao-carregar` por: `botao-salvar` sem `disabled`, sem `Disponível em breve` e com `title="Salvar o projeto num arquivo .json"`; `botao-carregar` continua `disabled` com `title="Disponível em breve"` (012). Acrescentar `salvarDica` à lista de chaves de `TEXTOS` verificadas. Deve falhar até T009 (FR-001) (RF-11)
- [X] T009 [US1] Em `index.html`, tirar `disabled` do `#botao-salvar` e trocar o `title` por `"Salvar o projeto num arquivo .json"` (ordem dos botões sem mudança); em `src/ui/textos.js`, acrescentar `salvarDica: 'Salvar o projeto num arquivo .json'`. Implementar até T008 passar (depende de T008) (FR-001) (RF-11)
- [X] T010 [US1] Em `src/ui/barra.js`, `ligarBarra` passa a receber `aoSalvar` e liga o clique de `#botao-salvar` a `aoSalvar?.()`; atualizar o comentário do topo (Salvar ligado pela 011). Em `src/main.js`, criar `salvarProjeto()` conforme `contracts/tela-salvar.md`: `tempoReal.atualizarAgora()`, `p = projetoAtual()`, `{ nomeArquivo, texto, referencia: r } = prepararSalvamento(p)`, `baixarArquivo(nomeArquivo, texto)`, `referencia = r`; passar `aoSalvar: salvarProjeto` ao `ligarBarra`. Sem `recarregarBlocos`, sem `clearUndo`, sem mexer no nome, na Saída ou na execução (FR-005). Atualizar o comentário do topo do `main.js` com a spec 011 (depende de T005, T007, T009) (FR-001, FR-005; 001 FR-007) (RF-11, RF-01)

**Ponto de verificação**: `npm test` passa; quickstart, passos 1, 4–6 e 10–14, no navegador.

**Commit**: `011/T003-T010 (RF-11, RF-01, RNF-07): Salvar o projeto num arquivo .json`

---

## Fase 4: História 2 — Saber se há alterações não salvas (P3)

**Objetivo**: indicação "alterações não salvas" ao lado do nome e confirmação do navegador
ao fechar ou recarregar com alterações (FR-006; research R-08).

**Teste independente**: alterar, ver a indicação, recarregar e ver a confirmação; salvar e
ver tudo sumir (quickstart, passos 2, 3, 7–9).

- [X] T011 [US2] Em `tests/unidade/tela-estrutura.test.js`, acrescentar: `<span id="indicador-alteracoes">` existe, com `class="indicador-alteracoes"`, `aria-live="polite"` e `hidden`, posicionado depois de `id="nome-programa"` e antes de `class="barra-acoes"` dentro de `#barra`; `alteracoesNaoSalvas` na lista de chaves de `TEXTOS`, com valor `'alterações não salvas'`. Deve falhar até T012 (FR-006; História 2, cenário 2) (RF-11)
- [X] T012 [US2] Em `index.html`, acrescentar `<span id="indicador-alteracoes" class="indicador-alteracoes" aria-live="polite" hidden></span>` logo depois do `<input id="nome-programa">`; em `src/ui/textos.js`, `alteracoesNaoSalvas: 'alterações não salvas'`; em `src/estilos.css`, estilo discreto do `.indicador-alteracoes` (texto menor, itálico, cor secundária já usada na barra; `[hidden]` continua oculto). Implementar até T011 passar (depende de T011) (FR-006) (RF-11)
- [X] T013 [US2] Em `src/ui/barra.js`, exportar `mostrarAlteracoes(alterado)` (`hidden = !alterado`; texto `TEXTOS.alteracoesNaoSalvas`). Em `src/main.js`: no fim de `atualizarPortugol()`, `mostrarAlteracoes(haAlteracoes(projetoGerado, referencia))`; em `salvarProjeto()` e no fim de `novoProjeto()` (depois de marcar `referencia`), `mostrarAlteracoes(false)`; `window.addEventListener('beforeunload', (evento) => { if (haAlteracoes(projetoAtual(), referencia)) { evento.preventDefault(); evento.returnValue = ''; } })` (depende de T010, T012) (FR-006; História 2, cenários 1 e 2) (RF-11)

**Ponto de verificação**: `npm test` passa; quickstart, passos 2, 3 e 7–9.

**Commit**: `011/T011-T013 (RF-11): indicação de alterações não salvas e confirmação ao sair`

---

## Fase 5: Entrega

- [X] T014 Rodar `npm run cobertura`: cobertura ≥ 80% em linhas e branches com `src/projeto/salvar.js` e os acréscimos de `formato.js` medidos; relatório em `cobertura/` e linha `**Testes:** N · **Cobertura:** X%` do `README.md` (logo depois do aviso "Em construção") atualizados pelo script. Percorrer o [quickstart.md](quickstart.md) inteiro no navegador e registrar o resultado (RNF-04, RNF-07) (RF-11)
  - `npm run cobertura`: 1167 testes passando, cobertura 99,6% em linhas e 94,04% em branches; `src/projeto/salvar.js` 100%/100% e `src/projeto/formato.js` 100%/100% (um caso com campos `null` foi acrescentado ao `formato.test.js` para cobrir os `??`). README atualizado pelo script.
  - Feito no painel do navegador do Claude (Chromium, servidor do Vite, painel oculto), 2026-11-17, montando os blocos pelo Blockly da página e capturando o download (`URL.createObjectURL` e o clique do `<a>`): Salvar habilitado e indicação oculta ao abrir (1); nome `Media` mostra "alterações não salvas" (2); com `nota` (real), `b`, `a` (inteiros) e `n` (cadeia), `leia`, `escreva` com 3 valores, `se` com e sem senão, `para`, `enquanto` e um `se` solto, Salvar baixou `Media.json` (`application/json`), a indicação sumiu, o Portugol e a pilha de desfazer ficaram iguais (3, 4); o texto começa com `formato`, `versao` e `nome`, as variáveis saem `nota`, `b`, `a`, `n` com os tipos, há `"valores": 3`, um só `"senao": true`, `x`/`y` do `programa` e do bloco solto, e nenhum `"variables"` (5); depois de salvar, Novo não abriu o diálogo (6); o `beforeunload` foi cancelado com alterações e não com o projeto salvo (7, 8, pelo evento disparado na página); mover um bloco depois de salvar faz o Novo perguntar e, depois de desfazer o movimento, o Novo não pergunta (9); `a/b:c*d` → `a_b_c_d.json` e nome vazio → `MeuPrograma.json` (10, 11); projeto novo salvo só com o `programa` (12); salvar com o pedido do `leia` aberto baixou o arquivo, o campo e o Parar continuaram e a execução terminou com `Ana` (14). Sem erros no console. O diálogo real do navegador ao fechar, o arquivo gravado no disco, a aba Rede e a indicação sumindo com o desfazer (o painel oculto não roda o `requestAnimationFrame`) ficam no quadro "Conferências manuais pendentes".

**Commit**: `011/T014 (RF-11, RNF-04, RNF-07): cobertura e README`

---

## Fase 6: Documentação das outras specs

- [X] T015 [P] Em `specs/001-tela-tres-paineis/contracts/tela.md` e `specs/001-tela-tres-paineis/data-model.md`, registrar que o `#botao-salvar` foi habilitado pela 011 (sem `disabled`, `title="Salvar o projeto num arquivo .json"`) e que a barra ganhou `#indicador-alteracoes`; na linha "Projeto salvo" da tabela de referência, apontar para `specs/011-salvar-projeto/data-model.md` (RF-01, RF-11)
- [X] T016 [P] Em `specs/012-carregar-projeto/spec.md`, na seção de premissas, registrar o que a 011 deixa pronto para a 012: `montarArquivo`/`textoArquivo` em `src/projeto/formato.js`; `se` sem senão gravado **sem** `extraState` (ausente = desligado); `nome` gravado bruto; `assinaturaProjeto(JSON.parse(texto)) === referencia`; o indicador e o `beforeunload` passam a valer também depois de Carregar ao marcar a referência (RF-12, RF-11)

**Commit**: `docs(011) (RF-11, RF-01, RF-12): Salvar registrado nas specs 001 e 012`

## Conferências manuais pendentes

Os roteiros do quickstart foram percorridos no painel do navegador do Claude com o painel
oculto. Os blocos foram montados pelo Blockly da própria página e o download foi capturado na
página (o `Blob` e o clique do `<a>`), sem gravar arquivo no disco. Fica com a dupla repetir
num navegador comum (Chrome, Firefox ou Edge) e anotar o resultado no PR. Nenhuma lacuna do
Core: o Salvar não usa o Core, e a aceitação roda os casos salvos no `meupia-core` 1.4.1 sem
mudança.

**Registro (2026-11-17)**: quem conferir troca a situação para "Conferido", com o navegador e
a data.

| Conferência | O que fazer | Task | Situação |
| --- | --- | --- | --- |
| Arquivo gravado no disco | Montar um programa, clicar em Salvar, achar `Media.json` na pasta de downloads e abri-lo num editor de texto (quickstart, passos 4 e 5). | T010, T014 | Pendente: navegador comum |
| Confirmação real ao fechar | Com alterações, apertar F5 e tentar fechar a aba: o navegador pergunta; depois de salvar, não pergunta (passos 7 e 8). | T013, T014 | Pendente: navegador comum |
| Indicação com o desfazer | Depois de salvar, mover um bloco com o mouse (a indicação aparece) e apertar Ctrl+Z (a indicação some) (passo 9). | T013, T014 | Pendente: navegador comum |
| Sem rede | DevTools → Rede, clicar em Salvar e ver que nenhuma requisição sai (passo 13). | T007, T014 | Pendente: navegador comum |
| Perguntar onde salvar | Com o navegador configurado para perguntar onde salvar, cancelar o diálogo e ver que o projeto fica marcado como salvo (Premissas da spec). | T010 | Pendente: navegador comum |

---

## Dependências e ordem

- **Fundação (T001–T002)** bloqueia as histórias.
- **História 1**: T003 e T004 em paralelo → T005 → T006; T007 em paralelo com T003–T006
  (o teste "sem rede" da T003 sobre `src/ui/download.js` só passa depois da T007);
  T008 → T009; T010 depende de T005, T007 e T009.
- **História 2**: depende de T010 (mesmos arquivos `barra.js` e `main.js`). T011 → T012 → T013.
- **Entrega** depois das duas histórias; **Documentação** por último (T015 e T016 em paralelo).

## Paralelismo

```text
Fundação pronta →
  T003 tests/unidade/salvar.test.js
  T004 tests/unidade/salvar-blockly.test.js
  T007 src/ui/download.js
→ T005 src/projeto/salvar.js → T006 tests/aceitacao/salvar.test.js
```

## Estratégia

- **MVP**: Fundação + História 1. O estudante já guarda o trabalho, o arquivo é o mesmo
  formato dos casos de aceitação, e o Novo respeita o salvamento.
- **Incremento**: História 2 (indicação e confirmação ao sair), que só lê a mesma
  `referencia`.
