// Blocos escreva e leia (RF-03; spec 003, research R-04, R-05; contracts/blocos-entrada-saida.md).
// Não importam o Blockly: a quantidade de valores do escreva fica no extraState, lido aqui de
// forma pura; o mutador que cria os encaixes e os ícones "+"/"−" é da interface
// (src/ui/mutador-escreva.js, "mutador_escreva").
import { COR_ENTRADA_SAIDA } from './caixa-blocos.js';
import { campoVariavel } from './campo-variavel.js';

export const MAX_VALORES = 10;

// extraState.valores normalizado para 1..10 (data-model, "Comando escreva"): arquivo antigo ou
// editado à mão nunca quebra a geração.
export function quantidadeValores(bloco) {
  const valores = bloco?.extraState?.valores;
  if (!Number.isInteger(valores) || valores < 1) return 1;
  return Math.min(valores, MAX_VALORES);
}

export function nomeEncaixe(k) {
  return `VALOR${k}`;
}

// escreva(v1, ..., vn) na ordem dos encaixes (FR-001). Encaixe vazio vira ??? + aviso (008).
export const BLOCO_ESCREVA = {
  tipo: 'escreva',
  rotulo: 'escreva',
  categoria: 'comando',
  variantes: [
    { nome: 'um valor', presente: (b) => quantidadeValores(b) === 1 },
    { nome: 'vários valores', presente: (b) => quantidadeValores(b) > 1 },
  ],
  definicao: {
    type: 'escreva',
    message0: 'escreva %1',
    args0: [{ type: 'input_value', name: nomeEncaixe(1) }],
    previousStatement: null,
    nextStatement: null,
    inputsInline: true,
    mutator: 'mutador_escreva',
    colour: COR_ENTRADA_SAIDA,
    tooltip: 'Mostra os valores na tela, um ao lado do outro, e passa para a próxima linha',
  },
  gerar(bloco, ctx) {
    const n = quantidadeValores(bloco);
    const valores = [];
    for (let k = 1; k <= n; k++) {
      valores.push(ctx.valor(bloco, nomeEncaixe(k), n === 1 ? 'o valor' : `o valor ${k}`));
    }
    ctx.linha(`escreva(${valores.join(', ')})`);
  },
};

// leia(nome) com o mesmo campo de variável da 002 (FR-004; P-3, research R-05). Sem encaixe
// de valor: expressões e valores fixos não encaixam (FR-005), e o Core só aceita um nome.
export const BLOCO_LEIA = {
  tipo: 'leia',
  rotulo: 'leia',
  categoria: 'comando',
  definicao: {
    type: 'leia',
    message0: 'leia %1',
    args0: [campoVariavel()],
    previousStatement: null,
    nextStatement: null,
    colour: COR_ENTRADA_SAIDA,
    tooltip:
      'Pede um valor a quem usa o programa e guarda na variável. Numa variável lógica, só “verdadeiro” vira verdadeiro; o resto vira falso.',
  },
  gerar(bloco, ctx) {
    ctx.linha(`leia(${ctx.variavel(bloco, 'VAR', 'a variável')})`);
  },
};
