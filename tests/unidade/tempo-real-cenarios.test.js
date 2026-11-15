import { describe, it, expect, beforeEach } from 'vitest';
import { criarAtualizacaoTempoReal } from '../../src/portugol/tempo-real.js';
import { gerarPortugol } from '../../src/portugol/gerador.js';
import { criarRegistroTeste, bloco, projetoDeTeste } from '../auxiliares/blocos-teste.js';

// Cenários da spec 007 (RF-07; SC-001) no núcleo: o atualizador ligado ao gerador, com o
// registro de teste. O "editor" é a variável estado; atualizar() faz o que a tela faz.

const registro = criarRegistroTeste();
registro.registrarBloco({
  tipo: 'teste_numero',
  rotulo: 'número',
  categoria: 'valor',
  definicao: { type: 'teste_numero' },
  gerar: (b) => ({ codigo: String(b.fields.NUM), precedencia: 99 }),
});
registro.registrarBloco({
  tipo: 'teste_escreva',
  rotulo: 'escreva',
  categoria: 'comando',
  definicao: { type: 'teste_escreva' },
  gerar: (b, ctx) => ctx.linha(`escreva(${ctx.valor(b, 'VALOR', 'o valor')})`),
});

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
