# Plano de implementação: Blocos de entrada e saída (leia/escreva)

**Branch**: `003-blocos-leia-escreva` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/003-blocos-leia-escreva/spec.md` (RF-03), mais as
pendências obrigatórias deixadas pela 002 e a decisão de antecipar três blocos da 006
(RF-06).

**Ponto de partida**: a base está na `main` (008, 001, 007, 002). O gerador puro, o
registro de blocos, o campo de variável `campo_variavel`, a caixa de blocos com
categorias e `PRECEDENCIA.PRIMARIO` já existem. Executar continua desabilitado até a
009 e a entrada do `leia` no navegador é da 010. Inventário em
[research.md](research.md), R-01.

## Resumo

1. **Bloco `escreva`** (comando, `src/blocos/entrada-saida.js`): 1 a 10 encaixes de
   valor, gera `escreva(v1, …, vn)` (FR-001); "+"/"−" no próprio bloco (FR-002), com a
   quantidade em `extraState.valores` e a ligação com o Blockly num mutador em
   `src/ui/mutador-escreva.js` (R-04). Encaixe vazio = `???` + aviso (008).
2. **Bloco `leia`** (comando): um campo `VAR` do tipo `campo_variavel`, **o mesmo da
   002**, gera `leia(nome)` (FR-004); sem encaixe de valor, então expressão e valor fixo
   não encaixam (FR-005). Dica sobre a regra do lógico (R-05).
3. **Blocos antecipados da 006** (decisão do usuário, R-03), completos pelas regras
   dela e citando RF-06: `numero` (vírgula → ponto, recusa inválidos, tira zeros à
   esquerda por causa de uma lacuna do Core, R-07), `texto` (escapa `\` e `"`, R-08) e
   `aritmetico` (`+ - * / %` com rótulos amigáveis e parênteses pela estrutura, R-06).
4. **Parênteses no gerador**: `ctx.valor` ganha o parâmetro opcional
   `precedenciaMinima`; `PRECEDENCIA` ganha `ADITIVO` e `MULTIPLICATIVO` (R-06).
5. **Caixa de blocos**: categorias "Entrada e saída" (dinâmica: `escreva` com “Olá,
   mundo!”, `leia` com a última variável ou a orientação para criar uma), "Valores" e
   "Contas" (R-09).
6. **Pendências da 002, todas como casos no Core real** (R-10):
   `escreva-conta-idade.json` (`idade <- 15`, `escreva(idade + 1)` → `16`),
   `escreva-valores-iniciais.json` (`0`, `0.0`, texto vazio, `falso`) e
   `leia-quatro-tipos.json` (o `leia` com o `campo_variavel` real), além dos casos das
   Histórias 1 e 2 e dos blocos antecipados.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS. Node.js ≥ 20 para
ferramentas e testes.

**Dependências principais**: as mesmas da 008/001/007/002 (`blockly` 12.5.1, `pyodide`
0.25.0; `vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova**
(R-11).

**Armazenamento**: nenhum. A quantidade de valores do `escreva` vai no `extraState` do
bloco, dentro da serialização do Blockly que o formato v1 já guarda (data-model). O
formato do arquivo não muda.

**Testes**: Vitest. Projeto `unidade`: `gerar` dos cinco blocos (com o registro real),
avisos de encaixe vazio do `escreva` (1 e vários valores) e do `leia` sem variável,
normalização de `extraState.valores`, `normalizarNumero` e `gerarTexto` (todas as
entradas do R-07/R-08), tabela de parênteses do R-06, `ctx.valor` com e sem
`precedenciaMinima`, conteúdo da categoria "Entrada e saída" com 0 e 2 variáveis, e um
teste no Blockly headless para ida e volta do `extraState` e para o `leia` no
`contarBlocosApagados`. Projeto `aceitacao`: os nove casos JSON do R-10 no
`meupia-core` 1.4.1 real; a meta-verificação da 008 passa a exigir as variantes dos
cinco blocos novos. A parte de navegador é verificada pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: sem metas novas. O Portugol continua atualizando em < 1 s com
100 blocos (SC-002 da 007). SC-002 desta spec ("Olá, mundo!" em < 2 min): montar leva
dois gestos (categoria → arrastar o `escreva` já com o texto, R-09); executar depende
da 009.

**Restrições**: definições dos blocos, regras de número e texto, normalização do
`extraState` e conteúdo da caixa não importam o Blockly nem tocam o DOM (princípio II,
testáveis em Node). `src/ui/` e `src/main.js` seguem fora da cobertura. O mutador do
`escreva` e o validador do campo de número usam o Blockly e ficam em `src/ui/`, chamando
as regras puras.

**Escala/Escopo**: três módulos de núcleo novos e quatro alterados; um módulo de
interface novo e dois alterados; nove casos de aceitação.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core só foi lido e executado para levantar o comportamento (R-02); nada copiado. Lacuna encontrada: inteiro com zeros à esquerda gera Python inválido; adapter do lado do editor (`normalizarNumero`, testado) e issue em `meuPia/core` aberta pela dupla (R-07). Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | Todo bloco novo emite Portugol que o Core aceita (cada forma confirmada no R-02 e coberta por caso de aceitação). `leia` sem encaixe de valor torna impossíveis as formas que o Core recusa. Números inválidos são recusados no campo; `007` vira `7`. Encaixe vazio = `???` + aviso; `escreva()` vazio nunca é emitido. `gerar`, `normalizarNumero`, `gerarTexto` e o conteúdo da caixa são puros. O parâmetro novo do `ctx.valor` é opcional e não muda o texto dos blocos atuais. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 003 (RF-03). Os três blocos antecipados têm spec (006, RF-06) e suas tasks citam RF-06; commits `003/Txxx (RF-03): …` ou `003/Txxx (RF-06): …` e `docs(003) (RF-03): …`. A mudança do `ctx.valor` atualiza o contrato `registro-blocos.md` da 008 numa task `docs`. A spec 006 recebe uma nota do que já foi entregue (task `docs(006) (RF-06)`). | ✅ |
| IV. Testes e cobertura | Módulos novos em `src/blocos/` e `src/portugol/` (já no `include`). Nove casos novos no Core real, três deles exigidos pela 002 (P-1 a P-3). Meta-verificação exige as variantes novas. `npm run cobertura` atualiza relatório e README na entrega. | ✅ |
| V. pt-BR e foco no iniciante | Blocos com as palavras do Portugol (`escreva`, `leia`); dicas curtas em pt-BR (FR-006), inclusive a regra do lógico; operadores com rótulos amigáveis (`×`, `÷`, `resto`); orientação para criar variável antes do `leia`; "+"/"−" em vez do mutator de arrastar. | ✅ |
| VI. Simplicidade de PoC | Zero dependências (sem o plugin de "+"/"−"). Antecipar só o que as Histórias e as pendências exigem, sem tipos (`check`), lógicos ou relacionais, que seguem na 006. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:
(1) a antecipação da 006 é decisão do usuário registrada no R-03; a 006 parte desses
blocos sem mudar `type` nem variantes; (2) a regra de parênteses vale para os blocos
que a 006 acrescentar, por isso o contrato fica na 008 (`registro-blocos.md`).

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/003-blocos-leia-escreva/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: pendências, Core real, antecipação da 006, blocos
├── data-model.md        # Fase 1: comandos escreva/leia, valores, expressão, caixa
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── blocos-entrada-saida.md   # escreva e leia, caixa "Entrada e saída"
│   ├── blocos-valores-contas.md  # numero, texto, aritmetico e ctx.valor com precedência
│   └── editor-entrada-saida.md   # interface: "+"/"−", validador do número, caixa
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── blocos/
│   ├── campo-variavel.js     ➕ campoVariavel() comum ao recebe, variavel e leia (núcleo)
│   ├── entrada-saida.js      ➕ BLOCO_ESCREVA, BLOCO_LEIA, quantidadeValores, MAX_VALORES (núcleo)
│   ├── valores.js            ➕ BLOCO_NUMERO, BLOCO_TEXTO, normalizarNumero, gerarTexto (núcleo, RF-06)
│   ├── contas.js             ➕ BLOCO_ARITMETICO, OPERADORES_ARITMETICOS (núcleo, RF-06)
│   ├── variaveis.js          ✏️ usa campoVariavel() do módulo comum
│   ├── caixa-blocos.js       ✏️ categorias Entrada e saída, Valores, Contas; conteudoCategoriaEntradaSaida
│   └── registro.js           ✏️ registra os cinco blocos no registroPadrao
├── portugol/
│   ├── gerador.js            ✏️ ctx.valor(…, precedenciaMinima)
│   └── precedencia.js        ✏️ ADITIVO, MULTIPLICATIVO
├── ui/
│   ├── mutador-escreva.js    ➕ mutator do escreva: "+"/"−", extraState, evento de desfazer
│   ├── validador-numero.js   ➕ extensão validar_numero: liga o campo NUM a normalizarNumero
│   ├── workspace.js          ✏️ registra mutador, validador do número e a categoria dinâmica
│   └── textos.js             ✏️ textos alternativos dos ícones "+"/"−"

tests/
├── unidade/
│   ├── blocos-entrada-saida.test.js   ➕
│   ├── blocos-valores-contas.test.js  ➕ normalizarNumero, gerarTexto, tabela de parênteses
│   ├── gerador.test.js                ✏️ ctx.valor com precedenciaMinima
│   ├── caixa-blocos.test.js           ✏️ categorias novas e conteúdo dinâmico
│   ├── entrada-saida-blockly.test.js  ➕ Blockly headless: extraState ida e volta, leia no apagar
│   ├── blocos-variaveis.test.js       ✏️ escreva(idade + 1) com os blocos reais
│   └── registro.test.js               ✏️ registroPadrao com os tipos novos
└── aceitacao/casos/
    ├── escreva-ola-mundo.json         ➕
    ├── escreva-varios-valores.json    ➕
    ├── escreva-conta-idade.json       ➕ P-1: escreva(idade + 1) → 16
    ├── escreva-valores-iniciais.json  ➕ P-2: 0, 0.0, texto vazio, falso
    ├── leia-quatro-tipos.json         ➕ P-3: leia com o campo_variavel real
    ├── leia-logico-falso.json         ➕
    ├── contas-precedencia.json        ➕
    ├── texto-especial.json            ➕
    └── numero-zeros.json              ➕

specs/008-portugol-valido/contracts/registro-blocos.md   ✏️ ctx.valor com precedenciaMinima
specs/006-blocos-operadores/spec.md                      ✏️ nota: número, texto e aritmético entregues pela 003
```

**Decisão de estrutura**: os blocos de entrada e saída ficam em
`src/blocos/entrada-saida.js`; os antecipados da 006 ficam em módulos com o nome que a
006 vai continuar (`valores.js` para valores fixos, `contas.js` para operadores), para
ela só acrescentar. A definição do campo de variável sai de `variaveis.js` para um
módulo comum porque agora é usada por dois módulos de blocos.

## Pendências para outras specs

Registradas no R-12. Não são tasks desta spec:

- **006** (✅ resolvida pela spec 006, [tasks](../006-blocos-operadores/tasks.md)): negativo,
  relacionais, lógicos, valor fixo lógico, `check` de tipos.
- **009**: ver a Saída no navegador ao executar; completar a medição do SC-002.
- **010**: caixa de entrada do `leia`; mensagem para real digitado com vírgula no `leia`.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
