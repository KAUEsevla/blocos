# Plano de implementação: Entrada de dados durante a execução

**Branch**: `010-entrada-de-dados` | **Data**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/010-entrada-de-dados/spec.md` (RF-10), mais as
pendências obrigatórias deixadas pela 009, pela 003 e pela 002.

**Ponto de partida**: a base está na `main` (008, 001, 007, 002, 003, 006, 009). A 009
entregou a execução num Web Worker, o Parar por `terminate()` e a Saída em fluxo. Hoje um
programa com `leia` executado pela tela recebe entrada vazia e termina com "O programa
pediu mais dados do que os informados." A 003 entregou o bloco `leia` com o campo de
variável da 002. Inventário em [research.md](research.md), R-01.

## Resumo

1. **Pendência da 009, entrada do `leia` dentro do worker** (R-02; P-1): reexecução
   determinística. O programa roda até o primeiro `leia` sem valor, a ponte o interrompe e
   o worker pede o valor à página. Com o valor, o `output/main.py` já compilado roda de
   novo desde o começo, com todas as entradas confirmadas. Sem `SharedArrayBuffer`,
   COOP/COEP ou service worker (RNF-06), sem dependência nova. Protótipo conferido no Core
   1.4.1 real.
2. **Saída sem repetição** (R-05): o que já foi enviado à página é conferido e descartado
   na rodada seguinte. Se a saída divergir, a execução para com erro.
3. **Pendência da 002/003, campo de variável** (R-03; P-3): o nome da variável pedida sai
   da linha do Python que chamou `input()`. O tipo sai do registro de variáveis da 002, o
   mesmo do campo `VAR` do `leia`. O bloco `leia` não muda.
4. **Pedido na Saída** (R-06, R-08; FR-002, FR-005, SC-002): "Digite o valor de nome
   (cadeia)", dica por tipo, campo com Enter e botão Confirmar dentro do painel Saída. O
   valor confirmado vira uma linha `entrada`, com destaque visual próprio (FR-003).
5. **Pendência da 003, real com vírgula** (R-07; P-2): o valor vai como digitado (FR-004).
   A dica do real lembra o ponto, e o erro do Core para `1,72` ganha o complemento "Use
   ponto para separar as casas decimais, por exemplo 1.72." Sem issue no Core: é o
   comportamento do Portugol, não uma lacuna.
6. **Parar com o campo aberto** (R-09; História 2): o mesmo `terminate()` da 009, com
   "Execução interrompida pelo usuário" e o campo fechado.
7. **Testável sem navegador** (R-10): adapter, serviço, executor, controlador e textos
   são núcleo. A aceitação roda o worker real em `worker_threads` e fornece as entradas
   uma a uma por `aoPedirEntrada` (SC-001).

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS; Python do Pyodide só
dentro de `ponte-python.js`. Node.js ≥ 20 para ferramentas e testes.

**Dependências principais**: as mesmas de antes (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-11).

**Armazenamento**: nenhum. O formato do projeto (v1) não muda. As entradas confirmadas
existem só na memória do worker, durante a execução.

**Testes**: Vitest.

- Projeto `unidade`: textos do pedido (`entrada.js`), tradução da vírgula, serviço com
  motor e relógio falsos (pedido, reexecução, saída descartada, divergência), executor
  com `Worker` falso, controlador com Saída falsa.
- Projeto `aceitacao`: adapter interativo com o Core real (quatro tipos, `enquanto`,
  valor vazio, vírgula); `executar.test.js` com o worker real (História 1, três `leia`,
  Parar com pedido aberto, SC-001 interativo); caso novo `leia-real-virgula.json`.
- O que só existe no navegador (campo, foco, Enter, destaque) é verificado pelo
  [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: depois do Enter, o programa continua em menos de 0,5 s nos
programas de exemplo (reexecução de milissegundos). As metas da 009 não mudam.

**Restrições**:

- O Core não é copiado nem alterado. A troca do `input` vale só no dicionário global do
  `exec` do programa gerado (princípio I, R-03).
- O valor chega ao programa exatamente como digitado (FR-004).
- Nenhuma janela ou caixa de diálogo do navegador (SC-002).
- `src/execucao/` continua sem DOM e sem Pyodide, com exceção de `worker.js`.

**Escala/Escopo**: um módulo novo no núcleo (`src/execucao/entrada.js`); cinco
alterados no núcleo (`ponte-python.js`, `executor-core.js`, `servico.js`, `executor.js`,
`controlador.js`); `painel-saida.js`, `main.js` e `estilos.css` na interface; um caso de
aceitação novo.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | Só `meuPia.compiler.main` e o pacote do PyPI na versão de `src/config.js`. O `input` é trocado no ambiente do `exec`, sem tocar o Core. O nome da variável sai da forma do Python gerado, que não é interface pública. Essa lacuna (o Core não informa qual variável o `leia` preenche) tem adapter isolado em `ponte-python.js`, testado na aceitação dos quatro tipos e com o pedido genérico como queda, e vira issue em `meuPia/core`: [meuPia/core#18](https://github.com/meuPia/core/issues/18), com o texto no R-03 (T031). A vírgula não é lacuna (R-07). | ✅ |
| II. Portugol válido por construção | O gerador e o bloco `leia` não mudam. O código executado continua o do painel. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 010 (RF-10). As pendências citam a origem: P-1 (009, RF-09/RF-10), P-2 (003, RF-03), P-3 (002/003, RF-02/RF-03). Commits por fase no formato `010/Txxx-Tyyy (RF-10, …): descrição` e `docs(010) (RF-10): …`, com os testes rodando uma vez antes de cada commit. | ✅ |
| IV. Testes e cobertura | Núcleo novo e alterado dentro de `src/execucao/**` e `src/core/**`, já medidos. Aceitação com o Core real em `worker_threads`, sem mock do Core. `npm run cobertura` atualiza o relatório e o README. | ✅ |
| V. pt-BR e foco no iniciante | Rótulo, dicas, botão e o complemento da vírgula em pt-BR, com as palavras do Portugol para os tipos. O campo fica dentro da Saída, sem janela. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Reexecução em vez de `SharedArrayBuffer`/COOP/COEP ou service worker. O estado da execução não ganha valor novo. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. A reexecução depende de os blocos serem determinísticos (R-02). A conferência do
   prefixo (R-05) transforma a premissa num erro visível. Uma spec futura com número
   aleatório, data ou hora precisa rever o R-02.
2. `_meupia_executar` deixa de usar o `setStdin` do Pyodide e passa a ler uma lista
   própria. Sem `interativo`, o resultado é o mesmo da 008/009 (inclusive o `EOFError`
   da entrada esgotada), e a aceitação existente prova isso.
3. Um valor com quebra de linha não chega pelo campo (`<input>` de uma linha). Pela API,
   o valor vai inteiro para um único `input()`, diferente do `setStdin`, que dividia por
   linha. Nenhum caso existente usa quebra de linha na entrada.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/010-entrada-de-dados/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, pausa por reexecução, variável, protocolo, vírgula
├── data-model.md        # Fase 1: pedido de entrada, entrada digitada, execução pendente
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── entrada.md        # src/execucao/: textos, protocolo, serviço, executor, controlador
│   ├── adapter-core.md   # mudanças em src/core/: modo interativo, continuarExecucao, vírgula
│   └── tela-entrada.md   # painel Saída (pedirEntrada), main.js, estilos
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── execucao/
│   ├── entrada.js            ➕ criarPedidoEntrada, TEXTOS_ENTRADA (núcleo)
│   ├── servico.js            ✏️ interativo, pedido_entrada, entrada, reexecução com descarte
│   ├── executor.js           ✏️ aoPedirEntrada, mensagem entrada
│   ├── controlador.js        ✏️ variaveis do programa, pedido à Saída, linha 'entrada'
│   └── worker.js             (sem mudança)
├── core/
│   ├── ponte-python.js       ✏️ _meupia_input, _MeupiaPedidoEntrada, lista de entrada
│   └── executor-core.js      ✏️ interativo, aguardando_entrada, continuarExecucao, vírgula
├── ui/
│   └── painel-saida.js       ✏️ pedirEntrada, cancelarEntrada, tipo 'entrada'
├── main.js                   ✏️ obterPrograma devolve as variáveis
└── estilos.css               ✏️ campo de entrada, .saida-linha--entrada

tests/
├── unidade/
│   ├── execucao-entrada.test.js       ➕
│   ├── execucao-servico.test.js       ✏️ modo interativo
│   ├── execucao-executor.test.js      ✏️ aoPedirEntrada
│   ├── execucao-controlador.test.js   ✏️ pedido, linha 'entrada', Parar com campo aberto
│   └── executor-core.test.js          ✏️ complemento da vírgula
└── aceitacao/
    ├── adapter-core.test.js           ✏️ interativo e continuarExecucao no Core real
    ├── executar.test.js               ✏️ História 1 e 2, SC-001 interativo
    └── casos/
        └── leia-real-virgula.json     ➕ P-2

specs/009-executar-no-core/research.md            ✏️ R-14: linha da 010 resolvida
specs/009-executar-no-core/plan.md                ✏️ pendência da 010 resolvida
specs/009-executar-no-core/contracts/executar.md  ✏️ aponta para as mensagens novas
specs/003-blocos-leia-escreva/plan.md             ✏️ pendência da 010 resolvida
specs/003-blocos-leia-escreva/research.md         ✏️ R-02 aponta para a 010
specs/001-tela-tres-paineis/contracts/painel-saida.md  ✏️ pedirEntrada e linha 'entrada'
specs/005-blocos-repeticao/spec.md                ✏️ Premissas: leia dentro de laço
```

**Decisão de estrutura**: a mesma da 009. `src/core/` continua sendo a única porta para o
Core (princípio I) e é o único lugar que sabe do `input()`. `src/execucao/` decide quando
pedir, o que reexecutar e o que mostrar, sem DOM nem Pyodide. A interface só desenha o
campo e devolve o valor.

## Pendências para outras specs

Registradas no R-12. Não são tasks de implementação desta spec:

- **005** (✅ resolvida pela 005:
  [repeticao-leia-soma.json](../../tests/aceitacao/casos/repeticao-leia-soma.json) e o `leia` num
  `para` em `executar.test.js`, [tasks da 005](../005-blocos-repeticao/tasks.md)): conferir, com
  os blocos de repetição, um `leia` dentro de um laço pedindo o valor a cada volta.
- **Specs futuras com blocos não determinísticos** (aleatório, data, hora): rever a
  reexecução do R-02.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
