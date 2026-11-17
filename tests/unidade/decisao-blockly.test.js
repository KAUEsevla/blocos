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

// História 2, cenário 2 (research R-04; data-model "Confirmação"): tirar o senão com comandos.
describe('tirar o senão com comandos (História 2)', () => {
  let ws;

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
    confirmarTirarSenao.mockReset();
  });

  const texto = (id, t) => ({ type: 'texto', id, fields: { TEXTO: t } });
  const escreva = (id, valor, next) => ({
    type: 'escreva',
    id,
    extraState: { valores: 1 },
    inputs: { VALOR1: { block: valor } },
    ...(next ? { next: { block: next } } : {}),
  });

  // se com o senão: escreva("Menor") e escreva(1) — 4 blocos dentro.
  function seComSenao(senao = escreva('e1', texto('t1', 'Menor'), escreva('e2', { type: 'numero', id: 'n1', fields: { NUM: '1' } }))) {
    return Blockly.serialization.blocks.append({ type: 'se', id: 's1', extraState: { senao: true }, inputs: { SENAO: { block: senao } } }, ws);
  }

  // Espera a promessa da confirmação e o que vem depois dela.
  const esperar = () => new Promise((r) => setTimeout(r, 0));

  it('pergunta com a quantidade e a mensagem certas', async () => {
    const b = seComSenao();
    confirmarTirarSenao.mockResolvedValue(false);
    b.tirarSenao();
    await esperar();
    expect(confirmarTirarSenao).toHaveBeenCalledTimes(1);
    expect(confirmarTirarSenao).toHaveBeenCalledWith({
      quantidade: 4,
      mensagem: 'Tirar o senão apaga 4 blocos que estão dentro dele.',
    });
  });

  it('confirmar apaga os 4 blocos e tira a área; um desfazer volta tudo', async () => {
    const b = seComSenao();
    await esperar();
    ws.clearUndo();
    confirmarTirarSenao.mockResolvedValue(true);
    b.tirarSenao();
    await esperar();
    expect(b.getInput('SENAO')).toBeNull();
    expect(b.saveExtraState()).toBeNull();
    expect(ws.getAllBlocks(false).map((x) => x.id)).toEqual(['s1']);

    await desfazer(ws);
    expect(b.getInput('SENAO')).not.toBeNull();
    expect(b.getInputTargetBlock('SENAO')?.id).toBe('e1');
    expect(ws.getBlockById('e1').getNextBlock()?.id).toBe('e2');
    expect(ws.getBlockById('e2').getInputTargetBlock('VALOR1')?.id).toBe('n1');
    expect(ws.getAllBlocks(false)).toHaveLength(5);
  });

  it('cancelar não muda nada', async () => {
    const b = seComSenao();
    confirmarTirarSenao.mockResolvedValue(false);
    b.tirarSenao();
    await esperar();
    expect(b.getInput('SENAO')).not.toBeNull();
    expect(ws.getAllBlocks(false)).toHaveLength(5);
  });

  it('bloco apagado antes da resposta: sem erro e sem mudança', async () => {
    const b = seComSenao();
    let responder;
    confirmarTirarSenao.mockReturnValue(new Promise((r) => (responder = r)));
    b.tirarSenao();
    b.dispose();
    responder(true);
    await esperar();
    expect(ws.getAllBlocks(false)).toHaveLength(0);
  });

  it('um se aninhado no senão entra na contagem com os filhos', async () => {
    const interno = {
      type: 'se',
      id: 's2',
      inputs: {
        CONDICAO: { block: { type: 'logico', id: 'l1', fields: { VALOR: 'verdadeiro' } } },
        ENTAO: { block: escreva('e3', texto('t3', 'x')) },
      },
    };
    const b = seComSenao(interno);
    confirmarTirarSenao.mockResolvedValue(false);
    b.tirarSenao();
    await esperar();
    expect(confirmarTirarSenao.mock.calls[0][0].quantidade).toBe(4);
  });

  it('sem função de confirmação registrada, não apaga nada', async () => {
    const { registrarMutadorSe: registrar } = await import('../../src/ui/mutador-se.js');
    registrar({ confirmarTirarSenao: null });
    const b = seComSenao();
    b.tirarSenao();
    await esperar();
    expect(b.getInput('SENAO')).not.toBeNull();
    registrar({ confirmarTirarSenao });
  });
});

// História 3 (FR-004, FR-005): um se dentro de outro, no então e no senão.
describe('aninhar (FR-004)', async () => {
  const { gerarPortugol } = await import('../../src/portugol/gerador.js');
  const { projetoVazio } = await import('../../src/projeto/formato.js');
  let ws;

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
    Blockly.serialization.workspaces.load(projetoVazio().blocos, ws);
  });

  const podeEncaixarComando = (filho, conexao) => ws.connectionChecker.canConnect(filho.previousConnection, conexao, false);

  it('um se encaixa no programa, no então e no senão de outro se', () => {
    const externo = ws.newBlock('se');
    externo.ligarSenao();
    const interno = ws.newBlock('se');
    expect(podeEncaixarComando(externo, ws.getBlockById('programa').getInput('COMANDOS').connection)).toBe(true);
    expect(podeEncaixarComando(interno, externo.getInput('ENTAO').connection)).toBe(true);
    expect(podeEncaixarComando(interno, externo.getInput('SENAO').connection)).toBe(true);
  });

  it('se no senão de outro: cada um com o seu fim_se, o interno um nível à direita', () => {
    const programa = ws.getBlockById('programa');
    const externo = ws.newBlock('se');
    externo.ligarSenao();
    programa.getInput('COMANDOS').connection.connect(externo.previousConnection);
    const interno = ws.newBlock('se');
    externo.getInput('SENAO').connection.connect(interno.previousConnection);
    for (const b of [externo, interno]) {
      const v = ws.newBlock('logico');
      v.setFieldValue('verdadeiro', 'VALOR');
      b.getInput('CONDICAO').connection.connect(v.outputConnection);
    }
    const blocos = Blockly.serialization.workspaces.save(ws);
    delete blocos.variables;
    const { codigo, avisos } = gerarPortugol({ ...projetoVazio(), blocos });
    expect(avisos).toEqual([]);
    expect(codigo).toContain(
      '    se verdadeiro entao\n    senao\n        se verdadeiro entao\n        fim_se\n    fim_se\n',
    );
  });
});
