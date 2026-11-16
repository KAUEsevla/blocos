# Contrato: campo de entrada na tela

Amplia o [contrato da Saída da 001](../../001-tela-tres-paineis/contracts/painel-saida.md)
e o [contrato da tela da 009](../../009-executar-no-core/contracts/tela-execucao.md).
Interface, fora da cobertura, verificada no [quickstart](../quickstart.md). Decisões:
[research.md](../research.md), R-08 e R-09.

## Painel Saída (`src/ui/painel-saida.js`)

```js
pedirEntrada({ rotulo, dica, confirmar }) → Promise<string>
cancelarEntrada() → void
escrever(texto, 'entrada')   // tipo novo
```

`pedirEntrada`:

- Acrescenta no fim da área de linhas um `<form class="saida-entrada">` com:
  - `<label>` com `rotulo`, ligado ao `<input type="text" autocomplete="off">`;
  - a `dica`, quando não for `null`, num elemento ligado por `aria-describedby`;
  - `<button type="submit">` com `confirmar`.
- Põe o foco no campo e rola a Saída até o fim.
- Enter ou o botão (submit): remove o form e resolve com o valor do campo, **sem `trim`**.
  Vazio é aceito.
- Só um campo por vez. Um novo `pedirEntrada` com outro aberto remove o anterior.

`cancelarEntrada`: remove o form, se houver. A promessa dele nunca resolve.

`escrever(texto, 'entrada')`: linha com a classe `saida-linha--entrada`. `limpar()`
também remove o campo.

Nenhum `window.prompt`, `alert` ou caixa de diálogo (SC-002).

## Estilos (`src/estilos.css`)

- `.saida-linha--entrada`: cor própria (variável de cor do tema) e marcador `› ` em
  `::before`, para o marcador não entrar no texto copiado.
- `.saida-entrada`: rótulo, campo e botão numa linha, quebrando em telas estreitas; dica
  menor, na cor suave; a fonte monoespaçada da Saída.

## Ligação (`src/main.js`)

- `atualizarPortugol` guarda também as variáveis do projeto gerado
  (`projetoGerado.variaveis`, do registro da 002).
- `obterPrograma` devolve `{ codigo, avisos, variaveis }`, com as variáveis mapeadas para
  `{ nome, tipo }`.
- Nada muda em Executar, Parar e Novo: o Novo já chama `controlador.parar()`, que fecha
  o campo.

## Barra

Sem mudança. Com o campo aberto, o estado é `executando` (Executar desabilitado, Parar
habilitado).
