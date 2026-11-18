// Núcleo do Carregar (RF-12; spec 012, contracts/carregar.md; research R-04 a R-06, R-09).
import { describe, it, expect } from 'vitest';
import { registroPadrao } from '../../src/blocos/registro.js';
import { temSenao } from '../../src/blocos/decisao.js';
import { projetoVazio, textoArquivo } from '../../src/projeto/formato.js';
import { assinaturaProjeto } from '../../src/projeto/alteracoes.js';
import {
  prepararCarregamento,
  mensagemRecusa,
  validarBlocos,
  classificarErroCarga,
  recusaDoEnsaio,
} from '../../src/projeto/carregar.js';
import { projetoCompleto, projetoCemBlocos, todosOsBlocos } from '../auxiliares/projetos-carregar.js';

const porId = (projeto, id) => todosOsBlocos(projeto.blocos).find((b) => b.id === id);

describe('Carregar: arquivos aceitos (FR-002, FR-003)', () => {
  it('o projeto completo tem todos os tipos registrados', () => {
    const tipos = new Set(todosOsBlocos(projetoCompleto().blocos).map((b) => b.type));
    const faltando = registroPadrao.tiposRegistrados().filter((t) => !tipos.has(t));
    expect(faltando, 'tipos sem lugar no teste do Carregar').toEqual([]);
  });

  it.each([
    ['projeto vazio', projetoVazio],
    ['projeto completo', projetoCompleto],
  ])('%s: aceito com a mesma assinatura', (_, criar) => {
    const p = criar();
    const r = prepararCarregamento(textoArquivo(p));
    expect(r.ok, r.mensagem).toBe(true);
    expect(assinaturaProjeto(r.projeto)).toBe(assinaturaProjeto(p));
  });

  it('se sem extraState é aceito como senão desligado; senão true e false também', () => {
    const { projeto } = prepararCarregamento(textoArquivo(projetoCompleto()));
    const semSenao = porId(projeto, 'se-sem-senao');
    expect(semSenao).not.toHaveProperty('extraState');
    expect(temSenao(semSenao)).toBe(false);
    expect(temSenao(porId(projeto, 'se-com-senao'))).toBe(true);
    expect(temSenao(porId(projeto, 'se-senao-falso'))).toBe(false);
  });

  it('encaixes vazios, VAR ausente ou null e blocos soltos são aceitos', () => {
    const { projeto } = prepararCarregamento(textoArquivo(projetoCompleto()));
    expect(porId(projeto, 'recebe-vazio')).not.toHaveProperty('inputs');
    expect(porId(projeto, 'leia-null').fields.VAR).toBeNull();
    expect(projeto.blocos.blocks.blocks[1]).toMatchObject({ id: 'solto', x: 400, y: 300 });
  });

  it('o nome volta exatamente como foi digitado', () => {
    expect(prepararCarregamento(textoArquivo(projetoCompleto())).projeto.nome).toBe('  Média "final"  ');
  });

  it('números escritos à mão ("007", "3,5") são aceitos', () => {
    const p = projetoCompleto();
    porId(p, 'n1').fields.NUM = '007';
    porId(p, 'n2').fields.NUM = '3,5';
    expect(prepararCarregamento(textoArquivo(p)).ok).toBe(true);
  });

  it('validarBlocos aceita o projeto completo', () => {
    expect(validarBlocos(projetoCompleto())).toEqual({ ok: true });
  });

  it('100 blocos em menos de 2 s (SC-003)', () => {
    const texto = textoArquivo(projetoCemBlocos());
    const inicio = performance.now();
    const r = prepararCarregamento(texto);
    expect(performance.now() - inicio).toBeLessThan(2000);
    expect(r.ok).toBe(true);
  });
});

describe('Carregar: mensagens de recusa (FR-004)', () => {
  it.each([
    [{ motivo: 'nao-e-projeto' }, 'Este arquivo não é um projeto do meuPiá Blocos.'],
    [{ motivo: 'versao-nova' }, 'Este projeto foi salvo numa versão mais nova do meuPiá Blocos.'],
    [{ motivo: 'grande-demais' }, 'Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB).'],
    [
      { motivo: 'dados-invalidos', detalhe: 'falta o bloco programa' },
      'Este projeto tem dados inválidos e não foi carregado: falta o bloco programa.',
    ],
  ])('%j', (recusa, texto) => {
    expect(mensagemRecusa(recusa)).toBe(texto);
  });

  it('repassa a recusa da leitura com a mensagem', () => {
    expect(prepararCarregamento('abc')).toEqual({
      ok: false,
      motivo: 'nao-e-projeto',
      mensagem: 'Este arquivo não é um projeto do meuPiá Blocos.',
    });
    const r = prepararCarregamento(JSON.stringify({ ...projetoVazio(), versao: 0 }));
    expect(r).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe: 'a versão do formato é inválida',
      mensagem: 'Este projeto tem dados inválidos e não foi carregado: a versão do formato é inválida.',
    });
  });
});

describe('classificarErroCarga (research R-06)', () => {
  class BadConnectionCheck extends Error {}
  class MissingConnection extends Error {}
  const excecoes = { BadConnectionCheck, MissingConnection };

  it.each([
    [new BadConnectionCheck('x'), 'encaixe'],
    [new MissingConnection('x'), 'encaixe'],
    [new Error('x'), 'desconhecido'],
    [new TypeError('Invalid block definition'), 'desconhecido'],
    ['texto', 'desconhecido'],
  ])('%s → %s', (erro, tipo) => {
    expect(classificarErroCarga(erro, excecoes)).toEqual({ ok: false, erro: tipo });
  });

  it('sem as classes do Blockly, tudo é desconhecido', () => {
    expect(classificarErroCarga(new BadConnectionCheck('x'), {})).toEqual({ ok: false, erro: 'desconhecido' });
  });
});

// História 2 (T011): cada arquivo parte do projeto completo com uma só mudança.
describe('Carregar: arquivos recusados por inteiro (FR-002, FR-004, SC-002)', () => {
  const COMANDO = 'leia-nome';
  const num9 = { type: 'numero', id: 'n9', fields: { NUM: '1' } };
  const casos = [
    ['tipo desconhecido de topo', (p) => p.blocos.blocks.blocks.push({ type: 'xyz', id: 'x1', x: 0, y: 0 }), 'o bloco "xyz" não existe no meuPiá Blocos'],
    ['tipo desconhecido encaixado', (p) => { porId(p, 'soma').inputs.A.block = { type: 'xyz', id: 'x1' }; }, 'o bloco "xyz" não existe no meuPiá Blocos'],
    ['bloco sem id', (p) => { delete porId(p, 'n1').id; }, 'há blocos sem identificação ou com a mesma identificação'],
    ['ids repetidos', (p) => { porId(p, 'n2').id = 'n1'; }, 'há blocos sem identificação ou com a mesma identificação'],
    ['sem programa', (p) => { p.blocos.blocks.blocks.shift(); }, 'falta o bloco programa'],
    ['dois programas', (p) => { p.blocos.blocks.blocks.push({ type: 'programa', id: 'programa2', x: 0, y: 0 }); }, 'o bloco programa está duplicado ou fora do lugar'],
    ['programa encaixado', (p) => { porId(p, 'se-sem-senao').inputs = { ENTAO: { block: { type: 'programa', id: 'p2' } } }; }, 'o bloco programa está duplicado ou fora do lugar'],
    ['programa com outro id', (p) => { p.blocos.blocks.blocks[0].id = 'p2'; }, 'o bloco programa está duplicado ou fora do lugar'],
    ['topo sem x', (p) => { delete p.blocos.blocks.blocks[1].x; }, 'a posição de um bloco está faltando'],
    ['encaixe que não existe', (p) => { porId(p, COMANDO).inputs = { FOO: { block: { ...num9 } } }; }, 'o bloco "leia" tem um encaixe que não existe'],
    ['VALOR além do número de valores', (p) => { porId(p, 'escreva-3').inputs.VALOR5 = { block: { ...num9 } }; }, 'o bloco "escreva" tem um encaixe que não existe'],
    ['SENAO com o senão desligado', (p) => { porId(p, 'se-sem-senao').inputs = { SENAO: { block: { type: 'leia', id: 'l9' } } }; }, 'o bloco "se" tem um encaixe que não existe'],
    ['número como comando', (p) => { porId(p, 'se-sem-senao').inputs = { ENTAO: { block: { ...num9 } } }; }, 'um bloco está encaixado num lugar onde não cabe'],
    ['comando num encaixe de valor', (p) => { porId(p, 'soma').inputs.A.block = { type: 'leia', id: 'l9' }; }, 'um bloco está encaixado num lugar onde não cabe'],
    ['next num bloco de valor', (p) => { porId(p, 'n1').next = { block: { type: 'leia', id: 'l9' } }; }, 'um bloco está encaixado num lugar onde não cabe'],
    ['operador fora das opções', (p) => { porId(p, 'rel').fields.OP = 'XX'; }, 'um campo do bloco "relacional" tem um valor inválido'],
    ['lógico fora das opções', (p) => { porId(p, 'log').fields.VALOR = 'TRUE'; }, 'um campo do bloco "logico" tem um valor inválido'],
    ['número inválido', (p) => { porId(p, 'n1').fields.NUM = 'abc'; }, 'um campo do bloco "numero" tem um valor inválido'],
    ['número vazio', (p) => { porId(p, 'n1').fields.NUM = ''; }, 'um campo do bloco "numero" tem um valor inválido'],
    ['variável fora do projeto', (p) => { porId(p, COMANDO).fields.VAR = { id: 'zz' }; }, 'um bloco usa uma variável que não está no projeto'],
    ['escreva com 0 valores', (p) => { porId(p, 'escreva-3').extraState = { valores: 0 }; }, 'o bloco escreva tem uma quantidade de valores inválida'],
    ['escreva com 11 valores', (p) => { porId(p, 'escreva-3').extraState = { valores: 11 }; }, 'o bloco escreva tem uma quantidade de valores inválida'],
    ['escreva com 2.5 valores', (p) => { porId(p, 'escreva-3').extraState = { valores: 2.5 }; }, 'o bloco escreva tem uma quantidade de valores inválida'],
    ['se com senão "sim"', (p) => { porId(p, 'se-sem-senao').extraState = { senao: 'sim' }; }, 'o bloco se tem dados inválidos'],
    ['lógico onde só cabe número (006)', (p) => { porId(p, 'recebe').inputs.VALOR.block = { type: 'logico', id: 'l9', fields: { VALOR: 'verdadeiro' } }; }, 'um valor lógico está encaixado onde só cabe número'],
    ['número onde só cabe texto (006)', (p) => {
      Object.assign(porId(p, COMANDO), { type: 'variavel_recebe', fields: { VAR: { id: 'v-nome' } }, inputs: { VALOR: { block: { ...num9 } } } });
    }, 'um número está encaixado onde só cabe texto'],
    ['conta onde só cabe valor lógico (006)', (p) => { porId(p, 'enquanto').inputs.CONDICAO.block = { type: 'aritmetico', id: 'a9', fields: { OP: '+' } }; }, 'um número ou texto está encaixado onde só cabe valor lógico'],
  ];

  it.each(casos)('%s', (_, mudar, detalhe) => {
    const p = projetoCompleto();
    mudar(p);
    expect(prepararCarregamento(textoArquivo(p))).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe,
      mensagem: `Este projeto tem dados inválidos e não foi carregado: ${detalhe}.`,
    });
  });

  it('escreva sem extraState é um escreva de um valor', () => {
    const p = projetoCompleto();
    delete porId(p, 'escreva-entao').extraState;
    expect(prepararCarregamento(textoArquivo(p)).ok).toBe(true);
  });

  it('nenhuma mensagem tem texto em inglês do Blockly', () => {
    for (const [, mudar] of casos) {
      const p = projetoCompleto();
      mudar(p);
      expect(prepararCarregamento(textoArquivo(p)).mensagem).not.toMatch(/\b(block|connection|Invalid|check)\b/i);
    }
  });
});

describe('recusaDoEnsaio (research R-06)', () => {
  it.each([
    ['encaixe', 'um bloco está encaixado num lugar onde não cabe'],
    ['desconhecido', 'o editor não conseguiu montar os blocos'],
  ])('%s', (erro, detalhe) => {
    expect(recusaDoEnsaio({ ok: false, erro })).toEqual({
      ok: false,
      motivo: 'dados-invalidos',
      detalhe,
      mensagem: `Este projeto tem dados inválidos e não foi carregado: ${detalhe}.`,
    });
  });
});

// Entrega (T017): ramos de dados corrompidos e entradas fora do comum.
describe('Carregar: formas corrompidas e limites', () => {
  const comMudanca = (mudar) => {
    const p = projetoCompleto();
    mudar(p);
    return validarBlocos(p);
  };
  const corrompido = { ok: false, motivo: 'dados-invalidos', detalhe: 'os blocos do projeto estão corrompidos' };

  it.each([
    ['topo nulo', (p) => p.blocos.blocks.blocks.push(null)],
    ['inputs em lista', (p) => (porId(p, 'leia-nome').inputs = [])],
    ['conteúdo de encaixe que não é objeto', (p) => (porId(p, 'soma').inputs.A = 5)],
    ['next que não é objeto', (p) => (porId(p, 'leia-nome').next = 5)],
  ])('%s', (_, mudar) => {
    expect(comMudanca(mudar)).toEqual(corrompido);
  });

  it.each([
    ['encaixe sem bloco', (p) => (porId(p, 'soma').inputs.A = {})],
    ['next sem bloco', (p) => (porId(p, 'para').next = {})],
    ['NUM numérico', (p) => (porId(p, 'n1').fields.NUM = 3)],
    ['extraState nulo no se', (p) => (porId(p, 'se-sem-senao').extraState = null)],
  ])('%s é aceito', (_, mudar) => {
    expect(comMudanca(mudar)).toEqual({ ok: true });
  });

  it('VAR que não é objeto', () => {
    expect(comMudanca((p) => (porId(p, 'leia-nome').fields.VAR = 'v-nome')).detalhe).toBe(
      'um bloco usa uma variável que não está no projeto',
    );
  });

  it('extraState do escreva que não é objeto', () => {
    expect(comMudanca((p) => (porId(p, 'escreva-3').extraState = 'x')).detalhe).toBe(
      'o bloco escreva tem uma quantidade de valores inválida',
    );
  });

  it('projeto sem blocos: falta o programa', () => {
    expect(validarBlocos(undefined).detalhe).toBe('falta o bloco programa');
  });

  it('erro inesperado do registro não vira recusa', () => {
    const registro = {
      obter() {
        throw new RangeError('registro quebrado');
      },
    };
    expect(() => validarBlocos(projetoCompleto(), registro)).toThrow(RangeError);
  });

  it('motivo desconhecido e ensaio sem erro caem nas mensagens genéricas', () => {
    expect(mensagemRecusa()).toBe('Este arquivo não é um projeto do meuPiá Blocos.');
    expect(mensagemRecusa({ motivo: 'outro' })).toBe('Este arquivo não é um projeto do meuPiá Blocos.');
    expect(recusaDoEnsaio().detalhe).toBe('o editor não conseguiu montar os blocos');
  });
});
