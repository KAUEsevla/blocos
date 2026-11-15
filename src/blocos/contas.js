// Conta aritmética + - * / % (RF-06, antecipada da spec 006 pela spec 003, research R-03, R-06;
// contracts/blocos-valores-contas.md). Tipos dos encaixes pela spec 006 (research R-08): Numero ou
// Texto, porque o "+" concatena texto com número (regra do Core). Não importa o Blockly.
import { PRECEDENCIA } from '../portugol/precedencia.js';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const COR_CONTAS = 230;

export const OPERADORES_ARITMETICOS = Object.freeze({
  '+': Object.freeze({ simbolo: '+', precedencia: PRECEDENCIA.ADITIVO }),
  '-': Object.freeze({ simbolo: '-', precedencia: PRECEDENCIA.ADITIVO }),
  '*': Object.freeze({ simbolo: '*', precedencia: PRECEDENCIA.MULTIPLICATIVO }),
  '/': Object.freeze({ simbolo: '/', precedencia: PRECEDENCIA.MULTIPLICATIVO }),
  '%': Object.freeze({ simbolo: '%', precedencia: PRECEDENCIA.MULTIPLICATIVO }),
});

export const BLOCO_ARITMETICO = {
  tipo: 'aritmetico',
  rotulo: 'conta',
  categoria: 'valor',
  variantes: Object.keys(OPERADORES_ARITMETICOS).map((op) => ({
    nome: op,
    presente: (b) => b.fields?.OP === op,
  })),
  definicao: {
    type: 'aritmetico',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A', check: ['Numero', 'Texto'] },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['+', '+'],
          ['−', '-'],
          ['×', '*'],
          ['÷', '/'],
          ['resto', '%'],
        ],
      },
      { type: 'input_value', name: 'B', check: ['Numero', 'Texto'] },
    ],
    inputsInline: true,
    output: ['Numero', 'Texto'],
    colour: COR_CONTAS,
    tooltip: 'Faz a conta com os dois valores. “resto” é o que sobra da divisão',
  },
  // Associativa à esquerda no Core: o lado direito pede um nível a mais (research R-06).
  gerar(bloco, ctx) {
    const op = OPERADORES_ARITMETICOS[ctx.campo(bloco, 'OP')];
    if (!op) {
      ctx.aviso(bloco, 'OP', 'Escolha a conta do bloco conta');
      return { codigo: MARCADOR_AUSENTE, precedencia: PRECEDENCIA.PRIMARIO };
    }
    const a = ctx.valor(bloco, 'A', 'o primeiro valor', op.precedencia);
    const b = ctx.valor(bloco, 'B', 'o segundo valor', op.precedencia + 1);
    return { codigo: `${a} ${op.simbolo} ${b}`, precedencia: op.precedencia };
  },
};
