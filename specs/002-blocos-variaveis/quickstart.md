# Quickstart: validar os blocos de variáveis

Guia de validação da spec 002. Contratos em [contracts/](contracts/), modelo em
[data-model.md](data-model.md).

## Pré-requisitos

- Node.js ≥ 20 e `npm install` feito.
- Rede na primeira execução da aceitação (o Pyodide instala o `meupia-core` do PyPI;
  ver 008/R-04).

## 1. Testes

```bash
npm run test:unidade
```

Esperado: todos passam, incluindo `nome-variavel`, `blocos-variaveis`,
`caixa-blocos` e `variaveis-projeto`.

```bash
npm run test:aceitacao
```

Esperado: os casos `variaveis-atribuicao`, `variaveis-nomes-limite` e
`variaveis-bloco-solto` rodam no Core 1.4.1 real; `nomes-reservados.test.js` passa;
a meta-verificação da 008 encontra `variavel_recebe` e `variavel` em algum caso.

```bash
npm run cobertura
```

Esperado: linhas e branches ≥ 80% no núcleo, com `src/projeto/nome-variavel.js`,
`src/projeto/variaveis.js`, `src/blocos/variaveis.js` e `src/blocos/caixa-blocos.js`
no relatório; README atualizado.

## 2. No navegador (`npm run dev`)

| # | Passo | Esperado | Cobre |
| --- | --- | --- | --- |
| 1 | Abrir a categoria "Variáveis" | Só o botão "Criar variável…" | caixa sem variáveis |
| 2 | "Criar variável…", digitar `idade`, tipo inteiro, Enter | O Portugol ganha `var` / `    idade: inteiro`; a categoria mostra "idade recebe" e "idade" | História 1, cenário 1 |
| 3 | Criar `b` (inteiro) e `nome` (cadeia); depois `a` (inteiro) | Seção `var`: `idade`, `b`, `a` (inteiros, na ordem de criação), depois `nome` | História 1, cenário 2; FR-004 |
| 4 | Tentar criar `2lugar`, `se`, `minha idade`, `Print`, `ação`, `Idade` | Cada um é recusado no próprio diálogo com a mensagem de R-11; o diálogo continua aberto | História 1, cenário 3; casos de borda |
| 5 | Criar `MeuPrograma` | Aceito | caso de borda "nome do programa" |
| 6 | Encaixar "idade recebe" no `programa`, sem valor | `    idade <- ???`; o bloco tem o aviso "Falta o valor do bloco recebe" | História 2, cenário 2 |
| 7 | Encaixar o bloco `b` no valor | `    idade <- b`; o aviso some | FR-005, FR-006 |
| 8 | Usar `idade` em três blocos e renomear para `anos` pelo menu do campo | Declaração e os três usos mostram `anos` | História 4, cenário 1 |
| 9 | Renomear `anos` para `Anos` | Aceito (mesma variável) | R-11, `ignorarId` |
| 10 | Mudar o tipo de `b` para real | `b` sai do grupo inteiro e aparece em `real`; os blocos continuam | caso de borda "mudar o tipo" |
| 11 | Apagar `Anos` (em uso em 3 blocos, um deles "Anos recebe [b]") e Cancelar | Diálogo "A variável Anos é usada em 3 blocos. Ao apagar, 4 blocos serão removidos…" (o `b` encaixado conta); nada muda | História 4, cenário 2; FR-008 |
| 12 | Apagar de novo e confirmar | Somem a variável e exatamente os 4 blocos anunciados; o Portugol atualiza | FR-008 |
| 13 | Ctrl+Z | Variável e blocos voltam | desfazer (R-04) |
| 14 | Criar `z` sem usar; tirar um bloco `z` da caixa e escolher "Apagar a variável “z”" no menu do campo | Diálogo "A variável z é usada em 1 bloco. Esse bloco também será apagado."; ao confirmar, somem `z` e o bloco | FR-008 |
| 15 | Novo → Descartar | Sem variáveis; sem `var` no Portugol; categoria só com o botão | caso de borda "sem variáveis" |
| 16 | Cronometrar do passo 1 até `idade <- b` | Menos de 1 minuto | SC-003 |
| 17 | Conferir textos (diálogo, menu do campo, *tooltips*) | Nada em inglês; console sem erros | RNF-03 |

## 3. Pendências da 007 (seção 3 do quickstart dela)

Com o bloco "recebe" no lugar do comando:

| # | Passo da 007 | Esperado |
| --- | --- | --- |
| A | Encaixar "recebe" no `programa` | A linha aparece em até 1 s |
| C | Desfazer o encaixe | O Portugol volta |
| D | Arrastar um "recebe" encaixado sem soltar | A linha continua até soltar |
| E–F | Soltar fora do `programa` e encaixar de volta | Aviso "Esta pilha está fora do programa" e depois a linha |
| G | Pilha de 3 "recebe" solta | Só o primeiro tem o aviso |
| H | ~60 atribuições, rolar até o meio, trocar a variável de um bloco | A rolagem não se move (FR-005 da 007) |
| I | ~100 blocos, trocar a variável do último | Atualização imediata (SC-002 da 007) |
| J | "recebe" sem valor, solto | Troca "Falta …" por "Esta pilha está fora do programa" |

O passo B (mudar um número) fica para a 006.

**Nota sobre o passo 14 (achado na T040)**: o menu "Apagar a variável" só existe no
campo de um bloco que está na área de trabalho, porque os campos dos blocos dentro da
caixa não abrem menu (o clique cria o bloco). Por isso uma variável sempre tem pelo
menos esse bloco como uso quando o estudante a apaga, e a confirmação sempre aparece. O
ramo sem confirmação de `apagarVariavel` (`usos === 0`) fica como proteção e não é
alcançável pela tela; a spec (FR-008) só exige confirmar quando a variável está em uso.
