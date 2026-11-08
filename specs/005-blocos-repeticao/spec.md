# Especificação: Blocos de repetição (enquanto/para)

**Branch da feature**: `005-blocos-repeticao`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-05

**Entrada**: Requisito RF-05: "Blocos de repetição: enquanto ... faca ... fim_enquanto e para v de a ate b [passo p] faca ... fim_para."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Repetir uma quantidade conhecida de vezes (Prioridade: P1)

O estudante usa o bloco **para** escolhendo a variável de controle, o valor inicial
(de), o valor final (até) e, se quiser, o passo.

**Por que esta prioridade**: contar de 1 a N é o exercício de repetição mais comum.

**Teste independente**: montar `para i de 1 ate 5 faca escreva(i)` e ver 1 a 5 na
Saída.

**Cenários de aceitação**:

1. **Dado** a variável inteira `i`, **Quando** o estudante monta um para de 1 até 5
   sem passo, **Então** o Portugol mostra `para i de 1 ate 5 faca ... fim_para`.
2. **Dado** o mesmo bloco com passo -1 e limites 5 até 1, **Quando** executado,
   **Então** a Saída mostra 5, 4, 3, 2, 1.
3. **Dado** limites 5 até 1 sem passo, **Quando** executado, **Então** o laço não
   roda nenhuma vez (regra do Core).

---

### História 2 - Repetir enquanto uma condição vale (Prioridade: P1)

O estudante usa o bloco **enquanto** com uma condição lógica; os comandos dentro se
repetem enquanto ela for verdadeira.

**Teste independente**: montar uma contagem regressiva com enquanto e conferir a
saída.

**Cenários de aceitação**:

1. **Dado** um enquanto com a condição `n > 0`, **Quando** o Portugol é gerado,
   **Então** aparece `enquanto n > 0 faca ... fim_enquanto`.

### Casos de borda

- para sem variável de controle, ou com de/até vazios: sinalizado como incompleto.
- Variável de controle que não é do tipo inteiro: não pode ser escolhida no para.
- Passo igual a 0 (valor fixo): sinalizado como incompleto, com a explicação de que
  o laço nunca terminaria.
- enquanto com condição sempre verdadeira: permitido; o estudante pode parar a
  execução (feature 009).
- Laços sem comandos dentro: permitidos.
- Laços aninhados (para dentro de para, enquanto dentro de para...): permitidos.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O editor DEVE oferecer o bloco enquanto com uma condição lógica e uma
  área de comandos, que gera `enquanto <condição> faca ... fim_enquanto`.
- **FR-002**: O editor DEVE oferecer o bloco para com variável de controle, de, até
  e passo opcional, que gera `para v de a ate b [passo p] faca ... fim_para`.
- **FR-003**: A variável de controle do para DEVE ser uma variável do tipo inteiro já
  criada.
- **FR-004**: De, até e passo DEVEM aceitar números ou expressões numéricas.
- **FR-005**: Sem passo informado, o Portugol NÃO DEVE conter `passo` (o Core usa 1).
- **FR-006**: Os dois limites entram na contagem (de e até inclusivos), e a dica do
  bloco DEVE dizer isso ao estudante.
- **FR-007**: Passo fixo igual a zero DEVE ser sinalizado como incompleto.
- **FR-008**: Laços DEVEM poder ser aninhados em qualquer área de comandos.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% dos programas de teste com para (passo positivo, negativo,
  ausente e intervalo vazio) e enquanto, a saída é igual à esperada.
- **SC-002**: Nenhum para com passo fixo zero chega a ser executado.

## Premissas

- `continue` e `interrompa` estão fora do escopo mínimo.
- O bloco "repita ... ate" não existe no Portugol do Core e não será oferecido.
