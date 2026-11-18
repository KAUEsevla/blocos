// Blocos de repetição enquanto e para (RF-05; spec 005, research R-03 a R-06;
// contracts/blocos-repeticao.md). Puro: não importa o Blockly.
// Tipos dos encaixes pela regra que a spec 006 deixou para a 005 (contracts/tipos-encaixe.md
// da 006, P-1): condição do enquanto só lógica; de, até e passo do para só números. O Core
// aceita "enquanto 1" e variável de controle não inteira (research R-02): as regras são do
// editor. O Core conta com range: passo zero e casas decimais quebram na execução, então o
// que é valor fixo vira aviso aqui (R-05) e o resto é traduzido pelo adapter (R-08).
import { campoVariavel } from './campo-variavel.js';
import { normalizarNumero } from './valores.js';
import { MARCADOR_AUSENTE } from '../portugol/avisos.js';

export const COR_REPETICAO = 120;

const AVISO_INTEIRA = 'A variável de controle do bloco para precisa ser do tipo inteiro';
const AVISO_ZERO = 'O passo do bloco para não pode ser zero: o laço nunca terminaria';
const AVISO_DECIMAIS = 'O bloco para só conta com números inteiros: tire as casas decimais';

// Número escrito direto no bloco: um número, ou o negativo de um número (research R-05).
// Devolve o número normalizado (com o sinal) ou null.
export function valorFixo(no) {
  if (no?.type === 'numero') return normalizarNumero(no.fields?.NUM);
  if (no?.type === 'negativo') {
    const dentro = no.inputs?.X?.block;
    if (dentro?.type !== 'numero') return null;
    const valor = normalizarNumero(dentro.fields?.NUM);
    return valor === null ? null : `-${valor}`;
  }
  return null;
}

const temDecimais = (valor) => valor !== null && valor.includes('.');
const ehZero = (valor) => valor !== null && Number(valor) === 0;

// enquanto <condição> faca … fim_enquanto (FR-001).
export const BLOCO_ENQUANTO = {
  tipo: 'enquanto',
  rotulo: 'enquanto',
  categoria: 'comando',
  areas: ['FACA'],
  definicao: {
    type: 'enquanto',
    message0: 'enquanto %1 faça',
    args0: [{ type: 'input_value', name: 'CONDICAO', check: ['Logico'] }],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'FACA' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    colour: COR_REPETICAO,
    tooltip: 'Repete os comandos de dentro enquanto a condição for verdadeira. Se ela nunca ficar falsa, use Parar.',
  },
  gerar(bloco, ctx) {
    ctx.linha(`enquanto ${ctx.valor(bloco, 'CONDICAO', 'a condição')} faca`);
    ctx.comandos(bloco, 'FACA');
    ctx.linha('fim_enquanto');
  },
};

const temPasso = (b) => Boolean(b?.inputs?.PASSO?.block);

// para v de a ate b [passo p] faca … fim_para (FR-002 a FR-007). Avisos na ordem do texto.
export const BLOCO_PARA = {
  tipo: 'para',
  rotulo: 'para',
  categoria: 'comando',
  areas: ['FACA'],
  variantes: [
    { nome: 'sem passo', presente: (b) => !temPasso(b) },
    { nome: 'com passo', presente: (b) => temPasso(b) },
  ],
  definicao: {
    type: 'para',
    message0: 'para %1 de %2 até %3 passo %4 faça',
    args0: [
      campoVariavel(['inteiro']),
      { type: 'input_value', name: 'DE', check: ['Numero'] },
      { type: 'input_value', name: 'ATE', check: ['Numero'] },
      { type: 'input_value', name: 'PASSO', check: ['Numero'] },
    ],
    message1: '%1',
    args1: [{ type: 'input_statement', name: 'FACA' }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    colour: COR_REPETICAO,
    tooltip:
      'Repete os comandos de dentro contando com a variável, de “de” até “até”, incluindo os dois. Sem passo, conta de 1 em 1; com passo negativo, conta para trás.',
  },
  gerar(bloco, ctx) {
    const v = ctx.variavel(bloco, 'VAR', 'a variável de controle');
    if (v !== MARCADOR_AUSENTE && ctx.tipoVariavel(bloco, 'VAR') !== 'inteiro') {
      ctx.aviso(bloco, 'VAR', AVISO_INTEIRA);
    }
    const limite = (encaixe, parte) => {
      const codigo = ctx.valor(bloco, encaixe, parte);
      if (temDecimais(valorFixo(bloco.inputs?.[encaixe]?.block))) ctx.aviso(bloco, encaixe, AVISO_DECIMAIS);
      return codigo;
    };
    const de = limite('DE', 'o valor inicial (de)');
    const ate = limite('ATE', 'o valor final (até)');
    let passo = '';
    if (temPasso(bloco)) {
      passo = ` passo ${ctx.valor(bloco, 'PASSO', 'o passo')}`;
      const fixo = valorFixo(bloco.inputs.PASSO.block);
      // Passo zero mostra só o aviso do zero, mesmo com casas decimais (data-model, "Avisos").
      if (ehZero(fixo)) ctx.aviso(bloco, 'PASSO', AVISO_ZERO);
      else if (temDecimais(fixo)) ctx.aviso(bloco, 'PASSO', AVISO_DECIMAIS);
    }
    ctx.linha(`para ${v} de ${de} ate ${ate}${passo} faca`);
    ctx.comandos(bloco, 'FACA');
    ctx.linha('fim_para');
  },
};
