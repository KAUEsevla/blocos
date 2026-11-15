// Extensão "validar_numero" do bloco numero (RF-06; spec 003, research R-07;
// contracts/editor-entrada-saida.md). Interface, fora da cobertura: só liga o validador do
// campo NUM à regra pura normalizarNumero (src/blocos/valores.js). null recusa a edição e o
// campo volta ao valor anterior; o valor aceito é guardado já normalizado (3,5 → 3.5).
import * as Blockly from 'blockly';
import { normalizarNumero } from '../blocos/valores.js';

const NOME_EXTENSAO = 'validar_numero';

function ligarValidador() {
  this.getField('NUM').setValidator((texto) => normalizarNumero(texto));
}

// Idempotente: o registro de extensões do Blockly lança erro com nome repetido.
export function registrarValidadorNumero() {
  if (Blockly.Extensions.isRegistered(NOME_EXTENSAO)) return;
  Blockly.Extensions.register(NOME_EXTENSAO, ligarValidador);
}
