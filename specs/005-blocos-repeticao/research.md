# Pesquisa (Fase 0): Blocos de repetição (enquanto/para)

Spec: [spec.md](spec.md) (RF-05). Plano: [plan.md](plan.md).

---

## R-01. Inventário e pendências obrigatórias

**Já na `main`** (008, 001, 007, 002, 003, 006, 009, 010, 004):

| Peça | Onde | Origem | Uso nesta spec |
| --- | --- | --- | --- |
| Registro de blocos com `areas` e `variantes` | `src/blocos/registro.js` | 008 | `enquanto` e `para` se plugam sem mexer no gerador. O `para` declara as variantes "sem passo" e "com passo" (meta-aceitação). |
| `ctx.comandos`, `ctx.valor`, `ctx.variavel`, `ctx.aviso` | `src/portugol/gerador.js` | 008 | Corpo com um nível a mais de indentação; encaixe vazio vira `???` com aviso; `ctx.aviso` já previa o "passo 0 na 005" ([registro-blocos.md](../008-portugol-valido/contracts/registro-blocos.md)). |
| Campo de variável (`campoVariavel()`, `campo_variavel`) com `variableTypes` | `src/blocos/campo-variavel.js`, `src/ui/campo-variavel.js` | 002, 003 | O menu do campo já filtra por `variableTypes`. O `para` passa só `['inteiro']` (FR-003, R-06). |
| Tipos dos encaixes e verificador `meupia` | `src/blocos/tipos.js`, `src/ui/verificador-encaixe.js` | 006 | `check: ['Logico']` na condição e `check: ['Numero']` em de, até e passo (P-1). |
| Bloco `se` | `src/blocos/decisao.js` | 004 | Cabe em qualquer `input_statement`, logo cabe no corpo dos laços (P-4). |
| Executar, Parar, Saída em fluxo | `src/execucao/`, worker | 009 | Parar interrompe o worker; a Saída recebe lotes. Os testes do laço infinito e das 1.500 linhas usam Portugol escrito à mão (P-2). |
| Entrada interativa por reexecução determinística | `src/execucao/entrada.js`, worker | 010 | Um `leia` em laço pede a cada volta; já testado com um `enquanto` escrito à mão (P-3). |
| Avisos bloqueiam Executar | `src/execucao/controlador.js` | 009 | Qualquer aviso do gerador bloqueia; basta o `para` emitir aviso no passo fixo zero (SC-002). |
| Categoria dinâmica com orientação e botão "Criar variável…" | `src/blocos/caixa-blocos.js` | 003 | Modelo da categoria "Repetição", porque o `para` precisa de uma variável inteira (R-09). |

**Pendências obrigatórias** (pedido explícito do usuário; Premissas da spec):

| # | Origem | Pendência | Onde é resolvida |
| --- | --- | --- | --- |
| P-1 | 006: [tipos-encaixe.md](../006-blocos-operadores/contracts/tipos-encaixe.md#regra-para-as-specs-004-e-005) ("`enquanto` condição `['Logico']`; `para` de, até, passo `['Numero']`") e plan da 006 | A condição do `enquanto` só aceita valores lógicos; de, até e passo do `para` só aceitam números. | R-03, R-04, R-07 |
| P-2 | 009: plan, "Pendências para outras specs" ("repetir no quickstart, com blocos, o Parar num laço infinito e as mais de 1.000 linhas"); comentário em `tests/aceitacao/executar.test.js` | Parar um laço infinito e a Saída com mais de 1.000 linhas, conferidos com os blocos de repetição. | R-11 |
| P-3 | 010: plan, "Pendências para outras specs" e R-12 da 010 | Um `leia` dentro de um laço pede o valor a cada volta, conferido com os blocos. | R-10, R-11 |
| P-4 | 004: plan, "Pendências para outras specs" ("o `se` dentro deles é conferido com os blocos de repetição") | Um `se` encaixa dentro de `enquanto` e `para`. | R-10 |

---

## R-02. Comportamento do Core 1.4.1 (levantado em 2026-11-16)

Programas executados com o `compilarEExecutar` real (Pyodide 0.25.0, `meupia-core` 1.4.1):

| Programa | Resultado |
| --- | --- |
| `para i de 1 ate 5 faca escreva(i)` | `1` a `5` |
| `para i de 5 ate 1 passo -1` | `5` a `1` |
| `para i de 5 ate 1` (sem passo) | nada (intervalo vazio) |
| `para i de 1 ate 6 passo 2` | `1`, `3`, `5` |
| `para i de 1 ate n * 3 passo n`, com `n = 2` | `1`, `3`, `5` (expressões aceitas) |
| `para i de -3 ate -1` | `-3`, `-2`, `-1` |
| para vazio, depois `escreva(i)` | `3`: a variável fica com o último valor |
| intervalo vazio com `i <- 9` antes | `9`: a variável não muda |
| `i <- i + 1` dentro do para; mudar o limite dentro | não alteram a contagem (o Core conta como `range`) |
| para dentro de para; a mesma variável nos dois | aceitos |
| **`passo 0`**, **`passo -0`**, passo numa variável que vale 0 | erro de execução: `ValueError: passo do laço para não pode ser zero` (o adapter mostra a mensagem genérica) |
| **`ate 3.5`**, **`passo 0.5`**, **`ate 6 / 2`** | erro de execução: `TypeError: 'float' object cannot be interpreted as an integer` (o adapter mostra a mensagem de tipos, que fala de texto e número) |
| `ate r` com `r: real` e `r <- 3` | aceito (o valor guardado é inteiro) |
| `ate "3"` | erro de execução (`TypeError`) |
| variável de controle `real` ou `cadeia` | **aceita pelo Core** |
| `enquanto n > 0 faca … fim_enquanto` | contagem regressiva certa |
| `enquanto falso` com corpo vazio | aceito |
| **`enquanto 1 faca`** | **aceito pelo Core** (o Python trata 1 como verdadeiro) |
| `enquanto ??? faca` | erro léxico |
| `se … senao … fim_se` dentro de para; para dentro de se dentro de para | aceitos |

**Consequências**:

- A inclusão dos dois limites, o intervalo vazio e o passo ausente igual a 1 são do Core
  (FR-005, FR-006, cenário 3 da História 1): o editor só gera o texto.
- Como o Core aceita `enquanto 1` e variável de controle não inteira, P-1 e FR-003 são
  regras **só do editor** (R-06, R-07), como o `se 1 entao` da 004.
- Passo zero e limites com casas decimais quebram em execução. O editor bloqueia o que
  pode ver antes (valor fixo, R-05) e traduz o resto (R-08).
- Nenhuma lacuna do Core: o comportamento é a regra do Portugol do Core (contagem com
  inteiros). Nenhuma issue a abrir (princípio I).

---

## R-03. O bloco `enquanto` (FR-001; P-1)

**Decisão**: bloco de comando com a condição e uma área de comandos.

| Parte | Definição |
| --- | --- |
| `type` / `rotulo` | `enquanto` / `enquanto` |
| Condição | `input_value` `CONDICAO`, `check: ['Logico']` (P-1) |
| Corpo | `input_statement` `FACA` |
| Texto do bloco | `enquanto %1 faça` (acento na tela; o Portugol usa `faca`) |
| Encaixe na sequência | `previousStatement` e `nextStatement` (FR-008) |
| Cor | `COR_REPETICAO = 120` (categoria nova, R-09; não colide com 160, 200, 210, 230, 260, 290, 330) |
| `areas` | `['FACA']` |
| Variantes | nenhuma (variante implícita "padrão") |
| Dica | "Repete os comandos de dentro enquanto a condição for verdadeira. Se ela nunca ficar falsa, use Parar." |

**Geração**:

```text
enquanto <condição> faca
    <corpo>
fim_enquanto
```

Condição vazia: `enquanto ??? faca` e o aviso `Falta a condição do bloco enquanto` (bloqueia
Executar). Corpo vazio é permitido (casos de borda). A condição sempre verdadeira é permitida;
o estudante usa Parar (009, R-11).

**Alternativas**: "repita … ate" (não existe no Core, Premissas); um bloco único de laço com
menu enquanto/para (mistura encaixes de tipos diferentes; pior para o iniciante).

---

## R-04. O bloco `para` (FR-002 a FR-006; P-1)

**Decisão**: bloco de comando com a variável de controle, três encaixes de valor e uma área.

| Parte | Definição |
| --- | --- |
| `type` / `rotulo` | `para` / `para` |
| Variável de controle | campo `VAR`, `campoVariavel(['inteiro'])` (R-06) |
| De | `input_value` `DE`, `check: ['Numero']` (P-1) |
| Até | `input_value` `ATE`, `check: ['Numero']` (P-1) |
| Passo | `input_value` `PASSO`, `check: ['Numero']`, **opcional**: vazio = sem `passo` (FR-005) |
| Corpo | `input_statement` `FACA` |
| Texto do bloco | `para %1 de %2 até %3 passo %4 faça` |
| Cor | `COR_REPETICAO` |
| `areas` | `['FACA']` |
| Variantes | `sem passo` (sem `inputs.PASSO.block`), `com passo` (com) |
| Dica (FR-006) | "Repete os comandos de dentro contando com a variável, de “de” até “até”, incluindo os dois. Sem passo, conta de 1 em 1; com passo negativo, conta para trás." |

O campo se chama `VAR`, como no `leia` e no `recebe`: assim renomear, apagar a variável
(com a contagem de blocos da 002) e os testes headless funcionam sem nada novo.

**Geração**:

```text
para <v> de <de> ate <até>[ passo <passo>] faca
    <corpo>
fim_para
```

| Situação | Resultado |
| --- | --- |
| variável vazia | `???` + `Falta a variável de controle do bloco para` |
| de / até vazios | `???` + `Falta o valor inicial (de) do bloco para` / `Falta o valor final (até) do bloco para` |
| passo vazio | sem ` passo …` (não é aviso) |
| passo fixo zero | texto normal + aviso (R-05) |
| número fixo com casas decimais em de, até ou passo | texto normal + aviso (R-05) |
| variável de controle não inteira | texto normal + aviso (R-06) |

Os valores não pedem precedência mínima: `de`, `ate`, `passo` e `faca` delimitam cada
expressão (`para i de 1 ate n - 1 passo -1 faca`).

**Alternativa para o passo opcional**: um ícone "+"/"−" como o senão da 004. Rejeitada: um
encaixe vazio já diz "sem passo", não precisa de mutador, de confirmação nem de `extraState`
(princípio VI). A dica e o texto "passo" deixam claro que ele é opcional.

---

## R-05. Passo fixo zero e números fixos com casas decimais (FR-007, SC-002)

**Valor fixo**: o bloco encaixado é um `numero`, ou um `negativo` cujo encaixe é um `numero`.
A função pura `valorFixo(bloco)` devolve o número normalizado (`normalizarNumero` da 003/006)
com o sinal, ou `null` se o encaixe não for um valor fixo (expressão, variável, vazio).

| Regra | Condição | Aviso |
| --- | --- | --- |
| Passo zero (FR-007) | `valorFixo(passo)` vale zero (`0`, `00`, `0,0`, `-0`) | `O passo do bloco para não pode ser zero: o laço nunca terminaria` |
| Casas decimais | `valorFixo` de de, até ou passo tem parte decimal (`1,5`, `3,0`) | `O bloco para só conta com números inteiros: tire as casas decimais` |

Qualquer aviso bloqueia Executar (009), então nenhum `para` com passo fixo zero chega ao Core
(SC-002). O `3,0` também é recusado: no Core ele vira `3.0`, um real, e quebra o `range`.

Fora do valor fixo (expressão ou variável), o editor não sabe o valor antes de executar: o
erro aparece na execução, traduzido (R-08). O FR-007 só fala de valor fixo.

**Alternativa**: proibir o `0` no campo do número quando ele está no passo. Rejeitada: o
campo do número não sabe onde está encaixado, e o aviso explica o porquê ao estudante.

---

## R-06. Variável de controle só inteira (FR-003)

**Decisão**:

1. `campoVariavel(tipos)` ganha um parâmetro opcional com os tipos aceitos (padrão: os
   quatro, como hoje). O `para` passa `['inteiro']`; o menu do campo já filtra por
   `variableTypes` (`CampoVariavel.dropdownCreate`), então só aparecem as inteiras.
2. **Mudar o tipo** de uma variável usada no `para` para real, cadeia ou lógico continua
   permitido (regra da 002). O campo mantém a variável, e o gerador avisa:
   `A variável de controle do bloco para precisa ser do tipo inteiro`. Executar fica
   bloqueado; voltar o tipo (ou Ctrl+Z) tira o aviso.
3. Para o gerador saber o tipo, o `ctx` ganha `ctx.tipoVariavel(bloco, campo)` → o tipo da
   variável do campo em `projeto.variaveis`, ou `undefined`. Pura, lê só o projeto (princípio
   II). É a única mudança no gerador; o contrato da 008 ganha a linha.

**Alternativas**: soltar o `para` ou limpar o campo ao mudar o tipo (perde o trabalho do
estudante e o caminho de volta é pior); recusar a mudança de tipo (contradiz a 002).

**Ponto de atenção (012)**: ao carregar um arquivo com uma variável não inteira no `para`, o
`FieldVariable` do Blockly recusa o valor (tipo fora de `variableTypes`) e o campo chega vazio:
o aviso passa a ser "Falta a variável de controle do bloco para". Os dois casos bloqueiam
Executar.

---

## R-07. Tipos dos encaixes (P-1, SC-002 da 006)

`check: ['Logico']` na condição do `enquanto` e `check: ['Numero']` em `DE`, `ATE` e `PASSO`,
exatamente a tabela "Regra para as specs 004 e 005" da 006. O verificador `meupia`, o
desencaixe ao mudar o tipo de uma variável ou trocar a variável de um bloco, e a
meta-aceitação dos encaixes passam a valer sem código novo.

A matriz do SC-002 da 006 (`tests/unidade/tipos.test.js`) ganha duas colunas:

| Filho \ Encaixe | `enquanto` condição | `para` de/até/passo |
| --- | --- | --- |
| `numero`, `negativo`, `variavel` inteiro/real | ❌ | ✅ |
| `aritmetico` (saída `Numero`/`Texto`) | ❌ | ✅ |
| `texto`, `variavel` cadeia | ❌ | ❌ |
| `logico`, `relacional`, `e_ou`, `nao`, `variavel` lógica | ✅ | ❌ |
| `variavel` sem variável | ✅ | ✅ |

O `aritmetico` cabe no `para` porque a saída dele inclui `Numero` (o `+` concatena texto, regra
da 006). Um `"a" + "b"` no `ate` encaixa e quebra na execução com a mensagem de tipos: é o mesmo
limite já aceito pela 006 para o `recebe` de inteiro.

---

## R-08. Erros de execução do para, em pt-BR (princípio V)

O adapter (`traduzirErroExecucao`, `src/core/executor-core.js`) ganha duas traduções, pelo
texto da exceção:

| Exceção | Texto reconhecido | Mensagem |
| --- | --- | --- |
| `ValueError` | `passo do laço para não pode ser zero` | `O passo do para ficou zero: o laço nunca terminaria.` |
| `TypeError` | `'float' object cannot be interpreted as an integer` | `O para só conta com números inteiros: de, até e passo não podem ter casas decimais.` |

O rastro continua no detalhe. As outras mensagens não mudam. Cobre o passo numa variável que
vale 0, `ate n / 2` e afins, que o editor não vê antes de executar (R-05).

---

## R-09. Categoria "Repetição" na caixa de blocos

**Decisão**: categoria dinâmica `CATEGORIA_REPETICAO`, logo depois de "Decisão", com
`conteudoCategoriaRepeticao(variaveis)`:

1. sempre o `enquanto`, vazio;
2. com alguma variável inteira, o `para` com a **última inteira** da lista do mapa (mesma regra
   do `leia` e do `recebe`), `DE` = número `1`, `ATE` = número `5` e passo vazio;
3. sem variável inteira, no lugar do `para`, a orientação
   `Para usar o para, crie uma variável do tipo inteiro.` e o botão "Criar variável…".

Os números pré-encaixados são blocos normais (não shadow), como o texto do escreva da 003: o
gerador só lê `inputs.X.block`.

---

## R-10. Casos de aceitação (SC-001; P-3, P-4)

Novos em `tests/aceitacao/casos/`, todos com `portugolEsperado` (têm áreas de comandos):

| Arquivo | Programa | Saída | Cobre |
| --- | --- | --- | --- |
| `para-contagem.json` | `para i de 1 ate 5` sem passo, `escreva(i)` | `1`…`5` | História 1, cen. 1; variante "sem passo" |
| `para-regressivo.json` | `para i de 5 ate 1 passo -1` | `5`…`1` | História 1, cen. 2; "com passo"; passo negativo |
| `para-passo-dois.json` | `para i de 1 ate 10 passo 2` | `1 3 5 7 9` | passo positivo |
| `para-intervalo-vazio.json` | `para i de 5 ate 1` sem passo, depois `escreva("fim")` | `fim` | História 1, cen. 3 |
| `enquanto-regressiva.json` | `n <- 3`, `enquanto n > 0` com `escreva(n)` e `n <- n - 1` | `3 2 1` | História 2 |
| `repeticao-leia-soma.json` | `para i de 1 ate 3` com `leia(x)` e `soma <- soma + x`; depois `escreva(soma)`; entrada `4`, `5`, `6` | `15` | **P-3** (a suíte interativa da 010 pega todo caso com entrada e confere um pedido por volta) |
| `repeticao-se-par-impar.json` | `para i de 1 ate 4` com `se i % 2 = 0 … senao …`; depois um `enquanto` com um `se` dentro | `impar 2 impar 4 …` | **P-4**; FR-008 |
| `repeticao-aninhada.json` | `para` dentro de `para`; `enquanto` dentro de `para`; `para` dentro de `se` dentro de `enquanto` | produto das voltas | FR-008; casos de borda |
| `repeticao-casos-de-borda.json` | `enquanto falso` vazio, `para` vazio, `para` com `ate` numa expressão (`n * 2`) e passo numa variável | linhas esperadas | casos de borda; FR-004 |

A meta-aceitação já exige as duas variantes do `para`, a do `enquanto`, `portugolEsperado` e
encaixes compatíveis.

Os casos de borda que **não executam** (passo fixo zero, limite com casas decimais, variável
de controle real, encaixes vazios) ficam nos testes de unidade do gerador: a suíte de
aceitação exige zero avisos.

---

## R-11. Parar, mais de 1.000 linhas e leia em laço, com blocos (P-2, P-3)

`tests/aceitacao/executar.test.js` (worker real) passa a montar o Portugol a partir de
projetos em blocos, com `gerarPortugol`, no lugar do texto escrito à mão:

| Teste | Projeto | Esperado |
| --- | --- | --- |
| Parar num laço infinito (P-2) | `i <- 0`; `enquanto verdadeiro` com `i <- i + 1` e `escreva(i)` | dois lotes chegam; Parar → `interrompido`; as linhas começam `1`, `2`, `3`; a execução seguinte funciona |
| Mais de 1.000 linhas (P-2) | `para i de 1 ate 1500` com `escreva(i)` | 1.500 linhas inteiras e na ordem |
| Leia em laço (P-3) | `para i de 1 ate 2` com `leia(nome)` e `escreva("Oi, ", nome)` | pedidos `['nome', 'nome']`; linhas `Oi, Ana`, `Oi, Bia`, sem repetir |
| Parar com leia aberto num laço (P-3) | `enquanto verdadeiro` com `leia(nome)` | Parar com o pedido aberto → `interrompido` |
| Passo numa variável que vale 0 (R-08) | `k <- 0`; `para i de 1 ate 3 passo k` | `erro_execucao` com `O passo do para ficou zero: o laço nunca terminaria.` |

Os projetos ficam num módulo de apoio (`tests/aceitacao/suporte/projetos-repeticao.js`), que
monta o JSON com os mesmos blocos do editor e garante zero avisos. O quickstart repete os
quatro no navegador (pedido do plan da 009).

---

## R-12. Dependências

Nenhuma dependência nova. Blockly 12.5.1, Pyodide 0.25.0 e as ferramentas de teste continuam
as mesmas (princípio VI).

---

## R-13. Documentos de outras specs

| Arquivo | Mudança |
| --- | --- |
| `specs/006-blocos-operadores/contracts/tipos-encaixe.md` | Colunas `enquanto` e `para` na matriz; regra da 005 marcada como aplicada. |
| `specs/006-blocos-operadores/plan.md` | Pendência 004/005: 005 ✅. |
| `specs/009-executar-no-core/plan.md` | Pendência da 005 ✅ (R-11). |
| `specs/010-entrada-de-dados/plan.md` | Pendência da 005 ✅ (R-10, R-11). |
| `specs/004-blocos-se-senao/plan.md` | Pendência da 005 ✅ (R-10). |
| `specs/008-portugol-valido/contracts/registro-blocos.md` | Linha `ctx.tipoVariavel`; o exemplo "passo 0 na 005" aponta para o bloco real. |
| `specs/005-blocos-repeticao/spec.md` | Premissas: as quatro pendências marcadas como conferidas, com o caso de cada uma. |
