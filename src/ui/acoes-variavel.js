// Ações de variável no workspace (RF-02; spec 002, research R-04 e R-06;
// contracts/editor-variaveis.md). Interface, fora da cobertura: as regras vêm do núcleo
// (validarNomeVariavel). Não chamam o gerador: as mudanças no mapa de variáveis disparam
// eventos não-UI, que já chegam ao atualizador em tempo real da 007.
import * as Blockly from 'blockly';
import { validarNomeVariavel } from '../projeto/nome-variavel.js';
import { variaveisDoMapa, contarBlocosApagados, textoApagar } from '../projeto/variaveis.js';
import { pedirVariavel } from './dialogo-variavel.js';
import { confirmar } from './confirmacao.js';
import { registroPadrao } from '../blocos/registro.js';
import { encaixesIncompativeis } from '../blocos/tipos.js';

// Lido aqui, e não de workspace.js, para não criar import circular (workspace.js usa estas ações).
const listaDe = (ws) => variaveisDoMapa(ws.getVariableMap().getAllVariables());

// Botão "Criar variável…" da caixa de blocos (FR-001 a FR-003).
export async function criarVariavel(ws) {
  const lista = listaDe(ws);
  const resposta = await pedirVariavel({ modo: 'criar', validar: (nome) => validarNomeVariavel(nome, lista) });
  if (!resposta) return;
  ws.getVariableMap().createVariable(resposta.nome, resposta.tipo);
}

// Menu do campo de variável: "Renomear variável…" (FR-007). O Blockly troca o nome em
// todos os campos que usam a variável.
export async function renomearVariavel(ws, idVariavel) {
  const mapa = ws.getVariableMap();
  const variavel = mapa.getVariableById(idVariavel);
  if (!variavel) return;
  const lista = listaDe(ws);
  const resposta = await pedirVariavel({
    modo: 'renomear',
    nome: variavel.getName(),
    validar: (nome) => validarNomeVariavel(nome, lista, { ignorarId: idVariavel }),
  });
  if (!resposta || resposta.nome === variavel.getName()) return;
  mapa.renameVariable(variavel, resposta.nome);
}

// Menu do campo de variável: "Mudar o tipo…" (caso de borda da spec: permitido mesmo em uso).
export async function mudarTipoVariavel(ws, idVariavel) {
  const mapa = ws.getVariableMap();
  const variavel = mapa.getVariableById(idVariavel);
  if (!variavel) return;
  const resposta = await pedirVariavel({ modo: 'tipo', nome: variavel.getName(), tipo: variavel.getType() });
  if (!resposta || resposta.tipo === variavel.getType()) return;
  aplicarTipoVariavel(ws, idVariavel, resposta.tipo);
}

// Distância com que um bloco desencaixado é afastado, para ficar visível como solto.
const AFASTAR = 24;

// Muda o tipo soltando antes os blocos que ficariam em encaixe incompatível (spec 006,
// research R-10; contracts/editor-operadores.md). Tudo num grupo de eventos, e nessa ordem:
// soltar → mudar. Assim um Ctrl+Z volta primeiro o tipo e só depois reencaixa os blocos,
// quando o encaixe já é compatível de novo.
export function aplicarTipoVariavel(ws, idVariavel, novoTipo) {
  const mapa = ws.getVariableMap();
  const variavel = mapa.getVariableById(idVariavel);
  if (!variavel) return;
  const tipos = Object.fromEntries(mapa.getAllVariables().map((v) => [v.getId(), v.getType()]));
  tipos[idVariavel] = novoTipo;
  const estado = Blockly.serialization.workspaces.save(ws).blocks;
  const usa = (id) => ws.getBlockById(id)?.getField('VAR')?.getValue() === idVariavel;
  const pares = encaixesIncompativeis(estado, registroPadrao, tipos).filter((p) => usa(p.pai) || usa(p.filho));
  Blockly.Events.setGroup(true);
  try {
    for (const { filho } of pares) {
      const bloco = ws.getBlockById(filho);
      if (!bloco?.getParent()) continue;
      bloco.unplug();
      bloco.moveBy(AFASTAR, AFASTAR);
    }
    mapa.changeVariableType(variavel, novoTipo);
  } finally {
    Blockly.Events.setGroup(false);
  }
}

// Menu do campo de variável: "Apagar a variável" (FR-008). Em uso, pede confirmação com o
// total real de blocos removidos (research R-06). Não usa Blockly.Variables.deleteVariable
// nem window.confirm.
export async function apagarVariavel(ws, idVariavel) {
  const mapa = ws.getVariableMap();
  const variavel = mapa.getVariableById(idVariavel);
  if (!variavel) return;
  const contagem = contarBlocosApagados(Blockly.serialization.workspaces.save(ws), idVariavel);
  if (contagem.usos > 0) {
    const confirmado = await confirmar(textoApagar(variavel.getName(), contagem));
    if (!confirmado) return;
  }
  mapa.deleteVariable(variavel);
}
