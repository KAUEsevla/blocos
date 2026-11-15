// Verificador de encaixe "meupia" no Blockly 12.5.1 headless (RF-06; SC-002 da spec 006;
// research R-09, R-10; contracts/editor-operadores.md).
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { registroPadrao } from '../../src/blocos/registro.js';
import { blocosComVariaveis, variaveisDoMapa } from '../../src/projeto/variaveis.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { aplicarTipoVariavel } from '../../src/ui/acoes-variavel.js';
import { trocarVariavelDoBloco } from '../../src/ui/campo-variavel.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import {
  registrarVerificadorEncaixe,
  NOME_VERIFICADOR,
  VerificadorEncaixe,
} from '../../src/ui/verificador-encaixe.js';

const PASTA_CASOS = join(import.meta.dirname, '..', 'aceitacao', 'casos');

function novoWorkspace() {
  return new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }));
}

function registrarTudo() {
  registrarCampoVariavel();
  registrarMutadorEscreva();
  registrarValidadorNumero();
  registrarVerificadorEncaixe();
  Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
}

// Cria um bloco solto; "variavel" é o id de uma variável para o campo VAR.
function criar(ws, tipo, { campos = {}, variavel } = {}) {
  const b = ws.newBlock(tipo);
  if (variavel) b.getField('VAR').setValue(variavel);
  for (const [nome, valor] of Object.entries(campos)) b.getField(nome).setValue(valor);
  return b;
}

const podeEncaixar = (ws, filho, pai, encaixe) =>
  ws.connectionChecker.canConnect(filho.outputConnection, pai.getInput(encaixe).connection, false);

describe('verificador de encaixe (research R-09)', () => {
  let ws;

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
    const mapa = ws.getVariableMap();
    mapa.createVariable('idade', 'inteiro', 'v-idade');
    mapa.createVariable('nome', 'cadeia', 'v-nome');
    mapa.createVariable('ok', 'logico', 'v-ok');
  });

  it('o workspace usa o verificador meupia', () => {
    expect(ws.connectionChecker).toBeInstanceOf(VerificadorEncaixe);
  });

  it('variável lógica não encaixa na conta; variável inteira encaixa', () => {
    const conta = criar(ws, 'aritmetico', { campos: { OP: '+' } });
    expect(podeEncaixar(ws, criar(ws, 'variavel', { variavel: 'v-ok' }), conta, 'A')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'variavel', { variavel: 'v-idade' }), conta, 'A')).toBe(true);
  });

  it('o recebe só aceita valor do tipo da variável', () => {
    const recebeIdade = criar(ws, 'variavel_recebe', { variavel: 'v-idade' });
    const recebeNome = criar(ws, 'variavel_recebe', { variavel: 'v-nome' });
    expect(podeEncaixar(ws, criar(ws, 'texto'), recebeIdade, 'VALOR')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'numero'), recebeNome, 'VALOR')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'numero'), recebeIdade, 'VALOR')).toBe(true);
    expect(podeEncaixar(ws, criar(ws, 'texto'), recebeNome, 'VALOR')).toBe(true);
  });

  it('variável sem escolher encaixa em qualquer lugar', () => {
    const semVariavel = () => criar(ws, 'variavel');
    expect(podeEncaixar(ws, semVariavel(), criar(ws, 'aritmetico'), 'A')).toBe(true);
    expect(podeEncaixar(ws, semVariavel(), criar(ws, 'variavel_recebe', { variavel: 'v-ok' }), 'VALOR')).toBe(true);
    expect(podeEncaixar(ws, semVariavel(), criar(ws, 'escreva'), 'VALOR1')).toBe(true);
  });

  describe('todos os casos de aceitação carregam com o verificador', () => {
    const arquivos = readdirSync(PASTA_CASOS).filter((n) => n.endsWith('.json')).sort();

    it.each(arquivos)('%s', (arquivo) => {
      const { projeto } = JSON.parse(readFileSync(join(PASTA_CASOS, arquivo), 'utf8'));
      const vazio = novoWorkspace();
      expect(() =>
        Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), vazio),
      ).not.toThrow();
      expect(vazio.getTopBlocks(false).length).toBe(projeto.blocos.blocks.blocks.length);
    });
  });
});

// Parte 2: blocos novos, mudar o tipo e trocar a variável sem quebrar encaixes (research R-10).
describe('tipos com os blocos da 006 e mudanças de variável (research R-10)', () => {
  let ws;

  const VARIAVEIS = [
    { id: 'v-idade', nome: 'idade', tipo: 'inteiro' },
    { id: 'v-altura', nome: 'altura', tipo: 'real' },
    { id: 'v-ok', nome: 'ok', tipo: 'logico' },
  ];
  const variavel = (id, idBloco) => ({ type: 'variavel', id: idBloco, fields: { VAR: { id } } });
  const programaCom = (comando) => ({
    blocks: {
      languageVersion: 0,
      blocks: [{ type: 'programa', id: 'programa', x: 0, y: 0, deletable: false, inputs: { COMANDOS: { block: comando } } }],
    },
  });
  const carregar = (comando) =>
    Blockly.serialization.workspaces.load(blocosComVariaveis(programaCom(comando), VARIAVEIS), ws);
  const portugol = () => {
    const blocos = Blockly.serialization.workspaces.save(ws);
    delete blocos.variables;
    return gerarPortugol({ ...projetoVazio(), variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()), blocos });
  };
  const tipo = (id) => ws.getVariableMap().getVariableById(id).getType();
  // O Blockly entrega os eventos à pilha do desfazer num setTimeout(0).
  const desfazer = async () => {
    await new Promise((r) => setTimeout(r, 0));
    ws.undo(false);
  };

  // escreva(idade + 1)
  const escrevaIdadeMaisUm = () => ({
    type: 'escreva',
    id: 'e1',
    inputs: {
      VALOR1: {
        block: {
          type: 'aritmetico',
          id: 'c1',
          fields: { OP: '+' },
          inputs: {
            A: { block: variavel('v-idade', 'vi') },
            B: { block: { type: 'numero', id: 'n1', fields: { NUM: '1' } } },
          },
        },
      },
    },
  });
  // ok recebe (idade >= 18)
  const okRecebeComparacao = () => ({
    type: 'variavel_recebe',
    id: 'r1',
    fields: { VAR: { id: 'v-ok' } },
    inputs: {
      VALOR: {
        block: {
          type: 'relacional',
          id: 'q1',
          fields: { OP: '>=' },
          inputs: {
            A: { block: variavel('v-idade', 'vi') },
            B: { block: { type: 'numero', id: 'n1', fields: { NUM: '18' } } },
          },
        },
      },
    },
  });

  beforeAll(registrarTudo);

  beforeEach(() => {
    ws = novoWorkspace();
  });

  it('blocos da 006 recusam e aceitam conforme os tipos', () => {
    for (const v of VARIAVEIS) ws.getVariableMap().createVariable(v.nome, v.tipo, v.id);
    expect(podeEncaixar(ws, criar(ws, 'numero'), criar(ws, 'e_ou', { campos: { OP: 'e' } }), 'A')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'relacional'), criar(ws, 'aritmetico'), 'A')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'variavel', { variavel: 'v-ok' }), criar(ws, 'negativo'), 'X')).toBe(false);
    const recebeOk = criar(ws, 'variavel_recebe', { variavel: 'v-ok' });
    expect(podeEncaixar(ws, criar(ws, 'numero'), recebeOk, 'VALOR')).toBe(false);
    expect(podeEncaixar(ws, criar(ws, 'relacional'), recebeOk, 'VALOR')).toBe(true);
    expect(podeEncaixar(ws, criar(ws, 'logico'), criar(ws, 'nao'), 'X')).toBe(true);
  });

  it('mudar idade para lógico solta o bloco da conta, e um Ctrl+Z volta tudo', async () => {
    carregar(escrevaIdadeMaisUm());
    aplicarTipoVariavel(ws, 'v-idade', 'logico');
    expect(tipo('v-idade')).toBe('logico');
    expect(ws.getBlockById('vi').getParent()).toBeNull();
    expect(ws.getBlockById('c1').getInputTargetBlock('A')).toBeNull();
    const { codigo, avisos } = portugol();
    expect(codigo).toContain('    escreva(??? + 1)\n');
    expect(avisos.map((a) => a.mensagem)).toContain('Falta o primeiro valor do bloco conta');

    await desfazer();
    expect(tipo('v-idade')).toBe('inteiro');
    expect(ws.getBlockById('c1').getInputTargetBlock('A')?.id).toBe('vi');
  });

  it('mudar ok para inteiro solta a comparação do recebe, e um Ctrl+Z volta', async () => {
    carregar(okRecebeComparacao());
    aplicarTipoVariavel(ws, 'v-ok', 'inteiro');
    expect(ws.getBlockById('r1').getInputTargetBlock('VALOR')).toBeNull();
    expect(ws.getBlockById('q1').getParent()).toBeNull();
    await desfazer();
    expect(tipo('v-ok')).toBe('logico');
    expect(ws.getBlockById('r1').getInputTargetBlock('VALOR')?.id).toBe('q1');
  });

  it('mudar para um tipo compatível não solta nada', () => {
    carregar(escrevaIdadeMaisUm());
    aplicarTipoVariavel(ws, 'v-idade', 'real');
    expect(tipo('v-idade')).toBe('real');
    expect(ws.getBlockById('c1').getInputTargetBlock('A')?.id).toBe('vi');
  });

  it('trocar idade por ok no bloco da conta solta o bloco, e um Ctrl+Z volta', async () => {
    carregar(escrevaIdadeMaisUm());
    const bloco = ws.getBlockById('vi');
    trocarVariavelDoBloco(bloco, 'v-ok');
    expect(bloco.getField('VAR').getValue()).toBe('v-ok');
    expect(bloco.getParent()).toBeNull();
    await desfazer();
    expect(bloco.getField('VAR').getValue()).toBe('v-idade');
    expect(ws.getBlockById('c1').getInputTargetBlock('A')?.id).toBe('vi');
  });

  it('trocar por uma variável compatível não solta nada', () => {
    carregar(escrevaIdadeMaisUm());
    const bloco = ws.getBlockById('vi');
    trocarVariavelDoBloco(bloco, 'v-altura');
    expect(bloco.getField('VAR').getValue()).toBe('v-altura');
    expect(ws.getBlockById('c1').getInputTargetBlock('A')?.id).toBe('vi');
  });

  it('trocar a variável do recebe solta o valor que não cabe, e um Ctrl+Z volta', async () => {
    carregar(okRecebeComparacao());
    trocarVariavelDoBloco(ws.getBlockById('r1'), 'v-idade');
    expect(ws.getBlockById('r1').getField('VAR').getValue()).toBe('v-idade');
    expect(ws.getBlockById('q1').getParent()).toBeNull();
    await desfazer();
    expect(ws.getBlockById('r1').getField('VAR').getValue()).toBe('v-ok');
    expect(ws.getBlockById('r1').getInputTargetBlock('VALOR')?.id).toBe('q1');
  });
});
