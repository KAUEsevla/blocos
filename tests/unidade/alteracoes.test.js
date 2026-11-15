import { describe, it, expect } from 'vitest';
import { assinaturaProjeto, haAlteracoes } from '../../src/projeto/alteracoes.js';
import { projetoVazio } from '../../src/projeto/formato.js';

// Alterações não salvas (spec 001, FR-007; contracts/alteracoes.md; research R-05).

function comBloco(projeto, bloco) {
  const p = structuredClone(projeto);
  p.blocos.blocks.blocks.push(bloco);
  return p;
}

function inverterChaves(valor) {
  if (Array.isArray(valor)) return valor.map(inverterChaves);
  if (valor === null || typeof valor !== 'object') return valor;
  return Object.fromEntries(
    Object.keys(valor)
      .reverse()
      .map((k) => [k, inverterChaves(valor[k])]),
  );
}

describe('assinaturaProjeto (RF-01)', () => {
  it('não depende da ordem das chaves, em nenhum nível', () => {
    const p = comBloco(projetoVazio(), { type: 'x', id: 'b2', x: 1, y: 2, fields: { A: 1, B: 2 } });
    expect(assinaturaProjeto(inverterChaves(p))).toBe(assinaturaProjeto(p));
  });

  it('muda quando o nome muda', () => {
    const p = projetoVazio();
    expect(assinaturaProjeto({ ...p, nome: 'Soma' })).not.toBe(assinaturaProjeto(p));
  });

  it('muda com variável a mais ou com tipo diferente', () => {
    const base = { ...projetoVazio(), variaveis: [{ id: 'v1', nome: 'n', tipo: 'inteiro' }] };
    const aMais = { ...base, variaveis: [...base.variaveis, { id: 'v2', nome: 'm', tipo: 'real' }] };
    const outroTipo = { ...base, variaveis: [{ id: 'v1', nome: 'n', tipo: 'real' }] };
    expect(assinaturaProjeto(aMais)).not.toBe(assinaturaProjeto(base));
    expect(assinaturaProjeto(outroTipo)).not.toBe(assinaturaProjeto(base));
  });

  it('muda com bloco a mais ou com posição diferente', () => {
    const p = projetoVazio();
    const aMais = comBloco(p, { type: 'x', id: 'b2', x: 0, y: 0 });
    const movido = structuredClone(p);
    movido.blocos.blocks.blocks[0].x += 10;
    expect(assinaturaProjeto(aMais)).not.toBe(assinaturaProjeto(p));
    expect(assinaturaProjeto(movido)).not.toBe(assinaturaProjeto(p));
  });

  it('preserva a ordem dos arrays', () => {
    const p = comBloco(comBloco(projetoVazio(), { type: 'a', id: 'a' }), { type: 'b', id: 'b' });
    const trocado = structuredClone(p);
    const blocos = trocado.blocos.blocks.blocks;
    [blocos[1], blocos[2]] = [blocos[2], blocos[1]];
    expect(assinaturaProjeto(trocado)).not.toBe(assinaturaProjeto(p));
  });

  it('ignora formato e versao', () => {
    const p = projetoVazio();
    expect(assinaturaProjeto({ ...p, formato: 'outro', versao: 99 })).toBe(assinaturaProjeto(p));
  });

  it('campos ausentes equivalem a valores neutros', () => {
    expect(assinaturaProjeto({})).toBe(assinaturaProjeto({ nome: '', variaveis: [], blocos: {} }));
  });

  it('não modifica o projeto recebido', () => {
    const p = comBloco(projetoVazio(), { type: 'x', id: 'b2', fields: { Z: 1, A: 2 } });
    const antes = JSON.stringify(p);
    assinaturaProjeto(p);
    expect(JSON.stringify(p)).toBe(antes);
  });
});

describe('haAlteracoes (RF-01)', () => {
  it('é false contra a própria assinatura', () => {
    const p = projetoVazio();
    expect(haAlteracoes(p, assinaturaProjeto(p))).toBe(false);
  });

  it('é true quando o projeto mudou depois da referência', () => {
    const p1 = projetoVazio();
    const p2 = { ...p1, nome: 'Outro' };
    expect(haAlteracoes(p2, assinaturaProjeto(p1))).toBe(true);
  });
});
