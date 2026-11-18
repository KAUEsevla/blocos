// Ida e volta do Salvar no Blockly 12.5.1 headless (RF-11; spec 011, research R-02, R-09;
// data-model, "Blocos: o que cada spec deixa no nó"). Todos os tipos registrados entram no
// projeto: um tipo novo sem lugar aqui faz o teste falhar.
import { describe, it, expect } from 'vitest';
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { projetoVazio } from '../../src/projeto/formato.js';
import { carregarNoWorkspace, projetoDoWorkspace, salvarELer } from '../auxiliares/salvar-blockly.js';

const num = (id, valor) => ({ type: 'numero', id, fields: { NUM: valor } });
const vari = (id, idVariavel) => ({ type: 'variavel', id, fields: { VAR: { id: idVariavel } } });

// Fora da ordem dos tipos: b inteiro, nota real, a inteiro, nome cadeia, ok lógico (002 R-04).
const VARIAVEIS = [
  { id: 'v-b', nome: 'b', tipo: 'inteiro' },
  { id: 'v-nota', nome: 'nota', tipo: 'real' },
  { id: 'v-a', nome: 'a', tipo: 'inteiro' },
  { id: 'v-nome', nome: 'nome', tipo: 'cadeia' },
  { id: 'v-ok', nome: 'ok', tipo: 'logico' },
];

function encadear(...blocos) {
  for (let i = 0; i < blocos.length - 1; i += 1) blocos[i].next = { block: blocos[i + 1] };
  return blocos[0];
}

function projetoCompleto() {
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
              B: { block: { type: 'negativo', id: 'neg', inputs: { X: { block: num('n2', 2) } } } },
            },
          },
        },
      },
    },
    { type: 'leia', id: 'leia-nome', fields: { VAR: { id: 'v-nome' } } },
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
    // Sem senão e sem condição: bloco incompleto preservado.
    { type: 'se', id: 'se-sem-senao' },
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
        FACA: { block: { type: 'escreva', id: 'escreva-para', extraState: { valores: 1 }, inputs: { VALOR1: { block: vari('va', 'v-a') } } } },
      },
    },
  );
  return {
    ...projetoVazio(),
    nome: 'Média final',
    variaveis: VARIAVEIS,
    blocos: {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'programa', id: 'programa', x: 40, y: 30, deletable: false, inputs: { COMANDOS: { block: comandos } } },
          // Bloco solto, com posição própria.
          { type: 'escreva', id: 'solto', x: 400, y: 300, extraState: { valores: 1 } },
        ],
      },
    },
  };
}

function todosOsBlocos(blocos) {
  const lista = [];
  const visitar = (no) => {
    for (let atual = no; atual; atual = atual.next?.block) {
      lista.push(atual);
      for (const entrada of Object.values(atual.inputs ?? {})) visitar(entrada.block);
    }
  };
  for (const topo of blocos?.blocks?.blocks ?? []) visitar(topo);
  return lista;
}

const porId = (blocos, id) => todosOsBlocos(blocos).find((b) => b.id === id);

describe('Salvar: ida e volta no Blockly (FR-002, SC-001)', () => {
  const base = projetoCompleto();
  const ws = carregarNoWorkspace(base);
  const { projeto, salvo, lido } = salvarELer(ws, { ...projetoVazio(), nome: base.nome });
  const ws2 = carregarNoWorkspace(lido);
  const deNovo = projetoDoWorkspace(ws2, { ...projetoVazio(), nome: lido.nome });

  it('o projeto de teste tem todos os tipos registrados', () => {
    const tipos = new Set(todosOsBlocos(projeto.blocos).map((b) => b.type));
    const faltando = registroPadrao.tiposRegistrados().filter((t) => !tipos.has(t));
    expect(faltando, 'tipos sem lugar no teste de ida e volta').toEqual([]);
  });

  it('o arquivo identifica o formato e guarda nome e variáveis na ordem de criação por tipo', () => {
    expect(salvo.nomeArquivo).toBe('Média final.json');
    expect(lido.formato).toBe('meupia-blocos');
    expect(lido.versao).toBe(1);
    expect(lido.nome).toBe('Média final');
    expect(lido.variaveis).toEqual(projeto.variaveis);
    // Dentro do tipo, a ordem de criação: b antes de a.
    const inteiros = lido.variaveis.filter((v) => v.tipo === 'inteiro').map((v) => v.nome);
    expect(inteiros).toEqual(['b', 'a']);
    expect(lido.blocos).not.toHaveProperty('variables');
  });

  it('guarda o número de valores do escreva e o senão ligado ou desligado', () => {
    expect(porId(lido.blocos, 'escreva-3').extraState).toEqual({ valores: 3 });
    expect(porId(lido.blocos, 'se-com-senao').extraState).toEqual({ senao: true });
    expect(porId(lido.blocos, 'se-com-senao').inputs.SENAO.block.id).toBe('leia-ok');
    expect(porId(lido.blocos, 'se-sem-senao')).not.toHaveProperty('extraState');
  });

  it('guarda a posição dos blocos de topo, o bloco solto e o incompleto', () => {
    const [programa, solto] = lido.blocos.blocks.blocks;
    expect([programa.x, programa.y]).toEqual([40, 30]);
    expect(solto).toMatchObject({ id: 'solto', x: 400, y: 300 });
    expect(porId(lido.blocos, 'se-sem-senao').inputs?.CONDICAO).toBeUndefined();
    expect(porId(lido.blocos, 'recebe')).not.toHaveProperty('x');
  });

  it('carregado de volta, o workspace é o mesmo e o Portugol é idêntico', () => {
    expect(deNovo.variaveis).toEqual(projeto.variaveis);
    expect(deNovo.blocos).toEqual(projeto.blocos);
    const antes = gerarPortugol(projeto);
    expect(gerarPortugol(lido)).toEqual(antes);
    expect(gerarPortugol(deNovo)).toEqual(antes);
    expect(antes.avisos.map((a) => a.blocoId)).toContain('se-sem-senao');
  });

  it('salvar não muda o workspace (FR-005)', () => {
    const antes = Blockly.serialization.workspaces.save(ws);
    salvarELer(ws, { ...projetoVazio(), nome: base.nome });
    expect(Blockly.serialization.workspaces.save(ws)).toEqual(antes);
  });
});
