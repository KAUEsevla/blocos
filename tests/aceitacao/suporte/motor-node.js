// Motor dos testes de aceitação: pacote npm pyodide no Node + meupia-core real (R-03).
import { loadPyodide } from 'pyodide';
import { ErroAmbiente, instalarCore } from '../../../src/core/ambiente.js';

export async function criarMotorNode() {
  let pyodide;
  try {
    pyodide = await loadPyodide();
  } catch (erro) {
    throw new ErroAmbiente(erro);
  }
  await instalarCore(pyodide);
  return pyodide;
}
