// Onde o Blockly busca sprites, cursores e sons (RF-01, RNF-06): uma pasta do próprio app,
// servida pelo plugin scripts/midia-blockly.mjs no dev e copiada para dist/ no build. Caminho
// relativo à página, para funcionar em qualquer pasta onde o build for publicado. Sem Blockly:
// usado pelo workspace, pelo plugin do Vite e pelos testes.
export const PASTA_MIDIA_BLOCKLY = 'blockly-media/';
