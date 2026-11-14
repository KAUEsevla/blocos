import { describe, it, expect } from 'vitest';
import { verificarExecucao } from '../../src/portugol/execucao.js';

describe('verificarExecucao (RF-08, FR-006)', () => {
  it('sem avisos, a execução é permitida', () => {
    expect(verificarExecucao({ codigo: 'x', avisos: [] })).toEqual({ permitida: true, motivo: null, avisos: [] });
  });

  it('com avisos, bloqueia e devolve os mesmos avisos na mesma ordem (cenário 2)', () => {
    const avisos = [
      { blocoId: 'a', tipoBloco: 'se', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco se' },
      { blocoId: 'b', tipoBloco: 'leia', encaixe: 'VAR', mensagem: 'Falta a variável do bloco leia' },
    ];
    expect(verificarExecucao({ codigo: 'x', avisos })).toEqual({
      permitida: false,
      motivo: 'O programa tem blocos incompletos. Complete-os para executar.',
      avisos,
    });
  });

  it('trata avisos ausentes como lista vazia', () => {
    expect(verificarExecucao({ codigo: 'x' }).permitida).toBe(true);
  });
});
