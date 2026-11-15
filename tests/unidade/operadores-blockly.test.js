// Verificador de encaixe "meupia" no Blockly 12.5.1 headless (RF-06; SC-002 da spec 006;
// research R-09, R-10; contracts/editor-operadores.md).
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { registroPadrao } from '../../src/blocos/registro.js';
import { blocosComVariaveis } from '../../src/projeto/variaveis.js';
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
