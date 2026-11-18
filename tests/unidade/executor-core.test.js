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

// Tabela do research R-07 da spec 009 (FR-005, SC-004): todas terminam em ponto.
describe('traduzirErroExecucao (RF-09)', () => {
  it.each([
    ['ZeroDivisionError', 'division by zero', 'Não é possível dividir por zero.'],
    ['ValueError', "invalid literal for int() with base 10: 'abc'", 'O valor digitado não é um número.'],
    ['ValueError', "could not convert string to float: 'x'", 'O valor digitado não é um número.'],
    ['EOFError', 'EOF when reading a line', 'O programa pediu mais dados do que os informados.'],
    [
      'TypeError',
      "'<' not supported between instances of 'str' and 'int'",
      'Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número).',
    ],
    ['OverflowError', 'int too large to convert to float', 'O número ficou grande demais para ser calculado.'],
    ['MemoryError', '', 'O programa usou memória demais.'],
    // Spec 005 (research R-08): o passo zero ganhou mensagem própria.
    ['ValueError', 'passo do laço para não pode ser zero', 'O passo do para ficou zero: o laço nunca terminaria.'],
    ['NameError', "name 'x' is not defined", 'O programa parou com um erro durante a execução.'],
  ])('%s: %s', (tipo, mensagem, esperada) => {
    const traduzido = traduzirErroExecucao(tipo, mensagem);
    expect(traduzido).toEqual({
      mensagem: esperada,
      etapa: 'execução',
      linha: null,
      coluna: null,
      detalhe: `${tipo}: ${mensagem}`,
    });
    // SC-004: o texto do Python (em inglês) nunca aparece na mensagem padrão.
    if (mensagem) expect(traduzido.mensagem).not.toContain(mensagem);
  });

  it('nome de tipo que coincide com membro de Object não quebra a tradução', () => {
    expect(traduzirErroExecucao('toString', 'x').mensagem).toBe('O programa parou com um erro durante a execução.');
  });
});

// Spec 010 (contracts/adapter-core.md; research R-07): real digitado com vírgula (P-2).
describe('traduzirErroExecucao: vírgula no leia de real (spec 010)', () => {
  const COMPLEMENTO = 'O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72.';

  it.each([
    ["could not convert string to float: '1,72'", COMPLEMENTO],
    ["could not convert string to float: ',5'", COMPLEMENTO],
    ["could not convert string to float: 'abc'", 'O valor digitado não é um número.'],
    ["could not convert string to float: ''", 'O valor digitado não é um número.'],
    ["invalid literal for int() with base 10: '1,5'", 'O valor digitado não é um número.'],
  ])('%s → %s', (mensagemPython, esperada) => {
    const erro = traduzirErroExecucao('ValueError', mensagemPython);
    expect(erro.mensagem).toBe(esperada);
    expect(erro.mensagem).not.toContain('could not');
    expect(erro.detalhe).toContain(mensagemPython);
  });
});

// Spec 005 (research R-08; contracts/editor-repeticao.md): erros de contagem do para.
describe('traduções do para (spec 005)', () => {
  const rastro = 'Traceback (most recent call last):\n  ...';

  it('passo zero', () => {
    const erro = traduzirErroExecucao('ValueError', 'passo do laço para não pode ser zero', rastro);
    expect(erro.mensagem).toBe('O passo do para ficou zero: o laço nunca terminaria.');
    expect(erro.detalhe).toBe(rastro);
  });

  it('casas decimais em de, até ou passo', () => {
    const erro = traduzirErroExecucao('TypeError', "'float' object cannot be interpreted as an integer", rastro);
    expect(erro.mensagem).toBe('O para só conta com números inteiros: de, até e passo não podem ter casas decimais.');
    expect(erro.detalhe).toBe(rastro);
  });

  it('os outros TypeError e ValueError não mudam', () => {
    expect(traduzirErroExecucao('TypeError', "'<' not supported between instances of 'str' and 'int'").mensagem).toBe(
      'Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número).',
    );
    expect(traduzirErroExecucao('TypeError', "'_S' object cannot be interpreted as an integer").mensagem).toBe(
      'Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número).',
    );
    expect(traduzirErroExecucao('ValueError', "could not convert string to float: '1,72'").mensagem).toBe(
      'O valor digitado não é um número. Use ponto para separar as casas decimais, por exemplo 1.72.',
    );
    expect(traduzirErroExecucao('ValueError', 'math domain error').mensagem).toBe('O programa parou com um erro durante a execução.');
  });
});
