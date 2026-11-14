// Registro de blocos (contracts/registro-blocos.md): o ponto em que as specs 002–006
// plugam seus blocos sem mexer no gerador.
import { BLOCO_PROGRAMA } from './programa.js';

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
  return { ...entrada, areas: [...areas], variantes: [...variantes] };
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

// Registro com todos os blocos do editor. Na 008 só existe o programa; 002–006 acrescentam os seus.
export const registroPadrao = criarRegistro();
registroPadrao.registrarBloco(BLOCO_PROGRAMA);
