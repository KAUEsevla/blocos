import { describe, it, expect, vi } from 'vitest';
import { instalarCore, ErroAmbiente, MENSAGEM_ERRO_AMBIENTE } from '../../src/core/ambiente.js';
import { MEUPIA_CORE_VERSAO } from '../../src/config.js';

function pyodideFalso({ falhaLoad, falhaInstall } = {}) {
  const install = vi.fn(async () => {
    if (falhaInstall) throw falhaInstall;
  });
  return {
    install,
    loadPackage: vi.fn(async () => {
      if (falhaLoad) throw falhaLoad;
    }),
    pyimport: vi.fn(() => ({ install })),
  };
}

describe('instalarCore (RF-09, RNF-02)', () => {
  it('instala o micropip e depois o meupia-core na versão de config.js', async () => {
    const py = pyodideFalso();
    await instalarCore(py);
    expect(py.loadPackage).toHaveBeenCalledWith('micropip');
    expect(py.pyimport).toHaveBeenCalledWith('micropip');
    expect(py.install).toHaveBeenCalledWith(`meupia-core==${MEUPIA_CORE_VERSAO}`);
  });

  it('falha no micropip vira ErroAmbiente com a causa', async () => {
    const causa = new Error('sem rede');
    const erro = await instalarCore(pyodideFalso({ falhaLoad: causa })).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroAmbiente);
    expect(erro.name).toBe('ErroAmbiente');
    expect(erro.message).toBe(
      'Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo.',
    );
    expect(erro.message).toBe(MENSAGEM_ERRO_AMBIENTE);
    expect(erro.cause).toBe(causa);
  });

  it('falha na instalação do Core vira ErroAmbiente', async () => {
    const causa = new Error('404');
    const erro = await instalarCore(pyodideFalso({ falhaInstall: causa })).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroAmbiente);
    expect(erro.cause).toBe(causa);
  });
});
