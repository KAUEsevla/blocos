// Painel Saída (RF-01; contracts/painel-saida.md). Interface, fora da cobertura.
// A 001 usa limpar e mostrarOrientacao. A spec 009 (contracts/tela-execucao.md) acrescenta
// escreverVarias (lotes de linhas), escreverDetalhe ("Detalhes técnicos") e mostrarAvisos
// (bloqueio por blocos incompletos). escrever e areaAvisos ficam também para a 010.
import { TEXTOS } from './textos.js';
import { renderizarAvisos } from './avisos-ui.js';
import { MENSAGENS_EXECUCAO } from '../execucao/mensagens.js';

const TIPOS = new Set(['programa', 'sistema', 'erro']);

export function criarPainelSaida(elemento) {
  const areaLinhas = document.createElement('div');
  areaLinhas.className = 'saida-linhas';
  areaLinhas.setAttribute('role', 'log');
  areaLinhas.setAttribute('aria-live', 'polite');

  const areaAvisos = document.createElement('div');
  areaAvisos.className = 'saida-avisos';

  // Substitui o conteúdo: chamar de novo sobre o mesmo elemento não duplica as regiões.
  elemento.replaceChildren(areaLinhas, areaAvisos);

  function rolarAteOFim() {
    elemento.scrollTop = elemento.scrollHeight;
  }

  function criarLinha(texto, tipo) {
    const tipoValido = TIPOS.has(tipo) ? tipo : 'programa';
    const linha = document.createElement('div');
    linha.className = `saida-linha saida-linha--${tipoValido}`;
    linha.textContent = String(texto);
    return linha;
  }

  function limpar() {
    areaLinhas.replaceChildren();
    areaAvisos.replaceChildren();
  }

  function escrever(texto, tipo = 'programa') {
    areaLinhas.append(criarLinha(texto, tipo));
    rolarAteOFim();
  }

  // Um lote inteiro de uma vez, com uma única rolagem (research R-13).
  function escreverVarias(linhas, tipo = 'programa') {
    const fragmento = document.createDocumentFragment();
    for (const texto of linhas) fragmento.append(criarLinha(texto, tipo));
    areaLinhas.append(fragmento);
    rolarAteOFim();
  }

  // Rastro técnico, fechado por padrão (cenário 3 da História 2).
  function escreverDetalhe(texto) {
    const detalhes = document.createElement('details');
    detalhes.className = 'saida-detalhe';
    const resumo = document.createElement('summary');
    resumo.textContent = MENSAGENS_EXECUCAO.detalhesTecnicos;
    const pre = document.createElement('pre');
    pre.textContent = String(texto);
    detalhes.append(resumo, pre);
    areaLinhas.append(detalhes);
    rolarAteOFim();
  }

  function mostrarAvisos(avisos, aoClicar) {
    renderizarAvisos(areaAvisos, avisos, aoClicar);
  }

  function mostrarOrientacao() {
    limpar();
    escrever(TEXTOS.orientacaoSaida, 'sistema');
  }

  return { limpar, mostrarOrientacao, escrever, escreverVarias, escreverDetalhe, mostrarAvisos, areaAvisos };
}
