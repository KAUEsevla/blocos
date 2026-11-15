---

description: "Tasks da spec 001: Tela de três painéis"
---

# Tasks: Tela de três painéis

**Entrada**: documentos de design em `specs/001-tela-tres-paineis/`

**Pré-requisitos**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Testes**: incluídos. A constitution exige cobertura ≥ 80% no núcleo (princípio IV,
RNF-04). A única regra nova do núcleo (`src/projeto/alteracoes.js`) tem testes de
unidade escritos antes da implementação. A estrutura da página é conferida por um teste
estático (`tela-estrutura.test.js`, sem jsdom). Layout, rolagem, diálogo e cópia são
verificados no navegador pelo quickstart (research R-08).

**Organização**: tarefas agrupadas por história de usuário da spec. A base do projeto
(Vite, Blockly, gerador, adapter do Core) é da spec 008 e não é refeita aqui.

**Rastreabilidade (constitution v1.2.0, princípio III)**: cada task cita o requisito
entre parênteses no fim. O commit de uma task usa `001/Txxx (RF-xx): descrição`, por
exemplo `001/T011 (RF-01): alterações não salvas no núcleo`.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência de task aberta)
- **[US1]/[US2]/[US3]**: história da spec (US1 = História 1, e assim por diante)
- Todos os caminhos são relativos à raiz do repositório

---

## Fase 1: Setup

**Objetivo**: limpar o `git status` do cache do Vite.

- [X] T001 Conferir que `.gitignore` tem a linha `.vite/` logo abaixo de `dist/`, na seção "Dependências e build" (a linha foi acrescentada durante o `/speckit-plan`; se faltar, acrescentar). Rodar `git status` e confirmar que `.vite/` não aparece como não rastreado (research R-11) (RF-01)

---

## Fase 2: Fundação (pré-requisitos bloqueantes)

**Objetivo**: a página com a estrutura definitiva do contrato [tela.md](contracts/tela.md) e os textos da tela em pt-BR. Todas as histórias dependem desta fase.

- [X] T002 [P] Escrever `tests/unidade/tela-estrutura.test.js`, que lê `index.html` com `fs.readFileSync` (sem jsdom, sem dependência nova) e confere por expressões regulares, conforme `contracts/tela.md`:
  - `<html lang="pt-BR">` e `<title>meuPiá Blocos</title>`; nenhum `<style>` inline;
  - `<header id="barra">` contendo `<label for="nome-programa">Nome do programa</label>`, o `<input id="nome-programa">` com `value="MeuPrograma"` e `maxlength="40"`, e os botões `botao-executar` (`Executar`), `botao-salvar` (`Salvar`), `botao-carregar` (`Carregar`) e `botao-novo` (`Novo`), **nessa ordem**; os três primeiros com `disabled` e `title="Disponível em breve"`, e `botao-novo` sem `disabled`;
  - `<main id="paineis">` com as `section` `painel-blocos`, `painel-portugol` e `painel-saida` **nessa ordem**, cada uma com `aria-labelledby` igual ao id do seu `<h2>` (`titulo-blocos` = `Blocos`, `titulo-portugol` = `Portugol`, `titulo-saida` = `Saída`);
  - `<div id="area-blocos">` dentro de `painel-blocos`; `<button id="botao-copiar">Copiar código</button>`, `<span id="mensagem-copia" aria-live="polite">` e `<pre id="codigo-portugol" tabindex="0" ...>` dentro de `painel-portugol`, e o `<pre>` **sem** `contenteditable`; `<div id="saida" ...>` dentro de `painel-saida`;
  - `<dialog id="dialogo-confirmacao">` com `dialogo-titulo`, `dialogo-mensagem`, `dialogo-cancelar` (`Cancelar`) e `dialogo-confirmar` (`Confirmar`);
  - nenhum texto de `<button>`, `<label>`, `<h2>` ou atributo `title`/`aria-label` contém, como palavra inteira e diferenciando maiúsculas, `Run`, `Save`, `Load`, `New`, `Copy`, `Cancel` ou `OK`;
  - importa `TEXTOS` de `src/ui/textos.js` e confere que todas as chaves listadas na T003 existem, não são vazias e também passam na lista de palavras em inglês acima.
  O teste deve falhar até T003 e T004 (FR-001..FR-004, SC-003) (RF-01, RNF-03)
- [X] T003 [P] Criar `src/ui/textos.js` exportando `TEXTOS` congelado (`Object.freeze`) com exatamente estes valores (research R-04, R-06, R-10; contrato `painel-saida.md`):
  - `orientacaoSaida`: "Monte o programa com os blocos e clique em Executar para ver o resultado aqui."
  - `copiaOk`: "Código copiado!"
  - `copiaFalhou`: "Não foi possível copiar. Selecione o código e use Ctrl+C."
  - `novoTitulo`: "Começar um projeto novo?"
  - `novoMensagem`: "As alterações que não foram salvas serão perdidas."
  - `novoConfirmar`: "Descartar e começar"
  - `cancelar`: "Cancelar"
  - `emBreve`: "Disponível em breve"
  Arquivo de interface, fora da cobertura (FR-003) (RF-01, RNF-03)
- [X] T004 Reescrever `index.html` conforme `contracts/tela.md` (barra, três `section` na ordem Blocos → Portugol → Saída, `<dialog>`), removendo o `<style>` inline da 008 e mantendo `<script type="module" src="/src/main.js">`. No mesmo commit, ajustar `src/main.js` para buscar o código em `document.getElementById('codigo-portugol')` (o id `painel-portugol` passou para a `section`) e importar `./estilos.css`; criar `src/estilos.css` só com `*, *::before, *::after { box-sizing: border-box; }` e `body { margin: 0; font-family: system-ui, sans-serif; }` (o layout chega na T005). A página precisa continuar mostrando o Portugol do projeto novo. Implementar até T002 passar (depende de T002, T003) (FR-001, FR-002, FR-004) (RF-01)

**Checkpoint**: `npm run test:unidade` verde; a página abre com todos os elementos, ainda sem layout.

---

## Fase 3: História 1 - Ver blocos, código e resultado lado a lado (Prioridade: P1) 🎯 MVP

**Objetivo**: os três painéis visíveis ao mesmo tempo, com título, rolagem própria e o conteúdo inicial (bloco `programa`, algoritmo vazio, orientação na Saída).

**Teste independente**: abrir o editor a 1280 × 800 px e ver Blocos, Portugol e Saída lado a lado, nessa ordem, sem rolar a página; Saída com a orientação; a 800 px, os três empilhados e acessíveis.

- [X] T005 [P] [US1] Escrever o layout em `src/estilos.css` (research R-02, contrato `tela.md`, seção "Layout"):
  - `html, body { height: 100%; }`; `body` em grid com `grid-template-rows: auto 1fr` e `height: 100vh` (barra + área dos painéis);
  - `#barra`: flex, itens alinhados ao centro, `gap: 8px`, padding de 8px 12px; o `#nome-programa` com largura de ~16rem;
  - `#paineis` a partir de 1024 px: `display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 3fr) minmax(0, 2fr); min-height: 0;`;
  - `.painel`: `display: grid; grid-template-rows: auto 1fr; min-height: 0; min-width: 0;` com borda entre painéis; o cabeçalho do painel (`<h2>` e, no Portugol, `#botao-copiar` e `#mensagem-copia` à direita) em flex;
  - `.painel-corpo`: `min-height: 0; overflow: auto;` (FR-005); o corpo do painel Blocos com `position: relative; overflow: hidden;` e `#area-blocos { position: absolute; inset: 0; }` (R-03);
  - `#codigo-portugol`: `margin: 0; padding: 12px; background: #1e1e1e; color: #e6e6e6; font: 14px/1.5 ui-monospace, Consolas, monospace; white-space: pre;` (cores da 008);
  - `.saida-linhas` com `white-space: pre-wrap`, fonte monoespaçada; `.saida-linha--sistema` em cinza e itálico; `.saida-linha--erro` em vermelho escuro;
  - `@media (max-width: 1023.98px)`: `body { height: auto; }`, `#paineis { grid-template-columns: 1fr; }`, `#painel-blocos { min-height: 70vh; }`, `#painel-portugol, #painel-saida { min-height: 45vh; }` e `#barra { position: sticky; top: 0; z-index: 1; }` com o mesmo fundo opaco da barra, para ela continuar visível com a página rolando ("barra fixa", História 2) (FR-006);
  - `#dialogo-confirmacao` com padding, largura máxima de 28rem e botões alinhados à direita.
  (FR-001, FR-005, FR-006, SC-001) (RF-01)
- [X] T006 [P] [US1] Implementar `src/ui/painel-saida.js` conforme `contracts/painel-saida.md`: `criarPainelSaida(elemento)` cria a `areaLinhas` (`<div class="saida-linhas" role="log" aria-live="polite">`) e a `areaAvisos` (`<div class="saida-avisos">`) e as coloca em `elemento` (`#saida`) com `elemento.replaceChildren(areaLinhas, areaAvisos)`, substituindo o que houver (chamar de novo não duplica as regiões), e devolve `{ limpar, mostrarOrientacao, escrever, areaAvisos }`. `limpar()` esvazia as duas regiões com `replaceChildren()`. `escrever(texto, tipo = 'programa')` aceita `'programa'`, `'sistema'` ou `'erro'`, cria um `<div class="saida-linha saida-linha--{tipo}">` com `textContent` (nunca HTML) e rola `elemento` até o fim (`elemento.scrollTop = elemento.scrollHeight`). `mostrarOrientacao()` chama `limpar()` e escreve `TEXTOS.orientacaoSaida` como `'sistema'`. Fora da cobertura (FR-001, FR-005) (RF-01)
- [X] T007 [US1] Em `src/ui/workspace.js`, dentro de `criarWorkspace`, criar um `ResizeObserver` sobre `container` que chama `Blockly.svgResize(ws)` a cada mudança de tamanho (research R-03). Não mudar a assinatura de `criarWorkspace`, `serializarBlocos` nem `aoMudar` (FR-006) (RF-01)
- [X] T008 [US1] Em `src/main.js`, criar `const saida = criarPainelSaida(document.getElementById('saida'))` e chamar `saida.mostrarOrientacao()` na abertura. Manter a geração do Portugol e `aplicarAvisos` como estão (depende de T004, T006, T007) (História 1, cenário 2) (RF-01)
- [X] T009 [US1] Validar no navegador (`npm run dev`, configuração `meupia-blocos` de `.claude/launch.json`) os passos 1, 2, 7, 8 e 13 do [quickstart.md](quickstart.md). No passo 8, simular pelo console tanto a Saída longa (200 linhas) quanto o Portugol longo (300 linhas em `#codigo-portugol`) e conferir que cada painel rola sozinho, sem rolagem na página a 1280 px (casos de borda "Saída muito longa" e "Programa grande"). No passo 7, conferir que a barra continua visível ao rolar a página a 800 px. No passo 13, se algum texto do menu de contexto do Blockly aparecer em inglês, sobrescrever a chave correspondente em `Blockly.Msg` dentro de `definirBlocos()` em `src/ui/workspace.js`, com comentário citando R-09, e registrar a chave na mensagem do commit (depende de T005–T008) (FR-001, FR-005, FR-006, SC-001, SC-003) (RF-01, RNF-03)

**Checkpoint**: História 1 completa. Os três painéis aparecem com título e conteúdo inicial, rolam por dentro e empilham abaixo de 1024 px.

---

## Fase 4: História 2 - Ações do projeto sempre à mão (Prioridade: P2)

**Objetivo**: barra com o nome do programa ligado ao Portugol, Executar/Salvar/Carregar posicionados e desabilitados, e o Novo funcionando com confirmação quando há alterações não salvas.

**Teste independente**: ver o campo "Nome do programa" com `MeuPrograma` e os quatro botões; trocar o nome e ver o `algoritmo` mudar; mover o bloco, clicar em Novo, confirmar e ver o projeto novo e a Saída limpa.

- [X] T010 [P] [US2] Escrever `tests/unidade/alteracoes.test.js` com todos os casos da tabela de `contracts/alteracoes.md`: mesmas chaves em outra ordem (em qualquer nível) dão a mesma assinatura; `nome` diferente, variável a mais ou com tipo diferente, bloco a mais, bloco com `x`/`y` diferente e dois blocos trocados no array dão assinaturas diferentes; só `formato` ou `versao` diferentes dão a mesma; campos ausentes equivalem a `nome: ''`, `variaveis: []` e `blocos: {}`; `haAlteracoes(p, assinaturaProjeto(p)) === false`; `haAlteracoes(p2, assinaturaProjeto(p1)) === true` com `p2` alterado; o projeto passado não é modificado (`JSON.stringify` antes = depois). Usar `projetoVazio()` de `src/projeto/formato.js` como base. Deve falhar até T011 (FR-007) (RF-01)
- [X] T011 [US2] Implementar `src/projeto/alteracoes.js` com `assinaturaProjeto(projeto)` e `haAlteracoes(projeto, referencia)` conforme `contracts/alteracoes.md`: `JSON.stringify` de `{ nome, variaveis, blocos }` depois de ordenar recursivamente as chaves dos objetos (arrays mantêm a ordem); sem Blockly e sem DOM; dentro da cobertura (`src/projeto/**` já está no `include` do `vite.config.js`). Implementar até T010 passar (depende de T010) (FR-007) (RF-01)
- [X] T012 [P] [US2] Implementar `src/ui/confirmacao.js` com `confirmar({ titulo, mensagem, confirmar, cancelar }) → Promise<boolean>` conforme `contracts/tela.md` (seção "Diálogo de confirmação") e research R-04: preenche `#dialogo-titulo`, `#dialogo-mensagem`, `#dialogo-confirmar` e `#dialogo-cancelar` com `textContent`, abre com `showModal()`, põe o foco em `#dialogo-cancelar`, resolve `true` só no clique de `#dialogo-confirmar`; Cancelar e `Esc` (evento `cancel`) resolvem `false`; fecha o diálogo e remove os ouvintes antes de resolver, para que uma segunda chamada não resolva a primeira. Fora da cobertura (FR-007, FR-003) (RF-01, RNF-03)
- [X] T013 [P] [US2] Implementar `src/ui/barra.js` com `ligarBarra({ aoMudarNome, aoNovo })`: no evento `input` de `#nome-programa` chama `aoMudarNome(valorBruto)`; no clique de `#botao-novo` chama `aoNovo()`; garante `disabled` e `title = TEXTOS.emBreve` em `#botao-executar`, `#botao-salvar` e `#botao-carregar` (R-10). Exporta também `definirNome(nome)`, que escreve no campo sem disparar `aoMudarNome`. Não criar botão Parar (é da 009). *Na implementação, o `disabled`/`title` ficou só no `index.html` (achado D1 do analyze), conferido pela T002; a `barra.js` não repete esse estado* (FR-002) (RF-01)
- [X] T014 [US2] Em `src/ui/workspace.js`, exportar `recarregarBlocos(ws, blocos)`: `Blockly.serialization.workspaces.load(blocos, ws)` (que já limpa o workspace) seguido de `ws.clearUndo()`, para que o desfazer não volte ao projeto descartado (depende de T007, mesmo arquivo) (FR-007) (RF-01)
- [X] T015 [US2] Em `src/main.js`, ligar a barra e o Novo seguindo o fluxo "Transições do Novo" do [data-model.md](data-model.md):
  - guardar `projeto` (projeto aberto) e `referencia`; `projetoAtual()` devolve `{ ...projeto, blocos: serializarBlocos(ws) }`;
  - `referencia = assinaturaProjeto(projetoAtual())` depois de criar o workspace (nunca direto de `projetoVazio()`, R-05);
  - `aoMudarNome(nome)`: `projeto.nome = nome` (valor bruto; o gerador saneia) e regenerar o Portugol;
  - `aoNovo()`: se `haAlteracoes(projetoAtual(), referencia)`, chamar `confirmar({ titulo: TEXTOS.novoTitulo, mensagem: TEXTOS.novoMensagem, confirmar: TEXTOS.novoConfirmar, cancelar: TEXTOS.cancelar })` e sair se `false`; depois `projeto = projetoVazio()`, `definirNome(projeto.nome)`, `recarregarBlocos(ws, projeto.blocos)`, regenerar o Portugol, `saida.mostrarOrientacao()` e marcar a nova `referencia`. Novo sem alterações não pergunta.
  (depende de T008, T011–T014) (FR-002, FR-007; História 2, cenários 1 e 2) (RF-01)
- [X] T016 [US2] Validar no navegador os passos 3, 4, 9, 10, 11 e 12 do [quickstart.md](quickstart.md), incluindo: depois de mover o bloco e desfazer (Ctrl+Z) até a posição original, Novo não pergunta (R-05) (depende de T015) (FR-002, FR-007) (RF-01)

**Checkpoint**: Histórias 1 e 2 completas. A barra mostra nome e ações, o nome alimenta o `algoritmo`, e o Novo pede confirmação só quando há o que perder.

---

## Fase 5: História 3 - O Portugol é consequência dos blocos (Prioridade: P3)

**Objetivo**: painel Portugol somente leitura, com "Copiar código" que copia exatamente o texto gerado.

**Teste independente**: tentar digitar no painel Portugol e ver que nada muda; clicar em "Copiar código", colar num editor de texto e conferir o Portugol completo.

- [X] T017 [US3] Implementar `src/ui/painel-portugol.js` (research R-06):
  - `mostrarCodigo(pre, codigo)`: `pre.textContent = codigo`;
  - `copiarCodigo(codigo, { pre, mensagem })`: tenta `navigator.clipboard.writeText(codigo)` quando existir; se não existir ou a promessa rejeitar, seleciona o conteúdo de `pre` (`Range` + `getSelection`) e tenta `document.execCommand('copy')`; escreve em `mensagem` `TEXTOS.copiaOk` ou `TEXTOS.copiaFalhou` e limpa depois de 3 s (um novo clique reinicia o prazo). Copia o `codigo` recebido (o `resultado.codigo` com a quebra de linha final), não o `textContent` do painel.
  Fora da cobertura (FR-004) (RF-01, RNF-03)
- [X] T018 [US3] Em `src/main.js`, trocar a escrita direta no `<pre>` por `mostrarCodigo`, guardar o último `resultado.codigo` e ligar o clique de `#botao-copiar` a `copiarCodigo(ultimoCodigo, { pre: #codigo-portugol, mensagem: #mensagem-copia })` (depende de T015, T017; mesmo arquivo) (FR-004; História 3, cenário 2) (RF-01)
- [X] T019 [US3] Validar no navegador os passos 5 e 6 do [quickstart.md](quickstart.md). Conferir também o plano B: abrir o `vite` com `--host` e acessar pelo IP da rede local (contexto não seguro, sem `navigator.clipboard`) e verificar que a cópia ainda funciona ou mostra `TEXTOS.copiaFalhou` (depende de T018) (FR-004; História 3, cenários 1 e 2) (RF-01)

**Checkpoint**: as três histórias completas.

---

## Fase 6: Acabamento

- [X] T020 Rodar `npm test` (unidade + aceitação da 008 no Core real) e `npm run cobertura`; confirmar linhas e branches ≥ 80% no núcleo com `src/projeto/alteracoes.js` medido; versionar `cobertura/` (incluindo `coverage-summary.json`, o relatório HTML e `testes.json`) e o `README.md` com a linha `**Testes:** N · **Cobertura:** X%` atualizada pelo script (depende das fases 3 a 5) (RNF-04)
- [X] T021 Percorrer o [quickstart.md](quickstart.md) inteiro (passos 1 a 14 e a seção Git) numa janela de 1280 × 800 px e numa de 800 px, conferindo SC-003 (nenhum texto em outro idioma na tela, nos menus do Blockly e no diálogo). Registrar no PR o que foi verificado e as capturas de tela das duas larguras (depende de T020) (SC-001, SC-003) (RF-01, RNF-03)

---

## Pendências para a spec 009

Mantidas da 008 (research R-01): no clique em Executar, chamar `verificarExecucao`; com
`permitida: false`, não executar, chamar `saida.limpar()`, `saida.escrever(motivo, 'sistema')`
e `renderizarAvisos(saida.areaAvisos, avisos, (aviso) => destacarBloco(ws, aviso.blocoId))`.
A 009 também habilita `#botao-executar` (removendo `disabled` e o `title` de T013) e cria o
botão Parar. Nada disso é task desta spec.

---

## Dependências e ordem de execução

### Dependências entre fases

- **Setup (Fase 1)**: sem dependências.
- **Fundação (Fase 2)**: T002 e T003 em paralelo; T004 depende das duas. Bloqueia as histórias.
- **História 1 (Fase 3)**: depende da Fundação. T005, T006 e T007 em paralelo; T008 depende de T006 e T007; T009 fecha a história.
- **História 2 (Fase 4)**: depende da Fundação e, por compartilhar `src/main.js` e `src/ui/workspace.js`, da T008 e da T007. T011 depende de T010; T014 vem depois da T007 (mesmo arquivo); T015 depende de T011–T014.
- **História 3 (Fase 5)**: depende da Fundação; T018 vem depois da T015 (mesmo `src/main.js`). T017 pode ser feita em paralelo com a Fase 4.
- **Acabamento (Fase 6)**: depende das fases 3 a 5.

### Arquivos compartilhados (não paralelizar)

- `src/main.js`: T004 → T008 → T015 → T018.
- `src/ui/workspace.js`: T007 → T014 (→ T009, se houver ajuste de `Blockly.Msg`).
- `src/estilos.css`: T004 (base) → T005.

### Dependências com outras specs (specs/README.md)

- Depende só da 008 (base do projeto), já na `main`.
- A 007 reaproveita a regeneração ligada ao campo de nome (T015) e o `mostrarCodigo` (T017).
- A 009 usa `criarPainelSaida` (T006) e `#botao-executar`; a 010 coloca a caixa de entrada no painel Saída.
- A 011 e a 012 habilitam seus botões e atualizam a referência com `assinaturaProjeto` (T011); a 012 pode reaproveitar `confirmar` (T012).

### Dentro de cada história

- Os testes do núcleo são escritos primeiro e falham antes da implementação.
- O núcleo (`src/projeto/`) vem antes da UI (`src/ui/`, `src/main.js`).

---

## Oportunidades de paralelismo

- **Fundação**: T002 e T003.
- **História 1**: T005, T006 e T007.
- **História 2**: T010, T012 e T013 (e T011 assim que a T010 estiver escrita).
- **História 3**: T017 em paralelo com a Fase 4.

### Exemplo: História 2

```text
Task: "T010 tests/unidade/alteracoes.test.js"
Task: "T012 src/ui/confirmacao.js"
Task: "T013 src/ui/barra.js"

Task: "T011 src/projeto/alteracoes.js"
```

---

## Estratégia de implementação

### MVP primeiro (História 1)

1. Fase 1 e Fase 2: a página com a estrutura do contrato, teste estático verde.
2. Fase 3: os três painéis com layout, rolagem e orientação na Saída.
3. **Parar e validar**: `npm run test:unidade` verde e os passos 1, 2, 7, 8 e 13 do quickstart.

### Entrega incremental

1. Setup + Fundação → estrutura pronta.
2. História 1 → MVP (três painéis visíveis).
3. História 2 → barra, nome do programa e Novo com confirmação.
4. História 3 → Portugol somente leitura com "Copiar código".
5. Acabamento → cobertura, README e quickstart completo; seguir com a 007 (ordem do specs/README.md).

---

## Observações

- Commits: `001/Txxx (RF-xx): descrição`, um por task ou por grupo pequeno de tasks.
- Mudanças em spec, plan, contratos ou quickstart durante a implementação: `docs(001) (RF-01): descrição`.
- Nenhuma dependência nova (research R-07). Nenhuma task toca o Core, o gerador ou o adapter.
- Uma entrega com cobertura abaixo de 80% ou com a aceitação da 008 falhando não entra na `main` (princípio IV).
