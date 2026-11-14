import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pyodide', () => ({ loadPyodide: vi.fn(), version: '0.25.0' }));
vi.mock('../../src/core/ambiente.js', async (importOriginal) => ({
  ...(await importOriginal()),
  instalarCore: vi.fn(async () => {}),
}));

const { loadPyodide } = await import('pyodide');
const { instalarCore, ErroAmbiente } = await import('../../src/core/ambiente.js');
const { criarMotorNavegador } = await import('../../src/core/motor-navegador.js');

describe('criarMotorNavegador (RF-09, RNF-06)', () => {
  beforeEach(() => {
    vi.mocked(loadPyodide).mockReset();
    vi.mocked(instalarCore).mockReset().mockResolvedValue(undefined);
  });

  it('carrega o Pyodide do CDN da versão do pacote e instala o Core', async () => {
    const instancia = { nome: 'pyodide' };
    vi.mocked(loadPyodide).mockResolvedValue(instancia);
    await expect(criarMotorNavegador()).resolves.toBe(instancia);
    expect(loadPyodide).toHaveBeenCalledWith({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/' });
    expect(instalarCore).toHaveBeenCalledWith(instancia);
  });

  it('falha ao carregar o Pyodide vira ErroAmbiente', async () => {
    const causa = new Error('sem rede');
    vi.mocked(loadPyodide).mockRejectedValue(causa);
    const erro = await criarMotorNavegador().catch((e) => e);
    expect(erro).toBeInstanceOf(ErroAmbiente);
    expect(erro.cause).toBe(causa);
    expect(instalarCore).not.toHaveBeenCalled();
  });

  it('propaga a falha da instalação do Core', async () => {
    vi.mocked(loadPyodide).mockResolvedValue({});
    const falha = new ErroAmbiente(new Error('404'));
    vi.mocked(instalarCore).mockRejectedValue(falha);
    await expect(criarMotorNavegador()).rejects.toBe(falha);
  });
});
