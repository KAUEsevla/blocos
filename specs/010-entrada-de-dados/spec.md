# Especificação: Entrada de dados durante a execução

**Branch da feature**: `010-entrada-de-dados`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-10

**Entrada**: Requisito RF-10: "Quando o programa usa leia, o usuário consegue informar a entrada durante a execução."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Digitar um valor quando o programa pede (Prioridade: P1)

Quando a execução chega num leia, o programa pausa e o estudante digita o valor no
próprio painel Saída. Ao confirmar, a execução continua.

**Por que esta prioridade**: sem isso, nenhum programa com leia funciona.

**Teste independente**: executar `leia(nome)` + `escreva("Oi, ", nome)`, digitar
"Ana", confirmar e ver `Oi, Ana`.

**Cenários de aceitação**:

1. **Dado** um programa com `leia(nome)`, **Quando** a execução chega no leia,
   **Então** a Saída mostra um campo de entrada com a indicação "Digite o valor de
   nome (cadeia)" e a execução fica aguardando.
2. **Dado** o campo de entrada, **Quando** o estudante digita "Ana" e confirma (tecla
   Enter ou botão), **Então** o valor aparece na Saída como entrada digitada,
   diferenciada visualmente das linhas escritas pelo programa, e a execução continua.
3. **Dado** três leia seguidos, **Quando** executado, **Então** o campo aparece três
   vezes, uma de cada vez, na ordem do programa.

---

### História 2 - Desistir de informar o valor (Prioridade: P2)

**Cenários de aceitação**:

1. **Dado** o campo de entrada aberto, **Quando** o estudante clica em Parar,
   **Então** a execução termina com "Execução interrompida pelo usuário".

### Casos de borda

- Valor vazio confirmado: é entregue ao programa como texto vazio; o Core converte
  conforme o tipo (e informa erro se não for possível).
- Texto que não é número num leia de inteiro ou real: o Core gera erro de execução,
  mostrado em português (feature 009).
- Número com vírgula (`1,72`) num leia de real: entregue como digitado; a dica do
  campo lembra que o separador decimal é o ponto.
- leia de lógico: a dica do campo informa que só "verdadeiro" vira verdadeiro.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: Ao chegar num leia, a execução DEVE pausar até o estudante confirmar um
  valor ou parar a execução.
- **FR-002**: A entrada DEVE ser feita dentro do painel Saída, informando o nome e o
  tipo da variável que receberá o valor.
- **FR-003**: O valor confirmado DEVE ser registrado na Saída, diferenciado das
  linhas escritas pelo programa.
- **FR-004**: O valor DEVE ser entregue ao programa exatamente como digitado; a
  conversão para o tipo segue as regras do Core.
- **FR-005**: O campo de entrada DEVE mostrar uma dica conforme o tipo (inteiro:
  número sem casas decimais; real: use ponto; lógico: digite verdadeiro ou falso).

### Entidades principais

- **Pedido de entrada**: variável (nome e tipo) que vai receber o valor.
- **Entrada digitada**: texto confirmado pelo estudante, registrado na Saída.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% dos projetos de exemplo com leia, informar as entradas
  previstas produz a saída esperada.
- **SC-002**: O estudante nunca precisa sair do painel Saída (janela ou caixa de
  diálogo do navegador) para digitar um valor.

## Premissas

- Pré-carregar uma lista de entradas antes de executar (útil para testes) está fora
  desta entrega; os testes de aceitação fornecem as entradas automaticamente.
