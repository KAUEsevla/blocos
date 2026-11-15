// Regra do nome de variável (spec 002, RF-02; FR-002, FR-003; contracts/nome-variavel.md;
// research R-02, R-03 e R-11).
import { describe, it, expect } from 'vitest';
import {
  validarNomeVariavel,
  NOMES_RESERVADOS,
  PALAVRAS_PORTUGOL,
  NATIVOS_CORE,
  NOMES_RUNTIME,
  PALAVRAS_PYTHON,
  NATIVOS_PYTHON,
  TAMANHO_MAXIMO_NOME,
} from '../../src/projeto/nome-variavel.js';

const MSG = {
  vazio: 'Digite um nome para a variável.',
  longo: 'O nome pode ter no máximo 30 caracteres.',
  espaco: 'O nome não pode ter espaços. Use _ no lugar, como em minha_idade.',
  acento: 'Use letras sem acento e sem ç.',
  caractere: 'Use só letras, números e _ no nome.',
  inicio: 'O nome precisa começar com uma letra.',
  reservado: 'Este nome é reservado.',
};

const GRUPOS = { PALAVRAS_PORTUGOL, NATIVOS_CORE, NOMES_RUNTIME, PALAVRAS_PYTHON, NATIVOS_PYTHON };

const recusa = (nome, variaveis, opcoes) => {
  const r = validarNomeVariavel(nome, variaveis, opcoes);
  return [r.motivo, r.mensagem];
};

describe('validarNomeVariavel: nomes válidos', () => {
  it.each(['idade', 'x', 'entrada', 'senha', 'MeuPrograma', 'dado_2', 'E1', 'Resultado', 'a'.repeat(30)])(
    '"%s" é válido',
    (nome) => {
      expect(validarNomeVariavel(nome)).toEqual({ valido: true, nome, motivo: null, mensagem: null });
    },
  );

  it('tira os espaços das pontas', () => {
    expect(validarNomeVariavel('  idade ')).toEqual({ valido: true, nome: 'idade', motivo: null, mensagem: null });
  });

  it('TAMANHO_MAXIMO_NOME é 30', () => {
    expect(TAMANHO_MAXIMO_NOME).toBe(30);
  });
});

describe('validarNomeVariavel: cada regra de R-11', () => {
  it.each([
    ['', 'vazio'],
    ['   ', 'vazio'],
    ['a'.repeat(31), 'longo'],
    ['minha idade', 'espaco'],
    ['ação', 'acento'],
    ['ânimo', 'acento'],
    ['a-b', 'caractere'],
    ['x!', 'caractere'],
    ['2lugar', 'inicio'],
    ['_x', 'inicio'],
    ['se', 'reservado'],
    ['Print', 'reservado'],
    ['MAIN', 'reservado'],
    ['None', 'reservado'],
  ])('"%s" → %s', (nome, motivo) => {
    expect(recusa(nome)).toEqual([motivo, MSG[motivo]]);
  });

  it('o nome devolvido vem sem os espaços das pontas também na recusa', () => {
    expect(validarNomeVariavel(' se ').nome).toBe('se');
  });

  it('entrada que não é texto é tratada como vazia, sem lançar', () => {
    expect(recusa(undefined)).toEqual(['vazio', MSG.vazio]);
    expect(recusa(42)).toEqual(['vazio', MSG.vazio]);
    expect(validarNomeVariavel(null).nome).toBe('');
  });
});

describe('validarNomeVariavel: ordem das regras', () => {
  it.each([
    ['2 lugar', 'espaco'],
    ['ação 2', 'espaco'],
    ['2ação', 'acento'],
    ['a'.repeat(31) + ' b', 'longo'],
    ['2-x', 'caractere'],
  ])('"%s" → %s', (nome, motivo) => {
    expect(validarNomeVariavel(nome).motivo).toBe(motivo);
  });

  it('reservado vem antes de duplicado', () => {
    const variaveis = [{ id: 'v1', nome: 'se', tipo: 'inteiro' }];
    expect(validarNomeVariavel('se', variaveis).motivo).toBe('reservado');
  });
});

describe('validarNomeVariavel: duplicado', () => {
  const variaveis = Object.freeze([
    Object.freeze({ id: 'v1', nome: 'idade', tipo: 'inteiro' }),
    Object.freeze({ id: 'v2', nome: 'Nome', tipo: 'cadeia' }),
  ]);

  it('sem diferenciar maiúsculas, com o nome gravado na mensagem', () => {
    expect(recusa('Idade', variaveis)).toEqual(['duplicado', 'Já existe a variável idade.']);
    expect(recusa('NOME', variaveis)).toEqual(['duplicado', 'Já existe a variável Nome.']);
  });

  it('ignorarId libera a própria variável (renomear só a caixa)', () => {
    expect(validarNomeVariavel('Idade', variaveis, { ignorarId: 'v1' }).valido).toBe(true);
    expect(validarNomeVariavel('nome', variaveis, { ignorarId: 'v1' }).motivo).toBe('duplicado');
  });

  it('não altera a lista e não depende de chamadas anteriores', () => {
    const a = validarNomeVariavel('Idade', variaveis);
    validarNomeVariavel('outro', variaveis);
    expect(validarNomeVariavel('Idade', variaveis)).toEqual(a);
  });
});

describe('nomes reservados (research R-02 e R-03)', () => {
  it('NOMES_RESERVADOS tem só minúsculas e contém todos os grupos', () => {
    for (const nome of NOMES_RESERVADOS) expect(nome).toBe(nome.toLowerCase());
    for (const [grupo, nomes] of Object.entries(GRUPOS)) {
      for (const nome of nomes) expect(NOMES_RESERVADOS.has(nome.toLowerCase()), `${grupo}: ${nome}`).toBe(true);
    }
  });

  it('os grupos são listas congeladas', () => {
    for (const nomes of Object.values(GRUPOS)) expect(Object.isFrozen(nomes)).toBe(true);
  });

  it.each(Object.entries(GRUPOS))('todo nome de %s é recusado em minúsculas, MAIÚSCULAS e Capitalizado', (_grupo, nomes) => {
    for (const nome of nomes) {
      const capitalizado = nome[0].toUpperCase() + nome.slice(1);
      for (const forma of [nome, nome.toUpperCase(), capitalizado]) {
        expect(validarNomeVariavel(forma).motivo, forma).toBe('reservado');
      }
    }
  });

  it('PALAVRAS_PORTUGOL tem as palavras-chave do lexer e os tipos de contexto do Core 1.4.1', () => {
    expect([...PALAVRAS_PORTUGOL].sort()).toEqual(
      [
        'ate', 'de', 'enquanto', 'e', 'entao', 'escreva', 'faca', 'fim_para', 'fim_se', 'fim_enquanto',
        'leia', 'nao', 'ou', 'para', 'passo', 'se', 'senao', 'inteiro', 'string', 'cadeia', 'real',
        'float', 'dicionario', 'filaprioridade', 'algoritmo', 'var', 'inicio', 'fim_algoritmo', 'usar',
        'funcao', 'retorne', 'fim_funcao', 'continue', 'interrompa', 'classe', 'metodo', 'novo',
        'fim_classe', 'mod', 'lista', 'logico', 'vetor',
      ].sort(),
    );
  });

  it('NATIVOS_CORE e NOMES_RUNTIME seguem o Core 1.4.1', () => {
    expect([...NATIVOS_CORE].sort()).toEqual(
      [
        'tamanho', 'raiz', 'potencia', 'seno', 'cosseno', 'tangente', 'teto', 'piso', 'absoluto',
        'filaDupla', 'filaPrioridade', 'pi', 'verdadeiro', 'falso',
      ].sort(),
    );
    expect([...NOMES_RUNTIME].sort()).toEqual(
      ['main', 'sys', 'math', 'heapq', 'deque', 'collections', 'FilaPrioridade'].sort(),
    );
  });

  it('PALAVRAS_PYTHON são as 35 palavras-chave do Python 3.11', () => {
    expect(PALAVRAS_PYTHON).toHaveLength(35);
    for (const nome of ['False', 'None', 'True', 'async', 'await', 'nonlocal', 'yield', 'lambda']) {
      expect(PALAVRAS_PYTHON).toContain(nome);
    }
  });

  it('NATIVOS_PYTHON tem funções e exceções do builtins (só nomes que começam com letra)', () => {
    for (const nome of ['print', 'input', 'int', 'float', 'str', 'len', 'range', 'max', 'min', 'sum', 'id', 'type', 'ValueError', 'ZeroDivisionError', 'Ellipsis', 'NotImplemented', 'exit', 'quit']) {
      expect(NATIVOS_PYTHON).toContain(nome);
    }
    for (const nome of NATIVOS_PYTHON) expect(nome).toMatch(/^[A-Za-z]/);
  });
});
