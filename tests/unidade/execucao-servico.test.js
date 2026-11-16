// Serviço do worker de execução (spec 009, contracts/executar.md; research R-05, R-06).
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/core/executor-core.js', () => ({ compilarEExecutar: vi.fn() }));

const { compilarEExecutar } = await import('../../src/core/executor-core.js');
const { ErroAmbiente, MENSAGEM_ERRO_AMBIENTE } = await import('../../src/core/ambiente.js');
const { criarServicoExecucao } = await import('../../src/execucao/servico.js');

function montar({ criarMotor, relogio = { agora: 0 } } = {}) {
  const postadas = [];
  const motor = { nome: 'motor falso' };
  const fabrica =
    criarMotor ??
    vi.fn(async ({ aoProgresso }) => {
      aoProgresso('python');
      aoProgresso('core');
      return motor;
    });
  const servico = criarServicoExecucao({ criarMotor: fabrica, postar: (m) => postadas.push(m), agora: () => relogio.agora });
  return { servico, postadas, motor, fabrica, relogio };
}

describe('criarServicoExecucao (RF-09, RNF-06)', () => {
  beforeEach(() => {
    vi.mocked(compilarEExecutar).mockReset();
  });

  it('preparar duas vezes cria o motor uma vez e informa progresso e pronto', async () => {
    const { servico, postadas, fabrica } = montar();
    await servico.receber({ tipo: 'preparar' });
    await servico.receber({ tipo: 'preparar' });
    expect(fabrica).toHaveBeenCalledTimes(1);
    expect(postadas).toEqual([
      { tipo: 'progresso', etapa: 'python' },
      { tipo: 'progresso', etapa: 'core' },
      { tipo: 'pronto' },
    ]);
  });

  it('ErroAmbiente vira falha_ambiente com a mensagem em pt-BR', async () => {
    const { servico, postadas } = montar({
      criarMotor: async () => {
        throw new ErroAmbiente(new Error('offline'));
      },
    });
    await servico.receber({ tipo: 'preparar' });
    expect(postadas).toEqual([{ tipo: 'falha_ambiente', mensagem: MENSAGEM_ERRO_AMBIENTE }]);
  });

  it('outra falha da preparação também vira a mensagem de ambiente, e a próxima tentativa recria', async () => {
    let tentativas = 0;
    const { servico, postadas } = montar({
      criarMotor: async () => {
        tentativas += 1;
        throw new Error('boom');
      },
    });
    await servico.receber({ tipo: 'preparar' });
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'x', entrada: [] });
    expect(tentativas).toBe(2);
    expect(postadas).toEqual([
      { tipo: 'falha_ambiente', mensagem: MENSAGEM_ERRO_AMBIENTE },
      { tipo: 'falha_ambiente', mensagem: MENSAGEM_ERRO_AMBIENTE },
    ]);
    expect(compilarEExecutar).not.toHaveBeenCalled();
  });

  it('executar sem preparar antes também prepara e passa codigo e entrada ao Core', async () => {
    const { servico, postadas, motor } = montar();
    vi.mocked(compilarEExecutar).mockResolvedValue({ status: 'ok', saida: '', erro: null });
    await servico.receber({ tipo: 'executar', id: 7, codigo: 'algoritmo', entrada: ['1'] });
    expect(compilarEExecutar).toHaveBeenCalledWith(motor, 'algoritmo', ['1'], { aoEscrever: expect.any(Function) });
    expect(postadas.map((m) => m.tipo)).toEqual(['progresso', 'progresso', 'pronto', 'resultado']);
  });

  it('agrupa as escritas em lotes de 50 ms pelo relógio e envia o resto no fim', async () => {
    const { servico, postadas, relogio } = montar();
    await servico.receber({ tipo: 'preparar' });
    postadas.length = 0;
    vi.mocked(compilarEExecutar).mockImplementation(async (_m, _c, _e, { aoEscrever }) => {
      relogio.agora = 0;
      aoEscrever('a');
      relogio.agora = 10;
      aoEscrever('b');
      relogio.agora = 60;
      aoEscrever('c');
      relogio.agora = 70;
      aoEscrever('d');
      return { status: 'ok', saida: 'abcd', erro: null };
    });
    await servico.receber({ tipo: 'executar', id: 3, codigo: 'x', entrada: [] });
    expect(postadas).toEqual([
      { tipo: 'saida', id: 3, texto: 'abc' },
      { tipo: 'saida', id: 3, texto: 'd' },
      { tipo: 'resultado', id: 3, resultado: { status: 'ok', saida: '', erro: null } },
    ]);
  });

  it('o resultado leva saida vazia e o status e o erro do Core', async () => {
    const { servico, postadas } = montar();
    const erro = { mensagem: 'm', etapa: 'execução', linha: null, coluna: null, detalhe: 'd' };
    vi.mocked(compilarEExecutar).mockResolvedValue({ status: 'erro_execucao', saida: 'antes\n', erro });
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'x', entrada: [] });
    expect(postadas.at(-1)).toEqual({ tipo: 'resultado', id: 1, resultado: { status: 'erro_execucao', saida: '', erro } });
  });

  it('exceção inesperada do adapter vira resultado erro_execucao genérico', async () => {
    const { servico, postadas } = montar();
    vi.mocked(compilarEExecutar).mockRejectedValue(new Error('PythonError: algo'));
    await servico.receber({ tipo: 'executar', id: 2, codigo: 'x', entrada: [] });
    const { resultado } = postadas.at(-1);
    expect(resultado.status).toBe('erro_execucao');
    expect(resultado.erro.mensagem).toBe('O programa parou com um erro durante a execução.');
    expect(resultado.erro.detalhe).toContain('PythonError: algo');
  });

  it('o relógio padrão é Date.now e o lote não usa setTimeout', async () => {
    const espiaTimeout = vi.spyOn(globalThis, 'setTimeout');
    const postadas = [];
    const servico = criarServicoExecucao({ criarMotor: async () => ({}), postar: (m) => postadas.push(m) });
    vi.mocked(compilarEExecutar).mockImplementation(async (_m, _c, _e, { aoEscrever }) => {
      aoEscrever('x');
      return { status: 'ok', saida: 'x', erro: null };
    });
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'x', entrada: [] });
    expect(espiaTimeout).not.toHaveBeenCalled();
    expect(postadas.filter((m) => m.tipo === 'saida')).toEqual([{ tipo: 'saida', id: 1, texto: 'x' }]);
    espiaTimeout.mockRestore();
  });

  it('mensagem desconhecida é ignorada', async () => {
    const { servico, postadas } = montar();
    await servico.receber({ tipo: 'outra' });
    await servico.receber(undefined);
    expect(postadas).toEqual([]);
  });
});
