# Especificação: Portugol válido para o Core

**Branch da feature**: `008-portugol-valido`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-08 · RNF-07 (teste de aceitação)

**Entrada**: Requisito RF-08: "O Portugol gerado é válido para o Core: estrutura algoritmo "Nome" / var / inicio / fim_algoritmo, indentação legível."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Código completo e bem formado (Prioridade: P1)

Todo programa montado com blocos completos vira um algoritmo Portugol completo, que o
meuPiá Core aceita sem erro de compilação e que o estudante consegue ler como se
tivesse sido escrito à mão.

**Por que esta prioridade**: é o critério dos testes de aceitação do trabalho e o
que permite levar o código para o meuPiá Lab depois.

**Teste independente**: para cada projeto de exemplo (JSON), gerar o Portugol,
compilar no Core e comparar a saída com a esperada.

**Cenários de aceitação**:

1. **Dado** um projeto novo chamado "MeuPrograma", **Quando** o Portugol é gerado,
   **Então** o texto é:
   ```
   algoritmo "MeuPrograma"

   inicio
   fim_algoritmo
   ```
   e o Core o aceita.
2. **Dado** um projeto com variáveis e comandos, **Quando** o Portugol é gerado,
   **Então** a ordem é: `algoritmo "Nome"`, linha em branco, `var` com as
   declarações, linha em branco, `inicio`, comandos, `fim_algoritmo`.
3. **Dado** comandos dentro de se, enquanto ou para, **Quando** o Portugol é gerado,
   **Então** cada nível de encaixe aumenta a indentação em 4 espaços.
4. **Dado** o mesmo projeto, **Quando** o Portugol é gerado duas vezes, **Então** os
   dois textos são idênticos.

---

### História 2 - Blocos incompletos não geram código quebrado (Prioridade: P1)

Quando há um bloco com encaixe vazio (condição, valor, variável), o editor marca o
bloco, lista o aviso em português e não deixa executar até ele ser completado.

**Por que esta prioridade**: o iniciante vive montando programas pela metade; o
editor precisa orientar em vez de mostrar erro de compilação incompreensível.

**Teste independente**: deixar a condição de um se vazia e verificar o aviso, a
marcação do bloco e o botão Executar bloqueado com a explicação.

**Cenários de aceitação**:

1. **Dado** um se com a condição vazia, **Quando** o Portugol é gerado, **Então** o
   bloco fica marcado, aparece o aviso "Falta a condição do bloco se" e o Portugol
   mostra um marcador visível no lugar da parte que falta.
2. **Dado** um projeto com avisos de bloco incompleto, **Quando** o estudante clica
   em Executar, **Então** a execução não começa e a Saída lista os avisos.
3. **Dado** o aviso, **Quando** o estudante clica nele, **Então** o bloco
   correspondente é destacado na área de blocos.

### Casos de borda

- Nome do programa vazio: o Portugol usa "MeuPrograma".
- Nome do programa com aspas ou barra invertida: esses caracteres são removidos do
  nome.
- Projeto sem variáveis: não há seção `var`.
- Programa sem comandos: `inicio` seguido de `fim_algoritmo`, aceito pelo Core.
- Vários avisos ao mesmo tempo: todos são listados, na ordem em que aparecem no
  programa.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: Todo projeto sem blocos incompletos DEVE gerar Portugol aceito pelo
  meuPiá Core na versão fixada para a turma.
- **FR-002**: O Portugol DEVE seguir a estrutura: `algoritmo "Nome"`, seção `var`
  (só se houver variáveis), `inicio`, comandos, `fim_algoritmo`.
- **FR-003**: Cada nível de encaixe DEVE ser indentado com 4 espaços; nunca com
  tabulação.
- **FR-004**: A geração DEVE ser determinística: o mesmo projeto produz sempre o
  mesmo texto, caractere por caractere.
- **FR-005**: Um bloco com encaixe obrigatório vazio DEVE ser marcado, gerar um aviso
  em português que diz o que falta e em qual bloco, e mostrar no Portugol um
  marcador visível no lugar da parte ausente.
- **FR-006**: Enquanto houver avisos de bloco incompleto, a execução DEVE ser
  bloqueada, com os avisos listados na Saída.
- **FR-007**: O nome do programa DEVE ter de 1 a 40 caracteres, sem aspas nem barra
  invertida; vazio vira "MeuPrograma".

### Entidades principais

- **Aviso de bloco incompleto**: bloco afetado e mensagem em português ("Falta o
  valor do bloco escreva").
- **Projeto de exemplo (aceitação)**: projeto salvo + entrada digitada + saída
  esperada, usados para verificar este requisito.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: 100% dos projetos de exemplo da suíte de aceitação são aceitos pelo
  Core e produzem a saída esperada.
- **SC-002**: A suíte de aceitação cobre todos os blocos do escopo mínimo (variáveis,
  leia, escreva, se, senão, enquanto, para e todos os operadores) pelo menos uma vez.
- **SC-003**: 0 erros de compilação causados por blocos incompletos chegam ao Core.

## Premissas

- O Core da versão fixada é a referência final de validade; em caso de dúvida sobre
  sintaxe, vale o Guia da Linguagem dessa versão.
- O Portugol gerado deve poder ser colado no meuPiá Lab e rodar igual.
