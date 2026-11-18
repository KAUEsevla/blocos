# Plano de implementação: Blocos de decisão (se/senão)

**Branch**: `004-blocos-se-senao` | **Data**: 2026-11-16 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/004-blocos-se-senao/spec.md` (RF-04), mais as
pendências obrigatórias deixadas pela 006.

**Ponto de partida**: a base está na `main` (008, 001, 007, 002, 003, 006, 009, 010). O
gerador já tem `ctx.comandos` (indentação por nível), o registro já prevê `areas` e
`variantes` com o `se` como exemplo, e a 006 entregou os blocos lógicos, os tipos dos
encaixes e o verificador `meupia`. Inventário em [research.md](research.md), R-01.

## Resumo

1. **Bloco `se`** (R-03; FR-001, FR-002, FR-004, FR-005): um bloco de comando com a
   condição, a área "então" e a área "senão", ligada e desligada no próprio bloco
   (`extraState.senao`). Gera `se <condição> entao … senao … fim_se`, com um nível de
   indentação a mais por área, pelo `ctx.comandos` da 008. O gerador não muda.
2. **Pendência da 006, condição só lógica** (R-05; P-1, FR-003, SC-002): `check: ['Logico']`
   na condição, a regra que a 006 deixou para a 004. O verificador `meupia`, o desencaixe ao
   mudar o tipo e a meta-aceitação da 006 passam a valer para o `se` sem código novo. A
   matriz do SC-002 da 006 ganha a coluna do `se`. O Core aceita `se 1 entao` (R-02): a
   regra é só do editor.
3. **Ligar e desligar o senão** (R-04; História 2, cenário 2): ícone "+"/"−" no bloco, no
   modelo do escreva da 003. Tirar um senão com comandos pede confirmação; os blocos saem
   junto, e um Ctrl+Z volta tudo.
4. **Pendência da 006, `se idade >= 18`** (R-07; P-2): caso de aceitação com o bloco de
   comparação, `leia(idade)` e o Core real, com 20 (`Maior`) e com 10 (nada). É também o
   teste independente da História 1.
5. **Categoria "Decisão"** na caixa de blocos (R-06), com o `se` e o `se/senão`.
6. **Aceitação** (R-07; SC-001): casos para as duas variantes, três faixas de nota com `se`
   dentro do `senao`, áreas vazias e 6 níveis de aninhamento.

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules). Node.js ≥ 20 para ferramentas e
testes.

**Dependências principais**: as mesmas de antes (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-09).

**Armazenamento**: formato do projeto v1 sem mudança de versão. O `se` com senão salva
`extraState: { senao: true }`, chave por bloco que o formato já aceita (o escreva usa
`extraState.valores`).

**Testes**: Vitest.

- Projeto `unidade`: `blocos-decisao.test.js` (geração, definição, variantes, mensagem de
  confirmação); `tipos.test.js` (coluna do `se` na matriz do SC-002);
  `caixa-blocos.test.js` (categoria "Decisão"); `registro.test.js`;
  `decisao-blockly.test.js` headless (encaixes, desencaixe ao mudar o tipo, mutador,
  confirmação e desfazer).
- Projeto `aceitacao`: cinco casos novos em `tests/aceitacao/casos/` (R-07). A
  meta-aceitação já exige as duas variantes, `portugolEsperado` e encaixes compatíveis.
- O que só existe na tela (ícone, diálogo, arrastar para dentro das áreas) é verificado
  pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: sem metas novas. O Portugol em tempo real (007) continua igual,
mesmo com aninhamento profundo.

**Restrições**:

- O gerador continua puro (princípio II); `gerar` e `presente` só leem o nó JSON.
- O `check` da condição é a única regra de tipo (R-05); nada de tipo no gerador.
- O mutador é interface, fora da cobertura; a contagem e o texto da confirmação ficam no
  núcleo.

**Escala/Escopo**: um módulo novo no núcleo (`src/blocos/decisao.js`); dois alterados no
núcleo (`registro.js`, `caixa-blocos.js`); um novo na interface (`src/ui/mutador-se.js`) e
dois alterados (`workspace.js`, `textos.js`); cinco casos de aceitação.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*
Constitution v2.0.0.

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core só foi executado para levantar o comportamento do `se` (R-02); nada copiado. Nenhuma lacuna: o Core aceita blocos vazios e aninhamento profundo. Aceitar `se 1 entao` não é lacuna (é a conversão do Python); a regra do "só lógico" é do editor. Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | Geração pura em `src/blocos/decisao.js`, pelo `ctx` da 008; indentação de 4 espaços pelo emissor. Condição vazia vira `???` com aviso, e Executar fica bloqueado (009). `extraState` inválido nunca quebra a geração. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 004 (RF-04). As pendências citam a origem: P-1 e P-2 (006, RF-06). Commits por fase no formato `004/Txxx-Tyyy (RF-04, …): descrição` e `docs(004) (RF-04): …`, com os testes rodando uma vez antes de cada commit. | ✅ |
| IV. Testes e cobertura | Núcleo novo em `src/blocos/`, já medido. Aceitação com o Core real, com as duas variantes e os casos de borda. `npm run cobertura` atualiza o relatório e o README. | ✅ |
| V. pt-BR e foco no iniciante | Bloco com as palavras do Portugol (`se`, `então`, `senão`); dica, ícones, aviso e confirmação em pt-BR. Ligar o senão com um clique, sem o mutator de arrastar. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Sem "senão se" e sem "escolha" (Premissas). Nenhuma mudança no gerador nem no formato. | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:

1. Os testes headless que registram todas as definições do `registroPadrao` precisam
   registrar o `mutador_se` (R-08); senão o `defineBlocksWithJsonArray` falha ao criar o `se`.
2. Um `inputs.SENAO` num arquivo com `senao` diferente de `true` é ignorado pelo gerador. O
   Blockly também não o carrega (a área não existe). Arquivos salvos pelo editor nunca têm
   esse caso.
3. A confirmação é assíncrona: o mutador ignora a resposta se o bloco tiver sido apagado
   durante o diálogo (R-04).

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/004-blocos-se-senao/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, Core, bloco, senão, tipos, caixa, casos
├── data-model.md        # Fase 1: nó JSON do se, estados do senão
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── bloco-se.md       # núcleo: definição, geração, variantes, mensagem
│   └── editor-se.md      # interface: mutador, confirmação, caixa de blocos
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── blocos/
│   ├── decisao.js            ➕ BLOCO_SE, COR_DECISAO, temSenao, mensagemTirarSenao (núcleo)
│   ├── registro.js           ✏️ registra BLOCO_SE
│   └── caixa-blocos.js       ✏️ categoria "Decisão"
└── ui/
    ├── mutador-se.js         ➕ mutador_se: ícone "+"/"−", confirmação, desfazer (interface)
    ├── workspace.js          ✏️ registrarMutadorSe({ confirmarTirarSenao })
    └── textos.js             ✏️ textos do ícone e do diálogo

tests/
├── unidade/
│   ├── blocos-decisao.test.js         ➕
│   ├── decisao-blockly.test.js        ➕ headless
│   ├── tipos.test.js                  ✏️ coluna do se na matriz do SC-002
│   ├── caixa-blocos.test.js           ✏️
│   ├── registro.test.js               ✏️
│   ├── operadores-blockly.test.js     ✏️ registra o mutador_se
│   ├── entrada-saida-blockly.test.js  ✏️ idem
│   └── variaveis-blockly.test.js      ✏️ idem
└── aceitacao/casos/
    ├── se-maior-idade.json            ➕ P-2
    ├── se-menor-idade.json            ➕
    ├── se-senao.json                  ➕
    ├── se-faixas-nota.json            ➕
    └── se-casos-de-borda.json         ➕

specs/006-blocos-operadores/spec.md                    ✏️ Premissas: se idade >= 18 conferido
specs/006-blocos-operadores/research.md                ✏️ R-15: linha da 004 resolvida
specs/006-blocos-operadores/plan.md                    ✏️ pendência da 004 resolvida
specs/006-blocos-operadores/contracts/tipos-encaixe.md ✏️ coluna do se; regra aplicada
specs/008-portugol-valido/contracts/registro-blocos.md ✏️ exemplo aponta para o bloco real
```

**Decisão de estrutura**: o bloco segue o padrão da 003 e da 006. Definição, geração e
regras puras ficam em `src/blocos/` (núcleo, medido); o comportamento que depende do
Blockly (ícone, diálogo, eventos) fica em `src/ui/`. O gerador, os tipos e o verificador
não mudam: o `se` só se pluga no registro.

## Pendências para outras specs

- **005** (✅ resolvida pela 005:
  [repeticao-se-par-impar.json](../../tests/aceitacao/casos/repeticao-se-par-impar.json) e os testes
  headless de aninhamento, [tasks da 005](../005-blocos-repeticao/tasks.md)): `enquanto` e `para` seguem o mesmo modelo (`check: ['Logico']` na condição,
  `ctx.comandos` no corpo). O `se` dentro deles (FR-004 desta spec) é conferido com os
  blocos de repetição.
- **012**: um arquivo com `se` cuja condição não é lógica (editado à mão) cai no
  `BadConnectionCheck` já registrado para a 012 pela 006.

## Complexity Tracking

Nenhuma violação da constituição a justificar.
