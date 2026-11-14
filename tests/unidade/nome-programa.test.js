import { describe, it, expect } from 'vitest';
import { sanearNomePrograma } from '../../src/portugol/nome-programa.js';

describe('sanearNomePrograma (RF-08, FR-007)', () => {
  it.each([undefined, null, '', '   '])('%j vira MeuPrograma', (nome) => {
    expect(sanearNomePrograma(nome)).toBe('MeuPrograma');
  });

  it('remove aspas e barra invertida', () => {
    expect(sanearNomePrograma('Meu "Jogo"')).toBe('Meu Jogo');
    expect(sanearNomePrograma('a\\b')).toBe('ab');
  });

  it('remove quebras de linha, tabulação e outros caracteres de controle', () => {
    expect(sanearNomePrograma('Meu\nPro\rgra\tma\u0000\u007f')).toBe('MeuPrograma');
  });

  it('tira espaços das pontas', () => {
    expect(sanearNomePrograma('  Calculadora  ')).toBe('Calculadora');
  });

  it('corta em 40 caracteres sem partir acentos e tira o espaço final', () => {
    const nome = `${'a'.repeat(39)}çã`;
    const saneado = sanearNomePrograma(nome);
    expect(Array.from(saneado)).toHaveLength(40);
    expect(saneado.endsWith('ç')).toBe(true);
    expect(sanearNomePrograma(`${'a'.repeat(39)} xyz`)).toBe('a'.repeat(39));
  });

  it('normaliza acentos decompostos antes de cortar', () => {
    const decomposto = `${'a'.repeat(39)}ç`; // "ç" como c + cedilha combinante
    expect(sanearNomePrograma(decomposto)).toBe(`${'a'.repeat(39)}ç`);
  });

  it('um nome só com caracteres removidos vira MeuPrograma', () => {
    expect(sanearNomePrograma('"\\"')).toBe('MeuPrograma');
  });

  it('mantém nomes válidos como estão', () => {
    expect(sanearNomePrograma('Média da turma 2')).toBe('Média da turma 2');
  });
});
