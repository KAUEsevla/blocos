import { describe, it, expect } from 'vitest';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

const registro = criarRegistroTeste();
const gerar = (projeto) => gerarPortugol(projeto, registro);

function aninhar(niveis) {
  let atual = bloco('teste_comando');
  for (let i = 0; i < niveis; i++) atual = bloco('teste_bloco', { entradas: { CORPO: [atual] } });
  return atual;
}

describe('gerarPortugol: estrutura (RF-08, FR-001..FR-004)', () => {
  it('projeto novo gera exatamente o texto do cenário 1', () => {
    expect(gerarPortugol(projetoVazio())).toEqual({
      codigo: 'algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n',
      avisos: [],
    });
  });

  it('segue a ordem algoritmo, branco, var, branco, inicio, comandos, fim_algoritmo (cenário 2)', () => {
    const projeto = projetoDeTeste({
      nome: 'Teste',
      variaveis: [{ id: 'v1', nome: 'idade', tipo: 'inteiro' }],
      comandos: [bloco('teste_comando'), bloco('teste_comando')],
    });
    expect(gerar(projeto).codigo).toBe(
      'algoritmo "Teste"\n\nvar\n    idade: inteiro\n\ninicio\n    escreva("x")\n    escreva("x")\nfim_algoritmo\n',
    );
  });

  it('cada nível de encaixe aumenta a indentação em 4 espaços (cenário 3)', () => {
    const { codigo } = gerar(projetoDeTeste({ comandos: [aninhar(6)] }));
    const linhas = codigo.split('\n');
    for (let nivel = 1; nivel <= 6; nivel++) {
      expect(linhas[nivel + 2]).toBe(`${'    '.repeat(nivel)}se verdadeiro entao`);
    }
    expect(linhas[9]).toBe(`${'    '.repeat(7)}escreva("x")`);
    expect(codigo).not.toMatch(/\t/);
    expect(codigo).not.toMatch(/ +$/m);
  });

  it('área de comandos vazia é permitida', () => {
    expect(gerar(projetoDeTeste({ comandos: [bloco('teste_bloco')] })).codigo).toContain(
      '    se verdadeiro entao\n    fim_se\n',
    );
  });

  it('ignora blocos soltos fora do programa', () => {
    const projeto = projetoDeTeste({ soltos: [bloco('teste_comando'), bloco('teste_bloco')] });
    expect(gerar(projeto).codigo).toBe('algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n');
  });

  it('sem bloco programa ou sem blocos, gera o programa sem comandos', () => {
    const vazio = 'algoritmo "X"\n\ninicio\nfim_algoritmo\n';
    expect(gerar({ nome: 'X', variaveis: [], blocos: {} }).codigo).toBe(vazio);
    expect(gerar({ nome: 'X', variaveis: [] }).codigo).toBe(vazio);
    expect(gerar({ nome: 'X', blocos: { blocks: { blocks: [bloco('teste_comando')] } } }).codigo).toBe(vazio);
    expect(gerar(undefined).codigo).toBe('algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n');
  });

  it('com dois blocos programa, usa o primeiro da serialização', () => {
    const projeto = projetoDeTeste({ comandos: [bloco('teste_comando')] });
    projeto.blocos.blocks.blocks.push(
      bloco('programa', { entradas: { COMANDOS: [bloco('teste_bloco'), bloco('teste_bloco')] } }),
    );
    expect(gerar(projeto).codigo).toBe('algoritmo "MeuPrograma"\n\ninicio\n    escreva("x")\nfim_algoritmo\n');
  });

  it('tipo de bloco desconhecido gera aviso e marcador', () => {
    const estranho = bloco('nao_existe', { id: 'z1' });
    const { codigo, avisos } = gerar(projetoDeTeste({ comandos: [estranho] }));
    expect(codigo).toContain('    ???\n');
    expect(avisos).toEqual([
      { blocoId: 'z1', tipoBloco: 'nao_existe', encaixe: null, mensagem: 'Bloco desconhecido: nao_existe' },
    ]);
  });

  it('bloco de valor numa área de comandos é tratado como desconhecido', () => {
    const { avisos } = gerar(projetoDeTeste({ comandos: [bloco('teste_valor')] }));
    expect(avisos[0].mensagem).toBe('Bloco desconhecido: teste_valor');
  });

  it('usa só projeto.variaveis e ignora blocos.variables', () => {
    const projeto = projetoDeTeste({ variaveis: [{ id: 'v1', nome: 'certa', tipo: 'real' }] });
    projeto.blocos.variables = [{ id: 'v2', name: 'errada', type: 'inteiro' }];
    const { codigo } = gerar(projeto);
    expect(codigo).toContain('    certa: real\n');
    expect(codigo).not.toContain('errada');
  });

  it('não altera o projeto recebido', () => {
    const projeto = projetoDeTeste({
      variaveis: [{ id: 'v1', nome: 'n', tipo: 'inteiro' }],
      comandos: [aninhar(3), bloco('nao_existe')],
      soltos: [bloco('teste_comando')],
    });
    const antes = structuredClone(projeto);
    gerar(projeto);
    expect(projeto).toEqual(antes);
  });

  it('gera um programa de 100 blocos rapidamente', () => {
    const comandos = Array.from({ length: 100 }, () => bloco('teste_comando'));
    const inicio = process.hrtime.bigint();
    const { codigo } = gerar(projetoDeTeste({ comandos }));
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    expect(codigo.match(/escreva/g)).toHaveLength(100);
    expect(ms).toBeLessThan(500);
  });
});
