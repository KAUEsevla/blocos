# Especificação: Tela de três painéis

**Branch da feature**: `001-tela-tres-paineis`

**Criada em**: 2026-11-08

**Status**: Rascunho

**Rastreia**: RF-01 · RNF-03 (pt-BR)

**Entrada**: Requisito RF-01: "A tela tem três painéis visíveis ao mesmo tempo: Blocos, Portugol e Saída."

## Cenários de usuário e testes *(obrigatório)*

### História 1 - Ver blocos, código e resultado lado a lado (Prioridade: P1)

O estudante abre o editor e encontra, na mesma tela, a área onde monta o programa
com blocos, o Portugol correspondente e a saída da execução. Ele nunca precisa
trocar de aba ou de página para ver o efeito do que montou.

**Por que esta prioridade**: é a proposta central do produto: ver o Portugol
"nascer ao lado" dos blocos. Todas as outras features aparecem dentro destes painéis.

**Teste independente**: abrir o editor e verificar que os três painéis estão
visíveis, identificados em português e na ordem Blocos → Portugol → Saída.

**Cenários de aceitação**:

1. **Dado** que o estudante abre o editor pela primeira vez, **Quando** a tela
   termina de carregar, **Então** ele vê os painéis "Blocos", "Portugol" e "Saída"
   ao mesmo tempo, cada um com o seu título.
2. **Dado** um projeto novo, **Quando** a tela carrega, **Então** o painel Blocos
   mostra o bloco inicial do programa, o painel Portugol mostra o algoritmo vazio
   correspondente e o painel Saída mostra uma orientação de como executar.

---

### História 2 - Ações do projeto sempre à mão (Prioridade: P2)

O estudante encontra, numa barra fixa, o nome do programa e as ações principais:
**Executar**, **Salvar**, **Carregar** e **Novo**.

**Por que esta prioridade**: sem as ações, os painéis não têm utilidade; mas as
ações em si são especificadas nas features 009, 011 e 012.

**Teste independente**: verificar que a barra mostra o campo "Nome do programa" e
os quatro botões, todos com rótulos em português.

**Cenários de aceitação**:

1. **Dado** o editor aberto, **Quando** o estudante olha a barra superior, **Então**
   vê o campo "Nome do programa" preenchido com "MeuPrograma" e os botões Executar,
   Salvar, Carregar e Novo.
2. **Dado** um projeto com blocos, **Quando** o estudante clica em Novo e confirma,
   **Então** os blocos voltam ao estado de projeto novo e a Saída é limpa.

---

### História 3 - O Portugol é consequência dos blocos (Prioridade: P3)

O painel Portugol é somente leitura: o estudante pode ler e copiar o código, mas não
digitar nele. O código muda apenas quando os blocos mudam.

**Por que esta prioridade**: evita que blocos e código fiquem diferentes entre si. A
edição do texto (caminho de volta, RF-B01) é bônus e está fora desta entrega.

**Teste independente**: tentar digitar no painel Portugol e verificar que nada muda;
selecionar e copiar o código e verificar que a cópia funciona.

**Cenários de aceitação**:

1. **Dado** um programa montado, **Quando** o estudante tenta digitar no painel
   Portugol, **Então** o texto não é alterado.
2. **Dado** um programa montado, **Quando** o estudante usa "Copiar código",
   **Então** o Portugol completo é copiado para a área de transferência.

### Casos de borda

- Janela estreita (menor que a largura mínima suportada): os três painéis continuam
  acessíveis, um abaixo do outro, sem nenhum ficar escondido.
- Saída muito longa: o painel Saída rola sem empurrar os outros painéis para fora
  da tela.
- Programa grande: o painel Portugol rola de forma independente do painel Blocos.
- Clicar em Novo com alterações não salvas: o editor pede confirmação antes de
  descartar.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O editor DEVE exibir simultaneamente três painéis, intitulados
  "Blocos", "Portugol" e "Saída".
- **FR-002**: O editor DEVE exibir uma barra com o campo "Nome do programa" e as
  ações Executar, Salvar, Carregar e Novo.
- **FR-003**: Todo texto da interface (títulos, botões, dicas, mensagens) DEVE estar
  em português do Brasil.
- **FR-004**: O painel Portugol DEVE ser somente leitura e DEVE oferecer a ação
  "Copiar código".
- **FR-005**: Cada painel DEVE rolar de forma independente quando o conteúdo
  ultrapassar o espaço disponível.
- **FR-006**: Em telas mais estreitas que a largura mínima suportada, os painéis
  DEVEM ser empilhados verticalmente, mantendo os três acessíveis.
- **FR-007**: A ação Novo DEVE pedir confirmação quando houver alterações não
  salvas e, confirmada, DEVE restaurar o projeto novo e limpar a Saída.

### Entidades principais

- **Projeto**: o programa que está aberto no editor: nome do programa, blocos e
  variáveis. É o que é salvo e carregado (features 011 e 012).

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: Em 100% das aberturas em notebook ou desktop (largura ≥ 1024 px), os
  três painéis estão visíveis sem rolar a página.
- **SC-002**: Um estudante que nunca usou o editor identifica, sem ajuda, onde estão
  os blocos, o código e a saída em menos de 30 segundos.
- **SC-003**: Nenhum texto em outro idioma aparece na interface.

## Premissas

- O público usa notebook ou desktop; celular está fora do escopo desta entrega.
- O bloco inicial do programa (o "começo" onde os comandos são encaixados) faz parte
  de todo projeto novo e não pode ser apagado.
- As ações Executar, Salvar e Carregar são detalhadas nas features 009, 011 e 012;
  esta feature define apenas onde elas ficam.
