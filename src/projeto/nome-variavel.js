// Regra do nome de variável (RF-02; spec 002, FR-002 e FR-003; contracts/nome-variavel.md).
// Núcleo puro: não importa o Blockly e não toca o DOM. Usado pela interface da 002 (criar e
// renomear) e pela 012 (validar o arquivo carregado).

export const TAMANHO_MAXIMO_NOME = 30;

// Palavras-chave do lexer do meupia-core 1.4.1 (analyzers/lexical_analyzer.py,
// match_token_keywords), sem as formas acentuadas, que o FR-002 já recusa, e os tipos que
// só valem na posição de tipo (utils/builtins.py, TIPOS_CONTEXTUAIS). Research R-02, itens 1–2.
export const PALAVRAS_PORTUGOL = Object.freeze([
  'ate', 'de', 'enquanto', 'e', 'entao', 'escreva', 'faca', 'fim_para', 'fim_se', 'fim_enquanto',
  'leia', 'nao', 'ou', 'para', 'passo', 'se', 'senao', 'inteiro', 'string', 'cadeia', 'real',
  'float', 'dicionario', 'filaprioridade', 'algoritmo', 'var', 'inicio', 'fim_algoritmo', 'usar',
  'funcao', 'retorne', 'fim_funcao', 'continue', 'interrompa', 'classe', 'metodo', 'novo',
  'fim_classe', 'mod',
  'lista', 'logico', 'vetor',
]);

// Funções e constantes nativas do Core 1.4.1 (utils/builtins.py, FUNCOES_BUILTIN e
// CONSTANTES_BUILTIN). Research R-02, item 3.
export const NATIVOS_CORE = Object.freeze([
  'tamanho', 'raiz', 'potencia', 'seno', 'cosseno', 'tangente', 'teto', 'piso', 'absoluto',
  'filaDupla', 'filaPrioridade',
  'pi', 'verdadeiro', 'falso',
]);

// Nomes globais do código Python que o Core 1.4.1 gera (analyzers/code_generator.py: imports do
// cabeçalho do runtime e def main()). Research R-02, item 4.
export const NOMES_RUNTIME = Object.freeze(['main', 'sys', 'math', 'heapq', 'deque', 'collections', 'FilaPrioridade']);

// keyword.kwlist do Python 3.11 (o Python do Pyodide 0.25.0). Research R-03.
export const PALAVRAS_PYTHON = Object.freeze([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in',
  'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

// dir(builtins) do Python 3.11 que começa com letra. Research R-03; conferido contra o Python
// real do Pyodide em tests/aceitacao/nomes-reservados.test.js.
export const NATIVOS_PYTHON = Object.freeze([
  'ArithmeticError', 'AssertionError', 'AttributeError', 'BaseException', 'BaseExceptionGroup',
  'BlockingIOError', 'BrokenPipeError', 'BufferError', 'BytesWarning', 'ChildProcessError',
  'ConnectionAbortedError', 'ConnectionError', 'ConnectionRefusedError', 'ConnectionResetError',
  'DeprecationWarning', 'EOFError', 'Ellipsis', 'EncodingWarning', 'EnvironmentError', 'Exception',
  'ExceptionGroup', 'False', 'FileExistsError', 'FileNotFoundError', 'FloatingPointError',
  'FutureWarning', 'GeneratorExit', 'IOError', 'ImportError', 'ImportWarning', 'IndentationError',
  'IndexError', 'InterruptedError', 'IsADirectoryError', 'KeyError', 'KeyboardInterrupt',
  'LookupError', 'MemoryError', 'ModuleNotFoundError', 'NameError', 'None', 'NotADirectoryError',
  'NotImplemented', 'NotImplementedError', 'OSError', 'OverflowError', 'PendingDeprecationWarning',
  'PermissionError', 'ProcessLookupError', 'RecursionError', 'ReferenceError', 'ResourceWarning',
  'RuntimeError', 'RuntimeWarning', 'StopAsyncIteration', 'StopIteration', 'SyntaxError',
  'SyntaxWarning', 'SystemError', 'SystemExit', 'TabError', 'TimeoutError', 'True', 'TypeError',
  'UnboundLocalError', 'UnicodeDecodeError', 'UnicodeEncodeError', 'UnicodeError',
  'UnicodeTranslateError', 'UnicodeWarning', 'UserWarning', 'ValueError', 'Warning',
  'ZeroDivisionError',
  'abs', 'aiter', 'all', 'anext', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray', 'bytes',
  'callable', 'chr', 'classmethod', 'compile', 'complex', 'copyright', 'credits', 'delattr', 'dict',
  'dir', 'divmod', 'enumerate', 'eval', 'exec', 'exit', 'filter', 'float', 'format', 'frozenset',
  'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input', 'int', 'isinstance',
  'issubclass', 'iter', 'len', 'license', 'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next',
  'object', 'oct', 'open', 'ord', 'pow', 'print', 'property', 'quit', 'range', 'repr', 'reversed',
  'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple',
  'type', 'vars', 'zip',
]);

// Comparação sem diferenciar maiúsculas (FR-003): tudo em minúsculas.
export const NOMES_RESERVADOS = Object.freeze(
  new Set(
    [PALAVRAS_PORTUGOL, NATIVOS_CORE, NOMES_RUNTIME, PALAVRAS_PYTHON, NATIVOS_PYTHON]
      .flat()
      .map((nome) => nome.toLowerCase()),
  ),
);

// Mensagens na ordem em que as regras são verificadas (research R-11).
const MENSAGENS = Object.freeze({
  vazio: 'Digite um nome para a variável.',
  longo: `O nome pode ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`,
  espaco: 'O nome não pode ter espaços. Use _ no lugar, como em minha_idade.',
  acento: 'Use letras sem acento e sem ç.',
  caractere: 'Use só letras, números e _ no nome.',
  inicio: 'O nome precisa começar com uma letra.',
  reservado: 'Este nome é reservado.',
});

const recusar = (nome, motivo, mensagem = MENSAGENS[motivo]) => ({ valido: false, nome, motivo, mensagem });

// Letra fora de A–Z/a–z (acentuada, ç, outros alfabetos).
const LETRA_COM_ACENTO = /[^\x00-\x7F]/u;
const LETRA = /\p{L}/u;

function temLetraComAcento(nome) {
  return [...nome].some((c) => LETRA.test(c) && LETRA_COM_ACENTO.test(c));
}

export function validarNomeVariavel(nome, variaveis = [], { ignorarId } = {}) {
  const limpo = typeof nome === 'string' ? nome.trim() : '';

  if (limpo === '') return recusar(limpo, 'vazio');
  if (limpo.length > TAMANHO_MAXIMO_NOME) return recusar(limpo, 'longo');
  if (/\s/u.test(limpo)) return recusar(limpo, 'espaco');
  if (temLetraComAcento(limpo)) return recusar(limpo, 'acento');
  if (/[^A-Za-z0-9_]/.test(limpo)) return recusar(limpo, 'caractere');
  if (!/^[A-Za-z]/.test(limpo)) return recusar(limpo, 'inicio');

  const minusculo = limpo.toLowerCase();
  if (NOMES_RESERVADOS.has(minusculo)) return recusar(limpo, 'reservado');

  const lista = Array.isArray(variaveis) ? variaveis : [];
  const repetida = lista.find((v) => v.id !== ignorarId && String(v.nome).toLowerCase() === minusculo);
  if (repetida) return recusar(limpo, 'duplicado', `Já existe a variável ${repetida.nome}.`);

  return { valido: true, nome: limpo, motivo: null, mensagem: null };
}
