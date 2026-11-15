# Pesquisa (Fase 0): Tela de três painéis

Decisões que resolvem o contexto técnico do [plan.md](plan.md). A base (Vite, Blockly,
gerador, adapter do Core) é a da spec 008 e não é rediscutida aqui. Nada ficou como
"NEEDS CLARIFICATION".

---

## R-01. Pendência de tela da 008: avisos na Saída e bloqueio do Executar

**Decisão**: **não** implementar nesta spec. A pendência continua na 009, como já está
em "Pendências para a spec 009" no tasks da 008 e na matriz de `specs/README.md`. A
001 entrega o painel Saída com uma área própria para a lista de avisos
(`areaAvisos`, contrato [painel-saida.md](contracts/painel-saida.md)) e o botão
Executar no lugar definitivo.

**Motivo**:
- **Não é observável agora.** Hoje só existe o bloco `programa`, que nunca fica
  incompleto. Os primeiros blocos com encaixe obrigatório chegam nas specs 003 e 006,
  depois da 001 na ordem de implementação. O bloqueio na tela só poderia ser testado
  com os blocos falsos de `tests/auxiliares/`, que não aparecem na interface.
- **O clique em Executar ficaria dividido entre duas specs.** Com o bloqueio aqui, o
  botão bloquearia programas incompletos e não faria nada com os completos. O
  comportamento do Executar (verificar, executar, Parar) fica inteiro na 009 e testável
  de uma vez.
- **A regra já está pronta e testada no núcleo** (`verificarExecucao`, 008/T041), e a
  renderização da lista também (`renderizarAvisos`, `destacarBloco`, 008/T042). Falta
  só ligar, o que cabe numa task da 009.

**Alternativas consideradas**: ligar `verificarExecucao` ao Executar já na 001 e mostrar
"A execução chega numa próxima etapa" para programas válidos. Rejeitada pelos dois
primeiros motivos.

---

## R-02. Layout dos três painéis

**Decisão**: CSS Grid em `src/estilos.css`, importado por `src/main.js` (o Vite injeta o
CSS). A página ocupa `100vh` e tem duas linhas: a barra (altura do conteúdo) e a área
dos painéis (`1fr`). A partir de **1024 px**, a área tem três colunas
`minmax(0, 5fr) minmax(0, 3fr) minmax(0, 2fr)` (Blocos ≈ 50%, Portugol ≈ 30%,
Saída ≈ 20%). Cada painel é `display: grid; grid-template-rows: auto 1fr` (título +
corpo) com `min-height: 0`, e só o corpo rola (`overflow: auto`).

Abaixo de 1024 px (`@media (max-width: 1023.98px)`), a área vira uma coluna, a página
passa a rolar, e cada painel ganha altura mínima própria (Blocos `70vh`, Portugol e
Saída `45vh`). Assim os três continuam acessíveis um abaixo do outro (FR-006). Nesse
modo a barra fica `position: sticky; top: 0`, para continuar visível enquanto a página
rola, como pede a "barra fixa" da História 2.

**Motivo**:
- 1024 px é a largura do SC-001; usar o mesmo número como ponto de quebra deixa o
  critério verificável direto no navegador.
- `minmax(0, …)` e `min-height: 0` impedem que um Portugol longo ou uma Saída longa
  estiquem a coluna ou a página (casos de borda "saída muito longa" e "programa grande",
  FR-005).
- CSS puro, sem dependência (princípio VI).

**Alternativas consideradas**: painéis redimensionáveis com divisória arrastável.
Rejeitada: não é pedida pela spec e exigiria código ou biblioteca extra.
Flexbox: funciona, mas o Grid descreve as duas disposições (linha e coluna) com menos
regras.

---

## R-03. Blockly dentro de um painel que muda de tamanho

**Decisão**: o Blockly é injetado num `<div id="area-blocos">` que preenche o corpo do
painel Blocos (`position: relative` no corpo e `position: absolute; inset: 0` na área).
Um `ResizeObserver` sobre a área chama `Blockly.svgResize(ws)` sempre que o tamanho
muda (janela redimensionada, troca entre três colunas e coluna única). O corpo do
painel Blocos não rola: a rolagem é a do próprio Blockly (barras de rolagem já ligadas
na 008).

**Motivo**: o Blockly mede o contêiner só na injeção; sem `svgResize`, o workspace fica
cortado ou com área morta depois de redimensionar. O `ResizeObserver` cobre todos os
casos com uma única chamada, sem escutar `resize` da janela.

**Alternativas consideradas**: `window.addEventListener('resize')`. Rejeitada: não
percebe mudança de tamanho causada pelo próprio layout (ex.: o media query).

---

## R-04. Confirmação do "Novo"

**Decisão**: diálogo próprio com o elemento `<dialog>` nativo, aberto com
`showModal()`, em `src/ui/confirmacao.js`. Textos: título "Começar um projeto novo?",
mensagem "As alterações que não foram salvas serão perdidas.", botões
**"Descartar e começar"** e **"Cancelar"**. `Esc` e clique em Cancelar devolvem `false`;
o foco inicial fica em **Cancelar** (a ação destrutiva nunca é o padrão).

**Motivo**: os botões do `window.confirm` seguem o idioma do navegador ("OK"/"Cancel"
num navegador em inglês), o que viola FR-003 e SC-003. O `<dialog>` é nativo, acessível
(foco preso, `Esc`), sem dependência, e o mesmo componente serve a 012 (Carregar com
alterações não salvas).

**Alternativas consideradas**: `window.confirm`. Rejeitada pelo idioma dos botões.
Biblioteca de modais: rejeitada (princípio VI).

---

## R-05. O que conta como "alteração não salva"

**Decisão**: comparar a **assinatura canônica** do projeto aberto com a assinatura de
referência, por função pura em `src/projeto/alteracoes.js`:

- `assinaturaProjeto(projeto)` = JSON com chaves em ordem alfabética, em todos os
  níveis, de `{ nome, variaveis, blocos }`. `formato` e `versao` ficam de fora (não são
  conteúdo do estudante).
- `haAlteracoes(projeto, referencia)` = `assinaturaProjeto(projeto) !== referencia`.

A **referência** é tirada do projeto **depois** de carregado no workspace
(`serializarBlocos(ws)`), e não direto de `projetoVazio()`: o Blockly pode completar a
serialização (ex.: campos com valor padrão), e comparar com o JSON de origem acusaria
uma alteração que o estudante não fez. Na 001, a referência é marcada ao abrir a página
e depois de cada Novo; as specs 011 e 012 a marcam depois de salvar e de carregar.

Mover um bloco **conta** como alteração (a posição é salva no arquivo, 011). Mudar só o
nome do programa também conta.

**Motivo**: comparar estados é mais robusto que contar eventos do Blockly: desfazer até
voltar ao estado original volta a "sem alterações", e eventos de interface (seleção,
rolagem, zoom) não interferem. A função pura entra na cobertura e é reaproveitada pelas
specs 011 e 012.

**Alternativas consideradas**: uma flag `sujo` ligada por qualquer evento não-UI do
Blockly. Rejeitada: não volta a "limpo" com desfazer e não é testável fora do navegador.
`JSON.stringify` simples: rejeitado porque a ordem das chaves não é garantida entre
origens diferentes (projeto carregado de arquivo × serializado pelo Blockly).

---

## R-06. "Copiar código"

**Decisão**: `copiarCodigo(texto)` em `src/ui/painel-portugol.js`:

1. Se `navigator.clipboard?.writeText` existir, usa e aguarda a promessa.
2. Senão, ou se ela falhar, seleciona o conteúdo do `<pre>` e tenta
   `document.execCommand('copy')`.
3. Mostra o resultado numa região `aria-live="polite"` ao lado do botão, por 3 s:
   "Código copiado!" ou "Não foi possível copiar. Selecione o código e use Ctrl+C."

O botão fica no cabeçalho do painel Portugol, à direita do título. Copia exatamente
`resultado.codigo` (com a quebra de linha final), não o `textContent` do painel.

**Motivo**: a Clipboard API exige contexto seguro (HTTPS ou `localhost`); o site
publicado e o `vite dev` atendem, mas abrir o build por `file://` ou por IP da rede
local não. O plano B mantém a função útil nesses casos, e a mensagem de falha ensina
o caminho manual.

**Alternativas consideradas**: só `execCommand`. Rejeitada: está obsoleta e pode sumir.
Só Clipboard API: rejeitada pelos contextos não seguros.

---

## R-07. Dependências

**Decisão**: nenhuma dependência nova. Layout (CSS Grid), diálogo (`<dialog>`), cópia
(Clipboard API) e observação de tamanho (`ResizeObserver`) são nativos dos navegadores
alvo.

**Motivo**: princípio VI.

---

## R-08. Como testar uma tela que está fora da cobertura

**Decisão**: três camadas.

1. **Núcleo** (`tests/unidade/alteracoes.test.js`, dentro da cobertura): assinatura
   canônica independe da ordem das chaves; mudar nome, variável, bloco ou posição muda a
   assinatura; `formato`/`versao` não mudam; `haAlteracoes` com a própria referência é
   `false`.
2. **Estrutura estática** (`tests/unidade/tela-estrutura.test.js`): lê `index.html` como
   texto (sem jsdom) e confere `lang="pt-BR"`; os ids do contrato
   [tela.md](contracts/tela.md); os títulos "Blocos", "Portugol" e "Saída" nessa ordem; o
   rótulo "Nome do programa" e o valor inicial `MeuPrograma`; os botões Executar,
   Salvar, Carregar, Novo e "Copiar código"; os botões do diálogo. Também confere que
   nenhum `<button>`, `<label>` ou `title` do HTML contém palavras de uma lista curta em
   inglês (`Run`, `Save`, `Load`, `New`, `Copy`, `Cancel`, `OK`). Isso cobre FR-001,
   FR-002, FR-003 e FR-004 no que é verificável sem navegador.
3. **Navegador** ([quickstart.md](quickstart.md)): layout a 1280 px e a 800 px,
   rolagem independente, tentativa de digitar no Portugol, cópia, Novo com e sem
   alterações. Feito no `npm run dev` com o painel de pré-visualização.

**Motivo**: o princípio IV permite deixar a interface fora da medição. Uma ferramenta de
teste de navegador (Playwright, jsdom) seria dependência nova só para esta spec, sem
ganho proporcional numa PoC (princípio VI). Toda regra com decisão foi movida para o
núcleo, então o que sobra na UI é ligação de DOM.

**Alternativas consideradas**: jsdom + testes dos módulos de `src/ui/`. Rejeitada: o
Blockly no jsdom exige stubs de SVG, e o layout não é calculado no jsdom, então os
pontos mais arriscados (FR-005, FR-006) continuariam manuais.

---

## R-09. Textos do Blockly e SC-003

**Decisão**: manter `Blockly.setLocale(ptBr)` (já feito na 008) e conferir no quickstart
o menu de contexto do workspace e do bloco `programa`. Os controles de zoom e a lixeira
não têm texto. Nenhuma categoria de toolbox existe ainda; os rótulos de categoria serão
das specs 002–006.

**Motivo**: o pacote `blockly/msg/pt-br` traduz os textos do núcleo do Blockly. Se algum
texto em inglês aparecer no quickstart, ele é sobrescrito em `Blockly.Msg` em
`src/ui/workspace.js` e o caso é registrado na task.

---

## R-10. Ações ainda sem comportamento

**Decisão**: Executar, Salvar e Carregar são renderizados como `<button disabled>` com
`title="Disponível em breve"`. Não existe botão Parar nesta spec (ele é da 009 e não
está na lista do FR-002).

**Motivo**: a spec define apenas a posição dessas ações (premissas). Um botão habilitado
que não faz nada confunde o estudante; desabilitado com dica é honesto e não exige
mensagem na Saída. Cada spec dona da ação troca `disabled` e liga o clique.

---

## R-11. `.vite/` no `.gitignore`

**Decisão**: acrescentar `.vite/` na seção "Dependências e build" do `.gitignore`.

**Motivo**: é o cache que o Vite e o Vitest criam na raiz (resultados de testes,
pré-empacotamento); aparece como não rastreado no `git status` desde a 008 e não deve
ser versionado.
