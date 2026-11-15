// Blocos escreva e leia (spec 003, RF-03; FR-001..FR-006; contracts/blocos-entrada-saida.md;
// data-model, "Comando escreva" e "Comando leia").
import { describe, it, expect } from 'vitest';
import { BLOCO_ESCREVA, MAX_VALORES, quantidadeValores, nomeEncaixe } from '../../src/blocos/entrada-saida.js';
import { BLOCO_TEXTO } from '../../src/blocos/valores.js';
import { BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

const registro = criarRegistro();
registro.registrarBloco(BLOCO_PROGRAMA);
registro.registrarBloco(BLOCO_ESCREVA);
registro.registrarBloco(BLOCO_TEXTO);
registro.registrarBloco(BLOCO_VARIAVEL);

const IDADE = { id: 'v-idade', nome: 'idade', tipo: 'inteiro' };
const txt = (t) => bloco('texto', { campos: { TEXTO: t } });
const idade = () => bloco('variavel', { campos: { VAR: { id: IDADE.id } } });

// escreva com n valores; "valores" é a lista dos blocos de VALOR1..VALORn (undefined = vazio).
function escreva(valores, extraState) {
  const entradas = {};
  valores.forEach((v, i) => {
    if (v) entradas[nomeEncaixe(i + 1)] = v;
  });
  const no = bloco('escreva', { entradas });
  if (extraState !== undefined) no.extraState = extraState;
  return no;
}

function corpo(comandos, variaveis = [IDADE]) {
  const { codigo, avisos } = gerarPortugol(projetoDeTeste({ variaveis, comandos }), registro);
  const linhas = codigo.split('\n');
  return {
    linhas: linhas.slice(linhas.indexOf('inicio') + 1, linhas.indexOf('fim_algoritmo')),
    avisos: avisos.map((a) => a.mensagem),
  };
}

describe('quantidadeValores (data-model)', () => {
  it('sem extraState vale 1', () => {
    expect(quantidadeValores({ type: 'escreva' })).toBe(1);
  });

  it('valor válido é mantido', () => {
    expect(quantidadeValores({ extraState: { valores: 3 } })).toBe(3);
    expect(quantidadeValores({ extraState: { valores: 10 } })).toBe(10);
  });

  it.each([0, -2, '2', 2.5, null, undefined, NaN])('%j vira 1', (valores) => {
    expect(quantidadeValores({ extraState: { valores } })).toBe(1);
  });

  it.each([11, 99])('%j vira 10', (valores) => {
    expect(quantidadeValores({ extraState: { valores } })).toBe(10);
  });

  it('MAX_VALORES é 10 e o encaixe k se chama VALORk', () => {
    expect(MAX_VALORES).toBe(10);
    expect(nomeEncaixe(1)).toBe('VALOR1');
    expect(nomeEncaixe(10)).toBe('VALOR10');
  });

  it('bloco sem nada não lança', () => {
    expect(quantidadeValores(undefined)).toBe(1);
    expect(quantidadeValores({ extraState: 'x' })).toBe(1);
  });
});

describe('bloco escreva (FR-001, FR-003)', () => {
  it('um texto gera escreva("Olá, mundo!") (História 1, cenário 1)', () => {
    expect(corpo([escreva([txt('Olá, mundo!')])])).toEqual({
      linhas: ['    escreva("Olá, mundo!")'],
      avisos: [],
    });
  });

  it('dois valores na ordem dos encaixes (História 1, cenário 2)', () => {
    expect(corpo([escreva([txt('Idade: '), idade()], { valores: 2 })]).linhas).toEqual([
      '    escreva("Idade: ", idade)',
    ]);
  });

  it('dois escreva seguidos geram duas linhas (História 1, cenário 3)', () => {
    expect(corpo([escreva([txt('a')]), escreva([txt('b')])]).linhas).toEqual([
      '    escreva("a")',
      '    escreva("b")',
    ]);
  });

  it('um valor vazio gera ??? e o aviso sem número', () => {
    expect(corpo([escreva([], { valores: 1 })])).toEqual({
      linhas: ['    escreva(???)'],
      avisos: ['Falta o valor do bloco escreva'],
    });
  });

  it('com vários valores, o aviso diz qual falta', () => {
    expect(corpo([escreva([txt('a'), undefined, txt('b')], { valores: 3 })])).toEqual({
      linhas: ['    escreva("a", ???, "b")'],
      avisos: ['Falta o valor 2 do bloco escreva'],
    });
  });

  it('encaixes acima da quantidade são ignorados', () => {
    expect(corpo([escreva([txt('a'), txt('b')], { valores: 1 })])).toEqual({
      linhas: ['    escreva("a")'],
      avisos: [],
    });
  });

  it('nunca gera escreva()', () => {
    for (const extraState of [undefined, { valores: 0 }, { valores: -1 }]) {
      expect(corpo([escreva([], extraState)]).linhas).toEqual(['    escreva(???)']);
    }
  });

  it('dez valores', () => {
    const dez = Array.from({ length: 10 }, (_, i) => txt(String(i)));
    expect(corpo([escreva(dez, { valores: 10 })]).linhas[0]).toBe(
      `    escreva(${dez.map((_, i) => `"${i}"`).join(', ')})`,
    );
  });

  it('variantes um valor e vários valores', () => {
    const [um, varios] = BLOCO_ESCREVA.variantes;
    expect(um.nome).toBe('um valor');
    expect(varios.nome).toBe('vários valores');
    expect(um.presente(escreva([]))).toBe(true);
    expect(um.presente(escreva([], { valores: 1 }))).toBe(true);
    expect(um.presente(escreva([], { valores: 2 }))).toBe(false);
    expect(varios.presente(escreva([], { valores: 2 }))).toBe(true);
    expect(varios.presente(escreva([]))).toBe(false);
  });

  it('definição: comando com VALOR1, mutador e dica (FR-006)', () => {
    const d = BLOCO_ESCREVA.definicao;
    expect(BLOCO_ESCREVA.tipo).toBe('escreva');
    expect(BLOCO_ESCREVA.rotulo).toBe('escreva');
    expect(BLOCO_ESCREVA.categoria).toBe('comando');
    expect(d.message0).toBe('escreva %1');
    expect(d.args0).toEqual([{ type: 'input_value', name: 'VALOR1' }]);
    expect(d.mutator).toBe('mutador_escreva');
    expect(d.previousStatement).toBeNull();
    expect(d.nextStatement).toBeNull();
    expect(d.inputsInline).toBe(true);
    expect(d.tooltip).toBe('Mostra os valores na tela, um ao lado do outro, e passa para a próxima linha');
  });
});
