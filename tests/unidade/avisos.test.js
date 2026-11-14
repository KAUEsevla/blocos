import { describe, it, expect } from 'vitest';
import { MARCADOR_AUSENTE, criarAviso, criarAvisoComMensagem } from '../../src/portugol/avisos.js';

const bloco = { id: 'b1', type: 'se' };

describe('avisos de bloco incompleto (RF-08)', () => {
  it('o marcador da parte ausente é ???', () => {
    expect(MARCADOR_AUSENTE).toBe('???');
  });

  it('monta a mensagem "Falta <parte> do bloco <rótulo>"', () => {
    expect(criarAviso({ bloco, encaixe: 'CONDICAO', parte: 'a condição', rotulo: 'se' })).toEqual({
      blocoId: 'b1',
      tipoBloco: 'se',
      encaixe: 'CONDICAO',
      mensagem: 'Falta a condição do bloco se',
    });
    expect(
      criarAviso({ bloco: { id: 'b2', type: 'escreva' }, encaixe: 'VALOR0', parte: 'o valor', rotulo: 'escreva' })
        .mensagem,
    ).toBe('Falta o valor do bloco escreva');
  });

  it('aceita mensagem própria', () => {
    expect(
      criarAvisoComMensagem({ bloco, encaixe: 'PASSO', mensagem: 'O passo do bloco para não pode ser 0' }),
    ).toEqual({ blocoId: 'b1', tipoBloco: 'se', encaixe: 'PASSO', mensagem: 'O passo do bloco para não pode ser 0' });
  });
});
