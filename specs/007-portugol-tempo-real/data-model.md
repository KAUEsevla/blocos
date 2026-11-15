# Modelo de dados (Fase 1): Portugol gerado em tempo real

A 007 não cria formato de arquivo novo nem muda o **Projeto** (formato v1 da 008,
[data-model da 008](../008-portugol-valido/data-model.md)). Ela acrescenta estado em
memória: o do atualizador, as marcas de blocos soltos e o estado dos botões de
desfazer. Nada disso é salvo no arquivo nem entra na assinatura de alterações
(001, [alteracoes.md](../001-tela-tres-paineis/contracts/alteracoes.md)).

## Evento do editor

O que o atualizador recebe. É um subconjunto dos campos de um evento do Blockly, e nos
testes é um objeto simples.

| Campo | Tipo | Uso |
| --- | --- | --- |
| `type` | string | `'drag'` liga/desliga o modo arraste; os demais só importam por `isUiEvent` |
| `isUiEvent` | boolean | `true` → ignorado (exceto `drag`) |
| `isStart` | boolean, só em `drag` | `true` começo, `false` fim do arraste |

Opção que acompanha o evento: `{ arrastando: boolean }`, vinda de `ws.isDragging()`.
Ela vale **só para aquele evento**: não liga nenhum estado (ver "Regras" abaixo).

## Estado do atualizador

Interno a `criarAtualizacaoTempoReal` ([contrato](contracts/tempo-real.md)).

| Campo | Tipo | Significado |
| --- | --- | --- |
| `arrastando` | boolean | entre um `drag` de início e um de fim (arraste de **bloco**) |
| `pendente` | boolean | houve alteração durante um arraste (de bloco, ou num evento com `arrastando: true`) |
| `agendado` | boolean | há uma geração esperando o próximo quadro |
| `geracao` | inteiro | conta as gerações pedidas; uma geração agendada que ficou velha (porque `atualizarAgora` rodou antes) não roda |

**Transições**:

```text
                 drag início
   OCIOSO ─────────────────────────▶ ARRASTANDO
     ▲  │ evento não-UI / solicitar()     │ evento não-UI → pendente = true
     │  ▼                                 │
   AGENDADO ◀─────────────────────────────┘ drag fim (agenda sempre)
     │ quadro: atualizar() uma vez; agendado = false; pendente = false
     ▼
   OCIOSO

   Em OCIOSO, com { arrastando: true } (ex.: arraste de comentário):
     evento não-UI → pendente = true, nada agendado, estado continua OCIOSO
   Em OCIOSO, com { arrastando: false } e pendente = true:
     qualquer evento (inclusive de interface) → AGENDADO

   atualizarAgora(): em qualquer estado, atualizar() na hora; agendado = false;
                     pendente = false; arrastando = false.
   evento de interface (não drag): nenhuma transição.
```

**Regras**:
- Nunca há mais de uma geração agendada.
- Durante o arraste de bloco não há geração, nem por `solicitar()` (fica pendente).
- `opcoes.arrastando` nunca liga `arrastando`: só os eventos `drag` ligam e desligam.
  Assim um gesto sem `drag` de fim (arrastar um comentário) não deixa o atualizador
  preso; o pendente sai no primeiro evento com `arrastando: false`.
- Toda geração lê o estado **atual** do workspace e do projeto, não o do evento.

## Marca de bloco fora do programa

**Termo**: neste plan, "marca" é o **aviso visual** de que a spec fala (FR-004 e
História 2): o ícone de aviso do Blockly com o texto no bloco. "Aviso" sozinho, no
código, continua sendo o aviso de bloco incompleto do gerador (`resultado.avisos`,
008); a marca de pilha solta usa o mesmo ícone, mas não é um desses avisos.

Item devolvido por `blocosForaDoPrograma(blocos)`
([contrato](contracts/fora-do-programa.md)).

| Campo | Tipo | Valor |
| --- | --- | --- |
| `blocoId` | string | `id` do bloco de topo solto |
| `mensagem` | string | `"Esta pilha está fora do programa"` |

**Regras**:
- Um item por bloco de topo que não seja o primeiro `programa` da serialização, ou
  seja, um por pilha solta (um bloco sozinho também é uma pilha).
- Blocos encaixados num bloco solto não geram item: a marca fica só no primeiro bloco
  da pilha (spec, FR-004).
- Não entra em `resultado.avisos` nem em `verificarExecucao` (não bloqueia Executar).

## Marcas na interface

Por workspace, `aplicarAvisos` guarda um conjunto de ids marcados **por chave**:

| Chave | Origem | Texto |
| --- | --- | --- |
| `incompleto` | `resultado.avisos` do gerador (008) | "Falta … do bloco …" (várias mensagens juntas por `\n`) |
| `fora-do-programa` | `blocosForaDoPrograma` | "Esta pilha está fora do programa" |

Um bloco pode ter as duas marcas ao mesmo tempo só em tese (o gerador não visita
soltos, então um solto nunca tem aviso de incompleto); a separação existe para que a
limpeza de uma chave não apague a outra.

## Estado dos botões de desfazer

| Botão | Habilitado quando | Recalculado |
| --- | --- | --- |
| Desfazer (`botao-desfazer`) | `ws.getUndoStack().length > 0` | a cada geração do Portugol |
| Refazer (`botao-refazer`) | `ws.getRedoStack().length > 0` | idem |

Começam desabilitados (página aberta, depois do Novo e, na 012, depois do Carregar).

## Ciclo de uma geração

```text
atualizar():
  projeto = { ...projetoAberto, blocos: serializarBlocos(ws) }
  resultado = gerarPortugol(projeto)
  mostrarCodigo(pre, resultado.codigo)          // mantém a rolagem; nada se igual
  aplicarAvisos(ws, resultado.avisos, 'incompleto')
  aplicarAvisos(ws, blocosForaDoPrograma(projeto.blocos), 'fora-do-programa')
  atualizarBotoesDesfazer(estadoDesfazer(ws))
  ultimoCodigo = resultado.codigo               // usado pelo "Copiar código" (001)
```
