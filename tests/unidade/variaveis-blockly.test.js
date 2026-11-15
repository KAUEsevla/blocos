// Comportamento do mapa de variáveis do Blockly 12.5.1 em que a spec 002 se apoia
// (RF-02; research R-04). Blockly headless, como bloco-programa.test.js.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { variaveisDoMapa, blocosComVariaveis } from '../../src/projeto/variaveis.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { registroPadrao, criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';

const nomes = (ws) => variaveisDoMapa(ws.getVariableMap().getAllVariables()).map((v) => v.nome);

// O Blockly entrega os eventos aos ouvintes num setTimeout(0).
const eventosEntregues = () => new Promise((resolver) => setTimeout(resolver, 0));

describe('mapa de variáveis do Blockly (research R-04)', () => {
  let ws;

  beforeAll(() => {
    const definicoes = registroPadrao.tiposRegistrados().map((tipo) => registroPadrao.obter(tipo).definicao);
    Blockly.defineBlocksWithJsonArray(definicoes);
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
  });

  it('getAllVariables agrupa por tipo na ordem do primeiro de cada tipo e mantém a ordem de criação dentro do tipo', () => {
    const mapa = ws.getVariableMap();
    mapa.createVariable('a', 'inteiro', 'va');
    mapa.createVariable('nome', 'cadeia', 'vn');
    mapa.createVariable('b', 'inteiro', 'vb');
    expect(nomes(ws)).toEqual(['a', 'b', 'nome']);
  });

  it('changeVariableType põe a variável no fim do grupo do tipo novo', () => {
    const mapa = ws.getVariableMap();
    mapa.createVariable('a', 'inteiro', 'va');
    mapa.createVariable('nome', 'cadeia', 'vn');
    mapa.createVariable('b', 'inteiro', 'vb');
    mapa.changeVariableType(mapa.getVariableById('va'), 'cadeia');
    expect(variaveisDoMapa(mapa.getAllVariables())).toEqual([
      { id: 'vb', nome: 'b', tipo: 'inteiro' },
      { id: 'vn', nome: 'nome', tipo: 'cadeia' },
      { id: 'va', nome: 'a', tipo: 'cadeia' },
    ]);
  });

  it('load com blocosComVariaveis cria as variáveis na ordem da lista; load sem variables deixa o mapa vazio', () => {
    const variaveis = [
      { id: 'v1', nome: 'idade', tipo: 'inteiro' },
      { id: 'v2', nome: 'altura', tipo: 'real' },
      { id: 'v3', nome: 'anos', tipo: 'inteiro' },
    ];
    Blockly.serialization.workspaces.load(blocosComVariaveis(projetoVazio().blocos, variaveis), ws);
    expect(variaveisDoMapa(ws.getVariableMap().getAllVariables())).toEqual([
      { id: 'v1', nome: 'idade', tipo: 'inteiro' },
      { id: 'v3', nome: 'anos', tipo: 'inteiro' },
      { id: 'v2', nome: 'altura', tipo: 'real' },
    ]);

    Blockly.serialization.workspaces.load(projetoVazio().blocos, ws);
    expect(ws.getVariableMap().getAllVariables()).toEqual([]);
  });

  it('criar, renomear, mudar o tipo e apagar disparam eventos não-UI', async () => {
    const eventos = [];
    ws.addChangeListener((e) => eventos.push(e));
    const mapa = ws.getVariableMap();
    const v = mapa.createVariable('idade', 'inteiro', 'v1');
    mapa.renameVariable(v, 'anos');
    mapa.changeVariableType(v, 'real');
    mapa.deleteVariable(v);
    await eventosEntregues();

    const porTipo = (tipo) => eventos.filter((e) => e.type === tipo);
    for (const tipo of ['var_create', 'var_rename', 'var_type_change', 'var_delete']) {
      expect(porTipo(tipo), tipo).toHaveLength(1);
      expect(porTipo(tipo)[0].isUiEvent, tipo).toBe(false);
    }
  });
});

describe('blocos de variável no Blockly headless (spec 002, T025)', () => {
  const registro = criarRegistro();
  for (const entrada of [BLOCO_PROGRAMA, BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL]) registro.registrarBloco(entrada);
  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    Blockly.defineBlocksWithJsonArray([BLOCO_VARIAVEL_RECEBE.definicao, BLOCO_VARIAVEL.definicao]);
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
  });

  it('ida e volta: idade recebe [b] montado pela API, salvo e gerado → idade <- b', () => {
    const mapa = ws.getVariableMap();
    mapa.createVariable('idade', 'inteiro', 'v-idade');
    mapa.createVariable('b', 'inteiro', 'v-b');

    const programa = ws.newBlock('programa', 'programa');
    const recebe = ws.newBlock('variavel_recebe');
    const valor = ws.newBlock('variavel');
    recebe.getField('VAR').setValue('v-idade');
    valor.getField('VAR').setValue('v-b');
    programa.getInput('COMANDOS').connection.connect(recebe.previousConnection);
    recebe.getInput('VALOR').connection.connect(valor.outputConnection);

    const blocos = Blockly.serialization.workspaces.save(ws);
    delete blocos.variables;
    const salvoRecebe = blocos.blocks.blocks[0].inputs.COMANDOS.block;
    expect(salvoRecebe.fields.VAR).toEqual({ id: 'v-idade' });
    expect(salvoRecebe.inputs.VALOR.block.fields.VAR).toEqual({ id: 'v-b' });

    const projeto = { ...projetoVazio(), variaveis: variaveisDoMapa(mapa.getAllVariables()), blocos };
    const { codigo, avisos } = gerarPortugol(projeto, registro);
    expect(codigo).toContain('\n    idade <- b\n');
    expect(avisos).toEqual([]);
  });

  it('bloco novo sem variável não cria a variável "item" e mostra ???', () => {
    const valor = ws.newBlock('variavel');
    const recebe = ws.newBlock('variavel_recebe');
    expect(ws.getVariableMap().getAllVariables()).toEqual([]);
    expect(valor.getField('VAR').getText()).toBe('???');
    expect(recebe.getField('VAR').getText()).toBe('???');
    expect(Blockly.serialization.blocks.save(valor).fields).toEqual({ VAR: null });
  });
});
