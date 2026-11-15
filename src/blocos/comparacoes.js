// Comparação = <> < > <= >= (RF-06; spec 006, research R-05; contracts/blocos-operadores.md).
// Não associativa no Core 1.4.1 (`1 < 2 = verdadeiro` é erro sintático, research R-02): os dois
// lados pedem RELACIONAL + 1, então comparação dentro de comparação vai entre parênteses.
// Os encaixes aceitam qualquer tipo (o Core compara textos e lógicos); a saída é lógica.
// Não importa o Blockly.
import { PRECEDENCIA } from '../portugol/precedencia.js';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const COR_COMPARACOES = 260;

export const OPERADORES_RELACIONAIS = Object.freeze({
  '=': '=',
  '<>': '<>',
  '<': '<',
  '>': '>',
  '<=': '<=',
  '>=': '>=',
});

export const BLOCO_RELACIONAL = {
  tipo: 'relacional',
  rotulo: 'comparação',
  categoria: 'valor',
  variantes: Object.keys(OPERADORES_RELACIONAIS).map((op) => ({
    nome: op,
    presente: (b) => b.fields?.OP === op,
  })),
  definicao: {
    type: 'relacional',
    message0: '%1 %2 %3',
    args0: [
      { type: 'input_value', name: 'A' },
      {
        type: 'field_dropdown',
        name: 'OP',
        options: [
          ['=', '='],
          ['≠', '<>'],
          ['<', '<'],
          ['>', '>'],
          ['≤', '<='],
          ['≥', '>='],
        ],
      },
      { type: 'input_value', name: 'B' },
    ],
    inputsInline: true,
    output: ['Logico'],
    colour: COR_COMPARACOES,
    tooltip: 'Compara os dois valores. O resultado é verdadeiro ou falso',
  },
  gerar(bloco, ctx) {
    const campo = ctx.campo(bloco, 'OP');
    const op = Object.hasOwn(OPERADORES_RELACIONAIS, campo ?? '') ? OPERADORES_RELACIONAIS[campo] : undefined;
    if (!op) {
      ctx.aviso(bloco, 'OP', 'Escolha a comparação do bloco comparação');
      return { codigo: MARCADOR_AUSENTE, precedencia: PRECEDENCIA.PRIMARIO };
    }
    const minimo = PRECEDENCIA.RELACIONAL + 1;
    const a = ctx.valor(bloco, 'A', 'o primeiro valor', minimo);
    const b = ctx.valor(bloco, 'B', 'o segundo valor', minimo);
    return { codigo: `${a} ${op} ${b}`, precedencia: PRECEDENCIA.RELACIONAL };
  },
};
