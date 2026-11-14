// Painel Portugol: somente leitura, com "Copiar código" (RF-01, RNF-03; spec 001, FR-004;
// research R-06). Interface, fora da cobertura.
import { TEXTOS } from './textos.js';

const DURACAO_MENSAGEM_MS = 3000;
let temporizador = null;

export function mostrarCodigo(pre, codigo) {
  pre.textContent = codigo;
}

function copiarPorSelecao(pre) {
  const selecao = window.getSelection();
  const intervalo = document.createRange();
  intervalo.selectNodeContents(pre);
  selecao.removeAllRanges();
  selecao.addRange(intervalo);
  try {
    return document.execCommand('copy');
  } catch {
    return false;
  }
}

async function copiar(codigo, pre) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(codigo);
      return true;
    } catch {
      // Sem permissão ou contexto não seguro: tenta o plano B.
    }
  }
  return copiarPorSelecao(pre);
}

// Copia o código recebido (o resultado.codigo, com a quebra de linha final), não o textContent.
export async function copiarCodigo(codigo, { pre, mensagem }) {
  const copiou = await copiar(codigo, pre);
  mensagem.textContent = copiou ? TEXTOS.copiaOk : TEXTOS.copiaFalhou;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => {
    mensagem.textContent = '';
  }, DURACAO_MENSAGEM_MS);
  return copiou;
}
