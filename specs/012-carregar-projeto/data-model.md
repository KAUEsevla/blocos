# Modelo de dados (Fase 1): Carregar projeto em JSON

A 012 **não cria formato novo**: lê o arquivo v1 definido pela 011
([data-model da 011](../011-salvar-projeto/data-model.md)) e pela 008. Esta spec fixa o que
é aceito, os motivos de recusa e o estado depois da carga.

## Arquivo de projeto (v1): regras de leitura

| Campo | Aceito | Recusado (motivo) |
| --- | --- | --- |
| texto inteiro | até 1 048 576 bytes (UTF-8) | maior (`grande-demais`); vazio ou só espaços (`nao-e-projeto`) |
| JSON | `JSON.parse` sem erro, raiz objeto | outro (`nao-e-projeto`) |
| `formato` | `"meupia-blocos"` | ausente ou outro (`nao-e-projeto`) |
| `versao` | inteiro de 1 a `VERSAO_FORMATO` (1) | inteiro maior (`versao-nova`); outro (`dados-invalidos`) |
| `nome` | qualquer `string`, mantida **exatamente** como está (Premissas: "volta como foi digitado") | não `string` (`dados-invalidos`) |
| `variaveis` | array de `{ id, nome, tipo }`; pode ser vazio | não array; `id` vazio ou repetido; `nome` recusado por `validarNomeVariavel` (002); `tipo` fora de `TIPOS_VARIAVEL` (`dados-invalidos`) |
| `blocos` | objeto com `blocks.blocks` array (research R-04, R-05) | ver "Blocos" |
| `blocos.variables` | ignorado (a fonte é `variaveis`) | — |
| chaves extras na raiz | ignoradas | — |

Ordem das verificações e detalhes: [research.md](research.md), R-04.

### Blocos

| Regra | Origem |
| --- | --- |
| todo `type` está em `registroPadrao.tiposRegistrados()` | FR-002 ("blocos conhecidos") |
| `id` não vazio e único | sondagem R-03 (o Blockly trocaria em silêncio) |
| exatamente um `programa`, de topo, `id: "programa"` | 001 (bloco raiz, não apagável) |
| blocos de topo com `x`, `y` numéricos | 011 data-model ("Posições") |
| `inputs` só com encaixes do bloco (inclui `VALOR1…VALOR{n}` do escreva e `SENAO` do se com senão) | sondagem R-03 (`MissingConnection`) |
| filho de encaixe de valor tem saída; de encaixe de comandos e de `next`, conexão anterior | idem |
| `field_dropdown` com valor das opções; `NUM` com `normalizarNumero(NUM) !== null` (só número inválido é recusado) | sondagem R-03 (correção calada) |
| `fields.VAR`: ausente/`null` = variável não escolhida (incompleto, aceito); `{ id }` precisa existir em `variaveis` | 002, 008 |
| escreva: `extraState.valores` inteiro 1..10 | 003 (`MAX_VALORES`) |
| se: `extraState` **ausente = senão desligado**; `{ senao: true }` = ligado; `{ senao: false }` aceito | 004; Premissas da 012 (gravado pela 011 sem `extraState`) |
| `encaixesIncompativeis(...) = []` | 006, contracts/tipos-encaixe.md ("Regra para a spec 012") |
| encaixe vazio, blocos soltos | **aceitos** (casos de borda; avisos da 008) |

## Motivo de recusa

Entidade da spec. Valor devolvido pelo núcleo, nunca uma exceção:

```js
{ motivo: 'nao-e-projeto' | 'versao-nova' | 'grande-demais' | 'dados-invalidos', detalhe?: string }
```

| `motivo` | `detalhe` | Mensagem na tela (`mensagemRecusa`) |
| --- | --- | --- |
| `nao-e-projeto` | — | Este arquivo não é um projeto do meuPiá Blocos. |
| `versao-nova` | — | Este projeto foi salvo numa versão mais nova do meuPiá Blocos. |
| `grande-demais` | — | Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB). |
| `dados-invalidos` | frase curta em pt-BR, minúscula, sem ponto final | Este projeto tem dados inválidos e não foi carregado: {detalhe}. |

Os detalhes possíveis estão no [contrato](contracts/carregar.md).

## Carregamento preparado

Saída de `prepararCarregamento(texto, registro?)`:

| Caso | Forma |
| --- | --- |
| aceito | `{ ok: true, projeto: { formato, versao, nome, variaveis, blocos } }` (`blocos` sem `variables`; cópia nova do JSON lido) |
| recusado | `{ ok: false, motivo, detalhe?, mensagem }` |

## Resultado do ensaio

Saída de `ensaiarCarga(projeto)` (interface) e `classificarErroCarga(erro, excecoes)` (núcleo):

| Caso | Forma |
| --- | --- |
| load do Blockly passou | `{ ok: true }` |
| `BadConnectionCheck` ou `MissingConnection` | `{ ok: false, erro: 'encaixe' }` → detalhe "um bloco está encaixado num lugar onde não cabe" |
| qualquer outro erro | `{ ok: false, erro: 'desconhecido' }` → detalhe "o editor não conseguiu montar os blocos" |

## Referência de "salvo" (estado em `main.js`)

Mesma variável `referencia` da 001 e da 011. Esta spec preenche a linha "Carregar":

| Momento | Quem marca | Valor |
| --- | --- | --- |
| Página aberta, Novo | 001 | assinatura do projeto novo depois de carregado |
| Salvar | 011 | `prepararSalvamento(p).referencia` |
| **Carregar** | **012** | `assinaturaProjeto(projetoAtual())` lida **depois** do `recarregarBlocos` |

## Transições do Carregar

```text
clique em Carregar
   └─ janela de arquivos ── cancelada ──────────────────────────────▶ nada muda
        └─ arquivo escolhido
             └─ lerArquivo → validarBlocos → ensaiarCarga
                  ├─ recusado ── aviso "Não foi possível carregar" ──▶ nada muda
                  └─ aceito
                       ├─ sem alterações não salvas ───────────────┐
                       └─ com alterações ── confirmar ─ Cancelar ─▶ nada muda
                                              └─ Descartar e carregar
                                                                    ▼
                          parar execução → nome → blocos (desfazer zerado)
                          → Portugol gerado → Saída limpa → referência marcada
                                                                    ▼
                                                           sem alterações
```

"Nada muda" = mesmo workspace, mesma pilha de desfazer, mesmo nome, mesma Saída, mesma
execução, mesma `referencia` (FR-004).
