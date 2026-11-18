// Projetos em blocos com laços (spec 005, research R-10 e R-11): construtores de nós JSON no
// formato do editor e os projetos do Parar, da Saída longa e do leia em laço, que antes eram
// Portugol escrito à mão em executar.test.js (pendências da 009 e da 010).

let contador = 0;
const id = (t) => `${t}${++contador}`;

// Nós de valor.
export const numero = (n) => ({ type: 'numero', id: id('n'), fields: { NUM: String(n) } });
export const texto = (t) => ({ type: 'texto', id: id('t'), fields: { TEXTO: t } });
export const logico = (v) => ({ type: 'logico', id: id('l'), fields: { VALOR: v } });
export const variavel = (idVar) => ({ type: 'variavel', id: id('v'), fields: { VAR: { id: idVar } } });
export const negativo = (x) => ({ type: 'negativo', id: id('neg'), inputs: { X: { block: x } } });
export const conta = (op, a, b) => ({
  type: 'aritmetico',
  id: id('a'),
  fields: { OP: op },
  inputs: { A: { block: a }, B: { block: b } },
});
export const relacional = (op, a, b) => ({
  type: 'relacional',
  id: id('r'),
  fields: { OP: op },
  inputs: { A: { block: a }, B: { block: b } },
});

// Liga os comandos pelo next e devolve o primeiro (ou undefined).
export function cadeia(comandos) {
  if (comandos.length === 0) return undefined;
  const [primeiro, ...resto] = comandos;
  const proximo = cadeia(resto);
  return proximo ? { ...primeiro, next: { block: proximo } } : primeiro;
}

const area = (comandos) => (comandos.length ? { block: cadeia(comandos) } : undefined);
const semVazios = (inputs) => Object.fromEntries(Object.entries(inputs).filter(([, v]) => v));

// Nós de comando.
export function escreva(...valores) {
  const no = { type: 'escreva', id: id('e'), inputs: {} };
  if (valores.length > 1) no.extraState = { valores: valores.length };
  valores.forEach((v, i) => (no.inputs[`VALOR${i + 1}`] = { block: v }));
  return no;
}
export const leia = (idVar) => ({ type: 'leia', id: id('le'), fields: { VAR: { id: idVar } } });
export const recebe = (idVar, valor) => ({
  type: 'variavel_recebe',
  id: id('rc'),
  fields: { VAR: { id: idVar } },
  inputs: { VALOR: { block: valor } },
});
export const enquanto = (condicao, faca = []) => ({
  type: 'enquanto',
  id: id('enq'),
  inputs: semVazios({ CONDICAO: { block: condicao }, FACA: area(faca) }),
});
export const para = (idVar, de, ate, { passo, faca = [] } = {}) => ({
  type: 'para',
  id: id('p'),
  fields: { VAR: { id: idVar } },
  inputs: semVazios({ DE: { block: de }, ATE: { block: ate }, PASSO: passo ? { block: passo } : undefined, FACA: area(faca) }),
});
export function se(condicao, entao = [], senao) {
  const no = { type: 'se', id: id('se'), inputs: semVazios({ CONDICAO: { block: condicao }, ENTAO: area(entao) }) };
  if (senao !== undefined) {
    no.extraState = { senao: true };
    if (senao.length) no.inputs.SENAO = area(senao);
  }
  return no;
}

// Projeto no formato v1. variaveis: [[id, nome, tipo], ...].
export function projeto(nome, variaveis, comandos) {
  const raiz = { type: 'programa', id: 'programa', x: 24, y: 24, deletable: false };
  const primeiro = cadeia(comandos);
  if (primeiro) raiz.inputs = { COMANDOS: { block: primeiro } };
  return {
    formato: 'meupia-blocos',
    versao: 1,
    nome,
    variaveis: variaveis.map(([vid, vnome, tipo]) => ({ id: vid, nome: vnome, tipo })),
    blocos: { blocks: { languageVersion: 0, blocks: [raiz] } },
  };
}

// P-2 (009): mais de 1.000 linhas.
export const projetoMilEQuinhentas = () =>
  projeto('MuitasLinhas', [['v-i', 'i', 'inteiro']], [para('v-i', numero(1), numero(1500), { faca: [escreva(variavel('v-i'))] })]);

// P-2 (009): laço infinito para o Parar.
export const projetoInfinito = () =>
  projeto('Infinito', [['v-i', 'i', 'inteiro']], [
    recebe('v-i', numero(0)),
    enquanto(logico('verdadeiro'), [recebe('v-i', conta('+', variavel('v-i'), numero(1))), escreva(variavel('v-i'))]),
  ]);

// P-3 (010): leia num para, um pedido por volta.
export const projetoLeiaNoPara = () =>
  projeto('LeiaNoPara', [['v-nome', 'nome', 'cadeia'], ['v-i', 'i', 'inteiro']], [
    para('v-i', numero(1), numero(2), { faca: [leia('v-nome'), escreva(texto('Oi, '), variavel('v-nome'))] }),
  ]);

// P-3 (010): leia num laço infinito, para o Parar com o pedido aberto.
export const projetoLeiaInfinito = () =>
  projeto('LeiaInfinito', [['v-nome', 'nome', 'cadeia']], [
    enquanto(logico('verdadeiro'), [leia('v-nome'), escreva(variavel('v-nome'))]),
  ]);

// R-08: passo numa variável que vale 0 (o editor não vê antes de executar).
export const projetoPassoVariavelZero = () =>
  projeto('PassoZero', [['v-i', 'i', 'inteiro'], ['v-k', 'k', 'inteiro']], [
    recebe('v-k', numero(0)),
    para('v-i', numero(1), numero(3), { passo: variavel('v-k'), faca: [escreva(variavel('v-i'))] }),
  ]);

// SC-002 (analyze C1): passo fixo zero, bloqueado antes de executar.
export const projetoPassoFixoZero = () =>
  projeto('PassoFixoZero', [['v-i', 'i', 'inteiro']], [
    para('v-i', numero(1), numero(3), { passo: numero(0), faca: [escreva(variavel('v-i'))] }),
  ]);
