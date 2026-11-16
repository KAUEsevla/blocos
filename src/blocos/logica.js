// Lógica: e, ou e não (RF-06; spec 006, research R-03, R-06; contracts/blocos-operadores.md).
// Só aceitam valores lógicos. `e`/`ou` são associativos à esquerda, como o aritmético: o lado
// direito pede um nível a mais. `nao` pede PRIMARIO do operando, então `nao (x > 10)` sai
// entre parênteses (História 3, cenário 1). No Portugol a palavra é `nao`, sem acento; o
// bloco mostra "não" (o Core aceita as duas formas, 008/R-02). Não importa o Blockly.
import { PRECEDENCIA } from '../portugol/precedencia.js';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const COR_LOGICA = 290;

export const OPERADORES_LOGICOS = Object.freeze({
  e: Object.freeze({ simbolo: 'e', precedencia: PRECEDENCIA.E }),
  ou: Object.freeze({ simbolo: 'ou', precedencia: PRECEDENCIA.OU }),
});

export const BLOCO_E_OU = {
  tipo: 'e_ou',
  rotulo: 'e/ou',
  categoria: 'valor',
  variantes: Object.keys(OPERADORES_LOGICOS).map((op) => ({ nome: op, presente: (b) => b.fields?.OP === op })),
  definicao: {
    type: 'e_ou',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A', check: ['Logico'] },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['e', 'e'],
          ['ou', 'ou'],
        ],
      },
      { type: 'input_value', name: 'B', check: ['Logico'] },
    ],
    inputsInline: true,
    output: ['Logico'],
    colour: COR_LOGICA,
    tooltip: '“e”: verdadeiro só se os dois lados forem verdadeiros. “ou”: verdadeiro se pelo menos um for',
  },
  gerar(bloco, ctx) {
    const campo = ctx.campo(bloco, 'OP');
    const op = Object.hasOwn(OPERADORES_LOGICOS, campo ?? '') ? OPERADORES_LOGICOS[campo] : undefined;
    if (!op) {
      ctx.aviso(bloco, 'OP', 'Escolha e ou ou no bloco e/ou');
      return { codigo: MARCADOR_AUSENTE, precedencia: PRECEDENCIA.PRIMARIO };
    }
    const a = ctx.valor(bloco, 'A', 'o primeiro valor', op.precedencia);
    const b = ctx.valor(bloco, 'B', 'o segundo valor', op.precedencia + 1);
    return { codigo: `${a} ${op.simbolo} ${b}`, precedencia: op.precedencia };
  },
};

export const BLOCO_NAO = {
  tipo: 'nao',
  rotulo: 'não',
  categoria: 'valor',
  definicao: {
    type: 'nao',
    message0: 'não %1',
    args0: [{ type: 'input_value', name: 'X', check: ['Logico'] }],
    inputsInline: true,
    output: ['Logico'],
    colour: COR_LOGICA,
    tooltip: 'Inverte o valor: verdadeiro vira falso e falso vira verdadeiro',
  },
  gerar(bloco, ctx) {
    return { codigo: `nao ${ctx.valor(bloco, 'X', 'o valor', PRECEDENCIA.PRIMARIO)}`, precedencia: PRECEDENCIA.NAO };
  },
};
