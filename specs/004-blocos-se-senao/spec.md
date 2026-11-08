# Especificação: Blocos de decisão (se/senão)

**Branch da feature**: `004-blocos-se-senao`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-04

**Entrada**: Requisito RF-04: "Blocos de decisão: se ... entao ... fim_se e se ... entao ... senao ... fim_se, aninháveis."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Executar algo só quando uma condição vale (Prioridade: P1)

O estudante usa o bloco **se** com uma condição e encaixa comandos dentro dele.
Os comandos só rodam se a condição for verdadeira.

**Por que esta prioridade**: decisão é o primeiro conceito de lógica depois de
sequência.

**Teste independente**: montar `se idade >= 18 entao escreva("Maior")`, executar com
20 e com 10 e comparar as saídas.

**Cenários de aceitação**:

1. **Dado** um bloco se com a condição `idade >= 18` e um escreva dentro, **Quando**
   o Portugol é gerado, **Então** aparece:
   ```
   se idade >= 18 entao
       escreva("Maior")
   fim_se
   ```

---

### História 2 - Escolher entre dois caminhos (Prioridade: P1)

O estudante ativa a parte **senão** do bloco para indicar o que fazer quando a
condição for falsa.

**Teste independente**: montar um se/senão e verificar que só um dos ramos executa.

**Cenários de aceitação**:

1. **Dado** um bloco se com senão, **Quando** o Portugol é gerado, **Então** aparece
   `senao` entre os dois ramos e um único `fim_se` no final.
2. **Dado** um se com senão, **Quando** o estudante remove o senão, **Então** os
   comandos que estavam no senão são removidos junto, após confirmação se houver
   algum.

---

### História 3 - Decisões dentro de decisões (Prioridade: P2)

O estudante encaixa um se dentro de outro (inclusive dentro do senão) para testar
várias faixas, como notas ou faixas etárias.

**Teste independente**: montar três faixas de nota com se aninhados e verificar o
Portugol indentado e a saída para cada faixa.

**Cenários de aceitação**:

1. **Dado** um se dentro do senão de outro se, **Quando** o Portugol é gerado,
   **Então** cada se fecha com o seu próprio `fim_se` e o se interno fica um nível
   mais indentado.

### Casos de borda

- Condição vazia: bloco sinalizado como incompleto.
- Condição que não é lógica (ex.: um número ou um texto): o encaixe é recusado; só
  valores lógicos encaixam na condição.
- Se ou senão sem comandos dentro: permitido (o Core aceita blocos vazios).
- Aninhamento profundo (mais de 5 níveis): permitido, indentação continua correta.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O editor DEVE oferecer o bloco se com uma condição e uma área de
  comandos, que gera `se <condição> entao ... fim_se`.
- **FR-002**: O bloco se DEVE permitir ativar e desativar a parte senão, que gera
  `senao` antes do `fim_se`.
- **FR-003**: A condição DEVE aceitar apenas valores lógicos: comparações,
  operações lógicas, literais verdadeiro/falso e variáveis do tipo lógico.
- **FR-004**: Blocos se DEVEM poder ser encaixados dentro de qualquer área de
  comandos, inclusive de outro se, senão, enquanto e para.
- **FR-005**: Cada nível de aninhamento DEVE aumentar a indentação do Portugol em um
  nível.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% dos programas de teste com se/senão (incluindo aninhados), o
  Core aceita o Portugol e a saída é a esperada para cada valor de entrada.
- **SC-002**: Nenhuma condição não lógica chega ao Portugol.

## Premissas

- Não há bloco "senão se" separado nesta entrega; faixas são feitas com se aninhado,
  como no Guia da Linguagem.
- O bloco "escolha/caso" está fora do escopo.
