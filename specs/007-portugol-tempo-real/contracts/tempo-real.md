# Contrato: atualizador em tempo real (`src/portugol/tempo-real.js`)

Módulo do núcleo (dentro da cobertura). Não importa o Blockly e não toca o DOM:
recebe a função que gera e a função que agenda. Decisões em
[research.md](../research.md), R-02 e R-03; estados no
[data-model](../data-model.md#estado-do-atualizador).

## API

```js
criarAtualizacaoTempoReal({ atualizar, agendar }) → {
  notificar(evento, opcoes?),   // evento do editor; opcoes = { arrastando?: boolean }
  solicitar(),                  // pedido sem evento (nome do programa, variáveis da 002)
  atualizarAgora(),             // gera na hora (Novo, Carregar)
  get arrastando(),             // boolean: há um arraste de bloco (par de eventos drag) em curso
}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `atualizar` | `() => void` | sim | Gera o Portugol a partir do estado atual e atualiza a tela. |
| `agendar` | `(fn) => void` | sim | Roda `fn` mais tarde, uma vez. Na interface: `requestAnimationFrame`. Nos testes: um agendador manual. |

Lança `TypeError` se `atualizar` ou `agendar` não for função.

## Comportamento

| Chamada | Fora do arraste | Durante o arraste |
| --- | --- | --- |
| `notificar({ type: 'drag', isStart: true })` | entra no arraste | — |
| `notificar({ type: 'drag', isStart: false })` | agenda | sai do arraste e agenda |
| `notificar({ isUiEvent: true, … })` (não `drag`) | nada | nada |
| `notificar(eventoNaoUi)` | agenda | marca pendente |
| `notificar(eventoNaoUi, { arrastando: true })` | marca pendente (não liga o arraste) | marca pendente |
| `notificar(qualquerEvento, { arrastando: false })` com pendente | agenda (libera o pendente), mesmo que o evento seja de interface | marca pendente se não-UI; não agenda |
| `solicitar()` | agenda | marca pendente |
| `atualizarAgora()` | chama `atualizar()` na hora; descarta o agendado | chama `atualizar()` na hora; sai do arraste |

**Dois sinais de arraste, com regras diferentes**:
- O **arraste de bloco** (eventos `drag` com `isStart`) fica ligado do início ao fim,
  porque o Blockly sempre manda o par.
- O sinal `opcoes.arrastando` (`ws.isDragging()`) vale **só para o evento em que
  chega**. Ele cobre gestos que não mandam `drag` de bloco, como arrastar um comentário
  (`comment_drag` + `comment_move`). O primeiro evento que chegar com
  `arrastando: false`, de qualquer tipo, libera o pendente. Assim o atualizador nunca
  fica preso esperando um `drag` de fim que não vem.

"Agenda" = se já há uma geração agendada e válida, nada; senão chama `agendar(fn)` uma
vez. Quando `fn` roda: se ainda for a geração mais recente, chama `atualizar()` uma vez
e limpa `pendente`.

`atualizarAgora()` durante o arraste só acontece se o código chamar no meio de um gesto
(não acontece no editor: Novo e Carregar são cliques fora do workspace); sair do
arraste nesse caso evita ficar preso no modo arraste.

## Garantias

- No máximo uma chamada de `atualizar()` por agendamento, qualquer que seja o número de
  eventos notificados antes dele.
- Nenhuma chamada de `atualizar()` entre um `drag` de início e o de fim, exceto por
  `atualizarAgora()`.
- Nenhum estado preso: fora de um arraste de bloco, todo pendente é liberado no
  primeiro evento com `arrastando: false`.
- Depois de um `drag` de fim, há sempre uma geração (mesmo sem pendência: soltar na
  lixeira ou cancelar o arraste também passa por aqui).
- Determinístico: não lê relógio nem estado global; o tempo vem de `agendar`.

## Testes (`tests/unidade/tempo-real.test.js`)

| Caso | Esperado |
| --- | --- |
| 3 eventos não-UI, depois roda o agendado | `agendar` chamado 1×, `atualizar` 1× |
| evento de interface (`isUiEvent: true`, `type: 'selected'`) | nada agendado |
| `drag` início, 2 eventos não-UI, `drag` fim, roda o agendado | `atualizar` 1×, só depois do fim |
| evento não-UI com `{ arrastando: true }`, depois `drag` fim | `atualizar` 1× depois do fim |
| arraste de comentário: `{ type: 'comment_drag', isUiEvent: true, isStart: true }` e `{ type: 'comment_move', isUiEvent: false }` com `{ arrastando: true }`, roda o agendado; depois `{ type: 'comment_drag', isUiEvent: true, isStart: false }` com `{ arrastando: false }`, roda o agendado | nada durante o gesto; `atualizar` 1× depois do evento com `arrastando: false`; `arrastando` (getter) é `false` o tempo todo |
| depois do arraste de comentário, um evento não-UI com `{ arrastando: false }` | agenda normalmente (não ficou preso) |
| `solicitar()` fora do arraste | agenda |
| `solicitar()` durante o arraste | não agenda até o `drag` fim |
| evento não-UI, `atualizarAgora()`, roda o agendado | `atualizar` 1× no total (o agendado ficou velho e não roda) |
| `atualizarAgora()` sem nada agendado | `atualizar` 1× na hora |
| `drag` fim sem início | agenda (não quebra) |
| parâmetros inválidos | `TypeError` |
