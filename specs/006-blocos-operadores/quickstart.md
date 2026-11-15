# Quickstart: validar os blocos de operadores e valores

Como provar que a 006 funciona. As regras estão nos [contratos](contracts/) e no
[data-model](data-model.md); aqui ficam só os passos.

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Branch `006-blocos-operadores`.
- Internet na primeira execução da aceitação (o Pyodide baixa o `meupia-core` 1.4.1).

## 1. Testes

```bash
npm run test:unidade
```

Esperado: os testes novos passam, em especial:

| Arquivo | Prova |
| --- | --- |
| `tests/unidade/blocos-operadores.test.js` | Exemplos de geração do [contrato](contracts/blocos-operadores.md), incluindo `(nota1 + nota2) / 2`, `>=`, `<>`, `nao (x > 10)`, `(a ou b) e c`, `"Olá"`, `3.5` (FR-001 a FR-008) |
| `tests/unidade/tipos.test.js` | Matriz do SC-002 célula a célula; `encaixesIncompativeis` com tipo novo e troca de variável |
| `tests/unidade/operadores-blockly.test.js` | Verificador recusa encaixes errados; mudar o tipo solta e o Ctrl+Z volta; todos os casos de aceitação carregam no Blockly |
| `tests/unidade/blocos-valores-contas.test.js` | Os testes da 003 continuam passando sem mudança; `check` novos de `numero`, `texto`, `aritmetico` |

```bash
npm run test:aceitacao
```

Esperado: os sete casos novos passam no Core real (`recebe-idade-quinze`,
`operadores-media`, `operadores-comparacao`, `operadores-logicos`, `valores-fixos`,
`expressoes-estrutura`, `divisao-por-zero`), a meta-aceitação não aponta variante sem caso
nem caso com encaixe incompatível, e os casos da 002 e da 003 continuam passando.

```bash
npm run cobertura
```

Esperado: ≥ 80% em linhas e branches; README com a linha `**Testes:** N · **Cobertura:** X%`
atualizada; relatório em `cobertura/`.

## 2. No navegador (`npm run dev`)

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| A | Abrir as categorias da caixa | Variáveis, Entrada e saída, Valores (número, texto, verdadeiro), Contas (+, −), Comparações (=), Lógica (e, ou, não) | R-12 |
| B | Criar `nota1` e `nota2` (inteiro); montar `escreva((nota1 + nota2) ÷ 2)` com os blocos | Portugol `escreva((nota1 + nota2) / 2)` | História 1, cenário 1 |
| C | Bloco de comparação, escolher "≥", e depois "≠" | Portugol mostra `>=` e depois `<>` | História 2 |
| D | Montar `não (x > 10)` e `(a ou b) e c` | `nao (x > 10)` e `(a ou b) e c` | História 3 |
| E | Bloco de texto `Olá`; bloco de número digitando `3,5` | `"Olá"` e `3.5` | História 4 |
| F | Mudar um número de 5 para 8 no campo | O Portugol mostra 8 enquanto se digita | Passo B da 007 (P-3 da 002) |
| G | Tentar encaixar `verdadeiro` numa conta e um número no `e` | Não encaixam | SC-002 |
| H | Criar `ok` (lógico); tentar `ok recebe 5`; depois `ok recebe (idade ≥ 18)` | O `5` não encaixa; a comparação encaixa | SC-002, P-2 da 002 |
| I | Encaixar `idade` (inteiro) em `idade + 1`; mudar o tipo de `idade` para lógico | O bloco `idade` sai da conta e fica solto; Portugol `??? + 1` com aviso; Ctrl+Z volta tudo | R-10 |
| J | Montar `idade recebe 15` | `idade <- 15` | P-1 da 002 |
| K | Deixar um lado da comparação vazio | `??? < 1` e o aviso "Falta o primeiro valor do bloco comparação" | Caso de borda |
| L | Console do navegador durante A–K | Nenhum erro | — |

## 3. O que este quickstart não cobre

- Executar no navegador e ver a Saída (spec 009): os resultados (`7.5`, `3.5`, `verdadeiro`…)
  são provados pela aceitação no Core.
- `se`, `enquanto` e `para` usando comparações (specs 004 e 005, com o `check` do
  [tipos-encaixe.md](contracts/tipos-encaixe.md)).
- Carregar arquivo com encaixe incompatível (spec 012).
