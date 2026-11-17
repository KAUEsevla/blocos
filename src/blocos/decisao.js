// Bloco se/senão (RF-04; spec 004, research R-03 a R-05; contracts/bloco-se.md).
// Não importa o Blockly: o senão ligado fica no extraState ({ senao: true }), lido aqui de
// forma pura; o mutador que cria a área SENAO e o ícone "+"/"−" é da interface
// (src/ui/mutador-se.js, "mutador_se").
// A condição só aceita valores lógicos (check Logico): a regra que a spec 006 deixou para a
// 004 (contracts/tipos-encaixe.md da 006, P-1). O Core aceita "se 1 entao" (research R-02),
// então a regra é só do editor.

export const COR_DECISAO = 210;

export function temSenao(bloco) {
  return bloco?.extraState?.senao === true;
}

export function mensagemTirarSenao(quantidade) {
  return quantidade === 1
    ? 'Tirar o senão apaga 1 bloco que está dentro dele.'
    : `Tirar o senão apaga ${quantidade} blocos que estão dentro dele.`;
}

// se <condição> entao … [senao …] fim_se, um nível de indentação a mais por área (FR-005).
export const BLOCO_SE = {
  tipo: 'se',
  rotulo: 'se',
  categoria: 'comando',
  areas: ['ENTAO', 'SENAO'],
  variantes: [
    { nome: 'sem senão', presente: (b) => !temSenao(b) },
    { nome: 'com senão', presente: (b) => temSenao(b) },
  ],
  definicao: {
    type: 'se',
    message0: 'se %1 então',
    args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'ENTAO' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    mutator: 'mutador_se',
    colour: COR_DECISAO,
    tooltip:
      'Faz os comandos de dentro só quando a condição for verdadeira. Com “senão”, faz os outros comandos quando ela for falsa.',
  },
  gerar(bloco, ctx) {
    ctx.linha(`se ${ctx.valor(bloco, 'CONDICAO', 'a condição')} entao`);
    ctx.comandos(bloco, 'ENTAO');
    if (temSenao(bloco)) {
      ctx.linha('senao');
      ctx.comandos(bloco, 'SENAO');
    }
    ctx.linha('fim_se');
  },
};
