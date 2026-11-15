// Blocos variavel_recebe e variavel (spec 002, RF-02; FR-005, FR-006;
// contracts/blocos-variaveis.md, "Exemplos normativos").
import { describe, it, expect } from 'vitest';
import { BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { PRECEDENCIA } from '../../src/portugol/precedencia.js';
import { TIPOS_VARIAVEL } from '../../src/projeto/formato.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { verificarExecucao } from '../../src/portugol/execucao.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';
import { BLOCO_NUMERO } from '../../src/blocos/valores.js';
import { BLOCO_ARITMETICO } from '../../src/blocos/contas.js';
import { BLOCO_ESCREVA } from '../../src/blocos/entrada-saida.js';

const registro = criarRegistroTeste();
registro.registrarBloco(BLOCO_VARIAVEL_RECEBE);
registro.registrarBloco(BLOCO_VARIAVEL);
// Blocos reais de número, conta e escreva (spec 003, T017), no lugar dos blocos de teste.
registro.registrarBloco(BLOCO_NUMERO);
registro.registrarBloco(BLOCO_ARITMETICO);
registro.registrarBloco(BLOCO_ESCREVA);

const IDADE = { id: 'v-idade', nome: 'idade', tipo: 'inteiro' };
const ANOS = { id: 'v-anos', nome: 'anos', tipo: 'inteiro' };

const ler = (variavel) => bloco('variavel', { campos: { VAR: variavel ? { id: variavel.id } : null } });
const recebe = (variavel, valor) =>
  bloco('variavel_recebe', {
    campos: { VAR: variavel ? { id: variavel.id } : null },
    entradas: valor ? { VALOR: valor } : {},
  });
const numero = (n) => bloco('numero', { campos: { NUM: String(n) } });
const soma = (a, b) => bloco('aritmetico', { campos: { OP: '+' }, entradas: { A: a, B: b } });
const escreva = (valor) => bloco('escreva', { entradas: { VALOR1: valor } });

function corpo(variaveis, comandos) {
  const { codigo, avisos } = gerarPortugol(projetoDeTeste({ variaveis, comandos }), registro);
  const linhas = codigo.split('\n');
  const inicio = linhas.indexOf('inicio');
  const fim = linhas.indexOf('fim_algoritmo');
  return { linhas: linhas.slice(inicio + 1, fim), avisos: avisos.map((a) => a.mensagem), codigo, resultado: { codigo, avisos } };
}

describe('exemplos normativos (contracts/blocos-variaveis.md)', () => {
  it('idade recebe [anos] → idade <- anos, sem avisos', () => {
    const r = corpo([IDADE, ANOS], [recebe(IDADE, ler(ANOS))]);
    expect(r.linhas).toEqual(['    idade <- anos']);
    expect(r.avisos).toEqual([]);
  });

  it('História 2, cenário 2: idade recebe [ ] → idade <- ??? com aviso e Executar bloqueado', () => {
    const r = corpo([IDADE], [recebe(IDADE, null)]);
    expect(r.linhas).toEqual(['    idade <- ???']);
    expect(r.avisos).toEqual(['Falta o valor do bloco recebe']);
    expect(verificarExecucao(r.resultado).permitida).toBe(false);
  });

  it('[ ] recebe [ ] → ??? <- ???, avisos da variável e depois do valor', () => {
    const r = corpo([], [recebe(null, null)]);
    expect(r.linhas).toEqual(['    ??? <- ???']);
    expect(r.avisos).toEqual(['Falta a variável do bloco recebe', 'Falta o valor do bloco recebe']);
  });

  it('variável apagada do projeto dentro do valor → ??? com aviso do bloco variável', () => {
    const r = corpo([IDADE], [recebe(IDADE, ler(ANOS))]);
    expect(r.linhas).toEqual(['    idade <- ???']);
    expect(r.avisos).toEqual(['Falta a variável do bloco variável']);
  });

  it('História 2, cenário 1: idade recebe [15] → idade <- 15', () => {
    const r = corpo([IDADE], [recebe(IDADE, numero(15))]);
    expect(r.linhas).toEqual(['    idade <- 15']);
    expect(r.avisos).toEqual([]);
  });

  it('escreva(idade + 1) com os blocos reais de escreva, conta e número (spec 003)', () => {
    const r = corpo([IDADE], [escreva(soma(ler(IDADE), numero(1)))]);
    expect(r.linhas).toEqual(['    escreva(idade + 1)']);
    expect(r.avisos).toEqual([]);
  });
});

describe('entradas do registro', () => {
  it('variavel_recebe: comando com rótulo "recebe", sem áreas nem variantes', () => {
    expect(BLOCO_VARIAVEL_RECEBE).toMatchObject({ tipo: 'variavel_recebe', rotulo: 'recebe', categoria: 'comando' });
    expect(registro.obter('variavel_recebe').areas).toEqual([]);
    expect(registro.obter('variavel_recebe').variantes).toEqual([]);
  });

  it('variavel: valor com rótulo "variável", sem áreas nem variantes', () => {
    expect(BLOCO_VARIAVEL).toMatchObject({ tipo: 'variavel', rotulo: 'variável', categoria: 'valor' });
    expect(registro.obter('variavel').areas).toEqual([]);
    expect(registro.obter('variavel').variantes).toEqual([]);
  });

  it('definições: campo VAR é campo_variavel com os quatro tipos; VALOR é input_value; variavel tem output null', () => {
    const [campoRecebe, valor] = BLOCO_VARIAVEL_RECEBE.definicao.args0;
    expect(BLOCO_VARIAVEL_RECEBE.definicao.type).toBe('variavel_recebe');
    expect(campoRecebe).toMatchObject({ type: 'campo_variavel', name: 'VAR', variableTypes: [...TIPOS_VARIAVEL] });
    expect(valor).toMatchObject({ type: 'input_value', name: 'VALOR' });

    const [campoLer] = BLOCO_VARIAVEL.definicao.args0;
    expect(BLOCO_VARIAVEL.definicao.type).toBe('variavel');
    expect(campoLer).toMatchObject({ type: 'campo_variavel', name: 'VAR', variableTypes: [...TIPOS_VARIAVEL] });
    expect(BLOCO_VARIAVEL.definicao.output).toBeNull();
  });

  it('gerar do variavel devolve a precedência PRIMARIO', () => {
    const ctx = { variavel: () => 'idade' };
    expect(BLOCO_VARIAVEL.gerar(ler(IDADE), ctx)).toEqual({ codigo: 'idade', precedencia: PRECEDENCIA.PRIMARIO });
  });
});

describe('História 3 - Usar o valor de uma variável (FR-006)', () => {
  const B = { id: 'v-b', nome: 'b', tipo: 'inteiro' };
  const A = { id: 'v-a', nome: 'a', tipo: 'inteiro' };

  it('cenário 1: escreva(idade + 1), sem avisos', () => {
    const r = corpo([IDADE], [escreva(soma(ler(IDADE), numero(1)))]);
    expect(r.linhas).toEqual(['    escreva(idade + 1)']);
    expect(r.avisos).toEqual([]);
  });

  it('na condição de um se: se idade entao', () => {
    const se = bloco('teste_se', { entradas: { CONDICAO: ler(IDADE) } });
    const r = corpo([IDADE], [se]);
    expect(r.linhas).toEqual(['    se idade entao', '    fim_se']);
    expect(r.avisos).toEqual([]);
  });

  it('no valor de um recebe: de outra variável (a <- b) e da própria (a <- a)', () => {
    const r = corpo([A, B], [recebe(A, ler(B)), recebe(A, ler(A))]);
    expect(r.linhas).toEqual(['    a <- b', '    a <- a']);
    expect(r.avisos).toEqual([]);
  });

  it('variável sem id dentro de uma soma: ??? + 1 com o aviso do bloco variável', () => {
    const r = corpo([IDADE], [escreva(soma(ler(null), numero(1)))]);
    expect(r.linhas).toEqual(['    escreva(??? + 1)']);
    expect(r.avisos).toEqual(['Falta a variável do bloco variável']);
  });
});

// Spec 003, research R-05 (P-3): o campo de variável é um módulo comum.
describe('campoVariavel (spec 003, P-3)', () => {
  it('devolve um objeto novo a cada chamada, com os quatro tipos', async () => {
    const { campoVariavel } = await import('../../src/blocos/campo-variavel.js');
    const a = campoVariavel();
    const b = campoVariavel();
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
    expect(a).toEqual({
      type: 'campo_variavel',
      name: 'VAR',
      variable: null,
      variableTypes: [...TIPOS_VARIAVEL],
      defaultType: 'inteiro',
    });
    expect(BLOCO_VARIAVEL.definicao.args0[0]).toEqual(a);
  });
});

describe('tipo pela variável (006, pendência P-2 da 002; research R-09)', () => {
  it('a saída do variavel e o encaixe VALOR do recebe seguem o tipo da variável', () => {
    expect(BLOCO_VARIAVEL.tipoPelaVariavel).toBe('saida');
    expect(BLOCO_VARIAVEL_RECEBE.tipoPelaVariavel).toBe('VALOR');
  });

  it('a definição não fixa o tipo: ele vem da variável escolhida', () => {
    expect(BLOCO_VARIAVEL.definicao.output).toBeNull();
    const valor = BLOCO_VARIAVEL_RECEBE.definicao.args0.find((a) => a.name === 'VALOR');
    expect(valor).toEqual({ type: 'input_value', name: 'VALOR' });
  });
});
