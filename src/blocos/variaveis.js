// Blocos de variável (RF-02; spec 002, FR-005 e FR-006; contracts/blocos-variaveis.md).
// Não importam o Blockly: a definição é JSON, aplicada pela interface com
// defineBlocksWithJsonArray. O campo "campo_variavel" é registrado pela interface
// (src/ui/campo-variavel.js) antes das definições.
import { PRECEDENCIA } from '../portugol/precedencia.js';
import { COR_VARIAVEIS } from './caixa-blocos.js';
import { campoVariavel } from './campo-variavel.js';

// "variável recebe valor" → nome <- valor (FR-005).
export const BLOCO_VARIAVEL_RECEBE = {
  tipo: 'variavel_recebe',
  rotulo: 'recebe',
  categoria: 'comando',
  // O encaixe VALOR aceita o tipo da variável escolhida (spec 006; pendência P-2 da 002).
  tipoPelaVariavel: 'VALOR',
  definicao: {
    type: 'variavel_recebe',
    message0: '%1 recebe %2',
    args0: [campoVariavel(), { type: 'input_value', name: 'VALOR' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    colour: COR_VARIAVEIS,
    tooltip: 'Guarda o valor encaixado na variável',
  },
  // A variável é avaliada antes do valor: os avisos saem na ordem do texto.
  gerar(bloco, ctx) {
    const nome = ctx.variavel(bloco, 'VAR', 'a variável');
    const valor = ctx.valor(bloco, 'VALOR', 'o valor');
    ctx.linha(`${nome} <- ${valor}`);
  },
};

// O valor guardado na variável, encaixável onde se espera um valor (FR-006).
export const BLOCO_VARIAVEL = {
  tipo: 'variavel',
  rotulo: 'variável',
  categoria: 'valor',
  // A saída tem o tipo da variável escolhida (spec 006; pendência P-2 da 002).
  tipoPelaVariavel: 'saida',
  definicao: {
    type: 'variavel',
    message0: '%1',
    args0: [campoVariavel()],
    output: null,
    colour: COR_VARIAVEIS,
    tooltip: 'O valor guardado na variável',
  },
  gerar(bloco, ctx) {
    return { codigo: ctx.variavel(bloco, 'VAR', 'a variável'), precedencia: PRECEDENCIA.PRIMARIO };
  },
};
