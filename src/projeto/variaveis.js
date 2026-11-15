// Variáveis do projeto (RF-02; spec 002, research R-04; contracts/blocos-variaveis.md).
// A lista viva é o mapa de variáveis do Blockly; estas funções puras convertem entre ele
// e o formato do projeto (projeto.variaveis). Não importam o Blockly e não tocam o DOM.
import { TIPOS_VARIAVEL } from './formato.js';

// Modelos do mapa ({ getId, getName, getType }) → Variavel[], na ordem recebida.
// Modelos com tipo fora de TIPOS_VARIAVEL são ignorados (nada no editor os cria).
export function variaveisDoMapa(modelos) {
  const lista = Array.isArray(modelos) ? modelos : [];
  return lista
    .map((m) => ({ id: m.getId(), nome: m.getName(), tipo: m.getType() }))
    .filter((v) => TIPOS_VARIAVEL.includes(v.tipo));
}

// Serialização para o workspaces.load do Blockly, com as variáveis do projeto na chave
// "variables" (substitui uma que já exista: projeto.variaveis é a única fonte).
export function blocosComVariaveis(blocos, variaveis) {
  const lista = Array.isArray(variaveis) ? variaveis : [];
  return {
    ...(blocos ?? {}),
    variables: lista.map((v) => ({ id: v.id, name: v.nome, type: v.tipo })),
  };
}
