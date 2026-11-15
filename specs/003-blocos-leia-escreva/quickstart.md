# Quickstart: validar os blocos de entrada e saída

Guia de validação da spec 003. Contratos em [contracts/](contracts/), modelo em
[data-model.md](data-model.md), decisões em [research.md](research.md).

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Rede na primeira execução da aceitação (o Pyodide instala o `meupia-core` do PyPI;
  ver 008/R-04).

## 1. Testes

```bash
npm run test:unidade
```

Esperado: todos passam, incluindo `blocos-entrada-saida`, `blocos-valores-contas`,
`entrada-saida-blockly`, o `gerador` com `precedenciaMinima` e a `caixa-blocos` com as
categorias novas.

```bash
npm run test:aceitacao
```

Esperado: os nove casos do R-10 rodam no Core 1.4.1 real. Em especial:

| Caso | Prova |
| --- | --- |
| `escreva-conta-idade.json` | `idade <- 15` e `escreva(idade + 1)` mostram `16` (pendência P-1 da 002). |
| `escreva-valores-iniciais.json` | Sem atribuir, as variáveis mostram `0`, `0.0`, texto vazio e `falso` (P-2). |
| `leia-quatro-tipos.json` | O `leia` com o campo de variável da 002 lê `Ana`, `15`, `1.5` e `VERDADEIRO` (P-3). |

A meta-verificação da 008 encontra as variantes de `escreva`, `leia`, `numero`,
`texto` e `aritmetico` em algum caso.

```bash
npm run cobertura
```

Esperado: linhas e branches ≥ 80% no núcleo, com `src/blocos/entrada-saida.js`,
`valores.js`, `contas.js` e `campo-variavel.js` no relatório; README atualizado.

## 2. No navegador (`npm run dev`)

Executar continua desabilitado até a 009; aqui se confere a montagem e o Portugol.

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| A | Abrir a caixa de blocos. | Categorias Variáveis, Entrada e saída, Valores, Contas, em pt-BR. | R-09 |
| B | Com o projeto novo, abrir Entrada e saída. | Um `escreva` com “Olá, mundo!”, a frase "Para usar o leia, crie uma variável primeiro." e o botão "Criar variável…". | Caso de borda (leia sem variáveis) |
| C | Arrastar o `escreva` para dentro do programa, cronometrando desde a abertura da página. | Portugol mostra `escreva("Olá, mundo!")`; menos de 2 min (parte de montar do SC-002). | História 1, cenário 1 |
| D | Passar o mouse sobre `escreva` e `leia`. | Dicas curtas em pt-BR; a do `leia` explica a regra do lógico. | FR-006 |
| E | Criar `idade` (inteiro) na categoria Variáveis. No `escreva`, clicar "+" e encaixar a variável `idade` no segundo valor; trocar o texto por `Idade: `. | `escreva("Idade: ", idade)`. | História 1, cenário 2; FR-002 |
| F | Clicar "+" até não aparecer mais. | Para em 10 valores; com 10, só "−". Encaixes vazios aparecem como `???` com aviso "Falta o valor k do bloco escreva". | FR-001 |
| G | Clicar "−" com um bloco no último encaixe; depois Ctrl+Z. | O bloco fica solto e some do Portugol; Ctrl+Z volta o encaixe e o bloco. | R-04 |
| H | Criar `nome` (cadeia) pelo botão da categoria e abrir Entrada e saída de novo. | Aparece um `leia` com `nome`; encaixado, o Portugol mostra `leia(nome)`. | História 2, cenário 1; P-3 |
| I | Abrir o menu da variável no `leia`. | Mesmo menu da 002 (lista, Renomear…, Mudar o tipo…, Apagar); renomear muda o `leia`. | P-3 |
| J | Tentar encaixar um bloco `numero` ou uma conta no `leia`. | Não há onde encaixar. | FR-005 |
| K | Apagar a variável usada no `leia`. | A confirmação conta o `leia` entre os blocos apagados. | 002, FR-008 |
| L | Num bloco `numero`, digitar `3,5`, depois `12a`, depois `007`. | `3.5` no Portugol; `12a` é recusado e volta ao anterior; `007` vira `7`. | R-07 (006 FR-006) |
| M | Num bloco `texto`, digitar `a"b\c`. | Portugol `"a\"b\\c"`. | R-08 (006 FR-007) |
| N | Montar `escreva((2 + 3) × 4)` e `escreva(10 − (3 − 2))`. | Parênteses só onde a estrutura exige. | R-06 |
| O | Mudar o número `0` de um bloco no programa (passo B da 007, agora possível). | Portugol atualiza em < 1 s. | 007, passo B |

## 3. O que este quickstart não cobre

- Ver a Saída ao clicar em Executar (009) e digitar a entrada do `leia` (010): a
  mesma saída já é provada pelos casos de aceitação da seção 1.
