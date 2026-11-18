import { describe, it, expect, vi } from 'vitest';
import {
  FORMATO,
  VERSAO_FORMATO,
  TIPOS_VARIAVEL,
  projetoVazio,
  montarArquivo,
  textoArquivo,
  lerArquivo,
  TAMANHO_MAXIMO_ARQUIVO,
} from '../../src/projeto/formato.js';
import { assinaturaProjeto } from '../../src/projeto/alteracoes.js';

describe('formato do arquivo de projeto v1 (RF-08, RF-11)', () => {
  it('define as constantes do formato', () => {
    expect(FORMATO).toBe('meupia-blocos');
    expect(VERSAO_FORMATO).toBe(1);
    expect(TIPOS_VARIAVEL).toEqual(['inteiro', 'real', 'cadeia', 'logico']);
  });

  it('projetoVazio tem só o bloco programa e nenhuma variável', () => {
    const p = projetoVazio();
    expect(p).toMatchObject({ formato: 'meupia-blocos', versao: 1, nome: 'MeuPrograma', variaveis: [] });
    expect(p.blocos.blocks.blocks).toHaveLength(1);
    expect(p.blocos.blocks.blocks[0].type).toBe('programa');
    expect(p.blocos).not.toHaveProperty('variables');
  });

  it('cada chamada devolve um objeto independente', () => {
    const a = projetoVazio();
    const b = projetoVazio();
    expect(a).toEqual(b);
    a.variaveis.push({ id: 'v', nome: 'x', tipo: 'inteiro' });
    a.blocos.blocks.blocks[0].x = 999;
    expect(b.variaveis).toEqual([]);
    expect(b.blocos.blocks.blocks[0].x).toBe(24);
  });
});

// Spec 011 (contracts/salvar.md): o arquivo v1 escrito pelo Salvar.
describe('montarArquivo e textoArquivo (RF-11)', () => {
  const comVariaveis = () => ({
    ...projetoVazio(),
    nome: 'Média',
    variaveis: [
      { id: 'v-b', nome: 'b', tipo: 'inteiro', extra: 1 },
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
    ],
  });

  it('chaves na ordem formato, versao, nome, variaveis, blocos', () => {
    const arquivo = montarArquivo(projetoVazio());
    expect(Object.keys(arquivo)).toEqual(['formato', 'versao', 'nome', 'variaveis', 'blocos']);
    expect(arquivo).toEqual(projetoVazio());
  });

  it('formato e versao vêm sempre das constantes', () => {
    const arquivo = montarArquivo({ ...projetoVazio(), formato: 'x', versao: 9 });
    expect(arquivo.formato).toBe(FORMATO);
    expect(arquivo.versao).toBe(VERSAO_FORMATO);
  });

  it('campos ausentes viram valores neutros', () => {
    expect(montarArquivo({})).toEqual({ formato: FORMATO, versao: VERSAO_FORMATO, nome: '', variaveis: [], blocos: {} });
    expect(montarArquivo()).toEqual({ formato: FORMATO, versao: VERSAO_FORMATO, nome: '', variaveis: [], blocos: {} });
    expect(montarArquivo({ nome: null, variaveis: null, blocos: null })).toEqual({
      formato: FORMATO,
      versao: VERSAO_FORMATO,
      nome: '',
      variaveis: [],
      blocos: {},
    });
  });

  it('tira blocos.variables', () => {
    const p = projetoVazio();
    p.blocos.variables = [{ id: 'v', name: 'x', type: 'inteiro' }];
    expect(montarArquivo(p).blocos).not.toHaveProperty('variables');
    expect(p.blocos).toHaveProperty('variables');
  });

  it('variáveis só com id, nome e tipo, na ordem recebida', () => {
    expect(montarArquivo(comVariaveis()).variaveis).toEqual([
      { id: 'v-b', nome: 'b', tipo: 'inteiro' },
      { id: 'v-x', nome: 'x', tipo: 'real' },
      { id: 'v-a', nome: 'a', tipo: 'inteiro' },
    ]);
  });

  it('o resultado não compartilha objetos com o projeto', () => {
    const p = comVariaveis();
    const antes = JSON.stringify(p);
    const arquivo = montarArquivo(p);
    arquivo.variaveis[0].nome = 'z';
    arquivo.blocos.blocks.blocks[0].x = 999;
    expect(JSON.stringify(p)).toBe(antes);
  });

  it('preserva o extraState do escreva e do se, e o se sem senão continua sem', () => {
    const p = projetoVazio();
    p.blocos.blocks.blocks[0].inputs = {
      COMANDOS: {
        block: {
          type: 'escreva',
          id: 'e',
          extraState: { valores: 3 },
          next: {
            block: {
              type: 'se',
              id: 's1',
              extraState: { senao: true },
              next: { block: { type: 'se', id: 's2' } },
            },
          },
        },
      },
    };
    const texto = textoArquivo(p);
    const lido = JSON.parse(texto);
    const escreva = lido.blocos.blocks.blocks[0].inputs.COMANDOS.block;
    expect(escreva.extraState).toEqual({ valores: 3 });
    expect(escreva.next.block.extraState).toEqual({ senao: true });
    expect(escreva.next.block.next.block).not.toHaveProperty('extraState');
  });

  it('textoArquivo: JSON com 2 espaços, quebra de linha final, acentos legíveis e determinístico', () => {
    const p = comVariaveis();
    const texto = textoArquivo(p);
    expect(texto).toBe(JSON.stringify(montarArquivo(p), null, 2) + '\n');
    expect(texto.startsWith('{\n  "formato": "meupia-blocos",\n  "versao": 1,\n  "nome": "Média",')).toBe(true);
    expect(texto).toContain('"nome": "Média"');
    expect(texto).not.toContain('\\u');
    expect(textoArquivo(p)).toBe(texto);
  });
});

// Spec 012 (contracts/carregar.md; research R-04): leitura do arquivo.
describe('lerArquivo (RF-12)', () => {
  const valido = (extra = {}) => ({ ...montarArquivo(projetoVazio()), ...extra });
  const texto = (obj) => JSON.stringify(obj);
  const recusa = (t) => lerArquivo(t);

  it('recusa arquivo maior que 1 MB sem fazer JSON.parse', () => {
    expect(TAMANHO_MAXIMO_ARQUIVO).toBe(1_048_576);
    const espiao = vi.spyOn(JSON, 'parse');
    const r = recusa('x'.repeat(1_048_577));
    expect(r).toEqual({ ok: false, motivo: 'grande-demais' });
    expect(espiao).not.toHaveBeenCalled();
    espiao.mockRestore();
  });

  it('mede o tamanho em bytes UTF-8', () => {
    // 524 289 caracteres "é" = 1 048 578 bytes.
    expect(recusa('é'.repeat(524_289)).motivo).toBe('grande-demais');
  });

  it.each([[''], ['   '], [undefined], [null], [42], ['{'], ['abc'], ['[]'], ['null'], ['"texto"'],
    ['{"formato":"outro","versao":1}'], ['{"versao":1,"nome":"a"}']])('%j não é projeto', (t) => {
    expect(recusa(t)).toEqual({ ok: false, motivo: 'nao-e-projeto' });
  });

  it('versão mais nova', () => {
    expect(recusa(texto(valido({ versao: 2 })))).toEqual({ ok: false, motivo: 'versao-nova' });
  });

  it.each([[0], [1.5], ['1'], [null], [-1]])('versão %j é inválida', (versao) => {
    expect(recusa(texto(valido({ versao })))).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe: 'a versão do formato é inválida',
    });
  });

  it('versão ausente é inválida', () => {
    const obj = valido();
    delete obj.versao;
    expect(recusa(texto(obj)).detalhe).toBe('a versão do formato é inválida');
  });

  it.each([[5], [null], [undefined]])('nome %j é inválido', (nome) => {
    const obj = valido({ nome });
    if (nome === undefined) delete obj.nome;
    expect(recusa(texto(obj))).toEqual({ ok: false, motivo: 'dados-invalidos', detalhe: 'o nome do programa é inválido' });
  });

  it.each([
    [{}],
    [[{ nome: 'x', tipo: 'inteiro' }]],
    [[{ id: '', nome: 'x', tipo: 'inteiro' }]],
    [[{ id: 'v1', tipo: 'inteiro' }]],
    [[null]],
  ])('variaveis %j é uma lista inválida', (variaveis) => {
    expect(recusa(texto(valido({ variaveis })))).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe: 'a lista de variáveis é inválida',
    });
  });

  it('tipo de variável desconhecido', () => {
    expect(recusa(texto(valido({ variaveis: [{ id: 'v1', nome: 'x', tipo: 'texto' }] }))).detalhe).toBe(
      'a variável "x" tem o tipo "texto", que não existe',
    );
  });

  it('ids de variável repetidos', () => {
    const variaveis = [
      { id: 'v1', nome: 'a', tipo: 'inteiro' },
      { id: 'v1', nome: 'b', tipo: 'real' },
    ];
    expect(recusa(texto(valido({ variaveis }))).detalhe).toBe('há duas variáveis com a mesma identificação');
  });

  it.each([['1a'], ['se'], [' nota'], ['média']])('nome de variável %j é inválido', (nome) => {
    const r = recusa(texto(valido({ variaveis: [{ id: 'v1', nome, tipo: 'inteiro' }] })));
    expect(r.detalhe).toBe(`o nome da variável "${nome}" é inválido`);
  });

  it('nome repetido sem diferenciar maiúsculas é inválido', () => {
    const variaveis = [
      { id: 'v1', nome: 'nota', tipo: 'inteiro' },
      { id: 'v2', nome: 'Nota', tipo: 'real' },
    ];
    expect(recusa(texto(valido({ variaveis }))).detalhe).toBe('o nome da variável "Nota" é inválido');
  });

  it.each([[5], [null], [[]], [{ blocks: {} }], [{ blocks: { blocks: 3 } }]])('blocos %j corrompidos', (blocos) => {
    expect(recusa(texto(valido({ blocos })))).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe: 'os blocos do projeto estão corrompidos',
    });
  });

  it('blocos {} é aceito na leitura', () => {
    expect(recusa(texto(valido({ blocos: {} }))).ok).toBe(true);
  });

  it('devolve o nome exatamente como está no arquivo', () => {
    const r = lerArquivo(texto(valido({ nome: '  Média "final"  ' })));
    expect(r.ok).toBe(true);
    expect(r.projeto.nome).toBe('  Média "final"  ');
  });

  it('ignora blocos.variables, campos extras das variáveis e chaves extras da raiz', () => {
    const obj = valido({
      extra: 1,
      variaveis: [{ id: 'v1', nome: 'x', tipo: 'inteiro', cor: 'azul' }],
    });
    obj.blocos.variables = [{ id: 'v1', name: 'x', type: 'inteiro' }];
    const r = lerArquivo(texto(obj));
    expect(r.ok).toBe(true);
    expect(r.projeto).not.toHaveProperty('extra');
    expect(r.projeto.variaveis).toEqual([{ id: 'v1', nome: 'x', tipo: 'inteiro' }]);
    expect(r.projeto.blocos).not.toHaveProperty('variables');
    expect(Object.keys(r.projeto)).toEqual(['formato', 'versao', 'nome', 'variaveis', 'blocos']);
  });

  it('ida e volta com textoArquivo mantém a assinatura', () => {
    const comSe = projetoVazio();
    comSe.variaveis = [{ id: 'v1', nome: 'idade', tipo: 'inteiro' }];
    comSe.blocos.blocks.blocks[0].inputs = { COMANDOS: { block: { type: 'se', id: 's1' } } };
    for (const p of [projetoVazio(), comSe]) {
      const r = lerArquivo(textoArquivo(p));
      expect(r.ok).toBe(true);
      expect(assinaturaProjeto(r.projeto)).toBe(assinaturaProjeto(p));
    }
    const lido = lerArquivo(textoArquivo(comSe)).projeto;
    expect(lido.blocos.blocks.blocks[0].inputs.COMANDOS.block).not.toHaveProperty('extraState');
  });

  it('o projeto lido é uma cópia nova', () => {
    const t = textoArquivo(projetoVazio());
    const a = lerArquivo(t).projeto;
    a.blocos.blocks.blocks.push({});
    expect(lerArquivo(t).projeto.blocos.blocks.blocks).toHaveLength(1);
  });
});
