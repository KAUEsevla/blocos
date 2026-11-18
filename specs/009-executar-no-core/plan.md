# Plano de implementação: Executar o programa pelo meuPiá Core

**Branch**: `009-executar-no-core` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/009-executar-no-core/spec.md` (RF-09, RNF-01,
RNF-02, RNF-06), mais as pendências obrigatórias deixadas pela 008 e pela 003.

**Ponto de partida**: a base está na `main` (008, 001, 007, 002, 003, 006). A 008 já
entregou o adapter do Core (`compilarEExecutar`, motores do navegador e do Node),
`verificarExecucao`, `renderizarAvisos` e `destacarBloco`. A 001 entregou o painel Saída
e o botão Executar desabilitado. Esta spec **liga essas peças à tela** e acrescenta o que
falta. Inventário em [research.md](research.md), R-01.

## Resumo

1. **Execução fora da página** (R-02): o Pyodide e o Core rodam num Web Worker de
   módulo. A página continua respondendo, recebe a Saída enquanto o programa roda e
   pode parar a execução.
2. **Parar** (R-03): `worker.terminate()`, resultado `interrompido`, "Execução
   interrompida pelo usuário" e um worker novo preparado em segundo plano. Sem
   `SharedArrayBuffer`, portanto sem exigir cabeçalhos especiais da hospedagem (RNF-06).
3. **Pendência da 008, bloqueio na tela** (R-09; RF-08): o clique em Executar chama
   `verificarExecucao`. Com avisos, nada é enviado ao Core, a Saída mostra o motivo e a
   lista de avisos na ordem do texto, e clicar num aviso destaca o bloco.
4. **Pendência da 003, uma linha por `escreva`** (R-08; FR-003 da 003): divisor de linhas
   puro e Saída em fluxo, em lotes de 50 ms (R-05). Linha vazia aparece. A Saída da tela
   é comparada com a `saidaEsperada` de todos os casos de aceitação (SC-001).
5. **Pendência da 003, "Olá, mundo!" em menos de 2 minutos** (R-12; SC-002 da 003): o
   quickstart cronometra o roteiro completo no navegador. A aceitação mede o SC-002 desta
   spec (≤ 2 s com o ambiente pronto).
6. **Pendência da 008, lacuna do `compilar(texto)`** ([meuPia/core#14](https://github.com/meuPia/core/issues/14);
   R-04; RNF-01): continua contornada só com `meuPia.compiler.main(arquivo, saida)`, com
   arquivos apenas no sistema virtual do worker, o stdout do compilador separado do
   programa e as falhas do compilador tratadas como "Erro de compilação".
7. **Mensagens** (R-06, R-07, R-10): início (mensagem `preparando` com duas etapas,
   "Executando..."), fim ("Fim do programa", "Erro de compilação", "Erro de execução",
   "Execução interrompida pelo usuário"), tradução pt-BR ampliada dos erros Python e
   "Detalhes técnicos" fechado com o rastro.
8. **Testável sem navegador** (R-11): controlador, executor, serviço do worker, divisor e
   mensagens são núcleo, com transporte e motor injetados. A aceitação roda o executor e
   o serviço reais com o Core 1.4.1 dentro de `worker_threads` do Node.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS; Python do Pyodide só
dentro de `ponte-python.js`. Node.js ≥ 20 para ferramentas e testes.

**Dependências principais**: as mesmas de antes (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-15). O
Web Worker é do navegador; `worker_threads` é do Node.

**Armazenamento**: nenhum. O formato do projeto (v1) não muda. `main.por` e
`output/main.py` existem só na memória do Pyodide, dentro do worker.

**Testes**: Vitest.

- Projeto `unidade`: divisor de linhas, mensagens e relato, controlador (com a pendência
  da 008), executor com `Worker` falso, serviço com motor e relógio falsos, tradução de
  erros ampliada, progresso do motor do navegador com `vi.mock('pyodide')` e estrutura da
  barra.
- Projeto `aceitacao`: `executar.test.js` com o Core real em `worker_threads` ("Olá,
  mundo!", tempo do SC-002, Parar num laço infinito, 1.500 linhas, divisão por zero);
  SC-001 pela Saída da tela em todos os casos; `aoEscrever` igual à `saida`.
- A parte que só existe no navegador (worker do Vite, CDN, botões, destaque do bloco,
  tempos com rede) é verificada pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge),
com suporte a worker de módulo.

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**:

- ≤ 2 s do clique ao fim de um programa simples, com o ambiente pronto (SC-002).
- ≤ 30 s de preparação na primeira execução, com conexão comum, com progresso (SC-003).
- Saída fluida com mais de 1.000 linhas: lotes de no máximo 50 ms, inseridos de uma vez.

**Restrições**:

- Nenhum arquivo do Core é copiado ou modificado; só `meuPia.compiler.main` é usado
  (princípio I, FR-003).
- A versão continua só em `src/config.js` (FR-002).
- O programa nunca sai do computador do estudante (FR-008).
- `src/execucao/` não importa o Pyodide nem toca o DOM, com exceção de
  `src/execucao/worker.js`. `src/ui/` e `src/main.js` seguem fora da cobertura.

**Escala/Escopo**: seis módulos novos em `src/execucao/` (um fora da medição); três
alterados em `src/core/`; três alterados em `src/ui/`, mais `src/main.js`,
`index.html`, `src/estilos.css` e `vite.config.js`; um arquivo de aceitação novo e um
adaptador de `worker_threads`.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | Só `meuPia.compiler.main(arquivo, saida)` e o pacote do PyPI na versão de `src/config.js`. A lacuna do `compilar(texto)` (meuPia/core#14) segue contornada no adapter, isolado e testado (R-04); nada do Core é copiado. Nenhuma lacuna nova. | ✅ |
| II. Portugol válido por construção | O código executado é o texto do painel (FR-001), gerado pela função pura da 008. Bloco incompleto bloqueia a execução na tela, sem chamar o Core (R-09). O gerador não muda. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 009 (RF-09). As pendências citam a origem: RF-08 (008), RF-03 (003), RNF-01 (core#14). Commits por fase do `tasks.md` no formato `009/Txxx-Tyyy (RF-09, …): descrição` e `docs(009) (RF-09): …`, com os testes rodando uma vez antes de cada commit (v2.0.0). As atualizações de contratos da 001 e da 008 vão numa task `docs`. | ✅ |
| IV. Testes e cobertura | Núcleo novo em `src/execucao/`, incluído no `coverage.include`. Só o `worker.js` (cola de navegador) é excluído, declarado no `vite.config.js`. Aceitação com o Core real em `worker_threads`, sem mock do Core. `npm run cobertura` atualiza o relatório e o README. | ✅ |
| V. pt-BR e foco no iniciante | Todas as mensagens padrão em pt-BR (SC-004), testadas. O texto em inglês do Python e o rastro só aparecem em "Detalhes técnicos", fechado. O erro de compilação mostra a linha do Portugol. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Parar por `terminate()` em vez de `SharedArrayBuffer` com COOP/COEP. Sem lista virtualizada nem Playwright. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. `ZeroDivisionError` muda de "Divisão por zero" para "Não é possível dividir por
   zero.", o exemplo da spec. Dois testes da 008 mudam junto, e o contrato da 008 já dizia
   que "a 009 amplia essa tradução".
2. Os textos da execução ficam em `src/execucao/mensagens.js` (núcleo), não em
   `src/ui/textos.js`. O contrato da Saída da 001 ganha essa exceção, como já acontece
   com o `motivo` da 008.
3. O `motor-navegador.js` da 008 nunca rodou num navegador. A 009 é a primeira a usá-lo,
   e o quickstart (passo A) é a prova.
4. Até a 010, um programa com `leia` termina com "O programa pediu mais dados do que os
   informados." A escolha do worker condiciona a entrada interativa da 010 (R-14).

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/009-executar-no-core/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, worker, Parar, core#14, fluxo, mensagens, testes
├── data-model.md        # Fase 1: programa a executar, estados, ResultadoTela, ItemSaida
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── executar.md       # src/execucao/: divisor, mensagens, controlador, executor, protocolo, serviço
│   ├── adapter-core.md   # mudanças em src/core/: aoEscrever, rastro, tradução, progresso
│   └── tela-execucao.md  # barra (Executar/Parar), painel Saída, main.js, vite.config.js
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── execucao/
│   ├── linhas.js             ➕ criarDivisorLinhas (núcleo)
│   ├── mensagens.js          ➕ MENSAGENS_EXECUCAO, relatoDoResultado (núcleo)
│   ├── controlador.js        ➕ criarControladorExecucao: bloqueio, estados, fluxo (núcleo)
│   ├── executor.js           ➕ criarExecutor: worker preguiçoso, Parar, ids (núcleo)
│   ├── servico.js            ➕ criarServicoExecucao: lado do worker, lotes de 50 ms (núcleo)
│   └── worker.js             ➕ self.onmessage → serviço com criarMotorNavegador (fora da medição)
├── core/
│   ├── ponte-python.js       ✏️ stdout em fluxo, rastro, falha do compilador
│   ├── executor-core.js      ✏️ opção aoEscrever, tradução ampliada, mensagem genérica de compilação
│   ├── motor-navegador.js    ✏️ aoProgresso('python' | 'core')
│   └── ambiente.js           (sem mudança)
├── ui/
│   ├── painel-saida.js       ✏️ escreverVarias, escreverDetalhe, mostrarAvisos
│   ├── barra.js              ✏️ aoExecutar, aoParar, mostrarEstadoExecucao
│   └── avisos-ui.js          (sem mudança: renderizarAvisos e destacarBloco passam a ser usados)
├── main.js                   ✏️ executor, controlador, ultimosAvisos, Novo para a execução
└── estilos.css               ✏️ linha vazia visível, .saida-detalhe
index.html                    ✏️ Executar habilitado, botão Parar
vite.config.js                ✏️ worker.format 'es'; cobertura de src/execucao/**

tests/
├── unidade/
│   ├── execucao-linhas.test.js        ➕
│   ├── execucao-mensagens.test.js     ➕
│   ├── execucao-controlador.test.js   ➕ inclui a pendência da 008
│   ├── execucao-executor.test.js      ➕
│   ├── execucao-servico.test.js       ➕
│   ├── executor-core.test.js          ✏️ tradução ampliada
│   ├── motor-navegador.test.js        ✏️ etapas de progresso
│   └── tela-estrutura.test.js         ✏️ Executar habilitado, Parar
└── aceitacao/
    ├── executar.test.js               ➕ Core real em worker_threads
    ├── adapter-core.test.js           ✏️ nova mensagem da divisão por zero; aoEscrever; rastro
    ├── aceitacao.test.js              ✏️ SC-001 pela Saída da tela (divisor) em todos os casos
    └── suporte/
        ├── motor-node.js              ✏️ aoProgresso
        ├── worker-node.js             ➕ adaptador do Worker sobre worker_threads (criarWorkerNode)
        └── worker-node-entrada.js     ➕ entrada do worker_threads: serviço real com criarMotorNode

specs/001-tela-tres-paineis/contracts/tela.md          ✏️ Executar e Parar
specs/001-tela-tres-paineis/contracts/painel-saida.md  ✏️ extensões da 009 e textos do núcleo
specs/008-portugol-valido/contracts/executor-core.md   ✏️ aponta para as ampliações da 009
specs/008-portugol-valido/tasks.md                     ✏️ "Pendências para a spec 009" resolvidas
specs/003-blocos-leia-escreva/research.md              ✏️ R-12: linha da 009 resolvida
```

**Decisão de estrutura**: `src/core/` continua sendo a única porta para o Core
(princípio I). `src/execucao/` é a camada nova entre a tela e o Core: decide **quando**
e **onde** executar e **o que mostrar**, sem saber do DOM nem do Pyodide. A interface
(`src/ui/`, `src/main.js`) só liga as peças. É a mesma divisão que a 007 usou para o
tempo real.

## Pendências para outras specs

Registradas no R-14. Não são tasks desta spec:

- **010** (✅ resolvida pela 010 por reexecução determinística, [R-02](../010-entrada-de-dados/research.md), sem
  `SharedArrayBuffer`; [tasks](../010-entrada-de-dados/tasks.md)): entrada interativa do `leia` dentro do worker (decidir entre
  `SharedArrayBuffer` com isolamento entre origens ou recolher a entrada antes). O
  protocolo já leva `entrada`.
- **005** (✅ resolvida pela 005: Parar num `enquanto verdadeiro` e 1.500 linhas de um `para`,
  montados com blocos em [executar.test.js](../../tests/aceitacao/executar.test.js) e no
  quickstart da 005, [tasks da 005](../005-blocos-repeticao/tasks.md)): repetir no quickstart,
  com blocos, o Parar num laço infinito e as mais de 1.000 linhas.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
