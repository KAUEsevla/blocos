// Textos da execução e relato do resultado (spec 009, contracts/executar.md; FR-004, FR-005).
import { describe, it, expect } from 'vitest';
import { MENSAGENS_EXECUCAO, relatoDoResultado } from '../../src/execucao/mensagens.js';

describe('MENSAGENS_EXECUCAO (FR-004, RNF-03)', () => {
  it('é congelado e tem os textos do contrato', () => {
    expect(Object.isFrozen(MENSAGENS_EXECUCAO)).toBe(true);
    expect(MENSAGENS_EXECUCAO).toMatchObject({
      preparando: 'Preparando o ambiente do meuPiá. Na primeira vez isso pode levar até 30 segundos.',
      etapaPython: 'Carregando o Python (1 de 2)...',
      etapaCore: 'Instalando o meuPiá Core (2 de 2)...',
      executando: 'Executando...',
      fim: 'Fim do programa',
      erroCompilacao: 'Erro de compilação',
      erroExecucao: 'Erro de execução',
      interrompido: 'Execução interrompida pelo usuário',
      detalhesTecnicos: 'Detalhes técnicos',
    });
    expect(MENSAGENS_EXECUCAO.linhaDoErro(3, 'escreva(x')).toBe('Linha 3: escreva(x');
  });
});

describe('relatoDoResultado: aviso de fim (FR-004)', () => {
  it('ok → Fim do programa', () => {
    expect(relatoDoResultado({ status: 'ok', saida: '', erro: null }, '')).toEqual([
      { texto: 'Fim do programa', tipo: 'sistema' },
    ]);
  });

  it('interrompido → Execução interrompida pelo usuário', () => {
    expect(relatoDoResultado({ status: 'interrompido', saida: '', erro: null }, '')).toEqual([
      { texto: 'Execução interrompida pelo usuário', tipo: 'sistema' },
    ]);
  });

  it('falha_ambiente → a mensagem do ambiente, como erro', () => {
    const erro = { mensagem: 'Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo.' };
    expect(relatoDoResultado({ status: 'falha_ambiente', saida: '', erro }, '')).toEqual([
      { texto: erro.mensagem, tipo: 'erro' },
    ]);
  });

  describe('erros (US2, FR-005)', () => {
    const codigo = 'algoritmo "X"\n    escreva(1\nfim_algoritmo\n';

    it('erro_compilacao com linha → título, mensagem, linha do Portugol sem indentação e detalhe', () => {
      const erro = { mensagem: 'Erro sintático na linha 2, coluna 13: esperado ")"', linha: 2, detalhe: 'bruto' };
      expect(relatoDoResultado({ status: 'erro_compilacao', saida: '', erro }, codigo)).toEqual([
        { texto: 'Erro de compilação', tipo: 'erro' },
        { texto: erro.mensagem, tipo: 'erro' },
        { texto: 'Linha 2: escreva(1', tipo: 'erro' },
        { detalhe: 'bruto' },
      ]);
    });

    it.each([null, 0, 99])('erro_compilacao com linha %s → sem o item da linha', (linha) => {
      const erro = { mensagem: 'm', linha, detalhe: 'bruto' };
      const itens = relatoDoResultado({ status: 'erro_compilacao', saida: '', erro }, codigo);
      expect(itens.map((i) => i.texto ?? 'detalhe')).toEqual(['Erro de compilação', 'm', 'detalhe']);
    });

    it('erro_execucao → título, mensagem e detalhe', () => {
      const erro = { mensagem: 'Não é possível dividir por zero.', detalhe: 'Traceback ...' };
      expect(relatoDoResultado({ status: 'erro_execucao', saida: '', erro }, codigo)).toEqual([
        { texto: 'Erro de execução', tipo: 'erro' },
        { texto: erro.mensagem, tipo: 'erro' },
        { detalhe: 'Traceback ...' },
      ]);
    });

    it('detalhe vazio não gera o item { detalhe }', () => {
      const itens = relatoDoResultado({ status: 'erro_execucao', saida: '', erro: { mensagem: 'm', detalhe: '' } }, '');
      expect(itens.some((i) => 'detalhe' in i)).toBe(false);
    });
  });

  it('erro_execucao genérico (exceção inesperada) → Erro de execução e a mensagem', () => {
    const erro = { mensagem: 'O programa parou com um erro durante a execução.' };
    expect(relatoDoResultado({ status: 'erro_execucao', saida: '', erro }, '')).toEqual([
      { texto: 'Erro de execução', tipo: 'erro' },
      { texto: erro.mensagem, tipo: 'erro' },
    ]);
  });
});
