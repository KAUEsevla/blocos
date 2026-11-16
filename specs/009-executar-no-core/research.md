# Pesquisa: Executar o programa pelo meuPiá Core

Spec: [spec.md](spec.md). Plan: [plan.md](plan.md).

Cada item segue o formato **Decisão / Motivo / Alternativas consideradas**.

---

## R-01. Inventário: o que já existe e o que falta

**Já entregue por outras specs (reaproveitado sem recriar):**

| Peça | Onde | Spec | Uso na 009 |
| --- | --- | --- | --- |
| `compilarEExecutar(motor, codigo, entrada)` | `src/core/executor-core.js` | 008 (T019) | Compila e executa no Core; devolve `ResultadoExecucao`. Ganha duas opções (R-05, R-07). |
| `interpretarErroCompilacao`, `traduzirErroExecucao` | `src/core/executor-core.js` | 008 | A tradução é ampliada (R-07), como o contrato da 008 já previa. |
| `PONTE_PYTHON` | `src/core/ponte-python.js` | 008 | Ganha a escrita em fluxo e o rastro técnico (R-05, R-07). |
| `criarMotorNavegador`, `instalarCore`, `ErroAmbiente` | `src/core/motor-navegador.js`, `ambiente.js` | 008 (T022) | Passa a rodar dentro de um Web Worker (R-02) e informa o progresso (R-06). Ainda não foi usado no navegador: a 009 é a primeira a ligá-lo (R-11). |
| `verificarExecucao({ avisos })` | `src/portugol/execucao.js` | 008 (T041) | Bloqueio antes de executar (R-09). |
| `renderizarAvisos`, `destacarBloco` | `src/ui/avisos-ui.js` | 008 (T042) | Lista de avisos na Saída e destaque do bloco (R-09). |
| `criarPainelSaida` (`limpar`, `escrever`, `areaAvisos`) | `src/ui/painel-saida.js` | 001 | Estendido com escrita em lote, detalhe técnico e avisos (R-10). |
| Botão `#botao-executar` | `index.html` | 001 | Hoje `disabled` com "Disponível em breve"; a 009 o habilita e cria o Parar ao lado. |
| Caso `escreva-ola-mundo.json` | `tests/aceitacao/casos/` | 003 | Base do SC-002 da 003 e do SC-002 desta spec (R-12). |

**Pendências obrigatórias que esta spec fecha:**

| # | Origem | Pendência | Onde é resolvida |
| --- | --- | --- | --- |
| P-1 | 008, "Pendências para a spec 009" do [tasks.md](../008-portugol-valido/tasks.md) (RF-08) | Executar não começa com blocos incompletos; a Saída mostra o motivo e lista os avisos na ordem do texto; clicar no aviso destaca o bloco. Teste: com bloco incompleto, `compilarEExecutar` não é chamado. | R-09 |
| P-2 | 003, FR-003 (RF-03) | Cada `escreva` produz uma linha na Saída da tela. | R-08 |
| P-3 | 003, SC-002 e [R-12 da 003](../003-blocos-leia-escreva/research.md) (RF-03) | "Olá, mundo!" montado **e executado** em menos de 2 minutos (a parte de montar já foi medida na 003). | R-12 |
| P-4 | 008, [R-09](../008-portugol-valido/research.md) e [meuPia/core#14](https://github.com/meuPia/core/issues/14) (RNF-01) | O Core não tem `compilar(texto)`; o contorno precisa continuar só com a interface pública agora que a execução vai para a tela. | R-04 |

**O que falta (escopo desta spec):** execução fora da thread da página, botão Parar,
Saída em fluxo (linha a linha), mensagens de início e fim, preparação do ambiente com
progresso, erros em pt-BR com "Detalhes técnicos" e o bloqueio na tela.

---

## R-02. Onde o Core roda: Web Worker dedicado

**Decisão**: o Pyodide e o Core rodam num **Web Worker de módulo**
(`new Worker(new URL('./execucao/worker.js', import.meta.url), { type: 'module' })`).
A página só troca mensagens com ele. O worker é criado no primeiro clique em Executar e
reaproveitado nas execuções seguintes da sessão.

**Motivo**:

- O Pyodide executa Python de forma síncrona. Na thread da página, um `enquanto`
  infinito congelaria a tela inteira, inclusive o botão Parar (História 3).
- Com o worker, a página continua respondendo durante a execução: a Saída recebe as
  linhas enquanto o programa roda e o Parar funciona (R-03).
- Conferido no pacote instalado (`node_modules/pyodide/pyodide.mjs`, 0.25.0): o
  carregador tenta `importScripts` e, quando recebe `TypeError` (o que acontece em
  worker de módulo), usa `await import(url)`. O `loadPyodide` funciona, portanto, num
  worker `type: 'module'`, sem precisar de worker clássico.
- O Vite empacota o worker a partir do `new URL(..., import.meta.url)`. Como o worker
  importa módulos (`pyodide`, `src/core/`), o `vite.config.js` passa a ter
  `worker: { format: 'es' }`.

**Alternativas consideradas**:

- Pyodide na thread principal: mais simples, mas não atende FR-007 (o Parar não pode
  ser clicado durante um laço infinito) nem o caso de borda das 1.000 linhas (a tela
  só mostraria a Saída no fim).
- Worker clássico com `importScripts` do CDN: funciona, mas duplica a forma de carregar
  o Pyodide em relação ao motor do Node e à versão do pacote npm.

---

## R-03. Como parar: encerrar o worker

**Decisão**: Parar chama `worker.terminate()`. A execução pendente termina com o
resultado `{ status: 'interrompido' }`, a Saída mostra "Execução interrompida pelo
usuário" e o editor volta ao estado ocioso na hora. Logo em seguida um worker novo é
criado e preparado em segundo plano, para a próxima execução não começar do zero.

**Motivo**:

- `terminate()` interrompe qualquer código, inclusive um laço Python sem `escreva`, e
  não exige configuração especial do servidor.
- A outra forma de interromper o Pyodide (`pyodide.setInterruptBuffer`) usa
  `SharedArrayBuffer`. Para isso a página precisa de isolamento entre origens (cabeçalhos
  COOP/COEP), que uma hospedagem estática comum não envia (RNF-06).
- Os arquivos do Pyodide e o pacote do Core ficam no cache HTTP do navegador, então
  recriar o worker não baixa tudo de novo (premissa: "as seguintes, na mesma sessão,
  não" precisam de internet).

**Alternativas consideradas**:

- `setInterruptBuffer` com `SharedArrayBuffer`: preserva o ambiente, mas depende de
  COOP/COEP. Fica registrado para a 010, que pode precisar do mesmo isolamento para a
  entrada interativa (R-14).
- Limite de tempo automático: a spec pede que o estudante decida quando parar, e um
  programa legítimo pode demorar.

---

## R-04. Lacuna do `compilar(texto)` (meuPia/core#14): contorno só pela interface pública

**Decisão**: a 009 mantém o adapter da 008 (`ponte-python.js`). Ele grava `main.por`,
chama `meuPia.compiler.main("main.por", "output")` com o stdout capturado e executa
`output/main.py`. O contorno fica mais robusto em três pontos, ainda sem tocar o Core
(princípio I, FR-003):

1. **Arquivos só no sistema de arquivos virtual do Pyodide.** O `main.por` e o
   `output/main.py` existem apenas na memória do worker (MEMFS). Nada é gravado no
   computador do estudante nem enviado a um servidor (FR-008).
2. **Saída do compilador separada da saída do programa.** O texto que o `main()`
   imprime (progresso e erro) é capturado só durante a compilação e nunca aparece na
   Saída. A Saída recebe apenas o que o programa escreve (FR-004).
3. **Falha inesperada do compilador.** Se o `main()` levantar uma exceção ou chamar
   `sys.exit` em vez de devolver um código, a ponte trata como "não compilou", guarda o
   rastro em `detalhe` e o estudante vê "Erro de compilação" com mensagem genérica em
   pt-BR (R-07). Antes disso, a exceção subiria como erro do JavaScript e a tela
   ficaria presa em "Executando...".

Cada execução apaga `output/main.py` antes de compilar (já era assim) e executa o
Python gerado com `globals` novos. Duas execuções seguidas não compartilham variáveis
nem saída, como a 008 já garante nos testes de aceitação.

**Motivo**: a issue continua aberta e a versão congelada (`meupia-core` 1.4.1) não vai
mudar durante a turma (FR-002). O editor não depende da issue. Se uma versão futura
expuser `compilar(texto)`, só `ponte-python.js` muda.

**Alternativas consideradas**: importar módulos internos do Core (lexer, parser,
gerador) para compilar o texto direto. Isso violaria o princípio I, porque usa
interfaces que não são públicas e podem mudar sem aviso.

---

## R-05. Saída em fluxo: o programa escreve, a tela mostra

**Decisão**:

- `compilarEExecutar` ganha um quarto parâmetro opcional, `{ aoEscrever }`. A ponte
  Python troca o `sys.stdout` por um objeto que grava no buffer (como antes) e, se
  `aoEscrever` existir, também o chama com cada pedaço escrito. O resultado final
  continua trazendo a `saida` completa, então a aceitação da 008 não muda.
- No worker, os pedaços vão para a página em lotes. A ponte junta os pedaços e só
  envia (`postMessage`) quando passam 50 ms desde o último envio, e envia o resto no
  fim. Isso funciona porque o `postMessage` sai do worker mesmo com o Python ocupado.
  Timers não funcionariam, porque não disparam durante a execução síncrona.
- Na página, um divisor de linhas puro (`criarDivisorLinhas`, R-08) transforma os
  pedaços em linhas completas.

**Motivo**: o caso de borda de mais de 1.000 linhas e o laço infinito da História 3
precisam mostrar as linhas enquanto o programa roda. Um `postMessage` por `print` com
milhares de linhas sobrecarregaria a página; o lote de 50 ms mantém a Saída fluida e
ainda parece imediata.

**Alternativas consideradas**:

- Mostrar a Saída só no fim: atende os programas simples, mas um laço infinito não
  mostraria nada antes do Parar.
- Enviar uma mensagem por `print`: simples, mas milhares de mensagens travam a página.

---

## R-06. Preparar o ambiente e mostrar o progresso

**Decisão**:

- O ambiente é preparado no **primeiro clique** em Executar, não ao abrir a página. Ao
  clicar, a Saída é limpa e mostra "Preparando o ambiente do meuPiá. Na primeira vez
  isso pode levar até 30 segundos." (cenário 2 da História 1).
- `criarMotorNavegador` recebe um `aoProgresso(etapa)` opcional e o chama em duas
  etapas: `'python'` (antes do `loadPyodide`) e `'core'` (antes do `instalarCore`).
  A Saída mostra "Carregando o Python (1 de 2)..." e "Instalando o meuPiá Core
  (2 de 2)..." (SC-003, "indicação de progresso").
- Quando o ambiente fica pronto, a Saída mostra "Executando..." e o programa roda em
  seguida. Nas execuções seguintes, só "Executando...".
- Se a preparação falhar (`ErroAmbiente`), a Saída mostra a mensagem que a 008 já
  definiu: "Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e
  tente de novo." O worker com falha é descartado, e o próximo clique tenta de novo
  com um worker novo (caso de borda "sem internet").

**Motivo**: a spec define que a primeira execução informa a preparação. Preparar ao
abrir a página baixaria vários megabytes mesmo para quem só monta blocos. Duas etapas
com nome dizem onde a espera está sem prometer uma porcentagem que o Pyodide não
informa de forma confiável.

**Alternativas consideradas**:

- Pré-carregar ao abrir a página: a primeira execução seria mais rápida, mas o custo
  cai sobre todos os usuários e contradiz o cenário 2.
- Barra de porcentagem: o `loadPyodide` não expõe o progresso do download.

---

## R-07. Mensagens de erro em pt-BR e "Detalhes técnicos"

**Decisão**:

- **Erro de compilação** (`status: 'erro_compilacao'`): a Saída mostra
  "Erro de compilação" e a mensagem do Core, que já vem em pt-BR (`Erro sintático na
  linha L, coluna C: …`). Se o Core informou a linha, a Saída mostra também
  "Linha L: <texto daquela linha do Portugol>", tirado do código executado. Quando o
  texto não traz a marca `[COMPILATION ERROR]:` (por exemplo, o compilador falhou com
  uma exceção, R-04), a mensagem é genérica: "O meuPiá Core não conseguiu compilar o
  programa." Assim nenhum texto em inglês aparece por padrão.
- **Erro de execução** (`status: 'erro_execucao'`): as linhas escritas antes do erro
  ficam na Saída. Depois vêm "Erro de execução" e a mensagem amigável. A tabela de
  `traduzirErroExecucao` passa a ser:

  | Exceção Python | Mensagem |
  | --- | --- |
  | `ZeroDivisionError` | "Não é possível dividir por zero." (exemplo da spec; antes "Divisão por zero") |
  | `ValueError` de `int()`/`float()` | "O valor digitado não é um número." |
  | `EOFError` | "O programa pediu mais dados do que os informados." (R-14) |
  | `TypeError` | "Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número)." |
  | `OverflowError` | "O número ficou grande demais para ser calculado." |
  | `MemoryError` | "O programa usou memória demais." |
  | outras | "O programa parou com um erro durante a execução." |

- **Rastro técnico**: a ponte devolve `traceback.format_exc()` e ele vai para
  `erro.detalhe`. Na compilação, `detalhe` é o texto bruto do compilador. A Saída
  mostra `detalhe` só dentro de um `<details>` fechado com o título
  "Detalhes técnicos" (cenário 3 da História 2).

**Motivo**: FR-005 e SC-004 pedem 100% das mensagens padrão em pt-BR. A mensagem do
Python (`division by zero`) e o rastro só aparecem quando o estudante abre os detalhes.
A linha do Portugol ajuda o estudante a ligar o erro ao bloco (cenário 1 da História 2).

**Alternativas consideradas**:

- Traduzir a mensagem do Python palavra por palavra: frágil e incompleto.
- Mapear a linha do Python gerado de volta para a linha do Portugol nos erros de
  execução: o Core não fornece esse mapa. Fica fora do escopo.

---

## R-08. Uma linha por `escreva` na Saída (FR-003 da 003)

**Decisão**: o Core transforma cada `escreva` em um `print`, que termina em `\n`
(confirmado pela aceitação da 003: `escreva("Idade: ", idade)` produz `"Idade: 15\n"`).
O divisor de linhas puro `criarDivisorLinhas()` recebe os pedaços na ordem, devolve
as linhas completas (até cada `\n`) e guarda o pedaço sem `\n` até o próximo. No fim
da execução, `finalizar()` devolve o resto, se houver. Regras:

- `"a\n\n"` vira `["a", ""]`: o `escreva("")` é uma linha vazia e aparece como linha
  vazia na Saída (o CSS dá altura mínima a `.saida-linha:empty`).
- O `\n` final não cria uma linha vazia a mais.
- `\r\n` é tratado como `\n`.
- O texto entra com `textContent` (contrato da 001), então aspas, barras e `<` saem
  exatamente como escritos (caso `texto-especial.json`).

O teste de SC-001 passa todos os casos de aceitação pelo divisor e compara as linhas
com `saidaEsperada` dividida da mesma forma. Isso prova que a Saída da tela é idêntica
à saída do Core em 100% dos casos.

**Motivo**: a Saída da tela é o lugar onde o FR-003 da 003 se cumpre. Separar o
divisor da interface deixa a regra testável sem DOM.

**Alternativas consideradas**: dividir só a `saida` completa no fim. É mais simples,
mas não serve para a Saída em fluxo (R-05).

---

## R-09. Bloqueio na tela por blocos incompletos (pendência P-1 da 008)

**Decisão**: o clique em Executar passa por um controlador puro
(`criarControladorExecucao`, contrato [executar.md](contracts/executar.md)):

1. Força a geração pendente (`tempoReal.atualizarAgora()`) e lê o `codigo` e os
   `avisos` da geração. O código executado é sempre o texto exibido no painel Portugol
   (FR-001).
2. Chama `verificarExecucao({ avisos })` (008/T041).
3. Se `permitida` for `false`: **não** chama o executor, limpa a Saída, escreve
   `motivo` como erro ("O programa tem blocos incompletos. Complete-os para executar.")
   e chama `saida.mostrarAvisos(avisos, aoClicar)`. Essa função usa
   `renderizarAvisos(saida.areaAvisos, ...)` (008/T042), e
   `aoClicar = (aviso) => destacarBloco(ws, aviso.blocoId)`.
4. Se `permitida` for `true`: segue o fluxo da execução (R-10).

Os avisos aparecem na ordem do texto, a mesma de `resultado.avisos` (garantia da 008).

**Teste** (exigido pela pendência): com um executor falso, um programa com aviso não
chama `executar` do executor, e a Saída falsa recebe o motivo e os avisos na mesma
ordem. Chamar o `aoClicar` do segundo aviso chama `destacar` com o `blocoId` dele. A
seleção real do bloco no Blockly é conferida no quickstart.

**Motivo**: a matriz de [specs/README.md](../README.md) registra que a 009 atende RF-08
nesse ponto. Um controlador com dependências injetadas deixa o comportamento do clique
na cobertura, enquanto `src/main.js` só liga as peças.

**Alternativas consideradas**: pôr a lógica direto em `src/main.js`. O arquivo fica fora
da cobertura e o teste exigido pela pendência não seria possível em Node.

---

## R-10. Estados do editor, botões e mensagens de início e fim

**Decisão**: o controlador tem três estados: `ocioso`, `preparando` e `executando`.

| Estado | Executar | Parar | Saída |
| --- | --- | --- | --- |
| `ocioso` | habilitado | desabilitado | resultado anterior ou orientação |
| `preparando` | desabilitado | habilitado | mensagem `preparando` e as etapas (R-06) |
| `executando` | desabilitado | habilitado | "Executando...", depois as linhas do programa |

A ordem na Saída segue FR-004: limpar, aviso de início, linhas do programa e aviso de
fim. O aviso de fim é um destes:

| Resultado | Aviso de fim (`tipo`) |
| --- | --- |
| `ok` | "Fim do programa" (`sistema`) |
| `erro_compilacao` | "Erro de compilação", mensagem, linha (`erro`) e "Detalhes técnicos" |
| `erro_execucao` | "Erro de execução", mensagem (`erro`) e "Detalhes técnicos" |
| `interrompido` | "Execução interrompida pelo usuário" (`sistema`) |
| falha do ambiente | mensagem do `ErroAmbiente` (`erro`) |

Um programa sem `escreva` mostra "Executando..." e "Fim do programa" (caso de borda).
O clique em Executar fora do estado `ocioso` é ignorado, o que evita duas execuções
simultâneas.

O botão Parar fica na barra, logo depois do Executar: `<button type="button"
id="botao-parar" disabled>Parar</button>`. O Executar perde o `disabled` e o
`title="Disponível em breve"` (o contrato [tela.md da 001](../001-tela-tres-paineis/contracts/tela.md)
e o teste `tela-estrutura.test.js` são atualizados).

**Motivo**: FR-004, FR-006, FR-007 e o cenário 3 da História 1. Os textos ficam num
módulo do núcleo (`src/execucao/mensagens.js`), testado, como o `motivo` da 008 já fica
em `src/portugol/execucao.js`.

**Alternativas consideradas**: um botão só que alterna entre Executar e Parar. A spec
descreve os dois botões e o estado de cada um (cenário 3).

---

## R-11. Testar a execução sem navegador

**Decisão**: a lógica fica em módulos puros, com o transporte injetado, e é testada em
três níveis:

| Nível | O que roda | Arquivo |
| --- | --- | --- |
| Unidade (Node, sem Pyodide) | Divisor de linhas, mensagens, montagem do relato, controlador com executor e Saída falsos, cliente do worker com `Worker` falso, serviço do worker com motor falso | `tests/unidade/execucao-*.test.js` |
| Aceitação (Node, Core real) | Cliente do worker e serviço reais, com o Pyodide e o Core 1.4.1 dentro de um `worker_threads` do Node (adaptador mínimo para a mesma interface do `Worker` do navegador) | `tests/aceitacao/executar.test.js` |
| Navegador (manual) | Worker do Vite, CDN, botões, destaque do bloco, tempos | [quickstart.md](quickstart.md) |

A aceitação com `worker_threads` prova, com o Core real:

- o "Olá, mundo!" chega em fluxo e termina com `ok`;
- um programa escrito à mão com `enquanto verdadeiro faca` (o bloco é da 005) é
  interrompido por `parar()`: o resultado é `interrompido` e uma execução seguinte
  funciona;
- um programa à mão com 1.500 `escreva` chega inteiro, em mais de um lote e na ordem;
- a divisão por zero preserva as linhas anteriores e traz `detalhe` com o rastro.

**Prova rápida e plano B**: antes de escrever a cola do Node (tasks, T013), um script
temporário roda `loadPyodide()` dentro de um `worker_threads` e confere que
`runPython('1+1')` dá `2`. Se o Pyodide não carregar no `worker_threads`, o plano B é
trocar só o transporte da aceitação: o `criarWorkerNode` passa a ser um adaptador que
roda o `criarServicoExecucao` com `criarMotorNode` **num processo filho**
(`child_process.fork`, mensagens por `process.send`), com o mesmo formato
`{ postMessage, terminate, onmessage }`. O executor, o serviço e os testes não mudam, e
`terminate` vira `child.kill()`, o que continua provando o Parar. O erro encontrado é
registrado aqui.

Só `src/execucao/worker.js` (cinco linhas que ligam `self.onmessage` ao serviço com o
motor do navegador) fica fora da medição, declarado no `vite.config.js` como interface
de navegador, ao lado de `src/ui/**`.

**Motivo**: princípio IV. Os testes de aceitação usam o Core real, e a parte que só
existe no navegador fica mínima e é conferida no quickstart.

**Alternativas consideradas**: testes de ponta a ponta com navegador (Playwright). Seria
uma dependência nova, sem justificativa para uma PoC (princípio VI).

---

## R-12. Tempos: SC-002 e SC-003 desta spec e SC-002 da 003

**Decisão**:

- **SC-002 (até 2 s depois do ambiente pronto)**: a aceitação mede, com o worker do
  Node já preparado, o tempo entre `executar(olaMundo)` e o resultado. O limite do
  teste é 2.000 ms. No navegador, o quickstart (passo B) mede pelas DevTools, na aba
  Desempenho: grava do clique até "Fim do programa" e lê a duração na linha do tempo.
  Nenhum log de medição é acrescentado ao código.
- **SC-003 (até 30 s na primeira execução, com progresso)**: depende da rede e não é
  automatizável. O quickstart mede numa conexão comum, com cache limpo, e confere que
  as duas etapas aparecem.
- **SC-002 da 003 ("Olá, mundo!" montado e executado em menos de 2 minutos)**: o
  quickstart cronometra o roteiro completo, da página aberta até a linha "Olá, mundo!"
  na Saída. Ele inclui a primeira preparação do ambiente (até 30 s) e a montagem, que a
  003 já mediu ([R-12 da 003](../003-blocos-leia-escreva/research.md)).

**Motivo**: os tempos que dependem do Core são medidos onde o Core roda de verdade. Os
que dependem da rede e da pessoa ficam no quickstart, com o resultado anotado.

**Alternativas consideradas**: medir o SC-003 na CI. O tempo da CI não representa a
"conexão comum" de um estudante.

---

## R-13. Muitas linhas na Saída

**Decisão**: o painel ganha `escreverVarias(linhas, tipo)`. Ele monta um
`DocumentFragment` por lote (R-05), acrescenta tudo de uma vez e rola até o fim uma
única vez. Não há limite de linhas: a spec pede que a Saída "continua mostrando tudo".
Num laço infinito com `escreva`, quem limita é o Parar.

**Motivo**: inserir e rolar linha por linha força o navegador a recalcular a tela
milhares de vezes. Por lote, 1.500 linhas são poucas operações.

**Alternativas consideradas**:

- Lista virtualizada: complexidade desnecessária para a escala da PoC.
- Limite de linhas: contradiz o caso de borda.

---

## R-14. Achados para outras specs

| Para | Item |
| --- | --- |
| 010 | ✅ Resolvida pela 010 por reexecução determinística ([R-02](../010-entrada-de-dados/research.md)), sem `SharedArrayBuffer`; [tasks](../010-entrada-de-dados/tasks.md). Registro original: até a 010, um programa com `leia` executado pela tela recebe entrada vazia e termina com "O programa pediu mais dados do que os informados." A 010 precisa de entrada **interativa** num worker. O `setStdin` do Pyodide é síncrono, então a espera pela digitação exige `SharedArrayBuffer` com `Atomics.wait`, e isso pede isolamento entre origens (COOP/COEP; no GitHub Pages, um service worker como o `coi-serviceworker`). A alternativa sem isolamento é recolher a entrada antes de executar. A decisão é da 010; o protocolo do worker (contrato [executar.md](contracts/executar.md)) já leva `entrada` na mensagem `executar`. |
| 005 | Quando o `enquanto` existir, o quickstart da 005 deve repetir no navegador os passos de Parar e de mais de 1.000 linhas, montados com blocos. A 009 os prova na aceitação com Portugol escrito à mão (R-11). |
| 012 | Nada novo. |

---

## R-15. Dependências

**Decisão**: nenhuma dependência nova. O Web Worker é do navegador; `worker_threads` é
do Node; o Pyodide (0.25.0) já está no `package.json`. A única mudança de configuração é
`worker: { format: 'es' }` e a cobertura no `vite.config.js`.

**Motivo**: princípio VI.
