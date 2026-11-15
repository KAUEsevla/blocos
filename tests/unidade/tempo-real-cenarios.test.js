import { describe, it, expect, beforeEach } from 'vitest';
import { criarAtualizacaoTempoReal } from '../../src/portugol/tempo-real.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { blocosForaDoPrograma } from '../../src/portugol/fora-do-programa.js';
import { verificarExecucao } from '../../src/portugol/execucao.js';
import { criarRegistroTeste, bloco, encadear, projetoDeTeste } from '../auxiliares/blocos-teste.js';

// Cenários da spec 007 (RF-07; SC-001) no núcleo: o atualizador ligado ao gerador, com o
// registro de teste. O "editor" é a variável estado; atualizar() faz o que a tela faz.

// teste_numero e teste_escreva vêm do registro de teste compartilhado (spec 002, T002).
const registro = criarRegistroTeste();

const numero = (n, id) => bloco('teste_numero', { campos: { NUM: n }, id });
const escreva = (n, id) => bloco('teste_escreva', { entradas: { VALOR: numero(n) }, id });

const naoUi = (type = 'move') => ({ type, isUiEvent: false });
const dragInicio = { type: 'drag', isUiEvent: true, isStart: true };
const dragFim = { type: 'drag', isUiEvent: true, isStart: false };

let estado;
let exibido;
let geracoes;
let fila;
let tempoReal;

function rodar() {
  for (const fn of fila.splice(0)) fn();
}

beforeEach(() => {
  estado = projetoDeTeste();
  exibido = '';
  geracoes = 0;
  fila = [];
  tempoReal = criarAtualizacaoTempoReal({
    atualizar: () => {
      geracoes += 1;
      exibido = gerarPortugol(estado, registro).codigo;
    },
    agendar: (fn) => fila.push(fn),
  });
  tempoReal.atualizarAgora();
});

describe('História 1 — ver o código mudar a cada bloco (RF-07)', () => {
  it('cenário 1: encaixar um escreva faz a linha aparecer sem outra ação', () => {
    expect(exibido).not.toMatch(/escreva/);
    estado = projetoDeTeste({ comandos: [escreva(5)] });
    tempoReal.notificar(naoUi('move'));
    rodar();
    expect(exibido).toMatch(/^ {4}escreva\(5\)$/m);
  });

  it('cenário 2: mudar o número de 5 para 8 aparece enquanto se digita', () => {
    estado = projetoDeTeste({ comandos: [escreva(5)] });
    tempoReal.notificar(naoUi('create'));
    rodar();
    estado = projetoDeTeste({ comandos: [escreva(8)] });
    tempoReal.notificar(naoUi('block_field_intermediate_change'));
    rodar();
    expect(exibido).toMatch(/escreva\(8\)/);
    expect(exibido).not.toMatch(/escreva\(5\)/);
  });

  it('cenário 3: trocar o nome muda a primeira linha', () => {
    estado = { ...estado, nome: 'Media' };
    tempoReal.solicitar();
    rodar();
    expect(exibido.split('\n')[0]).toBe('algoritmo "Media"');
  });

  it('cenário 4: desfazer volta o Portugol ao que era antes da última ação nos blocos', () => {
    const antes = projetoDeTeste({ comandos: [escreva(5)] });
    estado = antes;
    tempoReal.notificar(naoUi('create'));
    rodar();
    const textoAntes = exibido;

    estado = projetoDeTeste({ comandos: [escreva(5), escreva(7)] });
    tempoReal.notificar(naoUi('create'));
    rodar();
    expect(exibido).not.toBe(textoAntes);

    // O desfazer do Blockly devolve o workspace ao estado anterior e dispara eventos.
    estado = JSON.parse(JSON.stringify(antes));
    tempoReal.notificar(naoUi('delete'));
    rodar();
    expect(exibido).toBe(textoAntes);
  });

  it('caso de borda: durante o arraste o Portugol só muda quando o bloco é solto', () => {
    estado = projetoDeTeste({ comandos: [escreva(5)] });
    tempoReal.notificar(naoUi('create'));
    rodar();

    tempoReal.notificar(dragInicio);
    // Ao pegar o bloco, o Blockly o desencaixa e dispara um move.
    estado = projetoDeTeste({ soltos: [escreva(5)] });
    tempoReal.notificar(naoUi('move'), { arrastando: true });
    rodar();
    expect(exibido).toMatch(/escreva\(5\)/);

    tempoReal.notificar(dragFim);
    rodar();
    expect(exibido).not.toMatch(/escreva/);
  });

  it('100 blocos: uma notificação gera uma vez só, com as 100 linhas', () => {
    const comandos = Array.from({ length: 100 }, (_, i) => escreva(i));
    estado = projetoDeTeste({ comandos });
    const antes = geracoes;
    tempoReal.notificar(naoUi('create'));
    tempoReal.notificar(naoUi('move'));
    rodar();
    expect(geracoes - antes).toBe(1);
    expect(exibido.match(/escreva/g)).toHaveLength(100);
  });
});

// Blocos alcançáveis a partir do primeiro programa (via inputs e next).
function alcancaveis(projeto) {
  const ids = new Set();
  const visitar = (b) => {
    for (let atual = b; atual; atual = atual.next?.block) {
      ids.add(atual.id);
      for (const entrada of Object.values(atual.inputs ?? {})) visitar(entrada.block);
    }
  };
  const raiz = projeto.blocos.blocks.blocks.find((b) => b.type === 'programa');
  visitar(raiz?.inputs?.COMANDOS?.block);
  return ids;
}

const idsDoTopo = (projeto) => new Set(projeto.blocos.blocks.blocks.map((b) => b.id));

describe('História 2 — blocos soltos não entram no programa (RF-07)', () => {
  const projetosVistos = [];
  const olhar = (projeto) => {
    projetosVistos.push(projeto);
    return { resultado: gerarPortugol(projeto, registro), marcas: blocosForaDoPrograma(projeto.blocos) };
  };

  it('cenário 1: escreva solto não aparece no código e é marcado', () => {
    const { resultado, marcas } = olhar(projetoDeTeste({ soltos: [escreva(5, 'solto')] }));
    expect(resultado.codigo).not.toMatch(/escreva/);
    expect(marcas).toEqual([{ blocoId: 'solto', mensagem: 'Esta pilha está fora do programa' }]);
  });

  it('cenário 2: encaixar o bloco tira a marca e faz a linha aparecer', () => {
    const { resultado, marcas } = olhar(projetoDeTeste({ comandos: [escreva(5, 'solto')] }));
    expect(resultado.codigo).toMatch(/escreva\(5\)/);
    expect(marcas).toEqual([]);
  });

  it('cenário 3: pilha solta de 3 blocos tem uma marca só, no topo, e nenhum no código', () => {
    const pilha = encadear([escreva(1, 'p1'), escreva(2, 'p2'), escreva(3, 'p3')]);
    const { resultado, marcas } = olhar(projetoDeTeste({ soltos: [pilha] }));
    expect(resultado.codigo).not.toMatch(/escreva/);
    expect(marcas.map((m) => m.blocoId)).toEqual(['p1']);
  });

  it('bloco incompleto solto: sem aviso de incompleto, marcado como fora, Executar liberado', () => {
    const { resultado, marcas } = olhar(projetoDeTeste({ soltos: [bloco('teste_leia', { id: 'leia-solto' })] }));
    expect(resultado.avisos).toEqual([]);
    expect(marcas.map((m) => m.blocoId)).toEqual(['leia-solto']);
    expect(verificarExecucao(resultado).permitida).toBe(true);
  });

  it('SC-003: só blocos de topo são marcados e nada do programa é marcado', () => {
    olhar(projetoDeTeste({ comandos: [escreva(5)], soltos: [escreva(6, 'x'), encadear([escreva(7, 'y'), escreva(8)])] }));
    olhar(projetoDeTeste({ comandos: Array.from({ length: 10 }, (_, i) => escreva(i)) }));
    for (const projeto of projetosVistos) {
      const topo = idsDoTopo(projeto);
      const dentro = alcancaveis(projeto);
      for (const { blocoId } of blocosForaDoPrograma(projeto.blocos)) {
        expect(topo.has(blocoId), blocoId).toBe(true);
        expect(dentro.has(blocoId), blocoId).toBe(false);
      }
    }
  });

  it('SC-002: com 100 blocos, copiar + gerar + marcar leva menos de 200 ms', () => {
    const projeto = projetoDeTeste({ comandos: Array.from({ length: 100 }, (_, i) => escreva(i)) });
    const inicio = process.hrtime.bigint();
    const copia = JSON.parse(JSON.stringify(projeto));
    const { codigo } = gerarPortugol(copia, registro);
    const marcas = blocosForaDoPrograma(copia.blocos);
    const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
    expect(codigo.match(/escreva/g)).toHaveLength(100);
    expect(marcas).toEqual([]);
    expect(ms).toBeLessThan(200);
  });
});
