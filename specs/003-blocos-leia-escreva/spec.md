# Especificação: Blocos de entrada e saída (leia/escreva)

**Branch da feature**: `003-blocos-leia-escreva`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-03

**Entrada**: Requisito RF-03: "Blocos de entrada e saída: leia(variavel) e escreva(valor, ...)."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Mostrar uma mensagem (Prioridade: P1)

O estudante usa o bloco **escreva** para mostrar um texto, um número, o valor de uma
variável ou o resultado de uma expressão.

**Por que esta prioridade**: o "Olá, mundo!" é o primeiro programa de todo iniciante
e o único jeito de ver o resultado.

**Teste independente**: montar `escreva("Olá, mundo!")`, executar e ver
`Olá, mundo!` na Saída.

**Cenários de aceitação**:

1. **Dado** um bloco escreva com o texto "Olá, mundo!", **Quando** o Portugol é
   gerado, **Então** aparece `escreva("Olá, mundo!")`.
2. **Dado** um escreva com dois valores, o texto "Idade: " e a variável `idade`,
   **Quando** o Portugol é gerado, **Então** aparece `escreva("Idade: ", idade)`.
3. **Dado** dois blocos escreva seguidos, **Quando** o programa é executado,
   **Então** cada um aparece numa linha própria da Saída.

---

### História 2 - Ler um valor digitado (Prioridade: P1)

O estudante usa o bloco **leia** para que o programa peça um valor ao usuário e o
guarde numa variável.

**Por que esta prioridade**: programas interativos são a base dos exercícios de
lógica (calcular média, verificar idade...).

**Teste independente**: montar `leia(nome)` seguido de `escreva("Oi, ", nome)`,
executar, digitar "Ana" e ver `Oi, Ana`.

**Cenários de aceitação**:

1. **Dado** a variável `nome`, **Quando** o estudante encaixa um bloco leia e escolhe
   `nome`, **Então** o Portugol mostra `leia(nome)`.
2. **Dado** um bloco leia sem variável escolhida, **Quando** o Portugol é gerado,
   **Então** o bloco é sinalizado como incompleto (regra da feature 008).

### Casos de borda

- escreva sem nenhum valor: sinalizado como incompleto.
- escreva com vários valores: os valores aparecem colados, sem espaço entre eles,
  como faz o Core; o estudante inclui os espaços dentro dos textos.
- leia de variável lógica: só o texto "verdadeiro" (sem diferenciar maiúsculas)
  vira verdadeiro; qualquer outro texto vira falso (regra do Core, mostrada como
  dica no bloco).
- leia num projeto sem variáveis: o bloco orienta a criar uma variável primeiro.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O editor DEVE oferecer o bloco escreva, com 1 a 10 valores, que gera
  `escreva(v1, v2, ...)` na ordem dos encaixes.
- **FR-002**: O estudante DEVE poder acrescentar e remover valores do escreva.
- **FR-003**: Cada execução de escreva DEVE produzir uma linha na Saída.
- **FR-004**: O editor DEVE oferecer o bloco leia, que recebe exatamente uma variável
  já criada e gera `leia(nome)`.
- **FR-005**: O bloco leia NÃO PODE receber expressões nem valores fixos, só
  variáveis.
- **FR-006**: Os blocos DEVEM exibir uma dica curta, em português, explicando o que
  fazem (ex.: "Mostra os valores na tela, um ao lado do outro").

### Entidades principais

- **Comando escreva**: lista ordenada de 1 a 10 valores.
- **Comando leia**: referência a uma variável do projeto.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% dos programas de teste com escreva, a Saída mostra
  exatamente o texto esperado.
- **SC-002**: Um iniciante monta e executa um "Olá, mundo!" em menos de 2 minutos.

## Premissas

- A forma de digitar o valor durante a execução é definida na feature 010.
- A conversão do texto digitado para o tipo da variável segue as regras do Core.
