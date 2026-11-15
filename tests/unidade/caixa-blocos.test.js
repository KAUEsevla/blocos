// Caixa de blocos (spec 002, RF-02; contracts/blocos-variaveis.md, "Caixa de blocos").
import { describe, it, expect } from 'vitest';
import {
  CAIXA_BLOCOS,
  CATEGORIA_VARIAVEIS,
  BOTAO_CRIAR_VARIAVEL,
  conteudoCategoriaVariaveis,
} from '../../src/blocos/caixa-blocos.js';

const BOTAO = { kind: 'button', text: 'Criar variável…', callbackKey: 'CRIAR_VARIAVEL' };

describe('CAIXA_BLOCOS', () => {
  it('é uma caixa com categorias e tem a categoria dinâmica Variáveis', () => {
    expect(CAIXA_BLOCOS.kind).toBe('categoryToolbox');
    const variaveis = CAIXA_BLOCOS.contents.find((c) => c.name === 'Variáveis');
    expect(variaveis).toMatchObject({ kind: 'category', name: 'Variáveis', custom: 'VARIAVEIS' });
  });

  it('exporta os nomes da categoria e do botão', () => {
    expect(CATEGORIA_VARIAVEIS).toBe('VARIAVEIS');
    expect(BOTAO_CRIAR_VARIAVEL).toBe('CRIAR_VARIAVEL');
  });
});

describe('conteudoCategoriaVariaveis', () => {
  it('sem variáveis, só o botão "Criar variável…"', () => {
    expect(conteudoCategoriaVariaveis([])).toEqual([BOTAO]);
    expect(conteudoCategoriaVariaveis(undefined)).toEqual([BOTAO]);
  });

  it('o primeiro item é sempre o botão', () => {
    const variaveis = Object.freeze([Object.freeze({ id: 'v1', nome: 'idade', tipo: 'inteiro' })]);
    expect(conteudoCategoriaVariaveis(variaveis)[0]).toEqual(BOTAO);
  });

  // História 2 (T029): depois do botão, um "recebe" com a última variável criada.
  const recebe = (id) => ({ kind: 'block', type: 'variavel_recebe', fields: { VAR: { id } } });

  it('com uma variável, o "recebe" vem com ela depois do botão', () => {
    const conteudo = conteudoCategoriaVariaveis([{ id: 'v1', nome: 'idade', tipo: 'inteiro' }]);
    expect(conteudo.slice(0, 2)).toEqual([BOTAO, recebe('v1')]);
  });

  it('com quatro variáveis de tipos misturados, o "recebe" vem com a última da lista', () => {
    const variaveis = Object.freeze([
      { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
      { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
      { id: 'v-ok', nome: 'ok', tipo: 'logico' },
      { id: 'v-altura', nome: 'altura', tipo: 'real' },
    ]);
    const conteudo = conteudoCategoriaVariaveis(variaveis);
    expect(conteudo.slice(0, 2)).toEqual([BOTAO, recebe('v-altura')]);
    expect(conteudo.filter((item) => item.type === 'variavel_recebe')).toHaveLength(1);
  });
});
