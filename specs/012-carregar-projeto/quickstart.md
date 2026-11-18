# Validação (quickstart): Carregar projeto em JSON

Como provar que a 012 funciona. Regras e textos exatos ficam nos contratos
([carregar.md](contracts/carregar.md), [tela-carregar.md](contracts/tela-carregar.md)); aqui só
os passos e o resultado esperado.

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Branch `012-carregar-projeto`.

## 1. Testes automáticos

```bash
npm run test:unidade
```

Esperado: `formato.test.js`, `carregar.test.js`, `carregar-blockly.test.js` e
`tela-estrutura.test.js` passando, inclusive a lista de arquivos inválidos (SC-002) e o
projeto de 100 blocos (SC-003).

```bash
npm run test:aceitacao
```

Esperado: `carregar.test.js` passa para todos os casos de `tests/aceitacao/casos/`: o
Portugol depois de carregar é idêntico ao do caso e a saída do `meupia-core` real é a
esperada (SC-001).

```bash
npm run cobertura
```

Esperado: ≥ 80% em linhas e branches; `src/projeto/carregar.js` e `src/projeto/formato.js`
na medição; README atualizado.

## 2. No navegador (`npm run dev`)

| # | Passos | Resultado esperado |
| --- | --- | --- |
| 1 | Montar um programa com variáveis, se com e sem senão, escreva com 3 valores e um bloco solto; nome `Média "final"`. Salvar. Clicar Novo. Carregar o arquivo. | Nome idêntico no campo; variáveis, blocos e posições como antes; o bloco solto continua marcado; Portugol idêntico ao de antes de salvar; Saída com a orientação; indicador "alterações não salvas" oculto. |
| 2 | Logo depois do passo 1, Ctrl+Z. | Nada acontece (desfazer zerado). |
| 3 | Mexer num bloco (indicador aparece). Carregar o mesmo arquivo. | Pede "Carregar outro projeto?". Cancelar: nada muda. Repetir e "Descartar e carregar": projeto do arquivo. |
| 4 | Sem alterações, Carregar. | Não pede confirmação. |
| 5 | Carregar e fechar a janela de arquivos sem escolher. | Nada acontece. |
| 6 | Carregar um `.txt` qualquer renomeado para `.json`. | Aviso "Não foi possível carregar" com "Este arquivo não é um projeto do meuPiá Blocos."; projeto, Saída e indicador iguais. |
| 7 | Editar um arquivo salvo: `"versao": 2`. Carregar. | "Este projeto foi salvo numa versão mais nova do meuPiá Blocos."; nada muda. |
| 8 | Editar um arquivo: trocar o `type` de um bloco por `xyz`. | Mensagem de dados inválidos citando o bloco "xyz"; nada muda. |
| 9 | Editar um arquivo: num `recebe` de variável inteira, encaixar `{"type":"logico","id":"z","fields":{"VALOR":"TRUE"}}`. | "…dados inválidos e não foi carregado: um valor lógico está encaixado onde só cabe número."; nada muda; nenhum texto em inglês. |
| 10 | Durante uma execução que espera um `leia`, Carregar um arquivo válido e confirmar. | A execução para; o projeto novo aparece; Saída limpa. |
| 11 | Arquivo com mais de 1 MB. | Mensagem de "grande demais"; nada muda. |
| 12 | Carregar o projeto do passo 1 e fechar a aba. | O navegador não pergunta nada (sem alterações). |
