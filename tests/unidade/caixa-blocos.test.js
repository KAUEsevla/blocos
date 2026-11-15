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

  // Nesta história, com variáveis também é só o botão: os blocos entram nas T029 e T033.
  it('o primeiro item é sempre o botão', () => {
    const variaveis = Object.freeze([Object.freeze({ id: 'v1', nome: 'idade', tipo: 'inteiro' })]);
    expect(conteudoCategoriaVariaveis(variaveis)[0]).toEqual(BOTAO);
  });
});
