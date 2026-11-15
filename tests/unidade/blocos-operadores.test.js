// Blocos de operadores da spec 006 (RF-06; research R-03 a R-07; contracts/blocos-operadores.md).
import { describe, it, expect } from 'vitest';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { BLOCO_NUMERO, BLOCO_TEXTO, BLOCO_LOGICO, COR_VALORES } from '../../src/blocos/valores.js';
import { BLOCO_ARITMETICO, BLOCO_NEGATIVO, COR_CONTAS } from '../../src/blocos/contas.js';
import { BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { BLOCO_E_OU, BLOCO_NAO, OPERADORES_LOGICOS, COR_LOGICA } from '../../src/blocos/logica.js';
import { BLOCO_RELACIONAL, OPERADORES_RELACIONAIS, COR_COMPARACOES } from '../../src/blocos/comparacoes.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

describe('escala de precedência (R-03)', () => {
  it('tem os oito níveis da escala da 008/R-02, congelada', () => {
    expect(Object.isFrozen(PRECEDENCIA)).toBe(true);
    expect(PRECEDENCIA).toEqual({
      OU: 10,
      E: 20,
      NAO: 30,
      RELACIONAL: 40,
      ADITIVO: 50,
      MULTIPLICATIVO: 60,
      UNARIO: 70,
      PRIMARIO: 100,
    });
  });

  it('mantém os níveis da 003', () => {
    expect(PRECEDENCIA.ADITIVO).toBe(50);
    expect(PRECEDENCIA.MULTIPLICATIVO).toBe(60);
    expect(PRECEDENCIA.PRIMARIO).toBe(100);
  });
});

// --- Auxiliares: registro com o teste_escreva (encaixe VALOR) e os blocos pedidos. ---

const VARIAVEIS = [
  { id: 'v-x', nome: 'x', tipo: 'inteiro' },
  { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
  { id: 'v-nota1', nome: 'nota1', tipo: 'inteiro' },
  { id: 'v-nota2', nome: 'nota2', tipo: 'inteiro' },
  { id: 'v-a', nome: 'a', tipo: 'logico' },
  { id: 'v-b', nome: 'b', tipo: 'logico' },
  { id: 'v-c', nome: 'c', tipo: 'logico' },
  { id: 'v-ok', nome: 'ok', tipo: 'logico' },
];

function registroCom(...blocos) {
  const r = criarRegistroTeste();
  for (const b of [BLOCO_NUMERO, BLOCO_TEXTO, BLOCO_ARITMETICO, BLOCO_VARIAVEL, ...blocos]) r.registrarBloco(b);
  return r;
}

// Gera escreva(valor) e devolve a linha do escreva sem o "escreva(" e ")" e as mensagens de aviso.
function gerar(registro, valor) {
  const { codigo, avisos } = gerarPortugol(
    projetoDeTeste({ variaveis: VARIAVEIS, comandos: [bloco('teste_escreva', { entradas: { VALOR: valor } })] }),
    registro,
  );
  const linhas = codigo.split('\n');
  const linha = linhas[linhas.indexOf('inicio') + 1].trim();
  return { expr: linha.slice('escreva('.length, -1), avisos: avisos.map((a) => a.mensagem) };
}

const v = (nome) => bloco('variavel', { campos: { VAR: { id: `v-${nome}` } } });
const num = (n) => bloco('numero', { campos: { NUM: String(n) } });
const conta = (op, a, b) => bloco('aritmetico', { campos: { OP: op }, entradas: { ...(a && { A: a }), ...(b && { B: b }) } });
const rel = (op, a, b) => bloco('relacional', { campos: { OP: op }, entradas: { ...(a && { A: a }), ...(b && { B: b }) } });
const log = (valor) => bloco('logico', valor === undefined ? {} : { campos: { VALOR: valor } });
const eou = (op, a, b) => bloco('e_ou', { campos: { OP: op }, entradas: { ...(a && { A: a }), ...(b && { B: b }) } });
const nao = (x) => bloco('nao', { entradas: x ? { X: x } : {} });
const neg = (x) => bloco('negativo', { entradas: x ? { X: x } : {} });

describe('negativo (R-04)', () => {
  const registro = registroCom(BLOCO_NEGATIVO);

  it.each([
    ['-x', () => neg(v('x'))],
    ['-3', () => neg(num(3))],
    ['-(2 + 3)', () => neg(conta('+', num(2), num(3)))],
    ['-(-x)', () => neg(neg(v('x')))],
    ['-(2 + 3) * 4', () => conta('*', neg(conta('+', num(2), num(3))), num(4))],
    ['2 - -3', () => conta('-', num(2), neg(num(3)))],
    ['(nota1 + nota2) / 2', () => conta('/', conta('+', v('nota1'), v('nota2')), num(2))],
  ])('gera %s', (esperado, montar) => {
    expect(gerar(registro, montar())).toEqual({ expr: esperado, avisos: [] });
  });

  it('encaixe vazio vira -??? com aviso', () => {
    expect(gerar(registro, neg())).toEqual({ expr: '-???', avisos: ['Falta o valor do bloco negativo'] });
  });

  it('devolve a precedência UNARIO', () => {
    const ctx = { valor: () => 'x' };
    expect(BLOCO_NEGATIVO.gerar(neg(v('x')), ctx).precedencia).toBe(PRECEDENCIA.UNARIO);
  });

  it('definição, rótulo e variantes', () => {
    expect(BLOCO_NEGATIVO.tipo).toBe('negativo');
    expect(BLOCO_NEGATIVO.rotulo).toBe('negativo');
    expect(BLOCO_NEGATIVO.categoria).toBe('valor');
    expect(BLOCO_NEGATIVO.variantes ?? []).toEqual([]);
    expect(BLOCO_NEGATIVO.definicao).toEqual({
      type: 'negativo',
      message0: '−%1',
      args0: [{ type: 'input_value', name: 'X', check: ['Numero'] }],
      inputsInline: true,
      output: ['Numero'],
      colour: COR_CONTAS,
      tooltip: 'O valor com o sinal trocado, como −5',
    });
  });
});


describe('relacional (R-05)', () => {
  const registro = registroCom(BLOCO_RELACIONAL);

  it.each([
    ['idade >= 18', () => rel('>=', v('idade'), num(18))],
    ['a <> b', () => rel('<>', v('a'), v('b'))],
    ['x = 1', () => rel('=', v('x'), num(1))],
    ['x <> 1', () => rel('<>', v('x'), num(1))],
    ['x < 1', () => rel('<', v('x'), num(1))],
    ['x > 1', () => rel('>', v('x'), num(1))],
    ['x <= 1', () => rel('<=', v('x'), num(1))],
    ['x >= 1', () => rel('>=', v('x'), num(1))],
    ['(1 < 2) = ok', () => rel('=', rel('<', num(1), num(2)), v('ok'))],
    ['1 + 1 = 2', () => rel('=', conta('+', num(1), num(1)), num(2))],
  ])('gera %s', (esperado, montar) => {
    expect(gerar(registro, montar())).toEqual({ expr: esperado, avisos: [] });
  });

  it('encaixes vazios viram ??? com aviso', () => {
    expect(gerar(registro, rel('<', null, num(1)))).toEqual({
      expr: '??? < 1',
      avisos: ['Falta o primeiro valor do bloco comparação'],
    });
    expect(gerar(registro, rel('<', num(1), null)).avisos).toEqual(['Falta o segundo valor do bloco comparação']);
  });

  it('operador inválido vira ??? com aviso', () => {
    expect(gerar(registro, rel('==', num(1), num(1)))).toEqual({
      expr: '???',
      avisos: ['Escolha a comparação do bloco comparação'],
    });
  });

  it('devolve a precedência RELACIONAL', () => {
    const ctx = { campo: () => '<', valor: () => 'x' };
    expect(BLOCO_RELACIONAL.gerar(rel('<'), ctx).precedencia).toBe(PRECEDENCIA.RELACIONAL);
  });

  it('operadores, definição, rótulo e variantes', () => {
    expect(Object.isFrozen(OPERADORES_RELACIONAIS)).toBe(true);
    expect(Object.keys(OPERADORES_RELACIONAIS)).toEqual(['=', '<>', '<', '>', '<=', '>=']);
    expect(COR_COMPARACOES).toBe(260);
    expect(BLOCO_RELACIONAL.rotulo).toBe('comparação');
    expect(BLOCO_RELACIONAL.categoria).toBe('valor');
    expect(BLOCO_RELACIONAL.definicao).toEqual({
      type: 'relacional',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A' },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['=', '='],
            ['≠', '<>'],
            ['<', '<'],
            ['>', '>'],
            ['≤', '<='],
            ['≥', '>='],
          ],
        },
        { type: 'input_value', name: 'B' },
      ],
      inputsInline: true,
      output: ['Logico'],
      colour: COR_COMPARACOES,
      tooltip: 'Compara os dois valores. O resultado é verdadeiro ou falso',
    });
    expect(BLOCO_RELACIONAL.variantes.map((x) => x.nome)).toEqual(['=', '<>', '<', '>', '<=', '>=']);
    expect(BLOCO_RELACIONAL.variantes[1].presente(rel('<>'))).toBe(true);
    expect(BLOCO_RELACIONAL.variantes[1].presente(rel('='))).toBe(false);
  });
});

describe('valor fixo lógico (R-07)', () => {
  const registro = registroCom(BLOCO_LOGICO);

  it.each(['verdadeiro', 'falso'])('gera %s com precedência PRIMARIO', (valor) => {
    expect(gerar(registro, log(valor))).toEqual({ expr: valor, avisos: [] });
    expect(BLOCO_LOGICO.gerar(log(valor), { campo: () => valor }).precedencia).toBe(PRECEDENCIA.PRIMARIO);
  });

  it.each([['VERDADEIRO'], ['sim'], [undefined]])('valor %j vira ??? com aviso', (valor) => {
    expect(gerar(registro, log(valor))).toEqual({
      expr: '???',
      avisos: ['Escolha verdadeiro ou falso no bloco lógico'],
    });
  });

  it('definição, rótulo e variantes', () => {
    expect(BLOCO_LOGICO.rotulo).toBe('lógico');
    expect(BLOCO_LOGICO.categoria).toBe('valor');
    expect(BLOCO_LOGICO.definicao).toEqual({
      type: 'logico',
      message0: '%1',
      args0: [
        {
          type: 'field_dropdown',
          name: 'VALOR',
          options: [
            ['verdadeiro', 'verdadeiro'],
            ['falso', 'falso'],
          ],
        },
      ],
      output: ['Logico'],
      colour: COR_VALORES,
      tooltip: 'Um valor lógico: verdadeiro ou falso',
    });
    expect(BLOCO_LOGICO.variantes.map((x) => x.nome)).toEqual(['verdadeiro', 'falso']);
    expect(BLOCO_LOGICO.variantes[0].presente(log('verdadeiro'))).toBe(true);
    expect(BLOCO_LOGICO.variantes[1].presente(log('verdadeiro'))).toBe(false);
  });

  it('História 4: texto Olá gera "Olá" e número 3,5 gera 3.5 (blocos da 003)', () => {
    expect(gerar(registro, bloco('texto', { campos: { TEXTO: 'Olá' } })).expr).toBe('"Olá"');
    expect(gerar(registro, num('3,5')).expr).toBe('3.5');
  });
});

describe('e/ou e não (R-03, R-06)', () => {
  const registro = registroCom(BLOCO_RELACIONAL, BLOCO_LOGICO, BLOCO_E_OU, BLOCO_NAO);

  it.each([
    ['nao (x > 10)', () => nao(rel('>', v('x'), num(10)))],
    ['nao ok', () => nao(v('ok'))],
    ['nao (nao ok)', () => nao(nao(v('ok')))],
    ['(a ou b) e c', () => eou('e', eou('ou', v('a'), v('b')), v('c'))],
    ['a ou b e c', () => eou('ou', v('a'), eou('e', v('b'), v('c')))],
    ['a e (b e c)', () => eou('e', v('a'), eou('e', v('b'), v('c')))],
    ['a e nao b', () => eou('e', v('a'), nao(v('b')))],
    ['(nao a) = falso', () => rel('=', nao(v('a')), log('falso'))],
    ['x > 1 e x < 9', () => eou('e', rel('>', v('x'), num(1)), rel('<', v('x'), num(9)))],
  ])('gera %s', (esperado, montar) => {
    expect(gerar(registro, montar())).toEqual({ expr: esperado, avisos: [] });
  });

  it('encaixes vazios viram ??? com aviso', () => {
    expect(gerar(registro, nao())).toEqual({ expr: 'nao ???', avisos: ['Falta o valor do bloco não'] });
    expect(gerar(registro, eou('e', null, v('a')))).toEqual({
      expr: '??? e a',
      avisos: ['Falta o primeiro valor do bloco e/ou'],
    });
    expect(gerar(registro, eou('ou', v('a'), null)).avisos).toEqual(['Falta o segundo valor do bloco e/ou']);
  });

  it('operador inválido vira ??? com aviso', () => {
    expect(gerar(registro, eou('xou', v('a'), v('b')))).toEqual({
      expr: '???',
      avisos: ['Escolha e ou ou no bloco e/ou'],
    });
  });

  it('devolve as precedências E, OU e NAO', () => {
    const ctx = (op) => ({ campo: () => op, valor: () => 'x' });
    expect(BLOCO_E_OU.gerar(eou('e'), ctx('e')).precedencia).toBe(PRECEDENCIA.E);
    expect(BLOCO_E_OU.gerar(eou('ou'), ctx('ou')).precedencia).toBe(PRECEDENCIA.OU);
    expect(BLOCO_NAO.gerar(nao(), ctx()).precedencia).toBe(PRECEDENCIA.NAO);
  });

  it('operadores, definições, rótulos e variantes', () => {
    expect(Object.isFrozen(OPERADORES_LOGICOS)).toBe(true);
    expect(Object.keys(OPERADORES_LOGICOS)).toEqual(['e', 'ou']);
    expect(COR_LOGICA).toBe(290);
    expect(BLOCO_E_OU.rotulo).toBe('e/ou');
    expect(BLOCO_E_OU.definicao).toEqual({
      type: 'e_ou',
      message0: '%1 %2 %3',
      args0: [
        { type: 'input_value', name: 'A', check: ['Logico'] },
        {
          type: 'field_dropdown',
          name: 'OP',
          options: [
            ['e', 'e'],
            ['ou', 'ou'],
          ],
        },
        { type: 'input_value', name: 'B', check: ['Logico'] },
      ],
      inputsInline: true,
      output: ['Logico'],
      colour: COR_LOGICA,
      tooltip: '“e”: verdadeiro só se os dois lados forem verdadeiros. “ou”: verdadeiro se pelo menos um for',
    });
    expect(BLOCO_E_OU.variantes.map((x) => x.nome)).toEqual(['e', 'ou']);
    expect(BLOCO_E_OU.variantes[1].presente(eou('ou'))).toBe(true);
    expect(BLOCO_NAO.rotulo).toBe('não');
    expect(BLOCO_NAO.variantes ?? []).toEqual([]);
    expect(BLOCO_NAO.definicao).toEqual({
      type: 'nao',
      message0: 'não %1',
      args0: [{ type: 'input_value', name: 'X', check: ['Logico'] }],
      inputsInline: true,
      output: ['Logico'],
      colour: COR_LOGICA,
      tooltip: 'Inverte o valor: verdadeiro vira falso e falso vira verdadeiro',
    });
  });
});
