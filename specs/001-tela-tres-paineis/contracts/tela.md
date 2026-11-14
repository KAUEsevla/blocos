# Contrato: estrutura da tela (`index.html`)

Os ids e rótulos abaixo são o contrato entre o HTML, os módulos de `src/ui/`, as specs
seguintes e o teste `tests/unidade/tela-estrutura.test.js`. Mudar um id ou rótulo é
mudar este contrato.

## Documento

- `<html lang="pt-BR">`, `<title>meuPiá Blocos</title>`.
- Estilos em `src/estilos.css`, importado por `src/main.js` (sem `<style>` inline).

## Barra (`<header id="barra">`)

Ordem da esquerda para a direita:

| Elemento | id | Rótulo / conteúdo | Estado na 001 |
| --- | --- | --- | --- |
| `<label for="nome-programa">` | — | `Nome do programa` | — |
| `<input type="text">` | `nome-programa` | `value="MeuPrograma"`, `maxlength="40"`, `spellcheck="false"`, `autocomplete="off"` | habilitado; cada `input` atualiza `projeto.nome` e regenera o Portugol |
| `<button>` | `botao-executar` | `Executar` | `disabled`, `title="Disponível em breve"` (009) |
| `<button>` | `botao-salvar` | `Salvar` | `disabled`, `title="Disponível em breve"` (011) |
| `<button>` | `botao-carregar` | `Carregar` | `disabled`, `title="Disponível em breve"` (012) |
| `<button>` | `botao-novo` | `Novo` | habilitado (fluxo no [data-model](../data-model.md)) |

`maxlength="40"` é o mesmo limite de `sanearNomePrograma` (008, R-11).

## Painéis (`<main id="paineis">`)

Três `<section class="painel">`, **nesta ordem** no HTML, cada uma com
`aria-labelledby` apontando para o seu `<h2>`:

| Painel | `section` id | `<h2>` id / texto | Corpo |
| --- | --- | --- | --- |
| Blocos | `painel-blocos` | `titulo-blocos` / `Blocos` | `<div class="painel-corpo">` com `<div id="area-blocos">` (Blockly) |
| Portugol | `painel-portugol` | `titulo-portugol` / `Portugol` | cabeçalho com `<button id="botao-copiar">Copiar código</button>` e `<span id="mensagem-copia" aria-live="polite">`; corpo `<pre id="codigo-portugol" tabindex="0" aria-label="Portugol gerado, somente leitura">` |
| Saída | `painel-saida` | `titulo-saida` / `Saída` | `<div id="saida" class="painel-corpo">` (contrato [painel-saida.md](painel-saida.md)) |

Observação: na 008 o `<pre>` tinha id `painel-portugol`. Nesta spec o id passa para a
`section`, e o `<pre>` vira `codigo-portugol`; `src/main.js` é ajustado junto.

**Somente leitura (FR-004)**: o código fica num `<pre>` sem `contenteditable`; o texto
pode ser selecionado e o `<pre>` recebe foco pelo teclado (`tabindex="0"`) para
seleção e cópia com Ctrl+C.

## Diálogo de confirmação (`<dialog id="dialogo-confirmacao">`)

| Elemento | id | Texto padrão (sobrescrito por `confirmar(...)`) |
| --- | --- | --- |
| `<h2>` | `dialogo-titulo` | — |
| `<p>` | `dialogo-mensagem` | — |
| `<button>` | `dialogo-cancelar` | `Cancelar` (recebe o foco ao abrir) |
| `<button>` | `dialogo-confirmar` | `Confirmar` |

`confirmar({ titulo, mensagem, confirmar, cancelar }) → Promise<boolean>` em
`src/ui/confirmacao.js`: preenche os textos, abre com `showModal()`, resolve `true` só no
botão de confirmar; Cancelar, `Esc` (evento `cancel`) e fechar de outro modo resolvem
`false`. Para o Novo: título "Começar um projeto novo?", mensagem "As alterações que não
foram salvas serão perdidas.", botões "Descartar e começar" e "Cancelar" (R-04).

## Layout (R-02)

| Largura da janela | Disposição | Rolagem |
| --- | --- | --- |
| ≥ 1024 px | barra no topo; três colunas Blocos ≈ 50%, Portugol ≈ 30%, Saída ≈ 20%; tudo dentro de `100vh` | só dentro de cada painel; a página não rola |
| < 1024 px | barra no topo, **fixa** (`position: sticky; top: 0`, com fundo opaco e acima dos painéis); painéis em coluna na mesma ordem; Blocos com `min-height: 70vh`, Portugol e Saída com `45vh` | a página rola por baixo da barra, que continua visível ("barra fixa", História 2); cada painel continua rolando por dentro |

## Textos da tela

Todos em pt-BR. Os que o JavaScript escreve ficam em `src/ui/textos.js`
(`TEXTOS.orientacaoSaida`, `TEXTOS.copiaOk`, `TEXTOS.copiaFalhou`,
`TEXTOS.novoTitulo`, `TEXTOS.novoMensagem`, `TEXTOS.novoConfirmar`,
`TEXTOS.cancelar`, `TEXTOS.emBreve`). Os do HTML ficam no próprio `index.html`.
