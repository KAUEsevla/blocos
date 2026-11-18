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

// Tradução amigável por tipo de exceção Python (spec 009, research R-07). A mensagem do
// Python, em inglês, nunca entra aqui: ela fica só em `detalhe` (SC-004).
const TRADUCOES_EXECUCAO = Object.freeze({
  ZeroDivisionError: 'Não é possível dividir por zero.',
  EOFError: 'O programa pediu mais dados do que os informados.',
  TypeError: 'Essa operação não funciona com esses tipos de valor (por exemplo, comparar texto com número).',
  OverflowError: 'O número ficou grande demais para ser calculado.',
  MemoryError: 'O programa usou memória demais.',
});
const VALOR_NAO_NUMERICO = /invalid literal for int\(\)|could not convert string to float/;
// Spec 010 (R-07): real digitado com vírgula. O valor vai como digitado (FR-004); a
// mensagem lembra o ponto. A recusa é a regra do Portugol do Core, não uma lacuna.
const REAL_COM_VIRGULA = /could not convert string to float: '[^']*,[^']*'/;
const MENSAGEM_VALOR_NAO_NUMERICO = 'O valor digitado não é um número.';
const MENSAGEM_REAL_COM_VIRGULA = `${MENSAGEM_VALOR_NAO_NUMERICO} Use ponto para separar as casas decimais, por exemplo 1.72.`;

// Spec 005 (research R-08): o Core conta o para com range. Passo zero e casas decimais em de,
// até ou passo só aparecem na execução quando vêm de uma variável ou de uma conta.
const PASSO_ZERO = /passo do laço para não pode ser zero/;
const PARA_COM_REAL = /'float' object cannot be interpreted as an integer/;
const MENSAGEM_PASSO_ZERO = 'O passo do para ficou zero: o laço nunca terminaria.';
const MENSAGEM_PARA_COM_REAL = 'O para só conta com números inteiros: de, até e passo não podem ter casas decimais.';

export function traduzirErroExecucao(tipo, mensagem, rastro) {
  let amigavel = Object.hasOwn(TRADUCOES_EXECUCAO, tipo) ? TRADUCOES_EXECUCAO[tipo] : MENSAGEM_GENERICA_EXECUCAO;
  if (tipo === 'ValueError' && PASSO_ZERO.test(mensagem)) amigavel = MENSAGEM_PASSO_ZERO;
  if (tipo === 'TypeError' && PARA_COM_REAL.test(mensagem)) amigavel = MENSAGEM_PARA_COM_REAL;
  if (tipo === 'ValueError' && VALOR_NAO_NUMERICO.test(mensagem)) {
    amigavel = REAL_COM_VIRGULA.test(mensagem) ? MENSAGEM_REAL_COM_VIRGULA : MENSAGEM_VALOR_NAO_NUMERICO;
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

// Para funções Python que devolvem um valor simples (bool), que não é proxy.
function chamarPythonSimples(motor, nome, ...args) {
  const funcao = motor.globals.get(nome);
  try {
    return funcao(...args);
  } finally {
    funcao.destroy();
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

// Executa o output/main.py já compilado no motor (spec 010, R-02 e R-03). Cada valor de
// entrada vai a um input(), exatamente como está. Entrada esgotada: com interativo, o
// resultado é aguardando_entrada com a variável pedida; sem, EOFError (como na 008/009).
function executarCompilado(motor, entrada, { aoEscrever, interativo }) {
  const execucao = chamarPython(motor, '_meupia_executar', aoEscrever ?? null, [...entrada], Boolean(interativo));
  if (execucao.pedido) {
    return {
      status: 'aguardando_entrada',
      saida: execucao.saida,
      erro: null,
      pedido: { variavel: execucao.pedido.variavel ?? null },
    };
  }
  if (execucao.erro) {
    return {
      status: 'erro_execucao',
      saida: execucao.saida,
      erro: traduzirErroExecucao(execucao.erro.tipo, execucao.erro.mensagem, execucao.erro.rastro),
    };
  }
  return { status: 'ok', saida: execucao.saida, erro: null };
}

// aoEscrever (spec 009, R-05): recebe na hora cada pedaço que o programa escreve.
// O stdout do compilador nunca passa por ele; resultado.saida continua com tudo.
// interativo (spec 010): ver executarCompilado.
export async function compilarEExecutar(motor, codigo, entrada = [], { aoEscrever, interativo = false } = {}) {
  await prepararMotor(motor);

  const compilacao = chamarPython(motor, '_meupia_compilar', codigo);
  if (!compilacao.compilou) {
    return { status: 'erro_compilacao', saida: '', erro: interpretarErroCompilacao(compilacao.saidaCompilador) };
  }
  return executarCompilado(motor, entrada, { aoEscrever, interativo });
}

// Reexecuta, desde o começo e sem recompilar, o último programa compilado no motor, com a
// entrada dada (spec 010, R-02: reexecução determinística).
export async function continuarExecucao(motor, entrada, { aoEscrever, interativo = false } = {}) {
  await prepararMotor(motor);
  if (!chamarPythonSimples(motor, '_meupia_compilado')) {
    return {
      status: 'erro_execucao',
      saida: '',
      erro: {
        mensagem: MENSAGEM_GENERICA_EXECUCAO,
        etapa: 'execução',
        linha: null,
        coluna: null,
        detalhe: 'Nenhum programa compilado para continuar.',
      },
    };
  }
  return executarCompilado(motor, entrada, { aoEscrever, interativo });
}
