import { describe, it, expect } from 'vitest';
import { FORMATO, VERSAO_FORMATO, TIPOS_VARIAVEL, projetoVazio } from '../../src/projeto/formato.js';

describe('formato do arquivo de projeto v1 (RF-08, RF-11)', () => {
  it('define as constantes do formato', () => {
    expect(FORMATO).toBe('meupia-blocos');
    expect(VERSAO_FORMATO).toBe(1);
    expect(TIPOS_VARIAVEL).toEqual(['inteiro', 'real', 'cadeia', 'logico']);
  });

  it('projetoVazio tem só o bloco programa e nenhuma variável', () => {
    const p = projetoVazio();
    expect(p).toMatchObject({ formato: 'meupia-blocos', versao: 1, nome: 'MeuPrograma', variaveis: [] });
    expect(p.blocos.blocks.blocks).toHaveLength(1);
    expect(p.blocos.blocks.blocks[0].type).toBe('programa');
    expect(p.blocos).not.toHaveProperty('variables');
  });

  it('cada chamada devolve um objeto independente', () => {
    const a = projetoVazio();
    const b = projetoVazio();
    expect(a).toEqual(b);
    a.variaveis.push({ id: 'v', nome: 'x', tipo: 'inteiro' });
    a.blocos.blocks.blocks[0].x = 999;
    expect(b.variaveis).toEqual([]);
    expect(b.blocos.blocks.blocks[0].x).toBe(24);
  });
});
