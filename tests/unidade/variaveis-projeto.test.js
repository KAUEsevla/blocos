// Variáveis do projeto (spec 002, RF-02; contracts/blocos-variaveis.md, "Variáveis do projeto").
import { describe, it, expect } from 'vitest';
import { variaveisDoMapa, blocosComVariaveis } from '../../src/projeto/variaveis.js';
import { projetoVazio } from '../../src/projeto/formato.js';

const modelo = (id, nome, tipo) => ({ getId: () => id, getName: () => nome, getType: () => tipo });

function congelarFundo(valor) {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congelarFundo);
    Object.freeze(valor);
  }
  return valor;
}

describe('variaveisDoMapa', () => {
  it('preserva a ordem recebida e devolve { id, nome, tipo }', () => {
    const lista = variaveisDoMapa([
      modelo('v2', 'nome', 'cadeia'),
      modelo('v1', 'idade', 'inteiro'),
      modelo('v3', 'ok', 'logico'),
      modelo('v4', 'altura', 'real'),
    ]);
    expect(lista).toEqual([
      { id: 'v2', nome: 'nome', tipo: 'cadeia' },
      { id: 'v1', nome: 'idade', tipo: 'inteiro' },
      { id: 'v3', nome: 'ok', tipo: 'logico' },
      { id: 'v4', nome: 'altura', tipo: 'real' },
    ]);
  });

  it('ignora modelos com tipo fora de TIPOS_VARIAVEL', () => {
    const lista = variaveisDoMapa([
      modelo('v1', 'item', ''),
      modelo('v2', 'idade', 'inteiro'),
      modelo('v3', 'texto', 'texto'),
    ]);
    expect(lista).toEqual([{ id: 'v2', nome: 'idade', tipo: 'inteiro' }]);
  });

  it('lista vazia (ou ausente) vira []', () => {
    expect(variaveisDoMapa([])).toEqual([]);
    expect(variaveisDoMapa(undefined)).toEqual([]);
  });
});

describe('blocosComVariaveis', () => {
  const variaveis = [
    { id: 'v1', nome: 'idade', tipo: 'inteiro' },
    { id: 'v2', nome: 'nome', tipo: 'cadeia' },
  ];

  it('devolve cópia com variables na ordem de variaveis, sem alterar a entrada', () => {
    const blocos = congelarFundo(projetoVazio().blocos);
    const resultado = blocosComVariaveis(blocos, congelarFundo([...variaveis]));
    expect(resultado.variables).toEqual([
      { id: 'v1', name: 'idade', type: 'inteiro' },
      { id: 'v2', name: 'nome', type: 'cadeia' },
    ]);
    expect(resultado.blocks).toEqual(blocos.blocks);
    expect(resultado).not.toBe(blocos);
    expect(blocos.variables).toBeUndefined();
  });

  it('substitui uma chave variables que já exista', () => {
    const blocos = { ...projetoVazio().blocos, variables: [{ id: 'x', name: 'velha', type: 'real' }] };
    expect(blocosComVariaveis(blocos, variaveis).variables.map((v) => v.id)).toEqual(['v1', 'v2']);
  });

  it('funciona com blocos {} e sem variáveis', () => {
    expect(blocosComVariaveis({}, variaveis)).toEqual({
      variables: [
        { id: 'v1', name: 'idade', type: 'inteiro' },
        { id: 'v2', name: 'nome', type: 'cadeia' },
      ],
    });
    expect(blocosComVariaveis({}, [])).toEqual({ variables: [] });
  });
});
