// Verificador de encaixe "meupia" (RF-06; SC-002 da spec 006; research R-09;
// contracts/editor-operadores.md). Interface, fora da cobertura: as regras ficam no núcleo
// (src/blocos/tipos.js).
//
// O Blockly só sabe o "check" fixo da definição. O bloco de variável e o encaixe VALOR do
// "recebe" têm o tipo da variável escolhida, que muda com o tempo (mudar o tipo, trocar a
// variável). Por isso o tipo é lido na hora de cada verificação, e não guardado com setCheck.
import * as Blockly from 'blockly';
import { registroPadrao } from '../blocos/registro.js';
import { checkEfetivo, compativeis } from '../blocos/tipos.js';

export const NOME_VERIFICADOR = 'meupia';

const tipoDaVariavel = (bloco) => bloco.getField?.('VAR')?.getVariable?.()?.getType?.();

// Check efetivo de uma conexão de valor: a saída de um bloco ou um encaixe.
export function checkDaConexao(conexao) {
  const bloco = conexao.getSourceBlock();
  const ponto = conexao.type === Blockly.ConnectionType.OUTPUT_VALUE ? 'saida' : conexao.getParentInput()?.name;
  return checkEfetivo(registroPadrao.obter(bloco.type), ponto, tipoDaVariavel(bloco));
}

const ehValor = (c) =>
  c.type === Blockly.ConnectionType.OUTPUT_VALUE || c.type === Blockly.ConnectionType.INPUT_VALUE;

export class VerificadorEncaixe extends Blockly.ConnectionChecker {
  doTypeChecks(a, b) {
    if (!ehValor(a) || !ehValor(b)) return super.doTypeChecks(a, b);
    return compativeis(checkDaConexao(a), checkDaConexao(b));
  }
}

let registrado = false;

export function registrarVerificadorEncaixe() {
  if (registrado) return;
  Blockly.registry.register(Blockly.registry.Type.CONNECTION_CHECKER, NOME_VERIFICADOR, VerificadorEncaixe, true);
  registrado = true;
}
