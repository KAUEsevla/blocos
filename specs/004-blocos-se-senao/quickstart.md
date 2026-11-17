# Quickstart: validar os blocos de decisão (se/senão)

Spec: [spec.md](spec.md). Contratos: [bloco-se.md](contracts/bloco-se.md),
[editor-se.md](contracts/editor-se.md).

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Para a parte B: Chrome, Firefox ou Edge e conexão com a internet (a execução baixa o
  Pyodide e o `meupia-core` na primeira vez).

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

- Unidade: geração do `se` com o texto exato das Histórias 1 a 3, coluna do `se` na matriz
  do SC-002, categoria "Decisão", mutador headless (encaixes, confirmação, desfazer).
- Aceitação, com o Core 1.4.1 real: `se-maior-idade` (**P-2**, `Maior`), `se-menor-idade`
  (nada), `se-senao` (`Menor`), `se-faixas-nota` (`A`, `B`, `C`), `se-casos-de-borda`
  (`fundo`); a meta-aceitação passa com as variantes "sem senão" e "com senão".
- Cobertura ≥ 80% em linhas e branches; README atualizado.

## B. No navegador

```bash
npm run dev
```

| # | Roteiro | Esperado | Requisito |
| --- | --- | --- | --- |
| 1 | Criar `idade` (inteiro). Montar `leia(idade)` e, da categoria "Decisão", o `se` com `idade ≥ 18` (Comparações) e `escreva("Maior")` dentro. | Portugol: `se idade >= 18 entao` / `    escreva("Maior")` / `fim_se`. | História 1; FR-001; **P-2** |
| 2 | Executar com 20 e depois com 10. | `Maior` com 20; nada com 10. | História 1 (teste independente) |
| 3 | Tentar encaixar um número (`18`), um texto e a variável `idade` na condição. | Não encaixam. Uma comparação, `verdadeiro`, `e`/`ou`, `não` e uma variável lógica encaixam. | FR-003; **P-1**; SC-002 |
| 4 | Com uma variável lógica `ok` na condição, mudar o tipo de `ok` para inteiro. | O bloco `ok` sai da condição; aparece o aviso "Falta a condição do bloco se"; Executar mostra o bloqueio. Ctrl+Z volta. | P-1; SC-002 |
| 5 | Clicar no "+" do `se`. | Aparece a área `senão`; o Portugol mostra `senao` antes do `fim_se`. | História 2, cenário 1; FR-002 |
| 6 | Pôr `escreva("Menor")` no senão e clicar no "−". | Diálogo "Tirar o senão?" com "Tirar o senão apaga 2 blocos que estão dentro dele." Cancelar: nada muda. Confirmar: área e blocos somem; Ctrl+Z volta tudo. | História 2, cenário 2 |
| 7 | Tirar o senão com a área vazia. | Sai sem pergunta. | História 2, cenário 2 |
| 8 | Montar as três faixas de nota com um `se` dentro do senão de outro. | Cada `se` fecha com o seu `fim_se`; o interno 4 espaços mais à direita. Execução com 8, 6 e 3 dá `A`, `B` e `C`. | História 3; FR-004, FR-005 |
| 9 | Aninhar 6 `se`. | A indentação continua correta; o Core aceita. | Casos de borda |
| 10 | `se` com o "então" vazio e o "senão" vazio. | Sem aviso; executa. | Casos de borda |
| 11 | Passar o mouse sobre o `se` e os ícones. | Dica e textos em pt-BR. | Princípio V |
