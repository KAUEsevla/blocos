// Caminho do Salvar e do Carregar no Blockly headless (spec 011, R-09; spec 012, R-10), usado pelos testes de
// unidade e de aceitação: carregar um projeto como o editor carrega, montar o projeto como o
// projetoAtual() do main.js e passar por prepararSalvamento.
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarMutadorSe } from '../../src/ui/mutador-se.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import { registrarVerificadorEncaixe, NOME_VERIFICADOR } from '../../src/ui/verificador-encaixe.js';
import { variaveisDoMapa, blocosComVariaveis } from '../../src/projeto/variaveis.js';
import { prepararSalvamento } from '../../src/projeto/salvar.js';
import { classificarErroCarga } from '../../src/projeto/carregar.js';

let definidos = false;

export function registrarBlocos() {
  if (definidos) return;
  registrarCampoVariavel();
  registrarMutadorEscreva();
  registrarMutadorSe();
  registrarValidadorNumero();
  registrarVerificadorEncaixe();
  Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
  definidos = true;
}

// Como criarWorkspace/recarregarBlocos de src/ui/workspace.js, sem DOM.
export function carregarNoWorkspace(projeto) {
  registrarBlocos();
  const ws = new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }));
  Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws);
  return ws;
}

// Como projetoAtual() de src/main.js com serializarBlocos e variaveisDoWorkspace.
export function projetoDoWorkspace(ws, base) {
  const blocos = Blockly.serialization.workspaces.save(ws);
  delete blocos.variables;
  return { ...base, variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()), blocos };
}

// Salvar e ler o arquivo de volta.
export function salvarELer(ws, base) {
  const projeto = projetoDoWorkspace(ws, base);
  const salvo = prepararSalvamento(projeto);
  return { projeto, salvo, lido: JSON.parse(salvo.texto) };
}

// Como ensaiarCarga de src/ui/workspace.js (spec 012, contracts/tela-carregar.md): carga num
// workspace headless descartável; o erro do Blockly vira { ok: false, erro }.
export function ensaiarNoWorkspace(projeto) {
  registrarBlocos();
  const ws = new Blockly.Workspace(new Blockly.Options({ plugins: { connectionChecker: NOME_VERIFICADOR } }));
  try {
    Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws);
    return { ok: true };
  } catch (erro) {
    return classificarErroCarga(erro, Blockly.serialization.exceptions);
  } finally {
    ws.dispose();
  }
}
