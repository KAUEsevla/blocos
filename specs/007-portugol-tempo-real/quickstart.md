# Quickstart: validar o Portugol em tempo real

Guia de validação da spec 007. Regras e APIs estão em
[contracts/](contracts/) e no [data-model](data-model.md); aqui ficam só os passos.

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito na raiz.
- Branch `007-portugol-tempo-real` com as tasks da 007 implementadas.

## 1. Testes automáticos

```bash
npm run test:unidade
```

Devem passar, além dos testes da 008 e da 001:

| Arquivo | Cobre |
| --- | --- |
| `tests/unidade/tempo-real.test.js` | FR-001, FR-002, caso de borda do arraste ([tempo-real.md](contracts/tempo-real.md)) |
| `tests/unidade/fora-do-programa.test.js` | FR-003, FR-004 ([fora-do-programa.md](contracts/fora-do-programa.md)) |
| `tests/unidade/tempo-real-cenarios.test.js` | SC-001, História 1 (incluindo o arraste), História 2, SC-003 e SC-002 (100 blocos < 200 ms, no bloco da História 2) no núcleo |
| `tests/unidade/tela-estrutura.test.js` | botões Desfazer/Refazer ([editor.md](contracts/editor.md)) |

```bash
npm run test:aceitacao
```

Os casos da 008 continuam passando (a 007 não muda o gerador).

```bash
npm run cobertura
```

Cobertura ≥ 80% em linhas e branches, com `src/portugol/tempo-real.js` e
`src/portugol/fora-do-programa.js` no relatório; README atualizado.

## 2. Navegador (o que já é observável)

```bash
npm run dev
```

Abrir a página a 1280 px de largura.

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| 1 | Abrir a página | Portugol com `algoritmo "MeuPrograma"`; Desfazer e Refazer desabilitados | FR-006 |
| 2 | Trocar o nome para `Media`, uma letra por vez | A primeira linha acompanha cada tecla: `algoritmo "Media"` no fim | História 1, cenário 3; FR-002 |
| 3 | Arrastar o bloco `programa` e segurar no meio do caminho | O Portugol não muda nem pisca durante o arraste, e o console não mostra erro | só confere que o arraste não quebra nada (ver nota abaixo) |
| 4 | Soltar o bloco | Desfazer fica habilitado; o Portugol continua igual | FR-006 |
| 5 | Clicar em Desfazer | O bloco volta à posição; Refazer habilita, Desfazer desabilita | FR-006 |
| 6 | Clicar em Refazer; depois Ctrl+Z com o foco no workspace | Refazer move de novo; Ctrl+Z desfaz como o botão | FR-006 |
| 7 | Botão direito no workspace | Menu com "Desfazer" e "Refazer" em pt-BR | FR-006, RNF-03 |
| 8 | Mover o bloco e clicar em Novo → "Descartar e começar" | Projeto novo; Desfazer e Refazer desabilitados; Ctrl+Z não volta ao projeto anterior | FR-006 com a 001 FR-007 |
| 9 | No console do navegador, sem erros durante os passos 1–8 | Nenhum erro | — |

**O que esta seção não prova** (achados C3 e C4 do `/speckit-analyze`):

- **Suspensão do arraste**: o `programa` é um bloco de topo e nunca desencaixa nada ao
  ser arrastado, então o passo 3 passaria mesmo sem a suspensão. A regra é provada no
  núcleo (`tempo-real.test.js` e caso 5 de `tempo-real-cenarios.test.js`) e no
  navegador pelo passo D da seção 3, na 002.
- **Rolagem mantida (FR-005)**: com 5 linhas de Portugol o painel não rola. Validada
  pelo passo H da seção 3, na 002.

## 3. Depois da 002 (pendência)

Com os primeiros blocos de comando e de valor, repetir na 002 e de novo na 003 (com o
`escreva`):

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| A | Encaixar um bloco de comando no `programa` | A linha aparece em até 1 s, sem clicar em nada | História 1, cenário 1 |
| B | Mudar um número de 5 para 8 no campo | O Portugol mostra 8 enquanto se digita | História 1, cenário 2 (o bloco de número existe desde a spec 003; conferido no passo L do [quickstart da 003](../003-blocos-leia-escreva/quickstart.md)) |
| C | Desfazer o último encaixe | O Portugol volta ao que era antes | História 1, cenário 4 |
| D | Pegar um bloco encaixado e arrastar sem soltar | A linha continua no Portugol até soltar | caso de borda "arraste" |
| E | Soltar um bloco fora do `programa` | Não aparece no Portugol; ícone de aviso com "Esta pilha está fora do programa" | História 2, cenário 1 |
| F | Encaixar esse bloco no `programa` | O aviso some; a linha aparece | História 2, cenário 2 |
| G | Soltar uma pilha de 3 blocos fora do programa | Só o primeiro tem o aviso; nenhum dos 3 está no Portugol | História 2, cenário 3; FR-004 |
| H | Com Portugol maior que o painel, rolar até o meio e mudar um campo | A rolagem não se move | FR-005 (validado aqui, não na 007) |
| I | Montar ~100 blocos e mudar um campo no fim | A atualização parece imediata | SC-002 |
| J | Bloco incompleto solto do programa | Perde o aviso "Falta …", ganha "Esta pilha está fora do programa"; Executar (009) não é bloqueado por ele | FR-004, 008 |
