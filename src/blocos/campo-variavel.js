// Definição JSON do campo de variável comum aos blocos variavel_recebe, variavel (spec 002)
// e leia (spec 003, research R-05; contracts/blocos-entrada-saida.md). Pura: só cita o
// tipo "campo_variavel", registrado pela interface (src/ui/campo-variavel.js).
import { TIPOS_VARIAVEL } from '../projeto/formato.js';

// Objeto novo a cada chamada: o Blockly guarda a definição de cada bloco.
export function campoVariavel() {
  return {
    type: 'campo_variavel',
    name: 'VAR',
    variable: null,
    variableTypes: [...TIPOS_VARIAVEL],
    defaultType: 'inteiro',
  };
}
