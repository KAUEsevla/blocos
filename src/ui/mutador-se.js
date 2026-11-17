// Mutador do bloco se, "mutador_se" (RF-04; spec 004, FR-002; research R-04;
// contracts/editor-se.md). Interface, fora da cobertura: a regra (temSenao, a mensagem da
// confirmação) fica no núcleo, em src/blocos/decisao.js.
//
// Em vez do mutator de arrastar do Blockly, um ícone no próprio bloco, no fim da linha da
// condição: "+" liga o senão (cria a área SENAO) e "−" o desliga. Cada clique é um grupo de
// eventos com um BlockChange de "mutation": um Ctrl+Z volta tudo, como no escreva da 003.
import * as Blockly from 'blockly';
import { mensagemTirarSenao } from '../blocos/decisao.js';
import { TEXTOS } from './textos.js';
import { ICONE_MAIS, ICONE_MENOS, TAMANHO_ICONE } from './mutador-escreva.js';

const NOME_MUTADOR = 'mutador_se';
const ENCAIXE_ICONE = 'ICONE';
const ENCAIXE_SENAO = 'SENAO';
const ENCAIXE_ENTAO = 'ENTAO';

// Pergunta antes de apagar os blocos do senão (História 2, cenário 2). Vem de fora:
// o diálogo da 001 no navegador, uma função falsa no teste headless.
let confirmarTirarSenao = null;

const estado = (bloco) => JSON.stringify(bloco.saveExtraState());

const MIXIN = {
  saveExtraState() {
    return this.temSenao_ ? { senao: true } : null;
  },

  loadExtraState(salvo) {
    this.atualizarForma_(salvo?.senao === true);
  },

  // Cria ou tira a área SENAO e refaz o ícone "+"/"−" logo depois de "então".
  atualizarForma_(comSenao) {
    if (this.getInput(ENCAIXE_ICONE)) this.removeInput(ENCAIXE_ICONE);
    if (comSenao && !this.getInput(ENCAIXE_SENAO)) {
      this.appendStatementInput(ENCAIXE_SENAO).appendField('senão');
    }
    if (!comSenao && this.getInput(ENCAIXE_SENAO)) this.removeInput(ENCAIXE_SENAO);
    this.temSenao_ = comSenao;
    const icone = new Blockly.FieldImage(
      comSenao ? ICONE_MENOS : ICONE_MAIS,
      TAMANHO_ICONE,
      TAMANHO_ICONE,
      comSenao ? TEXTOS.tirarSenao : TEXTOS.acrescentarSenao,
      () => (comSenao ? this.tirarSenao() : this.ligarSenao()),
    );
    this.appendDummyInput(ENCAIXE_ICONE).appendField(icone);
    this.moveInputBefore(ENCAIXE_ICONE, ENCAIXE_ENTAO);
  },

  // Muda o senão num grupo de eventos, com um BlockChange de "mutation" para o desfazer.
  // antesDeMudar roda dentro do mesmo grupo (ex.: apagar os blocos do senão).
  mudarSenao_(comSenao, antesDeMudar) {
    if (this.isInFlyout || this.isDeadOrDying()) return;
    if (comSenao === Boolean(this.temSenao_)) return;
    const grupoExterno = Blockly.Events.getGroup();
    if (!grupoExterno) Blockly.Events.setGroup(true);
    try {
      const antes = estado(this);
      antesDeMudar?.();
      this.atualizarForma_(comSenao);
      const depois = estado(this);
      Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(this, 'mutation', null, antes, depois));
      if (this.rendered) this.bumpNeighbours();
    } finally {
      if (!grupoExterno) Blockly.Events.setGroup(false);
    }
  },

  // Primeiro bloco de cada comando da área SENAO (a cadeia inteira).
  comandosDoSenao_() {
    const comandos = [];
    for (let b = this.getInputTargetBlock(ENCAIXE_SENAO); b; b = b.getNextBlock()) comandos.push(b);
    return comandos;
  },

  ligarSenao() {
    this.mudarSenao_(true);
  },

  // Com blocos no senão, pergunta antes (História 2, cenário 2). A quantidade conta todos os
  // blocos que o Blockly apagaria: os descendentes do primeiro comando já incluem os comandos
  // seguintes da cadeia (no Blockly, o próximo bloco é filho do anterior).
  async tirarSenao() {
    if (this.isInFlyout || !this.temSenao_) return;
    const comandos = this.comandosDoSenao_();
    if (comandos.length === 0) {
      this.mudarSenao_(false);
      return;
    }
    if (!confirmarTirarSenao) return;
    const quantidade = comandos[0].getDescendants(false).length;
    const confirmou = await confirmarTirarSenao({ quantidade, mensagem: mensagemTirarSenao(quantidade) });
    // O bloco pode ter sido apagado (ou o senão tirado) enquanto o diálogo estava aberto.
    if (!confirmou || this.isDeadOrDying() || !this.temSenao_) return;
    // Apaga os comandos e tira a área no mesmo grupo: um Ctrl+Z volta tudo.
    this.mudarSenao_(false, () => {
      for (const b of this.comandosDoSenao_().reverse()) b.dispose(false);
    });
  },
};

// Bloco novo (sem extraState): sem senão, com o ícone "+".
function iniciar() {
  this.temSenao_ = false;
  this.atualizarForma_(false);
}

let registrado = false;

// Idempotente: o registro de extensões do Blockly lança erro com nome repetido. A função de
// confirmação pode ser trocada numa chamada seguinte.
export function registrarMutadorSe(opcoes = {}) {
  if ('confirmarTirarSenao' in opcoes) confirmarTirarSenao = opcoes.confirmarTirarSenao ?? null;
  if (registrado || Blockly.Extensions.isRegistered(NOME_MUTADOR)) {
    registrado = true;
    return;
  }
  Blockly.Extensions.registerMutator(NOME_MUTADOR, MIXIN, iniciar);
  registrado = true;
}
