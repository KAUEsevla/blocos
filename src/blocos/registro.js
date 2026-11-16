// Registro de blocos (contracts/registro-blocos.md; chave tipoPelaVariavel da spec 006,
// contracts/tipos-encaixe.md): o ponto em que as specs 002–006
// plugam seus blocos sem mexer no gerador.
import { BLOCO_PROGRAMA } from './programa.js';
import { BLOCO_VARIAVEL_RECEBE, BLOCO_VARIAVEL } from './variaveis.js';
import { BLOCO_ESCREVA, BLOCO_LEIA } from './entrada-saida.js';
import { BLOCO_NUMERO, BLOCO_TEXTO, BLOCO_LOGICO } from './valores.js';
import { BLOCO_ARITMETICO, BLOCO_NEGATIVO } from './contas.js';
import { BLOCO_RELACIONAL } from './comparacoes.js';
import { BLOCO_E_OU, BLOCO_NAO } from './logica.js';

const CATEGORIAS = ['comando', 'valor', 'raiz'];
const OBRIGATORIOS = ['tipo', 'rotulo', 'categoria', 'definicao', 'gerar'];
const VARIANTE_PADRAO = Object.freeze({ nome: 'padrão', presente: () => true });

function validar(entrada) {
  for (const campo of OBRIGATORIOS) {
    if (entrada[campo] === undefined || entrada[campo] === null || entrada[campo] === '') {
      throw new Error(`Bloco sem o campo obrigatório "${campo}".`);
    }
  }
  if (!CATEGORIAS.includes(entrada.categoria)) {
    throw new Error(`categoria inválida "${entrada.categoria}" no bloco "${entrada.tipo}".`);
  }
  if (typeof entrada.gerar !== 'function') {
    throw new Error(`O campo "gerar" do bloco "${entrada.tipo}" precisa ser uma função.`);
  }
  const areas = entrada.areas ?? [];
  if (!Array.isArray(areas) || areas.some((a) => typeof a !== 'string')) {
    throw new Error(`"areas" do bloco "${entrada.tipo}" precisa ser uma lista de nomes.`);
  }
  const variantes = entrada.variantes ?? [];
  if (!Array.isArray(variantes)) {
    throw new Error(`"variantes" do bloco "${entrada.tipo}" precisa ser uma lista.`);
  }
  const nomes = new Set();
  for (const variante of variantes) {
    if (typeof variante?.nome !== 'string' || variante.nome === '') {
      throw new Error(`Variante sem nome no bloco "${entrada.tipo}".`);
    }
    if (typeof variante.presente !== 'function') {
      throw new Error(`A variante "${variante.nome}" do bloco "${entrada.tipo}" precisa da função presente.`);
    }
    if (nomes.has(variante.nome)) {
      throw new Error(`Variante "${variante.nome}" repetida no bloco "${entrada.tipo}".`);
    }
    nomes.add(variante.nome);
  }
  validarTipoPelaVariavel(entrada);
  return { ...entrada, areas: [...areas], variantes: [...variantes] };
}

// Chave opcional da spec 006 (research R-09; contracts/tipos-encaixe.md): o check daquele
// ponto ('saida' ou o nome de um input_value) vem do tipo da variável do campo VAR.
function validarTipoPelaVariavel(entrada) {
  const valor = entrada.tipoPelaVariavel;
  if (valor === undefined) return;
  const args = Array.isArray(entrada.definicao?.args0) ? entrada.definicao.args0 : [];
  const temVar = args.some((a) => a?.name === 'VAR');
  const encaixes = args.filter((a) => a?.type === 'input_value').map((a) => a.name);
  const pontoValido = valor === 'saida' || (typeof valor === 'string' && encaixes.includes(valor));
  if (!temVar || !pontoValido) {
    throw new Error(`tipoPelaVariavel inválido no bloco "${entrada.tipo}": use 'saida' ou um encaixe, com campo VAR.`);
  }
}

export function criarRegistro() {
  const entradas = new Map();

  return {
    registrarBloco(entrada) {
      const validada = validar(entrada);
      if (entradas.has(validada.tipo)) {
        throw new Error(`O bloco "${validada.tipo}" já está registrado.`);
      }
      entradas.set(validada.tipo, Object.freeze(validada));
    },
    obter(tipo) {
      return entradas.get(tipo);
    },
    tiposRegistrados() {
      return [...entradas.keys()];
    },
    variantesDe(tipo) {
      const entrada = entradas.get(tipo);
      if (!entrada) throw new Error(`O bloco "${tipo}" não está registrado.`);
      return entrada.variantes.length > 0 ? entrada.variantes : [VARIANTE_PADRAO];
    },
  };
}

// Registro com todos os blocos do editor: o programa (008), os blocos de variável (002) e os
// de entrada e saída com os valores e a conta antecipados da 006 (003); a 006 traz o lógico, o
// negativo, a comparação, e/ou e não; 004–005 acrescentam os seus.
export const registroPadrao = criarRegistro();
registroPadrao.registrarBloco(BLOCO_PROGRAMA);
registroPadrao.registrarBloco(BLOCO_VARIAVEL_RECEBE);
registroPadrao.registrarBloco(BLOCO_VARIAVEL);
registroPadrao.registrarBloco(BLOCO_ESCREVA);
registroPadrao.registrarBloco(BLOCO_TEXTO);
registroPadrao.registrarBloco(BLOCO_NUMERO);
registroPadrao.registrarBloco(BLOCO_LOGICO);
registroPadrao.registrarBloco(BLOCO_ARITMETICO);
registroPadrao.registrarBloco(BLOCO_NEGATIVO);
registroPadrao.registrarBloco(BLOCO_RELACIONAL);
registroPadrao.registrarBloco(BLOCO_E_OU);
registroPadrao.registrarBloco(BLOCO_NAO);
registroPadrao.registrarBloco(BLOCO_LEIA);
