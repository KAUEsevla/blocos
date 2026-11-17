# Pesquisa (Fase 0): Blocos de decisão (se/senão)

Spec: [spec.md](spec.md) (RF-04). Plano: [plan.md](plan.md).

---

## R-01. Inventário e pendências obrigatórias

**Já na `main`** (008, 001, 007, 002, 003, 006, 009, 010):

| Peça | Onde | Origem | Uso nesta spec |
| --- | --- | --- | --- |
| Registro de blocos com `areas` e `variantes` | `src/blocos/registro.js` | 008 | O contrato [registro-blocos.md](../008-portugol-valido/contracts/registro-blocos.md) já usa o `se` como exemplo: `areas: ['ENTAO', 'SENAO']` e as variantes "sem senão" e "com senão" por `extraState.senao`. |
| `ctx.comandos(bloco, encaixe)` | `src/portugol/gerador.js` | 008 | Emite a cadeia de um encaixe de comandos com um nível a mais de indentação. Área vazia não gera nada. Resolve o FR-005 sem mudar o gerador. |
| `ctx.valor(bloco, encaixe, parte)` | idem | 008 | Condição vazia vira `???` e o aviso "Falta a condição do bloco se", que bloqueia Executar (009). |
| Tipos dos encaixes (`check`, `compativeis`, `encaixesIncompativeis`) e verificador `meupia` | `src/blocos/tipos.js`, `src/ui/verificador-encaixe.js` | 006 | Basta declarar `check: ['Logico']` na condição. Mudar o tipo ou trocar a variável já desencaixa o que ficou incompatível, para qualquer bloco registrado. |
| Blocos de valor lógicos: `relacional`, `e_ou`, `nao`, `logico`, `variavel` (tipo pela variável) | `src/blocos/` | 006, 002 | São tudo o que cabe na condição (FR-003). |
| Ícones no bloco ("+"/"−") com grupo de eventos para o desfazer | `src/ui/mutador-escreva.js` | 003 | Modelo para ativar e desativar o senão (R-04). |
| Diálogo de confirmação em pt-BR | `src/ui/confirmacao.js` | 001 | Confirmação ao remover um senão com comandos (História 2, cenário 2). |
| Meta-aceitação | `tests/aceitacao/aceitacao.test.js` | 008, 006 | Exige um caso para cada variante, `portugolEsperado` nos casos com áreas de comandos e encaixes compatíveis. |

**Pendências obrigatórias da 006** (pedido explícito do usuário):

| # | Origem | Pendência | Onde é resolvida |
| --- | --- | --- | --- |
| P-1 | 006: [tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md#regra-para-as-specs-004-e-005) ("`se` (004), condição, `['Logico']`"), plan e R-15 da 006; regra de usuário nas Premissas desta spec | A condição do `se` só aceita valores lógicos. | R-03, R-05 |
| P-2 | 006: História 2, teste independente ("montar `se idade >= 18`"), Premissas da 006 ("o `se idade >= 18` é conferido na 004") e R-15 da 006 | O cenário `se idade >= 18` com o bloco de comparação, conferido no Core real. | R-07 |

---

## R-02. Comportamento do Core 1.4.1 (levantado em 2026-11-16)

Programas executados com o `compilarEExecutar` real (Pyodide 0.25.0):

| Programa | Resultado |
| --- | --- |
| `se idade >= 18 entao` / `escreva("Maior")` / `fim_se`, com 20 | `Maior` |
| o mesmo, com 10 | nada |
| `se … entao … senao … fim_se`, com 10 | `Menor` |
| `entao` vazio; `senao` vazio; os dois vazios | Aceitos, executam |
| `se` dentro do `senao` (três faixas de nota), com 6 | `B` |
| 6 níveis de `se` aninhados | Aceito, `fundo` |
| `se ok entao` (variável lógica) | Aceito |
| `se nao (idade > 10) e verdadeiro entao` | Aceito |
| **`se 1 entao`** | **Aceito pelo Core** (o Python trata 1 como verdadeiro) |
| `se ??? entao` | Erro léxico |

**Consequências**:

- Blocos vazios e aninhamento profundo são do próprio Core (casos de borda da spec): o
  editor não precisa de nada além de `ctx.comandos`.
- Como o Core aceita `se 1 entao`, o SC-002 ("nenhuma condição não lógica chega ao
  Portugol") depende **só do editor**: o `check` da condição (R-03) e a meta-aceitação
  dos encaixes.

---

## R-03. O bloco `se` (FR-001 a FR-005; P-1)

**Decisão**: um único bloco de comando `se`, com o senão ligado e desligado no próprio
bloco (FR-002).

| Parte | Definição |
| --- | --- |
| `type` / `rotulo` | `se` / `se` |
| Condição | `input_value` `CONDICAO`, `check: ['Logico']` (P-1, regra da 006) |
| Área "então" | `input_statement` `ENTAO` |
| Área "senão" | `input_statement` `SENAO`, só existe com o senão ligado |
| Estado | `extraState: { senao: true }` com o senão ligado; sem `extraState` (ou `senao` diferente de `true`) = sem senão |
| Texto do bloco | `se %1 então`, depois `senão` na segunda área (acentos na tela, como o "não" da 006; o Portugol usa `entao` e `senao`) |
| Encaixe na sequência | `previousStatement` e `nextStatement` (FR-004: cabe em qualquer área de comandos, inclusive de outro `se`) |
| Mutador | `mutador_se` (interface, R-04) |
| Cor | `COR_DECISAO = 210` (categoria nova, R-06) |
| `areas` | `['ENTAO', 'SENAO']` |
| Variantes | `sem senão` (`extraState?.senao !== true`), `com senão` (`extraState?.senao === true`) |
| Dica | "Faz os comandos de dentro só quando a condição for verdadeira. Com “senão”, faz os outros comandos quando ela for falsa." |

**Geração** (pura, em `src/blocos/decisao.js`):

```text
se <ctx.valor(CONDICAO, 'a condição')> entao
    <ctx.comandos(ENTAO)>
senao                      ← só com extraState.senao === true
    <ctx.comandos(SENAO)>
fim_se
```

- A condição não leva parênteses (`precedenciaMinima` 0): `se idade >= 18 entao`.
- Condição vazia: `se ??? entao` e o aviso "Falta a condição do bloco se". O gerador
  continua (princípio II) e Executar fica bloqueado (009).
- `extraState.senao` diferente de `true` (arquivo antigo ou editado à mão): sem
  `senao`. Um `inputs.SENAO` nesse caso é ignorado pelo gerador.

**Motivo**: o contrato do registro da 008 já previa exatamente este formato. Um bloco só
com o senão ligado no bloco segue o modelo do Portugol (`se … senao … fim_se`, um único
`fim_se`, cenário 1 da História 2). O `check` é a regra que a 006 deixou para a 004.

**Alternativas consideradas**: dois blocos, `se` e `se/senão` (rejeitada: trocar um pelo
outro perde os comandos e duplica a regra do gerador); o mutator de arrastar do Blockly
(`controls_if`; rejeitada pelo mesmo motivo do escreva da 003, R-04: difícil para o
iniciante, e ele traz o "senão se", fora do escopo pelas Premissas).

---

## R-04. Ligar e desligar o senão (FR-002; História 2, cenário 2)

**Decisão**: mutador `mutador_se` em `src/ui/mutador-se.js`, no modelo do
`mutador-escreva.js` da 003:

- Um ícone no fim da linha da condição: "+" ("Acrescentar senão") quando não há senão,
  "−" ("Tirar o senão") quando há.
- **Ligar**: cria a área `SENAO`, num grupo de eventos com um `BlockChange` de
  `mutation` (um Ctrl+Z desfaz).
- **Desligar com a área vazia**: tira a área direto.
- **Desligar com comandos no senão**: pede confirmação antes ("Tirar o senão apaga 3
  blocos que estão dentro dele."), com os botões "Tirar o senão" e "Cancelar". Com a
  confirmação, apaga os blocos do senão e tira a área no mesmo grupo de eventos; um
  Ctrl+Z volta o senão e os blocos. Cancelar não muda nada.
- A contagem de blocos (o bloco e todos os de dentro dele, como faz o Blockly ao apagar) e
  o texto da mensagem são puros, em `src/blocos/decisao.js`
  (`mensagemTirarSenao(quantidade)`), testados. A pergunta em si vem por parâmetro:
  `registrarMutadorSe({ confirmarTirarSenao })`. No navegador é o `confirmar` da 001; no
  teste headless, uma função falsa.
- Se o bloco for apagado enquanto o diálogo está aberto, a resposta é ignorada.
- No flyout (caixa de blocos), os ícones não fazem nada, como no escreva.

**Motivo**: o mesmo gesto do "+"/"−" do escreva, que o estudante já conhece. A
confirmação cumpre o cenário 2 da História 2 ("após confirmação se houver algum"), e
o desfazer em um passo segue a regra da 003.

**Alternativas consideradas**: soltar os blocos do senão na área em vez de apagar
(rejeitada: a spec diz "removidos junto"); um item no menu de contexto (rejeitada: escondido
para o iniciante).

---

## R-05. Condição só lógica: onde a regra vive (P-1, FR-003, SC-002)

**Decisão**: o `check: ['Logico']` na definição do `CONDICAO` é a regra inteira. Não há
código novo de tipos:

- o verificador `meupia` da 006 recusa o encaixe de número, texto, conta, negativo e
  variável numérica ou de texto;
- mudar o tipo de uma variável usada na condição (por exemplo, `ok` de lógico para
  inteiro), ou trocar a variável do bloco, desencaixa o bloco da condição, pelo
  `encaixesIncompativeis` genérico da 006;
- a meta-aceitação "todo caso respeita os tipos dos encaixes" passa a valer para o `se`.

A matriz do SC-002 da 006 ([tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md#matriz-do-sc-002-teste-de-unidade))
ganha a coluna "`se` condição":

| Filho | `se` condição |
| --- | --- |
| `numero`, `texto`, `aritmetico`, `negativo` | ❌ |
| `logico`, `relacional`, `e_ou`, `nao` | ✅ |
| `variavel` inteiro/real/cadeia | ❌ |
| `variavel` logico | ✅ |
| `variavel` sem variável | ✅ (gera `???` e um aviso; Executar fica bloqueado) |

**Motivo**: foi esse o desenho da 006 para a 004 e a 005. Repetir a regra no gerador seria
uma segunda fonte de verdade. O único caminho para uma condição não lógica chegar ao
Portugol seria um arquivo editado à mão, que a carga do Blockly recusa
(`BadConnectionCheck`, assunto da 012).

---

## R-06. Caixa de blocos

**Decisão**: categoria nova **"Decisão"**, cor `COR_DECISAO` (210), logo depois de
"Entrada e saída", com dois itens: o `se` sem senão e o `se` com senão
(`extraState: { senao: true }`). As duas formas ficam à vista do iniciante; o senão continua
ligável e desligável no bloco.

**Motivo**: o estudante encontra o `se/senão` sem conhecer o ícone. Categorias por
assunto seguem a organização da 003 e da 006.

---

## R-07. Casos de aceitação (SC-001; P-2)

Todos com blocos do `registroPadrao`, `portugolEsperado` (exigência da meta-aceitação para
blocos com áreas) e o Core real:

| Arquivo | Programa | Entrada | Saída | Cobre |
| --- | --- | --- | --- | --- |
| `se-maior-idade.json` | `leia(idade)`; `se idade >= 18 entao escreva("Maior") fim_se` | `20` | `Maior\n` | **P-2** (História 2 da 006) e teste independente da História 1; variante "sem senão" |
| `se-menor-idade.json` | o mesmo programa | `10` | `""` | Teste independente da História 1 com 10 |
| `se-senao.json` | `leia(idade)`; `se idade >= 18 entao escreva("Maior") senao escreva("Menor") fim_se` | `15` | `Menor\n` | História 2, cenário 1; variante "com senão" |
| `se-faixas-nota.json` | três vezes: `leia(nota)` + `se nota >= 7` / `senao` `se nota >= 5` / `senao` (três faixas, `se` dentro do `senao`) | `8`, `6`, `3` | `A\nB\nC\n` | História 3 (cada faixa numa leitura), indentação de `se` dentro do `senao` |
| `se-casos-de-borda.json` | `se ok entao` com `então` vazio e `senão` vazio; `se nao (idade > 10) e verdadeiro entao` com 6 níveis de `se verdadeiro` aninhados e `escreva("fundo")` | — | `fundo\n` | Casos de borda (vazios, mais de 5 níveis); condição com variável lógica, `nao` e `e` (FR-003) |

**Execução com 20 e com 10** (teste independente da História 1): dois casos com o mesmo
projeto, porque cada caso tem uma única entrada.

**Testes de unidade do gerador**: o cenário 1 da História 1 (texto exato), o cenário 1 da
História 2, o cenário 1 da História 3, condição vazia, `extraState` inválido e o
`relacional(>=, idade, 18)` na condição (P-2, também na unidade).

---

## R-08. Testes headless do Blockly

`tests/unidade/decisao-blockly.test.js`, no modelo do `operadores-blockly.test.js` da 006:

- o verificador recusa `numero`, `texto`, `aritmetico` e `variavel` inteira na condição e
  aceita `relacional`, `e_ou`, `nao`, `logico` e `variavel` lógica (P-1);
- mudar o tipo de `ok` (na condição) para inteiro desencaixa o bloco; um desfazer volta;
- `se` dentro do `ENTAO` e do `SENAO` de outro `se`, e dentro do `programa` (FR-004);
- ligar o senão cria a área; desligar com área vazia tira sem perguntar;
- desligar com comandos chama `confirmarTirarSenao` com a mensagem e a quantidade certas;
  "sim" apaga os blocos e tira a área, e **um** desfazer volta tudo; "não" não muda nada;
- `saveExtraState`/`loadExtraState` e a serialização de ida e volta, com e sem senão.

Os testes headless que registram todas as definições do `registroPadrao`
(`operadores-blockly.test.js`, `entrada-saida-blockly.test.js`,
`variaveis-blockly.test.js`) passam a registrar também o `mutador_se`, porque a definição
do `se` cita o mutador.

---

## R-09. Dependências

Nenhuma. Blockly 12.5.1 já tem o que o mutador precisa (`FieldImage`,
`appendStatementInput`, `Events`). A versão do Core continua só em `src/config.js`.

---

## R-10. Atualizações em documentos de outras specs

Feitas numa task `docs` desta spec:

- 006: `spec.md`, Premissas ("o `se idade >= 18` é conferido na 004") → resolvido, com link
  para o caso `se-maior-idade.json`; `research.md`, R-15, linha da 004 → resolvida;
  `plan.md`, "Pendências para outras specs", linha da 004 → resolvida;
  `contracts/tipos-encaixe.md`, "Regra para as specs 004 e 005", linha do `se` → "aplicada
  na 004" e a coluna "`se` condição" na matriz (R-05).
- 008: `contracts/registro-blocos.md` → o exemplo do `se` passa a apontar para o bloco real
  (`src/blocos/decisao.js`).
