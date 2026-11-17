// Serviço do worker de execução (spec 009, contracts/executar.md; research R-05, R-06).
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/core/executor-core.js', () => ({ compilarEExecutar: vi.fn(), continuarExecucao: vi.fn() }));

const { compilarEExecutar, continuarExecucao } = await import('../../src/core/executor-core.js');
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
    expect(compilarEExecutar).toHaveBeenCalledWith(motor, 'algoritmo', ['1'], {
      aoEscrever: expect.any(Function),
      interativo: false,
    });
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

// Spec 010 (contracts/entrada.md, "Serviço do worker"; research R-04, R-05).
describe('entrada interativa (spec 010)', () => {
  const MOTIVO_DIVERGENCIA = 'A reexecução do programa produziu uma saída diferente da anterior.';

  beforeEach(() => {
    vi.mocked(compilarEExecutar).mockReset();
    vi.mocked(continuarExecucao).mockReset();
  });

  // Uma rodada falsa: escreve os pedaços e devolve o resultado.
  const rodada =
    (pedacos, resultado) =>
    async (...args) => {
      const { aoEscrever } = args.at(-1);
      for (const p of pedacos) aoEscrever(p);
      return resultado;
    };
  const pedido = (variavel) => ({ status: 'aguardando_entrada', saida: '', erro: null, pedido: { variavel } });
  const OK = { status: 'ok', saida: '', erro: null };

  async function preparado() {
    const m = montar();
    await m.servico.receber({ tipo: 'preparar' });
    m.postadas.length = 0;
    return m;
  }

  it('executar com interativo repassa interativo: true ao Core', async () => {
    const { servico, motor } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue(OK);
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    expect(compilarEExecutar).toHaveBeenCalledWith(motor, 'c', [], { aoEscrever: expect.any(Function), interativo: true });
  });

  it('aguardando_entrada envia o lote e depois pedido_entrada, sem resultado', async () => {
    const { servico, postadas } = await preparado();
    vi.mocked(compilarEExecutar).mockImplementation(rodada(['antes\n'], pedido('nome')));
    await servico.receber({ tipo: 'executar', id: 4, codigo: 'c', entrada: [], interativo: true });
    expect(postadas).toEqual([
      { tipo: 'saida', id: 4, texto: 'antes\n' },
      { tipo: 'pedido_entrada', id: 4, variavel: 'nome' },
    ]);
  });

  it('pedido sem variável conhecida vai com variavel null', async () => {
    const { servico, postadas } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue({ status: 'aguardando_entrada', saida: '', erro: null, pedido: {} });
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    expect(postadas).toEqual([{ tipo: 'pedido_entrada', id: 1, variavel: null }]);
  });

  it('a entrada reexecuta com a lista acumulada e não reenvia o que já foi mostrado', async () => {
    const { servico, postadas, motor } = await preparado();
    vi.mocked(compilarEExecutar).mockImplementation(rodada(['antes\n'], pedido('nome')));
    await servico.receber({ tipo: 'executar', id: 4, codigo: 'c', entrada: [], interativo: true });
    postadas.length = 0;

    vi.mocked(continuarExecucao).mockImplementationOnce(rodada(['ant', 'es\nOi, Ana\n'], pedido('nome')));
    await servico.receber({ tipo: 'entrada', id: 4, valor: 'Ana' });
    expect(continuarExecucao).toHaveBeenLastCalledWith(motor, ['Ana'], { aoEscrever: expect.any(Function), interativo: true });
    expect(postadas).toEqual([
      { tipo: 'saida', id: 4, texto: 'Oi, Ana\n' },
      { tipo: 'pedido_entrada', id: 4, variavel: 'nome' },
    ]);
    postadas.length = 0;

    vi.mocked(continuarExecucao).mockImplementationOnce(rodada(['antes\nOi, Ana\nOi, Bia\n'], OK));
    await servico.receber({ tipo: 'entrada', id: 4, valor: 'Bia' });
    expect(continuarExecucao).toHaveBeenLastCalledWith(motor, ['Ana', 'Bia'], {
      aoEscrever: expect.any(Function),
      interativo: true,
    });
    expect(postadas).toEqual([
      { tipo: 'saida', id: 4, texto: 'Oi, Bia\n' },
      { tipo: 'resultado', id: 4, resultado: { status: 'ok', saida: '', erro: null } },
    ]);
  });

  it('entradas já informadas no executar continuam na lista', async () => {
    const { servico, motor } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue(pedido('idade'));
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: ['Ana'], interativo: true });
    vi.mocked(continuarExecucao).mockResolvedValue(OK);
    await servico.receber({ tipo: 'entrada', id: 1, valor: '15' });
    expect(continuarExecucao).toHaveBeenCalledWith(motor, ['Ana', '15'], expect.any(Object));
  });

  it('o valor vai como texto, inclusive vazio', async () => {
    const { servico, motor } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue(pedido('nome'));
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    vi.mocked(continuarExecucao).mockResolvedValue(OK);
    await servico.receber({ tipo: 'entrada', id: 1, valor: '' });
    expect(continuarExecucao).toHaveBeenCalledWith(motor, [''], expect.any(Object));
  });

  it.each([
    ['prefixo diferente', ['outra\n'], { status: 'aguardando_entrada', saida: '', erro: null, pedido: { variavel: 'nome' } }],
    ['saída mais curta que a já mostrada', ['an'], { status: 'ok', saida: '', erro: null }],
  ])('%s: a rodada vira erro_execucao e nada novo é postado', async (_, pedacos, resultado) => {
    const { servico, postadas } = await preparado();
    vi.mocked(compilarEExecutar).mockImplementation(rodada(['antes\n'], pedido('nome')));
    await servico.receber({ tipo: 'executar', id: 2, codigo: 'c', entrada: [], interativo: true });
    postadas.length = 0;
    vi.mocked(continuarExecucao).mockImplementation(rodada(pedacos, resultado));
    await servico.receber({ tipo: 'entrada', id: 2, valor: 'Ana' });
    expect(postadas).toHaveLength(1);
    const [{ tipo, id, resultado: r }] = postadas;
    expect({ tipo, id }).toEqual({ tipo: 'resultado', id: 2 });
    expect(r.status).toBe('erro_execucao');
    expect(r.erro.mensagem).toBe('O programa parou com um erro durante a execução.');
    expect(r.erro.detalhe).toBe(MOTIVO_DIVERGENCIA);
    // A pendente foi descartada.
    await servico.receber({ tipo: 'entrada', id: 2, valor: 'x' });
    expect(continuarExecucao).toHaveBeenCalledTimes(1);
  });

  it('entrada de outro id, ou sem execução pendente, é ignorada', async () => {
    const { servico, postadas } = await preparado();
    await servico.receber({ tipo: 'entrada', id: 1, valor: 'a' });
    vi.mocked(compilarEExecutar).mockResolvedValue(pedido('nome'));
    await servico.receber({ tipo: 'executar', id: 5, codigo: 'c', entrada: [], interativo: true });
    await servico.receber({ tipo: 'entrada', id: 4, valor: 'a' });
    expect(continuarExecucao).not.toHaveBeenCalled();
    expect(postadas).toEqual([{ tipo: 'pedido_entrada', id: 5, variavel: 'nome' }]);
  });

  it('um novo executar descarta a execução pendente', async () => {
    const { servico } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue(pedido('nome'));
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    vi.mocked(compilarEExecutar).mockResolvedValue(OK);
    await servico.receber({ tipo: 'executar', id: 2, codigo: 'c', entrada: [] });
    await servico.receber({ tipo: 'entrada', id: 1, valor: 'a' });
    expect(continuarExecucao).not.toHaveBeenCalled();
  });

  it('continuarExecucao rejeitando vira resultado erro_execucao genérico', async () => {
    const { servico, postadas } = await preparado();
    vi.mocked(compilarEExecutar).mockResolvedValue(pedido('nome'));
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    vi.mocked(continuarExecucao).mockRejectedValue(new Error('PythonError: x'));
    await servico.receber({ tipo: 'entrada', id: 1, valor: 'a' });
    const { resultado } = postadas.at(-1);
    expect(resultado.status).toBe('erro_execucao');
    expect(resultado.erro.mensagem).toBe('O programa parou com um erro durante a execução.');
    expect(resultado.erro.detalhe).toContain('PythonError: x');
  });

  it('os lotes de 50 ms continuam valendo na rodada seguinte', async () => {
    const { servico, postadas, relogio } = await preparado();
    vi.mocked(compilarEExecutar).mockImplementation(rodada(['a\n'], pedido('nome')));
    await servico.receber({ tipo: 'executar', id: 1, codigo: 'c', entrada: [], interativo: true });
    postadas.length = 0;
    vi.mocked(continuarExecucao).mockImplementation(async (_m, _e, { aoEscrever }) => {
      relogio.agora = 0;
      aoEscrever('a\n');
      aoEscrever('b');
      relogio.agora = 60;
      aoEscrever('c');
      aoEscrever('d');
      return OK;
    });
    relogio.agora = 0;
    await servico.receber({ tipo: 'entrada', id: 1, valor: 'x' });
    expect(postadas.filter((m) => m.tipo === 'saida')).toEqual([
      { tipo: 'saida', id: 1, texto: 'bc' },
      { tipo: 'saida', id: 1, texto: 'd' },
    ]);
  });
});
