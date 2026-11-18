// Formato do arquivo de projeto, versão 1 (data-model.md; usado pelas specs 011 e 012).
// Spec 011 (contracts/salvar.md; research R-02, R-04): montarArquivo e textoArquivo escrevem
// o arquivo que o Salvar baixa. Núcleo puro: sem Blockly e sem DOM.

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
