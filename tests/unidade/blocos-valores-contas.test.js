// Blocos numero, texto e aritmetico (RF-06, antecipados da 006 pela spec 003, research R-03;
// contracts/blocos-valores-contas.md; data-model, "Valor fixo de número" e "texto").
import { describe, it, expect } from 'vitest';
import { normalizarNumero, gerarTexto, BLOCO_NUMERO, BLOCO_TEXTO } from '../../src/blocos/valores.js';
import { BLOCO_ARITMETICO, OPERADORES_ARITMETICOS } from '../../src/blocos/contas.js';
import { BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

// criarRegistroTeste já traz o programa e o teste_escreva (encaixe VALOR).
const registro = criarRegistroTeste();
registro.registrarBloco(BLOCO_NUMERO);
registro.registrarBloco(BLOCO_TEXTO);
registro.registrarBloco(BLOCO_ARITMETICO);
registro.registrarBloco(BLOCO_VARIAVEL);

const IDADE = { id: 'v-idade', nome: 'idade', tipo: 'inteiro' };
const num = (n) => bloco('numero', { campos: { NUM: n } });
const txt = (t) => bloco('texto', t === undefined ? {} : { campos: { TEXTO: t } });
const conta = (op, a, b) => {
  const entradas = {};
  if (a) entradas.A = a;
  if (b) entradas.B = b;
  return bloco('aritmetico', { campos: { OP: op }, entradas });
};
const idade = () => bloco('variavel', { campos: { VAR: { id: IDADE.id } } });

function escreva(valor) {
  const { codigo, avisos } = gerarPortugol(
    projetoDeTeste({ variaveis: [IDADE], comandos: [bloco('teste_escreva', { entradas: { VALOR: valor } })] }),
    registro,
  );
  const linhas = codigo.split('\n');
  return { linha: linhas[linhas.indexOf('inicio') + 1], avisos: avisos.map((a) => a.mensagem) };
}

const presente = (bloco_, tipo, nome) => bloco_.variantes.find((v) => v.nome === nome).presente(tipo);

describe('normalizarNumero (R-07; data-model, "Normalização")', () => {
  it.each([
    ['3', '3'],
    [' 3 ', '3'],
    ['3,5', '3.5'],
    ['3.5', '3.5'],
    ['007', '7'],
    ['00,5', '0.5'],
    ['0', '0'],
    ['000', '0'],
    ['0,25', '0.25'],
    ['10', '10'],
  ])('%j vira %j', (entrada, saida) => {
    expect(normalizarNumero(entrada)).toBe(saida);
  });

  it.each(['12a', '.5', '5.', '1.000,5', '-3', '1e3', '', '   ', '3,5,1', '3 5'])('%j é recusado', (entrada) => {
    expect(normalizarNumero(entrada)).toBeNull();
  });

  it('entrada que não é texto é recusada sem lançar', () => {
    expect(normalizarNumero(undefined)).toBeNull();
    expect(normalizarNumero(42)).toBeNull();
    expect(normalizarNumero(null)).toBeNull();
  });
});

describe('gerarTexto (R-08)', () => {
  it('texto vazio gera ""', () => {
    expect(gerarTexto('')).toBe('""');
  });

  it('texto simples vai entre aspas', () => {
    expect(gerarTexto('Olá, mundo!')).toBe('"Olá, mundo!"');
  });

  it('escapa a barra antes das aspas', () => {
    expect(gerarTexto('a"b\\c')).toBe('"a\\"b\\\\c"');
    expect(gerarTexto('\\"')).toBe('"\\\\\\""');
  });

  it('barra seguida de n continua barra (não vira quebra de linha no Core)', () => {
    expect(gerarTexto('x\\ny')).toBe('"x\\\\ny"');
  });
});

describe('bloco numero (RF-06)', () => {
  it('gera o número normalizado', () => {
    expect(escreva(num('3.5')).linha).toBe('    escreva(3.5)');
    expect(escreva(num('3,5')).linha).toBe('    escreva(3.5)');
  });

  it('arquivo editado à mão com zeros à esquerda gera o número sem eles, sem aviso', () => {
    expect(escreva(num('007'))).toEqual({ linha: '    escreva(7)', avisos: [] });
  });

  it('número inválido gera ??? e aviso', () => {
    expect(escreva(num('12a'))).toEqual({
      linha: '    escreva(???)',
      avisos: ['O número do bloco número é inválido'],
    });
    expect(escreva(bloco('numero')).avisos).toEqual(['O número do bloco número é inválido']);
  });

  it('precedência PRIMARIO', () => {
    const ctx = { campo: (b, n) => b.fields?.[n], aviso: () => {} };
    expect(BLOCO_NUMERO.gerar(num('1'), ctx)).toEqual({ codigo: '1', precedencia: PRECEDENCIA.PRIMARIO });
  });

  it('variantes inteiro e real', () => {
    expect(presente(BLOCO_NUMERO, num('3'), 'inteiro')).toBe(true);
    expect(presente(BLOCO_NUMERO, num('3'), 'real')).toBe(false);
    expect(presente(BLOCO_NUMERO, num('3.5'), 'real')).toBe(true);
    expect(presente(BLOCO_NUMERO, num('3.5'), 'inteiro')).toBe(false);
  });

  it('definição: campo NUM com 0, validador e saída', () => {
    const d = BLOCO_NUMERO.definicao;
    expect(d.type).toBe('numero');
    expect(d.args0[0]).toMatchObject({ type: 'field_input', name: 'NUM', text: '0' });
    expect(d.extensions).toEqual(['validar_numero']);
    expect(d.output).toEqual(['Numero']); // 006, research R-08
    expect(d.tooltip).toBe('Um número. Use vírgula ou ponto para as casas decimais, como 3,5');
    expect(BLOCO_NUMERO.rotulo).toBe('número');
  });
});

describe('bloco texto (RF-06)', () => {
  it('gera o texto escapado', () => {
    expect(escreva(txt('a"b\\c')).linha).toBe('    escreva("a\\"b\\\\c")');
  });

  it('sem campo gera ""', () => {
    expect(escreva(txt()).linha).toBe('    escreva("")');
  });

  it('variantes simples e com aspas ou barra', () => {
    expect(presente(BLOCO_TEXTO, txt('Olá'), 'simples')).toBe(true);
    expect(presente(BLOCO_TEXTO, txt('Olá'), 'com aspas ou barra')).toBe(false);
    expect(presente(BLOCO_TEXTO, txt('a"b'), 'com aspas ou barra')).toBe(true);
    expect(presente(BLOCO_TEXTO, txt('a\\b'), 'com aspas ou barra')).toBe(true);
    expect(presente(BLOCO_TEXTO, txt('a\\b'), 'simples')).toBe(false);
    expect(presente(BLOCO_TEXTO, txt(), 'simples')).toBe(true);
  });

  it('definição: campo TEXTO vazio entre aspas tipográficas', () => {
    const d = BLOCO_TEXTO.definicao;
    expect(d.message0).toBe('“%1”');
    expect(d.args0[0]).toMatchObject({ type: 'field_input', name: 'TEXTO', text: '' });
    expect(d.output).toEqual(['Texto']); // 006, research R-08
    expect(d.tooltip).toBe('Um texto, mostrado exatamente como foi digitado');
  });
});

describe('bloco aritmetico (RF-06; R-06)', () => {
  it.each([
    ['idade + 1', conta('+', idade(), num('1'))],
    ['(2 + 3) * 4', conta('*', conta('+', num('2'), num('3')), num('4'))],
    ['10 - (3 - 2)', conta('-', num('10'), conta('-', num('3'), num('2')))],
    ['10 - 3 - 2', conta('-', conta('-', num('10'), num('3')), num('2'))],
    ['8 / (2 * 2)', conta('/', num('8'), conta('*', num('2'), num('2')))],
    ['8 / 2 * 2', conta('*', conta('/', num('8'), num('2')), num('2'))],
    ['2 * 3 + 1', conta('+', conta('*', num('2'), num('3')), num('1'))],
    ['1 + 2 * 3', conta('+', num('1'), conta('*', num('2'), num('3')))],
    ['7 % 2', conta('%', num('7'), num('2'))],
  ])('gera %s', (esperado, expressao) => {
    expect(escreva(expressao)).toEqual({ linha: `    escreva(${esperado})`, avisos: [] });
  });

  it('encaixes vazios geram ??? e avisos', () => {
    expect(escreva(conta('+', undefined, num('1')))).toEqual({
      linha: '    escreva(??? + 1)',
      avisos: ['Falta o primeiro valor do bloco conta'],
    });
    expect(escreva(conta('+', num('1'))).avisos).toEqual(['Falta o segundo valor do bloco conta']);
  });

  it('operador desconhecido gera ??? e aviso', () => {
    expect(escreva(conta('x', num('1'), num('2')))).toEqual({
      linha: '    escreva(???)',
      avisos: ['Escolha a conta do bloco conta'],
    });
  });

  it('devolve a precedência do operador', () => {
    const ctx = { campo: (b, n) => b.fields?.[n], valor: () => '1', aviso: () => {} };
    for (const op of ['+', '-']) {
      expect(BLOCO_ARITMETICO.gerar(conta(op), ctx).precedencia).toBe(PRECEDENCIA.ADITIVO);
    }
    for (const op of ['*', '/', '%']) {
      expect(BLOCO_ARITMETICO.gerar(conta(op), ctx).precedencia).toBe(PRECEDENCIA.MULTIPLICATIVO);
    }
  });

  it('OPERADORES_ARITMETICOS congelado com as cinco chaves', () => {
    expect(Object.isFrozen(OPERADORES_ARITMETICOS)).toBe(true);
    expect(Object.keys(OPERADORES_ARITMETICOS)).toEqual(['+', '-', '*', '/', '%']);
  });

  it('uma variante por operador', () => {
    expect(BLOCO_ARITMETICO.variantes.map((v) => v.nome)).toEqual(['+', '-', '*', '/', '%']);
    expect(presente(BLOCO_ARITMETICO, conta('%'), '%')).toBe(true);
    expect(presente(BLOCO_ARITMETICO, conta('+'), '%')).toBe(false);
  });

  it('definição: dois encaixes e a lista de operadores com rótulos amigáveis', () => {
    const d = BLOCO_ARITMETICO.definicao;
    expect(BLOCO_ARITMETICO.rotulo).toBe('conta');
    expect(d.message0).toBe('%1 %2 %3');
    expect(d.args0[0]).toMatchObject({ type: 'input_value', name: 'A' });
    expect(d.args0[1]).toEqual({
      type: 'field_dropdown',
      name: 'OP',
      options: [
        ['+', '+'],
        ['−', '-'],
        ['×', '*'],
        ['÷', '/'],
        ['resto', '%'],
      ],
    });
    expect(d.args0[2]).toMatchObject({ type: 'input_value', name: 'B' });
    expect(d.inputsInline).toBe(true);
    expect(d.output).toEqual(['Numero', 'Texto']); // 006, research R-08
    expect(d.tooltip).toBe('Faz a conta com os dois valores. “resto” é o que sobra da divisão');
  });
});

describe('tipos (006, research R-08)', () => {
  it('numero sai como Numero e texto como Texto', () => {
    expect(BLOCO_NUMERO.definicao.output).toEqual(['Numero']);
    expect(BLOCO_TEXTO.definicao.output).toEqual(['Texto']);
  });

  it('aritmetico aceita e devolve Numero ou Texto (o + concatena textos)', () => {
    const d = BLOCO_ARITMETICO.definicao;
    expect(d.output).toEqual(['Numero', 'Texto']);
    expect(d.args0[0]).toEqual({ type: 'input_value', name: 'A', check: ['Numero', 'Texto'] });
    expect(d.args0[2]).toEqual({ type: 'input_value', name: 'B', check: ['Numero', 'Texto'] });
  });

  it('o resto das definições da 003 não muda', () => {
    expect(BLOCO_NUMERO.definicao.type).toBe('numero');
    expect(BLOCO_TEXTO.definicao.type).toBe('texto');
    expect(BLOCO_ARITMETICO.definicao.type).toBe('aritmetico');
    expect(BLOCO_NUMERO.variantes.map((v) => v.nome)).toEqual(['inteiro', 'real']);
    expect(BLOCO_TEXTO.variantes.map((v) => v.nome)).toEqual(['simples', 'com aspas ou barra']);
    expect(BLOCO_ARITMETICO.variantes.map((v) => v.nome)).toEqual(['+', '-', '*', '/', '%']);
  });
});
