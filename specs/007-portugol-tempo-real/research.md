# Pesquisa (Fase 0): Portugol gerado em tempo real

Decisões que resolvem o contexto técnico do [plan.md](plan.md). A base (Vite, Blockly
12.5.1, gerador, registro, tela) é a das specs 008 e 001 e não é rediscutida aqui.
Nada ficou como "NEEDS CLARIFICATION".

---

## R-01. O que a 001 e a 008 já entregam

**Levantamento** (código na `main` em 2026-11-15):

| Requisito da 007 | Situação na `main` | Falta |
| --- | --- | --- |
| FR-001 atualizar sem ação do estudante | `main.js` chama `atualizarPortugol()` em todo evento não-UI do Blockly (`aoMudar`) e em todo `input` do nome. Variáveis ainda não existem (002). | Suspender durante o arraste (R-02), agrupar eventos (R-03), ponto de entrada para a 002 (`solicitar`). |
| FR-002 até 1 s | Gerar 100 blocos leva poucos ms (teste da 008). A atualização é síncrona, uma por evento. | Uma geração por quadro em vez de uma por evento (R-03). |
| FR-003 só blocos encaixados | **Atendido**: o gerador só visita a cadeia de `COMANDOS` do primeiro `programa` (008/R-13), com testes de soltos em `gerador.test.js` e `avisos-gerador.test.js`. | Nada no texto. |
| FR-004 soltos marcados | Não existe. | Regra pura + marca na interface (R-04). |
| FR-005 manter a rolagem | `mostrarCodigo` troca o `textContent` do `<pre>`; o corpo do painel (`.painel-corpo`) é quem rola. Não há garantia explícita de rolagem. | Guardar/restaurar e não reescrever texto igual (R-06). |
| FR-006 desfazer/refazer | Pilha de desfazer do Blockly ligada por padrão; Ctrl+Z, Ctrl+Shift+Z e Ctrl+Y funcionam; menu de contexto do workspace tem "Desfazer"/"Refazer" em pt-BR. `recarregarBlocos` zera a pilha (001/T014). | Botões visíveis e o estado deles (R-05). |

**Conclusão**: a 007 não reescreve geração nem painel. Ela troca **quando** se gera,
acrescenta a marca de soltos e os botões de desfazer.

---

## R-02. Quais eventos geram de novo, e o arraste

**Decisão**: o atualizador recebe **todos** os eventos do workspace (a interface deixa
de filtrar) e decide:

| Evento | O que faz |
| --- | --- |
| `drag` com `isStart: true` | entra no modo arraste; não gera |
| `drag` com `isStart: false` | sai do modo arraste; agenda uma geração |
| qualquer outro com `isUiEvent: true` (seleção, clique, rolagem, zoom, bolhas) | ignora |
| qualquer evento não-UI durante o arraste | marca "pendente"; não gera |
| qualquer evento não-UI fora do arraste (criar, apagar, mover, mudar campo, mudança intermediária de campo, variáveis do Blockly, `finished_loading`) | agenda uma geração |

A interface também informa `arrastando` (`ws.isDragging()` no momento do evento).
Esse sinal vale **só para o evento em que chega**: um evento não-UI com
`arrastando: true` fica pendente, e o primeiro evento de qualquer tipo com
`arrastando: false` libera o pendente. Ele **não** liga o modo arraste, que só os
eventos `drag` ligam e desligam. Motivo: há gestos em que `isDragging()` é verdadeiro
sem um `drag` de bloco (arrastar um comentário manda `comment_drag` e
`comment_move`); se esse sinal ligasse o modo arraste, nada o desligaria e o Portugol
pararia de atualizar (achado F1 do `/speckit-analyze`).

**Motivo**:
- No Blockly 12, ao **pegar** um bloco encaixado, `BlockDragStrategy.startDrag`
  desencaixa o bloco e dispara um `move` (não-UI). Com o filtro atual, a linha some do
  Portugol no começo do arraste e volta no fim. O caso de borda da spec pede o
  contrário: "o Portugol só muda quando o bloco é solto".
- O mesmo vale para arrastar um bloco novo da caixa de ferramentas: o `create` sai no
  começo do arraste e fica pendente até soltar.
- Soltar na lixeira: o `drag` de fim chega, depois o `delete`; os dois agendam e viram
  uma geração só (R-03).
- `block_field_intermediate_change` não é evento de interface; ele mantém o Portugol
  acompanhando cada tecla ao editar um campo (cenário 2: 5 → 8).

**Alternativas consideradas**: continuar filtrando no `workspace.js` e só checar
`ws.isDragging()`. Rejeitada: o evento de fim de arraste é de interface, seria
descartado, e a geração pendente só sairia na próxima alteração. Também deixaria a
regra fora da cobertura.

---

## R-03. Agrupar eventos numa geração por quadro

**Decisão**: o atualizador agenda a geração com `requestAnimationFrame` (injetado como
`agendar`). Enquanto há uma geração agendada, novos pedidos não agendam outra. Ao
rodar, gera uma vez a partir do estado atual do workspace.

Duas portas de entrada além dos eventos:
- `solicitar()`: agenda como um evento comum (nome do programa, variáveis da 002).
- `atualizarAgora()`: gera na hora e descarta o que estiver agendado. Usado pelo Novo
  (001) e pelo Carregar (012), que marcam a referência de "salvo" logo depois e
  precisam do Portugol já atualizado.

**Motivo**: um encaixe dispara vários eventos (`move`, às vezes `create` e
`change`), e o Blockly entrega todos de uma vez. Gerar uma vez por quadro mantém o
custo fixo por gesto, com espera de no máximo ~16 ms, muito abaixo do 1 s (FR-002).
Com a aba em segundo plano o quadro não roda, mas também não há ninguém olhando; ao
voltar, a geração sai no primeiro quadro.

**Alternativas consideradas**: `setTimeout` com debounce de 100–300 ms. Rejeitada:
acrescenta atraso perceptível ao digitar e não traz ganho com 100 blocos.
`queueMicrotask`: agrupa só o lote atual do Blockly; teclas seguidas no campo de nome
gerariam uma vez cada (aceitável, mas sem vantagem sobre o quadro). Gerar síncrono a
cada evento (como hoje): rejeitado por desperdício e pelo efeito no arraste.

---

## R-04. Blocos fora do programa

**Decisão**:
- Regra pura `blocosForaDoPrograma(blocos)` em `src/portugol/fora-do-programa.js`:
  percorre `blocos.blocks.blocks` (blocos de topo da serialização) e devolve
  `{ blocoId, mensagem }` para **cada bloco de topo que não seja o primeiro
  `programa`**, na ordem da serialização. Mensagem: "Esta pilha está fora do
  programa". Entrada ausente ou malformada → `[]`.
- Só o **primeiro bloco de cada pilha solta** é marcado (é o bloco de topo). Os
  blocos encaixados nele saem do Portugol junto, mas não ganham ícone próprio. Por
  isso o texto fala da **pilha**, e não do bloco. A regra está escrita na spec
  (FR-004 e História 2, cenário 3) desde o achado C1 do `/speckit-analyze`.
- Na interface, a marca usa o ícone de aviso do Blockly com uma **chave própria**:
  `setWarningText(texto, 'fora-do-programa')`. Os avisos de bloco incompleto (008)
  passam a usar a chave `'incompleto'`. `aplicarAvisos(ws, lista, chave)` guarda os
  blocos marcados por chave, então limpar uma não apaga a outra.
- A marca **não é** aviso de execução: não entra em `resultado.avisos` nem em
  `verificarExecucao`. Um bloco solto não impede de executar o programa (ele só não
  faz parte dele).

**Motivo**:
- Só os blocos de topo podem estar fora: tudo o que está encaixado num bloco solto
  está fora também, e tudo o que está encaixado no `programa` está dentro. Olhar só o
  topo dispensa percorrer a árvore e vale para qualquer bloco das specs 002–006.
- Marcar só o topo da pilha evita um ícone por bloco numa pilha de dez. O aviso some
  quando a pilha é encaixada (cenário 2), porque ela deixa de ser topo.
- Um segundo `programa` (que o Blockly não deixa criar, por não ser copiável nem estar
  na caixa de ferramentas, e que a 012 trata como erro de formato) seria marcado como
  fora, coerente com o gerador, que usa o primeiro (008/R-13).
- Chaves separadas: o Blockly 12 aceita vários avisos por bloco
  (`setWarningText(text, id)`). Um bloco incompleto que é solto do programa perde o
  aviso de incompleto (o gerador não o visita mais) e ganha o de fora; com uma chave
  só, a limpeza de um apagaria o outro.

**Alternativas consideradas**:
- `Blockly.Events.disableOrphans` (blocos soltos ficam desabilitados, em cinza).
  Rejeitada: grava o estado desabilitado na serialização (`enabled`/
  `disabledReasons`), o que suja o arquivo salvo (011) e a assinatura de alterações
  (001/R-05), e não mostra uma mensagem em pt-BR explicando o motivo.
- Marcar todos os blocos da pilha solta. Rejeitada pelo ruído visual.
- Tratar o solto como aviso do gerador. Rejeitada: bloquearia a execução, o que a spec
  não pede, e misturaria duas regras diferentes.

---

## R-05. Desfazer e refazer

**Decisão**: usar a pilha de desfazer do Blockly (`ws.undo(false)` para desfazer,
`ws.undo(true)` para refazer). Atalhos e menu de contexto continuam como estão. A 007
acrescenta dois botões no cabeçalho do painel Blocos, **Desfazer** e **Refazer**, com
`title` mostrando o atalho ("Desfazer (Ctrl+Z)", "Refazer (Ctrl+Y)"). Cada botão fica
desabilitado quando a sua pilha está vazia (`ws.getUndoStack().length`,
`ws.getRedoStack().length`), e o estado é recalculado em cada geração do Portugol.

Escopo do desfazer:
- **Blocos**: tudo o que o Blockly registra (criar, apagar, mover, encaixar, mudar
  campo). Desfazer dispara os eventos inversos, que passam pelo atualizador; o
  Portugol volta ao estado anterior (cenário 4).
- **Nome do programa**: é um campo de texto do navegador; Ctrl+Z dentro do campo usa o
  desfazer nativo dele. Não entra na pilha dos blocos (FR-006 fala de "alterações nos
  blocos").
- **Variáveis**: decidido pela 002 (pendência no plan).
- **Novo/Carregar**: zeram a pilha (`recarregarBlocos`, 001/T014); os botões ficam
  desabilitados.

**Motivo**: a pilha do Blockly já agrupa os eventos de um gesto (grupo de eventos),
já está em pt-BR no menu e não custa código. Botões visíveis ajudam o iniciante, que
não conhece o atalho. Ficam no painel Blocos, e não na barra, porque desfazem só
blocos; assim o contrato da barra (001, `tela.md`) não muda.

**Alternativas consideradas**: histórico próprio de projetos serializados (um
instantâneo por alteração). Rejeitada: duplica o que o Blockly faz, gasta memória e
não conversa com Ctrl+Z dentro do workspace. Só atalhos, sem botões: rejeitada pelo
foco no iniciante (princípio V).

---

## R-06. Manter a rolagem do painel Portugol

**Decisão**: `mostrarCodigo(pre, codigo)`:
1. Se `pre.textContent === codigo`, não faz nada.
2. Senão, guarda `scrollTop` e `scrollLeft` do elemento que rola (o corpo do painel,
   `pre.parentElement`), troca o texto e restaura os dois valores. Se o texto novo
   ficou mais curto, o navegador limita a rolagem ao máximo possível.

**Motivo**: o estudante lê um trecho no meio do código enquanto mexe num bloco; a
troca do texto pode levar a rolagem ao topo ou ao fim dependendo do navegador, e o
FR-005 pede que ela fique onde está. Não reescrever texto igual evita trabalho e
piscadas quando o evento não mudou o Portugol (ex.: mover um bloco sem mudar a
ordem).

**Alternativas consideradas**: atualizar só as linhas que mudaram (diff). Rejeitada:
complexidade sem ganho perceptível com 100 blocos (princípio VI). Rolar até a linha
alterada: é o "destacar a linha", fora desta entrega (premissa da spec).

---

## R-07. Como testar

**Decisão**:
1. **Núcleo, `tempo-real.test.js`**: com `agendar` falso (guarda a função e roda quando
   o teste manda) e eventos como objetos simples (`{ type, isUiEvent, isStart }`):
   três eventos seguidos → uma geração; eventos de interface → nenhuma; `drag`
   início → eventos não-UI não geram; `drag` fim → uma geração; `arrastando: true`
   também suspende; `solicitar()` agenda; `atualizarAgora()` gera na hora e cancela o
   agendado; geração agendada depois de `atualizarAgora()` não roda de novo.
2. **Núcleo, `fora-do-programa.test.js`**: projeto vazio → `[]`; soltos → um item por
   bloco de topo, na ordem; bloco dentro do `programa` não aparece; segundo `programa`
   aparece; `blocos` ausente, `blocks` ausente ou não-lista → `[]`; 100 soltos → 100
   itens.
3. **Núcleo, `tempo-real-cenarios.test.js`**: com o registro de teste, uma sequência
   de estados de projeto (vazio → encaixar → mudar campo → soltar → reencaixar →
   voltar ao estado anterior) confere que o Portugol de cada estado só tem os blocos
   encaixados e que `blocosForaDoPrograma` marca exatamente os soltos (SC-001, SC-003).
4. **Estrutura estática**: `tela-estrutura.test.js` confere os botões
   `botao-desfazer` e `botao-refazer` no cabeçalho do painel Blocos, desabilitados no
   HTML, e acrescenta `Undo`/`Redo` às palavras em inglês proibidas.
5. **Navegador**: [quickstart.md](quickstart.md).

**Motivo**: como na 001 (R-08), toda decisão foi para o núcleo; o que sobra na UI é
ligação com Blockly e DOM. Não há ferramenta de teste de navegador no projeto, e
acrescentá-la só para esta spec contraria o princípio VI.

---

## R-08. Dependências

**Decisão**: nenhuma dependência nova. `requestAnimationFrame`, `setWarningText` com
chave, `undo`/`getUndoStack` e `isDragging` são nativos do navegador ou do Blockly
12.5.1.

---

## R-09. Validação com blocos reais

**Decisão**: a validação no navegador dos cenários que precisam de blocos de comando
e de valor fica registrada para a 002 (e repetida na 003 com o `escreva`), em
"Pendências para as specs 002 e 003" no plan. Nesta spec o quickstart valida no
navegador o que já é observável: nome do programa (cenário 3), Portugol estável
durante o arraste do `programa`, botões Desfazer/Refazer com o `programa`, Novo
desabilitando os botões.

**Motivo**: hoje só existe o bloco `programa`, que não é apagável, não tem campo e não
pode ficar solto. Os blocos falsos de `tests/auxiliares/` não têm definição visual. A
regra está coberta pelos testes de unidade; o que falta é ver a ligação funcionando
com blocos de verdade, o que só a 002 permite. É o mesmo tratamento que a 001 deu à
pendência de tela da 008 (001/R-01).

**Alternativas consideradas**: registrar blocos de demonstração só no modo de
desenvolvimento (`import.meta.env.DEV`). Rejeitada: código e definições visuais que
seriam jogados fora na 002, e risco de vazar para o build.
