// Formato do arquivo de projeto, versão 1 (data-model.md; usado pelas specs 011 e 012).

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
