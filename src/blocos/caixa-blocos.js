// Caixa de blocos (toolbox) do editor (RF-02; spec 002, research R-05;
// contracts/blocos-variaveis.md, "Caixa de blocos"). Definição pura, sem Blockly: a interface
// a passa ao Blockly.inject e registra o callback da categoria dinâmica.
// As specs 003–006 acrescentam as categorias delas em CAIXA_BLOCOS.contents.
import { TIPOS_VARIAVEL } from '../projeto/formato.js';

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

const blocoComVariavel = (tipo, id) => ({ kind: 'block', type: tipo, fields: { VAR: { id } } });

// Itens da categoria Variáveis. O primeiro é sempre o botão; com variáveis, vem um
// "recebe" com a última da lista do mapa (História 2) e um bloco de valor por variável,
// na ordem da seção var (História 3; mesma regra de gerarSecaoVar).
export function conteudoCategoriaVariaveis(variaveis) {
  const lista = Array.isArray(variaveis) ? variaveis : [];
  const itens = [{ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL }];
  if (lista.length === 0) return itens;
  itens.push(blocoComVariavel('variavel_recebe', lista[lista.length - 1].id));
  for (const tipo of TIPOS_VARIAVEL) {
    for (const variavel of lista.filter((v) => v.tipo === tipo)) {
      itens.push(blocoComVariavel('variavel', variavel.id));
    }
  }
  return itens;
}
