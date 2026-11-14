# Specs do meuPiá Blocos — Ciclo 1 (escopo mínimo)

Uma spec por requisito funcional de
[docs/briefing/02-requisitos-extraidos.md](../docs/briefing/02-requisitos-extraidos.md).
As specs descrevem só **regras de negócio** (o quê e o porquê); o como fica nos
`plan.md` de cada pasta.

## Matriz de rastreabilidade

| Spec | Requisito | Também atende | Depende de |
| --- | --- | --- | --- |
| [001-tela-tres-paineis](001-tela-tres-paineis/spec.md) | RF-01 | RNF-03 | — |
| [002-blocos-variaveis](002-blocos-variaveis/spec.md) | RF-02 | — | 001, 008 |
| [003-blocos-leia-escreva](003-blocos-leia-escreva/spec.md) | RF-03 | — | 002, 008 |
| [004-blocos-se-senao](004-blocos-se-senao/spec.md) | RF-04 | — | 006, 008 |
| [005-blocos-repeticao](005-blocos-repeticao/spec.md) | RF-05 | — | 002, 006, 008 |
| [006-blocos-operadores](006-blocos-operadores/spec.md) | RF-06 | — | 008 |
| [007-portugol-tempo-real](007-portugol-tempo-real/spec.md) | RF-07 | — | 001, 008 |
| [008-portugol-valido](008-portugol-valido/spec.md) | RF-08 | RNF-07 | — |
| [009-executar-no-core](009-executar-no-core/spec.md) | RF-09 | RNF-01, RNF-02, RNF-06, RF-08 (bloqueio na tela) | 001, 008 |
| [010-entrada-de-dados](010-entrada-de-dados/spec.md) | RF-10 | — | 003, 009 |
| [011-salvar-projeto](011-salvar-projeto/spec.md) | RF-11 | — | 001 |
| [012-carregar-projeto](012-carregar-projeto/spec.md) | RF-12 | — | 011, 008 |

RNF-04 (cobertura ≥ 80%) e RNF-05 (rastreabilidade) valem para todas as specs e são
garantidos pela constitution (princípios III e IV), não por uma spec própria.

## Ordem sugerida de implementação

1. **008 → 001 → 007**: estrutura do Portugol, tela e atualização em tempo real
   (um programa vazio já aparece e é válido).
2. **002 → 003 → 006**: variáveis, leia/escreva e operadores.
3. **009 → 010**: executar no Core e entrada de dados (primeiro "Olá, mundo!" de
   ponta a ponta).
4. **004 → 005**: decisão e repetição.
5. **011 → 012**: salvar e carregar.

**Divisão do RF-08 entre 008 e 009**: a 008 entrega a verificação de execução como
função pura e a marcação dos blocos incompletos. A parte de tela dos cenários 2 e 3 da
História 2 da 008 (Executar não começa, Saída lista os avisos, clicar no aviso destaca o
bloco) depende do painel Saída (001) e do botão Executar (009). Ela está registrada em
"Pendências para a spec 009", no
[tasks.md da 008](008-portugol-valido/tasks.md), e entra no tasks da 009.

## Decisões de regra de negócio tomadas nas specs

| Decisão | Spec |
| --- | --- |
| Painel Portugol é somente leitura (edição do texto é o bônus RF-B01). | 001 |
| Nomes de variável: letra inicial, sem acento, até 30 caracteres, sem palavra reservada, únicos sem diferenciar maiúsculas. | 002 |
| Todas as variáveis são globais. | 002 |
| Faixas de decisão via se aninhado; não há "senão se" nem "escolha". | 004 |
| Variável de controle do `para` precisa ser inteira; passo fixo 0 é bloqueado. | 005 |
| Parênteses sempre que a precedência mudaria o sentido dos blocos. | 006 |
| Blocos soltos não entram no Portugol. | 007 |
| Blocos incompletos bloqueiam a execução, com avisos em pt-BR. | 008 |
| Botão Parar interrompe a execução. | 009 |
| Entrada do `leia` digitada dentro do painel Saída (não em janela do navegador). | 010 |
| Carregar valida o arquivo inteiro antes de mexer no projeto aberto. | 012 |
