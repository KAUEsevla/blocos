# Especificação: Portugol gerado em tempo real

**Branch da feature**: `007-portugol-tempo-real`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-07

**Entrada**: Requisito RF-07: "O Portugol é gerado em tempo real: toda alteração nos blocos atualiza o painel Portugol sem ação do usuário."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Ver o código mudar a cada bloco (Prioridade: P1)

Ao encaixar, mover, editar ou apagar um bloco, o estudante vê o painel Portugol
mudar imediatamente, sem apertar nenhum botão.

**Por que esta prioridade**: é o que faz o estudante associar cada bloco a uma linha
de código, o objetivo pedagógico do editor.

**Teste independente**: encaixar um escreva e verificar que o Portugol muda sem
nenhuma outra ação; apagar o bloco e verificar que a linha some.

**Cenários de aceitação**:

1. **Dado** um projeto novo, **Quando** o estudante encaixa um bloco escreva no
   programa, **Então** a linha `escreva(...)` aparece no Portugol em até 1 segundo.
2. **Dado** um bloco de número com 5, **Quando** o estudante muda para 8, **Então** o
   Portugol passa a mostrar 8.
3. **Dado** o nome do programa "MeuPrograma", **Quando** o estudante muda para
   "Media", **Então** a primeira linha passa a ser `algoritmo "Media"`.
4. **Dado** um programa com blocos, **Quando** o estudante desfaz a última ação,
   **Então** o Portugol volta ao que era antes dela.

---

### História 2 - Blocos soltos não entram no programa (Prioridade: P2)

Blocos que estão na área de trabalho mas não estão encaixados no programa não
aparecem no Portugol e ficam visualmente marcados como "fora do programa".

**Por que esta prioridade**: ensina que só o que está encaixado faz parte do
programa e evita Portugol com comandos perdidos.

**Teste independente**: soltar um escreva fora do programa e verificar que ele não
aparece no Portugol e está marcado.

**Cenários de aceitação**:

1. **Dado** um bloco escreva solto na área de trabalho, **Quando** o Portugol é
   gerado, **Então** ele não aparece no código e o bloco mostra o aviso "Este bloco
   está fora do programa".
2. **Dado** esse bloco solto, **Quando** o estudante o encaixa no programa, **Então**
   o aviso some e a linha aparece no Portugol.

### Casos de borda

- Durante o arraste de um bloco, o Portugol só muda quando o bloco é solto.
- Programa grande (100 blocos): a atualização continua sem atraso perceptível.
- Carregar um projeto (feature 012): o Portugol é gerado assim que os blocos
  aparecem.
- Variáveis criadas e ainda não usadas também são declaradas no Portugol (feature
  002).

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: Toda alteração no projeto (encaixar, mover, editar campo, apagar,
  desfazer, refazer, criar/renomear/apagar variável, mudar o nome do programa) DEVE
  atualizar o painel Portugol sem ação do estudante.
- **FR-002**: A atualização DEVE acontecer em até 1 segundo após a alteração.
- **FR-003**: Apenas os blocos encaixados no programa DEVEM entrar no Portugol.
- **FR-004**: Blocos soltos DEVEM ser marcados visualmente como fora do programa.
- **FR-005**: A posição de rolagem do painel Portugol DEVE ser mantida ao atualizar,
  para o estudante não perder de vista o trecho que está lendo.
- **FR-006**: O editor DEVE permitir desfazer e refazer alterações nos blocos.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Em 100% das alterações testadas, o Portugol exibido corresponde aos
  blocos encaixados.
- **SC-002**: Em programas de até 100 blocos, o código aparece atualizado em menos de
  1 segundo.
- **SC-003**: Nenhum bloco solto aparece no Portugol.

## Premissas

- A regra de como cada bloco vira texto é definida nas features 002 a 006 e a
  estrutura geral do texto na feature 008.
- Destacar a linha correspondente ao bloco selecionado é desejável, mas fica fora
  desta entrega.
