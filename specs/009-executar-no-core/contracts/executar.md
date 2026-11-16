# Contrato: execução pela tela (`src/execucao/`)

Decisões: [research.md](../research.md), R-02 a R-11. Dados:
[data-model.md](../data-model.md).

Seis módulos. Os cinco primeiros são núcleo (dentro da cobertura); `worker.js` é a
cola do navegador, fora da medição (R-11).

| Módulo | Papel | Importa o Pyodide? | Toca o DOM? |
| --- | --- | --- | --- |
| `linhas.js` | `criarDivisorLinhas` | não | não |
| `mensagens.js` | textos da execução e `relatoDoResultado` | não | não |
| `controlador.js` | `criarControladorExecucao`: clique em Executar e Parar | não | não |
| `executor.js` | `criarExecutor`: lado da página do worker | não | não |
| `servico.js` | `criarServicoExecucao`: lado do worker | não (recebe o motor) | não |
| `worker.js` | `self.onmessage` → serviço com `criarMotorNavegador` | sim, via `src/core/` | não |

## Divisor de linhas (`linhas.js`)

```js
criarDivisorLinhas() → { acrescentar(pedaco: string) → string[], finalizar() → string[] }
```

- `acrescentar` devolve as linhas que se completaram com o pedaço, sem o `\n`, e guarda o
  resto.
- `finalizar` devolve o resto (`[resto]`) se ele não for vazio; senão `[]`.
- `\r\n` conta como `\n`. Pedaços vazios não mudam nada.
- Exemplos: `"a\n\n"` → `["a", ""]`; `"Ol"`, `"á\nx"` → `[]`, `["Olá"]`, e
  `finalizar()` → `["x"]`; `""` → `[]`.

## Mensagens e relato (`mensagens.js`)

```js
MENSAGENS_EXECUCAO  // objeto congelado com os textos abaixo
relatoDoResultado(resultado: ResultadoTela, codigo: string) → ItemSaida[]
```

| Chave | Texto |
| --- | --- |
| `preparando` | "Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos." |
| `etapaPython` | "Carregando o Python (1 de 2)..." |
| `etapaCore` | "Instalando o meuPiá Core (2 de 2)..." |
| `executando` | "Executando..." |
| `fim` | "Fim do programa" |
| `erroCompilacao` | "Erro de compilação" |
| `erroExecucao` | "Erro de execução" |
| `interrompido` | "Execução interrompida pelo usuário" |
| `linhaDoErro` | `(n, texto) => \`Linha ${n}: ${texto}\`` |
| `detalhesTecnicos` | "Detalhes técnicos" |

`relatoDoResultado` devolve os itens do **aviso de fim** (as linhas do programa já foram
escritas em fluxo):

| `status` | Itens, em ordem |
| --- | --- |
| `ok` | `{ texto: fim, tipo: 'sistema' }` |
| `erro_compilacao` | `erroCompilacao` (`erro`); `erro.mensagem` (`erro`); se `erro.linha` existir e a linha estiver no `codigo`, `linhaDoErro(linha, texto sem a indentação)` (`erro`); `{ detalhe: erro.detalhe }` |
| `erro_execucao` | `erroExecucao` (`erro`); `erro.mensagem` (`erro`); `{ detalhe: erro.detalhe }` |
| `interrompido` | `{ texto: interrompido, tipo: 'sistema' }` |
| `falha_ambiente` | `{ texto: erro.mensagem, tipo: 'erro' }` |

O item `{ detalhe }` só aparece se `detalhe` não for vazio. A interface o mostra dentro
de "Detalhes técnicos", fechado por padrão.

## Controlador (`controlador.js`)

```js
criarControladorExecucao({
  obterPrograma,   // () → { codigo, avisos }: força a geração e devolve o que o painel mostra
  executor,        // criarExecutor(...) ou falso nos testes
  saida,           // { limpar, escrever, escreverVarias, escreverDetalhe, mostrarAvisos }
  destacar,        // (blocoId) → void
  aoMudarEstado,   // (estado: 'ocioso' | 'preparando' | 'executando') → void
}) → { executar() → Promise<void>, parar() → void, estado() → string }
```

`executar()`:

1. Se o estado não for `ocioso`, não faz nada.
2. `const { codigo, avisos } = obterPrograma()`; `verificarExecucao({ avisos })`.
3. **Bloqueado**: `saida.limpar()`, `saida.escrever(motivo, 'erro')`,
   `saida.mostrarAvisos(avisos, (aviso) => destacar(aviso.blocoId))`. O executor não é
   chamado. O estado continua `ocioso`.
4. **Permitido**: `saida.limpar()`. Se `executor.pronto()` for `false`, estado
   `preparando` e `escrever(preparando, 'sistema')`. Cada progresso escreve a etapa.
   Com o ambiente pronto, estado `executando` e `escrever(executando, 'sistema')`.
5. As linhas chegam por `aoEscrever(pedaco)` → divisor → `saida.escreverVarias(linhas,
   'programa')`. No fim, `finalizar()` e os itens de `relatoDoResultado`.
6. Estado `ocioso` no fim, em qualquer resultado (inclusive exceção inesperada do
   executor, que vira o relato genérico de `erro_execucao`).

`parar()`: se o estado não for `ocioso`, chama `executor.parar()`. A promessa pendente
resolve com `interrompido`, e o fluxo do passo 5 termina normalmente.

O código usado é o `codigo` lido no passo 2. Mudanças nos blocos durante a execução não
a afetam (caso de borda).

## Executor (`executor.js`)

```js
criarExecutor({ criarWorker }) → {
  pronto() → boolean,
  executar(codigo, { entrada = [], aoEscrever, aoProgresso, aoPronto }) → Promise<ResultadoTela>,
  parar() → void,
}
```

- `criarWorker()` devolve um objeto com `postMessage`, `terminate` e `onmessage`. No
  navegador é `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })`.
  Na aceitação é o adaptador de `worker_threads` (R-11).
- O worker é criado na primeira chamada de `executar`, que envia `preparar` e depois
  `executar`. `pronto()` fica `true` depois da mensagem `pronto`, que também chama o
  `aoPronto` da execução em andamento (o controlador passa de `preparando` a `executando`).
- `onerror` do worker (o script não carregou) é tratado como `falha_ambiente`, com a
  mensagem do `ErroAmbiente`.
- `falha_ambiente`: o worker é encerrado e descartado. O próximo `executar` cria outro
  (caso de borda "sem internet").
- `parar()`: `terminate()`, resolve a promessa pendente com `{ status: 'interrompido' }`
  e cria um worker novo, enviando `preparar` em segundo plano (R-03).
- Mensagens com `id` diferente da execução atual são ignoradas. Isso evita que um lote
  atrasado de um worker já encerrado chegue à Saída.

## Protocolo do worker

**Ampliado pela spec 010**: campo `interativo` em `executar`, mensagens `pedido_entrada`
(worker → página) e `entrada` (página → worker). Ver
[entrada.md](../../010-entrada-de-dados/contracts/entrada.md).

Página → worker:

| Mensagem | Efeito |
| --- | --- |
| `{ tipo: 'preparar' }` | Cria o motor (uma vez). Repetir não recria. |
| `{ tipo: 'executar', id, codigo, entrada }` | Espera o motor e chama `compilarEExecutar(motor, codigo, entrada, { aoEscrever })`. |

Worker → página:

| Mensagem | Quando |
| --- | --- |
| `{ tipo: 'progresso', etapa: 'python' \| 'core' }` | Antes de cada etapa da preparação |
| `{ tipo: 'pronto' }` | Motor criado |
| `{ tipo: 'falha_ambiente', mensagem }` | `ErroAmbiente` na preparação |
| `{ tipo: 'saida', id, texto }` | Lote de escrita, no máximo um a cada 50 ms, e o resto no fim |
| `{ tipo: 'resultado', id, resultado }` | Fim da execução; `resultado.saida` vai vazio (já chegou em lotes) |

## Serviço do worker (`servico.js`)

```js
criarServicoExecucao({ criarMotor, postar, agora = () => Date.now() }) → { receber(mensagem) → Promise<void> }
```

- `criarMotor({ aoProgresso })` é `criarMotorNavegador` no navegador e `criarMotorNode`
  na aceitação (mesma assinatura, contrato [adapter-core.md](adapter-core.md)). O
  `aoProgresso(etapa)` do serviço posta `{ tipo: 'progresso', etapa }`.
- O lote de 50 ms usa `agora()`, não timers, porque o Python ocupa o worker (R-05).
- Uma exceção inesperada de `compilarEExecutar` vira `resultado` com
  `status: 'erro_execucao'` e a mensagem genérica. O worker nunca fica sem responder.

## Garantias testadas

Unidade:

- Divisor: os exemplos acima, `\r\n`, pedaço que termina no meio da linha, 5.000 linhas.
- `relatoDoResultado`: cada linha da tabela; linha do erro fora do código; `detalhe`
  vazio não gera item.
- Controlador (pendência P-1 da 008): com aviso, o executor falso não é chamado, e a
  Saída falsa recebe `limpar`, o motivo e os avisos na ordem. O `aoClicar` do segundo
  aviso chama `destacar` com o `blocoId` dele.
- Controlador: a sequência de estados (`preparando` → `executando` → `ocioso` na primeira
  vez; só `executando` → `ocioso` depois). Um segundo clique durante a execução é
  ignorado. A ordem na Saída segue FR-004. Um programa sem saída mostra "Executando..." e
  "Fim do programa". Parar leva a "Execução interrompida pelo usuário".
- Executor com `Worker` falso: criação preguiçosa, `pronto()`, `parar()` com
  `terminate` e um worker novo, mensagens de `id` antigo ignoradas, falha de ambiente
  descarta o worker.
- Serviço com motor falso: `preparar` idempotente, lotes por tempo com relógio falso,
  resto enviado no fim, exceção vira `resultado`.

Aceitação (Core real em `worker_threads`): ver [R-11](../research.md).
