// Bloco se (RF-04; spec 004, research R-03 a R-05; contracts/bloco-se.md).
import { describe, it, expect } from 'vitest';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { BLOCO_ESCREVA, BLOCO_LEIA } from '../../src/blocos/entrada-saida.js';
import { BLOCO_NUMERO, BLOCO_TEXTO, BLOCO_LOGICO } from '../../src/blocos/valores.js';
import { BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { BLOCO_RELACIONAL } from '../../src/blocos/comparacoes.js';
import { BLOCO_E_OU, BLOCO_NAO } from '../../src/blocos/logica.js';
import { BLOCO_SE, COR_DECISAO, temSenao, mensagemTirarSenao } from '../../src/blocos/decisao.js';

const registro = criarRegistro();
for (const b of [
  BLOCO_PROGRAMA,
  BLOCO_SE,
  BLOCO_ESCREVA,
  BLOCO_LEIA,
  BLOCO_TEXTO,
  BLOCO_NUMERO,
  BLOCO_LOGICO,
  BLOCO_VARIAVEL,
  BLOCO_RELACIONAL,
  BLOCO_E_OU,
  BLOCO_NAO,
]) {
  registro.registrarBloco(b);
}

const VARIAVEIS = [
  { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
  { id: 'v-ok', nome: 'ok', tipo: 'logico' },
];

let contador = 0;
const id = (t) => `${t}-${++contador}`;

// Construtores de nós JSON.
const texto = (t) => ({ type: 'texto', id: id('t'), fields: { TEXTO: t } });
const numero = (n) => ({ type: 'numero', id: id('n'), fields: { NUM: String(n) } });
const logico = (v) => ({ type: 'logico', id: id('l'), fields: { VALOR: v } });
const variavel = (idVar) => ({ type: 'variavel', id: id('v'), fields: { VAR: { id: idVar } } });
const relacional = (op, a, b) => ({ type: 'relacional', id: id('r'), fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } });
const eOu = (op, a, b) => ({ type: 'e_ou', id: id('eo'), fields: { OP: op }, inputs: { A: { block: a }, B: { block: b } } });
const nao = (x) => ({ type: 'nao', id: id('nao'), inputs: { X: { block: x } } });
const escreva = (valor) => ({ type: 'escreva', id: id('e'), inputs: { VALOR1: { block: valor } } });

function cadeia(comandos) {
  if (comandos.length === 0) return undefined;
  const [primeiro, ...resto] = comandos;
  const proximo = cadeia(resto);
  return proximo ? { ...primeiro, next: { block: proximo } } : primeiro;
}

function se({ condicao, entao = [], senao, extraState, sid } = {}) {
  const no = { type: 'se', id: sid ?? id('se'), inputs: {} };
  if (condicao) no.inputs.CONDICAO = { block: condicao };
  if (entao.length) no.inputs.ENTAO = { block: cadeia(entao) };
  if (senao !== undefined) {
    no.extraState = { senao: true };
    if (senao.length) no.inputs.SENAO = { block: cadeia(senao) };
  }
  if (extraState !== undefined) no.extraState = extraState;
  return no;
}

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

const IDADE_MAIOR = () => relacional('>=', variavel('v-idade'), numero(18));

describe('geração do se (FR-001, FR-002, FR-005)', () => {
  it('P-2 / História 1, cenário 1: se idade >= 18 entao escreva("Maior") fim_se', () => {
    const { codigo, avisos } = gerar([se({ condicao: IDADE_MAIOR(), entao: [escreva(texto('Maior'))] })]);
    expect(avisos).toEqual([]);
    expect(corpo(codigo)).toEqual(['    se idade >= 18 entao', '        escreva("Maior")', '    fim_se']);
  });

  it('História 2, cenário 1: senao entre os ramos e um único fim_se', () => {
    const { codigo } = gerar([
      se({ condicao: IDADE_MAIOR(), entao: [escreva(texto('Maior'))], senao: [escreva(texto('Menor'))] }),
    ]);
    expect(corpo(codigo)).toEqual([
      '    se idade >= 18 entao',
      '        escreva("Maior")',
      '    senao',
      '        escreva("Menor")',
      '    fim_se',
    ]);
    expect(codigo.match(/fim_se/g)).toHaveLength(1);
  });

  it('História 3, cenário 1: se dentro do senão de outro, cada um com o seu fim_se', () => {
    const interno = se({
      condicao: relacional('>=', variavel('v-idade'), numero(5)),
      entao: [escreva(texto('B'))],
      senao: [escreva(texto('C'))],
    });
    const { codigo } = gerar([
      se({ condicao: relacional('>=', variavel('v-idade'), numero(7)), entao: [escreva(texto('A'))], senao: [interno] }),
    ]);
    expect(corpo(codigo)).toEqual([
      '    se idade >= 7 entao',
      '        escreva("A")',
      '    senao',
      '        se idade >= 5 entao',
      '            escreva("B")',
      '        senao',
      '            escreva("C")',
      '        fim_se',
      '    fim_se',
    ]);
  });

  it('6 níveis aninhados: um nível de indentação por se (casos de borda)', () => {
    let atual = escreva(texto('fundo'));
    for (let n = 0; n < 6; n++) atual = se({ condicao: logico('verdadeiro'), entao: [atual] });
    const linhas = corpo(gerar([atual]).codigo);
    expect(linhas).toHaveLength(13);
    for (let n = 0; n < 6; n++) {
      expect(linhas[n]).toBe(`${' '.repeat(4 * (n + 1))}se verdadeiro entao`);
      expect(linhas[12 - n]).toBe(`${' '.repeat(4 * (n + 1))}fim_se`);
    }
    expect(linhas[6]).toBe(`${' '.repeat(28)}escreva("fundo")`);
  });

  it('então e senão vazios: permitido, sem aviso', () => {
    const { codigo, avisos } = gerar([se({ condicao: variavel('v-ok'), senao: [] })]);
    expect(avisos).toEqual([]);
    expect(corpo(codigo)).toEqual(['    se ok entao', '    senao', '    fim_se']);
  });

  it('a condição não leva parênteses (e, não, comparação)', () => {
    const condicao = eOu('e', nao(relacional('>', variavel('v-idade'), numero(10))), variavel('v-ok'));
    const { codigo } = gerar([se({ condicao })]);
    expect(corpo(codigo)).toEqual(['    se nao (idade > 10) e ok entao', '    fim_se']);
  });

  it('condição vazia: ??? e o aviso "Falta a condição do bloco se"', () => {
    const { codigo, avisos } = gerar([se({ sid: 'se-vazio', entao: [escreva(texto('x'))] })]);
    expect(corpo(codigo)[0]).toBe('    se ??? entao');
    expect(avisos).toEqual([
      { blocoId: 'se-vazio', tipoBloco: 'se', encaixe: 'CONDICAO', mensagem: 'Falta a condição do bloco se' },
    ]);
  });

  it.each([[{ senao: 'sim' }], [{ senao: 1 }], [{ senao: 'true' }], [{ senao: false }], [null]])(
    'extraState %j com SENAO preenchido: sem senao, o SENAO é ignorado',
    (extraState) => {
      const no = se({ condicao: variavel('v-ok'), entao: [escreva(texto('a'))], extraState });
      no.inputs.SENAO = { block: escreva(texto('b')) };
      const { codigo } = gerar([no]);
      expect(corpo(codigo)).toEqual(['    se ok entao', '        escreva("a")', '    fim_se']);
    },
  );

  it('o comando seguinte continua depois do fim_se', () => {
    const { codigo } = gerar([se({ condicao: variavel('v-ok') }), escreva(texto('depois'))]);
    expect(corpo(codigo)).toEqual(['    se ok entao', '    fim_se', '    escreva("depois")']);
  });
});

describe('temSenao e mensagemTirarSenao', () => {
  it('temSenao só com senao === true', () => {
    expect(temSenao({ extraState: { senao: true } })).toBe(true);
    for (const b of [{}, { extraState: {} }, { extraState: { senao: false } }, { extraState: { senao: 'true' } }, { extraState: { senao: 1 } }, undefined, null]) {
      expect(temSenao(b)).toBe(false);
    }
  });

  it('mensagem no singular e no plural', () => {
    expect(mensagemTirarSenao(1)).toBe('Tirar o senão apaga 1 bloco que está dentro dele.');
    expect(mensagemTirarSenao(3)).toBe('Tirar o senão apaga 3 blocos que estão dentro dele.');
  });
});

describe('definição e entrada do registro', () => {
  it('definição conforme o contrato (check Logico na condição)', () => {
    expect(BLOCO_SE.definicao).toEqual({
      type: 'se',
      message0: 'se %1 então',
      args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
      message1: '%1',
      args1: [{ type: 'input_statement', name: 'ENTAO' }],
      previousStatement: null,
      nextStatement: null,
      inputsInline: true,
      mutator: 'mutador_se',
      colour: 210,
      tooltip:
        'Faz os comandos de dentro só quando a condição for verdadeira. Com “senão”, faz os outros comandos quando ela for falsa.',
    });
    expect(COR_DECISAO).toBe(210);
  });

  it('entrada: comando com as áreas ENTAO e SENAO e as duas variantes', () => {
    expect(BLOCO_SE).toMatchObject({ tipo: 'se', rotulo: 'se', categoria: 'comando', areas: ['ENTAO', 'SENAO'] });
    const [sem, com] = registro.variantesDe('se');
    expect([sem.nome, com.nome]).toEqual(['sem senão', 'com senão']);
    expect(sem.presente({})).toBe(true);
    expect(sem.presente({ extraState: { senao: true } })).toBe(false);
    expect(com.presente({ extraState: { senao: true } })).toBe(true);
    expect(com.presente({ extraState: { senao: 'sim' } })).toBe(false);
  });
});
