// Carregar no Blockly 12.5.1 headless (RF-12; spec 012, research R-03, R-10). O arquivo salvo
// pelo editor volta idêntico e "sem alterações"; arquivos inválidos não mexem no projeto aberto.
import { describe, it, expect } from 'vitest';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { projetoVazio, textoArquivo } from '../../src/projeto/formato.js';
import { assinaturaProjeto } from '../../src/projeto/alteracoes.js';
import { prepararCarregamento } from '../../src/projeto/carregar.js';
import {
  carregarNoWorkspace,
  projetoDoWorkspace,
  salvarELer,
  ensaiarNoWorkspace,
} from '../auxiliares/salvar-blockly.js';
import { projetoCompleto, projetoCemBlocos, todosOsBlocos, encadear } from '../auxiliares/projetos-carregar.js';

const porId = (blocos, id) => todosOsBlocos(blocos).find((b) => b.id === id);
const topos = (blocos) => blocos.blocks.blocks.map(({ id, x, y }) => ({ id, x, y }));

describe('Carregar: salvo → carregado no Blockly (FR-003, SC-001)', () => {
  const base = projetoCompleto();
  const ws = carregarNoWorkspace(base);
  const { projeto, salvo } = salvarELer(ws, { ...projetoVazio(), nome: base.nome });
  const preparado = prepararCarregamento(salvo.texto);
  const novo = carregarNoWorkspace(preparado.projeto);
  const deNovo = projetoDoWorkspace(novo, { ...projetoVazio(), nome: preparado.projeto.nome });

  it('o arquivo é aceito e passa no ensaio', () => {
    expect(preparado.ok, preparado.mensagem).toBe(true);
    expect(ensaiarNoWorkspace(preparado.projeto)).toEqual({ ok: true });
  });

  it('nome, variáveis, blocos e posições voltam iguais', () => {
    expect(deNovo.nome).toBe('  Média "final"  ');
    expect(deNovo.variaveis).toEqual(projeto.variaveis);
    expect(deNovo.blocos).toEqual(projeto.blocos);
    expect(topos(deNovo.blocos)).toEqual(topos(projeto.blocos));
    expect(porId(deNovo.blocos, 'se-sem-senao')).not.toHaveProperty('extraState');
  });

  it('o Portugol é idêntico', () => {
    expect(gerarPortugol(deNovo)).toEqual(gerarPortugol(projeto));
  });

  it('carregar deixa o projeto sem alterações (Premissas)', () => {
    expect(assinaturaProjeto(deNovo)).toBe(salvo.referencia);
  });
});

describe('Carregar 100 blocos de ponta a ponta (SC-003)', () => {
  it('validação + ensaio + carga em menos de 2 s', () => {
    const ws = carregarNoWorkspace(projetoCemBlocos());
    const { salvo } = salvarELer(ws, projetoVazio());
    ws.dispose();
    const inicio = performance.now();
    const preparado = prepararCarregamento(salvo.texto);
    const ensaio = ensaiarNoWorkspace(preparado.projeto);
    const final = carregarNoWorkspace(preparado.projeto);
    const tempo = performance.now() - inicio;
    expect(preparado.ok).toBe(true);
    expect(ensaio.ok).toBe(true);
    expect(final.getAllBlocks(false).length).toBe(101);
    expect(tempo).toBeLessThan(2000);
    final.dispose();
  });
});

describe('textoArquivo do projeto completo passa direto (sem Blockly)', () => {
  it('é aceito e passa no ensaio', () => {
    const r = prepararCarregamento(textoArquivo(projetoCompleto()));
    expect(r.ok).toBe(true);
    expect(ensaiarNoWorkspace(r.projeto)).toEqual({ ok: true });
  });
});


// História 2 (T012): os arquivos da sondagem do research R-03 não mexem no projeto aberto.
describe('Carregar: arquivo inválido não muda o projeto aberto (FR-004, SC-002)', () => {
  const prog = (inner) => ({
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'programa', id: 'programa', x: 0, y: 0, deletable: false, inputs: { COMANDOS: { block: inner } } }],
    },
  });
  const INTEIRA = [{ id: 'v1', nome: 'n', tipo: 'inteiro' }];
  const arquivo = ({ variaveis, blocos }) => JSON.stringify({ ...projetoVazio(), variaveis, blocos });
  const encaixeLogico = {
    variaveis: INTEIRA,
    blocos: prog({
      type: 'variavel_recebe',
      id: 'a',
      fields: { VAR: { id: 'v1' } },
      inputs: { VALOR: { block: { type: 'logico', id: 'b', fields: { VALOR: 'verdadeiro' } } } },
    }),
  };
  const encaixeFoo = { variaveis: [], blocos: prog({ type: 'leia', id: 'a', inputs: { FOO: { block: { type: 'numero', id: 'n', fields: { NUM: '1' } } } } }) };
  const tipoXyz = { variaveis: [], blocos: prog({ type: 'xyz', id: 'a' }) };
  const invalidos = [
    ['tipo xyz', arquivo(tipoXyz)],
    ['encaixe lógico em recebe inteiro', arquivo(encaixeLogico)],
    ['encaixe FOO', arquivo(encaixeFoo)],
    ['VAR inexistente', arquivo({ variaveis: [], blocos: prog({ type: 'leia', id: 'a', fields: { VAR: { id: 'zz' } } }) })],
    ['escreva com 99 valores', arquivo({ variaveis: [], blocos: prog({ type: 'escreva', id: 'a', extraState: { valores: 99 } }) })],
    ['sem programa', arquivo({ variaveis: [], blocos: { blocks: { languageVersion: 0, blocks: [{ type: 'numero', id: 'n', x: 0, y: 0, fields: { NUM: '1' } }] } } })],
    ['ids repetidos', arquivo({ variaveis: [], blocos: prog(encadear({ type: 'leia', id: 'a' }, { type: 'leia', id: 'a' })) })],
    [
      'NUM abc',
      arquivo({
        variaveis: [],
        blocos: prog({ type: 'escreva', id: 'e', extraState: { valores: 1 }, inputs: { VALOR1: { block: { type: 'numero', id: 'n', fields: { NUM: 'abc' } } } } }),
      }),
    ],
    ['texto que não é JSON', 'isto não é um projeto'],
    ['JSON de outro programa', JSON.stringify({ nome: 'x', blocos: [] })],
    ['versão 2', JSON.stringify({ ...projetoVazio(), versao: 2 })],
  ];

  const retrato = (ws, base) => ({
    assinatura: assinaturaProjeto(projetoDoWorkspace(ws, base)),
    desfazer: ws.getUndoStack().length,
    blocos: ws.getAllBlocks(false).length,
  });

  it.each(invalidos)('%s: recusado e o workspace aberto fica igual', (_, texto) => {
    const aberto = carregarNoWorkspace(projetoCompleto());
    aberto.getBlockById('n1').getField('NUM').setValue('5');
    const base = { ...projetoVazio(), nome: 'aberto' };
    const antes = retrato(aberto, base);

    const r = prepararCarregamento(texto);
    expect(r.ok).toBe(false);
    expect(r.mensagem).toMatch(/^Este (arquivo|projeto)/);

    expect(retrato(aberto, base)).toEqual(antes);
    aberto.dispose();
  });

  it('o ensaio classifica os erros reais do Blockly (BadConnectionCheck da 006)', () => {
    expect(ensaiarNoWorkspace(encaixeLogico)).toEqual({ ok: false, erro: 'encaixe' });
    expect(ensaiarNoWorkspace(encaixeFoo)).toEqual({ ok: false, erro: 'encaixe' });
    expect(ensaiarNoWorkspace(tipoXyz)).toEqual({ ok: false, erro: 'desconhecido' });
  });

  it('todo arquivo aceito passa no ensaio', () => {
    for (const p of [projetoVazio(), projetoCompleto(), projetoCemBlocos()]) {
      const r = prepararCarregamento(textoArquivo(p));
      expect(r.ok).toBe(true);
      expect(ensaiarNoWorkspace(r.projeto)).toEqual({ ok: true });
    }
  });
});
