// Comportamento do mapa de variáveis do Blockly 12.5.1 em que a spec 002 se apoia
// (RF-02; research R-04). Blockly headless, como bloco-programa.test.js.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { variaveisDoMapa, blocosComVariaveis, contarBlocosApagados } from '../../src/projeto/variaveis.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { registroPadrao, criarRegistro } from '../../src/blocos/registro.js';
import { BLOCO_PROGRAMA } from '../../src/blocos/programa.js';
import { BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL } from '../../src/blocos/variaveis.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';

const nomes = (ws) => variaveisDoMapa(ws.getVariableMap().getAllVariables()).map((v) => v.nome);

// O Blockly entrega os eventos aos ouvintes num setTimeout(0).
const eventosEntregues = () => new Promise((resolver) => setTimeout(resolver, 0));

describe('mapa de variáveis do Blockly (research R-04)', () => {
  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    registrarMutadorEscreva();
    registrarValidadorNumero();
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

describe('renomear, mudar o tipo e apagar no Blockly headless (spec 002, T037; research R-06)', () => {
  const VARIAVEIS = [
    { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
    { id: 'v-b', nome: 'b', tipo: 'inteiro' },
    { id: 'v-x', nome: 'x', tipo: 'inteiro' },
  ];
  const usa = (id) => ({ VAR: { id } });
  const ler = (id, bid) => ({ type: 'variavel', id: bid, fields: usa(id) });
  const recebe = (id, valor, bid, next) => ({
    type: 'variavel_recebe',
    id: bid,
    fields: usa(id),
    ...(valor ? { inputs: { VALOR: { block: valor } } } : {}),
    ...(next ? { next: { block: next } } : {}),
  });
  // programa → idade recebe [b] → x recebe [idade]; e um "idade" solto.
  const blocosDeTeste = () => ({
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'programa',
          id: 'programa',
          x: 24,
          y: 24,
          inputs: {
            COMANDOS: { block: recebe('v-idade', ler('v-b', 'l1'), 'r1', recebe('v-x', ler('v-idade', 'l2'), 'r2')) },
          },
        },
        { ...ler('v-idade', 'solto'), x: 300, y: 300 },
      ],
    },
  });

  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    Blockly.defineBlocksWithJsonArray(
      [BLOCO_PROGRAMA, BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL].map((b) => b.definicao),
    );
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(blocosComVariaveis(blocosDeTeste(), VARIAVEIS), ws);
    ws.clearUndo();
  });

  const salvar = () => {
    const blocos = Blockly.serialization.workspaces.save(ws);
    delete blocos.variables;
    return blocos;
  };
  const gerar = () =>
    gerarPortugol({ ...projetoVazio(), variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()), blocos: salvar() });

  it('renameVariable muda os três campos que usam idade e o Portugol', () => {
    const v = ws.getVariableMap().getVariableById('v-idade');
    ws.getVariableMap().renameVariable(v, 'anos');
    for (const id of ['r1', 'l2', 'solto']) expect(ws.getBlockById(id).getField('VAR').getText()).toBe('anos');
    const { codigo } = gerar();
    expect(codigo).toContain('    anos: inteiro\n');
    expect(codigo).toContain('    anos <- b\n    x <- anos\n');
  });

  it('getVariableUsesById encontra os três usos', () => {
    expect(Blockly.Variables.getVariableUsesById(ws, 'v-idade')).toHaveLength(3);
  });

  it('deleteVariable apaga a variável e os usos; o comando seguinte sobe; um desfazer volta tudo', async () => {
    const antes = ws.getAllBlocks(false).length;
    ws.getVariableMap().deleteVariable(ws.getVariableMap().getVariableById('v-idade'));
    await eventosEntregues();

    expect(ws.getVariableMap().getVariableById('v-idade')).toBeNull();
    for (const id of ['r1', 'l1', 'l2', 'solto']) expect(ws.getBlockById(id), id).toBeNull();
    expect(ws.getBlockById('programa').getInputTargetBlock('COMANDOS').id).toBe('r2');
    expect(ws.getAllBlocks(false).length).toBe(antes - 4);

    ws.undo(false);
    await eventosEntregues();
    expect(ws.getVariableMap().getVariableById('v-idade')).not.toBeNull();
    expect(ws.getAllBlocks(false).length).toBe(antes);
    expect(ws.getBlockById('programa').getInputTargetBlock('COMANDOS').id).toBe('r1');
  });

  it('changeVariableType com a variável em uso mantém os blocos', () => {
    const antes = ws.getAllBlocks(false).length;
    ws.getVariableMap().changeVariableType(ws.getVariableMap().getVariableById('v-idade'), 'real');
    expect(ws.getAllBlocks(false).length).toBe(antes);
    expect(ws.getBlockById('r1').getField('VAR').getText()).toBe('idade');
    expect(gerar().codigo).toContain('    idade: real\n');
  });

  it.each([
    ['idade recebe [b] + dois idade soltos', 'v-idade', (b) => b.blocks.blocks.push({ ...ler('v-idade', 's2'), x: 400, y: 400 })],
    ['x recebe [idade] (uso dentro de outro bloco)', 'v-idade', () => {}],
    ['apagar b (usado como valor de idade recebe)', 'v-b', () => {}],
  ])('contarBlocosApagados bate com o que o deleteVariable remove: %s', (_nome, id, ajustar) => {
    const blocos = blocosDeTeste();
    ajustar(blocos);
    Blockly.serialization.workspaces.load(blocosComVariaveis(blocos, VARIAVEIS), ws);
    const { total } = contarBlocosApagados(salvar(), id);
    const antes = ws.getAllBlocks(false).length;
    ws.getVariableMap().deleteVariable(ws.getVariableMap().getVariableById(id));
    expect(antes - ws.getAllBlocks(false).length).toBe(total);
  });

  it('contagem igual também com idade recebe [idade]', () => {
    const blocos = {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'programa', id: 'programa', x: 0, y: 0, inputs: { COMANDOS: { block: recebe('v-idade', ler('v-idade', 'l9'), 'r9') } } }],
      },
    };
    Blockly.serialization.workspaces.load(blocosComVariaveis(blocos, VARIAVEIS), ws);
    const contagem = contarBlocosApagados(salvar(), 'v-idade');
    expect(contagem).toEqual({ usos: 2, total: 2 });
    const antes = ws.getAllBlocks(false).length;
    ws.getVariableMap().deleteVariable(ws.getVariableMap().getVariableById('v-idade'));
    expect(antes - ws.getAllBlocks(false).length).toBe(2);
  });
});
