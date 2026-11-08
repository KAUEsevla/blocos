# Especificação: Blocos de operadores e valores

**Branch da feature**: `006-blocos-operadores`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-06

**Entrada**: Requisito RF-06: "Blocos de operadores: aritméticos (+ - * / %), relacionais (= <> < > <= >=), lógicos (e ou nao), literais de número, texto e lógico."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Fazer contas (Prioridade: P1)

O estudante usa blocos de soma, subtração, multiplicação, divisão, resto e número
negativo, combinando números e variáveis.

**Por que esta prioridade**: cálculo (média, dobro, troco) é o primeiro uso real de
variáveis.

**Teste independente**: montar `escreva((nota1 + nota2) / 2)` e verificar o Portugol
e a saída.

**Cenários de aceitação**:

1. **Dado** um bloco de soma dentro de um bloco de divisão, **Quando** o Portugol é
   gerado, **Então** a soma aparece entre parênteses: `(nota1 + nota2) / 2`.
2. **Dado** `7 / 2`, **Quando** executado, **Então** a Saída mostra `3.5` (a divisão
   sempre dá real, regra do Core).

---

### História 2 - Comparar valores (Prioridade: P1)

O estudante compara dois valores com igual, diferente, menor, maior, menor ou igual
e maior ou igual. O resultado é lógico e pode ser usado em se e enquanto.

**Teste independente**: montar `se idade >= 18` e verificar o operador gerado.

**Cenários de aceitação**:

1. **Dado** o bloco de comparação com "≥", **Quando** o Portugol é gerado, **Então**
   aparece `>=`.
2. **Dado** o bloco "diferente", **Quando** o Portugol é gerado, **Então** aparece
   `<>`.

---

### História 3 - Combinar condições (Prioridade: P2)

O estudante junta condições com **e**, **ou** e inverte com **não**.

**Cenários de aceitação**:

1. **Dado** `nao (x > 10)`, **Quando** o Portugol é gerado, **Então** a comparação
   aparece entre parênteses, preservando o sentido do bloco.
2. **Dado** `(a ou b) e c` montado em blocos, **Quando** o Portugol é gerado,
   **Então** os parênteses garantem que o `ou` é calculado antes do `e`.

---

### História 4 - Valores fixos (Prioridade: P1)

O estudante usa blocos de número, de texto e de lógico (verdadeiro/falso).

**Cenários de aceitação**:

1. **Dado** um bloco de texto com `Olá`, **Quando** o Portugol é gerado, **Então**
   aparece `"Olá"` (com aspas).
2. **Dado** um bloco de número com `3,5` digitado com vírgula, **Quando** o Portugol
   é gerado, **Então** aparece `3.5`.

### Casos de borda

- Operador com uma das entradas vazia: sinalizado como incompleto.
- Texto contendo aspas duplas ou barra invertida: permitido; o Portugol gerado
  representa esses caracteres de forma que a Saída mostre exatamente o texto
  digitado (o Core aceita `\"` dentro de textos).
- Texto vazio: permitido, gera `""`.
- Número inválido (ex.: `12a`): recusado no próprio bloco.
- Divisão por zero: não é bloqueada no editor; o Core informa o erro na execução.
- Soma de texto com número: permitida; gera concatenação (regra do Core).

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O editor DEVE oferecer operadores aritméticos `+`, `-`, `*`, `/`, `%`
  e o negativo (`-x`).
- **FR-002**: O editor DEVE oferecer operadores relacionais `=`, `<>`, `<`, `>`,
  `<=`, `>=`, que produzem valor lógico.
- **FR-003**: O editor DEVE oferecer operadores lógicos `e`, `ou`, `nao`, que só
  aceitam valores lógicos.
- **FR-004**: O editor DEVE oferecer valores fixos de número (inteiro ou real),
  texto e lógico (verdadeiro/falso).
- **FR-005**: O Portugol gerado DEVE calcular exatamente o que a estrutura dos blocos
  indica: sempre que a precedência do Portugol mudaria o sentido, a subexpressão
  DEVE aparecer entre parênteses.
- **FR-006**: Números reais DEVEM ser gerados com ponto decimal, mesmo se digitados
  com vírgula.
- **FR-007**: Textos DEVEM ser gerados entre aspas duplas, e qualquer texto digitado
  (inclusive com aspas ou barra invertida) DEVE aparecer na Saída exatamente como foi
  digitado.
- **FR-008**: Os blocos DEVEM mostrar os operadores com rótulos amigáveis (ex.: "≥",
  "≠", "resto de") e gerar o símbolo do Portugol.

### Entidades principais

- **Expressão**: árvore de valores e operadores; cada nó tem um tipo de resultado
  (numérico, texto ou lógico) que define onde ele pode ser encaixado.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% das expressões de teste, o valor calculado pelo Core é igual
  ao valor esperado pela estrutura dos blocos.
- **SC-002**: Nenhum valor lógico encaixa em lugar de número e vice-versa nas
  entradas que exigem um tipo.

## Premissas

- Funções nativas (raiz, piso, tamanho...) estão fora do escopo mínimo.
- A precedência considerada é a do Guia da Linguagem do Core na versão fixada.
