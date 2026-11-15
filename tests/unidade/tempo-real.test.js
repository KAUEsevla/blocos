import { describe, it, expect, vi, beforeEach } from 'vitest';
import { criarAtualizacaoTempoReal } from '../../src/portugol/tempo-real.js';

// Atualizador em tempo real (RF-07; spec 007, FR-001, FR-002; contracts/tempo-real.md).
// Eventos são objetos simples e o agendador é manual: nada de Blockly nem de relógio.

const naoUi = (type = 'move') => ({ type, isUiEvent: false });
const ui = (type = 'selected') => ({ type, isUiEvent: true });
const dragInicio = () => ({ type: 'drag', isUiEvent: true, isStart: true });
const dragFim = () => ({ type: 'drag', isUiEvent: true, isStart: false });

let fila;
let agendar;
let atualizar;
let tempoReal;

function rodar() {
  for (const fn of fila.splice(0)) fn();
}

beforeEach(() => {
  fila = [];
  agendar = vi.fn((fn) => fila.push(fn));
  atualizar = vi.fn();
  tempoReal = criarAtualizacaoTempoReal({ atualizar, agendar });
});

describe('criarAtualizacaoTempoReal (RF-07, FR-001, FR-002)', () => {
  it('três eventos não-UI seguidos viram uma geração só', () => {
    tempoReal.notificar(naoUi('create'));
    tempoReal.notificar(naoUi('move'));
    tempoReal.notificar(naoUi('change'));
    expect(atualizar).not.toHaveBeenCalled();
    rodar();
    expect(agendar).toHaveBeenCalledTimes(1);
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('depois de gerar, um novo evento agenda de novo', () => {
    tempoReal.notificar(naoUi());
    rodar();
    tempoReal.notificar(naoUi());
    rodar();
    expect(agendar).toHaveBeenCalledTimes(2);
    expect(atualizar).toHaveBeenCalledTimes(2);
  });

  it('eventos de interface não agendam nada', () => {
    tempoReal.notificar(ui('selected'));
    tempoReal.notificar(ui('viewport_change'));
    rodar();
    expect(agendar).not.toHaveBeenCalled();
    expect(atualizar).not.toHaveBeenCalled();
  });

  it('durante o arraste de bloco nada é gerado; no fim, gera uma vez', () => {
    tempoReal.notificar(dragInicio());
    expect(tempoReal.arrastando).toBe(true);
    tempoReal.notificar(naoUi('move'));
    tempoReal.notificar(naoUi('change'));
    rodar();
    expect(atualizar).not.toHaveBeenCalled();

    tempoReal.notificar(dragFim());
    expect(tempoReal.arrastando).toBe(false);
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('evento não-UI com { arrastando: true } espera o fim do arraste', () => {
    tempoReal.notificar(naoUi('move'), { arrastando: true });
    rodar();
    expect(atualizar).not.toHaveBeenCalled();
    tempoReal.notificar(dragFim(), { arrastando: false });
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('arraste de comentário: espera o gesto e não fica preso no modo arraste', () => {
    tempoReal.notificar({ type: 'comment_drag', isUiEvent: true, isStart: true }, { arrastando: true });
    tempoReal.notificar({ type: 'comment_move', isUiEvent: false }, { arrastando: true });
    rodar();
    expect(agendar).not.toHaveBeenCalled();
    expect(atualizar).not.toHaveBeenCalled();
    expect(tempoReal.arrastando).toBe(false);

    tempoReal.notificar({ type: 'comment_drag', isUiEvent: true, isStart: false }, { arrastando: false });
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
    expect(tempoReal.arrastando).toBe(false);

    tempoReal.notificar(naoUi(), { arrastando: false });
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(2);
  });

  it('evento de interface sem nada pendente não agenda', () => {
    tempoReal.notificar(ui(), { arrastando: false });
    expect(agendar).not.toHaveBeenCalled();
  });

  it('solicitar() fora do arraste agenda', () => {
    tempoReal.solicitar();
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('solicitar() durante o arraste espera o drag de fim', () => {
    tempoReal.notificar(dragInicio());
    tempoReal.solicitar();
    rodar();
    expect(atualizar).not.toHaveBeenCalled();
    tempoReal.notificar(dragFim());
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('atualizarAgora() descarta o agendado: uma geração no total', () => {
    tempoReal.notificar(naoUi());
    tempoReal.atualizarAgora();
    expect(atualizar).toHaveBeenCalledTimes(1);
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('atualizarAgora() sem nada agendado gera na hora', () => {
    tempoReal.atualizarAgora();
    expect(atualizar).toHaveBeenCalledTimes(1);
    expect(agendar).not.toHaveBeenCalled();
  });

  it('atualizarAgora() durante o arraste gera na hora e sai do arraste', () => {
    tempoReal.notificar(dragInicio());
    tempoReal.atualizarAgora();
    expect(atualizar).toHaveBeenCalledTimes(1);
    expect(tempoReal.arrastando).toBe(false);
    tempoReal.notificar(naoUi());
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(2);
  });

  it('depois de atualizarAgora(), um evento novo volta a agendar', () => {
    tempoReal.notificar(naoUi());
    tempoReal.atualizarAgora();
    tempoReal.notificar(naoUi());
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(2);
  });

  it('drag de fim sem início agenda e não quebra', () => {
    tempoReal.notificar(dragFim());
    expect(tempoReal.arrastando).toBe(false);
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it('notificar sem opções funciona', () => {
    tempoReal.notificar(naoUi());
    rodar();
    expect(atualizar).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ atualizar: undefined, agendar: () => {} }],
    [{ atualizar: () => {}, agendar: 'x' }],
    [{}],
    [undefined],
  ])('parâmetros inválidos lançam TypeError (%#)', (parametros) => {
    expect(() => criarAtualizacaoTempoReal(parametros)).toThrow(TypeError);
  });
});
