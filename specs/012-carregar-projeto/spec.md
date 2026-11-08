# Especificação: Carregar projeto em JSON

**Branch da feature**: `012-carregar-projeto`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-12

**Entrada**: Requisito RF-12: "Carregar um projeto .json salvo, restaurando os blocos e o Portugol correspondente. Arquivo inválido gera mensagem clara, sem perder o projeto aberto."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Continuar um projeto salvo (Prioridade: P1)

O estudante clica em **Carregar**, escolhe um arquivo `.json` salvo antes e o
projeto volta exatamente como estava: nome, variáveis, blocos e Portugol.

**Por que esta prioridade**: completa o ciclo salvar → carregar exigido no briefing.

**Teste independente**: salvar um projeto, clicar em Novo, carregar o arquivo e
comparar o Portugol com o de antes.

**Cenários de aceitação**:

1. **Dado** um arquivo salvo pelo editor, **Quando** o estudante o carrega, **Então**
   o nome do programa, as variáveis e os blocos (nas mesmas posições) são
   restaurados e o Portugol é idêntico ao do momento do salvamento.
2. **Dado** alterações não salvas no projeto aberto, **Quando** o estudante escolhe
   Carregar, **Então** o editor pede confirmação antes de substituir o projeto.
3. **Dado** um projeto carregado, **Quando** o estudante olha a Saída, **Então** ela
   está limpa.

---

### História 2 - Arquivo inválido não estraga o trabalho (Prioridade: P1)

Se o arquivo escolhido não é um projeto válido, o estudante recebe uma mensagem clara
e o projeto aberto continua intacto.

**Teste independente**: com um projeto aberto, carregar um arquivo de texto qualquer
e verificar a mensagem e que nada mudou.

**Cenários de aceitação**:

1. **Dado** um arquivo que não é JSON, **Quando** carregado, **Então** aparece "Este
   arquivo não é um projeto do meuPiá Blocos" e o projeto aberto não muda.
2. **Dado** um JSON de outro programa (sem a identificação `meupia-blocos`),
   **Quando** carregado, **Então** aparece a mesma mensagem e nada muda.
3. **Dado** um projeto salvo numa versão de formato mais nova que a do editor,
   **Quando** carregado, **Então** aparece "Este projeto foi salvo numa versão mais
   nova do meuPiá Blocos" e nada muda.
4. **Dado** um projeto com um bloco desconhecido ou dados corrompidos, **Quando**
   carregado, **Então** o carregamento é recusado por inteiro, com mensagem que
   indica o problema, e nada muda.

### Casos de borda

- Arquivo vazio: tratado como inválido.
- Arquivo muito grande (mais de 1 MB): recusado com mensagem.
- Projeto com blocos incompletos ou soltos: carregado normalmente, com os avisos da
  feature 008.
- Projeto com variável de tipo desconhecido: recusado.
- Cancelar a janela de escolha de arquivo: nada acontece.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O botão Carregar DEVE permitir escolher um arquivo `.json` do
  computador do estudante.
- **FR-002**: O editor DEVE validar o arquivo inteiro antes de alterar o projeto
  aberto: identificação `meupia-blocos`, versão de formato suportada, nome, variáveis
  com tipos válidos e blocos conhecidos.
- **FR-003**: Arquivo válido DEVE substituir o projeto aberto, restaurando nome,
  variáveis e blocos com as posições, e o Portugol DEVE ser regenerado.
- **FR-004**: Arquivo inválido NÃO PODE alterar o projeto aberto e DEVE gerar
  mensagem em português dizendo por que foi recusado.
- **FR-005**: Com alterações não salvas, carregar DEVE pedir confirmação antes de
  substituir o projeto.
- **FR-006**: Carregar DEVE limpar a Saída.

### Entidades principais

- **Arquivo de projeto**: o mesmo definido na feature 011.
- **Motivo de recusa**: não é JSON, não é projeto do meuPiá Blocos, versão mais nova,
  dados inválidos, arquivo grande demais.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: 100% dos projetos salvos pelo editor são carregados com Portugol
  idêntico ao original.
- **SC-002**: 100% dos arquivos inválidos de teste são recusados sem alterar o
  projeto aberto.
- **SC-003**: Carregar um projeto de até 100 blocos leva menos de 2 segundos.

## Premissas

- Projetos carregados também podem vir dos exemplos da suíte de aceitação ou de
  colegas; todos seguem o formato da feature 011.
- Converter Portugol escrito em blocos (RF-B01) está fora desta entrega.
