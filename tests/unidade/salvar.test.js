// Núcleo do Salvar (RF-11; spec 011, contracts/salvar.md; research R-05, R-07).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nomeArquivo, prepararSalvamento } from '../../src/projeto/salvar.js';
import { textoArquivo, projetoVazio } from '../../src/projeto/formato.js';
import { assinaturaProjeto, haAlteracoes } from '../../src/projeto/alteracoes.js';

const RAIZ = join(import.meta.dirname, '..', '..');

describe('nomeArquivo (FR-003)', () => {
  it.each([
    ['Media', 'Media.json'],
    ['  Media  ', 'Media.json'],
    ['Média final', 'Média final.json'],
    ['a/b\\c:d*e?f"g<h>i|j', 'a_b_c_d_e_f_g_h_i_j.json'],
    ['a\tb', 'a_b.json'],
    ['a\u007fb', 'a_b.json'],
    ['a\u0000b', 'a_b.json'],
    ['', 'MeuPrograma.json'],
    ['   ', 'MeuPrograma.json'],
    [undefined, 'MeuPrograma.json'],
    [null, 'MeuPrograma.json'],
  ])('%j → %s', (entrada, esperado) => {
    expect(nomeArquivo(entrada)).toBe(esperado);
  });
});

function projetoExemplo() {
  const p = projetoVazio();
  p.nome = 'Media';
  p.variaveis = [{ id: 'v-n', nome: 'nota', tipo: 'real' }];
  p.blocos.blocks.blocks[0].inputs = {
    COMANDOS: { block: { type: 'leia', id: 'b1', fields: { VAR: { id: 'v-n' } } } },
  };
  return p;
}

// n comandos escreva encadeados no programa.
function projetoComBlocos(n) {
  const p = projetoVazio();
  let primeiro;
  for (let i = n - 1; i >= 0; i -= 1) {
    const bloco = {
      type: 'escreva',
      id: `e${i}`,
      extraState: { valores: 1 },
      inputs: { VALOR1: { block: { type: 'numero', id: `n${i}`, fields: { NUM: i } } } },
    };
    if (primeiro) bloco.next = { block: primeiro };
    primeiro = bloco;
  }
  p.blocos.blocks.blocks[0].inputs = { COMANDOS: { block: primeiro } };
  return p;
}

describe('prepararSalvamento (FR-001, FR-005; 001 FR-007)', () => {
  it('devolve nome do arquivo, texto e referência', () => {
    const p = projetoExemplo();
    const salvo = prepararSalvamento(p);
    expect(Object.keys(salvo).sort()).toEqual(['nomeArquivo', 'referencia', 'texto']);
    expect(salvo.nomeArquivo).toBe('Media.json');
    expect(salvo.texto).toBe(textoArquivo(p));
    expect(salvo.referencia).toBe(assinaturaProjeto(p));
  });

  it('depois de salvar, o projeto está sem alterações, inclusive lido de volta do arquivo', () => {
    const p = projetoExemplo();
    const { texto, referencia } = prepararSalvamento(p);
    expect(haAlteracoes(p, referencia)).toBe(false);
    expect(assinaturaProjeto(JSON.parse(texto))).toBe(referencia);
    p.nome = 'Outro';
    expect(haAlteracoes(p, referencia)).toBe(true);
  });

  it('não altera o projeto', () => {
    const p = projetoExemplo();
    p.blocos.variables = [{ id: 'v-n', name: 'nota', type: 'real' }];
    const antes = JSON.stringify(p);
    prepararSalvamento(p);
    expect(JSON.stringify(p)).toBe(antes);
  });

  it('salva em menos de 1 s com 100 blocos (SC-002)', () => {
    const p = projetoComBlocos(100);
    const inicio = performance.now();
    const { texto } = prepararSalvamento(p);
    expect(performance.now() - inicio).toBeLessThan(1000);
    expect(texto.match(/"type": "escreva"/g)).toHaveLength(100);
  });
});

describe('sem servidor (FR-004)', () => {
  const CHAMADAS_DE_REDE = [/\bfetch\s*\(/, /new\s+XMLHttpRequest\s*\(/, /sendBeacon\s*\(/, /new\s+WebSocket\s*\(/];

  it.each(['src/projeto/salvar.js', 'src/ui/download.js'])('%s não faz chamadas de rede', (arquivo) => {
    const codigo = readFileSync(join(RAIZ, arquivo), 'utf8');
    for (const chamada of CHAMADAS_DE_REDE) expect(codigo, String(chamada)).not.toMatch(chamada);
  });
});
