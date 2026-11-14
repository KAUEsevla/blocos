// Bloco raiz "programa" (R-13): só a cadeia dentro de COMANDOS entra em inicio … fim_algoritmo.
// Não importa o Blockly: a definição é JSON, aplicada pela interface com defineBlocksWithJsonArray.

export const BLOCO_PROGRAMA = {
  tipo: 'programa',
  rotulo: 'programa',
  categoria: 'raiz',
  areas: ['COMANDOS'],
  definicao: {
    type: 'programa',
    message0: 'programa %1 %2',
    args0: [{ type: 'input_dummy' }, { type: 'input_statement', name: 'COMANDOS' }],
    colour: 45,
    tooltip: 'Os blocos encaixados aqui formam o seu programa',
  },
  // A raiz é tratada pelo próprio gerador.
  gerar() {},
};
