import { describe, it, expect } from 'vitest';
import { interpretarErroCompilacao, traduzirErroExecucao } from '../../src/core/executor-core.js';

describe('interpretarErroCompilacao (RF-09, RNF-01)', () => {
  it('extrai etapa, linha, coluna e mensagem do texto do Core', () => {
    const saida =
      'Compilando main.por...\n(Lexer started)\n[COMPILATION ERROR]:\n\tErro sintático na linha 3, coluna 5: esperado "entao", encontrado "escreva"\n';
    expect(interpretarErroCompilacao(saida)).toEqual({
      mensagem: 'Erro sintático na linha 3, coluna 5: esperado "entao", encontrado "escreva"',
      etapa: 'sintático',
      linha: 3,
      coluna: 5,
      detalhe: saida,
    });
  });

  it.each(['léxico', 'semântico'])('reconhece a etapa %s', (etapa) => {
    const r = interpretarErroCompilacao(`[COMPILATION ERROR]:\n\tErro ${etapa} na linha 1, coluna 2: algo`);
    expect(r).toMatchObject({ etapa, linha: 1, coluna: 2 });
  });

  it('sem o formato conhecido, devolve a mensagem bruta e posição nula', () => {
    const r = interpretarErroCompilacao('[COMPILATION ERROR]:\n\tArquivo main.por não encontrado.');
    expect(r).toMatchObject({ mensagem: 'Arquivo main.por não encontrado.', etapa: null, linha: null, coluna: null });
  });

  it('sem o marcador, usa o texto inteiro', () => {
    expect(interpretarErroCompilacao('  falhou  ').mensagem).toBe('falhou');
  });

  it('saída vazia vira mensagem genérica', () => {
    expect(interpretarErroCompilacao('').mensagem).toBe('O Core não aceitou o programa.');
  });
});

describe('traduzirErroExecucao (RF-09)', () => {
  it.each([
    ['ZeroDivisionError', 'division by zero', 'Divisão por zero'],
    ['ValueError', "invalid literal for int() with base 10: 'abc'", 'O valor digitado não é um número'],
    ['ValueError', "could not convert string to float: 'x'", 'O valor digitado não é um número'],
    ['EOFError', 'EOF when reading a line', 'O programa pediu mais dados do que os informados'],
    ['ValueError', 'passo do laço para não pode ser zero', 'O programa parou com um erro durante a execução.'],
    ['NameError', "name 'x' is not defined", 'O programa parou com um erro durante a execução.'],
  ])('%s: %s', (tipo, mensagem, esperada) => {
    expect(traduzirErroExecucao(tipo, mensagem)).toEqual({
      mensagem: esperada,
      etapa: 'execução',
      linha: null,
      coluna: null,
      detalhe: `${tipo}: ${mensagem}`,
    });
  });
});
