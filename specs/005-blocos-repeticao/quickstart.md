# Quickstart: validar os blocos de repetição (enquanto/para)

Spec: [spec.md](spec.md). Contratos: [blocos-repeticao.md](contracts/blocos-repeticao.md),
[editor-repeticao.md](contracts/editor-repeticao.md).

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

- Unidade: geração do `enquanto` e do `para` com o texto exato, avisos de passo zero, casas
  decimais e variável não inteira, colunas `enquanto` e `para` na matriz do SC-002, categoria
  "Repetição", `ctx.tipoVariavel`, as duas traduções novas, testes headless dos encaixes.
- Aceitação, com o Core 1.4.1 real: os nove casos do [research.md](research.md#r-10-casos-de-aceitação-sc-001-p-3-p-4)
  (`para-contagem` `1`…`5`, `para-regressivo` `5`…`1`, `para-intervalo-vazio` só `fim`,
  `enquanto-regressiva` `3 2 1`, **P-3** `repeticao-leia-soma` `15`, **P-4**
  `repeticao-se-par-impar`…); a meta-aceitação passa com as variantes "sem passo" e "com
  passo"; no worker real, **P-2** (Parar no `enquanto verdadeiro` e 1.500 linhas do `para`) e
  **P-3** (`leia` em laço, interativo) a partir de blocos.
- Cobertura ≥ 80% em linhas e branches; README atualizado.

## B. No navegador

```bash
npm run dev
```

| # | Roteiro | Esperado | Requisito |
| --- | --- | --- | --- |
| 1 | Sem variáveis, abrir a categoria "Repetição". | `enquanto`, a orientação "Para usar o para, crie uma variável do tipo inteiro." e o botão "Criar variável…". | R-09 |
| 2 | Criar `i` (inteiro) e arrastar o `para` da categoria. Pôr `escreva(i)` dentro. | Portugol: `para i de 1 ate 5 faca` / `    escreva(i)` / `fim_para`, sem `passo`. Executar: `1` a `5`. | História 1, cen. 1; FR-002, FR-005 |
| 3 | Trocar para de `5` até `1` e encaixar `−1` (Contas → negativo) no passo. | `para i de 5 ate 1 passo -1 faca`; Executar: `5`, `4`, `3`, `2`, `1`. | História 1, cen. 2 |
| 4 | Tirar o passo. | O laço não roda: a Saída fica vazia. | História 1, cen. 3 |
| 5 | Passar o mouse sobre o `para` e o `enquanto`. | Dicas em pt-BR; a do `para` diz que os dois limites entram. | FR-006; princípio V |
| 6 | Pôr `0` no passo. | Aviso "O passo do bloco para não pode ser zero: o laço nunca terminaria"; Executar mostra o bloqueio. | FR-007; SC-002 |
| 7 | Pôr `3,5` no até. | Aviso das casas decimais; Executar bloqueado. | R-05 |
| 8 | Criar `x` (real) e `ok` (lógico). Abrir o menu da variável do `para`. | Só aparece `i`. | FR-003 |
| 9 | Mudar o tipo de `i` para real. | Aviso "A variável de controle do bloco para precisa ser do tipo inteiro"; voltar para inteiro (ou Ctrl+Z) tira o aviso. | FR-003; R-06 |
| 10 | Tentar encaixar `verdadeiro` ou um texto em de, até e passo; e um número ou a variável `i` na condição do `enquanto`. | Não encaixam. Números, contas e `i` cabem no `para`; uma comparação, `ok`, `e`/`ou` e `não` cabem no `enquanto`. | FR-004; **P-1** |
| 11 | Criar `n` (inteiro). `n recebe 3`; `enquanto n > 0` com `escreva(n)` e `n recebe n − 1`. | `enquanto n > 0 faca` … `fim_enquanto`; Executar: `3`, `2`, `1`. | História 2 |
| 12 | `enquanto verdadeiro` com `i recebe i + 1` e `escreva(i)`. Executar e clicar em Parar. | Os números aparecem rolando; Parar interrompe; Executar de novo funciona. | **P-2**; casos de borda |
| 13 | `para i de 1 até 1500` com `escreva(i)`. | 1.500 linhas na Saída, inteiras e na ordem, sem travar. | **P-2** |
| 14 | Criar `nome` (cadeia). `para i de 1 até 3` com `leia(nome)` e `escreva("Oi, ", nome)`. Executar e digitar `Ana`, `Bia`, `Caio`. | Um pedido por volta; `Oi, Ana`, `Oi, Bia`, `Oi, Caio`, sem repetir linhas. | **P-3** |
| 15 | Arrastar um `se` (com senão) para dentro do `para` e depois para dentro do `enquanto`; montar o par/ímpar com `i % 2 = 0`. | Encaixa nos dois; cada bloco fecha com o seu `fim_…`, 4 espaços a mais por nível; a Saída alterna `impar` e o número. | **P-4**; FR-008 |
| 16 | `para` dentro de `para` e `enquanto` dentro de `para`; laços sem comandos dentro. | Indentação correta; sem aviso; executa. | FR-008; casos de borda |
| 17 | `k recebe 0`; `para i de 1 até 3 passo k`. Executar. | Erro de execução "O passo do para ficou zero: o laço nunca terminaria.", com o detalhe técnico recolhido. | R-08 |
