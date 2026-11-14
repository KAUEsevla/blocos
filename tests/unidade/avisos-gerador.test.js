import { describe, it, expect } from 'vitest';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

const registro = criarRegistroTeste();
const gerar = (opcoes) => gerarPortugol(projetoDeTeste(opcoes), registro);
const variaveis = [{ id: 'v1', nome: 'idade', tipo: 'inteiro' }];

describe('blocos incompletos geram aviso e marcador (RF-08, FR-005)', () => {
  it('se sem condição: marcador no lugar e aviso em pt-BR (cenário 1)', () => {
    const se = bloco('teste_se', { id: 'se1', entradas: { CORPO: [bloco('teste_comando')] } });
    const { codigo, avisos } = gerar({ comandos: [se] });
    expect(codigo).toContain('    se ??? entao\n        escreva("x")\n    fim_se\n');
    expect(avisos).toEqual([
      { blocoId: 'se1', tipoBloco: 'teste_se', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco se' },
    ]);
  });

  it('se com condição não gera aviso', () => {
    const se = bloco('teste_se', { entradas: { CONDICAO: bloco('teste_valor') } });
    const { codigo, avisos } = gerar({ comandos: [se] });
    expect(codigo).toContain('    se 1 entao\n');
    expect(avisos).toEqual([]);
  });

  it('leia sem variável ou com variável inexistente gera aviso', () => {
    const semVariavel = bloco('teste_leia', { id: 'l1' });
    const inexistente = bloco('teste_leia', { id: 'l2', campos: { VAR: { id: 'nao-existe' } } });
    const { codigo, avisos } = gerar({ variaveis, comandos: [semVariavel, inexistente] });
    expect(codigo).toContain('    leia(???)\n    leia(???)\n');
    expect(avisos.map((a) => [a.blocoId, a.encaixe, a.mensagem])).toEqual([
      ['l1', 'VAR', 'Falta a variável do bloco leia'],
      ['l2', 'VAR', 'Falta a variável do bloco leia'],
    ]);
  });

  it('leia com variável existente usa o nome', () => {
    const leia = bloco('teste_leia', { campos: { VAR: { id: 'v1' } } });
    expect(gerar({ variaveis, comandos: [leia] })).toMatchObject({ avisos: [] });
    expect(gerar({ variaveis, comandos: [leia] }).codigo).toContain('    leia(idade)\n');
  });

  it('vários avisos saem na ordem em que aparecem no texto', () => {
    const comandos = [
      bloco('teste_leia', { id: 'a' }),
      bloco('teste_bloco', { entradas: { CORPO: [bloco('teste_se', { id: 'b' })] } }),
      bloco('teste_se', { id: 'c' }),
    ];
    expect(gerar({ comandos }).avisos.map((a) => a.blocoId)).toEqual(['a', 'b', 'c']);
  });

  it('bloco incompleto solto, fora do programa, não gera aviso', () => {
    const { codigo, avisos } = gerar({ soltos: [bloco('teste_se'), bloco('teste_leia')] });
    expect(avisos).toEqual([]);
    expect(codigo).not.toContain('???');
  });

  it('com aviso o código contém ???; sem aviso, não contém', () => {
    const incompleto = gerar({ comandos: [bloco('teste_se')] });
    const completo = gerar({ comandos: [bloco('teste_se', { entradas: { CONDICAO: bloco('teste_valor') } })] });
    expect(incompleto.avisos.length).toBeGreaterThan(0);
    expect(incompleto.codigo).toContain('???');
    expect(completo.avisos).toEqual([]);
    expect(completo.codigo).not.toContain('???');
  });

  it('ctx.aviso registra mensagem própria', () => {
    const r = criarRegistroTeste();
    r.registrarBloco({
      tipo: 'teste_passo',
      rotulo: 'para',
      categoria: 'comando',
      definicao: { type: 'teste_passo' },
      gerar: (b, ctx) => {
        ctx.aviso(b, 'PASSO', 'O passo do bloco para não pode ser 0');
        ctx.linha('passo');
      },
    });
    const { avisos } = gerarPortugol(projetoDeTeste({ comandos: [bloco('teste_passo', { id: 'p' })] }), r);
    expect(avisos).toEqual([
      { blocoId: 'p', tipoBloco: 'teste_passo', encaixe: 'PASSO', mensagem: 'O passo do bloco para não pode ser 0' },
    ]);
  });

  it('valor de tipo desconhecido num encaixe gera aviso de bloco desconhecido', () => {
    const se = bloco('teste_se', { entradas: { CONDICAO: bloco('estranho', { id: 'e1' }) } });
    const { codigo, avisos } = gerar({ comandos: [se] });
    expect(codigo).toContain('se ??? entao');
    expect(avisos).toEqual([{ blocoId: 'e1', tipoBloco: 'estranho', encaixe: null, mensagem: 'Bloco desconhecido: estranho' }]);
  });

  it('ctx.campo devolve o valor bruto do campo', () => {
    const r = criarRegistroTeste();
    r.registrarBloco({
      tipo: 'teste_campo',
      rotulo: 'campo',
      categoria: 'comando',
      definicao: { type: 'teste_campo' },
      gerar: (b, ctx) => ctx.linha(`escreva("${ctx.campo(b, 'TEXTO')}")`),
    });
    const projeto = projetoDeTeste({ comandos: [bloco('teste_campo', { campos: { TEXTO: 'oi' } })] });
    expect(gerarPortugol(projeto, r).codigo).toContain('    escreva("oi")\n');
  });
});
