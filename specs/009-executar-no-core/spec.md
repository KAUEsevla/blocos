# Especificação: Executar o programa pelo meuPiá Core

**Branch da feature**: `009-executar-no-core`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-09 · RNF-01 · RNF-02 · RNF-06

**Entrada**: Requisito RF-09: "Botão Executar roda o Portugol pelo meuPiá Core e mostra no painel Saída a saída do programa, ou o erro de compilação/execução em pt-BR."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Rodar e ver o resultado (Prioridade: P1)

O estudante clica em **Executar**; o Portugol mostrado é compilado e executado pelo
meuPiá Core e o que o programa escreve aparece no painel Saída.

**Por que esta prioridade**: ver o programa funcionar fecha o ciclo de aprendizado e
é o que os testes de aceitação verificam.

**Teste independente**: montar um "Olá, mundo!", clicar em Executar e ver o texto
na Saída seguido de "Fim do programa".

**Cenários de aceitação**:

1. **Dado** um programa válido, **Quando** o estudante clica em Executar, **Então** a
   Saída é limpa, mostra "Executando...", as linhas escritas pelo programa na ordem
   e, no final, "Fim do programa".
2. **Dado** que é a primeira execução da sessão, **Quando** o estudante clica em
   Executar, **Então** a Saída informa que o ambiente do meuPiá está sendo preparado
   e o programa roda assim que ele estiver pronto.
3. **Dado** um programa em execução, **Quando** o estudante olha o botão Executar,
   **Então** ele está desabilitado e o botão **Parar** está disponível.

---

### História 2 - Entender um erro (Prioridade: P1)

Quando o Core recusa o programa ou o programa falha durante a execução, a Saída
explica o problema em português simples.

**Teste independente**: executar um programa que divide por zero e verificar a
mensagem de erro de execução em pt-BR, sem texto técnico em inglês.

**Cenários de aceitação**:

1. **Dado** um programa que o Core recusa, **Quando** executado, **Então** a Saída
   mostra "Erro de compilação" com a mensagem do Core em português e a linha do
   Portugol envolvida.
2. **Dado** um programa que divide por zero, **Quando** executado, **Então** a Saída
   mostra "Erro de execução" com uma explicação amigável (ex.: "Não é possível
   dividir por zero") e as linhas escritas antes do erro continuam visíveis.
3. **Dado** um erro, **Quando** exibido, **Então** nenhum rastro técnico (stack
   trace) aparece por padrão; ele pode ser aberto em "Detalhes técnicos".

---

### História 3 - Parar um programa que não termina (Prioridade: P2)

O estudante interrompe um programa que entrou em laço infinito.

**Cenários de aceitação**:

1. **Dado** um enquanto com condição sempre verdadeira em execução, **Quando** o
   estudante clica em Parar, **Então** a execução termina, a Saída mostra "Execução
   interrompida pelo usuário" e o editor volta a aceitar Executar.

### Casos de borda

- Projeto com blocos incompletos: a execução não começa (feature 008).
- Sem internet na primeira execução: a Saída explica que o ambiente do meuPiá não
  pôde ser carregado e sugere tentar de novo.
- Alterar blocos durante a execução: a execução em andamento usa o programa como
  estava ao clicar em Executar.
- Programa que escreve muitas linhas (mais de 1.000): a Saída continua mostrando
  tudo, com rolagem.
- Programa sem nenhum escreva: a Saída mostra apenas "Fim do programa".

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O botão Executar DEVE compilar e executar, pelo meuPiá Core, exatamente
  o Portugol exibido no painel Portugol.
- **FR-002**: A versão do Core usada DEVE ser a versão congelada para a turma.
- **FR-003**: O Core NÃO PODE ser modificado; o editor só o usa pelas interfaces
  públicas.
- **FR-004**: Cada execução DEVE limpar a Saída anterior e mostrar, em ordem:
  aviso de início, linhas escritas pelo programa e aviso de fim ("Fim do programa",
  "Erro de compilação", "Erro de execução" ou "Execução interrompida pelo usuário").
- **FR-005**: Erros de compilação e de execução DEVEM ser distinguidos e explicados
  em português, sem rastro técnico por padrão.
- **FR-006**: Durante a execução, Executar DEVE ficar desabilitado e Parar
  habilitado.
- **FR-007**: O estudante DEVE poder interromper a execução a qualquer momento.
- **FR-008**: A execução DEVE acontecer inteiramente no computador do estudante, sem
  enviar o programa a nenhum servidor.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Para 100% dos projetos de exemplo da suíte de aceitação, a Saída é
  idêntica à saída esperada.
- **SC-002**: Depois do ambiente preparado, um programa simples mostra o resultado em
  até 2 segundos após clicar em Executar.
- **SC-003**: Na primeira execução, com conexão comum, o ambiente fica pronto em até
  30 segundos, com indicação de progresso durante a espera.
- **SC-004**: 100% das mensagens de erro exibidas por padrão estão em português.

## Premissas

- A primeira execução precisa de internet para obter o ambiente do meuPiá; as
  seguintes, na mesma sessão, não.
- A versão congelada é `meupia-core` 1.4.1 até o professor confirmar (pergunta Q-01).
- A entrada de dados do leia é definida na feature 010.
