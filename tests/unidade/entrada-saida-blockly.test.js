// Comportamento do Blockly 12.5.1 em que os blocos da spec 003 se apoiam (research R-04, R-05,
// R-07; contracts/editor-entrada-saida.md). Blockly headless, como variaveis-blockly.test.js.
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import * as Blockly from 'blockly';
import { registroPadrao } from '../../src/blocos/registro.js';
import { registrarCampoVariavel } from '../../src/ui/campo-variavel.js';
import { registrarMutadorEscreva } from '../../src/ui/mutador-escreva.js';
import { registrarMutadorSe } from '../../src/ui/mutador-se.js';
import { registrarValidadorNumero } from '../../src/ui/validador-numero.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { projetoVazio } from '../../src/projeto/formato.js';

const salvar = (ws) => {
  const s = Blockly.serialization.workspaces.save(ws);
  delete s.variables;
  return s;
};

const txt = (t) => ({ block: { type: 'texto', fields: { TEXTO: t } } });

function escrevaCom(valores, extraState) {
  const inputs = {};
  valores.forEach((t, i) => (inputs[`VALOR${i + 1}`] = txt(t)));
  const b = { type: 'escreva', id: 'e1', x: 0, y: 0, inputs };
  if (extraState) b.extraState = extraState;
  return { blocks: { languageVersion: 0, blocks: [b] } };
}

const encaixes = (bloco) => bloco.inputList.filter((i) => /^VALOR\d+$/.test(i.name)).map((i) => i.name);

describe('escreva no Blockly (research R-04)', () => {
  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    registrarMutadorEscreva();
    registrarMutadorSe();
    registrarValidadorNumero();
    Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
  });

  it('extraState { valores: 3 } cria VALOR1..VALOR3 e volta igual ao salvar', () => {
    Blockly.serialization.workspaces.load(escrevaCom(['a', 'b', 'c'], { valores: 3 }), ws);
    const b = ws.getBlockById('e1');
    expect(encaixes(b)).toEqual(['VALOR1', 'VALOR2', 'VALOR3']);
    const salvo = salvar(ws).blocks.blocks[0];
    expect(salvo.extraState).toEqual({ valores: 3 });
    expect(Object.keys(salvo.inputs)).toEqual(['VALOR1', 'VALOR2', 'VALOR3']);
  });

  it('sem extraState o bloco tem um encaixe', () => {
    Blockly.serialization.workspaces.load(escrevaCom(['a']), ws);
    expect(encaixes(ws.getBlockById('e1'))).toEqual(['VALOR1']);
  });

  it('extraState acima de 10 carrega com 10 encaixes', () => {
    Blockly.serialization.workspaces.load(escrevaCom([], { valores: 50 }), ws);
    expect(encaixes(ws.getBlockById('e1'))).toHaveLength(10);
  });

  it('o Portugol depois da ida e volta é igual ao do JSON original', () => {
    const projeto = projetoVazio();
    projeto.blocos.blocks.blocks[0].inputs = {
      COMANDOS: {
        block: {
          type: 'escreva',
          extraState: { valores: 2 },
          inputs: { VALOR1: txt('Idade: '), VALOR2: { block: { type: 'numero', fields: { NUM: '15' } } } },
        },
      },
    };
    const antes = gerarPortugol(projeto).codigo;
    Blockly.serialization.workspaces.load(projeto.blocos, ws);
    expect(gerarPortugol({ ...projeto, blocos: salvar(ws) }).codigo).toBe(antes);
    expect(antes).toContain('    escreva("Idade: ", 15)');
  });

  it('acrescentar e tirar valor mudam os encaixes e o estado salvo', () => {
    Blockly.serialization.workspaces.load(escrevaCom(['a']), ws);
    const b = ws.getBlockById('e1');
    b.acrescentarValor();
    expect(encaixes(b)).toEqual(['VALOR1', 'VALOR2']);
    expect(b.saveExtraState()).toEqual({ valores: 2 });
    b.tirarValor();
    expect(encaixes(b)).toEqual(['VALOR1']);
  });

  it('tirar o encaixe com bloco deixa o bloco solto, e um desfazer volta tudo', async () => {
    Blockly.serialization.workspaces.load(escrevaCom(['a', 'b'], { valores: 2 }), ws);
    ws.clearUndo();
    const b = ws.getBlockById('e1');
    const filho = b.getInputTargetBlock('VALOR2');
    b.tirarValor();
    expect(encaixes(b)).toEqual(['VALOR1']);
    expect(filho.isDisposed()).toBe(false);
    expect(filho.getParent()).toBeNull();
    expect(ws.getTopBlocks(false)).toHaveLength(2);
    // O Blockly entrega os eventos à pilha do desfazer num setTimeout(0).
    await new Promise((r) => setTimeout(r, 0));
    ws.undo(false);
    expect(encaixes(b)).toEqual(['VALOR1', 'VALOR2']);
    expect(b.getInputTargetBlock('VALOR2')).toBe(filho);
    expect(ws.getTopBlocks(false)).toHaveLength(1);
  });

  it('nos limites, acrescentar com 10 e tirar com 1 não mudam nada', () => {
    Blockly.serialization.workspaces.load(escrevaCom([], { valores: 10 }), ws);
    const b = ws.getBlockById('e1');
    b.acrescentarValor();
    expect(encaixes(b)).toHaveLength(10);
    Blockly.serialization.workspaces.load(escrevaCom(['a']), ws);
    const c = ws.getBlockById('e1');
    c.tirarValor();
    expect(encaixes(c)).toEqual(['VALOR1']);
  });

  it('o validador do número recusa 12a e guarda 3,5 como 3.5 (research R-07)', () => {
    const n = ws.newBlock('numero');
    const campo = n.getField('NUM');
    expect(campo.getValue()).toBe('0');
    campo.setValue('12a');
    expect(campo.getValue()).toBe('0');
    campo.setValue('3,5');
    expect(campo.getValue()).toBe('3.5');
    campo.setValue('007');
    expect(campo.getValue()).toBe('7');
  });
});

// História 2 (P-3): o leia usa o campo de variável da 002 também no Blockly.
describe('leia no Blockly (research R-05)', async () => {
  const { blocosComVariaveis, contarBlocosApagados } = await import('../../src/projeto/variaveis.js');
  const NOME = { id: 'v-nome', nome: 'nome', tipo: 'cadeia' };
  const blocos = {
    blocks: {
      languageVersion: 0,
      blocks: [
        {
          type: 'programa',
          id: 'programa',
          x: 0,
          y: 0,
          inputs: {
            COMANDOS: {
              block: {
                type: 'leia',
                id: 'l1',
                fields: { VAR: { id: 'v-nome' } },
                next: { block: { type: 'escreva', id: 'e1', inputs: { VALOR1: txt('fim') } } },
              },
            },
          },
        },
        { type: 'variavel', id: 'solto', x: 300, y: 300, fields: { VAR: { id: 'v-nome' } } },
      ],
    },
  };
  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    registrarMutadorEscreva();
    registrarMutadorSe();
    registrarValidadorNumero();
    Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(blocosComVariaveis(blocos, [NOME]), ws);
  });

  const projeto = (variaveis) => ({ ...projetoVazio(), variaveis, blocos: salvar(ws) });

  it('mostra a variável e acompanha o renomear', () => {
    expect(ws.getBlockById('l1').getField('VAR').getText()).toBe('nome');
    const v = ws.getVariableMap().getVariableById('v-nome');
    ws.getVariableMap().renameVariable(v, 'apelido');
    expect(ws.getBlockById('l1').getField('VAR').getText()).toBe('apelido');
    expect(gerarPortugol(projeto([{ ...NOME, nome: 'apelido' }])).codigo).toContain('    leia(apelido)\n');
  });

  it('o leia conta como uso ao apagar a variável, igual ao que o Blockly remove', () => {
    const contagem = contarBlocosApagados(salvar(ws), 'v-nome');
    expect(contagem).toEqual({ usos: 2, total: 2 });
    const antes = ws.getAllBlocks(false).length;
    ws.getVariableMap().deleteVariable(ws.getVariableMap().getVariableById('v-nome'));
    expect(antes - ws.getAllBlocks(false).length).toBe(contagem.total);
  });

  it('o comando seguinte ao leia apagado sobe para o lugar dele', () => {
    ws.getVariableMap().deleteVariable(ws.getVariableMap().getVariableById('v-nome'));
    expect(ws.getBlockById('programa').getInputTargetBlock('COMANDOS').id).toBe('e1');
  });
});

// Passo E do quickstart da 003 (História 1, cenário 2; FR-002): criar idade, clicar "+" no
// escreva que vem da caixa e encaixar a variável no segundo valor. O mesmo Portugol roda no Core
// real no caso escreva-varios-valores.json (saída "Idade: 15").
describe('passo E do quickstart: variável no segundo valor do escreva', async () => {
  const { readFileSync } = await import('node:fs');
  const { join } = await import('node:path');
  const { conteudoCategoriaEntradaSaida } = await import('../../src/blocos/caixa-blocos.js');
  const { variaveisDoMapa } = await import('../../src/projeto/variaveis.js');
  let ws;

  beforeAll(() => {
    registrarCampoVariavel();
    registrarMutadorEscreva();
    registrarMutadorSe();
    registrarValidadorNumero();
    Blockly.defineBlocksWithJsonArray(registroPadrao.tiposRegistrados().map((t) => registroPadrao.obter(t).definicao));
  });

  beforeEach(() => {
    ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(projetoVazio().blocos, ws);
  });

  // Monta o passo E como o estudante faz: escreva da caixa no programa, "+", variável no VALOR2.
  function montarPassoE() {
    ws.getVariableMap().createVariable('idade', 'inteiro', 'v-idade');
    const [itemEscreva] = conteudoCategoriaEntradaSaida(variaveisDoMapa(ws.getVariableMap().getAllVariables()));
    const { kind: _kind, ...estado } = itemEscreva;
    const escreva = Blockly.serialization.blocks.append(estado, ws);
    ws.getBlockById('programa').getInput('COMANDOS').connection.connect(escreva.previousConnection);
    escreva.getInputTargetBlock('VALOR1').setFieldValue('Idade: ', 'TEXTO');
    escreva.acrescentarValor();
    const idade = ws.newBlock('variavel');
    idade.getField('VAR').setValue('v-idade');
    escreva.getInput('VALOR2').connection.connect(idade.outputConnection);
    return escreva;
  }

  const portugol = () =>
    gerarPortugol({
      ...projetoVazio(),
      variaveis: variaveisDoMapa(ws.getVariableMap().getAllVariables()),
      blocos: salvar(ws),
    });

  it('gera escreva("Idade: ", idade) sem avisos', () => {
    montarPassoE();
    const { codigo, avisos } = portugol();
    expect(avisos).toEqual([]);
    expect(codigo).toBe(
      'algoritmo "MeuPrograma"\n\nvar\n    idade: inteiro\n\ninicio\n    escreva("Idade: ", idade)\nfim_algoritmo\n',
    );
  });

  it('antes de encaixar a variável, o segundo valor é ??? com o aviso do valor 2', () => {
    ws.getVariableMap().createVariable('idade', 'inteiro', 'v-idade');
    const [itemEscreva] = conteudoCategoriaEntradaSaida([]);
    const { kind: _kind, ...estado } = itemEscreva;
    const escreva = Blockly.serialization.blocks.append(estado, ws);
    ws.getBlockById('programa').getInput('COMANDOS').connection.connect(escreva.previousConnection);
    escreva.acrescentarValor();
    const { codigo, avisos } = portugol();
    expect(codigo).toContain('    escreva("Olá, mundo!", ???)\n');
    expect(avisos.map((a) => a.mensagem)).toEqual(['Falta o valor 2 do bloco escreva']);
  });

  it('o escreva salvo tem a mesma forma do caso que roda no Core real', () => {
    montarPassoE();
    const salvo = salvar(ws).blocks.blocks[0].inputs.COMANDOS.block;
    expect(salvo.extraState).toEqual({ valores: 2 });
    expect(salvo.inputs.VALOR1.block).toMatchObject({ type: 'texto', fields: { TEXTO: 'Idade: ' } });
    expect(salvo.inputs.VALOR2.block).toMatchObject({ type: 'variavel', fields: { VAR: { id: 'v-idade' } } });

    const caso = JSON.parse(
      readFileSync(join(import.meta.dirname, '../aceitacao/casos/escreva-varios-valores.json'), 'utf8'),
    );
    expect(caso.portugolEsperado).toContain('    escreva("Idade: ", idade)\n');
    expect(caso.saidaEsperada.split('\n')[0]).toBe('Idade: 15');
  });
});
