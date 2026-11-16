// Divisor de linhas da Saída (spec 009, research R-08; FR-003 da 003: uma linha por escreva).
import { describe, it, expect } from 'vitest';
import { criarDivisorLinhas } from '../../src/execucao/linhas.js';

describe('criarDivisorLinhas (RF-03, RF-09)', () => {
  it('linha vazia é válida e o \\n final não cria linha a mais', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('a\n\n')).toEqual(['a', '']);
    expect(divisor.finalizar()).toEqual([]);
  });

  it('guarda o pedaço sem \\n até o próximo e devolve o resto no fim', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('Ol')).toEqual([]);
    expect(divisor.acrescentar('á\nx')).toEqual(['Olá']);
    expect(divisor.finalizar()).toEqual(['x']);
  });

  it('pedaço vazio não muda nada', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('')).toEqual([]);
    expect(divisor.finalizar()).toEqual([]);
  });

  it('\\r\\n conta como \\n', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('a\r\nb\r\n')).toEqual(['a', 'b']);
    expect(divisor.finalizar()).toEqual([]);
  });

  it('\\r\\n cortado entre dois pedaços', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('a\r')).toEqual([]);
    expect(divisor.acrescentar('\nb')).toEqual(['a']);
    expect(divisor.finalizar()).toEqual(['b']);
  });

  it('5.000 linhas num pedaço só saem inteiras e na ordem', () => {
    const esperadas = Array.from({ length: 5000 }, (_, i) => String(i));
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar(esperadas.join('\n') + '\n')).toEqual(esperadas);
    expect(divisor.finalizar()).toEqual([]);
  });

  it('pedaço ausente conta como vazio', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar(undefined)).toEqual([]);
    expect(divisor.finalizar()).toEqual([]);
  });

  it('\\r solto no fim da execução é descartado', () => {
    const divisor = criarDivisorLinhas();
    expect(divisor.acrescentar('fim\r')).toEqual([]);
    expect(divisor.finalizar()).toEqual(['fim']);
  });

  it('depois de finalizar, recomeça vazio', () => {
    const divisor = criarDivisorLinhas();
    divisor.acrescentar('x');
    divisor.finalizar();
    expect(divisor.finalizar()).toEqual([]);
  });
});
