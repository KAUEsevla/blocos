# Quickstart (Fase 1): validar o Salvar

## Pré-requisitos

- Node.js ≥ 20; `npm install` feito.
- Chrome, Firefox ou Edge, com download direto (sem perguntar onde salvar) para os passos
  1–6.

## Testes automatizados

```bash
npm run test:unidade
```

```bash
npm run test:aceitacao
```

```bash
npm run cobertura
```

Esperado: `formato.test.js`, `salvar.test.js`, `salvar-blockly.test.js`,
`tela-estrutura.test.js` e `tests/aceitacao/salvar.test.js` passando; cobertura ≥ 80% em
linhas e branches; README com a linha de testes e cobertura atualizada. Casos em
[contracts/salvar.md](contracts/salvar.md) e
[contracts/tela-salvar.md](contracts/tela-salvar.md).

## No navegador

```bash
npm run dev
```

| # | Ação | Esperado | Rastreia |
| --- | --- | --- | --- |
| 1 | Abrir a página | Salvar habilitado; nenhuma indicação "alterações não salvas" | FR-001, FR-006 |
| 2 | Digitar `Media` no nome | Aparece "alterações não salvas" ao lado do nome | História 2, cenário 2 |
| 3 | Criar `nota` (real), `b` (inteiro), `n` (cadeia), `a` (inteiro); montar `leia nota`, um `escreva` com 3 valores, um `se` com senão e outro sem, um `para` e um `enquanto`; deixar um bloco solto e um `se` sem condição; mover o `programa` | Indicação visível | FR-002 |
| 4 | Clicar em Salvar | Baixa `Media.json`; a indicação some; workspace, Portugol, desfazer e Saída iguais | História 1, cenário 1; FR-001, FR-005 |
| 5 | Abrir `Media.json` num editor de texto | Indentado; começa com `"formato": "meupia-blocos"`, `"versao": 1`, `"nome": "Media"`; `variaveis` na ordem do Portugol dentro de cada tipo, com tipos; `extraState` `{"valores": 3}` no escreva, `{"senao": true}` só no se com senão; `x`/`y` dos topos; o bloco solto e o incompleto presentes; sem `"variables"` | História 1, cenários 2 e 3; FR-002; SC-003 |
| 6 | Clicar em Novo | **Não** pede confirmação (projeto salvo) | 001 FR-007; R-07 |
| 7 | Montar algo, sem salvar, e recarregar a página (F5) | O navegador pede confirmação (texto do navegador) | História 2, cenário 1; FR-006 |
| 8 | Salvar e recarregar | Não pede confirmação | FR-006 |
| 9 | Mover um bloco depois de salvar; depois Ctrl+Z | Indicação aparece; com o desfazer, some | R-07 |
| 10 | Nome `a/b:c*d` e Salvar | Arquivo `a_b_c_d.json` | FR-003 |
| 11 | Nome vazio e Salvar | Arquivo `MeuPrograma.json` | Casos de borda |
| 12 | Novo e Salvar sem montar nada | Baixa `MeuPrograma.json` só com o `programa` | Casos de borda |
| 13 | DevTools → Rede, clicar em Salvar | Nenhuma requisição | FR-004 |
| 14 | Executar um programa com `leia` e clicar em Salvar com o pedido de entrada aberto | Baixa o arquivo; a execução e a Saída continuam | contracts/tela-salvar.md |
