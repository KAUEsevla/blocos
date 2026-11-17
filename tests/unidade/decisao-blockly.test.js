// Bloco se no Blockly 12.5.1 headless (RF-04; spec 004, research R-04, R-05, R-08;
// contracts/editor-se.md): mutador do senão, confirmação, desfazer, tipos da condição.
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarMutadorSe } from '../../src/ui/mutador-se.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import { registrarVerificadorEncaixe, NOME_VERIFICADOR } from '../../src/ui/verificador-encaixe.js';

// A pergunta da confirmação: cada teste decide a resposta.
const confirmarTirarSenao = vi.fn();

function registrarTudo() {
  registrarCampoVariavel();
  registrarMutadorEscreva();
  registrarMutadorSe({ confirmarTirarSenao });
  registrarValidadorNumero();
  registrarVerificadorEncaixe();
  Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
}

function novoWorkspace() {
  return new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }));
}

// O Blockly entrega os eventos à pilha do desfazer num setTimeout(0).
const desfazer = async (ws) => {
  await new Promise((r) => setTimeout(r, 0));
  ws.undo(false);
};

const encaixes = (b) => b.inputList.map((i) => i.name).filter(Boolean);

describe('mutador do senão (FR-002; research R-04)', () => {
  let ws;

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
    confirmarTirarSenao.mockReset();
  });

  it('um se novo não tem senão e não salva extraState', () => {
    const b = ws.newBlock('se');
    expect(b.getInput('SENAO')).toBeNull();
    expect(b.saveExtraState()).toBeNull();
    // O ícone fica logo depois de "então", antes da área ENTAO.
    expect(encaixes(b)).toEqual(['CONDICAO', 'ICONE', 'ENTAO']);
  });

  it('ligarSenao cria a área senão; um desfazer tira', async () => {
    const b = ws.newBlock('se');
    ws.clearUndo();
    b.ligarSenao();
    expect(b.getInput('SENAO')).not.toBeNull();
    expect(b.getInput('SENAO').fieldRow.map((f) => f.getText())).toContain('senão');
    expect(b.saveExtraState()).toEqual({ senao: true });
    await desfazer(ws);
    expect(b.getInput('SENAO')).toBeNull();
    expect(b.saveExtraState()).toBeNull();
  });

  it('tirarSenao com a área vazia tira sem perguntar; um desfazer volta', async () => {
    const b = ws.newBlock('se');
    b.ligarSenao();
    await new Promise((r) => setTimeout(r, 0));
    ws.clearUndo();
    b.tirarSenao();
    expect(b.getInput('SENAO')).toBeNull();
    expect(confirmarTirarSenao).not.toHaveBeenCalled();
    await desfazer(ws);
    expect(b.getInput('SENAO')).not.toBeNull();
  });

  it.each([
    [{ senao: true }, true],
    [null, false],
    [{ senao: false }, false],
    [{ senao: 'sim' }, false],
  ])('loadExtraState(%j) → senão %s', (estado, temSenao) => {
    const b = ws.newBlock('se');
    b.loadExtraState(estado);
    expect(b.getInput('SENAO') !== null).toBe(temSenao);
  });

  it('ida e volta da serialização, com e sem senão', () => {
    const json = {
      type: 'se',
      id: 's1',
      extraState: { senao: true },
      inputs: {
        CONDICAO: { block: { type: 'logico', id: 'l1', fields: { VALOR: 'verdadeiro' } } },
        ENTAO: { block: { type: 'escreva', id: 'e1', extraState: { valores: 1 }, inputs: { VALOR1: { block: { type: 'texto', id: 't1', fields: { TEXTO: 'a' } } } } } },
        SENAO: { block: { type: 'escreva', id: 'e2', extraState: { valores: 1 }, inputs: { VALOR1: { block: { type: 'texto', id: 't2', fields: { TEXTO: 'b' } } } } } },
      },
    };
    const b = Blockly.serialization.blocks.append(json, ws);
    expect(b.getInputTargetBlock('SENAO').id).toBe('e2');
    const salvo = Blockly.serialization.blocks.save(b, { addCoordinates: false });
    expect(salvo.extraState).toEqual({ senao: true });
    expect(salvo.inputs.SENAO.block.id).toBe('e2');

    const semSenao = Blockly.serialization.blocks.append({ type: 'se', id: 's2' }, ws);
    expect(Blockly.serialization.blocks.save(semSenao).extraState).toBeUndefined();
  });

  it('no flyout, ligar e tirar não fazem nada', () => {
    const b = ws.newBlock('se');
    b.isInFlyout = true;
    b.ligarSenao();
    expect(b.getInput('SENAO')).toBeNull();
    b.isInFlyout = false;
    b.ligarSenao();
    b.isInFlyout = true;
    b.tirarSenao();
    expect(b.getInput('SENAO')).not.toBeNull();
  });
});

// P-1 da 006 (research R-05): a condição do se só aceita valores lógicos.
describe('condição só lógica (P-1)', async () => {
  const { aplicarTipoVariavel } = await import('../../src/ui/acoes-variavel.js');
  const { gerarPortugol } = await import('../../src/portugol/gerador.js');
  const { projetoVazio } = await import('../../src/projeto/formato.js');
  const { variaveisDoMapa } = await import('../../src/projeto/variaveis.js');
  let ws;

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
    const mapa = ws.getVariableMap();
    mapa.createVariable('idade', 'inteiro', 'v-idade');
    mapa.createVariable('nome', 'cadeia', 'v-nome');
    mapa.createVariable('ok', 'logico', 'v-ok');
  });

  function criar(tipo, { campos = {}, variavel } = {}) {
    const b = ws.newBlock(tipo);
    if (variavel) b.getField('VAR').setValue(variavel);
    for (const [nome, valor] of Object.entries(campos)) b.getField(nome).setValue(valor);
    return b;
  }
  const podeEncaixar = (filho, pai) =>
    ws.connectionChecker.canConnect(filho.outputConnection, pai.getInput('CONDICAO').connection, false);

  it.each([
    ['numero', {}],
    ['texto', {}],
    ['aritmetico', {}],
    ['negativo', {}],
    ['variavel', { variavel: 'v-idade' }],
    ['variavel', { variavel: 'v-nome' }],
  ])('%s %j não encaixa na condição', (tipo, opcoes) => {
    expect(podeEncaixar(criar(tipo, opcoes), criar('se'))).toBe(false);
  });

  it.each([
    ['relacional', {}],
    ['e_ou', {}],
    ['nao', {}],
    ['logico', {}],
    ['variavel', { variavel: 'v-ok' }],
  ])('%s %j encaixa na condição', (tipo, opcoes) => {
    expect(podeEncaixar(criar(tipo, opcoes), criar('se'))).toBe(true);
  });

  it('mudar ok para inteiro solta ok da condição; um Ctrl+Z volta', async () => {
    Blockly.serialization.workspaces.load(
      {
        blocks: {
          languageVersion: 0,
          blocks: [
            {
              type: 'programa',
              id: 'programa',
              inputs: {
                COMANDOS: {
                  block: { type: 'se', id: 's1', inputs: { CONDICAO: { block: { type: 'variavel', id: 'vok', fields: { VAR: { id: 'v-ok' } } } } } },
                },
              },
            },
          ],
        },
        variables: [
          { name: 'idade', type: 'inteiro', id: 'v-idade' },
          { name: 'ok', type: 'logico', id: 'v-ok' },
        ],
      },
      ws,
    );
    await new Promise((r) => setTimeout(r, 0));
    ws.clearUndo();
    aplicarTipoVariavel(ws, 'v-ok', 'inteiro');
    expect(ws.getBlockById('vok').getParent()).toBeNull();
    const blocos = Blockly.serialization.workspaces.save(ws);
    delete blocos.variables;
    const { codigo, avisos } = gerarPortugol({
      ...projetoVazio(),
      variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()),
      blocos,
    });
    expect(codigo).toContain('    se ??? entao\n');
    expect(avisos.map((a) => a.mensagem)).toContain('Falta a condição do bloco se');

    await desfazer(ws);
    expect(ws.getVariableMap().getVariableById('v-ok').getType()).toBe('logico');
    expect(ws.getBlockById('s1').getInputTargetBlock('CONDICAO')?.id).toBe('vok');
  });
});
