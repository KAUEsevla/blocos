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

  // Sem a marca, o texto pode ser um rastro em inglês do compilador (spec 009, R-04 e R-07).
  it('sem o marcador, mensagem genérica em pt-BR e o texto bruto no detalhe', () => {
    const saida = 'Traceback (most recent call last):\nRuntimeError: boom\n';
    expect(interpretarErroCompilacao(saida)).toEqual({
      mensagem: 'O meuPiá Core não conseguiu compilar o programa.',
      etapa: null,
      linha: null,
      coluna: null,
      detalhe: saida,
    });
  });

  it('saída vazia vira mensagem genérica', () => {
    expect(interpretarErroCompilacao('').mensagem).toBe('O meuPiá Core não conseguiu compilar o programa.');
  });

  it('marca sem texto depois dela também vira mensagem genérica', () => {
    expect(interpretarErroCompilacao('[COMPILATION ERROR]:\n').mensagem).toBe(
      'O meuPiá Core não conseguiu compilar o programa.',
    );
  });
});

describe('traduzirErroExecucao: detalhe (spec 009, R-07)', () => {
  it('usa o rastro como detalhe quando existir', () => {
    const rastro = 'Traceback (most recent call last):\nZeroDivisionError: division by zero\n';
    expect(traduzirErroExecucao('ZeroDivisionError', 'division by zero', rastro).detalhe).toBe(rastro);
  });

  it('sem rastro, detalhe = "Tipo: mensagem"', () => {
    expect(traduzirErroExecucao('NameError', "name 'x' is not defined").detalhe).toBe(
      "NameError: name 'x' is not defined",
    );
    expect(traduzirErroExecucao('NameError', 'x', '').detalhe).toBe('NameError: x');
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
