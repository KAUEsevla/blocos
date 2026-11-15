// Variáveis do projeto (spec 002, RF-02; contracts/blocos-variaveis.md, "Variáveis do projeto").
import { describe, it, expect } from 'vitest';
import {
  variaveisDoMapa,
  blocosComVariaveis,
  contarBlocosApagados,
  textoApagar,
} from '../../src/projeto/variaveis.js';
import { bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';

const modelo = (id, nome, tipo) => ({ getId: () => id, getName: () => nome, getType: () => tipo });

function congelarFundo(valor) {
  if (valor && typeof valor === 'object') {
    Object.values(valor).forEach(congelarFundo);
    Object.freeze(valor);
  }
  return valor;
}

describe('variaveisDoMapa', () => {
  it('preserva a ordem recebida e devolve { id, nome, tipo }', () => {
    const lista = variaveisDoMapa([
      modelo('v2', 'nome', 'cadeia'),
      modelo('v1', 'idade', 'inteiro'),
      modelo('v3', 'ok', 'logico'),
      modelo('v4', 'altura', 'real'),
    ]);
    expect(lista).toEqual([
      { id: 'v2', nome: 'nome', tipo: 'cadeia' },
      { id: 'v1', nome: 'idade', tipo: 'inteiro' },
      { id: 'v3', nome: 'ok', tipo: 'logico' },
      { id: 'v4', nome: 'altura', tipo: 'real' },
    ]);
  });

  it('ignora modelos com tipo fora de TIPOS_VARIAVEL', () => {
    const lista = variaveisDoMapa([
      modelo('v1', 'item', ''),
      modelo('v2', 'idade', 'inteiro'),
      modelo('v3', 'texto', 'texto'),
    ]);
    expect(lista).toEqual([{ id: 'v2', nome: 'idade', tipo: 'inteiro' }]);
  });

  it('lista vazia (ou ausente) vira []', () => {
    expect(variaveisDoMapa([])).toEqual([]);
    expect(variaveisDoMapa(undefined)).toEqual([]);
  });
});

describe('blocosComVariaveis', () => {
  const variaveis = [
    { id: 'v1', nome: 'idade', tipo: 'inteiro' },
    { id: 'v2', nome: 'nome', tipo: 'cadeia' },
  ];

  it('devolve cópia com variables na ordem de variaveis, sem alterar a entrada', () => {
    const blocos = congelarFundo(projetoVazio().blocos);
    const resultado = blocosComVariaveis(blocos, congelarFundo([...variaveis]));
    expect(resultado.variables).toEqual([
      { id: 'v1', name: 'idade', type: 'inteiro' },
      { id: 'v2', name: 'nome', type: 'cadeia' },
    ]);
    expect(resultado.blocks).toEqual(blocos.blocks);
    expect(resultado).not.toBe(blocos);
    expect(blocos.variables).toBeUndefined();
  });

  it('substitui uma chave variables que já exista', () => {
    const blocos = { ...projetoVazio().blocos, variables: [{ id: 'x', name: 'velha', type: 'real' }] };
    expect(blocosComVariaveis(blocos, variaveis).variables.map((v) => v.id)).toEqual(['v1', 'v2']);
  });

  it('funciona com blocos {} e sem variáveis', () => {
    expect(blocosComVariaveis({}, variaveis)).toEqual({
      variables: [
        { id: 'v1', name: 'idade', type: 'inteiro' },
        { id: 'v2', name: 'nome', type: 'cadeia' },
      ],
    });
    expect(blocosComVariaveis({}, [])).toEqual({ variables: [] });
  });
});

// As variáveis entram por variaveisDoMapa, como faz a tela (spec 002, research R-04).
describe('História 1 - Criar uma variável com tipo (gerador)', () => {
  const comVariaveis = (modelos) => ({ ...projetoVazio(), variaveis: variaveisDoMapa(modelos) });

  it('cenário 1: idade inteiro gera a seção var com "idade: inteiro"', () => {
    const { codigo } = gerarPortugol(comVariaveis([modelo('v1', 'idade', 'inteiro')]));
    expect(codigo).toContain('var\n    idade: inteiro\n\ninicio');
  });

  it('cenário 2: uma por linha, agrupadas por tipo, na ordem de criação dentro do tipo', () => {
    const { codigo } = gerarPortugol(
      comVariaveis([modelo('va', 'a', 'inteiro'), modelo('vn', 'nome', 'cadeia'), modelo('vb', 'b', 'inteiro')]),
    );
    expect(codigo).toBe(
      'algoritmo "MeuPrograma"\n\nvar\n    a: inteiro\n    b: inteiro\n    nome: cadeia\n\ninicio\nfim_algoritmo\n',
    );
  });

  it('caso de borda: sem variáveis não há a seção var', () => {
    const { codigo } = gerarPortugol(comVariaveis([]));
    expect(codigo).not.toMatch(/^var$/m);
    expect(codigo).toBe('algoritmo "MeuPrograma"\n\ninicio\nfim_algoritmo\n');
  });
});

// História 4 (spec 002, FR-007 e FR-008; data-model, "Confirmação de apagar").
const IDADE = { id: 'v-idade', nome: 'idade', tipo: 'inteiro' };
const B = { id: 'v-b', nome: 'b', tipo: 'inteiro' };
const X = { id: 'v-x', nome: 'x', tipo: 'inteiro' };
const usa = (v) => ({ VAR: { id: v.id } });
const ler = (v) => bloco('variavel', { campos: usa(v) });
const recebe = (v, valor) => bloco('variavel_recebe', { campos: usa(v), entradas: valor ? { VALOR: valor } : {} });
const topo = (b) => ({ ...b, x: 300, y: 300 });

describe('contarBlocosApagados', () => {
  const contar = (projeto) => contarBlocosApagados(congelarFundo(projeto.blocos), IDADE.id);

  it('uso solto sem filhos → { usos: 1, total: 1 }', () => {
    expect(contar(projetoDeTeste({ soltos: [topo(ler(IDADE))] }))).toEqual({ usos: 1, total: 1 });
  });

  it('idade recebe [b] dentro do programa → o b encaixado conta', () => {
    expect(contar(projetoDeTeste({ comandos: [recebe(IDADE, ler(B))] }))).toEqual({ usos: 1, total: 2 });
  });

  it('x recebe [idade] → só o bloco idade', () => {
    expect(contar(projetoDeTeste({ comandos: [recebe(X, ler(IDADE))] }))).toEqual({ usos: 1, total: 1 });
  });

  it('idade recebe [idade] → dois usos, sem contar duas vezes', () => {
    expect(contar(projetoDeTeste({ comandos: [recebe(IDADE, ler(IDADE))] }))).toEqual({ usos: 2, total: 2 });
  });

  it('o comando seguinte a um uso (next) não conta', () => {
    const projeto = projetoDeTeste({ comandos: [recebe(IDADE, ler(B)), recebe(X, ler(B))] });
    expect(contar(projeto)).toEqual({ usos: 1, total: 2 });
  });

  it('bloco com área de comandos que contém um uso → só o uso', () => {
    const corpo = bloco('teste_bloco', { entradas: { CORPO: [recebe(IDADE, null)] } });
    expect(contar(projetoDeTeste({ comandos: [corpo] }))).toEqual({ usos: 1, total: 1 });
  });

  it('uso com área de comandos contendo uma cadeia de 2 blocos → os 2 contam', () => {
    const comCorpo = bloco('teste_uso_com_corpo', {
      campos: usa(IDADE),
      entradas: { CORPO: [recebe(X, null), recebe(B, null)] },
    });
    expect(contar(projetoDeTeste({ comandos: [comCorpo] }))).toEqual({ usos: 1, total: 3 });
  });

  it('usos dentro e fora do programa somam', () => {
    const projeto = projetoDeTeste({
      comandos: [recebe(IDADE, ler(B))],
      soltos: [topo(ler(IDADE)), topo(recebe(X, ler(IDADE)))],
    });
    expect(contar(projeto)).toEqual({ usos: 3, total: 4 });
  });

  it('variável sem uso → { usos: 0, total: 0 }; blocos vazios também', () => {
    expect(contar(projetoDeTeste({ comandos: [recebe(X, ler(B))] }))).toEqual({ usos: 0, total: 0 });
    expect(contarBlocosApagados({}, IDADE.id)).toEqual({ usos: 0, total: 0 });
    expect(contarBlocosApagados(undefined, IDADE.id)).toEqual({ usos: 0, total: 0 });
  });
});

describe('textoApagar', () => {
  const comum = { titulo: 'Apagar a variável idade?', confirmar: 'Apagar', cancelar: 'Cancelar' };

  it.each([
    [{ usos: 1, total: 1 }, 'A variável idade é usada em 1 bloco. Esse bloco também será apagado.'],
    [{ usos: 3, total: 3 }, 'A variável idade é usada em 3 blocos. Esses blocos também serão apagados.'],
    [
      { usos: 1, total: 3 },
      'A variável idade é usada em 1 bloco. Ao apagar, 3 blocos serão removidos: esse bloco e os que estão encaixados nele.',
    ],
    [
      { usos: 3, total: 5 },
      'A variável idade é usada em 3 blocos. Ao apagar, 5 blocos serão removidos: esses blocos e os que estão encaixados neles.',
    ],
  ])('%o', (contagem, mensagem) => {
    expect(textoApagar('idade', contagem)).toEqual({ ...comum, mensagem });
  });
});

describe('História 4, cenário 1 - renomear no gerador (FR-007)', () => {
  it('trocar só o nome em variaveis muda a declaração e os três usos, sem tocar em blocos', () => {
    const projeto = projetoDeTeste({
      variaveis: [{ ...IDADE }, { ...B }],
      comandos: [recebe(IDADE, ler(B)), recebe(B, ler(IDADE)), recebe(B, ler(IDADE))],
    });
    const blocosAntes = JSON.stringify(projeto.blocos);
    const renomeado = { ...projeto, variaveis: [{ ...IDADE, nome: 'anos' }, { ...B }] };
    const { codigo, avisos } = gerarPortugol(renomeado);

    expect(avisos).toEqual([]);
    expect(codigo).toContain('    anos: inteiro\n');
    expect(codigo).toContain('    anos <- b\n    b <- anos\n    b <- anos\n');
    expect(codigo).not.toMatch(/\bidade\b/);
    expect(JSON.stringify(renomeado.blocos)).toBe(blocosAntes);
  });
});
