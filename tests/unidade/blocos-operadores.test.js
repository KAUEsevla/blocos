// Blocos de operadores da spec 006 (RF-06; research R-03 a R-07; contracts/blocos-operadores.md).
import { describe, it, expect } from 'vitest';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { BLOCO_NUMERO, BLOCO_TEXTO, COR_VALORES } from '../../src/blocos/valores.js';
import { BLOCO_ARITMETICO, BLOCO_NEGATIVO, COR_CONTAS } from '../../src/blocos/contas.js';
import { BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
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

