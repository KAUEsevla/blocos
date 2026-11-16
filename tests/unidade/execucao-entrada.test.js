// Textos do pedido de entrada do leia (spec 010, contracts/entrada.md; research R-06).
import { describe, it, expect } from 'vitest';
import { criarPedidoEntrada, TEXTOS_ENTRADA } from '../../src/execucao/entrada.js';

const VARIAVEIS = [
  { nome: 'nome', tipo: 'cadeia' },
  { nome: 'idade', tipo: 'inteiro' },
  { nome: 'altura', tipo: 'real' },
  { nome: 'ok', tipo: 'logico' },
];

describe('criarPedidoEntrada (RF-10, RNF-03)', () => {
  it('cadeia: rótulo com nome e tipo, sem dica', () => {
    expect(criarPedidoEntrada('nome', VARIAVEIS)).toEqual({
      rotulo: 'Digite o valor de nome (cadeia)',
      dica: null,
      confirmar: 'Confirmar',
    });
  });

  it('inteiro: dica de número sem casas decimais', () => {
    expect(criarPedidoEntrada('idade', VARIAVEIS)).toEqual({
      rotulo: 'Digite o valor de idade (inteiro)',
      dica: 'Número sem casas decimais, por exemplo 15.',
      confirmar: 'Confirmar',
    });
  });

  it('real: dica do ponto como separador decimal (P-2)', () => {
    expect(criarPedidoEntrada('altura', VARIAVEIS)).toEqual({
      rotulo: 'Digite o valor de altura (real)',
      dica: 'Use ponto para separar as casas decimais, por exemplo 1.72.',
      confirmar: 'Confirmar',
    });
  });

  it('lógico: tipo com acento e dica do verdadeiro', () => {
    expect(criarPedidoEntrada('ok', VARIAVEIS)).toEqual({
      rotulo: 'Digite o valor de ok (lógico)',
      dica: 'Digite verdadeiro ou falso. Só "verdadeiro" vira verdadeiro.',
      confirmar: 'Confirmar',
    });
  });

  it.each([
    ['variável null', null, VARIAVEIS],
    ['nome fora da lista', 'outra', VARIAVEIS],
    ['lista vazia', 'nome', []],
    ['lista ausente', 'nome', undefined],
  ])('%s: pedido genérico, sem dica', (_, variavel, variaveis) => {
    expect(criarPedidoEntrada(variavel, variaveis)).toEqual({
      rotulo: 'Digite um valor',
      dica: null,
      confirmar: 'Confirmar',
    });
  });

  it('os textos são congelados', () => {
    expect(Object.isFrozen(TEXTOS_ENTRADA)).toBe(true);
    expect(TEXTOS_ENTRADA.confirmar).toBe('Confirmar');
  });
});
