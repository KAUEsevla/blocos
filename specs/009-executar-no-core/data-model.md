# Modelo de dados: Executar o programa pelo meuPiá Core

Spec: [spec.md](spec.md). Decisões: [research.md](research.md). Contratos:
[executar.md](contracts/executar.md), [adapter-core.md](contracts/adapter-core.md),
[tela-execucao.md](contracts/tela-execucao.md).

Nada é persistido. O formato do projeto (v1) não muda. Todas as estruturas abaixo vivem
só durante a sessão.

## Programa a executar

O que o controlador lê no clique em Executar (passo 2 do controlador).

| Campo | Tipo | Regra |
| --- | --- | --- |
| `codigo` | `string` | Exatamente o texto do painel Portugol depois de `tempoReal.atualizarAgora()` (FR-001). |
| `avisos` | `Aviso[]` | Os da mesma geração ([data-model da 008](../008-portugol-valido/data-model.md)), na ordem do texto. |

Invariante: o `codigo` é fixado no clique. Editar os blocos durante a execução não muda o
que está rodando.

## Estado da execução

| Valor | Entra quando | Sai quando |
| --- | --- | --- |
| `ocioso` | início da página; fim de qualquer execução; bloqueio por avisos | clique em Executar permitido |
| `preparando` | clique permitido com o ambiente ainda não pronto | mensagem `pronto` (vai para `executando`), `falha_ambiente` ou Parar (vão para `ocioso`) |
| `executando` | ambiente pronto | `resultado` ou Parar (vão para `ocioso`) |

```text
ocioso ──Executar (bloqueado)──▶ ocioso
ocioso ──Executar──▶ preparando ──pronto──▶ executando ──resultado──▶ ocioso
ocioso ──Executar (ambiente pronto)──▶ executando
preparando / executando ──Parar──▶ ocioso
preparando ──falha_ambiente──▶ ocioso
```

Botões por estado: tabela do [R-10](research.md).

## ResultadoTela

O `ResultadoExecucao` da 008 com dois status a mais, que só existem do lado da tela.

| `status` | Origem | `saida` | `erro` |
| --- | --- | --- | --- |
| `ok` | Core | vazia na mensagem do worker (chegou em lotes) | `null` |
| `erro_compilacao` | Core | `""` | `ErroCore` com `etapa`, `linha` e `coluna` quando o Core informa |
| `erro_execucao` | Core ou falha inesperada do serviço | o que chegou antes do erro | `ErroCore` com `etapa: 'execução'` |
| `interrompido` | Parar | o que chegou antes | `null` |
| `falha_ambiente` | `ErroAmbiente` na preparação | `""` | `{ mensagem }` |

### ErroCore (ampliado)

Campos da 008 sem mudança. Muda só o conteúdo:

- `mensagem`: sempre pt-BR, pela tabela do [R-07](research.md). Nunca contém o texto da
  exceção Python.
- `detalhe`: rastro Python (`traceback.format_exc()`) no erro de execução; texto bruto do
  compilador no erro de compilação. Só aparece em "Detalhes técnicos".

## ItemSaida

O que `relatoDoResultado` devolve e o controlador repassa ao painel.

| Forma | Painel |
| --- | --- |
| `{ texto, tipo }`, com `tipo` ∈ `'programa' \| 'sistema' \| 'erro'` | `escrever(texto, tipo)` |
| `{ detalhe }` | `escreverDetalhe(detalhe)` |

## Linha da Saída

- Uma linha por `\n` escrito pelo programa, ou seja, uma por `escreva` (FR-003 da 003).
- Linha vazia é válida (`escreva("")`) e aparece.
- Sem limite de quantidade (R-13).

## Mensagem do worker

Protocolo no contrato [executar.md](contracts/executar.md). Todo `saida` e `resultado`
carrega o `id` da execução, e o executor descarta mensagens com `id` antigo.
