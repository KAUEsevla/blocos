// Blocos enquanto e para no Blockly 12.5.1 headless (RF-05; spec 005, research R-06, R-07;
// contracts/editor-repeticao.md): campo só com inteiras, tipos dos encaixes, mudar o tipo da
// variável de controle, aninhar.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';
import { registrarCampoVariavel, CampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarMutadorSe } from '../../src/ui/mutador-se.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import { registrarVerificadorEncaixe, NOME_VERIFICADOR } from '../../src/ui/verificador-encaixe.js';
import { aplicarTipoVariavel } from '../../src/ui/acoes-variavel.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { variaveisDoMapa } from '../../src/projeto/variaveis.js';

function registrarTudo() {
  registrarCampoVariavel();
  registrarMutadorEscreva();
  registrarMutadorSe();
  registrarValidadorNumero();
  registrarVerificadorEncaixe();
  Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
}

function novoWorkspace() {
  const ws = new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }));
  const mapa = ws.getVariableMap();
  mapa.createVariable('i', 'inteiro', 'v-i');
  mapa.createVariable('n', 'inteiro', 'v-n');
  mapa.createVariable('x', 'real', 'v-x');
  mapa.createVariable('nome', 'cadeia', 'v-nome');
  mapa.createVariable('ok', 'logico', 'v-ok');
  return ws;
}

// O load limpa o workspace, inclusive as variáveis: elas vão junto.
const VARIAVEIS = [
  { name: 'i', type: 'inteiro', id: 'v-i' },
  { name: 'n', type: 'inteiro', id: 'v-n' },
  { name: 'x', type: 'real', id: 'v-x' },
  { name: 'nome', type: 'cadeia', id: 'v-nome' },
  { name: 'ok', type: 'logico', id: 'v-ok' },
];

// O Blockly entrega os eventos à pilha do desfazer num setTimeout(0).
const desfazer = async (ws) => {
  await new Promise((r) => setTimeout(r, 0));
  ws.undo(false);
};

function gerarDo(ws) {
  const blocos = Blockly.serialization.workspaces.save(ws);
  delete blocos.variables;
  return gerarPortugol({ ...projetoVazio(), variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()), blocos });
}

function criar(ws, tipo, { variavel } = {}) {
  const b = ws.newBlock(tipo);
  if (variavel) b.getField('VAR').setValue(variavel);
  return b;
}

const podeEncaixar = (ws, filho, pai, encaixe) =>
  ws.connectionChecker.canConnect(filho.outputConnection, pai.getInput(encaixe).connection, false);

const programaCom = (comando) => ({
  blocks: {
    languageVersion: 0,
    blocks: [{ type: 'programa', id: 'programa', inputs: { COMANDOS: { block: comando } } }],
  },
  variables: VARIAVEIS,
});

const numero = (id, n) => ({ type: 'numero', id, fields: { NUM: String(n) } });

describe('para (História 1)', () => {
  let ws;

  beforeAll(registrarTudo);
  beforeEach(() => {
    ws = novoWorkspace();
  });

  it('o menu da variável de controle lista só as inteiras (FR-003)', () => {
    const b = criar(ws, 'para', { variavel: 'v-i' });
    const campo = b.getField('VAR');
    expect(campo).toBeInstanceOf(CampoVariavel);
    const nomes = CampoVariavel.dropdownCreate.call(campo).map(([nome]) => nome);
    expect(nomes.slice(0, 2)).toEqual(['i', 'n']);
    expect(nomes).not.toContain('x');
    expect(nomes).not.toContain('nome');
    expect(nomes).not.toContain('ok');
  });

  it.each(['DE', 'ATE', 'PASSO'])('%s: lógicos e textos não encaixam; números sim (P-1, FR-004)', (encaixe) => {
    const para = criar(ws, 'para');
    for (const [tipo, opcoes] of [
      ['logico', {}],
      ['texto', {}],
      ['relacional', {}],
      ['variavel', { variavel: 'v-ok' }],
      ['variavel', { variavel: 'v-nome' }],
    ]) {
      expect(podeEncaixar(ws, criar(ws, tipo, opcoes), para, encaixe), `${tipo} ${JSON.stringify(opcoes)}`).toBe(false);
    }
    for (const [tipo, opcoes] of [
      ['numero', {}],
      ['negativo', {}],
      ['aritmetico', {}],
      ['variavel', { variavel: 'v-i' }],
      ['variavel', { variavel: 'v-x' }],
    ]) {
      expect(podeEncaixar(ws, criar(ws, tipo, opcoes), para, encaixe), `${tipo} ${JSON.stringify(opcoes)}`).toBe(true);
    }
  });

  // U1 do analyze (research R-06): a variável continua no campo depois de mudar de tipo.
  it('mudar o tipo da variável de controle mantém a variável e liga o aviso; voltar tira', () => {
    Blockly.serialization.workspaces.load(
      programaCom({
        type: 'para',
        id: 'p1',
        fields: { VAR: { id: 'v-i' } },
        inputs: { DE: { block: numero('n1', 1) }, ATE: { block: numero('n2', 3) } },
      }),
      ws,
    );
    const mensagem = 'A variável de controle do bloco para precisa ser do tipo inteiro';
    expect(gerarDo(ws).avisos).toEqual([]);

    aplicarTipoVariavel(ws, 'v-i', 'real');
    expect(ws.getBlockById('p1').getField('VAR').getValue()).toBe('v-i');
    const depois = gerarDo(ws);
    expect(depois.codigo).toContain('    para i de 1 ate 3 faca\n');
    expect(depois.avisos.map((a) => a.mensagem)).toEqual([mensagem]);

    aplicarTipoVariavel(ws, 'v-i', 'inteiro');
    expect(gerarDo(ws).avisos).toEqual([]);
  });

  it('salvar e carregar preserva os encaixes, com e sem passo', () => {
    const comPasso = {
      type: 'para',
      id: 'p1',
      fields: { VAR: { id: 'v-i' } },
      inputs: {
        DE: { block: numero('n1', 5) },
        ATE: { block: numero('n2', 1) },
        PASSO: { block: { type: 'negativo', id: 'neg', inputs: { X: { block: numero('n3', 1) } } } },
      },
    };
    const b = Blockly.serialization.blocks.append(comPasso, ws);
    const salvo = Blockly.serialization.blocks.save(b, { addCoordinates: false });
    expect(salvo.fields.VAR).toMatchObject({ id: 'v-i' });
    expect(Object.keys(salvo.inputs)).toEqual(['DE', 'ATE', 'PASSO']);
    expect(salvo.inputs.PASSO.block.inputs.X.block.id).toBe('n3');

    const semPasso = Blockly.serialization.blocks.append({ ...comPasso, id: 'p2', inputs: { DE: comPasso.inputs.DE, ATE: comPasso.inputs.ATE } }, ws);
    expect(Blockly.serialization.blocks.save(semPasso).inputs.PASSO).toBeUndefined();
  });
});

describe('enquanto (História 2)', () => {
  let ws;

  beforeAll(registrarTudo);
  beforeEach(() => {
    ws = novoWorkspace();
  });

  it.each([
    ['numero', {}],
    ['texto', {}],
    ['aritmetico', {}],
    ['negativo', {}],
    ['variavel', { variavel: 'v-i' }],
    ['variavel', { variavel: 'v-x' }],
    ['variavel', { variavel: 'v-nome' }],
  ])('%s %j não encaixa na condição (P-1)', (tipo, opcoes) => {
    expect(podeEncaixar(ws, criar(ws, tipo, opcoes), criar(ws, 'enquanto'), 'CONDICAO')).toBe(false);
  });

  it.each([
    ['relacional', {}],
    ['e_ou', {}],
    ['nao', {}],
    ['logico', {}],
    ['variavel', { variavel: 'v-ok' }],
  ])('%s %j encaixa na condição (P-1)', (tipo, opcoes) => {
    expect(podeEncaixar(ws, criar(ws, tipo, opcoes), criar(ws, 'enquanto'), 'CONDICAO')).toBe(true);
  });

  it('mudar ok para inteiro solta ok da condição; um Ctrl+Z volta', async () => {
    Blockly.serialization.workspaces.load(
      programaCom({
        type: 'enquanto',
        id: 'e1',
        inputs: { CONDICAO: { block: { type: 'variavel', id: 'vok', fields: { VAR: { id: 'v-ok' } } } } },
      }),
      ws,
    );
    await new Promise((r) => setTimeout(r, 0));
    ws.clearUndo();
    aplicarTipoVariavel(ws, 'v-ok', 'inteiro');
    expect(ws.getBlockById('vok').getParent()).toBeNull();
    const { codigo, avisos } = gerarDo(ws);
    expect(codigo).toContain('    enquanto ??? faca\n');
    expect(avisos.map((a) => a.mensagem)).toContain('Falta a condição do bloco enquanto');

    await desfazer(ws);
    expect(ws.getVariableMap().getVariableById('v-ok').getType()).toBe('logico');
    expect(ws.getBlockById('e1').getInputTargetBlock('CONDICAO')?.id).toBe('vok');
  });
});

describe('aninhar (FR-008, P-4)', () => {
  let ws;

  beforeAll(registrarTudo);
  beforeEach(() => {
    ws = novoWorkspace();
  });

  const podeEncaixarComando = (filho, conexao) => ws.connectionChecker.canConnect(filho.previousConnection, conexao, false);
  const area = (b, nome) => b.getInput(nome).connection;
  const seComSenao = () => {
    const b = ws.newBlock('se');
    b.ligarSenao();
    return b;
  };

  it('um se, com e sem senão, encaixa no corpo do para e do enquanto (P-4)', () => {
    for (const pai of ['para', 'enquanto']) {
      expect(podeEncaixarComando(ws.newBlock('se'), area(ws.newBlock(pai), 'FACA')), pai).toBe(true);
      expect(podeEncaixarComando(seComSenao(), area(ws.newBlock(pai), 'FACA')), pai).toBe(true);
    }
  });

  it('laços encaixam uns nos outros e nas áreas do se', () => {
    expect(podeEncaixarComando(ws.newBlock('para'), area(ws.newBlock('enquanto'), 'FACA'))).toBe(true);
    expect(podeEncaixarComando(ws.newBlock('para'), area(ws.newBlock('para'), 'FACA'))).toBe(true);
    expect(podeEncaixarComando(ws.newBlock('enquanto'), area(ws.newBlock('para'), 'FACA'))).toBe(true);
    expect(podeEncaixarComando(ws.newBlock('enquanto'), area(ws.newBlock('se'), 'ENTAO'))).toBe(true);
    expect(podeEncaixarComando(ws.newBlock('enquanto'), area(seComSenao(), 'SENAO'))).toBe(true);
  });

  it('se dentro de para dentro de enquanto gera a indentação do contrato', () => {
    Blockly.serialization.workspaces.load(
      programaCom({
        type: 'enquanto',
        id: 'e1',
        inputs: {
          CONDICAO: { block: { type: 'logico', id: 'l1', fields: { VALOR: 'verdadeiro' } } },
          FACA: {
            block: {
              type: 'para',
              id: 'p1',
              fields: { VAR: { id: 'v-i' } },
              inputs: {
                DE: { block: numero('n1', 1) },
                ATE: { block: numero('n2', 2) },
                FACA: {
                  block: {
                    type: 'se',
                    id: 's1',
                    inputs: {
                      CONDICAO: { block: { type: 'logico', id: 'l2', fields: { VALOR: 'verdadeiro' } } },
                      ENTAO: { block: { type: 'escreva', id: 'w1', inputs: { VALOR1: { block: { type: 'texto', id: 't1', fields: { TEXTO: 'x' } } } } } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      ws,
    );
    const { codigo, avisos } = gerarDo(ws);
    expect(avisos).toEqual([]);
    expect(codigo).toContain(
      [
        '    enquanto verdadeiro faca',
        '        para i de 1 ate 2 faca',
        '            se verdadeiro entao',
        '                escreva("x")',
        '            fim_se',
        '        fim_para',
        '    fim_enquanto',
      ].join('\n'),
    );
  });
});
