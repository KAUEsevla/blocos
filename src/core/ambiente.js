// Instalação do meuPiá Core no Pyodide (contracts/executor-core.md). Único lugar que instala o Core.
import { MEUPIA_CORE_VERSAO } from '../config.js';

export const MENSAGEM_ERRO_AMBIENTE =
  'Não foi possível carregar o ambiente do meuPiá. Verifique a conexão e tente de novo.';

export class ErroAmbiente extends Error {
  constructor(causa) {
    super(MENSAGEM_ERRO_AMBIENTE, { cause: causa });
    this.name = 'ErroAmbiente';
  }
}

export async function instalarCore(pyodide) {
  try {
    await pyodide.loadPackage('micropip');
    const micropip = pyodide.pyimport('micropip');
    await micropip.install(`meupia-core==${MEUPIA_CORE_VERSAO}`);
  } catch (erro) {
    throw new ErroAmbiente(erro);
  }
}
