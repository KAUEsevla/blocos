// Valores fixos de número e de texto (RF-06, antecipados da spec 006 pela spec 003, research
// R-03, R-07, R-08; contracts/blocos-valores-contas.md) e o lógico da 006 (research R-07 da 006;
// contracts/blocos-operadores.md). Não importam o Blockly: o validador do
// campo de número é ligado pela interface (src/ui/validador-numero.js, extensão "validar_numero").
import { PRECEDENCIA } from '../portugol/precedencia.js';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const COR_VALORES = 200;

const FORMATO_NUMERO = /^(\d+)(?:[.,](\d+))?$/;

// Texto digitado → número no formato do Core, ou null se não for um número aceito.
// Vírgula vira ponto (FR-006 da 006). Zeros à esquerda saem: "007" passa no parser do Core
// 1.4.1, mas gera Python inválido (research R-07, adapter do lado do editor).
export function normalizarNumero(texto) {
  if (typeof texto !== 'string') return null;
  const m = texto.trim().match(FORMATO_NUMERO);
  if (!m) return null;
  const inteiro = m[1].replace(/^0+(?=\d)/, '');
  return m[2] === undefined ? inteiro : `${inteiro}.${m[2]}`;
}

// Texto → literal do Portugol. A barra é escapada antes das aspas: o Core interpreta
// sequências como \n dentro do texto (research R-08).
export function gerarTexto(conteudo) {
  const escapado = String(conteudo ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escapado}"`;
}

export const BLOCO_NUMERO = {
  tipo: 'numero',
  rotulo: 'número',
  categoria: 'valor',
  variantes: [
    { nome: 'inteiro', presente: (b) => !String(b.fields?.NUM ?? '').includes('.') },
    { nome: 'real', presente: (b) => String(b.fields?.NUM ?? '').includes('.') },
  ],
  definicao: {
    type: 'numero',
    message0: '%1',
    args0: [{ type: 'field_input', name: 'NUM', text: '0' }],
    output: ['Numero'],
    extensions: ['validar_numero'],
    colour: COR_VALORES,
    tooltip: 'Um número. Use vírgula ou ponto para as casas decimais, como 3,5',
  },
  // Normaliza sempre, mesmo que o campo já guarde o valor normalizado: um arquivo editado
  // à mão com "007" gera 7 e não quebra o Core.
  gerar(bloco, ctx) {
    const codigo = normalizarNumero(ctx.campo(bloco, 'NUM'));
    if (codigo === null) {
      ctx.aviso(bloco, 'NUM', 'O número do bloco número é inválido');
      return { codigo: MARCADOR_AUSENTE, precedencia: PRECEDENCIA.PRIMARIO };
    }
    return { codigo, precedencia: PRECEDENCIA.PRIMARIO };
  },
};

const temEspecial = (b) => /["\\]/.test(String(b.fields?.TEXTO ?? ''));

export const BLOCO_TEXTO = {
  tipo: 'texto',
  rotulo: 'texto',
  categoria: 'valor',
  variantes: [
    { nome: 'simples', presente: (b) => !temEspecial(b) },
    { nome: 'com aspas ou barra', presente: temEspecial },
  ],
  definicao: {
    type: 'texto',
    message0: '“%1”',
    args0: [{ type: 'field_input', name: 'TEXTO', text: '' }],
    output: ['Texto'],
    colour: COR_VALORES,
    tooltip: 'Um texto, mostrado exatamente como foi digitado',
  },
  gerar(bloco, ctx) {
    return { codigo: gerarTexto(ctx.campo(bloco, 'TEXTO')), precedencia: PRECEDENCIA.PRIMARIO };
  },
};

const VALORES_LOGICOS = Object.freeze(['verdadeiro', 'falso']);

// Valor fixo lógico (spec 006, research R-07). Só minúsculas: o Core 1.4.1 trata `VERDADEIRO`
// como nome de variável (lacuna do research R-13 da 006); o menu impede outra grafia.
export const BLOCO_LOGICO = {
  tipo: 'logico',
  rotulo: 'lógico',
  categoria: 'valor',
  variantes: VALORES_LOGICOS.map((valor) => ({ nome: valor, presente: (b) => b.fields?.VALOR === valor })),
  definicao: {
    type: 'logico',
    message0: '%1',
    args0: [
      {
        type: 'field_dropdown',
        name: 'VALOR',
        options: VALORES_LOGICOS.map((valor) => [valor, valor]),
      },
    ],
    output: ['Logico'],
    colour: COR_VALORES,
    tooltip: 'Um valor lógico: verdadeiro ou falso',
  },
  gerar(bloco, ctx) {
    const valor = ctx.campo(bloco, 'VALOR');
    if (!VALORES_LOGICOS.includes(valor)) {
      ctx.aviso(bloco, 'VALOR', 'Escolha verdadeiro ou falso no bloco lógico');
      return { codigo: MARCADOR_AUSENTE, precedencia: PRECEDENCIA.PRIMARIO };
    }
    return { codigo: valor, precedencia: PRECEDENCIA.PRIMARIO };
  },
};
