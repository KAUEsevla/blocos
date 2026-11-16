# Quickstart: validar a entrada de dados durante a execução

Spec: [spec.md](spec.md). Contratos: [entrada.md](contracts/entrada.md),
[adapter-core.md](contracts/adapter-core.md), [tela-entrada.md](contracts/tela-entrada.md).

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Para a parte B: Chrome, Firefox ou Edge e conexão com a internet (primeira execução
  baixa o Pyodide e o `meupia-core`).

## A. Testes automáticos

```bash
npm run test:unidade
```

```bash
npm run test:aceitacao
```

```bash
npm run cobertura
```

Esperado:

- Unidade: textos do pedido, serviço, executor e controlador no modo interativo, e o
  complemento da vírgula ([entrada.md](contracts/entrada.md), "Garantias testadas").
- Aceitação, com o Core 1.4.1 real: adapter interativo nos quatro tipos e no `enquanto`;
  `executar.test.js` com a História 1, os três `leia` em ordem, Parar com o pedido aberto
  e **SC-001** (todo caso com `entrada` passa fornecendo os valores um a um);
  `leia-real-virgula.json` termina em `erro_execucao`.
- Cobertura ≥ 80% em linhas e branches; README atualizado.

## B. No navegador

```bash
npm run dev
```

Monte com blocos (ou carregue um projeto) e execute cada roteiro.

| # | Roteiro | Esperado | Requisito |
| --- | --- | --- | --- |
| 1 | `leia(nome)` (cadeia) + `escreva("Oi, ", nome)`. Executar. | Campo na Saída com "Digite o valor de nome (cadeia)", foco no campo, sem dica. Executar desabilitado, Parar habilitado. | História 1, cenário 1; FR-001, FR-002 |
| 2 | Digitar `Ana` e apertar Enter. | O campo some; `Ana` aparece como entrada, com destaque diferente das linhas do programa; depois `Oi, Ana` e "Fim do programa". | Cenário 2; FR-003 |
| 3 | Repetir o 1 e confirmar pelo botão Confirmar. | Mesmo resultado do 2. | Cenário 2 |
| 4 | Três `leia` seguidos (`nome`, `idade`, `altura`). | Três campos, um de cada vez, na ordem; dicas do inteiro e do real visíveis. Nenhuma linha do programa repetida. | Cenário 3; FR-005 |
| 5 | `leia(altura)` (real), digitar `1,72`. | Valor mostrado como digitado; "Erro de execução" com "O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72." | Casos de borda; FR-004; P-2 |
| 6 | `leia(ok)` (lógico). | Dica "Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro." | FR-005 |
| 7 | `leia(idade)` (inteiro), confirmar vazio. | Linha de entrada vazia visível; "O valor digitado não é um número." | Caso de borda "valor vazio" |
| 8 | Com o campo aberto, clicar em Parar. | O campo some; "Execução interrompida pelo usuário". Executar volta a funcionar. | História 2 |
| 9 | Com o campo aberto, clicar em Novo e confirmar. | A execução para; a Saída mostra a orientação inicial. | R-09 |
| 10 | Durante os roteiros, observar se o navegador abriu alguma janela ou caixa de diálogo. | Nenhuma. | SC-002 |
| 11 | Depois do Enter no roteiro 4, medir a espera até o próximo campo. | Menos de 0,5 s. | Metas do plan |

**Limite conhecido** (research R-02): uma conta muito pesada antes de vários `leia` é
repetida a cada valor confirmado, e a resposta depois do Enter fica mais lenta.
