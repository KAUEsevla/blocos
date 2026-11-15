// Integração com o Blockly (interface; fora da cobertura).
// Spec 002 (research R-04): as variáveis vivem no mapa de variáveis do workspace; o projeto
// entra com projeto.variaveis e sai por variaveisDoWorkspace().
import * as Blockly from 'blockly';
import * as ptBr from 'blockly/msg/pt-br';
import { registroPadrao } from '../blocos/registro.js';
import { variaveisDoMapa, blocosComVariaveis } from '../projeto/variaveis.js';
import {
  CAIXA_BLOCOS,
  CATEGORIA_VARIAVEIS,
  BOTAO_CRIAR_VARIAVEL,
  conteudoCategoriaVariaveis,
  CATEGORIA_ENTRADA_SAIDA,
  conteudoCategoriaEntradaSaida,
} from '../blocos/caixa-blocos.js';
import { registrarCampoVariavel } from './campo-variavel.js';
import { registrarMutadorEscreva } from './mutador-escreva.js';
import { registrarValidadorNumero } from './validador-numero.js';
import { registrarVerificadorEncaixe, NOME_VERIFICADOR } from './verificador-encaixe.js';
import { criarVariavel } from './acoes-variavel.js';

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
  // O campo próprio, o mutador do escreva e o validador do número precisam existir antes das
  // definições que os citam (spec 002; spec 003, contracts/editor-entrada-saida.md).
  registrarCampoVariavel();
  registrarMutadorEscreva();
  registrarValidadorNumero();
  // Tipos dos encaixes pelo tipo da variável (spec 006, research R-09).
  registrarVerificadorEncaixe();
  const definicoes = registroPadrao.tiposRegistrados().map((tipo) => registroPadrao.obter(tipo).definicao);
  Blockly.defineBlocksWithJsonArray(definicoes);
  blocosDefinidos = true;
}

export function criarWorkspace(container, projeto) {
  definirBlocos();
  const ws = Blockly.inject(container, {
    toolbox: CAIXA_BLOCOS,
    trashcan: true,
    zoom: { controls: true, wheel: true },
    move: { scrollbars: true, drag: true, wheel: false },
    plugins: { connectionChecker: NOME_VERIFICADOR },
  });
  // Categoria dinâmica "Variáveis" e botão "Criar variável…" (spec 002, research R-05).
  ws.registerToolboxCategoryCallback(CATEGORIA_VARIAVEIS, () => conteudoCategoriaVariaveis(variaveisDoWorkspace(ws)));
  ws.registerButtonCallback(BOTAO_CRIAR_VARIAVEL, () => criarVariavel(ws));
  // Categoria dinâmica Entrada e saída (spec 003, research R-09); o botão Criar variável… dela
  // usa o mesmo callback acima.
  ws.registerToolboxCategoryCallback(CATEGORIA_ENTRADA_SAIDA, () =>
    conteudoCategoriaEntradaSaida(variaveisDoWorkspace(ws)),
  );
  Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws);
  // O Blockly só mede o contêiner na injeção; o painel muda de tamanho com a janela e com o
  // empilhamento abaixo de 1024 px (spec 001, research R-03).
  new ResizeObserver(() => Blockly.svgResize(ws)).observe(container);
  return ws;
}

// Troca todos os blocos e variáveis do workspace (o load já limpa o que havia) e zera o
// desfazer, para que Ctrl+Z não volte ao projeto descartado (spec 001, FR-007). Recebe o
// projeto inteiro: as variáveis entram junto com os blocos (spec 002).
export function recarregarBlocos(ws, projeto) {
  Blockly.serialization.workspaces.load(blocosComVariaveis(projeto.blocos, projeto.variaveis), ws);
  ws.clearUndo();
}

// Lista de variáveis do projeto, na ordem do mapa do Blockly (spec 002, research R-04).
export function variaveisDoWorkspace(ws) {
  return variaveisDoMapa(ws.getVariableMap().getAllVariables());
}

export function serializarBlocos(ws) {
  const salvo = Blockly.serialization.workspaces.save(ws);
  // A fonte das variáveis é projeto.variaveis (data-model, "Origem das variáveis").
  delete salvo.variables;
  return salvo;
}

// Repassa TODOS os eventos, inclusive os de interface: quem decide quando gerar é o
// atualizador do núcleo (spec 007, research R-02; contracts/editor.md). "arrastando" vale
// só para o evento em que chega.
export function ouvirEventos(ws, notificar) {
  ws.addChangeListener((evento) => notificar(evento, { arrastando: ws.isDragging() }));
}

// Desfazer e refazer usam a pilha do próprio Blockly (spec 007, FR-006; research R-05).
export function desfazer(ws) {
  ws.undo(false);
}

export function refazer(ws) {
  ws.undo(true);
}

export function estadoDesfazer(ws) {
  return {
    podeDesfazer: ws.getUndoStack().length > 0,
    podeRefazer: ws.getRedoStack().length > 0,
  };
}
