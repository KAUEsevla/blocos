import { describe, it, expect } from 'vitest';
import { criarEmissor } from '../../src/portugol/emissor.js';

describe('criarEmissor (RF-08)', () => {
  it('emite linhas com 4 espaços por nível', () => {
    const e = criarEmissor();
    e.linha('inicio');
    e.entrar();
    e.linha('escreva("a")');
    e.entrar();
    e.linha('leia(x)');
    e.sair();
    e.sair();
    e.linha('fim_algoritmo');
    expect(e.texto()).toBe('inicio\n    escreva("a")\n        leia(x)\nfim_algoritmo\n');
  });

  it('informa o nível atual', () => {
    const e = criarEmissor();
    expect(e.nivel).toBe(0);
    e.entrar();
    expect(e.nivel).toBe(1);
  });

  it('não deixa o nível ficar negativo', () => {
    const e = criarEmissor();
    expect(() => e.sair()).toThrow();
  });

  it('linha em branco não tem espaços, mesmo indentada', () => {
    const e = criarEmissor();
    e.entrar();
    e.linhaEmBranco();
    e.linha('x');
    expect(e.texto()).toBe('\n    x\n');
  });

  it('termina com exatamente um \\n, sem tab, \\r nem espaço no fim', () => {
    const e = criarEmissor();
    e.linha('a   ');
    e.entrar();
    e.linha('b\t');
    const texto = e.texto();
    expect(texto.endsWith('\n')).toBe(true);
    expect(texto.endsWith('\n\n')).toBe(false);
    expect(texto).not.toMatch(/\t|\r/);
    expect(texto).not.toMatch(/ +$/m);
  });

  it('sem linhas devolve só a quebra final', () => {
    expect(criarEmissor().texto()).toBe('\n');
  });
});
