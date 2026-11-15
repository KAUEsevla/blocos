// Caixa de blocos (toolbox) do editor (RF-02; spec 002, research R-05;
// contracts/blocos-variaveis.md, "Caixa de blocos"). Definição pura, sem Blockly: a interface
// a passa ao Blockly.inject e registra o callback da categoria dinâmica.
// As specs 003–006 acrescentam as categorias delas em CAIXA_BLOCOS.contents.

export const CATEGORIA_VARIAVEIS = 'VARIAVEIS';
export const BOTAO_CRIAR_VARIAVEL = 'CRIAR_VARIAVEL';

// Mesma cor dos blocos de variável (src/blocos/variaveis.js).
export const COR_VARIAVEIS = 330;

export const CAIXA_BLOCOS = Object.freeze({
  kind: 'categoryToolbox',
  contents: Object.freeze([
    Object.freeze({ kind: 'category', name: 'Variáveis', custom: CATEGORIA_VARIAVEIS, colour: COR_VARIAVEIS }),
  ]),
});

// Itens da categoria Variáveis. O primeiro é sempre o botão; os blocos de cada variável
// entram nas Histórias 2 e 3 (T029 e T033).
export function conteudoCategoriaVariaveis() {
  return [{ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL }];
}
