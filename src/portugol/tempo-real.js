// Atualizador do Portugol em tempo real (RF-07; spec 007, FR-001, FR-002;
// contracts/tempo-real.md; research R-02 e R-03).
// Decide QUANDO gerar: ignora eventos de interface, espera o fim do arraste e agrupa
// vários eventos numa geração só. Não importa o Blockly e não toca o DOM: quem gera e
// quem agenda (requestAnimationFrame na interface) chegam por parâmetro.

export function criarAtualizacaoTempoReal({ atualizar, agendar } = {}) {
  if (typeof atualizar !== 'function') throw new TypeError('"atualizar" precisa ser uma função.');
  if (typeof agendar !== 'function') throw new TypeError('"agendar" precisa ser uma função.');

  // Só os eventos "drag" de bloco ligam e desligam o arraste: o Blockly sempre manda o par.
  let arrastando = false;
  let pendente = false;
  let agendado = false;
  // Uma geração agendada antes de um atualizarAgora() fica velha e não roda.
  let geracao = 0;

  function agendarGeracao() {
    if (agendado) return;
    agendado = true;
    const minha = geracao;
    agendar(() => {
      if (minha !== geracao) return;
      agendado = false;
      pendente = false;
      atualizar();
    });
  }

  function notificar(evento, { arrastando: arrastandoAgora = false } = {}) {
    if (evento?.type === 'drag') {
      if (evento.isStart) {
        arrastando = true;
      } else {
        arrastando = false;
        agendarGeracao();
      }
      return;
    }

    // "arrastando" da interface vale só para este evento (achado F1): o primeiro evento
    // fora de qualquer arraste libera o que ficou pendente, mesmo sendo de interface.
    const emArraste = arrastando || arrastandoAgora === true;
    if (!emArraste && pendente) {
      agendarGeracao();
      return;
    }
    if (evento?.isUiEvent) return;
    if (emArraste) {
      pendente = true;
      return;
    }
    agendarGeracao();
  }

  function solicitar() {
    if (arrastando) {
      pendente = true;
      return;
    }
    agendarGeracao();
  }

  function atualizarAgora() {
    geracao += 1;
    agendado = false;
    pendente = false;
    arrastando = false;
    atualizar();
  }

  return {
    notificar,
    solicitar,
    atualizarAgora,
    get arrastando() {
      return arrastando;
    },
  };
}
