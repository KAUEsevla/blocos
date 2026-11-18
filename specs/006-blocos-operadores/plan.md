# Plano de implementação: Blocos de operadores e valores

**Branch**: `006-blocos-operadores` | **Data**: 2026-11-15 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/006-blocos-operadores/spec.md` (RF-06), mais as
pendências obrigatórias deixadas pela 002 e a continuação dos três blocos que a 003
antecipou.

**Ponto de partida**: a base está na `main` (008, 001, 007, 002, 003). A 003 entregou
`numero`, `texto` e `aritmetico` (`+ - * / %`) já pelas regras desta spec
([research R-03 da 003](../003-blocos-leia-escreva/research.md)), o `ctx.valor` com
`precedenciaMinima` e os níveis `ADITIVO`/`MULTIPLICATIVO`. Esses três blocos são
**ampliados aqui sem mudar `type`, campos nem variantes, e não são recriados**. Inventário
em [research.md](research.md), R-01.

## Resumo

1. **Blocos novos** (núcleo, puros): `negativo` (`-x`, em `contas.js`), `relacional`
   (`= <> < > <= >=`, `comparacoes.js` novo), `e_ou` e `nao` (`logica.js` novo) e o valor
   fixo `logico` (`verdadeiro`/`falso`, em `valores.js`). Rótulos amigáveis (`≠`, `≤`, `≥`,
   `não`, `−`), símbolo do Portugol no texto (FR-001 a FR-004, FR-008). R-04 a R-07.
2. **Precedência completa**: `PRECEDENCIA` ganha `OU 10`, `E 20`, `NAO 30`,
   `RELACIONAL 40` e `UNARIO 70`. Relacional é não associativo (os dois lados pedem
   `RELACIONAL + 1`); `nao` e `negativo` pedem `PRIMARIO` do operando, então
   `nao (x > 10)` e `-(a + b)` sempre saem entre parênteses (FR-005, História 3). R-03.
3. **Tipos dos encaixes** (SC-002): três tipos de valor (`Numero`, `Texto`, `Logico`) nos
   `check` do Blockly. Os blocos de valor declaram o tipo de saída; os encaixes que exigem
   tipo declaram o que aceitam. Os três blocos da 003 só ganham `check` (R-08).
4. **Pendência da 002: onde o bloco de variável encaixa conforme o tipo**. O tipo do
   `variavel` (saída) e do encaixe `VALOR` do `variavel_recebe` vem do tipo da variável
   escolhida: `inteiro`/`real` → `Numero`, `cadeia` → `Texto`, `logico` → `Logico`, sem
   variável → qualquer. Como o tipo muda em tempo de uso, ele é lido na hora pelo
   verificador de encaixe próprio (`ConnectionChecker`), e as regras ficam puras em
   `src/blocos/tipos.js`. Mudar o tipo da variável ou trocar a variável no campo solta antes
   os blocos que ficariam incompatíveis, num único passo de desfazer (R-09, R-10).
5. **Pendência da 002: `idade <- 15` no Core real**: caso de aceitação próprio
   `recebe-idade-quinze.json` (História 2, cenário 1 da 002), além do
   `escreva-conta-idade.json` que a 003 já entregou (R-11).
6. **Caixa de blocos**: `logico` em "Valores", `negativo` em "Contas" e as categorias novas
   "Comparações" e "Lógica" (R-12).
7. **Aceitação**: sete casos novos no Core real cobrindo as Histórias 1 a 4, a divisão por
   zero e o SC-001 com expressões em que parênteses errados mudariam o resultado; a
   meta-aceitação passa a exigir que todo caso respeite os tipos dos encaixes (R-11).
8. **Lacunas do Core**: o Core 1.4.1 não verifica tipos (`ok <- 5`, `1 + verdadeiro` passam)
   e trata `VERDADEIRO` maiúsculo como nome de variável. Contornos do lado do editor (tipos
   nos encaixes; gerar sempre minúsculo) e duas issues em `meuPia/core` (R-02, R-13).

## Contexto técnico

**Linguagem/Versão**: JavaScript ES2022 (ES Modules), HTML e CSS. Node.js ≥ 20 para
ferramentas e testes.

**Dependências principais**: as mesmas de antes (`blockly` 12.5.1, `pyodide` 0.25.0;
`vite`, `vitest`, `@vitest/coverage-v8` em dev). **Nenhuma dependência nova** (R-14). O
verificador de encaixe usa o ponto de extensão `ConnectionChecker` do próprio Blockly.

**Armazenamento**: nenhum. Os blocos novos são serializados pelo Blockly como os demais,
dentro do formato v1. Nenhum `type`, campo ou variante existente muda, então nenhum projeto
precisa de migração. O `check` não é serializado.

**Testes**: Vitest. Projeto `unidade`: `gerar` dos cinco blocos novos (todas as variantes e
encaixes vazios), tabela de parênteses do R-03 com os oito níveis, matriz de tipos do SC-002
(todo bloco de valor × todo encaixe com tipo, inclusive variável nos quatro tipos e sem
variável), `encaixesIncompativeis` (tipo novo, troca de variável), registro com a chave nova
`tipoPelaVariavel`, caixa de blocos. Blockly headless: o verificador recusa encaixes
incompatíveis, o `variavel` muda de tipo junto com a variável, mudar o tipo solta e o Ctrl+Z
volta tudo, e **todos os casos de aceitação carregam no Blockly com o verificador** (sem
`BadConnectionCheck`). Projeto `aceitacao`: sete casos novos (R-11) no `meupia-core` 1.4.1
real; a meta-aceitação passa a exigir as variantes dos blocos novos e encaixes compatíveis.
A parte de navegador é verificada pelo [quickstart.md](quickstart.md).

**Plataforma-alvo**: navegadores modernos de notebook/desktop (Chrome, Firefox, Edge).

**Tipo de projeto**: aplicação web estática de página única, sem backend (RNF-06).

**Metas de desempenho**: sem metas novas. O Portugol continua atualizando em < 1 s com 100
blocos (SC-002 da 007). O verificador roda a cada aproximação de encaixe durante o arrasto:
só consulta o `check` e, no máximo, o tipo de uma variável no mapa (custo constante).

**Restrições**: definições dos blocos, precedência, regras de tipo e a busca de encaixes
incompatíveis não importam o Blockly nem tocam o DOM (princípio II, testáveis em Node).
`src/ui/` e `src/main.js` seguem fora da cobertura; o verificador de encaixe e os ajustes no
campo e nas ações de variável ficam lá e só chamam as regras puras.

**Escala/Escopo**: três módulos de núcleo novos e seis alterados; um módulo de interface
novo e três alterados; sete casos de aceitação.

## Constitution Check

*GATE: precisa passar antes da Fase 0. Reavaliado depois da Fase 1.*

| Princípio | Verificação | Situação |
| --- | --- | --- |
| I. Ecossistema intocado | O Core só foi executado para levantar o comportamento (R-02); nada copiado. Duas lacunas (sem verificação de tipos; `VERDADEIRO` maiúsculo vira variável) viram issues em `meuPia/core` com contorno do lado do editor, isolado e testado (R-13). Versão só em `src/config.js`. | ✅ |
| II. Portugol válido por construção | Toda forma nova foi executada no Core (R-02) e vira caso de aceitação. Relacional dentro de relacional sempre com parênteses (o Core recusa `1 < 2 = verdadeiro`). `verdadeiro`/`falso` sempre minúsculos. Encaixe vazio = `???` + aviso, como na 008. `gerar` e as regras de tipo são puros; o `check` não entra no gerador. | ✅ |
| III. Spec primeiro e rastreabilidade | Plan parte da spec 006 (RF-06); as pendências da 002 citam RF-02 e RF-06. Commits `006/Txxx (RF-06): …`, `006/Txxx (RF-02): …` e `docs(006) (RF-06): …`. A chave nova do registro atualiza o contrato `registro-blocos.md` da 008 numa task `docs`; o plan da 002 marca as pendências resolvidas. | ✅ |
| IV. Testes e cobertura | Módulos novos em `src/blocos/` e `src/portugol/` (já no `include`). Sete casos no Core real, um deles exigido pela 002. A meta-aceitação exige variantes novas e encaixes compatíveis. `npm run cobertura` atualiza relatório e README na entrega. | ✅ |
| V. pt-BR e foco no iniciante | Palavras do Portugol nos blocos (`e`, `ou`, `não`, `verdadeiro`, `falso`); símbolos amigáveis (`≠`, `≤`, `≥`, `×`, `÷`, `−`); dicas curtas em pt-BR que dizem o que encaixar; o encaixe recusado é o próprio "não encaixa" do Blockly, sem janela extra. | ✅ |
| VI. Simplicidade de PoC | Zero dependências. Tipos só nos três grupos que o SC-002 pede (sem separar inteiro de real). Funções nativas fora do escopo (Premissas). | ✅ |

**Resultado**: nenhuma violação. Tabela de complexidade vazia.

**Reavaliação após a Fase 1**: o desenho mantém todos os itens. Pontos de atenção:
(1) a chave `tipoPelaVariavel` é opcional no registro, então nenhum bloco existente muda;
(2) um arquivo JSON com encaixe incompatível (feito à mão) não carrega no Blockly
(`BadConnectionCheck`); hoje nenhum projeto salvo existe, e a mensagem amigável fica para a
012 (R-15); (3) as specs 004 e 005 devem usar o `check` `Logico` nas condições e `Numero`
nos limites do `para`, regra registrada no contrato [tipos-encaixe.md](contracts/tipos-encaixe.md).

## Estrutura do projeto

### Documentação (esta feature)

```text
specs/006-blocos-operadores/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0: inventário, Core real, precedência, blocos, tipos
├── data-model.md        # Fase 1: blocos novos, tipos de valor, expressão, caixa
├── quickstart.md        # Fase 1: validação nos testes e no navegador
├── contracts/
│   ├── blocos-operadores.md   # negativo, relacional, e_ou, nao, logico; checks dos da 003
│   ├── tipos-encaixe.md       # tipos, tipoPelaVariavel, encaixesIncompativeis, regra p/ 004/005
│   └── editor-operadores.md   # interface: verificador, mudar tipo, trocar variável, caixa
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks; não criado aqui)
```

### Código-fonte (raiz do repositório)

Só arquivos novos (➕) ou alterados (✏️) por esta spec.

```text
src/
├── blocos/
│   ├── tipos.js              ➕ TIPO_VALOR, checkDoTipoVariavel, compativeis, checks efetivos,
│   │                            encaixesIncompativeis (núcleo)
│   ├── comparacoes.js        ➕ BLOCO_RELACIONAL, OPERADORES_RELACIONAIS (núcleo)
│   ├── logica.js             ➕ BLOCO_E_OU, BLOCO_NAO, OPERADORES_LOGICOS (núcleo)
│   ├── valores.js            ✏️ BLOCO_LOGICO; check de saída em numero e texto
│   ├── contas.js             ✏️ BLOCO_NEGATIVO; checks do aritmetico
│   ├── variaveis.js          ✏️ tipoPelaVariavel em variavel ('saida') e variavel_recebe ('VALOR')
│   ├── caixa-blocos.js       ✏️ logico, negativo; categorias Comparações e Lógica
│   └── registro.js           ✏️ registra os cinco blocos; valida tipoPelaVariavel
├── portugol/
│   └── precedencia.js        ✏️ OU, E, NAO, RELACIONAL, UNARIO
├── ui/
│   ├── verificador-encaixe.js ➕ ConnectionChecker "meupia": check efetivo pelo tipo da variável
│   ├── workspace.js          ✏️ registra o verificador (plugins.connectionChecker)
│   ├── acoes-variavel.js     ✏️ mudar o tipo solta antes os blocos incompatíveis (um desfazer)
│   └── campo-variavel.js     ✏️ trocar a variável no menu solta antes o bloco incompatível

tests/
├── unidade/
│   ├── blocos-operadores.test.js      ➕ gerar dos cinco blocos, tabela de parênteses
│   ├── tipos.test.js                  ➕ matriz SC-002, encaixesIncompativeis
│   ├── operadores-blockly.test.js     ➕ headless: verificador, mudar tipo + Ctrl+Z, casos carregam
│   ├── blocos-valores-contas.test.js  ✏️ checks dos três blocos da 003
│   ├── blocos-variaveis.test.js       ✏️ tipoPelaVariavel de variavel e variavel_recebe
│   ├── caixa-blocos.test.js           ✏️ categorias novas
│   └── registro.test.js               ✏️ tipos novos e tipoPelaVariavel
└── aceitacao/
    ├── aceitacao.test.js              ✏️ meta: encaixes compatíveis em todos os casos
    └── casos/
        ├── recebe-idade-quinze.json   ➕ pendência da 002: idade <- 15
        ├── operadores-media.json      ➕ História 1 e negativo
        ├── operadores-comparacao.json ➕ História 2, seis relacionais
        ├── operadores-logicos.json    ➕ História 3
        ├── valores-fixos.json         ➕ História 4 e o lógico fixo
        ├── expressoes-estrutura.json  ➕ SC-001: parênteses que mudam o resultado
        └── divisao-por-zero.json      ➕ caso de borda: erro na execução

specs/008-portugol-valido/contracts/registro-blocos.md   ✏️ tipoPelaVariavel e checks
specs/002-blocos-variaveis/plan.md                        ✏️ pendências da 006 resolvidas
```

**Decisão de estrutura**: a 003 já criou `valores.js` (valores fixos) e `contas.js`
(contas) para esta spec continuar; o lógico fixo entra no primeiro e o negativo no segundo.
Comparações e lógica ficam em módulos próprios, um por categoria da caixa. As regras de tipo
ficam num módulo só (`tipos.js`), usado pelas definições, pela meta-aceitação e pela
interface.

## Pendências para outras specs

Registradas no R-15. Não são tasks desta spec:

- **004 e 005** (004 ✅ resolvida: condição do `se` com `check: 'Logico'` e `se idade >= 18` no
  Core, [tasks da 004](../004-blocos-se-senao/tasks.md); 005 ✅ resolvida: condição do `enquanto`
  com `check: ['Logico']` e de, até e passo do `para` com `check: ['Numero']`,
  [tasks da 005](../005-blocos-repeticao/tasks.md)): usar `check: 'Logico'` na condição do `se`/`enquanto` e
  `check: 'Numero'` nos limites e no passo do `para` (contrato
  [tipos-encaixe.md](contracts/tipos-encaixe.md)).
- **012**: mensagem amigável quando o arquivo traz um encaixe incompatível
  (`BadConnectionCheck` do Blockly).

## Complexity Tracking

Nenhuma violação da constituição a justificar.
