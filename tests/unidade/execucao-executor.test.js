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

  describe('parar (US3, FR-007)', () => {
    it('encerra o worker, resolve como interrompido e prepara um worker novo em segundo plano', async () => {
      const { executor, workers } = montar();
      const promessa = executor.executar('enquanto verdadeiro');
      workers[0].responder({ tipo: 'pronto' });
      executor.parar();
      expect(workers[0].terminate).toHaveBeenCalledTimes(1);
      await expect(promessa).resolves.toEqual({ status: 'interrompido', saida: '', erro: null });
      expect(workers).toHaveLength(2);
      expect(workers[1].enviadas).toEqual([{ tipo: 'preparar' }]);
    });

    it('pronto() volta a false até o worker novo mandar pronto', () => {
      const { executor, workers } = montar();
      executor.executar('x');
      workers[0].responder({ tipo: 'pronto' });
      expect(executor.pronto()).toBe(true);
      executor.parar();
      expect(executor.pronto()).toBe(false);
      workers[1].responder({ tipo: 'pronto' });
      expect(executor.pronto()).toBe(true);
    });

    it('lotes e resultado atrasados do worker encerrado são ignorados', async () => {
      const { executor, workers } = montar();
      const pedacos = [];
      const primeira = executor.executar('x', { aoEscrever: (t) => pedacos.push(t) });
      const antigo = workers[0];
      const idAntigo = antigo.ultimoId();
      executor.parar();
      await primeira;
      const segunda = executor.executar('y', { aoEscrever: (t) => pedacos.push(t) });
      antigo.responder({ tipo: 'saida', id: idAntigo, texto: 'atrasado' });
      antigo.responder({ tipo: 'resultado', id: idAntigo, resultado: OK });
      const id = workers[1].ultimoId();
      workers[1].responder({ tipo: 'saida', id, texto: 'novo' });
      workers[1].responder({ tipo: 'resultado', id, resultado: OK });
      await expect(segunda).resolves.toEqual(OK);
      expect(pedacos).toEqual(['novo']);
    });

    it('etapas anunciadas pelo worker novo antes da próxima execução são repetidas para ela', () => {
      const { executor, workers } = montar();
      executor.executar('x');
      executor.parar();
      workers[1].responder({ tipo: 'progresso', etapa: 'python' });
      const etapas = [];
      executor.executar('y', { aoProgresso: (e) => etapas.push(e) });
      workers[1].responder({ tipo: 'progresso', etapa: 'core' });
      expect(etapas).toEqual(['python', 'core']);
    });

    it('sem execução em andamento, parar não faz nada', () => {
      const { executor, workers } = montar();
      executor.parar();
      expect(workers).toHaveLength(0);
      const primeira = executor.executar('x');
      workers[0].responder({ tipo: 'resultado', id: workers[0].ultimoId(), resultado: OK });
      return primeira.then(() => {
        executor.parar();
        expect(workers[0].terminate).not.toHaveBeenCalled();
        expect(workers).toHaveLength(1);
      });
    });
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

// Spec 010 (contracts/entrada.md, "Executor"; research R-04, R-09).
describe('entrada interativa (spec 010)', () => {
  const esperar = () => new Promise((resolver) => setTimeout(resolver, 0));

  it('com aoPedirEntrada, executar vai com interativo: true; sem ele, false', () => {
    const { executor, workers } = montar();
    executor.executar('a', { aoPedirEntrada: async () => '' });
    expect(workers[0].enviadas.at(-1)).toMatchObject({ tipo: 'executar', interativo: true });
    workers[0].responder({ tipo: 'resultado', id: workers[0].ultimoId(), resultado: OK });
    executor.executar('b');
    expect(workers[0].enviadas.at(-1)).toMatchObject({ tipo: 'executar', interativo: false });
  });

  it('pedido_entrada chama aoPedirEntrada e a resposta vira a mensagem entrada', async () => {
    const { executor, workers } = montar();
    const aoPedirEntrada = vi.fn(async () => 'Ana');
    const promessa = executor.executar('x', { aoPedirEntrada });
    const id = workers[0].ultimoId();
    workers[0].responder({ tipo: 'pedido_entrada', id, variavel: 'nome' });
    expect(aoPedirEntrada).toHaveBeenCalledWith({ variavel: 'nome' });
    await esperar();
    expect(workers[0].enviadas.at(-1)).toEqual({ tipo: 'entrada', id, valor: 'Ana' });
    workers[0].responder({ tipo: 'resultado', id, resultado: OK });
    await expect(promessa).resolves.toEqual(OK);
  });

  it('valor vazio é enviado como texto vazio', async () => {
    const { executor, workers } = montar();
    executor.executar('x', { aoPedirEntrada: async () => '' });
    const id = workers[0].ultimoId();
    workers[0].responder({ tipo: 'pedido_entrada', id, variavel: 'nome' });
    await esperar();
    expect(workers[0].enviadas.at(-1)).toEqual({ tipo: 'entrada', id, valor: '' });
  });

  it('pedido_entrada de outro id é ignorado', () => {
    const { executor, workers } = montar();
    const aoPedirEntrada = vi.fn(async () => 'x');
    executor.executar('x', { aoPedirEntrada });
    workers[0].responder({ tipo: 'pedido_entrada', id: 999, variavel: 'nome' });
    expect(aoPedirEntrada).not.toHaveBeenCalled();
  });

  it('pedido_entrada sem aoPedirEntrada não quebra', () => {
    const { executor, workers } = montar();
    executor.executar('x');
    expect(() => workers[0].responder({ tipo: 'pedido_entrada', id: workers[0].ultimoId(), variavel: 'n' })).not.toThrow();
  });

  it('resposta que chega depois do Parar não é postada a nenhum worker', async () => {
    const { executor, workers } = montar();
    let responder;
    const promessa = executor.executar('x', { aoPedirEntrada: () => new Promise((r) => (responder = r)) });
    const id = workers[0].ultimoId();
    workers[0].responder({ tipo: 'pedido_entrada', id, variavel: 'nome' });
    executor.parar();
    await expect(promessa).resolves.toEqual({ status: 'interrompido', saida: '', erro: null });
    responder('tarde');
    await esperar();
    const entradas = workers.flatMap((w) => w.enviadas).filter((m) => m.tipo === 'entrada');
    expect(entradas).toEqual([]);
  });
});
