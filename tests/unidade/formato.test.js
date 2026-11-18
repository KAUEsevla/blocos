import { describe, it, expect } from 'vitest';
import {
  FORMATO,
  VERSAO_FORMATO,
  TIPOS_VARIAVEL,
  projetoVazio,
  montarArquivo,
  textoArquivo,
} from '../../src/projeto/formato.js';

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

// Spec 011 (contracts/salvar.md): o arquivo v1 escrito pelo Salvar.
describe('montarArquivo e textoArquivo (RF-11)', () => {
  const comVariaveis = () => ({
    ...projetoVazio(),
    nome: 'Média',
    variaveis: [
      { id: 'v-b', nome: 'b', tipo: 'inteiro', extra: 1 },
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
    ],
  });

  it('chaves na ordem formato, versao, nome, variaveis, blocos', () => {
    const arquivo = montarArquivo(projetoVazio());
    expect(Object.keys(arquivo)).toEqual(['formato', 'versao', 'nome', 'variaveis', 'blocos']);
    expect(arquivo).toEqual(projetoVazio());
  });

  it('formato e versao vêm sempre das constantes', () => {
    const arquivo = montarArquivo({ ...projetoVazio(), formato: 'x', versao: 9 });
    expect(arquivo.formato).toBe(FORMATO);
    expect(arquivo.versao).toBe(VERSAO_FORMATO);
  });

  it('campos ausentes viram valores neutros', () => {
    expect(montarArquivo({})).toEqual({ formato: FORMATO, versao: VERSAO_FORMATO, nome: '', variaveis: [], blocos: {} });
    expect(montarArquivo()).toEqual({ formato: FORMATO, versao: VERSAO_FORMATO, nome: '', variaveis: [], blocos: {} });
  });

  it('tira blocos.variables', () => {
    const p = projetoVazio();
    p.blocos.variables = [{ id: 'v', name: 'x', type: 'inteiro' }];
    expect(montarArquivo(p).blocos).not.toHaveProperty('variables');
    expect(p.blocos).toHaveProperty('variables');
  });

  it('variáveis só com id, nome e tipo, na ordem recebida', () => {
    expect(montarArquivo(comVariaveis()).variaveis).toEqual([
      { id: 'v-b', nome: 'b', tipo: 'inteiro' },
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
    ]);
  });

  it('o resultado não compartilha objetos com o projeto', () => {
    const p = comVariaveis();
    const antes = JSON.stringify(p);
    const arquivo = montarArquivo(p);
    arquivo.variaveis[0].nome = 'z';
    arquivo.blocos.blocks.blocks[0].x = 999;
    expect(JSON.stringify(p)).toBe(antes);
  });

  it('preserva o extraState do escreva e do se, e o se sem senão continua sem', () => {
    const p = projetoVazio();
    p.blocos.blocks.blocks[0].inputs = {
      COMANDOS: {
        block: {
          type: 'escreva',
          id: 'e',
          extraState: { valores: 3 },
          next: {
            block: {
              type: 'se',
              id: 's1',
              extraState: { senao: true },
              next: { block: { type: 'se', id: 's2' } },
            },
          },
        },
      },
    };
    const texto = textoArquivo(p);
    const lido = JSON.parse(texto);
    const escreva = lido.blocos.blocks.blocks[0].inputs.COMANDOS.block;
    expect(escreva.extraState).toEqual({ valores: 3 });
    expect(escreva.next.block.extraState).toEqual({ senao: true });
    expect(escreva.next.block.next.block).not.toHaveProperty('extraState');
  });

  it('textoArquivo: JSON com 2 espaços, quebra de linha final, acentos legíveis e determinístico', () => {
    const p = comVariaveis();
    const texto = textoArquivo(p);
    expect(texto).toBe(JSON.stringify(montarArquivo(p), null, 2) + '\n');
    expect(texto.startsWith('{\n  "formato": "meupia-blocos",\n  "versao": 1,\n  "nome": "Média",')).toBe(true);
    expect(texto).toContain('"nome": "Média"');
    expect(texto).not.toContain('\\u');
    expect(textoArquivo(p)).toBe(texto);
  });
});
