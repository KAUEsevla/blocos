# Especificação: Salvar projeto em JSON

**Branch da feature**: `011-salvar-projeto`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-11

**Entrada**: Requisito RF-11: "Salvar o projeto (blocos) num arquivo .json no computador do usuário."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Guardar o trabalho num arquivo (Prioridade: P1)

O estudante clica em **Salvar** e recebe um arquivo `.json` no computador com o
projeto inteiro, para continuar outro dia ou entregar ao professor.

**Por que esta prioridade**: sem salvar, todo o trabalho se perde ao fechar a página.

**Teste independente**: montar um programa, salvar, abrir o arquivo e verificar que
contém o nome do programa, as variáveis e os blocos.

**Cenários de aceitação**:

1. **Dado** um projeto chamado "Media", **Quando** o estudante clica em Salvar,
   **Então** o navegador baixa o arquivo `Media.json`.
2. **Dado** o arquivo salvo, **Quando** é aberto num editor de texto, **Então** ele
   identifica que é um projeto do meuPiá Blocos, a versão do formato, o nome do
   programa, as variáveis com seus tipos e todos os blocos com suas posições.
3. **Dado** um projeto com blocos incompletos ou soltos, **Quando** salvo, **Então**
   o arquivo é gerado normalmente e preserva esses blocos.

---

### História 2 - Saber se há alterações não salvas (Prioridade: P3)

**Cenários de aceitação**:

1. **Dado** alterações feitas depois do último salvamento, **Quando** o estudante
   tenta fechar ou recarregar a página, **Então** o navegador pede confirmação.
2. **Dado** alterações não salvas, **Quando** o estudante olha a barra, **Então** vê
   a indicação "alterações não salvas" ao lado do nome do programa.

### Casos de borda

- Nome do programa com caracteres não permitidos em nomes de arquivo (`/ \ : * ? " < > |`):
  são trocados por `_` no nome do arquivo.
- Nome do programa vazio: o arquivo se chama `MeuPrograma.json`.
- Projeto novo, sem blocos: pode ser salvo.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O botão Salvar DEVE gerar um arquivo `.json` com o projeto inteiro e
  entregá-lo como download ao estudante.
- **FR-002**: O arquivo DEVE conter: identificação do formato (`meupia-blocos`),
  versão do formato, nome do programa, variáveis (nome e tipo) e todos os blocos,
  inclusive soltos e incompletos, com suas posições.
- **FR-003**: O nome do arquivo DEVE ser o nome do programa, com caracteres inválidos
  substituídos por `_`, e a extensão `.json`.
- **FR-004**: O projeto NÃO PODE ser enviado a nenhum servidor ao salvar.
- **FR-005**: Salvar NÃO PODE alterar o projeto aberto.
- **FR-006**: O editor DEVE indicar quando há alterações não salvas e pedir
  confirmação ao fechar ou recarregar a página nessa situação.

### Entidades principais

- **Arquivo de projeto**: formato `meupia-blocos`, versão do formato (começa em 1),
  nome do programa, variáveis, blocos.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: 100% dos projetos salvos e depois carregados (feature 012) geram
  exatamente o mesmo Portugol de antes.
- **SC-002**: Salvar leva menos de 1 segundo em projetos de até 100 blocos.
- **SC-003**: O arquivo é legível num editor de texto comum.

## Premissas

- Salvamento automático no navegador e salvamento na nuvem estão fora desta entrega.
- O mesmo formato de arquivo é usado pelos projetos de exemplo da suíte de aceitação.
