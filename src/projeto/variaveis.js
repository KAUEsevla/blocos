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

// Um bloco "usa" a variável quando algum campo guarda { id } dela.
function usaVariavel(no, idVariavel) {
  return Object.values(no?.fields ?? {}).some((campo) => campo && typeof campo === 'object' && campo.id === idVariavel);
}

// Blocos encaixados nos encaixes (valor e comandos) de um bloco, com as cadeias "next"
// dentro desses encaixes; o "next" do próprio bloco fica de fora.
function encaixados(no) {
  const filhos = [];
  for (const entrada of Object.values(no?.inputs ?? {})) {
    for (let filho = entrada?.block; filho; filho = filho.next?.block) filhos.push(filho);
  }
  return filhos;
}

// Quantos blocos usam a variável e quantos somem ao apagá-la (FR-008; data-model,
// "Contagem"). O Blockly apaga cada uso com dispose(true): o comando seguinte sobe para o
// lugar dele e os blocos encaixados nele saem junto (research R-06).
export function contarBlocosApagados(blocos, idVariavel) {
  let usos = 0;
  let total = 0;

  // dentroDeUso: o bloco já vai sair junto com um uso acima dele.
  const visitar = (no, dentroDeUso) => {
    const uso = usaVariavel(no, idVariavel);
    if (uso) usos += 1;
    const sai = dentroDeUso || uso;
    if (sai) total += 1;
    for (const filho of encaixados(no)) visitar(filho, sai);
  };

  for (const topo of blocos?.blocks?.blocks ?? []) {
    for (let no = topo; no; no = no.next?.block) visitar(no, false);
  }
  return { usos, total };
}

// Textos do confirmar() da 001 ao apagar uma variável em uso (data-model, "Mensagem").
export function textoApagar(nome, { usos, total }) {
  const usada = usos === 1 ? `A variável ${nome} é usada em 1 bloco.` : `A variável ${nome} é usada em ${usos} blocos.`;
  let complemento;
  if (total <= usos) {
    complemento = usos === 1 ? 'Esse bloco também será apagado.' : 'Esses blocos também serão apagados.';
  } else {
    const quais = usos === 1 ? 'esse bloco e os que estão encaixados nele' : 'esses blocos e os que estão encaixados neles';
    complemento = `Ao apagar, ${total} blocos serão removidos: ${quais}.`;
  }
  return { titulo: `Apagar a variável ${nome}?`, mensagem: `${usada} ${complemento}`, confirmar: 'Apagar', cancelar: 'Cancelar' };
}
