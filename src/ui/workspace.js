// Integração com o Blockly (interface; fora da cobertura).
import * as Blockly from 'blockly';
import * as ptBr from 'blockly/msg/pt-br';
import { registroPadrao } from '../blocos/registro.js';

let blocosDefinidos = false;

function definirBlocos() {
  if (blocosDefinidos) return;
  Blockly.setLocale(ptBr);
  const definicoes = registroPadrao.tiposRegistrados().map((tipo) => registroPadrao.obter(tipo).definicao);
  Blockly.defineBlocksWithJsonArray(definicoes);
  blocosDefinidos = true;
}

export function criarWorkspace(container, blocosIniciais) {
  definirBlocos();
  const ws = Blockly.inject(container, {
    trashcan: true,
    zoom: { controls: true, wheel: true },
    move: { scrollbars: true, drag: true, wheel: false },
  });
  Blockly.serialization.workspaces.load(blocosIniciais, ws);
  // O Blockly só mede o contêiner na injeção; o painel muda de tamanho com a janela e com o
  // empilhamento abaixo de 1024 px (spec 001, research R-03).
  new ResizeObserver(() => Blockly.svgResize(ws)).observe(container);
  return ws;
}

export function serializarBlocos(ws) {
  const salvo = Blockly.serialization.workspaces.save(ws);
  // A fonte das variáveis é projeto.variaveis (data-model, "Origem das variáveis").
  delete salvo.variables;
  return salvo;
}

export function aoMudar(ws, callback) {
  ws.addChangeListener((evento) => {
    if (!evento.isUiEvent) callback(evento);
  });
}
