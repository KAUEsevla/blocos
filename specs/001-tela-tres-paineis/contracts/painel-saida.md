# Contrato: painel Saída (`src/ui/painel-saida.js`)

Interface (fora da cobertura). A 001 usa só `limpar` e `mostrarOrientacao`; o resto é
a superfície que as specs 009 (execução, bloqueio por avisos) e 010 (entrada do `leia`)
vão usar. Elas PODEM estender o objeto, mas não mudar o que está aqui.

## `criarPainelSaida(elemento) → saida`

`elemento` é o corpo do painel Saída (`#saida`). A função **substitui** todo o conteúdo
de `elemento` (`elemento.replaceChildren(areaLinhas, areaAvisos)`), então chamá-la de
novo sobre o mesmo elemento não duplica as regiões. A página cria **um** painel em
`src/main.js`; chamar de novo só acontece em teste manual (quickstart, passo 8). As
duas regiões, nesta ordem:

1. `areaLinhas`: `<div class="saida-linhas" role="log" aria-live="polite">`, uma linha
   por elemento, com `white-space: pre-wrap`.
2. `areaAvisos`: `<div class="saida-avisos">`, vazia por padrão. É o `container` de
   `renderizarAvisos` (008/T042) na 009.

| Membro | Comportamento |
| --- | --- |
| `limpar()` | Esvazia `areaLinhas` e `areaAvisos`. |
| `mostrarOrientacao()` | `limpar()` e escreve, como `'sistema'`, o texto `TEXTOS.orientacaoSaida` de `src/ui/textos.js`: "Monte o programa com os blocos e clique em Executar para ver o resultado aqui." |
| `escrever(texto, tipo = 'programa')` | Acrescenta uma linha. `tipo` ∈ `'programa'` (saída do `escreva`), `'sistema'` (avisos do editor, ex.: "Executando..."), `'erro'`. Vira a classe `saida-linha--{tipo}`. Texto inserido com `textContent` (nunca HTML). Rola o corpo até o fim. |
| `areaAvisos` | Elemento acima (somente leitura). |

## Regras

- O painel rola sozinho (FR-005); escrever muitas linhas não aumenta a altura da página
  a partir de 1024 px.
- Todos os textos do editor escritos aqui são pt-BR e vêm de `src/ui/textos.js`.
