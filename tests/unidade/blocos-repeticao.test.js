// Blocos enquanto e para (RF-05; spec 005, research R-03 a R-06; contracts/blocos-repeticao.md).
import { describe, it, expect } from 'vitest';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { BLOCO_ESCREVA, BLOCO_LEIA } from '../../src/blocos/entrada-saida.js';
import { BLOCO_NUMERO, BLOCO_TEXTO, BLOCO_LOGICO } from '../../src/blocos/valores.js';
import { BLOCO_VARIAVEL, BLOCO_VARIAVEL_RECEBE } from '../../src/blocos/variaveis.js';
import { BLOCO_ARITMETICO, BLOCO_NEGATIVO } from '../../src/blocos/contas.js';
import { BLOCO_RELACIONAL } from '../../src/blocos/comparacoes.js';
import { BLOCO_SE } from '../../src/blocos/decisao.js';
import { campoVariavel } from '../../src/blocos/campo-variavel.js';
import { BLOCO_ENQUANTO, BLOCO_PARA, COR_REPETICAO, valorFixo } from '../../src/blocos/repeticao.js';

const registro = criarRegistro();
for (const b of [
  BLOCO_PROGRAMA,
  BLOCO_ENQUANTO,
  BLOCO_PARA,
  BLOCO_SE,
  BLOCO_ESCREVA,
  BLOCO_LEIA,
  BLOCO_TEXTO,
  BLOCO_NUMERO,
  BLOCO_LOGICO,
  BLOCO_VARIAVEL,
  BLOCO_VARIAVEL_RECEBE,
  BLOCO_ARITMETICO,
  BLOCO_NEGATIVO,
  BLOCO_RELACIONAL,
]) {
  registro.registrarBloco(b);
}

const VARIAVEIS = [
  { id: 'v-i', nome: 'i', tipo: 'inteiro' },
  { id: 'v-n', nome: 'n', tipo: 'inteiro' },
  { id: 'v-k', nome: 'k', tipo: 'inteiro' },
  { id: 'v-x', nome: 'x', tipo: 'real' },
];

let contador = 0;
const id = (t) => `${t}-${++contador}`;

// Construtores de nós JSON.
const texto = (t) => ({ type: 'texto', id: id('t'), fields: { TEXTO: t } });
const numero = (n) => ({ type: 'numero', id: id('n'), fields: { NUM: String(n) } });
const logico = (v) => ({ type: 'logico', id: id('l'), fields: { VALOR: v } });
const variavel = (idVar) => ({ type: 'variavel', id: id('v'), fields: { VAR: { id: idVar } } });
const negativo = (x) => ({ type: 'negativo', id: id('neg'), inputs: { X: { block: x } } });
const conta = (op, a, b) => ({ type: 'aritmetico', id: id('a'), fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } });
const relacional = (op, a, b) => ({ type: 'relacional', id: id('r'), fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } });
const escreva = (valor) => ({ type: 'escreva', id: id('e'), inputs: { VALOR1: { block: valor } } });
const recebe = (idVar, valor) => ({ type: 'variavel_recebe', id: id('rc'), fields: { VAR: { id: idVar } }, inputs: { VALOR: { block: valor } } });

function cadeia(comandos) {
  if (comandos.length === 0) return undefined;
  const [primeiro, ...resto] = comandos;
  const proximo = cadeia(resto);
  return proximo ? { ...primeiro, next: { block: proximo } } : primeiro;
}

function enquanto({ condicao, faca = [] } = {}) {
  const no = { type: 'enquanto', id: id('enq'), inputs: {} };
  if (condicao) no.inputs.CONDICAO = { block: condicao };
  if (faca.length) no.inputs.FACA = { block: cadeia(faca) };
  return no;
}

function para({ variavel: idVar = 'v-i', de, ate, passo, faca = [], pid } = {}) {
  const no = { type: 'para', id: pid ?? id('para'), inputs: {} };
  if (idVar !== null) no.fields = { VAR: { id: idVar } };
  if (de) no.inputs.DE = { block: de };
  if (ate) no.inputs.ATE = { block: ate };
  if (passo) no.inputs.PASSO = { block: passo };
  if (faca.length) no.inputs.FACA = { block: cadeia(faca) };
  return no;
}

const se = ({ condicao, entao = [] }) => ({
  type: 'se',
  id: id('se'),
  inputs: { CONDICAO: { block: condicao }, ...(entao.length ? { ENTAO: { block: cadeia(entao) } } : {}) },
});

function gerar(comandos) {
  const raiz = { type: 'programa', id: 'programa', inputs: {} };
  const primeiro = cadeia(comandos);
  if (primeiro) raiz.inputs.COMANDOS = { block: primeiro };
  return gerarPortugol(
    { formato: 'meupia-blocos', versao: 1, nome: 'T', variaveis: VARIAVEIS, blocos: { blocks: { languageVersion: 0, blocks: [raiz] } } },
    registro,
  );
}

// Linhas entre "inicio" e "fim_algoritmo".
function corpo(codigo) {
  const linhas = codigo.split('\n');
  return linhas.slice(linhas.indexOf('inicio') + 1, linhas.indexOf('fim_algoritmo'));
}

const avisoDe = (r) => r.avisos.map(({ tipoBloco, encaixe, mensagem }) => ({ tipoBloco, encaixe, mensagem }));

const ZERO = 'O passo do bloco para não pode ser zero: o laço nunca terminaria';
const DECIMAIS = 'O bloco para só conta com números inteiros: tire as casas decimais';

describe('para: geração (História 1; FR-002, FR-005)', () => {
  it('cenário 1: de 1 até 5 sem passo', () => {
    const r = gerar([para({ de: numero(1), ate: numero(5), faca: [escreva(variavel('v-i'))] })]);
    expect(corpo(r.codigo)).toEqual(['    para i de 1 ate 5 faca', '        escreva(i)', '    fim_para']);
    expect(r.codigo).not.toContain('passo');
    expect(r.avisos).toEqual([]);
  });

  it('cenário 2: de 5 até 1 passo -1', () => {
    const r = gerar([para({ de: numero(5), ate: numero(1), passo: negativo(numero(1)), faca: [escreva(variavel('v-i'))] })]);
    expect(corpo(r.codigo)[0]).toBe('    para i de 5 ate 1 passo -1 faca');
    expect(r.avisos).toEqual([]);
  });

  it('expressão no até e variável no passo (FR-004), sem aviso', () => {
    const r = gerar([para({ de: numero(1), ate: conta('*', variavel('v-n'), numero(2)), passo: variavel('v-k') })]);
    expect(corpo(r.codigo)).toEqual(['    para i de 1 ate n * 2 passo k faca', '    fim_para']);
    expect(r.avisos).toEqual([]);
  });

  it('passo numa conta não gera aviso', () => {
    const r = gerar([para({ de: numero(1), ate: numero(5), passo: conta('-', variavel('v-n'), numero(1)) })]);
    expect(r.avisos).toEqual([]);
  });

  it('corpo vazio: só a abertura e o fechamento', () => {
    const r = gerar([para({ de: numero(1), ate: numero(3) })]);
    expect(corpo(r.codigo)).toEqual(['    para i de 1 ate 3 faca', '    fim_para']);
    expect(r.avisos).toEqual([]);
  });
});

describe('enquanto: geração (História 2; FR-001)', () => {
  it('cenário 1: enquanto n > 0 com dois comandos', () => {
    const r = gerar([
      enquanto({
        condicao: relacional('>', variavel('v-n'), numero(0)),
        faca: [escreva(variavel('v-n')), recebe('v-n', conta('-', variavel('v-n'), numero(1)))],
      }),
    ]);
    expect(corpo(r.codigo)).toEqual([
      '    enquanto n > 0 faca',
      '        escreva(n)',
      '        n <- n - 1',
      '    fim_enquanto',
    ]);
    expect(r.avisos).toEqual([]);
  });

  it('corpo vazio: só a abertura e o fechamento', () => {
    const r = gerar([enquanto({ condicao: logico('falso') })]);
    expect(corpo(r.codigo)).toEqual(['    enquanto falso faca', '    fim_enquanto']);
    expect(r.avisos).toEqual([]);
  });

  it('se dentro de para dentro de enquanto (FR-008)', () => {
    const r = gerar([
      enquanto({
        condicao: logico('verdadeiro'),
        faca: [para({ de: numero(1), ate: numero(2), faca: [se({ condicao: logico('verdadeiro'), entao: [escreva(texto('x'))] })] })],
      }),
    ]);
    expect(corpo(r.codigo)).toEqual([
      '    enquanto verdadeiro faca',
      '        para i de 1 ate 2 faca',
      '            se verdadeiro entao',
      '                escreva("x")',
      '            fim_se',
      '        fim_para',
      '    fim_enquanto',
    ]);
  });
});

describe('avisos (data-model "Avisos")', () => {
  it('condição vazia do enquanto', () => {
    const r = gerar([enquanto()]);
    expect(corpo(r.codigo)[0]).toBe('    enquanto ??? faca');
    expect(avisoDe(r)).toEqual([{ tipoBloco: 'enquanto', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco enquanto' }]);
  });

  it.each([
    ['vazia', null],
    ['inexistente', 'v-nada'],
  ])('variável de controle %s', (_n, idVar) => {
    const r = gerar([para({ variavel: idVar, de: numero(1), ate: numero(2) })]);
    expect(corpo(r.codigo)[0]).toBe('    para ??? de 1 ate 2 faca');
    expect(avisoDe(r)).toEqual([{ tipoBloco: 'para', encaixe: 'VAR', mensagem: 'Falta a variável de controle do bloco para' }]);
  });

  it('variável de controle real', () => {
    const r = gerar([para({ variavel: 'v-x', de: numero(1), ate: numero(2) })]);
    expect(corpo(r.codigo)[0]).toBe('    para x de 1 ate 2 faca');
    expect(avisoDe(r)).toEqual([
      { tipoBloco: 'para', encaixe: 'VAR', mensagem: 'A variável de controle do bloco para precisa ser do tipo inteiro' },
    ]);
  });

  it('de e até vazios', () => {
    const r = gerar([para({})]);
    expect(corpo(r.codigo)[0]).toBe('    para i de ??? ate ??? faca');
    expect(avisoDe(r)).toEqual([
      { tipoBloco: 'para', encaixe: 'DE', mensagem: 'Falta o valor inicial (de) do bloco para' },
      { tipoBloco: 'para', encaixe: 'ATE', mensagem: 'Falta o valor final (até) do bloco para' },
    ]);
  });

  it.each([
    ['0', numero('0'), '0'],
    ['00', numero('00'), '0'],
    ['0,0', numero('0,0'), '0.0'],
    ['-0', negativo(numero('0')), '-0'],
  ])('passo fixo %s: só o aviso do zero (FR-007)', (_n, passo, texto) => {
    const r = gerar([para({ de: numero(1), ate: numero(3), passo })]);
    expect(corpo(r.codigo)[0]).toBe(`    para i de 1 ate 3 passo ${texto} faca`);
    expect(avisoDe(r)).toEqual([{ tipoBloco: 'para', encaixe: 'PASSO', mensagem: ZERO }]);
  });

  it('casas decimais em de, até e passo', () => {
    const r = gerar([para({ de: numero('1,5'), ate: numero('3.0'), passo: numero('0.5') })]);
    expect(corpo(r.codigo)[0]).toBe('    para i de 1.5 ate 3.0 passo 0.5 faca');
    expect(avisoDe(r)).toEqual([
      { tipoBloco: 'para', encaixe: 'DE', mensagem: DECIMAIS },
      { tipoBloco: 'para', encaixe: 'ATE', mensagem: DECIMAIS },
      { tipoBloco: 'para', encaixe: 'PASSO', mensagem: DECIMAIS },
    ]);
  });

  it('ordem dos avisos: variável, de, até, passo', () => {
    const r = gerar([para({ variavel: 'v-x', ate: numero('2.5'), passo: numero(0) })]);
    expect(r.avisos.map((a) => a.encaixe)).toEqual(['VAR', 'DE', 'ATE', 'PASSO']);
  });
});

describe('valorFixo', () => {
  it.each([
    ['numero 7', numero('7'), '7'],
    ['numero 007', numero('007'), '7'],
    ['numero 1,5', numero('1,5'), '1.5'],
    ['negativo de numero', negativo(numero(1)), '-1'],
    ['negativo de conta', negativo(conta('+', numero(1), numero(2))), null],
    ['numero inválido', numero('abc'), null],
    ['variável', variavel('v-i'), null],
    ['negativo vazio', { type: 'negativo', id: 'nv' }, null],
    ['ausente', undefined, null],
  ])('%s', (_n, no, esperado) => {
    expect(valorFixo(no)).toBe(esperado);
  });
});

describe('definições e entradas do registro', () => {
  it('enquanto', () => {
    expect(BLOCO_ENQUANTO).toMatchObject({ tipo: 'enquanto', rotulo: 'enquanto', categoria: 'comando', areas: ['FACA'] });
    expect(BLOCO_ENQUANTO.variantes).toBeUndefined();
    expect(BLOCO_ENQUANTO.definicao).toEqual({
      type: 'enquanto',
      message0: 'enquanto %1 faça',
      args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'FACA' }],
      previousStatement: null,
      nextStatement: null,
      inputsInline: true,
      colour: COR_REPETICAO,
      tooltip: 'Repete os comandos de dentro enquanto a condição for verdadeira. Se ela nunca ficar falsa, use Parar.',
    });
  });

  it('para', () => {
    expect(COR_REPETICAO).toBe(120);
    expect(BLOCO_PARA).toMatchObject({ tipo: 'para', rotulo: 'para', categoria: 'comando', areas: ['FACA'] });
    expect(BLOCO_PARA.definicao).toEqual({
      type: 'para',
      message0: 'para %1 de %2 até %3 passo %4 faça',
      args0: [
        campoVariavel(['inteiro']),
        { type: 'input_value', name: 'DE', check: ['Numero'] },
        { type: 'input_value', name: 'ATE', check: ['Numero'] },
        { type: 'input_value', name: 'PASSO', check: ['Numero'] },
      ],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'FACA' }],
      previousStatement: null,
      nextStatement: null,
      inputsInline: true,
      colour: COR_REPETICAO,
      tooltip:
        'Repete os comandos de dentro contando com a variável, de “de” até “até”, incluindo os dois. Sem passo, conta de 1 em 1; com passo negativo, conta para trás.',
    });
    expect(BLOCO_PARA.definicao.tooltip).toContain('incluindo os dois');
  });

  it('variantes do para', () => {
    const [sem, com] = BLOCO_PARA.variantes;
    expect([sem.nome, com.nome]).toEqual(['sem passo', 'com passo']);
    const semPasso = para({ de: numero(1), ate: numero(2) });
    const comPasso = para({ de: numero(1), ate: numero(2), passo: numero(1) });
    expect([sem.presente(semPasso), com.presente(semPasso)]).toEqual([true, false]);
    expect([sem.presente(comPasso), com.presente(comPasso)]).toEqual([false, true]);
    expect([sem.presente({ type: 'para' }), com.presente({ type: 'para' })]).toEqual([true, false]);
  });
});
