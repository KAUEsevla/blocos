// Caixa de blocos (spec 002, RF-02; contracts/blocos-variaveis.md, "Caixa de blocos").
import { describe, it, expect } from 'vitest';
import {
  CAIXA_BLOCOS,
  CATEGORIA_VARIAVEIS,
  BOTAO_CRIAR_VARIAVEL,
  conteudoCategoriaVariaveis,
} from '../../src/blocos/caixa-blocos.js';

const BOTAO = { kind: 'button', text: 'Criar variável…', callbackKey: 'CRIAR_VARIAVEL' };

describe('CAIXA_BLOCOS', () => {
  it('é uma caixa com categorias e tem a categoria dinâmica Variáveis', () => {
    expect(CAIXA_BLOCOS.kind).toBe('categoryToolbox');
    const variaveis = CAIXA_BLOCOS.contents.find((c) => c.name === 'Variáveis');
    expect(variaveis).toMatchObject({ kind: 'category', name: 'Variáveis', custom: 'VARIAVEIS' });
  });

  it('exporta os nomes da categoria e do botão', () => {
    expect(CATEGORIA_VARIAVEIS).toBe('VARIAVEIS');
    expect(BOTAO_CRIAR_VARIAVEL).toBe('CRIAR_VARIAVEL');
  });
});

describe('conteudoCategoriaVariaveis', () => {
  it('sem variáveis, só o botão "Criar variável…"', () => {
    expect(conteudoCategoriaVariaveis([])).toEqual([BOTAO]);
    expect(conteudoCategoriaVariaveis(undefined)).toEqual([BOTAO]);
  });

  it('o primeiro item é sempre o botão', () => {
    const variaveis = Object.freeze([Object.freeze({ id: 'v1', nome: 'idade', tipo: 'inteiro' })]);
    expect(conteudoCategoriaVariaveis(variaveis)[0]).toEqual(BOTAO);
  });

  // História 2 (T029): depois do botão, um "recebe" com a última variável criada.
  const recebe = (id) => ({ kind: 'block', type: 'variavel_recebe', fields: { VAR: { id } } });

  it('com uma variável, o "recebe" vem com ela depois do botão', () => {
    const conteudo = conteudoCategoriaVariaveis([{ id: 'v1', nome: 'idade', tipo: 'inteiro' }]);
    expect(conteudo.slice(0, 2)).toEqual([BOTAO, recebe('v1')]);
  });

  it('com quatro variáveis de tipos misturados, o "recebe" vem com a última da lista', () => {
    const variaveis = Object.freeze([
      { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
      { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
      { id: 'v-ok', nome: 'ok', tipo: 'logico' },
      { id: 'v-altura', nome: 'altura', tipo: 'real' },
    ]);
    const conteudo = conteudoCategoriaVariaveis(variaveis);
    expect(conteudo.slice(0, 2)).toEqual([BOTAO, recebe('v-altura')]);
    expect(conteudo.filter((item) => item.type === 'variavel_recebe')).toHaveLength(1);
  });

  // História 3 (T033): um bloco de valor por variável, na ordem da seção var.
  const valor = (id) => ({ kind: 'block', type: 'variavel', fields: { VAR: { id } } });

  it('depois do "recebe", um bloco variavel por variável na ordem da seção var', () => {
    const variaveis = Object.freeze([
      { id: 'v-ok', nome: 'ok', tipo: 'logico' },
      { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
      { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
      { id: 'v-altura', nome: 'altura', tipo: 'real' },
      { id: 'v-anos', nome: 'anos', tipo: 'inteiro' },
    ]);
    expect(conteudoCategoriaVariaveis(variaveis)).toEqual([
      BOTAO,
      recebe('v-anos'),
      valor('v-idade'),
      valor('v-anos'),
      valor('v-altura'),
      valor('v-nome'),
      valor('v-ok'),
    ]);
  });
});

// Spec 003, research R-09 (contracts/blocos-entrada-saida.md, "Caixa de blocos").
describe('caixa de blocos da spec 003', () => {
  it('categorias em ordem: Variáveis, Entrada e saída, Valores, Contas', async () => {
    const { CATEGORIA_ENTRADA_SAIDA } = await import('../../src/blocos/caixa-blocos.js');
    expect(CATEGORIA_ENTRADA_SAIDA).toBe('ENTRADA_SAIDA');
    // A 006 acrescenta categorias depois destas quatro (ver o describe da spec 006).
    expect(CAIXA_BLOCOS.contents.slice(0, 4).map((c) => c.name)).toEqual(['Variáveis', 'Entrada e saída', 'Valores', 'Contas']);
    const [, es, valores, contas] = CAIXA_BLOCOS.contents;
    expect(es).toMatchObject({ kind: 'category', custom: 'ENTRADA_SAIDA' });
    expect(valores.contents).toEqual([
      { kind: 'block', type: 'numero' },
      { kind: 'block', type: 'texto' },
      // Spec 006 (R-12): o valor fixo lógico.
      { kind: 'block', type: 'logico', fields: { VALOR: 'verdadeiro' } },
    ]);
    // Spec 006 (R-12): Contas ganha o negativo depois da conta.
    expect(contas.contents).toEqual([
      { kind: 'block', type: 'aritmetico', fields: { OP: '+' } },
      { kind: 'block', type: 'negativo' },
    ]);
  });

  it('Entrada e saída começa com um escreva com o texto “Olá, mundo!” encaixado (bloco normal)', async () => {
    const { conteudoCategoriaEntradaSaida } = await import('../../src/blocos/caixa-blocos.js');
    const [primeiro] = conteudoCategoriaEntradaSaida([]);
    expect(primeiro).toEqual({
      kind: 'block',
      type: 'escreva',
      inputs: { VALOR1: { block: { type: 'texto', fields: { TEXTO: 'Olá, mundo!' } } } },
    });
    expect(JSON.stringify(primeiro)).not.toContain('shadow');
  });

  it('entrada que não é lista não lança e é pura', async () => {
    const { conteudoCategoriaEntradaSaida } = await import('../../src/blocos/caixa-blocos.js');
    expect(() => conteudoCategoriaEntradaSaida(undefined)).not.toThrow();
    expect(() => conteudoCategoriaEntradaSaida('x')).not.toThrow();
    const lista = [{ id: 'v1', nome: 'a', tipo: 'inteiro' }];
    expect(conteudoCategoriaEntradaSaida(lista)).toEqual(conteudoCategoriaEntradaSaida(lista));
  });
});

describe('itens de bloco das categorias estáticas', () => {
  it('não são congelados: o Blockly acrescenta propriedades a eles ao montar a caixa', () => {
    for (const categoria of CAIXA_BLOCOS.contents.filter((c) => Array.isArray(c.contents))) {
      expect(Object.isFrozen(categoria)).toBe(false);
      for (const item of categoria.contents) expect(Object.isExtensible(item)).toBe(true);
    }
  });
});

// Spec 003, caso de borda "leia num projeto sem variáveis" (research R-09).
describe('conteudoCategoriaEntradaSaida com e sem variáveis', () => {
  const ESCREVA = {
    kind: 'block',
    type: 'escreva',
    inputs: { VALOR1: { block: { type: 'texto', fields: { TEXTO: 'Olá, mundo!' } } } },
  };

  it('sem variáveis: escreva, a orientação e o botão Criar variável…, sem leia', async () => {
    const { conteudoCategoriaEntradaSaida, TEXTO_LEIA_SEM_VARIAVEL } = await import('../../src/blocos/caixa-blocos.js');
    expect(TEXTO_LEIA_SEM_VARIAVEL).toBe('Para usar o leia, crie uma variável primeiro.');
    expect(conteudoCategoriaEntradaSaida([])).toEqual([
      ESCREVA,
      { kind: 'label', text: 'Para usar o leia, crie uma variável primeiro.' },
      { kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL },
    ]);
  });

  it('com variáveis: escreva e um único leia com a última da lista do mapa', async () => {
    const { conteudoCategoriaEntradaSaida } = await import('../../src/blocos/caixa-blocos.js');
    const lista = [
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
      { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
    ];
    expect(conteudoCategoriaEntradaSaida(lista)).toEqual([
      ESCREVA,
      { kind: 'block', type: 'leia', fields: { VAR: { id: 'v-nome' } } },
    ]);
  });
});

// Spec 006, research R-12 (contracts/editor-operadores.md, "Caixa de blocos").
describe('caixa de blocos da spec 006', () => {
  const categoria = (nome) => CAIXA_BLOCOS.contents.find((c) => c.name === nome);

  it('Comparações vem logo depois de Contas, com a comparação =', async () => {
    const { COR_COMPARACOES } = await import('../../src/blocos/comparacoes.js');
    const nomes = CAIXA_BLOCOS.contents.map((c) => c.name);
    expect(nomes.indexOf('Comparações')).toBe(nomes.indexOf('Contas') + 1);
    expect(categoria('Comparações')).toEqual({
      kind: 'category',
      name: 'Comparações',
      colour: COR_COMPARACOES,
      contents: [{ kind: 'block', type: 'relacional', fields: { OP: '=' } }],
    });
  });

  it('Lógica vem por último, com e, ou e não, e a ordem completa das categorias', async () => {
    const { COR_LOGICA } = await import('../../src/blocos/logica.js');
    expect(CAIXA_BLOCOS.contents.map((c) => c.name)).toEqual([
      'Variáveis',
      'Entrada e saída',
      'Valores',
      'Contas',
      'Comparações',
      'Lógica',
    ]);
    expect(categoria('Lógica')).toEqual({
      kind: 'category',
      name: 'Lógica',
      colour: COR_LOGICA,
      contents: [
        { kind: 'block', type: 'e_ou', fields: { OP: 'e' } },
        { kind: 'block', type: 'e_ou', fields: { OP: 'ou' } },
        { kind: 'block', type: 'nao' },
      ],
    });
  });
});
