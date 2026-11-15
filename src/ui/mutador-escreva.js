// Mutador do bloco escreva, "mutador_escreva" (RF-03; spec 003, FR-002; research R-04;
// contracts/editor-entrada-saida.md). Interface, fora da cobertura: a regra da quantidade
// (quantidadeValores, MAX_VALORES, nomeEncaixe) fica no núcleo, em src/blocos/entrada-saida.js.
//
// Em vez do mutator de arrastar do Blockly, dois ícones no próprio bloco: "+" acrescenta um
// encaixe no fim e "−" tira o último. O bloco que estava no encaixe tirado fica solto na área.
// Cada clique é um grupo de eventos (desencaixe + mudança de "mutation"): um Ctrl+Z volta tudo.
import * as Blockly from 'blockly';
import { MAX_VALORES, quantidadeValores, nomeEncaixe } from '../blocos/entrada-saida.js';
import { TEXTOS } from './textos.js';

const NOME_MUTADOR = 'mutador_escreva';
const ENCAIXE_ICONES = 'ICONES';
const TAMANHO_ICONE = 16;

const svg = (desenho) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">` +
      `<circle cx="8" cy="8" r="7" fill="#ffffff" fill-opacity="0.9"/>` +
      `<path d="${desenho}" stroke="#333333" stroke-width="2" stroke-linecap="round"/></svg>`,
  )}`;
const ICONE_MAIS = svg('M4 8h8M8 4v8');
const ICONE_MENOS = svg('M4 8h8');

const estado = (bloco) => JSON.stringify(bloco.saveExtraState());

const MIXIN = {
  saveExtraState() {
    return { valores: this.quantidadeValores_ ?? 1 };
  },

  loadExtraState(salvo) {
    this.atualizarForma_(quantidadeValores({ extraState: salvo }));
  },

  // Cria ou tira encaixes até ficar com n, e refaz os ícones conforme os limites.
  atualizarForma_(n) {
    const atual = this.quantidadeValores_ ?? 1;
    if (this.getInput(ENCAIXE_ICONES)) this.removeInput(ENCAIXE_ICONES);
    for (let k = atual + 1; k <= n; k++) this.appendValueInput(nomeEncaixe(k));
    for (let k = atual; k > n; k--) this.removeInput(nomeEncaixe(k));
    this.quantidadeValores_ = n;
    const icones = this.appendDummyInput(ENCAIXE_ICONES);
    if (n < MAX_VALORES) {
      icones.appendField(
        new Blockly.FieldImage(ICONE_MAIS, TAMANHO_ICONE, TAMANHO_ICONE, TEXTOS.acrescentarValor, () =>
          this.acrescentarValor(),
        ),
      );
    }
    if (n > 1) {
      icones.appendField(
        new Blockly.FieldImage(ICONE_MENOS, TAMANHO_ICONE, TAMANHO_ICONE, TEXTOS.tirarValor, () => this.tirarValor()),
      );
    }
  },

  // Muda a quantidade num grupo de eventos, com um BlockChange de "mutation" para o desfazer.
  mudarQuantidade_(n, antesDeMudar) {
    if (this.isInFlyout || this.isDeadOrDying()) return;
    const atual = this.quantidadeValores_ ?? 1;
    if (n === atual || n < 1 || n > MAX_VALORES) return;
    const grupoExterno = Blockly.Events.getGroup();
    if (!grupoExterno) Blockly.Events.setGroup(true);
    try {
      const antes = estado(this);
      antesDeMudar?.();
      this.atualizarForma_(n);
      const depois = estado(this);
      Blockly.Events.fire(new (Blockly.Events.get(Blockly.Events.BLOCK_CHANGE))(this, 'mutation', null, antes, depois));
      if (this.rendered) this.bumpNeighbours();
    } finally {
      if (!grupoExterno) Blockly.Events.setGroup(false);
    }
  },

  acrescentarValor() {
    this.mudarQuantidade_((this.quantidadeValores_ ?? 1) + 1);
  },

  // O bloco do último encaixe sai antes de o encaixe sumir (removeInput o apagaria) e fica
  // solto, um pouco deslocado do escreva.
  tirarValor() {
    const n = this.quantidadeValores_ ?? 1;
    this.mudarQuantidade_(n - 1, () => {
      const filho = this.getInputTargetBlock(nomeEncaixe(n));
      if (!filho) return;
      filho.unplug();
      if (filho.rendered) filho.moveBy(Blockly.config.snapRadius, Blockly.config.snapRadius);
    });
  },
};

// Bloco novo (sem extraState): um encaixe e os ícones.
function iniciar() {
  this.quantidadeValores_ = 1;
  this.atualizarForma_(1);
}

let registrado = false;

// Idempotente: o registro de extensões do Blockly lança erro com nome repetido.
export function registrarMutadorEscreva() {
  if (registrado || Blockly.Extensions.isRegistered(NOME_MUTADOR)) {
    registrado = true;
    return;
  }
  Blockly.Extensions.registerMutator(NOME_MUTADOR, MIXIN, iniciar);
  registrado = true;
}
