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
import { projetoCompleto, projetoCemBlocos, todosOsBlocos } from '../auxiliares/projetos-carregar.js';

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

