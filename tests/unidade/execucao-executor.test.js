// Executor: lado da página do worker de execução (spec 009, contracts/executar.md).
import { describe, it, expect, vi } from 'vitest';
import { criarExecutor } from '../../src/execucao/executor.js';
import { MENSAGEM_ERRO_AMBIENTE } from '../../src/core/ambiente.js';

class WorkerFalso {
  constructor() {
    this.enviadas = [];
    this.terminate = vi.fn();
    this.onmessage = null;
    this.onerror = null;
  }
  postMessage(mensagem) {
    this.enviadas.push(mensagem);
  }
  // Simula uma mensagem do worker para a página.
  responder(mensagem) {
    this.onmessage?.({ data: mensagem });
  }
  ultimoId() {
    return this.enviadas.filter((m) => m.tipo === 'executar').at(-1).id;
  }
}

function montar() {
  const workers = [];
  const executor = criarExecutor({
    criarWorker: () => {
      const w = new WorkerFalso();
      workers.push(w);
      return w;
    },
  });
  return { executor, workers };
}

const OK = { status: 'ok', saida: '', erro: null };

describe('criarExecutor (RF-09)', () => {
  it('cria o worker só no primeiro executar, com preparar antes de executar', () => {
    const { executor, workers } = montar();
    expect(workers).toHaveLength(0);
    expect(executor.pronto()).toBe(false);
    executor.executar('codigo', { entrada: ['1'] });
    expect(workers).toHaveLength(1);
    const [preparar, executar] = workers[0].enviadas;
    expect(preparar).toEqual({ tipo: 'preparar' });
    expect(executar).toMatchObject({ tipo: 'executar', codigo: 'codigo', entrada: ['1'] });
    expect(typeof executar.id).toBe('number');
  });

  it('pronto() fica true depois da mensagem pronto, e aoPronto é chamado', async () => {
    const { executor, workers } = montar();
    const aoPronto = vi.fn();
    const promessa = executor.executar('x', { aoPronto });
    workers[0].responder({ tipo: 'pronto' });
    expect(executor.pronto()).toBe(true);
    expect(aoPronto).toHaveBeenCalledTimes(1);
    workers[0].responder({ tipo: 'resultado', id: workers[0].ultimoId(), resultado: OK });
    await expect(promessa).resolves.toEqual(OK);
  });

  it('repassa progresso e saida e resolve com o resultado', async () => {
    const { executor, workers } = montar();
    const etapas = [];
    const pedacos = [];
    const promessa = executor.executar('x', {
      aoProgresso: (e) => etapas.push(e),
      aoEscrever: (t) => pedacos.push(t),
    });
    const w = workers[0];
    const id = w.ultimoId();
    w.responder({ tipo: 'progresso', etapa: 'python' });
    w.responder({ tipo: 'progresso', etapa: 'core' });
    w.responder({ tipo: 'pronto' });
    w.responder({ tipo: 'saida', id, texto: 'a\n' });
    w.responder({ tipo: 'saida', id, texto: 'b\n' });
    w.responder({ tipo: 'resultado', id, resultado: OK });
    await expect(promessa).resolves.toEqual(OK);
    expect(etapas).toEqual(['python', 'core']);
    expect(pedacos).toEqual(['a\n', 'b\n']);
  });

  it('ignora saida e resultado com id diferente do atual', async () => {
    const { executor, workers } = montar();
    const pedacos = [];
    const promessa = executor.executar('x', { aoEscrever: (t) => pedacos.push(t) });
    const w = workers[0];
    const id = w.ultimoId();
    w.responder({ tipo: 'saida', id: id + 100, texto: 'velho' });
    w.responder({ tipo: 'resultado', id: id + 100, resultado: { status: 'erro_execucao' } });
    w.responder({ tipo: 'resultado', id, resultado: OK });
    await expect(promessa).resolves.toEqual(OK);
    expect(pedacos).toEqual([]);
  });

  it('falha_ambiente resolve com a mensagem, encerra o worker e o próximo executar cria outro', async () => {
    const { executor, workers } = montar();
    const promessa = executor.executar('x');
    workers[0].responder({ tipo: 'falha_ambiente', mensagem: MENSAGEM_ERRO_AMBIENTE });
    await expect(promessa).resolves.toEqual({
      status: 'falha_ambiente',
      saida: '',
      erro: { mensagem: MENSAGEM_ERRO_AMBIENTE },
    });
    expect(workers[0].terminate).toHaveBeenCalledTimes(1);
    expect(executor.pronto()).toBe(false);
    executor.executar('y');
    expect(workers).toHaveLength(2);
  });

  it('erro ao carregar o worker vira falha_ambiente', async () => {
    const { executor, workers } = montar();
    const promessa = executor.executar('x');
    workers[0].onerror?.({ message: 'script não encontrado' });
    await expect(promessa).resolves.toMatchObject({ status: 'falha_ambiente', erro: { mensagem: MENSAGEM_ERRO_AMBIENTE } });
    expect(workers[0].terminate).toHaveBeenCalled();
  });

  it('a segunda execução reaproveita o mesmo worker, já pronto', async () => {
    const { executor, workers } = montar();
    const primeira = executor.executar('x');
    workers[0].responder({ tipo: 'pronto' });
    workers[0].responder({ tipo: 'resultado', id: workers[0].ultimoId(), resultado: OK });
    await primeira;
    const aoPronto = vi.fn();
    const segunda = executor.executar('y', { aoPronto });
    expect(workers).toHaveLength(1);
    expect(workers[0].enviadas.filter((m) => m.tipo === 'preparar')).toHaveLength(1);
    workers[0].responder({ tipo: 'resultado', id: workers[0].ultimoId(), resultado: OK });
    await expect(segunda).resolves.toEqual(OK);
    expect(aoPronto).not.toHaveBeenCalled();
  });

  it('mensagens de um worker que já foi descartado são ignoradas', async () => {
    const { executor, workers } = montar();
    const primeira = executor.executar('x');
    const antigo = workers[0];
    antigo.responder({ tipo: 'falha_ambiente', mensagem: 'm' });
    await primeira;
    const pedacos = [];
    const segunda = executor.executar('y', { aoEscrever: (t) => pedacos.push(t) });
    const id = workers[1].ultimoId();
    antigo.responder({ tipo: 'saida', id, texto: 'do antigo' });
    antigo.responder({ tipo: 'pronto' });
    expect(executor.pronto()).toBe(false);
    workers[1].responder({ tipo: 'resultado', id, resultado: OK });
    await segunda;
    expect(pedacos).toEqual([]);
  });
});
