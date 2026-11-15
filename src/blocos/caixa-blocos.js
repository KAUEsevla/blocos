// Caixa de blocos (toolbox) do editor (RF-02; spec 002, research R-05;
// contracts/blocos-variaveis.md, "Caixa de blocos"). Definição pura, sem Blockly: a interface
// a passa ao Blockly.inject e registra o callback da categoria dinâmica.
// As specs 003–006 acrescentam as categorias delas em CAIXA_BLOCOS.contents (a 003 trouxe
// Entrada e saída, Valores e Contas; contracts/blocos-entrada-saida.md da 003).
import { TIPOS_VARIAVEL } from '../projeto/formato.js';
import { COR_VALORES } from './valores.js';
import { COR_CONTAS } from './contas.js';

export const CATEGORIA_VARIAVEIS = 'VARIAVEIS';
export const BOTAO_CRIAR_VARIAVEL = 'CRIAR_VARIAVEL';
export const CATEGORIA_ENTRADA_SAIDA = 'ENTRADA_SAIDA';

// Mesma cor dos blocos de variável (src/blocos/variaveis.js).
export const COR_VARIAVEIS = 330;

// Mesma cor dos blocos escreva e leia (src/blocos/entrada-saida.js; spec 003).
export const COR_ENTRADA_SAIDA = 160;

export const CAIXA_BLOCOS = Object.freeze({
  kind: 'categoryToolbox',
  contents: Object.freeze([
    Object.freeze({ kind: 'category', name: 'Variáveis', custom: CATEGORIA_VARIAVEIS, colour: COR_VARIAVEIS }),
    // Spec 003, research R-09: Entrada e saída é dinâmica (o leia depende das variáveis);
    // Valores e Contas trazem os blocos antecipados da 006, que acrescenta os dela.
    Object.freeze({
      kind: 'category',
      name: 'Entrada e saída',
      custom: CATEGORIA_ENTRADA_SAIDA,
      colour: COR_ENTRADA_SAIDA,
    }),
    // Categorias estáticas não são congeladas: o Blockly acrescenta propriedades aos itens de
    // bloco ao montar a caixa (por exemplo "enabled").
    {
      kind: 'category',
      name: 'Valores',
      colour: COR_VALORES,
      contents: [
        { kind: 'block', type: 'numero' },
        { kind: 'block', type: 'texto' },
      ],
    },
    {
      kind: 'category',
      name: 'Contas',
      colour: COR_CONTAS,
      contents: [{ kind: 'block', type: 'aritmetico', fields: { OP: '+' } }],
    },
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

// Itens da categoria Entrada e saída (spec 003, research R-09). Sempre um escreva com o texto
// “Olá, mundo!” já encaixado (bloco normal, não shadow: o gerador só lê inputs.X.block).
export function conteudoCategoriaEntradaSaida(variaveis) {
  void variaveis;
  return [
    {
      kind: 'block',
      type: 'escreva',
      inputs: { VALOR1: { block: { type: 'texto', fields: { TEXTO: 'Olá, mundo!' } } } },
    },
  ];
}
