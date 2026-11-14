// Motor do navegador: Pyodide carregado do CDN na versão do pacote npm, com o Core instalado.
import { loadPyodide, version } from 'pyodide';
import { ErroAmbiente, instalarCore } from './ambiente.js';

export async function criarMotorNavegador() {
  let pyodide;
  try {
    pyodide = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/` });
  } catch (erro) {
    throw new ErroAmbiente(erro);
  }
  await instalarCore(pyodide);
  return pyodide;
}
