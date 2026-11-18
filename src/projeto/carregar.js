// Núcleo do Carregar (RF-12; spec 012, contracts/carregar.md; research R-03 a R-06, R-09).
// Decide se um arquivo pode substituir o projeto aberto e com que mensagem é recusado. Puro:
// sem Blockly, sem DOM, sem rede. A leitura estrutural fica em formato.js (lerArquivo); aqui
// ficam a validação dos blocos contra o registro e as mensagens em pt-BR.
import { lerArquivo } from './formato.js';
import { registroPadrao } from '../blocos/registro.js';
import { encaixesIncompativeis, checkEfetivo } from '../blocos/tipos.js';
import { MAX_VALORES, quantidadeValores, nomeEncaixe } from '../blocos/entrada-saida.js';
import { temSenao } from '../blocos/decisao.js';
import { normalizarNumero } from '../blocos/valores.js';

const MENSAGENS = Object.freeze({
  'nao-e-projeto': 'Este arquivo não é um projeto do meuPiá Blocos.',
  'versao-nova': 'Este projeto foi salvo numa versão mais nova do meuPiá Blocos.',
  'grande-demais': 'Este arquivo é grande demais para ser um projeto do meuPiá Blocos (o limite é 1 MB).',
});

export function mensagemRecusa({ motivo, detalhe } = {}) {
  if (motivo === 'dados-invalidos') return `Este projeto tem dados inválidos e não foi carregado: ${detalhe}.`;
  return MENSAGENS[motivo] ?? MENSAGENS['nao-e-projeto'];
}

const NOMES_CHECK = Object.freeze({ Numero: 'número', Texto: 'texto', Logico: 'valor lógico' });
const nomeCheck = (check) => (check ?? []).map((c) => NOMES_CHECK[c] ?? c).join(' ou ');
const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

class Recusa extends Error {
  constructor(detalhe) {
    super(detalhe);
    this.detalhe = detalhe;
  }
}
const recusar = (detalhe) => {
  throw new Recusa(detalhe);
};

const argumentos = (definicao) =>
  Object.keys(definicao ?? {})
    .filter((k) => /^args\d+$/.test(k))
    .flatMap((k) => definicao[k] ?? []);

// Encaixes que o bloco tem com este nó: os da definição e as áreas dos mutadores (escreva: VALOR1
// a VALOR{n}; se: SENAO só com o senão ligado).
function encaixesDoBloco(no, definicao) {
  const encaixes = new Map(
    argumentos(definicao)
      .filter((a) => a.type === 'input_value' || a.type === 'input_statement')
      .map((a) => [a.name, a.type === 'input_value' ? 'valor' : 'comandos']),
  );
  if (no.type === 'escreva') {
    for (let k = 1; k <= quantidadeValores(no); k += 1) encaixes.set(nomeEncaixe(k), 'valor');
  }
  if (no.type === 'se' && temSenao(no)) encaixes.set('SENAO', 'comandos');
  return encaixes;
}

// Quem pode ficar em cada lugar: valor precisa de saída; comandos e "next", de conexão anterior.
const CABE = {
  valor: (d) => Object.hasOwn(d, 'output'),
  comandos: (d) => Object.hasOwn(d, 'previousStatement'),
  next: (d) => Object.hasOwn(d, 'previousStatement'),
};

function validarCampos(no, definicao, idsVariaveis) {
  const campos = ehObjeto(no.fields) ? no.fields : {};
  for (const arg of argumentos(definicao)) {
    const valor = campos[arg.name];
    if (valor === undefined) continue;
    if (arg.type === 'field_dropdown' && !arg.options.some(([, opcao]) => opcao === valor)) {
      recusar(`um campo do bloco "${no.type}" tem um valor inválido`);
    }
    if (arg.type === 'campo_variavel' && valor !== null) {
      if (!ehObjeto(valor) || !idsVariaveis.has(valor.id)) recusar('um bloco usa uma variável que não está no projeto');
    }
  }
  if (no.type === 'numero' && campos.NUM !== undefined && normalizarNumero(String(campos.NUM)) === null) {
    recusar('um campo do bloco "numero" tem um valor inválido');
  }
}

function validarEstadoExtra(no) {
  const extra = no.extraState;
  if (extra === undefined || extra === null) return;
  if (no.type === 'escreva') {
    const { valores } = ehObjeto(extra) ? extra : {};
    if (!Number.isInteger(valores) || valores < 1 || valores > MAX_VALORES) {
      recusar('o bloco escreva tem uma quantidade de valores inválida');
    }
  }
  // Se sem extraState = senão desligado (gravado assim pela 011); só true/false são aceitos.
  if (no.type === 'se' && (!ehObjeto(extra) || typeof extra.senao !== 'boolean')) {
    recusar('o bloco se tem dados inválidos');
  }
}

// Regras do research R-05, na ordem do contrato: em cada bloco, tipo, identificação, lugar do
// programa, posição (topo), lugar onde está encaixado, campos, extraState, encaixes; depois os
// filhos e o "next". Por último, a falta do programa e os tipos dos encaixes (006).
export function validarBlocos(projeto, registro = registroPadrao) {
  const idsVariaveis = new Set((projeto?.variaveis ?? []).map((v) => v.id));
  const ids = new Set();
  const porId = new Map();
  let programas = 0;

  const visitar = (no, lugar, definicaoPai) => {
    if (!ehObjeto(no)) recusar('os blocos do projeto estão corrompidos');
    const entrada = registro.obter(no.type);
    if (!entrada) recusar(`o bloco "${no.type}" não existe no meuPiá Blocos`);
    if (typeof no.id !== 'string' || no.id === '' || ids.has(no.id)) {
      recusar('há blocos sem identificação ou com a mesma identificação');
    }
    ids.add(no.id);
    porId.set(no.id, no);
    const definicao = entrada.definicao;
    if (no.type === 'programa') {
      programas += 1;
      if (lugar !== 'topo' || no.id !== 'programa' || programas > 1) recusar('o bloco programa está duplicado ou fora do lugar');
    }
    if (lugar === 'topo' && (!Number.isFinite(no.x) || !Number.isFinite(no.y))) {
      recusar('a posição de um bloco está faltando');
    }
    if (lugar === 'next' && !Object.hasOwn(definicaoPai, 'nextStatement')) {
      recusar('um bloco está encaixado num lugar onde não cabe');
    }
    if (lugar !== 'topo' && !CABE[lugar](definicao)) recusar('um bloco está encaixado num lugar onde não cabe');
    validarCampos(no, definicao, idsVariaveis);
    validarEstadoExtra(no);

    const encaixes = encaixesDoBloco(no, definicao);
    const entradas = no.inputs ?? {};
    if (!ehObjeto(entradas)) recusar('os blocos do projeto estão corrompidos');
    for (const [nome, conteudo] of Object.entries(entradas)) {
      if (!encaixes.has(nome)) recusar(`o bloco "${no.type}" tem um encaixe que não existe`);
      if (!ehObjeto(conteudo)) recusar('os blocos do projeto estão corrompidos');
      if (conteudo.block !== undefined) visitar(conteudo.block, encaixes.get(nome), definicao);
    }
    if (no.next !== undefined) {
      if (!ehObjeto(no.next)) recusar('os blocos do projeto estão corrompidos');
      if (no.next.block !== undefined) visitar(no.next.block, 'next', definicao);
    }
  };

  try {
    for (const topo of projeto?.blocos?.blocks?.blocks ?? []) visitar(topo, 'topo');
    if (programas === 0) recusar('falta o bloco programa');

    const tipos = Object.fromEntries((projeto.variaveis ?? []).map((v) => [v.id, v.tipo]));
    const [par] = encaixesIncompativeis(projeto.blocos.blocks, registro, tipos);
    if (par) {
      const pai = porId.get(par.pai);
      const filho = porId.get(par.filho);
      const tipoDe = (b) => tipos[b.fields?.VAR?.id];
      const cabe = checkEfetivo(registro.obter(pai.type), par.encaixe, tipoDe(pai));
      const encaixado = checkEfetivo(registro.obter(filho.type), 'saida', tipoDe(filho));
      recusar(`um ${nomeCheck(encaixado)} está encaixado onde só cabe ${nomeCheck(cabe)}`);
    }
  } catch (erro) {
    if (erro instanceof Recusa) return { ok: false, motivo: 'dados-invalidos', detalhe: erro.detalhe };
    throw erro;
  }
  return { ok: true };
}

export function prepararCarregamento(texto, registro = registroPadrao) {
  const lido = lerArquivo(texto);
  const resultado = lido.ok ? validarBlocos(lido.projeto, registro) : lido;
  if (!resultado.ok) return { ...resultado, mensagem: mensagemRecusa(resultado) };
  return { ok: true, projeto: lido.projeto };
}

// Erro lançado pelo Blockly no ensaio. Comparação por instanceof: o nome da classe vem
// minificado (BadConnectionCheck$$module$…). excecoes = Blockly.serialization.exceptions.
export function classificarErroCarga(erro, excecoes = {}) {
  const { BadConnectionCheck, MissingConnection } = excecoes;
  const eh = (Classe) => typeof Classe === 'function' && erro instanceof Classe;
  return { ok: false, erro: eh(BadConnectionCheck) || eh(MissingConnection) ? 'encaixe' : 'desconhecido' };
}

const DETALHES_ENSAIO = Object.freeze({
  encaixe: 'um bloco está encaixado num lugar onde não cabe',
  desconhecido: 'o editor não conseguiu montar os blocos',
});

// Ensaio recusado (research R-06) → recusa com mensagem.
export function recusaDoEnsaio({ erro } = {}) {
  const recusa = { ok: false, motivo: 'dados-invalidos', detalhe: DETALHES_ENSAIO[erro] ?? DETALHES_ENSAIO.desconhecido };
  return { ...recusa, mensagem: mensagemRecusa(recusa) };
}
