// Adapter do meuPiá Core (contracts/executor-core.md): compila e executa o Portugol no Pyodide.
import { PONTE_PYTHON } from './ponte-python.js';

const MARCA_ERRO = '[COMPILATION ERROR]:';
const FORMATO_ERRO = /^Erro (léxico|sintático|semântico) na linha (\d+), coluna (\d+): /;
const MENSAGEM_GENERICA_EXECUCAO = 'O programa parou com um erro durante a execução.';
const MENSAGEM_GENERICA_COMPILACAO = 'O meuPiá Core não conseguiu compilar o programa.';

const motoresPreparados = new WeakSet();

export function interpretarErroCompilacao(saidaCompilador) {
  const saida = String(saidaCompilador ?? '');
  const inicio = saida.indexOf(MARCA_ERRO);
  // Sem a marca, o texto não é uma mensagem do Core (ex.: rastro de uma falha do
  // compilador, em inglês): só vai para o detalhe (spec 009, R-04 e R-07).
  const texto = inicio >= 0 ? saida.slice(inicio + MARCA_ERRO.length).trim() : '';
  const m = texto.match(FORMATO_ERRO);
  return {
    mensagem: texto || MENSAGEM_GENERICA_COMPILACAO,
    etapa: m ? m[1] : null,
    linha: m ? Number(m[2]) : null,
    coluna: m ? Number(m[3]) : null,
    detalhe: saida,
  };
}

export function traduzirErroExecucao(tipo, mensagem, rastro) {
  let amigavel = MENSAGEM_GENERICA_EXECUCAO;
  if (tipo === 'ZeroDivisionError') {
    amigavel = 'Divisão por zero';
  } else if (tipo === 'EOFError') {
    amigavel = 'O programa pediu mais dados do que os informados';
  } else if (
    tipo === 'ValueError' &&
    /invalid literal for int\(\)|could not convert string to float/.test(mensagem)
  ) {
    amigavel = 'O valor digitado não é um número';
  }
  return {
    mensagem: amigavel,
    etapa: 'execução',
    linha: null,
    coluna: null,
    detalhe: rastro || `${tipo}: ${mensagem}`,
  };
}

async function prepararMotor(motor) {
  if (!motoresPreparados.has(motor)) {
    await motor.runPythonAsync(PONTE_PYTHON);
    motoresPreparados.add(motor);
  }
}

function chamarPython(motor, nome, ...args) {
  const funcao = motor.globals.get(nome);
  try {
    const resultado = funcao(...args);
    try {
      return resultado.toJs({ dict_converter: Object.fromEntries });
    } finally {
      resultado.destroy();
    }
  } finally {
    funcao.destroy();
  }
}

// aoEscrever (spec 009, R-05): recebe na hora cada pedaço que o programa escreve.
// O stdout do compilador nunca passa por ele; resultado.saida continua com tudo.
export async function compilarEExecutar(motor, codigo, entrada = [], { aoEscrever } = {}) {
  await prepararMotor(motor);

  const compilacao = chamarPython(motor, '_meupia_compilar', codigo);
  if (!compilacao.compilou) {
    return { status: 'erro_compilacao', saida: '', erro: interpretarErroCompilacao(compilacao.saidaCompilador) };
  }

  // Uma linha por input(); entrada esgotada = fim de arquivo (EOFError no programa).
  const fila = [...entrada];
  motor.setStdin({ stdin: () => (fila.length > 0 ? fila.shift() : undefined) });
  try {
    const execucao = chamarPython(motor, '_meupia_executar', aoEscrever ?? null);
    if (execucao.erro) {
      return {
        status: 'erro_execucao',
        saida: execucao.saida,
        erro: traduzirErroExecucao(execucao.erro.tipo, execucao.erro.mensagem, execucao.erro.rastro),
      };
    }
    return { status: 'ok', saida: execucao.saida, erro: null };
  } finally {
    motor.setStdin();
  }
}
