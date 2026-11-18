# Plano de implementação: Blocos de repetição (enquanto/para)

**Branch**: `005-blocos-repeticao` | **Data**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/005-blocos-repeticao/spec.md` (RF-05), mais as quatro
pendências obrigatórias das Premissas: da 006 (tipos dos encaixes), da 009 (Parar e mais de
1.000 linhas), da 010 (`leia` em laço) e da 004 (`se` dentro dos laços).

**Ponto de partida**: a base está na `main` (008, 001, 007, 002, 003, 006, 009, 010, 004). O
gerador já tem `ctx.comandos` e `ctx.aviso`, o campo de variável já filtra por tipo, a 006
deixou a regra de tipos para a 005 e a 004 entregou o `se`. Inventário em
[research.md](research.md), R-01.

## Resumo

1. **Bloco `enquanto`** (R-03; FR-001, FR-008): condição e área de comandos. Gera
   `enquanto <condição> faca … fim_enquanto` pelo `ctx.comandos` da 008.
2. **Bloco `para`** (R-04; FR-002, FR-004 a FR-006, FR-008): variável de controle, de, até e
   passo opcional (encaixe vazio = sem `passo`). Gera
   `para v de a ate b [passo p] faca … fim_para`. A dica diz que os dois limites entram.
3. **Pendência da 006, tipos** (R-07; P-1): `check: ['Logico']` na condição do `enquanto` e
   `check: ['Numero']` em de, até e passo. A matriz do SC-002 da 006 ganha as duas colunas. O
   Core aceita `enquanto 1` (R-02): a regra é só do editor.
4. **Variável de controle inteira** (R-06; FR-003): `campoVariavel(['inteiro'])` no `para`; o
   `ctx` ganha `tipoVariavel`, e o `para` avisa se a variável deixou de ser inteira.
5. **Passo fixo zero** (R-05; FR-007, SC-002): aviso que bloqueia Executar. Número fixo com
   casas decimais em de, até ou passo também avisa (o Core só conta com inteiros, R-02). O
   que o editor não vê antes (passo numa variável, `ate n / 2`) é traduzido em pt-BR pelo
   adapter (R-08).
6. **Categoria "Repetição"** na caixa de blocos (R-09), dinâmica: `enquanto` sempre; `para`
   com a última variável inteira, ou a orientação e o botão "Criar variável…".
7. **Aceitação** (R-10; SC-001): nove casos (passo positivo, negativo, ausente, intervalo
   vazio, enquanto, aninhamento, casos de borda), incluindo **P-3** (`leia` em `para`, com a
   suíte interativa da 010) e **P-4** (`se` dentro de `para` e de `enquanto`).
8. **Pendência da 009 e da 010 na execução real** (R-11; **P-2**, **P-3**): os testes do
   Parar num laço infinito, das 1.500 linhas e do `leia` em laço passam a partir de projetos
   em blocos; o quickstart repete os quatro no navegador.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules). Node.js ≥ 20 para ferramentas e
testes.

**Dependências principais**: as mesmas de antes (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-12).

**Armazenamento**: formato do projeto v1 sem mudança. `enquanto` e `para` são nós comuns de
`projeto.blocos.blocks`, sem `extraState` ([data-model.md](data-model.md)).

**Testes**: Vitest.

- Projeto `unidade`: `blocos-repeticao.test.js` (geração, definições, variantes, avisos de
  passo zero, casas decimais e variável não inteira, `valorFixo`); `gerador.test.js`
  (`ctx.tipoVariavel`); `tipos.test.js` (colunas `enquanto` e `para` na matriz do SC-002);
  `caixa-blocos.test.js` (categoria "Repetição"); `registro.test.js`; `blocos-variaveis.test.js`
  (`campoVariavel(tipos)`); `executor-core.test.js` (duas traduções novas);
  `repeticao-blockly.test.js` headless (encaixes, menu só com inteiras, mudar o tipo,
  `se` dentro dos laços).
- Projeto `aceitacao`: nove casos novos (R-10) e `executar.test.js` com os projetos em blocos
  do R-11.
- O que só existe na tela (arrastar para o corpo, Parar com o botão, a Saída rolando) é
  verificado pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: sem metas novas. O Portugol em tempo real (007) e a Saída em fluxo
(009) continuam iguais com laços aninhados e com 1.500 linhas.

**Restrições**:

- O gerador continua puro (princípio II); `gerar`, `presente` e `valorFixo` só leem o nó JSON
  e o `ctx`. `ctx.tipoVariavel` lê só `projeto.variaveis`.
- Os `check` dos encaixes são a única regra de tipo de valor (R-07); a variável de controle é
  filtrada no campo e conferida no gerador (R-06).
- Nenhum módulo novo de interface: o `para` e o `enquanto` não têm mutador.

**Escala/Escopo**: um módulo novo no núcleo (`src/blocos/repeticao.js`); cinco alterados no
núcleo (`registro.js`, `caixa-blocos.js`, `campo-variavel.js`, `src/portugol/gerador.js`,
`src/core/executor-core.js`); um alterado na interface (`src/ui/workspace.js`, callback da
categoria); nove casos de aceitação e um módulo de apoio de teste.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core só foi executado para levantar o comportamento dos laços (R-02); nada copiado. Nenhuma lacuna: passo zero e limites com casas decimais são a regra de contagem do Core; o editor bloqueia o que vê e traduz o resto no adapter já existente (R-08). Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | Geração pura em `src/blocos/repeticao.js`, pelo `ctx` da 008; indentação de 4 espaços pelo emissor. Encaixes vazios viram `???` com aviso; passo fixo zero, casas decimais e variável não inteira viram aviso; todo aviso bloqueia Executar (009). `ctx.tipoVariavel` é pura. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 005 (RF-05). As pendências citam a origem: P-1 (006, RF-06), P-2 (009, RF-09), P-3 (010, RF-10), P-4 (004, RF-04). Commits por fase no formato `005/Txxx-Tyyy (RF-05, …): descrição` e `docs(005) (RF-05): …`, com os testes rodando uma vez antes de cada commit. | ✅ |
| IV. Testes e cobertura | Núcleo novo em `src/blocos/`, já medido. Aceitação com o Core real: passo positivo, negativo, ausente, intervalo vazio, enquanto, aninhamento, `leia` e `se` em laço. Parar e 1.500 linhas no worker real a partir de blocos. `npm run cobertura` atualiza o relatório e o README. | ✅ |
| V. pt-BR e foco no iniciante | Blocos com as palavras do Portugol (`enquanto`, `para`, `de`, `até`, `passo`, `faça`); dicas, avisos e as duas mensagens de execução novas em pt-BR, sem stack trace. Passo opcional sem mutador: encaixe vazio. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Sem `repita`, `continue` e `interrompa` (Premissas). Nenhuma mudança no formato; no gerador, só `ctx.tipoVariavel`. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. `campoVariavel` passa a receber os tipos: o `leia`, o `recebe` e o `variavel` continuam
   chamando sem argumento (os quatro tipos), sem mudança de comportamento.
2. Uma variável inteira que muda de tipo continua no `para` com aviso (R-06). Ao recarregar
   (012), o Blockly recusa a variável e o campo chega vazio; os dois casos bloqueiam Executar.
3. O aviso de casas decimais vai além do texto do FR-004 ("números ou expressões numéricas"):
   é necessário porque o Core 1.4.1 recusa reais na contagem (R-02, R-05). Os números
   inteiros, as expressões e as variáveis numéricas continuam aceitos.
4. Apagar a variável de controle apaga o `para` e tudo o que está dentro (regra da 002); a
   confirmação já mostra o total real de blocos removidos.

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/005-blocos-repeticao/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, Core, blocos, passo, tipos, caixa, casos
├── data-model.md        # Fase 1: nós JSON do enquanto e do para, avisos
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── blocos-repeticao.md   # núcleo: definições, geração, valorFixo, variantes, avisos
│   └── editor-repeticao.md   # interface e adapter: caixa de blocos, campo, traduções
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── blocos/
│   ├── repeticao.js          ➕ BLOCO_ENQUANTO, BLOCO_PARA, COR_REPETICAO, valorFixo (núcleo)
│   ├── campo-variavel.js     ✏️ campoVariavel(tipos) com os tipos aceitos
│   ├── registro.js           ✏️ registra enquanto e para
│   └── caixa-blocos.js       ✏️ categoria dinâmica "Repetição", conteudoCategoriaRepeticao
├── portugol/
│   └── gerador.js            ✏️ ctx.tipoVariavel
├── core/
│   └── executor-core.js      ✏️ traduções do passo zero e dos reais no para
└── ui/
    └── workspace.js          ✏️ callback da categoria "Repetição"

tests/
├── unidade/
│   ├── blocos-repeticao.test.js       ➕
│   ├── repeticao-blockly.test.js      ➕ headless
│   ├── gerador.test.js                ✏️ ctx.tipoVariavel
│   ├── tipos.test.js                  ✏️ colunas enquanto e para na matriz do SC-002
│   ├── caixa-blocos.test.js           ✏️
│   ├── registro.test.js               ✏️
│   ├── blocos-variaveis.test.js       ✏️ campoVariavel(tipos)
│   └── executor-core.test.js          ✏️ traduções novas
└── aceitacao/
    ├── executar.test.js               ✏️ Parar, 1.500 linhas e leia em laço a partir de blocos (P-2, P-3)
    ├── suporte/projetos-repeticao.js  ➕ projetos em blocos do R-11
    └── casos/
        ├── para-contagem.json             ➕
        ├── para-regressivo.json           ➕
        ├── para-passo-dois.json           ➕
        ├── para-intervalo-vazio.json      ➕
        ├── enquanto-regressiva.json       ➕
        ├── repeticao-leia-soma.json       ➕ P-3
        ├── repeticao-se-par-impar.json    ➕ P-4
        ├── repeticao-aninhada.json        ➕
        └── repeticao-casos-de-borda.json  ➕

specs/005-blocos-repeticao/spec.md                     ✏️ Premissas: pendências conferidas
specs/006-blocos-operadores/contracts/tipos-encaixe.md ✏️ colunas enquanto e para; regra aplicada
specs/006-blocos-operadores/plan.md                    ✏️ pendência da 005 resolvida
specs/009-executar-no-core/plan.md                     ✏️ pendência da 005 resolvida
specs/010-entrada-de-dados/plan.md                     ✏️ pendência da 005 resolvida
specs/004-blocos-se-senao/plan.md                      ✏️ pendência da 005 resolvida
specs/008-portugol-valido/contracts/registro-blocos.md ✏️ ctx.tipoVariavel; exemplo do passo 0
```

**Decisão de estrutura**: os blocos seguem o padrão da 003, 004 e 006. Definição, geração e
regras puras ficam em `src/blocos/` (núcleo, medido); a interface só liga a categoria
dinâmica. O gerador ganha uma função de leitura no `ctx`; tipos, verificador e formato não
mudam.

## Pendências para outras specs

- **012**: um arquivo com uma variável não inteira no `para`, ou com um encaixe incompatível
  nos laços (editado à mão), chega com o campo vazio ou cai no `BadConnectionCheck` já
  registrado para a 012 pela 006 (R-06).

## Complexity Tracking

Nenhuma violação da constituição a justificar.
