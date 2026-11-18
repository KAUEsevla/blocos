// Caixa de blocos (toolbox) do editor (RF-02; spec 002, research R-05;
// contracts/blocos-variaveis.md, "Caixa de blocos"). Definição pura, sem Blockly: a interface
// a passa ao Blockly.inject e registra o callback da categoria dinâmica.
// As specs 003–006 acrescentam as categorias delas em CAIXA_BLOCOS.contents (a 003 trouxe
// Entrada e saída, Valores e Contas; contracts/blocos-entrada-saida.md da 003). A 006 acrescenta
// o lógico, o negativo, Comparações e Lógica (research R-12 da 006). A 004 acrescenta Decisão,
// logo depois de Entrada e saída (research R-06 da 004). A 005 acrescenta Repetição, dinâmica,
// logo depois de Decisão (research R-09 da 005; contracts/editor-repeticao.md).
import { TIPOS_VARIAVEL } from '../projeto/formato.js';
import { COR_VALORES } from './valores.js';
import { COR_CONTAS } from './contas.js';
import { COR_COMPARACOES } from './comparacoes.js';
import { COR_LOGICA } from './logica.js';
import { COR_DECISAO } from './decisao.js';
import { COR_REPETICAO } from './repeticao.js';

export const CATEGORIA_VARIAVEIS = 'VARIAVEIS';
export const BOTAO_CRIAR_VARIAVEL = 'CRIAR_VARIAVEL';
export const CATEGORIA_ENTRADA_SAIDA = 'ENTRADA_SAIDA';
export const CATEGORIA_REPETICAO = 'REPETICAO';

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
    // Spec 004: o se e o se/senão (o senão também liga e desliga no próprio bloco).
    {
      kind: 'category',
      name: 'Decisão',
      colour: COR_DECISAO,
      contents: [
        { kind: 'block', type: 'se' },
        { kind: 'block', type: 'se', extraState: { senao: true } },
      ],
    },
    // Spec 005: dinâmica, porque o para usa a última variável inteira (research R-09).
    Object.freeze({ kind: 'category', name: 'Repetição', custom: CATEGORIA_REPETICAO, colour: COR_REPETICAO }),
    // Categorias estáticas não são congeladas: o Blockly acrescenta propriedades aos itens de
    // bloco ao montar a caixa (por exemplo "enabled").
    {
      kind: 'category',
      name: 'Valores',
      colour: COR_VALORES,
      contents: [
        { kind: 'block', type: 'numero' },
        { kind: 'block', type: 'texto' },
        { kind: 'block', type: 'logico', fields: { VALOR: 'verdadeiro' } },
      ],
    },
    {
      kind: 'category',
      name: 'Contas',
      colour: COR_CONTAS,
      contents: [
        { kind: 'block', type: 'aritmetico', fields: { OP: '+' } },
        { kind: 'block', type: 'negativo' },
      ],
    },
    {
      kind: 'category',
      name: 'Comparações',
      colour: COR_COMPARACOES,
      contents: [{ kind: 'block', type: 'relacional', fields: { OP: '=' } }],
    },
    {
      kind: 'category',
      name: 'Lógica',
      colour: COR_LOGICA,
      contents: [
        { kind: 'block', type: 'e_ou', fields: { OP: 'e' } },
        { kind: 'block', type: 'e_ou', fields: { OP: 'ou' } },
        { kind: 'block', type: 'nao' },
      ],
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

export const TEXTO_LEIA_SEM_VARIAVEL = 'Para usar o leia, crie uma variável primeiro.';

// Itens da categoria Entrada e saída (spec 003, research R-09). Sempre um escreva com o texto
// “Olá, mundo!” já encaixado (bloco normal, não shadow: o gerador só lê inputs.X.block).
// Com variáveis, um leia com a última da lista do mapa (mesma regra do "recebe" da 002); sem
// variáveis, a orientação e o mesmo botão "Criar variável…" da categoria Variáveis.
export function conteudoCategoriaEntradaSaida(variaveis) {
  const lista = Array.isArray(variaveis) ? variaveis : [];
  const itens = [
    {
      kind: 'block',
      type: 'escreva',
      inputs: { VALOR1: { block: { type: 'texto', fields: { TEXTO: 'Olá, mundo!' } } } },
    },
  ];
  if (lista.length === 0) {
    itens.push({ kind: 'label', text: TEXTO_LEIA_SEM_VARIAVEL });
    itens.push({ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL });
  } else {
    itens.push(blocoComVariavel('leia', lista[lista.length - 1].id));
  }
  return itens;
}

export const TEXTO_PARA_SEM_INTEIRO = 'Para usar o para, crie uma variável do tipo inteiro.';

const numeroFixo = (n) => ({ block: { type: 'numero', fields: { NUM: n } } });

// Itens da categoria Repetição (spec 005, research R-09). Sempre o enquanto; com alguma variável inteira, o para
// com a última inteira da lista do mapa (mesma regra do leia), de 1 até 5 e sem passo; sem
// nenhuma, a orientação e o botão "Criar variável…" no lugar dele.
export function conteudoCategoriaRepeticao(variaveis) {
  const lista = Array.isArray(variaveis) ? variaveis : [];
  const inteiras = lista.filter((v) => v.tipo === 'inteiro');
  const itens = [{ kind: 'block', type: 'enquanto' }];
  if (inteiras.length === 0) {
    itens.push({ kind: 'label', text: TEXTO_PARA_SEM_INTEIRO });
    itens.push({ kind: 'button', text: 'Criar variável…', callbackKey: BOTAO_CRIAR_VARIAVEL });
  } else {
    itens.push({
      kind: 'block',
      type: 'para',
      fields: { VAR: { id: inteiras[inteiras.length - 1].id } },
      inputs: { DE: numeroFixo('1'), ATE: numeroFixo('5') },
    });
  }
  return itens;
}
