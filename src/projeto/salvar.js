// Núcleo do Salvar (RF-11; spec 011, contracts/salvar.md; research R-03, R-05, R-07).
// Decide o nome e o conteúdo do arquivo e a referência de "salvo". Puro: sem Blockly, sem DOM
// e sem rede (FR-004); o download fica em src/ui/download.js.
import { textoArquivo } from './formato.js';
import { assinaturaProjeto } from './alteracoes.js';

const NOME_PADRAO = 'MeuPrograma';
// Os caracteres que a spec proíbe em nome de arquivo e os de controle (U+0000–U+001F, U+007F).
const INVALIDOS = /[/\\:*?"<>|\u0000-\u001f\u007f]/g;

// Nome do programa → nome do arquivo (FR-003; casos de borda da spec).
export function nomeArquivo(nome) {
  const limpo = String(nome ?? '')
    .trim()
    .replace(INVALIDOS, '_');
  return `${limpo || NOME_PADRAO}.json`;
}

// A referência é a assinatura do mesmo objeto gravado: logo depois de salvar não há alterações
// não salvas, e o Novo não pergunta (spec 001, FR-007).
export function prepararSalvamento(projeto) {
  return {
    nomeArquivo: nomeArquivo(projeto?.nome),
    texto: textoArquivo(projeto),
    referencia: assinaturaProjeto(projeto),
  };
}
