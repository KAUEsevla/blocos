# Especificação: Blocos de variáveis

**Branch da feature**: `002-blocos-variaveis`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-02

**Entrada**: Requisito RF-02: "Blocos de variáveis: declarar variável com tipo (inteiro, real, cadeia, logico), atribuir valor e usar o valor numa expressão."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Criar uma variável com tipo (Prioridade: P1)

O estudante cria uma variável informando um nome e escolhendo um dos quatro tipos:
inteiro, real, cadeia ou lógico. A variável passa a aparecer na declaração do
programa e fica disponível nos blocos que usam variáveis.

**Por que esta prioridade**: sem variáveis não há leia, atribuição, `para` nem
expressões úteis; é a base das demais features de blocos.

**Teste independente**: criar a variável `idade` do tipo inteiro e verificar que ela
aparece na declaração do Portugol (`idade: inteiro`) e na lista de variáveis.

**Cenários de aceitação**:

1. **Dado** um projeto novo, **Quando** o estudante cria a variável `idade` do tipo
   inteiro, **Então** o Portugol passa a ter uma seção `var` com `idade: inteiro`.
2. **Dado** variáveis `a` e `b` do tipo inteiro e `nome` do tipo cadeia, **Quando**
   o Portugol é gerado, **Então** as variáveis do mesmo tipo são declaradas juntas
   (`a, b: inteiro`) e cada tipo aparece uma única vez.
3. **Dado** um nome inválido (ex.: `2lugar`, `se`, `minha idade`), **Quando** o
   estudante tenta criar a variável, **Então** a criação é recusada com uma mensagem
   que explica a regra quebrada.

---

### História 2 - Atribuir um valor (Prioridade: P1)

O estudante usa o bloco "variável recebe valor" para guardar um valor ou o
resultado de uma expressão numa variável.

**Por que esta prioridade**: atribuir é a operação mais básica de um programa.

**Teste independente**: montar `idade recebe 15` e verificar o Portugol
`idade <- 15`.

**Cenários de aceitação**:

1. **Dado** a variável `idade`, **Quando** o estudante encaixa "idade recebe 15",
   **Então** o Portugol mostra `idade <- 15`.
2. **Dado** o bloco de atribuição sem valor encaixado, **Quando** o Portugol é
   gerado, **Então** o bloco é sinalizado como incompleto (regra da feature 008).

---

### História 3 - Usar o valor de uma variável (Prioridade: P2)

O estudante encaixa o bloco de uma variável dentro de expressões, condições,
`escreva` e limites do `para`.

**Por que esta prioridade**: completa o ciclo declarar → guardar → usar.

**Teste independente**: montar `escreva(idade + 1)` e verificar o Portugol.

**Cenários de aceitação**:

1. **Dado** a variável `idade`, **Quando** o estudante encaixa o bloco `idade` numa
   soma com 1 dentro de um escreva, **Então** o Portugol mostra `escreva(idade + 1)`.

---

### História 4 - Renomear e apagar variáveis (Prioridade: P3)

O estudante corrige o nome de uma variável ou apaga uma que não usa mais.

**Teste independente**: renomear `idade` para `anos` e verificar que todos os usos
mudam; apagar uma variável em uso e verificar a confirmação.

**Cenários de aceitação**:

1. **Dado** a variável `idade` usada em três blocos, **Quando** o estudante a renomeia
   para `anos`, **Então** os três usos e a declaração passam a mostrar `anos`.
2. **Dado** uma variável usada em blocos, **Quando** o estudante pede para apagá-la,
   **Então** o editor informa quantos blocos a usam e só apaga (variável e blocos)
   após confirmação.

### Casos de borda

- Dois nomes que diferem apenas por maiúsculas/minúsculas (`Idade` e `idade`): o
  segundo é recusado como duplicado.
- Nome igual a palavra reservada do Portugol (`se`, `para`, `inicio`, `verdadeiro`,
  `e`, `ou`, `nao`, `leia`, `escreva`...): recusado.
- Nome igual ao nome do programa: permitido (não há conflito no Portugol).
- Mudar o tipo de uma variável já usada: permitido; o Core aponta incompatibilidades
  ao executar.
- Projeto sem variáveis: a seção `var` não aparece no Portugol.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O estudante DEVE poder criar variáveis informando nome e um tipo entre
  inteiro, real, cadeia e lógico.
- **FR-002**: O nome DEVE começar com letra, conter apenas letras sem acento,
  dígitos e sublinhado (`_`) e ter entre 1 e 30 caracteres.
- **FR-003**: O nome NÃO PODE ser palavra reservada do Portugol nem repetir outra
  variável (comparação sem diferenciar maiúsculas/minúsculas).
- **FR-004**: Toda variável criada DEVE ser declarada na seção `var` do Portugol,
  agrupada por tipo, na ordem inteiro, real, cadeia, lógico e, dentro do tipo, na
  ordem de criação.
- **FR-005**: O editor DEVE oferecer o bloco "variável recebe valor", que gera
  `nome <- valor`.
- **FR-006**: O editor DEVE oferecer o bloco de leitura de variável, encaixável em
  qualquer lugar que espere um valor.
- **FR-007**: Renomear uma variável DEVE atualizar a declaração e todos os usos.
- **FR-008**: Apagar uma variável em uso DEVE exigir confirmação informando quantos
  blocos serão removidos.
- **FR-009**: Toda variável é do programa todo (global); variáveis locais estão fora
  do escopo.

### Entidades principais

- **Variável**: nome único no projeto e tipo (inteiro, real, cadeia, lógico).
  Começa com o valor inicial do tipo: `0`, `0.0`, texto vazio, `falso`.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: 100% das variáveis criadas com nomes válidos aparecem declaradas no
  Portugol e o programa é aceito pelo Core.
- **SC-002**: 100% dos nomes inválidos são recusados antes de chegar ao Portugol.
- **SC-003**: Um iniciante cria uma variável e atribui um valor a ela em menos de
  1 minuto.

## Premissas

- Os tipos `lista`, `vetor`, `dicionario` e afins estão fora do escopo mínimo.
- A verificação de tipo do valor atribuído é feita pelo Core na execução (feature
  009); o editor não bloqueia atribuições por tipo nesta entrega.
- A lista de palavras reservadas segue o Guia da Linguagem do Core na versão fixada.
