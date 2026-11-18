// Núcleo do Carregar (RF-12; spec 012, contracts/carregar.md; research R-04 a R-06, R-09).
import { describe, it, expect } from 'vitest';
import { registroPadrao } from '../../src/blocos/registro.js';
import { temSenao } from '../../src/blocos/decisao.js';
import { projetoVazio, textoArquivo } from '../../src/projeto/formato.js';
import { assinaturaProjeto } from '../../src/projeto/alteracoes.js';
import {
  prepararCarregamento,
  mensagemRecusa,
  validarBlocos,
  classificarErroCarga,
} from '../../src/projeto/carregar.js';
import { projetoCompleto, projetoCemBlocos, todosOsBlocos } from '../auxiliares/projetos-carregar.js';

const porId = (projeto, id) => todosOsBlocos(projeto.blocos).find((b) => b.id === id);

describe('Carregar: arquivos aceitos (FR-002, FR-003)', () => {
  it('o projeto completo tem todos os tipos registrados', () => {
    const tipos = new Set(todosOsBlocos(projetoCompleto().blocos).map((b) => b.type));
    const faltando = registroPadrao.tiposRegistrados().filter((t) => !tipos.has(t));
    expect(faltando, 'tipos sem lugar no teste do Carregar').toEqual([]);
  });

  it.each([
    ['projeto vazio', projetoVazio],
    ['projeto completo', projetoCompleto],
  ])('%s: aceito com a mesma assinatura', (_, criar) => {
    const p = criar();
    const r = prepararCarregamento(textoArquivo(p));
    expect(r.ok, r.mensagem).toBe(true);
    expect(assinaturaProjeto(r.projeto)).toBe(assinaturaProjeto(p));
  });

  it('se sem extraState é aceito como senão desligado; senão true e false também', () => {
    const { projeto } = prepararCarregamento(textoArquivo(projetoCompleto()));
    const semSenao = porId(projeto, 'se-sem-senao');
    expect(semSenao).not.toHaveProperty('extraState');
    expect(temSenao(semSenao)).toBe(false);
    expect(temSenao(porId(projeto, 'se-com-senao'))).toBe(true);
    expect(temSenao(porId(projeto, 'se-senao-falso'))).toBe(false);
  });

  it('encaixes vazios, VAR ausente ou null e blocos soltos são aceitos', () => {
    const { projeto } = prepararCarregamento(textoArquivo(projetoCompleto()));
    expect(porId(projeto, 'recebe-vazio')).not.toHaveProperty('inputs');
    expect(porId(projeto, 'leia-null').fields.VAR).toBeNull();
    expect(projeto.blocos.blocks.blocks[1]).toMatchObject({ id: 'solto', x: 400, y: 300 });
  });

  it('o nome volta exatamente como foi digitado', () => {
    expect(prepararCarregamento(textoArquivo(projetoCompleto())).projeto.nome).toBe('  Média "final"  ');
  });

  it('números escritos à mão ("007", "3,5") são aceitos', () => {
    const p = projetoCompleto();
    porId(p, 'n1').fields.NUM = '007';
    porId(p, 'n2').fields.NUM = '3,5';
    expect(prepararCarregamento(textoArquivo(p)).ok).toBe(true);
  });

  it('validarBlocos aceita o projeto completo', () => {
    expect(validarBlocos(projetoCompleto())).toEqual({ ok: true });
  });

  it('100 blocos em menos de 2 s (SC-003)', () => {
    const texto = textoArquivo(projetoCemBlocos());
    const inicio = performance.now();
    const r = prepararCarregamento(texto);
    expect(performance.now() - inicio).toBeLessThan(2000);
    expect(r.ok).toBe(true);
  });
});

describe('Carregar: mensagens de recusa (FR-004)', () => {
  it.each([
    [{ motivo: 'nao-e-projeto' }, 'Este arquivo não é um projeto do meuPiá Blocos.'],
    [{ motivo: 'versao-nova' }, 'Este projeto foi salvo numa versão mais nova do meuPiá Blocos.'],
    [{ motivo: 'grande-demais' }, 'Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB).'],
    [
      { motivo: 'dados-invalidos', detalhe: 'falta o bloco programa' },
      'Este projeto tem dados inválidos e não foi carregado: falta o bloco programa.',
    ],
  ])('%j', (recusa, texto) => {
    expect(mensagemRecusa(recusa)).toBe(texto);
  });

  it('repassa a recusa da leitura com a mensagem', () => {
    expect(prepararCarregamento('abc')).toEqual({
      ok: false,
      motivo: 'nao-e-projeto',
      mensagem: 'Este arquivo não é um projeto do meuPiá Blocos.',
    });
    const r = prepararCarregamento(JSON.stringify({ ...projetoVazio(), versao: 0 }));
    expect(r).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe: 'a versão do formato é inválida',
      mensagem: 'Este projeto tem dados inválidos e não foi carregado: a versão do formato é inválida.',
    });
  });
});

describe('classificarErroCarga (research R-06)', () => {
  class BadConnectionCheck extends Error {}
  class MissingConnection extends Error {}
  const excecoes = { BadConnectionCheck, MissingConnection };

  it.each([
    [new BadConnectionCheck('x'), 'encaixe'],
    [new MissingConnection('x'), 'encaixe'],
    [new Error('x'), 'desconhecido'],
    [new TypeError('Invalid block definition'), 'desconhecido'],
    ['texto', 'desconhecido'],
  ])('%s → %s', (erro, tipo) => {
    expect(classificarErroCarga(erro, excecoes)).toEqual({ ok: false, erro: tipo });
  });

  it('sem as classes do Blockly, tudo é desconhecido', () => {
    expect(classificarErroCarga(new BadConnectionCheck('x'), {})).toEqual({ ok: false, erro: 'desconhecido' });
  });
});
