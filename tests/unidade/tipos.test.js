// Tipos dos encaixes (SC-002 da 006; research R-08 a R-10; contracts/tipos-encaixe.md).
import { describe, it, expect } from 'vitest';
import {
  TIPO_VALOR,
  checkDoTipoVariavel,
  compativeis,
  checkEfetivo,
  encaixesIncompativeis,
} from '../../src/blocos/tipos.js';
import { registroPadrao } from '../../src/blocos/registro.js';

// Entradas de registro mínimas, montadas aqui: os blocos novos ainda não existem.
const entrada = (tipo, definicao, extra = {}) => ({ tipo, definicao: { type: tipo, ...definicao }, ...extra });
const CONTA = entrada('conta', {
  args0: [
    { type: 'input_value', name: 'A', check: ['Numero', 'Texto'] },
    { type: 'field_dropdown', name: 'OP' },
    { type: 'input_value', name: 'B', check: ['Numero', 'Texto'] },
  ],
  output: ['Numero', 'Texto'],
});
const NUM = entrada('num', { args0: [], output: 'Numero' });
const LOG = entrada('log', { args0: [], output: ['Logico'] });
const LIVRE = entrada('livre', { args0: [{ type: 'input_value', name: 'V' }], output: null });
const VAR = entrada('var', { args0: [{ type: 'campo_variavel', name: 'VAR' }], output: null }, { tipoPelaVariavel: 'saida' });
const RECEBE = entrada(
  'recebe',
  { args0: [{ type: 'campo_variavel', name: 'VAR' }, { type: 'input_value', name: 'VALOR' }] },
  { tipoPelaVariavel: 'VALOR' },
);
const COMANDO = entrada('cmd', { args0: [{ type: 'input_value', name: 'V', check: ['Logico'] }] });

const registro = {
  obter: (tipo) => [CONTA, NUM, LOG, LIVRE, VAR, RECEBE, COMANDO].find((e) => e.tipo === tipo),
};

const no = (type, id, { inputs, fields, next } = {}) => {
  const b = { type, id };
  if (fields) b.fields = fields;
  if (inputs) b.inputs = Object.fromEntries(Object.entries(inputs).map(([k, v]) => [k, { block: v }]));
  if (next) b.next = { block: next };
  return b;
};
const estado = (...blocos) => ({ languageVersion: 0, blocks: blocos });

describe('TIPO_VALOR e checkDoTipoVariavel', () => {
  it('tem os três tipos, congelados', () => {
    expect(Object.isFrozen(TIPO_VALOR)).toBe(true);
    expect(TIPO_VALOR).toEqual({ NUMERO: 'Numero', TEXTO: 'Texto', LOGICO: 'Logico' });
  });

  it.each([
    ['inteiro', ['Numero']],
    ['real', ['Numero']],
    ['cadeia', ['Texto']],
    ['logico', ['Logico']],
    [undefined, null],
    ['', null],
    ['vetor', null],
  ])('%j → %j', (tipo, check) => {
    expect(checkDoTipoVariavel(tipo)).toEqual(check);
  });
});

describe('compativeis', () => {
  it.each([
    [null, null, true],
    [null, ['Logico'], true],
    [['Numero'], null, true],
    [['Numero'], ['Numero', 'Texto'], true],
    [['Logico'], ['Numero', 'Texto'], false],
    [['Numero'], ['Logico'], false],
  ])('%j × %j → %j', (a, b, esperado) => {
    expect(compativeis(a, b)).toBe(esperado);
  });
});

describe('checkEfetivo', () => {
  it('saída vem do output da definição, normalizada', () => {
    expect(checkEfetivo(LIVRE, 'saida')).toBeNull();
    expect(checkEfetivo(NUM, 'saida')).toEqual(['Numero']);
    expect(checkEfetivo(CONTA, 'saida')).toEqual(['Numero', 'Texto']);
  });

  it('encaixe vem do check do input_value', () => {
    expect(checkEfetivo(CONTA, 'A')).toEqual(['Numero', 'Texto']);
    expect(checkEfetivo(LIVRE, 'V')).toBeNull();
    expect(checkEfetivo(CONTA, 'NAO_EXISTE')).toBeNull();
  });

  it('bloco desconhecido vale qualquer', () => {
    expect(checkEfetivo(undefined, 'saida')).toBeNull();
    expect(checkEfetivo(undefined, 'A')).toBeNull();
  });

  it('tipoPelaVariavel troca o check daquele ponto pelo tipo da variável', () => {
    expect(checkEfetivo(VAR, 'saida', 'logico')).toEqual(['Logico']);
    expect(checkEfetivo(VAR, 'saida', undefined)).toBeNull();
    expect(checkEfetivo(RECEBE, 'VALOR', 'cadeia')).toEqual(['Texto']);
    expect(checkEfetivo(RECEBE, 'saida', 'cadeia')).toBeNull();
  });
});

describe('encaixesIncompativeis', () => {
  it('estado vazio, ausente ou sem blocos não tem pares', () => {
    expect(encaixesIncompativeis(estado(), registro, {})).toEqual([]);
    expect(encaixesIncompativeis(undefined, registro, {})).toEqual([]);
    expect(encaixesIncompativeis({}, registro, {})).toEqual([]);
  });

  it('acha encaixe direto incompatível', () => {
    const e = estado(no('conta', 'c1', { inputs: { A: no('log', 'l1'), B: no('num', 'n1') } }));
    expect(encaixesIncompativeis(e, registro, {})).toEqual([{ pai: 'c1', encaixe: 'A', filho: 'l1' }]);
  });

  it('acha encaixe aninhado, em comando ligado por next e em bloco solto, na ordem da visita', () => {
    const e = estado(
      no('cmd', 'k1', {
        inputs: { V: no('conta', 'c1', { inputs: { A: no('log', 'l1') } }) },
        next: no('cmd', 'k2', { inputs: { V: no('num', 'n2') } }),
      }),
      no('conta', 'c9', { inputs: { B: no('log', 'l9') } }),
    );
    expect(encaixesIncompativeis(e, registro, {})).toEqual([
      { pai: 'k1', encaixe: 'V', filho: 'c1' },
      { pai: 'c1', encaixe: 'A', filho: 'l1' },
      { pai: 'k2', encaixe: 'V', filho: 'n2' },
      { pai: 'c9', encaixe: 'B', filho: 'l9' },
    ]);
  });

  it('usa o tipo das variáveis, em objeto ou Map', () => {
    const e = estado(
      no('conta', 'c1', { inputs: { A: no('var', 'v1', { fields: { VAR: { id: 'ok' } } }) } }),
      no('recebe', 'r1', { fields: { VAR: { id: 'idade' } }, inputs: { VALOR: no('log', 'l1') } }),
    );
    const esperado = [
      { pai: 'c1', encaixe: 'A', filho: 'v1' },
      { pai: 'r1', encaixe: 'VALOR', filho: 'l1' },
    ];
    expect(encaixesIncompativeis(e, registro, { ok: 'logico', idade: 'inteiro' })).toEqual(esperado);
    expect(encaixesIncompativeis(e, registro, new Map([['ok', 'logico'], ['idade', 'inteiro']]))).toEqual(esperado);
    expect(encaixesIncompativeis(e, registro, { ok: 'inteiro', idade: 'logico' })).toEqual([]);
    expect(encaixesIncompativeis(e, registro, {})).toEqual([]);
  });

  it('ignora shadows e trata bloco não registrado como qualquer', () => {
    const e = estado({
      type: 'conta',
      id: 'c1',
      inputs: { A: { shadow: no('log', 's1') }, B: { block: no('desconhecido', 'x1') } },
    });
    expect(encaixesIncompativeis(e, registro, {})).toEqual([]);
  });
});

// Matriz do SC-002 com os blocos reais (contracts/tipos-encaixe.md, "Matriz do SC-002").
describe('matriz do SC-002', () => {
  const saida = (tipo, tipoVariavel) => checkEfetivo(registroPadrao.obter(tipo), 'saida', tipoVariavel);
  const encaixe = (tipo, nome, tipoVariavel) => checkEfetivo(registroPadrao.obter(tipo), nome, tipoVariavel);

  const FILHOS = {
    numero: saida('numero'),
    texto: saida('texto'),
    logico: saida('logico'),
    aritmetico: saida('aritmetico'),
    negativo: saida('negativo'),
    relacional: saida('relacional'),
    e_ou: saida('e_ou'),
    nao: saida('nao'),
    'variavel inteiro': saida('variavel', 'inteiro'),
    'variavel real': saida('variavel', 'real'),
    'variavel cadeia': saida('variavel', 'cadeia'),
    'variavel logico': saida('variavel', 'logico'),
    'variavel sem variável': saida('variavel', undefined),
  };

  const ENCAIXES = {
    'aritmetico A': encaixe('aritmetico', 'A'),
    'aritmetico B': encaixe('aritmetico', 'B'),
    'negativo X': encaixe('negativo', 'X'),
    'relacional A': encaixe('relacional', 'A'),
    'relacional B': encaixe('relacional', 'B'),
    'e_ou A': encaixe('e_ou', 'A'),
    'e_ou B': encaixe('e_ou', 'B'),
    'nao X': encaixe('nao', 'X'),
    'recebe inteiro': encaixe('variavel_recebe', 'VALOR', 'inteiro'),
    'recebe real': encaixe('variavel_recebe', 'VALOR', 'real'),
    'recebe cadeia': encaixe('variavel_recebe', 'VALOR', 'cadeia'),
    'recebe logico': encaixe('variavel_recebe', 'VALOR', 'logico'),
    'recebe sem variável': encaixe('variavel_recebe', 'VALOR', undefined),
    'escreva VALOR1': encaixe('escreva', 'VALOR1'),
  };

  // Uma linha por filho; colunas na ordem de ENCAIXES. 1 = encaixa, 0 = não encaixa.
  //              ari ari neg rel rel eou eou nao  int real cad log sem  esc
  const TABELA = {
    numero:                  [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    texto:                   [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    logico:                  [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    aritmetico:              [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 1],
    negativo:                [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    relacional:              [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    e_ou:                    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    nao:                     [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    'variavel inteiro':      [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    'variavel real':         [1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 1, 1],
    'variavel cadeia':       [1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1],
    'variavel logico':       [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1],
    'variavel sem variável': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  };

  const nomesEncaixes = Object.keys(ENCAIXES);
  const celulas = Object.entries(TABELA).flatMap(([filho, linha]) =>
    linha.map((esperado, i) => [filho, nomesEncaixes[i], esperado === 1]),
  );

  it('a tabela cobre todos os filhos e encaixes', () => {
    expect(Object.keys(TABELA)).toEqual(Object.keys(FILHOS));
    for (const linha of Object.values(TABELA)) expect(linha).toHaveLength(nomesEncaixes.length);
  });

  it.each(celulas)('%s em %s → %s', (filho, nomeEncaixe, esperado) => {
    expect(compativeis(ENCAIXES[nomeEncaixe], FILHOS[filho])).toBe(esperado);
  });

  it('nenhum valor só lógico encaixa onde só cabe número, e vice-versa', () => {
    const so = (check, tipo) => Array.isArray(check) && check.length > 0 && check.every((t) => t === tipo);
    const violacoes = [];
    for (const [filho, checkFilho] of Object.entries(FILHOS)) {
      for (const [nome, checkEncaixe] of Object.entries(ENCAIXES)) {
        const cruzado =
          (so(checkFilho, 'Logico') && so(checkEncaixe, 'Numero')) ||
          (so(checkFilho, 'Numero') && so(checkEncaixe, 'Logico'));
        if (cruzado && compativeis(checkEncaixe, checkFilho)) violacoes.push(`${filho} → ${nome}`);
      }
    }
    expect(violacoes).toEqual([]);
  });
});
