// Integração com o Blockly (interface; fora da cobertura).
import * as Blockly from 'blockly';
import * as ptBr from 'blockly/msg/pt-br';
import { registroPadrao } from '../blocos/registro.js';

let blocosDefinidos = false;

// Textos de interface que o pacote pt-br do Blockly 12 deixa em inglês (spec 001, research
// R-09, SC-003). Levantados comparando blockly/msg/pt-br com blockly/msg/en.
const TRADUCOES_FALTANTES = {
  CLOSE: 'Fechar',
  COPY_SHORTCUT: 'Copiar',
  CUT_SHORTCUT: 'Recortar',
  PASTE_SHORTCUT: 'Colar',
  EDIT_BLOCK_CONTENTS: 'Editar o conteúdo do bloco',
  MOVE_BLOCK: 'Mover bloco',
  HELP_PROMPT: 'Pressione %1 para ver a ajuda dos controles de teclado',
  KEYBOARD_NAV_CONSTRAINED_MOVE_HINT: 'Use as setas para mover e depois %1 para confirmar a posição',
  KEYBOARD_NAV_UNCONSTRAINED_MOVE_HINT:
    'Segure %1 e use as setas para mover livremente; depois %2 para confirmar a posição',
  KEYBOARD_NAV_COPIED_HINT: 'Copiado. Pressione %1 para colar.',
  KEYBOARD_NAV_CUT_HINT: 'Recortado. Pressione %1 para colar.',
  SHORTCUTS_CODE_NAVIGATION: 'Navegação no código',
  SHORTCUTS_EDITING: 'Edição',
  SHORTCUTS_GENERAL: 'Geral',
  UNKNOWN: 'Desconhecido',
};

function definirBlocos() {
  if (blocosDefinidos) return;
  Blockly.setLocale(ptBr);
  Object.assign(Blockly.Msg, TRADUCOES_FALTANTES);
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

// Troca todos os blocos do workspace (o load já limpa o que havia) e zera o desfazer,
// para que Ctrl+Z não volte ao projeto descartado (spec 001, FR-007).
export function recarregarBlocos(ws, blocos) {
  Blockly.serialization.workspaces.load(blocos, ws);
  ws.clearUndo();
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
