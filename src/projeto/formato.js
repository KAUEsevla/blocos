// Formato do arquivo de projeto, versão 1 (data-model.md; usado pelas specs 011 e 012).
// Spec 011 (contracts/salvar.md; research R-02, R-04): montarArquivo e textoArquivo escrevem
// o arquivo que o Salvar baixa. Spec 012 (contracts/carregar.md; research R-04): lerArquivo lê
// o mesmo arquivo de volta. Núcleo puro: sem Blockly e sem DOM.

import { validarNomeVariavel } from './nome-variavel.js';

export const FORMATO = 'meupia-blocos';
export const VERSAO_FORMATO = 1;
export const TIPOS_VARIAVEL = Object.freeze(['inteiro', 'real', 'cadeia', 'logico']);

// Projeto novo: só o bloco raiz "programa", sem variáveis. Sem blocos.variables: a fonte
// das variáveis é o campo "variaveis" (data-model, "Origem das variáveis").
export function projetoVazio() {
  return {
    formato: FORMATO,
    versao: VERSAO_FORMATO,
    nome: 'MeuPrograma',
    variaveis: [],
    blocos: {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'programa', id: 'programa', x: 24, y: 24, deletable: false }],
      },
    },
  };
}

// Arquivo v1 com as chaves na ordem fixa: identificação primeiro, para quem abre o arquivo
// num editor de texto (SC-003). Objeto novo, sem compartilhar nada com o projeto (FR-005).
export function montarArquivo({ nome = '', variaveis = [], blocos = {} } = {}) {
  const copiaBlocos = structuredClone(blocos ?? {});
  // A fonte das variáveis é "variaveis" (008, "Origem das variáveis").
  delete copiaBlocos.variables;
  return {
    formato: FORMATO,
    versao: VERSAO_FORMATO,
    nome: nome ?? '',
    variaveis: (variaveis ?? []).map(({ id, nome: nomeVariavel, tipo }) => ({ id, nome: nomeVariavel, tipo })),
    blocos: copiaBlocos,
  };
}

// Texto do arquivo: JSON indentado com 2 espaços e quebra de linha final. JSON.stringify não
// escapa acentos, então "Média" fica legível.
export function textoArquivo(projeto) {
  return JSON.stringify(montarArquivo(projeto), null, 2) + '\n';
}

// Spec 012 (contracts/carregar.md; research R-04): leitura estrutural do arquivo. A primeira
// verificação que falha decide o motivo de recusa; nunca lança. O conteúdo dos blocos é
// validado em src/projeto/carregar.js.
export const TAMANHO_MAXIMO_ARQUIVO = 1_048_576; // 1 MB

const ehObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const invalido = (detalhe) => ({ ok: false, motivo: 'dados-invalidos', detalhe });

function lerVariaveis(lista) {
  if (!Array.isArray(lista)) return invalido('a lista de variáveis é inválida');
  const variaveis = [];
  for (const item of lista) {
    if (!ehObjeto(item) || typeof item.id !== 'string' || item.id === '' || typeof item.nome !== 'string') {
      return invalido('a lista de variáveis é inválida');
    }
    if (!TIPOS_VARIAVEL.includes(item.tipo)) {
      return invalido(`a variável "${item.nome}" tem o tipo "${item.tipo}", que não existe`);
    }
    if (variaveis.some((v) => v.id === item.id)) return invalido('há duas variáveis com a mesma identificação');
    // Mesma regra de criar e renomear (002); o nome do arquivo precisa já estar sem espaços nas pontas.
    const regra = validarNomeVariavel(item.nome, variaveis);
    if (!regra.valido || regra.nome !== item.nome) return invalido(`o nome da variável "${item.nome}" é inválido`);
    variaveis.push({ id: item.id, nome: item.nome, tipo: item.tipo });
  }
  return { ok: true, variaveis };
}

export function lerArquivo(texto) {
  if (typeof texto !== 'string') return { ok: false, motivo: 'nao-e-projeto' };
  if (new TextEncoder().encode(texto).length > TAMANHO_MAXIMO_ARQUIVO) return { ok: false, motivo: 'grande-demais' };
  if (texto.trim() === '') return { ok: false, motivo: 'nao-e-projeto' };

  let dados;
  try {
    dados = JSON.parse(texto);
  } catch {
    return { ok: false, motivo: 'nao-e-projeto' };
  }
  if (!ehObjeto(dados) || dados.formato !== FORMATO) return { ok: false, motivo: 'nao-e-projeto' };

  const { versao } = dados;
  if (Number.isInteger(versao) && versao > VERSAO_FORMATO) return { ok: false, motivo: 'versao-nova' };
  if (!Number.isInteger(versao) || versao < 1) return invalido('a versão do formato é inválida');
  if (typeof dados.nome !== 'string') return invalido('o nome do programa é inválido');

  const lidas = lerVariaveis(dados.variaveis);
  if (!lidas.ok) return lidas;

  const { blocos } = dados;
  if (!ehObjeto(blocos)) return invalido('os blocos do projeto estão corrompidos');
  if (blocos.blocks !== undefined && (!ehObjeto(blocos.blocks) || !Array.isArray(blocos.blocks.blocks))) {
    return invalido('os blocos do projeto estão corrompidos');
  }
  const copiaBlocos = structuredClone(blocos);
  delete copiaBlocos.variables;

  return {
    ok: true,
    projeto: { formato: FORMATO, versao, nome: dados.nome, variaveis: lidas.variaveis, blocos: copiaBlocos },
  };
}
