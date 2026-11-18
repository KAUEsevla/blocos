// Definição JSON do campo de variável comum aos blocos variavel_recebe, variavel (spec 002)
// e leia (spec 003, research R-05; contracts/blocos-entrada-saida.md). Pura: só cita o
// tipo "campo_variavel", registrado pela interface (src/ui/campo-variavel.js).
// Spec 005 (research R-06; contracts/blocos-repeticao.md): os tipos aceitos são um parâmetro;
// o para passa só ['inteiro'] e o menu do campo mostra só as variáveis desses tipos.
import { TIPOS_VARIAVEL } from '../projeto/formato.js';

// Objeto novo a cada chamada: o Blockly guarda a definição de cada bloco.
export function campoVariavel(tipos = TIPOS_VARIAVEL) {
  return {
    type: 'campo_variavel',
    name: 'VAR',
    variable: null,
    variableTypes: [...tipos],
    defaultType: tipos[0],
  };
}
