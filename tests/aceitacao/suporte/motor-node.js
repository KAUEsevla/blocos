// Motor dos testes de aceitação: pacote npm pyodide no Node + meupia-core real (R-03).
import { loadPyodide } from 'pyodide';
import { ErroAmbiente, instalarCore } from '../../../src/core/ambiente.js';

// Mesma assinatura de criarMotorNavegador (spec 009, contracts/adapter-core.md).
export async function criarMotorNode({ aoProgresso } = {}) {
  let pyodide;
  aoProgresso?.('python');
  try {
    pyodide = await loadPyodide();
  } catch (erro) {
    throw new ErroAmbiente(erro);
  }
  aoProgresso?.('core');
  await instalarCore(pyodide);
  return pyodide;
}
