// Motor do navegador: Pyodide carregado do CDN na versão do pacote npm, com o Core instalado.
// Roda dentro do worker de execução (spec 009, R-02). aoProgresso informa as duas etapas
// da preparação, 'python' e 'core' (R-06).
import { loadPyodide, version } from 'pyodide';
import { ErroAmbiente, instalarCore } from './ambiente.js';

export async function criarMotorNavegador({ aoProgresso } = {}) {
  let pyodide;
  aoProgresso?.('python');
  try {
    pyodide = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/` });
  } catch (erro) {
    throw new ErroAmbiente(erro);
  }
  aoProgresso?.('core');
  await instalarCore(pyodide);
  return pyodide;
}
