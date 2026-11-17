# Contrato: entrada interativa em `src/execucao/`

Amplia o [contrato da 009](../../009-executar-no-core/contracts/executar.md). Decisões:
[research.md](../research.md), R-02 a R-09.

## Textos do pedido (`entrada.js`, novo)

```js
TEXTOS_ENTRADA = { confirmar: 'Confirmar', valorGenerico: 'Digite um valor', … }
criarPedidoEntrada(variavel, variaveis) → { rotulo, dica, confirmar }
```

- `variaveis`: `{ nome, tipo }[]` do programa a executar.
- `variavel` encontrada: `rotulo` = `Digite o valor de <nome> (<tipo>)`, com o tipo
  escrito `cadeia`, `inteiro`, `real` ou `lógico`.
- `variavel` `null` ou fora da lista: `rotulo` = `Digite um valor`, `dica` = `null`.

| Tipo | `dica` |
| --- | --- |
| `inteiro` | `Número sem casas decimais, por exemplo 15.` |
| `real` | `Use ponto para separar as casas decimais, por exemplo 1.72.` |
| `logico` | `Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro.` |
| `cadeia` | `null` |

Puro, sem DOM. Todos os textos em pt-BR (RNF-03).

## Protocolo do worker (ampliado)

Página → worker:

| Mensagem | Efeito |
| --- | --- |
| `{ tipo: 'executar', id, codigo, entrada, interativo }` | Como na 009. Com `interativo: true`, chama `compilarEExecutar(…, { aoEscrever, interativo: true })`. |
| `{ tipo: 'entrada', id, valor }` | Só se houver execução pendente com esse `id`: acrescenta `valor` e chama `continuarExecucao`. Senão, ignorada. |

Worker → página (além das da 009):

| Mensagem | Quando |
| --- | --- |
| `{ tipo: 'pedido_entrada', id, variavel }` | O adapter devolveu `aguardando_entrada`. Antes dela vai o lote de saída pendente. Nenhum `resultado` é postado até a execução terminar. |

## Serviço do worker (`servico.js`)

- Guarda no máximo uma execução pendente `{ id, entrada, enviado }` (data-model).
- `aoEscrever` de cada rodada passa por um filtro: os primeiros `enviado.length`
  caracteres produzidos são comparados com `enviado` e descartados. O resto entra no lote
  de 50 ms e é acrescentado a `enviado`.
- Divergência no prefixo: a rodada vira `resultado` com `status: 'erro_execucao'`, a
  mensagem genérica e `detalhe` "A reexecução do programa produziu uma saída diferente
  da anterior." A execução pendente é descartada.
- `aguardando_entrada`: envia o lote, posta `pedido_entrada` e guarda a pendente.
- Resultado final (`ok`, `erro_*`): envia o lote, posta `resultado` (com `saida: ''`,
  como na 009) e descarta a pendente.
- Um novo `executar` descarta qualquer pendente anterior.

## Executor (`executor.js`)

```js
executar(codigo, { entrada = [], aoEscrever, aoProgresso, aoPronto, aoPedirEntrada })
  → Promise<ResultadoTela>
```

- Com `aoPedirEntrada`, a mensagem `executar` leva `interativo: true`. Sem ele,
  `interativo: false` (comportamento da 009).
- `pedido_entrada` do `id` atual: chama `aoPedirEntrada({ variavel })`, que devolve
  `Promise<string>`. Quando resolve, se a execução ainda for a atual, posta
  `{ tipo: 'entrada', id, valor }`. Resposta depois do Parar ou de outra execução não é
  enviada.
- `pedido_entrada` de outro `id`: ignorado.
- `parar()` não muda: funciona igual com um pedido aberto.

## Controlador (`controlador.js`)

- `obterPrograma()` passa a devolver `{ codigo, avisos, variaveis }`. `variaveis` ausente
  vale `[]`.
- Passa `aoPedirEntrada` ao executor:
  1. `escreverLinhas(divisor.finalizar())`, para nenhuma linha ficar retida;
  2. `pedido = criarPedidoEntrada(variavel, variaveis)`;
  3. `valor = await saida.pedirEntrada(pedido)`;
  4. `saida.escrever(valor, 'entrada')`;
  5. devolve `valor`.
- No fim de toda execução (qualquer resultado, inclusive `interrompido`), chama
  `saida.cancelarEntrada()` antes do relato.
- O estado continua `executando` com o campo aberto. `executar()` durante a espera é
  ignorado, como na 009.

## Garantias testadas

Unidade:

- `criarPedidoEntrada`: os quatro tipos, `null`, nome fora da lista, `variaveis` vazia.
- Serviço (motor falso que devolve `aguardando_entrada` e depois `ok`): `pedido_entrada`
  depois do lote; `continuarExecucao` recebe `["Ana"]`, depois `["Ana", "Bia"]`; o
  prefixo repetido não é reenviado; prefixo divergente vira `erro_execucao`; `entrada`
  de outro `id` ou sem pendente é ignorada; `executar` novo descarta a pendente.
- Executor (`Worker` falso): `interativo` só com `aoPedirEntrada`; resposta vira
  `entrada` com o `id`; resposta depois de `parar()` não é postada.
- Controlador (Saída e executor falsos): rótulo e dica do pedido; valor escrito como
  `entrada` antes das linhas seguintes do programa; três pedidos em ordem;
  `cancelarEntrada` no fim; Parar com o campo aberto → "Execução interrompida pelo
  usuário" e estado `ocioso`.

Aceitação (worker real em `worker_threads`, Core 1.4.1):

- `leia(nome)` + `escreva("Oi, ", nome)`, "Ana" → Saída `Oi, Ana` (teste independente
  da História 1).
- Três `leia` seguidos → três `aoPedirEntrada`, um de cada vez, com `nome`, `idade`,
  `altura`, na ordem.
- `leia` num `enquanto` → um pedido por volta, linhas sem repetição.
- Parar com o pedido aberto → `interrompido`; a execução seguinte funciona.
- SC-001: todo caso com `entrada` não vazia roda em modo interativo, fornecendo os
  valores um a um, e a Saída é igual à `saidaEsperada`.
