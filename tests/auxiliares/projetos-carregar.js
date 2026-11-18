// Projetos de teste do Carregar (spec 012, T003/T004/T011/T012): um projeto com todos os
// tipos registrados, no formato que o editor grava (NUM como texto), e um de 100 blocos.
import { projetoVazio } from '../../src/projeto/formato.js';

export const num = (id, valor) => ({ type: 'numero', id, fields: { NUM: String(valor) } });
export const vari = (id, idVariavel) => ({ type: 'variavel', id, fields: { VAR: { id: idVariavel } } });

export const VARIAVEIS = [
  { id: 'v-b', nome: 'b', tipo: 'inteiro' },
  { id: 'v-nota', nome: 'nota', tipo: 'real' },
  { id: 'v-a', nome: 'a', tipo: 'inteiro' },
  { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
  { id: 'v-ok', nome: 'ok', tipo: 'logico' },
];

export function encadear(...blocos) {
  for (let i = 0; i < blocos.length - 1; i += 1) blocos[i].next = { block: blocos[i + 1] };
  return blocos[0];
}

export function comPrograma(comandos, extras = [], base = {}) {
  const programa = { type: 'programa', id: 'programa', x: 40, y: 30, deletable: false };
  if (comandos) programa.inputs = { COMANDOS: { block: comandos } };
  return {
    ...projetoVazio(),
    variaveis: VARIAVEIS.map((v) => ({ ...v })),
    ...base,
    blocos: { blocks: { languageVersion: 0, blocks: [programa, ...extras] } },
  };
}

// Todos os tipos de registroPadrao, escreva com 10 valores, se com e sem senão (e com
// { senao: false }), encaixes vazios, VAR ausente e null, e um bloco solto.
export function projetoCompleto() {
  const valores10 = {};
  for (let k = 1; k <= 10; k += 1) valores10[`VALOR${k}`] = { block: num(`e10-${k}`, k) };
  const comandos = encadear(
    {
      type: 'variavel_recebe',
      id: 'recebe',
      fields: { VAR: { id: 'v-b' } },
      inputs: {
        VALOR: {
          block: {
            type: 'aritmetico',
            id: 'soma',
            fields: { OP: '+' },
            inputs: {
              A: { block: num('n1', 1) },
              B: { block: { type: 'negativo', id: 'neg', inputs: { X: { block: num('n2', '2.5') } } } },
            },
          },
        },
      },
    },
    // recebe sem valor e sem variável escolhida: incompleto.
    { type: 'variavel_recebe', id: 'recebe-vazio' },
    { type: 'leia', id: 'leia-nome', fields: { VAR: { id: 'v-nome' } } },
    { type: 'leia', id: 'leia-null', fields: { VAR: null } },
    { type: 'escreva', id: 'escreva-10', extraState: { valores: 10 }, inputs: valores10 },
    {
      type: 'escreva',
      id: 'escreva-3',
      extraState: { valores: 3 },
      inputs: {
        VALOR1: { block: { type: 'texto', id: 't1', fields: { TEXTO: 'Média: ' } } },
        VALOR2: { block: vari('vb', 'v-b') },
        VALOR3: { block: vari('vnota', 'v-nota') },
      },
    },
    {
      type: 'se',
      id: 'se-com-senao',
      extraState: { senao: true },
      inputs: {
        CONDICAO: {
          block: {
            type: 'e_ou',
            id: 'eou',
            fields: { OP: 'e' },
            inputs: {
              A: {
                block: {
                  type: 'relacional',
                  id: 'rel',
                  fields: { OP: '>' },
                  inputs: { A: { block: vari('vb2', 'v-b') }, B: { block: num('n3', 0) } },
                },
              },
              B: {
                block: {
                  type: 'nao',
                  id: 'nao',
                  inputs: { X: { block: { type: 'logico', id: 'log', fields: { VALOR: 'verdadeiro' } } } },
                },
              },
            },
          },
        },
        ENTAO: { block: { type: 'escreva', id: 'escreva-entao', extraState: { valores: 1 }, inputs: { VALOR1: { block: num('n4', 1) } } } },
        SENAO: { block: { type: 'leia', id: 'leia-ok', fields: { VAR: { id: 'v-ok' } } } },
      },
    },
    { type: 'se', id: 'se-sem-senao' },
    { type: 'se', id: 'se-senao-falso', extraState: { senao: false }, inputs: { CONDICAO: { block: vari('vok0', 'v-ok') } } },
    {
      type: 'enquanto',
      id: 'enquanto',
      inputs: {
        CONDICAO: { block: vari('vok', 'v-ok') },
        FACA: { block: { type: 'leia', id: 'leia-ok2', fields: { VAR: { id: 'v-ok' } } } },
      },
    },
    {
      type: 'para',
      id: 'para',
      fields: { VAR: { id: 'v-a' } },
      inputs: {
        DE: { block: num('n5', 1) },
        ATE: { block: num('n6', 3) },
        PASSO: { block: num('n7', 1) },
        FACA: {
          block: { type: 'escreva', id: 'escreva-para', extraState: { valores: 1 }, inputs: { VALOR1: { block: vari('va', 'v-a') } } },
        },
      },
    },
  );
  return comPrograma(comandos, [{ type: 'escreva', id: 'solto', x: 400, y: 300, extraState: { valores: 1 } }], {
    nome: '  Média "final"  ',
  });
}

// 100 blocos: 50 escreva encadeados, cada um com um número encaixado.
export function projetoCemBlocos() {
  const blocos = [];
  for (let i = 0; i < 50; i += 1) {
    blocos.push({ type: 'escreva', id: `e${i}`, extraState: { valores: 1 }, inputs: { VALOR1: { block: num(`n${i}`, i) } } });
  }
  return comPrograma(encadear(...blocos));
}

export function todosOsBlocos(blocos) {
  const lista = [];
  const visitar = (no) => {
    for (let atual = no; atual; atual = atual.next?.block) {
      lista.push(atual);
      for (const entrada of Object.values(atual.inputs ?? {})) visitar(entrada?.block);
    }
  };
  for (const topo of blocos?.blocks?.blocks ?? []) visitar(topo);
  return lista;
}
