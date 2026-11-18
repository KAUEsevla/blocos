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
    // A 004 põe "Decisão" depois de Entrada e saída e a 006 acrescenta categorias depois
    // destas (ver os describes da 004 e da 006): a ordem relativa das quatro continua.
    const nomes = CAIXA_BLOCOS.contents.map((c) => c.name);
    const daSpec003 = nomes.filter((n) => ['Variáveis', 'Entrada e saída', 'Valores', 'Contas'].includes(n));
    expect(daSpec003).toEqual(['Variáveis', 'Entrada e saída', 'Valores', 'Contas']);
    const categoria = (nome) => CAIXA_BLOCOS.contents.find((c) => c.name === nome);
    const [es, valores, contas] = ['Entrada e saída', 'Valores', 'Contas'].map(categoria);
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
      // Spec 004 (research R-06): Decisão logo depois de Entrada e saída.
      'Decisão',
      // Spec 005 (research R-09): Repetição logo depois de Decisão.
      'Repetição',
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

// Spec 004 (research R-06; contracts/editor-se.md, "Caixa de blocos").
describe('caixa de blocos da spec 004', () => {
  it('Decisão vem logo depois de Entrada e saída, com o se e o se/senão', async () => {
    const { COR_DECISAO } = await import('../../src/blocos/decisao.js');
    const nomes = CAIXA_BLOCOS.contents.map((c) => c.name);
    expect(nomes.indexOf('Decisão')).toBe(nomes.indexOf('Entrada e saída') + 1);
    expect(CAIXA_BLOCOS.contents.find((c) => c.name === 'Decisão')).toEqual({
      kind: 'category',
      name: 'Decisão',
      colour: COR_DECISAO,
      contents: [
        { kind: 'block', type: 'se' },
        { kind: 'block', type: 'se', extraState: { senao: true } },
      ],
    });
  });
});

// Spec 005 (research R-09; contracts/editor-repeticao.md, "Categoria Repetição").
describe('caixa de blocos da spec 005', () => {
  const PARA_SEM_INTEIRO = [
    { kind: 'label', text: 'Para usar o para, crie uma variável do tipo inteiro.' },
    { kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL },
  ];

  it('Repetição vem logo depois de Decisão e é dinâmica', async () => {
    const { CATEGORIA_REPETICAO } = await import('../../src/blocos/caixa-blocos.js');
    const { COR_REPETICAO } = await import('../../src/blocos/repeticao.js');
    const nomes = CAIXA_BLOCOS.contents.map((c) => c.name);
    expect(nomes.indexOf('Repetição')).toBe(nomes.indexOf('Decisão') + 1);
    expect(CAIXA_BLOCOS.contents.find((c) => c.name === 'Repetição')).toEqual({
      kind: 'category',
      name: 'Repetição',
      custom: CATEGORIA_REPETICAO,
      colour: COR_REPETICAO,
    });
    expect(CATEGORIA_REPETICAO).toBe('REPETICAO');
  });

  it('sem variável inteira: a orientação e o botão no lugar do para', async () => {
    const { conteudoCategoriaRepeticao, TEXTO_PARA_SEM_INTEIRO } = await import('../../src/blocos/caixa-blocos.js');
    expect(TEXTO_PARA_SEM_INTEIRO).toBe('Para usar o para, crie uma variável do tipo inteiro.');
    const semPara = (itens) => itens.filter((i) => i.type !== 'enquanto');
    expect(semPara(conteudoCategoriaRepeticao([]))).toEqual(PARA_SEM_INTEIRO);
    expect(semPara(conteudoCategoriaRepeticao(undefined))).toEqual(PARA_SEM_INTEIRO);
    const outros = [
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-c', nome: 'c', tipo: 'cadeia' },
      { id: 'v-l', nome: 'l', tipo: 'logico' },
    ];
    expect(semPara(conteudoCategoriaRepeticao(outros))).toEqual(PARA_SEM_INTEIRO);
  });

  it('o enquanto vem sempre primeiro, com e sem variável inteira', async () => {
    const { conteudoCategoriaRepeticao } = await import('../../src/blocos/caixa-blocos.js');
    const ENQUANTO = { kind: 'block', type: 'enquanto' };
    expect(conteudoCategoriaRepeticao([])[0]).toEqual(ENQUANTO);
    expect(conteudoCategoriaRepeticao([{ id: 'v-i', nome: 'i', tipo: 'inteiro' }])[0]).toEqual(ENQUANTO);
    expect(conteudoCategoriaRepeticao([])).toHaveLength(3);
    expect(conteudoCategoriaRepeticao([{ id: 'v-i', nome: 'i', tipo: 'inteiro' }])).toHaveLength(2);
  });

  it('com variável inteira: o para com a última inteira, de 1 até 5 e sem passo', async () => {
    const { conteudoCategoriaRepeticao } = await import('../../src/blocos/caixa-blocos.js');
    const lista = [
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-b', nome: 'b', tipo: 'inteiro' },
    ];
    expect(conteudoCategoriaRepeticao(lista).filter((i) => i.type !== 'enquanto')).toEqual([
      {
        kind: 'block',
        type: 'para',
        fields: { VAR: { id: 'v-b' } },
        inputs: {
          DE: { block: { type: 'numero', fields: { NUM: '1' } } },
          ATE: { block: { type: 'numero', fields: { NUM: '5' } } },
        },
      },
    ]);
  });
});
