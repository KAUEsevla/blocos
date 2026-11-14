import { describe, it, expect, beforeAll } from 'vitest';
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';

describe('bloco programa no Blockly headless (RF-08)', () => {
  let ws;

  beforeAll(() => {
    Blockly.defineBlocksWithJsonArray([registroPadrao.obter('programa').definicao]);
    ws = new Blockly.Workspace();
  });

  it('é um bloco chapéu com a área COMANDOS e o rótulo "programa"', () => {
    const bloco = ws.newBlock('programa');
    expect(bloco.previousConnection).toBeNull();
    expect(bloco.nextConnection).toBeNull();
    expect(bloco.outputConnection).toBeNull();
    expect(bloco.getInput('COMANDOS').type).toBe(Blockly.inputs.inputTypes.STATEMENT);
    expect(bloco.toString()).toContain('programa');
  });

  it('serializa com type "programa"', () => {
    const salvo = Blockly.serialization.workspaces.save(ws);
    expect(salvo.blocks.blocks.map((b) => b.type)).toContain('programa');
  });
});
