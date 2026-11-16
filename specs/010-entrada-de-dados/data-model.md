# Modelo de dados (Fase 1): Entrada de dados durante a execução

Spec: [spec.md](spec.md). Pesquisa: [research.md](research.md).

Nada aqui é salvo no projeto: o formato v1 não muda. Tudo existe só durante uma
execução.

## Programa a executar (ampliado)

O que o controlador lê no clique em Executar (009), agora com as variáveis.

| Campo | Tipo | Origem | Regra |
| --- | --- | --- | --- |
| `codigo` | string | painel Portugol | Igual à 009. |
| `avisos` | Aviso[] | gerador | Igual à 009. |
| `variaveis` | `{ nome, tipo }[]` | registro de variáveis da 002 (`projeto.variaveis`) | **Novo.** Fica fixo no clique, junto com o código. `tipo` ∈ `inteiro`, `real`, `cadeia`, `logico`. |

## Pedido de entrada (entidade da spec)

Do worker para a página, quando o programa chega num `leia` sem valor.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `variavel` | string \| null | Nome da variável, lido da linha do Python que chamou `input()` (R-03). `null` quando a linha não casa. |

Na página, o controlador transforma o pedido no **pedido mostrado**:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `rotulo` | string | `Digite o valor de <nome> (<tipo>)`, ou `Digite um valor` se a variável for `null` ou não estiver em `variaveis` (R-06). |
| `dica` | string \| null | Por tipo (FR-005): inteiro, real, lógico. `null` para cadeia e para variável desconhecida. |
| `confirmar` | string | Texto do botão: `Confirmar`. |

## Entrada digitada (entidade da spec)

| Campo | Tipo | Regra |
| --- | --- | --- |
| `valor` | string | Exatamente o texto do campo no momento da confirmação, sem `trim` (FR-004). Pode ser vazio. |

Destino: (1) a Saída, como linha do tipo `entrada` (FR-003); (2) o worker, na mensagem
`entrada`, acrescentado ao fim da lista de entradas da execução.

## Execução pendente (dentro do worker)

Guardada pelo serviço entre um pedido e a resposta.

| Campo | Tipo | Regra |
| --- | --- | --- |
| `id` | number | Id da execução (009). Uma `entrada` de outro id é ignorada. |
| `entrada` | string[] | Valores já confirmados, na ordem. Cresce um por pedido. |
| `enviado` | string | Todo o texto do programa já postado à página. A rodada seguinte confere e descarta esse prefixo (R-05). |

Existe da primeira resposta `aguardando_entrada` até um resultado final (`ok`,
`erro_execucao`) ou o fim do worker (Parar).

## Resultado do adapter (ampliado)

`ResultadoExecucao` da 008/009 ganha um status interno, que nunca chega à página:

| `status` | Campos extras | Quando |
| --- | --- | --- |
| `aguardando_entrada` | `pedido: { variavel }` | Só com `interativo: true`, quando a lista de entrada acabou num `input()`. `erro` é `null`; `saida` é tudo o que a rodada escreveu. |

Os demais status (`ok`, `erro_compilacao`, `erro_execucao`) não mudam.

## Linha da Saída (ampliada)

| Tipo | Uso | Visual |
| --- | --- | --- |
| `programa`, `sistema`, `erro` | 001/009 | Sem mudança. |
| `entrada` | **Novo.** Valor confirmado pelo estudante. | Cor própria e marcador `› ` por CSS (fora do texto). Valor vazio ocupa uma linha visível. |

## Estados

O estado da execução da 009 não ganha valor novo:

```text
ocioso → (preparando →) executando ⇄ [campo aberto] → ocioso
```

Com o campo aberto, o estado é `executando`: Executar desabilitado, Parar habilitado. O
campo existe entre `pedirEntrada` e a confirmação, ou até `cancelarEntrada` (fim da
execução ou Parar).

Ciclo de uma execução interativa no worker:

```text
executar ─► rodada(entrada=[]) ─┬─ ok / erro ───────────────► resultado
                                └─ aguardando_entrada ─► pedido_entrada
entrada(valor) ─► rodada(entrada+[valor]) ─┬─ ok / erro ───► resultado
                                           └─ aguardando ──► pedido_entrada …
terminate (Parar) em qualquer ponto ─► página resolve "interrompido"
```

## Mensagens do worker (ampliadas)

| Direção | Mensagem | Novo? |
| --- | --- | --- |
| Página → worker | `{ tipo: 'executar', id, codigo, entrada, interativo }` | campo `interativo` |
| Worker → página | `{ tipo: 'pedido_entrada', id, variavel }` | sim |
| Página → worker | `{ tipo: 'entrada', id, valor }` | sim |

As demais mensagens são as da 009 ([contrato](../009-executar-no-core/contracts/executar.md)).
