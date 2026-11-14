import { describe, it, expect } from 'vitest';
import { gerarSecaoVar } from '../../src/portugol/variaveis.js';
import { criarEmissor } from '../../src/portugol/emissor.js';

const v = (nome, tipo) => ({ id: `id-${nome}`, nome, tipo });

function gerar(variaveis) {
  const e = criarEmissor();
  gerarSecaoVar(variaveis, e);
  e.linha('inicio');
  return e.texto();
}

describe('gerarSecaoVar (RF-08, RF-02)', () => {
  it('sem variáveis não emite a seção var', () => {
    expect(gerar([])).toBe('inicio\n');
    expect(gerar(undefined)).toBe('inicio\n');
  });

  it('emite uma variável por linha, seguida de linha em branco', () => {
    expect(gerar([v('idade', 'inteiro')])).toBe('var\n    idade: inteiro\n\ninicio\n');
  });

  it('agrupa por tipo (inteiro, real, cadeia, logico) mantendo a ordem de criação', () => {
    const texto = gerar([v('b', 'inteiro'), v('x', 'cadeia'), v('a', 'inteiro'), v('ok', 'logico'), v('m', 'real')]);
    expect(texto).toBe('var\n    b: inteiro\n    a: inteiro\n    m: real\n    x: cadeia\n    ok: logico\n\ninicio\n');
  });

  it('recusa tipo desconhecido', () => {
    expect(() => gerar([v('lista1', 'lista')])).toThrow('lista');
  });
});
